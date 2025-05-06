import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WeaviateService } from './weaviate.service';

@Module({
  imports: [ConfigModule], // Import ConfigModule to make ConfigService available
  providers: [WeaviateService],
  exports: [WeaviateService], // Export WeaviateService to make it available in other modules
})
export class WeaviateModule {}
