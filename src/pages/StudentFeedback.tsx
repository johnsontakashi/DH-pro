import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessagesSquare,
  Calendar,
  BookOpen,
  TrendingUp,
  CheckCircle,
  CheckCircle2,
  Lightbulb,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

interface FeedbackItem {
  chapter: string;
  reason: string;
  action?: string;
  priority?: number;
}

interface Feedback {
  id: number;
  student_id: number;
  chapter_id: number;
  chapter_name?: string;
  subject_name?: string;
  feedback_type: string;
  feedback: string;
  summary: string;
  strengths: FeedbackItem[];
  weaknesses: FeedbackItem[];
  recommendations: FeedbackItem[];
  created_at: string;
}

const StudentFeedback = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFeedback();
    }
  }, [user]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/analytics/feedback/student/${user?.id}`);
      setFeedbacks(response.data);
    } catch (error) {
      console.error('Error loading feedback:', error);
      toast.error(t('feedback.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'individual':
        return 'bg-blue-500';
      case 'class':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Group feedbacks by type (assignment, quiz, exam, general)
  const assignmentFeedbacks = feedbacks.filter(f => f.feedback_type === 'assignment');
  const quizFeedbacks = feedbacks.filter(f => f.feedback_type === 'quiz');
  const examFeedbacks = feedbacks.filter(f => f.feedback_type === 'exam');
  const generalFeedbacks = feedbacks.filter(f => !['assignment', 'quiz', 'exam'].includes(f.feedback_type));

  // Helper function to render feedback card
  const renderFeedbackCard = (feedback: Feedback) => (
    <Card key={feedback.id} className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">
              {feedback.subject_name && feedback.chapter_name
                ? `${feedback.subject_name} - ${feedback.chapter_name}`
                : feedback.subject_name || feedback.chapter_name || 'Feedback'}
            </CardTitle>
            <div className="flex items-center gap-4">
              <CardDescription className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(feedback.created_at)}
              </CardDescription>
              <Badge className={getTypeColor(feedback.feedback_type)}>
                {feedback.feedback_type}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        {feedback.summary && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {feedback.summary}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Feedback */}
        <div className="prose prose-sm max-w-none">
          <p className="text-foreground whitespace-pre-wrap">{feedback.feedback}</p>
        </div>

        {/* Strengths */}
        {feedback.strengths && feedback.strengths.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2 text-green-600">
              <TrendingUp className="h-4 w-4" />
              {t('feedback.yourStrengths')}
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {feedback.strengths.map((strength, index) => (
                <li key={index} className="text-muted-foreground">
                  <strong>{strength.chapter}:</strong> {strength.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas for Improvement */}
        {feedback.weaknesses && feedback.weaknesses.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2 text-orange-600">
              <Target className="h-4 w-4" />
              {t('feedback.areasForImprovement')}
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {feedback.weaknesses.map((weakness, index) => (
                <li key={index} className="text-muted-foreground">
                  <strong>{weakness.chapter}:</strong> {weakness.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {feedback.recommendations && feedback.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2 text-blue-600">
              <Lightbulb className="h-4 w-4" />
              {t('feedback.recommendations')}
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {feedback.recommendations.map((recommendation, index) => (
                <li key={index} className="text-muted-foreground">
                  <strong>{recommendation.action || recommendation.chapter}:</strong> {recommendation.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessagesSquare className="h-8 w-8" />
            {t('feedback.myFeedback')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('feedback.personalizedFromTeachers')}
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {t('feedback.totalFeedback', { count: feedbacks.length })}
        </Badge>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">{t('feedback.loadingFeedback')}</p>
          </CardContent>
        </Card>
      ) : feedbacks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessagesSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('feedback.noFeedbackYet')}</h3>
            <p className="text-muted-foreground">
              {t('feedback.noFeedbackMessage')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">{t('feedback.allFeedback')} ({feedbacks.length})</TabsTrigger>
            <TabsTrigger value="assignments">{t('feedback.assignments')} ({assignmentFeedbacks.length})</TabsTrigger>
            <TabsTrigger value="quizzes">{t('feedback.quizzes')} ({quizFeedbacks.length})</TabsTrigger>
            <TabsTrigger value="exams">{t('feedback.exams')} ({examFeedbacks.length})</TabsTrigger>
            {generalFeedbacks.length > 0 && (
              <TabsTrigger value="general">{t('feedback.general')} ({generalFeedbacks.length})</TabsTrigger>
            )}
          </TabsList>

          {/* All Feedback Tab */}
          <TabsContent value="all" className="space-y-4">
            {feedbacks.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessagesSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t('feedback.noFeedbackAvailable')}</p>
                </CardContent>
              </Card>
            ) : (
              feedbacks.map(renderFeedbackCard)
            )}
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-4">
            {assignmentFeedbacks.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t('feedback.noAssignmentFeedback')}</p>
                </CardContent>
              </Card>
            ) : (
              assignmentFeedbacks.map(renderFeedbackCard)
            )}
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes" className="space-y-4">
            {quizFeedbacks.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t('feedback.noQuizFeedback')}</p>
                </CardContent>
              </Card>
            ) : (
              quizFeedbacks.map(renderFeedbackCard)
            )}
          </TabsContent>

          {/* Exams Tab */}
          <TabsContent value="exams" className="space-y-4">
            {examFeedbacks.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t('feedback.noExamFeedback')}</p>
                </CardContent>
              </Card>
            ) : (
              examFeedbacks.map(renderFeedbackCard)
            )}
          </TabsContent>

          {/* General Feedback Tab */}
          {generalFeedbacks.length > 0 && (
            <TabsContent value="general" className="space-y-4">
              {generalFeedbacks.map(renderFeedbackCard)}
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
};

export default StudentFeedback;
