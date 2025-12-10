import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Calendar, 
  User, 
  Shield,
  Flag,
  TrendingUp
} from "lucide-react";
import api from "@/lib/axios";
import { formatDistanceToNow } from "date-fns";

interface ExamSubmission {
  attempt_id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  score: number | null;
  percentage: number | null;
  passed: boolean;
  time_spent: number | null;
  submitted_at: string | null;
  auto_submitted: boolean;
  tab_switches: number;
  violations: any[];
  is_flagged: boolean;
  violation_count: number;
}

interface ExamSubmissionsData {
  exam_id: number;
  exam_title: string;
  exam_type: string;
  strict_mode: boolean;
  total_submissions: number;
  flagged_submissions: number;
  submissions: ExamSubmission[];
}

export default function ExamSubmissions() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<ExamSubmissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchExamSubmissions();
  }, [examId]);

  const fetchExamSubmissions = async () => {
    try {
      const response = await api.get(`/exams/${examId}/submissions`);
      setData(response.data);
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching exam submissions:", error);
      toast.error("Failed to load exam submissions");
      setLoading(false);
    }
  };

  const getStatusBadge = (submission: ExamSubmission) => {
    if (submission.is_flagged || submission.violation_count > 0) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <Flag className="h-3 w-3" />
          Flagged
        </Badge>
      );
    }
    if (submission.passed) {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          <CheckCircle className="h-3 w-3" />
          Passed
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Failed
      </Badge>
    );
  };

  const getViolationsBadge = (submission: ExamSubmission) => {
    if (submission.violation_count === 0) {
      return null;
    }
    
    const isSerious = submission.violation_count >= 3;
    return (
      <Badge 
        variant={isSerious ? "destructive" : "secondary"}
        className={`flex items-center gap-1 ${isSerious ? 'bg-red-600' : 'bg-orange-500'}`}
      >
        <AlertTriangle className="h-3 w-3" />
        Violations: {submission.violation_count}
      </Badge>
    );
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const filteredSubmissions = data?.submissions.filter(submission => {
    if (activeTab === "flagged") return submission.is_flagged || submission.violation_count > 0;
    if (activeTab === "passed") return submission.passed;
    if (activeTab === "failed") return !submission.passed;
    return true;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading exam submissions...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load exam submissions. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{data.exam_title} - Submissions</h1>
            <p className="text-muted-foreground">
              Review student exam submissions and violations
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/teacher")}>
            Back to Dashboard
          </Button>
        </div>

        {/* Exam Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Submissions</p>
                  <p className="text-2xl font-bold">{data.total_submissions}</p>
                </div>
                <User className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Flagged Submissions</p>
                  <p className="text-2xl font-bold text-red-600">{data.flagged_submissions}</p>
                </div>
                <Flag className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Exam Type</p>
                  <p className="text-lg font-semibold capitalize">{data.exam_type.replace('_', ' ')}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Strict Mode</p>
                  <p className="text-lg font-semibold">{data.strict_mode ? 'Enabled' : 'Disabled'}</p>
                </div>
                <Shield className={`h-8 w-8 ${data.strict_mode ? 'text-red-500' : 'text-gray-400'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Violations Alert */}
        {data.flagged_submissions > 0 && (
          <Alert className="mb-6 border-red-500 bg-red-50 text-red-900">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <strong>{data.flagged_submissions}</strong> submissions have been flagged for violations. 
              Review these carefully for potential academic integrity issues.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({data.total_submissions})</TabsTrigger>
          <TabsTrigger value="flagged">Flagged ({data.flagged_submissions})</TabsTrigger>
          <TabsTrigger value="passed">Passed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <Card key={submission.attempt_id} className={`hover:shadow-lg transition-shadow ${submission.is_flagged ? 'border-red-500' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3">
                        {submission.student_name}
                        {getStatusBadge(submission)}
                        {getViolationsBadge(submission)}
                        {submission.auto_submitted && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Auto-submitted
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{submission.student_email}</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/exam-results/${submission.attempt_id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Score: </span>
                      <span className="font-semibold">
                        {submission.percentage ? `${submission.percentage.toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Time: </span>
                      <span className="font-semibold">
                        {formatTime(submission.time_spent)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tab Switches: </span>
                      <span className={`font-semibold ${submission.tab_switches > 0 ? 'text-red-600' : ''}`}>
                        {submission.tab_switches}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Violations: </span>
                      <span className={`font-semibold ${submission.violation_count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {submission.violation_count}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Submitted: </span>
                      <span className="font-semibold">
                        {submission.submitted_at 
                          ? formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Violation Details */}
                  {submission.violations.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-semibold text-red-800 mb-2">Violation Details:</h4>
                      <ul className="space-y-1 text-sm text-red-700">
                        {submission.violations.map((violation, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3" />
                            {violation.type}: {violation.description || 'Detected violation'}
                            {violation.timestamp && (
                              <span className="text-red-600 ml-2">
                                ({new Date(violation.timestamp).toLocaleTimeString()})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {filteredSubmissions.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No submissions found for this filter.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}