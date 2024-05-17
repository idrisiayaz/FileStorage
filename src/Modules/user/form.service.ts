import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Request } from 'express';
import { Model } from 'mongoose';
import { FORM_MODEL, FormDocument } from 'src/schema/form.schema';
import { TOKEN_MODEL, TokenDocument } from 'src/schema/token.schema';

@Injectable()
export class FormService {
  constructor(
    @InjectModel(FORM_MODEL) private readonly formModel: Model<FormDocument>,
    @InjectModel(TOKEN_MODEL) private readonly tokenModel: Model<TokenDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async getDocuments(request: Request) {
    try {
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
          document_type: document.mimetype,
          document_size: document.size,
        };
      });

      return documentList;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async upload(file: Express.Multer.File, request: Request) {
    try {
      const refreshToken = request.cookies['refresh_token'];

      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token not found');
      }

      const { id } = await this.jwtService.verifyAsync(refreshToken);

      await this.formModel.create({
        userId: id,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        buffer: file.buffer,
        size: file.size,
      });

      return {
        message: 'File uploaded successfully',
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async download(id: string) {
    const file = await this.formModel.findById(id);

    if(!file) {
        throw new NotFoundException('file not found')
    }

    return {
        document_name: file.originalname,
        fileBuffer: file.buffer
    };
  }
}
