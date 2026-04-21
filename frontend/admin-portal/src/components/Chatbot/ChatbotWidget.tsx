import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2, Trash2 } from 'lucide-react';
import { aiChatService } from '@/services/aiChatService';
import { useAuth } from '@/context/AuthContext';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
}

const WELCOME_MESSAGE =
  "Hello! I'm **Finova AI**, your financial assistant. You can ask me about:\n- 📊 Financial summaries & P&L\n- 💼 Payroll data & pending approvals\n- 📈 KPIs, attendance & branch insights";

/**
 * Renders markdown-like text with basic bold (**text**) and newlines.
 */
const BotMessage: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span className="whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i}>{part.slice(2, -2)}</strong>
          : <React.Fragment key={i}>{part}</React.Fragment>
      )}
    </span>
  );
};

const ChatbotWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', sender: 'bot', text: WELCOME_MESSAGE }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue.trim(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Routes through Node.js /api/chat/ai — JWT is attached by axios interceptor in AuthContext
      const data = await aiChatService.sendMessage(userMsg.text, user?._id);
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: 'bot', text: data.response },
      ]);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const errorText =
        axiosError?.response?.data?.message ??
        'Sorry, I encountered an error. Please try again.';
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: 'bot', text: errorText },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSession = async () => {
    const sessionId = user?._id;
    if (!sessionId) return;
    try {
      await aiChatService.clearSession(sessionId);
    } catch {
      // Best-effort — reset UI even if server call fails
    }
    setMessages([{ id: '0', sender: 'bot', text: WELCOME_MESSAGE }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-[380px] h-[560px] mb-4 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center rounded-t-2xl">
              <div className="flex items-center space-x-2">
                <Bot size={22} />
                <div>
                  <h3 className="font-semibold text-base leading-tight">Finova AI</h3>
                  <p className="text-indigo-200 text-xs">Financial Assistant</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleClearSession}
                  title="Clear conversation"
                  className="text-indigo-200 hover:text-white transition-colors p-1 rounded"
                  aria-label="Clear conversation"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-indigo-200 hover:text-white transition-colors p-1 rounded"
                  aria-label="Close Chat"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[88%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div
                      className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center ${
                        msg.sender === 'user'
                          ? 'bg-indigo-100 ml-2'
                          : 'bg-white border border-gray-200 mr-2'
                      }`}
                    >
                      {msg.sender === 'user'
                        ? <User size={14} className="text-indigo-600" />
                        : <Bot size={14} className="text-indigo-600" />
                      }
                    </div>
                    <div
                      className={`p-3 rounded-2xl text-sm ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-sm'
                      }`}
                    >
                      {msg.sender === 'bot'
                        ? <BotMessage text={msg.text} />
                        : msg.text
                      }
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex max-w-[88%] flex-row">
                    <div className="flex-shrink-0 h-7 w-7 rounded-full bg-white border border-gray-200 mr-2 flex items-center justify-center">
                      <Bot size={14} className="text-indigo-600" />
                    </div>
                    <div className="p-3 bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                      <Loader2 size={14} className="animate-spin text-indigo-600" />
                      <span className="text-sm text-gray-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-gray-100">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about payroll, finances, KPIs..."
                  className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all text-gray-800 placeholder-gray-400"
                  disabled={isLoading}
                  aria-label="Chat input"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:bg-indigo-700 transition-colors flex items-center justify-center h-14 w-14"
          aria-label="Open AI Chat"
        >
          <MessageSquare size={22} />
        </motion.button>
      )}
    </div>
  );
};

export default ChatbotWidget;
