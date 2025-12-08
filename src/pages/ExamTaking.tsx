import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";

interface Question {
  id: number;
  question_text: string;
  options: Record<string, string> | string[]; // Can be object {"A": "option1"} or array
  question_type?: string;
}

interface ExamData {
  id: number;
  title: string;
  strict_mode: boolean;
  time_limit: number;
}

export default function ExamTaking() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [exam, setExam] = useState<ExamData | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [violations, setViolations] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to convert options to array format
  const getOptionsArray = (options: Record<string, string> | string[]): Array<{key: string, value: string}> => {
    if (Array.isArray(options)) {
      return options.map((opt, idx) => ({ key: String.fromCharCode(65 + idx), value: opt }));
    }
    return Object.entries(options).map(([key, value]) => ({ key, value }));
  };

  useEffect(() => {
    startExam();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Strict mode monitoring
  useEffect(() => {
    if (!exam?.strict_mode) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolations(prev => prev + 1);
        toast.error(t('exams.tabSwitchDetected'));
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement && exam.strict_mode) {
        setViolations(prev => prev + 1);
        toast.error(t('exams.fullscreenExited'));
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // Request fullscreen on strict mode
    if (exam.strict_mode && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        toast.error(t('exams.fullscreenRequired'));
      });
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [exam]);

  const startExam = async () => {
    try {
      const response = await api.post(`/exams/${examId}/start`);
      setExam(response.data.exam);
      setAttemptId(response.data.attempt_id);
      setQuestions(response.data.questions);
      setTimeRemaining(response.data.time_limit_seconds);

      // Start timer
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      toast.success(t('exams.examStarted'));
    } catch (error: any) {
      console.error("Error starting exam:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      const errorMessage = error.response?.data?.detail || t('exams.failedToStart');
      toast.error(errorMessage);
      console.error("Error detail:", errorMessage);
      navigate("/exams");
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    if (timerRef.current) clearInterval(timerRef.current);

    try {
      // Format answers
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        question_id: parseInt(questionId),
        answer: answer
      }));

      const response = await api.post(`/exams/attempts/${attemptId}/submit`, {
        answers: formattedAnswers,
        tab_switches: violations,
        violations: []
      });

      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }

      toast.success(t('exams.examSubmitted'));
      navigate(`/exam-results/${attemptId}`);
    } catch (error: any) {
      console.error("Error submitting exam:", error);
      toast.error(error.response?.data?.detail || t('exams.failedToSubmit'));
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const answeredCount = Object.keys(answers).length;

  if (!exam || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('exams.loadingExam')}</p>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-4 sticky top-4 z-10 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold">{exam.title}</h1>
                {exam.strict_mode && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {t('exams.strictMode')}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Clock className={`h-5 w-5 ${timeRemaining < 300 ? 'text-red-500' : 'text-muted-foreground'}`} />
                  <span className={`font-mono text-lg ${timeRemaining < 300 ? 'text-red-500 font-bold' : ''}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">
                    {answeredCount}/{questions.length} {t('exams.answered')}
                  </span>
                </div>

                {exam.strict_mode && violations > 0 && (
                  <Badge variant="destructive">
                    {t('exams.violations')}: {violations}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('quiz.questionOf', { current: currentQuestion + 1, total: questions.length })}</span>
              <Badge variant="outline">{answeredCount} / {questions.length} {t('exams.complete')}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg">{question.question_text}</p>

            <RadioGroup
              value={answers[question.id] || ""}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
            >
              {getOptionsArray(question.options).map((option) => (
                <div key={option.key} className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value={option.key} id={`option-${option.key}`} />
                  <Label htmlFor={`option-${option.key}`} className="flex-1 cursor-pointer">
                    <span className="font-semibold mr-2">{option.key}.</span>
                    {option.value}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
              >
                {t('exams.previous')}
              </Button>

              <div className="flex flex-wrap gap-2">
                {questions.map((_, idx) => (
                  <Button
                    key={idx}
                    variant={currentQuestion === idx ? "default" : answers[questions[idx].id] ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setCurrentQuestion(idx)}
                    className="w-10 h-10"
                  >
                    {idx + 1}
                  </Button>
                ))}
              </div>

              {currentQuestion < questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
                >
                  {t('exams.next')}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  variant="destructive"
                  className="min-w-[120px]"
                >
                  {submitting ? t('exams.submitting') : t('exams.submitExam')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Warning for strict mode */}
        {exam.strict_mode && (
          <Card className="mt-4 border-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-yellow-800 dark:text-yellow-200">{t('exams.strictModeActive')}</p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    {t('exams.strictModeWarning')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
