import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, UserCheck, CheckSquare, FileText, Package, IndianRupee, MapPin, Palette, Key, MoreHorizontal, X } from 'lucide-react';
import clsx from 'clsx';
import Notifications from '../components/ui/Notifications';
import { useState, useEffect } from 'react';
import EmployeeProfileModal from '../components/profile/EmployeeProfileModal';
import ThemeSelectionModal from '../components/ui/ThemeSelectionModal';
import api, { BASE_URL } from '../api/axios';

const EmployeeLayout = () => {
    const { logout, user } = useAuth();
    const location = useLocation();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [gpsStatus, setGpsStatus] = useState('initializing');
    const [gpsErrorMsg, setGpsErrorMsg] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Theme State
    const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('mobileTheme') || 'vibrant');
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

    const handleThemeSelect = (themeId) => {
        setCurrentTheme(themeId);
        localStorage.setItem('mobileTheme', themeId);
    };

    const getThemeStyles = () => {
        switch (currentTheme) {
            case 'minimal': return { bg: 'bg-minimal-dark', card: 'glass-card-minimal', text: 'text-white' };
            case 'soft': return { bg: 'bg-soft-light', card: 'glass-card-soft', text: 'text-slate-900' };
            case 'cyberpunk': return { bg: 'bg-cyberpunk', card: 'glass-card-cyberpunk', text: 'text-white' };
            case 'midnight': return { bg: 'bg-midnight', card: 'glass-card-midnight', text: 'text-blue-100' };
            case 'forest': return { bg: 'bg-forest', card: 'glass-card-forest', text: 'text-emerald-100' };
            case 'sunset': return { bg: 'bg-sunset', card: 'glass-card-sunset', text: 'text-orange-100' };
            default: return { bg: 'bg-vibrant-gradient', card: 'glass-card-mobile', text: 'text-white' };
        }
    };
    const themeParams = getThemeStyles();

    // Live Location Heartbeat
    useEffect(() => {
        const updateLocation = () => {
            if (!navigator.geolocation) {
                setGpsStatus('error');
                setGpsErrorMsg('Geolocation not supported.');
                return;
            }
            setGpsStatus('syncing');
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    let address = 'Unknown Location';
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const data = await res.json();
                        address = data.display_name || 'Map Location';
                    } catch (e) { console.error('Geocode failed', e); }
                    await api.put('/api/users/live-location', { latitude, longitude, address });
                    setGpsStatus('active');
                    setGpsErrorMsg('');
                } catch (err) {
                    const serverMsg = err.response?.data?.error || err.message || 'Unknown Error';
                    setGpsStatus('server-error');
                    setGpsErrorMsg(serverMsg);
                }
            }, (err) => {
                setGpsStatus('error');
                setGpsErrorMsg(err.message || 'Location access denied.');
            }, { enableHighAccuracy: true });
        };

        if (user && user.role === 'employee') {
            updateLocation();
            const interval = setInterval(updateLocation, 15 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // Close mobile menu on navigation
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // All menu items
    const allMenuItems = [
        { path: '/employee', icon: Home, label: 'Home' },
        { path: '/employee/attendance', icon: UserCheck, label: 'Attendance' },
        { path: '/employee/tasks', icon: CheckSquare, label: 'Tasks' },
        { path: '/employee/work-log', icon: FileText, label: 'Work Log' },
        ...(user?.permissions?.canManagePasswords ? [{ path: '/employee/password-manager', icon: Key, label: 'Passwords' }] : []),
        ...(user?.permissions?.canAccessResources ? [{ path: '/employee/resources', icon: Package, label: 'Resources' }] : []),
        { path: '/employee/salary', icon: IndianRupee, label: 'Salary' },
    ];

    // Mobile: show only first 4 items in bottom bar, rest in "More" menu
    const mobileMainItems = allMenuItems.slice(0, 4);
    const mobileMoreItems = allMenuItems.slice(4);

    return (
        <div className={`flex h-screen overflow-hidden ${themeParams.bg}`}>
            {/* ═══════════════════════════════════════════
                DESKTOP SIDEBAR (md+)
            ═══════════════════════════════════════════ */}
            <aside className={`fixed md:relative inset-y-0 left-0 z-50 w-64 ${themeParams.card} m-0 md:m-4 md:mr-0 rounded-none md:rounded-2xl hidden md:flex flex-col transition-transform duration-300 ease-in-out`}>
                <div className="p-6 border-b border-white/10 flex items-center gap-3">
                    <img src="/logo.png" alt="SP IT Logo" className="w-10 h-10 object-contain" />
                    <span className={`font-bold text-lg tracking-wide ${themeParams.text}`}>SP IT</span>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    {allMenuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                                    isActive
                                        ? (currentTheme === 'soft' ? "bg-white border border-slate-200 shadow-sm text-cyan-600" : "bg-primary/20 text-white shadow-lg border border-white/10")
                                        : (currentTheme === 'soft' ? "text-slate-500 hover:bg-slate-100" : "text-gray-400 hover:bg-white/5 hover:text-white")
                                )}
                            >
                                <Icon className={clsx("w-5 h-5 transition-transform group-hover:scale-110",
                                    isActive ? "text-cyan-400" : (currentTheme === 'soft' ? "text-slate-400 group-hover:text-cyan-600" : "text-gray-400 group-hover:text-cyan-400")
                                )} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10 space-y-4">
                    <button
                        onClick={() => setIsThemeModalOpen(true)}
                        className={clsx(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group border",
                            currentTheme === 'soft' ? "border-slate-200 hover:bg-slate-100 text-slate-700" : "border-white/10 hover:bg-white/5 text-gray-300 hover:text-white"
                        )}
                    >
                        <Palette className="w-5 h-5" />
                        <span className="text-sm font-medium">Change Theme</span>
                    </button>

                    {/* GPS Desktop */}
                    <div className="flex flex-col gap-1">
                        <div className={`text-xs flex items-center gap-2 justify-center py-1 rounded border ${
                            gpsStatus === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            gpsStatus === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            gpsStatus === 'server-error' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }`}>
                            <div className={`w-2 h-2 rounded-full ${gpsStatus === 'active' ? 'bg-green-500 animate-pulse' : gpsStatus.includes('error') ? 'bg-red-500' : 'bg-yellow-500 animate-ping'}`}></div>
                            {gpsStatus === 'active' ? 'GPS Active' : gpsStatus === 'error' ? 'GPS Denied' : gpsStatus === 'server-error' ? 'Server Error' : 'Syncing...'}
                        </div>
                    </div>

                    <div className={`p-4 rounded-xl cursor-pointer transition-colors ${currentTheme === 'soft' ? 'hover:bg-slate-100' : 'hover:bg-white/5'}`} onClick={() => setIsProfileOpen(true)}>
                        <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white overflow-hidden shadow-md border-2 border-white/10 shrink-0">
                                {user?.profilePicture ? (
                                    <img 
                                        src={user.profilePicture.startsWith('http') ? user.profilePicture : `${BASE_URL}${user.profilePicture.startsWith('/') ? '' : '/'}${user.profilePicture}`} 
                                        alt={user?.username} 
                                        className="w-full h-full object-cover absolute inset-0 z-10"
                                        onError={(e) => { e.target.style.display='none'; }}
                                    />
                                ) : null}
                                <span className="relative z-0">{user?.username?.substring(0, 2).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${themeParams.text}`}>{user?.fullName}</p>
                                <p className="text-xs text-gray-400 truncate">{user?.designation}</p>
                            </div>
                            <Notifications />
                        </div>
                    </div>
                    <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* ═══════════════════════════════════════════
                MOBILE TOP BAR
            ═══════════════════════════════════════════ */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 mobile-top-bar">
                <div className="px-4 py-3 flex justify-between items-center">
                    {/* Left: Avatar + Name */}
                    <div className="flex items-center gap-2.5" onClick={() => setIsProfileOpen(true)}>
                        <div className="relative w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold shadow-lg text-white overflow-hidden border-2 border-white/20 shrink-0">
                            {user?.profilePicture ? (
                                <img 
                                    src={user.profilePicture.startsWith('http') ? user.profilePicture : `${BASE_URL}${user.profilePicture.startsWith('/') ? '' : '/'}${user.profilePicture}`} 
                                    alt={user?.username} 
                                    className="w-full h-full object-cover absolute inset-0 z-10"
                                    onError={(e) => { e.target.style.display='none'; }}
                                />
                            ) : null}
                            <span className="relative z-0">{user?.username?.substring(0, 2).toUpperCase()}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm text-white leading-tight">Hi, {user?.fullName?.split(' ')[0]} 👋</span>
                            <span className="text-[10px] text-gray-500 font-medium leading-tight">{user?.designation || 'Employee'}</span>
                        </div>
                    </div>

                    {/* Right: Status chips */}
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsThemeModalOpen(true)} className="mobile-top-chip">
                            <Palette size={14} className="text-gray-400" />
                        </button>
                        <div className="mobile-top-chip">
                            <div className={`w-1.5 h-1.5 rounded-full ${gpsStatus === 'active' ? 'bg-green-400' : gpsStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'}`}></div>
                            <span className="text-[10px] font-bold text-gray-400">{gpsStatus === 'active' ? 'GPS' : '...'}</span>
                        </div>
                        <Notifications />
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════
                MOBILE BOTTOM NAVIGATION — Fixed, 5 items max
            ═══════════════════════════════════════════ */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
                <div className="mobile-bottom-nav">
                    {mobileMainItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "mobile-nav-item",
                                    isActive && "active"
                                )}
                            >
                                <div className="nav-icon">
                                    <Icon size={20} className={clsx(
                                        isActive ? "text-indigo-400" : "text-gray-500"
                                    )} />
                                </div>
                                <span className={clsx(
                                    "mobile-nav-label",
                                    isActive ? "text-indigo-400" : "text-gray-600"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* More Button — opens overlay with remaining items */}
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className={clsx(
                            "mobile-nav-item",
                            isMobileMenuOpen && "active"
                        )}
                    >
                        <div className="nav-icon">
                            <MoreHorizontal size={20} className="text-gray-500" />
                        </div>
                        <span className="mobile-nav-label text-gray-600">More</span>
                    </button>
                </div>
            </nav>

            {/* ═══════════════════════════════════════════
                MOBILE "MORE" MENU — Slide-up Sheet
            ═══════════════════════════════════════════ */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[60]" onClick={() => setIsMobileMenuOpen(false)}>
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
                    
                    {/* Sheet */}
                    <div 
                        className="absolute bottom-0 left-0 right-0 bg-[#0c0c10] border-t border-white/10 rounded-t-3xl overflow-hidden animate-fade-in-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Handle Bar */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-gray-700 rounded-full"></div>
                        </div>

                        {/* Header */}
                        <div className="flex justify-between items-center px-5 py-3">
                            <h3 className="text-base font-black text-white">More Options</h3>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Menu Items */}
                        <div className="px-4 pb-2 space-y-1.5">
                            {mobileMoreItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={clsx(
                                            "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all",
                                            isActive ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20" : "text-gray-400 hover:bg-white/5 border border-transparent"
                                        )}
                                    >
                                        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", isActive ? "bg-indigo-500/20" : "bg-white/5")}>
                                            <Icon size={18} />
                                        </div>
                                        <span className="font-bold text-sm">{item.label}</span>
                                    </Link>
                                );
                            })}

                            {/* Salary always in more */}
                            {!mobileMoreItems.find(i => i.path === '/employee/salary') && (
                                <Link
                                    to="/employee/salary"
                                    className={clsx(
                                        "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all",
                                        location.pathname === '/employee/salary' ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20" : "text-gray-400 hover:bg-white/5 border border-transparent"
                                    )}
                                >
                                    <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", location.pathname === '/employee/salary' ? "bg-indigo-500/20" : "bg-white/5")}>
                                        <IndianRupee size={18} />
                                    </div>
                                    <span className="font-bold text-sm">My Salary</span>
                                </Link>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="px-4 pb-4 pt-2 space-y-2 border-t border-white/5 mt-2">
                            <button
                                onClick={() => { setIsThemeModalOpen(true); setIsMobileMenuOpen(false); }}
                                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-400 hover:bg-white/5 transition-all"
                            >
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                    <Palette size={18} />
                                </div>
                                <span className="font-bold text-sm">Change Theme</span>
                            </button>
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                            >
                                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                    <LogOut size={18} />
                                </div>
                                <span className="font-bold text-sm">Sign Out</span>
                            </button>
                        </div>

                        {/* Safe area spacer */}
                        <div className="h-[env(safe-area-inset-bottom,0px)]"></div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════
                MAIN CONTENT
            ═══════════════════════════════════════════ */}
            <main className="flex-1 overflow-y-auto pb-20 md:pb-4 pt-16 md:pt-4 px-0 md:p-4">
                <div className="min-h-full animate-fade-in-up transition-colors duration-500">
                    <Outlet context={{ currentTheme }} />
                </div>
            </main>

            <EmployeeProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
            <ThemeSelectionModal
                isOpen={isThemeModalOpen}
                onClose={() => setIsThemeModalOpen(false)}
                currentTheme={currentTheme}
                onSelectTheme={handleThemeSelect}
            />

            {/* Location Permission Modal */}
            {gpsStatus === 'error' && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="glass-card p-8 max-w-md w-full text-center space-y-6 border-red-500/30">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-400">
                            <MapPin size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Location Access Required</h2>
                            <p className="text-gray-300">
                                To proceed, you must allow location access. This is required for work tracking and attendance.
                            </p>
                            <p className="text-sm text-gray-500 mt-4">
                                Please check your browser address bar and set Location to <strong>Allow</strong>. Then refresh.
                            </p>
                        </div>
                        <button onClick={() => window.location.reload()} className="glass-button w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/50">
                            I have enabled it, Refresh Page
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeLayout;
