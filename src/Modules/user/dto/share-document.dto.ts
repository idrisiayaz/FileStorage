import { IsString, IsNotEmpty } from 'class-validator';

export class shareDocumentDTO {
  @IsString()
  @IsNotEmpty()
  shared_by: string;

  @IsString()
  @IsNotEmpty()
  shared_to: string;

  @IsString()
  @IsNotEmpty()
  documentId: string;
}