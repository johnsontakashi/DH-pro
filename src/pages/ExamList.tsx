import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertTriangle } from "lucide-react";
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
}

export default function ExamList() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.get("/exams/available");
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
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Available Exams</h1>
        <p className="text-muted-foreground">
          View and start your scheduled exams
        </p>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No exams available at this time</p>
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
                      {exam.strict_mode && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Strict Mode
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{exam.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                  <div>
                    <span className="text-muted-foreground">Type: </span>
                    <span className="font-semibold capitalize">{exam.exam_type.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Until {format(new Date(exam.available_until), "MMM d, yyyy HH:mm")}
                    </span>
                  </div>

                  <Button onClick={() => navigate(`/exam/${exam.id}`)}>
                    Start Exam
                  </Button>
                </div>

                {exam.strict_mode && (
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-yellow-800 dark:text-yellow-200">Strict Mode Enabled</p>
                        <p className="text-yellow-700 dark:text-yellow-300">
                          Tab switching will be monitored. Full screen required. Violations will be recorded.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
