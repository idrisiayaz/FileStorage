import { Global, Module } from '@nestjs/common';
import { USER_MODEL, UserSchema } from './user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { TOKEN_MODEL, TokenSchema } from './token.schema';
import { FORM_MODEL, FormSchema } from './form.schema';

const MODELS = [
  { name: USER_MODEL, schema: UserSchema },
  { name: TOKEN_MODEL, schema: TokenSchema },
  { name: FORM_MODEL, schema: FormSchema },
];

@Global()
@Module({
  imports: [MongooseModule.forFeature(MODELS)],
  exports: [MongooseModule],
})
export class MongooseModelsModule {}
