import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PersonalizedHeader from '@/components/PersonalizedHeader';
import LearningInsights from '@/components/LearningInsights';
import {
  BookOpen,
  Target,
  Trophy,
  Clock,
  TrendingUp,
  Zap,
  FileText,
  ChevronRight,
  Play,
  Eye,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface StudyMaterial {
  title: string;
  type: string;
  subject: string;
  lastAccessed: string;
}

interface LearningTopic {
  id: number;
  name: string;
  subject_name: string;
  description: string;
  difficulty: string;
  estimated_minutes: number | null;
  completed: boolean;
  current: boolean;
  progress_percentage: number;
  quiz_attempts: number;
  assignment_submissions: number;
  order: number;
}

interface LearningPathResponse {
  learning_path: LearningTopic[];
  total_chapters: number;
  completed_count: number;
  in_progress_count: number;
  not_started_count: number;
}

interface DashboardStats {
  quizzes_completed: number;
  total_quizzes_available: number;
  study_sheets_viewed: number;
  flashcards_used: number;
  overall_progress: number;
  assignments_submitted: number;
  exams_completed: number;
}

const StudentDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<LearningTopic | null>(null);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [chaptersToShow, setChaptersToShow] = useState(6);
  const [progressData, setProgressData] = useState<DashboardStats>({
    quizzes_completed: 0,
    total_quizzes_available: 0,
    study_sheets_viewed: 0,
    flashcards_used: 0,
    overall_progress: 0,
    assignments_submitted: 0,
    exams_completed: 0
  });
  const [learningPath, setLearningPath] = useState<LearningTopic[]>([]);
  const [learningPathStats, setLearningPathStats] = useState({
    total_chapters: 0,
    completed_count: 0,
    in_progress_count: 0,
    not_started_count: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch dashboard stats
        const statsResponse = await api.get('/analytics/student/dashboard-stats');
        setProgressData(statsResponse.data);

        // Fetch learning path
        const pathResponse = await api.get<LearningPathResponse>('/analytics/student/learning-path');
        setLearningPath(pathResponse.data.learning_path);
        setLearningPathStats({
          total_chapters: pathResponse.data.total_chapters,
          completed_count: pathResponse.data.completed_count,
          in_progress_count: pathResponse.data.in_progress_count,
          not_started_count: pathResponse.data.not_started_count
        });

        setLoading(false);
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        toast.error(t('messages.failedToLoadData') || 'Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [t]);

  const studyMaterials = [
    { title: "Ohm's Law", type: "Study Sheet", subject: "Physics", lastAccessed: "2 hours ago" },
    { title: "Circuit Analysis", type: "Flashcards", subject: "Electronics", lastAccessed: "1 day ago" },
    { title: "Digital Filters", type: "Quiz", subject: "Signal Processing", lastAccessed: "3 days ago" },
    { title: "Kirchhoff's Laws", type: "Study Sheet", subject: "Physics", lastAccessed: "1 week ago" },
  ];

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

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Welcome Header */}
      <div className="flex items-start justify-between">
        <div>
          <PersonalizedHeader />
          <p className="text-muted-foreground mt-2">{t('dashboard.student.readyToContinue')}</p>
        </div>
        <Button onClick={() => navigate('/student/progress')} variant="outline">
          <BarChart3 className="mr-2 h-4 w-4" />
          {t('dashboard.student.myProgress')}
        </Button>
      </div>

      {/* Progress Tracking Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.student.quizzesCompleted')}</CardTitle>
            <Trophy className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressData.quizzes_completed}/{progressData.total_quizzes_available}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.student.fromLastWeek')}
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.student.studySheets')}</CardTitle>
            <FileText className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressData.study_sheets_viewed}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.student.viewedThisMonth')}
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.student.flashcardsUsed')}</CardTitle>
            <Zap className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressData.flashcards_used}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.student.thisWeek')}
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.student.overallProgress')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressData.overall_progress.toFixed(0)}%</div>
            <Progress value={progressData.overall_progress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Learning Insights - Adaptive Recommendations */}
      {user?.id && <LearningInsights studentId={user.id} />}

      {/* Learning Path Section */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t('dashboard.student.personalizedLearningPath')}
            </div>
            {learningPath.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {showAllChapters ? learningPath.length : Math.min(chaptersToShow, learningPath.length)} of {learningPath.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {t('dashboard.student.recommendedTopics')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {learningPath.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('dashboard.student.noChaptersYet') || 'No chapters available yet. Please enroll in a subject to get started.'}
            </p>
          ) : (
            <div className="space-y-3">
              {learningPath.slice(0, showAllChapters ? learningPath.length : chaptersToShow).map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                    item.current ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                  onClick={() => {
                    navigate(`/chapter/${item.id}/resources`);
                  }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      item.completed ? 'bg-success' : item.current ? 'bg-primary' : 'bg-muted-foreground'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${item.current ? 'text-primary' : ''}`}>
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.subject_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {item.difficulty}
                        </Badge>
                        {item.estimated_minutes && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.estimated_minutes} min
                          </span>
                        )}
                        {item.progress_percentage > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {item.progress_percentage.toFixed(0)}% progress
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {item.current && (
                    <Badge className="bg-primary ml-2 flex-shrink-0">
                      {t('dashboard.student.current') || 'Current'}
                    </Badge>
                  )}
                  {item.completed && (
                    <Trophy className="h-4 w-4 text-success ml-2 flex-shrink-0" />
                  )}
                </div>
              ))}
              {!showAllChapters && learningPath.length > chaptersToShow && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setChaptersToShow(prev => Math.min(prev + 6, learningPath.length))}
                    disabled={chaptersToShow >= learningPath.length}
                  >
                    {t('dashboard.student.loadMore') || 'Load More'} (+{Math.min(6, learningPath.length - chaptersToShow)})
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowAllChapters(true)}
                  >
                    {t('dashboard.student.showAllChapters') || 'Show All'} ({learningPath.length - chaptersToShow} more)
                  </Button>
                </div>
              )}
              {showAllChapters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAllChapters(false);
                      setChaptersToShow(6);
                    }}
                  >
                    {t('dashboard.student.showLess') || 'Show Less'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/subjects')}
                  >
                    {t('dashboard.student.viewInSubjects') || 'View in Subjects Page'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Study Materials Library */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Study Materials Library
          </CardTitle>
          <CardDescription>
            Access your study sheets, flashcards, and quizzes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {studyMaterials.map((material, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedMaterial(material);
                  setIsMaterialModalOpen(true);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {material.type === 'Study Sheet' && <FileText className="h-5 w-5 text-primary" />}
                    {material.type === 'Flashcards' && <Zap className="h-5 w-5 text-warning" />}
                    {material.type === 'Quiz' && <Trophy className="h-5 w-5 text-success" />}
                  </div>
                  <div>
                    <p className="font-medium">{material.title}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{material.subject}</Badge>
                      <span>•</span>
                      <span>{material.type}</span>
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      <span>{material.lastAccessed}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Study Material Modal */}
      <Dialog open={isMaterialModalOpen} onOpenChange={setIsMaterialModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedMaterial?.title}</DialogTitle>
            <DialogDescription>
              {selectedMaterial?.type} • {selectedMaterial?.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center p-6 border rounded-lg">
              {selectedMaterial?.type === 'Study Sheet' && <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />}
              {selectedMaterial?.type === 'Flashcards' && <Zap className="h-12 w-12 mx-auto mb-4 text-warning" />}
              {selectedMaterial?.type === 'Quiz' && <Trophy className="h-12 w-12 mx-auto mb-4 text-success" />}
              
              <p className="text-lg font-medium mb-2">{selectedMaterial?.title}</p>
              <p className="text-sm text-muted-foreground mb-4">
                Last accessed: {selectedMaterial?.lastAccessed}
              </p>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => {
                  setIsMaterialModalOpen(false);
                  toast.success(`Opening ${selectedMaterial?.type}: ${selectedMaterial?.title}`);
                }}>
                  <Play className="mr-2 h-4 w-4" />
                  Start Studying
                </Button>
                <Button variant="outline" onClick={() => setIsMaterialModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Learning Path Chapter Modal */}
      <Dialog open={isTopicModalOpen} onOpenChange={setIsTopicModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedTopic?.topic}</DialogTitle>
            <DialogDescription>
              Difficulty: {selectedTopic?.difficulty}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center p-6 border rounded-lg">
              <Target className="h-12 w-12 mx-auto mb-4 text-primary" />
              
              {selectedTopic?.completed ? (
                <div>
                  <p className="text-lg font-medium mb-2 text-success">Chapter Completed!</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    You have successfully completed this chapter. Review materials below.
                  </p>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => {
                      setIsTopicModalOpen(false);
                      toast.success(`Reviewing ${selectedTopic?.topic}`);
                    }}>
                      <Eye className="mr-2 h-4 w-4" />
                      Review Materials
                    </Button>
                    <Button variant="outline" onClick={() => setIsTopicModalOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : selectedTopic?.current ? (
                <div>
                  <p className="text-lg font-medium mb-2 text-primary">Current Chapter</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Continue working on this chapter to advance your learning path.
                  </p>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => {
                      setIsTopicModalOpen(false);
                      navigate('/ai-tools');
                      toast.success('Opening AI Study Tools for current chapter');
                    }}>
                      <Play className="mr-2 h-4 w-4" />
                      Continue Learning
                    </Button>
                    <Button variant="outline" onClick={() => setIsTopicModalOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium mb-2">Upcoming Chapter</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete your current chapter to unlock this learning module.
                  </p>
                  <Button variant="outline" onClick={() => setIsTopicModalOpen(false)}>
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDashboard;