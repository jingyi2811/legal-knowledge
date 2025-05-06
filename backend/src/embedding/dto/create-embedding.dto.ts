// Use class-validator for potential future validation
// import { IsString, IsNotEmpty } from 'class-validator';

export class CreateEmbeddingDto {
  // @IsString()
  // @IsNotEmpty()
  text: string;
}
