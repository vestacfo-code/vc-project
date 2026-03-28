/**
 * Natural language chat interface for hotel financial queries.
 * Phase 7 will implement streaming LLM responses with tool use.
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  hotelId: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// TODO (Phase 7): sendMessage(sessionId, userMessage, hotelId) → AsyncGenerator<string>
// TODO (Phase 7): createChatSession(hotelId, userId) → ChatSession
