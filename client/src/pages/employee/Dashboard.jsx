import { useState, useEffect, useMemo } from 'react';
import api, { BASE_URL } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { 
    CheckSquare, Clock, Bell, ArrowRight, Activity, Target, Zap, 
    ChevronRight, UserCheck, FileText, TrendingUp, Calendar,
    Star, Flame, Award, Coffee, Briefcase, IndianRupee
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ assignedTasks: 0, pendingTasks: 0, completedTasks: 0 });
    const [recentNotifications, setRecentNotifications] = useState([]);
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [recentTasks, setRecentTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tasksRes, notifRes, attendanceRes] = await Promise.all([
                    api.get('/api/tasks/me'),
                    api.get('/api/notifications'),
                    api.get('/api/attendance/me'),
                ]);

                const tasks = tasksRes.data;
                const assigned = tasks.length;
                const completed = tasks.filter(t => t.status === 'Completed').length;
                const pending = assigned - completed;

                setStats({ assignedTasks: assigned, pendingTasks: pending, completedTasks: completed });
                setRecentNotifications(notifRes.data.slice(0, 5));
                setRecentTasks(tasks.slice(0, 3));
                setAttendanceHistory(attendanceRes.data);

                const today = new Date().toDateString();
                const todayRec = attendanceRes.data.find(a => new Date(a.date).toDateString() === today);
                setTodayAttendance(todayRec || null);
            } catch (err) {
                console.error('Dashboard fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const completionRate = stats.assignedTasks > 0 ? Math.round((stats.completedTasks / stats.assignedTasks) * 100) : 0;

    // Greeting based on time
    const greeting = useMemo(() => {
        const h = currentTime.getHours();
        if (h < 12) return { text: 'Good Morning', emoji: '☀️' };
        if (h < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
        return { text: 'Good Evening', emoji: '🌙' };
    }, [currentTime]);

    // Today's attendance status
    const getAttendanceStatus = () => {
        if (!todayAttendance) return { text: 'Not Checked In', emoji: '💤', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' };
        const { checkIn, checkOut, status } = todayAttendance;
        if (checkIn?.status === 'Approved' && !checkOut?.time) return { text: 'On Duty', emoji: '💼', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
        if (checkOut?.status === 'Approved') return { text: status || 'Checked Out', emoji: '✅', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
        if (checkIn?.status === 'Pending') return { text: 'Pending Approval', emoji: '⏳', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
        if (status === 'On Leave') return { text: 'On Leave', emoji: '🏖️', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
        if (status === 'Holiday') return { text: 'Holiday', emoji: '🎉', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' };
        return { text: status || 'Unknown', emoji: '📋', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' };
    };

    const attendanceStatus = getAttendanceStatus();

    // Monthly stats
    const monthlyStats = useMemo(() => {
        const now = new Date();
        const thisMonth = attendanceHistory.filter(a => {
            const d = new Date(a.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        const present = thisMonth.filter(a => ['Present', 'Full Day', 'Checked-Out', 'Over Work'].includes(a.status)).length;
        const absent = thisMonth.filter(a => a.status === 'Absent').length;
        const totalHrs = Math.floor(thisMonth.reduce((acc, a) => acc + (a.duration || 0), 0) / 60);
        return { present, absent, totalHrs };
    }, [attendanceHistory]);

    // Profile picture URL helper
    const profilePicUrl = user?.profilePicture
        ? (user.profilePicture.startsWith('http') ? user.profilePicture : `${BASE_URL}${user.profilePicture.startsWith('/') ? '' : '/'}${user.profilePicture}`)
        : null;

    if (loading) return (
        <div className="flex h-full items-center justify-center p-20">
            <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-full border-4 border-white/10 border-t-indigo-500 animate-spin"></div>
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Loading Dashboard...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-5 md:space-y-6 pb-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            
            {/* ═══════════════════════════════════════
                HERO WELCOME CARD
            ═══════════════════════════════════════ */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-5 sm:p-6 md:p-10 shadow-2xl">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/4"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4"></div>
                <div className="absolute top-4 right-4 text-6xl md:text-8xl opacity-10 select-none">🚀</div>

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                    {/* Avatar */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-xl border-2 border-white/30 overflow-hidden shadow-2xl shrink-0">
                        {profilePicUrl ? (
                            <img 
                                src={profilePicUrl} 
                                alt={user?.fullName} 
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-white/20 to-white/5 text-white font-black text-2xl ${profilePicUrl ? 'hidden' : ''}`}>
                            {user?.fullName?.charAt(0) || '?'}
                        </div>
                    </div>

                    <div className="flex-1">
                        <p className="text-white/60 text-sm font-medium">{greeting.emoji} {greeting.text}</p>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mt-0.5">
                            {user?.fullName?.split(' ')[0]}! 👋
                        </h1>
                        <p className="text-white/50 text-xs sm:text-sm font-medium mt-1">{user?.designation || 'Team Member'} • {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                    </div>

                    {/* Quick attendance status chip */}
                    <div onClick={() => navigate('/employee/attendance')} className="bg-white/15 backdrop-blur-xl rounded-xl px-4 py-2.5 border border-white/20 cursor-pointer hover:bg-white/25 transition-all active:scale-95 self-start sm:self-center">
                        <div className="text-xs text-white/60 font-medium">Today's Status</div>
                        <div className="text-white font-bold text-sm flex items-center gap-1.5 mt-0.5">
                            <span>{attendanceStatus.emoji}</span> {attendanceStatus.text}
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════
                QUICK STATS ROW
            ═══════════════════════════════════════ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                {[
                    { label: 'Total Tasks', value: stats.assignedTasks, emoji: '📋', gradient: 'from-violet-500/15 to-purple-900/10', border: 'border-violet-500/15', color: 'text-violet-400', onClick: () => navigate('/employee/tasks') },
                    { label: 'In Progress', value: stats.pendingTasks, emoji: '🔄', gradient: 'from-cyan-500/15 to-blue-900/10', border: 'border-cyan-500/15', color: 'text-cyan-400', onClick: () => navigate('/employee/tasks') },
                    { label: 'Completed', value: stats.completedTasks, emoji: '✅', gradient: 'from-emerald-500/15 to-green-900/10', border: 'border-emerald-500/15', color: 'text-emerald-400', onClick: () => navigate('/employee/tasks') },
                    { label: 'Rate', value: `${completionRate}%`, emoji: '📊', gradient: 'from-amber-500/15 to-orange-900/10', border: 'border-amber-500/15', color: 'text-amber-400', onClick: () => navigate('/employee/tasks') },
                ].map((s, i) => (
                    <div 
                        key={i} 
                        onClick={s.onClick}
                        className={`bg-gradient-to-br ${s.gradient} border ${s.border} rounded-2xl p-4 backdrop-blur-xl cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-lg group`}
                    >
                        <div className="text-xl group-hover:scale-110 transition-transform">{s.emoji}</div>
                        <div className={`text-2xl sm:text-3xl font-black ${s.color} tracking-tight mt-1`}>{s.value}</div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* ═══════════════════════════════════════
                PROGRESS BAR
            ═══════════════════════════════════════ */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 md:p-5 backdrop-blur-xl shadow-lg">
                <div className="flex justify-between items-center mb-2.5">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp size={12} className="text-cyan-500" /> Task Completion
                    </span>
                    <span className="text-sm font-black text-white">{completionRate}%</span>
                </div>
                <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden">
                    <div 
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(99,102,241,0.4)]" 
                        style={{ width: `${completionRate}%` }}
                    ></div>
                </div>
                <div className="flex justify-between mt-2 text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                    <span>{stats.completedTasks} done</span>
                    <span>{stats.pendingTasks} remaining</span>
                </div>
            </div>

            {/* ═══════════════════════════════════════
                MAIN GRID: Actions + Attendance
            ═══════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
                
                {/* Quick Actions (takes 3/5 on desktop) */}
                <div className="lg:col-span-3 space-y-3 md:space-y-4">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2 px-1">
                        <Zap size={12} className="text-indigo-500" /> Quick Actions
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { label: 'Attendance', desc: 'Check in & out', emoji: '⏰', icon: UserCheck, path: '/employee/attendance', gradient: 'from-emerald-500 to-teal-600' },
                            { label: 'My Tasks', desc: 'View assigned work', emoji: '📝', icon: CheckSquare, path: '/employee/tasks', gradient: 'from-blue-500 to-indigo-600' },
                            { label: 'Work Log', desc: 'Log daily activity', emoji: '📓', icon: FileText, path: '/employee/work-log', gradient: 'from-purple-500 to-violet-600' },
                            { label: 'My Salary', desc: 'Payroll & slips', emoji: '💰', icon: IndianRupee, path: '/employee/salary', gradient: 'from-amber-500 to-orange-600' },
                        ].map((action, i) => (
                            <div 
                                key={i}
                                onClick={() => navigate(action.path)}
                                className="group relative bg-slate-900/50 border border-white/5 rounded-2xl p-4 cursor-pointer hover:border-white/15 transition-all duration-200 active:scale-[0.98] overflow-hidden shadow-lg"
                            >
                                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${action.gradient} opacity-5 group-hover:opacity-15 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-opacity duration-500`}></div>
                                <div className="relative z-10 flex items-center gap-3.5">
                                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                                        <action.icon size={20} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-bold text-sm flex items-center gap-1.5">
                                            {action.emoji} {action.label}
                                        </div>
                                        <div className="text-gray-500 text-[10px] font-medium mt-0.5">{action.desc}</div>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-700 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Monthly Attendance Summary (takes 2/5 on desktop) */}
                <div className="lg:col-span-2 space-y-3 md:space-y-4">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2 px-1">
                        <Calendar size={12} className="text-indigo-500" /> This Month
                    </h3>
                    
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 backdrop-blur-xl shadow-lg space-y-5">
                        {/* Today highlight */}
                        <div className={`${attendanceStatus.bg} border ${attendanceStatus.border} rounded-xl p-3.5 flex items-center gap-3`}>
                            <span className="text-2xl">{attendanceStatus.emoji}</span>
                            <div>
                                <div className={`font-bold text-sm ${attendanceStatus.color}`}>{attendanceStatus.text}</div>
                                <div className="text-[9px] font-medium text-gray-500 uppercase tracking-widest">Today's Status</div>
                            </div>
                        </div>

                        {/* Month stats grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3 bg-white/3 rounded-xl border border-white/5">
                                <div className="text-lg">✅</div>
                                <div className="text-xl font-black text-emerald-400">{monthlyStats.present}</div>
                                <div className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Present</div>
                            </div>
                            <div className="text-center p-3 bg-white/3 rounded-xl border border-white/5">
                                <div className="text-lg">❌</div>
                                <div className="text-xl font-black text-rose-400">{monthlyStats.absent}</div>
                                <div className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Absent</div>
                            </div>
                            <div className="text-center p-3 bg-white/3 rounded-xl border border-white/5">
                                <div className="text-lg">⏱️</div>
                                <div className="text-xl font-black text-cyan-400">{monthlyStats.totalHrs}h</div>
                                <div className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Hours</div>
                            </div>
                        </div>

                        {/* Go to attendance */}
                        <button 
                            onClick={() => navigate('/employee/attendance')}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-bold text-gray-400 uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            View Full Attendance <ArrowRight size={12} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════
                RECENT TASKS
            ═══════════════════════════════════════ */}
            {recentTasks.length > 0 && (
                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                            <Target size={12} className="text-indigo-500" /> Recent Tasks
                        </h3>
                        <button onClick={() => navigate('/employee/tasks')} className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors flex items-center gap-1">
                            View All <ChevronRight size={10} />
                        </button>
                    </div>
                    
                    <div className="space-y-2">
                        {recentTasks.map(task => {
                            const statusConfig = {
                                'Completed': { emoji: '✅', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                                'In Progress': { emoji: '🔄', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                                'Pending': { emoji: '⏳', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                                'Review': { emoji: '👀', color: 'text-purple-400', bg: 'bg-purple-500/10' },
                            };
                            const sc = statusConfig[task.status] || { emoji: '📋', color: 'text-gray-400', bg: 'bg-gray-500/10' };
                            
                            return (
                                <div 
                                    key={task._id}
                                    onClick={() => navigate(`/employee/tasks/${task._id}`)}
                                    className="bg-slate-900/40 border border-white/5 rounded-xl p-3.5 flex items-center gap-3 cursor-pointer hover:border-white/10 hover:bg-slate-900/60 transition-all active:scale-[0.99] group"
                                >
                                    <span className={`w-9 h-9 rounded-lg ${sc.bg} flex items-center justify-center text-base shrink-0`}>{sc.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white text-sm font-bold truncate group-hover:text-indigo-300 transition-colors">{task.title}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${sc.color}`}>{task.status}</span>
                                            {task.dueDate && (
                                                <span className="text-[9px] text-gray-600">• Due {new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className="text-gray-800 group-hover:text-gray-500 shrink-0" />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════
                NOTIFICATIONS
            ═══════════════════════════════════════ */}
            <div className="space-y-3">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2 px-1">
                    <Bell size={12} className="text-indigo-500" /> 🔔 Notifications
                </h3>
                
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl shadow-lg">
                    {recentNotifications.length === 0 ? (
                        <div className="p-10 text-center">
                            <span className="text-4xl block mb-3">🔕</span>
                            <p className="text-gray-500 font-bold text-sm">All caught up!</p>
                            <p className="text-gray-600 text-xs mt-1">No new notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {recentNotifications.map(notif => (
                                <div key={notif._id} className="p-3.5 sm:p-4 flex items-start gap-3 hover:bg-white/3 transition-colors">
                                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${notif.read ? 'bg-gray-700' : 'bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse'}`}></div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm leading-relaxed ${notif.read ? 'text-gray-500' : 'text-gray-300 font-medium'}`}>
                                            {notif.message}
                                        </p>
                                        <p className="text-[10px] text-gray-600 mt-1.5 flex items-center gap-1">
                                            <Clock size={10} /> {new Date(notif.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════
                MOTIVATIONAL FOOTER
            ═══════════════════════════════════════ */}
            <div className="text-center py-6">
                <p className="text-gray-700 text-xs font-medium italic">
                    "The secret of getting ahead is getting started." 🚀
                </p>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
