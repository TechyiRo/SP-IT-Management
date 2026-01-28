import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserCheck, CheckSquare, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
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
            const res = await axios.get('http://localhost:5000/api/dashboard/stats');
            setStats(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, trend }) => (
        <div className="glass-card p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                <Icon className="w-24 h-24" />
            </div>
            <div className="relative z-10">
                <div className={`inline-flex p-3 rounded-xl mb-4 ${color} bg-opacity-20 text-white`}>
                    <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
                <div className="text-3xl font-bold text-white mb-2">{loading ? '...' : value}</div>
                <span className="text-emerald-400 text-xs font-medium bg-emerald-500/10 px-2 py-1 rounded-lg">
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
                    <p className="text-gray-400 text-sm">Welcome back, here's what's happening today.</p>
                </div>
                <div className="glass-card px-4 py-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">System Online</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Employees"
                    value={stats.totalEmployees}
                    icon={Users}
                    color="bg-purple-500"
                    trend="Registered Staff"
                />
                <StatCard
                    title="Present Today"
                    value={stats.presentToday}
                    icon={UserCheck}
                    color="bg-emerald-500"
                    trend={`${stats.totalEmployees ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0}% Attendance Rate`}
                />
                <StatCard
                    title="Active Tasks"
                    value={stats.activeTasks}
                    icon={CheckSquare}
                    color="bg-blue-500"
                    trend="In Progress"
                />
                <StatCard
                    title="Pending Requests"
                    value={stats.pendingRequests}
                    icon={AlertCircle}
                    color="bg-amber-500"
                    trend="Requires Action"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="glass-card p-6 lg:col-span-2">
                    <h3 className="text-lg font-bold mb-6">Attendance & Task Trends (Last 7 Days)</h3>
                    <div className="h-80">
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

                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold mb-6">Recent Activity</h3>
                    <div className="space-y-6">
                        {stats.recentActivity.length === 0 ? (
                            <p className="text-gray-500 text-sm">No recent activity</p>
                        ) : (
                            stats.recentActivity.map((task) => (
                                <div key={task._id} className="flex gap-4">
                                    <div className="flex-none pt-1">
                                        <div className={`w-2 h-2 rounded-full ring-4 ring-opacity-20 ${task.status === 'Completed' ? 'bg-emerald-500 ring-emerald-500' :
                                                task.status === 'In Progress' ? 'bg-blue-500 ring-blue-500' :
                                                    'bg-yellow-500 ring-yellow-500'
                                            }`}></div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-300">New Task: <span className="text-white font-medium">{task.title}</span></p>
                                        <p className="text-xs text-gray-500 mt-1">Assigned to: {task.assignedTo?.map(u => u.fullName).join(', ') || 'Unassigned'}</p>
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
