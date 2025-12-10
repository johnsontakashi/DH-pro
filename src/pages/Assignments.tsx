import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileCheck,
  Award,
  User,
  Users,
  Eye,
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { formatScoreAs20 } from '@/utils/scoreUtils';

interface Assignment {
  id: number;
  title: string;
  description: string;
  chapter_name: string;
  subject_name: string;
  due_date: string | null;
  max_score: number;
  time_limit: number | null;
  is_published: boolean;
  submission_count: number;
  created_at: string;
}

interface Submission {
  id: number;
  assignment_id: number;
  assignment_title: string;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
  plagiarism_score: number | null;
  is_flagged: boolean;
}

const Assignments: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (user?.role === 'teacher') {
        // Load teacher's created assignments
        const response = await api.get('/assignments/my/created');
        setAssignments(response.data.assignments);
      } else {
        // Load available assignments (all published) - optimized single request
        const response = await api.get('/assignments/all/published');
        setAssignments(response.data.assignments);

        // Load student's submissions
        const submissionsResponse = await api.get('/submissions/my');
        setMySubmissions(submissionsResponse.data.submissions);
      }
    } catch (error: any) {
      toast.error(t('assignments.createError'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = () => {
    navigate('/teacher/create-assignment');
  };

  const handleViewAssignment = (assignment: Assignment) => {
    if (user?.role === 'teacher') {
      navigate(`/teacher/assignment/${assignment.id}`);
    } else {
      navigate(`/assignment/${assignment.id}`);
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const hasSubmitted = (assignmentId: number) => {
    return mySubmissions.some((s) => s.assignment_id === assignmentId);
  };

  const getSubmissionForAssignment = (assignmentId: number) => {
    return mySubmissions.find((s) => s.assignment_id === assignmentId);
  };

  const renderAssignmentCard = (assignment: Assignment) => {
    const overdue = isOverdue(assignment.due_date);
    const submitted = hasSubmitted(assignment.id);
    const submission = getSubmissionForAssignment(assignment.id);

    return (
      <Card
        key={assignment.id}
        className={`hover:shadow-lg transition-shadow ${user?.role === 'student' ? 'cursor-pointer' : ''}`}
        onClick={user?.role === 'student' ? () => handleViewAssignment(assignment) : undefined}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {assignment.title}
              </CardTitle>
              <CardDescription className="mt-1">
                {assignment.subject_name} • {assignment.chapter_name}
              </CardDescription>
            </div>

            {user?.role === 'student' && (
              <div>
                {submitted ? (
                  submission?.grade !== null ? (
                    <Badge className="bg-green-500">
                      <Award className="w-3 h-3 mr-1" />
                      {t('assignments.graded')}: {formatScoreAs20((submission.grade / assignment.max_score) * 100)}
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-500">
                      <FileCheck className="w-3 h-3 mr-1" />
                      {t('assignments.submitted')}
                    </Badge>
                  )
                ) : overdue ? (
                  <Badge variant="destructive">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {t('assignments.overdue')}
                  </Badge>
                ) : (
                  <Badge variant="outline">{t('assignments.pending')}</Badge>
                )}
              </div>
            )}

            {user?.role === 'teacher' && (
              <div className="flex gap-2">
                {!assignment.is_published && <Badge variant="secondary">{t('assignments.draft')}</Badge>}
                <Badge variant="outline">
                  <User className="w-3 h-3 mr-1" />
                  {assignment.submission_count} {t('assignments.submissions')}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{assignment.description || t('assignments.description')}</p>

          <div className="flex flex-wrap gap-3 text-sm">
            {assignment.due_date && (
              <div className="flex items-center gap-1 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{t('assignments.dueDate')}: {new Date(assignment.due_date).toLocaleDateString()}</span>
              </div>
            )}

            {assignment.time_limit && (
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{assignment.time_limit} {t('common.minutes', { defaultValue: 'minutes' })}</span>
              </div>
            )}

            <div className="flex items-center gap-1 text-gray-600">
              <Award className="w-4 h-4" />
              <span>{t('assignments.maxScore')}: {assignment.max_score} {t('common.points', { defaultValue: 'points' })}</span>
            </div>
          </div>
        </CardContent>

        {user?.role === 'teacher' && (
          <CardFooter className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleViewAssignment(assignment);
              }}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              {t('assignments.viewDetails')}
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/teacher/assignment/${assignment.id}/submissions`);
              }}
              className="flex-1"
            >
              <Users className="w-4 h-4 mr-2" />
              {t('assignments.viewSubmissions')} ({assignment.submission_count})
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('assignments.loadingAssignments')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-purple-500" />
          <div>
            <h1 className="text-3xl font-bold">
              {user?.role === 'teacher' ? t('assignments.manageAssignments') : t('assignments.myAssignments')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {user?.role === 'teacher'
                ? t('assignments.createManageDesc')
                : t('assignments.viewCompleteDesc')}
            </p>
          </div>
        </div>

        {user?.role === 'teacher' && (
          <Button onClick={handleCreateAssignment}>
            <Plus className="w-4 h-4 mr-2" />
            {t('assignments.createAssignment')}
          </Button>
        )}
      </div>

      {/* Content */}
      {user?.role === 'teacher' ? (
        // Teacher View
        <div>
          {assignments.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('assignments.noAssignmentsCreated')}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map((assignment) => renderAssignmentCard(assignment))}
            </div>
          )}
        </div>
      ) : (
        // Student View with Tabs
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="available">
              {t('assignments.availableAssignments')} ({assignments.filter((a) => !hasSubmitted(a.id)).length})
            </TabsTrigger>
            <TabsTrigger value="submitted">
              {t('assignments.submittedAssignments')} ({mySubmissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="mt-6">
            {assignments.filter((a) => !hasSubmitted(a.id)).length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('assignments.completedAll')}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments
                  .filter((a) => !hasSubmitted(a.id))
                  .map((assignment) => renderAssignmentCard(assignment))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="submitted" className="mt-6">
            {mySubmissions.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('assignments.noSubmittedYet')}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments
                  .filter((a) => hasSubmitted(a.id))
                  .map((assignment) => renderAssignmentCard(assignment))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Assignments;
