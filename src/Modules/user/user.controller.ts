import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDTO } from './dto/create-user.dto';
import { AccountLoginDTO } from './dto/login-user.dto';
import { Request, Response, response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { FormService } from './form.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly formService: FormService,
  ) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get('profile')
  getUser(@Req() request: Request) {
    const accessToken = request.headers.authorization.replace('Bearer ', '');
    return this.userService.getUser(accessToken);
  }

  @Post('register')
  createUser(@Body() createUserDto: CreateUserDTO) {
    return this.userService.createUser(createUserDto);
  }

  @Post('login')
  login(
    @Body() accountLoginDto: AccountLoginDTO,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.userService.login(accountLoginDto, response);
  }

  @Post('refresh')
  refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies['refresh_token'];

    return this.userService.refresh(refreshToken, response);
  }

  @Post('logout')
  logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.userService.logout(request, response);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() request: Request,
    @Res({passthrough: true}) response: Response,
  ) {
    return this.formService.upload(file, request);
  }

  @Get('documents')
  getDocument(@Req() request: Request,
  @Res({passthrough: true}) response: Response) {
    return this.formService.getDocuments(request);
  }

  @Get('download')
  download(@Query('id') id:string) {
    return this.formService.download(id);
  }
}
