import { Injectable } from '@nestjs/common';
import { RagChatRequest, RagChatResponse } from './dto/chat.dto';
import { RagSearchService } from './rag-search.service';
import { RagSearchResponse } from './dto/search.dto';
import { RagService } from './rag.service';
import { RAG_CONFIG } from './rag-config';

const MAX_HISTORY_MESSAGES = Number(process.env.MAX_HISTORY_MESSAGES ?? 10);

@Injectable()
export class RagChatService {
  private readonly memory = new Map<string, string[]>();

  public constructor(
    private readonly ragSearchService: RagSearchService,
    private readonly ragService: RagService,
  ) {}

  public async chat(request: RagChatRequest): Promise<RagChatResponse> {
    const conversationId = request.conversationId ?? crypto.randomUUID();
    const memory = this.getMemory(conversationId);
    const searchQuery = `${memory}\nUser: ${request.question}`;
    const searchResults = await this.ragSearchService.search({
      query: searchQuery,
      limit: RAG_CONFIG.SEARCH_LIMIT,
    });

    const context = this.buildContext(searchResults.results);
    const prompt = this.buildPrompt({
      question: request.question,
      context,
      memory,
    });
    const answer = await this.ragService.generateText(prompt);
    this.addToMemory(conversationId, `User: ${request.question}`);
    this.addToMemory(conversationId, `Assistant: ${answer}`);
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
      conversationId,
      sources: Array.from(uniqueSources.values()),
    };
  }

  public buildPrompt(input: {
    question: string;
    context: string;
    memory: string;
  }): string {
    return `
You are a Knowledge Hub AI assistant.

Answer ONLY using the provided context.

If the answer is not present, say it is unavailable.

Conversation history:
${input.memory}

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

  private addToMemory(conversationId: string, message: string): void {
    const history = this.memory.get(conversationId) ?? [];

    history.push(message);
    if (history.length > MAX_HISTORY_MESSAGES) {
      history.shift();
    }

    this.memory.set(conversationId, history);
  }

  private getMemory(conversationId: string): string {
    const history = this.memory.get(conversationId) ?? [];

    return history.slice(-MAX_HISTORY_MESSAGES).join('\n');
  }
}
