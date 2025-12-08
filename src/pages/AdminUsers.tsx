import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Edit3,
  Trash2,
  Search,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  first_name?: string;
  last_name?: string;
  title?: string;
}

interface UserCounts {
  total: number;
  students: number;
  teachers: number;
  admins: number;
}

const AdminUsers = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // New user form
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('');
  const [newUserTitle, setNewUserTitle] = useState('');

  // Edit user form
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const [users, setUsers] = useState<User[]>([]);
  const [userCounts, setUserCounts] = useState<UserCounts>({ total: 0, students: 0, teachers: 0, admins: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const [usersRes, countsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/users/count')
      ]);
      setUsers(usersRes.data);
      setUserCounts(countsRes.data);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-destructive';
      case 'teacher': return 'bg-primary';
      case 'student': return 'bg-success';
      default: return 'bg-muted';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'text-success' : 'text-muted-foreground';
  };

  const handleAddUser = async () => {
    if (!newUserFirstName.trim() || !newUserEmail.trim() || !newUserRole || !newUserPassword.trim()) {
      toast.error(t('validation.fillAllRequired'));
      return;
    }

    try {
      setSaving(true);
      await api.post('/admin/users', {
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        first_name: newUserFirstName,
        last_name: newUserLastName,
        title: newUserTitle || null
      });

      // Clear form
      setNewUserFirstName('');
      setNewUserLastName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('');
      setNewUserTitle('');
      setIsAddUserModalOpen(false);

      toast.success(t('adminUsers.userAddedSuccess'));
      loadUsers();
    } catch (error: any) {
      console.error('Failed to add user:', error);
      toast.error(error.response?.data?.detail || 'Failed to add user');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      const updateData: any = {
        first_name: editFirstName,
        last_name: editLastName,
        role: editRole
      };

      if (editEmail !== selectedUser.email) {
        updateData.email = editEmail;
      }

      if (editPassword.trim()) {
        updateData.password = editPassword;
      }

      await api.put(`/admin/users/${selectedUser.id}`, updateData);

      setIsEditMode(false);
      setIsUserModalOpen(false);
      setEditPassword('');

      toast.success('User updated successfully');
      loadUsers();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      toast.error(error.response?.data?.detail || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      setIsUserModalOpen(false);
      toast.success(t('adminUsers.userRemovedSuccess'));
      loadUsers();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const openEditMode = () => {
    if (selectedUser) {
      setEditFirstName(selectedUser.first_name || '');
      setEditLastName(selectedUser.last_name || '');
      setEditEmail(selectedUser.email);
      setEditRole(selectedUser.role);
      setEditPassword('');
      setIsEditMode(true);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('adminUsers.title')}</h1>
          <p className="text-muted-foreground">{t('adminUsers.subtitle')}</p>
        </div>
        <Button onClick={() => setIsAddUserModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('adminUsers.addNewUser')}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('admin.totalUsers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCounts.total}</div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('adminUsers.teachers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{userCounts.teachers}</div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('adminUsers.students')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{userCounts.students}</div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('adminUsers.admins')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{userCounts.admins}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('adminUsers.allUsers')}
          </CardTitle>
          <CardDescription>
            {t('adminUsers.searchManageAccounts')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('adminUsers.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredUsers.map((userData) => (
              <div
                key={userData.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedUser(userData);
                  setIsEditMode(false);
                  setIsUserModalOpen(true);
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {userData.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{userData.name}</p>
                    <p className="text-sm text-muted-foreground">{userData.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={getRoleColor(userData.role)}>
                    {t(`adminUsers.roles.${userData.role}`)}
                  </Badge>
                  <div className="text-right">
                    <div className={`flex items-center gap-1 text-sm ${getStatusColor(userData.status)}`}>
                      {userData.status === 'active' ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                      {t(`adminUsers.status.${userData.status}`)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <p>{t('adminUsers.noUsersFound')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details/Edit Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={(open) => {
        setIsUserModalOpen(open);
        if (!open) setIsEditMode(false);
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit User' : selectedUser?.name}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update user information' : t('adminUsers.userManagementDialog')}
            </DialogDescription>
          </DialogHeader>

          {isEditMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('common.email')}</Label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('adminUsers.role')}</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">{t('adminUsers.roles.student')}</SelectItem>
                    <SelectItem value="teacher">{t('adminUsers.roles.teacher')}</SelectItem>
                    <SelectItem value="admin">{t('adminUsers.roles.admin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>New Password (leave blank to keep current)</Label>
                <Input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={handleUpdateUser} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditMode(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">{t('common.email')}</p>
                  <p className="font-medium">{selectedUser?.email}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">{t('adminUsers.role')}</p>
                  <Badge className={getRoleColor(selectedUser?.role || '')}>
                    {selectedUser?.role && t(`adminUsers.roles.${selectedUser.role}`)}
                  </Badge>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">{t('adminUsers.statusLabel')}</p>
                <div className={`flex items-center gap-1 ${getStatusColor(selectedUser?.status || '')}`}>
                  {selectedUser?.status === 'active' ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                  <span className="font-medium capitalize">{selectedUser?.status && t(`adminUsers.status.${selectedUser.status}`)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={openEditMode}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  {t('adminUsers.editUser')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => selectedUser && handleDeleteUser(selectedUser.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('adminUsers.remove')}
                </Button>
                <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>
                  {t('common.close')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('adminUsers.addNewUser')}</DialogTitle>
            <DialogDescription>
              {t('adminUsers.createNewAccount')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input
                  value={newUserFirstName}
                  onChange={(e) => setNewUserFirstName(e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={newUserLastName}
                  onChange={(e) => setNewUserLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('common.email')} *</Label>
              <Input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder={t('adminUsers.enterEmail')}
              />
            </div>

            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('adminUsers.role')} *</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger>
                  <SelectValue placeholder={t('adminUsers.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">{t('adminUsers.roles.student')}</SelectItem>
                  <SelectItem value="teacher">{t('adminUsers.roles.teacher')}</SelectItem>
                  <SelectItem value="admin">{t('adminUsers.roles.admin')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title (for teachers)</Label>
              <Input
                value={newUserTitle}
                onChange={(e) => setNewUserTitle(e.target.value)}
                placeholder="Dr., Prof., etc."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button className="flex-1" onClick={handleAddUser} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Plus className="mr-2 h-4 w-4" />
                {t('adminUsers.addUser')}
              </Button>
              <Button variant="outline" onClick={() => setIsAddUserModalOpen(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
