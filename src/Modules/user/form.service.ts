import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Request, Response } from 'express';
import { Model } from 'mongoose';
import { FORM_MODEL, FormDocument } from 'src/schema/form.schema';
import { USER_MODEL, UserDocument } from 'src/schema/user.schema';
import {
  SHARE_DOC_MODEL,
  shareDocument,
} from 'src/schema/share-document.schema';

@Injectable()
export class FormService {
  constructor(
    @InjectModel(FORM_MODEL) private readonly formModel: Model<FormDocument>,
    @InjectModel(USER_MODEL) private readonly userModel: Model<UserDocument>,
    @InjectModel(SHARE_DOC_MODEL)
    private readonly shareDocModal: Model<shareDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async getDocuments(request: Request) {
    try {
      const accessToken = request.headers.authorization.replace('Bearer ', '');

      const refreshToken = request.cookies['refresh_token'];

      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token not found');
      }

      const { id } = await this.jwtService.verifyAsync(refreshToken);

      const documents = await this.formModel.find({ userId: id });

      const documentList = documents.map((document) => {
        return {
          document_id: document._id,
          document_name: document.originalname,
          document_type: document.documentType,
          document_size: document.size,
        };
      });

      return documentList;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async deleteDocument(id: string) {
    try {
      if (!id) {
        throw new NotFoundException('ID not found');
      }

      const document = await this.formModel.findById(id);

      if (!document) {
        throw new NotFoundException('Document not found');
      }

      await this.formModel.findByIdAndDelete(id);

      return {
        message: 'Document deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; // Re-throw NotFoundException
      }
      throw new UnauthorizedException(); // Throw UnauthorizedException for other errors
    }
  }

  async upload(file: Express.Multer.File, request: Request) {
    try {
      const refreshToken = request.cookies['refresh_token'];

      // Check if the refresh token exists
      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token not found');
      }

      const { id } = await this.jwtService.verifyAsync(refreshToken);

      // Check if a document with the same name already exists
      const duplicateDocument = await this.formModel.findOne({
        userId: id,
        originalname: file.originalname,
      });

      if (duplicateDocument) {
        console.log('duplicate doc found!');
        throw new ConflictException('Document already exists');
      }

      const documentType = getDocumentType(file.originalname);

      console.log(file);

      await this.formModel.create({
        userId: id,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        documentType: documentType,
        buffer: file.buffer,
        size: file.size,
      });

      return {
        message: 'File uploaded successfully',
      };
    } catch (error) {
      // Handle specific errors and rethrow them to be properly caught by the framework
      if (error instanceof ConflictException) {
        throw error;
      }
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
      // Log any other errors and throw a generic error message
      console.log(error);
      throw new Error('An error occurred during file upload');
    }
  }

  async download(id: string, response: Response) {
    try {
      const file = await this.formModel.findById(id);

      if (!file) {
        throw new NotFoundException('File not found');
      }

      response.setHeader('Content-Type', file.mimetype);
      response.setHeader(
        'Content-disposition',
        `attachment;filename=${file.originalname}`,
      );

      // Send the file buffer as the response
      response.send(file.buffer);
    } catch (error) {
      console.log(error);
      throw new ConflictException('An error occurred during file download');
    }
  }

  async shareDocument(body, request: Request) {
    try {
      //Authenticate user/query initiator
      const refreshToken = request.cookies['refresh_token'];
      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token not found');
      }

      const { id } = await this.jwtService.verifyAsync(refreshToken);
      const userSender = await this.userModel.findById(id);
      if (!userSender) {
        throw new UnauthorizedException('Sender not found');
      }

      const { email, documentId } = body;

      if (userSender.email === email) {
        throw new ConflictException('Cannot share document with self');
      }

      //check receiver exist or not (to whom we are sending document)
      const userReceiver = await this.userModel.findOne({ email });
      if (!userReceiver) {
        throw new NotFoundException('Receiver email not found');
      }

      //check if document exist or not
      const document = await this.formModel.findById(documentId);
      if (!document) {
        throw new NotFoundException('Document not found');
      }

      //check if duplicate document
      const sharedDoc = await this.shareDocModal.findOne({
        shared_by: userSender.email,
        shared_to: email,
        document_id: documentId,
      });
      if (sharedDoc) {
        throw new ConflictException(
          `Document already shared to ${sharedDoc.shared_to}`,
        );
      }

      await this.shareDocModal.create({
        shared_by: userSender.email,
        shared_to: userReceiver.email,
        document_id: document.id,
      });

      return {
        message: `Document shared to ${email}`,
      };
    } catch (error) {
      console.log(error);
      if (error instanceof NotFoundException) {
        throw error; // Re-throw NotFoundException
      }
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof ConflictException) {
        throw error;
      }

      throw new ConflictException('An error occurred while sharing document');
    }
  }

  async getSharedDocument(request: Request) {
    try {
      const accessToken = request.headers.authorization.replace('Bearer ', '');

      const refreshToken = request.cookies['refresh_token'];

      const { id } = await this.jwtService.verifyAsync(refreshToken);

      const user = await this.userModel.findById(id);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const sharedDocuments = await this.shareDocModal
        .find({
          shared_to: user.email,
        })
        .populate({
          path: 'document_id',
          select: 'originalname documentType size -_id',
        })
        .exec();

      return sharedDocuments;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}

function getDocumentType(originalname: string) {
  const extensionsMap = {
    xlsx: 'xlsx',
    xls: 'xlsx',
    pdf: 'pdf',
    csv: 'csv',
    doc: 'doc/docx',
    docx: 'doc/docx',
    ppt: 'ppt/pptx',
    pptx: 'ppt/pptx',
    txt: 'txt',
    html: 'html',
    xml: 'xml',
    json: 'json',
    jpeg: 'jpeg/jpg',
    jpg: 'jpeg/jpg',
    png: 'png',
    gif: 'gif',
    mp3: 'mp3',
    wav: 'wav',
    mp4: 'mp4',
  };

  const fileExtension = originalname.split('.').pop();
  return extensionsMap[fileExtension] || 'unknown';
}
