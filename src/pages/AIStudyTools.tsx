import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Brain,
  MessageSquare,
  FileText,
  Zap,
  Send,
  BookOpen,
  Target,
  Upload,
  Sparkles,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface Chapter {
  id: number;
  name: string;
  subject_name: string;
}

const AIStudyTools = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [chatInput, setChatInput] = useState('');
  const [currentMode, setCurrentMode] = useState('study');
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);

  // Real data from backend
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [realQuizzes, setRealQuizzes] = useState<any[]>([]);
  const [realFlashcards, setRealFlashcards] = useState<any[]>([]);

  // Fetch chapters on mount
  useEffect(() => {
    fetchChapters();
  }, []);

  const fetchChapters = async () => {
    try {
      const response = await api.get('/subjects/chapters/all');
      setChapters(response.data);
      // Auto-select first chapter
      if (response.data.length > 0) {
        setSelectedChapter(response.data[0].id.toString());
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
    }
  };

  // Fetch quizzes for selected chapter
  const fetchQuizzes = async (chapterId: string) => {
    try {
      const response = await api.get(`/quizzes/chapter/${chapterId}`);
      setRealQuizzes(response.data);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setRealQuizzes([]);
    }
  };

  // Fetch flashcards for selected chapter
  const fetchFlashcards = async (chapterId: string) => {
    try {
      const response = await api.get(`/flashcards/chapter/${chapterId}`);
      setRealFlashcards(response.data);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
      setRealFlashcards([]);
    }
  };

  // When chapter changes, fetch its quizzes and flashcards
  useEffect(() => {
    if (selectedChapter) {
      fetchQuizzes(selectedChapter);
      fetchFlashcards(selectedChapter);
    }
  }, [selectedChapter]);
  const [chatHistory, setChatHistory] = useState<Array<{role: string; content: string; confidence?: number}>>([
    { role: 'user', content: 'Can you explain Ohm\'s Law to me?' },
    { role: 'assistant', content: 'Ohm\'s Law states that the current through a conductor between two points is directly proportional to the voltage across the two points. The formula is V = I × R, where V is voltage, I is current, and R is resistance.', confidence: 0.95 },
    { role: 'user', content: 'Can you give me some practice problems?' },
    { role: 'assistant', content: 'Sure! Here are some Ohm\'s Law practice problems:\n\n1. If a circuit has a voltage of 12V and resistance of 4Ω, what is the current?\n2. A device draws 2A of current with 24V applied. What is its resistance?', confidence: 0.88 },
  ]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isAIThinking) return;

    const userMessage = chatInput;
    setChatInput('');

    // Add user message to chat
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);

    // Show loading state
    setIsAIThinking(true);

    try {
      // Prepare conversation history (last 10 messages for context)
      const conversationHistory = chatHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Call the actual backend API
      const response = await api.post('/ai/ask', {
        question: userMessage,
        chapter_id: selectedChapter ? parseInt(selectedChapter) : null,
        conversation_history: conversationHistory,
        include_reasoning: false
      });

      // Add AI response to chat
      let aiResponse = response.data.answer;

      // Add mode-specific context if in exam mode
      if (currentMode === 'exam') {
        aiResponse = `[EXAM MODE - Hints Only]\n\n${aiResponse}\n\nRemember: Try to work through this yourself first!`;
      }

      // Capture confidence score from response
      const confidence = response.data.confidence !== undefined ? response.data.confidence : undefined;

      setChatHistory(prev => [...prev, { role: 'assistant', content: aiResponse, confidence }]);

      // Show citations if available
      if (response.data.sources && response.data.sources.length > 0) {
        console.log('Sources used:', response.data.sources);
      }
    } catch (error: any) {
      console.error('Error getting AI response:', error);

      // Fallback response if API fails
      const fallbackResponse = currentMode === 'exam'
        ? `[EXAM MODE] I can help guide your thinking about "${userMessage}", but I'll provide hints rather than direct answers. Consider the fundamental principles involved and try to work through the problem step by step.`
        : `I'm having trouble accessing my knowledge base right now. Please try again or contact your teacher if the issue persists.`;

      setChatHistory(prev => [...prev, { role: 'assistant', content: fallbackResponse }]);
      toast.error(t('aiStudy.couldNotGetResponse'));
    } finally {
      setIsAIThinking(false);
    }
  };


  const handleGenerateQuiz = () => {
    if (!selectedChapter) {
      toast.error(t('validation.selectChapterFirst'));
      return;
    }

    // Navigate to quiz taking page if quiz exists for this chapter
    if (realQuizzes.length > 0) {
      const quiz = realQuizzes[0];
      navigate(`/quiz/${quiz.id}`);
      toast.success(t('aiStudy.startingQuiz'));
    } else {
      toast.info(
        t('aiStudy.noQuizAvailable'),
        { duration: 5000 }
      );
    }
  };

  const handleGenerateFlashcards = () => {
    if (!selectedChapter) {
      toast.error(t('validation.selectChapterFirst'));
      return;
    }

    // Navigate to flashcard study page if flashcards exist
    if (realFlashcards.length > 0) {
      navigate(`/student/flashcards/${selectedChapter}`);
      toast.success(t('aiStudy.openingFlashcards'));
    } else {
      toast.info(
        t('aiStudy.noFlashcardsAvailable'),
        { duration: 5000 }
      );
    }
  };

  const handleFileUpload = () => {
    setIsFileUploadModalOpen(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-success';
      case 'intermediate': return 'bg-warning';
      case 'advanced': return 'bg-destructive';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('aiStudy.title')}</h1>
          <p className="text-muted-foreground">{t('aiStudy.description')}</p>
        </div>
        <div className="flex gap-2">
          {/* <Button 
            variant={currentMode === 'study' ? 'default' : 'outline'}
            onClick={() => {
              setCurrentMode('study');
              toast.success('Switched to Study Mode - detailed explanations enabled!');
            }}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Study Mode
          </Button> */}
          {/* <Button 
            variant={currentMode === 'exam' ? 'default' : 'outline'}
            onClick={() => {
              setCurrentMode('exam');
              toast.success('Switched to Exam Mode - hints and guidance only!');
            }}
          >
            <Target className="mr-2 h-4 w-4" />
            Exam Mode
          </Button> */}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* AI Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="card-shadow h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                {t('aiStudy.aiAssistant')}
                <Badge className={currentMode === 'study' ? 'bg-success' : 'bg-primary'}>
                  {currentMode === 'study' ? t('aiStudy.studyMode') : t('aiStudy.examMode')}
                </Badge>
              </CardTitle>
              <CardDescription>
                {t('aiStudy.aiAssistantDescription')}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 pr-4 mb-4">
                <div className="space-y-4">
                  {chatHistory.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-4'
                          : 'bg-muted mr-4'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.role === 'assistant' && message.confidence !== undefined && (
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant={
                                message.confidence > 0.8 ? "default" :
                                message.confidence > 0.6 ? "secondary" :
                                "destructive"
                              }
                              className="text-xs"
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              {(message.confidence * 100).toFixed(0)}% confident
                            </Badge>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs text-xs">
                                    Confidence indicates how certain the AI is about this answer based on
                                    the available course materials. Higher is better.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isAIThinking && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] p-3 rounded-lg bg-muted mr-4">
                        <p className="text-sm text-muted-foreground">{t('aiStudy.aiThinking')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  placeholder={currentMode === 'exam' ? t('aiStudy.askHintsPlaceholder') : t('aiStudy.askQuestionPlaceholder')}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isAIThinking && handleSendMessage()}
                  disabled={isAIThinking}
                />
                <Button onClick={handleSendMessage} size="icon" disabled={isAIThinking}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Tools Sidebar */}
        <div className="space-y-4">
          <Tabs defaultValue="quizzes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quizzes">{t('aiStudy.quizzes')}</TabsTrigger>
              <TabsTrigger value="flashcards">{t('aiStudy.cards')}</TabsTrigger>
              {/* <TabsTrigger value="summarize">Summary</TabsTrigger> */}
            </TabsList>

            {/* Auto-generated Quizzes */}
            <TabsContent value="quizzes">
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-4 w-4" />
                    {t('aiStudy.availableQuizzes')}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t('aiStudy.selectChapterQuizzes')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Chapter Selector */}
                  <div className="space-y-2">
                    <Label htmlFor="chapter-select" className="text-xs">{t('aiStudy.selectChapter')}</Label>
                    <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                      <SelectTrigger id="chapter-select" className="text-sm">
                        <SelectValue placeholder={t('aiStudy.chooseChapter')} />
                      </SelectTrigger>
                      <SelectContent>
                        {chapters.map((chapter) => (
                          <SelectItem key={chapter.id} value={chapter.id.toString()}>
                            <span className="text-xs">
                              {chapter.subject_name} - {chapter.name.substring(0, 40)}
                              {chapter.name.length > 40 ? '...' : ''}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Display real quizzes or empty state */}
                  {realQuizzes.length > 0 ? (
                    <>
                      {realQuizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          className="p-3 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => navigate(`/quiz/${quiz.id}`)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-sm">{quiz.title}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {quiz.quiz_type}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>{quiz.time_limit ? `${quiz.time_limit} min` : t('aiStudy.noTimeLimit')}</p>
                            <p>{t('aiStudy.passing')}: {quiz.passing_score}%</p>
                          </div>
                        </div>
                      ))}
                      <Button
                        className="w-full"
                        size="sm"
                        onClick={handleGenerateQuiz}
                      >
                        <ExternalLink className="mr-2 h-3 w-3" />
                        {t('aiStudy.startQuiz')}
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-6 text-sm text-muted-foreground border rounded-lg bg-muted/20">
                      <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>{t('aiStudy.noQuizzesChapter')}</p>
                      <p className="text-xs mt-1">{t('aiStudy.goToSubjects')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Flashcards */}
            <TabsContent value="flashcards">
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Zap className="h-4 w-4" />
                    {t('aiStudy.aiFlashcards')}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t('aiStudy.selectChapterFlashcards')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Chapter Selector */}
                  <div className="space-y-2">
                    <Label htmlFor="flashcard-chapter-select" className="text-xs">{t('aiStudy.selectChapter')}</Label>
                    <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                      <SelectTrigger id="flashcard-chapter-select" className="text-sm">
                        <SelectValue placeholder={t('aiStudy.chooseChapter')} />
                      </SelectTrigger>
                      <SelectContent>
                        {chapters.map((chapter) => (
                          <SelectItem key={chapter.id} value={chapter.id.toString()}>
                            <span className="text-xs">
                              {chapter.subject_name} - {chapter.name.substring(0, 40)}
                              {chapter.name.length > 40 ? '...' : ''}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Display real flashcards or empty state */}
                  {realFlashcards.length > 0 ? (
                    <>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {realFlashcards.slice(0, 5).map((card) => (
                          <div
                            key={card.id}
                            className="p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                          >
                            <div className="text-sm font-medium mb-1">{card.front_text}</div>
                            <div className="text-xs text-muted-foreground">
                              {t('aiStudy.difficulty')}: {card.difficulty_level}
                            </div>
                          </div>
                        ))}
                      </div>
                      {realFlashcards.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          {t('aiStudy.moreFlashcards', { count: realFlashcards.length - 5 })}
                        </p>
                      )}
                      <Button
                        className="w-full"
                        size="sm"
                        onClick={handleGenerateFlashcards}
                      >
                        <ExternalLink className="mr-2 h-3 w-3" />
                        {t('aiStudy.studyFlashcards')}
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-6 text-sm text-muted-foreground border rounded-lg bg-muted/20">
                      <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>{t('aiStudy.noFlashcardsChapter')}</p>
                      <p className="text-xs mt-1">{t('aiStudy.createFromResources')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Document Summarizer */}
            {/* <TabsContent value="summarize">
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" />
                    Document Summarizer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drop PDF or DOCX files here
                    </p>
                    <Button size="sm" variant="outline" onClick={handleFileUpload}>
                      Choose File
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Recent Summary:</p>
                    <div className="p-2 bg-muted/50 rounded text-xs">
                      "Circuit Analysis Fundamentals" - Generated key concepts: Voltage dividers, current flow, resistance calculations...
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent> */}
          </Tabs>
        </div>
      </div>

      {/* File Upload Modal */}
      <Dialog open={isFileUploadModalOpen} onOpenChange={setIsFileUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document to generate study materials
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm mb-2">Drop files here or click to browse</p>
              <Button size="sm" variant="outline">
                Choose File
              </Button>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => {
                setIsFileUploadModalOpen(false);
                toast.success('File uploaded! Processing for study materials...');
              }}>
                Upload & Process
              </Button>
              <Button variant="outline" onClick={() => setIsFileUploadModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIStudyTools;