import { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, FileText } from 'lucide-react';

const EmployeeWorkLog = () => {
    const [logs, setLogs] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        type: 'Development',
        duration: '',
        description: ''
    });

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/work/me');
            setLogs(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/work', formData);
            setFormData({ title: '', type: 'Development', duration: '', description: '' });
            fetchLogs();
        } catch (err) {
            alert('Error submitting work log');
        }
    };

    return (
        <div className="space-y-6">
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
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Type</label>
                            <select
                                className="glass-input w-full bg-slate-900"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option>Development</option>
                                <option>Meeting</option>
                                <option>Bug Fix</option>
                                <option>Documentation</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Duration (minutes)</label>
                            <input
                                required
                                type="number"
                                className="glass-input w-full"
                                placeholder="e.g. 60"
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
                    <div className="space-y-4">
                        {logs.map(log => (
                            <div key={log._id} className="bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-white">{log.title}</h4>
                                    <span className="text-xs text-gray-400">{new Date(log.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex gap-2 text-xs mb-3">
                                    <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">{log.type}</span>
                                    <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">{log.duration} mins</span>
                                </div>
                                <p className="text-sm text-gray-400">{log.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default EmployeeWorkLog;
