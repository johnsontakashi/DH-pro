import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PersonalizedHeader from '@/components/PersonalizedHeader';
import {
  Users,
  TrendingUp,
  BookOpen,
  Upload,
  BarChart3,
  Target,
  Clock,
  Award,
  FileText,
  Eye,
  Plus
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Student {
  id: number;
  name: string;
  score: number;
  progress: number;
  status: string;
  strengths: string[];
  weaknesses: string[];
}

const TeacherDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isCreateAssignmentModalOpen, setIsCreateAssignmentModalOpen] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDescription, setAssignmentDescription] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');

  const classStats = {
    totalStudents: 28,
    activeStudents: 24,
    avgScore: 82.5,
    completionRate: 78
  };

  const students = [
    { id: 1, name: "Alex Johnson", score: 88, progress: 85, status: "active", strengths: ["Problem Solving", "Analysis"], weaknesses: ["Application"] },
    { id: 2, name: "Sarah Chen", score: 92, progress: 95, status: "active", strengths: ["Analysis", "Synthesis"], weaknesses: ["Evaluation"] },
    { id: 3, name: "Marcus Davis", score: 76, progress: 65, status: "struggling", strengths: ["Remembering", "Understanding"], weaknesses: ["Analysis", "Synthesis"] },
    { id: 4, name: "Emma Wilson", score: 85, progress: 80, status: "active", strengths: ["Understanding", "Application"], weaknesses: ["Creation"] },
    { id: 5, name: "David Liu", score: 94, progress: 90, status: "excelling", strengths: ["All Levels"], weaknesses: [] },
  ];

  const bloomsTaxonomy = [
    { level: "Remembering", avgScore: 85, color: "bg-blue-500" },
    { level: "Understanding", avgScore: 82, color: "bg-green-500" },
    { level: "Applying", avgScore: 78, color: "bg-yellow-500" },
    { level: "Analyzing", avgScore: 75, color: "bg-orange-500" },
    { level: "Evaluating", avgScore: 72, color: "bg-red-500" },
    { level: "Creating", avgScore: 68, color: "bg-purple-500" },
  ];

  const recentAssignments = [
    { title: "Circuit Analysis Quiz", submitted: 22, total: 28, dueDate: "2 days ago", avgScore: 84 },
    { title: "Ohm's Law Lab Report", submitted: 18, total: 28, dueDate: "1 week ago", avgScore: 87 },
    { title: "Digital Filters Project", submitted: 15, total: 28, dueDate: "In progress", avgScore: null },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excelling': return 'bg-success';
      case 'active': return 'bg-primary';
      case 'struggling': return 'bg-warning';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Welcome Header */}
      <div>
        <PersonalizedHeader />
        <p className="text-muted-foreground mt-2">{t('dashboard.teacher.monitorProgress')}</p>
      </div>

      {/* Class Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.teacher.totalStudents')}</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.teacher.activeThisWeek', { count: classStats.activeStudents })}
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.teacher.averageScore')}</CardTitle>
            <Award className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classStats.avgScore}%</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.teacher.fromLastMonth')}
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.teacher.completionRate')}</CardTitle>
            <Target className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classStats.completionRate}%</div>
            <Progress value={classStats.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.teacher.engagement')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{t('common.high')}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.teacher.aboveAverageActivity')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">{t('dashboard.teacher.studentPerformance')}</TabsTrigger>
          <TabsTrigger value="blooms">{t('dashboard.teacher.bloomsTaxonomy')}</TabsTrigger>
          <TabsTrigger value="assignments">{t('dashboard.teacher.assignments')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('dashboard.teacher.analytics')}</TabsTrigger>
        </TabsList>

        {/* Student Performance Tab */}
        <TabsContent value="students">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('dashboard.teacher.studentPerformanceOverview')}
              </CardTitle>
              <CardDescription>
                {t('dashboard.teacher.individualStudentMetrics')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {students.map((student) => (
                  <div 
                    key={student.id} 
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedStudent(student);
                      setIsStudentModalOpen(true);
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{t('common.score')}: {student.score}%</span>
                          <span>•</span>
                          <span>{t('common.progress')}: {student.progress}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge className={getStatusColor(student.status)}>
                        {t(`dashboard.teacher.status.${student.status}`)}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {t('dashboard.teacher.strengths')}: {student.strengths.join(', ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bloom's Taxonomy Tab */}
        <TabsContent value="blooms">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t('dashboard.teacher.bloomsTaxonomyAnalysis')}
              </CardTitle>
              <CardDescription>
                {t('dashboard.teacher.classPerformanceCognitive')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bloomsTaxonomy.map((level, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{level.level}</span>
                      <span>{level.avgScore}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${level.color}`}
                        style={{ width: `${level.avgScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('dashboard.teacher.recentAssignments')}
              </CardTitle>
              <CardDescription>
                {t('dashboard.teacher.uploadTrackAssignments')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAssignments.map((assignment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">{assignment.title}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {assignment.submitted}/{assignment.total} {t('dashboard.teacher.submitted')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {assignment.dueDate}
                        </span>
                        {assignment.avgScore && (
                          <span>{t('dashboard.teacher.avg')}: {assignment.avgScore}%</span>
                        )}
                      </div>
                    </div>
                    <Progress 
                      value={(assignment.submitted / assignment.total) * 100} 
                      className="w-24"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t">
                <Button className="w-full" onClick={() => setIsCreateAssignmentModalOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  {t('dashboard.teacher.createNewAssignment')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="card-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{t('dashboard.teacher.classAverage')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classStats.avgScore}%</div>
                  <Progress value={classStats.avgScore} className="mt-2 h-2" />
                </CardContent>
              </Card>

              <Card className="card-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{t('dashboard.teacher.activeStudents')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classStats.activeStudents}/{classStats.totalStudents}</div>
                  <p className="text-xs text-success">{t('dashboard.teacher.participation')}</p>
                </CardContent>
              </Card>

              <Card className="card-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{t('dashboard.teacher.assignmentsDue')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-warning">{t('dashboard.teacher.thisWeek')}</p>
                </CardContent>
              </Card>

              <Card className="card-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{t('dashboard.teacher.needsAttention')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">2</div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.teacher.studentsStruggling')}</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {t('dashboard.teacher.weeklyProgress')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { day: 'Monday', completed: 23, total: 28 },
                      { day: 'Tuesday', completed: 25, total: 28 },
                      { day: 'Wednesday', completed: 21, total: 28 },
                      { day: 'Thursday', completed: 27, total: 28 },
                      { day: 'Friday', completed: 24, total: 28 },
                    ].map((day, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{day.day}</span>
                          <span>{day.completed}/{day.total}</span>
                        </div>
                        <Progress value={(day.completed / day.total) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle>{t('dashboard.teacher.engagementMetrics')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>{t('dashboard.teacher.dailyActiveUsers')}</span>
                      <span className="font-bold">18/28</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>{t('dashboard.teacher.avgSessionDuration')}</span>
                      <span className="font-bold">24 min</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>{t('dashboard.teacher.quizCompletionRate')}</span>
                      <span className="font-bold">85%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>{t('dashboard.teacher.aiToolUsage')}</span>
                      <span className="font-bold">67%</span>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{t('dashboard.teacher.overallClassHealth')}</span>
                          <span className="text-success font-medium">{t('common.good')}</span>
                        </div>
                        <Progress value={78} className="h-2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>{t('dashboard.teacher.recentActivity')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { time: '2 hours ago', activity: 'Alex Johnson submitted Circuit Analysis Quiz', type: 'assignment' },
                    { time: '4 hours ago', activity: 'Sarah Chen completed Ohm\'s Law study materials', type: 'study' },
                    { time: '6 hours ago', activity: 'Marcus Davis used AI tutor for 45 minutes', type: 'ai' },
                    { time: '1 day ago', activity: '15 students accessed new flashcard set', type: 'study' },
                    { time: '2 days ago', activity: 'Emma Wilson scored 94% on practice quiz', type: 'quiz' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        item.type === 'assignment' ? 'bg-primary' :
                        item.type === 'study' ? 'bg-success' :
                        item.type === 'ai' ? 'bg-info' : 'bg-warning'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm">{item.activity}</p>
                        <p className="text-xs text-muted-foreground">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Student Details Modal */}
      <Dialog open={isStudentModalOpen} onOpenChange={setIsStudentModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedStudent?.name}</DialogTitle>
            <DialogDescription>
              {t('dashboard.teacher.studentPerformanceDetails')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">{t('dashboard.teacher.currentScore')}</p>
                <p className="text-2xl font-bold">{selectedStudent?.score}%</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">{t('common.progress')}</p>
                <p className="text-2xl font-bold">{selectedStudent?.progress}%</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium">{t('dashboard.teacher.strengths')}</p>
              <div className="flex flex-wrap gap-2">
                {selectedStudent?.strengths?.map((strength: string, index: number) => (
                  <Badge key={index} className="bg-success">{strength}</Badge>
                ))}
              </div>
            </div>

            {selectedStudent?.weaknesses?.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium">{t('dashboard.teacher.areasForImprovement')}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedStudent?.weaknesses?.map((weakness: string, index: number) => (
                    <Badge key={index} variant="outline" className="border-warning text-warning">{weakness}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button className="flex-1" onClick={() => {
                setIsStudentModalOpen(false);
                toast.success(t('dashboard.teacher.viewingReportFor', { name: selectedStudent?.name }));
              }}>
                <Eye className="mr-2 h-4 w-4" />
                {t('dashboard.teacher.viewFullReport')}
              </Button>
              <Button variant="outline" onClick={() => setIsStudentModalOpen(false)}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Assignment Modal */}
      <Dialog open={isCreateAssignmentModalOpen} onOpenChange={setIsCreateAssignmentModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('dashboard.teacher.createNewAssignment')}</DialogTitle>
            <DialogDescription>
              {t('dashboard.teacher.createAssignmentDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('dashboard.teacher.assignmentTitle')}</Label>
              <Input
                id="title"
                value={assignmentTitle}
                onChange={(e) => setAssignmentTitle(e.target.value)}
                placeholder={t('dashboard.teacher.enterAssignmentTitle')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('common.description')}</Label>
              <Textarea
                id="description"
                value={assignmentDescription}
                onChange={(e) => setAssignmentDescription(e.target.value)}
                placeholder={t('dashboard.teacher.describeAssignmentRequirements')}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">{t('dashboard.teacher.dueDate')}</Label>
              <Input
                id="dueDate"
                type="date"
                value={assignmentDueDate}
                onChange={(e) => setAssignmentDueDate(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                className="flex-1"
                onClick={() => {
                  if (!assignmentTitle.trim()) {
                    toast.error(t('validation.assignmentTitleRequired'));
                    return;
                  }
                  setIsCreateAssignmentModalOpen(false);
                  setAssignmentTitle('');
                  setAssignmentDescription('');
                  setAssignmentDueDate('');
                  toast.success(t('messages.assignmentCreatedSuccess'));
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('dashboard.teacher.createAssignment')}
              </Button>
              <Button variant="outline" onClick={() => setIsCreateAssignmentModalOpen(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherDashboard;