import { Injectable } from '@nestjs/common';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Session = {
  messages: Message[];
};

@Injectable()
export class GenerateService {
  private readonly sessions = new Map<string, Session>();

  private readonly maxMessages = 6;

  getSession(sessionId: string): Session {
    const session = this.sessions.get(sessionId);

    if (!session) {
      const newSession: Session = { messages: [] };
      this.sessions.set(sessionId, newSession);
      return newSession;
    }

    return session;
  }

  addMessage(sessionId: string, message: Message): void {
    const session = this.getSession(sessionId);

    session.messages.push(message);

    if (session.messages.length > this.maxMessages) {
      session.messages = session.messages.slice(-this.maxMessages);
    }
  }

  buildContext(sessionId: string): string {
    const session = this.getSession(sessionId);

    if (session.messages.length === 0) {
      return '';
    }

    return session.messages.map((m) => `${m.role}: ${m.content}`).join('\n');
  }

  clear(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}
