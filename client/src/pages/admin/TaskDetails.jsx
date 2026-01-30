import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { BASE_URL } from '../../api/axios';
import {
    ArrowLeft, Calendar, CheckSquare, FileText, User,
    AlertCircle, Layers, CheckCircle, Clock, History,
    MessageSquare, Paperclip, Shield, Send
} from 'lucide-react';

export default function TaskDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]); // For reassignment
    const [activeTab, setActiveTab] = useState('tracking');

    // Admin Action State
    const [adminRemark, setAdminRemark] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [reassignId, setReassignId] = useState('');

    useEffect(() => {
        fetchTaskDetails();
        fetchUsers();
    }, [id]);

    const fetchTaskDetails = async () => {
        try {
            const res = await api.get(`/api/tasks/${id}`);
            setTask(res.data);
            setNewStatus(res.data.status);
            setReassignId(res.data.assignedTo?.[0]?._id || '');
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/api/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAdminUpdate = async () => {
        try {
            const updateData = {};
            if (newStatus && newStatus !== task.status) updateData.status = newStatus;

            // Reassignment logic (simple single user for now based on UI)
            // If multiple assignment needed, UI needs change. Assuming simplified reassign.
            // If reassignId changed
            const currentAssigned = task.assignedTo?.[0]?._id;
            if (reassignId && reassignId !== currentAssigned) {
                updateData.assignedTo = [reassignId]; // Overwrite assignment
            }

            // Note: Remarks are usually added to activity log or separate notes field
            if (adminRemark) {
                // We'll append to description or better yet, push to activity log via backend logic?
                // Or maybe the backend supports a generic update.
                // The PUT route supports generic updates.
                // Let's add the remark to the 'adminNotes' field or append to description if no specific field.
                // Task model has 'adminNotes'.
                updateData.adminNotes = (task.adminNotes ? task.adminNotes + '\n' : '') + `[Admin]: ${adminRemark}`;
            }

            await api.put(`/api/tasks/${id}`, updateData);

            // If strictly "Add Remark" to the resolution log/work history, we might want to use the POST /updates endpoint too?
            // "Admin can also: Add remark". 
            // Let's stick to updating the task properties for now.

            alert('Task Updated');
            setAdminRemark('');
            fetchTaskDetails();
        } catch (err) {
            console.error('Full Error Object:', err);
            const msg = err.response?.data?.msg || err.message || 'Unknown Error';
            alert(`Update Failed: ${msg}`);
        }
    };

    if (loading) return <div className="p-10 text-center text-white">Loading...</div>;
    if (!task) return <div className="p-10 text-center text-white">Task not found</div>;

    const getPriorityColor = (p) => {
        switch (p) {
            case 'High': case 'Urgent': return 'text-red-400 border-red-500/50 bg-red-500/10';
            case 'Medium': return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
            case 'Low': return 'text-green-400 border-green-500/50 bg-green-500/10';
            default: return 'text-gray-400 border-gray-500/50 bg-gray-500/10';
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4 mb-2">
                <button onClick={() => navigate('/admin/tasks')} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        {task.title}
                        <span className={`text-xs px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                        <span className="flex items-center gap-1"><Calendar size={14} /> Due: {new Date(task.deadline).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><User size={14} /> Assigned:
                            {task.assignedTo?.map(u => u.fullName).join(', ') || 'Unassigned'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
                        {task.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tabs */}
                    <div className="flex border-b border-white/10">
                        {['tracking', 'details'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-3 text-sm font-medium transition-colors relative ${activeTab === tab ? 'text-cyan-400' : 'text-gray-400 hover:text-white'}`}
                            >
                                {tab === 'tracking' ? 'Task Tracking & Resolution' : 'Task Details'}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>}
                            </button>
                        ))}
                    </div>

                    <div className="glass-card p-6 min-h-[500px]">
                        {activeTab === 'tracking' && (
                            <div className="space-y-8 animate-fade-in">
                                {/* Resolution History */}
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                        <History size={18} className="text-purple-400" /> Resolution Logs
                                    </h3>

                                    {task.taskUpdates && task.taskUpdates.length > 0 ? (
                                        <div className="relative border-l-2 border-slate-700 ml-3 space-y-8">
                                            {task.taskUpdates.map((update, idx) => (
                                                <div key={idx} className="relative pl-8">
                                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-cyan-500"></div>

                                                    <div className="glass-card p-5 border border-white/10 hover:border-white/20 transition-all">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <h4 className="text-base font-bold text-white">{update.issueResolved || 'Update Log'}</h4>
                                                                <span className="text-xs text-gray-500 block mt-1">
                                                                    By Employee • {new Date(update.timestamp).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            {update.statusSnapshot && (
                                                                <span className="text-xs bg-slate-800 text-gray-300 px-2 py-1 rounded border border-gray-700">
                                                                    Status: {update.statusSnapshot}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {update.resolutionSummary && (
                                                            <div className="mb-3 bg-slate-900/50 p-3 rounded-lg border border-white/5">
                                                                <p className="text-sm text-gray-300 leading-relaxed">{update.resolutionSummary}</p>
                                                            </div>
                                                        )}

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-400 mb-3">
                                                            {update.stepsPerformed && (
                                                                <div>
                                                                    <strong className="block text-gray-500 uppercase text-[10px] mb-1">Steps Performed</strong>
                                                                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 bg-slate-900/50 p-2 rounded border border-white/5" dangerouslySetInnerHTML={{ __html: update.stepsPerformed }} />
                                                                </div>
                                                            )}
                                                            {update.problemFound && (
                                                                <div>
                                                                    <strong className="block text-gray-500 uppercase text-[10px] mb-1">Problem Found</strong>
                                                                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 bg-slate-900/50 p-2 rounded border border-white/5" dangerouslySetInnerHTML={{ __html: update.problemFound }} />
                                                                </div>
                                                            )}
                                                            {update.configurationChanged && (
                                                                <div>
                                                                    <strong className="block text-gray-500 uppercase text-[10px] mb-1">Config Update</strong>
                                                                    <code className="text-yellow-500/80">{update.configurationChanged}</code>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {update.remark && (
                                                            <div className="text-xs text-gray-400 italic border-t border-white/5 pt-2 mt-2">
                                                                " {update.remark} "
                                                            </div>
                                                        )}

                                                        {update.attachments && update.attachments.length > 0 && (
                                                            <div className="flex gap-3 mt-3 pt-3 border-t border-white/5">
                                                                {update.attachments.map((att, i) => (
                                                                    <a key={i} href={`${BASE_URL}/${att}`} target="_blank" className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-900/20 px-2 py-1 rounded">
                                                                        <Paperclip size={12} /> Attachment {i + 1}
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 border-2 border-dashed border-gray-700 rounded-xl">
                                            <p className="text-gray-500">No resolution logs added by employee yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'details' && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                                    <div className="prose prose-invert prose-sm max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: task.description }} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Requirements</h3>
                                    <ul className="space-y-2">
                                        {task.taskRequirements?.map((req, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                                <div className={`w-4 h-4 border rounded flex items-center justify-center ${req.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-500'}`}>
                                                    {req.completed && <CheckSquare size={10} className="text-white" />}
                                                </div>
                                                <span className={req.completed ? 'line-through opacity-50' : ''}>{req.text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Controls */}
                <div className="space-y-6">
                    <div className="glass-card p-6 space-y-6 border-t-4 border-t-purple-500">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Shield size={18} className="text-purple-400" /> Admin Controls
                        </h3>

                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Change Status</label>
                            <select
                                className="glass-input w-full bg-slate-800"
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                            >
                                {['Pending', 'In Progress', 'On Hold', 'Resolved', 'Descoped', 'Completed', 'Cancelled'].map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Reassign Task</label>
                            <select
                                className="glass-input w-full bg-slate-800"
                                value={reassignId}
                                onChange={(e) => setReassignId(e.target.value)}
                            >
                                <option value="">Select Employee</option>
                                {users.filter(u => u.role === 'employee').map(u => (
                                    <option key={u._id} value={u._id}>{u.fullName}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Add Admin Remark</label>
                            <textarea
                                className="glass-input w-full h-24 text-sm resize-none"
                                placeholder="Internal note..."
                                value={adminRemark}
                                onChange={(e) => setAdminRemark(e.target.value)}
                            ></textarea>
                        </div>

                        <button
                            onClick={handleAdminUpdate}
                            className="w-full glass-button bg-purple-600 hover:bg-purple-500 text-white border-none py-3 flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={18} /> Update Task
                        </button>
                    </div>

                    <div className="glass-card p-6">
                        <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Meta Info</h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Created:</span>
                                <span className="text-gray-300">{new Date(task.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Updated:</span>
                                <span className="text-gray-300">{new Date(task.updatedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Created By:</span>
                                <span className="text-gray-300">{task.assignedBy?.fullName || 'Admin'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
