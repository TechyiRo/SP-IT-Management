import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Clock, Bell } from 'lucide-react';
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

    if (loading) return <div className="text-white text-center p-10">Loading Dashboard...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                Welcome back, {user?.fullName?.split(' ')[0]}!
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                    onClick={() => navigate('/employee/tasks')}
                    className="glass-card p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors group"
                >
                    <div>
                        <p className="text-gray-400 group-hover:text-gray-300">Total Tasks</p>
                        <h2 className="text-3xl font-bold text-white">{stats.assignedTasks}</h2>
                    </div>
                    <div className="bg-cyan-500/20 p-4 rounded-xl text-cyan-400 group-hover:scale-110 transition-transform">
                        <CheckSquare className="w-8 h-8" />
                    </div>
                </div>

                <div
                    onClick={() => navigate('/employee/tasks')}
                    className="glass-card p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors group"
                >
                    <div>
                        <p className="text-gray-400 group-hover:text-gray-300">Pending</p>
                        <h2 className="text-3xl font-bold text-white">{stats.pendingTasks}</h2>
                    </div>
                    <div className="bg-yellow-500/20 p-4 rounded-xl text-yellow-400 group-hover:scale-110 transition-transform">
                        <Clock className="w-8 h-8" />
                    </div>
                </div>

                <div
                    onClick={() => navigate('/employee/tasks')}
                    className="glass-card p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors group"
                >
                    <div>
                        <p className="text-gray-400 group-hover:text-gray-300">Completed</p>
                        <h2 className="text-3xl font-bold text-white">{stats.completedTasks}</h2>
                    </div>
                    <div className="bg-green-500/20 p-4 rounded-xl text-green-400 group-hover:scale-110 transition-transform">
                        <CheckSquare className="w-8 h-8" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-cyan-400" /> Recent Notifications
                    </h3>
                    <div className="space-y-3">
                        {recentNotifications.length === 0 ? (
                            <div className="text-gray-500 text-center py-4">No recent notifications.</div>
                        ) : (
                            recentNotifications.map(notif => (
                                <div key={notif._id} className={`p-3 rounded-lg flex gap-3 items-start ${notif.read ? 'bg-white/5' : 'bg-white/10 border-l-2 border-cyan-500'}`}>
                                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${notif.read ? 'bg-gray-600' : 'bg-cyan-400'}`} />
                                    <div>
                                        <p className="text-sm text-gray-200">{notif.message}</p>
                                        <p className="text-xs text-gray-500 mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="glass-card p-6">
                    <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => navigate('/employee/work-log')}
                            className="glass-button p-4 flex flex-col items-center justify-center gap-2 h-32 hover:scale-[1.02] transition-transform"
                        >
                            <Clock className="w-8 h-8 text-cyan-400" />
                            <span>Log Work</span>
                        </button>
                        <button
                            onClick={() => navigate('/employee/tasks')}
                            className="glass-button p-4 flex flex-col items-center justify-center gap-2 h-32 hover:scale-[1.02] transition-transform"
                        >
                            <CheckSquare className="w-8 h-8 text-purple-400" />
                            <span>View Tasks</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
