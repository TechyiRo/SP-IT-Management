import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { BASE_URL } from '../../api/axios';
import {
    ArrowLeft, Calendar, CheckSquare, FileText, User,
    AlertCircle, Layers, CheckCircle, Clock, History,
    Paperclip, Shield, MapPin, Eye, Download, X,
    Image, Check, ChevronDown, Users
} from 'lucide-react';

/* ══ Helpers ══ */
const isImageFile = (name = '') => /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
const isPdfFile = (name = '') => /\.pdf$/i.test(name);
const getFileIcon = (name = '') => {
    if (isImageFile(name)) return '🖼️';
    if (isPdfFile(name)) return '📄';
    if (/\.(doc|docx)$/i.test(name)) return '📝';
    if (/\.(xls|xlsx)$/i.test(name)) return '📊';
    if (/\.(ppt|pptx)$/i.test(name)) return '📋';
    if (/\.(zip|rar)$/i.test(name)) return '🗜️';
    return '📎';
};
const getFileName = (p = '') => p.split(/[/\\]/).pop();

const STATUS_STEPS = ['Pending', 'In Progress', 'On Hold', 'Resolved', 'Completed', 'Cancelled', 'Descoped'];

const STATUS_COLORS = {
    'Pending': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    'In Progress': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    'On Hold': 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    'Resolved': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    'Completed': 'bg-green-500/20 text-green-300 border-green-500/40',
    'Cancelled': 'bg-red-500/20 text-red-300 border-red-500/40',
    'Descoped': 'bg-gray-500/20 text-gray-300 border-gray-500/40',
};

/* ══ Attachment Viewer Modal ══ */
function AttachmentViewer({ url, name, onClose }) {
    const isImg = isImageFile(name);
    const isPdf = isPdfFile(name);
    return (
        <div className="fixed inset-0 z-[9999] bg-black/92 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header bar */}
                <div className="flex items-center justify-between bg-slate-900 border-x border-t border-white/10 rounded-t-2xl px-5 py-3">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFileIcon(name)}</span>
                        <div>
                            <p className="text-white font-semibold text-sm truncate max-w-xs">{name}</p>
                            <p className="text-gray-500 text-xs mt-0.5">Attachment</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={url}
                            download={name}
                            className="flex items-center gap-1.5 text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-3 py-2 rounded-xl hover:bg-emerald-500/25 transition-colors font-medium"
                        >
                            <Download size={13} /> Download
                        </a>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-3 py-2 rounded-xl hover:bg-cyan-500/25 transition-colors font-medium"
                        >
                            <Eye size={13} /> Open
                        </a>
                        <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors border border-white/10">
                            <X size={15} />
                        </button>
                    </div>
                </div>

                {/* Preview */}
                <div className="bg-slate-950 border-x border-b border-white/10 rounded-b-2xl overflow-auto flex-1 min-h-[50vh] flex items-center justify-center">
                    {isImg ? (
                        <img src={url} alt={name} className="max-w-full max-h-[75vh] object-contain" />
                    ) : isPdf ? (
                        <iframe src={url} title={name} className="w-full h-[75vh] border-0" />
                    ) : (
                        <div className="flex flex-col items-center gap-5 p-12 text-center">
                            <span className="text-7xl">{getFileIcon(name)}</span>
                            <p className="text-gray-300 font-semibold text-lg">{name}</p>
                            <p className="text-gray-500 text-sm max-w-xs">Preview not available. Download or open in browser.</p>
                            <a href={url} download={name}
                                className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg">
                                <Download size={15} /> Download File
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ══ File Thumbnail Card ══ */
function FileThumbnail({ filePath }) {
    const name = getFileName(typeof filePath === 'string' ? filePath : filePath?.name || '');
    const isImg = isImageFile(name);
    const url = typeof filePath === 'string' ? `${BASE_URL}/${filePath}` : URL.createObjectURL(filePath);
    const [viewer, setViewer] = useState(false);

    return (
        <>
            <div
                onClick={() => setViewer(true)}
                className="relative group rounded-xl overflow-hidden border border-white/10 bg-white/4 flex flex-col items-center gap-1.5 p-2 hover:border-cyan-500/50 hover:bg-white/8 transition-all cursor-pointer"
            >
                {isImg ? (
                    <img src={url} alt={name} className="w-full h-16 object-cover rounded-lg" />
                ) : (
                    <div className="w-full h-16 flex items-center justify-center text-3xl rounded-lg bg-slate-800/60">
                        {getFileIcon(name)}
                    </div>
                )}
                <p className="text-[10px] text-gray-400 truncate w-full text-center px-1">{name}</p>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1.5 transition-opacity rounded-xl">
                    <Eye size={14} className="text-white" />
                    <span className="text-[9px] text-white font-medium">View</span>
                </div>
            </div>

            {viewer && <AttachmentViewer url={url} name={name} onClose={() => setViewer(false)} />}
        </>
    );
}

/* ══ Priority Badge ══ */
const PriorityBadge = ({ priority }) => {
    const map = {
        Urgent: 'bg-red-500/20 text-red-300 border-red-500/40',
        High: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        Medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
        Low: 'bg-green-500/20 text-green-300 border-green-500/40',
    };
    return (
        <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${map[priority] || map.Low}`}>
            {priority}
        </span>
    );
};

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export default function AdminTaskDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('tracking');
    const [saving, setSaving] = useState(false);

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
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/api/users');
            setUsers(res.data);
        } catch (err) { console.error(err); }
    };

    const handleAdminUpdate = async () => {
        setSaving(true);
        try {
            const updateData = {};
            if (newStatus && newStatus !== task.status) updateData.status = newStatus;

            const currentAssigned = task.assignedTo?.[0]?._id;
            if (reassignId && reassignId !== currentAssigned) {
                updateData.assignedTo = [reassignId];
            }

            if (adminRemark) {
                updateData.adminNotes = (task.adminNotes ? task.adminNotes + '\n' : '') + `[Admin]: ${adminRemark}`;
            }

            await api.put(`/api/tasks/${id}`, updateData);
            setAdminRemark('');
            fetchTaskDetails();
        } catch (err) {
            const msg = err.response?.data?.msg || err.message || 'Unknown Error';
            alert(`Update Failed: ${msg}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
            <p className="text-gray-400 animate-pulse">Loading task…</p>
        </div>
    );
    if (!task) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-red-300">Task not found</p>
            <button onClick={() => navigate('/admin/tasks')} className="glass-button">Back to Tasks</button>
        </div>
    );

    const sc = STATUS_COLORS[task.status] || 'bg-gray-500/20 text-gray-300 border-gray-500/40';
    const totalAttachments = task.taskUpdates?.reduce((acc, u) => acc + (u.attachments?.length || 0), 0) || 0;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">

            {/* ══ Header ══ */}
            <div className="flex items-start gap-4">
                <button onClick={() => navigate('/admin/tasks')}
                    className="mt-1 p-2 rounded-xl bg-white/6 hover:bg-white/12 border border-white/10 text-gray-300 transition-all hover:scale-105">
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h1 className="text-2xl font-black text-white">{task.title}</h1>
                        <PriorityBadge priority={task.priority} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${sc}`}>
                            {task.status}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar size={12} /> Due: {new Date(task.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <User size={12} /> {task.assignedTo?.map(u => u.fullName).join(', ') || 'Unassigned'}
                        </span>
                        {task.category && (
                            <span className="flex items-center gap-1 text-xs text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-full border border-purple-500/30">
                                <Layers size={10} /> {task.category}
                            </span>
                        )}
                        {totalAttachments > 0 && (
                            <span className="flex items-center gap-1 text-xs text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                                <Paperclip size={10} /> {totalAttachments} attachment{totalAttachments !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ══ Main Grid ══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Tabs + Content */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Tabs */}
                    <div className="flex border-b border-white/10 gap-1">
                        {[
                            { key: 'tracking', label: '📋 Resolution Logs' },
                            { key: 'details', label: '📄 Task Details' },
                            { key: 'activity', label: '⏱️ Activity' },
                        ].map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`px-5 py-3 text-sm font-semibold relative transition-colors ${activeTab === tab.key ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                                    }`}>
                                {tab.label}
                                {activeTab === tab.key && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* ── Tab: Tracking ── */}
                    {activeTab === 'tracking' && (
                        <div className="space-y-4">
                            {task.taskUpdates?.length > 0 ? (
                                <div className="relative border-l-2 border-purple-500/20 ml-4 space-y-5">
                                    {task.taskUpdates.map((upd, i) => (
                                        <div key={i} className="relative pl-8">
                                            <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-slate-950 border-2 border-purple-500 z-10" />

                                            <div className="glass-card p-5 border border-white/8 hover:border-white/14 transition-all space-y-4">
                                                {/* Header */}
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <h4 className="text-base font-bold text-white">{upd.issueResolved || 'Work Update'}</h4>
                                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(upd.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            {upd.statusSnapshot && (
                                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[upd.statusSnapshot] || 'bg-gray-500/20 text-gray-300 border-gray-500/40'}`}>
                                                                    {upd.statusSnapshot}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {upd.location && (
                                                        <a href={upd.location} target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 px-2.5 py-1.5 rounded-xl transition-colors">
                                                            <MapPin size={10} /> View Location
                                                        </a>
                                                    )}
                                                </div>

                                                {/* Resolution Summary */}
                                                {upd.resolutionSummary && (
                                                    <div className="bg-slate-900/60 border border-white/6 rounded-xl p-4">
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Resolution Summary</p>
                                                        <p className="text-sm text-gray-200 leading-relaxed">{upd.resolutionSummary}</p>
                                                    </div>
                                                )}

                                                {/* Steps + Problem */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {upd.stepsPerformed && (
                                                        <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-3">
                                                            <p className="text-[10px] font-bold text-blue-400/70 uppercase tracking-widest mb-2">Steps Performed</p>
                                                            <div className="prose prose-invert prose-xs max-w-none text-gray-300"
                                                                dangerouslySetInnerHTML={{ __html: upd.stepsPerformed }} />
                                                        </div>
                                                    )}
                                                    {upd.problemFound && (
                                                        <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl p-3">
                                                            <p className="text-[10px] font-bold text-orange-400/70 uppercase tracking-widest mb-1.5">Problem Found</p>
                                                            <div className="prose prose-invert prose-xs max-w-none text-gray-300"
                                                                dangerouslySetInnerHTML={{ __html: upd.problemFound }} />
                                                        </div>
                                                    )}
                                                </div>

                                                {upd.configurationChanged && (
                                                    <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-3">
                                                        <p className="text-[10px] font-bold text-yellow-400/70 uppercase tracking-widest mb-1">Config Changes</p>
                                                        <code className="text-xs text-yellow-300/80">{upd.configurationChanged}</code>
                                                    </div>
                                                )}

                                                {upd.remark && (
                                                    <div className="flex items-start gap-2 text-xs text-gray-400 italic border-t border-white/5 pt-3">
                                                        <span className="text-gray-600 shrink-0">Remark:</span> {upd.remark}
                                                    </div>
                                                )}

                                                {/* ── Attachments ── */}
                                                {upd.attachments?.length > 0 && (
                                                    <div className="border-t border-white/8 pt-4">
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                            <Paperclip size={10} /> Attachments ({upd.attachments.length})
                                                        </p>
                                                        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                                                            {upd.attachments.map((att, j) => (
                                                                <FileThumbnail key={j} filePath={att} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4 py-20 text-center border-2 border-dashed border-gray-700/50 rounded-2xl">
                                    <span className="text-5xl">📋</span>
                                    <p className="text-gray-400 font-medium">No resolution logs yet</p>
                                    <p className="text-gray-600 text-sm">Employee hasn't submitted any updates</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Tab: Details ── */}
                    {activeTab === 'details' && (
                        <div className="space-y-5">
                            <div className="glass-card p-6">
                                <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                                    <FileText size={15} className="text-cyan-400" /> Description
                                </h3>
                                <div className="prose prose-invert prose-sm max-w-none text-gray-300"
                                    dangerouslySetInnerHTML={{ __html: task.description || '<p class="text-gray-500 italic">No description provided.</p>' }} />
                            </div>

                            {task.taskRequirements?.length > 0 && (
                                <div className="glass-card p-6">
                                    <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                                        <CheckSquare size={15} className="text-emerald-400" /> Requirements
                                    </h3>
                                    <div className="space-y-2">
                                        {task.taskRequirements.map((req, i) => (
                                            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${req.completed ? 'bg-emerald-500/8 border-emerald-500/25 opacity-70' : 'bg-white/3 border-white/8'
                                                }`}>
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${req.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-500'
                                                    }`}>
                                                    {req.completed && <Check size={11} className="text-white" />}
                                                </div>
                                                <span className={`text-sm ${req.completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                                    {req.text}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {task.adminNotes && (
                                <div className="glass-card p-6 border border-purple-500/20">
                                    <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Shield size={13} /> Admin Notes
                                    </h3>
                                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{task.adminNotes}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Tab: Activity ── */}
                    {activeTab === 'activity' && (
                        <div className="space-y-4">
                            {task.activityLog?.length > 0 ? (
                                <div className="relative border-l-2 border-white/10 ml-4 space-y-5">
                                    {task.activityLog.map((log, i) => (
                                        <div key={i} className="relative pl-8">
                                            <div className="absolute -left-1.5 top-2 w-3 h-3 rounded-full bg-cyan-500 ring-4 ring-slate-900" />
                                            <div className="glass-card p-4 border border-white/8">
                                                <p className="text-sm font-semibold text-white">{log.action}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(log.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {log.user?.fullName && (
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            <User size={10} /> {log.user.fullName}
                                                        </span>
                                                    )}
                                                </div>
                                                {log.details && (
                                                    <p className="text-xs text-gray-400 mt-2 bg-white/4 px-3 py-2 rounded-lg border border-white/6">
                                                        {log.details}
                                                    </p>
                                                )}
                                                {log.location && (
                                                    <a href={log.location} target="_blank" rel="noopener noreferrer"
                                                        className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300">
                                                        <MapPin size={10} /> View Location
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 py-16 text-center">
                                    <span className="text-4xl">⏱️</span>
                                    <p className="text-gray-500">No activity recorded yet</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ══ Right Sidebar: Admin Controls ══ */}
                <div className="space-y-5">

                    {/* Admin Control Panel */}
                    <div className="glass-card p-6 space-y-5 border-t-2 border-purple-500">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <Shield size={16} className="text-purple-400" /> Admin Controls
                        </h3>

                        {/* Change Status */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Change Status</label>
                            <select
                                className="glass-input w-full text-sm"
                                value={newStatus}
                                onChange={e => setNewStatus(e.target.value)}
                            >
                                {STATUS_STEPS.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        {/* Reassign */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                <Users size={10} /> Reassign Task
                            </label>
                            <select
                                className="glass-input w-full text-sm"
                                value={reassignId}
                                onChange={e => setReassignId(e.target.value)}
                            >
                                <option value="">— Select Employee —</option>
                                {users.filter(u => u.role === 'employee').map(u => (
                                    <option key={u._id} value={u._id}>{u.fullName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Admin Remark */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Internal Note</label>
                            <textarea
                                className="glass-input w-full h-20 text-sm resize-none"
                                placeholder="Add an internal admin note…"
                                value={adminRemark}
                                onChange={e => setAdminRemark(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handleAdminUpdate}
                            disabled={saving}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all
                                bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500
                                shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5
                                disabled:opacity-50 disabled:translate-y-0 disabled:cursor-wait"
                        >
                            {saving ? (
                                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
                            ) : (
                                <><CheckCircle size={16} /> Update Task</>
                            )}
                        </button>
                    </div>

                    {/* Meta Info Card */}
                    <div className="glass-card p-5 space-y-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Task Meta</h4>
                        <div className="space-y-3 text-sm">
                            {[
                                { label: 'Created', value: new Date(task.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                                { label: 'Updated', value: new Date(task.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                                { label: 'Created By', value: task.assignedBy?.fullName || 'Admin' },
                                { label: 'Total Logs', value: `${task.taskUpdates?.length || 0} update${task.taskUpdates?.length !== 1 ? 's' : ''}` },
                                { label: 'Attachments', value: `${totalAttachments} file${totalAttachments !== 1 ? 's' : ''}` },
                            ].map(item => (
                                <div key={item.label} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                                    <span className="text-gray-500 text-xs">{item.label}</span>
                                    <span className="text-gray-200 text-xs font-medium">{item.value}</span>
                                </div>
                            ))}
                            {task.location && (
                                <a href={task.location} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center justify-between py-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                                    <span className="text-gray-500">Last Location</span>
                                    <span className="flex items-center gap-1"><MapPin size={11} /> View Map</span>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Quick Attachments Preview */}
                    {totalAttachments > 0 && (
                        <div className="glass-card p-5 space-y-3">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Paperclip size={10} /> All Attachments ({totalAttachments})
                            </h4>
                            <div className="grid grid-cols-4 gap-2">
                                {task.taskUpdates?.flatMap(u => u.attachments || []).slice(0, 12).map((att, i) => (
                                    <FileThumbnail key={i} filePath={att} />
                                ))}
                            </div>
                            {totalAttachments > 12 && (
                                <p className="text-xs text-gray-500 text-center">+{totalAttachments - 12} more in resolution logs</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
