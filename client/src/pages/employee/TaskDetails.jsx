import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { BASE_URL } from '../../api/axios';
import {
    ArrowLeft, Clock, Calendar, CheckSquare, MessageSquare,
    FileText, User, Flag, Send, AlertCircle, Briefcase, Layers,
    CheckCircle, Circle, Upload, Paperclip, ChevronRight, History, Play, Check
} from 'lucide-react';

export default function TaskDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('workflow'); // Default to workflow
    const [statusUpdating, setStatusUpdating] = useState(false);

    // Workflow Form State
    const [workflowForm, setWorkflowForm] = useState({
        issueResolved: '',
        stepsPerformed: '',
        problemFound: '',
        configurationChanged: '',
        resolutionSummary: '',
        remark: '',
        status: ''
    });
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTaskDetails();
    }, [id]);

    const fetchTaskDetails = async () => {
        try {
            const res = await api.get(`/api/tasks/${id}`);
            setTask(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.msg || err.message || 'Unknown Error');
            setLoading(false);
        }
    };

    const handleWorkflowSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            Object.keys(workflowForm).forEach(key => {
                if (workflowForm[key]) formData.append(key, workflowForm[key]);
            });
            files.forEach(file => formData.append('attachments', file));

            const res = await api.post(`/api/tasks/${id}/updates`, formData);

            setTask(res.data);
            setWorkflowForm({
                issueResolved: '',
                stepsPerformed: '',
                problemFound: '',
                configurationChanged: '',
                resolutionSummary: '',
                remark: '',
                status: ''
            });
            setFiles([]);
            // alert('Update logged successfully');
        } catch (err) {
            console.error('Full Error Object:', err);
            const msg = err.response?.data?.msg || err.message || 'Unknown Error';
            alert(`Failed: ${msg}`);
        }
    };

    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files));
    };

    // Quick Status Update (if needed outside workflow)
    const handleStatusChange = async (newStatus) => {
        setStatusUpdating(true);
        try {
            const res = await api.put(`/api/tasks/${id}`, { status: newStatus });
            setTask(res.data);
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleRequirementToggle = async (reqId, currentStatus) => {
        try {
            const res = await api.put(`/api/tasks/${id}/requirements/${reqId}`, {
                completed: !currentStatus
            });
            setTask(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="text-center text-white p-10">Loading task details...</div>;
    if (error) return (
        <div className="text-center text-white p-10">
            <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-xl inline-block">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-400 mb-2">Task Not Found</h3>
                <p className="text-gray-300">Error: {error}</p>
                <button onClick={() => navigate('/employee/tasks')} className="mt-6 glass-button">Return to Tasks</button>
            </div>
        </div>
    );
    if (!task) return <div className="text-center text-white p-10">Task data is empty</div>;

    const getPriorityColor = (p) => {
        switch (p) {
            case 'High': case 'Urgent': return 'text-red-400 border-red-500/50 bg-red-500/10';
            case 'Medium': return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
            case 'Low': return 'text-green-400 border-green-500/50 bg-green-500/10';
            default: return 'text-gray-400 border-gray-500/50 bg-gray-500/10';
        }
    };

    const statusSteps = ['Pending', 'In Progress', 'On Hold', 'Resolved', 'Completed'];
    const currentStepIndex = statusSteps.indexOf(task.status) === -1 ? 0 : statusSteps.indexOf(task.status);

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white">{task.title}</h1>
                    <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                        <span className={`px-2 py-0.5 rounded border text-xs ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                        <span className="flex items-center gap-1"><Calendar size={14} /> Due: {new Date(task.deadline).toLocaleDateString()}</span>
                        {task.category && <span className="flex items-center gap-1"><Layers size={14} /> {task.category}</span>}
                    </div>
                </div>
            </div>

            {/* Status Pipeline */}
            <div className="glass-card p-6 overflow-x-auto">
                <div className="flex items-center justify-between min-w-[600px]">
                    {statusSteps.map((step, idx) => {
                        const isCompleted = idx < currentStepIndex;
                        const isCurrent = idx === currentStepIndex;
                        return (
                            <div key={step} className="flex flex-col items-center relative flex-1 group cursor-pointer" onClick={() => handleStatusChange(step)}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 z-10 transition-all ${isCompleted || isCurrent ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-slate-800 border border-gray-600 text-gray-500'
                                    }`}>
                                    {isCompleted ? <Check size={16} /> : isCurrent ? <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" /> : <div className="w-2.5 h-2.5 bg-gray-600 rounded-full" />}
                                </div>
                                <span className={`text-xs font-medium ${isCurrent ? 'text-cyan-400' : isCompleted ? 'text-white' : 'text-gray-500'}`}>
                                    {step}
                                </span>
                                {idx < statusSteps.length - 1 && (
                                    <div className={`absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2 -z-0 ${idx < currentStepIndex ? 'bg-cyan-500' : 'bg-gray-700'
                                        }`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 overflow-x-auto">
                {['workflow', 'overview', 'activity'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm font-medium transition-colors relative ${activeTab === tab ? 'text-cyan-400' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        {tab === 'workflow' ? 'Task Workflow' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="glass-card p-6 min-h-[400px]">
                {activeTab === 'workflow' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                        {/* Resolution Form */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <FileText size={18} className="text-cyan-400" /> Log Task Action
                            </h3>
                            <form onSubmit={handleWorkflowSubmit} className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1">Issue Resolved / Action Taken</label>
                                    <input type="text" className="glass-input w-full"
                                        value={workflowForm.issueResolved}
                                        onChange={e => setWorkflowForm({ ...workflowForm, issueResolved: e.target.value })}
                                        placeholder="Brief title of what you did..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-400 block mb-1">Steps Performed</label>
                                        <textarea className="glass-input w-full h-24 text-xs"
                                            value={workflowForm.stepsPerformed}
                                            onChange={e => setWorkflowForm({ ...workflowForm, stepsPerformed: e.target.value })}
                                            placeholder="- Step 1&#10;- Step 2"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400 block mb-1">Problem Found</label>
                                        <textarea className="glass-input w-full h-24 text-xs"
                                            value={workflowForm.problemFound}
                                            onChange={e => setWorkflowForm({ ...workflowForm, problemFound: e.target.value })}
                                            placeholder="What was the root cause?"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-400 block mb-1">Configuration Changed (if any)</label>
                                    <textarea className="glass-input w-full h-16 text-xs"
                                        value={workflowForm.configurationChanged}
                                        onChange={e => setWorkflowForm({ ...workflowForm, configurationChanged: e.target.value })}
                                        placeholder="e.g. Updated .env, changed DB schema..."
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-400 block mb-1">Resolution Summary</label>
                                    <textarea className="glass-input w-full h-16" required
                                        value={workflowForm.resolutionSummary}
                                        onChange={e => setWorkflowForm({ ...workflowForm, resolutionSummary: e.target.value })}
                                        placeholder="Summary of the resolution..."
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-sm text-gray-400 block mb-1">Remark</label>
                                        <input type="text" className="glass-input w-full"
                                            value={workflowForm.remark}
                                            onChange={e => setWorkflowForm({ ...workflowForm, remark: e.target.value })}
                                        />
                                    </div>
                                    <div className="w-1/3">
                                        <label className="text-sm text-gray-400 block mb-1">Update Status</label>
                                        <select className="glass-input w-full"
                                            value={workflowForm.status}
                                            onChange={e => setWorkflowForm({ ...workflowForm, status: e.target.value })}
                                        >
                                            <option value="">Keep: {task.status}</option>
                                            {statusSteps.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-400 block mb-1">Attachments</label>
                                    <div className="relative">
                                        <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        <div className="glass-input w-full flex items-center gap-2 text-gray-400 border-dashed">
                                            <Paperclip size={16} />
                                            <span className="text-xs">{files.length > 0 ? `${files.length} files selected` : 'Click to upload screenshots/docs'}</span>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="glass-button w-full bg-cyan-600 hover:bg-cyan-500 text-white border-none mt-2 flex items-center justify-center gap-2">
                                    <Send size={16} /> Submit Task Report
                                </button>
                            </form>
                        </div>

                        {/* History */}
                        <div className="border-l border-white/10 pl-6 space-y-6 max-h-[800px] overflow-y-auto">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <History size={18} className="text-purple-400" /> Resolution History
                            </h3>
                            {task.taskUpdates && task.taskUpdates.length > 0 ? (
                                task.taskUpdates.map((update, idx) => (
                                    <div key={idx} className="bg-slate-900/50 p-4 rounded-xl border border-white/5 relative">
                                        <span className="text-xs text-cyan-400 absolute top-4 right-4">{new Date(update.timestamp).toLocaleString()}</span>
                                        <h4 className="text-md font-bold text-white mb-1">{update.issueResolved || 'Update'}</h4>
                                        <p className="text-xs text-gray-400 mb-3">
                                            Status: <span className="text-gray-300">{update.statusSnapshot || 'No Change'}</span>
                                        </p>

                                        <div className="space-y-2 text-sm text-gray-300">
                                            {update.resolutionSummary && (
                                                <div className="bg-white/5 p-2 rounded">
                                                    <span className="text-xs text-gray-500 block uppercase tracking-wider">Summary</span>
                                                    {update.resolutionSummary}
                                                </div>
                                            )}
                                            {update.stepsPerformed && (
                                                <div>
                                                    <span className="text-xs text-gray-500 block uppercase tracking-wider">Steps</span>
                                                    <pre className="whitespace-pre-wrap font-sans text-xs">{update.stepsPerformed}</pre>
                                                </div>
                                            )}
                                            {update.configurationChanged && (
                                                <div>
                                                    <span className="text-xs text-gray-500 block uppercase tracking-wider">Config Changes</span>
                                                    <code className="text-xs text-yellow-300">{update.configurationChanged}</code>
                                                </div>
                                            )}
                                        </div>
                                        {update.attachments && update.attachments.length > 0 && (
                                            <div className="mt-3 flex gap-2">
                                                {update.attachments.map((att, i) => (
                                                    <a key={i} href={`${BASE_URL}/${att}`} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 flex items-center gap-1 hover:underline">
                                                        <Paperclip size={12} /> Attachment {i + 1}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 italic">No resolution logs yet.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-fade-in">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <FileText size={18} className="text-cyan-400" /> Description
                            </h3>
                            <div className="prose prose-invert prose-sm max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: task.description || '<p>No description provided.</p>' }} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <CheckSquare size={18} className="text-emerald-400" /> Requirements
                            </h3>
                            <div className="space-y-2">
                                {task.taskRequirements && task.taskRequirements.length > 0 ? (
                                    task.taskRequirements.map((req, idx) => (
                                        <div key={req._id || idx} onClick={() => handleRequirementToggle(req._id, req.completed)} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${req.completed ? 'bg-emerald-500/10 border-emerald-500/30 opacity-60' : 'bg-slate-800/50 border-white/10 hover:bg-slate-800'}`}>
                                            <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${req.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-500'}`}>
                                                {req.completed && <CheckSquare size={14} />}
                                            </div>
                                            <span className={`text-sm ${req.completed ? 'text-gray-400 line-through' : 'text-gray-200'}`}>{req.text}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 italic">No specific requirements.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="animate-fade-in space-y-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Activity History</h3>
                        {task.activityLog && task.activityLog.length > 0 ? (
                            <div className="relative border-l border-white/10 ml-3 space-y-6">
                                {task.activityLog.map((log, idx) => (
                                    <div key={idx} className="relative pl-6">
                                        <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-cyan-500 ring-4 ring-slate-900"></div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-white">{log.action}</span>
                                            <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                                            {log.details && <p className="text-sm text-gray-300 mt-1 bg-white/5 p-2 rounded">{log.details}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No activity recorded yet.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
