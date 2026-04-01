import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
    Users, UserCheck, CheckSquare, AlertCircle, 
    TrendingUp, ArrowUpRight, ArrowDownRight,
    Zap, Activity, Clock, ChevronRight,
    Target, Layout, Calendar, IndianRupee,
    Package, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, BarChart, Bar,
    Cell
} from 'recharts';
import { useNavigate, useOutletContext } from 'react-router-dom';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { themeParams } = useOutletContext();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEmployees: 0,
        presentToday: 0,
        activeTasks: 0,
        pendingRequests: 0,
        recentActivity: [],
        chartData: []
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/api/dashboard/stats');
            setStats(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            setLoading(false);
        }
    };

    const MetricCard = ({ title, value, icon: Icon, color, trend, trendDir, link }) => (
        <div
            onClick={() => link && navigate(link)}
            className={`glass-card glass-card-hover p-8 relative overflow-hidden group ${link ? 'cursor-pointer' : ''}`}
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity blur-[40px] -translate-y-1/2 translate-x-1/4`}></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-white/[0.03] border border-white/5 shadow-inner transition-transform duration-500 group-hover:scale-110`}>
                        <Icon size={22} className="text-white" />
                   </div>
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</h3>
                   <div className="text-4xl font-black text-white tracking-tighter mb-4">
                       {loading ? <div className="w-16 h-8 bg-white/5 animate-pulse rounded-lg"></div> : value}
                   </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        trendDir === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                        {trendDir === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {trend}
                    </span>
                    <ChevronRight size={14} className="text-slate-600 group-hover:translate-x-1 transition-transform ml-auto" />
                </div>
            </div>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10 animate-fade-in pb-20"
        >
            {/* Real-time Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Workforce Matrix"
                    value={stats.totalEmployees}
                    icon={Users}
                    color="from-indigo-500 to-purple-600"
                    trend="Registered Assets"
                    trendDir="up"
                    link="/admin/users"
                />
                <MetricCard
                    title="Live Attendance"
                    value={stats.presentToday}
                    icon={UserCheck}
                    color="from-emerald-500 to-teal-600"
                    trend={`${stats.totalEmployees ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0}% Threshold`}
                    trendDir="up"
                    link="/admin/attendance"
                />
                <MetricCard
                    title="Operational Flux"
                    value={stats.activeTasks}
                    icon={CheckSquare}
                    color="from-blue-500 to-cyan-600"
                    trend="In Distribution"
                    trendDir="up"
                    link="/admin/tasks"
                />
                <MetricCard
                    title="Action Required"
                    value={stats.pendingRequests}
                    icon={AlertCircle}
                    color="from-amber-500 to-orange-600"
                    trend="High Priority"
                    trendDir="down"
                    link="/admin/attendance"
                />
            </div>

            {/* Main Visual Data Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Visual Chart Card */}
                <div className="xl:col-span-2 glass-card p-10 flex flex-col min-h-[500px]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tighter italic">"Performance Analytics"</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Synchronized Attendance & Task Throughput</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 p-1 rounded-2xl border border-white/5">
                             <button className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">7 Days</button>
                             <button className="px-4 py-2 text-slate-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">30 Days</button>
                        </div>
                    </div>

                    <div className="flex-1 w-full relative">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-black uppercase text-xs tracking-widest animate-pulse">Initializing Data Stream...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="chartTask" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="10 10" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="rgba(255,255,255,0.1)" 
                                        fontSize={10} 
                                        fontWeight={900} 
                                        axisLine={false} 
                                        tickLine={false}
                                        tick={{ fill: '#64748b' }}
                                    />
                                    <YAxis 
                                        stroke="rgba(255,255,255,0.1)" 
                                        fontSize={10} 
                                        fontWeight={900} 
                                        axisLine={false} 
                                        tickLine={false}
                                        tick={{ fill: '#64748b' }}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                                        itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                        labelStyle={{ color: '#fff', fontSize: '12px', fontWeight: 900, marginBottom: '8px' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="attendance" 
                                        stroke="#6366f1" 
                                        strokeWidth={4} 
                                        fillOpacity={1} 
                                        fill="url(#chartGradient)" 
                                        animationDuration={2500}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="tasks" 
                                        stroke="#10b981" 
                                        strokeWidth={4} 
                                        fillOpacity={1} 
                                        fill="url(#chartTask)" 
                                        animationDuration={2500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Right Column: Mini Logs */}
                <div className="flex flex-col gap-8">
                     {/* System Health Card */}
                     <div className="glass-card p-10 bg-indigo-500/5 group hover:bg-indigo-500/10 transition-all duration-700 relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <div className="flex items-center justify-between mb-8 relative z-10">
                             <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 shadow-inner">
                                <Activity className="text-indigo-500 group-hover:animate-pulse" size={24} />
                             </div>
                             <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full uppercase tracking-widest border border-emerald-500/20 shadow-lg shadow-emerald-500/10">Active Neural Node</span>
                         </div>
                         <h4 className="text-xl font-black text-white italic tracking-tighter relative z-10">"Neural Architecture Sync"</h4>
                         <p className="text-xs text-slate-500 mt-2 font-bold leading-relaxed relative z-10 italic">Core AI processing power distributed across matrix nodes. Real-time AES-256 encryption active.</p>
                         <div className="mt-8 h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative z-10 shadow-inner">
                             <motion.div 
                                initial={{ width: "0%" }}
                                animate={{ width: "94%" }}
                                transition={{ duration: 2, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 relative"
                             >
                                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] w-20 animate-shimmer"></div>
                             </motion.div>
                         </div>
                     </div>

                     {/* Recent Events Card */}
                     <div className="glass-card flex-1 p-10">
                         <div className="flex items-center justify-between mb-10">
                            <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                                <Clock size={16} className="text-indigo-500" /> Event Horizon
                            </h3>
                            <button className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em] underline decoration-indigo-500/30 underline-offset-4">Browse All</button>
                         </div>
                         
                         <div className="space-y-8 overflow-y-auto custom-scrollbar max-h-[300px] pr-4">
                            {stats.recentActivity.length === 0 ? (
                                <div className="py-12 text-center text-slate-600 font-black uppercase text-[10px] tracking-widest border-2 border-white/5 border-dashed rounded-3xl italic">Static Noise Detected...</div>
                            ) : (
                                stats.recentActivity.map((task) => (
                                    <div key={task._id} className="flex gap-6 group cursor-pointer">
                                        <div className="flex-none pt-1">
                                            <div className={`w-3 h-3 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-500 ${
                                                task.status === 'Completed' ? 'bg-emerald-500 shadow-emerald-500/40' :
                                                task.status === 'In Progress' ? 'bg-indigo-500 shadow-indigo-500/40' :
                                                'bg-amber-500 shadow-amber-500/40'
                                            } group-hover:scale-150`}></div>
                                        </div>
                                        <div className="min-w-0 border-b border-white/5 pb-4 w-full">
                                            <p className="text-xs font-black text-white leading-tight mb-1 truncate uppercase tracking-tight">{task.title}</p>
                                            <div className="flex items-center gap-3">
                                                 <p className="text-[10px] font-bold text-slate-500 truncate">{task.assignedTo?.map(u => u.fullName).join(', ') || 'Unassigned Output'}</p>
                                                 <span className="text-[10px] text-slate-700 font-mono">• {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                         </div>
                     </div>
                </div>
            </div>

            {/* Quick Access Terminal */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                 {[
                     { label: 'Asset Management', icon: Target, path: '/admin/users' },
                     { label: 'Fiscal Pipeline', icon: IndianRupee, path: '/admin/payroll' },
                     { label: 'Inventory Matrix', icon: Package, path: '/admin/resources' },
                     { label: 'Security Portal', icon: Shield, path: '/admin/password-manager' }
                 ].map((action, i) => (
                     <button 
                        key={i}
                        onClick={() => navigate(action.path)}
                        className="glass-card glass-card-hover p-6 flex flex-col items-center gap-4 group"
                     >
                        <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 transition-all duration-500 group-hover:-translate-y-1">
                            <action.icon size={20} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 group-hover:text-white uppercase tracking-widest transition-colors">{action.label}</span>
                     </button>
                 ))}
            </div>
        </motion.div>
    );
};

export default AdminDashboard;
