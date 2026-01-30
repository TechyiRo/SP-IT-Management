import { useState, useEffect } from 'react';
import api, { BASE_URL } from '../../api/axios';
import { Calendar, Search, MapPin, Clock, UserCheck, FileText, CheckCircle, XCircle, AlertCircle, Edit, Briefcase, LogOut, Sun, Umbrella } from 'lucide-react';

const Attendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [pendingRequests, setPendingRequests] = useState([]);

    // Edit State
    const [editingRecord, setEditingRecord] = useState(null);
    const [editForm, setEditForm] = useState({
        status: '',
        checkInTime: '',
        checkOutTime: '',
        remarks: ''
    });

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const res = await api.get('/api/attendance');
            setAttendance(res.data);
            processPendingRequests(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching attendance:', err);
            setLoading(false);
        }
    };

    const processPendingRequests = (data) => {
        const pending = [];
        data.forEach(record => {
            // Strict Validation: Only accept requests that have valid data (avoid schema defaults)
            if (record.checkIn?.status === 'Pending') pending.push({ ...record, type: 'checkIn' });

            // For CheckOut: Must have a timestamp
            if (record.checkOut?.status === 'Pending' && record.checkOut?.time) {
                pending.push({ ...record, type: 'checkOut' });
            }

            // For HalfDay: Must be explicitly requested
            if (record.halfDay?.status === 'Pending' && record.halfDay?.isRequested) {
                pending.push({ ...record, type: 'halfDay' });
            }

            // For Leave: Must be explicitly requested
            if (record.leave?.status === 'Pending' && record.leave?.isRequested) {
                pending.push({ ...record, type: 'leave' });
            }
        });
        setPendingRequests(pending.sort((a, b) => new Date(b.date) - new Date(a.date)));
    };

    const handleAction = async (id, action, remarks = '') => {
        try {
            await api.put(`/api/attendance/${id}/action`, { action, remarks });
            fetchAttendance();
        } catch (err) {
            alert('Action Failed');
        }
    };

    // Manual Edit Handlers
    const openEditModal = (record) => {
        setEditingRecord(record);
        setEditForm({
            status: record.status,
            checkInTime: record.checkIn?.time ? new Date(record.checkIn.time).toTimeString().slice(0, 5) : '',
            checkOutTime: record.checkOut?.time ? new Date(record.checkOut.time).toTimeString().slice(0, 5) : '',
            remarks: record.adminRemarks || ''
        });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            // Construct date objects for times
            const baseDate = new Date(editingRecord.date).toDateString();
            const checkInDate = editForm.checkInTime ? new Date(`${baseDate} ${editForm.checkInTime}`) : null;
            const checkOutDate = editForm.checkOutTime ? new Date(`${baseDate} ${editForm.checkOutTime}`) : null;

            await api.put(`/api/attendance/${editingRecord._id}`, {
                status: editForm.status,
                checkInTime: checkInDate,
                checkOutTime: checkOutDate,
                remarks: editForm.remarks
            });

            alert('Record Updated! 💾');
            setEditingRecord(null);
            fetchAttendance();
        } catch (err) {
            console.error(err);
            alert('Update Failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this attendance record? This action cannot be undone.')) return;
        try {
            await api.delete(`/api/attendance/${id}`);
            alert('Record Deleted 🗑️');
            fetchAttendance();
        } catch (err) {
            console.error(err);
            alert('Delete Failed');
        }
    };

    // Filter logic
    const filteredAttendance = attendance.filter(record => {
        const employeeName = record.employee?.fullName || '';
        const employeeId = record.employee?.employeeId || '';
        const matchesSearch = employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employeeId.toLowerCase().includes(searchTerm.toLowerCase());

        const recordDate = new Date(record.date).toISOString().split('T')[0];
        const matchesDate = filterDate ? recordDate === filterDate : true;

        return matchesSearch && matchesDate;
    });

    const formatTime = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            'Present': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            'Absent': 'bg-red-500/10 text-red-400 border-red-500/20',
            'Half Day': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            'On Leave': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
            'Checked-Out': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            'Rejected': 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        };
        const defaultStyle = 'bg-gray-700/50 text-gray-300 border-gray-600';

        let label = status;
        if (status.includes('Pending')) label = '🕒 ' + status;
        else if (status === 'Present') label = '🟢 Present';
        else if (status === 'Absent') label = '🔴 Absent';
        else if (status === 'On Leave') label = '🏖️ On Leave';

        return (
            <span className={`px-2 py-1 rounded-md text-xs border ${styles[status] || defaultStyle}`}>
                {label}
            </span>
        );
    };

    return (
        <div className="space-y-8 pb-20">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 mb-6">Attendance & Approvals</h1>

            {/* Pending Actions */}
            {pendingRequests.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <AlertCircle className="text-yellow-400" /> Pending Requests ({pendingRequests.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingRequests.map((req, index) => (
                            <div key={`${req._id}-${req.type}-${index}`} className="glass-card overflow-hidden flex flex-col relative group hover:border-cyan-500/30 transition-all">
                                {/* Decorator Bar */}
                                <div className={`absolute top-0 left-0 w-1 h-full 
                                    ${req.type === 'checkIn' ? 'bg-emerald-500' :
                                        req.type === 'checkOut' ? 'bg-orange-500' :
                                            req.type === 'leave' ? 'bg-red-500' : 'bg-purple-500'}`}>
                                </div>

                                <div className="p-5 flex-1">
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center font-bold text-white shadow-inner">
                                                {req.employee?.fullName?.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white leading-tight">{req.employee?.fullName}</h3>
                                                <p className="text-xs text-gray-400">{req.employee?.employeeId}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-opacity-20 
                                            ${req.type === 'checkIn' ? 'bg-emerald-500 text-emerald-300' :
                                                req.type === 'checkOut' ? 'bg-orange-500 text-orange-300' :
                                                    req.type === 'leave' ? 'bg-red-500 text-red-300' : 'bg-purple-500 text-purple-300'}`}>
                                            {req.type === 'checkIn' ? 'Check In' :
                                                req.type === 'checkOut' ? 'Check Out' :
                                                    req.type === 'leave' ? 'Leave' : 'Half Day'}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-3 mb-4">
                                        {req.type === 'checkIn' && (
                                            <div className="text-sm">
                                                <div className="flex items-center gap-2 text-gray-300 mb-1"><Clock size={14} className="text-emerald-400" /> {formatTime(req.checkIn.time)}</div>
                                                <div className="flex items-center gap-2 text-gray-300">
                                                    <MapPin size={14} className="text-cyan-400" />
                                                    {req.location && req.location.startsWith('http') ? (
                                                        <a href={req.location} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">View Location</a>
                                                    ) : (
                                                        req.location || 'Office'
                                                    )}
                                                </div>
                                                {req.checkIn.remarks && <p className="text-xs text-gray-500 mt-2 italic">"{req.checkIn.remarks}"</p>}
                                            </div>
                                        )}
                                        {req.type === 'checkOut' && (
                                            <div className="text-sm">
                                                <div className="flex items-center gap-2 text-gray-300 mb-1"><Clock size={14} className="text-orange-400" /> {formatTime(req.checkOut.time)}</div>
                                                {req.checkOut.remarks && <p className="text-xs text-gray-500 mt-2 italic">"{req.checkOut.remarks}"</p>}
                                            </div>
                                        )}
                                        {req.type === 'halfDay' && (
                                            <div className="text-sm">
                                                <div className="flex items-center gap-2 text-gray-300 mb-1"><Sun size={14} className="text-purple-400" /> {req.halfDay.type}</div>
                                                <p className="text-xs text-gray-300 mt-2 bg-white/5 p-2 rounded">"{req.halfDay.reason}"</p>
                                                {req.halfDay.attachment && <a href={`${BASE_URL}/${req.halfDay.attachment}`} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300 mt-2 inline-flex items-center gap-1"><FileText size={12} /> Attachment</a>}
                                            </div>
                                        )}
                                        {req.type === 'leave' && (
                                            <div className="text-sm">
                                                <div className="flex items-center gap-2 text-gray-300 mb-1"><Umbrella size={14} className="text-red-400" /> Full Day Leave</div>
                                                <p className="text-xs text-gray-300 mt-2 bg-white/5 p-2 rounded">"{req.leave.reason}"</p>
                                                {req.leave.attachment && <a href={`${BASE_URL}/${req.leave.attachment}`} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300 mt-2 inline-flex items-center gap-1"><FileText size={12} /> Attachment</a>}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="p-4 bg-black/20 border-t border-white/5 flex gap-3">
                                    <button
                                        onClick={() => handleAction(req._id, `approve_${req.type.toLowerCase()}`)}
                                        className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white py-2 rounded-lg text-sm font-medium shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={16} /> Approve
                                    </button>
                                    <button
                                        onClick={() => handleAction(req._id, `reject_${req.type.toLowerCase()}`)}
                                        className="flex-1 bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-400 border border-white/10 hover:border-red-500/30 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                                    >
                                        <XCircle size={16} /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by employee name or ID..."
                        className="glass-input w-full pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="text-gray-400 text-sm">Filter Date:</span>
                    <input type="date" className="glass-input" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                    {filterDate && <button onClick={() => setFilterDate('')} className="text-cyan-400 text-sm">Clear</button>}
                </div>
            </div>

            {/* Main Table */}
            <div className="glass-card overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10 uppercase text-xs text-gray-400">
                        <tr>
                            <th className="p-4 font-semibold">Employee</th>
                            <th className="p-4 font-semibold">Date</th>
                            <th className="p-4 font-semibold">Check In</th>
                            <th className="p-4 font-semibold">Location</th>
                            <th className="p-4 font-semibold">Check Out</th>
                            <th className="p-4 font-semibold">Duration</th>
                            <th className="p-4 font-semibold">Status</th>
                            <th className="p-4 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {loading ? (
                            <tr><td colSpan="7" className="p-8 text-center animate-pulse text-gray-400">Loading records...</td></tr>
                        ) : filteredAttendance.length === 0 ? (
                            <tr><td colSpan="7" className="p-8 text-center text-gray-500">No attendance records found</td></tr>
                        ) : (
                            filteredAttendance.map(record => (
                                <tr key={record._id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div>
                                            <div className="font-medium text-white">{record.employee?.fullName || 'Unknown'}</div>
                                            <div className="text-xs text-gray-400">{record.employee?.employeeId}</div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-300 whitespace-nowrap">{formatDate(record.date)}</td>
                                    <td className="p-4 text-emerald-400 font-mono text-sm">
                                        {record.checkIn?.time ? formatTime(record.checkIn.time) : '-'}
                                    </td>
                                    <td className="p-4 text-gray-300 text-sm">
                                        {record.location && record.location.startsWith('http') ? (
                                            <a href={record.location} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                                                <MapPin size={14} /> View
                                            </a>
                                        ) : (
                                            <span className="flex items-center gap-1 text-gray-500">
                                                <MapPin size={14} /> {record.location || '-'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-orange-400 font-mono text-sm">
                                        {record.checkOut?.time ? formatTime(record.checkOut.time) : '-'}
                                    </td>
                                    <td className="p-4 text-cyan-300 font-mono text-sm">
                                        {record.duration ? `${Math.floor(record.duration / 60)}h ${record.duration % 60}m` : '-'}
                                    </td>
                                    <td className="p-4">
                                        <StatusBadge status={record.status} />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEditModal(record)}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-300 transition-colors"
                                                title="Edit Manually"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(record._id)}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-300 transition-colors"
                                                title="Delete Record"
                                            >
                                                <LogOut size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingRecord && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="glass-card p-6 w-full max-w-md relative">
                        <button
                            onClick={() => setEditingRecord(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <XCircle size={20} />
                        </button>

                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Edit className="text-cyan-400" /> Edit Attendance
                        </h2>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Status</label>
                                <select
                                    className="glass-input w-full"
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                >
                                    <option value="Present">Present</option>
                                    <option value="Absent">Absent</option>
                                    <option value="Half Day">Half Day</option>
                                    <option value="On Leave">On Leave</option>
                                    <option value="Checked-Out">Checked-Out</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Check In Time</label>
                                    <input
                                        type="time"
                                        className="glass-input w-full"
                                        value={editForm.checkInTime}
                                        onChange={(e) => setEditForm({ ...editForm, checkInTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Check Out Time</label>
                                    <input
                                        type="time"
                                        className="glass-input w-full"
                                        value={editForm.checkOutTime}
                                        onChange={(e) => setEditForm({ ...editForm, checkOutTime: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Admin Remarks</label>
                                <textarea
                                    className="glass-input w-full"
                                    rows="2"
                                    value={editForm.remarks}
                                    onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setEditingRecord(null)}
                                    className="px-4 py-2 rounded-lg hover:bg-white/10 text-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-lg shadow-cyan-900/20 transition-all"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Attendance;
