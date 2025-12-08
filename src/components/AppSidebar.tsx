import {
  BookOpen,
  Brain,
  FileText,
  BarChart3,
  Users,
  Settings,
  GraduationCap,
  Upload,
  LogOut,
  Home,
  TestTube,
  Database,
  Book,
  ClipboardList,
  FileCheck,
  Lightbulb,
  MessageSquare,
  Clipboard,
  Zap,
  Layers,
  MessagesSquare,
  History
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function AppSidebar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const navigate = useNavigate();

  const collapsed = state === "collapsed";

  if (!user) return null;

  // Define nav items with translation keys
  const studentNavItems = [
    { titleKey: "nav.dashboard", url: "/student", icon: Home },
    { titleKey: "nav.subjects", url: "/subjects", icon: Book },
    { titleKey: "nav.aiAssistant", url: "/ai-chat", icon: MessageSquare },
    { titleKey: "nav.assignments", url: "/assignments", icon: Clipboard },
    // { titleKey: "nav.labReports", url: "/lab-reports", icon: TestTube },
    { titleKey: "nav.exams", url: "/exams", icon: FileCheck },
    { titleKey: "nav.aiStudyTools", url: "/ai-tools", icon: Brain },
    { titleKey: "nav.myFeedback", url: "/student/feedback", icon: MessagesSquare },
  ];

  const teacherNavItems = [
    { titleKey: "nav.dashboard", url: "/teacher", icon: Home },
    { titleKey: "nav.subjects", url: "/subjects", icon: Book },
    { titleKey: "nav.assignments", url: "/assignments", icon: Clipboard },
    // { titleKey: "nav.labReports", url: "/lab-reports", icon: TestTube },
    { titleKey: "nav.contentCreator", url: "/teacher/content-creator", icon: Layers },
    { titleKey: "nav.uploadResource", url: "/upload-resource", icon: Upload },
    { titleKey: "nav.analytics", url: "/teacher/analytics", icon: BarChart3 },
    { titleKey: "nav.aiLessonPlanner", url: "/teacher/lesson-planner", icon: Lightbulb },
    { titleKey: "nav.myLessons", url: "/teacher/my-lessons", icon: History },
  ];

  const adminNavItems = [
    { titleKey: "nav.dashboard", url: "/admin", icon: Home },
    { titleKey: "nav.subjects", url: "/subjects", icon: Book },
    { titleKey: "nav.userManagement", url: "/admin/users", icon: Users },
    { titleKey: "nav.analytics", url: "/admin/analytics", icon: BarChart3 },
    { titleKey: "nav.ragTest", url: "/rag-test", icon: Database },
    { titleKey: "nav.settings", url: "/admin/settings", icon: Settings },
  ];

  const getNavItems = () => {
    switch (user.role) {
      case 'student':
        return studentNavItems;
      case 'teacher':
        return teacherNavItems;
      case 'admin':
        return adminNavItems;
      default:
        return [];
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success(t('auth.logoutSuccess'));
  };

  const navItems = getNavItems();

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-sm font-semibold">STEMentorat</h2>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item, index) => (
                <SidebarMenuItem key={item.titleKey || item.title || index}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            className={({ isActive }) =>
                              isActive
                                ? "bg-sidebar-accent text-sidebar-primary font-medium"
                                : "hover:bg-sidebar-accent/50"
                            }
                          >
                            <item.icon className="h-4 w-4" />
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.titleKey ? t(item.titleKey) : item.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          isActive
                            ? "bg-sidebar-accent text-sidebar-primary font-medium"
                            : "hover:bg-sidebar-accent/50"
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.titleKey ? t(item.titleKey) : item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-3">
          {/* Theme Toggle and Language Switcher - Full width when expanded */}
          {!collapsed && (
            <div className="px-1 space-y-2">
              <ThemeToggle variant="outline" size="sm" showLabel />
              <LanguageSwitcher />
            </div>
          )}
          
          {/* User Info and Actions */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              {!collapsed && (
                <div>
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {/* Theme toggle and Language switcher when collapsed */}
              {collapsed && (
                <>
                  <ThemeToggle size="sm" />
                  <LanguageSwitcher />
                </>
              )}

              {/* Logout button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="h-8 w-8 p-0"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('common.logout')}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}