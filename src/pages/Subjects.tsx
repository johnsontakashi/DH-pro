import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, Lightbulb, Users, Brain, CheckCircle, UserPlus, Clock, BarChart3 } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useSubjects, Subject } from '@/hooks/useSubjects';
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
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use cached query - instant load on subsequent visits
  const { data, isLoading, error } = useSubjects();

  // Fetch user's enrollments
  useEffect(() => {
    if (user?.role === 'student') {
      fetchEnrollments();
    }
  }, [user]);

  const fetchEnrollments = async () => {
    try {
      const response = await api.get('/enrollments/my-enrollments');
      const subjectIds = new Set(response.data.map((e: any) => e.subject_id));
      setEnrolledCourses(subjectIds);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const handleEnroll = async (subjectId: number, subjectName: string) => {
    setEnrollingCourses(prev => new Set(prev).add(subjectId));

    try {
      await api.post('/enrollments/', { subject_id: subjectId });
      setEnrolledCourses(prev => new Set(prev).add(subjectId));
      toast.success(t('subjects.enrollSuccess', { name: subjectName }));
    } catch (error: any) {
      console.error('Error enrolling:', error);
      toast.error(error.response?.data?.detail || t('subjects.enrollFailed'));
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
                            {subject.chapters.map((chapter) => (
                              <div
                                key={chapter.id}
                                className="flex items-start justify-between gap-2 p-2 rounded-md hover:bg-accent transition-colors group"
                              >
                                <div className="flex items-start gap-2 flex-1">
                                  <Badge variant="secondary" className="mt-0.5 shrink-0">
                                    {chapter.order}
                                  </Badge>
                                  <div className="flex-1">
                                    <p className="text-sm leading-relaxed">{chapter.name}</p>
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
                                    variant="ghost"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                    onClick={() => navigate(`/quiz/${chapter.id}`)}
                                  >
                                    <Brain className="h-4 w-4 mr-1" />
                                    {t('subjects.quiz')}
                                  </Button>
                                )}
                              </div>
                            ))}
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
