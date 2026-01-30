import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Search, X, FileText, CheckCircle, AlertTriangle, Link as LinkIcon, Paperclip, Clock, Calendar, User, Briefcase } from 'lucide-react';

const WorkDetails = () => {
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/api/work');
            setLogs(res.data);
        } catch (err) {
            console.error('Error fetching logs:', err);
        }
    };

    const filteredLogs = logs.filter(l =>
        l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.employee?.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    return (
        <div className="space-y-6 pb-20">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">Employee Work Logs</h1>

            {/* Search Bar */}
            <div className="glass-card p-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        className="glass-input w-full pl-9 py-2 text-sm"
                        placeholder="Search logs by employee or title..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Logs Table */}
            <div className="glass-card overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 border-b border-white/10 uppercase text-xs text-gray-400">
                        <tr>
                            <th className="p-4 font-semibold">Date</th>
                            <th className="p-4 font-semibold">Employee</th>
                            <th className="p-4 font-semibold">Title</th>
                            <th className="p-4 font-semibold">Type</th>
                            <th className="p-4 font-semibold text-right">Duration</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {filteredLogs.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">No work logs found.</td></tr>
                        ) : (
                            filteredLogs.map(log => (
                                <tr
                                    key={log._id}
                                    onClick={() => setSelectedLog(log)}
                                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                                >
                                    <td className="p-4 text-sm text-gray-400 whitespace-nowrap">{formatDate(log.date)}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
                                                {log.employee?.fullName?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">{log.employee?.fullName}</p>
                                                <p className="text-[10px] text-gray-500">{log.employee?.designation || 'Employee'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-gray-300 group-hover:text-white transition-colors">{log.title}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs border ${log.type === 'Development' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                log.type === 'Bug Fix' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    log.type === 'Meeting' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                            }`}>
                                            {log.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-300 text-right font-mono">{log.duration} mins</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setSelectedLog(null)}>
                    <div className="glass-card w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col relative" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-start bg-white/5">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">{selectedLog.title}</h2>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(selectedLog.date)}</span>
                                    <span className="flex items-center gap-1"><Clock size={14} /> {selectedLog.duration} mins</span>
                                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${selectedLog.status === 'Complete' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                            selectedLog.status === 'Working' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                        }`}>
                                        {selectedLog.status}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                            {/* Employee Info */}
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center font-bold text-white shadow-md">
                                    {selectedLog.employee?.fullName?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{selectedLog.employee?.fullName}</p>
                                    <p className="text-xs text-gray-400">Logged by {selectedLog.employee?.designation || 'Employee'}</p>
                                </div>
                            </div>

                            {/* Description */}
                            {selectedLog.description && (
                                <div>
                                    <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <FileText size={16} /> Description
                                    </h3>
                                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap pl-6 border-l-2 border-white/10">
                                        {selectedLog.description}
                                    </p>
                                </div>
                            )}

                            {/* Key Points */}
                            {selectedLog.keyPoints && selectedLog.keyPoints.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <CheckCircle size={16} /> Key Achievements
                                    </h3>
                                    <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 pl-6">
                                        {selectedLog.keyPoints.map((point, i) => (
                                            <li key={i}>{point}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Challenges & Solutions */}
                            {(selectedLog.issuesFaced || selectedLog.solutionsImplemented) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedLog.issuesFaced && (
                                        <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl">
                                            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <AlertTriangle size={16} /> Challenges
                                            </h3>
                                            <p className="text-sm text-gray-300">{selectedLog.issuesFaced}</p>
                                        </div>
                                    )}
                                    {selectedLog.solutionsImplemented && (
                                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl">
                                            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <CheckCircle size={16} /> Solution
                                            </h3>
                                            <p className="text-sm text-gray-300">{selectedLog.solutionsImplemented}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Links & Attachments */}
                            {(selectedLog.links?.length > 0 || selectedLog.attachments?.length > 0) && (
                                <div className="border-t border-white/10 pt-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Resources</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedLog.links?.map((link, i) => (
                                            <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 text-xs transition-colors">
                                                <LinkIcon size={12} /> Link {i + 1}
                                            </a>
                                        ))}
                                        {selectedLog.attachments?.map((att, i) => (
                                            <a key={i} href={att} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 text-xs transition-colors">
                                                <Paperclip size={12} /> Attachment {i + 1}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default WorkDetails;
