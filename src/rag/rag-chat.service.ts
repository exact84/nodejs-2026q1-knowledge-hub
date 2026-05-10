import { Injectable } from '@nestjs/common';
import { RagChatRequest, RagChatResponse } from './dto/chat.dto';
import { RagSearchService } from './rag-search.service';
import { RagSearchResponse } from './dto/search.dto';
import { RagService } from './rag.service';
import { RAG_CONFIG } from './rag-config';
import { RagServiceUnavailableException } from './rag-service-unavailable.exception';

const MAX_HISTORY_MESSAGES = Number(
  process.env.RAG_CONVERSATION_MAX_MESSAGES ?? 10,
);

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
    const retrievalQuery = this.buildRetrievalQuery(request.question, memory);
    const rawSearchResults = await this.ragSearchService.search({
      query: retrievalQuery,
      limit: RAG_CONFIG.CHAT_SEARCH_LIMIT,
    }, {
      useAiRerank: false,
    });
    const searchResults = this.filterChatResults(
      retrievalQuery,
      rawSearchResults.results,
    );

    const context = this.buildContext(searchResults.results);
    const prompt = this.buildPrompt({
      question: request.question,
      context,
      memory,
    });
    const answer = await this.generateAnswerWithFallback(
      prompt,
      request.question,
      searchResults.results,
    );
    this.addToMemory(conversationId, `User: ${request.question}`);
    this.addToMemory(conversationId, `Assistant: ${answer}`);
    const sources = this.buildSources(searchResults.results);

    return {
      answer,
      conversationId,
      sources,
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
      .slice(0, RAG_CONFIG.CHAT_CONTEXT_LIMIT)
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

  private buildRetrievalQuery(question: string, memory: string): string {
    const normalizedQuestion = question.trim();

    if (!this.isFollowUpQuestion(normalizedQuestion) || memory.trim().length === 0) {
      return normalizedQuestion;
    }

    const memoryHints = memory
      .split('\n')
      .filter((line) => line.startsWith('User: '))
      .slice(-RAG_CONFIG.CHAT_MEMORY_HINT_MESSAGES)
      .map((line) => line.replace(/^User:\s*/, '').trim())
      .filter((line) => line.length > 0)
      .join(' ');

    if (memoryHints.length === 0) {
      return normalizedQuestion;
    }

    return `${memoryHints} ${normalizedQuestion}`.trim();
  }

  private filterChatResults(
    retrievalQuery: string,
    results: RagSearchResponse['results'],
  ): RagSearchResponse {
    const keywords = this.extractKeywords(retrievalQuery);
    const filtered = results.filter(
      (result) => this.scoreSentence(result.chunk, keywords) > 0,
    );

    return {
      results: filtered.length > 0 ? filtered : results.slice(0, RAG_CONFIG.CHAT_CONTEXT_LIMIT),
    };
  }

  private async generateAnswerWithFallback(
    prompt: string,
    question: string,
    results: RagSearchResponse['results'],
  ): Promise<string> {
    try {
      return await this.ragService.generateText(prompt);
    } catch (error) {
      if (!(error instanceof RagServiceUnavailableException)) {
        throw error;
      }

      return this.buildFallbackAnswer(
        question,
        this.buildSources(results),
      );
    }
  }

  private buildSources(results: RagSearchResponse['results']) {
    const uniqueSources = new Map<
      string,
      {
        articleId: string;
        articleTitle: string;
        relevantChunk: string;
      }
    >();

    for (const result of results) {
      if (!uniqueSources.has(result.articleId)) {
        uniqueSources.set(result.articleId, {
          articleId: result.articleId,
          articleTitle: result.articleTitle,
          relevantChunk: result.chunk,
        });
      }
    }

    return Array.from(uniqueSources.values());
  }

  private buildFallbackAnswer(
    question: string,
    sources: Array<{
      articleId: string;
      articleTitle: string;
      relevantChunk: string;
    }>,
  ): string {
    if (sources.length === 0) {
      return 'AI generation is temporarily unavailable, and no relevant sources were found.';
    }

    const extractiveAnswer = this.buildExtractiveAnswer(question, sources);

    if (extractiveAnswer) {
      return [
        'AI generation is temporarily unavailable.',
        extractiveAnswer,
      ].join('\n\n');
    }

    const topSources = sources
      .slice(0, 3)
      .map(
        (source, index) =>
          `${index + 1}. ${source.articleTitle}: ${this.toExcerpt(source.relevantChunk)}`,
      )
      .join('\n');

    return [
      'AI generation is temporarily unavailable.',
      'Here are the most relevant retrieved sources you can use right now:',
      topSources,
    ].join('\n\n');
  }

  private buildExtractiveAnswer(
    question: string,
    sources: Array<{
      articleId: string;
      articleTitle: string;
      relevantChunk: string;
    }>,
  ): string | null {
    const questionTerms = this.extractKeywords(question);
    const candidates = sources
      .slice(0, 3)
      .flatMap((source) =>
        this.splitIntoSentences(source.relevantChunk).map((sentence) => ({
          articleTitle: source.articleTitle,
          sentence: sentence.trim(),
          score: this.scoreSentence(sentence, questionTerms),
        })),
      )
      .filter((candidate) => candidate.sentence.length > 0)
      .sort((a, b) => b.score - a.score);

    const best = candidates.filter((candidate) => candidate.score > 0).slice(0, 2);

    if (best.length === 0) {
      return null;
    }

    const answer = best
      .map((candidate) => this.toExcerpt(candidate.sentence))
      .join(' ');

    return `Based on the retrieved sources, ${this.lowercaseFirst(answer)}`;
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'a',
      'an',
      'and',
      'are',
      'as',
      'at',
      'be',
      'by',
      'for',
      'from',
      'how',
      'in',
      'is',
      'it',
      'of',
      'on',
      'or',
      'the',
      'to',
      'with',
      'works',
      'work',
      'what',
      'when',
      'where',
      'why',
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((term) => term.length > 1 && !stopWords.has(term));
  }

  private isFollowUpQuestion(question: string): boolean {
    const normalized = question.toLowerCase().trim();
    const keywords = this.extractKeywords(normalized);
    const followUpPrefixes = [
      'explain',
      'tell me more',
      'go deeper',
      'more details',
      'deeper',
      'elaborate',
      'continue',
      'what about',
      'and',
      'also',
    ];

    if (keywords.length <= 2) {
      return true;
    }

    return followUpPrefixes.some((prefix) => normalized.startsWith(prefix));
  }

  private splitIntoSentences(text: string): string[] {
    return text
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .flatMap((sentence) =>
        sentence.length > 0 ? [sentence] : [],
      );
  }

  private scoreSentence(sentence: string, questionTerms: string[]): number {
    const normalizedSentence = sentence.toLowerCase();
    let score = 0;

    for (const term of questionTerms) {
      if (normalizedSentence.includes(term)) {
        score += 1;
      }
    }

    return score;
  }

  private lowercaseFirst(text: string): string {
    if (text.length === 0) {
      return text;
    }

    return text[0].toLowerCase() + text.slice(1);
  }

  private toExcerpt(text: string): string {
    const normalized = text.replace(/\s+/g, ' ').trim();
    const maxLength = 220;

    if (normalized.length <= maxLength) {
      return normalized;
    }

    const truncated = normalized.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace <= 0) {
      return `${truncated}...`;
    }

    return `${truncated.slice(0, lastSpace)}...`;
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
