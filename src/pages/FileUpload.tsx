import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Upload, 
  FileText, 
  File, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Download,
  Eye,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UploadedFile {
  id: number;
  name: string;
  type: string;
  size: string;
  status: 'processing' | 'completed' | 'error';
  uploadedAt: string;
  grade?: number;
  feedback?: string;
}

const FileUpload = () => {
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
    {
      id: 1,
      name: "Circuit_Analysis_Lab_Report.pdf",
      type: "PDF",
      size: "2.4 MB",
      status: "completed",
      uploadedAt: "2 hours ago",
      grade: 85,
      feedback: "Excellent analysis of circuit behavior. Consider adding more detailed calculations in section 3."
    },
    {
      id: 2,
      name: "Arduino_LED_Control.ino",
      type: "Arduino",
      size: "1.2 KB",
      status: "completed",
      uploadedAt: "1 day ago",
      grade: 92,
      feedback: "Well-structured code with proper commenting. Good use of functions and clear variable names."
    },
    {
      id: 3,
      name: "Filter_Design_Simulation.asc",
      type: "LTspice",
      size: "856 KB",
      status: "processing",
      uploadedAt: "10 minutes ago"
    },
    {
      id: 4,
      name: "MATLAB_Signal_Processing.m",
      type: "MATLAB",
      size: "3.1 KB",
      status: "error",
      uploadedAt: "3 days ago",
      feedback: "File format not recognized. Please ensure MATLAB files are saved in the correct format."
    }
  ]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const validateFile = (file: File): string | null => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['.pdf', '.docx', '.ino', '.m', '.asc'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (file.size > maxSize) {
      return 'File size must be less than 50MB';
    }
    
    if (!allowedTypes.includes(fileExtension)) {
      return 'File type not supported. Please upload PDF, DOCX, Arduino (.ino), MATLAB (.m), or LTspice (.asc) files.';
    }
    
    return null;
  };
  
  const handleFileUpload = (files: FileList) => {
    if (files.length === 0) return;
    
    const file = files[0];
    const validationError = validateFile(file);
    
    if (validationError) {
      toast.error(validationError);
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    toast.success('File upload started!');
    
    // Simulate file upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          
          // Add new file to the list
          const newFile: UploadedFile = {
            id: uploadedFiles.length + 1,
            name: file.name,
            type: file.name.split('.').pop()?.toUpperCase() || 'Unknown',
            size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
            status: 'processing',
            uploadedAt: 'Just now'
          };
          
          setUploadedFiles(prev => [newFile, ...prev]);
          toast.success('File uploaded successfully! Processing...');
          
          // Simulate processing completion
          setTimeout(() => {
            setUploadedFiles(prevFiles => 
              prevFiles.map(f => 
                f.id === newFile.id 
                  ? { ...f, status: 'completed' as const, grade: Math.floor(Math.random() * 30) + 70 }
                  : f
              )
            );
            toast.success('File processing completed!');
          }, 3000);
          
          return 0;
        }
        return prev + 10;
      });
    }, 200);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleFileClick = (file: UploadedFile) => {
    setSelectedFile(file);
    setIsFileModalOpen(true);
  };
  
  const handleDeleteFile = (fileId: number) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    setIsFileModalOpen(false);
    toast.success('File deleted successfully');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success';
      case 'processing':
        return 'bg-warning';
      case 'error':
        return 'bg-destructive';
      default:
        return 'bg-muted';
    }
  };

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
      case 'docx':
        return <FileText className="h-5 w-5 text-destructive" />;
      default:
        return <File className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">File Upload</h1>
          <p className="text-muted-foreground">
            Upload assignments for AI-powered grading and feedback
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {user?.role === 'student' ? 'Student Submissions' : 'Assignment Uploads'}
        </Badge>
      </div>

      {/* Upload Area */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Assignment
          </CardTitle>
          <CardDescription>
            Supported formats: PDF, DOCX, Arduino (.ino), MATLAB (.m), LTspice (.asc)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Drop files here or click to browse</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Maximum file size: 50MB per file
            </p>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.ino,.m,.asc"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            />
          </div>
          
          {uploading && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Submissions
          </CardTitle>
          <CardDescription>
            View processing status and grades for uploaded assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {uploadedFiles.map((file) => (
              <div 
                key={file.id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => handleFileClick(file)}
              >
                <div className="flex items-center gap-4">
                  {getFileIcon(file.type)}
                  <div>
                    <h4 className="font-medium">{file.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{file.type}</Badge>
                      <span>{file.size}</span>
                      <span>•</span>
                      <span>{file.uploadedAt}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(file.status)}
                      <Badge className={getStatusColor(file.status)} variant="secondary">
                        {file.status}
                      </Badge>
                    </div>
                    {file.grade && (
                      <div className="text-lg font-bold text-success">
                        {file.grade}%
                      </div>
                    )}
                  </div>
                  
                  {file.status === 'completed' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {uploadedFiles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4" />
              <p>No files uploaded yet</p>
              <p className="text-sm">Upload your first assignment to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback Section */}
      {uploadedFiles.some(file => file.feedback) && (
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
            <CardDescription>
              AI-generated feedback and suggestions for improvement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadedFiles
                .filter(file => file.feedback)
                .slice(0, 3)
                .map((file) => (
                  <div key={file.id} className="p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">{file.name}</span>
                      {file.grade && (
                        <Badge className="bg-success">
                          Grade: {file.grade}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{file.feedback}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Details Modal */}
      <Dialog open={isFileModalOpen} onOpenChange={setIsFileModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedFile?.name}</DialogTitle>
            <DialogDescription>
              File Details and Actions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">File Type</p>
                <Badge variant="outline">{selectedFile?.type}</Badge>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">File Size</p>
                <p className="font-medium">{selectedFile?.size}</p>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(selectedFile?.status || '')}
                <Badge className={getStatusColor(selectedFile?.status || '')} variant="secondary">
                  {selectedFile?.status}
                </Badge>
              </div>
              {selectedFile?.grade && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">Grade</p>
                  <p className="text-2xl font-bold text-success">{selectedFile.grade}%</p>
                </div>
              )}
            </div>
            
            {selectedFile?.feedback && (
              <div className="p-4 border rounded-lg bg-muted/20">
                <p className="text-sm text-muted-foreground mb-2">AI Feedback</p>
                <p className="text-sm">{selectedFile.feedback}</p>
              </div>
            )}
            
            <div className="flex gap-2 pt-4">
              {selectedFile?.status === 'completed' && (
                <>
                  <Button className="flex-1" onClick={() => {
                    setIsFileModalOpen(false);
                    toast.success(`Opening ${selectedFile?.name}`);
                  }}>
                    <Eye className="mr-2 h-4 w-4" />
                    View File
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setIsFileModalOpen(false);
                    toast.success(`Downloading ${selectedFile?.name}`);
                  }}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </>
              )}
              <Button 
                variant="destructive" 
                onClick={() => selectedFile && handleDeleteFile(selectedFile.id)}
              >
                <X className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <Button variant="outline" onClick={() => setIsFileModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileUpload;