import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Brain, Clock, BookOpen } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";

interface Subject {
  id: number;
  name: string;
  chapters: Chapter[];
}

interface Chapter {
  id: number;
  name: string;
  order: number;
}

interface LessonPlan {
  id: number;
  teacher_id: number;
  chapter_id: number;
  title: string;
  description: string | null;
  duration_minutes: number;
  objectives: Array<{description: string; bloom_level?: string}>;
  introduction: string | null;
  main_content: string | null;
  activities: Array<{title: string; description: string; duration: number}>;
  assessment: string | null;
  homework: string | null;
  resources: Array<{title: string; url?: string; type?: string}>;
  materials_needed: string[];
  ai_generated: boolean;
  is_published: boolean;
  created_at: string;
}

export default function LessonPlanEditor() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<LessonPlan | null>(null);
  
  // Subject/Chapter state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration_minutes: 60,
    student_level: "undergraduate",
    learning_objectives: "",
    additional_notes: "",
    introduction: "",
    main_content: "",
    assessment: "",
    homework: "",
    materials_needed: ""
  });

  useEffect(() => {
    loadSubjects();
    if (id) {
      loadLessonPlan(parseInt(id));
    }
  }, [id]);

  useEffect(() => {
    if (selectedSubject) {
      const subject = subjects.find(s => s.id === selectedSubject);
      if (subject) {
        setChapters(subject.chapters || []);
      }
    }
  }, [selectedSubject, subjects]);

  // When lesson loads, populate form and find subject
  useEffect(() => {
    if (lesson && subjects.length > 0) {
      populateFormFromLesson();
      findSubjectForChapter();
    }
  }, [lesson, subjects]);

  const loadSubjects = async () => {
    try {
      const response = await api.get('/subjects/');
      const subjectsData = response.data.subjects || response.data || [];
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading subjects:', error);
      toast.error('Failed to load subjects');
    }
  };

  const loadLessonPlan = async (lessonId: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/lesson-plans/${lessonId}`);
      setLesson(response.data);
    } catch (error: any) {
      console.error('Error loading lesson plan:', error);
      toast.error('Failed to load lesson plan');
      navigate('/teacher/my-lessons');
    } finally {
      setLoading(false);
    }
  };

  const findSubjectForChapter = () => {
    if (!lesson || subjects.length === 0) return;
    
    for (const subject of subjects) {
      const chapter = subject.chapters?.find(c => c.id === lesson.chapter_id);
      if (chapter) {
        setSelectedSubject(subject.id);
        setSelectedChapter(lesson.chapter_id);
        setChapters(subject.chapters);
        break;
      }
    }
  };

  const populateFormFromLesson = () => {
    if (!lesson) return;

    const objectivesText = lesson.objectives
      ?.map(obj => obj.description || '')
      .filter(desc => desc.trim())
      .join('\n') || '';
    
    const materialsText = lesson.materials_needed?.join(', ') || '';

    setFormData({
      title: lesson.title || '',
      description: lesson.description || '',
      duration_minutes: lesson.duration_minutes || 60,
      student_level: "undergraduate", // Default since this isn't stored
      learning_objectives: objectivesText,
      additional_notes: '', // This was used for generation, not stored
      introduction: lesson.introduction || '',
      main_content: lesson.main_content || '',
      assessment: lesson.assessment || '',
      homework: lesson.homework || '',
      materials_needed: materialsText
    });
  };

  const saveLessonPlan = async () => {
    if (!selectedChapter || !lesson) {
      toast.error('Please select a chapter');
      return;
    }

    setSaving(true);

    try {
      const objectives = formData.learning_objectives
        ? formData.learning_objectives.split('\n')
            .filter(o => o.trim())
            .map(desc => ({ description: desc.trim() }))
        : [];

      const materials = formData.materials_needed
        ? formData.materials_needed.split(',').map(m => m.trim()).filter(m => m)
        : [];

      const updateData = {
        chapter_id: selectedChapter,
        title: formData.title,
        description: formData.description || null,
        duration_minutes: formData.duration_minutes,
        objectives: objectives,
        introduction: formData.introduction || null,
        main_content: formData.main_content || null,
        activities: lesson.activities || [], // Keep existing activities
        assessment: formData.assessment || null,
        homework: formData.homework || null,
        resources: lesson.resources || [], // Keep existing resources
        materials_needed: materials
      };

      await api.put(`/lesson-plans/${lesson.id}`, updateData);
      toast.success('Lesson plan updated successfully!');
      navigate('/teacher/my-lessons');
    } catch (error: any) {
      console.error("Error updating lesson plan:", error);
      toast.error(error.response?.data?.detail || 'Failed to update lesson plan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>Loading lesson plan...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="text-center">
          <p>Lesson plan not found.</p>
          <Button onClick={() => navigate('/teacher/my-lessons')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Lessons
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/teacher/my-lessons')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Lessons
          </Button>
          {lesson.ai_generated && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              <Brain className="w-3 h-3 mr-1" />
              AI Generated
            </Badge>
          )}
        </div>
        <h1 className="text-4xl font-bold mb-2">Edit Lesson Plan</h1>
        <p className="text-muted-foreground">
          Modify your lesson plan details and content
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Edit Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Lesson Details
              </CardTitle>
              <CardDescription>Update the basic lesson information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subject Selection */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select
                  value={selectedSubject?.toString()}
                  onValueChange={(v) => setSelectedSubject(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Chapter Selection */}
              <div className="space-y-2">
                <Label htmlFor="chapter">Chapter</Label>
                <Select
                  value={selectedChapter?.toString()}
                  onValueChange={(v) => setSelectedChapter(parseInt(v))}
                  disabled={!selectedSubject}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedSubject ? "Choose a chapter" : "Select subject first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters.map(chapter => (
                      <SelectItem key={chapter.id} value={chapter.id.toString()}>
                        {chapter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Lesson Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter lesson title"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief lesson description"
                  rows={3}
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                />
              </div>

              {/* Learning Objectives */}
              <div className="space-y-2">
                <Label htmlFor="objectives">Learning Objectives</Label>
                <Textarea
                  id="objectives"
                  value={formData.learning_objectives}
                  onChange={(e) => setFormData({ ...formData, learning_objectives: e.target.value })}
                  placeholder="Enter objectives, one per line"
                  rows={4}
                />
              </div>

              {/* Materials Needed */}
              <div className="space-y-2">
                <Label htmlFor="materials">Materials Needed</Label>
                <Textarea
                  id="materials"
                  value={formData.materials_needed}
                  onChange={(e) => setFormData({ ...formData, materials_needed: e.target.value })}
                  placeholder="Enter materials, separated by commas"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Sections */}
          <Card>
            <CardHeader>
              <CardTitle>Lesson Content</CardTitle>
              <CardDescription>Edit the main lesson content sections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Introduction */}
              <div className="space-y-2">
                <Label htmlFor="intro">Introduction</Label>
                <Textarea
                  id="intro"
                  value={formData.introduction}
                  onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
                  placeholder="Lesson introduction and hook"
                  rows={4}
                />
              </div>

              {/* Main Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Main Content</Label>
                <Textarea
                  id="content"
                  value={formData.main_content}
                  onChange={(e) => setFormData({ ...formData, main_content: e.target.value })}
                  placeholder="Main teaching content"
                  rows={6}
                />
              </div>

              {/* Assessment */}
              <div className="space-y-2">
                <Label htmlFor="assessment">Assessment</Label>
                <Textarea
                  id="assessment"
                  value={formData.assessment}
                  onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
                  placeholder="How to assess student learning"
                  rows={3}
                />
              </div>

              {/* Homework */}
              <div className="space-y-2">
                <Label htmlFor="homework">Homework</Label>
                <Textarea
                  id="homework"
                  value={formData.homework}
                  onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
                  placeholder="Homework assignments"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Button 
                  onClick={() => navigate('/teacher/my-lessons')}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={saveLessonPlan}
                  disabled={saving || !selectedChapter}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview/Info Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lesson Plan Preview</CardTitle>
              <CardDescription>Current lesson information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Title</h4>
                  <p className="text-sm text-muted-foreground">{formData.title || "No title set"}</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Duration</h4>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formData.duration_minutes} minutes
                  </div>
                </div>

                {formData.learning_objectives && (
                  <div>
                    <h4 className="font-medium mb-1">Objectives</h4>
                    <div className="text-sm text-muted-foreground">
                      {formData.learning_objectives.split('\n').filter(o => o.trim()).map((obj, i) => (
                        <div key={i} className="flex items-start gap-1">
                          <span>•</span>
                          <span>{obj.trim()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show existing activities and resources count */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Activities:</span>
                    <Badge variant="outline">{lesson.activities?.length || 0}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Resources:</span>
                    <Badge variant="outline">{lesson.resources?.length || 0}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Original Info */}
          <Card>
            <CardHeader>
              <CardTitle>Original Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Created:</span>
                <span>{new Date(lesson.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>AI Generated:</span>
                <Badge variant={lesson.ai_generated ? "secondary" : "outline"}>
                  {lesson.ai_generated ? "Yes" : "Manual"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Published:</span>
                <Badge variant={lesson.is_published ? "default" : "secondary"}>
                  {lesson.is_published ? "Published" : "Draft"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}