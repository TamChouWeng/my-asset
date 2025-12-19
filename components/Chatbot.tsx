
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { X, Send, Bot, Loader2, Sparkles, RefreshCcw, ChevronRight, Key } from 'lucide-react';
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const constraintsRef = useRef(null);

  // Initialize Welcome Message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'model',
        text: t('chatbot_welcome')
      }]);
    }
  }, [t]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSelectKey = async () => {
    if (typeof window.aistudio?.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
    } else {
      alert("API Key selection is not available in this environment.");
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading) return;

    // 1. API Key Selection Check (Required for Pro models and Netlify reliability)
    if (!process.env.API_KEY) {
      const hasKey = await window.aistudio?.hasSelectedApiKey();
      if (!hasKey) {
        await handleSelectKey();
        // After triggering dialog, we proceed. Guideline says assume success to avoid race conditions.
      }
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      // 2. Fresh instance right before call
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const activeAssets = records.filter(r => r.status === 'Active');
      const simplifiedRecords = activeAssets.map(r => ({
        type: r.type,
        name: r.name,
        amount: r.amount,
        remarks: r.remarks
      }));

      const systemInstruction = `
        You are a helpful financial assistant for 'My Asset'.
        Current active portfolio: ${JSON.stringify(simplifiedRecords)}.
        Provide concise, accurate financial insights. Use **bold** for currency.
      `;

      const contents = newMessages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      // 3. Request streaming using Gemini 3 Pro
      // Removed thinkingBudget: 0 because Gemini 3 Pro requires a thinking mode budget.
      // Letting it use defaults is the safest approach for reliability.
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-pro-preview',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      const botMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: botMsgId, role: 'model', text: '' }]);

      let fullText = '';
      for await (const chunk of responseStream) {
        const chunkText = (chunk as GenerateContentResponse).text;
        if (chunkText) {
          fullText += chunkText;
          setMessages(prev => 
            prev.map(msg => msg.id === botMsgId ? { ...msg, text: fullText } : msg)
          );
        }
      }
    } catch (error: any) {
      console.error("Gemini AI Error:", error);
      
      // 4. Handle invalid key or project errors
      if (error?.message?.includes('Requested entity was not found') || error?.message?.includes('API Key')) {
        await handleSelectKey();
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: "Please select a valid API key from the dialog and try again.",
          isError: true
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: t('chatbot_error'),
          isError: true
        }]);
      }
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
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[45]" />
      
      <motion.button
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9, cursor: 'grabbing' }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[60] p-4 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl shadow-blue-500/40 flex items-center justify-center cursor-grab pointer-events-auto border-2 border-white/20 backdrop-blur-md"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div key="sparkle" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }}>
              <Sparkles size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-[55] w-full sm:w-[450px] h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-70" />
            
            <div className="px-6 py-5 bg-white dark:bg-slate-900 flex justify-between items-center shrink-0 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
                  <Bot size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">{t('chatbot_title')}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Gemini 3 Pro</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleSelectKey}
                  title="Configure API Key"
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-full transition-all"
                >
                  <Key size={18} />
                </button>
                <button 
                  onClick={() => setMessages([{ id: 'welcome', role: 'model', text: t('chatbot_welcome') }])}
                  title="Reset Chat"
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-full transition-all"
                >
                  <RefreshCcw size={18} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-all"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/20 scrollbar-thin">
              {messages.map((msg) => (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 rounded-tr-none'
                        : msg.isError 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-tl-none'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-700 rounded-tl-none'
                    }`}
                  >
                    {formatMessage(msg.text)}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm">
                    <Loader2 size={16} className="animate-spin text-blue-500" />
                    <span className="animate-pulse">{t('chatbot_thinking')}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 mb-safe">
              <form onSubmit={handleSendMessage} className="relative flex items-center gap-3">
                <div className="relative flex-1 group">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={t('chatbot_input_placeholder')}
                    className="w-full pl-4 pr-12 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-slate-400 text-sm"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/30"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
              <div className="mt-2 text-[9px] text-center text-slate-400 flex justify-center items-center gap-1">
                <span>Requires Billing Project API Key</span>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-blue-500 underline">Docs</a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
