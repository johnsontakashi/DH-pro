import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Sparkles,
  Plus,
  Trash2,
  RefreshCw,
  BookOpen,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

interface Subject {
  id: number;
  name: string;
  code: string;
  category: string;
}

interface Chapter {
  id: number;
  name: string;
  order: number;
  subject_id: number;
}

interface Flashcard {
  id: number;
  chapter_id: number;
  front_text: string;
  back_text: string;
  explanation?: string;
  difficulty: string;
  tags?: string;
  is_ai_generated: boolean;
  created_at: string;
}

const FlashcardManager = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [tags, setTags] = useState('');

  const [numCards, setNumCards] = useState(20);

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      loadChapters(selectedSubject);
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedChapter) {
      loadFlashcards(selectedChapter);
    }
  }, [selectedChapter]);

  const loadSubjects = async () => {
    try {
      const response = await api.get('/subjects/');
      // Backend returns { subjects: [], total: number }
      setSubjects(response.data.subjects || response.data || []);
    } catch (error) {
      console.error('Error loading subjects:', error);
      toast.error('Failed to load subjects');
    }
  };

  const loadChapters = async (subjectId: number) => {
    try {
      const response = await api.get(`/subjects/${subjectId}`);
      // Backend returns subject with chapters array
      setChapters(response.data.chapters || []);
    } catch (error) {
      console.error('Error loading chapters:', error);
      toast.error('Failed to load chapters');
    }
  };

  const loadFlashcards = async (chapterId: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/flashcards/chapter/${chapterId}`);
      setFlashcards(response.data);
    } catch (error) {
      console.error('Error loading flashcards:', error);
      toast.error('Failed to load flashcards');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!selectedChapter) {
      toast.error('Please select a chapter first');
      return;
    }

    try {
      setGenerating(true);

      const response = await api.post('/flashcards/generate', {
        chapter_id: selectedChapter,
        num_cards: numCards
      });

      toast.success(`Generated ${response.data.length} flashcards!`);
      loadFlashcards(selectedChapter);
    } catch (error: any) {
      console.error('Error generating flashcards:', error);
      toast.error(error.response?.data?.detail || 'Failed to generate flashcards');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateFlashcard = async () => {
    if (!selectedChapter || !frontText || !backText) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await api.post('/flashcards/', {
        chapter_id: selectedChapter,
        front_text: frontText,
        back_text: backText,
        explanation: explanation || null,
        difficulty: difficulty,
        tags: tags || null
      });

      toast.success('Flashcard created successfully!');
      setFlashcards([response.data, ...flashcards]);

      // Reset form
      setFrontText('');
      setBackText('');
      setExplanation('');
      setTags('');
    } catch (error: any) {
      console.error('Error creating flashcard:', error);
      toast.error(error.response?.data?.detail || 'Failed to create flashcard');
    }
  };

  const handleDeleteFlashcard = async (flashcardId: number) => {
    if (!confirm('Are you sure you want to delete this flashcard?')) return;

    try {
      await api.delete(`/flashcards/${flashcardId}`);
      toast.success('Flashcard deleted');
      setFlashcards(flashcards.filter(f => f.id !== flashcardId));
    } catch (error) {
      console.error('Error deleting flashcard:', error);
      toast.error('Failed to delete flashcard');
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Flashcard Manager</h1>
        <p className="text-muted-foreground">Create and manage flashcards for your chapters</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Subject Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedSubject?.toString()} onValueChange={(v) => setSelectedSubject(parseInt(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects && subjects.length > 0 ? (
                  subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No subjects available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Chapter Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Chapter</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedChapter?.toString()}
              onValueChange={(v) => setSelectedChapter(parseInt(v))}
              disabled={!selectedSubject}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a chapter" />
              </SelectTrigger>
              <SelectContent>
                {chapters && chapters.length > 0 ? (
                  chapters.map(chapter => (
                    <SelectItem key={chapter.id} value={chapter.id.toString()}>
                      {chapter.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No chapters available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {selectedChapter && (
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">
              <Sparkles className="mr-2 h-4 w-4" />
              AI Generate
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Plus className="mr-2 h-4 w-4" />
              Create Manually
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Flashcards</CardTitle>
                <CardDescription>
                  Generate flashcards automatically from chapter content using AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Number of Cards</Label>
                  <Input
                    type="number"
                    value={numCards}
                    onChange={(e) => setNumCards(parseInt(e.target.value))}
                    min={5}
                    max={50}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended: 20-30 cards per chapter
                  </p>
                </div>

                <Button
                  onClick={handleGenerateFlashcards}
                  disabled={generating}
                  className="w-full"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Flashcards
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>Create Flashcard Manually</CardTitle>
                <CardDescription>Add a custom flashcard to this chapter</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Front (Question/Term)</Label>
                  <Input
                    value={frontText}
                    onChange={(e) => setFrontText(e.target.value)}
                    placeholder="e.g., What is Ohm's Law?"
                  />
                </div>

                <div>
                  <Label>Back (Answer/Definition)</Label>
                  <Textarea
                    value={backText}
                    onChange={(e) => setBackText(e.target.value)}
                    placeholder="e.g., V = I × R"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Explanation (Optional)</Label>
                  <Textarea
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Additional context or explanation..."
                    rows={2}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Difficulty</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tags (comma-separated)</Label>
                    <Input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="circuit, voltage, current"
                    />
                  </div>
                </div>

                <Button onClick={handleCreateFlashcard} className="w-full" size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Flashcard
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Existing Flashcards */}
      {selectedChapter && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Existing Flashcards</CardTitle>
                <CardDescription>{flashcards.length} flashcards in this chapter</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => loadFlashcards(selectedChapter)}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground">Loading...</p>
            ) : flashcards.length === 0 ? (
              <p className="text-center text-muted-foreground">No flashcards yet. Generate some!</p>
            ) : (
              <div className="space-y-2">
                {flashcards.map(card => (
                  <Card key={card.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{card.front_text}</p>
                          <Badge className={getDifficultyColor(card.difficulty)} variant="secondary">
                            {card.difficulty}
                          </Badge>
                          {card.is_ai_generated && (
                            <Badge variant="outline">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{card.back_text}</p>
                        {card.explanation && (
                          <p className="text-xs text-muted-foreground italic">{card.explanation}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFlashcard(card.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FlashcardManager;
