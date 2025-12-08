import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Library,
  Video,
  FileText,
  Presentation,
  Music,
  Download,
  Eye,
  Star,
  Search,
  Filter,
  Upload,
  Trash2,
  Edit,
  Clock,
  HardDrive,
  Tag,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Resource {
  id: number;
  title: string;
  description: string | null;
  resource_type: string;
  resource_url: string;
  chapter_id: number;
  chapter_name: string | null;
  difficulty: string | null;
  tags: string[];
  duration_minutes: number | null;
  file_size_mb: number | null;
  language: string;
  is_featured: boolean;
  view_count: number;
  uploaded_by: number | null;
  uploaded_at: string;
}

interface Chapter {
  id: number;
  name: string;
}

const resourceTypeIcons: Record<string, any> = {
  video: Video,
  pdf: FileText,
  slides: Presentation,
  audio: Music,
};

const resourceTypeLabels: Record<string, string> = {
  video: 'Video',
  pdf: 'PDF Document',
  slides: 'Slides',
  audio: 'Audio',
};

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500',
  intermediate: 'bg-yellow-500',
  advanced: 'bg-red-500',
};

export const ResourceLibrary = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    resource_type: 'pdf',
    chapter_id: '',
    difficulty: 'intermediate',
    tags: '',
    duration_minutes: '',
    language: 'en',
    is_featured: false,
    file: null as File | null,
  });

  // Fetch chapters
  const { data: chapters = [] } = useQuery<Chapter[]>({
    queryKey: ['chapters'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/subjects/chapters/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // Fetch resources
  const { data: resourcesData, isLoading } = useQuery({
    queryKey: ['resources', selectedChapter, selectedType, selectedDifficulty, searchQuery],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      if (selectedChapter !== 'all') params.append('chapter_id', selectedChapter);
      if (selectedType !== 'all') params.append('resource_type', selectedType);
      if (selectedDifficulty !== 'all') params.append('difficulty', selectedDifficulty);
      if (searchQuery) params.append('search', searchQuery);

      const response = await axios.get(`${API_URL}/resources/?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  const resources: Resource[] = resourcesData?.resources || [];

  // Upload resource mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${API_URL}/resources/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setIsUploadOpen(false);
      setUploadForm({
        title: '',
        description: '',
        resource_type: 'pdf',
        chapter_id: '',
        difficulty: 'intermediate',
        tags: '',
        duration_minutes: '',
        language: 'en',
        is_featured: false,
        file: null,
      });
      toast({
        title: 'Success',
        description: 'Resource uploaded successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to upload resource',
        variant: 'destructive',
      });
    },
  });

  // Delete resource mutation
  const deleteMutation = useMutation({
    mutationFn: async (resourceId: number) => {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_URL}/resources/${resourceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast({
        title: 'Success',
        description: 'Resource deleted successfully',
      });
    },
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadForm.file) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('title', uploadForm.title);
    formData.append('description', uploadForm.description);
    formData.append('resource_type', uploadForm.resource_type);
    formData.append('chapter_id', uploadForm.chapter_id);
    formData.append('difficulty', uploadForm.difficulty);
    formData.append('tags', JSON.stringify(uploadForm.tags.split(',').map((t) => t.trim()).filter(Boolean)));
    if (uploadForm.duration_minutes) {
      formData.append('duration_minutes', uploadForm.duration_minutes);
    }
    formData.append('language', uploadForm.language);
    formData.append('is_featured', String(uploadForm.is_featured));
    formData.append('file', uploadForm.file);

    uploadMutation.mutate(formData);
  };

  const handleDownload = async (resourceId: number, title: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/resources/${resourceId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', title);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download resource',
        variant: 'destructive',
      });
    }
  };

  const getResourceIcon = (type: string) => {
    const Icon = resourceTypeIcons[type] || FileText;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Library className="h-8 w-8 text-primary" />
              Resource Library
            </h1>
            <p className="text-muted-foreground">
              Access learning materials: videos, PDFs, slides, and audio files
            </p>
          </div>
          {user?.role === 'teacher' && (
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Resource
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Upload New Resource</DialogTitle>
                  <DialogDescription>
                    Add a new learning resource to the library
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="resource_type">Type *</Label>
                      <Select
                        value={uploadForm.resource_type}
                        onValueChange={(value) => setUploadForm({ ...uploadForm, resource_type: value })}
                      >
                        <SelectTrigger id="resource_type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="slides">Slides</SelectItem>
                          <SelectItem value="audio">Audio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="chapter">Chapter *</Label>
                      <Select
                        value={uploadForm.chapter_id}
                        onValueChange={(value) => setUploadForm({ ...uploadForm, chapter_id: value })}
                      >
                        <SelectTrigger id="chapter">
                          <SelectValue placeholder="Select chapter" />
                        </SelectTrigger>
                        <SelectContent>
                          {chapters.map((chapter) => (
                            <SelectItem key={chapter.id} value={chapter.id.toString()}>
                              {chapter.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <Select
                        value={uploadForm.difficulty}
                        onValueChange={(value) => setUploadForm({ ...uploadForm, difficulty: value })}
                      >
                        <SelectTrigger id="difficulty">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={uploadForm.duration_minutes}
                        onChange={(e) => setUploadForm({ ...uploadForm, duration_minutes: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={uploadForm.tags}
                      onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                      placeholder="e.g. circuits, theory, lab"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file">File *</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={uploadForm.is_featured}
                      onChange={(e) => setUploadForm({ ...uploadForm, is_featured: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="featured" className="cursor-pointer">
                      Mark as featured
                    </Label>
                  </div>

                  <Button type="submit" disabled={uploadMutation.isPending} className="w-full">
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload Resource'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="search" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </Label>
                <Input
                  id="search"
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-chapter" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Chapter
                </Label>
                <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                  <SelectTrigger id="filter-chapter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Chapters</SelectItem>
                    {chapters.map((chapter) => (
                      <SelectItem key={chapter.id} value={chapter.id.toString()}>
                        {chapter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-type">Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger id="filter-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="slides">Slides</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-difficulty">Difficulty</Label>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger id="filter-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resources Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading resources...</div>
      ) : resources.length === 0 ? (
        <Alert>
          <AlertDescription>No resources found. Try adjusting your filters.</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-primary mt-1">
                      {getResourceIcon(resource.resource_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-2">
                        {resource.title}
                        {resource.is_featured && (
                          <Star className="inline-block h-4 w-4 ml-2 text-yellow-500 fill-yellow-500" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {resource.chapter_name}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {resource.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{resource.description}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{resourceTypeLabels[resource.resource_type]}</Badge>
                  {resource.difficulty && (
                    <Badge variant="secondary">
                      <span className={`inline-block h-2 w-2 rounded-full mr-1 ${difficultyColors[resource.difficulty]}`} />
                      {resource.difficulty}
                    </Badge>
                  )}
                </div>

                {resource.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    {resource.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    {resource.duration_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {resource.duration_minutes}m
                      </span>
                    )}
                    {resource.file_size_mb && (
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {resource.file_size_mb}MB
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {resource.view_count}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownload(resource.id, resource.title)}
                    className="flex-1"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  {user?.role === 'teacher' && resource.uploaded_by === user.id && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this resource?')) {
                          deleteMutation.mutate(resource.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourceLibrary;
