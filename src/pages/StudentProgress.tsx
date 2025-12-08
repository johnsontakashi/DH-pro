import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PersonalizedHeader from "@/components/PersonalizedHeader";
import {
  TrendingUp, Target, Award, Brain, AlertCircle, CheckCircle2, BookOpen, Zap
} from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";

interface ChapterProgress {
  chapter_id: number;
  chapter_name: string;
  average_score: number;
  total_questions_attempted: number;
  bloom_progress: Record<string, number>;
  difficulty_progress: Record<string, number>;
  mastery_level: number;
}

interface Feedback {
  id: number;
  feedback_type: string;
  summary: string;
  detailed_feedback: string;
  recommendations: any[];
  created_at: string;
}

export default function StudentProgress() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ChapterProgress[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<ChapterProgress | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // In a real implementation, these would be actual endpoints
      // For now, we'll use mock data structure
      const [progressRes, feedbackRes] = await Promise.all([
        api.get("/analytics/my-progress").catch(() => ({ data: [] })),
        api.get("/analytics/my-feedback").catch(() => ({ data: [] }))
      ]);

      setProgress(progressRes.data);
      setFeedback(feedbackRes.data);
      if (progressRes.data.length > 0) {
        setSelectedChapter(progressRes.data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching progress:", error);
      toast.error(t('messages.failedToLoadProgressData'));
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getMasteryBadge = (level: number) => {
    if (level >= 80) return <Badge className="bg-green-500">{t('progress.masteryExpert')}</Badge>;
    if (level >= 60) return <Badge className="bg-blue-500">{t('progress.masteryProficient')}</Badge>;
    if (level >= 40) return <Badge className="bg-yellow-500">{t('progress.masteryDeveloping')}</Badge>;
    return <Badge variant="outline">{t('progress.masteryBeginner')}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('progress.loadingProgress')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <PersonalizedHeader />
        <p className="text-muted-foreground mt-2">{t('progress.subtitle')}</p>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('progress.overallAverage')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.length > 0
                ? `${(progress.reduce((sum, p) => sum + p.average_score, 0) / progress.length).toFixed(1)}%`
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">{t('progress.acrossAllChapters')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('progress.chaptersStarted')}</CardTitle>
            <BookOpen className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.length}</div>
            <p className="text-xs text-muted-foreground">{t('progress.outOfTotalChapters')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('progress.questionsAnswered')}</CardTitle>
            <Brain className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.reduce((sum, p) => sum + p.total_questions_attempted, 0)}
            </div>
            <p className="text-xs text-muted-foreground">{t('progress.totalPracticeQuestions')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('progress.masteryLevel')}</CardTitle>
            <Award className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.length > 0
                ? getMasteryBadge(progress.reduce((sum, p) => sum + p.mastery_level, 0) / progress.length)
                : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="chapters" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chapters">{t('progress.chapterProgress')}</TabsTrigger>
          <TabsTrigger value="skills">{t('progress.bloomsTaxonomy')}</TabsTrigger>
          <TabsTrigger value="feedback">{t('progress.personalizedFeedback')}</TabsTrigger>
        </TabsList>

        {/* Chapter Progress Tab */}
        <TabsContent value="chapters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t('progress.chapterByChapterProgress')}
              </CardTitle>
              <CardDescription>{t('progress.performanceAcrossTopics')}</CardDescription>
            </CardHeader>
            <CardContent>
              {progress.length === 0 ? (
                <div className="text-center py-12">
                  <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    {t('progress.noQuizzesYet')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {progress.map((chapter) => (
                    <div key={chapter.chapter_id} className="space-y-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{chapter.chapter_name}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl font-bold ${getScoreColor(chapter.average_score)}`}>
                            {chapter.average_score.toFixed(1)}%
                          </span>
                          {getMasteryBadge(chapter.mastery_level)}
                        </div>
                      </div>
                      <Progress value={chapter.average_score} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {t('progress.questionsAttempted', { count: chapter.total_questions_attempted })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bloom's Taxonomy Tab */}
        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                {t('progress.cognitiveSkillsAnalysis')}
              </CardTitle>
              <CardDescription>{t('progress.performanceAcrossThinkingLevels')}</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedChapter && selectedChapter.bloom_progress ? (
                <div className="space-y-4">
                  {Object.entries(selectedChapter.bloom_progress).map(([level, score]) => {
                    const percentage = score * 100;
                    return (
                      <div key={level} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{t(`progress.bloom.${level}`)}</span>
                          <span className={`font-bold ${getScoreColor(percentage)}`}>
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {t('progress.takeQuizzesForBloomsAnalysis')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Difficulty Levels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                {t('progress.difficultyLevelPerformance')}
              </CardTitle>
              <CardDescription>{t('progress.performanceAtDifficultyLevels')}</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedChapter && selectedChapter.difficulty_progress ? (
                <div className="space-y-4">
                  {Object.entries(selectedChapter.difficulty_progress).map(([level, score]) => {
                    const percentage = score * 100;
                    return (
                      <div key={level} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{t(`common.${level}`)}</span>
                          <span className={`font-bold ${getScoreColor(percentage)}`}>
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {t('progress.takeQuizzesForDifficultyAnalysis')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                {t('progress.personalizedRecommendations')}
              </CardTitle>
              <CardDescription>{t('progress.aiPoweredInsights')}</CardDescription>
            </CardHeader>
            <CardContent>
              {feedback.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    {t('progress.completeQuizzesForFeedback')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedback.map((fb) => (
                    <div key={fb.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold">{fb.summary}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{fb.detailed_feedback}</p>
                        </div>
                      </div>

                      {fb.recommendations && fb.recommendations.length > 0 && (
                        <div className="pl-8 space-y-2">
                          <p className="text-sm font-medium">{t('progress.recommendations')}:</p>
                          <ul className="space-y-1">
                            {fb.recommendations.map((rec: any, idx: number) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                                <span>{rec.text || rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
