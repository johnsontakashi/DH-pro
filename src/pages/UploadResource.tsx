import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import api from '@/services/api';

interface Subject {
  id: number;
  name: string;
  code: string;
  chapters: Chapter[];
}

interface Chapter {
  id: number;
  name: string;
  order: number;
}

export default function UploadResource() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      setSubjects(response.data.subjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();

      if (fileExt !== 'pdf' && fileExt !== 'docx' && fileExt !== 'doc') {
        toast.error('Only PDF and DOCX files are supported');
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !selectedChapter || !title) {
      toast.error('Please fill in all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('chapter_id', selectedChapter);
    if (description) {
      formData.append('description', description);
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const response = await api.post('/resources/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadResult(response.data);
      toast.success(`Successfully uploaded! ${response.data.total_chunks} chunks created`);

      // Reset form
      setTitle("");
      setDescription("");
      setFile(null);
      setSelectedSubject("");
      setSelectedChapter("");

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const selectedSubjectData = subjects.find(s => s.id.toString() === selectedSubject);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Upload Learning Resource
          </CardTitle>
          <CardDescription>
            Upload PDF or DOCX files. The document will be automatically processed and chunked for better learning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-6">
            {/* Subject Selection */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
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

            {/* Chapter Selection */}
            {selectedSubjectData && (
              <div className="space-y-2">
                <Label htmlFor="chapter">Chapter *</Label>
                <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedSubjectData.chapters.map((chapter) => (
                      <SelectItem key={chapter.id} value={chapter.id.toString()}>
                        Chapter {chapter.order}: {chapter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Resource Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Circuit Theory Fundamentals"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the resource content"
                rows={3}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">File (PDF or DOCX) *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleFileChange}
                required
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </div>
              )}
            </div>

            {/* Upload Result */}
            {uploadResult && (
              <Alert className="border-green-500">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-semibold text-green-700">{uploadResult.message}</p>
                    <p className="text-sm">Resource ID: {uploadResult.resource_id}</p>
                    <p className="text-sm">Chunks created: {uploadResult.total_chunks}</p>
                    <p className="text-sm text-muted-foreground">Saved to: {uploadResult.file_path}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload Resource'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/subjects')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
