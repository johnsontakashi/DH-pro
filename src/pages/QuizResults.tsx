import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Clock, Trophy, TrendingUp, Sparkles } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { formatScoreAs20, percentageTo20, getScoreColorClass } from "@/utils/scoreUtils";

interface QuizResult {
  attempt_id: number;
  score: number;
  time_spent: number;
  is_completed: boolean;
  feedback: string;
  answers: Array<{
    question_id: number;
    question_text?: string;
    answer: string;
    is_correct: boolean;
    correct_answer: string;
    explanation?: string;
    time_spent: number;
  }>;
}

export default function QuizResults() {
  const { t } = useTranslation();
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [result, setResult] = useState<QuizResult | null>(location.state?.result || null);
  const [loading, setLoading] = useState(!location.state?.result);

  useEffect(() => {
    if (!result && attemptId) {
      const fetchResult = async () => {
        try {
          const response = await api.get(`/quizzes/attempts/${attemptId}`);
          setResult(response.data);
          setLoading(false);
        } catch (error: any) {
          console.error("Error fetching result:", error);
          toast.error(t('messages.failedToLoadQuizResults'));
          navigate("/subjects");
        }
      };

      fetchResult();
    }
  }, [attemptId, result, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('quiz.loadingResults')}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return <div>{t('quiz.noResultsAvailable')}</div>;
  }

  const totalQuestions = result.answers.length;
  const correctAnswers = result.answers.filter((a) => a.is_correct).length;
  const incorrectAnswers = totalQuestions - correctAnswers;
  const avgTimePerQuestion = result.time_spent / totalQuestions;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return t('quiz.scoreOutstanding');
    if (score >= 80) return t('quiz.scoreExcellent');
    if (score >= 70) return t('quiz.scoreGood');
    if (score >= 60) return t('quiz.scoreKeepPracticing');
    return t('quiz.scoreNeedPractice');
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Score Overview */}
      <Card className="border-2">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div
              className={`relative w-32 h-32 rounded-full flex items-center justify-center border-8 ${
                result.score >= 70 ? "border-green-500" : "border-red-500"
              }`}
            >
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColorClass(percentageTo20(result.score))}`}>
                  {formatScoreAs20(result.score, 0)}
                </div>
                <div className="text-xs text-muted-foreground">{t('common.score')}</div>
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl">{getScoreMessage(result.score)}</CardTitle>
          <CardDescription className="text-base">{result.feedback}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{correctAnswers}</div>
                <div className="text-sm text-muted-foreground">{t('quiz.correct')}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{incorrectAnswers}</div>
                <div className="text-sm text-muted-foreground">{t('quiz.incorrect')}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{formatTime(result.time_spent)}</div>
                <div className="text-sm text-muted-foreground">{t('quiz.totalTime')}</div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>{t('quiz.accuracy')}</span>
              <span className="font-semibold">{formatScoreAs20(result.score)}</span>
            </div>
            <Progress value={result.score} className="h-3" />
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {t('quiz.averagePerQuestion', { time: formatTime(Math.floor(avgTimePerQuestion)) })}
          </div>
        </CardContent>
      </Card>

      {/* Adaptive Learning Feedback */}
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertTitle>{t('quizResults.nextSteps')}</AlertTitle>
        <AlertDescription>
          {result.score >= 85
            ? t('quizResults.nextDifficultyHigh')
            : result.score >= 70
            ? t('quizResults.nextDifficultyMedium')
            : t('quizResults.nextDifficultyLow')}
        </AlertDescription>
      </Alert>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <CardTitle>{t('quiz.questionBreakdown')}</CardTitle>
          <CardDescription>{t('quiz.reviewAnswers')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.answers.map((answer, index) => (
            <div
              key={answer.question_id}
              className={`p-4 rounded-lg border-2 ${
                answer.is_correct
                  ? "border-green-200 bg-green-50 dark:bg-green-950/20"
                  : "border-red-200 bg-red-50 dark:bg-red-950/20"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {answer.is_correct ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-semibold">{t('quiz.questionNumber', { number: index + 1 })}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatTime(answer.time_spent)}
                </span>
              </div>

              <div className="ml-7 space-y-2">
                {answer.question_text && (
                  <div className="text-sm font-medium text-foreground">
                    {answer.question_text}
                  </div>
                )}

                <div className="text-sm">
                  <span className="font-medium">{t('quiz.yourAnswer')}:</span>{" "}
                  <span className={answer.is_correct ? "text-green-700" : "text-red-700"}>
                    {answer.answer || t('quiz.notAnswered')}
                  </span>
                </div>

                {!answer.is_correct && (
                  <div className="text-sm">
                    <span className="font-medium">{t('quiz.correctAnswer')}:</span>{" "}
                    <span className="text-green-700">{answer.correct_answer}</span>
                  </div>
                )}

                {answer.explanation && (
                  <div className="text-sm bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md mt-2">
                    <span className="font-medium text-blue-700 dark:text-blue-400">
                      {t('quiz.explanation')}:
                    </span>{" "}
                    <span className="text-blue-900 dark:text-blue-200">
                      {answer.explanation}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => navigate("/subjects")}>
          {t('quiz.backToSubjects')}
        </Button>
        <Button onClick={() => navigate(`/quiz/${result.attempt_id}`)}>
          {t('quiz.retakeQuiz')}
        </Button>
      </div>
    </div>
  );
}
