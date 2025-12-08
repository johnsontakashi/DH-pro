import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  BookOpen,
  FileText,
  ClipboardList,
  GraduationCap,
  Download,
  Play,
  CheckCircle2,
  Clock,
  Award,
  Sparkles,
  Lightbulb
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { formatScoreAs20 } from '@/utils/scoreUtils';

interface LessonPlanDetail {
  id: number;
  title: string;
  description: string | null;
  objectives: Array<{ description: string; bloom_level?: string }> | null;
  duration_minutes: number | null;
  introduction: string | null;
  main_content: string | null;
  activities: Array<{ title: string; description: string; duration?: number }> | null;
  assessment: string | null;
  homework: string | null;
  resources: Array<{ type: string; url: string; title: string }> | null;
  materials_needed: string[] | null;
}

interface ChapterResourcesData {
  chapter_id: number;
  chapter_name: string;
  subject_id: number;
  subject_name: string;
  lesson_plans: Array<{
    id: number;
    title: string;
    objectives: string;
    created_at: string;
  }>;
  lesson_plans_count: number;
  quizzes: Array<{
    id: number;
    title: string;
    quiz_type: string;
    passing_score: number;
    time_limit: number;
    score_out_of_20: number | null;
    completed: boolean;
  }>;
  quizzes_count: number;
  flashcards_count: number;
  assignments: Array<{
    id: number;
    title: string;
    due_date: string | null;
    max_score: number;
    score_out_of_20: number | null;
    submitted: boolean;
  }>;
  assignments_count: number;
  exams: Array<{
    id: number;
    title: string;
    exam_type: string;
    time_limit: number;
    passing_score: number;
    score_out_of_20: number | null;
    completed: boolean;
  }>;
  exams_count: number;
  resources: Array<{
    id: number;
    title: string;
    resource_type: string;
    file_path: string;
    download_url: string | null;
    created_at: string;
  }>;
  resources_count: number;
}

export default function ChapterResources() {
  const { t } = useTranslation();
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ChapterResourcesData | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<LessonPlanDetail | null>(null);
  const [loadingLessonId, setLoadingLessonId] = useState<number | null>(null);

  useEffect(() => {
    const fetchChapterResources = async () => {
      try {
        const response = await api.get(`/subjects/chapters/${chapterId}/resources-summary`);
        setData(response.data);
        setLoading(false);
      } catch (error: any) {
        console.error('Error fetching chapter resources:', error);
        toast.error(t('messages.failedToLoadData') || 'Failed to load chapter resources');
        setLoading(false);
      }
    };

    fetchChapterResources();
  }, [chapterId, t]);

  const handleViewLesson = async (lessonId: number) => {
    setLoadingLessonId(lessonId);
    try {
      const response = await api.get(`/lesson-plans/${lessonId}`);
      setSelectedLesson(response.data);
    } catch (error) {
      console.error('Error fetching lesson:', error);
      toast.error('Failed to load lesson details');
    } finally {
      setLoadingLessonId(null);
    }
  };

  const handleDownloadResource = async (resourceId: number, title: string) => {
    try {
      // First, get resource info to check if it's external URL
      const resourceInfo = await api.get(`/resources/${resourceId}`);
      const resourceUrl = resourceInfo.data.resource_url;

      // If it's an external URL, open directly
      if (resourceUrl && (resourceUrl.startsWith('http://') || resourceUrl.startsWith('https://'))) {
        window.open(resourceUrl, '_blank');
        toast.success(t('messages.downloadSuccess') || 'Opening resource');
        return;
      }

      // For local files, download via authenticated API call
      const response = await api.get(`/resources/${resourceId}/download`, {
        responseType: 'blob'
      });

      // Extract filename from resource_url or use title with appropriate extension
      let filename = title;
      if (resourceUrl) {
        // Get the actual filename from the path
        const pathParts = resourceUrl.split('/');
        const originalFilename = pathParts[pathParts.length - 1];

        // If title doesn't have an extension but the file does, append it
        if (!title.includes('.') && originalFilename.includes('.')) {
          const extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
          filename = title + extension;
        } else if (originalFilename.includes('.')) {
          // Use the original filename if available
          filename = originalFilename;
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(t('messages.downloadSuccess') || 'Downloaded successfully');
    } catch (error) {
      console.error('Error downloading resource:', error);
      toast.error(t('messages.downloadFailed') || 'Failed to download resource');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('messages.noData') || 'No data available'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
          ← {t('common.back') || 'Back'}
        </Button>
        <h1 className="text-4xl font-bold">{data.chapter_name}</h1>
        <p className="text-muted-foreground text-lg">
          {data.subject_name}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{data.lesson_plans_count}</div>
            <p className="text-xs text-muted-foreground">{t('chapterResources.lessons') || 'Lessons'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <ClipboardList className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{data.quizzes_count}</div>
            <p className="text-xs text-muted-foreground">{t('chapterResources.quizzes') || 'Quizzes'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{data.flashcards_count}</div>
            <p className="text-xs text-muted-foreground">{t('chapterResources.flashcards') || 'Flashcards'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{data.assignments_count}</div>
            <p className="text-xs text-muted-foreground">{t('chapterResources.assignments') || 'Assignments'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <GraduationCap className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold">{data.exams_count}</div>
            <p className="text-xs text-muted-foreground">{t('chapterResources.exams') || 'Exams'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{data.resources_count}</div>
            <p className="text-xs text-muted-foreground">{t('chapterResources.resources') || 'Resources'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="lessons" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="lessons">
            {t('chapterResources.lessons') || 'Lessons'} ({data.lesson_plans_count})
          </TabsTrigger>
          <TabsTrigger value="quizzes">
            {t('chapterResources.quizzes') || 'Quizzes'} ({data.quizzes_count})
          </TabsTrigger>
          <TabsTrigger value="flashcards">
            {t('chapterResources.flashcards') || 'Flashcards'}
          </TabsTrigger>
          <TabsTrigger value="assignments">
            {t('chapterResources.assignments') || 'Assignments'} ({data.assignments_count})
          </TabsTrigger>
          <TabsTrigger value="exams">
            {t('chapterResources.exams') || 'Exams'} ({data.exams_count})
          </TabsTrigger>
          <TabsTrigger value="downloads">
            {t('chapterResources.downloads') || 'Downloads'} ({data.resources_count})
          </TabsTrigger>
        </TabsList>

        {/* Lesson Plans Tab */}
        <TabsContent value="lessons" className="space-y-4">
          {data.lesson_plans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t('chapterResources.noLessons') || 'No lesson plans available yet'}</p>
              </CardContent>
            </Card>
          ) : (
            data.lesson_plans.map((lesson) => (
              <Card key={lesson.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        {lesson.title}
                      </CardTitle>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {lesson.objectives && Array.isArray(lesson.objectives)
                          ? lesson.objectives.slice(0, 2).map((obj: any) => obj.description || obj).join(', ')
                          : typeof lesson.objectives === 'string'
                          ? lesson.objectives.substring(0, 150)
                          : 'No objectives available'}
                        {lesson.objectives && lesson.objectives.length > 0 && '...'}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleViewLesson(lesson.id)}
                      disabled={loadingLessonId === lesson.id}
                    >
                      {loadingLessonId === lesson.id ? t('common.loading') : (t('common.view') || 'View')}
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="space-y-4">
          {data.quizzes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t('chapterResources.noQuizzes') || 'No quizzes available yet'}</p>
              </CardContent>
            </Card>
          ) : (
            data.quizzes.map((quiz) => (
              <Card key={quiz.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle>{quiz.title}</CardTitle>
                        {quiz.completed && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                        <Badge variant={quiz.quiz_type === 'adaptive' ? 'default' : 'secondary'}>
                          {quiz.quiz_type}
                        </Badge>
                      </div>
                      <div className="mt-2 space-x-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {quiz.time_limit} min
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          Pass: {quiz.passing_score}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      {quiz.score_out_of_20 !== null && (
                        <div className="text-lg font-bold">
                          {formatScoreAs20(quiz.score_out_of_20 * 5, 1)}
                        </div>
                      )}
                      <Button onClick={() => navigate(`/quiz/${chapterId}`)} size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        {quiz.completed ? t('common.retake') : t('common.start')}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Flashcards Tab */}
        <TabsContent value="flashcards">
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <Sparkles className="h-16 w-16 mx-auto text-purple-500" />
              <div>
                <p className="text-2xl font-bold mb-2">
                  {data.flashcards_count} {t('chapterResources.flashcardsAvailable') || 'Flashcards Available'}
                </p>
                <p className="text-muted-foreground">
                  {t('chapterResources.flashcardsDescription') || 'Practice with interactive flashcards'}
                </p>
              </div>
              {data.flashcards_count > 0 && (
                <Button size="lg" onClick={() => navigate(`/ai-tools`)}>
                  <Play className="h-5 w-5 mr-2" />
                  {t('chapterResources.startStudying') || 'Start Studying'}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          {data.assignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t('chapterResources.noAssignments') || 'No assignments available yet'}</p>
              </CardContent>
            </Card>
          ) : (
            data.assignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle>{assignment.title}</CardTitle>
                        {assignment.submitted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {assignment.due_date && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      {assignment.score_out_of_20 !== null && (
                        <div className="text-lg font-bold">
                          {formatScoreAs20(assignment.score_out_of_20 * 5, 1)}
                        </div>
                      )}
                      <Button onClick={() => navigate(`/assignment/${assignment.id}`)} size="sm">
                        {assignment.submitted ? t('common.view') : t('common.start')}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Exams Tab */}
        <TabsContent value="exams" className="space-y-4">
          {data.exams.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t('chapterResources.noExams') || 'No exams available yet'}</p>
              </CardContent>
            </Card>
          ) : (
            data.exams.map((exam) => (
              <Card key={exam.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle>{exam.title}</CardTitle>
                        {exam.completed && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                        <Badge variant="destructive">{exam.exam_type}</Badge>
                      </div>
                      <div className="mt-2 space-x-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {exam.time_limit} min
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          Pass: {exam.passing_score}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      {exam.score_out_of_20 !== null && (
                        <div className="text-lg font-bold">
                          {formatScoreAs20(exam.score_out_of_20 * 5, 1)}
                        </div>
                      )}
                      <Button onClick={() => navigate(`/exam/${exam.id}`)} size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        {exam.completed ? t('common.retake') : t('common.start')}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Downloads Tab */}
        <TabsContent value="downloads" className="space-y-4">
          {data.resources.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t('chapterResources.noResources') || 'No downloadable resources yet'}</p>
              </CardContent>
            </Card>
          ) : (
            data.resources.map((resource) => (
              <Card key={resource.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-8 w-8 text-orange-500" />
                      <div>
                        <CardTitle>{resource.title}</CardTitle>
                        <div className="text-sm text-muted-foreground">
                          <Badge variant="outline">{resource.resource_type}</Badge>
                          {resource.created_at && (
                            <span className="ml-2 text-xs">
                              {new Date(resource.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {resource.download_url && (
                      <Button onClick={() => handleDownloadResource(resource.id, resource.title)} size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        {t('common.download') || 'Download'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Lesson Detail Dialog */}
      <Dialog open={selectedLesson !== null} onOpenChange={() => setSelectedLesson(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              {selectedLesson?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedLesson && (
            <div className="space-y-6">
              {/* Description */}
              {selectedLesson.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{selectedLesson.description}</p>
                </div>
              )}

              {/* Duration */}
              {selectedLesson.duration_minutes && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{selectedLesson.duration_minutes} minutes</span>
                </div>
              )}

              {/* Objectives */}
              {selectedLesson.objectives && selectedLesson.objectives.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Learning Objectives</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedLesson.objectives.map((obj, idx) => (
                      <li key={idx} className="text-muted-foreground">
                        {obj.description}
                        {obj.bloom_level && (
                          <Badge variant="outline" className="ml-2">{obj.bloom_level}</Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Introduction */}
              {selectedLesson.introduction && (
                <div>
                  <h3 className="font-semibold mb-2">Introduction</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedLesson.introduction}</p>
                </div>
              )}

              {/* Main Content */}
              {selectedLesson.main_content && (
                <div>
                  <h3 className="font-semibold mb-2">Main Content</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedLesson.main_content}</p>
                </div>
              )}

              {/* Activities */}
              {selectedLesson.activities && selectedLesson.activities.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Activities</h3>
                  <div className="space-y-3">
                    {selectedLesson.activities.map((activity, idx) => (
                      <Card key={idx}>
                        <CardHeader>
                          <CardTitle className="text-base">{activity.title}</CardTitle>
                          {activity.duration && (
                            <p className="text-sm text-muted-foreground">Duration: {activity.duration} min</p>
                          )}
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Assessment */}
              {selectedLesson.assessment && (
                <div>
                  <h3 className="font-semibold mb-2">Assessment</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedLesson.assessment}</p>
                </div>
              )}

              {/* Homework */}
              {selectedLesson.homework && (
                <div>
                  <h3 className="font-semibold mb-2">Homework</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedLesson.homework}</p>
                </div>
              )}

              {/* Materials Needed */}
              {selectedLesson.materials_needed && selectedLesson.materials_needed.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Materials Needed</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedLesson.materials_needed.map((material, idx) => (
                      <li key={idx} className="text-muted-foreground">{material}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Resources */}
              {selectedLesson.resources && selectedLesson.resources.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Additional Resources</h3>
                  <div className="space-y-2">
                    {selectedLesson.resources.map((resource, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Badge variant="outline">{resource.type}</Badge>
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {resource.title}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
