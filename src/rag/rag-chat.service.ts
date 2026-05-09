import { Injectable } from '@nestjs/common';
import { RagChatRequest, RagChatResponse } from './dto/chat.dto';
import { RagSearchService } from './rag-search.service';
import { RagSearchResponse } from './dto/search.dto';
import { RagService } from './rag.service';
import { RAG_CONFIG } from './rag-config';

@Injectable()
export class RagChatService {
  public constructor(
    private readonly ragSearchService: RagSearchService,
    private readonly ragService: RagService,
  ) {}

  public async chat(request: RagChatRequest): Promise<RagChatResponse> {
    const searchResults = await this.ragSearchService.search({
      query: request.question,
      limit: RAG_CONFIG.SEARCH_LIMIT,
    });

    const context = this.buildContext(searchResults.results);

    const prompt = this.buildPrompt({
      question: request.question,
      context,
    });

    const answer = await this.ragService.generateText(prompt);

    const uniqueSources = new Map();

    for (const r of searchResults.results) {
      if (!uniqueSources.has(r.articleId)) {
        uniqueSources.set(r.articleId, {
          articleId: r.articleId,
          articleTitle: r.articleTitle,
          relevantChunk: r.chunk,
        });
      }
    }

    return {
      answer,
      conversationId: request.conversationId ?? crypto.randomUUID(), // new conversation ID if not provided
      sources: Array.from(uniqueSources.values()),
    };
  }

  public buildPrompt(input: { question: string; context: string }): string {
    return `
You are a Knowledge Hub AI assistant.

Answer ONLY using the provided context.

If the answer is not present, say it is unavailable.

Context:
${input.context}

Question:
${input.question}
`;
  }

  private buildContext(results: RagSearchResponse['results']): string {
    return results
      .slice(0, RAG_CONFIG.CONTEXT_LIMIT)
      .map(
        (r, index) => `
[Source ${index + 1}]
Article: ${r.articleTitle}
Content:
${r.chunk}
`,
      )
      .join('\n');
  }
}
