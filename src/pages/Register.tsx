import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GraduationCap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { register as registerUser } from '@/services/authService';

const Register = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    let isValid = true;

    // Reset errors
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setNameError('');

    // Name validation
    if (!firstName.trim()) {
      setNameError(t('validation.firstNameRequired'));
      isValid = false;
    } else if (!lastName.trim()) {
      setNameError(t('validation.lastNameRequired'));
      isValid = false;
    }

    // Email validation
    if (!email.trim()) {
      setEmailError(t('validation.emailRequired'));
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(t('validation.validEmail'));
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

    // Confirm password validation
    if (!confirmPassword.trim()) {
      setConfirmPasswordError(t('validation.confirmPassword'));
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError(t('validation.passwordsNoMatch'));
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await registerUser({
        email,
        password,
        role,
        first_name: firstName,
        last_name: lastName,
        title: role === 'teacher' ? title : undefined
      });
      toast.success(t('register.registrationSuccess'));
      navigate('/login');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || t('register.registrationFailed');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-info/5 p-4 relative overflow-hidden">
      {/* Theme Toggle in top right */}
      <div className="absolute top-4 right-4">
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
          <p className="text-muted-foreground">{t('register.createAccount')}</p>
        </div>

        {/* Register Form */}
        <Card className="card-shadow">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">{t('register.title')}</CardTitle>
            <CardDescription>
              {t('register.enterDetails')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form id="register-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('register.firstName')}</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder={t('register.firstNamePlaceholder')}
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (nameError) setNameError('');
                    }}
                    required
                    className={`h-10 ${nameError ? 'border-destructive' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('register.lastName')}</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder={t('register.lastNamePlaceholder')}
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (nameError) setNameError('');
                    }}
                    required
                    className={`h-10 ${nameError ? 'border-destructive' : ''}`}
                  />
                </div>
              </div>
              {nameError && (
                <p className="text-sm text-destructive mt-1">{nameError}</p>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t('common.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('register.emailPlaceholder')}
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
                  placeholder={t('register.passwordPlaceholder')}
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

              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t('register.confirmPasswordLabel')}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder={t('register.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError) setConfirmPasswordError('');
                  }}
                  required
                  className={`h-10 ${confirmPasswordError ? 'border-destructive' : ''}`}
                />
                {confirmPasswordError && (
                  <p className="text-sm text-destructive mt-1">{confirmPasswordError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">{t('register.role')}</Label>
                <Select value={role} onValueChange={(value: any) => setRole(value)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={t('register.selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">{t('register.student')}</SelectItem>
                    <SelectItem value="teacher">{t('register.teacher')}</SelectItem>
                    <SelectItem value="admin">{t('register.admin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === 'teacher' && (
                <div className="space-y-2">
                  <Label htmlFor="title">{t('register.titleOptional')}</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder={t('register.titlePlaceholder')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('register.titleHelp')}
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full h-10" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('register.creatingAccount')}
                  </>
                ) : (
                  t('register.createAccount')
                )}
              </Button>
            </form>

            {/* Login Link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">{t('register.hasAccount')} </span>
              <Link to="/login" className="text-primary hover:underline font-medium">
                {t('register.signIn')}
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="text-center text-sm text-muted-foreground">
          <p>{t('register.features')}</p>
        </div>
      </div>
    </div>
  );
};

export default Register;
