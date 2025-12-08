import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Calendar,
  Clock,
  Award,
  Upload,
  Send,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Brain,
  Sparkles,
  FlaskConical,
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
  instructions: string;
  chapter_id: number;
  chapter_name: string;
  subject_name: string;
  due_date: string | null;
  max_score: number;
  time_limit: number | null;
  ai_assistance_enabled: boolean;
  is_published: boolean;
  assignment_type?: string;
  requires_lab_report?: boolean;
  lab_report_template?: any;
}

interface Submission {
  id: number;
  assignment_id: number;
  content: string | null;
  file_url: string | null;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
}

const AssignmentDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Submission form
  const [submissionContent, setSubmissionContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load assignment
      const assignmentResponse = await api.get(`/assignments/${id}`);
      setAssignment(assignmentResponse.data);

      // Check if already submitted (for students)
      if (user?.role === 'student') {
        try {
          const submissionsResponse = await api.get('/submissions/my');
          const existingSubmission = submissionsResponse.data.submissions.find(
            (s: Submission) => s.assignment_id === parseInt(id!)
          );
          if (existingSubmission) {
            setSubmission(existingSubmission);
          }
        } catch (error) {
          // No submissions yet
        }
      }
    } catch (error: any) {
      toast.error(t('assignments.createError'));
      navigate('/assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!submissionContent.trim() && !selectedFile) {
      toast.error(t('submissions.submitError'));
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('assignment_id', id!);
      if (submissionContent.trim()) {
        formData.append('content', submissionContent);
      }
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      await api.post('/submissions/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(t('submissions.submitSuccess'));
      loadData(); // Reload to show submission
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('submissions.submitError'));
    } finally {
      setSubmitting(false);
    }
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

  if (!assignment) return null;

  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date();
  const hasSubmitted = !!submission;

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/assignments')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('assignments.backToAssignments')}
      </Button>

      {/* Assignment Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileText className="w-6 h-6" />
                {assignment.title}
              </CardTitle>
              <CardDescription className="mt-2">
                {assignment.subject_name} • {assignment.chapter_name}
              </CardDescription>
            </div>

            {hasSubmitted && (
              <div>
                {submission.grade !== null ? (
                  <Badge className="bg-green-500 text-lg py-2 px-4">
                    {t('submissions.grade')}: {formatScoreAs20((submission.grade / assignment.max_score) * 100)}
                  </Badge>
                ) : (
                  <Badge className="bg-blue-500 text-lg py-2 px-4">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {t('assignments.submitted')}
                  </Badge>
                )}
              </div>
            )}

            {!hasSubmitted && isOverdue && (
              <Badge variant="destructive" className="text-lg py-2 px-4">
                <AlertCircle className="w-4 h-4 mr-1" />
                {t('assignments.overdue')}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Description */}
          {assignment.description && (
            <div>
              <h3 className="font-semibold mb-2">{t('assignments.description')}</h3>
              <p className="text-gray-700 dark:text-gray-300">{assignment.description}</p>
            </div>
          )}

          {/* Instructions */}
          {assignment.instructions && (
            <div>
              <h3 className="font-semibold mb-2">{t('assignments.instructions')}</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{assignment.instructions}</p>
              </div>
            </div>
          )}

          {/* Assignment Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            {assignment.due_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">{t('assignments.dueDate')}</p>
                  <p className="font-semibold">{new Date(assignment.due_date).toLocaleString()}</p>
                </div>
              </div>
            )}

            {assignment.time_limit && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">{t('assignments.timeLimit')}</p>
                  <p className="font-semibold">{assignment.time_limit} {t('common.minutes', { defaultValue: 'minutes' })}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">{t('assignments.maxScore')}</p>
                <p className="font-semibold">{assignment.max_score} {t('common.points', { defaultValue: 'points' })}</p>
              </div>
            </div>
          </div>

          {/* Lab Report Generation */}
          {assignment.requires_lab_report && user?.role === 'student' && (
            <div className="pt-4 border-t">
              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <FlaskConical className="h-4 w-4 text-blue-500" />
                <AlertDescription className="flex items-center justify-between">
                  <span className="text-blue-900 dark:text-blue-100">
                    This assignment requires a lab report submission
                  </span>
                  <Button
                    onClick={() => navigate(`/assignment/${assignment.id}/lab-report`)}
                    className="ml-4 bg-blue-500 hover:bg-blue-600"
                    size="sm"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Lab Report
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* AI Assistance Button */}
          {assignment.ai_assistance_enabled && !hasSubmitted && user?.role === 'student' && (
            <div className="pt-4 border-t">
              <Alert className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                <Brain className="h-4 w-4 text-purple-500" />
                <AlertDescription className="flex items-center justify-between">
                  <span className="text-purple-900 dark:text-purple-100">
                    {t('assignments.aiHelpMessage')}
                  </span>
                  <Button
                    onClick={() => navigate(`/ai-chat?chapterId=${assignment.chapter_id}`)}
                    className="ml-4 bg-purple-500 hover:bg-purple-600"
                    size="sm"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    {t('assignments.getAIHelp')}
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Section */}
      {user?.role === 'student' && (
        <>
          {hasSubmitted ? (
            // Show existing submission
            <Card>
              <CardHeader>
                <CardTitle>{t('submissions.yourSubmission')}</CardTitle>
                <CardDescription>
                  {t('submissions.submittedOn')} {new Date(submission.submitted_at).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {submission.content && (
                  <div>
                    <Label>{t('submissions.yourAnswer')}</Label>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-2">
                      <p className="whitespace-pre-wrap">{submission.content}</p>
                    </div>
                  </div>
                )}

                {submission.file_url && (
                  <div>
                    <Label>{t('submissions.uploadedFile')}</Label>
                    <p className="text-sm text-gray-600 mt-2">{submission.file_url}</p>
                  </div>
                )}

                {submission.grade !== null && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-lg">{t('submissions.grade')}</Label>
                      <Badge className="bg-green-500 text-lg py-2 px-4">
                        {formatScoreAs20((submission.grade / assignment.max_score) * 100)}
                      </Badge>
                    </div>

                    {submission.feedback && (
                      <div>
                        <Label>{t('submissions.feedback')}</Label>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-2">
                          <p className="whitespace-pre-wrap">{submission.feedback}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {submission.grade === null && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{t('submissions.checkBackLater')}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ) : (
            // Show submission form
            <Card>
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>{t('assignments.submitYourWork')}</CardTitle>
                  <CardDescription>{t('assignments.provideAnswer')}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Text Content */}
                  <div>
                    <Label htmlFor="content">{t('assignments.textSubmission')}</Label>
                    <Textarea
                      id="content"
                      value={submissionContent}
                      onChange={(e) => setSubmissionContent(e.target.value)}
                      placeholder={t('assignments.typeAnswer')}
                      rows={10}
                      className="mt-2"
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <Label htmlFor="file">{t('assignments.fileUploadOptional')}</Label>
                    <div className="mt-2">
                      <Input id="file" type="file" onChange={handleFileChange} />
                      {selectedFile && (
                        <p className="text-sm text-gray-600 mt-2">{t('assignments.fileSelected')} {selectedFile.name}</p>
                      )}
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button type="submit" disabled={submitting || isOverdue} className="w-full">
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t('submissions.submitting')}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {t('submissions.submitAssignment')}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default AssignmentDetail;
