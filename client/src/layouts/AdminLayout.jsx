import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    LayoutDashboard, Users, UserCheck, CheckSquare, Package, 
    Building2, FileText, LogOut, Menu, X, Warehouse, 
    Truck, IndianRupee, Activity, MapPin, Palette, Key,
    Shield, Bell, ChevronRight, Settings, ExternalLink,
    Zap, Globe, Cpu
} from 'lucide-react';
import clsx from 'clsx';
import ThemeSelectionModal, { ADMIN_THEMES } from '../components/ui/ThemeSelectionModal';

const AdminLayout = () => {
    const { logout, user } = useAuth();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Admin Theme State
    const [adminTheme, setAdminTheme] = useState(localStorage.getItem('adminTheme') || 'neon');
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleThemeSelect = (themeId) => {
        setAdminTheme(themeId);
        localStorage.setItem('adminTheme', themeId);
    };

    const getThemeStyles = () => {
        switch (adminTheme) {
            case 'royal': return { bg: 'bg-admin-royal', card: 'card-admin-royal', text: 'text-white', accent: 'text-amber-400', border: 'border-amber-500/10' };
            case 'hud': return { bg: 'bg-admin-hud', card: 'card-admin-hud', text: 'text-cyan-50', accent: 'text-cyan-400', border: 'border-cyan-500/20' };
            case 'mars': return { bg: 'bg-admin-mars', card: 'card-admin-mars', text: 'text-orange-50', accent: 'text-orange-500', border: 'border-orange-500/20' };
            default: return { bg: 'bg-admin-neon', card: 'card-admin-neon', text: 'text-white', accent: 'text-fuchsia-400', border: 'border-fuchsia-500/20' };
        }
    };

    const themeParams = getThemeStyles();

    const menuItems = [
        { group: 'Core', items: [
            { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/admin/users', icon: Users, label: 'Resources' },
        ]},
        { group: 'Operations', items: [
            { path: '/admin/attendance', icon: UserCheck, label: 'Attendance' },
            { path: '/admin/tasks', icon: CheckSquare, label: 'Task Console' },
            { path: '/admin/payroll', icon: IndianRupee, label: 'Payroll' },
        ]},
        { group: 'Logistics', items: [
            { path: '/admin/resources', icon: Package, label: 'Inventory' },
            { path: '/admin/tracking', icon: Activity, label: 'Tracking' },
            { path: '/admin/live-tracking', icon: MapPin, label: 'Geofencing' },
        ]},
        { group: 'Secure', items: [
            { path: '/admin/password-manager', icon: Key, label: 'Key Vault' },
            { path: '/admin/work-details', icon: FileText, label: 'Archive' },
        ]}
    ];

    return (
        <div className={`min-h-screen flex ${themeParams.bg} font-sans transition-colors duration-700`}>
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 blur-[120px] rounded-full"></div>
            </div>

            {/* Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-50 w-72 flex flex-col transition-all duration-500 ease-in-out border-r border-white-[0.03] bg-black/40 backdrop-blur-3xl",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                {/* Brand Logo Area */}
                <div className="p-8 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 group">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-indigo-500/50 transition-all duration-500 shadow-inner group-hover:shadow-indigo-500/20">
                            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tighter text-white">SP <span className="text-indigo-500">SYSTEMS</span></h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Admin Console v2.0</p>
                        </div>
                    </div>
                </div>

                {/* Nav Menu */}
                <nav className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar space-y-8">
                    {menuItems.map((group, idx) => (
                        <div key={idx} className="space-y-3">
                            <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-4">{group.group}</h3>
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={clsx(
                                            "flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-500 group relative overflow-hidden",
                                            isActive 
                                                ? "bg-white/5 text-white border border-white/5 shadow-[0_0_20px_rgba(255,255,255,0.02)]" 
                                                : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                                        )}
                                    >
                                        <div className="flex items-center gap-4 relative z-10">
                                            <Icon className={clsx("w-5 h-5 transition-all duration-500",
                                                isActive ? "text-indigo-500 scale-110 shrink-0" : "group-hover:text-indigo-400 shrink-0"
                                            )} />
                                            <span className="text-sm font-bold tracking-tight">{item.label}</span>
                                        </div>
                                        {isActive && <ChevronRight size={14} className="text-indigo-500 animate-pulse" />}
                                        <div className={clsx(
                                            "absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent transition-opacity duration-700 opacity-0 group-hover:opacity-100",
                                            isActive && "opacity-100"
                                        )}></div>
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* Footer User Info */}
                <div className="p-6 border-t border-white/5 space-y-4">
                    <div className="glass-card bg-white/[0.02] p-4 rounded-3xl border-white/5 group hover:border-indigo-500/20 transition-all duration-500">
                        <div className="flex items-center gap-4">
                            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] shadow-lg shadow-indigo-500/20 overflow-hidden">
                                {user?.profilePicture ? (
                                    <img 
                                        src={user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:5000${user.profilePicture.startsWith('/') ? '' : '/'}${user.profilePicture}`} 
                                        alt={user?.username} 
                                        className="w-full h-full object-cover rounded-2xl relative z-10"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-900 flex items-center justify-center rounded-2xl text-white font-black text-sm">
                                        {user?.username?.substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-white truncate">{user?.fullName}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active session</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                         <button onClick={() => setIsThemeModalOpen(true)} className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5">
                            <Palette size={16} />
                         </button>
                         <button onClick={logout} className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-500/5 hover:bg-rose-500/20 text-rose-500 transition-all border border-rose-500/10 font-bold text-xs">
                            <LogOut size={16} />
                         </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 lg:ml-72 flex flex-col min-h-screen relative p-4 lg:p-8">
                {/* Floating Topbar */}
                <header className={clsx(
                    "sticky top-0 z-40 mb-12 flex items-center justify-between p-6 px-8 rounded-3xl transition-all duration-700",
                    scrolled ? "bg-black/60 backdrop-blur-3xl shadow-2xl border border-white/5" : "bg-transparent"
                )}>
                    <div className="flex items-center gap-6">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-white/5 rounded-2xl border border-white/5">
                            <Menu size={20} className="text-white" />
                        </button>
                        <div className="hidden sm:block">
                             <h1 className="text-2xl font-black text-white tracking-tighter">
                                {location.pathname === '/admin' ? 'Strategic Overview' : 
                                 location.pathname.split('/').pop().charAt(0).toUpperCase() + location.pathname.split('/').pop().slice(1)}
                             </h1>
                             <div className="flex items-center gap-4 mt-1">
                                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                     <Globe size={10} className="text-indigo-500" /> Multi-region Active
                                 </span>
                                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                     <Shield size={10} className="text-emerald-500" /> End-to-End Encryption
                                 </span>
                             </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex items-center gap-3 mr-4">
                             <div className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer relative">
                                <Bell size={18} className="text-white" />
                                <div className="absolute top-3 right-3 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#050505]"></div>
                             </div>
                             <div className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                                <Settings size={18} className="text-white" />
                             </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl shadow-inner hidden md:flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Performance index</span>
                            <div className="flex items-center gap-2 text-white font-mono font-bold text-sm">
                                <Zap size={14} className="text-amber-400 fill-amber-400" /> 99.8% Efficiency
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Render Slot */}
                <div className="flex-1 animate-fade-in transition-all">
                    <Outlet context={{ adminTheme, themeParams }} />
                </div>
            </main>

            {/* Modals & Overlays */}
            <ThemeSelectionModal
                isOpen={isThemeModalOpen}
                onClose={() => setIsThemeModalOpen(false)}
                currentTheme={adminTheme}
                onSelectTheme={handleThemeSelect}
                themes={ADMIN_THEMES}
            />

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[45] lg:hidden animate-fade-in" onClick={() => setIsSidebarOpen(false)}></div>
            )}
        </div>
    );
};

export default AdminLayout;
