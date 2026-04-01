import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
    Plus, Search, Edit2, Trash2, UserPlus, 
    Shield, Eye, EyeOff, Check, X, Filter,
    MoreVertical, Mail, Phone, MapPin, 
    Briefcase, Calendar, ChevronRight,
    ArrowUpRight, Users as UsersIcon, ShieldCheck,
    UserMinus, Zap
} from 'lucide-react';
import Modal from '../../components/ui/Modal';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Edit Mode State
    const [editMode, setEditMode] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        email: '',
        designation: 'Developer',
        department: 'IT',
        phone: '',
        address: '',
        baseSalary: '',
        employeeId: '',
        role: 'employee',
        status: 'active',
        permissions: {
            canAddProducts: false,
            canAddCompanies: false,
            canViewAllTasks: false,
            canAddWorkDetails: true,
            canViewReports: false,
            canAccessResources: false,
            canManagePasswords: false,
            canViewPasswordDetails: false
        }
    });

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/api/users');
            setUsers(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            username: '', password: '', fullName: '', email: '', designation: 'Developer', department: 'IT', phone: '', address: '', baseSalary: '', employeeId: '', role: 'employee', status: 'active',
            permissions: { canAddProducts: false, canAddCompanies: false, canViewAllTasks: false, canAddWorkDetails: true, canViewReports: false, canAccessResources: false, canManagePasswords: false, canViewPasswordDetails: false }
        });
        setEditMode(false);
        setCurrentUserId(null);
        setShowPassword(false);
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleEdit = (user) => {
        setFormData({
            username: user.username || '',
            password: '', // Don't populate password
            fullName: user.fullName || '',
            email: user.email || '',
            designation: user.designation || 'Developer',
            department: user.department || 'IT',
            phone: user.phone || '',
            address: user.address || '',
            baseSalary: user.baseSalary || '',
            employeeId: user.employeeId || '',
            role: user.role || 'employee',
            status: user.status || 'active',
            permissions: {
                canAddProducts: user.permissions?.canAddProducts || false,
                canAddCompanies: user.permissions?.canAddCompanies || false,
                canViewAllTasks: user.permissions?.canViewAllTasks || false,
                canAddWorkDetails: user.permissions?.canAddWorkDetails || true,
                canViewReports: user.permissions?.canViewReports || false,
                canAccessResources: user.permissions?.canAccessResources || false,
                canManagePasswords: user.permissions?.canManagePasswords || false,
                canViewPasswordDetails: user.permissions?.canViewPasswordDetails || false
            }
        });
        setEditMode(true);
        setCurrentUserId(user._id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            await api.delete(`/api/users/${id}`);
            fetchUsers();
        } catch (err) {
            console.error(err);
            alert('Error deleting user');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await api.put(`/api/users/${currentUserId}`, formData);
            } else {
                await api.post('/api/users', {
                    ...formData,
                    joinDate: new Date()
                });
            }
            setIsModalOpen(false);
            fetchUsers();
            resetForm();
        } catch (err) {
            console.error(err);
            alert(editMode ? 'Error updating user' : 'Error creating user');
        }
    };

    const togglePermission = (key) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [key]: !prev.permissions[key]
            }
        }));
    };

    const calculatePasswordStrength = (password) => {
        if (!password) return { score: 0, label: 'None', color: 'bg-gray-700' };
        let score = 0;
        if (password.length > 6) score++;
        if (password.length > 10) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
        if (score <= 4) return { score, label: 'Medium', color: 'bg-yellow-500' };
        return { score, label: 'Strong', color: 'bg-green-500' };
    };

    const passwordStrength = calculatePasswordStrength(formData.password);

    const filteredUsers = Array.isArray(users) ? users.filter(user =>
        (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.employeeId && user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
    ) : [];

    return (
        <div className="space-y-10 pb-20 animate-fade-in">
            {/* Header & Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-4">
                     <h1 className="text-4xl font-black text-white tracking-tighter italic">"Human Capital"</h1>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Resource Infrastructure & Access Control</p>
                     <button
                        onClick={openCreateModal}
                        className="glass-button w-full flex items-center justify-center gap-3 group mt-6"
                    >
                        <UserPlus size={18} className="group-hover:rotate-12 transition-transform" /> Recruit Asset
                    </button>
                </div>
                
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
                     {[
                         { label: 'Total Force', value: users.length, icon: UsersIcon, color: 'text-indigo-500' },
                         { label: 'Active Nodes', value: users.filter(u => u.status === 'active').length, icon: ShieldCheck, color: 'text-emerald-500' },
                         { label: 'Privileged', value: users.filter(u => u.role === 'admin').length, icon: Shield, color: 'text-amber-500' }
                     ].map((stat, i) => (
                         <div key={i} className="glass-card p-6 flex flex-col justify-center">
                             <div className="flex items-center justify-between mb-4">
                                 <stat.icon className={stat.color} size={20} />
                                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Global Index</span>
                             </div>
                             <div className="text-3xl font-black text-white font-mono tracking-tighter">{loading ? '...' : stat.value}</div>
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{stat.label}</p>
                         </div>
                     ))}
                </div>
            </div>

            {/* Filter & Search Terminal */}
            <div className="glass-card p-1 items-center flex flex-col md:flex-row gap-4 bg-white/[0.02]">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search assets by name, username or system ID..."
                        className="glass-input w-full pl-16 bg-transparent border-none focus:ring-0 text-sm font-bold placeholder-slate-700 h-16"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="h-8 w-[1px] bg-white/5 hidden md:block" />
                <button className="flex items-center gap-2 px-8 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                    <Filter size={14} /> Refine Matrix
                </button>
            </div>

            {/* Main User Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center animate-pulse text-slate-600 font-black uppercase tracking-[0.5em]">Scanning Human Nodes...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-600 font-black uppercase tracking-[0.2em] border-2 border-dashed border-white/5 rounded-[3rem]">No Active Signals Found</div>
                ) : filteredUsers.map(user => (
                    <div key={user._id} className="glass-card glass-card-hover group p-1">
                        <div className="p-8 space-y-8 h-full flex flex-col">
                            {/* Top Info */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="relative w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] group-hover:rotate-6 transition-transform duration-500 overflow-hidden shadow-2xl shadow-indigo-500/20">
                                        {user.profilePicture ? (
                                            <img
                                                src={user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:5000${user.profilePicture}`}
                                                alt={user.fullName}
                                                className="w-full h-full object-cover rounded-[1.4rem]"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-slate-900 rounded-[1.4rem] flex items-center justify-center text-xl font-black text-white italic">
                                                {user.fullName?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white italic tracking-tight truncate max-w-[150px]">{user.fullName || 'Unidentified'}</h3>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">@{user.username}</p>
                                    </div>
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                    user.role === 'admin' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                }`}>
                                    {user.role}
                                </div>
                            </div>

                            {/* Center Metrics */}
                            <div className="grid grid-cols-2 gap-6 bg-white/[0.02] p-6 rounded-3xl border border-white/5">
                                <div>
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2 italic"><Briefcase size={10} className="text-slate-700" /> Sector</p>
                                    <p className="text-[11px] font-black text-white uppercase tracking-tight">{user.department} / {user.designation}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2 italic"><Zap size={10} className="text-slate-700" /> Fiscal</p>
                                    <p className="text-[11px] font-black text-emerald-400 font-mono italic">₹ {(user.baseSalary || 0).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Status & ID */}
                            <div className="flex items-center justify-between text-[11px] font-bold">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.05)] ${user.status === 'active' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50 blink-slow'}`} />
                                    <span className={user.status === 'active' ? 'text-emerald-500 font-black uppercase italic' : 'text-rose-500 font-black uppercase italic'}>{user.status}</span>
                                </div>
                                <span className="text-slate-700 font-black uppercase tracking-widest text-[9px]">Node ID: {user.employeeId || '---'}</span>
                            </div>

                            {/* Action Row */}
                            <div className="pt-6 flex gap-3 mt-auto border-t border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                                <button onClick={() => handleEdit(user)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/5 transition-all text-[10px] font-black uppercase tracking-widest group/btn">
                                    <Edit2 size={14} className="group-hover/btn:text-indigo-500 transition-colors" /> Modify Node
                                </button>
                                <button onClick={() => handleDelete(user._id)} className="w-14 items-center justify-center flex py-3 bg-rose-500/5 hover:bg-rose-500/20 text-rose-500 rounded-2xl border border-rose-500/10 transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Redesign (Using global styles) */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editMode ? "Modify Subsystem Node" : "Register Human Asset"}>
                <form onSubmit={handleSubmit} className="space-y-8 p-4">
                    {/* Visual Group: ID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-8 glass-card border-none bg-indigo-500/5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 italic">Username Signal</label>
                            <input required className="glass-input w-full font-black text-sm tracking-tight" placeholder="system_handle" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 italic">Full Identity</label>
                            <input required className="glass-input w-full font-black text-sm tracking-tight" placeholder="Legal Full Name" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                        </div>
                    </div>

                    {/* Visual Group: Auth */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-5 italic">Access Key {editMode && '(Silent Override available)'}</label>
                        <div className="relative group px-4">
                            <input
                                required={!editMode}
                                type={showPassword ? "text" : "password"}
                                className="glass-input w-full pr-14 font-mono font-bold text-sm tracking-widest"
                                placeholder="••••••••••••"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {formData.password && (
                            <div className="px-5 space-y-2">
                                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                                    <span className="text-slate-600 italic">Encryption Strength</span>
                                    <span className={passwordStrength.color.replace('bg-', 'text-')}>{passwordStrength.label}</span>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                     <div className={`h-full transition-all duration-700 ${passwordStrength.color}`} style={{ width: `${(passwordStrength.score / 5) * 100}%` }}></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Visual Group: Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Email Endpoint</label>
                            <input required type="email" className="glass-input w-full font-bold text-sm" placeholder="node@sp-systems.pro" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Sector Role</label>
                            <select className="glass-input w-full bg-slate-900 font-bold text-sm" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })}>
                                <option>Developer</option>
                                <option>Designer</option>
                                <option>Executive</option>
                                <option>Operations</option>
                                <option>Analyst</option>
                            </select>
                        </div>
                    </div>

                    {/* Permissions Toggle Redesign */}
                    {formData.role === 'employee' && (
                        <div className="p-8 glass-card border-none bg-white/[0.01] space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Access Privileges</h4>
                                <Shield size={16} className="text-indigo-500" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.entries({
                                    canAddProducts: 'Inventory Write',
                                    canAddCompanies: 'Network Expansion',
                                    canViewAllTasks: 'Global Task Access',
                                    canAddWorkDetails: 'Log Submission',
                                    canViewReports: 'Analytics Insight',
                                    canAccessResources: 'Asset Access',
                                    canManagePasswords: 'Security Override'
                                }).map(([key, label]) => (
                                    <div 
                                        key={key} 
                                        onClick={() => togglePermission(key)}
                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-500 cursor-pointer ${
                                            formData.permissions[key] 
                                                ? 'bg-indigo-500/10 border-indigo-500/30' 
                                                : 'bg-white/5 border-white/[0.02] hover:border-white/10'
                                        }`}
                                    >
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${formData.permissions[key] ? 'text-white' : 'text-slate-600'}`}>{label}</span>
                                        <div className={`w-8 h-4 rounded-full relative transition-colors duration-500 ${formData.permissions[key] ? 'bg-indigo-500' : 'bg-slate-800'}`}>
                                            <div className={`absolute top-1 left-1 w-2 h-2 rounded-full bg-white transition-transform duration-500 ${formData.permissions[key] ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-6 px-4">
                        <select className="glass-input flex-1 font-black text-xs uppercase tracking-widest" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                            <option value="employee">Level: Staff</option>
                            <option value="admin">Level: Override</option>
                        </select>
                        <select className={`glass-input flex-1 font-black text-xs uppercase tracking-widest ${formData.status === 'active' ? 'text-emerald-400' : 'text-rose-400'}`} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                            <option value="active">Signal: Active</option>
                            <option value="inactive">Signal: Dropped</option>
                        </select>
                    </div>

                    <button type="submit" className="glass-button w-full shadow-indigo-500/40">
                        {editMode ? 'Commit Database Update' : 'Initialize Node Deployment'}
                    </button>
                </form>
            </Modal>

            <style>{`
                .blink-slow {
                    animation: blink 2s infinite;
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            `}</style>
        </div>
    );
};
export default Users;
