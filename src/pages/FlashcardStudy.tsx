import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Brain,
  RotateCcw,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

interface Flashcard {
  id: number;
  front_text: string;
  back_text: string;
  explanation?: string;
  difficulty: string;
  tags?: string;
  is_ai_generated: boolean;
}

interface StudySession {
  flashcards: Flashcard[];
  total_due: number;
  new_cards: number;
  review_cards: number;
  mastery_distribution: Record<string, number>;
}

const FlashcardStudy = () => {
  const { t } = useTranslation();
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<StudySession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);

  // Configuration screen state
  const [showConfig, setShowConfig] = useState(true);
  const [selectedCount, setSelectedCount] = useState(20);
  const [includeNewCards, setIncludeNewCards] = useState(true);
  const [prioritizeDue, setPrioritizeDue] = useState(true);
  const [totalAvailable, setTotalAvailable] = useState(0);

  useEffect(() => {
    loadStudySession();
  }, [chapterId]);

  const loadStudySession = async (applyConfig: boolean = false) => {
    try {
      setLoading(true);
      // Get ALL flashcards for the chapter
      const response = await api.get(`/flashcards/chapter/${chapterId}`);
      let flashcards = response.data;

      // Store total available for configuration screen
      setTotalAvailable(flashcards.length);

      if (applyConfig && flashcards.length > 0) {
        // Apply user configuration
        let filtered = flashcards;

        // Filter by card type if specified
        if (!includeNewCards) {
          filtered = filtered.filter((card: Flashcard) => !card.is_ai_generated);
        }

        // Prioritize due cards (in real implementation, this would check next_review_date)
        // For now, we'll shuffle the array
        if (prioritizeDue) {
          filtered = [...filtered].sort(() => Math.random() - 0.5);
        }

        // Limit to selected count
        flashcards = filtered.slice(0, Math.min(selectedCount, filtered.length));
      }

      // Transform the response to match the expected session structure
      setSession({
        flashcards: flashcards,
        total_due: flashcards.length,
        new_cards: flashcards.filter((card: Flashcard) => card.is_ai_generated).length,
        review_cards: flashcards.filter((card: Flashcard) => !card.is_ai_generated).length,
        mastery_distribution: {}
      });

      if (flashcards.length === 0) {
        toast.info(t('flashcards.noFlashcardsFound'));
      }
    } catch (error: any) {
      console.error('Error loading flashcards:', error);
      if (error.response?.status === 404) {
        toast.error(t('flashcards.noFlashcardsFound'));
      } else {
        toast.error(t('messages.failedToLoadFlashcards'));
      }
    } finally {
      setLoading(false);
    }
  };

  const startStudySession = () => {
    setShowConfig(false);
    loadStudySession(true);
  };

  const handleReview = async (isCorrect: boolean, confidence: string = 'medium') => {
    if (!session || reviewing) return;

    const currentCard = session.flashcards[currentIndex];

    try {
      setReviewing(true);

      await api.post('/flashcards/review', {
        flashcard_id: currentCard.id,
        is_correct: isCorrect,
        confidence: confidence
      });

      toast.success(isCorrect ? t('flashcards.greatJob') : t('flashcards.keepPracticing'));

      // Move to next card
      if (currentIndex < session.flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      } else {
        // Session complete
        toast.success(t('flashcards.sessionComplete'));
        navigate(`/subjects`);
      }
    } catch (error) {
      console.error('Error recording review:', error);
      toast.error(t('flashcards.failedToRecordReview'));
    } finally {
      setReviewing(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Brain className="h-16 w-16 animate-pulse mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">{t('flashcards.loadingSession')}</p>
        </div>
      </div>
    );
  }

  // Configuration screen - let students choose how many flashcards to study
  if (showConfig && totalAvailable > 0) {
    const presets = [5, 10, 20, 50].filter(p => p <= totalAvailable);

    return (
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Back button */}
          <Button variant="ghost" onClick={() => navigate('/subjects')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Settings className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>{t('flashcards.configureSession') || 'Configure Study Session'}</CardTitle>
                  <CardDescription>
                    {t('flashcards.configureDescription') || 'Choose how many flashcards you want to study'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Available flashcards info */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('flashcards.availableCards') || 'Available Flashcards'}</span>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {totalAvailable}
                  </Badge>
                </div>
              </div>

              {/* Flashcard count selection */}
              <div className="space-y-4">
                <Label className="text-base font-medium">
                  {t('flashcards.howManyCards') || 'How many flashcards do you want to study?'}
                </Label>

                {/* Quick presets */}
                <div className="flex gap-2 flex-wrap">
                  {presets.map((preset) => (
                    <Button
                      key={preset}
                      variant={selectedCount === preset ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCount(preset)}
                    >
                      {preset}
                    </Button>
                  ))}
                  {totalAvailable > 50 && (
                    <Button
                      variant={selectedCount === totalAvailable ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCount(totalAvailable)}
                    >
                      {t('flashcards.all') || 'All'} ({totalAvailable})
                    </Button>
                  )}
                </div>

                {/* Slider for custom count */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t('flashcards.customCount') || 'Or choose a custom number:'}
                    </span>
                    <Badge variant="outline" className="text-lg px-3">
                      {selectedCount}
                    </Badge>
                  </div>
                  <Slider
                    value={[selectedCount]}
                    onValueChange={(value) => setSelectedCount(value[0])}
                    min={1}
                    max={totalAvailable}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>{totalAvailable}</span>
                  </div>
                </div>
              </div>

              {/* Study options */}
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-base font-medium">
                  {t('flashcards.studyOptions') || 'Study Options'}
                </Label>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="include-new"
                    checked={includeNewCards}
                    onCheckedChange={(checked) => setIncludeNewCards(checked as boolean)}
                  />
                  <Label htmlFor="include-new" className="text-sm cursor-pointer">
                    {t('flashcards.includeNewCards') || 'Include new cards (not yet reviewed)'}
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="prioritize-due"
                    checked={prioritizeDue}
                    onCheckedChange={(checked) => setPrioritizeDue(checked as boolean)}
                  />
                  <Label htmlFor="prioritize-due" className="text-sm cursor-pointer">
                    {t('flashcards.shuffleCards') || 'Shuffle cards randomly'}
                  </Label>
                </div>
              </div>

              {/* Start button */}
              <Button
                onClick={startStudySession}
                className="w-full"
                size="lg"
              >
                <Brain className="mr-2 h-5 w-5" />
                {t('flashcards.startStudying') || 'Start Studying'} ({selectedCount} {t('flashcards.cards') || 'cards'})
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!session || session.flashcards.length === 0) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto text-center">
          <Brain className="h-24 w-24 mx-auto mb-6 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-4">{t('flashcards.noFlashcardsAvailable')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('flashcards.noFlashcardsDescription')}
          </p>
          <Button onClick={() => navigate('/subjects')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('flashcards.backToSubjects')}
          </Button>
        </div>
      </div>
    );
  }

  const currentCard = session.flashcards[currentIndex];
  const progress = ((currentIndex + 1) / session.flashcards.length) * 100;

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Progress */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/subjects')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>

          <div className="flex items-center gap-4">
            <Badge variant="outline">
              <TrendingUp className="mr-1 h-3 w-3" />
              {session.new_cards} {t('flashcards.new')}
            </Badge>
            <Badge variant="outline">
              <RotateCcw className="mr-1 h-3 w-3" />
              {session.review_cards} {t('flashcards.review')}
            </Badge>
            <Badge variant="outline">
              {currentIndex + 1} / {session.flashcards.length}
            </Badge>
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        {/* Flashcard */}
        <Card
          className="min-h-[400px] cursor-pointer transition-all hover:shadow-lg"
          onClick={() => !isFlipped && setIsFlipped(true)}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isFlipped ? t('flashcards.answer') : t('flashcards.question')}
              </CardTitle>
              <div className="flex items-center gap-2">
                {currentCard.is_ai_generated && (
                  <Badge variant="secondary">
                    <Sparkles className="mr-1 h-3 w-3" />
                    {t('flashcards.aiGenerated')}
                  </Badge>
                )}
                <Badge className={getDifficultyColor(currentCard.difficulty)}>
                  {currentCard.difficulty}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex items-center justify-center min-h-[300px]">
            <div className="text-center space-y-4">
              {!isFlipped ? (
                <>
                  <h2 className="text-3xl font-bold">{currentCard.front_text}</h2>
                  <p className="text-muted-foreground">{t('flashcards.clickToReveal')}</p>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-primary">{currentCard.back_text}</h2>
                  {currentCard.explanation && (
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 max-w-2xl mx-auto">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                            {t('flashcards.explanation') || 'Explanation'}
                          </p>
                          <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
                            {currentCard.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {currentCard.tags && (
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                      {currentCard.tags.split(',').map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Review Buttons (shown after flipping) */}
        {isFlipped && (
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              variant="outline"
              className="flex-1 max-w-xs"
              onClick={() => handleReview(false, 'low')}
              disabled={reviewing}
            >
              <XCircle className="mr-2 h-5 w-5" />
              {t('flashcards.again')}
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="flex-1 max-w-xs"
              onClick={() => handleReview(true, 'medium')}
              disabled={reviewing}
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              {t('flashcards.good')}
            </Button>

            <Button
              size="lg"
              variant="default"
              className="flex-1 max-w-xs"
              onClick={() => handleReview(true, 'high')}
              disabled={reviewing}
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              {t('flashcards.easy')}
            </Button>
          </div>
        )}

        {/* Instructions */}
        {!isFlipped && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('flashcards.howItWorks')}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="space-y-2">
                <li>• {t('flashcards.instruction1')}</li>
                <li>• {t('flashcards.instruction2')}</li>
                <li>• {t('flashcards.instruction3')}</li>
                <li>• {t('flashcards.instruction4')}</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FlashcardStudy;
