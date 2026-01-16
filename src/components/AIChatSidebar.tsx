'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, XMarkIcon, PaperAirplaneIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIChatSidebar({ isOpen, onClose }: AIChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dataCache, setDataCache] = useState<{ patients: Record<string, unknown>[], visits: Record<string, unknown>[] } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollPositionRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      // Store current scroll position
      scrollPositionRef.current = window.scrollY;
      
      // Lock body scroll using position fixed to prevent background scroll
      // but allow sidebar internal scrolling
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      if (window.innerWidth >= 768 && textareaRef.current) {
        setTimeout(() => textareaRef.current?.focus(), 100);
      }
    } else {
      // Restore body scroll
      const scrollY = scrollPositionRef.current;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.paddingRight = '';
      
      // Restore scroll position
      window.scrollTo(0, scrollY);
    }
    
    return () => {
      // Cleanup on unmount
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  const fetchInitialData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/ai-chat/data', {
        method: 'GET',
        headers: {
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const cache = { patients: data.patients, visits: data.visits };
        setDataCache(cache);
        return cache;
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    
    // Validate input: must be at least 3 characters and contain at least one letter
    if (!trimmedInput || isLoading) return;
    if (trimmedInput.length < 3 || !/[a-zA-Z]/.test(trimmedInput)) {
      toast.error('Please enter a valid question with at least 3 characters');
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let currentCache = dataCache;
      
      if (!currentCache) {
        currentCache = await fetchInitialData();
        if (!currentCache) {
          toast.error('Failed to load data. Please try again.');
          setMessages((prev) => prev.slice(0, -1));
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ 
          message: trimmedInput, 
          history: messages,
          cachedData: currentCache
        }),
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to get AI response. Please try again.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (isLoading) return; // Prevent clearing while AI is responding
    setMessages([]);
    toast.success('Chat history cleared');
  };

  const handleClose = () => {
    setDataCache(null);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // On desktop/tablet: Enter sends, Shift+Enter creates new line
    // On mobile: Enter creates new line, use send button to submit
    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 768) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const exampleQuestions = [
    "How many patients visited last month?",
    "Show patients with diabetes diagnosis",
    "What are the most common symptoms?",
    "List patients due for follow-up this week",
  ];

  const handleExampleClick = (question: string) => {
    setInput(question);
    textareaRef.current?.focus();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={handleClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 w-full sm:w-[400px] max-w-full bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 overflow-hidden"
            style={{ willChange: 'transform', height: '100dvh' }}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <SparklesIcon className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
              </div>
              <div className="flex items-center space-x-2">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    disabled={isLoading}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Clear chat"
                  >
                    <TrashIcon className="w-5 h-5 text-gray-600" />
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-0">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6 px-4">
                  <div className="text-center space-y-3">
                    <div className="p-4 bg-blue-50 rounded-full inline-block">
                      <SparklesIcon className="w-12 h-12 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Ask me anything
                    </h3>
                    <p className="text-sm text-gray-600">
                      Query your patient data with natural language
                    </p>
                  </div>

                  {/* Example questions */}
                  <div className="w-full space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                      Try asking:
                    </p>
                    {exampleQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleExampleClick(question)}
                        className="w-full text-left p-3 rounded-lg bg-white hover:bg-blue-50 hover:border-blue-200 transition-colors text-sm text-gray-700 border border-gray-200 shadow-sm"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-3 shadow-sm ${
                          message.role === 'user'
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            message.role === 'user'
                              ? 'text-gray-400'
                              : 'text-gray-500'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-lg p-3 bg-white border border-gray-200 shadow-sm">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                          <div
                            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                            style={{ animationDelay: '0.1s' }}
                          />
                          <div
                            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                            style={{ animationDelay: '0.2s' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex-shrink-0 p-4 border-t bg-white">
              <div className="flex space-x-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onTouchStart={() => {
                    if (window.innerWidth < 768) {
                      // Keep main page scroll position fixed
                      window.scrollTo(0, scrollPositionRef.current);
                      
                      // Scroll input into view using ref
                      setTimeout(() => {
                        if (textareaRef.current) {
                          textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }, 350);
                    }
                  }}
                  onFocus={() => {
                    if (window.innerWidth < 768) {
                      // Keep main page scroll position fixed
                      window.scrollTo(0, scrollPositionRef.current);
                      
                      // Scroll input into view within sidebar after keyboard appears
                      setTimeout(() => {
                        if (textareaRef.current) {
                          textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }, 350);
                    }
                  }}
                  placeholder="Ask about your patients..."
                  rows={1}
                  className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm bg-white"
                  disabled={isLoading}
                  enterKeyHint="send"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 hidden md:block">
                Press Enter to send, Shift+Enter for new line
              </p>
              <p className="text-xs text-gray-500 mt-2 md:hidden">
                Tap send button to submit
              </p>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
