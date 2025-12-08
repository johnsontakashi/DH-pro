import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Brain, Clock, Target, BookOpen, AlertCircle } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";

interface Chapter {
  id: number;
  name: string;
  subject_name?: string;
  course_name?: string;
}

export default function CreateQuiz() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [formData, setFormData] = useState({
    chapter_id: "",
    title: "",
    description: "",
    quiz_type: "practice",
    time_limit: "",
    passing_score: "70",
    max_attempts: "",
    is_active: true
  });

  useEffect(() => {
    fetchChapters();
  }, []);

  const fetchChapters = async () => {
    try {
      const response = await api.get("/subjects/chapters/all");
      setChapters(response.data);

      // Pre-fill with test data for easy testing (select first chapter)
      if (response.data && response.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          chapter_id: response.data[0].id.toString(),
          title: "Practice Quiz - " + response.data[0].name,
          description: "This is a practice quiz to test your understanding of " + response.data[0].name + ". Answer all questions to the best of your ability.",
          quiz_type: "adaptive",
          time_limit: "30",
          passing_score: "70",
          max_attempts: "3"
        }));
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
      toast.error(t('exams.failedToLoadChapters'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.chapter_id || !formData.title) {
      toast.error(t('validation.fillAllRequired'));
      return;
    }

    setLoading(true);

    try {
      const payload = {
        chapter_id: parseInt(formData.chapter_id),
        title: formData.title,
        description: formData.description || null,
        quiz_type: formData.quiz_type,
        time_limit: formData.time_limit ? parseInt(formData.time_limit) : null,
        passing_score: parseFloat(formData.passing_score),
        max_attempts: formData.max_attempts ? parseInt(formData.max_attempts) : null,
        is_active: formData.is_active
      };

      const response = await api.post("/quizzes/", payload);
      toast.success(t('quiz.quizCreatedSuccess'));
      navigate("/teacher/quizzes");
    } catch (error: any) {
      console.error("Error creating quiz:", error);
      toast.error(error.response?.data?.detail || t('quiz.failedToCreateQuiz'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{t('quiz.createNewQuiz')}</h1>
        <p className="text-muted-foreground">
          {t('quiz.configureNewQuiz')}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                {t('quiz.basicInformation')}
              </CardTitle>
              <CardDescription>{t('quiz.quizDetailsConfig')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Chapter Selection */}
              <div className="space-y-2">
                <Label htmlFor="chapter">
                  {t('common.chapter')} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.chapter_id}
                  onValueChange={(value) => setFormData({ ...formData, chapter_id: value })}
                >
                  <SelectTrigger id="chapter">
                    <SelectValue placeholder={t('exams.selectChapter')} />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters.map((chapter) => (
                      <SelectItem key={chapter.id} value={chapter.id.toString()}>
                        {chapter.name}
                        {chapter.subject_name && ` (${chapter.subject_name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quiz Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  {t('quiz.quizTitle')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder={t('quiz.quizTitlePlaceholder')}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{t('common.description')}</Label>
                <Textarea
                  id="description"
                  placeholder={t('quiz.descriptionPlaceholder')}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Quiz Type */}
              <div className="space-y-2">
                <Label htmlFor="type">{t('quiz.quizType')}</Label>
                <Select
                  value={formData.quiz_type}
                  onValueChange={(value) => setFormData({ ...formData, quiz_type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="practice">{t('quiz.practiceQuiz')}</SelectItem>
                    <SelectItem value="graded">{t('quiz.gradedQuiz')}</SelectItem>
                    <SelectItem value="adaptive">{t('quiz.adaptiveQuiz')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Quiz Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t('quiz.quizSettings')}
              </CardTitle>
              <CardDescription>{t('quiz.timeLimitsRules')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Time Limit */}
              <div className="space-y-2">
                <Label htmlFor="time_limit" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t('quiz.timeLimitMinutes')}
                </Label>
                <Input
                  id="time_limit"
                  type="number"
                  placeholder={t('quiz.leaveEmptyNoLimit')}
                  value={formData.time_limit}
                  onChange={(e) => setFormData({ ...formData, time_limit: e.target.value })}
                  min="1"
                />
                <p className="text-xs text-muted-foreground">
                  {t('quiz.untimedQuizHelp')}
                </p>
              </div>

              {/* Passing Score */}
              <div className="space-y-2">
                <Label htmlFor="passing_score">{t('exams.passingScore')}</Label>
                <Input
                  id="passing_score"
                  type="number"
                  value={formData.passing_score}
                  onChange={(e) => setFormData({ ...formData, passing_score: e.target.value })}
                  min="0"
                  max="100"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t('quiz.minimumPercentagePass')}
                </p>
              </div>

              {/* Max Attempts */}
              <div className="space-y-2">
                <Label htmlFor="max_attempts">{t('exams.maxAttempts')}</Label>
                <Input
                  id="max_attempts"
                  type="number"
                  placeholder={t('quiz.leaveEmptyUnlimited')}
                  value={formData.max_attempts}
                  onChange={(e) => setFormData({ ...formData, max_attempts: e.target.value })}
                  min="1"
                />
                <p className="text-xs text-muted-foreground">
                  {t('quiz.retakeTimesHelp')}
                </p>
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between space-x-2 pt-4 border-t">
                <Label htmlFor="is_active" className="cursor-pointer">
                  {t('quiz.activateImmediately')}
                </Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Alert */}
        <Card className="mt-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {t('quiz.aboutQuizQuestions')}
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {t('quiz.autoUse100Questions')} <Badge variant="outline">30 {t('common.beginner')}</Badge>{" "}
                  <Badge variant="outline">40 {t('common.intermediate')}</Badge>{" "}
                  <Badge variant="outline">30 {t('common.advanced')}</Badge>
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {t('quiz.randomizedSelection')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 mt-8">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('quiz.creatingQuiz')}
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                {t('quiz.createQuizButton')}
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/teacher")}
            size="lg"
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
}
