import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { hash } from 'bcryptjs';

@Schema({
  timestamps: true,
})
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;
}

export type UserDocument = User & Document;

export const USER_MODEL = User.name;

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (next: Function) {
  const hashedPassword = await hash(this.password, 10);
  this.password = hashedPassword;
  next();
});
