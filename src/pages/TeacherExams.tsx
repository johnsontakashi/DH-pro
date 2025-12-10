import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  Clock, 
  Users, 
  Shield, 
  AlertTriangle, 
  Eye, 
  Plus,
  FileCheck,
  TrendingUp
} from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { format } from "date-fns";

interface Exam {
  id: number;
  title: string;
  description: string;
  exam_type: string;
  time_limit: number;
  passing_score: number;
  strict_mode: boolean;
  available_from: string;
  available_until: string;
  max_attempts: number;
  is_published: boolean;
  total_submissions?: number;
  flagged_submissions?: number;
}

export default function TeacherExams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.get("/exams/teacher/list");
      setExams(response.data);
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching exams:", error);
      toast.error("Failed to load exams");
      setLoading(false);
    }
  };

  const getExamTypeBadge = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      midterm: { label: "Midterm", color: "bg-blue-500" },
      final: { label: "Final", color: "bg-red-500" },
      unit_test: { label: "Unit Test", color: "bg-green-500" }
    };
    const info = types[type] || types.unit_test;
    return <Badge className={info.color}>{info.label}</Badge>;
  };

  const getStatusBadge = (exam: Exam) => {
    const now = new Date();
    const availableFrom = new Date(exam.available_from);
    const availableUntil = new Date(exam.available_until);

    if (!exam.is_published) {
      return <Badge variant="secondary">Draft</Badge>;
    }
    if (now < availableFrom) {
      return <Badge variant="outline">Scheduled</Badge>;
    }
    if (now > availableUntil) {
      return <Badge variant="destructive">Closed</Badge>;
    }
    return <Badge variant="default" className="bg-green-600">Active</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Exam Management</h1>
            <p className="text-muted-foreground">
              Monitor exam submissions, violations, and student performance
            </p>
          </div>
          <Button onClick={() => navigate("/teacher/create-exam")}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Exam
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Exams</p>
                  <p className="text-2xl font-bold">{exams.length}</p>
                </div>
                <FileCheck className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Exams</p>
                  <p className="text-2xl font-bold">
                    {exams.filter(exam => {
                      const now = new Date();
                      return exam.is_published && 
                             new Date(exam.available_from) <= now && 
                             new Date(exam.available_until) >= now;
                    }).length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Strict Mode Exams</p>
                  <p className="text-2xl font-bold">
                    {exams.filter(exam => exam.strict_mode).length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Violations</p>
                  <p className="text-2xl font-bold text-red-600">
                    {exams.reduce((total, exam) => total + (exam.flagged_submissions || 0), 0)}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Exams List */}
      {exams.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No exams created yet</p>
            <Button 
              className="mt-4" 
              onClick={() => navigate("/teacher/create-exam")}
            >
              Create Your First Exam
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle>{exam.title}</CardTitle>
                      {getExamTypeBadge(exam.exam_type)}
                      {getStatusBadge(exam)}
                      {exam.strict_mode && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Strict Mode
                        </Badge>
                      )}
                      {(exam.flagged_submissions || 0) > 0 && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {exam.flagged_submissions} Violations
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{exam.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/exam-submissions/${exam.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Submissions
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{exam.time_limit} minutes</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Passing: </span>
                    <span className="font-semibold">{exam.passing_score}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Attempts: </span>
                    <span className="font-semibold">{exam.max_attempts}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{exam.total_submissions || 0} submissions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Until {format(new Date(exam.available_until), "MMM d, HH:mm")}
                    </span>
                  </div>
                </div>

                {exam.strict_mode && (
                  <div className="mt-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                          Strict Mode Active
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-300">
                          Tab switching monitored, violations tracked, full screen required
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {(exam.flagged_submissions || 0) > 0 && (
                  <Alert className="mt-4 border-red-500 bg-red-50 text-red-900">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription>
                      <strong>{exam.flagged_submissions}</strong> submissions have violations. 
                      Review these for potential academic integrity issues.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}