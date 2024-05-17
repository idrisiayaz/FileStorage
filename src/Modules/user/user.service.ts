import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { USER_MODEL, UserDocument } from 'src/schema/user.schema';
import { CreateUserDTO } from './dto/create-user.dto';
import { AccountLoginDTO } from './dto/login-user.dto';
import { compare } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { TOKEN_MODEL, TokenDocument } from 'src/schema/token.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(USER_MODEL) private readonly userModel: Model<UserDocument>,
    @InjectModel(TOKEN_MODEL) private readonly tokenModel: Model<TokenDocument>,
    private jwtService: JwtService,
  ) {}

  async findAll() {
    const userList = await this.userModel.find();

    return userList;
  }

  async getUser(accessToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(accessToken);

      const user = await this.userModel.findById(payload.id);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  async createUser(createUserDto: CreateUserDTO) {
    const createdUser = await this.userModel.create(createUserDto);

    return {
      success: 'User created successfully!',
      createdUser,
    };
  }

  async login(accountLoginDto: AccountLoginDTO, response: Response) {
    const { email, password } = accountLoginDto;

    const user = await this.userModel.findOne({ email }, '+password');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('invalid credentials');
    }

    const accessToken = await this.jwtService.signAsync(
      {
        id: user.id,
      },
      { expiresIn: '60s' },
    );

    const refreshToken = await this.jwtService.signAsync({
      id: user.id,
    });

    const expired_at = new Date();
    expired_at.setDate(expired_at.getDate() + 7); //expires in 1 week

    await this.tokenModel.create({
      user_id: user.id,
      token: refreshToken,
      expired_at: expired_at,
    });

    response.status(200);
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, //1 week
    });

    return {
      token: accessToken,
    };
  }

  async refresh(refreshToken: string, response: Response) {
    try {
      const { id } = await this.jwtService.verifyAsync(refreshToken);

      const tokenAvailability = await this.tokenModel.findOne({
        user_id: id,
        expired_at: { $gte: new Date() },
      });

      if (!tokenAvailability) {
        throw new UnauthorizedException();
      }

      const generatedAccessToken = await this.jwtService.signAsync(
        { id },
        {
          expiresIn: '60s',
        },
        
      );

      response.status(200);

      return {
        generatedAccessToken,
      };
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException();
    }
  }

  async logout(request: Request, response: Response) {
    const refreshToken = request.cookies['refresh_token'];

    await this.tokenModel.deleteOne({ token: refreshToken });

    response.clearCookie('refresh_token');

    return {
      message: 'Logout Success',
    };
  }
}
