import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FileText, Save, X, Sparkles } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

interface Subject {
  id: number;
  name: string;
  chapters: Chapter[];
}

interface Chapter {
  id: number;
  name: string;
}

const CreateAssignment: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState({
    title: 'Circuit Analysis Assignment',
    description: 'Analyze the behavior of resistive circuits and apply Ohm\'s Law to solve circuit problems.',
    instructions: 'Complete all questions showing your work. Include:\n1. Circuit diagrams for each problem\n2. Step-by-step calculations\n3. Final answers with units\n4. Analysis of results\n\nSubmit your work as a PDF or type your answers directly.',
    subject_id: '',
    chapter_id: '',
    due_date: '',
    max_score: 100,
    time_limit: '120',
    ai_assistance_enabled: true,
    plagiarism_check_enabled: true,
    is_published: true,
    assignment_type: 'GENERAL',
    requires_lab_report: false,
    rubric: '',
    expected_answers: '',
  });

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      setSubjects(response.data.subjects);
    } catch (error) {
      toast.error(t('messages.failedToLoadSubjects'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.chapter_id) {
      toast.error(t('validation.fillAllRequired'));
      return;
    }

    setLoading(true);

    try {
      // Parse JSON fields if they contain data
      let rubric = null;
      let expected_answers = null;
      
      if (formData.rubric.trim()) {
        try {
          rubric = JSON.parse(formData.rubric);
        } catch (e) {
          toast.error('Invalid JSON format in rubric field');
          return;
        }
      }
      
      if (formData.expected_answers.trim()) {
        try {
          expected_answers = JSON.parse(formData.expected_answers);
        } catch (e) {
          toast.error('Invalid JSON format in expected answers field');
          return;
        }
      }

      const payload = {
        title: formData.title,
        description: formData.description || null,
        instructions: formData.instructions || null,
        chapter_id: parseInt(formData.chapter_id),
        due_date: formData.due_date || null,
        max_score: formData.max_score,
        time_limit: formData.time_limit ? parseInt(formData.time_limit) : null,
        ai_assistance_enabled: formData.ai_assistance_enabled,
        plagiarism_check_enabled: formData.plagiarism_check_enabled,
        is_published: formData.is_published,
        assignment_type: formData.requires_lab_report ? 'LAB_REPORT' : 'GENERAL',
        requires_lab_report: formData.requires_lab_report,
        rubric,
        expected_answers,
      };

      await api.post('/assignments/', payload);

      toast.success(t('assignments.createSuccess'));
      navigate('/assignments');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('assignments.createError'));
    } finally {
      setLoading(false);
    }
  };

  const selectedSubject = subjects.find((s) => s.id === parseInt(formData.subject_id));

  const generateWithAI = async () => {
    if (!formData.chapter_id) {
      toast.error(t('validation.selectChapterFirst'));
      return;
    }

    setGenerating(true);

    try {
      const response = await api.post('/ai/generate-assignment', {
        chapter_id: parseInt(formData.chapter_id),
        assignment_type: 'problem_set',
        difficulty: 'intermediate',
      });

      // Populate form with AI-generated content
      setFormData({
        ...formData,
        title: response.data.title,
        description: response.data.description,
        instructions: response.data.instructions,
      });

      toast.success(t('assignments.assignmentGenerated'));
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('assignments.failedToGenerateAssignment'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-8 h-8 text-purple-500" />
        <div>
          <h1 className="text-3xl font-bold">{t('assignments.createTitle')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('assignments.createDescription')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{t('assignments.assignmentDetailsTitle')}</CardTitle>
            <CardDescription>{t('assignments.assignmentDetailsDescription')}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title">
                {t('assignments.assignmentTitle')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={formData.title || t('assignments.enterTitle')}
                required
              />
              {!formData.title && !formData.description && (
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Tip: Select a chapter below to generate content with AI
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">{t('assignments.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('assignments.describeRequirements')}
                rows={2}
              />
            </div>

            {/* Instructions */}
            <div>
              <Label htmlFor="instructions">{t('assignments.instructions')}</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder={t('common.loading')}
                rows={4}
              />
            </div>

            {/* Subject and Chapter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">
                  {t('assignments.subject')} <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.subject_id} onValueChange={(value) => setFormData({ ...formData, subject_id: value, chapter_id: '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('assignments.selectSubject')} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="chapter">
                  {t('assignments.chapter')} <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.chapter_id} onValueChange={(value) => setFormData({ ...formData, chapter_id: value })} disabled={!formData.subject_id}>
                  <SelectTrigger>
                    <SelectValue placeholder={formData.subject_id ? t('assignments.selectChapter') : t('validation.selectChapterFirst')} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedSubject?.chapters.map((chapter) => (
                      <SelectItem key={chapter.id} value={chapter.id.toString()}>
                        {chapter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* AI Generation Section */}
            <div className="space-y-4 p-4 border border-purple-200 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-800 dark:text-purple-200">AI Assignment Generation</h3>
              </div>
              
              {!formData.chapter_id ? (
                <div className="text-sm text-purple-700 dark:text-purple-300">
                  📝 Select a subject and chapter above to generate an assignment with AI
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Generate assignment content automatically based on the selected chapter
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateWithAI}
                    disabled={generating || !formData.chapter_id}
                    className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-100 dark:border-purple-600 dark:text-purple-300"
                  >
                    {generating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        {t('assignments.generating')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        {t('assignments.generateWithAI')}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Due Date and Max Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="due_date">{t('assignments.dueDate')}</Label>
                <Input id="due_date" type="datetime-local" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
              </div>

              <div>
                <Label htmlFor="max_score">{t('assignments.maxScore')}</Label>
                <Input
                  id="max_score"
                  type="number"
                  min="1"
                  value={formData.max_score}
                  onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {/* Time Limit */}
            <div>
              <Label htmlFor="time_limit">{t('assignments.timeLimit')}</Label>
              <Input
                id="time_limit"
                type="number"
                min="1"
                value={formData.time_limit}
                onChange={(e) => setFormData({ ...formData, time_limit: e.target.value })}
                placeholder={t('common.loading')}
              />
            </div>

            {/* AI Grading Configuration */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">AI Grading Configuration</h3>
              
              <div className="space-y-2">
                <Label htmlFor="rubric">
                  Grading Rubric (JSON)
                  <span className="text-sm text-gray-500 ml-1">(Optional)</span>
                </Label>
                <Textarea
                  id="rubric"
                  value={formData.rubric}
                  onChange={(e) => setFormData({ ...formData, rubric: e.target.value })}
                  placeholder='Example: {"criteria": {"understanding": {"weight": 0.3, "description": "Demonstrates understanding of concepts"}, "accuracy": {"weight": 0.4, "description": "Correctness of solutions"}, "presentation": {"weight": 0.3, "description": "Clear and organized presentation"}}}'
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-600">
                  Define specific criteria for AI grading. Use JSON format with criteria weights and descriptions.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_answers">
                  Expected Answers/Reference Solutions (JSON)
                  <span className="text-sm text-gray-500 ml-1">(Optional)</span>
                </Label>
                <Textarea
                  id="expected_answers"
                  value={formData.expected_answers}
                  onChange={(e) => setFormData({ ...formData, expected_answers: e.target.value })}
                  placeholder='Example: {"question_1": {"answer": "V = IR", "explanation": "Ohms Law relates voltage, current, and resistance"}, "question_2": {"answer": "12V", "calculation": "V = 2A × 6Ω = 12V"}}'
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-600">
                  Provide model answers or reference solutions for AI grading comparison.
                </p>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">{t('nav.settings')}</h3>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="lab_report">{t('common.loading')}</Label>
                  <p className="text-sm text-gray-600">{t('common.loading')}</p>
                </div>
                <Switch
                  id="lab_report"
                  checked={formData.requires_lab_report}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_lab_report: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ai_assistance">{t('assignments.aiAssistance')}</Label>
                  <p className="text-sm text-gray-600">{t('assignments.allowAIHelp')}</p>
                </div>
                <Switch
                  id="ai_assistance"
                  checked={formData.ai_assistance_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, ai_assistance_enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="plagiarism_check">{t('assignments.plagiarismCheck')}</Label>
                  <p className="text-sm text-gray-600">{t('assignments.enablePlagiarismDetection')}</p>
                </div>
                <Switch
                  id="plagiarism_check"
                  checked={formData.plagiarism_check_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, plagiarism_check_enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="publish">{t('assignments.publishImmediately')}</Label>
                  <p className="text-sm text-gray-600">{t('assignments.makeVisibleNow')}</p>
                </div>
                <Switch
                  id="publish"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/assignments')} disabled={loading}>
              <X className="w-4 h-4 mr-2" />
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('assignments.createAssignment')}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default CreateAssignment;
