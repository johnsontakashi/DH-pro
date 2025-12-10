import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BookOpen,
  Clock,
  FileText,
  Sparkles,
  Eye,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  Calendar,
  Copy,
  Edit
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface LessonPlan {
  id: number;
  teacher_id: number;
  chapter_id: number;
  title: string;
  description: string | null;
  duration_minutes: number;
  objectives: Array<{text: string}>;
  introduction: string | null;
  main_content: string | null;
  activities: Array<{title: string; description: string; duration: number}>;
  assessment: string | null;
  homework: string | null;
  resources: Array<{title: string; url?: string}>;
  materials_needed: string[];
  ai_generated: boolean;
  is_published: boolean;
  created_at: string;
}

export default function MyLessons() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<LessonPlan | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      setLoading(true);
      const response = await api.get('/lesson-plans/');
      setLessons(response.data);
    } catch (error: any) {
      console.error('Error loading lessons:', error);
      toast.error('Failed to load lesson plans');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (lessonId: number) => {
    if (!confirm('Are you sure you want to delete this lesson plan?')) return;

    try {
      await api.delete(`/lesson-plans/${lessonId}`);
      toast.success('Lesson plan deleted successfully');
      loadLessons();
    } catch (error: any) {
      toast.error('Failed to delete lesson plan');
    }
  };

  const handleViewDetails = (lesson: LessonPlan) => {
    setSelectedLesson(lesson);
    setDetailsOpen(true);
  };

  const handleEdit = (lesson: LessonPlan) => {
    // Navigate to edit page (to be created)
    navigate(`/teacher/lesson-planner/edit/${lesson.id}`);
  };

  const handleDuplicate = async (lessonId: number) => {
    try {
      await api.post(`/lesson-plans/${lessonId}/duplicate`);
      toast.success('Lesson plan duplicated successfully');
      loadLessons();
    } catch (error: any) {
      toast.error('Failed to duplicate lesson plan');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading lesson plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              My Lesson Plans
            </h1>
            <p className="text-muted-foreground">
              Manage all your AI-generated and custom lesson plans
            </p>
          </div>
          <Button onClick={() => navigate('/teacher/lesson-planner')}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Lesson
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Lessons</CardDescription>
            <CardTitle className="text-3xl">{lessons.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>AI Generated</CardDescription>
            <CardTitle className="text-3xl text-purple-600">
              {lessons.filter(l => l.ai_generated).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Published</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {lessons.filter(l => l.is_published).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Lessons List */}
      {lessons.length === 0 ? (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            No lesson plans yet. Click "Create New Lesson" to generate your first AI-powered lesson plan!
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {lesson.ai_generated && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Generated
                        </Badge>
                      )}
                      {lesson.is_published && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Published
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl mb-1">{lesson.title}</CardTitle>
                    {lesson.description && (
                      <CardDescription className="line-clamp-2">{lesson.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(lesson)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(lesson)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(lesson.id)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Duplicate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(lesson.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {lesson.duration_minutes} minutes
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {lesson.objectives.length} objectives
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(lesson.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lesson Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedLesson && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedLesson.title}</DialogTitle>
                <DialogDescription>{selectedLesson.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Learning Objectives */}
                {selectedLesson.objectives.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Learning Objectives</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedLesson.objectives.map((obj, idx) => (
                        <li key={idx}>{obj.text}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Introduction */}
                {selectedLesson.introduction && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Introduction</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedLesson.introduction}</p>
                  </div>
                )}

                {/* Main Content */}
                {selectedLesson.main_content && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Main Content</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedLesson.main_content}</p>
                  </div>
                )}

                {/* Activities */}
                {selectedLesson.activities.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Activities</h3>
                    <div className="space-y-3">
                      {selectedLesson.activities.map((activity, idx) => (
                        <Card key={idx}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">{activity.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                            <p className="text-xs text-muted-foreground mt-2">Duration: {activity.duration} min</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assessment */}
                {selectedLesson.assessment && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Assessment</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedLesson.assessment}</p>
                  </div>
                )}

                {/* Homework */}
                {selectedLesson.homework && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Homework</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedLesson.homework}</p>
                  </div>
                )}

                {/* Materials Needed */}
                {selectedLesson.materials_needed.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Materials Needed</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedLesson.materials_needed.map((material, idx) => (
                        <li key={idx}>{material}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
