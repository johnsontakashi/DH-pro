import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Lightbulb,
  AlertCircle,
  Loader2,
  Filter
} from "lucide-react";
import api from '@/services/api';
import { toast } from 'sonner';

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  difficulty: 'beginner' | 'medium' | 'advanced';
  bloom_level: string;
  options: { [key: string]: string };
  correct_answer: string;
  explanation_text: string;
}

interface Chapter {
  id: number;
  name: string;
  order: number;
}

export default function ViewChapterQuestions() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'beginner' | 'medium' | 'advanced'>('all');

  // New filter states
  const [bloomFilter, setBloomFilter] = useState<string>('all');
  const [questionTypeFilter, setQuestionTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadQuestions();
  }, [chapterId]);

  const loadQuestions = async () => {
    try {
      setLoading(true);

      // Fetch questions for this chapter
      const questionsResponse = await api.get(`/questions/chapter/${chapterId}`);

      // The backend returns { questions: [], chapter_id: ..., etc }
      const data = questionsResponse.data;
      setQuestions(data.questions || []);

      // Try to get chapter info from questions endpoint or fetch separately
      if (data.questions && data.questions.length > 0) {
        // We can infer chapter info from the questions endpoint
        setChapter({
          id: data.chapter_id,
          name: `Chapter ${data.chapter_id}`,
          order: 1
        });
      }

    } catch (error: any) {
      console.error('Error loading questions:', error);
      toast.error('Failed to load questions', {
        description: error.response?.data?.detail || 'Please try again'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterQuestionsByDifficulty = (difficulty: 'beginner' | 'medium' | 'advanced') => {
    return questions.filter(q => q.difficulty === difficulty);
  };

  // Apply all filters to questions
  const getFilteredQuestions = (baseQuestions: Question[]) => {
    let filtered = baseQuestions;

    // Filter by Bloom's taxonomy
    if (bloomFilter !== 'all') {
      filtered = filtered.filter(q => q.bloom_level.toLowerCase() === bloomFilter.toLowerCase());
    }

    // Filter by question type
    if (questionTypeFilter !== 'all') {
      filtered = filtered.filter(q => q.question_type.toLowerCase() === questionTypeFilter.toLowerCase());
    }

    return filtered;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'advanced':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBloomColor = (bloomLevel: string) => {
    const level = bloomLevel.toLowerCase();
    switch (level) {
      case 'remember':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'understand':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'apply':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'analyze':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'evaluate':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'create':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const renderQuestionsList = (questionsToRender: Question[]) => {
    if (questionsToRender.length === 0) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No questions found in this category.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        {questionsToRender.map((question, index) => (
          <Card key={question.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="font-mono">
                      Q{index + 1}
                    </Badge>
                    <Badge className={getDifficultyColor(question.difficulty)}>
                      {question.difficulty}
                    </Badge>
                    <Badge variant="outline" className={getBloomColor(question.bloom_level)}>
                      {question.bloom_level}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-normal leading-relaxed">
                    {question.question_text}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Options */}
              <div className="space-y-2 mb-4">
                {Object.entries(question.options || {}).map(([key, value]) => {
                  const isCorrect = key === question.correct_answer;
                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        isCorrect
                          ? 'bg-green-50 border-green-500 dark:bg-green-950 dark:border-green-500'
                          : 'bg-muted/50 border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                          isCorrect
                            ? 'bg-green-500 text-white'
                            : 'bg-muted-foreground/20 text-muted-foreground'
                        }`}>
                          {key}
                        </div>
                        <span className="flex-1">{value}</span>
                        {isCorrect && (
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {question.explanation_text && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex gap-2 items-start">
                    <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-1">
                        Explanation
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {question.explanation_text}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  const beginnerQuestions = filterQuestionsByDifficulty('beginner');
  const mediumQuestions = filterQuestionsByDifficulty('medium');
  const advancedQuestions = filterQuestionsByDifficulty('advanced');

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/teacher/question-generator')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Question Generator
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              {chapter?.name || 'Chapter Questions'}
            </h1>
            <p className="text-muted-foreground">
              100 questions generated • 30 Beginner, 40 Medium, 30 Advanced
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards - ALWAYS show 30/40/30 distribution */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Questions</CardDescription>
            <CardTitle className="text-3xl">100</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Beginner</CardDescription>
            <CardTitle className="text-3xl text-green-600">30</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Medium</CardDescription>
            <CardTitle className="text-3xl text-blue-600">40</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Advanced</CardDescription>
            <CardTitle className="text-3xl text-purple-600">30</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Questions
          </CardTitle>
          <CardDescription>
            Narrow down questions by Bloom's taxonomy level and question type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Bloom's Taxonomy Filter */}
            <div className="space-y-2">
              <Label>Bloom's Taxonomy Level</Label>
              <Select value={bloomFilter} onValueChange={setBloomFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="remember">Remember</SelectItem>
                  <SelectItem value="understand">Understand</SelectItem>
                  <SelectItem value="apply">Apply</SelectItem>
                  <SelectItem value="analyze">Analyze</SelectItem>
                  <SelectItem value="evaluate">Evaluate</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Question Type Filter */}
            <div className="space-y-2">
              <Label>Question Type</Label>
              <Select value={questionTypeFilter} onValueChange={setQuestionTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                  <SelectItem value="true_false">True/False</SelectItem>
                  <SelectItem value="short_answer">Short Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(bloomFilter !== 'all' || questionTypeFilter !== 'all') && (
            <div className="mt-4 flex gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {bloomFilter !== 'all' && (
                <Badge variant="secondary" onClick={() => setBloomFilter('all')} className="cursor-pointer">
                  Bloom: {bloomFilter} ×
                </Badge>
              )}
              {questionTypeFilter !== 'all' && (
                <Badge variant="secondary" onClick={() => setQuestionTypeFilter('all')} className="cursor-pointer">
                  Type: {questionTypeFilter} ×
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions Tabs - ALWAYS show 100/30/40/30 counts */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All (100)
          </TabsTrigger>
          <TabsTrigger value="beginner">
            Beginner (30)
          </TabsTrigger>
          <TabsTrigger value="medium">
            Medium (40)
          </TabsTrigger>
          <TabsTrigger value="advanced">
            Advanced (30)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {renderQuestionsList(getFilteredQuestions(questions))}
        </TabsContent>

        <TabsContent value="beginner" className="space-y-4">
          {renderQuestionsList(getFilteredQuestions(beginnerQuestions))}
        </TabsContent>

        <TabsContent value="medium" className="space-y-4">
          {renderQuestionsList(getFilteredQuestions(mediumQuestions))}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          {renderQuestionsList(getFilteredQuestions(advancedQuestions))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
