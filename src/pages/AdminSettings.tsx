import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  Globe,
  Database,
  Zap,
  Mail,
  Video,
  Wrench,
  Shield,
  Bell,
  Server,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

interface Integration {
  name: string;
  status: boolean;
  description: string;
}

const AdminSettings = () => {
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    autoBackup: true,
    emailNotifications: true,
    analyticsTracking: true,
    debugMode: false,
    apiRateLimit: 1000,
    sessionTimeout: 30,
    maxFileSize: 50
  });

  const [integrations, setIntegrations] = useState<Integration[]>([
    { name: "Moodle LMS", status: true, description: "Learning Management System" },
    { name: "Gmail Integration", status: true, description: "Email notifications and reports" },
    { name: "Zoom Meetings", status: false, description: "Virtual classroom integration" },
    { name: "Arduino IDE", status: true, description: "Code compilation and debugging" },
    { name: "MATLAB Online", status: false, description: "Mathematical computations" },
    { name: "LTspice", status: true, description: "Circuit simulation tools" },
  ]);

  const [emailSettings, setEmailSettings] = useState({
    smtpServer: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: 'noreply@stem.edu',
    smtpPassword: '',
    fromName: 'STEMentorat System'
  });

  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    requireTwoFactor: false,
    sessionSecurity: 'high',
    ipWhitelist: '',
    allowedDomains: '@stem.edu'
  });

  const handleSystemSettingToggle = (setting: string, newState: boolean) => {
    setSystemSettings(prev => ({
      ...prev,
      [setting]: newState
    }));
    toast.success(`${setting.replace(/([A-Z])/g, ' $1').toLowerCase()} ${newState ? 'enabled' : 'disabled'}`);
  };

  const handleIntegrationToggle = (integrationName: string, newState: boolean) => {
    setIntegrations(prev => 
      prev.map(integration => 
        integration.name === integrationName 
          ? { ...integration, status: newState }
          : integration
      )
    );
    toast.success(`${integrationName} ${newState ? 'enabled' : 'disabled'}`);
  };

  const handleSaveSettings = () => {
    toast.success('Settings saved successfully!');
  };

  const getIntegrationIcon = (name: string) => {
    if (name.includes('Moodle')) return <Globe className="h-5 w-5 text-primary" />;
    if (name.includes('Gmail')) return <Mail className="h-5 w-5 text-primary" />;
    if (name.includes('Zoom')) return <Video className="h-5 w-5 text-primary" />;
    if (name.includes('Arduino')) return <Wrench className="h-5 w-5 text-primary" />;
    if (name.includes('MATLAB')) return <Database className="h-5 w-5 text-primary" />;
    if (name.includes('LTspice')) return <Zap className="h-5 w-5 text-primary" />;
    return <Settings className="h-5 w-5 text-primary" />;
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings and integrations</p>
        </div>
        <Button onClick={handleSaveSettings}>
          <Save className="mr-2 h-4 w-4" />
          Save All Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Configuration */}
        <div className="space-y-6">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Core system configuration options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">Enable system maintenance mode</p>
                </div>
                <Switch 
                  checked={systemSettings.maintenanceMode}
                  onCheckedChange={(checked) => handleSystemSettingToggle('maintenanceMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-backup</p>
                  <p className="text-sm text-muted-foreground">Automatic daily data backups</p>
                </div>
                <Switch 
                  checked={systemSettings.autoBackup}
                  onCheckedChange={(checked) => handleSystemSettingToggle('autoBackup', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Send system notifications via email</p>
                </div>
                <Switch 
                  checked={systemSettings.emailNotifications}
                  onCheckedChange={(checked) => handleSystemSettingToggle('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Analytics Tracking</p>
                  <p className="text-sm text-muted-foreground">Track user behavior and system usage</p>
                </div>
                <Switch 
                  checked={systemSettings.analyticsTracking}
                  onCheckedChange={(checked) => handleSystemSettingToggle('analyticsTracking', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Debug Mode</p>
                  <p className="text-sm text-muted-foreground">Enable detailed system logging</p>
                </div>
                <Switch 
                  checked={systemSettings.debugMode}
                  onCheckedChange={(checked) => handleSystemSettingToggle('debugMode', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Performance Settings
              </CardTitle>
              <CardDescription>
                System performance and resource limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiRateLimit">API Rate Limit (requests/hour)</Label>
                <Input 
                  id="apiRateLimit"
                  type="number"
                  value={systemSettings.apiRateLimit}
                  onChange={(e) => setSystemSettings(prev => ({
                    ...prev,
                    apiRateLimit: parseInt(e.target.value) || 1000
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input 
                  id="sessionTimeout"
                  type="number"
                  value={systemSettings.sessionTimeout}
                  onChange={(e) => setSystemSettings(prev => ({
                    ...prev,
                    sessionTimeout: parseInt(e.target.value) || 30
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                <Input 
                  id="maxFileSize"
                  type="number"
                  value={systemSettings.maxFileSize}
                  onChange={(e) => setSystemSettings(prev => ({
                    ...prev,
                    maxFileSize: parseInt(e.target.value) || 50
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Security and authentication configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                <Input 
                  id="passwordMinLength"
                  type="number"
                  value={securitySettings.passwordMinLength}
                  onChange={(e) => setSecuritySettings(prev => ({
                    ...prev,
                    passwordMinLength: parseInt(e.target.value) || 8
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Require Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Force 2FA for all users</p>
                </div>
                <Switch 
                  checked={securitySettings.requireTwoFactor}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({
                    ...prev,
                    requireTwoFactor: checked
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionSecurity">Session Security Level</Label>
                <Select 
                  value={securitySettings.sessionSecurity} 
                  onValueChange={(value) => setSecuritySettings(prev => ({
                    ...prev,
                    sessionSecurity: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowedDomains">Allowed Email Domains</Label>
                <Input 
                  id="allowedDomains"
                  value={securitySettings.allowedDomains}
                  onChange={(e) => setSecuritySettings(prev => ({
                    ...prev,
                    allowedDomains: e.target.value
                  }))}
                  placeholder="@stem.edu, @university.edu"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integrations and Communication */}
        <div className="space-y-6">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                System Integrations
              </CardTitle>
              <CardDescription>
                Configure external service integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {integrations.map((integration, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {getIntegrationIcon(integration.name)}
                      </div>
                      <div>
                        <p className="font-medium">{integration.name}</p>
                        <p className="text-sm text-muted-foreground">{integration.description}</p>
                      </div>
                    </div>
                    <Switch 
                      checked={integration.status} 
                      onCheckedChange={(checked) => handleIntegrationToggle(integration.name, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>
                SMTP server settings for system emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpServer">SMTP Server</Label>
                  <Input 
                    id="smtpServer"
                    value={emailSettings.smtpServer}
                    onChange={(e) => setEmailSettings(prev => ({
                      ...prev,
                      smtpServer: e.target.value
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">Port</Label>
                  <Input 
                    id="smtpPort"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings(prev => ({
                      ...prev,
                      smtpPort: e.target.value
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpUser">Username</Label>
                <Input 
                  id="smtpUser"
                  value={emailSettings.smtpUser}
                  onChange={(e) => setEmailSettings(prev => ({
                    ...prev,
                    smtpUser: e.target.value
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpPassword">Password</Label>
                <Input 
                  id="smtpPassword"
                  type="password"
                  value={emailSettings.smtpPassword}
                  onChange={(e) => setEmailSettings(prev => ({
                    ...prev,
                    smtpPassword: e.target.value
                  }))}
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromName">From Name</Label>
                <Input 
                  id="fromName"
                  value={emailSettings.fromName}
                  onChange={(e) => setEmailSettings(prev => ({
                    ...prev,
                    fromName: e.target.value
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure system notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alertEmail">Alert Recipient Email</Label>
                <Input 
                  id="alertEmail"
                  type="email"
                  placeholder="admin@stem.edu"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notificationTemplate">Notification Template</Label>
                <Textarea 
                  id="notificationTemplate"
                  placeholder="Enter custom notification template..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">System Alerts</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">User Notifications</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Error Reports</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Weekly Summaries</span>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;