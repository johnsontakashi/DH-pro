import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Settings,
  BarChart3,
  Activity,
  Shield,
  Database,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Brain,
  ArrowRight,
  FileText,
  BookOpen,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

interface RecentActivity {
  type: string;
  message: string;
  time: string;
  icon: string;
}

const AdminPanel = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<SystemStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, activityRes] = await Promise.all([
        api.get('/admin/stats/system'),
        api.get('/admin/stats/activity?limit=5')
      ]);
      setStats(statsRes.data);
      setActivities(activityRes.data);
    } catch (error: any) {
      console.error('Failed to load admin data:', error);
      toast.error('Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return <Users className="h-4 w-4 text-blue-500" />;
      case 'quiz': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'submission': return <FileText className="h-4 w-4 text-info" />;
      case 'resource': return <Database className="h-4 w-4 text-warning" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Admin Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('admin.title')}</h1>
          <p className="text-muted-foreground">{t('admin.subtitle')}</p>
        </div>
        <Badge className="bg-destructive">
          <Shield className="mr-1 h-3 w-3" />
          {t('admin.superAdmin')}
        </Badge>
      </div>

      {/* System Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.totalUsers')}</CardTitle>
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
            <CardTitle className="text-sm font-medium">Quiz Activity</CardTitle>
            <Activity className="h-4 w-4 text-info" />
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
            <CardTitle className="text-sm font-medium">Content Library</CardTitle>
            <BookOpen className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_questions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_chapters || 0} chapters, {stats?.total_flashcards || 0} flashcards
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <FileText className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.submissions_pending || 0}</div>
            <p className="text-xs text-muted-foreground">
              submissions awaiting grading
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Content Statistics */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Content Statistics
            </CardTitle>
            <CardDescription>
              Overview of platform content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <div className="text-lg font-bold">{stats?.total_subjects || 0}</div>
                <p className="text-xs text-muted-foreground">Subjects</p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-lg font-bold">{stats?.total_chapters || 0}</div>
                <p className="text-xs text-muted-foreground">Chapters</p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-lg font-bold">{stats?.total_quizzes || 0}</div>
                <p className="text-xs text-muted-foreground">Quizzes</p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-lg font-bold">{stats?.total_exams || 0}</div>
                <p className="text-xs text-muted-foreground">Exams</p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-lg font-bold">{stats?.total_assignments || 0}</div>
                <p className="text-xs text-muted-foreground">Assignments</p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-lg font-bold">{stats?.total_resources || 0}</div>
                <p className="text-xs text-muted-foreground">Resources</p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-lg font-bold">{stats?.total_flashcards || 0}</div>
                <p className="text-xs text-muted-foreground">Flashcards</p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-lg font-bold">{stats?.total_lesson_plans || 0}</div>
                <p className="text-xs text-muted-foreground">Lesson Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('admin.recentSystemActivity')}
            </CardTitle>
            <CardDescription>
              {t('admin.latestSystemEvents')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                    {getActivityIcon(activity.type)}
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

            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full" onClick={() => navigate('/admin/analytics')}>
                <Activity className="mr-2 h-4 w-4" />
                {t('admin.viewAllActivity')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('admin.adminActions')}
          </CardTitle>
          <CardDescription>
            {t('admin.configureSystemSettings')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* AI Model Configuration Card */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
              onClick={() => navigate('/admin/ai-models')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{t('admin.aiModelConfiguration')}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('admin.aiModelConfigDescription')}
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  {t('admin.configureModels')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* User Management Card */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
              onClick={() => navigate('/admin/users')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{t('admin.userManagement')}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('admin.userManagementDescription')}
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  {t('admin.manageUsers')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Analytics Card */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
              onClick={() => navigate('/admin/analytics')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{t('admin.systemAnalytics')}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('admin.systemAnalyticsDescription')}
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  {t('admin.viewAnalytics')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Current System Info */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('admin.systemInformation')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">v2.1.0</div>
              <p className="text-sm text-muted-foreground">{t('admin.systemVersion')}</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-success">{t('admin.online')}</div>
              <p className="text-sm text-muted-foreground">{t('admin.databaseStatus')}</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-info">{stats?.storage_chunks || 0}</div>
              <p className="text-sm text-muted-foreground">RAG Chunks Indexed</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-warning">{stats?.active_users_week || 0}</div>
              <p className="text-sm text-muted-foreground">Active Users (Week)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
