import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, Trophy, Clock } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatScoreAs20, percentageTo20 } from "@/utils/scoreUtils";

interface Answer {
  question_id: number;
  question_text: string;
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
}

interface ExamResult {
  id: number;
  exam: {
    title: string;
    exam_type: string;
    passing_score: number;
    strict_mode: boolean;
  };
  score: number;
  passed: boolean;
  completed_at: string;
  time_taken_minutes: number;
  violations_count: number;
  flagged_for_review: boolean;
  answers: Answer[];
}

export default function ExamResults() {
  const { t } = useTranslation();
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await api.get(`/exams/attempts/${attemptId}`);
      setResult(response.data);
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching results:", error);

      // Check if it's a 403 error (results not available yet)
      if (error.response?.status === 403) {
        toast.error(t('examResults.resultsNotAvailable') || 'Results are not available yet. Your teacher will release them soon.');
      } else {
        toast.error(t('examResults.failedToLoad'));
      }

      navigate("/exams");
    }
  };

  if (loading || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('examResults.loadingResults')}</p>
        </div>
      </div>
    );
  }

  const correctAnswers = result.answers.filter(a => a.is_correct).length;
  const totalQuestions = result.answers.length;

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate("/exams")}>
          ← {t('examResults.backToExams')}
        </Button>
      </div>

      {/* Score Card */}
      <Card className={`mb-6 ${result.passed ? 'border-green-500' : 'border-red-500'}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {result.passed ? (
              <Trophy className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-3xl">{result.exam.title}</CardTitle>
          <CardDescription>
            {result.passed ? t('examResults.passed') : t('examResults.failed')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 border rounded-lg">
              <div className="text-3xl font-bold text-primary">{formatScoreAs20(result.score)}</div>
              <div className="text-sm text-muted-foreground">{t('examResults.yourScore')}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">{correctAnswers}/{totalQuestions}</div>
              <div className="text-sm text-muted-foreground">{t('examResults.correctAnswers')}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-5 w-5" />
                <span className="text-2xl font-bold">{result.time_taken_minutes}</span>
              </div>
              <div className="text-sm text-muted-foreground">{t('examResults.minutesTaken')}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">{formatScoreAs20(result.exam.passing_score)}</div>
              <div className="text-sm text-muted-foreground">{t('examResults.passingScore')}</div>
            </div>
          </div>

          {result.exam.strict_mode && (
            <div className={`mt-4 p-4 rounded-lg ${result.flagged_for_review ? 'bg-red-50 dark:bg-red-950/20 border border-red-200' : 'bg-green-50 dark:bg-green-950/20 border border-green-200'}`}>
              <div className="flex items-center gap-2">
                {result.flagged_for_review ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-800 dark:text-red-200">{t('examResults.flaggedForReview')}</p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {t('examResults.violationsDetected', { count: result.violations_count })}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800 dark:text-green-200">{t('examResults.noViolations')}</p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {t('examResults.noViolationsDesc')}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {result.completed_at && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {t('examResults.completedOn', { date: format(new Date(result.completed_at), "MMM d, yyyy 'at' HH:mm") })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Review */}
      <Card>
        <CardHeader>
          <CardTitle>{t('examResults.questionReview')}</CardTitle>
          <CardDescription>{t('examResults.reviewDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.answers.map((answer, idx) => (
            <div
              key={idx}
              className={`border rounded-lg p-4 ${
                answer.is_correct
                  ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20'
                  : 'border-red-200 bg-red-50/50 dark:bg-red-950/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {answer.is_correct ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{t('examResults.questionNumber', { number: idx + 1 })}</h4>
                    <Badge variant={answer.is_correct ? "default" : "destructive"}>
                      {answer.is_correct ? t('examResults.correct') : t('examResults.incorrect')}
                    </Badge>
                  </div>
                  <p className="text-sm">{answer.question_text}</p>

                  <div className="space-y-1 text-sm">
                    <div className={answer.is_correct ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
                      <strong>{t('examResults.yourAnswer')}:</strong> {answer.student_answer}
                    </div>
                    {!answer.is_correct && (
                      <div className="text-green-700 dark:text-green-300">
                        <strong>{t('examResults.correctAnswer')}:</strong> {answer.correct_answer}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <Button onClick={() => navigate("/exams")} size="lg">
          {t('examResults.backToExams')}
        </Button>
      </div>
    </div>
  );
}
