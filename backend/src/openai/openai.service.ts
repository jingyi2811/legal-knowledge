import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService implements OnModuleInit {
  private openai: OpenAI;
  private readonly logger = new Logger(OpenAIService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured in environment variables.');
    }
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const embedding = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return embedding.data[0].embedding;
  }

  async generateAnswer({ query, context, documents }): Promise<string> {
    this.logger.log(`Generating answer for query: ${query}`);
    
    const prompt = `
You are a legal expert assistant. Answer the following question based on the provided legal documents.

LEGAL CONTEXT:
${context}

QUESTION:
${query}

Provide a detailed and accurate answer based solely on the information in the provided legal context.
If the context doesn't contain enough information to answer the question, say so.
`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo', // or your preferred model
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2, // Lower temperature for more factual responses
      });

      return completion.choices[0].message.content;
    } catch (error) {
      this.logger.error('Error generating answer with OpenAI:', error);
      throw error;
    }
  }
}
