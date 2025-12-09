import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, Lightbulb, Users, Brain, CheckCircle, UserPlus, Clock, BarChart3, Lock } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useSubjects, Subject, Chapter } from '@/hooks/useSubjects';
import api from '@/lib/axios';
import { toast } from 'sonner';

const categoryInfo = {
  core_eee: {
    label: "Core EEE Subjects",
    icon: Book,
    color: "bg-blue-500",
    description: "Fundamental electrical and electronics engineering subjects"
  },
  supporting: {
    label: "Supporting Subjects",
    icon: Lightbulb,
    color: "bg-green-500",
    description: "Mathematics, simulation tools, and advanced topics"
  },
  secondary_soft_skills: {
    label: "Secondary & Soft Skills",
    icon: Users,
    color: "bg-purple-500",
    description: "Professional development and communication skills"
  }
};

export default function Subjects() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string>('core_eee');
  const [enrolledCourses, setEnrolledCourses] = useState<Set<number>>(new Set());
  const [enrollingCourses, setEnrollingCourses] = useState<Set<number>>(new Set());
  const [completedChapters, setCompletedChapters] = useState<Set<number>>(new Set());
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use cached query - instant load on subsequent visits
  const { data, isLoading, error } = useSubjects();

  // Fetch user's enrollments and chapter completion status
  useEffect(() => {
    if (user?.role === 'student') {
      fetchEnrollments();
      fetchChapterCompletions();
    }
  }, [user]);

  const fetchEnrollments = async () => {
    try {
      const response = await api.get('/enrollments/my-enrollments');
      const subjectIds = new Set(response.data.map((e: { subject_id: number }) => e.subject_id));
      setEnrolledCourses(subjectIds);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const fetchChapterCompletions = async () => {
    try {
      // Fetch user's quiz attempts and completion status
      console.log('Fetching chapter completions...');
      const response = await api.get('/quizzes/my-attempts');
      console.log('Quiz attempts response:', response.data);
      
      const completedChapterIds = new Set(
        response.data
          .filter((attempt: { is_completed: boolean; passed: boolean }) => attempt.is_completed && attempt.passed)
          .map((attempt: { chapter_id: number }) => attempt.chapter_id)
      );
      console.log('Completed chapter IDs:', Array.from(completedChapterIds));
      setCompletedChapters(completedChapterIds);
    } catch (error) {
      console.error('Error fetching chapter completions:', error);
      // For testing, let's simulate that no chapters are completed
      console.log('Setting empty completed chapters set for testing');
      setCompletedChapters(new Set());
    }
  };

  const handleEnroll = async (subjectId: number, subjectName: string) => {
    setEnrollingCourses(prev => new Set(prev).add(subjectId));

    try {
      await api.post('/enrollments/', { subject_id: subjectId });
      setEnrolledCourses(prev => new Set(prev).add(subjectId));
      toast.success(t('subjects.enrollSuccess', { name: subjectName }));
    } catch (error: unknown) {
      console.error('Error enrolling:', error);
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError.response?.data?.detail || t('subjects.enrollFailed'));
    } finally {
      setEnrollingCourses(prev => {
        const newSet = new Set(prev);
        newSet.delete(subjectId);
        return newSet;
      });
    }
  };

  const getSubjectsByCategory = (category: string) => {
    if (!data) return [];
    return data.subjects.filter((subject: Subject) => subject.category === category);
  };

  const isChapterLocked = (chapter: Chapter, subjectChapters: Chapter[]) => {
    if (!user || user.role !== 'student') {
      console.log('Not a student user, chapter not locked');
      return false;
    }
    
    // Sort chapters by order to check prerequisites
    const sortedChapters = [...subjectChapters].sort((a, b) => a.order - b.order);
    const currentIndex = sortedChapters.findIndex(c => c.id === chapter.id);
    
    console.log(`Checking chapter ${chapter.name} (order: ${chapter.order}, index: ${currentIndex})`);
    
    // First chapter is never locked
    if (currentIndex === 0) {
      console.log('First chapter, not locked');
      return false;
    }
    
    // Check if previous chapter is completed
    const previousChapter = sortedChapters[currentIndex - 1];
    const isLocked = !completedChapters.has(previousChapter.id);
    console.log(`Previous chapter ${previousChapter.name} completed: ${completedChapters.has(previousChapter.id)}, current chapter locked: ${isLocked}`);
    console.log('Completed chapters:', Array.from(completedChapters));
    
    return isLocked;
  };

  const handleQuizAccess = (chapterId: number, chapter: Chapter, subjectChapters: Chapter[]) => {
    const locked = isChapterLocked(chapter, subjectChapters);
    
    if (locked) {
      toast.error(t('subjects.chapterLocked') || 'Complete previous chapter first');
      return;
    }
    
    navigate(`/quiz/${chapterId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('subjects.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{t('subjects.errorLoading')}</p>
          <Button onClick={() => window.location.reload()}>{t('common.back')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{t('subjects.title')}</h1>
        <p className="text-muted-foreground">
          {t('subjects.description')}
        </p>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          {Object.entries(categoryInfo).map(([key, info]) => {
            const Icon = info.icon;
            return (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{info.label}</span>
                <span className="sm:hidden">{info.label.split(' ')[0]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(categoryInfo).map(([category, info]) => {
          const Icon = info.icon;
          const categorySubjects = getSubjectsByCategory(category);

          return (
            <TabsContent key={category} value={category} className="space-y-6">
              <Card className={`border-l-4 ${info.color.replace('bg-', 'border-l-')}`}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${info.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle>{info.label}</CardTitle>
                      <CardDescription>{info.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {categorySubjects.map((subject) => {
                  // Use subject ID for enrollment
                  const isEnrolled = enrolledCourses.has(subject.id);
                  const isEnrolling = enrollingCourses.has(subject.id);

                  return (
                    <Card key={subject.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{subject.icon}</span>
                            <div>
                              <CardTitle className="text-lg">{subject.name}</CardTitle>
                              <Badge variant="outline" className="mt-1">{subject.code}</Badge>
                            </div>
                          </div>
                        </div>
                        <CardDescription className="mt-2">{subject.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {/* Student Enrollment Button */}
                        {user?.role === 'student' && (
                          <div className="mb-4">
                            {isEnrolled ? (
                              <Badge variant="default" className="w-full justify-center py-2">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {t('subjects.enrolled')}
                              </Badge>
                            ) : (
                              <Button
                                onClick={() => handleEnroll(subject.id, subject.name)}
                                disabled={isEnrolling}
                                variant="outline"
                                className="w-full"
                              >
                                {isEnrolling ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                                    {t('subjects.enrolling')}
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    {t('subjects.enrollCourse')}
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}

                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-muted-foreground mb-3">
                            {t('subjects.chapters')} ({subject.chapters.length})
                          </h4>
                          <div className="space-y-2">
                            {subject.chapters.map((chapter) => {
                              const locked = isChapterLocked(chapter, subject.chapters);
                              const completed = completedChapters.has(chapter.id);
                              
                              // TEMPORARY: Force lock chapters 2+ for testing
                              const forceLocked = user?.role === 'student' && chapter.order > 1;
                              
                              // Debug logging for UI rendering
                              console.log(`Rendering chapter ${chapter.name}: locked=${locked}, forceLocked=${forceLocked}, completed=${completed}`);
                              
                              return (
                                <div
                                  key={chapter.id}
                                  className={`flex items-start justify-between gap-3 p-3 rounded-lg border transition-all group ${
                                    (locked || forceLocked) 
                                      ? 'bg-muted/20 border-muted opacity-70 cursor-not-allowed' 
                                      : 'hover:bg-accent hover:border-accent-foreground/20 border-transparent'
                                  }`}
                                >
                                  <div className="flex items-start gap-2 flex-1">
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <Badge variant="secondary" className="shrink-0">
                                        {chapter.order}
                                      </Badge>
                                      {(locked || forceLocked) && (
                                        <Lock className="h-3 w-3 text-muted-foreground" />
                                      )}
                                      {completed && (
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <p className={`text-sm font-medium leading-relaxed ${(locked || forceLocked) ? 'text-muted-foreground' : ''}`}>
                                        {chapter.name}
                                      </p>
                                      {(locked || forceLocked) && (
                                        <p className="text-xs text-muted-foreground/80 mt-1 italic">
                                          Complete previous chapter first
                                        </p>
                                      )}
                                      <div className="flex items-center gap-2 mt-1">
                                        {chapter.difficulty_level && (
                                          <Badge
                                            variant="outline"
                                            className={`text-xs ${
                                              chapter.difficulty_level === 'beginner' ? 'border-green-500 text-green-600' :
                                              chapter.difficulty_level === 'intermediate' ? 'border-yellow-500 text-yellow-600' :
                                              'border-red-500 text-red-600'
                                            }`}
                                          >
                                            <BarChart3 className="h-3 w-3 mr-1" />
                                            {chapter.difficulty_level === 'beginner' ? t('subjects.beginner') || 'Beginner' :
                                             chapter.difficulty_level === 'intermediate' ? t('subjects.intermediate') || 'Intermediate' :
                                             t('subjects.advanced') || 'Advanced'}
                                          </Badge>
                                        )}
                                        {chapter.estimated_minutes && (
                                          <Badge variant="outline" className="text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {chapter.estimated_minutes} {t('subjects.minutes') || 'min'}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {user?.role === 'student' && isEnrolled && (
                                    <Button
                                      size="sm"
                                      variant={(locked || forceLocked) ? "outline" : "ghost"}
                                      className={`shrink-0 h-8 w-8 p-0 ${
                                        (locked || forceLocked)
                                          ? 'border-muted text-muted-foreground cursor-not-allowed' 
                                          : 'opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent/50'
                                      }`}
                                      onClick={() => handleQuizAccess(chapter.id, chapter, subject.chapters)}
                                      disabled={locked || forceLocked}
                                    >
                                      {(locked || forceLocked) ? (
                                        <Lock className="h-4 w-4" />
                                      ) : (
                                        <>
                                          <Brain className="h-4 w-4 mr-1 flex justify-end" />
                                          <span>
                                            {t('subjects.quiz')}
                                          </span>
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {categorySubjects.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-muted-foreground">{t('subjects.noSubjects')}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
