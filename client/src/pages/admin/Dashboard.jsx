import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Users, UserCheck, CheckSquare, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate, useOutletContext } from 'react-router-dom';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { themeParams } = useOutletContext(); // Access theme params
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

    const StatCard = ({ title, value, icon: Icon, color, trend, trendColor = 'text-emerald-400 bg-emerald-500/10', link }) => (
        <div
            onClick={() => link && navigate(link)}
            className={`${themeParams.card} p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 h-full flex flex-col justify-between ${link ? 'cursor-pointer' : ''}`}
        >
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                <Icon className="w-24 h-24" />
            </div>
            <div className="relative z-10">
                <div className={`inline-flex p-3 rounded-xl mb-4 ${color} bg-opacity-20 text-white`}>
                    <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
                <div className={`text-3xl font-bold ${themeParams.text} mb-2`}>{loading ? '...' : value}</div>
                <span className={`text-xs font-medium px-2 py-1 rounded-lg ${trendColor}`}>
                    {trend}
                </span>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">Dashboard Overview</h1>
                    <p className={`text-sm ${themeParams.text} opacity-70`}>Welcome back, here's what's happening today.</p>
                </div>
                <div className={`${themeParams.card} px-4 py-2 flex items-center gap-2`}>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className={`text-sm font-medium ${themeParams.text}`}>System Online</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Employees"
                    value={stats.totalEmployees}
                    icon={Users}
                    color="bg-purple-500"
                    trend="Registered Staff"
                    trendColor="text-purple-400 bg-purple-500/10"
                    link="/admin/users"
                />
                <StatCard
                    title="Present Today"
                    value={stats.presentToday}
                    icon={UserCheck}
                    color="bg-emerald-500"
                    trend={`${stats.totalEmployees ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0}% Attendance Rate`}
                    trendColor="text-emerald-400 bg-emerald-500/10"
                    link="/admin/attendance"
                />
                <StatCard
                    title="Active Tasks"
                    value={stats.activeTasks}
                    icon={CheckSquare}
                    color="bg-blue-500"
                    trend="In Progress"
                    trendColor="text-blue-400 bg-blue-500/10"
                    link="/admin/tasks"
                />
                <StatCard
                    title="Pending Requests"
                    value={stats.pendingRequests}
                    icon={AlertCircle}
                    color="bg-amber-500"
                    trend="Requires Action"
                    trendColor="text-amber-400 bg-amber-500/10"
                    link="/admin/attendance"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
                <div className={`${themeParams.card} p-6 lg:col-span-3 h-full flex flex-col`}>
                    <h3 className={`text-lg font-bold mb-6 ${themeParams.text}`}>Attendance & Task Trends (Last 7 Days)</h3>
                    <div className="flex-1 min-h-[320px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-gray-500">Loading Chart...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.chartData}>
                                    <defs>
                                        <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorTask" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#6b7280" />
                                    <YAxis stroke="#6b7280" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.8)', borderColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <Area type="monotone" dataKey="attendance" stroke="#8884d8" fillOpacity={1} fill="url(#colorAtt)" />
                                    <Area type="monotone" dataKey="tasks" stroke="#82ca9d" fillOpacity={1} fill="url(#colorTask)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className={`${themeParams.card} p-6 h-full flex flex-col`}>
                    <h3 className="text-lg font-bold mb-6">Recent Activity</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                        {stats.recentActivity.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-500 text-sm">No recent activity</div>
                        ) : (
                            stats.recentActivity.map((task) => (
                                <div key={task._id} className="flex gap-4 group">
                                    <div className="flex-none pt-1">
                                        <div className={`w-2 h-2 rounded-full ring-4 ring-opacity-20 transition-all group-hover:ring-opacity-40 ${task.status === 'Completed' ? 'bg-emerald-500 ring-emerald-500' :
                                            task.status === 'In Progress' ? 'bg-blue-500 ring-blue-500' :
                                                'bg-yellow-500 ring-yellow-500'
                                            }`}></div>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-gray-300 truncate">New Task: <span className="text-white font-medium">{task.title}</span></p>
                                        <p className="text-xs text-gray-500 mt-1 truncate">By: {task.assignedTo?.map(u => u.fullName).join(', ') || 'Unassigned'}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
