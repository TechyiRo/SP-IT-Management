import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Clock, Bell, ArrowRight, Sparkles, Activity, Target, Zap, ChevronRight, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        assignedTasks: 0,
        pendingTasks: 0,
        completedTasks: 0
    });
    const [recentNotifications, setRecentNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Tasks Count
                const tasksRes = await api.get('/api/tasks/me');
                const tasks = tasksRes.data;
                const assigned = tasks.length;
                const completed = tasks.filter(t => t.status === 'Completed').length;
                const pending = assigned - completed;

                setStats({ assignedTasks: assigned, pendingTasks: pending, completedTasks: completed });

                // Fetch Recent Notifications
                const notifRes = await api.get('/api/notifications');
                setRecentNotifications(notifRes.data.slice(0, 5)); // Top 5

                setLoading(false);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return (
        <div className="flex h-full items-center justify-center p-20 animate-pulse">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-cyan-500/30 border-t-cyan-500 animate-spin"></div>
                <div className="text-xl font-medium text-cyan-400 tracking-widest uppercase">Initializing Dashboard</div>
            </div>
        </div>
    );

    const completionRate = stats.assignedTasks > 0 ? Math.round((stats.completedTasks / stats.assignedTasks) * 100) : 0;

    return (
        <div className="space-y-6 md:space-y-8 pb-10 max-w-7xl mx-auto px-2 sm:px-4 md:px-0">
            
            {/* Hero Welcome Unit */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-black/60 backdrop-blur-3xl border border-white/10 p-8 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.5)] group">
                {/* Visual Flares */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple-600/20 transition-all duration-1000 translate-y-1/3 -translate-x-1/3"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="hidden sm:flex w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 p-1 shadow-[0_0_30px_rgba(6,182,212,0.4)] transform hover:scale-105 transition-transform duration-300">
                            <div className="w-full h-full bg-black/40 rounded-xl overflow-hidden flex items-center justify-center backdrop-blur-sm border border-white/10">
                                {user?.profilePicture ? (
                                    <img 
                                        src={user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:5000${user.profilePicture.startsWith('/') ? '' : '/'}${user.profilePicture}`} 
                                        alt={user?.fullName} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null; 
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black text-2xl" style={{ display: user?.profilePicture ? 'none' : 'flex' }}>
                                    {user?.username?.substring(0, 2).toUpperCase() || <Sparkles className="w-10 h-10" />}
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-300 text-xs font-bold uppercase tracking-widest mb-3">
                                <Activity size={12} className="animate-pulse" /> SP IT Portal Active
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-cyan-300 tracking-tight leading-tight">
                                Welcome back, <br className="md:hidden" />{user?.fullName?.split(' ')[0]}!
                            </h1>
                            <p className="mt-2 text-lg text-indigo-200/80 font-medium">Ready to crush your goals today?</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => navigate('/employee/attendance')} className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold flex items-center gap-2 transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            <User size={18} /> View Attendance
                        </button>
                    </div>
                </div>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
                
                {/* Stats Row - Left Side (8 cols) */}
                <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                    
                    {/* Stat Card 1 */}
                    <div onClick={() => navigate('/employee/tasks')} className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-xl border border-white/5 p-8 cursor-pointer group transition-all duration-300 hover:shadow-[0_10px_40px_rgba(168,85,247,0.2)] hover:border-purple-500/30">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] group-hover:bg-purple-500/20 transition-colors"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <p className="text-sm font-bold tracking-widest text-purple-400 uppercase mb-2">Total Tasks</p>
                                <h2 className="text-5xl font-black text-white drop-shadow-lg">{stats.assignedTasks}</h2>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]">
                                <Target className="w-7 h-7" />
                            </div>
                        </div>
                        <div className="mt-8 flex items-center gap-2 text-sm text-gray-400 font-medium">
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /> Click to view absolute assigned workload
                        </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div onClick={() => navigate('/employee/tasks')} className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-xl border border-white/5 p-8 cursor-pointer group transition-all duration-300 hover:shadow-[0_10px_40px_rgba(6,182,212,0.2)] hover:border-cyan-500/30">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] group-hover:bg-cyan-500/20 transition-colors"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <p className="text-sm font-bold tracking-widest text-cyan-400 uppercase mb-2">In Progress</p>
                                <h2 className="text-5xl font-black text-white drop-shadow-lg">{stats.pendingTasks}</h2>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]">
                                <Clock className="w-7 h-7" />
                            </div>
                        </div>
                        <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completion Rate</span>
                            <span className="text-sm font-bold text-cyan-400">{completionRate}%</span>
                        </div>
                        <div className="mt-2 w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-1000" style={{ width: `${completionRate}%` }}></div>
                        </div>
                    </div>

                </div>

                {/* Quick Actions - Right Side (4 cols) */}
                <div className="md:col-span-4 rounded-[2rem] bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl border border-white/5 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                    
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3 tracking-wide">
                        <Zap className="w-5 h-5 text-emerald-400" /> Actions Hub
                    </h3>
                    
                    <div className="flex flex-col gap-4 flex-1 justify-center z-10">
                         <button
                            onClick={() => navigate('/employee/work-log')}
                            className="group relative w-full overflow-hidden rounded-2xl p-[2px] transition-transform hover:scale-[1.02] active:scale-95"
                        >
                            <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-60 group-hover:opacity-100 transition-opacity"></span>
                            <span className="relative flex items-center justify-between bg-black/80 backdrop-blur-md px-6 py-5 rounded-2xl text-white font-bold transition-colors group-hover:bg-black/40">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-emerald-500/20 rounded-xl"><Clock size={20} className="text-emerald-400" /></div>
                                    <span className="text-lg">Log Activity</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>

                        <button
                            onClick={() => navigate('/employee/tasks')}
                            className="group relative w-full overflow-hidden rounded-2xl p-[2px] transition-transform hover:scale-[1.02] active:scale-95"
                        >
                            <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-40 group-hover:opacity-100 transition-opacity"></span>
                            <span className="relative flex items-center justify-between bg-black/80 backdrop-blur-md px-6 py-5 rounded-2xl text-white font-bold transition-colors group-hover:bg-black/40">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-blue-500/20 rounded-xl"><CheckSquare size={20} className="text-blue-400" /></div>
                                    <span className="text-lg">Manage Tasks</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                    </div>
                </div>

                {/* Notifications - Full Width Bottom (12 cols) */}
                <div className="md:col-span-12 rounded-[2.5rem] bg-gradient-to-br from-black/80 via-gray-900/60 to-black/80 backdrop-blur-2xl border border-white/5 p-8 md:p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-3xl max-h-3xl bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>
                    
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                            <span className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner"><Bell className="w-6 h-6 text-cyan-400" /></span> 
                            Recent Transmissions
                        </h3>
                        <div className="text-sm font-semibold text-gray-500 uppercase tracking-widest">{recentNotifications.length} Alerts</div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        {recentNotifications.length === 0 ? (
                            <div className="bg-black/40 border border-white/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
                                <Bell className="w-12 h-12 text-gray-600 mb-4 opacity-50" />
                                <p className="text-xl font-bold text-gray-500">All caught up</p>
                                <p className="text-gray-600 mt-2 font-medium">You have no new notifications.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {recentNotifications.map(notif => (
                                    <div key={notif._id} className="group flex items-start gap-4 p-5 rounded-3xl bg-gradient-to-r from-white/5 to-transparent border border-white/5 hover:border-white/10 transition-colors backdrop-blur-sm">
                                        <div className={`mt-1 flex-shrink-0 w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${notif.read ? 'bg-gray-700 text-gray-700' : 'bg-cyan-400 text-cyan-400 animate-pulse'}`} />
                                        <div className="flex-1">
                                            <p className={`text-base font-medium leading-relaxed ${notif.read ? 'text-gray-400' : 'text-gray-200'}`}>
                                                {notif.message}
                                            </p>
                                            <p className="text-sm font-semibold text-gray-500 mt-3 flex items-center gap-2">
                                                <Clock size={14} /> {new Date(notif.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default EmployeeDashboard;
