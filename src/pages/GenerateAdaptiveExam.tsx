import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Brain,
  Target,
  TrendingUp,
  Clock,
  BookOpen,
  Zap,
  CheckCircle,
  AlertCircle,
  BarChart3,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Chapter {
  id: number;
  name: string;
  subject_id: number;
  subject_name?: string;
}

interface AdaptiveExamResult {
  questions: any[];
  analysis: {
    weak_bloom_levels: string[];
    weak_difficulties: string[];
    avg_score: number | null;
    attempts_count: number;
  };
  distribution: {
    bloom_levels: Record<string, number>;
    difficulties: Record<string, number>;
  };
  chapter_name: string;
  total_questions: number;
  duration_minutes: number;
}

const bloomLevelLabels: Record<string, string> = {
  remember: 'Remember',
  understand: 'Understand',
  apply: 'Apply',
  analyze: 'Analyze',
  evaluate: 'Evaluate',
  create: 'Create',
};

const difficultyLabels: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const GenerateAdaptiveExam = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [numQuestions, setNumQuestions] = useState<number>(30);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [generatedExam, setGeneratedExam] = useState<AdaptiveExamResult | null>(null);

  // Fetch available chapters
  const { data: chapters = [], isLoading: chaptersLoading } = useQuery<Chapter[]>({
    queryKey: ['chapters'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/subjects/chapters/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // Generate adaptive exam mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedChapterId) throw new Error('No chapter selected');
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_URL}/exams/generate-adaptive`,
        {
          chapter_id: selectedChapterId,
          num_questions: numQuestions,
          duration_minutes: durationMinutes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    onSuccess: (data: AdaptiveExamResult) => {
      setGeneratedExam(data);
      toast({
        title: 'Success!',
        description: 'Adaptive exam generated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to generate exam',
        variant: 'destructive',
      });
    },
  });

  const handleGenerate = () => {
    if (!selectedChapterId) {
      toast({
        title: 'Error',
        description: 'Please select a chapter first',
        variant: 'destructive',
      });
      return;
    }
    generateMutation.mutate();
  };

  const handleStartExam = () => {
    if (generatedExam && selectedChapterId) {
      // Navigate to exam page with generated questions
      // This would integrate with existing exam flow
      navigate(`/exam/adaptive/${selectedChapterId}`);
    }
  };

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          Generate Adaptive Exam
        </h1>
        <p className="text-muted-foreground">
          Take a personalized exam tailored to your learning progress and weak areas
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Exam Configuration
            </CardTitle>
            <CardDescription>
              Customize your adaptive exam parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Chapter Selection */}
            <div className="space-y-2">
              <Label htmlFor="chapter">Select Chapter</Label>
              <Select
                value={selectedChapterId?.toString() || ''}
                onValueChange={(value) => setSelectedChapterId(parseInt(value))}
                disabled={chaptersLoading}
              >
                <SelectTrigger id="chapter">
                  <SelectValue placeholder="Choose a chapter..." />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id.toString()}>
                      {chapter.name}
                      {chapter.subject_name && ` (${chapter.subject_name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Number of Questions */}
            <div className="space-y-2">
              <Label htmlFor="questions">
                Number of Questions: {numQuestions}
              </Label>
              <Slider
                id="questions"
                min={10}
                max={50}
                step={5}
                value={[numQuestions]}
                onValueChange={([value]) => setNumQuestions(value)}
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 20-30 questions
              </p>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">
                Time Limit: {durationMinutes} minutes
              </Label>
              <Slider
                id="duration"
                min={30}
                max={120}
                step={10}
                value={[durationMinutes]}
                onValueChange={([value]) => setDurationMinutes(value)}
              />
              <p className="text-xs text-muted-foreground">
                Approximately {Math.round(durationMinutes / numQuestions * 10) / 10} min per question
              </p>
            </div>

            <Separator />

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!selectedChapterId || generateMutation.isPending}
              className="w-full"
              size="lg"
            >
              {generateMutation.isPending ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-spin" />
                  Generating Exam...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Adaptive Exam
                </>
              )}
            </Button>

            <Alert>
              <Brain className="h-4 w-4" />
              <AlertDescription>
                The exam will be customized based on your previous quiz performance,
                focusing on your weak areas in Bloom's taxonomy levels and difficulty.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card className={generatedExam ? 'border-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Exam Analysis
            </CardTitle>
            <CardDescription>
              {generatedExam
                ? 'Your personalized exam is ready!'
                : 'Generate an exam to see the analysis'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!generatedExam ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <TrendingUp className="h-16 w-16 mb-4 opacity-50" />
                <p>No exam generated yet</p>
                <p className="text-sm">Configure and generate to see analysis</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Performance Analysis */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Performance Analysis
                  </h3>
                  <div className="space-y-2">
                    {generatedExam.analysis.attempts_count > 0 ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Average Score:</span>
                          <Badge variant="secondary">
                            {generatedExam.analysis.avg_score?.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Quiz Attempts:</span>
                          <Badge variant="secondary">
                            {generatedExam.analysis.attempts_count}
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No previous quiz data found. Exam will cover basic concepts.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Focus Areas */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Focus Areas
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Weak Bloom Levels:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {generatedExam.analysis.weak_bloom_levels.map((level) => (
                          <Badge key={level} variant="outline">
                            {bloomLevelLabels[level] || level}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Weak Difficulties:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {generatedExam.analysis.weak_difficulties.map((diff) => (
                          <Badge key={diff} variant="outline">
                            {difficultyLabels[diff] || diff}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Question Distribution */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Question Distribution
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        By Bloom Level:
                      </p>
                      <div className="space-y-1">
                        {Object.entries(generatedExam.distribution.bloom_levels)
                          .filter(([_, count]) => count > 0)
                          .map(([level, count]) => (
                            <div key={level} className="flex items-center justify-between text-sm">
                              <span>{bloomLevelLabels[level] || level}</span>
                              <Badge variant="secondary">{count}</Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        By Difficulty:
                      </p>
                      <div className="space-y-1">
                        {Object.entries(generatedExam.distribution.difficulties)
                          .filter(([_, count]) => count > 0)
                          .map(([diff, count]) => (
                            <div key={diff} className="flex items-center justify-between text-sm">
                              <span>{difficultyLabels[diff] || diff}</span>
                              <Badge variant="secondary">{count}</Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Exam Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Total Questions:
                    </span>
                    <span className="font-semibold">{generatedExam.total_questions}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time Limit:
                    </span>
                    <span className="font-semibold">{generatedExam.duration_minutes} min</span>
                  </div>
                </div>

                {/* Start Exam Button */}
                <Button
                  onClick={handleStartExam}
                  className="w-full"
                  size="lg"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Start Adaptive Exam
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GenerateAdaptiveExam;
