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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Clock, Target, AlertTriangle, Calendar } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";

interface Chapter {
  id: number;
  name: string;
  subject_name?: string;
}

export default function CreateExam() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    exam_type: "midterm",
    chapter_id: "",
    time_limit: "90",
    passing_score: "60",
    total_points: "100",
    strict_mode: true,
    available_from: "",
    available_until: "",
    max_attempts: "1",
    shuffle_questions: true,
    show_results_immediately: false,
    question_count: "30"
  });

  useEffect(() => {
    fetchChapters();
    // Set default dates (today and 7 days from now)
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setFormData(prev => ({
      ...prev,
      available_from: now.toISOString().slice(0, 16),
      available_until: nextWeek.toISOString().slice(0, 16)
    }));
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
          title: "Midterm Exam - " + response.data[0].name,
          description: "This exam covers all topics from " + response.data[0].name + ". You have 90 minutes to complete 30 questions. Good luck!",
          exam_type: "midterm"
        }));
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
      toast.error(t('exams.failedToLoadChapters'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.chapter_id || !formData.title || !formData.available_from || !formData.available_until) {
      toast.error(t('validation.fillAllRequired'));
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        exam_type: formData.exam_type,
        chapter_id: parseInt(formData.chapter_id),
        time_limit: parseInt(formData.time_limit),
        passing_score: parseFloat(formData.passing_score),
        total_points: parseFloat(formData.total_points),
        strict_mode: formData.strict_mode,
        available_from: new Date(formData.available_from).toISOString(),
        available_until: new Date(formData.available_until).toISOString(),
        max_attempts: parseInt(formData.max_attempts),
        shuffle_questions: formData.shuffle_questions,
        show_results_immediately: formData.show_results_immediately,
        question_count: parseInt(formData.question_count),
        questions_config: {
          beginner: Math.floor(parseInt(formData.question_count) * 0.3),
          medium: Math.floor(parseInt(formData.question_count) * 0.5),
          advanced: Math.floor(parseInt(formData.question_count) * 0.2)
        }
      };

      await api.post("/exams/", payload);
      toast.success(t('exams.examCreatedSuccess'));
      navigate("/teacher/exams");
    } catch (error: any) {
      console.error("Error creating exam:", error);
      toast.error(error.response?.data?.detail || t('exams.failedToCreateExam'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{t('exams.createNewExam')}</h1>
        <p className="text-muted-foreground">
          {t('exams.createExamDescription')}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('exams.examInformation')}
              </CardTitle>
              <CardDescription>{t('exams.basicExamDetails')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Exam Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  {t('exams.examTitle')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder={t('exams.examTitlePlaceholder')}
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
                  placeholder={t('exams.descriptionPlaceholder')}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Exam Type */}
              <div className="space-y-2">
                <Label htmlFor="exam_type">{t('exams.examType')}</Label>
                <Select
                  value={formData.exam_type}
                  onValueChange={(value) => setFormData({ ...formData, exam_type: value })}
                >
                  <SelectTrigger id="exam_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="midterm">{t('exams.midtermExam')}</SelectItem>
                    <SelectItem value="final">{t('exams.finalExam')}</SelectItem>
                    <SelectItem value="unit_test">{t('exams.unitTest')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

              {/* Question Count */}
              <div className="space-y-2">
                <Label htmlFor="question_count">{t('exams.numberOfQuestions')}</Label>
                <Input
                  id="question_count"
                  type="number"
                  value={formData.question_count}
                  onChange={(e) => setFormData({ ...formData, question_count: e.target.value })}
                  min="10"
                  max="100"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t('exams.questionDistribution')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t('exams.examSettings')}
              </CardTitle>
              <CardDescription>{t('exams.timeLimitsAndScoring')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Time Limit */}
              <div className="space-y-2">
                <Label htmlFor="time_limit" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t('exams.timeLimit')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="time_limit"
                  type="number"
                  value={formData.time_limit}
                  onChange={(e) => setFormData({ ...formData, time_limit: e.target.value })}
                  min="1"
                  required
                />
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
              </div>

              {/* Total Points */}
              <div className="space-y-2">
                <Label htmlFor="total_points">{t('exams.totalPoints')}</Label>
                <Input
                  id="total_points"
                  type="number"
                  value={formData.total_points}
                  onChange={(e) => setFormData({ ...formData, total_points: e.target.value })}
                  min="1"
                  required
                />
              </div>

              {/* Max Attempts */}
              <div className="space-y-2">
                <Label htmlFor="max_attempts">{t('exams.maxAttempts')}</Label>
                <Input
                  id="max_attempts"
                  type="number"
                  value={formData.max_attempts}
                  onChange={(e) => setFormData({ ...formData, max_attempts: e.target.value })}
                  min="1"
                  max="5"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Schedule Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('exams.examSchedule')}
              </CardTitle>
              <CardDescription>{t('exams.setAvailabilityWindow')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Available From */}
              <div className="space-y-2">
                <Label htmlFor="available_from">
                  {t('exams.availableFrom')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="available_from"
                  type="datetime-local"
                  value={formData.available_from}
                  onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                  required
                />
              </div>

              {/* Available Until */}
              <div className="space-y-2">
                <Label htmlFor="available_until">
                  {t('exams.availableUntil')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="available_until"
                  type="datetime-local"
                  value={formData.available_until}
                  onChange={(e) => setFormData({ ...formData, available_until: e.target.value })}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Options Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-4" />
                {t('exams.securityOptions')}
              </CardTitle>
              <CardDescription>{t('exams.proctoringSettings')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Strict Mode */}
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="strict_mode" className="cursor-pointer">
                    {t('exams.strictMode')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('exams.strictModeDescription')}
                  </p>
                </div>
                <Switch
                  id="strict_mode"
                  checked={formData.strict_mode}
                  onCheckedChange={(checked) => setFormData({ ...formData, strict_mode: checked })}
                />
              </div>

              {/* Shuffle Questions */}
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="shuffle_questions" className="cursor-pointer">
                    {t('exams.shuffleQuestions')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('exams.shuffleQuestionsDescription')}
                  </p>
                </div>
                <Switch
                  id="shuffle_questions"
                  checked={formData.shuffle_questions}
                  onCheckedChange={(checked) => setFormData({ ...formData, shuffle_questions: checked })}
                />
              </div>

              {/* Show Results Immediately */}
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="show_results_immediately" className="cursor-pointer">
                    {t('exams.showResultsImmediately')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('exams.showResultsDescription')}
                  </p>
                </div>
                <Switch
                  id="show_results_immediately"
                  checked={formData.show_results_immediately}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_results_immediately: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strict Mode Warning */}
        {formData.strict_mode && (
          <Alert className="mt-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              {t('exams.strictModeWarning')}
            </AlertDescription>
          </Alert>
        )}

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
                {t('exams.creatingExam')}
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                {t('exams.createExamButton')}
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
