import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import { queryClient } from "./lib/queryClient";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminPanel from "./pages/AdminPanel";
import AdminUsers from "./pages/AdminUsers";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminSettings from "./pages/AdminSettings";
import AIModelConfig from "./pages/AIModelConfig";
import AIStudyTools from "./pages/AIStudyTools";
import FileUpload from "./pages/FileUpload";
import LabReportsEnhanced from "./pages/LabReportsEnhanced";
import RAGTest from "./pages/RAGTest";
import Subjects from "./pages/Subjects";
import UploadResource from "./pages/UploadResource";
import QuizTaking from "./pages/QuizTaking";
import QuizResults from "./pages/QuizResults";
import TeacherAnalytics from "./pages/TeacherAnalytics";
import ExamList from "./pages/ExamList";
import ExamTaking from "./pages/ExamTaking";
import ExamResults from "./pages/ExamResults";
import LessonPlanner from "./pages/LessonPlanner";
import AIChat from "./pages/AIChat";
import Assignments from "./pages/Assignments";
import AssignmentDetail from "./pages/AssignmentDetail";
import CreateAssignment from "./pages/CreateAssignment";
import ViewSubmissions from "./pages/ViewSubmissions";
import GradeSubmission from "./pages/GradeSubmission";
import LabReportEditor from "./pages/LabReportEditor";
import QuestionGenerator from "./pages/QuestionGenerator";
import ViewChapterQuestions from "./pages/ViewChapterQuestions";
import CreateQuiz from "./pages/CreateQuiz";
import CreateExam from "./pages/CreateExam";
import StudentProgress from "./pages/StudentProgress";
import FlashcardManager from "./pages/FlashcardManager";
import FlashcardStudy from "./pages/FlashcardStudy";
import ContentCreator from "./pages/ContentCreator";
import StudentFeedback from "./pages/StudentFeedback";
import MyLessons from "./pages/MyLessons";
import ChapterResources from "./pages/ChapterResources";
import ResourceLibrary from "./pages/ResourceLibrary";
import NotFound from "./pages/NotFound";

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate dashboard based on role
    switch (user.role) {
      case 'student':
        return <Navigate to="/student" replace />;
      case 'teacher':
        return <Navigate to="/teacher" replace />;
      case 'admin':
        return <Navigate to="/admin" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }
  
  return <>{children}</>;
};

// Role-based Dashboard Redirect
const DashboardRedirect = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  switch (user.role) {
    case 'student':
      return <Navigate to="/student" replace />;
    case 'teacher':
      return <Navigate to="/teacher" replace />;
    case 'admin':
      return <Navigate to="/admin" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const AppRoutes = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    {/* Dashboard Redirect */}
    <Route path="/" element={<DashboardRedirect />} />
    
    {/* Protected Routes */}
    <Route path="/student" element={
      <ProtectedRoute requiredRole="student">
        <StudentDashboard />
      </ProtectedRoute>
    } />
    
    <Route path="/teacher" element={
      <ProtectedRoute requiredRole="teacher">
        <TeacherDashboard />
      </ProtectedRoute>
    } />
    
    <Route path="/admin" element={
      <ProtectedRoute requiredRole="admin">
        <AdminPanel />
      </ProtectedRoute>
    } />
    
    {/* Shared Routes (accessible by multiple roles) */}
    <Route path="/ai-tools" element={
      <ProtectedRoute>
        <AIStudyTools />
      </ProtectedRoute>
    } />
    
    <Route path="/upload" element={
      <ProtectedRoute>
        <FileUpload />
      </ProtectedRoute>
    } />
    
    <Route path="/lab-reports" element={
      <ProtectedRoute>
        <LabReportsEnhanced />
      </ProtectedRoute>
    } />

    <Route path="/rag-test" element={
      <ProtectedRoute>
        <RAGTest />
      </ProtectedRoute>
    } />

    <Route path="/subjects" element={
      <ProtectedRoute>
        <Subjects />
      </ProtectedRoute>
    } />

    <Route path="/resources" element={
      <ProtectedRoute>
        <ResourceLibrary />
      </ProtectedRoute>
    } />

    <Route path="/upload-resource" element={
      <ProtectedRoute>
        <UploadResource />
      </ProtectedRoute>
    } />

    <Route path="/quiz/:chapterId" element={
      <ProtectedRoute requiredRole="student">
        <QuizTaking />
      </ProtectedRoute>
    } />

    <Route path="/quiz-results/:attemptId" element={
      <ProtectedRoute>
        <QuizResults />
      </ProtectedRoute>
    } />

    <Route path="/chapter/:chapterId/resources" element={
      <ProtectedRoute>
        <ChapterResources />
      </ProtectedRoute>
    } />

    <Route path="/teacher/analytics" element={
      <ProtectedRoute requiredRole="teacher">
        <TeacherAnalytics />
      </ProtectedRoute>
    } />

    <Route path="/teacher/lesson-planner" element={
      <ProtectedRoute requiredRole="teacher">
        <LessonPlanner />
      </ProtectedRoute>
    } />

    <Route path="/teacher/my-lessons" element={
      <ProtectedRoute requiredRole="teacher">
        <MyLessons />
      </ProtectedRoute>
    } />

    <Route path="/exams" element={
      <ProtectedRoute requiredRole="student">
        <ExamList />
      </ProtectedRoute>
    } />

    <Route path="/exam/:examId" element={
      <ProtectedRoute requiredRole="student">
        <ExamTaking />
      </ProtectedRoute>
    } />

    <Route path="/exam-results/:attemptId" element={
      <ProtectedRoute requiredRole="student">
        <ExamResults />
      </ProtectedRoute>
    } />

    {/* AI Chat */}
    <Route path="/ai-chat" element={
      <ProtectedRoute>
        <AIChat />
      </ProtectedRoute>
    } />

    {/* Assignments */}
    <Route path="/assignments" element={
      <ProtectedRoute>
        <Assignments />
      </ProtectedRoute>
    } />

    <Route path="/assignment/:id" element={
      <ProtectedRoute requiredRole="student">
        <AssignmentDetail />
      </ProtectedRoute>
    } />

    <Route path="/teacher/assignment/:id" element={
      <ProtectedRoute requiredRole="teacher">
        <AssignmentDetail />
      </ProtectedRoute>
    } />

    <Route path="/teacher/create-assignment" element={
      <ProtectedRoute requiredRole="teacher">
        <CreateAssignment />
      </ProtectedRoute>
    } />

    <Route path="/teacher/assignment/:assignmentId/submissions" element={
      <ProtectedRoute requiredRole="teacher">
        <ViewSubmissions />
      </ProtectedRoute>
    } />

    <Route path="/assignment/:assignmentId/lab-report" element={
      <ProtectedRoute requiredRole="student">
        <LabReportEditor />
      </ProtectedRoute>
    } />

    <Route path="/teacher/lab-report/:labReportId" element={
      <ProtectedRoute requiredRole="teacher">
        <LabReportEditor />
      </ProtectedRoute>
    } />

    <Route path="/teacher/submission/:submissionId/grade" element={
      <ProtectedRoute requiredRole="teacher">
        <GradeSubmission />
      </ProtectedRoute>
    } />

    {/* Unified Content Creator */}
    <Route path="/teacher/content-creator" element={
      <ProtectedRoute requiredRole="teacher">
        <ContentCreator />
      </ProtectedRoute>
    } />

    <Route path="/teacher/question-generator" element={
      <ProtectedRoute requiredRole="teacher">
        <QuestionGenerator />
      </ProtectedRoute>
    } />

    <Route path="/teacher/questions/:chapterId" element={
      <ProtectedRoute requiredRole="teacher">
        <ViewChapterQuestions />
      </ProtectedRoute>
    } />

    <Route path="/teacher/create-quiz" element={
      <ProtectedRoute requiredRole="teacher">
        <CreateQuiz />
      </ProtectedRoute>
    } />

    <Route path="/teacher/create-exam" element={
      <ProtectedRoute requiredRole="teacher">
        <CreateExam />
      </ProtectedRoute>
    } />

    {/* Student routes */}
    <Route path="/student/progress" element={
      <ProtectedRoute requiredRole="student">
        <StudentProgress />
      </ProtectedRoute>
    } />

    <Route path="/student/flashcards/:chapterId" element={
      <ProtectedRoute requiredRole="student">
        <FlashcardStudy />
      </ProtectedRoute>
    } />

    <Route path="/student/feedback" element={
      <ProtectedRoute requiredRole="student">
        <StudentFeedback />
      </ProtectedRoute>
    } />

    {/* Teacher flashcard manager */}
    <Route path="/teacher/flashcards" element={
      <ProtectedRoute requiredRole="teacher">
        <FlashcardManager />
      </ProtectedRoute>
    } />

    {/* Admin-only routes */}
    <Route path="/admin/users" element={
      <ProtectedRoute requiredRole="admin">
        <AdminUsers />
      </ProtectedRoute>
    } />
    
    <Route path="/admin/analytics" element={
      <ProtectedRoute requiredRole="admin">
        <AdminAnalytics />
      </ProtectedRoute>
    } />
    
    <Route path="/admin/settings" element={
      <ProtectedRoute requiredRole="admin">
        <AdminSettings />
      </ProtectedRoute>
    } />

    <Route path="/admin/ai-models" element={
      <ProtectedRoute requiredRole="admin">
        <AIModelConfig />
      </ProtectedRoute>
    } />

    {/* Catch-all route */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <AppRoutes />
            </Layout>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
