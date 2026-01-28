import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Search, User } from 'lucide-react';

const WorkDetails = () => {
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/work');
            setLogs(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const filteredLogs = logs.filter(l =>
        l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.employee?.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">Employee Work Logs</h1>

            <div className="glass-card p-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input className="glass-input w-full pl-9 py-2 text-sm" placeholder="Search logs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10 uppercase text-xs text-gray-400">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Employee</th>
                            <th className="p-4">Title</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Duration</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {filteredLogs.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">No work logs found.</td></tr>
                        ) : filteredLogs.map(log => (
                            <tr key={log._id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 text-sm text-gray-400">{new Date(log.date).toLocaleDateString()}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-[10px] font-bold">
                                            {log.employee?.fullName.charAt(0)}
                                        </div>
                                        <span className="text-sm font-medium">{log.employee?.fullName}</span>
                                    </div>
                                </td>
                                <td className="p-4 font-medium text-white">{log.title}</td>
                                <td className="p-4"><span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">{log.type}</span></td>
                                <td className="p-4 text-sm text-gray-300">{log.duration} mins</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default WorkDetails;
