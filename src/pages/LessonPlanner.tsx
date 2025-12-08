import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Clock, BookOpen, CheckCircle2 } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";

export default function LessonPlanner() {
  const { t } = useTranslation();
  const [generating, setGenerating] = useState(false);
  const [lessonPlan, setLessonPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    chapter_id: "",
    duration_minutes: 60,
    student_level: "undergraduate",
    learning_objectives: "",
    additional_notes: ""
  });

  const generateLessonPlan = async () => {
    if (!formData.chapter_id) {
      toast.error(t('lessonPlanner.selectChapterError'));
      return;
    }

    setGenerating(true);

    try {
      const objectives = formData.learning_objectives
        ? formData.learning_objectives.split("\n").filter(o => o.trim())
        : [];

      const response = await api.post("/lesson-plans/generate-ai", {
        chapter_id: parseInt(formData.chapter_id),
        duration_minutes: formData.duration_minutes,
        learning_objectives: objectives,
        student_level: formData.student_level,
        additional_notes: formData.additional_notes || null
      });

      setLessonPlan(response.data);
      toast.success(t('lessonPlanner.planGenerated'));
    } catch (error: any) {
      console.error("Error generating lesson plan:", error);
      toast.error(error.response?.data?.detail || t('lessonPlanner.failedToGenerate'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{t('lessonPlanner.title')}</h1>
        <p className="text-muted-foreground">
          {t('lessonPlanner.description')}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {t('lessonPlanner.generatePlan')}
            </CardTitle>
            <CardDescription>{t('lessonPlanner.configurePlan')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chapter">{t('lessonPlanner.chapterId')}</Label>
              <Input
                id="chapter"
                type="number"
                placeholder={t('lessonPlanner.enterChapterId')}
                value={formData.chapter_id}
                onChange={(e) => setFormData({ ...formData, chapter_id: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">{t('lessonPlanner.duration')}</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">{t('lessonPlanner.studentLevel')}</Label>
              <Select
                value={formData.student_level}
                onValueChange={(value) => setFormData({ ...formData, student_level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="undergraduate">{t('lessonPlanner.undergraduate')}</SelectItem>
                  <SelectItem value="graduate">{t('lessonPlanner.graduate')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="objectives">{t('lessonPlanner.learningObjectives')}</Label>
              <Textarea
                id="objectives"
                placeholder={t('lessonPlanner.objectivesPlaceholder')}
                rows={4}
                value={formData.learning_objectives}
                onChange={(e) => setFormData({ ...formData, learning_objectives: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('lessonPlanner.additionalNotes')}</Label>
              <Textarea
                id="notes"
                placeholder={t('lessonPlanner.notesPlaceholder')}
                rows={3}
                value={formData.additional_notes}
                onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
              />
            </div>

            <Button
              onClick={generateLessonPlan}
              disabled={generating}
              className="w-full"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('lessonPlanner.generating')}
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  {t('lessonPlanner.generateAIPlan')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Lesson Plan Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t('lessonPlanner.generatedPlan')}
            </CardTitle>
            <CardDescription>{t('lessonPlanner.aiGeneratedPlan')}</CardDescription>
          </CardHeader>
          <CardContent>
            {!lessonPlan ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('lessonPlanner.generateToSeeResults')}</p>
              </div>
            ) : (
              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                <div>
                  <h3 className="font-bold text-lg mb-2">{lessonPlan.title}</h3>
                  <p className="text-sm text-muted-foreground">{lessonPlan.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{t('lessonPlanner.durationMinutes', { minutes: lessonPlan.duration_minutes })}</span>
                  </div>
                </div>

                {lessonPlan.objectives && lessonPlan.objectives.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('lessonPlanner.learningObjectivesSection')}</h4>
                    <ul className="space-y-1">
                      {lessonPlan.objectives.map((obj: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                          <span>{obj.description} <Badge className="ml-2 text-xs">{obj.bloom_level}</Badge></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {lessonPlan.introduction && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('lessonPlanner.introduction')}</h4>
                    <p className="text-sm whitespace-pre-wrap">{lessonPlan.introduction}</p>
                  </div>
                )}

                {lessonPlan.main_content && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('lessonPlanner.mainContent')}</h4>
                    <p className="text-sm whitespace-pre-wrap">{lessonPlan.main_content}</p>
                  </div>
                )}

                {lessonPlan.activities && lessonPlan.activities.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('lessonPlanner.activities')}</h4>
                    <div className="space-y-3">
                      {lessonPlan.activities.map((activity: any, idx: number) => (
                        <div key={idx} className="border-l-2 border-primary pl-3">
                          <p className="font-medium text-sm">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{activity.description}</p>
                          <span className="text-xs text-muted-foreground">{t('lessonPlanner.activityDuration', { duration: activity.duration })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {lessonPlan.assessment && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('lessonPlanner.assessment')}</h4>
                    <p className="text-sm whitespace-pre-wrap">{lessonPlan.assessment}</p>
                  </div>
                )}

                {lessonPlan.homework && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('lessonPlanner.homework')}</h4>
                    <p className="text-sm whitespace-pre-wrap">{lessonPlan.homework}</p>
                  </div>
                )}

                {lessonPlan.materials_needed && lessonPlan.materials_needed.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('lessonPlanner.materialsNeeded')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {lessonPlan.materials_needed.map((material: string, idx: number) => (
                        <Badge key={idx} variant="outline">{material}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
