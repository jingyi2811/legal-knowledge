import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  FileTypeValidator,
  Logger,
  OnModuleInit,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OpenAIService } from '../openai/openai.service';
import { WeaviateService } from '../weaviate/weaviate.service';
import { CreateEmbeddingDto } from './dto/create-embedding.dto';
import * as pdfParse from 'pdf-parse';
import * as fs from 'fs';
import * as path from 'path';

@Controller('embedding')
export class EmbeddingController implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingController.name);

  constructor(
    private readonly openaiService: OpenAIService,
    private readonly weaviateService: WeaviateService
  ) {}

  async onModuleInit() {
    // Ensure Weaviate schema is created when the application starts
    await this.weaviateService.createLegalDocumentSchema();
  }

  @Post()
  async createEmbedding(@Body() createEmbeddingDto: CreateEmbeddingDto): Promise<{ embedding: number[] }> {
    const embedding = await this.openaiService.generateEmbedding(createEmbeddingDto.text);
    return { embedding };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) // 'file' is the field name in the form-data
  async uploadPdf(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'application/pdf' })],
      }),
    )
    file: Express.Multer.File,
  ): Promise<any> {
    try {
      // Parse the PDF buffer
      const data = await pdfParse(file.buffer);
      //
      // Use a temporary filename for uploaded files
      const filename = `uploaded_${new Date().getTime()}.pdf`;

      // Break text into chunks for better semantic search
      const chunks = this.chunkText(data.text, 3000);
      this.logger.log(`Split document into ${chunks.length} chunks`);

      // Generate embedding for full text (for backward compatibility)
      const fullEmbedding = await this.openaiService.generateEmbedding(data.text);

      // Store each chunk with its own embedding
      for (let i = 0; i < chunks.length; i++) {
        const chunkEmbedding = await this.openaiService.generateEmbedding(chunks[i]);

        await this.weaviateService.storeDocument({
          title: filename,
          content: chunks[i],
          sourceFile: filename,
          embedding: chunkEmbedding,
          pageNumber: i + 1
        });
      }

      return {
        embedding: fullEmbedding,
        text: data.text.substring(0, 500) + '...', // Return truncated text for preview
        pages: data.numpages,
        chunks: chunks.length
      };
    } catch (error) {
      this.logger.error('Error processing uploaded PDF:', error);
      throw error;
    }
  }

  /**
   * Process a PDF file from a specific file path, chunk it, and store in Weaviate
   */
  async processPdfFile(filePath: string): Promise<{ embedding: number[]; text: string; pages: number; chunks: number }> {
    try {
      // Read the file from the file system
      const fileBuffer = fs.readFileSync(filePath);

      // Parse the PDF buffer
      const data = await pdfParse(fileBuffer);

      // Break text into chunks for better semantic search
      const chunks = this.chunkText(data.text, 3000);
      this.logger.log(`Split document into ${chunks.length} chunks`);

      // Generate embedding for full text (for backward compatibility)
      const fullEmbedding = await this.openaiService.generateEmbedding(data.text);

      // Store each chunk with its own embedding
      for (let i = 0; i < chunks.length; i++) {
        const chunkEmbedding = await this.openaiService.generateEmbedding(chunks[i]);

        await this.weaviateService.storeDocument({
          title: path.basename(filePath, '.pdf'),
          content: chunks[i],
          sourceFile: filePath,
          embedding: chunkEmbedding,
          pageNumber: i + 1
        });
      }

      return {
        embedding: fullEmbedding,
        text: data.text.substring(0, 500) + '...', // Return truncated text for preview
        pages: data.numpages,
        chunks: chunks.length
      };
    } catch (error) {
      this.logger.error(`Error processing file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Helper method to split text into chunks of approximately chunkSize characters
   * Tries to split at paragraph or sentence boundaries when possible
   */
  private chunkText(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];

    // First split by double newlines (paragraphs)
    const paragraphs = text.split(/\n\s*\n/);

    let currentChunk = '';

    for (const paragraph of paragraphs) {
      // If adding this paragraph would exceed chunk size, start a new chunk
      if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      // If a single paragraph is longer than chunk size, split it by sentences
      if (paragraph.length > chunkSize) {
        const sentences = paragraph.split(/(?<=[.!?])\s+/);

        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
          }

          // If even a single sentence is too long, just split it at chunk size
          if (sentence.length > chunkSize) {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
              currentChunk = '';
            }

            for (let i = 0; i < sentence.length; i += chunkSize) {
              chunks.push(sentence.substring(i, i + chunkSize).trim());
            }
          } else {
            currentChunk += ' ' + sentence;
          }
        }
      } else {
        currentChunk += ' ' + paragraph;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  @Post('from-folder')
  async processPdfFromFolder(@Body() body: { filePath: string }): Promise<{ embedding: number[]; text: string; pages: number }> {
    return this.processPdfFile(body.filePath);
  }

  @Post('process-directory')
  async processDirectory(@Body() body: { directoryPath: string }): Promise<Array<{ filename: string; embedding: number[]; text: string; pages: number; chunks: number }>> {
    const directory = body.directoryPath;
    const files = fs.readdirSync(directory).filter(file => path.extname(file).toLowerCase() === '.pdf');

    const results = [];
    for (const file of files) {
      const filePath = path.join(directory, file);
      const result = await this.processPdfFile(filePath);
      results.push({
        filename: file,
        ...result
      });
    }

    return results;
  }

  @Delete('reset')
  async deleteSchema() {
    await this.weaviateService.deleteLegalDocumentSchema();
    return { message: 'LegalDocument schema and all data deleted.' };
  }
}
