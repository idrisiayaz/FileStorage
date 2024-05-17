import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infra/mongoose/database.module';
import { MongooseModelsModule } from './schema/schemas.module';
import { UserModule } from './Modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    MongooseModelsModule,
    UserModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
