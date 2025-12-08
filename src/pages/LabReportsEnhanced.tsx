import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLabReports, type LabReport } from '@/hooks/useLabReports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  FileText,
  Upload,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  Edit,
  Send,
  Calendar,
  User,
  BookOpen,
  RefreshCw
} from 'lucide-react';

const LabReportsEnhanced = () => {
  const { user } = useAuth();
  const { reports, loading, createAssignment, submitReport, gradeReport, getStats, refreshReports } = useLabReports();
  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  
  const [newReportTitle, setNewReportTitle] = useState('');
  const [newReportSubject, setNewReportSubject] = useState('');
  const [newReportDescription, setNewReportDescription] = useState('');
  const [newReportDueDate, setNewReportDueDate] = useState('');
  
  const [submissionContent, setSubmissionContent] = useState('');
  const [gradeValue, setGradeValue] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  const stats = getStats();

  // Auto-refresh every 5 seconds to simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      refreshReports();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [refreshReports]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'submitted': return 'bg-blue-500';
      case 'graded': return 'bg-green-500';
      case 'returned': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit className="h-4 w-4" />;
      case 'submitted': return <Send className="h-4 w-4" />;
      case 'graded': return <CheckCircle className="h-4 w-4" />;
      case 'returned': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleSubmitReport = () => {
    if (!submissionContent.trim()) {
      toast.error('Please enter your lab report content');
      return;
    }
    
    if (selectedReport) {
      submitReport(selectedReport.id, submissionContent);
      setIsSubmitModalOpen(false);
      setSubmissionContent('');
      setSelectedReport(null);
    }
  };

  const handleCreateAssignment = () => {
    if (!newReportTitle.trim() || !newReportSubject.trim() || !newReportDueDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    createAssignment(
      newReportTitle,
      newReportSubject,
      newReportDescription,
      newReportDueDate
    );
    
    setIsCreateModalOpen(false);
    setNewReportTitle('');
    setNewReportSubject('');
    setNewReportDescription('');
    setNewReportDueDate('');
  };

  const handleGradeReport = () => {
    if (!gradeValue || parseInt(gradeValue) < 0 || parseInt(gradeValue) > 100) {
      toast.error('Please enter a valid grade (0-100)');
      return;
    }
    
    if (selectedReport) {
      gradeReport(selectedReport.id, parseInt(gradeValue), gradeFeedback);
      setIsGradeModalOpen(false);
      setGradeValue('');
      setGradeFeedback('');
      setSelectedReport(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (dateString.includes('T')) {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading lab reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lab Reports</h1>
          <p className="text-muted-foreground">
            {isStudent ? 'Submit and track your practical work reports' : 'Manage and grade student lab reports'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshReports}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {isTeacher && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {isStudent ? 'Assigned to you' : 'From all students'}
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              {isStudent ? 'To be submitted' : 'To be graded'}
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              {isStudent ? 'Graded reports' : 'Graded by you'}
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isStudent ? 'Your Average' : 'Class Average'}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageGrade}%</div>
            <p className="text-xs text-muted-foreground">
              {isStudent ? 'Your performance' : 'All submissions'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>
            {isStudent ? 'Your Lab Reports' : 'Student Submissions'}
          </CardTitle>
          <CardDescription>
            {isStudent ? 'View and submit your lab reports' : 'Review and grade student lab reports'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isTeacher ? (
            <Tabs defaultValue="pending" className="space-y-4">
              <TabsList>
                <TabsTrigger value="pending">Pending Review ({reports.filter(r => r.status === 'submitted').length})</TabsTrigger>
                <TabsTrigger value="graded">Graded ({reports.filter(r => r.status === 'graded').length})</TabsTrigger>
                <TabsTrigger value="all">All Reports ({reports.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4">
                {reports.filter(r => r.status === 'submitted').length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending submissions</p>
                ) : (
                  reports.filter(r => r.status === 'submitted').map((report) => (
                    <ReportCard 
                      key={report.id} 
                      report={report} 
                      isStudent={false}
                      onView={() => {
                        setSelectedReport(report);
                        setIsViewModalOpen(true);
                      }}
                      onGrade={() => {
                        setSelectedReport(report);
                        setIsGradeModalOpen(true);
                      }}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="graded" className="space-y-4">
                {reports.filter(r => r.status === 'graded').length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No graded reports yet</p>
                ) : (
                  reports.filter(r => r.status === 'graded').map((report) => (
                    <ReportCard 
                      key={report.id} 
                      report={report} 
                      isStudent={false}
                      onView={() => {
                        setSelectedReport(report);
                        setIsViewModalOpen(true);
                      }}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="all" className="space-y-4">
                {reports.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No reports yet. Create an assignment to get started.</p>
                ) : (
                  reports.map((report) => (
                    <ReportCard 
                      key={report.id} 
                      report={report} 
                      isStudent={false}
                      onView={() => {
                        setSelectedReport(report);
                        setIsViewModalOpen(true);
                      }}
                      onGrade={() => {
                        setSelectedReport(report);
                        setIsGradeModalOpen(true);
                      }}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4">
              {reports.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No lab reports assigned yet.</p>
              ) : (
                reports.map((report) => (
                  <ReportCard 
                    key={report.id} 
                    report={report} 
                    isStudent={true}
                    onView={() => {
                      setSelectedReport(report);
                      setIsViewModalOpen(true);
                    }}
                    onSubmit={() => {
                      setSelectedReport(report);
                      setIsSubmitModalOpen(true);
                    }}
                  />
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Report Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedReport?.title}</DialogTitle>
            <DialogDescription>
              {selectedReport?.subject} • Due: {formatDate(selectedReport?.dueDate)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {isTeacher && (
                <>
                  <div>
                    <Label>Student</Label>
                    <p className="text-sm">{selectedReport?.studentName}</p>
                  </div>
                  <div>
                    <Label>Submitted</Label>
                    <p className="text-sm">{selectedReport?.submittedAt ? formatDate(selectedReport.submittedAt) : 'Not submitted'}</p>
                  </div>
                </>
              )}
              {isStudent && (
                <>
                  {selectedReport?.grade !== undefined && (
                    <div>
                      <Label>Grade</Label>
                      <p className="text-2xl font-bold">{selectedReport.grade}%</p>
                    </div>
                  )}
                  <div>
                    <Label>Teacher</Label>
                    <p className="text-sm">{selectedReport?.teacherName}</p>
                  </div>
                </>
              )}
            </div>
            
            <div>
              <Label>Description</Label>
              <p className="text-sm mt-1">{selectedReport?.description}</p>
            </div>

            {selectedReport?.content && (
              <div>
                <Label>Submitted Content</Label>
                <div className="mt-1 p-3 bg-muted rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap">{selectedReport.content}</pre>
                </div>
              </div>
            )}

            {selectedReport?.feedback && (
              <div>
                <Label>Teacher Feedback</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-lg">{selectedReport.feedback}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit Report Modal (Student) */}
      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit Lab Report</DialogTitle>
            <DialogDescription>
              {selectedReport?.title} • {selectedReport?.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Report Content</Label>
              <Textarea
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                placeholder="Enter your lab report content here..."
                rows={10}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setIsSubmitModalOpen(false);
                setSubmissionContent('');
              }}>
                Cancel
              </Button>
              <Button onClick={handleSubmitReport}>
                <Send className="mr-2 h-4 w-4" />
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Assignment Modal (Teacher) */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Lab Report Assignment</DialogTitle>
            <DialogDescription>
              Assign a new lab report to your students
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={newReportTitle}
                onChange={(e) => setNewReportTitle(e.target.value)}
                placeholder="e.g., Ohm's Law Verification"
              />
            </div>

            <div>
              <Label>Subject</Label>
              <Select value={newReportSubject} onValueChange={setNewReportSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Biology">Biology</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newReportDescription}
                onChange={(e) => setNewReportDescription(e.target.value)}
                placeholder="Describe the lab objectives and requirements..."
                rows={3}
              />
            </div>

            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={newReportDueDate}
                onChange={(e) => setNewReportDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setIsCreateModalOpen(false);
                setNewReportTitle('');
                setNewReportSubject('');
                setNewReportDescription('');
                setNewReportDueDate('');
              }}>
                Cancel
              </Button>
              <Button onClick={handleCreateAssignment}>
                <Plus className="mr-2 h-4 w-4" />
                Create Assignment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grade Report Modal (Teacher) */}
      <Dialog open={isGradeModalOpen} onOpenChange={setIsGradeModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Grade Lab Report</DialogTitle>
            <DialogDescription>
              {selectedReport?.studentName} • {selectedReport?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedReport?.content && (
              <div>
                <Label>Student's Submission</Label>
                <div className="mt-1 p-3 bg-muted rounded-lg max-h-48 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">{selectedReport.content}</pre>
                </div>
              </div>
            )}

            <div>
              <Label>Grade (0-100)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={gradeValue}
                onChange={(e) => setGradeValue(e.target.value)}
                placeholder="Enter grade"
              />
            </div>

            <div>
              <Label>Feedback</Label>
              <Textarea
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                placeholder="Provide constructive feedback for the student..."
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setIsGradeModalOpen(false);
                setGradeValue('');
                setGradeFeedback('');
              }}>
                Cancel
              </Button>
              <Button onClick={handleGradeReport}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Submit Grade
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Report Card Component
const ReportCard = ({ 
  report, 
  isStudent, 
  onView, 
  onSubmit, 
  onGrade 
}: { 
  report: LabReport; 
  isStudent: boolean;
  onView: () => void;
  onSubmit?: () => void;
  onGrade?: () => void;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'submitted': return 'bg-blue-500';
      case 'graded': return 'bg-green-500';
      case 'returned': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit className="h-4 w-4" />;
      case 'submitted': return <Send className="h-4 w-4" />;
      case 'graded': return <CheckCircle className="h-4 w-4" />;
      case 'returned': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg ${getStatusColor(report.status)} bg-opacity-10 flex items-center justify-center`}>
          {getStatusIcon(report.status)}
        </div>
        <div>
          <p className="font-medium">{report.title}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{report.subject}</Badge>
            {!isStudent && (
              <>
                <span>•</span>
                <User className="h-3 w-3" />
                <span>{report.studentName}</span>
              </>
            )}
            <span>•</span>
            <Calendar className="h-3 w-3" />
            <span>Due: {new Date(report.dueDate).toLocaleDateString()}</span>
            {report.grade !== undefined && (
              <>
                <span>•</span>
                <span className="font-medium text-success">Grade: {report.grade}%</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Badge className={getStatusColor(report.status) + ' text-white'}>
          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
        </Badge>
        
        <Button variant="outline" size="sm" onClick={onView}>
          <Eye className="h-4 w-4" />
        </Button>
        
        {isStudent && report.status === 'draft' && onSubmit && (
          <Button size="sm" onClick={onSubmit}>
            <Send className="mr-1 h-4 w-4" />
            Submit
          </Button>
        )}
        
        {!isStudent && report.status === 'submitted' && onGrade && (
          <Button size="sm" onClick={onGrade}>
            <CheckCircle className="mr-1 h-4 w-4" />
            Grade
          </Button>
        )}
      </div>
    </div>
  );
};

export default LabReportsEnhanced;