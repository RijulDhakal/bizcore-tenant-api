import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { 
  Plus, 
  Clock,
  ChevronLeft,
  MoreVertical,
  Circle,
  Calendar
} from 'lucide-react';
import { SlideOver } from '../components/ui/slide-over';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { projectsApi } from '../api/projects.api';
import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { formatDate } from '../utils/format';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.number(),
  priority: z.number(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isTaskOpen, setIsTaskOpen] = useState(false);

  const { projects, tasks } = useProjects();
  const projectDetails = projects.data?.data?.find((p: any) => p.id === id);
  const { data: tasksData } = tasks(id);

  const { register, handleSubmit, reset } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: { status: 0, priority: 1, description: '', dueDate: '', estimatedHours: 0 }
  });

  const handleCreateTask = async (data: TaskFormValues) => {
    try {
      const res = await projectsApi.createTask(id!, data);
      if (res.success) {
        toast.success('Task added successfully');
        setIsTaskOpen(false);
        queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      }
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const columns = [
    { id: 0, label: 'To Do', color: 'bg-slate-400' },
    { id: 1, label: 'In Progress', color: 'bg-blue-500' },
    { id: 2, label: 'In Review', color: 'bg-amber-500' },
    { id: 3, label: 'Done', color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/projects')} className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[#4F6EF7] transition-all shadow-sm">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[var(--text-primary)] leading-none">{projectDetails?.name || 'Project Details'}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Status</span>
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#4F6EF7]">{projectDetails?.taskCount || 0} Total Tasks</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              reset();
              setIsTaskOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-[#4F6EF7] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#4F6EF7]/20 hover:bg-[#3B5BDB] transition-all"
          >
            <Plus size={18} />
            Add Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start overflow-x-auto pb-10">
        {columns.map((col) => (
          <div key={col.id} className="min-w-[300px] flex flex-col gap-4">
            <div className="flex items-center justify-between px-3">
              <div className="flex items-center gap-2">
                <div className={clsx("h-2 w-2 rounded-full", col.color)} />
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">{col.label}</h3>
                <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded-lg border border-[var(--border-color)]/30">
                  {tasksData?.data?.filter((t: any) => t.status === col.id).length || 0}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-2 rounded-[2rem] bg-[var(--bg-card)]/30 border border-[var(--border-color)]/20 min-h-[500px]">
              {tasksData?.data?.filter((t: any) => t.status === col.id).map((task: any) => (
                <div 
                  key={task.id}
                  className="group rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-sm hover:shadow-xl hover:shadow-[#4F6EF7]/5 transition-all cursor-pointer border-l-4"
                  style={{ borderLeftColor: task.priority === 3 ? '#ef4444' : task.priority === 2 ? '#f59e0b' : '#3b82f6' }}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-bold text-[var(--text-primary)] leading-tight group-hover:text-[#4F6EF7] transition-colors">{task.title}</h4>
                    <button className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-all">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                  
                  {task.description && (
                    <p className="mt-2 text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">{task.description}</p>
                  )}

                  <div className="mt-5 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      <div className="flex items-center gap-1.5 bg-[var(--bg-elevated)] px-2.5 py-1 rounded-lg border border-[var(--border-color)]/30 shadow-sm">
                        <Clock size={12} className="text-[#4F6EF7]" />
                        {task.estimatedHours || 0}H
                      </div>
                      {task.dueDate && (
                        <div className="flex items-center gap-1.5 bg-[var(--bg-elevated)] px-2.5 py-1 rounded-lg border border-[var(--border-color)]/30 shadow-sm">
                          <Calendar size={12} className="text-rose-500" />
                          {formatDate(task.dueDate)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[var(--border-color)]/50 flex items-center justify-between">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#4F6EF7]/10 to-[#3B5BDB]/10 flex items-center justify-center border border-[#4F6EF7]/20">
                      <Circle size={12} className="text-[#4F6EF7] opacity-60" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <SlideOver
        isOpen={isTaskOpen}
        onClose={() => setIsTaskOpen(false)}
        title="Add New Task"
      >
        <form onSubmit={handleSubmit(handleCreateTask)} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Task Title</label>
            <input
              {...register('title')}
              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 text-sm font-medium focus:border-[#4F6EF7] outline-none"
              placeholder="e.g. Database Migration"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Task Description</label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 text-sm font-medium focus:border-[#4F6EF7] outline-none"
              placeholder="Task technical details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Status</label>
              <select
                {...register('status', { valueAsNumber: true })}
                className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 text-sm font-bold outline-none appearance-none"
              >
                {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Priority</label>
              <select
                {...register('priority', { valueAsNumber: true })}
                className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 text-sm font-bold outline-none appearance-none"
              >
                <option value={0}>Low</option>
                <option value={1}>Medium</option>
                <option value={2}>High</option>
                <option value={3}>Critical</option>
              </select>
            </div>
          </div>

          <div className="pt-8">
            <button
              type="submit"
              className="w-full rounded-2xl bg-[#4F6EF7] py-5 text-sm font-bold text-white shadow-2xl shadow-[#4F6EF7]/30 hover:bg-[#3B5BDB] transition-all"
            >
              Create Task
            </button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
