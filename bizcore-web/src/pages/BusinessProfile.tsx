import { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { 
  Building2, User, CreditCard, Users, Settings as SettingsIcon, 
  MapPin, Phone, Globe, FileText, CalendarClock, ShieldCheck, 
  Loader2, Mail, BadgeCheck, Briefcase
} from 'lucide-react';
import { format } from 'date-fns';

interface InfoRowProps {
  label: string;
  value: string | number | null | undefined;
  icon?: React.ReactNode;
  isLink?: boolean;
}

const InfoRow = ({ label, value, icon, isLink }: InfoRowProps) => (
  <div className="flex items-start gap-3 py-2.5 group">
    {icon && <div className="mt-0.5 text-slate-400 group-hover:text-indigo-500 transition-colors">{icon}</div>}
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">{label}</p>
      {isLink ? (
        <a href={String(value).startsWith('http') ? String(value) : `https://${value}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 truncate block transition-colors">
          {value || 'N/A'}
        </a>
      ) : (
        <p className="text-sm font-semibold text-slate-700 truncate">{value || 'N/A'}</p>
      )}
    </div>
  </div>
);

const TabButton = ({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
      active 
        ? 'bg-white text-indigo-600 shadow-sm border-slate-200 ring-1 ring-slate-200/50' 
        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
    }`}
  >
    {icon}
    {label}
  </button>
);

export default function BusinessProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'business' | 'owner' | 'banking' | 'staff' | 'settings'>('business');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/business/profile');
      if (response.data.success) {
        setProfile(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load business profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Loading your business profile...</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-xl shadow-indigo-100 ring-4 ring-white">
            <Building2 size={40} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{profile.name}</h1>
              <BadgeCheck className="text-indigo-500 fill-indigo-50" size={24} />
            </div>
            <div className="flex items-center gap-4 text-slate-500">
              <span className="flex items-center gap-1.5 text-sm font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-600">
                <Briefcase size={14} />
                {profile.businessType}
              </span>
              <span className="text-xs font-medium bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
                {profile.status}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl font-bold h-11 px-6 border-slate-200 hover:bg-slate-50">
            Export Profile
          </Button>
          <Button className="rounded-xl font-bold h-11 px-6 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">
            Edit Information
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 p-1.5 bg-slate-100/80 rounded-2xl w-fit border border-slate-200 backdrop-blur-sm">
        <TabButton active={activeTab === 'business'} onClick={() => setActiveTab('business')} label="Business Info" icon={<Building2 size={16} />} />
        <TabButton active={activeTab === 'owner'} onClick={() => setActiveTab('owner')} label="Owner Details" icon={<User size={16} />} />
        <TabButton active={activeTab === 'banking'} onClick={() => setActiveTab('banking')} label="Banking" icon={<CreditCard size={16} />} />
        <TabButton active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} label="Staff" icon={<Users size={16} />} />
        <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="Settings" icon={<SettingsIcon size={16} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Business Info Tab */}
          {activeTab === 'business' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 rounded-3xl border-slate-200 shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-indigo-600">
                    <Building2 size={120} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                    Business Profile
                  </h3>
                  <div className="space-y-1">
                    <InfoRow label="Legal Name" value={profile.legalName || profile.name} icon={<FileText size={14} />} />
                    <InfoRow label="Industry" value={profile.industryCategory} icon={<Globe size={14} />} />
                    <InfoRow label="PAN Number" value={profile.panNumber} icon={<FileText size={14} />} />
                    <InfoRow label="VAT Number" value={profile.vatNumber} icon={<FileText size={14} />} />
                    <InfoRow label="Website" value={profile.website} icon={<Globe size={14} />} isLink={!!profile.website} />
                  </div>
                </Card>

                <Card className="p-6 rounded-3xl border-slate-200 shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-indigo-600">
                    <MapPin size={120} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                    Address & Contact
                  </h3>
                  <div className="space-y-1">
                    <InfoRow label="Street" value={profile.address} icon={<MapPin size={14} />} />
                    <InfoRow label="City" value={profile.city} icon={<MapPin size={14} />} />
                    <InfoRow label="District" value={profile.district} icon={<MapPin size={14} />} />
                    <InfoRow label="Phone" value={profile.phone} icon={<Phone size={14} />} />
                    <InfoRow label="Email" value={profile.email} icon={<Mail size={14} />} />
                  </div>
                </Card>
              </div>

              <Card className="p-6 rounded-3xl border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                  About Business
                </h3>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {profile.description || "No business description provided."}
                </p>
              </Card>
            </div>
          )}

          {/* Owner Tab */}
          {activeTab === 'owner' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <Card className="p-8 rounded-3xl border-slate-200 shadow-sm">
                <div className="flex items-center gap-6 mb-10">
                  <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-4 border-white shadow-lg shadow-slate-100">
                    <User size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 leading-none mb-2">
                      {profile.owner?.title} {profile.owner?.firstName} {profile.owner?.lastName}
                    </h3>
                    <p className="text-indigo-600 font-bold uppercase tracking-widest text-[10px]">Business Owner / {profile.owner?.designation}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pb-2 border-b border-slate-100">Contact Information</h4>
                    <InfoRow label="Personal Email" value={profile.owner?.email} icon={<Mail size={14} />} />
                    <InfoRow label="Alt. Email" value={profile.owner?.alternateEmail} icon={<Mail size={14} />} />
                    <InfoRow label="Phone Number" value={profile.owner?.phoneNumber} icon={<Phone size={14} />} />
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pb-2 border-b border-slate-100">Identity & Bio</h4>
                    <InfoRow label="Citizenship No." value={profile.owner?.citizenshipNumber} icon={<FileText size={14} />} />
                    <InfoRow label="Gender" value={profile.owner?.gender} icon={<User size={14} />} />
                    <InfoRow label="Date of Birth" value={profile.owner?.dateOfBirth ? format(new Date(profile.owner.dateOfBirth), 'PPP') : 'N/A'} icon={<CalendarClock size={14} />} />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Banking Tab */}
          {activeTab === 'banking' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <Card className="p-8 rounded-3xl border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-indigo-600">
                  <CreditCard size={160} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                  Primary Settlement Account
                </h3>
                
                {profile.banking ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div className="p-6 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-700" />
                        <div className="relative z-10 space-y-6">
                          <div className="flex justify-between items-start">
                            <CreditCard size={32} className="text-indigo-400" />
                            <div className="h-8 w-12 bg-white/20 rounded-md backdrop-blur-sm" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/50 mb-1">Account Number</p>
                            <p className="text-xl font-black tracking-widest">{profile.banking.accountNumber}</p>
                          </div>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/50 mb-1">Account Holder</p>
                              <p className="text-sm font-bold truncate max-w-[140px] uppercase tracking-wide">{profile.banking.accountName}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/50 mb-1">Status</p>
                              <div className="flex items-center gap-1.5 text-emerald-400">
                                <ShieldCheck size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1 py-2">
                      <InfoRow label="Bank Name" value={profile.banking.bankName} icon={<Building2 size={14} />} />
                      <InfoRow label="Branch Name" value={profile.banking.branchName} icon={<MapPin size={14} />} />
                      <InfoRow label="Account Type" value="Settlement / Business" icon={<CreditCard size={14} />} />
                      <InfoRow label="Settlement Cycle" value="T+1" icon={<CalendarClock size={14} />} />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                    <CreditCard size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 font-bold">No banking details configured yet.</p>
                    <Button variant="link" className="text-indigo-600 font-bold mt-2">Setup Banking Now</Button>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Staff Tab */}
          {activeTab === 'staff' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <Card className="p-0 rounded-3xl border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                    Staff Members
                  </h3>
                  <span className="text-xs font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-widest">
                    {profile.staffCount} Total
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {profile.staff?.map((member: any) => (
                        <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs">
                                {member.firstName[0]}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{member.firstName} {member.lastName}</p>
                                <p className="text-[10px] text-slate-400 font-bold tracking-wide">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-slate-600">{member.role}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <div className={`h-1.5 w-1.5 rounded-full ${member.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <span className={`text-[10px] font-black uppercase tracking-widest ${member.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {member.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-xs font-bold text-slate-500">{format(new Date(member.createdAt), 'MMM yyyy')}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <Card className="p-8 rounded-3xl border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                  Localization & Defaults
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  <InfoRow label="Default Currency" value={profile.defaultCurrency || 'NPR'} icon={<CreditCard size={14} />} />
                  <InfoRow label="Fiscal Year Start" value={profile.fiscalYearStart || 'Shrawan'} icon={<CalendarClock size={14} />} />
                  <InfoRow label="Date Format" value={profile.dateFormat || 'YYYY-MM-DD'} icon={<CalendarClock size={14} />} />
                  <InfoRow label="Time Zone" value={profile.timeZone || 'Asia/Kathmandu'} icon={<Globe size={14} />} />
                  <InfoRow label="Invoice Prefix" value={profile.invoicePrefix || 'INV'} icon={<FileText size={14} />} />
                  <InfoRow label="Language" value={profile.language || 'English'} icon={<Globe size={14} />} />
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Sidebar / Stats Card */}
        <div className="space-y-6">
          <Card className="p-6 rounded-3xl border-slate-200 shadow-sm bg-indigo-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck size={120} />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-800 rounded-xl">
                  <BadgeCheck size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Subscription</p>
                  <p className="text-xl font-black">Enterprise Plan</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-white/10 text-sm">
                  <span className="text-indigo-200 font-bold">Status</span>
                  <span className="font-black">Lifetime Access</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10 text-sm">
                  <span className="text-indigo-200 font-bold">Next Billing</span>
                  <span className="font-black">N/A</span>
                </div>
                <div className="flex justify-between items-center py-2 text-sm">
                  <span className="text-indigo-200 font-bold">Modules Active</span>
                  <span className="font-black">All Enabled</span>
                </div>
              </div>
              
              <Button variant="secondary" className="w-full rounded-xl font-bold h-11 bg-white text-indigo-900 hover:bg-indigo-50">
                View Billing Portal
              </Button>
            </div>
          </Card>

          <Card className="p-6 rounded-3xl border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600">Total Staff</span>
                <span className="text-sm font-black text-slate-900">{profile.staffCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600">Onboarding Status</span>
                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full">Completed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600">Created At</span>
                <span className="text-sm font-black text-slate-900">{format(new Date(profile.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
