import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { User, GraduationCap, Shield } from 'lucide-react';

interface PersonalizedHeaderProps {
  hideRole?: boolean;
  className?: string;
}

const PersonalizedHeader = ({ hideRole = false, className = '' }: PersonalizedHeaderProps) => {
  const { user } = useAuth();

  if (!user) return null;

  // Determine greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 18) return 'Good afternoon';
    if (hour >= 18 && hour < 24) return 'Good evening';
    return 'Welcome back';
  };

  // Format name based on role
  const getFormattedName = () => {
    // For teachers with potential titles, use full name
    if (user.role === 'teacher') {
      // If name starts with Dr., Prof., etc., use it as is
      if (user.name?.match(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)/i)) {
        return user.name;
      }
      // Otherwise, just use first name for friendly greeting
      const firstName = user.name?.split(' ')[0];
      return firstName || user.name;
    }

    // For students and admins, use first name
    const firstName = user.name?.split(' ')[0];
    return firstName || user.name;
  };

  // Get role icon
  const getRoleIcon = () => {
    switch (user.role) {
      case 'student':
        return <GraduationCap className="h-4 w-4" />;
      case 'teacher':
        return <User className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  // Get role badge variant
  const getRoleVariant = () => {
    switch (user.role) {
      case 'student':
        return 'default';
      case 'teacher':
        return 'secondary';
      case 'admin':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {getGreeting()}, {getFormattedName()}!
        </h1>
        {!hideRole && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={getRoleVariant()} className="flex items-center gap-1">
              {getRoleIcon()}
              <span className="capitalize">{user.role}</span>
            </Badge>
            {user.email && (
              <span className="text-sm text-muted-foreground hidden md:inline">
                {user.email}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalizedHeader;
