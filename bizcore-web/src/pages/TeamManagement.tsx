import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '../api/modules.api';
import { toast } from 'sonner';
import {
  UserPlus,
  Shield,
  Trash2,
  Mail,
  ChevronDown,
  Users,
  Search,
  Key,
} from 'lucide-react';

const ROLES = [
  { value: 1, label: 'Admin', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 2, label: 'Accountant', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 3, label: 'Sales', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { value: 4, label: 'POS Operator', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  { value: 5, label: 'Owner', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  { value: 6, label: 'HR Manager', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
];

const getRoleBadge = (roleValue: number) => {
  const role = ROLES.find(r => r.value === roleValue);
  if (!role) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Unknown</span>;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${role.color}`}>{role.label}</span>;
};

export default function TeamManagement() {
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 3, // Default Sales
  });

  const { data: team = [], isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const res = await teamApi.getTeam();
      return res.data?.data || [];
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (data: typeof inviteForm) => teamApi.invite(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      setShowInvite(false);
      setInviteForm({ email: '', firstName: '', lastName: '', role: 3 });

      const tempPass = res.data?.tempPassword;
      if (tempPass) {
        toast.success(`User invited! Temporary password: ${tempPass}`);
      } else {
        toast.success('User invited successfully');
      }
    },
    onError: () => toast.error('Failed to invite user'),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: number }) =>
      teamApi.updateRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success('Role updated');
    },
    onError: () => toast.error('Failed to update role'),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => teamApi.remove(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success('Team member removed');
    },
    onError: () => toast.error('Failed to remove team member'),
  });

  const resetMutation = useMutation({
    mutationFn: (userId: string) => teamApi.resetPassword(userId),
    onSuccess: (res) => {
      const pass = res.data?.tempPassword;
      if (pass) {
        toast.success(`Password reset! New temp password: ${pass}`, {
          duration: 10000,
          description: 'Please copy this password and share it with the user.'
        });
      } else {
        toast.success('Password reset successfully');
      }
    },
    onError: () => toast.error('Failed to reset password'),
  });

  const filteredTeam = team.filter((member: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      member.email?.toLowerCase().includes(q) ||
      member.fullName?.toLowerCase().includes(q) ||
      member.firstName?.toLowerCase().includes(q) ||
      member.lastName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your team members and their roles
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search team members..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Team List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading team...</div>
      ) : filteredTeam.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? 'No matching team members' : 'No team members yet. Invite someone to get started!'}
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Member</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Email</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Role</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Joined</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeam.map((member: any) => (
                <tr key={member.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {(member.firstName?.[0] || member.email[0]).toUpperCase()}
                        {(member.lastName?.[0] || '').toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">
                        {member.fullName || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'User'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{member.email}</td>
                  <td className="px-4 py-3">
                    <div className="relative inline-block">
                      <select
                        value={member.role}
                        onChange={e => updateRoleMutation.mutate({ userId: member.id, role: Number(e.target.value) })}
                        className="appearance-none bg-transparent pr-6 text-sm cursor-pointer focus:outline-none"
                      >
                        {ROLES.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                    </div>
                    <div className="mt-1">{getRoleBadge(member.role)}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => {
                          if (confirm('Reset password for this team member? The user will be forced to change it on next login.')) {
                            resetMutation.mutate(member.id);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-600 transition-colors"
                        title="Reset Password"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Remove this team member?')) {
                            removeMutation.mutate(member.id);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Invite Team Member
              </h3>
              <button
                onClick={() => setShowInvite(false)}
                className="text-muted-foreground hover:text-foreground transition-colors text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Email *</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="team@company.com"
                    className="w-full pl-9 pr-4 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <input
                    type="text"
                    value={inviteForm.firstName}
                    onChange={e => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                    placeholder="John"
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <input
                    type="text"
                    value={inviteForm.lastName}
                    onChange={e => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                    placeholder="Doe"
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={e => setInviteForm({ ...inviteForm, role: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {ROLES.filter(r => r.value !== 5).map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowInvite(false)}
                className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => inviteMutation.mutate(inviteForm)}
                disabled={!inviteForm.email || inviteMutation.isPending}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {inviteMutation.isPending ? 'Inviting...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
