import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Clock, CheckCircle, XCircle, TrendingUp, Sparkles } from "lucide-react";
import api from "@/lib/axios";

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  difficulty: string;
  bloom_level: string;
  options?: { [key: string]: string };
}

interface Quiz {
  id: number;
  chapter_id: number;
  title: string;
  description: string;
  quiz_type: string;
  time_limit: number | null;
  passing_score: number;
}

interface QuizStartResponse {
  attempt_id: number;
  quiz: Quiz;
  questions: Question[];
}

interface Answer {
  question_id: number;
  answer: string;
  time_spent: number;
}

export default function QuizTaking() {
  const { t } = useTranslation();
  const { chapterId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, string>>(new Map());
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [questionTimes, setQuestionTimes] = useState<Map<number, number>>(new Map());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Fetch quiz and start attempt
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        // Get quizzes for this chapter
        const response = await api.get(`/quizzes/chapter/${chapterId}`);
        const quizzes = response.data;

        if (!quizzes || quizzes.length === 0) {
          toast.error(t('quizTaking.noQuizzesAvailable'));
          navigate("/subjects");
          return;
        }

        // Start or resume quiz attempt
        // Backend automatically resumes ongoing attempts if they exist
        const startResponse = await api.post<QuizStartResponse>(`/quizzes/${quizzes[0].id}/start`);

        setQuiz(startResponse.data.quiz);
        setAttemptId(startResponse.data.attempt_id);
        setQuestions(startResponse.data.questions);
        setQuestionStartTime(Date.now());
        setLoading(false);
      } catch (error: any) {
        console.error("Error fetching quiz:", error);
        toast.error(error.response?.data?.detail || t('quizTaking.failedToLoad'));
        navigate("/subjects");
      }
    };

    fetchQuiz();
  }, [chapterId, navigate, t]);

  // Timer for quiz duration
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check time limit
  useEffect(() => {
    if (quiz?.time_limit && elapsedTime >= quiz.time_limit * 60) {
      toast.warning(t('quizTaking.timesUp'));
      handleSubmit();
    }
  }, [elapsedTime, quiz]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerChange = (value: string) => {
    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, value);
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    // Record time spent on this question
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const newTimes = new Map(questionTimes);
    newTimes.set(currentQuestion.id, timeSpent);
    setQuestionTimes(newTimes);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionStartTime(Date.now());
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setQuestionStartTime(Date.now());
    }
  };

  const handleSubmit = async () => {
    // Record time for last question
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const finalTimes = new Map(questionTimes);
    finalTimes.set(currentQuestion.id, timeSpent);

    // Build answers array
    const answersArray: Answer[] = questions.map((q) => ({
      question_id: q.id,
      answer: answers.get(q.id) || "",
      time_spent: finalTimes.get(q.id) || 0,
    }));

    // Check if all questions are answered
    const unanswered = answersArray.filter((a) => !a.answer).length;
    if (unanswered > 0) {
      const confirm = window.confirm(
        t('quizTaking.unansweredQuestions', { count: unanswered })
      );
      if (!confirm) return;
    }

    setSubmitting(true);

    try {
      const response = await api.post(`/quizzes/attempts/${attemptId}/submit`, {
        answers: answersArray,
      });

      toast.success(t('quizTaking.submitted'));
      navigate(`/quiz-results/${attemptId}`, { state: { result: response.data } });
    } catch (error: any) {
      console.error("Error submitting quiz:", error);
      toast.error(error.response?.data?.detail || t('quizTaking.failedToSubmit'));
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('quizTaking.loadingQuiz')}</p>
        </div>
      </div>
    );
  }

  if (!quiz || !currentQuestion) {
    return <div>{t('quizTaking.noQuestions')}</div>;
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{quiz.title}</CardTitle>
              <CardDescription>{quiz.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="font-mono">{formatTime(elapsedTime)}</span>
              {quiz.time_limit && (
                <span className="text-xs">/ {quiz.time_limit} min</span>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {t('quizTaking.questionOf', { current: currentQuestionIndex + 1, total: questions.length })}
              </span>
              <span className="capitalize">
                {currentQuestion.difficulty} • {currentQuestion.bloom_level}
              </span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Adaptive Learning Alert - show only on first question */}
          {currentQuestionIndex === 0 && quiz.quiz_type === 'adaptive' && (
            <Alert className="mt-4">
              <TrendingUp className="h-4 w-4" />
              <AlertTitle>{t('quizTaking.adaptiveLearning')}</AlertTitle>
              <AlertDescription>
                {t('quizTaking.adaptiveLearningDescription')}
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="min-h-[200px]">
            <h3 className="text-lg font-semibold mb-4">
              {currentQuestion.question_text}
            </h3>

            {currentQuestion.options && (
              <RadioGroup
                value={answers.get(currentQuestion.id) || ""}
                onValueChange={handleAnswerChange}
                className="space-y-3"
              >
                {Object.entries(currentQuestion.options).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer"
                  >
                    <RadioGroupItem value={key} id={`option-${key}`} />
                    <Label
                      htmlFor={`option-${key}`}
                      className="flex-1 cursor-pointer"
                    >
                      <span className="font-semibold mr-2">{key}.</span>
                      {value}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>

          {/* Question Navigator */}
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-2">{t('quizTaking.jumpToQuestion')}</p>
            <div className="flex flex-wrap gap-2">
              {questions.map((q, index) => {
                const isAnswered = answers.has(q.id);
                const isCurrent = index === currentQuestionIndex;

                return (
                  <Button
                    key={q.id}
                    variant={isCurrent ? "default" : isAnswered ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => {
                      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
                      const newTimes = new Map(questionTimes);
                      newTimes.set(currentQuestion.id, timeSpent);
                      setQuestionTimes(newTimes);
                      setCurrentQuestionIndex(index);
                      setQuestionStartTime(Date.now());
                    }}
                    className="w-10 h-10 relative"
                  >
                    {index + 1}
                    {isAnswered && !isCurrent && (
                      <CheckCircle className="absolute -top-1 -right-1 h-3 w-3 text-green-500" />
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            {t('quizTaking.previous')}
          </Button>

          <div className="text-sm text-muted-foreground">
            {t('quizTaking.answeredCount', { answered: answers.size, total: questions.length })}
          </div>

          {currentQuestionIndex < questions.length - 1 ? (
            <Button onClick={handleNext}>{t('quizTaking.next')}</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? t('quizTaking.submitting') : t('quizTaking.submitQuiz')}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
