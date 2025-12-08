import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Book,
  Brain,
  CheckCircle,
  AlertCircle,
  Loader2,
  Zap,
  TrendingUp,
  BarChart3,
  HelpCircle,
  Shield
} from "lucide-react";
import { useSubjects, Subject } from '@/hooks/useSubjects';
import api from '@/services/api';
import { toast } from 'sonner';

interface GenerationResult {
  success: boolean;
  chapter_id: number;
  chapter_name: string;
  questions_generated: {
    beginner: number;
    medium: number;
    advanced: number;
    total: number;
  };
  message: string;
}

export default function QuestionGenerator() {
  const { data: subjectsData, isLoading: loadingSubjects } = useSubjects();
  const [generatingChapterId, setGeneratingChapterId] = useState<number | null>(null);
  const [results, setResults] = useState<Map<number, GenerationResult>>(new Map());
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);
  const [strictMode, setStrictMode] = useState(true); // Default: only use uploaded materials
  const navigate = useNavigate();

  const generateQuestionsForChapter = async (chapterId: number, chapterName: string) => {
    setGeneratingChapterId(chapterId);

    // Show progress toast immediately
    const progressToast = toast.loading(
      'Generating Questions...',
      {
        description: 'This takes 2-3 minutes. AI is creating 100 questions based on chapter resources. Please wait...',
        duration: Infinity
      }
    );

    try {
      const response = await api.post<GenerationResult>(
        `/questions/bulk-generate/${chapterId}`,
        {},
        { params: { overwrite: false, strict_mode: strictMode } }
      );

      const result = response.data;
      setResults(new Map(results.set(chapterId, result)));

      // Dismiss progress toast
      toast.dismiss(progressToast);

      toast.success(
        `Generated 100 questions for ${chapterName}`,
        {
          description: '30 beginner, 40 medium, 30 advanced'
        }
      );
    } catch (error: any) {
      // Dismiss progress toast
      toast.dismiss(progressToast);

      const errorMsg = error.response?.data?.detail || 'Failed to generate questions';

      // Better error messages
      if (errorMsg.includes('No resource chunks found') || errorMsg.includes('no resources')) {
        toast.error('No Resources Found', {
          description: `Chapter "${chapterName}" has no uploaded resources. Please upload a PDF or document first, then try again.`,
          duration: 8000,
          action: {
            label: 'Upload Resources',
            onClick: () => navigate('/upload-resource')
          }
        });
      } else if (errorMsg.includes('already has') && errorMsg.includes('questions')) {
        toast.warning('Questions Already Exist', {
          description: errorMsg,
          duration: 6000
        });
      } else {
        toast.error('Generation Failed', {
          description: errorMsg,
          duration: 6000
        });
      }

      console.error('Error generating questions:', error);
    } finally {
      setGeneratingChapterId(null);
    }
  };

  if (loadingSubjects) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading subjects...</p>
        </div>
      </div>
    );
  }

  const subjects = subjectsData?.subjects || [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Brain className="h-10 w-10 text-primary" />
          Bulk Question Generator
        </h1>
        <p className="text-muted-foreground text-lg">
          Generate 100 AI-powered questions per chapter (30 beginner, 40 medium, 30 advanced)
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Questions Per Chapter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">100</div>
            <p className="text-xs text-muted-foreground mt-1">
              Automatically distributed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Difficulty Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Beginner:</span>
                <Badge variant="outline">30</Badge>
              </div>
              <div className="flex justify-between">
                <span>Medium:</span>
                <Badge variant="outline">40</Badge>
              </div>
              <div className="flex justify-between">
                <span>Advanced:</span>
                <Badge variant="outline">30</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-green-500" />
              Bloom's Taxonomy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1">
              <div>Beginner: Remember, Understand</div>
              <div>Medium: Apply, Analyze</div>
              <div>Advanced: Evaluate, Create</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Banner */}
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> Generation uses AI and takes 2-3 minutes per chapter.
          Questions are based on uploaded chapter resources. Existing AI-generated questions will be preserved (not overwritten).
        </AlertDescription>
      </Alert>

      {/* Strict Mode Toggle */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="strict-mode"
              checked={strictMode}
              onCheckedChange={(checked) => setStrictMode(checked as boolean)}
            />
            <div className="flex items-center gap-2 flex-1">
              <Label
                htmlFor="strict-mode"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  Strict Mode (Recommended)
                </div>
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      <strong>Strict Mode:</strong> AI generates questions ONLY from uploaded chapter resources.
                      This ensures content accuracy and alignment with your materials.
                    </p>
                    <p className="text-sm mt-2">
                      <strong>Disabled:</strong> AI can use general knowledge in addition to uploaded resources.
                      May generate broader questions but less aligned with your specific content.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Badge variant={strictMode ? "default" : "secondary"} className="ml-auto">
              {strictMode ? "Only Uploaded Materials" : "Uploaded + General Knowledge"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Subjects and Chapters */}
      <div className="space-y-6">
        {subjects.map((subject: Subject) => (
          <Card key={subject.id} className="overflow-hidden">
            <CardHeader
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{subject.icon}</span>
                  <div>
                    <CardTitle className="text-xl">{subject.name}</CardTitle>
                    <CardDescription>
                      {subject.chapters.length} chapters • {subject.code}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {subject.category.replace('_', ' ')}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedSubject(expandedSubject === subject.id ? null : subject.id);
                    }}
                  >
                    {expandedSubject === subject.id ? '▼' : '▶'}
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expandedSubject === subject.id && (
              <CardContent className="border-t bg-muted/30">
                <div className="space-y-3 pt-4">
                  {subject.chapters.map((chapter) => {
                    const result = results.get(chapter.id);
                    const isGenerating = generatingChapterId === chapter.id;

                    return (
                      <div
                        key={chapter.id}
                        className="flex items-center justify-between p-4 bg-background rounded-lg border"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary">{chapter.order}</Badge>
                            <h4 className="font-medium">{chapter.name}</h4>
                            {result && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>

                          {result && (
                            <div className="mt-2 space-y-2">
                              <div className="flex gap-2 text-sm">
                                <Badge className="bg-green-100 text-green-800">
                                  30 Beginner
                                </Badge>
                                <Badge className="bg-blue-100 text-blue-800">
                                  40 Medium
                                </Badge>
                                <Badge className="bg-purple-100 text-purple-800">
                                  30 Advanced
                                </Badge>
                              </div>
                              <Progress value={100} className="h-2" />
                              <p className="text-xs text-muted-foreground">
                                Total: 100 questions generated
                              </p>
                            </div>
                          )}

                          {isGenerating && (
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generating questions with AI...
                              </div>
                              <Progress value={undefined} className="h-2" />
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => generateQuestionsForChapter(chapter.id, chapter.name)}
                            disabled={isGenerating || generatingChapterId !== null}
                            size="sm"
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : result ? (
                              <>
                                <Brain className="mr-2 h-4 w-4" />
                                Regenerate
                              </>
                            ) : (
                              <>
                                <Zap className="mr-2 h-4 w-4" />
                                Generate 100
                              </>
                            )}
                          </Button>

                          {result && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/teacher/questions/${chapter.id}`)}
                            >
                              <Book className="mr-2 h-4 w-4" />
                              View Questions
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {subjects.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No subjects found. Please contact admin to add subjects and chapters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
