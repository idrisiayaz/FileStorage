import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { USER_MODEL, User } from './user.schema';

@Schema()
export class Form {
  @Prop({ type: Types.ObjectId, ref: USER_MODEL, required: true })
  userId: Types.ObjectId | User;

  @Prop()
  originalname: string;

  @Prop()
  encoding: string;

  @Prop()
  mimetype: string;

  @Prop()
  documentType?: string;

  @Prop()
  buffer: Buffer;

  @Prop()
  size: Number;
}

export type FormDocument = Form & Document;

export const FORM_MODEL = Form.name;

export const FormSchema = SchemaFactory.createForClass(Form);
