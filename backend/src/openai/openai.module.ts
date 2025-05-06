import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAIService } from './openai.service';

@Module({
  imports: [ConfigModule], // Import ConfigModule to make ConfigService available
  providers: [OpenAIService],
  exports: [OpenAIService], // Export OpenAIService to make it available in other modules
})
export class OpenAIModule {}
