import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Send, FileText, Plus, X, Trash2, Building2, ListChecks, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';


const EmployeeWorkLog = () => {
    const [logs, setLogs] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        type: 'Development',
        duration: '',
        description: '',
        company: ''
    });

    // Company & Steps State
    const [companies, setCompanies] = useState([]);
    const [isCreatingCompany, setIsCreatingCompany] = useState(false);
    const [newCompany, setNewCompany] = useState({ name: '', type: 'Client' });
    const [steps, setSteps] = useState([]);
    const [stepInput, setStepInput] = useState({ text: '', type: 'Development' });

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
        fetchCompanies();
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

    const fetchCompanies = async () => {
        try {
            const res = await api.get('/api/resources/companies');
            setCompanies(res.data);
        } catch (err) {
            console.error("Failed to fetch companies", err);
        }
    };

    const handleCreateCompany = async () => {
        if (!newCompany.name) return;
        try {
            const res = await api.post('/api/resources/companies', { ...newCompany, addedBy: 'Employee' });
            setCompanies([...companies, res.data]);
            setFormData({ ...formData, company: res.data._id });
            setIsCreatingCompany(false);
            setNewCompany({ name: '', type: 'Client' });
        } catch (err) {
            alert('Failed to create company');
        }
    };

    const handleAddStep = () => {
        if (!stepInput.text) return;
        setSteps([...steps, { text: stepInput.text, type: stepInput.type, status: 'Pending' }]);
        setStepInput({ ...stepInput, text: '' });
    };

    const removeStep = (index) => {
        setSteps(steps.filter((_, i) => i !== index));
    };

    const getStepColor = (type) => {
        switch (type) {
            case 'Development': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            case 'Testing': return 'bg-green-500/20 text-green-300 border-green-500/30';
            case 'Design': return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
            case 'Meeting': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
            case 'Bug Fix': return 'bg-red-500/20 text-red-300 border-red-500/30';
            default: return 'bg-slate-700 text-gray-300 border-slate-600';
        }
    };

    const handleSubmit = async (e) => {

        e.preventDefault();
        try {
            const payload = {
                ...formData,
                company: formData.company || null,
                duration: parseDuration(formData.duration),
                steps: steps
            };
            await api.post('/api/work', payload);
            setFormData({ title: '', type: workTypes[0] || '', duration: '', description: '', company: '' });
            setSteps([]);
            fetchLogs();
        } catch (err) {
            console.error("Work Log Check:", err);
            const msg = err.response?.data?.msg || err.response?.data || err.message;
            alert(`Error submitting work log: ${msg}`);
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

                        {/* Company Selection */}
                        <div className="relative">
                            <label className="text-sm text-gray-400 block mb-1 flex justify-between">
                                Company
                                <button type="button" onClick={() => setIsCreatingCompany(!isCreatingCompany)} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                                    <Plus size={12} /> {isCreatingCompany ? 'Cancel' : 'New Company'}
                                </button>
                            </label>

                            {isCreatingCompany ? (
                                <div className="bg-slate-900/90 border border-white/10 rounded-lg p-3 mb-2 animate-fade-in space-y-2">
                                    <input
                                        className="glass-input w-full h-8 text-sm"
                                        placeholder="Company Name"
                                        value={newCompany.name}
                                        onChange={e => setNewCompany({ ...newCompany, name: e.target.value })}
                                    />
                                    <div className="flex gap-2">
                                        <select
                                            className="glass-input flex-1 h-8 text-sm bg-slate-900"
                                            value={newCompany.type}
                                            onChange={e => setNewCompany({ ...newCompany, type: e.target.value })}
                                        >
                                            <option value="Client">Client</option>
                                            <option value="Vendor">Vendor</option>
                                            <option value="Partner">Partner</option>
                                        </select>
                                        <button type="button" onClick={handleCreateCompany} className="px-3 bg-green-600 rounded hover:bg-green-500 text-white text-xs font-bold">
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-2.5 text-gray-500" size={16} />
                                    <select
                                        className="glass-input w-full pl-10 bg-slate-900 appearance-none"
                                        value={formData.company}
                                        onChange={e => setFormData({ ...formData, company: e.target.value })}
                                    >
                                        <option value="">Select Company (Optional)</option>
                                        {companies.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
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


                        {/* Steps Section */}
                        <div className="space-y-3">
                            <label className="text-sm text-gray-400 block flex items-center gap-2">
                                <ListChecks size={16} className="text-cyan-400" /> Steps / Tasks Completed
                            </label>

                            <div className="flex gap-2">
                                <textarea
                                    className="glass-input flex-1 min-w-0 h-20 resize-none py-2"
                                    placeholder="Add detailed step description..."
                                    value={stepInput.text}
                                    onChange={e => setStepInput({ ...stepInput, text: e.target.value })}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleAddStep();
                                        }
                                    }}
                                ></textarea>
                                <div className="flex flex-col gap-2">
                                    <select
                                        className="glass-input w-28 text-xs px-2 bg-slate-900 h-9"
                                        value={stepInput.type}
                                        onChange={e => setStepInput({ ...stepInput, type: e.target.value })}
                                    >
                                        {workTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleAddStep}
                                        className="glass-button h-9 flex items-center justify-center bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/40"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                {steps.map((step, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5 group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${step.type === 'Bug Fix' ? 'bg-red-400' : 'bg-cyan-400'}`}></div>
                                            <span className="text-gray-300 text-sm">{step.text}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] px-2 py-0.5 rounded border ${getStepColor(step.type)}`}>
                                                {step.type}
                                            </span>
                                            <button type="button" onClick={() => removeStep(idx)} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                                    <div className="flex flex-wrap gap-2 text-xs mb-3">
                                        <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">{log.type}</span>
                                        <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 font-mono">
                                            {formatDuration(log.duration)}
                                        </span>
                                        {log.company && (
                                            <span className="bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded border border-orange-500/30 flex items-center gap-1">
                                                <Building2 size={10} /> {typeof log.company === 'object' ? log.company.name : 'Company'}
                                            </span>
                                        )}
                                        {log.steps && log.steps.length > 0 && (
                                            <span className="bg-slate-700/50 text-gray-400 px-2 py-0.5 rounded border border-slate-600 flex items-center gap-1">
                                                <ListChecks size={10} /> {log.steps.length} Steps
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400 line-clamp-2">{log.description}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div >

            {/* Log Details Modal */}
            {
                selectedLog && (
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

                                {selectedLog.steps && selectedLog.steps.length > 0 && (
                                    <div>
                                        <span className="text-sm text-gray-500 uppercase block mb-2 font-bold flex items-center gap-2">
                                            <ListChecks size={14} /> Execution Steps
                                        </span>
                                        <div className="space-y-2">
                                            {selectedLog.steps.map((step, idx) => (
                                                <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                                                    <CheckCircle2 size={16} className={`mt-0.5 ${step.type === 'Testing' ? 'text-green-400' : 'text-cyan-400'}`} />
                                                    <div className="flex-1">
                                                        <p className="text-gray-300 text-sm">{step.text}</p>
                                                        <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded ${getStepColor(step.type)}`}>
                                                            {step.type}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-black/20 text-right">
                                <button onClick={() => setSelectedLog(null)} className="px-4 py-2 text-sm text-gray-300 hover:text-white">Close</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
export default EmployeeWorkLog;
