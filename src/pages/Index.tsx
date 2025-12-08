import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GraduationCap, Brain, BookOpen, Target, Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'student':
          navigate('/student');
          break;
        case 'teacher':
          navigate('/teacher');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          navigate('/login');
      }
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description: "Get personalized study assistance with advanced AI technology"
    },
    {
      icon: BookOpen,
      title: "Smart Study Materials",
      description: "Auto-generated quizzes, flashcards, and study guides"
    },
    {
      icon: Target,
      title: "Personalized Learning Paths",
      description: "Adaptive learning journeys tailored to your progress"
    },
    {
      icon: Users,
      title: "Collaborative Environment",
      description: "Connect with teachers and peers in an integrated platform"
    },
    {
      icon: TrendingUp,
      title: "Progress Tracking",
      description: "Monitor your learning progress with detailed analytics"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-info/5 relative">
      {/* Theme Toggle in top right */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle showLabel />
      </div>
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <div className="flex justify-center">
            <div className="h-24 w-24 bg-primary rounded-3xl flex items-center justify-center academic-gradient">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-foreground">STEMentorat</h1>
            <p className="text-2xl text-muted-foreground max-w-2xl mx-auto">
              Your AI-Powered STEM Learning Assistant
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Transform your STEM education with personalized AI tutoring, smart study materials, 
              and comprehensive progress tracking. Whether you're a student, teacher, or administrator, 
              STEMentorat adapts to your needs.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              className="academic-gradient text-lg px-8 py-3"
              onClick={() => navigate('/login')}
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-3"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <Badge variant="secondary" className="text-sm">For Students</Badge>
            <Badge variant="secondary" className="text-sm">For Teachers</Badge>
            <Badge variant="secondary" className="text-sm">For Administrators</Badge>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">Why Choose STEMentorat?</h2>
          <p className="text-xl text-muted-foreground">
            Cutting-edge AI technology meets proven educational methodologies
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="card-shadow hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <Card className="card-shadow academic-gradient text-white text-center">
          <CardContent className="py-12">
            <h3 className="text-3xl font-bold mb-4">Ready to Transform Your STEM Learning?</h3>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of students and educators already using STEMentorat
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8 py-3"
              onClick={() => navigate('/login')}
            >
              Start Your Journey
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 STEMentorat. All rights reserved.</p>
            <p className="text-sm mt-2">Empowering STEM education through AI innovation.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
