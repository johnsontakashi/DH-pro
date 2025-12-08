import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  BookOpen
} from 'lucide-react';

interface LabReport {
  id: number;
  title: string;
  subject: string;
  studentName?: string;
  studentId?: string;
  status: 'draft' | 'submitted' | 'graded' | 'returned';
  submittedAt?: string;
  dueDate: string;
  grade?: number;
  feedback?: string;
  description: string;
  attachments?: string[];
  teacherName?: string;
}

const LabReports = () => {
  const { user } = useAuth();
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

  // Sample data for students
  const studentReports: LabReport[] = [
    {
      id: 1,
      title: "Ohm's Law Experiment",
      subject: "Physics",
      status: 'graded',
      submittedAt: '2024-01-15',
      dueDate: '2024-01-14',
      grade: 92,
      feedback: 'Excellent work! Your calculations were accurate and the analysis was thorough.',
      description: 'Verify Ohm\'s law by measuring voltage and current in a simple circuit.',
      teacherName: 'Dr. Smith'
    },
    {
      id: 2,
      title: "Chemical Reactions Lab",
      subject: "Chemistry",
      status: 'submitted',
      submittedAt: '2024-01-18',
      dueDate: '2024-01-20',
      description: 'Observe and document various chemical reactions and their products.',
      teacherName: 'Prof. Johnson'
    },
    {
      id: 3,
      title: "Circuit Analysis Project",
      subject: "Electronics",
      status: 'draft',
      dueDate: '2024-01-25',
      description: 'Analyze complex circuits using Kirchhoff\'s laws and nodal analysis.',
      teacherName: 'Dr. Chen'
    },
    {
      id: 4,
      title: "Pendulum Motion Study",
      subject: "Physics",
      status: 'returned',
      submittedAt: '2024-01-10',
      dueDate: '2024-01-10',
      grade: 85,
      feedback: 'Good effort, but the error analysis section needs more detail.',
      description: 'Study the motion of a simple pendulum and verify the period formula.',
      teacherName: 'Dr. Smith'
    }
  ];

  // Sample data for teachers
  const teacherReports: LabReport[] = [
    {
      id: 1,
      title: "Ohm's Law Experiment",
      subject: "Physics",
      studentName: "Alex Johnson",
      studentId: "ST001",
      status: 'submitted',
      submittedAt: '2024-01-18',
      dueDate: '2024-01-20',
      description: 'Verify Ohm\'s law by measuring voltage and current in a simple circuit.'
    },
    {
      id: 2,
      title: "Ohm's Law Experiment",
      subject: "Physics",
      studentName: "Sarah Chen",
      studentId: "ST002",
      status: 'graded',
      submittedAt: '2024-01-17',
      dueDate: '2024-01-20',
      grade: 95,
      feedback: 'Outstanding work with excellent attention to detail.',
      description: 'Verify Ohm\'s law by measuring voltage and current in a simple circuit.'
    },
    {
      id: 3,
      title: "Circuit Analysis Project",
      subject: "Electronics",
      studentName: "Marcus Davis",
      studentId: "ST003",
      status: 'submitted',
      submittedAt: '2024-01-19',
      dueDate: '2024-01-25',
      description: 'Analyze complex circuits using Kirchhoff\'s laws and nodal analysis.'
    },
    {
      id: 4,
      title: "Digital Filters Lab",
      subject: "Signal Processing",
      studentName: "Emma Wilson",
      studentId: "ST004",
      status: 'submitted',
      submittedAt: '2024-01-18',
      dueDate: '2024-01-19',
      description: 'Design and implement various digital filters for signal processing.'
    }
  ];

  const reports = isStudent ? studentReports : teacherReports;
  
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
    setIsSubmitModalOpen(false);
    setSubmissionContent('');
    toast.success('Lab report submitted successfully!');
  };

  const handleCreateAssignment = () => {
    if (!newReportTitle.trim() || !newReportSubject.trim() || !newReportDueDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    setIsCreateModalOpen(false);
    setNewReportTitle('');
    setNewReportSubject('');
    setNewReportDescription('');
    setNewReportDueDate('');
    toast.success('Lab report assignment created successfully!');
  };

  const handleGradeReport = () => {
    if (!gradeValue || parseInt(gradeValue) < 0 || parseInt(gradeValue) > 100) {
      toast.error('Please enter a valid grade (0-100)');
      return;
    }
    setIsGradeModalOpen(false);
    setGradeValue('');
    setGradeFeedback('');
    toast.success('Lab report graded successfully!');
  };

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
        {isTeacher && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Assignment
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
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
            <div className="text-2xl font-bold">
              {reports.filter(r => isStudent ? r.status === 'draft' : r.status === 'submitted').length}
            </div>
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
            <div className="text-2xl font-bold">
              {reports.filter(r => r.status === 'graded' || r.status === 'returned').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {isStudent ? 'Graded reports' : 'Graded by you'}
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isStudent ? 'Average Grade' : 'Class Average'}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">88.5%</div>
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
                <TabsTrigger value="pending">Pending Review</TabsTrigger>
                <TabsTrigger value="graded">Graded</TabsTrigger>
                <TabsTrigger value="all">All Reports</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4">
                {reports.filter(r => r.status === 'submitted').map((report) => (
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
                ))}
              </TabsContent>

              <TabsContent value="graded" className="space-y-4">
                {reports.filter(r => r.status === 'graded').map((report) => (
                  <ReportCard 
                    key={report.id} 
                    report={report} 
                    isStudent={false}
                    onView={() => {
                      setSelectedReport(report);
                      setIsViewModalOpen(true);
                    }}
                  />
                ))}
              </TabsContent>

              <TabsContent value="all" className="space-y-4">
                {reports.map((report) => (
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
                ))}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Report Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedReport?.title}</DialogTitle>
            <DialogDescription>
              {selectedReport?.subject} • Due: {selectedReport?.dueDate}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {isTeacher && (
                <>
                  <div>
                    <Label>Student</Label>
                    <p className="text-sm">{selectedReport?.studentName} ({selectedReport?.studentId})</p>
                  </div>
                  <div>
                    <Label>Submitted</Label>
                    <p className="text-sm">{selectedReport?.submittedAt || 'Not submitted'}</p>
                  </div>
                </>
              )}
              {isStudent && selectedReport?.grade && (
                <>
                  <div>
                    <Label>Grade</Label>
                    <p className="text-2xl font-bold">{selectedReport.grade}%</p>
                  </div>
                  <div>
                    <Label>Teacher</Label>
                    <p className="text-sm">{selectedReport.teacherName}</p>
                  </div>
                </>
              )}
            </div>
            
            <div>
              <Label>Description</Label>
              <p className="text-sm mt-1">{selectedReport?.description}</p>
            </div>

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
              {isStudent && selectedReport?.status === 'graded' && (
                <Button onClick={() => {
                  toast.success('Downloading lab report...');
                  setIsViewModalOpen(false);
                }}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              )}
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
                placeholder="Enter your lab report content or paste it here..."
                rows={8}
              />
            </div>
            
            <div>
              <Label>Attachments (Optional)</Label>
              <div className="mt-2 border-2 border-dashed rounded-lg p-4 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop files here or click to browse
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Choose Files
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsSubmitModalOpen(false)}>
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
                placeholder="Enter lab report title"
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
                  <SelectItem value="Signal Processing">Signal Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newReportDescription}
                onChange={(e) => setNewReportDescription(e.target.value)}
                placeholder="Describe the lab report requirements"
                rows={3}
              />
            </div>

            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={newReportDueDate}
                onChange={(e) => setNewReportDueDate(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
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
                placeholder="Provide feedback for the student..."
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsGradeModalOpen(false)}>
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
            <span>Due: {report.dueDate}</span>
            {report.grade && (
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

export default LabReports;