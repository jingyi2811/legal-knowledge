import { Body, Controller, Post, Logger } from '@nestjs/common';
import { OpenAIService } from '../openai/openai.service';
import { WeaviateService } from '../weaviate/weaviate.service';

@Controller('query')
export class QueryController {
  private readonly logger = new Logger(QueryController.name);

  constructor(
    private readonly openaiService: OpenAIService,
    private readonly weaviateService: WeaviateService
  ) {}

  @Post()
  async query(@Body() body: { query: string }): Promise<any> {
    try {
      this.logger.log(`Processing query: ${body.query}`);

      // Generate embedding for the query
      const queryEmbedding = await this.openaiService.generateEmbedding(body.query);

      // Retrieve relevant documents
      const searchResults = await this.weaviateService.semanticSearch(
        body.query,
        queryEmbedding,
        1 // Get top 1 relevant chunk to reduce context length
      );

      // Extract relevant content
      const relevantDocs = searchResults.data.Get.LegalDocument.map(doc => ({
        content: doc.content,
        title: doc.title,
        sourceFile: doc.sourceFile,
        pageNumber: doc.pageNumber,
        distance: doc._additional.distance
      }));

      this.logger.log(`Found ${relevantDocs.length} relevant documents`);

      const context = relevantDocs.map(doc => doc.content).join('\n\n');

      const maxChars = 24000;
      const trimmedContext = context.length > maxChars ? context.slice(0, maxChars) : context;

      const response = await this.openaiService.generateAnswer({
        query: body.query,
        context: trimmedContext,
        documents: relevantDocs
      });

      return {
        answer: response,
        sources: relevantDocs
      };
    } catch (error) {
      this.logger.error(`Error processing query: ${body.query}`, error);
      throw error;
    }
  }
}
