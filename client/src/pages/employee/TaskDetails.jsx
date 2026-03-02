import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { BASE_URL } from '../../api/axios';
import {
    ArrowLeft, Calendar, CheckSquare, Flag,
    Send, AlertCircle, Layers, CheckCircle, Check, Plus,
    Download, Eye, X, Upload, MapPin, History,
    ChevronRight, Zap, Shield, Paperclip
} from 'lucide-react';

/* ── Helper: file type icon + is-image ── */
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

/* ── Status config ── */
const STATUS_STEPS = ['Pending', 'In Progress', 'On Hold', 'Resolved', 'Completed'];
const STATUS_COLORS = {
    'Pending': { dot: 'bg-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', ring: 'ring-yellow-400/40' },
    'In Progress': { dot: 'bg-blue-400 animate-pulse', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40', ring: 'ring-blue-400/40' },
    'On Hold': { dot: 'bg-orange-400', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40', ring: 'ring-orange-400/40' },
    'Resolved': { dot: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', ring: 'ring-emerald-400/40' },
    'Completed': { dot: 'bg-green-400', badge: 'bg-green-500/20 text-green-300 border-green-500/40', ring: 'ring-green-400/40' },
};

/* ── Attachment Viewer Modal ── */
function AttachmentViewer({ url, name, onClose }) {
    const isImg = isImageFile(name);
    const isPdf = isPdfFile(name);
    return (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-start overflow-y-auto p-2 sm:p-4 pt-4 sm:pt-10 pb-10" onClick={onClose}>
            <div className="relative max-w-4xl w-full flex flex-col shrink-0 mb-10" style={{ maxHeight: 'calc(100% - 2rem)' }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between bg-slate-900 border border-white/10 rounded-t-2xl px-5 py-3">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFileIcon(name)}</span>
                        <span className="text-white font-medium text-sm truncate max-w-xs">{name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={url}
                            download={name}
                            className="flex items-center gap-1.5 text-xs bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-3 py-1.5 rounded-lg hover:bg-cyan-500/30 transition-colors"
                        >
                            <Download size={13} /> Download
                        </a>
                        <button onClick={onClose} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-slate-950 border-x border-b border-white/10 rounded-b-2xl overflow-auto flex-1 min-h-[60vh] flex items-center justify-center">
                    {isImg ? (
                        <img src={url} alt={name} className="max-w-full max-h-[75vh] object-contain rounded-b-2xl" />
                    ) : isPdf ? (
                        <iframe src={url} title={name} className="w-full h-[75vh] rounded-b-2xl border-0" />
                    ) : (
                        <div className="flex flex-col items-center gap-4 p-12 text-center">
                            <span className="text-6xl">{getFileIcon(name)}</span>
                            <p className="text-gray-300 font-medium">{name}</p>
                            <p className="text-gray-500 text-sm">Preview not available for this file type</p>
                            <a href={url} download={name} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl text-sm transition-colors">
                                <Download size={14} /> Download File
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── File Attachment Thumbnail ── */
function FileThumbnail({ filePath, onRemove }) {
    const name = typeof filePath === 'string' ? getFileName(filePath) : filePath?.name;
    const isImg = isImageFile(name);
    const url = typeof filePath === 'string' ? `${BASE_URL}/${filePath}` : URL.createObjectURL(filePath);
    const [viewer, setViewer] = useState(false);

    return (
        <>
            <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-white/5 flex flex-col items-center gap-1.5 p-2 hover:border-cyan-500/40 transition-all cursor-pointer">
                {isImg ? (
                    <img src={url} alt={name} className="w-full h-20 object-cover rounded-lg" onClick={() => setViewer(true)} />
                ) : (
                    <div className="w-full h-20 flex items-center justify-center text-3xl rounded-lg bg-slate-800/80" onClick={() => setViewer(true)}>
                        {getFileIcon(name)}
                    </div>
                )}
                <p className="text-[10px] text-gray-400 truncate w-full text-center px-1">{name}</p>

                {/* Action Buttons */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity rounded-xl">
                    <button onClick={() => setViewer(true)} className="p-1.5 bg-cyan-500/80 rounded-lg text-white hover:bg-cyan-500">
                        <Eye size={12} />
                    </button>
                    {typeof filePath === 'string' && (
                        <a href={url} download={name} className="p-1.5 bg-emerald-500/80 rounded-lg text-white hover:bg-emerald-500">
                            <Download size={12} />
                        </a>
                    )}
                    {onRemove && (
                        <button onClick={onRemove} className="p-1.5 bg-red-500/80 rounded-lg text-white hover:bg-red-500">
                            <X size={12} />
                        </button>
                    )}
                </div>
            </div>

            {viewer && <AttachmentViewer url={url} name={name} onClose={() => setViewer(false)} />}
        </>
    );
}

/* ── Drag-Drop Upload Zone ── */
function UploadZone({ files, setFiles }) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef(null);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const dropped = Array.from(e.dataTransfer.files);
        setFiles(prev => [...prev, ...dropped]);
    };

    const handleChange = (e) => {
        const selected = Array.from(e.target.files);
        setFiles(prev => [...prev, ...selected]);
        e.target.value = '';
    };

    const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

    return (
        <div className="space-y-3">
            {/* Drop Zone */}
            <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`
                    relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-all
                    ${dragging
                        ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                        : 'border-white/15 hover:border-cyan-500/50 hover:bg-white/3 bg-white/2'
                    }
                `}
            >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${dragging ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-400'}`}>
                    <Upload size={20} />
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-300 font-medium">
                        {dragging ? 'Drop files here' : 'Click or drag files to upload'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Images, PDF, Word, Excel • Max 20MB each</p>
                </div>
                <input ref={inputRef} type="file" multiple onChange={handleChange} className="hidden"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" />
            </div>

            {/* File Grid */}
            {files.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {files.map((f, i) => (
                        <FileThumbnail key={i} filePath={f} onRemove={() => removeFile(i)} />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── Priority Badge ── */
const PriorityBadge = ({ priority }) => {
    const cl = {
        Urgent: 'bg-red-500/20 text-red-300 border-red-500/40',
        High: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        Medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
        Low: 'bg-green-500/20 text-green-300 border-green-500/40',
    };
    return (
        <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${cl[priority] || cl.Low}`}>
            <Flag size={10} className="inline mr-1" />{priority}
        </span>
    );
};

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export default function TaskDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('workflow');
    const [statusUpdating, setStatusUpdating] = useState(false);

    /* Steps state */
    const [stepsList, setStepsList] = useState([]);
    const [currentStep, setCurrentStep] = useState('');

    /* Form */
    const [form, setForm] = useState({
        issueResolved: '',
        problemFound: '',
        configurationChanged: '',
        status: ''
    });
    const [files, setFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => { fetchTask(); }, [id]);

    const fetchTask = async () => {
        try {
            const res = await api.get(`/api/tasks/${id}`);
            setTask(res.data);
        } catch (err) {
            setError(err.response?.data?.msg || err.message || 'Failed to load task');
        } finally {
            setLoading(false);
        }
    };

    const handleAddStep = (e) => {
        e.preventDefault();
        if (!currentStep.trim()) return;
        setStepsList(prev => [...prev, currentStep.trim()]);
        setCurrentStep('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.issueResolved.trim() && stepsList.length === 0 && !form.problemFound.trim()) {
            alert('Please fill in at least one field — Issue Resolved, Steps, or Problem Found.');
            return;
        }
        setSubmitting(true);
        try {
            const fd = new FormData();

            // Steps as HTML
            if (stepsList.length > 0) {
                const stepsHtml = '<div class="space-y-2">' +
                    stepsList.map((s, i) => `<div class="flex gap-3 p-3 rounded-lg border ${i % 2 === 0 ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-purple-500/10 border-purple-500/20'}"><span class="font-bold whitespace-nowrap ${i % 2 === 0 ? 'text-cyan-400' : 'text-purple-400'}">Step ${i + 1}:</span><span class="text-gray-300">${s}</span></div>`).join('') +
                    '</div>';
                fd.append('stepsPerformed', stepsHtml);
            }

            Object.entries(form).forEach(([k, v]) => {
                if (v) fd.append(k, v);
            });

            files.forEach(f => fd.append('attachments', f));

            // Try location
            try {
                const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
                fd.append('location', `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`);
            } catch { }

            const res = await api.post(`/api/tasks/${id}/updates`, fd);
            setTask(res.data);
            setForm({ issueResolved: '', problemFound: '', configurationChanged: '', status: '' });
            setStepsList([]);
            setFiles([]);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            alert('Submit failed: ' + (err.response?.data?.msg || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (newStatus === task.status) return;
        setStatusUpdating(true);
        try {
            let loc = '';
            try {
                const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
                loc = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
            } catch { }
            const res = await api.put(`/api/tasks/${id}`, { status: newStatus, location: loc });
            setTask(res.data);
        } catch {
            alert('Failed to update status');
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleReqToggle = async (reqId, cur) => {
        try {
            const res = await api.put(`/api/tasks/${id}/requirements/${reqId}`, { completed: !cur });
            setTask(res.data);
        } catch (err) { console.error(err); }
    };

    /* ── Loading / Error ── */
    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-gray-400 animate-pulse">Loading task details…</p>
        </div>
    );
    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-red-300 font-semibold">{error}</p>
            <button onClick={() => navigate(-1)} className="glass-button">Go Back</button>
        </div>
    );
    if (!task) return null;

    const currentIdx = STATUS_STEPS.indexOf(task.status);
    const sc = STATUS_COLORS[task.status] || STATUS_COLORS['Pending'];

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">

            {/* ══ Header ══ */}
            <div className="flex items-start gap-4">
                <button onClick={() => navigate(-1)}
                    className="mt-1 p-2 rounded-xl bg-white/6 hover:bg-white/12 border border-white/10 text-gray-300 transition-all hover:scale-105">
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-black text-white leading-tight truncate">{task.title}</h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <PriorityBadge priority={task.priority} />
                        <span className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${sc.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {task.status}
                        </span>
                        {task.category && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                <Layers size={10} className="inline mr-1" />{task.category}
                            </span>
                        )}
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar size={11} /> Due: {new Date(task.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>

            {/* ══ Status Pipeline ══ */}
            <div className="glass-card p-4 sm:p-5">
                <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-widest mb-4">Task Progress</p>
                <div className="flex items-center overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                    {STATUS_STEPS.map((step, idx) => {
                        const done = idx < currentIdx;
                        const current = idx === currentIdx;
                        const stepSc = STATUS_COLORS[step] || {};
                        return (
                            <div key={step} className="flex items-center flex-1 last:flex-none">
                                <button
                                    disabled={statusUpdating}
                                    onClick={() => handleStatusChange(step)}
                                    title={`Set: ${step}`}
                                    className={`
                                        flex flex-col items-center gap-1.5 group transition-all
                                        ${statusUpdating ? 'opacity-60 cursor-wait' : 'cursor-pointer'}
                                    `}
                                >
                                    <div className={`
                                        w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all
                                        ${done ? 'bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/40' : ''}
                                        ${current ? `border-2 ${stepSc.ring || 'ring-cyan-400/40'} bg-white/10 ring-4 ${stepSc.ring || 'ring-cyan-400/20'}` : ''}
                                        ${!done && !current ? 'bg-slate-800/60 border-white/10 text-gray-600 group-hover:border-white/30' : ''}
                                    `}>
                                        {done ? <Check size={14} /> :
                                            current ? <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" /> :
                                                <div className="w-2 h-2 rounded-full bg-gray-600" />}
                                    </div>
                                    <span className={`text-[10px] font-semibold text-center leading-tight w-16
                                        ${current ? 'text-white' : done ? 'text-cyan-300' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                        {step}
                                    </span>
                                </button>
                                {idx < STATUS_STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 mb-5 mx-1 rounded-full transition-colors ${done ? 'bg-cyan-500' : 'bg-white/8'}`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ══ Tabs ══ */}
            <div className="flex border-b border-white/10 gap-1 overflow-x-auto scrollbar-hide">
                {[
                    { key: 'workflow', label: '🛠️ Log Work', icon: CheckSquare },
                    { key: 'overview', label: '📋 Overview', icon: CheckSquare },
                    { key: 'history', label: '📜 History', icon: History },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 sm:px-5 py-3 text-xs sm:text-sm font-semibold relative transition-colors whitespace-nowrap ${activeTab === tab.key ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.key && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* ════════ TAB: WORKFLOW ════════ */}
            {activeTab === 'workflow' && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                    {/* ── Form (Left 3 cols) ── */}
                    <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">

                        {/* Success Animated Overlay */}
                        {success && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in" />
                                <div className="relative flex flex-col items-center gap-6 animate-scale-bounce">
                                    {/* Particles */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0">
                                        {[...Array(15)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="success-particle"
                                                style={{
                                                    '--x': `${(Math.random() - 0.5) * 300}px`,
                                                    '--duration': `${0.8 + Math.random() * 0.7}s`,
                                                    width: `${4 + Math.random() * 8}px`,
                                                    height: `${4 + Math.random() * 8}px`,
                                                }}
                                            />
                                        ))}
                                    </div>

                                    {/* Success Icon */}
                                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center animate-success-glow shadow-2xl shadow-emerald-500/50 border-4 border-white/20">
                                        <Check size={40} className="text-white drop-shadow-lg sm:size-[56px]" strokeWidth={3} />
                                    </div>

                                    {/* Text Content */}
                                    <div className="text-center space-y-2 animate-rotate-in px-4">
                                        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Success!</h2>
                                        <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs">Work log submitted successfully</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Success Banner (legacy fallback) */}
                        {success && (
                            <div className="flex items-center gap-3 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl animate-fade-in">
                                <CheckCircle size={16} /> Task report submitted!
                            </div>
                        )}

                        {/* Issue Resolved */}
                        <div className="glass-card p-5 space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Zap size={11} className="text-cyan-400" /> Issue Resolved / Action Taken
                            </label>
                            <input
                                type="text"
                                className="glass-input w-full text-sm"
                                placeholder="Brief title of what you did…"
                                value={form.issueResolved}
                                onChange={e => setForm(p => ({ ...p, issueResolved: e.target.value }))}
                            />
                        </div>

                        {/* Steps Performed */}
                        <div className="glass-card p-5 space-y-3">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <CheckSquare size={11} className="text-purple-400" /> Steps Performed
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="glass-input flex-1 text-sm"
                                    placeholder="Describe a step and press Enter or +"
                                    value={currentStep}
                                    onChange={e => setCurrentStep(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddStep(e)}
                                />
                                <button type="button" onClick={handleAddStep}
                                    className="px-3 py-2 bg-purple-600/80 hover:bg-purple-500 text-white rounded-xl transition-colors">
                                    <Plus size={16} />
                                </button>
                            </div>
                            {stepsList.length > 0 && (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {stepsList.map((s, i) => (
                                        <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${i % 2 === 0 ? 'bg-cyan-500/8 border-cyan-500/20' : 'bg-purple-500/8 border-purple-500/20'}`}>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${i % 2 === 0 ? 'bg-cyan-500/25 text-cyan-400' : 'bg-purple-500/25 text-purple-400'}`}>
                                                {i + 1}
                                            </span>
                                            <p className="text-sm text-gray-300 flex-1">{s}</p>
                                            <button type="button" onClick={() => setStepsList(p => p.filter((_, j) => j !== i))}
                                                className="text-gray-600 hover:text-red-400 shrink-0 mt-0.5 transition-colors">
                                                <X size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Problem Found */}
                        <div className="glass-card p-5 space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <AlertCircle size={11} className="text-orange-400" /> Problem Found <span className="text-gray-600 font-normal normal-case">• optional</span>
                            </label>
                            <textarea
                                className="glass-input w-full text-sm resize-none h-24"
                                placeholder="Describe the root cause or issue discovered…"
                                value={form.problemFound}
                                onChange={e => setForm(p => ({ ...p, problemFound: e.target.value }))}
                            />
                        </div>

                        {/* Config Changed */}
                        <div className="glass-card p-5 space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Shield size={11} className="text-yellow-400" /> Configuration Changed <span className="text-gray-600 font-normal normal-case">• optional</span>
                            </label>
                            <textarea
                                className="glass-input w-full text-sm resize-none h-16"
                                placeholder="e.g. Updated firewall rules, changed DB schema…"
                                value={form.configurationChanged}
                                onChange={e => setForm(p => ({ ...p, configurationChanged: e.target.value }))}
                            />
                        </div>

                        {/* Update Status — full width standalone card */}
                        <div className="glass-card p-4 sm:p-5 space-y-3 border border-purple-500/20">
                            <label className="text-[10px] sm:text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                                <CheckCircle size={11} /> Update Task Status
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                                {STATUS_STEPS.map(s => {
                                    const icons = { 'Pending': '⏳', 'In Progress': '⚡', 'On Hold': '⏸️', 'Resolved': '✅', 'Completed': '🏆' };
                                    const colors = {
                                        'Pending': 'border-yellow-500/40 text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20',
                                        'In Progress': 'border-blue-500/40 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20',
                                        'On Hold': 'border-orange-500/40 text-orange-300 bg-orange-500/10 hover:bg-orange-500/20',
                                        'Resolved': 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20',
                                        'Completed': 'border-green-500/40 text-green-300 bg-green-500/10 hover:bg-green-500/20',
                                    };
                                    const isSelected = form.status === s;
                                    const isCurrent = !form.status && task.status === s;
                                    return (
                                        <button
                                            type="button"
                                            key={s}
                                            onClick={() => setForm(p => ({ ...p, status: isSelected ? '' : s }))}
                                            className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-center transition-all text-xs font-semibold
                                                ${isSelected
                                                    ? `${colors[s]} ring-2 ring-offset-1 ring-offset-slate-900 scale-105 shadow-lg`
                                                    : isCurrent
                                                        ? `${colors[s]} ring-1 ring-white/20`
                                                        : 'border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300'
                                                }`}
                                        >
                                            <span className="text-base">{icons[s]}</span>
                                            <span className="leading-tight">{s}</span>
                                            {isCurrent && !form.status && (
                                                <span className="text-[9px] opacity-60">current</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            {form.status && (
                                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
                                    Status will change to <span className="text-white font-semibold">{form.status}</span> on submit
                                </p>
                            )}
                        </div>

                        {/* Attachments */}
                        <div className="glass-card p-5 space-y-3">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Paperclip size={11} className="text-cyan-400" /> Attachments
                                <span className="text-gray-600 font-normal normal-case">• images, docs, PDFs — max 20MB each</span>
                            </label>
                            <UploadZone files={files} setFiles={setFiles} />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-white transition-all
                                bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500
                                shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5
                                disabled:opacity-50 disabled:cursor-wait disabled:translate-y-0"
                        >
                            {submitting ? (
                                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting…</>
                            ) : (
                                <><Send size={16} /> Submit Task Report</>
                            )}
                        </button>
                    </form>

                    {/* ── Recent Updates (Right 2 cols) ── */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <History size={13} /> Recent Logs
                        </h3>
                        {task.taskUpdates?.length > 0 ? (
                            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                                {task.taskUpdates.slice(0, 5).map((upd, i) => (
                                    <div key={i} className="glass-card p-4 border border-white/8 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-white truncate">{upd.issueResolved || 'Update'}</p>
                                            <span className="text-[10px] text-gray-500 shrink-0 ml-2">
                                                {new Date(upd.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                        {upd.resolutionSummary && (
                                            <p className="text-xs text-gray-400 line-clamp-2">{upd.resolutionSummary}</p>
                                        )}
                                        {upd.attachments?.length > 0 && (
                                            <div className="grid grid-cols-4 gap-1.5 mt-2">
                                                {upd.attachments.map((att, j) => (
                                                    <FileThumbnail key={j} filePath={att} />
                                                ))}
                                            </div>
                                        )}
                                        {upd.statusSnapshot && (
                                            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-white/8 text-gray-400">
                                                Status: {upd.statusSnapshot}
                                            </span>
                                        )}
                                    </div>
                                ))}
                                {task.taskUpdates.length > 5 && (
                                    <button onClick={() => setActiveTab('history')}
                                        className="w-full text-xs text-cyan-400 hover:text-cyan-300 py-2 border border-white/8 rounded-xl hover:bg-white/5 transition-colors">
                                        View all {task.taskUpdates.length} logs →
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="glass-card p-8 flex flex-col items-center gap-3 text-center border-dashed">
                                <span className="text-4xl">📝</span>
                                <p className="text-sm text-gray-500">No logs yet. Submit your first report!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ════════ TAB: OVERVIEW ════════ */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="glass-card p-6">
                        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                            <Paperclip size={16} className="text-cyan-400" /> Description
                        </h3>
                        <div className="prose prose-invert prose-sm max-w-none text-gray-300"
                            dangerouslySetInnerHTML={{ __html: task.description || '<p class="text-gray-500 italic">No description provided.</p>' }} />
                    </div>

                    {task.taskRequirements?.length > 0 && (
                        <div className="glass-card p-6">
                            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                                <CheckSquare size={16} className="text-emerald-400" /> Requirements
                            </h3>
                            <div className="space-y-2">
                                {task.taskRequirements.map((req, i) => (
                                    <div key={req._id || i}
                                        onClick={() => handleReqToggle(req._id, req.completed)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${req.completed
                                            ? 'bg-emerald-500/8 border-emerald-500/25 opacity-70'
                                            : 'bg-white/4 border-white/8 hover:border-white/20'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${req.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-500'
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
                </div>
            )}

            {/* ════════ TAB: HISTORY ════════ */}
            {activeTab === 'history' && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        {task.taskUpdates?.length || 0} resolution log{task.taskUpdates?.length !== 1 ? 's' : ''}
                    </p>

                    {task.taskUpdates?.length > 0 ? (
                        <div className="relative border-l-2 border-cyan-500/20 ml-4 space-y-6">
                            {task.taskUpdates.map((upd, i) => (
                                <div key={i} className="relative pl-8">
                                    {/* Timeline dot */}
                                    <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-slate-950 border-2 border-cyan-500 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                    </div>

                                    <div className="glass-card p-5 border border-white/8 hover:border-white/14 transition-all space-y-4">
                                        {/* Header */}
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <h4 className="text-base font-bold text-white">{upd.issueResolved || 'Work Update'}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(upd.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {upd.statusSnapshot && (
                                                        <span className="text-xs text-gray-400 bg-white/8 px-2 py-0.5 rounded-full">
                                                            Status: {upd.statusSnapshot}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {upd.location && (
                                                <a href={upd.location} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2 py-1 rounded-lg transition-colors">
                                                    <MapPin size={10} /> Location
                                                </a>
                                            )}
                                        </div>

                                        {/* Resolution Summary */}
                                        {upd.resolutionSummary && (
                                            <div className="bg-slate-900/60 border border-white/6 rounded-xl p-3">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Resolution Summary</p>
                                                <p className="text-sm text-gray-300 leading-relaxed">{upd.resolutionSummary}</p>
                                            </div>
                                        )}

                                        {/* Steps + Problem row */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {upd.stepsPerformed && (
                                                <div className="bg-slate-900/40 border border-white/5 rounded-xl p-3">
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Steps Performed</p>
                                                    <div className="prose prose-invert prose-xs max-w-none text-gray-300"
                                                        dangerouslySetInnerHTML={{ __html: upd.stepsPerformed }} />
                                                </div>
                                            )}
                                            {upd.problemFound && (
                                                <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl p-3">
                                                    <p className="text-xs font-bold text-orange-400/70 uppercase tracking-wider mb-1">Problem Found</p>
                                                    <div className="prose prose-invert prose-xs max-w-none text-gray-300"
                                                        dangerouslySetInnerHTML={{ __html: upd.problemFound }} />
                                                </div>
                                            )}
                                        </div>

                                        {upd.configurationChanged && (
                                            <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-3">
                                                <p className="text-xs font-bold text-yellow-400/70 uppercase tracking-wider mb-1">Config Changes</p>
                                                <code className="text-xs text-yellow-300/80 break-all">{upd.configurationChanged}</code>
                                            </div>
                                        )}

                                        {upd.remark && (
                                            <div className="flex items-start gap-2 text-xs text-gray-400 italic border-t border-white/5 pt-3">
                                                <span className="text-gray-500 shrink-0">Note:</span> {upd.remark}
                                            </div>
                                        )}

                                        {/* Attachments */}
                                        {upd.attachments?.length > 0 && (
                                            <div className="border-t border-white/5 pt-3">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                    <Paperclip size={10} /> Attachments ({upd.attachments.length})
                                                </p>
                                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
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
                        <div className="flex flex-col items-center gap-4 py-16 text-center">
                            <span className="text-5xl">📜</span>
                            <p className="text-gray-400 font-medium">No resolution logs yet</p>
                            <button onClick={() => setActiveTab('workflow')}
                                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                                Log your first update <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
