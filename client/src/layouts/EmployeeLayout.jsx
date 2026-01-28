import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, UserCheck, CheckSquare, FileText, Package } from 'lucide-react';
import clsx from 'clsx';
import Notifications from '../components/ui/Notifications';

const EmployeeLayout = () => {
    const { logout, user } = useAuth();
    const location = useLocation();

    const menuItems = [
        { path: '/employee', icon: Home, label: 'Dashboard' },
        { path: '/employee/attendance', icon: UserCheck, label: 'Attendance' },
        { path: '/employee/tasks', icon: CheckSquare, label: 'Tasks' },
        { path: '/employee/work-log', icon: FileText, label: 'Work Log' },
        { path: '/employee/resources', icon: Package, label: 'Resources' },
    ];

    return (
        <div className="min-h-screen pb-24 md:pb-0 flex flex-col md:flex-row">
            {/* Desktop Sidebar (visible on md+) */}
            <aside className="hidden md:flex flex-col w-64 glass-card m-4 mr-0 rounded-2xl sticky top-4 h-[calc(100vh-2rem)]">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="SP IT Logo" className="w-10 h-10 object-contain" />
                        <span className="font-bold text-lg tracking-wide text-white">SP IT</span>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                                    isActive ? "bg-primary/20 text-white shadow-lg border border-white/10" : "text-gray-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <Icon className={clsx("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-cyan-400" : "text-gray-400 group-hover:text-cyan-400")} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                            {user?.username?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.designation}</p>
                        </div>
                        <Notifications />
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-card m-0 rounded-b-none rounded-t-2xl z-50 flex justify-around p-4 border-t border-white/10">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                "flex flex-col items-center gap-1 transition-colors",
                                isActive ? "text-cyan-400" : "text-gray-500"
                            )}
                        >
                            <Icon className={clsx("w-6 h-6", isActive && "animate-bounce")} />
                            <span className="text-[10px]">{item.label}</span>
                        </Link>
                    );
                })}
                <button onClick={logout} className="flex flex-col items-center gap-1 text-red-400">
                    <LogOut className="w-6 h-6" />
                    <span className="text-[10px]">Logout</span>
                </button>
            </nav>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="glass-card min-h-full p-6 animate-fade-in-up">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default EmployeeLayout;
