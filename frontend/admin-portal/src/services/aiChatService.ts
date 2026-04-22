/**
 * aiChatService.ts
 *
 * API service for the Finova AI Chatbot.
 * All requests go through the Node.js backend proxy at /api/chat/ai,
 * which handles JWT authentication and forwards to the Python AI service.
 */
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export interface AiChatResponse {
  response: string;
  session_id: string;
}

export const aiChatService = {
  /**
   * Send a message to the Finova AI assistant.
   * @param message - The user's message text
   * @param sessionId - Optional session ID (defaults to user ID on the server side)
   */
  async sendMessage(message: string, sessionId?: string): Promise<AiChatResponse> {
    const response = await axios.post<AiChatResponse>(
      `${API_URL}/chat/ai`,
      { message, session_id: sessionId },
    );
    return response.data;
  },

  /**
   * Clear conversation history for a session.
   * @param sessionId - The session to clear
   */
  async clearSession(sessionId: string): Promise<void> {
    await axios.delete(`${API_URL}/chat/ai/session/${sessionId}`);
  },
};
