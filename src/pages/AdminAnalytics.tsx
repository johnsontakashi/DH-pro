import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  BarChart3,
  Activity,
  TrendingUp,
  Users,
  Database,
  BookOpen,
  Clock,
  FileText,
  Loader2,
  Download,
  Info,
  HelpCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/services/api';
import { toast } from 'sonner';

interface SystemStats {
  total_users: number;
  students: number;
  teachers: number;
  admins: number;
  active_users_week: number;
  total_subjects: number;
  total_chapters: number;
  total_questions: number;
  total_quizzes: number;
  total_exams: number;
  total_assignments: number;
  total_resources: number;
  total_flashcards: number;
  total_lesson_plans: number;
  quiz_attempts_today: number;
  quiz_attempts_week: number;
  submissions_pending: number;
  storage_chunks: number;
}

interface ChapterStats {
  chapter_id: number;
  chapter_name: string;
  subject_name: string;
  total_questions: number;
  total_quizzes: number;
  quiz_attempts: number;
  total_exams: number;
  exam_attempts: number;
  total_assignments: number;
  submissions: number;
  total_flashcards: number;
  total_resources: number;
  avg_quiz_score: number | null;
  avg_exam_score: number | null;
}

interface RecentActivity {
  type: string;
  message: string;
  time: string;
  icon: string;
}

const AdminAnalytics = () => {
  const { t } = useTranslation();

  const [stats, setStats] = useState<SystemStats | null>(null);
  const [chapterStats, setChapterStats] = useState<ChapterStats[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, chapterRes, activityRes] = await Promise.all([
        api.get('/admin/stats/system'),
        api.get('/admin/stats/chapters'),
        api.get('/admin/stats/activity?limit=10')
      ]);
      setStats(statsRes.data);
      setChapterStats(chapterRes.data);
      setActivities(activityRes.data);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return <Users className="h-3 w-3" />;
      case 'quiz': return <BookOpen className="h-3 w-3" />;
      case 'submission': return <FileText className="h-3 w-3" />;
      case 'resource': return <Database className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user': return 'bg-blue-500';
      case 'quiz': return 'bg-success';
      case 'submission': return 'bg-info';
      case 'resource': return 'bg-warning';
      default: return 'bg-muted-foreground';
    }
  };

  // Get unique subjects from chapter stats
  const subjects = [...new Set(chapterStats.map(c => c.subject_name))];

  // Filter chapters by selected subject
  const filteredChapters = selectedSubject === 'all'
    ? chapterStats
    : chapterStats.filter(c => c.subject_name === selectedSubject);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('adminAnalytics.title')}</h1>
          <p className="text-muted-foreground">{t('adminAnalytics.subtitle')}</p>
        </div>
        <Badge variant="outline" className="text-sm">
          Live Data
        </Badge>
      </div>

      {/* System Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.students || 0} students, {stats?.teachers || 0} teachers
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users (Week)</CardTitle>
            <Activity className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats?.active_users_week || 0}</div>
            <p className="text-xs text-muted-foreground">
              Based on quiz activity
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quiz Activity</CardTitle>
            <BookOpen className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.quiz_attempts_week || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.quiz_attempts_today || 0} today
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RAG Storage</CardTitle>
            <Database className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.storage_chunks || 0}</div>
            <p className="text-xs text-muted-foreground">
              chunks indexed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Content Statistics
            </CardTitle>
            <CardDescription>
              Platform content overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Subjects</span>
                <span className="font-bold">{stats?.total_subjects || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Chapters</span>
                <span className="font-bold">{stats?.total_chapters || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Questions</span>
                <span className="font-bold">{stats?.total_questions || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Quizzes</span>
                <span className="font-bold">{stats?.total_quizzes || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Exams</span>
                <span className="font-bold">{stats?.total_exams || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Flashcards</span>
                <span className="font-bold">{stats?.total_flashcards || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest system events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${getActivityColor(activity.type)}`}></div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Methodology Explanation */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Info className="h-5 w-5" />
            {t('adminAnalytics.howAnalyticsWork')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto font-normal">
                <span className="font-medium text-left">{t('adminAnalytics.chapterAnalyticsExplained')}</span>
                <HelpCircle className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 text-sm text-muted-foreground space-y-2">
              <p>{t('adminAnalytics.chapterLogic1')}</p>
              <p>{t('adminAnalytics.chapterLogic2')}</p>
              <p>{t('adminAnalytics.chapterLogic3')}</p>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto font-normal">
                <span className="font-medium text-left">{t('adminAnalytics.weakAreasExplained')}</span>
                <HelpCircle className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 text-sm text-muted-foreground space-y-2">
              <p>{t('adminAnalytics.weakAreasLogic1')}</p>
              <p>{t('adminAnalytics.weakAreasLogic2')}</p>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto font-normal">
                <span className="font-medium text-left">{t('adminAnalytics.scoresExplained')}</span>
                <HelpCircle className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 text-sm text-muted-foreground space-y-2">
              <p>{t('adminAnalytics.scoresLogic1')}</p>
              <p>{t('adminAnalytics.scoresLogic2')}</p>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Chapter-Level Statistics */}
      <Card className="card-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Chapter-Level Statistics
              </CardTitle>
              <CardDescription>
                Detailed analytics for quizzes, exams, assignments, and lessons per chapter
              </CardDescription>
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredChapters.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Chapter</th>
                    <th className="text-left p-3">Subject</th>
                    <th className="text-center p-3">Questions</th>
                    <th className="text-center p-3">Quizzes</th>
                    <th className="text-center p-3">Quiz Attempts</th>
                    <th className="text-center p-3">Avg Quiz Score</th>
                    <th className="text-center p-3">Exams</th>
                    <th className="text-center p-3">Exam Attempts</th>
                    <th className="text-center p-3">Assignments</th>
                    <th className="text-center p-3">Submissions</th>
                    <th className="text-center p-3">Flashcards</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChapters.map((chapter) => (
                    <tr key={chapter.chapter_id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{chapter.chapter_name}</td>
                      <td className="p-3 text-muted-foreground">{chapter.subject_name}</td>
                      <td className="p-3 text-center">{chapter.total_questions}</td>
                      <td className="p-3 text-center">{chapter.total_quizzes}</td>
                      <td className="p-3 text-center">{chapter.quiz_attempts}</td>
                      <td className="p-3 text-center">
                        {chapter.avg_quiz_score !== null ? (
                          <Badge variant={chapter.avg_quiz_score >= 70 ? "default" : "secondary"}>
                            {chapter.avg_quiz_score}%
                          </Badge>
                        ) : '-'}
                      </td>
                      <td className="p-3 text-center">{chapter.total_exams}</td>
                      <td className="p-3 text-center">{chapter.exam_attempts}</td>
                      <td className="p-3 text-center">{chapter.total_assignments}</td>
                      <td className="p-3 text-center">{chapter.submissions}</td>
                      <td className="p-3 text-center">{chapter.total_flashcards}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No chapter data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_resources || 0}</div>
            <p className="text-xs text-muted-foreground">Uploaded documents</p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Lesson Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_lesson_plans || 0}</div>
            <p className="text-xs text-muted-foreground">AI-generated plans</p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_assignments || 0}</div>
            <p className="text-xs text-muted-foreground">Created by teachers</p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats?.submissions_pending || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting grading</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
