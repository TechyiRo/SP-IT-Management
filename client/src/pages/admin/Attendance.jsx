import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
    Calendar, Search, MapPin, Clock, UserCheck, CheckCircle, 
    XCircle, AlertCircle, Edit, Briefcase, Sun, Umbrella, 
    RefreshCw, Filter, CalendarDays, Plus, Trash2, 
    Info, TrendingUp, Users, ChevronRight, Activity, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminAttendance = () => {
    const [activeTab, setActiveTab] = useState('approvals');
    const [attendance, setAttendance] = useState([]);
    const [users, setUsers] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [pendingRequests, setPendingRequests] = useState([]);

    // Holiday Form Modal
    const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
    const [holidayForm, setHolidayForm] = useState({
        date: '',
        title: '',
        description: '',
        type: 'Public'
    });

    // Edit Attendance Modal
    const [editingRecord, setEditingRecord] = useState(null);
    const [editForm, setEditForm] = useState({
        status: '',
        checkInTime: '',
        checkOutTime: '',
        remarks: ''
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [attendanceRes, usersRes, holidaysRes] = await Promise.all([
                api.get('/api/attendance'),
                api.get('/api/users'),
                api.get('/api/holidays')
            ]);
            
            setAttendance(attendanceRes.data);
            processPendingRequests(attendanceRes.data);
            setUsers(usersRes.data.filter(u => u.role === 'employee'));
            setHolidays(holidaysRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const processPendingRequests = (data) => {
        const pending = [];
        data.forEach(record => {
            if (record.checkIn?.status === 'Pending') pending.push({ ...record, reqType: 'Check-In' });
            if (record.checkOut?.status === 'Pending') pending.push({ ...record, reqType: 'Check-Out' });
            if (record.halfDay?.status === 'Pending' && record.halfDay?.isRequested) pending.push({ ...record, reqType: 'Half Day' });
            if (record.leave?.status === 'Pending' && record.leave?.isRequested) pending.push({ ...record, reqType: 'Leave' });
        });
        setPendingRequests(pending.sort((a, b) => new Date(b.date) - new Date(a.date)));
    };

    const handleAction = async (id, action, remarks = '') => {
        try {
            await api.put(`/api/attendance/${id}/action`, { action, remarks });
            fetchAllData();
        } catch (err) {
            alert('Action Failed');
        }
    };

    const handleHolidaySubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/holidays', holidayForm);
            setIsHolidayModalOpen(false);
            setHolidayForm({ date: '', title: '', description: '', type: 'Public' });
            fetchAllData();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to add holiday');
        }
    };

    const deleteHoliday = async (id) => {
        if (!window.confirm('Remove this holiday?')) return;
        try {
            await api.delete(`/api/holidays/${id}`);
            fetchAllData();
        } catch (err) {
            alert('Delete failed');
        }
    };

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
            const baseDate = new Date(editingRecord.date).toDateString();
            const checkInDate = editForm.checkInTime ? new Date(`${baseDate} ${editForm.checkInTime}`) : null;
            const checkOutDate = editForm.checkOutTime ? new Date(`${baseDate} ${editForm.checkOutTime}`) : null;

            await api.put(`/api/attendance/${editingRecord._id}`, {
                status: editForm.status,
                checkInTime: checkInDate,
                checkOutTime: checkOutDate,
                remarks: editForm.remarks
            });
            setEditingRecord(null);
            fetchAllData();
        } catch (err) {
            alert('Update Failed');
        }
    };

    const filteredAttendance = attendance.filter(record => {
        const matchesSearch = (record.employee?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesUser = selectedUser === 'all' || record.employee?._id === selectedUser;
        const recordDate = new Date(record.date);
        const matchesMonth = recordDate.getMonth() + 1 === parseInt(selectedMonth);
        const matchesYear = recordDate.getFullYear() === parseInt(selectedYear);
        return matchesSearch && matchesUser && matchesMonth && matchesYear;
    });

    const formatTime = (dateString) => {
        if (!dateString) return '--:--';
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const TabButton = ({ id, label, icon: Icon, count }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-3 px-8 py-5 transition-all duration-500 relative group ${
                activeTab === id 
                ? 'text-white' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
        >
            <Icon size={18} className={activeTab === id ? 'text-indigo-500' : 'group-hover:text-slate-400'} />
            <span className="text-sm font-black uppercase tracking-widest">{label}</span>
            {count > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-black text-white shadow-lg shadow-indigo-500/40">
                    {count}
                </span>
            )}
            {activeTab === id && (
                <motion.div 
                    layoutId="activeTabBorder"
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                />
            )}
        </button>
    );

    const StatusBadge = ({ status }) => {
        const styles = {
            'Present': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5',
            'Absent': 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/5',
            'Half Day': 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5',
            'On Leave': 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-purple-500/5',
            'Checked-Out': 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/5',
            'Over Work': 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20 shadow-fuchsia-500/5',
            'Holiday': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-indigo-500/5'
        };
        return (
            <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border backdrop-blur-md shadow-lg flex items-center gap-2.5 w-max ${styles[status] || 'bg-slate-800/50 text-slate-400 border-white/5'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${status === 'Present' ? 'bg-emerald-400 animate-pulse' : 'bg-current'}`}></div>
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-10 pb-32 animate-fade-in">
            {/* Command Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                            <CalendarDays className="w-8 h-8 text-indigo-500" />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                            Attendance <span className="text-indigo-500 not-italic">Console</span>
                        </h1>
                    </div>
                    <p className="text-slate-500 font-bold ml-16 flex items-center gap-2 text-sm">
                        <Activity className="w-4 h-4 text-indigo-500/50" /> System monitoring active | Operational v2.0
                    </p>
                </div>
                
                <div className="flex items-center gap-4 ml-16 lg:ml-0">
                    <button 
                        onClick={fetchAllData}
                        className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all duration-500 hover:bg-white/10 active:scale-95 shadow-xl"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={() => setIsHolidayModalOpen(true)}
                        className="glass-button flex items-center gap-3"
                    >
                        <Plus size={18} /> Add Holiday
                    </button>
                </div>
            </div>

            {/* Navigation Nexus */}
            <div className="glass-card p-0 flex flex-wrap border-white/5 bg-black/20 overflow-hidden">
                <TabButton id="approvals" label="Pending Signal" icon={TrendingUp} count={pendingRequests.length} />
                <TabButton id="roster" label="Roster Grid" icon={Briefcase} />
                <TabButton id="holidays" label="Holiday Logic" icon={Umbrella} />
            </div>

            <AnimatePresence mode="wait">
                {/* Tab: Signals (Approvals) */}
                {activeTab === 'approvals' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                    >
                        {pendingRequests.length === 0 ? (
                            <div className="col-span-full glass-card py-32 flex flex-col items-center gap-6 justify-center text-center opacity-50 border-dashed border-white/10 italic">
                                <Zap className="w-16 h-16 text-slate-800" />
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-white tracking-tight">QUIET SECTOR</h3>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No incoming data signals detected</p>
                                </div>
                            </div>
                        ) : (
                            pendingRequests.map((req) => (
                                <motion.div 
                                    layout
                                    key={`${req._id}-${req.reqType}`}
                                    className="glass-card group overflow-hidden border-white/5 hover:border-indigo-500/30 transition-all duration-700"
                                >
                                    {/* Action Border */}
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-600 shadow-[0_0_15px_rgba(99,102,241,0.3)]"></div>
                                    
                                    <div className="p-8 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-2xl font-black text-white shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                                    {req.employee?.fullName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-white text-lg tracking-tight group-hover:text-indigo-400 transition-colors">{req.employee?.fullName}</h3>
                                                    <div className="flex gap-2 items-center mt-1">
                                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">{req.employee?.employeeId}</span>
                                                        <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                                                        <span className="text-[10px] text-indigo-500/80 font-black uppercase tracking-widest leading-none">{formatDate(req.date)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black text-white uppercase tracking-tighter">
                                                    {req.reqType}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-black/40 rounded-3xl p-5 border border-white-[0.03] space-y-4 shadow-inner">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500 font-bold uppercase tracking-widest">Protocol Time</span>
                                                <div className="flex items-center gap-2 text-white font-mono font-bold bg-white/5 px-3 py-1 rounded-xl">
                                                    <Clock size={12} className="text-indigo-500" />
                                                    {formatTime(req[req.reqType === 'Check-In' ? 'checkIn' : req.reqType === 'Check-Out' ? 'checkOut' : req.reqType === 'Half Day' ? 'halfDay' : 'leave']?.time)}
                                                </div>
                                            </div>
                                            
                                            {req.location && (
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-500 font-bold uppercase tracking-widest">Geolocation</span>
                                                    <a href={req.location} target="_blank" className="flex items-center gap-2 text-indigo-400 font-black hover:text-indigo-300 transition-colors">
                                                        <MapPin size={12} /> SECURE SIGNAL
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        {(() => {
                                            const key = req.reqType === 'Check-In' ? 'checkIn' : req.reqType === 'Check-Out' ? 'checkOut' : req.reqType === 'Half Day' ? 'halfDay' : 'leave';
                                            return req[key]?.remarks ? (
                                                <div className="relative p-4 rounded-2xl bg-white/[0.02] border border-white/5 italic text-sm text-slate-400 font-medium">
                                                    <span className="absolute -top-3 left-4 px-2 bg-[#0a0a0a] text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Employee Note</span>
                                                    "{req[key].remarks}"
                                                </div>
                                            ) : null;
                                        })()}

                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <button 
                                                onClick={() => handleAction(req._id, `approve_${req.reqType.toLowerCase().replace(/[\s-]/g, '')}`)}
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-500 shadow-xl shadow-indigo-500/20 active:scale-95"
                                            >
                                                Authorize
                                            </button>
                                            <button 
                                                onClick={() => handleAction(req._id, `reject_${req.reqType.toLowerCase().replace(/[\s-]/g, '')}`)}
                                                className="bg-white/5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 border border-white/5 rounded-2xl p-4 font-black text-xs uppercase tracking-widest transition-all duration-500 active:scale-95"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                )}

                {/* Tab: GRID (Roster) */}
                {activeTab === 'roster' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                    >
                        {/* High-Intelligence Filters */}
                        <div className="glass-card p-8 flex flex-col xl:flex-row gap-8 items-center justify-between border-indigo-500/10 shadow-2xl">
                            <div className="flex flex-wrap gap-5 items-center w-full xl:w-auto">
                                <div className="relative flex-1 sm:flex-none">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                    <input 
                                        type="text" 
                                        placeholder="Scan database..." 
                                        className="glass-input w-full sm:w-80 pl-14 font-black italic tracking-wide h-14" 
                                        value={searchTerm} 
                                        onChange={(e) => setSearchTerm(e.target.value)} 
                                    />
                                </div>
                                <div className="relative group flex-1 sm:flex-none">
                                     <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-hover:text-indigo-500 transition-colors" />
                                     <select 
                                        className="glass-input w-full sm:w-64 pl-14 font-black uppercase tracking-widest appearance-none h-14 cursor-pointer"
                                        value={selectedUser}
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                    >
                                        <option value="all">Global Matrix</option>
                                        {users.map(u => <option key={u._id} value={u._id}>{u.fullName}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 bg-black/40 p-2 rounded-3xl border border-white/5 w-full xl:w-auto">
                                <div className="flex items-center gap-4 px-6 border-r border-white/10 group">
                                    <Calendar className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                                    <select 
                                        className="bg-transparent text-white outline-none border-none font-black text-sm p-4 cursor-pointer uppercase tracking-widest"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                    >
                                        {[...Array(12)].map((_, i) => (
                                            <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="px-6 group">
                                    <select 
                                        className="bg-transparent text-white outline-none border-none font-black text-sm p-4 cursor-pointer tracking-widest"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                    >
                                        <option value="2026">2026</option>
                                        <option value="2025">2025</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Data Roster Table */}
                        <div className="glass-card overflow-hidden border-white/5 bg-black/30 shadow-2xl">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-white/[0.02] border-b border-white/5 text-[9px] uppercase font-black text-slate-600 tracking-[0.4em]">
                                        <tr>
                                            <th className="p-8">Personnel Entity</th>
                                            <th className="p-8">Timeline</th>
                                            <th className="p-8">Check-In Signal</th>
                                            <th className="p-8">Check-Out Signal</th>
                                            <th className="p-8">Total Uptime</th>
                                            <th className="p-8">Status Registry</th>
                                            <th className="p-8 text-right">Overrides</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.02]">
                                        {filteredAttendance.length === 0 ? (
                                            <tr><td colSpan="7" className="p-32 text-center text-slate-700 font-black uppercase tracking-widest">No encrypted data logs found</td></tr>
                                        ) : (
                                            filteredAttendance.map(record => (
                                                <tr key={record._id} className="hover:bg-white/[0.03] transition-all group backdrop-blur-sm">
                                                    <td className="p-8">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-white shadow-inner border border-white/10 group-hover:border-indigo-500/50 transition-all duration-500">
                                                                {record.employee?.fullName?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="text-white text-sm font-black tracking-tight">{record.employee?.fullName || 'Ghost Protocol'}</div>
                                                                <div className="text-[10px] text-slate-600 uppercase font-bold tracking-widest mt-1.5">{record.employee?.employeeId}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-8">
                                                        <div className="text-white font-mono text-xs">{formatDate(record.date)}</div>
                                                    </td>
                                                    <td className="p-8">
                                                        <div className={`font-mono text-sm ${record.checkIn?.time ? "text-indigo-400 font-bold" : "text-slate-800"}`}>
                                                            {record.checkIn?.time ? formatTime(record.checkIn.time) : '--:--:--'}
                                                        </div>
                                                    </td>
                                                    <td className="p-8">
                                                        <div className={`font-mono text-sm ${record.checkOut?.time ? "text-fuchsia-400 font-bold" : "text-slate-800"}`}>
                                                            {record.checkOut?.time ? formatTime(record.checkOut.time) : '--:--:--'}
                                                        </div>
                                                    </td>
                                                    <td className="p-8">
                                                        {record.duration ? (
                                                            <div className="inline-flex items-center gap-2 text-cyan-400 font-mono text-xs bg-cyan-500/5 px-4 py-2 rounded-2xl border border-cyan-500/10 shadow-lg shadow-cyan-500/5">
                                                                <Zap size={10} className="fill-current" />
                                                                {Math.floor(record.duration / 60)}H {record.duration % 60}M
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-800 font-black">∅ NULL</span>
                                                        )}
                                                    </td>
                                                    <td className="p-8">
                                                        <StatusBadge status={record.status} />
                                                    </td>
                                                    <td className="p-8 text-right">
                                                        <button 
                                                            onClick={() => openEditModal(record)} 
                                                            className="p-4 bg-white/5 hover:bg-indigo-500/20 rounded-2xl text-slate-500 hover:text-indigo-400 transition-all border border-white/5 hover:border-indigo-500/30 active:scale-95 shadow-xl"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Tab: HOLIDAYS */}
                {activeTab === 'holidays' && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-10 max-w-6xl mx-auto"
                    >
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                            {/* Summary List */}
                            <div className="glass-card p-10 bg-black/30 border-indigo-500/20 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Umbrella size={200} className="text-white" />
                                </div>
                                <div className="flex items-center gap-5 mb-12">
                                    <div className="p-4 bg-indigo-500 rounded-3xl shadow-xl shadow-indigo-500/30"><Umbrella className="text-white" size={28} /></div>
                                    <div>
                                        <h3 className="text-3xl font-black text-white italic">Calendar Hub</h3>
                                        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-600 mt-1">Scheduled System Pauses</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-5">
                                    {holidays.length === 0 ? (
                                        <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                            <p className="text-slate-600 font-black uppercase tracking-widest text-sm">No scheduled downtime entries</p>
                                        </div>
                                    ) : (
                                        holidays.map(h => (
                                            <motion.div 
                                                layout
                                                key={h._id} 
                                                className="flex items-center justify-between p-6 bg-white/[0.03] rounded-[2rem] border border-white/5 hover:border-indigo-500/30 transition-all duration-500 group relative shadow-xl"
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex flex-col items-center justify-center border border-white/10 shadow-2xl group-hover:scale-110 transition-transform duration-700">
                                                        <span className="text-[10px] uppercase font-black text-indigo-500 leading-none">{new Date(h.date).toLocaleString('default', { month: 'short' })}</span>
                                                        <span className="text-2xl font-black text-white mt-1 leading-none">{new Date(h.date).getDate()}</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-white text-xl tracking-tight leading-tight group-hover:text-indigo-400 transition-colors uppercase italic">{h.title}</h4>
                                                        <span className={`text-[9px] uppercase font-black tracking-[0.3em] px-4 py-1.5 rounded-full mt-2.5 inline-block border backdrop-blur-xl ${
                                                            h.type === 'Public' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20'
                                                        }`}>
                                                            {h.type} PROTOCOL
                                                        </span>
                                                    </div>
                                                </div>
                                                <button onClick={() => deleteHoliday(h._id)} className="p-4 hover:bg-rose-500/20 text-slate-700 hover:text-rose-500 transition-all duration-500 rounded-2xl lg:opacity-0 group-hover:opacity-100 shadow-xl border border-white/5">
                                                    <Trash2 size={18} />
                                                </button>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Info + Control Card */}
                            <div className="space-y-8">
                                 <div className="glass-card p-10 bg-gradient-to-br from-indigo-600/20 to-purple-800/20 border-indigo-500/20 backdrop-blur-3xl relative overflow-hidden group shadow-2xl">
                                    <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]"></div>
                                    <TrendingUp className="text-white absolute right-[-40px] top-[-40px] w-64 h-64 opacity-5 group-hover:rotate-12 transition-transform duration-1000" />
                                    <h3 className="text-4xl font-black text-white mb-6 uppercase tracking-tighter italic">Strategic Control</h3>
                                    <p className="text-slate-400 font-bold mb-10 leading-relaxed text-sm bg-black/20 p-6 rounded-3xl border border-white/5 italic">
                                        Defining global holidays automates payroll logic, ensuring accurate financial calculations across the personnel matrix without manual interference.
                                    </p>
                                    <button 
                                        onClick={() => setIsHolidayModalOpen(true)}
                                        className="glass-button w-full py-6 flex items-center justify-center gap-4 text-base"
                                    >
                                        <Plus size={22} className="text-white" /> INITIALIZE NEW ENTRY
                                    </button>
                                 </div>

                                 <div className="glass-card p-10 bg-black/40 border-white/5 shadow-2xl">
                                     <h4 className="text-lg font-black text-white flex items-center gap-4 mb-8 uppercase italic">
                                         <Info className="text-indigo-500" /> System Logic Parameters
                                     </h4>
                                     <ul className="space-y-6 font-bold text-slate-500 text-xs">
                                         <li className="flex gap-5 items-start">
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_rgba(99,102,241,1)]"></div> 
                                            <div>
                                                <span className="text-slate-300 uppercase block mb-1">Auto-Synchronization</span>
                                                Encryption-level marking across all employee nodes.
                                            </div>
                                         </li>
                                         <li className="flex gap-5 items-start">
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_rgba(99,102,241,1)]"></div> 
                                            <div>
                                                <span className="text-slate-300 uppercase block mb-1">Overtime Multiplier</span>
                                                Operational duty during scheduled pauses triggers OT logic.
                                            </div>
                                         </li>
                                         <li className="flex gap-5 items-start">
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_rgba(99,102,241,1)]"></div> 
                                            <div>
                                                <span className="text-slate-300 uppercase block mb-1">Global Broadcast</span>
                                                Instantly visible to all personnel via the employee portal.
                                            </div>
                                         </li>
                                     </ul>
                                 </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals Header Shared Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                .modal-blur { backdrop-filter: blur(20px); background: rgba(0,0,0,0.85); }
                .modal-content { background: linear-gradient(145deg, #0f1118 0%, #050505 100%); }
            `}} />

            {/* Holiday Input Terminal (Modal) */}
            {isHolidayModalOpen && (
                <div className="fixed inset-0 modal-blur z-[100] flex items-center justify-center p-6 backdrop-blur-3xl">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="modal-content w-full max-w-xl overflow-hidden rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                    >
                        <div className="p-12 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">New <span className="text-indigo-500 not-italic">Entity</span></h3>
                            <button onClick={() => setIsHolidayModalOpen(false)} className="p-4 bg-white/5 hover:bg-rose-500/20 rounded-2xl text-slate-500 hover:text-rose-500 transition-all duration-500 border border-white/5"><XCircle size={28} /></button>
                        </div>
                        <form onSubmit={handleHolidaySubmit} className="p-12 space-y-10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 font-bold">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black mb-4 block">Calendar Date</label>
                                    <input type="date" required className="glass-input w-full p-5 font-mono" value={holidayForm.date} onChange={e => setHolidayForm({...holidayForm, date: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black mb-4 block">Matrix Type</label>
                                    <select className="glass-input w-full p-5 appearance-none font-black uppercase tracking-widest cursor-pointer" value={holidayForm.type} onChange={e => setHolidayForm({...holidayForm, type: e.target.value})}>
                                        <option value="Public">GLOBAL / PUBLIC</option>
                                        <option value="Company">SECURE / INTERNAL</option>
                                        <option value="Optional">VOLUNTARY / OPT</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black mb-4 block">Event Designation</label>
                                <input type="text" placeholder="e.g., FOUNDATIONAL DAY" required className="glass-input w-full p-5 font-black uppercase italic tracking-wider" value={holidayForm.title} onChange={e => setHolidayForm({...holidayForm, title: e.target.value})} />
                            </div>
                            <button type="submit" className="glass-button w-full py-6 text-base tracking-[0.2em] font-black italic">EXECUTE ENROLLMENT</button>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Manual Override Console (Edit Modal) */}
            {editingRecord && (
                <div className="fixed inset-0 modal-blur z-[100] flex items-center justify-center p-6 backdrop-blur-3xl">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="modal-content w-full max-w-xl overflow-hidden rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                    >
                         <div className="p-12 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Signal <span className="text-indigo-500 not-italic">Override</span></h3>
                            <button onClick={() => setEditingRecord(null)} className="p-4 bg-white/5 hover:bg-rose-500/20 rounded-2xl text-slate-500 hover:text-rose-500 transition-all duration-500 border border-white/5"><XCircle size={28} /></button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-12 space-y-10 font-bold">
                            <div className="bg-black/40 p-6 rounded-3xl border border-white/5 flex items-center gap-6 shadow-inner">
                                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-white text-2xl border border-white/10">
                                    {editingRecord.employee?.fullName?.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-white text-xl font-black italic tracking-wide uppercase">{editingRecord.employee?.fullName}</div>
                                    <div className="text-indigo-500/80 text-[10px] font-black uppercase tracking-[0.4em] mt-1">{formatDate(editingRecord.date)}</div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black mb-4 block">New Status Payload</label>
                                <select className="glass-input w-full p-5 font-black uppercase tracking-widest cursor-pointer" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                                    <option value="Present">PRESENT / ACTIVE</option>
                                    <option value="Absent">ABSENT / NULL</option>
                                    <option value="Half Day">HALF CYCLE / DAY</option>
                                    <option value="On Leave">ON LEAVE / AWAY</option>
                                    <option value="Checked-Out">CHECKED-OUT</option>
                                    <option value="Over Work">EFFICIENCY+ / OVERWORK</option>
                                    <option value="Holiday">PAUSE / HOLIDAY</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black mb-4 block">Inbound Marker</label>
                                    <input type="time" className="glass-input w-full p-5 font-mono" value={editForm.checkInTime} onChange={e => setEditForm({...editForm, checkInTime: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black mb-4 block">Outbound Marker</label>
                                    <input type="time" className="glass-input w-full p-5 font-mono" value={editForm.checkOutTime} onChange={e => setEditForm({...editForm, checkOutTime: e.target.value})} />
                                </div>
                            </div>

                            <button type="submit" className="glass-button w-full py-6 text-base tracking-[0.2em] font-black italic shadow-indigo-500/30">COMMIT CRYPTOGRAPHIC OVERRIDE</button>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AdminAttendance;
