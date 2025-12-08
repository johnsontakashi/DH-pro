import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface LabReport {
  id: string;
  title: string;
  subject: string;
  studentName?: string;
  studentId?: string;
  studentEmail?: string;
  teacherName?: string;
  teacherEmail?: string;
  status: 'draft' | 'submitted' | 'graded' | 'returned';
  submittedAt?: string;
  dueDate: string;
  grade?: number;
  feedback?: string;
  description: string;
  content?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export { type LabReport };

const STORAGE_KEY = 'stemmentorat_lab_reports';

// Initialize with some sample data if empty
const getInitialReports = (): LabReport[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Default sample data
  const initialReports: LabReport[] = [
    {
      id: '1',
      title: "Ohm's Law Experiment",
      subject: "Physics",
      studentName: "Alex Johnson",
      studentId: "1",
      studentEmail: "student@stem.edu",
      teacherName: "Dr. Sarah Wilson",
      teacherEmail: "teacher@stem.edu",
      status: 'draft',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: "Verify Ohm's law by measuring voltage and current in a simple circuit.",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      title: "Chemical Reactions Lab",
      subject: "Chemistry",
      studentName: "Alex Johnson",
      studentId: "1",
      studentEmail: "student@stem.edu",
      teacherName: "Dr. Sarah Wilson",
      teacherEmail: "teacher@stem.edu",
      status: 'submitted',
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: "Observe and document various chemical reactions and their products.",
      content: "Lab Report Content:\n\nObjective: To observe different types of chemical reactions.\n\nProcedure:\n1. Mixed solutions A and B\n2. Observed color change\n3. Recorded temperature\n\nResults: Exothermic reaction observed with temperature increase of 5°C",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialReports));
  return initialReports;
};

export const useLabReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Load reports from localStorage
  useEffect(() => {
    const loadReports = () => {
      try {
        const allReports = getInitialReports();
        
        // Filter reports based on user role
        if (user?.role === 'student') {
          // Students only see their own reports
          const studentReports = allReports.filter(
            report => report.studentEmail === user.email
          );
          setReports(studentReports);
        } else if (user?.role === 'teacher') {
          // Teachers see all reports they've assigned
          const teacherReports = allReports.filter(
            report => report.teacherEmail === user.email
          );
          setReports(teacherReports);
        } else {
          // Admin sees all
          setReports(allReports);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading reports:', error);
        toast.error('Failed to load lab reports');
        setLoading(false);
      }
    };

    if (user) {
      loadReports();
    }
    
    // Set up listener for storage changes (for cross-tab communication)
    const handleStorageChange = () => {
      loadReports();
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom events within the same tab
    window.addEventListener('labReportsUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('labReportsUpdated', handleStorageChange);
    };
  }, [user]);

  // Save reports to localStorage
  const saveReports = (newReports: LabReport[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newReports));
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('labReportsUpdated'));
  };

  // Create a new lab report assignment (teacher only)
  const createAssignment = (
    title: string,
    subject: string,
    description: string,
    dueDate: string
  ) => {
    if (user?.role !== 'teacher') {
      toast.error('Only teachers can create assignments');
      return;
    }

    const allReports = getInitialReports();
    
    // Create a report for each student (in a real app, you'd fetch student list)
    // For demo, we'll create one for the mock student
    const newReport: LabReport = {
      id: Date.now().toString(),
      title,
      subject,
      description,
      dueDate,
      studentName: "Alex Johnson",
      studentId: "1",
      studentEmail: "student@stem.edu",
      teacherName: user.name,
      teacherEmail: user.email,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedReports = [...allReports, newReport];
    saveReports(updatedReports);
    setReports(prev => [...prev, newReport]);
    toast.success('Lab report assignment created successfully!');
  };

  // Submit a lab report (student only)
  const submitReport = (reportId: string, content: string) => {
    if (user?.role !== 'student') {
      toast.error('Only students can submit reports');
      return;
    }

    const allReports = getInitialReports();
    const reportIndex = allReports.findIndex(r => r.id === reportId);
    
    if (reportIndex === -1) {
      toast.error('Report not found');
      return;
    }

    allReports[reportIndex] = {
      ...allReports[reportIndex],
      status: 'submitted',
      content,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveReports(allReports);
    
    // Update local state
    setReports(prev => prev.map(r => 
      r.id === reportId 
        ? { ...r, status: 'submitted', content, submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        : r
    ));
    
    toast.success('Lab report submitted successfully!');
  };

  // Grade a lab report (teacher only)
  const gradeReport = (reportId: string, grade: number, feedback: string) => {
    if (user?.role !== 'teacher') {
      toast.error('Only teachers can grade reports');
      return;
    }

    const allReports = getInitialReports();
    const reportIndex = allReports.findIndex(r => r.id === reportId);
    
    if (reportIndex === -1) {
      toast.error('Report not found');
      return;
    }

    allReports[reportIndex] = {
      ...allReports[reportIndex],
      status: 'graded',
      grade,
      feedback,
      updatedAt: new Date().toISOString()
    };

    saveReports(allReports);
    
    // Update local state
    setReports(prev => prev.map(r => 
      r.id === reportId 
        ? { ...r, status: 'graded', grade, feedback, updatedAt: new Date().toISOString() }
        : r
    ));
    
    toast.success('Lab report graded successfully!');
  };

  // Get statistics
  const getStats = () => {
    const total = reports.length;
    const pending = reports.filter(r => 
      user?.role === 'student' ? r.status === 'draft' : r.status === 'submitted'
    ).length;
    const completed = reports.filter(r => 
      r.status === 'graded' || r.status === 'returned'
    ).length;
    
    const gradedReports = reports.filter(r => r.grade !== undefined);
    const averageGrade = gradedReports.length > 0
      ? gradedReports.reduce((sum, r) => sum + (r.grade || 0), 0) / gradedReports.length
      : 0;

    return {
      total,
      pending,
      completed,
      averageGrade: Math.round(averageGrade * 10) / 10
    };
  };

  return {
    reports,
    loading,
    createAssignment,
    submitReport,
    gradeReport,
    getStats,
    refreshReports: () => {
      const allReports = getInitialReports();
      if (user?.role === 'student') {
        setReports(allReports.filter(r => r.studentEmail === user.email));
      } else if (user?.role === 'teacher') {
        setReports(allReports.filter(r => r.teacherEmail === user.email));
      }
    }
  };
};