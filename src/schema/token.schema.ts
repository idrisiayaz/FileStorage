import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Token {
  @Prop()
  user_id: string;

  @Prop()
  token: string;

  @Prop({ type: Date, default: Date.now })
  created_at: Date;

  @Prop({ type: Date, expires: '1d' }) // Expires token after 1 day
  expired_at: Date;
}

export type TokenDocument = Token & Document;

export const TOKEN_MODEL = Token.name;

export const TokenSchema = SchemaFactory.createForClass(Token);
