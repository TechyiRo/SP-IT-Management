import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Calendar, User, Clock, AlertCircle, LayoutList, Kanban, MoreVertical } from 'lucide-react';
import CreateTaskModal from '../../components/admin/CreateTaskModal';

// NOTE: DND Library completely removed to prevent React 19 crashes.
// import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const Tasks = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'board'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tasksRes, usersRes, companiesRes, productsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/tasks'),
                axios.get('http://localhost:5000/api/users'),
                axios.get('http://localhost:5000/api/resources/companies'),
                axios.get('http://localhost:5000/api/resources/products')
            ]);

            setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
            setUsers(usersRes.data);
            setCompanies(companiesRes.data);
            setProducts(productsRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
            // Fallback empty states
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    const handleTaskCreate = async (taskData) => {
        try {
            await axios.post('http://localhost:5000/api/tasks', taskData);
            setIsModalOpen(false);
            fetchData(); // Refresh list
        } catch (err) {
            console.error('Error creating task:', err);
            alert('Error creating task: ' + (err.response?.data?.message || err.message));
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': case 'Urgent': return 'text-red-400 bg-red-500/10 border-red-500/50';
            case 'Medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/50';
            case 'Low': return 'text-green-400 bg-green-500/10 border-green-500/50';
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/50';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'text-green-400';
            case 'In Progress': return 'text-blue-400';
            case 'Not Started': return 'text-gray-400';
            case 'On Hold': return 'text-yellow-400';
            default: return 'text-white';
        }
    };

    const filteredTasks = Array.isArray(tasks) ? tasks.filter(task =>
        task && task.title && typeof task.title === 'string' &&
        task.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    const renderListView = () => (
        <div className="glass-card overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/10 uppercase text-xs text-gray-400">
                    <tr>
                        <th className="p-4">Task Title</th>
                        <th className="p-4">Assigned To</th>
                        <th className="p-4">Deadline</th>
                        <th className="p-4">Priority</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Progress</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                    {loading ? (
                        <tr><td colSpan="6" className="p-4 text-center">Loading...</td></tr>
                    ) : filteredTasks.length === 0 ? (
                        <tr><td colSpan="6" className="p-4 text-center text-gray-500">No tasks found</td></tr>
                    ) : (
                        filteredTasks.map(task => (
                            <tr key={task._id}
                                onClick={() => navigate(`/admin/tasks/${task._id}`)}
                                className="hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <td className="p-4 font-medium text-white">
                                    {task.title}
                                    <div className="text-xs text-gray-500 mt-1 truncate max-w-xs text-ellipsis">
                                        {task.description ? task.description.replace(/<[^>]*>?/gm, '') : ''}
                                    </div>
                                    <div className='flex gap-2 mt-1'>
                                        {task.category && <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-gray-300">{task.category}</span>}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex -space-x-2">
                                        {task.assignedTo && task.assignedTo.map((user, idx) => (
                                            user ? (
                                                <div key={idx} className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold border-2 border-slate-900" title={user.fullName}>
                                                    {user.fullName ? user.fullName.charAt(0) : 'U'}
                                                </div>
                                            ) : null
                                        ))}
                                        {(!task.assignedTo || task.assignedTo.length === 0) && <span className="text-gray-500 text-sm">Unassigned</span>}
                                    </div>
                                </td>
                                <td className="p-4 text-gray-300 text-sm">
                                    {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No Deadline'}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-md text-xs border ${getPriorityColor(task.priority)}`}>
                                        {task.priority}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className={`flex items-center gap-2 ${getStatusColor(task.status)}`}>
                                        <div className="w-2 h-2 rounded-full bg-current"></div>
                                        {task.status}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="w-full bg-gray-700 rounded-full h-1.5 w-24">
                                        <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${task.progress || 0}%` }}></div>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderBoardView = () => (
        <div className="glass-card p-10 text-center flex flex-col items-center justify-center text-gray-400">
            <Kanban className="w-12 h-12 mb-4 text-gray-600" />
            <h3 className="text-lg font-bold text-white mb-2">Kanban Board Unavailable</h3>
            <p>The drag-and-drop feature is currently disabled for maintenance.</p>
            <button
                onClick={() => setViewMode('list')}
                className="mt-4 glass-button text-sm"
            >
                Return to List View
            </button>
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">Task Management</h1>
                <div className="flex items-center gap-3">
                    <div className="bg-slate-900/50 p-1 rounded-lg flex items-center border border-white/10">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25' : 'text-gray-400 hover:text-white'}`}
                            title="List View"
                        >
                            <LayoutList className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('board')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'board' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25' : 'text-gray-400 hover:text-white'}`}
                            title="Board View"
                        >
                            <Kanban className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="glass-button flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Create Task
                    </button>
                </div>
            </div>

            <div className="glass-card p-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search tasks by title..."
                        className="glass-input w-full pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {viewMode === 'list' ? renderListView() : renderBoardView()}

            <CreateTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onTaskCreate={handleTaskCreate}
                users={users}
                companies={companies}
                products={products}
            />
        </div>
    );
};

export default Tasks;
