import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import createClient, { WeaviateClient } from 'weaviate-ts-client';

@Injectable()
export class WeaviateService implements OnModuleInit {
  private client: WeaviateClient;
  private readonly logger = new Logger(WeaviateService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const scheme = this.configService.get<string>('WEAVIATE_SCHEME', 'http');
    const host = this.configService.get<string>('WEAVIATE_HOST', 'localhost:8080');

    this.client = createClient.client({
      scheme: scheme,
      host: host,
      // Add API key configuration if needed, e.g., using configService.get('WEAVIATE_API_KEY')
    });
  }

  getClient(): WeaviateClient {
    return this.client;
  }

  async createLegalDocumentSchema(): Promise<void> {
    try {
      // Check if schema already exists
      const schemaRes = await this.client.schema.getter().do();
      const schemaExists = schemaRes.classes?.some(c => c.class === 'LegalDocument');

      if (!schemaExists) {
        this.logger.log('Creating LegalDocument schema in Weaviate');
        await this.client.schema.classCreator()
          .withClass({
            class: 'LegalDocument',
            description: 'A legal document with embeddings for search',
            vectorizer: 'none', // We're providing our own vectors
            properties: [
              {
                name: 'title',
                dataType: ['string'],
                description: 'Title of the document',
              },
              {
                name: 'content',
                dataType: ['text'],
                description: 'Content of the document',
              },
              {
                name: 'sourceFile',
                dataType: ['string'],
                description: 'Source filename',
              },
              {
                name: 'pageNumber',
                dataType: ['number'],
                description: 'Page number for chunked documents',
              }
            ]
          })
          .do();
        this.logger.log('Schema created successfully');
      } else {
        this.logger.log('LegalDocument schema already exists');
      }
    } catch (error) {
      this.logger.error('Error creating schema:', error);
      throw error;
    }
  }

  async storeDocument(data: {
    title: string,
    content: string,
    sourceFile: string,
    embedding: number[],
    pageNumber?: number
  }): Promise<any> {
    try {
      return this.client.data
        .creator()
        .withClassName('LegalDocument')
        .withProperties({
          title: data.title,
          content: data.content,
          sourceFile: data.sourceFile,
          pageNumber: data.pageNumber || 0
        })
        .withVector(data.embedding)
        .do();
    } catch (error) {
      this.logger.error(`Error storing document ${data.title}:`, error);
      throw error;
    }
  }

  async deleteLegalDocumentSchema(): Promise<void> {
    try {
      this.logger.warn('Deleting LegalDocument schema and all its data...');
      await this.client.schema.classDeleter().withClassName('LegalDocument').do();
      this.logger.log('Schema deleted successfully.');
    } catch (error) {
      this.logger.error('Error deleting schema:', error);
      throw error;
    }
  }

  async semanticSearch(query: string, queryEmbedding: number[], limit: number = 5): Promise<any> {
    try {
      return this.client.graphql
        .get()
        .withClassName('LegalDocument')
        .withFields('title content sourceFile pageNumber _additional { distance }')
        .withNearVector({ vector: queryEmbedding })
        .withLimit(limit)
        .do();
    } catch (error) {
      this.logger.error(`Error during semantic search for query "${query}":`, error);
      throw error;
    }
  }
}
