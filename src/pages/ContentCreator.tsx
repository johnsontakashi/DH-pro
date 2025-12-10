import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Brain,
  FileQuestion,
  ClipboardCheck,
  FileCheck,
  Zap,
  Plus,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle,
  Settings,
  ExternalLink,
  History,
  Calendar,
  Eye,
  Shield,
  HelpCircle,
  RefreshCw,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';

interface Subject {
  id: number;
  name: string;
  code: string;
  category: string;
  chapters: Chapter[];
}

interface Chapter {
  id: number;
  name: string;
  order: number;
  subject_id: number;
}

interface Resource {
  id: number;
  title: string;
  content?: string;
}

const ContentCreator = () => {
  const navigate = useNavigate();

  // Helper function to extract error message from API responses
  const getErrorMessage = (error: any, defaultMessage: string): string => {
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      if (Array.isArray(detail)) {
        // Extract validation error messages
        return detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
      } else if (typeof detail === 'string') {
        return detail;
      }
    }
    return defaultMessage;
  };

  // Common state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [generatingResources, setGeneratingResources] = useState(false);

  // Question Generator state
  const [questionCount, setQuestionCount] = useState(5);
  const [questionType, setQuestionType] = useState('mcq');
  const [difficulty, setDifficulty] = useState('medium');
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [questionStats, setQuestionStats] = useState<any>(null);
  const [loadingQuestionStats, setLoadingQuestionStats] = useState(false);

  // Quiz state
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [quizType, setQuizType] = useState('adaptive');
  const [quizTimeLimit, setQuizTimeLimit] = useState('30');
  const [quizPassingScore, setQuizPassingScore] = useState('70');
  const [quizMaxAttempts, setQuizMaxAttempts] = useState('3');
  const [creatingQuiz, setCreatingQuiz] = useState(false);

  // Exam state
  const [examTitle, setExamTitle] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [examType, setExamType] = useState('midterm');
  const [examTimeLimit, setExamTimeLimit] = useState('90');
  const [examTotalQuestions, setExamTotalQuestions] = useState('30');
  const [creatingExam, setCreatingExam] = useState(false);

  // Flashcard state
  const [numFlashcards, setNumFlashcards] = useState(20);
  const [flashcardStrictMode, setFlashcardStrictMode] = useState(true); // Default: only uploaded materials
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);

  // History state
  const [historyQuizzes, setHistoryQuizzes] = useState<any[]>([]);
  const [historyExams, setHistoryExams] = useState<any[]>([]);
  const [historyFlashcards, setHistoryFlashcards] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load subjects on mount
  useEffect(() => {
    loadSubjects();
  }, []);

  // Load chapters when subject changes
  useEffect(() => {
    if (selectedSubject) {
      const subject = subjects.find(s => s.id === selectedSubject);
      if (subject) {
        setChapters(subject.chapters || []);
        setSelectedChapter(null);
        setResources([]);
      }
    }
  }, [selectedSubject, subjects]);

  // Load resources when chapter changes
  useEffect(() => {
    if (selectedChapter) {
      loadResources(selectedChapter);
      loadQuestionStatistics(selectedChapter);
      loadContentHistory(selectedChapter);
    }
  }, [selectedChapter]);

  const loadSubjects = async () => {
    try {
      const response = await api.get('/subjects/');
      const subjectsData = response.data.subjects || response.data || [];
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading subjects:', error);
      toast.error('Failed to load subjects');
    }
  };

  const loadResources = async (chapterId: number) => {
    try {
      setLoadingResources(true);
      const chapter = chapters.find(c => c.id === chapterId);
      if (chapter) {
        const response = await api.get(`/subjects/${chapter.subject_id}/chapters/${chapterId}/resources`);
        setResources(response.data || []);
      }
    } catch (error) {
      console.error('Error loading resources:', error);
      setResources([]);
    } finally {
      setLoadingResources(false);
    }
  };

  const loadQuestionStatistics = async (chapterId: number) => {
    try {
      setLoadingQuestionStats(true);
      const response = await api.get(`/questions/statistics/chapter/${chapterId}`);
      setQuestionStats(response.data);
    } catch (error) {
      console.error('Error loading question statistics:', error);
      setQuestionStats(null);
    } finally {
      setLoadingQuestionStats(false);
    }
  };

  const loadContentHistory = async (chapterId: number) => {
    try {
      setLoadingHistory(true);

      // Fetch quizzes for this chapter
      try {
        const quizzesResponse = await api.get(`/quizzes/chapter/${chapterId}`);
        setHistoryQuizzes(quizzesResponse.data || []);
      } catch (error) {
        console.error('Error loading quizzes:', error);
        setHistoryQuizzes([]);
      }

      // Note: /exams/available is for students only (403 for teachers)
      // We'll load exams from database after creating them
      // For now, just show the exams that were created in this session
      setHistoryExams([]);

      // Flashcards - placeholder for now (no endpoint available yet)
      setHistoryFlashcards([]);

    } catch (error) {
      console.error('Error loading content history:', error);
      setHistoryQuizzes([]);
      setHistoryExams([]);
      setHistoryFlashcards([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const generateResourcesWithGPT = async () => {
    if (!selectedChapter) {
      toast.error('Please select a chapter first');
      return;
    }

    try {
      setGeneratingResources(true);
      const chapter = chapters.find(c => c.id === selectedChapter);
      const subject = subjects.find(s => s.id === selectedSubject);

      if (!chapter || !subject) return;

      toast.info('Generating resources with GPT...', { duration: 3000 });

      const response = await api.post('/resources/generate', {
        chapter_id: selectedChapter,
        chapter_name: chapter.name,
        subject_name: subject.name
      });

      setResources(response.data || []);
      toast.success('Resources generated successfully!');
    } catch (error: any) {
      console.error('Error generating resources:', error);
      toast.error(getErrorMessage(error, 'Failed to generate resources'));
    } finally {
      setGeneratingResources(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!selectedChapter) {
      toast.error('Please select a chapter first');
      return;
    }

    if (resources.length === 0) {
      toast.error('No resources found. Generating resources first...');
      await generateResourcesWithGPT();
      return;
    }

    try {
      setGeneratingQuestions(true);

      const response = await api.post(`/questions/bulk-generate/${selectedChapter}?overwrite=false`);

      toast.success(`Generated ${response.data.questions_generated.total} questions!`);

      // Reload question statistics to show updated counts
      if (selectedChapter) {
        await loadQuestionStatistics(selectedChapter);
      }
    } catch (error: any) {
      console.error('Error generating questions:', error);
      toast.error(getErrorMessage(error, 'Failed to generate questions'));
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleConvertQuestionsToFlashcards = async () => {
    if (!selectedChapter) {
      toast.error('Please select a chapter first');
      return;
    }

    if (!questionStats || questionStats.total === 0) {
      toast.error('No questions available. Please generate questions first.');
      return;
    }

    if (numFlashcards > questionStats.total) {
      toast.error(`Cannot create ${numFlashcards} flashcards. Only ${questionStats.total} questions available.`);
      return;
    }

    try {
      setGeneratingFlashcards(true);

      const response = await api.post(
        `/flashcards/convert-from-questions/${selectedChapter}`,
        null,
        {
          params: {
            num_flashcards: numFlashcards,
            overwrite: false
          }
        }
      );

      const created = response.data.flashcards_created || 0;

      toast.success(
        `✅ Converted ${created} questions to flashcards instantly! (${response.data.source})`,
        { duration: 4000 }
      );

      // Navigate to flashcard manager to see results
      navigate('/teacher/flashcards');
    } catch (error: any) {
      console.error('Error converting questions to flashcards:', error);
      toast.error(getErrorMessage(error, 'Failed to convert questions to flashcards'));
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const handleCreateQuiz = async () => {
    if (!selectedChapter) {
      toast.error('Please select a chapter first');
      return;
    }

    if (!quizTitle.trim()) {
      toast.error('Please enter a quiz title');
      return;
    }

    if (resources.length === 0) {
      toast.error('No resources found. Generating resources first...');
      await generateResourcesWithGPT();
      return;
    }

    try {
      setCreatingQuiz(true);

      const response = await api.post('/quizzes/', {
        chapter_id: selectedChapter,
        title: quizTitle,
        description: quizDescription,
        quiz_type: quizType,
        time_limit: parseInt(quizTimeLimit) || null,
        passing_score: parseInt(quizPassingScore),
        max_attempts: parseInt(quizMaxAttempts)
      });

      toast.success('Quiz created successfully!');

      // Reset form
      setQuizTitle('');
      setQuizDescription('');

      // Add the newly created quiz to history immediately
      const newQuiz = {
        ...response.data,
        created_at: new Date().toISOString()
      };
      setHistoryQuizzes(prev => [newQuiz, ...prev]);
    } catch (error: any) {
      console.error('Error creating quiz:', error);
      toast.error(getErrorMessage(error, 'Failed to create quiz'));
    } finally {
      setCreatingQuiz(false);
    }
  };

  const handleCreateExam = async () => {
    if (!selectedChapter) {
      toast.error('Please select a chapter first');
      return;
    }

    if (!examTitle.trim()) {
      toast.error('Please enter an exam title');
      return;
    }

    if (resources.length === 0) {
      toast.error('No resources found. Generating resources first...');
      await generateResourcesWithGPT();
      return;
    }

    try {
      setCreatingExam(true);

      // Set exam availability dates (available now, until 30 days from now)
      const now = new Date();
      const availableUntil = new Date();
      availableUntil.setDate(availableUntil.getDate() + 30);

      const response = await api.post('/exams/', {
        chapter_id: selectedChapter,
        title: examTitle,
        description: examDescription,
        exam_type: examType,
        time_limit: parseInt(examTimeLimit),
        passing_score: 70,
        total_points: 100.0,
        available_from: now.toISOString(),
        available_until: availableUntil.toISOString(),
        max_attempts: 3,
        question_count: parseInt(examTotalQuestions),
        shuffle_questions: true,
        show_results_immediately: false,
        strict_mode: true,
        is_published: true
      });

      toast.success('Exam created successfully!');

      // Reset form
      setExamTitle('');
      setExamDescription('');

      // Add the newly created exam to history immediately
      const newExam = {
        ...response.data,
        created_at: new Date().toISOString()
      };
      setHistoryExams(prev => [newExam, ...prev]);
    } catch (error: any) {
      console.error('Error creating exam:', error);
      toast.error(getErrorMessage(error, 'Failed to create exam'));
    } finally {
      setCreatingExam(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!selectedChapter) {
      toast.error('Please select a chapter first');
      return;
    }

    try {
      setGeneratingFlashcards(true);

      // Show info if no resources - backend will use GPT fallback
      if (resources.length === 0) {
        toast.info('No resources found. Generating flashcards using AI from chapter title...');
      }

      const response = await api.post('/flashcards/generate', {
        chapter_id: selectedChapter,
        num_cards: numFlashcards,
        strict_mode: flashcardStrictMode
      });

      const generatedCount = response.data?.length || 0;

      // Show warning if fewer cards generated than requested
      if (generatedCount < numFlashcards) {
        toast.warning(
          `Only ${generatedCount}/${numFlashcards} flashcards generated. ` +
          `Try unchecking Strict Mode or uploading more content to the chapter.`,
          { duration: 6000 }
        );
      } else {
        toast.success(`Successfully generated ${generatedCount} flashcards!`);
      }

      // Navigate to flashcard manager
      navigate('/teacher/flashcards');
    } catch (error: any) {
      console.error('Error generating flashcards:', error);
      toast.error(getErrorMessage(error, 'Failed to generate flashcards'));
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const selectedChapterName = chapters.find(c => c.id === selectedChapter)?.name;
  const selectedSubjectName = subjects.find(s => s.id === selectedSubject)?.name;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="h-8 w-8" />
          Content Creator
        </h1>
        <p className="text-muted-foreground mt-2">
          Generate questions, quizzes, exams, and flashcards with AI assistance
        </p>
      </div>

      {/* Subject & Chapter Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Subject & Chapter</CardTitle>
          <CardDescription>Choose the subject and chapter for content creation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Subject Selection */}
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={selectedSubject?.toString()}
                onValueChange={(v) => setSelectedSubject(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects && subjects.length > 0 ? (
                    subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No subjects available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Chapter Selection */}
            <div className="space-y-2">
              <Label>Chapter</Label>
              <Select
                value={selectedChapter?.toString()}
                onValueChange={(v) => setSelectedChapter(parseInt(v))}
                disabled={!selectedSubject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a chapter" />
                </SelectTrigger>
                <SelectContent>
                  {chapters && chapters.length > 0 ? (
                    chapters.map(chapter => (
                      <SelectItem key={chapter.id} value={chapter.id.toString()}>
                        {chapter.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No chapters available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resource Status */}
          {selectedChapter && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  {loadingResources ? (
                    <span>Loading resources...</span>
                  ) : resources.length === 0 ? (
                    <span>No resources found for this chapter. Click generate to create resources with AI.</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      {resources.length} resource(s) available
                    </span>
                  )}
                </div>
                {resources.length === 0 && !loadingResources && (
                  <Button
                    size="sm"
                    onClick={generateResourcesWithGPT}
                    disabled={generatingResources}
                  >
                    {generatingResources ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Resources
                      </>
                    )}
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Content Creation Tabs */}
      {selectedChapter && (
        <Tabs defaultValue="questions" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="questions">
              <FileQuestion className="mr-2 h-4 w-4" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="quizzes">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Quizzes
            </TabsTrigger>
            <TabsTrigger value="exams">
              <FileCheck className="mr-2 h-4 w-4" />
              Exams
            </TabsTrigger>
            <TabsTrigger value="flashcards">
              <Zap className="mr-2 h-4 w-4" />
              Flashcards
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="mr-2 h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Questions Tab */}
          <TabsContent value="questions">
            <Card>
              <CardHeader>
                <CardTitle>Generate Questions</CardTitle>
                <CardDescription>
                  AI-generate questions for {selectedChapterName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Number of Questions</Label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Question Type</Label>
                    <Select value={questionType} onValueChange={setQuestionType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">Multiple Choice</SelectItem>
                        <SelectItem value="true_false">True/False</SelectItem>
                        <SelectItem value="short_answer">Short Answer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateQuestions}
                  disabled={generatingQuestions || resources.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {generatingQuestions ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate 100 Questions (30/40/30)
                    </>
                  )}
                </Button>

                {resources.length === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No resources found. Generate resources first to enable question generation.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Question Statistics Card */}
            {questionStats && questionStats.total_questions > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Chapter Question Bank
                  </CardTitle>
                  <CardDescription>
                    Available questions for {selectedChapterName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="border rounded-lg p-4">
                      <div className="text-2xl font-bold">{questionStats.total_questions}</div>
                      <div className="text-sm text-muted-foreground">Total Questions</div>
                    </div>
                    <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        30
                      </div>
                      <div className="text-sm text-muted-foreground">Beginner</div>
                    </div>
                    <div className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-950">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        40
                      </div>
                      <div className="text-sm text-muted-foreground">Medium</div>
                    </div>
                    <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        30
                      </div>
                      <div className="text-sm text-muted-foreground">Advanced</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">By Question Type</h4>
                    <div className="grid gap-2 md:grid-cols-3">
                      <div className="flex items-center justify-between border rounded p-2">
                        <span className="text-sm">Multiple Choice</span>
                        <Badge>{questionStats.by_question_type?.mcq || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between border rounded p-2">
                        <span className="text-sm">True/False</span>
                        <Badge>{questionStats.by_question_type?.true_false || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between border rounded p-2">
                        <span className="text-sm">Short Answer</span>
                        <Badge>{questionStats.by_question_type?.short_answer || 0}</Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">By Bloom's Taxonomy Level</h4>
                    <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6">
                      <div className="border rounded p-2 text-center">
                        <div className="font-bold">{questionStats.by_bloom_level?.remember || 0}</div>
                        <div className="text-xs text-muted-foreground">Remember</div>
                      </div>
                      <div className="border rounded p-2 text-center">
                        <div className="font-bold">{questionStats.by_bloom_level?.understand || 0}</div>
                        <div className="text-xs text-muted-foreground">Understand</div>
                      </div>
                      <div className="border rounded p-2 text-center">
                        <div className="font-bold">{questionStats.by_bloom_level?.apply || 0}</div>
                        <div className="text-xs text-muted-foreground">Apply</div>
                      </div>
                      <div className="border rounded p-2 text-center">
                        <div className="font-bold">{questionStats.by_bloom_level?.analyze || 0}</div>
                        <div className="text-xs text-muted-foreground">Analyze</div>
                      </div>
                      <div className="border rounded p-2 text-center">
                        <div className="font-bold">{questionStats.by_bloom_level?.evaluate || 0}</div>
                        <div className="text-xs text-muted-foreground">Evaluate</div>
                      </div>
                      <div className="border rounded p-2 text-center">
                        <div className="font-bold">{questionStats.by_bloom_level?.create || 0}</div>
                        <div className="text-xs text-muted-foreground">Create</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes">
            <Card>
              <CardHeader>
                <CardTitle>Create Quiz</CardTitle>
                <CardDescription>
                  Create a quiz for {selectedChapterName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Quiz Title</Label>
                  <Input
                    placeholder="Enter quiz title"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Enter quiz description"
                    value={quizDescription}
                    onChange={(e) => setQuizDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Quiz Type</Label>
                    <Select value={quizType} onValueChange={setQuizType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="adaptive">Adaptive</SelectItem>
                        <SelectItem value="practice">Practice</SelectItem>
                        <SelectItem value="timed">Timed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Time Limit (minutes)</Label>
                    <Input
                      type="number"
                      value={quizTimeLimit}
                      onChange={(e) => setQuizTimeLimit(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Passing Score (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={quizPassingScore}
                      onChange={(e) => setQuizPassingScore(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Attempts</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quizMaxAttempts}
                      onChange={(e) => setQuizMaxAttempts(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCreateQuiz}
                  disabled={creatingQuiz || resources.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {creatingQuiz ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Quiz...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Quiz
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exams Tab */}
          <TabsContent value="exams">
            <Card>
              <CardHeader>
                <CardTitle>Create Exam</CardTitle>
                <CardDescription>
                  Create an exam for {selectedChapterName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Exam Title</Label>
                  <Input
                    placeholder="Enter exam title"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Enter exam description"
                    value={examDescription}
                    onChange={(e) => setExamDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Exam Type</Label>
                    <Select value={examType} onValueChange={setExamType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="midterm">Midterm</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                        <SelectItem value="quiz">Quiz Exam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Time Limit (minutes)</Label>
                    <Input
                      type="number"
                      value={examTimeLimit}
                      onChange={(e) => setExamTimeLimit(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Total Questions</Label>
                    <Input
                      type="number"
                      min="1"
                      value={examTotalQuestions}
                      onChange={(e) => setExamTotalQuestions(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCreateExam}
                  disabled={creatingExam || resources.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {creatingExam ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Exam...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Exam
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flashcards Tab */}
          <TabsContent value="flashcards">
            <Card>
              <CardHeader>
                <CardTitle>Generate Flashcards</CardTitle>
                <CardDescription>
                  Create flashcards for {selectedChapterName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Show questions available alert */}
                {questionStats && questionStats.total > 0 && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      ✅ <strong>{questionStats.total} questions</strong> available for this chapter.
                      You can convert them to flashcards <strong>instantly</strong> (free, no AI generation needed)!
                    </AlertDescription>
                  </Alert>
                )}

                {/* Option selector: Convert vs Generate */}
                <Tabs defaultValue={questionStats && questionStats.total >= 20 ? "convert" : "generate"} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="convert"
                      disabled={!questionStats || questionStats.total === 0}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Convert from Questions
                    </TabsTrigger>
                    <TabsTrigger value="generate">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate New (AI)
                    </TabsTrigger>
                  </TabsList>

                  {/* Convert Tab */}
                  <TabsContent value="convert" className="space-y-4 mt-4">
                    {!questionStats || questionStats.total === 0 ? (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No questions available. Generate questions first in the <strong>Questions tab</strong>.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <Alert>
                          <Info className="h-4 w-4 text-blue-600" />
                          <AlertDescription>
                            <strong>Instant conversion</strong> - No AI generation, no wait time, no cost!
                            Questions will be converted to flashcard format automatically.
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                          <Label>Number of Flashcards</Label>
                          <Input
                            type="number"
                            min="1"
                            max={questionStats.total}
                            value={numFlashcards}
                            onChange={(e) => setNumFlashcards(Math.min(parseInt(e.target.value) || 20, questionStats.total))}
                          />
                          <p className="text-sm text-muted-foreground">
                            Available: {questionStats.total} questions | Breakdown: {questionStats.beginner} beginner, {questionStats.medium} medium, {questionStats.advanced} advanced
                          </p>
                        </div>

                        <Button
                          onClick={handleConvertQuestionsToFlashcards}
                          disabled={generatingFlashcards || !questionStats || questionStats.total === 0}
                          className="w-full"
                          size="lg"
                        >
                          {generatingFlashcards ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Converting...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Convert to Flashcards (Instant)
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </TabsContent>

                  {/* Generate Tab */}
                  <TabsContent value="generate" className="space-y-4 mt-4">
                    <Alert>
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <AlertDescription>
                        AI generation takes 2-3 minutes and uses OpenAI API. Consider converting from questions if available.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label>Number of Flashcards</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={numFlashcards}
                        onChange={(e) => setNumFlashcards(parseInt(e.target.value))}
                      />
                    </div>

                    {/* Strict Mode Toggle */}
                    <div className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/30">
                      <Checkbox
                        id="flashcard-strict-mode"
                        checked={flashcardStrictMode}
                        onCheckedChange={(checked) => setFlashcardStrictMode(checked as boolean)}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <Label
                          htmlFor="flashcard-strict-mode"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-green-600" />
                            Strict Mode (Recommended)
                          </div>
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-sm">
                                <strong>Enabled:</strong> Generate flashcards ONLY from uploaded chapter resources.
                              </p>
                              <p className="text-sm mt-1">
                                <strong>Disabled:</strong> AI can use general knowledge in addition to resources.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Badge variant={flashcardStrictMode ? "default" : "secondary"} className="ml-auto text-xs">
                        {flashcardStrictMode ? "Uploaded Only" : "+ General"}
                      </Badge>
                    </div>

                    <Button
                      onClick={handleGenerateFlashcards}
                      disabled={generatingFlashcards || resources.length === 0}
                      className="w-full"
                      size="lg"
                    >
                      {generatingFlashcards ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Flashcards...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Flashcards with AI
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => navigate('/teacher/flashcards')}
                  className="w-full"
                  size="lg"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  View & Manage All Flashcards
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <div className="space-y-4">
              {/* Quizzes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5" />
                    Quizzes ({historyQuizzes.length})
                  </CardTitle>
                  <CardDescription>
                    Quizzes created for {selectedChapterName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingHistory ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">Loading quizzes...</p>
                    </div>
                  ) : historyQuizzes.length > 0 ? (
                    <div className="space-y-2">
                      {historyQuizzes.map((quiz: any) => (
                        <div key={quiz.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{quiz.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline">{quiz.quiz_type}</Badge>
                                <Badge variant="secondary">{quiz.time_limit} min</Badge>
                                <Badge>{quiz.is_active ? 'Active' : 'Inactive'}</Badge>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 inline mr-1" />
                              {new Date(quiz.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ClipboardCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No quizzes created yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Exams */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5" />
                    Exams ({historyExams.length})
                  </CardTitle>
                  <CardDescription>
                    Exams created for {selectedChapterName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingHistory ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">Loading exams...</p>
                    </div>
                  ) : historyExams.length > 0 ? (
                    <div className="space-y-2">
                      {historyExams.map((exam: any) => (
                        <div key={exam.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{exam.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{exam.description}</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline">{exam.exam_type}</Badge>
                                <Badge variant="secondary">{exam.time_limit} min</Badge>
                                <Badge>{exam.is_published ? 'Published' : 'Draft'}</Badge>
                                <Badge variant="outline">{exam.question_count} questions</Badge>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 inline mr-1" />
                              {new Date(exam.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No exams created yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Question Statistics Summary */}
              {questionStats && questionStats.total_questions > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileQuestion className="h-5 w-5" />
                      Questions ({questionStats.total_questions})
                    </CardTitle>
                    <CardDescription>
                      Question bank for {selectedChapterName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="border rounded-lg p-3 bg-green-50 dark:bg-green-950">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">
                          {questionStats.by_difficulty?.beginner || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Beginner</div>
                      </div>
                      <div className="border rounded-lg p-3 bg-yellow-50 dark:bg-yellow-950">
                        <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                          {questionStats.by_difficulty?.medium || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Medium</div>
                      </div>
                      <div className="border rounded-lg p-3 bg-red-50 dark:bg-red-950">
                        <div className="text-xl font-bold text-red-600 dark:text-red-400">
                          {questionStats.by_difficulty?.advanced || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Advanced</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ContentCreator;
