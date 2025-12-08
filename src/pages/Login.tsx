import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { GraduationCap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    let isValid = true;
    
    // Reset errors
    setEmailError('');
    setPasswordError('');
    
    // Email validation
    if (!email.trim()) {
      setEmailError(t('validation.emailRequired'));
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(t('validation.emailInvalid'));
      isValid = false;
    }

    // Password validation
    if (!password.trim()) {
      setPasswordError(t('validation.passwordRequired'));
      isValid = false;
    } else if (password.length < 3) {
      setPasswordError(t('validation.passwordMinLength'));
      isValid = false;
    }
    
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const success = await login(email, password);
    if (success) {
      toast.success(t('auth.loginSuccess'));
      // Navigate to home page, which will redirect to appropriate dashboard
      navigate('/');
    } else {
      toast.error(t('auth.loginError'));
    }
  };

  const quickLogin = async (userType: string, email: string) => {
    setEmail(email);
    setPassword('password');
    setEmailError('');
    setPasswordError('');
    
    // Auto-submit after a short delay
    setTimeout(async () => {
      const success = await login(email, 'password');
      if (success) {
        toast.success(`Logged in as ${userType}!`);
        // Navigate to home page, which will redirect to appropriate dashboard
        navigate('/');
      } else {
        toast.error('Quick login failed');
      }
    }, 300);
  };

  return (
    <div className="min-h-screen h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-info/5 p-4 relative overflow-hidden">
      {/* Theme Toggle and Language Switcher in top right */}
      <div className="absolute top-4 right-4 flex gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center academic-gradient">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">STEMentorat</h1>
          <p className="text-muted-foreground">Your AI-Powered Learning Assistant</p>
        </div>

        {/* Login Form */}
        <Card className="card-shadow">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">{t('auth.signIn')}</CardTitle>
            <CardDescription>
              {t('auth.enterEmail')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('common.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.enterEmail')}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  required
                  className={`h-10 ${emailError ? 'border-destructive' : ''}`}
                />
                {emailError && (
                  <p className="text-sm text-destructive mt-1">{emailError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('common.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('auth.enterPassword')}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  required
                  className={`h-10 ${passwordError ? 'border-destructive' : ''}`}
                />
                {passwordError && (
                  <p className="text-sm text-destructive mt-1">{passwordError}</p>
                )}
              </div>
              <Button type="submit" className="w-full h-10" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('auth.signIn')
                )}
              </Button>
            </form>

            {/* Register Link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">{t('auth.noAccount')} </span>
              <Link to="/register" className="text-primary hover:underline font-medium">
                {t('auth.signUp')}
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="text-center text-sm text-muted-foreground">
          <p>✨ AI-powered study tools • 📊 Progress tracking • 🤖 Personalized learning</p>
        </div>
      </div>
    </div>
  );
};

export default Login;