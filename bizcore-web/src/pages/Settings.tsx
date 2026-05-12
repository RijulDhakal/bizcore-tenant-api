import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  User, 
  Lock, 
  Trash2, 
  Check, 
  Sun, 
  Info,
  CreditCard,
  Hash,
  ShieldAlert,
  Edit2,
  Loader2,
  ShieldCheck,
  Moon,
  FileText,
  Users,
  UserPlus,
  Rocket,
  ChevronRight,
  Landmark,
  CalendarClock
} from 'lucide-react';
import { authApi, type ChangePasswordRequest } from '../api/api';
import axiosInstance from '../api/axiosInstance';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { BusinessSetupModal } from '../components/BusinessSetupModal';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { toast } from 'sonner';
import { cn } from '../components/ui/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';


export const Settings = () => {
    const { user, business } = useAuthStore();
    const { theme, setTheme } = useThemeStore();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // UI State
    const [isEditBusinessOpen, setIsEditBusinessOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'business');

    // Form states
    const [invoicePrefix, setInvoicePrefix] = useState(localStorage.getItem('invoicePrefix') || 'INV-');
    const [nextInvoiceNo, setNextInvoiceNo] = useState(localStorage.getItem('nextInvoiceNumber') || '1');
    const [showVatOnInvoice, setShowVatOnInvoice] = useState(localStorage.getItem('showVatOnInvoice') !== 'false');
    const [team, setTeam] = useState<any[]>([]);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);
    
    // Full Profile Data
    const [fullProfile, setFullProfile] = useState<any>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [businessSubTab, setBusinessSubTab] = useState<'overview' | 'owner' | 'banking' | 'settings'>('overview');

    useEffect(() => {
        if (searchParams.get('tab')) {
            setActiveTab(searchParams.get('tab') || 'business');
        }
    }, [searchParams]);

    useEffect(() => {
        if (searchParams.get('action') === 'edit-profile') {
            setIsEditBusinessOpen(true);
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('action');
            setSearchParams(newParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const fetchTeam = async () => {
        try {
            const res = await axiosInstance.get('/admin/team');
            setTeam(res.data?.data ?? []);
        } catch (err) {
            console.error('Failed to fetch team');
        }
    };

    const fetchFullProfile = async () => {
        try {
            setProfileLoading(true);
            const res = await axiosInstance.get('/business/profile');
            setFullProfile(res.data?.data);
        } catch (err) {
            console.error('Failed to fetch full business profile');
        } finally {
            setProfileLoading(false);
        }
    };

    useEffect(() => {
        fetchTeam();
        fetchFullProfile();
    }, []);

    const saveInvoiceSettings = () => {
        localStorage.setItem('invoicePrefix', invoicePrefix);
        localStorage.setItem('nextInvoiceNumber', nextInvoiceNo);
        localStorage.setItem('showVatOnInvoice', String(showVatOnInvoice));
        toast.success('Settings saved locally');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="animate-in slide-in-from-left duration-700">
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">System Configuration</h2>
                    <p className="text-sm text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-2 px-1">Manage global preferences and enterprise status</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="h-9 px-4 border-emerald-500/20 dark:border-emerald-500/10 bg-emerald-500/5 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] uppercase font-bold tracking-[0.2em] shadow-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                        Infrastructure Online
                    </Badge>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => {
                setActiveTab(v);
                setSearchParams({ tab: v });
            }} className="space-y-8">
                <TabsList className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none h-auto grid grid-cols-2 md:grid-cols-5 gap-1">
                    <TabsTrigger value="business" className="rounded-xl py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-md data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400">
                        <Building2 size={14} className="mr-2" /> Business
                    </TabsTrigger>

                    <TabsTrigger value="team" className="rounded-xl py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-md data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400">
                        <Users size={14} className="mr-2" /> Team
                    </TabsTrigger>
                    <TabsTrigger value="invoices" className="rounded-xl py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-md data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400">
                        <FileText size={14} className="mr-2" /> Invoices
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="rounded-xl py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-md data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400">
                        <User size={14} className="mr-2" /> Profile
                    </TabsTrigger>
                </TabsList>

                {/* Business Tab */}
                <TabsContent value="business" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-12 space-y-8">
                            <Card className="overflow-hidden border-none shadow-2xl shadow-indigo-100/50 dark:shadow-none rounded-[2.5rem] dark:bg-slate-900/50 dark:border dark:border-slate-800">
                                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b dark:border-slate-800 p-8 pb-0">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 rounded-2xl bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-sm flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                <Building2 size={24} />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl font-black dark:text-white">{fullProfile?.name || business?.name}</CardTitle>
                                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-1 dark:text-slate-400">Enterprise documentation and registry</CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" className="rounded-lg font-bold text-[10px] uppercase tracking-widest h-9 px-4 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                                                Export Data
                                            </Button>
                                            <Button onClick={() => setIsEditBusinessOpen(true)} className="rounded-lg font-bold text-[10px] uppercase tracking-widest h-9 px-4 shadow-sm">
                                                <Edit2 className="mr-2 h-3.5 w-3.5" /> Modify Profile
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Simplified Sub-tabs (Menu Bar Style) */}
                                    <div className="flex items-center gap-1 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl w-fit mb-8">
                                        {[
                                            { id: 'overview', label: 'Overview' },
                                            { id: 'owner', label: 'Owner Details' },
                                            { id: 'banking', label: 'Banking' },
                                            { id: 'settings', label: 'Localization' }
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setBusinessSubTab(tab.id as any)}
                                                className={cn(
                                                    "px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                                    businessSubTab === tab.id 
                                                        ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm border border-slate-200/50 dark:border-slate-600" 
                                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/30 dark:hover:bg-slate-700/50"
                                                )}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-10 min-h-[400px]">
                                    {profileLoading ? (
                                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                                            <Loader2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Accessing secure registry...</p>
                                        </div>
                                    ) : (
                                        <div className="animate-in fade-in duration-300">
                                            {businessSubTab === 'overview' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                                    <div className="space-y-8">
                                                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Profile Identity</h4>
                                                        <div className="grid grid-cols-1 gap-y-4">
                                                            <DetailItem label="Legal Name" value={fullProfile?.legalName || fullProfile?.name} icon={Building2} />
                                                            <DetailItem label="Industry" value={fullProfile?.industryCategory || 'N/A'} icon={Globe} />
                                                            <DetailItem label="Business Type" value={fullProfile?.businessType} icon={Rocket} />
                                                            <DetailItem label="PAN Number" value={fullProfile?.panNumber} icon={Hash} />
                                                            <DetailItem label="VAT Number" value={fullProfile?.vatNumber || 'N/A'} icon={FileText} />
                                                            <DetailItem label="Website" value={fullProfile?.website || 'N/A'} icon={Globe} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-8">
                                                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Contact & Location</h4>
                                                        <div className="grid grid-cols-1 gap-y-4">
                                                            <DetailItem label="Street" value={fullProfile?.address} icon={MapPin} />
                                                            <DetailItem label="City" value={fullProfile?.city} icon={MapPin} />
                                                            <DetailItem label="District" value={fullProfile?.district} icon={MapPin} />
                                                            <DetailItem label="Phone" value={fullProfile?.phone} icon={Phone} />
                                                            <DetailItem label="Alt. Phone" value={fullProfile?.alternatePhone || 'N/A'} icon={Phone} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {businessSubTab === 'owner' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                                    <div className="space-y-8">
                                                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Owner Identity</h4>
                                                        <div className="grid grid-cols-1 gap-y-4">
                                                            <DetailItem label="Full Name" value={`${fullProfile?.owner?.firstName} ${fullProfile?.owner?.lastName}`} icon={User} />
                                                            <DetailItem label="Designation" value={fullProfile?.owner?.designation || 'Owner'} icon={ShieldCheck} />
                                                            <DetailItem label="Gender" value={fullProfile?.owner?.gender || 'N/A'} icon={User} />
                                                            <DetailItem label="Date of Birth" value={fullProfile?.owner?.dateOfBirth ? new Date(fullProfile.owner.dateOfBirth).toLocaleDateString() : 'N/A'} icon={CalendarClock} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-8">
                                                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Contact & Documentation</h4>
                                                        <div className="grid grid-cols-1 gap-y-4">
                                                            <DetailItem label="Email" value={fullProfile?.owner?.email} icon={Mail} />
                                                            <DetailItem label="Alt. Email" value={fullProfile?.owner?.alternateEmail || 'N/A'} icon={Mail} />
                                                            <DetailItem label="Phone" value={fullProfile?.owner?.phoneNumber} icon={Phone} />
                                                            <DetailItem label="Citizenship" value={fullProfile?.owner?.citizenshipNumber || 'N/A'} icon={FileText} />
                                                            <DetailItem label="Passport" value={fullProfile?.owner?.passportNumber || 'N/A'} icon={FileText} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {businessSubTab === 'banking' && (
                                                <div className="space-y-8">
                                                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Banking Details</h4>
                                                    {fullProfile?.banking ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                                            <DetailItem label="Bank Name" value={fullProfile.banking.bankName} icon={Landmark} />
                                                            <DetailItem label="Branch" value={fullProfile.banking.branchName} icon={MapPin} />
                                                            <DetailItem label="Account Holder" value={fullProfile.banking.accountName} icon={User} />
                                                            <DetailItem label="Account Number" value={fullProfile.banking.accountNumber} icon={Hash} />
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 dark:bg-slate-800/20 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                                            <div className="h-16 w-16 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4">
                                                                <Landmark size={32} />
                                                            </div>
                                                            <p className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">No banking information recorded yet.</p>
                                                            <Button variant="link" className="text-indigo-600 dark:text-indigo-400 font-bold mt-2" onClick={() => setIsEditBusinessOpen(true)}>Configure Now</Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {businessSubTab === 'settings' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                                    <div className="space-y-8">
                                                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">System Defaults</h4>
                                                        <div className="grid grid-cols-1 gap-y-4">
                                                            <DetailItem label="Default Currency" value={fullProfile?.defaultCurrency || 'NPR'} icon={CreditCard} />
                                                            <DetailItem label="Date Format" value={fullProfile?.dateFormat || 'YYYY-MM-DD'} icon={CalendarClock} />
                                                            <DetailItem label="Invoice Prefix" value={fullProfile?.invoicePrefix || 'INV'} icon={FileText} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-8">
                                                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Regional Configuration</h4>
                                                        <div className="grid grid-cols-1 gap-y-4">
                                                            <DetailItem label="Fiscal Year Start" value={fullProfile?.fiscalYearStart || 'Shrawan'} icon={CalendarClock} />
                                                            <DetailItem label="Time Zone" value={fullProfile?.timeZone || 'Asia/Kathmandu'} icon={Globe} />
                                                            <DetailItem label="Preferred Language" value={fullProfile?.language || 'English'} icon={Globe} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden dark:bg-slate-900/50 dark:border dark:border-slate-800">
                                    <CardHeader className="p-8 pb-4 bg-muted/20 dark:bg-slate-800/40">
                                        <CardTitle className="text-lg font-black tracking-tight dark:text-white">Appearance</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-4">
                                        <div className="flex flex-col gap-3">
                                            <button onClick={() => setTheme('light')} className={cn("flex items-center gap-3 p-4 rounded-2xl border-2 transition-all", theme === 'light' ? "border-primary bg-primary/5 dark:bg-indigo-500/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:border-slate-800")}>
                                                <Sun size={18} className={theme === 'light' ? 'text-primary' : 'text-slate-400'} />
                                                <span className="text-xs font-black uppercase tracking-widest flex-1 text-left dark:text-slate-300">Light Theme</span>
                                                {theme === 'light' && <Check size={14} className="text-primary" />}
                                            </button>
                                            <button onClick={() => setTheme('dark')} className={cn("flex items-center gap-3 p-4 rounded-2xl border-2 transition-all", theme === 'dark' ? "border-primary bg-primary/5 dark:bg-indigo-500/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:border-slate-800")}>
                                                <Moon size={18} className={theme === 'dark' ? 'text-primary' : 'text-slate-400'} />
                                                <span className="text-xs font-black uppercase tracking-widest flex-1 text-left dark:text-slate-300">Dark Theme</span>
                                                {theme === 'dark' && <Check size={14} className="text-primary" />}
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-[2.5rem] border-none shadow-xl bg-amber-50 dark:bg-amber-950/20 dark:border dark:border-amber-900/30">
                                    <CardHeader className="p-8 pb-4">
                                        <div className="h-10 w-10 shrink-0 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
                                            <Info size={20} />
                                        </div>
                                        <CardTitle className="text-lg font-black tracking-tight text-amber-900 dark:text-amber-100 leading-relaxed uppercase tracking-tight">Enterprise Compliance</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8 pt-0">
                                        <p className="text-[12px] text-amber-700/80 dark:text-amber-300/60 font-medium leading-relaxed">
                                            Your business profile data is used for invoice generation and regulatory reports. 
                                            The information displayed here is mirrored from the central registry used by auditors and tax authorities.
                                            Keep these records updated to ensure seamless operation.
                                        </p>
                                        <Button variant="outline" className="mt-6 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 bg-white dark:bg-slate-900 hover:bg-white/80 dark:hover:bg-slate-800 rounded-xl font-bold text-xs">
                                            Read More
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </TabsContent>



                {/* Team Tab */}
                <TabsContent value="team" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="md:col-span-2 space-y-6">
                        <Card className="rounded-[2.5rem] border-none shadow-xl dark:bg-slate-900 dark:border dark:border-slate-800">
                            <CardHeader className="p-8 border-b dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex-row items-center justify-between space-y-0">
                                <div>
                                   <CardTitle className="text-xl font-black dark:text-white">Member Registry</CardTitle>
                                   <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-1 dark:text-slate-500">Active users with access to this business</CardDescription>
                                </div>
                                <Button size="sm" onClick={() => setIsInviteOpen(true)} className="rounded-xl h-11 px-6 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none">
                                    <UserPlus className="mr-2 h-4 w-4" /> Add Member
                                </Button>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="space-y-4">
                                    {team.map(member => (
                                        <div key={member.id} className="flex items-center justify-between p-5 border dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all group shadow-sm dark:shadow-none">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-12 w-12 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-sm">
                                                    <AvatarFallback className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase">
                                                        {member.firstName?.[0]}{member.lastName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-black text-sm tracking-tight text-slate-900 dark:text-white uppercase">{member.firstName} {member.lastName}</p>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">{member.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge variant="secondary" className="text-[9px] font-black tracking-widest px-3 py-1 uppercase rounded-lg">
                                                    {getRoleLabel(member.role)}
                                                </Badge>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-9 w-9 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                                    onClick={() => {
                                                        if(confirm(`Remove ${member.firstName}?`)) {
                                                            axiosInstance.delete(`/admin/team/${member.id}`).then(() => fetchTeam());
                                                        }
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                      </div>
                      
                      <div className="space-y-8">
                         <Card className="rounded-[2.5rem] border-none shadow-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white overflow-hidden relative">
                            <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-white/10 rounded-full blur-2xl" />
                            <CardHeader className="p-8 pb-0">
                               <Users size={32} className="text-indigo-200 mb-4" />
                               <CardTitle className="text-xl font-black">Role Controls</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-6">
                               <p className="text-xs font-bold uppercase tracking-widest text-indigo-100 opacity-80 leading-relaxed">
                                  Assign roles to limit access to sensitive financial data. Owners have full control.
                               </p>
                               <div className="mt-8 space-y-3">
                                  {['Manager', 'Accountant', 'Cashier', 'Staff'].map(r => (
                                     <div key={r} className="flex items-center justify-between p-3 rounded-2xl bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest">
                                        {r} <ChevronRight size={12} className="opacity-50" />
                                     </div>
                                  ))}
                               </div>
                            </CardContent>
                         </Card>
                      </div>
                   </div>
                </TabsContent>

                {/* Invoices Tab */}
                <TabsContent value="invoices" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="rounded-[2.5rem] border-none shadow-xl max-w-2xl dark:bg-slate-900 dark:border dark:border-slate-800">
                        <CardHeader className="p-8 border-b dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                            <CardTitle className="text-xl font-black tracking-tight dark:text-white">Invoice Preferences</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-1 text-slate-400 dark:text-slate-500">Global branding and tax display</CardDescription>
                        </CardHeader>
                        <CardContent className="p-10 space-y-8">
                             <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Prefix</Label>
                                    <Input value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} className="h-12 rounded-xl font-bold border-2 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:border-indigo-600 dark:focus:border-indigo-500 transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Next Number</Label>
                                    <Input value={nextInvoiceNo} onChange={(e) => setNextInvoiceNo(e.target.value)} className="h-12 rounded-xl font-bold border-2 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:border-indigo-600 dark:focus:border-indigo-500 transition-all" />
                                </div>
                            </div>
                             <div className="flex items-center items-center gap-4 p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border-2 border-dashed dark:border-slate-800">
                                <div className="flex items-center h-5">
                                    <input type="checkbox" checked={showVatOnInvoice} onChange={(e) => setShowVatOnInvoice(e.target.checked)} className="h-5 w-5 rounded border-slate-300 dark:border-slate-700 dark:bg-slate-900 text-indigo-600 focus:ring-indigo-600" />
                                </div>
                                <div className="flex-1">
                                    <Label className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none">Tax Compliance</Label>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Show VAT columns and tax totals on receipts</p>
                                </div>
                            </div>
                            <Button onClick={saveInvoiceSettings} className="h-14 w-full rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-indigo-100 dark:shadow-none">
                                Update Preferences
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Profile Tab */}
                <TabsContent value="profile" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8">
                            <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden dark:bg-slate-900">
                                <CardHeader className="p-10 bg-gradient-to-br from-slate-900 to-indigo-950 text-white relative">
                                    <div className="absolute top-0 right-0 h-full w-48 bg-white/5 skew-x-[-20deg] translate-x-12" />
                                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                                        <Avatar className="h-32 w-32 rounded-[2rem] border-4 border-white/10 shadow-2xl">
                                            <AvatarFallback className="bg-indigo-500 text-white text-3xl font-black italic">
                                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-center md:text-left">
                                            <h3 className="text-3xl font-black tracking-tight">{user?.firstName} {user?.lastName}</h3>
                                            <p className="text-indigo-300 font-bold uppercase tracking-widest text-[10px] mt-2 flex items-center justify-center md:justify-start gap-2">
                                                <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                                                Authorized {user?.role === 5 ? 'Owner' : 'Executive'}
                                            </p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-10 space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                        <DetailItem label="Full Name" value={`${user?.firstName} ${user?.lastName}`} icon={User} />
                                        <DetailItem label="Login Identity" value={user?.email || ''} icon={Globe} />
                                        <DetailItem label="Permission Tier" value={getRoleLabel(user?.role || 0)} icon={ShieldCheck} />
                                    </div>
                                    
                                     <div className="pt-6 border-t dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase">Credential Security</p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Keep your login information secure and private</p>
                                        </div>
                                        <Button onClick={() => setIsChangePasswordOpen(true)} className="rounded-xl h-12 px-8 font-black text-[10px] uppercase tracking-[0.15em] bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-700">
                                            <Lock className="mr-2 h-4 w-4" /> Reset Password
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        
                        <div className="lg:col-span-4">
                            <Card className="rounded-[2.5rem] border-rose-100 dark:border-rose-900/30 bg-rose-50/10 dark:bg-rose-950/10 overflow-hidden shadow-lg shadow-rose-100/50 dark:shadow-none">
                                <CardHeader className="bg-rose-50/50 dark:bg-rose-950/20 border-b dark:border-rose-900/20 p-8">
                                    <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                                        <ShieldAlert size={20} />
                                        <CardTitle className="text-lg font-black uppercase tracking-tight">Danger Zone</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <p className="text-xs text-rose-700/70 dark:text-rose-400/80 font-medium leading-relaxed">
                                        Permanently delete all business data. This action is irreversible and requires immediate authorization.
                                    </p>
                                    <Button variant="destructive" className="w-full mt-6 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-200" onClick={() => setIsDeleteConfirmOpen(true)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Destroy Workspace Data
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Modals */}
            <ChangePasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} />
            
            {isEditBusinessOpen && (
                <BusinessSetupModal
                    onComplete={() => {
                        setIsEditBusinessOpen(false);
                        queryClient.invalidateQueries({ queryKey: ['my-business'] });
                        toast.success('Enterprise profile successfully updated.');
                    }}
                    isEdit={true}
                    initialData={business}
                />
            )}

            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border-indigo-100">
                                <UserPlus size={28} />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight">Expand Workspace</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Join new team members</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const data = Object.fromEntries(formData);
                        setInviteLoading(true);
                        try {
                            await axiosInstance.post('/admin/team/invite', { ...data, role: parseInt(data.role as string) });
                            toast.success('Invitation sent');
                            setIsInviteOpen(false);
                            fetchTeam();
                        } catch (err) {
                            toast.error('Invitation failed');
                        } finally {
                            setInviteLoading(false);
                        }
                    }} className="space-y-6 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400">First Name</Label>
                                <Input name="firstName" required className="h-12 rounded-xl font-bold border-2 focus:border-indigo-600 transition-all px-4" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400">Last Name</Label>
                                <Input name="lastName" required className="h-12 rounded-xl font-bold border-2 focus:border-indigo-600 transition-all px-4" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400">Email Address</Label>
                            <Input name="email" type="email" required className="h-12 rounded-xl font-bold border-2 focus:border-indigo-600 transition-all px-4" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400">Internal Role</Label>
                            <select name="role" className="w-full h-14 px-4 text-[11px] font-black uppercase tracking-widest bg-slate-50 border-2 rounded-2xl focus:border-indigo-600 transition-all outline-none">
                                <option value="4">Operational Staff</option>
                                <option value="3">Sales Associate</option>
                                <option value="2">Managerial Representative</option>
                                <option value="1">System Administrator</option>
                            </select>
                        </div>
                        <DialogFooter className="pt-6">
                            <Button type="submit" className="w-full h-14 uppercase tracking-[0.2em] font-black text-[11px] rounded-2xl shadow-xl shadow-indigo-100" disabled={inviteLoading}>
                                {inviteLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                Issue Workspace Access
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-black text-2xl text-rose-600 tracking-tight">Confirm Data Destruction</DialogTitle>
                        <DialogDescription className="text-rose-400 font-bold uppercase tracking-widest text-[10px] mt-2">
                            System-wide data removal at {new Date().toLocaleTimeString()}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-8 text-sm text-slate-600 font-medium leading-relaxed">
                        This operation will permanently wipe all transactions, partners, and inventory records from the <span className="font-black text-slate-900 uppercase">'{business?.name}'</span> workspace.
                    </div>
                    <DialogFooter className="gap-3">
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} className="h-12 rounded-xl px-6 font-black uppercase text-[10px] tracking-widest">Abort</Button>
                        <Button variant="destructive" className="h-12 rounded-xl px-10 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-100" onClick={() => setIsDeleteConfirmOpen(false)}>
                            Confirm Wipe
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const DetailItem = ({ label, value, icon: Icon, badge }: { label: string, value: string, icon?: any, badge?: boolean }) => (
    <div className="flex items-center gap-4 group">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all duration-300">
            {Icon && <Icon size={18} />}
        </div>
        <div className="min-w-0">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5 group-hover:text-indigo-400 transition-colors">{label}</span>
            {badge ? (
                <Badge className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border-none font-bold uppercase text-[10px] tracking-widest h-6">
                    {value}
                </Badge>
            ) : (
                <p className="text-sm font-black tracking-tight text-slate-800 dark:text-slate-200 truncate">{value || 'N/A'}</p>
            )}
        </div>
    </div>
);

const ChangePasswordModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = Object.fromEntries(new FormData(e.currentTarget));
        const data: ChangePasswordRequest = {
            currentPassword: String(formData.currentPassword ?? ''),
            newPassword: String(formData.newPassword ?? ''),
            confirmPassword: String(formData.confirmPassword ?? ''),
        };

        if (data.newPassword !== data.confirmPassword) {
            toast.error('Confirmation failed');
            return;
        }

        setLoading(true);
        try {
            await authApi.changePassword(data);
            toast.success('Identity secured');
            onClose();
        } catch (err: any) {
            toast.error('Identity update failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-10">
                <DialogHeader>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Lock size={28} />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black">Secure Account</DialogTitle>
                            <DialogDescription className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Update credential matrix</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Secret</Label>
                        <Input name="currentPassword" type="password" required className="h-12 rounded-xl font-bold border-2 focus:border-indigo-600 transition-all px-4" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Protocol</Label>
                        <Input name="newPassword" type="password" required className="h-12 rounded-xl font-bold border-2 focus:border-indigo-600 transition-all px-4" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirm Protocol</Label>
                        <Input name="confirmPassword" type="password" required className="h-12 rounded-xl font-bold border-2 focus:border-indigo-600 transition-all px-4" />
                    </div>
                    <DialogFooter className="pt-6">
                        <Button type="submit" className="w-full h-14 uppercase tracking-[0.2em] font-black text-[11px] rounded-2xl shadow-xl shadow-indigo-100" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                            Execute Identity Update
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

function getRoleLabel(role: number) {
    switch (role) {
        case 0: return 'SUPERADMIN';
        case 1: return 'ADMINISTRATOR';
        case 2: return 'MANAGER';
        case 3: return 'CASHIER';
        case 4: return 'OPERATIONAL';
        case 5: return 'OWNER';
        default: return 'GUEST';
    }
}
