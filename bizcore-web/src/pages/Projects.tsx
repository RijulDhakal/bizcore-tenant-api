import { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { 
  Plus, 
  Search, 
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List,
  TrendingUp,
  Target,
  Users
} from 'lucide-react';
import { formatDate } from '../utils/format';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { projectsApi } from '../api/projects.api';
import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Loader2 } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  status: z.string().or(z.number()),
  priority: z.string().or(z.number()),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  budget: z.number().optional(),
  color: z.string(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function Projects() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { projects, summary } = useProjects({ search });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: 'Planning', 
      priority: 'Medium',
      color: '#4F6EF7',
      description: '',
      startDate: '',
      dueDate: '',
      budget: 0,
    }
  });

  const handleCreateProject = async (data: ProjectFormValues) => {
    try {
      const res = await projectsApi.createProject(data);
      if (res.success) {
        toast.success('Project created successfully');
        setIsProjectOpen(false);
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        queryClient.invalidateQueries({ queryKey: ['projects-summary'] });
      }
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-slate-500/10 text-slate-500'; // Planning
      case 1: return 'bg-blue-500/10 text-blue-500';   // Active
      case 2: return 'bg-amber-500/10 text-amber-500'; // OnHold
      case 3: return 'bg-emerald-500/10 text-emerald-500'; // Completed
      case 4: return 'bg-rose-500/10 text-rose-500';   // Cancelled
      default: return 'bg-slate-500/10 text-slate-500';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Project Management</h1>
          <p className="text-sm text-muted-foreground">Track projects, tasks, and team productivity</p>
        </div>
        <Button
          onClick={() => {
            reset();
            setIsProjectOpen(true);
          }}
          className="rounded-md px-6"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10 text-primary"><Target size={20} /></div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Projects</p>
              <p className="text-2xl font-bold text-foreground">{summary.data?.data?.totalProjects || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-500/10 text-blue-500"><TrendingUp size={20} /></div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Active Now</p>
              <p className="text-2xl font-bold text-foreground">{summary.data?.data?.activeProjects || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-500"><CheckCircle2 size={20} /></div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-foreground">{summary.data?.data?.completedProjects || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2 rounded-md bg-amber-500/10 text-amber-500"><AlertCircle size={20} /></div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Tasks</p>
              <p className="text-2xl font-bold text-foreground">{summary.data?.data?.tasksCount || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-md"
          />
        </div>
        <div className="flex items-center gap-2 p-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl">
          <button 
            onClick={() => setViewMode('grid')}
            className={clsx("p-2 rounded-xl transition-all", viewMode === 'grid' ? "bg-[var(--bg-elevated)] text-[#4F6EF7]" : "text-[var(--text-muted)]")}
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={clsx("p-2 rounded-xl transition-all", viewMode === 'list' ? "bg-[var(--bg-elevated)] text-[#4F6EF7]" : "text-[var(--text-muted)]")}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.isLoading ? (
          [...Array(6)].map((_, i) => <div key={i} className="h-64 rounded-3xl bg-[var(--bg-card)] animate-pulse border border-[var(--border-color)]" />)
        ) : projects.data?.data?.map((project: any) => (
          <div 
            key={project.id}
            onClick={() => navigate(`/projects/${project.id}`)}
            className="group relative cursor-pointer overflow-hidden rounded-[2.5rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 transition-all hover:shadow-2xl hover:shadow-[#4F6EF7]/10 hover:-translate-y-1.5"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-bl-full transition-all group-hover:opacity-10" style={{ backgroundColor: project.color }} />
            
            <div className="flex items-start justify-between">
              <div className="h-14 w-14 rounded-[1.25rem] bg-gradient-to-br from-[#4F6EF7] to-[#3B5BDB] flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-[#4F6EF7]/20 border border-white/5">
                {project.name[0]}
              </div>
              <div className={clsx("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", getStatusColor(project.status))}>
                {['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'][project.status]}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight group-hover:text-[#4F6EF7] transition-colors">{project.name}</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-2 line-clamp-2 leading-relaxed font-medium">{project.description || 'No description provided.'}</p>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                <span>Progress</span>
                <span className="text-[var(--text-primary)]">{project.taskCount > 0 ? Math.round((project.completedTaskCount / project.taskCount) * 100) : 0}%</span>
              </div>
              <div className="h-2 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden border border-[var(--border-color)]/20">
                <div 
                  className="h-full bg-gradient-to-r from-[#4F6EF7] to-[#3B5BDB] transition-all duration-1000 ease-out shadow-[0_0_8px_#4F6EF7]" 
                  style={{ width: `${project.taskCount > 0 ? (project.completedTaskCount / project.taskCount) * 100 : 0}%` }} 
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <div className="flex -space-x-3 overflow-hidden">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-9 w-9 rounded-xl border-2 border-[var(--bg-card)] bg-[var(--bg-elevated)] flex items-center justify-center text-[10px] font-bold shadow-sm">
                    <Users size={14} className="opacity-40" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none">Due Date</span>
                <span className="text-[11px] font-bold text-rose-500 uppercase mt-1.5 leading-none">{project.dueDate ? formatDate(project.dueDate) : 'Not Set'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

            <Dialog open={isProjectOpen} onOpenChange={setIsProjectOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(handleCreateProject)}>
            <div className="space-y-4 py-2">
            
              <div className="space-y-2">
                <Label>Project Name *</Label>
                <Input
                  placeholder="e.g. Website Redesign"
                  className="rounded-md"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.name.message as string}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Define project goals..."
                  className="rounded-md resize-none"
                  rows={3}
                  {...register('description')}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={watch('status') as string} onValueChange={(v) => setValue('status', v)}>
                    <SelectTrigger className="rounded-md">
                      <SelectValue placeholder="Select Status"/>
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="OnHold">On Hold</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={watch('priority') as string} onValueChange={(v) => setValue('priority', v)}>
                    <SelectTrigger className="rounded-md">
                      <SelectValue placeholder="Select Priority"/>
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    className="rounded-md"
                    {...register('startDate')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    className="rounded-md"
                    {...register('dueDate')}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Budget (NPR) — Optional</Label>
                <Input
                  type="number"
                  placeholder="0"
                  className="rounded-md"
                  onWheel={(e) => e.currentTarget.blur()}
                  onFocus={(e) => {
                    if (e.target.value === '0') e.target.value = ''
                  }}
                  {...register('budget', {
                    valueAsNumber: true,
                    onBlur: (e) => {
                      if (e.target.value === '') e.target.value = '0';
                    },
                  })}
                />
              </div>
              
            </div>
            
            <DialogFooter className="pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsProjectOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                  Creating...</>
                ) : (
                  'Create Project'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
