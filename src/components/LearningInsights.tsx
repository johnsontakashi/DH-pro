import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain,
  AlertCircle,
  CheckCircle,
  BookOpen,
  TrendingUp,
  Target,
  Lightbulb
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';

interface WeakArea {
  chapter_id: number;
  chapter_name: string;
  subject_name: string;
  current_score: number;
  questions_attempted: number;
  bloom_weaknesses: Array<{ level: string; score: number }>;
  recommended_action: string;
  priority: 'high' | 'medium';
}

interface Strength {
  chapter_id: number;
  chapter_name: string;
  subject_name: string;
  current_score: number;
  mastery_level: string;
}

interface RecommendedTopic {
  chapter_id: number;
  chapter_name: string;
  reason: string;
  subject: string;
  action: string;
}

interface LearningInsightsData {
  student_id: number;
  weak_areas: WeakArea[];
  recommended_topics: RecommendedTopic[];
  strengths: Strength[];
  overall_performance: {
    average_score: number;
    total_questions: number;
    mastery_level: string;
    chapters_practiced: number;
  };
  next_difficulty_recommendation: string;
  adaptive_insights: {
    current_level: string;
    next_difficulty: string;
    advice: string;
    total_chapters_practiced: number;
    strong_chapters_count: number;
    weak_chapters_count: number;
  };
}

interface LearningInsightsProps {
  studentId: number;
}

const LearningInsights: React.FC<LearningInsightsProps> = ({ studentId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [insights, setInsights] = useState<LearningInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/analytics/student/${studentId}/recommendations`);
        setInsights(response.data);
      } catch (error: any) {
        console.error('Failed to load learning insights:', error);
        setError(error.response?.data?.detail || 'Failed to load insights');
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchInsights();
    }
  }, [studentId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Your Learning Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return null;
  }

  // If no data at all
  if (
    insights.weak_areas.length === 0 &&
    insights.strengths.length === 0 &&
    insights.recommended_topics.length === 0
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Your Learning Insights
          </CardTitle>
          <CardDescription>Personalized recommendations based on your performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">
              {insights.adaptive_insights.advice}
            </p>
            <Button onClick={() => navigate('/subjects')}>
              <BookOpen className="mr-2 h-4 w-4" />
              Start Learning
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getMasteryColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'expert':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'advanced':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'proficient':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    return priority === 'high'
      ? 'border-red-200 dark:border-red-800'
      : 'border-yellow-200 dark:border-yellow-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Your Learning Insights
        </CardTitle>
        <CardDescription>
          Personalized recommendations powered by adaptive learning AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Performance Summary */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-semibold">{insights.adaptive_insights.current_level}</span>
            </div>
            <Badge className={getMasteryColor(insights.overall_performance.mastery_level)}>
              {insights.overall_performance.mastery_level.charAt(0).toUpperCase() +
                insights.overall_performance.mastery_level.slice(1)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {insights.adaptive_insights.advice}
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Overall Score:</span>
              <span className="ml-2 font-semibold">
                {insights.overall_performance.average_score.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Next Difficulty:</span>
              <span className="ml-2 font-semibold capitalize">
                {insights.next_difficulty_recommendation}
              </span>
            </div>
          </div>
        </div>

        {/* Weak Areas */}
        {insights.weak_areas.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
              Areas to Improve ({insights.weak_areas.length})
            </h3>
            <div className="space-y-3">
              {insights.weak_areas.map((area) => (
                <div
                  key={area.chapter_id}
                  className={`p-3 border-2 rounded-lg ${getPriorityColor(area.priority)}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{area.chapter_name}</div>
                      <div className="text-xs text-muted-foreground">{area.subject_name}</div>
                    </div>
                    <Badge
                      variant={area.priority === 'high' ? 'destructive' : 'secondary'}
                      className="ml-2"
                    >
                      {area.current_score.toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress value={area.current_score} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground mb-2">{area.recommended_action}</p>
                  {area.bloom_weaknesses.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {area.bloom_weaknesses.map((bloom, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {bloom.level}: {bloom.score.toFixed(0)}%
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => navigate(`/quiz/${area.chapter_id}`)}
                  >
                    Practice Now →
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Topics */}
        {insights.recommended_topics.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-500" />
              Recommended Chapters to Review
            </h3>
            <div className="space-y-2">
              {insights.recommended_topics.map((topic, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 border rounded hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/quiz/${topic.chapter_id}`)}
                >
                  <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{topic.chapter_name}</div>
                    <div className="text-xs text-muted-foreground">{topic.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {insights.strengths.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
              Your Strengths ({insights.strengths.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {insights.strengths.map((strength) => (
                <Badge
                  key={strength.chapter_id}
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-3 py-1"
                >
                  {strength.chapter_name} ({strength.current_score.toFixed(0)}%)
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Stats Footer */}
        <div className="pt-4 border-t text-xs text-muted-foreground text-center">
          {insights.adaptive_insights.total_chapters_practiced} chapters practiced •{' '}
          {insights.overall_performance.total_questions} questions answered •{' '}
          {insights.adaptive_insights.strong_chapters_count} strengths •{' '}
          {insights.adaptive_insights.weak_chapters_count} areas to improve
        </div>
      </CardContent>
    </Card>
  );
};

export default LearningInsights;
