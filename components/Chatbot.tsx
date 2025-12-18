
// Import React to provide namespace for React.FC and React.FormEvent
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { X, Send, Bot, Loader2, Sparkles, RefreshCcw, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssetRecord } from '../types';

interface ChatbotProps {
  records: AssetRecord[];
  t: (key: string) => string;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

const Chatbot: React.FC<ChatbotProps> = ({ records, t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Chat
  useEffect(() => {
    if (isOpen && !chatSession) {
      initChat();
    }
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const initChat = async () => {
    try {
      // Always initialize GoogleGenAI with a named parameter object
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Prepare simplified data for context to save tokens and focus on content
      const simplifiedRecords = records.map(r => ({
        date: r.date,
        type: r.type,
        name: r.name,
        action: r.action,
        amount: r.amount,
        status: r.status,
        remarks: r.remarks
      }));

      const systemInstruction = `
        You are a helpful financial assistant for 'My Asset'.
        
        **User Data**:
        ${JSON.stringify(simplifiedRecords)}
        
        **Directives**:
        1. **Be Direct**: Answer the user's question immediately. Avoid preamble like "Here is the analysis" or "Based on the data".
        2. **Summarize**: If asked about portfolio status, start with the **Total Net Worth** (Sum of 'Active' assets).
        3. **Formatting**: 
           - Use **bold** (double asterisks) for currency values (e.g., **RM 1,200**) and key terms.
           - Use bullet points (start line with *) for lists.
           - Keep paragraphs short and readable.
        4. **Logic**: Only count 'Active' assets for totals.
        5. **Tone**: Professional, encouraging, and concise.
      `;

      // Use ai.chats.create to start a conversational session
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: systemInstruction,
        },
      });

      setChatSession(chat);
      setMessages([{
        id: 'welcome',
        role: 'model',
        text: t('chatbot_welcome')
      }]);

    } catch (error) {
      console.error("Failed to init chat:", error);
      setMessages(prev => [...prev, {
        id: 'error-init',
        role: 'model',
        text: t('chatbot_error'),
        isError: true
      }]);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !chatSession || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Use sendMessageStream for natural streaming output
      const result = await chatSession.sendMessageStream({ message: userMsg.text });
      
      const botMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: botMsgId, role: 'model', text: '' }]);

      let fullText = '';
      for await (const chunk of result) {
        // Access .text property directly from the chunk (chunk is of type GenerateContentResponse)
        const text = (chunk as GenerateContentResponse).text;
        if (text) {
          fullText += text;
          setMessages(prev => 
            prev.map(msg => msg.id === botMsgId ? { ...msg, text: fullText } : msg)
          );
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: t('chatbot_error'),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const formatMessage = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const isListItem = line.trim().startsWith('* ') || line.trim().startsWith('- ');
      const content = isListItem ? line.trim().substring(2) : line;
      
      const parts = content.split(/(\*\*.*?\*\*)/g);
      const formattedContent = parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="font-bold text-blue-600 dark:text-blue-400">{part.slice(2, -2)}</strong>;
        }
        return <span key={index}>{part}</span>;
      });

      if (isListItem) {
        return (
          <div key={i} className="flex items-start gap-2 ml-1 mb-1">
            <span className="text-blue-500 mt-1.5 text-[10px]">•</span>
            <span className="flex-1">{formattedContent}</span>
          </div>
        );
      }

      return (
         <div key={i} className={`min-h-[1.25rem] ${line.trim() === '' ? 'h-2' : 'mb-1'}`}>
           {line.trim() === '' ? null : formattedContent}
         </div>
      );
    });
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg shadow-blue-900/30 flex items-center justify-center transition-all"
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-full max-w-[400px] h-[600px] max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
          >
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Bot size={20} />
                <h3 className="font-semibold">{t('chatbot_title')}</h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setMessages([]);
                    setChatSession(null);
                    initChat();
                  }}
                  title="Reset Chat"
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <RefreshCcw size={16} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <Minimize2 size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : msg.isError 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-bl-none'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-700 rounded-bl-none'
                    }`}
                  >
                    {formatMessage(msg.text)}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                    <Loader2 size={14} className="animate-spin" />
                    {t('chatbot_thinking')}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <div className="relative flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t('chatbot_input_placeholder')}
                  className="w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-slate-400"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
