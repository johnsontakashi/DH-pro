import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Save,
  Send,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Edit,
  Eye,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface Assignment {
  id: number;
  title: string;
  description: string;
  instructions: string;
  chapter_name: string;
  subject_name: string;
  due_date: string | null;
  requires_lab_report: boolean;
}

interface LabReportData {
  title: string;
  experiment_number?: string;
  course_number?: string;
  cover_info: {
    university: string;
    faculty: string;
    department: string;
    date_of_experiment: string;
    date_of_submission: string;
  };
  table_of_contents: Array<{ section: string; title: string; page: string }>;
  introduction: string;
  objective: string;
  preparation: string;
  equipment: Array<{ no: number; description: string; code: string; quantity: number }>;
  components: Array<{ no: number; description: string; type: string; quantity: number }>;
  theory: string;
  procedure: string;
  results: {
    description: string;
    tables: Array<any>;
    observations: string;
  };
  calculations?: string;
  conclusion: {
    summary: string;
    key_findings: string[];
    observations: string;
    practical_errors: string[];
    learning_outcomes: string;
  };
  discussion?: string;
  references?: string[];
  circuit_diagram_description?: string;
  graphs_needed?: string[];
}

interface LabReport {
  id: number;
  assignment_id: number;
  student_id: number;
  report_data: LabReportData;
  ai_generated: boolean;
  generation_model?: string;
  edit_count: number;
  last_edited_section?: string;
  is_draft: boolean;
  submitted_at?: string;
  created_at: string;
  updated_at?: string;
  grade?: number | null;
  feedback?: string | null;
}

const LabReportEditor: React.FC = () => {
  const { t } = useTranslation();
  const { assignmentId, labReportId } = useParams<{ assignmentId?: string; labReportId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTeacherView = !!labReportId && user?.role === 'teacher';

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [labReport, setLabReport] = useState<LabReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('fullreport');
  const [editMode, setEditMode] = useState<{ [key: string]: boolean }>({});
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // Generation inputs - Pre-filled with examples
  const [experimentData, setExperimentData] = useState<string>('{\n  "voltage": [5, 10, 15, 20],\n  "current": [0.5, 1.0, 1.5, 2.0],\n  "resistance": [10, 10, 10, 10],\n  "temperature": 25\n}');
  const [userNotes, setUserNotes] = useState<string>('The experiment was conducted at room temperature. All measurements were taken using a digital multimeter. The circuit was stable throughout the experiment.');

  useEffect(() => {
    loadData();
  }, [assignmentId, labReportId]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (isTeacherView && labReportId) {
        // Teacher viewing a specific lab report
        const labReportResponse = await api.get(`/lab-reports/${labReportId}`);
        setLabReport(labReportResponse.data);

        // Load assignment for context
        const assignmentResponse = await api.get(`/assignments/${labReportResponse.data.assignment_id}`);
        setAssignment(assignmentResponse.data);
      } else if (assignmentId) {
        // Student creating/editing their lab report
        const assignmentResponse = await api.get(`/assignments/${assignmentId}`);
        setAssignment(assignmentResponse.data);

        if (!assignmentResponse.data.requires_lab_report) {
          toast.error('This assignment does not require a lab report');
          navigate(`/assignment/${assignmentId}`);
          return;
        }

        // Try to load existing lab report
        try {
          const labReportResponse = await api.get(`/lab-reports/assignment/${assignmentId}`);
          setLabReport(labReportResponse.data);
        } catch (error: any) {
          if (error.response?.status !== 404) {
            console.error('Error loading lab report:', error);
          }
          // No lab report yet, that's okay
        }
      }
    } catch (error: any) {
      toast.error('Failed to load data');
      navigate('/assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);

      const payload: any = {
        assignment_id: parseInt(assignmentId!),
      };

      if (experimentData) {
        try {
          payload.experiment_data = JSON.parse(experimentData);
        } catch {
          payload.experiment_data = { raw_data: experimentData };
        }
      }

      if (userNotes) {
        payload.user_notes = userNotes;
      }

      const response = await api.post('/lab-reports/generate', payload);
      setLabReport(response.data);
      toast.success('Lab report generated successfully!');
      setActiveTab('introduction');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to generate lab report');
    } finally {
      setGenerating(false);
    }
  };

  const handleSectionUpdate = async (section: string, content: any) => {
    if (!labReport) return;

    try {
      setSaving(true);
      const response = await api.patch(`/lab-reports/${labReport.id}/section`, {
        section_name: section,
        content,
      });
      setLabReport(response.data);
      toast.success('Section updated');
      setEditMode({ ...editMode, [section]: false });
    } catch (error: any) {
      toast.error('Failed to update section');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateSection = async (section: string, feedback?: string) => {
    if (!labReport) return;

    try {
      setRegeneratingSection(section);
      const response = await api.post(`/lab-reports/${labReport.id}/regenerate-section`, {
        section_name: section,
        feedback,
      });
      setLabReport(response.data);
      toast.success(`${section} regenerated`);
    } catch (error: any) {
      toast.error('Failed to regenerate section');
    } finally {
      setRegeneratingSection(null);
    }
  };

  const handleSubmit = async () => {
    if (!labReport) return;

    try {
      setSubmitting(true);
      const response = await api.post(`/lab-reports/${labReport.id}/submit`);
      setLabReport(response.data);
      setShowSubmitDialog(false);
      toast.success('Lab report submitted successfully!');
      navigate(`/assignment/${assignmentId}`);
    } catch (error: any) {
      toast.error('Failed to submit lab report');
    } finally {
      setSubmitting(false);
    }
  };

  const formatContent = (content: any) => {
    // Format equipment/components as tables
    if (Array.isArray(content) && content.length > 0 && 'no' in content[0]) {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">No.</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                {content[0].code !== undefined && <th className="border border-gray-300 px-4 py-2 text-left">Code</th>}
                {content[0].type !== undefined && <th className="border border-gray-300 px-4 py-2 text-left">Type</th>}
                <th className="border border-gray-300 px-4 py-2 text-left">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {content.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="border border-gray-300 px-4 py-2">{item.no}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.description}</td>
                  {item.code !== undefined && <td className="border border-gray-300 px-4 py-2">{item.code}</td>}
                  {item.type !== undefined && <td className="border border-gray-300 px-4 py-2">{item.type}</td>}
                  <td className="border border-gray-300 px-4 py-2">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Format results object
    if (content && typeof content === 'object' && 'description' in content) {
      return (
        <div className="space-y-4">
          <p className="whitespace-pre-wrap">{content.description}</p>
          {content.tables && content.tables.length > 0 && (
            <div className="space-y-3">
              {content.tables.map((table: any, idx: number) => (
                <div key={idx} className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300">
                    <tbody>
                      {Object.entries(table).map(([key, value]: [string, any]) => (
                        <tr key={key}>
                          <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-50">{key}</td>
                          <td className="border border-gray-300 px-4 py-2">{String(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
          {content.observations && (
            <div>
              <h4 className="font-semibold mb-2">Observations:</h4>
              <p className="whitespace-pre-wrap">{content.observations}</p>
            </div>
          )}
        </div>
      );
    }

    // Format conclusion object
    if (content && typeof content === 'object' && 'summary' in content) {
      return (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Summary:</h4>
            <p className="whitespace-pre-wrap">{content.summary}</p>
          </div>
          {content.key_findings && content.key_findings.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Key Findings:</h4>
              <ul className="list-disc list-inside space-y-1">
                {content.key_findings.map((finding: string, idx: number) => (
                  <li key={idx}>{finding}</li>
                ))}
              </ul>
            </div>
          )}
          {content.observations && (
            <div>
              <h4 className="font-semibold mb-2">Observations:</h4>
              <p className="whitespace-pre-wrap">{content.observations}</p>
            </div>
          )}
          {content.practical_errors && content.practical_errors.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Sources of Error:</h4>
              <ul className="list-disc list-inside space-y-1">
                {content.practical_errors.map((error: string, idx: number) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          {content.learning_outcomes && (
            <div>
              <h4 className="font-semibold mb-2">Learning Outcomes:</h4>
              <p className="whitespace-pre-wrap">{content.learning_outcomes}</p>
            </div>
          )}
        </div>
      );
    }

    // Format cover_info object
    if (content && typeof content === 'object' && 'university' in content) {
      return (
        <div className="space-y-2 text-center">
          <p className="font-bold text-lg">{content.university}</p>
          <p className="font-semibold">{content.faculty}</p>
          <p>{content.department}</p>
          {content.date_of_experiment && <p>Date of Experiment: {content.date_of_experiment}</p>}
          {content.date_of_submission && <p>Date of Submission: {content.date_of_submission}</p>}
        </div>
      );
    }

    // Default: string or JSON
    if (typeof content === 'string') {
      return <p className="whitespace-pre-wrap">{content}</p>;
    }

    return (
      <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
        {JSON.stringify(content, null, 2)}
      </pre>
    );
  };

  const renderSection = (title: string, sectionKey: string, content: any) => {
    const isEditing = editMode[sectionKey];
    const isRegenerating = regeneratingSection === sectionKey;
    const isReadOnly = !labReport?.is_draft || isTeacherView;

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            <div className="flex gap-2">
              {isReadOnly ? null : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode({ ...editMode, [sectionKey]: !isEditing })}
                    disabled={isRegenerating || isReadOnly}
                  >
                    {isEditing ? <Eye className="h-4 w-4 mr-1" /> : <Edit className="h-4 w-4 mr-1" />}
                    {isEditing ? 'Preview' : 'Edit'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegenerateSection(sectionKey)}
                    disabled={isRegenerating || isReadOnly}
                  >
                    {isRegenerating ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    Regenerate
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                onChange={(e) => {
                  const newData = { ...labReport!.report_data };
                  try {
                    newData[sectionKey as keyof LabReportData] = JSON.parse(e.target.value);
                  } catch {
                    newData[sectionKey as keyof LabReportData] = e.target.value as any;
                  }
                  setLabReport({ ...labReport!, report_data: newData });
                }}
                rows={10}
                className="font-mono text-sm"
                readOnly={isReadOnly}
                disabled={isReadOnly}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSectionUpdate(sectionKey, labReport!.report_data[sectionKey as keyof LabReportData])}
                  disabled={saving || isReadOnly}
                >
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode({ ...editMode, [sectionKey]: false })}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose max-w-none">
              {formatContent(content)}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!assignment) {
    return null;
  }

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #lab-report-print, #lab-report-print * {
            visibility: visible;
          }
          #lab-report-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-6 no-print">
          <Button variant="ghost" onClick={() => isTeacherView ? window.close() : navigate(`/assignment/${assignmentId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isTeacherView ? 'Close' : 'Back to Assignment'}
          </Button>
        </div>

      <Card className="mb-6 no-print">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                {assignment.title}
              </CardTitle>
              <CardDescription>Lab Report Generator</CardDescription>
            </div>
            {labReport && (
              <Badge variant={labReport.is_draft ? 'secondary' : 'default'}>
                {labReport.is_draft ? 'Draft' : 'Submitted'}
              </Badge>
            )}
          </div>
        </CardHeader>
        {!labReport && !isTeacherView && (
          <CardContent>
            <Alert className="mb-4">
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                Generate a lab report for this assignment using AI. Provide experimental data and notes to get started.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="experimentData">Experiment Data (Optional - JSON format)</Label>
                <Textarea
                  id="experimentData"
                  placeholder='Replace with your actual experimental data in JSON format'
                  value={experimentData}
                  onChange={(e) => setExperimentData(e.target.value)}
                  rows={6}
                  className="font-mono"
                />
              </div>

              <div>
                <Label htmlFor="userNotes">Your Notes (Optional)</Label>
                <Textarea
                  id="userNotes"
                  placeholder="Replace with your specific observations, procedures, or notes about the experiment..."
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button onClick={handleGenerate} disabled={generating} className="w-full">
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Lab Report...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Lab Report
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {labReport && (
        <>
          {/* Read-Only Alert (for submitted but not yet graded reports) */}
          {!isTeacherView && !labReport.is_draft && labReport.grade === null && (
            <Alert className="mb-6 no-print border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                This lab report has been submitted and is now read-only. You cannot make any further edits.
              </AlertDescription>
            </Alert>
          )}

          {/* Grade and Feedback Display (for students) */}
          {!isTeacherView && labReport.grade !== null && labReport.grade !== undefined && (
            <Card className="mb-6 no-print border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <CardTitle className="text-green-800">Graded</CardTitle>
                  </div>
                  <Badge className="bg-green-600 text-white text-lg px-4 py-2">
                    {labReport.grade}/{assignment?.max_score || 100}
                  </Badge>
                </div>
              </CardHeader>
              {labReport.feedback && (
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-800">Teacher Feedback:</h4>
                    <div className="bg-white p-4 rounded border border-green-200">
                      <p className="whitespace-pre-wrap text-gray-700">{labReport.feedback}</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          <div className="flex justify-between items-center mb-4 no-print">
            <div className="text-sm text-muted-foreground">
              Last edited: {labReport.updated_at ? new Date(labReport.updated_at).toLocaleString() : 'Never'}
              {labReport.edit_count > 0 && ` • ${labReport.edit_count} edits`}
            </div>
            {labReport.is_draft && !isTeacherView && (
              <Button onClick={() => setShowSubmitDialog(true)}>
                <Send className="h-4 w-4 mr-2" />
                Submit Lab Report
              </Button>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-6 lg:grid-cols-13 mb-6 no-print">
              <TabsTrigger value="fullreport" className="col-span-2">📄 Full Report</TabsTrigger>
              <TabsTrigger value="cover">Cover</TabsTrigger>
              <TabsTrigger value="introduction">Intro</TabsTrigger>
              <TabsTrigger value="objective">Objective</TabsTrigger>
              <TabsTrigger value="preparation">Preparation</TabsTrigger>
              <TabsTrigger value="equipment">Equipment</TabsTrigger>
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="theory">Theory</TabsTrigger>
              <TabsTrigger value="procedure">Procedure</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="calculations">Calculations</TabsTrigger>
              <TabsTrigger value="discussion">Discussion</TabsTrigger>
              <TabsTrigger value="conclusion">Conclusion</TabsTrigger>
              <TabsTrigger value="references">References</TabsTrigger>
            </TabsList>

            <TabsContent value="fullreport">
              <Card>
                <CardHeader className="no-print">
                  <div className="flex justify-between items-center">
                    <CardTitle>Complete Lab Report</CardTitle>
                    <Button onClick={() => window.print()} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Print / Save as PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent id="lab-report-print" className="space-y-6 prose max-w-none">
                  {/* Cover Page */}
                  <div className="text-center space-y-4 pb-8 border-b">
                    {formatContent(labReport.report_data.cover_info)}
                    <h1 className="text-2xl font-bold mt-6">{labReport.report_data.title}</h1>
                    {labReport.report_data.experiment_number && (
                      <p>Experiment No: {labReport.report_data.experiment_number}</p>
                    )}
                    {labReport.report_data.course_number && (
                      <p>Course: {labReport.report_data.course_number}</p>
                    )}
                  </div>

                  {/* Table of Contents */}
                  {labReport.report_data.table_of_contents && (
                    <div className="pb-6 border-b">
                      <h2 className="text-xl font-bold mb-4">Table of Contents</h2>
                      <div className="space-y-1">
                        {labReport.report_data.table_of_contents.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between">
                            <span>{item.section}. {item.title}</span>
                            <span>{item.page}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Introduction */}
                  <div className="pb-6 border-b">
                    <h2 className="text-xl font-bold mb-4">1. Introduction</h2>
                    {formatContent(labReport.report_data.introduction)}
                  </div>

                  {/* Objective */}
                  <div className="pb-6 border-b">
                    <h2 className="text-xl font-bold mb-4">2. Objective</h2>
                    {formatContent(labReport.report_data.objective)}
                  </div>

                  {/* Preparation */}
                  <div className="pb-6 border-b">
                    <h2 className="text-xl font-bold mb-4">3. Preparation</h2>
                    {formatContent(labReport.report_data.preparation)}
                  </div>

                  {/* Equipment */}
                  <div className="pb-6 border-b">
                    <h2 className="text-xl font-bold mb-4">4. Equipment</h2>
                    {formatContent(labReport.report_data.equipment)}
                  </div>

                  {/* Components */}
                  <div className="pb-6 border-b">
                    <h2 className="text-xl font-bold mb-4">5. Components</h2>
                    {formatContent(labReport.report_data.components)}
                  </div>

                  {/* Theory */}
                  <div className="pb-6 border-b">
                    <h2 className="text-xl font-bold mb-4">6. Theory</h2>
                    {formatContent(labReport.report_data.theory)}
                  </div>

                  {/* Procedure */}
                  <div className="pb-6 border-b">
                    <h2 className="text-xl font-bold mb-4">7. Procedure</h2>
                    {formatContent(labReport.report_data.procedure)}
                  </div>

                  {/* Results */}
                  <div className="pb-6 border-b">
                    <h2 className="text-xl font-bold mb-4">8. Results</h2>
                    {formatContent(labReport.report_data.results)}
                  </div>

                  {/* Calculations */}
                  {labReport.report_data.calculations && (
                    <div className="pb-6 border-b">
                      <h2 className="text-xl font-bold mb-4">9. Calculations</h2>
                      {formatContent(labReport.report_data.calculations)}
                    </div>
                  )}

                  {/* Calculations */}
                  {labReport.report_data.calculations && (
                    <div className="pb-6 border-b">
                      <h2 className="text-xl font-bold mb-4">9. Calculations</h2>
                      {formatContent(labReport.report_data.calculations)}
                    </div>
                  )}

                  {/* Discussion */}
                  {labReport.report_data.discussion && (
                    <div className="pb-6 border-b">
                      <h2 className="text-xl font-bold mb-4">10. Discussion</h2>
                      {formatContent(labReport.report_data.discussion)}
                    </div>
                  )}

                  {/* Conclusion */}
                  <div className="pb-6 border-b">
                    <h2 className="text-xl font-bold mb-4">11. Conclusion</h2>
                    {formatContent(labReport.report_data.conclusion)}
                  </div>

                  {/* References */}
                  {labReport.report_data.references && labReport.report_data.references.length > 0 && (
                    <div className="pb-6">
                      <h2 className="text-xl font-bold mb-4">12. References</h2>
                      <ol className="list-decimal pl-6 space-y-2">
                        {labReport.report_data.references.map((ref: string, idx: number) => (
                          <li key={idx} className="text-sm">{ref}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cover">
              {renderSection('Cover Information', 'cover_info', labReport.report_data.cover_info)}
              {renderSection('Title & Details', 'title', labReport.report_data.title)}
            </TabsContent>

            <TabsContent value="introduction">
              {renderSection('Introduction', 'introduction', labReport.report_data.introduction)}
            </TabsContent>

            <TabsContent value="objective">
              {renderSection('Objective', 'objective', labReport.report_data.objective)}
            </TabsContent>

            <TabsContent value="preparation">
              {renderSection('Preparation', 'preparation', labReport.report_data.preparation)}
            </TabsContent>

            <TabsContent value="equipment">
              {renderSection('Equipment List', 'equipment', labReport.report_data.equipment)}
            </TabsContent>

            <TabsContent value="components">
              {renderSection('Components List', 'components', labReport.report_data.components)}
            </TabsContent>

            <TabsContent value="theory">
              {renderSection('Theory', 'theory', labReport.report_data.theory)}
            </TabsContent>

            <TabsContent value="procedure">
              {renderSection('Procedure', 'procedure', labReport.report_data.procedure)}
            </TabsContent>

            <TabsContent value="results">
              {renderSection('Results', 'results', labReport.report_data.results)}
              {labReport.report_data.calculations && renderSection('Calculations', 'calculations', labReport.report_data.calculations)}
            </TabsContent>

            <TabsContent value="calculations">
              {renderSection('Calculations', 'calculations', labReport.report_data.calculations || 'No calculations provided.')}
            </TabsContent>

            <TabsContent value="discussion">
              {renderSection('Discussion', 'discussion', labReport.report_data.discussion || 'No discussion provided yet. This section should interpret your results, compare with theory, and explain any discrepancies.')}
            </TabsContent>

            <TabsContent value="conclusion">
              {renderSection('Conclusion', 'conclusion', labReport.report_data.conclusion)}
            </TabsContent>

            <TabsContent value="references">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    References
                  </CardTitle>
                  <CardDescription>
                    List all sources, textbooks, papers, and online resources used in this lab report.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose max-w-none">
                    {labReport.report_data.references && labReport.report_data.references.length > 0 ? (
                      <ol className="list-decimal pl-6 space-y-2">
                        {labReport.report_data.references.map((ref: string, idx: number) => (
                          <li key={idx} className="text-sm">{ref}</li>
                        ))}
                      </ol>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No references added yet. Add citations for textbooks, papers, websites, and other sources used.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {!labReport.submitted_at && (
                    <div className="text-sm text-muted-foreground mt-4 p-3 bg-muted/50 rounded-lg">
                      <strong>Note:</strong> References should be formatted according to your institution's citation style (APA, IEEE, etc.).
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Lab Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit this lab report? Once submitted, you will not be able to edit it anymore.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please review your lab report carefully before submitting. This action cannot be undone.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSubmitDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Confirm Submit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LabReportEditor;
