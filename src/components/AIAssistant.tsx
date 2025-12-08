import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, BookOpen, Lightbulb, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import api from '@/services/api';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: Citation[];
  reasoning_steps?: string[];
  confidence?: number;
}

interface Citation {
  source_index: number;
  text: string;
  relevance_score: number;
  metadata: Record<string, any>;
}

interface AIAssistantProps {
  chapterId?: number;
  chapterName?: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ chapterId, chapterName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Load suggested questions when chapter changes
    if (chapterId) {
      loadSuggestedQuestions();
    }

    // Welcome message
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: chapterId
            ? `Hello! I'm your AI assistant for ${chapterName || 'this chapter'}. Ask me anything about the course materials, and I'll help you understand the concepts better.`
            : "Hello! I'm your AI assistant. Select a chapter to get started, or ask me any question about your courses!",
          timestamp: new Date(),
        },
      ]);
    }
  }, [chapterId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const loadSuggestedQuestions = async () => {
    if (!chapterId) return;

    try {
      const response = await api.get(`/ai/suggest-questions/${chapterId}`);
      const questions = response.data.questions.map((q: any) => q.question);
      setSuggestedQuestions(questions.slice(0, 3));
    } catch (error) {
      console.error('Failed to load suggested questions:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Prepare conversation history
      const conversationHistory = messages
        .filter((m) => m.role !== 'assistant' || !m.content.includes("Hello! I'm your AI assistant"))
        .map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp.toISOString(),
        }));

      const response = await api.post('/ai/ask', {
        question: inputMessage,
        chapter_id: chapterId || null,
        conversation_history: conversationHistory,
        include_reasoning: true,
      });

      const aiMessage: Message = {
        role: 'assistant',
        content: response.data.answer,
        timestamp: new Date(),
        citations: response.data.citations || [],
        reasoning_steps: response.data.reasoning_steps || [],
        confidence: response.data.confidence || 0,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Show success toast with confidence
      if (response.data.confidence >= 0.8) {
        toast.success('Answer generated with high confidence!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to get response from AI');

      const errorMessage: Message = {
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your question right now. Please try again or rephrase your question.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputMessage(question);
    textareaRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === 'user';

    return (
      <div key={index} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-500' : 'bg-purple-500'}`}>
          {isUser ? <User size={18} className="text-white" /> : <Bot size={18} className="text-white" />}
        </div>

        <div className={`flex-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col max-w-[80%]`}>
          <div className={`rounded-lg p-4 ${isUser ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>

            {/* Show confidence badge for AI responses */}
            {!isUser && message.confidence !== undefined && (
              <div className="mt-2">
                <Badge variant={message.confidence >= 0.8 ? 'default' : 'secondary'}>
                  Confidence: {(message.confidence * 100).toFixed(0)}%
                </Badge>
              </div>
            )}

            {/* Show citations if available */}
            {!isUser && message.citations && message.citations.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Sources:</p>
                {message.citations.map((citation, idx) => (
                  <div key={idx} className="text-xs bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400 line-clamp-2">{citation.text}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        Relevance: {(citation.relevance_score * 100).toFixed(0)}%
                      </Badge>
                      {citation.metadata.chapter_name && (
                        <span className="text-[10px] text-gray-500">{citation.metadata.chapter_name}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Show reasoning steps if available */}
            {!isUser && message.reasoning_steps && message.reasoning_steps.length > 0 && (
              <details className="mt-3">
                <summary className="text-xs font-semibold text-gray-600 dark:text-gray-400 cursor-pointer">
                  View Reasoning Steps
                </summary>
                <ol className="mt-2 space-y-1 list-decimal list-inside text-xs text-gray-600 dark:text-gray-400">
                  {message.reasoning_steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </details>
            )}
          </div>

          <span className="text-xs text-gray-500 mt-1 px-2">{message.timestamp.toLocaleTimeString()}</span>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-purple-500" />
          <div className="flex-1">
            <CardTitle>AI Study Assistant</CardTitle>
            {chapterName && (
              <CardDescription className="flex items-center gap-1 mt-1">
                <BookOpen size={14} />
                {chapterName}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
        {/* Suggested Questions */}
        {suggestedQuestions.length > 0 && messages.length <= 1 && (
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <p className="text-sm font-semibold mb-2">Suggested questions:</p>
              <div className="space-y-2">
                {suggestedQuestions.map((question, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 px-3"
                    onClick={() => handleSuggestedQuestion(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">{messages.map((message, index) => renderMessage(message, index))}</div>

          {isLoading && (
            <div className="flex gap-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-purple-500">
                <Bot size={18} className="text-white" />
              </div>
              <div className="flex-1 items-start flex flex-col max-w-[80%]">
                <div className="rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t pt-4">
          {!chapterId && (
            <Alert className="mb-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                For better results, select a specific chapter from your subjects page before asking questions.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={chapterId ? 'Ask anything about this chapter...' : 'Ask a question...'}
              className="min-h-[80px] resize-none"
              disabled={isLoading}
            />
            <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || isLoading} size="icon" className="h-[80px] w-12">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-2">Press Shift+Enter for new line, Enter to send</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAssistant;
