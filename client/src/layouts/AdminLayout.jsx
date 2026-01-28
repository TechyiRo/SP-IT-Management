import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, UserCheck, CheckSquare, Package, Building2, FileText, LogOut } from 'lucide-react';
import clsx from 'clsx';

const AdminLayout = () => {
    const { logout, user } = useAuth();
    const location = useLocation();

    const menuItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/users', icon: Users, label: 'User Management' },
        { path: '/admin/attendance', icon: UserCheck, label: 'Attendance' },
        { path: '/admin/tasks', icon: CheckSquare, label: 'Task Management' },
        { path: '/admin/products', icon: Package, label: 'Products' },
        { path: '/admin/companies', icon: Building2, label: 'Companies' },
        { path: '/admin/work-details', icon: FileText, label: 'Work Details' },
    ];

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 glass-card m-4 mr-0 rounded-2xl flex flex-col relative z-20">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="SP IT Logo" className="w-10 h-10 object-contain" />
                            <span className="font-bold text-lg tracking-wide">SP IT</span>
                        </div>
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
                    <div className="glass-card bg-black/20 p-4 rounded-xl mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                                {user?.username?.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user?.fullName}</p>
                                <p className="text-xs text-gray-400 truncate">{user?.designation}</p>
                            </div>
                        </div>
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

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                <div className="glass-card min-h-full p-6 relative z-10 animate-fade-in-up">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
