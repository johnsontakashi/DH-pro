import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import PersonalizedHeader from "@/components/PersonalizedHeader";
import {
  Users, TrendingUp, BookOpen, Award,
  Brain, AlertCircle, CheckCircle2, Download, FileSpreadsheet, FileText, Loader2
} from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";

interface ClassOverview {
  total_students: number;
  avg_class_score: number;
  total_quizzes_taken: number;
  total_assignments: number;
  recent_activity: any[];
}

interface StudentPerformance {
  student_id: number;
  student_name: string;
  student_email: string;
  avg_score: number;
  quizzes_taken: number;
  assignments_submitted: number;
  current_level: number;
}

interface ChapterAnalytics {
  chapter_id: number;
  chapter_name: string;
  total_students: number;
  avg_score: number;
  completion_rate: number;
  weak_areas: string[];
}

export default function TeacherAnalytics() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [classOverview, setClassOverview] = useState<ClassOverview | null>(null);
  const [students, setStudents] = useState<StudentPerformance[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [chapterAnalytics, setChapterAnalytics] = useState<ChapterAnalytics | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [generatingFeedback, setGeneratingFeedback] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
    fetchChapters();
  }, []);

  const fetchData = async () => {
    try {
      const [overviewRes, studentsRes] = await Promise.all([
        api.get("/analytics/class-overview"),
        api.get("/analytics/students")
      ]);

      setClassOverview(overviewRes.data);
      setStudents(studentsRes.data);
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      toast.error(t('analytics.failedToLoad'));
      setLoading(false);
    }
  };

  const fetchChapters = async () => {
    try {
      const response = await api.get("/subjects/chapters/all");
      setChapters(response.data);
      if (response.data.length > 0) {
        setSelectedChapter(response.data[0].id);
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
    }
  };

  const fetchChapterAnalytics = async (chapterId: number) => {
    try {
      const response = await api.get(`/analytics/chapter/${chapterId}`);
      setChapterAnalytics(response.data);
      setSelectedChapter(chapterId);
    } catch (error) {
      toast.error(t('analytics.failedToLoadChapter'));
    }
  };

  const generateIndividualFeedback = async (studentId: number) => {
    if (!selectedChapter) {
      toast.error(t('validation.selectChapterFirst'));
      return;
    }

    try {
      setGeneratingFeedback(studentId);
      const response = await api.post(`/analytics/feedback/individual/${studentId}/${selectedChapter}`);
      toast.success(t('analytics.feedbackGenerated'));

      // Show feedback in a toast or modal
      if (response.data.feedback) {
        toast.info(response.data.feedback, { duration: 10000 });
      }
    } catch (error: any) {
      console.error("Error generating feedback:", error);
      toast.error(error.response?.data?.detail || t('analytics.failedToGenerateFeedback'));
    } finally {
      setGeneratingFeedback(null);
    }
  };

  const generateClassFeedback = async (chapterId: number) => {
    try {
      await api.post(`/analytics/feedback/class/${chapterId}`);
      toast.success(t('analytics.classFeedbackGenerated'));
    } catch (error) {
      toast.error(t('analytics.failedToGenerateFeedback'));
    }
  };

  const exportStudentsCSV = async () => {
    try {
      const response = await api.get("/analytics/export/students/csv", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `students_performance_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t('analytics.csvExported'));
    } catch (error) {
      toast.error(t('analytics.failedExportCSV'));
    }
  };

  const exportStudentsExcel = async () => {
    try {
      const response = await api.get("/analytics/export/students/excel", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `students_performance_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t('analytics.excelExported'));
    } catch (error) {
      toast.error(t('analytics.failedExportExcel'));
    }
  };

  const exportClassOverviewPDF = async () => {
    try {
      const response = await api.get("/analytics/export/class-overview/pdf", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `class_overview_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t('analytics.pdfExported'));
    } catch (error) {
      toast.error(t('analytics.failedExportPDF'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('analytics.loadingAnalytics')}</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getLevelBadge = (level: number) => {
    const levels = {
      1: { label: t('common.beginner'), color: "bg-blue-500" },
      2: { label: t('analytics.medium'), color: "bg-yellow-500" },
      3: { label: t('common.advanced'), color: "bg-green-500" }
    };
    const info = levels[level as keyof typeof levels] || levels[1];
    return <Badge className={info.color}>{info.label}</Badge>;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <PersonalizedHeader />
            <p className="text-muted-foreground mt-2">
              {t('analytics.description')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportStudentsCSV}>
              <FileText className="h-4 w-4 mr-2" />
              {t('analytics.exportCSV')}
            </Button>
            <Button variant="outline" onClick={exportStudentsExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {t('analytics.exportExcel')}
            </Button>
            <Button variant="outline" onClick={exportClassOverviewPDF}>
              <Download className="h-4 w-4 mr-2" />
              {t('analytics.exportPDF')}
            </Button>
          </div>
        </div>
      </div>

      {/* Class Overview Cards */}
      {classOverview && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('analytics.totalStudents')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classOverview.total_students}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('analytics.classAverage')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(classOverview.avg_class_score)}`}>
                {classOverview.avg_class_score.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('analytics.quizzesTaken')}</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classOverview.total_quizzes_taken}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('common.assignments')}</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classOverview.total_assignments}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="students" className="space-y-6">
        <TabsList>
          <TabsTrigger value="students">{t('analytics.studentPerformance')}</TabsTrigger>
          <TabsTrigger value="chapters">{t('analytics.chapterAnalytics')}</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.studentPerformanceOverview')}</CardTitle>
              <CardDescription>{t('analytics.individualProgress')}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Chapter Selector for Feedback */}
              <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                <Label className="text-sm font-medium mb-2 block">{t('analytics.selectChapterFeedback')}</Label>
                <Select
                  value={selectedChapter?.toString()}
                  onValueChange={(v) => setSelectedChapter(parseInt(v))}
                >
                  <SelectTrigger className="max-w-md">
                    <SelectValue placeholder={t('aiStudy.chooseChapter')} />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters.map((chapter) => (
                      <SelectItem key={chapter.id} value={chapter.id.toString()}>
                        {chapter.subject_name} - {chapter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('analytics.feedbackBasedOnChapter')}
                </p>
              </div>

              <div className="space-y-4">
                {students.map((student) => (
                  <div
                    key={student.student_id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold">{student.student_name}</h3>
                          <p className="text-sm text-muted-foreground">{student.student_email}</p>
                        </div>
                        {getLevelBadge(student.current_level)}
                      </div>

                      <div className="mt-3 flex gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t('analytics.avgScore')} </span>
                          <span className={`font-semibold ${getScoreColor(student.avg_score)}`}>
                            {student.avg_score.toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('analytics.quizzes')} </span>
                          <span className="font-semibold">{student.quizzes_taken}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('analytics.assignmentsLabel')} </span>
                          <span className="font-semibold">{student.assignments_submitted}</span>
                        </div>
                      </div>

                      <div className="mt-2">
                        <Progress value={student.avg_score} className="h-2" />
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateIndividualFeedback(student.student_id)}
                      disabled={generatingFeedback === student.student_id || !selectedChapter}
                    >
                      {generatingFeedback === student.student_id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t('analytics.generating')}
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          {t('analytics.generateFeedback')}
                        </>
                      )}
                    </Button>
                  </div>
                ))}

                {students.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    {t('analytics.noStudentData')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chapters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.chapterLevelAnalytics')}</CardTitle>
              <CardDescription>{t('analytics.selectChapterView')}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Chapter Selector */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-2 block">{t('analytics.selectChapter')}</Label>
                <Select
                  value={selectedChapter?.toString() || ""}
                  onValueChange={(v) => fetchChapterAnalytics(parseInt(v))}
                >
                  <SelectTrigger className="max-w-md">
                    <SelectValue placeholder={t('aiStudy.chooseChapter')} />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters.map((chapter) => (
                      <SelectItem key={chapter.id} value={chapter.id.toString()}>
                        {chapter.subject_name} - {chapter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Chapter Analytics Display */}
              {chapterAnalytics ? (
                <div className="space-y-6">
                  {/* Chapter Stats Cards */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t('analytics.totalStudents')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{chapterAnalytics.total_students}</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t('analytics.avgScore')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getScoreColor(chapterAnalytics.avg_score)}`}>
                          {chapterAnalytics.avg_score.toFixed(1)}%
                        </div>
                        <Progress value={chapterAnalytics.avg_score} className="h-2 mt-2" />
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t('analytics.completionRate')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{chapterAnalytics.completion_rate.toFixed(1)}%</div>
                        <Progress value={chapterAnalytics.completion_rate} className="h-2 mt-2" />
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t('analytics.weakAreas')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {chapterAnalytics.weak_areas.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {chapterAnalytics.weak_areas.map((area, idx) => (
                              <Badge key={idx} variant="destructive" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-success">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm">{t('analytics.noWeakAreas')}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Generate Class Feedback Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={() => generateClassFeedback(selectedChapter!)}
                      disabled={!selectedChapter}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      {t('analytics.generateClassFeedback')}
                    </Button>
                  </div>

                  {/* Export Chapter PDF */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          const response = await api.get(`/analytics/export/chapter/${selectedChapter}/pdf`, {
                            responseType: "blob",
                          });
                          const url = window.URL.createObjectURL(new Blob([response.data]));
                          const link = document.createElement("a");
                          link.href = url;
                          link.setAttribute("download", `chapter_analytics_${selectedChapter}_${new Date().toISOString().split('T')[0]}.pdf`);
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                          toast.success(t('analytics.pdfExported'));
                        } catch (error) {
                          toast.error(t('analytics.failedExportPDF'));
                        }
                      }}
                      disabled={!selectedChapter}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t('analytics.exportChapterPDF')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t('analytics.selectChapterToView')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
