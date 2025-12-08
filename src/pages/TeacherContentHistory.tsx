import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  History,
  FileQuestion,
  ClipboardCheck,
  FileCheck,
  Zap,
  Calendar,
  Eye,
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

interface Quiz {
  id: number;
  title: string;
  description?: string;
  quiz_type: string;
  chapter_id: number;
  chapter_name?: string;
  subject_name?: string;
  created_at: string;
  total_questions?: number;
}

interface Exam {
  id: number;
  title: string;
  description?: string;
  exam_type: string;
  chapter_id: number;
  chapter_name?: string;
  subject_name?: string;
  created_at: string;
  is_published: boolean;
  time_limit: number;
}

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  difficulty: string;
  chapter_id: number;
  chapter_name?: string;
  subject_name?: string;
  created_at: string;
}

interface Flashcard {
  id: number;
  front: string;
  back: string;
  chapter_id: number;
  chapter_name?: string;
  subject_name?: string;
  created_at: string;
}

const TeacherContentHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllContent();
  }, []);

  const loadAllContent = async () => {
    try {
      setLoading(true);

      // For now, show empty state since we need dedicated backend endpoints
      // TODO: Implement backend endpoints for:
      // - GET /teacher/my-quizzes
      // - GET /teacher/my-exams
      // - GET /teacher/my-questions
      // - GET /teacher/my-flashcards

      setQuizzes([]);
      setExams([]);
      setQuestions([]);
      setFlashcards([]);

      toast.info('Content history feature requires backend implementation', {
        description: 'This feature will be fully functional once backend endpoints are added.'
      });
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Failed to load content history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getQuizTypeColor = (type: string) => {
    switch (type) {
      case 'adaptive': return 'bg-purple-500';
      case 'practice': return 'bg-blue-500';
      case 'graded': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <History className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading content history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <History className="h-8 w-8" />
          Content Creation History
        </h1>
        <p className="text-muted-foreground mt-2">
          View and manage all content you've created: quizzes, exams, questions, and flashcards
        </p>
      </div>

      <Tabs defaultValue="quizzes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="quizzes">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Quizzes ({quizzes.length})
          </TabsTrigger>
          <TabsTrigger value="exams">
            <FileCheck className="h-4 w-4 mr-2" />
            Exams ({exams.length})
          </TabsTrigger>
          <TabsTrigger value="questions">
            <FileQuestion className="h-4 w-4 mr-2" />
            Questions ({questions.length})
          </TabsTrigger>
          <TabsTrigger value="flashcards">
            <Zap className="h-4 w-4 mr-2" />
            Flashcards ({flashcards.length})
          </TabsTrigger>
        </TabsList>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="space-y-4">
          {quizzes.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No quizzes created yet</p>
              </CardContent>
            </Card>
          ) : (
            quizzes.map((quiz) => (
              <Card key={quiz.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{quiz.title}</CardTitle>
                      <CardDescription>{quiz.description || 'No description'}</CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getQuizTypeColor(quiz.quiz_type)}>
                          {quiz.quiz_type}
                        </Badge>
                        {quiz.subject_name && (
                          <span className="text-sm text-muted-foreground">
                            {quiz.subject_name} → {quiz.chapter_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/quiz/${quiz.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(quiz.created_at)}
                    </span>
                    {quiz.total_questions && (
                      <span>{quiz.total_questions} questions</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Exams Tab */}
        <TabsContent value="exams" className="space-y-4">
          {exams.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No exams created yet</p>
              </CardContent>
            </Card>
          ) : (
            exams.map((exam) => (
              <Card key={exam.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{exam.title}</CardTitle>
                      <CardDescription>{exam.description || 'No description'}</CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge>{exam.exam_type}</Badge>
                        <Badge variant={exam.is_published ? 'default' : 'secondary'}>
                          {exam.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        {exam.subject_name && (
                          <span className="text-sm text-muted-foreground">
                            {exam.subject_name} → {exam.chapter_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/exam/${exam.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(exam.created_at)}
                    </span>
                    <span>{exam.time_limit} minutes</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-4">
          {questions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileQuestion className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No questions created yet</p>
              </CardContent>
            </Card>
          ) : (
            questions.map((question) => (
              <Card key={question.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardDescription className="text-sm text-muted-foreground mb-1">
                        {question.subject_name} → {question.chapter_name}
                      </CardDescription>
                      <CardTitle className="text-base">
                        {question.question_text.substring(0, 200)}
                        {question.question_text.length > 200 && '...'}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getDifficultyColor(question.difficulty)}>
                          {question.difficulty}
                        </Badge>
                        <Badge variant="outline">{question.question_type}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(question.created_at)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Flashcards Tab */}
        <TabsContent value="flashcards" className="space-y-4">
          {flashcards.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No flashcards created yet</p>
              </CardContent>
            </Card>
          ) : (
            flashcards.map((flashcard) => (
              <Card key={flashcard.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardDescription className="text-sm text-muted-foreground mb-1">
                        {flashcard.subject_name} → {flashcard.chapter_name}
                      </CardDescription>
                      <CardTitle className="text-base">{flashcard.front}</CardTitle>
                      <CardDescription className="mt-2">
                        {flashcard.back.substring(0, 150)}
                        {flashcard.back.length > 150 && '...'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(flashcard.created_at)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherContentHistory;
