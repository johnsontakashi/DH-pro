import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  ArrowLeft,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  FileCheck,
  Award,
  TestTube,
  Sparkles,
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface Submission {
  id: number;
  assignment_id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  content: string | null;
  file_url: string | null;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
  is_flagged: boolean;
  plagiarism_score: number | null;
}

interface LabReport {
  id: number;
  assignment_id: number;
  student_id: number;
  student_name?: string;
  student_email?: string;
  report_data: any;
  is_draft: boolean;
  submitted_at?: string;
  submission_id?: number;
  grade?: number | null;
  feedback?: string | null;
}

interface Assignment {
  id: number;
  title: string;
  chapter_name: string;
  subject_name: string;
  max_score: number;
  assignment_type?: string;
  requires_lab_report?: boolean;
}

const ViewSubmissions: React.FC = () => {
  const { t } = useTranslation();
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('submissions');
  const [showAIGradeDialog, setShowAIGradeDialog] = useState(false);
  const [selectedLabReportId, setSelectedLabReportId] = useState<number | null>(null);
  const [aiGrading, setAIGrading] = useState(false);
  const [filterFlagged, setFilterFlagged] = useState(false);
  const [sortByPlagiarism, setSortByPlagiarism] = useState<'none' | 'asc' | 'desc'>('none');

  useEffect(() => {
    loadData();
  }, [assignmentId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load assignment details
      const assignmentResponse = await api.get(`/assignments/${assignmentId}`);
      setAssignment(assignmentResponse.data);

      // Load submissions
      const submissionsResponse = await api.get(`/submissions/assignment/${assignmentId}`);
      setSubmissions(submissionsResponse.data.submissions);

      // Load lab reports if this is a lab report assignment
      if (assignmentResponse.data.requires_lab_report || assignmentResponse.data.assignment_type === 'LAB_REPORT') {
        try {
          const labReportsResponse = await api.get(`/lab-reports/teacher/assignment/${assignmentId}/submissions`);
          setLabReports(labReportsResponse.data.lab_reports || []);
          if (labReportsResponse.data.lab_reports && labReportsResponse.data.lab_reports.length > 0) {
            setActiveTab('lab-reports');
          }
        } catch (error: any) {
          console.error('Failed to load lab reports:', error);
          // Don't show error to user, lab reports are optional
        }
      }
    } catch (error: any) {
      toast.error(t('submissions.loadFailed'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = (submissionId: number) => {
    navigate(`/teacher/submission/${submissionId}/grade`);
  };

  const handleAIGradeLabReport = async (labReportId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the lab report
    setSelectedLabReportId(labReportId);
    setShowAIGradeDialog(true);
  };

  const confirmAIGrade = async () => {
    if (!selectedLabReportId) return;

    try {
      setAIGrading(true);
      const response = await api.post(`/lab-reports/${selectedLabReportId}/ai-grade`);
      toast.success(t('submissions.labReportGradedAI'));
      setShowAIGradeDialog(false);
      setSelectedLabReportId(null);
      loadData(); // Reload to show updated grade
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('submissions.failedGradeLabReport'));
    } finally {
      setAIGrading(false);
    }
  };

  const getSubmissionStatus = (submission: Submission) => {
    if (submission.grade !== null) {
      return (
        <Badge className="bg-green-500">
          <Award className="w-3 h-3 mr-1" />
          {t('assignments.graded')}: {submission.grade}/{assignment?.max_score}
        </Badge>
      );
    }
    if (submission.is_flagged) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="w-3 h-3 mr-1" />
          {t('submissions.flaggedForReview')}
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-500">
        <FileCheck className="w-3 h-3 mr-1" />
        {t('submissions.pendingReview')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('submissions.loadingSubmissions')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) return null;

  const gradedCount = submissions.filter((s) => s.grade !== null).length;
  const pendingCount = submissions.filter((s) => s.grade === null).length;

  // Filter and sort submissions
  const getFilteredAndSortedSubmissions = () => {
    let filtered = [...submissions];

    // Filter by flagged status
    if (filterFlagged) {
      filtered = filtered.filter(s => s.is_flagged);
    }

    // Sort by plagiarism score
    if (sortByPlagiarism !== 'none') {
      filtered.sort((a, b) => {
        const scoreA = a.plagiarism_score ?? -1;
        const scoreB = b.plagiarism_score ?? -1;
        return sortByPlagiarism === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      });
    }

    return filtered;
  };

  const filteredSubmissions = getFilteredAndSortedSubmissions();

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/assignments')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('assignments.backToAssignments')}
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="w-8 h-8 text-purple-500" />
          {t('submissions.viewSubmissions')} "{assignment.title}"
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {assignment.subject_name} • {assignment.chapter_name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t('submissions.totalSubmissions')}</CardDescription>
            <CardTitle className="text-3xl">{submissions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t('assignments.graded')}</CardDescription>
            <CardTitle className="text-3xl text-green-500">{gradedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t('submissions.pendingReview')}</CardDescription>
            <CardTitle className="text-3xl text-blue-500">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Submissions and Lab Reports */}
      {labReports.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="submissions">
              <FileText className="w-4 h-4 mr-2" />
              {t('submissions.regularSubmissions')} ({submissions.length})
            </TabsTrigger>
            <TabsTrigger value="lab-reports">
              <TestTube className="w-4 h-4 mr-2" />
              {t('submissions.labReports')} ({labReports.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle>{t('submissions.allSubmissions')}</CardTitle>
                <CardDescription>{t('submissions.clickToGrade')}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filter and Sort Controls */}
                <div className="flex items-center gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="filterFlagged"
                      checked={filterFlagged}
                      onChange={(e) => setFilterFlagged(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="filterFlagged" className="text-sm font-medium cursor-pointer">
                      🚩 {t('submissions.showFlaggedOnly') || 'Show Flagged Only'}
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <label htmlFor="sortPlagiarism" className="text-sm font-medium">
                      {t('submissions.sortByPlagiarism') || 'Sort by Plagiarism:'}
                    </label>
                    <select
                      id="sortPlagiarism"
                      value={sortByPlagiarism}
                      onChange={(e) => setSortByPlagiarism(e.target.value as 'none' | 'asc' | 'desc')}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="none">{t('submissions.sortNone') || 'None'}</option>
                      <option value="desc">{t('submissions.sortHighToLow') || 'High to Low'}</option>
                      <option value="asc">{t('submissions.sortLowToHigh') || 'Low to High'}</option>
                    </select>
                  </div>

                  <div className="ml-auto text-sm text-gray-600">
                    {t('submissions.showing') || 'Showing'} {filteredSubmissions.length} {t('submissions.of') || 'of'} {submissions.length}
                  </div>
                </div>

                {submissions.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{t('submissions.noSubmissions')}</AlertDescription>
                  </Alert>
                ) : filteredSubmissions.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{t('submissions.noMatchingSubmissions') || 'No submissions match the selected filters.'}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {filteredSubmissions.map((submission) => (
                      <Card
                        key={submission.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleGradeSubmission(submission.id)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-gray-500" />
                                <div>
                                  <p className="font-semibold">{submission.student_name}</p>
                                  <p className="text-sm text-gray-600">{submission.student_email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <p className="text-sm text-gray-600">
                                  {new Date(submission.submitted_at).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {submission.content && (
                                  <Badge variant="outline">
                                    <FileText className="w-3 h-3 mr-1" />
                                    {t('submissions.text')}
                                  </Badge>
                                )}
                                {submission.file_url && (
                                  <Badge variant="outline">
                                    <FileCheck className="w-3 h-3 mr-1" />
                                    {t('submissions.file')}
                                  </Badge>
                                )}
                              </div>
                              {/* Plagiarism Score */}
                              {submission.plagiarism_score !== null && (
                                <div className="flex items-center gap-2">
                                  <div className="text-sm">
                                    <p className="text-gray-600 text-xs">{t('submissions.plagiarismScore')}</p>
                                    <p className={`font-semibold ${
                                      submission.plagiarism_score > 70 ? 'text-red-600' :
                                      submission.plagiarism_score > 40 ? 'text-yellow-600' :
                                      'text-green-600'
                                    }`}>
                                      {submission.plagiarism_score.toFixed(1)}%
                                    </p>
                                  </div>
                                  {submission.is_flagged && (
                                    <Badge variant="destructive" className="animate-pulse">
                                      🚩
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {getSubmissionStatus(submission)}
                              <Button size="sm">
                                {submission.grade !== null ? t('submissions.viewGrade') : t('submissions.gradeNow')}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lab-reports">
            <Card>
              <CardHeader>
                <CardTitle>{t('submissions.labReportSubmissions')}</CardTitle>
                <CardDescription>{t('submissions.clickViewLabReports')}</CardDescription>
              </CardHeader>
              <CardContent>
                {labReports.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{t('submissions.noLabReports')}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {labReports.map((labReport) => (
                      <Card
                        key={labReport.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => window.open(`/teacher/lab-report/${labReport.id}`, '_blank')}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex items-center gap-2">
                                <TestTube className="w-5 h-5 text-green-500" />
                                <div>
                                  <p className="font-semibold">{labReport.report_data?.title || t('submissions.labReport')}</p>
                                  <p className="text-sm text-gray-600">{t('submissions.studentID')} {labReport.student_id}</p>
                                </div>
                              </div>
                              {labReport.submitted_at && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-500" />
                                  <p className="text-sm text-gray-600">
                                    {new Date(labReport.submitted_at).toLocaleString()}
                                  </p>
                                </div>
                              )}
                              {labReport.grade !== null && labReport.grade !== undefined ? (
                                <Badge className="bg-green-500">
                                  <Award className="w-3 h-3 mr-1" />
                                  {t('submissions.graded')} {labReport.grade}/{assignment?.max_score || 100}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-50">
                                  <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                                  {t('submissions.submitted')}
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {labReport.grade === null || labReport.grade === undefined ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => handleAIGradeLabReport(labReport.id, e)}
                                >
                                  <Sparkles className="w-4 h-4 mr-2" />
                                  {t('submissions.aiGrade')}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toast.info(`${t('submissions.gradeLabel')} ${labReport.grade}/${assignment?.max_score || 100}\n\n${t('submissions.feedbackLabel')} ${labReport.feedback || t('submissions.noFeedbackProvided')}`);
                                  }}
                                >
                                  <Award className="w-4 h-4 mr-2" />
                                  {t('submissions.viewGrade')}
                                </Button>
                              )}
                              <Button size="sm" variant="outline">
                                <FileText className="w-4 h-4 mr-2" />
                                {t('submissions.viewReport')}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('submissions.allSubmissions')}</CardTitle>
            <CardDescription>{t('submissions.clickToGrade')}</CardDescription>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{t('submissions.noSubmissions')}</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <Card
                    key={submission.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleGradeSubmission(submission.id)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-500" />
                            <div>
                              <p className="font-semibold">{submission.student_name}</p>
                              <p className="text-sm text-gray-600">{submission.student_email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <p className="text-sm text-gray-600">
                              {new Date(submission.submitted_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {submission.content && (
                              <Badge variant="outline">
                                <FileText className="w-3 h-3 mr-1" />
                                {t('submissions.text')}
                              </Badge>
                            )}
                            {submission.file_url && (
                              <Badge variant="outline">
                                <FileCheck className="w-3 h-3 mr-1" />
                                {t('submissions.file')}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getSubmissionStatus(submission)}
                          <Button size="sm">
                            {submission.grade !== null ? t('submissions.viewGrade') : t('submissions.gradeNow')}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Grading Confirmation Dialog */}
      <Dialog open={showAIGradeDialog} onOpenChange={setShowAIGradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('submissions.aiGradeLabReport')}</DialogTitle>
            <DialogDescription>
              {t('submissions.aiGradeDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                {t('submissions.aiGradingInfo')}
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAIGradeDialog(false);
                setSelectedLabReportId(null);
              }}
              disabled={aiGrading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={confirmAIGrade}
              disabled={aiGrading}
            >
              {aiGrading ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                  {t('submissions.aiGrading')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('submissions.confirmAIGrade')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewSubmissions;
