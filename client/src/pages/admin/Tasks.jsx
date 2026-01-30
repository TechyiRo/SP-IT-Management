import { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import api from '../../api/axios';
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
    const [editingTask, setEditingTask] = useState(null);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tasksRes, usersRes, companiesRes, productsRes] = await Promise.all([
                api.get('/api/tasks'),
                api.get('/api/users'),
                api.get('/api/resources/companies'),
                api.get('/api/resources/products')
            ]);

            setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
            setUsers(usersRes.data);
            setCompanies(companiesRes.data);
            setProducts(productsRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    const handleTaskCreate = async (taskData) => {
        try {
            await api.post('/api/tasks', taskData);
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            console.error('Error creating task:', err);
            alert('Error creating task: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleWhatsAppShare = async (task, e) => {
        e.stopPropagation();
        const user = task.assignedTo && task.assignedTo.length > 0 ? task.assignedTo[0] : null;
        const phone = user?.phone;

        if (!phone) {
            alert('No phone number found for the assigned user.');
            return;
        }

        // 1. Create Hidden Card for Image Generation
        const cardId = `task-card-${task._id}`;
        let card = document.getElementById(cardId);

        if (!card) {
            const container = document.createElement('div');
            container.id = cardId;
            container.style.position = 'fixed';
            container.style.top = '-9999px';
            container.style.left = '-9999px';
            container.style.width = '400px';
            container.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
            container.style.padding = '24px';
            container.style.borderRadius = '16px';
            container.style.color = 'white';
            container.style.fontFamily = 'Arial, sans-serif';
            container.style.border = '1px solid #334155';

            // NOTE: Emojis removed as requested
            container.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                    <div style="width: 48px; height: 48px; background: #06b6d4; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px;">SP</div>
                    <div>
                        <div style="font-size: 14px; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">New Task Assigned</div>
                        <div style="font-size: 18px; font-weight: bold; color: white;">SP IT Technologies</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <div style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">Task Title</div>
                    <div style="font-size: 20px; font-weight: bold; color: white; line-height: 1.4;">${task.title}</div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
                        <div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px;">Priority</div>
                        <div style="font-size: 14px; color: ${task.priority === 'High' ? '#f87171' : task.priority === 'Medium' ? '#facc15' : '#4ade80'}; font-weight: bold;">${task.priority}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
                        <div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px;">Deadline</div>
                        <div style="font-size: 14px; color: white; font-weight: bold;">${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</div>
                    </div>
                </div>
                
                <div style="border-top: 1px solid #334155; padding-top: 16px; margin-top: 16px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 12px; color: #94a3b8;">Assigned To: <span style="color: white; font-weight: bold;">${task.assignedTo && task.assignedTo[0] ? task.assignedTo[0].fullName : 'Unassigned'}</span></div>
                    <div style="font-size: 10px; color: #64748b;">Generated by SP IT System</div>
                </div>
            `;

            document.body.appendChild(container);
            card = container;
        }

        try {
            // 2. Generate Image
            const canvas = await html2canvas(card, {
                backgroundColor: null,
                scale: 2
            });

            // 3. Copy to Clipboard
            canvas.toBlob(async (blob) => {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);

                    // 4. Prepare Text Message (Clean Text - No Emojis)
                    const message = `Hello! *New Task Assigned*\n\n` +
                        `*Title:* ${task.title}\n` +
                        `*Priority:* ${task.priority}\n` +
                        `*Deadline:* ${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}\n\n` +
                        `*View Task:* https://spittechnologies.vercel.app/employee/tasks\n\n` +
                        `_Please check your dashboard for more details._`;

                    // 5. Open WhatsApp (Encode URI Component is safe now without special chars)
                    const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

                    // 6. Notify User (Non-blocking Toast)
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 5000);

                    window.open(url, '_blank');

                } catch (clipErr) {
                    console.error('Clipboard failed:', clipErr);
                    // Fallback if clipboard fails: Just open text
                    const message = `Hello! *New Task Assigned*\n\n` +
                        `*Title:* ${task.title}\n` +
                        `_Please check your dashboard for more details._`;
                    const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                    window.open(url, '_blank');
                }
                document.body.removeChild(card); // Cleanup
            });

        } catch (err) {
            console.error('Error handling WhatsApp share:', err);
            if (card) document.body.removeChild(card);
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

    const openEditModal = (task, e) => {
        e.stopPropagation();
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleTaskUpdate = async (id, updatedData) => {
        try {
            await api.put(`/api/tasks/${id}`, updatedData);
            setIsModalOpen(false);
            setEditingTask(null);
            fetchData();
        } catch (err) {
            console.error('Error updating task:', err);
            alert('Error updating task');
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await api.delete(`/api/tasks/${id}`);
                setTasks(tasks.filter(t => t._id !== id));
            } catch (err) {
                console.error('Error deleting task:', err);
                alert('Error deleting task');
            }
        }
    };

    const filteredTasks = Array.isArray(tasks) ? tasks.filter(task =>
        task && task.title && typeof task.title === 'string' &&
        task.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    const renderListView = () => (
        <div className="glass-card overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/10 uppercase text-xs text-gray-400">
                    <tr>
                        <th className="p-4">Task Title</th>
                        <th className="p-4">Assigned To</th>
                        <th className="p-4">Deadline</th>
                        <th className="p-4">Priority</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Progress</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                    {loading ? (
                        <tr><td colSpan="7" className="p-4 text-center">Loading...</td></tr>
                    ) : filteredTasks.length === 0 ? (
                        <tr><td colSpan="7" className="p-4 text-center text-gray-500">No tasks found</td></tr>
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
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={(e) => handleWhatsAppShare(task, e)}
                                            className="p-1.5 hover:bg-white/10 rounded-lg text-green-400 hover:text-green-300 transition-colors"
                                            title="Send WhatsApp Notification (Image + Text)"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                                        </button>

                                        <button
                                            onClick={(e) => openEditModal(task, e)}
                                            className="p-1.5 hover:bg-white/10 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
                                            title="Edit Task"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(task._id, e)}
                                            className="p-1.5 hover:bg-white/10 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                                            title="Delete Task"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                        </button>
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
            {/* TOAST NOTIFICATION */}
            {showToast && (
                <div className="fixed bottom-10 right-10 bg-slate-800 border border-green-500/50 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-4 animate-bounce">
                    <div className="bg-green-500/20 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <div>
                        <h4 className="font-bold text-green-400">Image Copied!</h4>
                        <p className="text-sm text-gray-300">Just press <strong className="text-white">Ctrl + V</strong> in WhatsApp.</p>
                    </div>
                </div>
            )}

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
                        onClick={() => {
                            setEditingTask(null);
                            setIsModalOpen(true);
                        }}
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
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingTask(null);
                }}
                onTaskCreate={handleTaskCreate}
                onTaskUpdate={handleTaskUpdate}
                users={users}
                companies={companies}
                products={products}
                taskToEdit={editingTask}
            />
        </div>
    );
};

export default Tasks;
