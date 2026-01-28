import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmployeeTasks = () => {
    const [tasks, setTasks] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/tasks/me');
                setTasks(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchTasks();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-500/20 text-green-300 border-green-500/50';
            case 'In Progress': return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
            case 'On Hold': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
            default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">My Tasks</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.length > 0 ? tasks.map(task => (
                    <div
                        key={task._id}
                        onClick={() => navigate(`/employee/tasks/${task._id}`)}
                        className="glass-card p-6 hover:shadow-lg transition-all group hover:-translate-y-1 cursor-pointer"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className={`text-xs px-2 py-1 rounded-lg border ${getStatusColor(task.status)}`}>
                                {task.status}
                            </span>
                            <span className={`w-3 h-3 rounded-full ${task.priority === 'High' || task.priority === 'Urgent' ? 'bg-red-500 animate-pulse' : task.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                        </div>

                        <h3 className="text-lg font-bold mb-2 group-hover:text-cyan-400 transition-colors">{task.title}</h3>
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                            {task.description ? task.description.replace(/<[^>]*>?/gm, '') : 'No description'}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-auto pt-4 border-t border-white/10">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full glass-card p-12 text-center text-gray-400">
                        <div className="inline-block p-4 rounded-full bg-white/5 mb-4">
                            <AlertCircle className="w-8 h-8 opacity-50" />
                        </div>
                        <p>No tasks assigned yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
export default EmployeeTasks;
