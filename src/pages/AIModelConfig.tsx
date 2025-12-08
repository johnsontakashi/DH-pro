import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Sparkles,
  Server,
  DollarSign,
  Activity,
  TrendingUp,
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

interface AIModel {
  id: number;
  model_name: string;
  display_name: string;
  provider: string;
  api_endpoint: string | null;
  is_enabled: boolean;
  is_default: boolean;
  feature_assignments: Record<string, boolean> | null;
  cost_per_1k_input_tokens: number | null;
  cost_per_1k_output_tokens: number | null;
  max_tokens: number | null;
  temperature: number;
}

interface UsageStats {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  total_tokens: number;
  total_cost: number;
  avg_latency_ms: number;
  usage_by_feature: Record<string, number>;
  usage_by_model: Record<string, number>;
}

const AIModelConfig: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    model_name: '',
    display_name: '',
    provider: 'vllm',
    api_endpoint: '',
    api_key: '',
    is_enabled: true,
    is_default: false,
    max_tokens: 4096,
    temperature: 0.7,
    cost_per_1k_input_tokens: 0,
    cost_per_1k_output_tokens: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load models
      const modelsResponse = await api.get('/admin/ai-models/');
      setModels(modelsResponse.data.models);

      // Load usage stats
      try {
        const statsResponse = await api.get('/admin/ai-models/usage/stats?days=7');
        setStats(statsResponse.data);
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    } catch (error: any) {
      toast.error('Failed to load AI models');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    try {
      if (editingModel) {
        // Update existing model
        await api.put(`/admin/ai-models/${editingModel.id}`, formData);
        toast.success('Model updated successfully');
      } else {
        // Create new model
        await api.post('/admin/ai-models/', formData);
        toast.success('Model created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (modelId: number) => {
    if (!confirm('Are you sure you want to delete this model?')) return;

    try {
      await api.delete(`/admin/ai-models/${modelId}`);
      toast.success('Model deleted successfully');
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete model');
    }
  };

  const handleSetDefault = async (modelId: number) => {
    try {
      await api.post(`/admin/ai-models/${modelId}/set-default`);
      toast.success('Default model updated');
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to set default');
    }
  };

  const handleToggleEnabled = async (modelId: number, currentState: boolean) => {
    try {
      await api.put(`/admin/ai-models/${modelId}`, { is_enabled: !currentState });
      toast.success(`Model ${!currentState ? 'enabled' : 'disabled'}`);
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update model');
    }
  };

  const resetForm = () => {
    setFormData({
      model_name: '',
      display_name: '',
      provider: 'vllm',
      api_endpoint: '',
      api_key: '',
      is_enabled: true,
      is_default: false,
      max_tokens: 4096,
      temperature: 0.7,
      cost_per_1k_input_tokens: 0,
      cost_per_1k_output_tokens: 0,
    });
    setEditingModel(null);
  };

  const openEditDialog = (model: AIModel) => {
    setEditingModel(model);
    setFormData({
      model_name: model.model_name,
      display_name: model.display_name,
      provider: model.provider,
      api_endpoint: model.api_endpoint || '',
      api_key: '',
      is_enabled: model.is_enabled,
      is_default: model.is_default,
      max_tokens: model.max_tokens || 4096,
      temperature: model.temperature || 0.7,
      cost_per_1k_input_tokens: model.cost_per_1k_input_tokens || 0,
      cost_per_1k_output_tokens: model.cost_per_1k_output_tokens || 0,
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading AI models...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-500" />
            AI Model Configuration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage AI models including GPT, LLaMA, and Qwen
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-purple-500 hover:bg-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Model
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingModel ? 'Edit AI Model' : 'Add New AI Model'}
              </DialogTitle>
              <DialogDescription>
                Configure a new AI model (vLLM for LLaMA/Qwen or OpenAI)
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="model_name">Model Name *</Label>
                  <Input
                    id="model_name"
                    value={formData.model_name}
                    onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                    placeholder="llama-3.3-70b"
                    disabled={!!editingModel}
                  />
                </div>
                <div>
                  <Label htmlFor="display_name">Display Name *</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="LLaMA 3.3 70B"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="provider">Provider *</Label>
                  <select
                    id="provider"
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  >
                    <option value="vllm">vLLM</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="api_endpoint">API Endpoint</Label>
                  <Input
                    id="api_endpoint"
                    value={formData.api_endpoint}
                    onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                    placeholder="http://localhost:8000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_tokens">Max Tokens</Label>
                  <Input
                    id="max_tokens"
                    type="number"
                    value={formData.max_tokens}
                    onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost_input">Cost per 1K Input Tokens ($)</Label>
                  <Input
                    id="cost_input"
                    type="number"
                    step="0.0001"
                    value={formData.cost_per_1k_input_tokens}
                    onChange={(e) => setFormData({ ...formData, cost_per_1k_input_tokens: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="cost_output">Cost per 1K Output Tokens ($)</Label>
                  <Input
                    id="cost_output"
                    type="number"
                    step="0.0001"
                    value={formData.cost_per_1k_output_tokens}
                    onChange={(e) => setFormData({ ...formData, cost_per_1k_output_tokens: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_enabled"
                  checked={formData.is_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
                />
                <Label htmlFor="is_enabled">Enable this model</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
                <Label htmlFor="is_default">Set as default model</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrUpdate} className="bg-purple-500 hover:bg-purple-600">
                {editingModel ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Usage Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold">{Number(stats.total_requests || 0).toLocaleString()}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold">
                    {stats.total_requests > 0
                      ? ((Number(stats.successful_requests) / Number(stats.total_requests)) * 100).toFixed(1)
                      : '0.0'}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Cost</p>
                  <p className="text-2xl font-bold">${Number(stats.total_cost || 0).toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Latency</p>
                  <p className="text-2xl font-bold">{Number(stats.avg_latency_ms || 0).toFixed(0)}ms</p>
                </div>
                <Server className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Models List */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Models</CardTitle>
          <CardDescription>
            Manage your AI model configurations. GPT models are used by default if no specific model is assigned.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {models.map((model) => (
              <div
                key={model.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{model.display_name}</h3>
                    {model.is_default && (
                      <Badge className="bg-purple-500">Default</Badge>
                    )}
                    {model.is_enabled ? (
                      <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Enabled</Badge>
                    ) : (
                      <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Disabled</Badge>
                    )}
                    <Badge variant="outline">{model.provider.toUpperCase()}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Model: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{model.model_name}</code>
                  </p>
                  {model.api_endpoint && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Endpoint: {model.api_endpoint}
                    </p>
                  )}
                  {(model.cost_per_1k_input_tokens || model.cost_per_1k_output_tokens) && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Cost: ${model.cost_per_1k_input_tokens}/1K in, ${model.cost_per_1k_output_tokens}/1K out
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={model.is_enabled}
                    onCheckedChange={() => handleToggleEnabled(model.id, model.is_enabled)}
                  />
                  {!model.is_default && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetDefault(model.id)}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(model)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {!model.is_default && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(model.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {models.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No models configured yet. Add your first model to get started!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIModelConfig;
