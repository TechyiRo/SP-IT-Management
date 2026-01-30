import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Send, FileText, Plus, X, Trash2 } from 'lucide-react';

const EmployeeWorkLog = () => {
    const [logs, setLogs] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        type: 'Development',
        duration: '',
        description: ''
    });

    // Type Management State
    const defaultTypes = ['Development', 'Meeting', 'Bug Fix', 'Documentation', 'Learning', 'Testing'];

    const [workTypes, setWorkTypes] = useState(() => {
        const saved = localStorage.getItem('employeeWorkTypesList'); // Changed key to avoid conflict with old structure
        return saved ? JSON.parse(saved) : defaultTypes;
    });

    const [showTypeManager, setShowTypeManager] = useState(false);
    const [newTypeInput, setNewTypeInput] = useState('');

    // Log Details Modal State
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    useEffect(() => {
        localStorage.setItem('employeeWorkTypesList', JSON.stringify(workTypes));
    }, [workTypes]);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/api/work/me');
            setLogs(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Helper to format minutes to HH:MM display
    const formatDuration = (mins) => {
        if (!mins) return '0m';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0 && m > 0) return `${h}h ${m}m`;
        if (h > 0) return `${h}h`;
        return `${m}m`;
    };

    // Helper to parse "1:30" or "90" to total minutes
    const parseDuration = (input) => {
        if (!input) return 0;
        const str = input.toString();
        if (str.includes(':')) {
            const [h, m] = str.split(':').map(Number);
            return (h || 0) * 60 + (m || 0);
        }
        return parseInt(str, 10) || 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                duration: parseDuration(formData.duration)
            };
            await api.post('/api/work', payload);
            setFormData({ title: '', type: workTypes[0] || '', duration: '', description: '' });
            fetchLogs();
        } catch (err) {
            alert('Error submitting work log');
        }
    };

    const handleAddType = (e) => {
        e.preventDefault();
        const val = newTypeInput.trim();
        if (val && !workTypes.includes(val)) {
            setWorkTypes([...workTypes, val]);
            setFormData({ ...formData, type: val });
            setNewTypeInput('');
        }
    };

    const handleRemoveType = (typeToRemove) => {
        const newTypes = workTypes.filter(t => t !== typeToRemove);
        setWorkTypes(newTypes);
        // If currently selected type was deleted, switch to the first available or empty
        if (formData.type === typeToRemove) {
            setFormData({ ...formData, type: newTypes.length > 0 ? newTypes[0] : '' });
        }
    };

    return (
        <div className="space-y-6 relative">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">Daily Work Log</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="lg:col-span-1 glass-card p-6 h-fit">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-400" />
                        Log Work
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Work Title</label>
                            <input
                                required
                                className="glass-input w-full"
                                placeholder="What did you do?"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        {/* Dynamic Type Selection */}
                        <div className="relative">
                            <label className="text-sm text-gray-400 block mb-1 flex justify-between">
                                Type
                                <button type="button" onClick={() => setShowTypeManager(!showTypeManager)} className="text-xs text-cyan-400 hover:text-cyan-300">
                                    {showTypeManager ? 'Close Manager' : 'Manage Types'}
                                </button>
                            </label>

                            {showTypeManager ? (
                                <div className="bg-slate-900/90 border border-white/10 rounded-lg p-3 mb-2 animate-fade-in">
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            className="glass-input flex-1 h-8 text-xs"
                                            placeholder="New type..."
                                            value={newTypeInput}
                                            onChange={e => setNewTypeInput(e.target.value)}
                                        />
                                        <button type="button" onClick={handleAddType} className="p-2 bg-cyan-600 rounded hover:bg-cyan-500 text-white">
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <div className="max-h-32 overflow-y-auto space-y-1">
                                        {workTypes.map(t => (
                                            <div key={t} className="flex justify-between items-center text-xs bg-white/5 p-1.5 rounded">
                                                <span className="text-gray-300">{t}</span>
                                                <button type="button" onClick={() => handleRemoveType(t)} className="text-red-400 hover:text-red-300">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <select
                                    className="glass-input w-full bg-slate-900"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    {workTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            )}
                        </div>

                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Duration (HH:MM or Minutes)</label>
                            <input
                                required
                                type="text"
                                className="glass-input w-full"
                                placeholder="e.g. 1:30 or 90"
                                value={formData.duration}
                                onChange={e => setFormData({ ...formData, duration: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Description</label>
                            <textarea
                                className="glass-input w-full h-32 resize-none"
                                placeholder="Details..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            ></textarea>
                        </div>
                        <button type="submit" className="glass-button w-full flex justify-center items-center gap-2">
                            <Send className="w-4 h-4" />
                            Submit Log
                        </button>
                    </form>
                </div>

                {/* History */}
                <div className="lg:col-span-2 glass-card p-6">
                    <h3 className="text-lg font-bold mb-4">Recent Logs</h3>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                        {logs.length === 0 ? (
                            <p className="text-gray-500 text-center py-10">No work logs found.</p>
                        ) : (
                            logs.map(log => (
                                <div
                                    key={log._id}
                                    onClick={() => setSelectedLog(log)}
                                    className="bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors">{log.title}</h4>
                                        <span className="text-xs text-gray-400">{new Date(log.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex gap-2 text-xs mb-3">
                                        <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">{log.type}</span>
                                        <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 font-mono">
                                            {formatDuration(log.duration)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400 line-clamp-2">{log.description}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Log Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setSelectedLog(null)}>
                    <div className="glass-card w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/10 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-white">{selectedLog.title}</h2>
                                <p className="text-sm text-gray-400 mt-1">Logged on {new Date(selectedLog.date).toLocaleString()}</p>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-white p-1">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex gap-4">
                                <div className="bg-white/5 rounded-lg p-3 flex-1">
                                    <span className="text-xs text-gray-500 uppercase block mb-1">Work Type</span>
                                    <span className="text-purple-300 font-medium">{selectedLog.type}</span>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 flex-1">
                                    <span className="text-xs text-gray-500 uppercase block mb-1">Duration</span>
                                    <span className="text-blue-300 font-medium">{formatDuration(selectedLog.duration)}</span>
                                </div>
                            </div>

                            <div>
                                <span className="text-sm text-gray-500 uppercase block mb-2">Description</span>
                                <div className="bg-white/5 rounded-lg p-4 text-gray-300 whitespace-pre-wrap leading-relaxed border border-white/5">
                                    {selectedLog.description}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-black/20 text-right">
                            <button onClick={() => setSelectedLog(null)} className="px-4 py-2 text-sm text-gray-300 hover:text-white">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default EmployeeWorkLog;
