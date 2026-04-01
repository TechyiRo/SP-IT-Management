import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
    Clock, MapPin, CheckCircle, XCircle, AlertCircle, FileText, 
    Upload, Calendar, ChevronRight, TrendingUp, Briefcase, 
    Umbrella, CalendarDays, MousePointer2, Smartphone, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const EmployeeAttendance = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('checkin');
    const [loading, setLoading] = useState(true);
    const [todayRecord, setTodayRecord] = useState(null);
    const [history, setHistory] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Request Forms
    const [showHalfDayForm, setShowHalfDayForm] = useState(false);
    const [halfDayForm, setHalfDayForm] = useState({ reason: '', type: 'First Half', file: null });
    
    const [showLeaveForm, setShowLeaveForm] = useState(false);
    const [leaveForm, setLeaveForm] = useState({ reason: '', file: null });

    // Forgotten Check-out
    const [forgotRecord, setForgotRecord] = useState(null);
    const [forgotCheckOutTime, setForgotCheckOutTime] = useState('');
    const [overtimeMinutes, setOvertimeMinutes] = useState(0);
    const [forgotReason, setForgotReason] = useState('');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        fetchData();
        return () => clearInterval(timer);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [attendanceRes, holidaysRes] = await Promise.all([
                api.get('/api/attendance/me'),
                api.get('/api/holidays')
            ]);
            
            setHistory(attendanceRes.data);
            setHolidays(holidaysRes.data);

            const today = new Date().toDateString();
            const record = attendanceRes.data.find(a => new Date(a.date).toDateString() === today);
            setTodayRecord(record || null);

            // Check for forgotten checkout
            const forgot = attendanceRes.data.find(a => a.forgotCheckOut === true);
            setForgotRecord(forgot || null);

            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleCheckInRequest = async () => {
        if (!navigator.geolocation) {
            alert('Geolocation missing, falling back to manual...');
        }

        const getPos = () => new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));

        try {
            setLoading(true);
            let locationLink = 'Manual Check-in';
            try {
                const pos = await getPos();
                locationLink = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
            } catch (posErr) {
                console.warn('Location Access Denied');
            }

            await api.post('/api/attendance/check-in', { location: locationLink, remarks: 'Portal Request' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.msg || 'Request Error');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOutRequest = async () => {
        try {
            await api.post('/api/attendance/check-out', { remarks: 'Portal Logout' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.msg || 'Checkout Error');
        }
    };

    const handleHalfDaySubmit = async (e) => {
        e.preventDefault();
        try {
            const fd = new FormData();
            fd.append('reason', halfDayForm.reason);
            fd.append('type', halfDayForm.type);
            if (halfDayForm.file) fd.append('attachment', halfDayForm.file);

            await api.post('/api/attendance/half-day', fd);
            setShowHalfDayForm(false);
            fetchData();
        } catch (err) {
            alert('Request Failed');
        }
    };

    const handleLeaveSubmit = async (e) => {
        e.preventDefault();
        try {
            const fd = new FormData();
            fd.append('reason', leaveForm.reason);
            if (leaveForm.file) fd.append('attachment', leaveForm.file);

            await api.post('/api/attendance/leave', fd);
            setShowLeaveForm(false);
            fetchData();
        } catch (err) {
            alert('Request Failed');
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        try {
            const baseDate = new Date(forgotRecord.date).toDateString();
            await api.post(`/api/attendance/forgot-checkout/${forgotRecord._id}`, {
                checkOutTime: `${baseDate} ${forgotCheckOutTime}`,
                overtimeMinutes: Number(overtimeMinutes),
                reason: forgotReason
            });
            fetchData();
        } catch (err) {
            alert('Failed to submit missing checkout');
        }
    };

    const getStatusDisplay = () => {
        if (!todayRecord) return { text: "Offline", emoji: "🔴", action: "checkin", color: "from-rose-500 to-red-600" };
        const { checkIn, checkOut, halfDay, leave, status } = todayRecord;
        
        if (leave?.status === 'Pending') return { text: "Leave Pending", action: "wait", color: "from-orange-400 to-red-400" };
        if (leave?.status === 'Approved') return { text: "On Leave", action: "done", color: "from-amber-400 to-orange-500" };
        if (halfDay?.status === 'Pending') return { text: "Half-Day Pending", action: "wait", color: "from-purple-400 to-indigo-500" };

        if (checkIn?.status === 'Pending') {
             const isAfter530 = currentTime.getHours() > 17 || (currentTime.getHours() === 17 && currentTime.getMinutes() >= 30);
             if (isAfter530) return { text: "Ready to Exit", action: "checkout", color: "from-blue-400 to-purple-600" };
             return { text: "Awaiting Entry", action: "wait", color: "from-emerald-400 to-blue-500" };
        }

        if (checkIn?.status === 'Approved') {
            if (checkOut?.status === 'Pending') return { text: "Logout Pending", action: "wait", color: "from-blue-500 to-indigo-600" };
            if (checkOut?.status === 'Approved') return { text: "Shift Completed", action: "done", color: "from-emerald-500 to-blue-600" };
            return { text: "On Duty", action: "checkout", color: "from-emerald-500 to-cyan-500" };
        }

        if (status === 'Forgot Check-Out') return { text: "Action Needed", action: "forgot", color: "from-rose-600 to-black" };
        return { text: status, action: "none", color: "from-gray-700 to-slate-900" };
    };

    const sInfo = getStatusDisplay();

    const NavTab = ({ id, label, icon: Icon }) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center gap-2 py-4 border-b-2 transition-all font-black text-[10px] uppercase tracking-widest ${
                activeTab === id ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-gray-600 hover:text-gray-400'
            }`}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    return (
        <div className="space-y-10 pb-32 max-w-7xl mx-auto font-sans">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-400 to-blue-500 tracking-tighter">
                        Attendance <span className="underline decoration-cyan-500/30">Vault</span>
                    </h1>
                    <div className="flex items-center gap-4 mt-3">
                         <div className="px-4 py-1.5 bg-slate-900/50 border border-white/10 rounded-full text-gray-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-inner">
                            <ShieldCheck size={12} className="text-cyan-500" /> Secure Terminal
                        </div>
                        <div className="px-4 py-1.5 bg-slate-900/50 border border-white/10 rounded-full text-gray-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-inner">
                            <Smartphone size={12} className="text-blue-500" /> GPS Verified
                        </div>
                    </div>
                </div>
                
                <div className="bg-slate-900/80 shadow-2xl backdrop-blur-xl border border-white/10 rounded-[2rem] px-8 py-6 flex flex-col items-end group hover:border-cyan-500/30 transition-all">
                    <div className="text-[10px] uppercase font-black text-gray-500 tracking-[0.3em] mb-1">Standard Time</div>
                    <div className="text-4xl font-mono font-black text-white group-hover:text-cyan-400 transition-colors tracking-tighter">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </div>
                    <div className="text-[10px] font-bold text-gray-600 mt-1 uppercase tracking-widest">
                        {currentTime.toLocaleDateString('en-US', { day: 'numeric', month: 'long', weekday: 'short' })}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden flex shadow-inner">
                <NavTab id="checkin" label="Access Control" icon={MousePointer2} />
                <NavTab id="history" label="Activity Log" icon={Briefcase} />
                <NavTab id="holidays" label="Calendar & Holidays" icon={Umbrella} />
            </div>

            {activeTab === 'checkin' && (
                <div className="space-y-12 animate-fade-in-up">
                    {/* Visual Status Card */}
                    <div className="relative group p-1 w-full bg-gradient-to-br from-white/10 via-transparent to-white/5 rounded-[3rem] shadow-2xl">
                         <div className={`rounded-[2.9rem] bg-gradient-to-br ${sInfo.color} p-12 md:p-20 text-center relative overflow-hidden transition-all duration-700`}>
                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 animate-pulse"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4"></div>
                            
                            <div className="relative z-10 flex flex-col items-center">
                                <span className={`text-[10px] uppercase font-black tracking-[0.5em] text-white/60 mb-6 bg-black/20 px-6 py-2 rounded-full border border-white/10 shadow-lg`}>
                                    System Protocol: {sInfo.text}
                                </span>
                                
                                {sInfo.action === 'checkin' && (
                                    <div className="space-y-10 w-full max-w-sm">
                                        <button 
                                            onClick={handleCheckInRequest}
                                            className="w-full bg-white text-gray-900 py-6 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 group"
                                        >
                                            <MousePointer2 className="group-hover:rotate-12 transition-transform" /> Sign In
                                        </button>
                                        <div className="grid grid-cols-2 gap-6">
                                             <button onClick={() => setShowLeaveForm(true)} className="bg-black/20 hover:bg-black/40 text-white py-4 rounded-3xl font-bold text-xs uppercase border border-white/10 transition-all">Request Leave</button>
                                             <button onClick={() => setShowHalfDayForm(true)} className="bg-black/20 hover:bg-black/40 text-white py-4 rounded-3xl font-bold text-xs uppercase border border-white/10 transition-all">Half Day</button>
                                        </div>
                                    </div>
                                )}

                                {sInfo.action === 'checkout' && (
                                    <div className="space-y-8 w-full max-w-sm">
                                        <button 
                                            onClick={handleCheckOutRequest}
                                            className="w-full bg-black text-white py-6 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4"
                                        >
                                            Sign Out <LogOut size={22} className="animate-pulse" />
                                        </button>
                                        <div className="text-white/60 text-xs font-bold font-mono tracking-widest">Shift Progress: Standard 09:00 - 17:30</div>
                                    </div>
                                )}

                                {sInfo.action === 'wait' && (
                                    <div className="p-10 bg-white/10 backdrop-blur-3xl rounded-[3rem] border border-white/20 shadow-xl max-w-md w-full animate-pulse">
                                         <h3 className="text-2xl font-black text-white italic">"Scanning Authorization..."</h3>
                                         <p className="text-white/60 text-sm mt-3 font-bold">Please wait until admin approves your entry request.</p>
                                    </div>
                                )}

                                {sInfo.action === 'done' && (
                                    <div className="p-10 bg-emerald-500/20 backdrop-blur-3xl rounded-[3rem] border border-emerald-400/20 shadow-xl max-w-md w-full">
                                         <CheckCircle className="text-white mx-auto mb-6" size={64} />
                                         <h3 className="text-3xl font-black text-white">Day Complete</h3>
                                         <p className="text-white/70 text-sm mt-3 font-bold">Shift successfully synchronized. Your activity has been logged.</p>
                                    </div>
                                )}
                            </div>
                         </div>
                    </div>

                    {/* Modals for Leave/Half-day (Inlined for simplicity in Employee section) */}
                    {(showLeaveForm || showHalfDayForm) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             {showLeaveForm && (
                                 <div className="glass-card p-10 bg-slate-900 border-orange-500/30 animate-fade-in-up">
                                     <div className="flex justify-between items-center mb-8">
                                         <h3 className="text-2xl font-black text-white flex items-center gap-4">
                                            <Umbrella className="text-orange-500" /> Full Day Leave
                                         </h3>
                                         <button onClick={() => setShowLeaveForm(false)} className="text-gray-600 hover:text-white"><XCircle /></button>
                                     </div>
                                     <form onSubmit={handleLeaveSubmit} className="space-y-6">
                                          <textarea 
                                            required 
                                            className="glass-input w-full p-5 font-bold" 
                                            placeholder="Elaborate the reason explicitly..." 
                                            rows="3"
                                            value={leaveForm.reason}
                                            onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})}
                                          />
                                          <button className="w-full bg-orange-600 hover:bg-orange-500 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all">Submit Protocol</button>
                                     </form>
                                 </div>
                             )}
                             {showHalfDayForm && (
                                 <div className="glass-card p-10 bg-slate-900 border-purple-500/30 animate-fade-in-up">
                                     <div className="flex justify-between items-center mb-8">
                                         <h3 className="text-2xl font-black text-white flex items-center gap-4">
                                            <Sun className="text-purple-500" /> Half Day Session
                                         </h3>
                                         <button onClick={() => setShowHalfDayForm(false)} className="text-gray-600 hover:text-white"><XCircle /></button>
                                     </div>
                                      <form onSubmit={handleHalfDaySubmit} className="space-y-6">
                                          <select 
                                            className="glass-input w-full p-5 appearance-none font-bold" 
                                            value={halfDayForm.type}
                                            onChange={e => setHalfDayForm({...halfDayForm, type: e.target.value})}
                                          >
                                              <option value="First Half">First Half (9 AM - 1 PM)</option>
                                              <option value="Second Half">Second Half (1 PM - 5:30 PM)</option>
                                          </select>
                                          <textarea 
                                            required 
                                            className="glass-input w-full p-5 font-bold" 
                                            placeholder="Reason for half-day session..." 
                                            rows="3"
                                            value={halfDayForm.reason}
                                            onChange={e => setHalfDayForm({...halfDayForm, reason: e.target.value})}
                                          />
                                          <button className="w-full bg-purple-600 hover:bg-purple-500 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all">Commit Session</button>
                                     </form>
                                 </div>
                             )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="space-y-8 animate-fade-in-up">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Summary Column */}
                        <div className="lg:col-span-1 space-y-8">
                            <div className="glass-card p-10 bg-gradient-to-br from-indigo-900 to-slate-950 border-white/5 space-y-8">
                                <h3 className="text-2xl font-black text-white flex items-center gap-4"><TrendingUp className="text-indigo-400" /> Usage Summary</h3>
                                <div className="grid grid-cols-2 gap-6 font-black uppercase text-[10px] tracking-widest">
                                    <div className="space-y-2"><div className="text-gray-500">Days Present</div><div className="text-3xl text-emerald-400">{history.filter(h => h.status === 'Present' || h.status === 'Checked-Out' || h.status === 'Over Work').length}</div></div>
                                    <div className="space-y-2"><div className="text-gray-500">Total Hours</div><div className="text-3xl text-indigo-400">{Math.floor(history.reduce((acc, h) => acc + (h.duration || 0), 0) / 60)}H</div></div>
                                </div>
                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                     <div className="h-full bg-indigo-500 w-[65%]" />
                                </div>
                            </div>

                            <div className="glass-card p-10 border-white/5 bg-slate-950 space-y-6">
                                <h4 className="font-black text-white text-xs uppercase tracking-widest text-center">Status Index</h4>
                                <div className="space-y-4">
                                     {[
                                         { label: 'Present', color: 'bg-emerald-500' },
                                         { label: 'Absent', color: 'bg-rose-500' },
                                         { label: 'On Leave', color: 'bg-orange-500' },
                                         { label: 'Half Day', color: 'bg-purple-500' }
                                     ].map(status => (
                                         <div key={status.label} className="flex items-center justify-between text-[10px] font-black uppercase tracking-tighter">
                                             <div className="flex items-center gap-3 text-gray-500"><div className={`w-2 h-2 rounded-full ${status.color}`} /> {status.label}</div>
                                             <div className="text-white">{history.filter(h => h.status === status.label).length}</div>
                                         </div>
                                     ))}
                                </div>
                            </div>
                        </div>

                        {/* List Column */}
                        <div className="lg:col-span-2 glass-card overflow-hidden bg-slate-900/40 border-white/5">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 border-b border-white/10">
                                        <tr className="text-[10px] uppercase font-black tracking-widest text-gray-500">
                                            <th className="p-8">Log Sequence</th>
                                            <th className="p-8">Gate Entry</th>
                                            <th className="p-8">Gate Exit</th>
                                            <th className="p-8">Metrics</th>
                                            <th className="p-8">Security</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {history.map(record => (
                                            <tr key={record._id} className="hover:bg-white/5 transition-all group font-bold">
                                                <td className="p-8">
                                                    <div className="text-white text-base">{new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                                                    <div className="text-[10px] text-gray-600 tracking-tighter uppercase font-black uppercase">{new Date(record.date).toLocaleDateString('en-GB', { weekday: 'long' })}</div>
                                                </td>
                                                <td className="p-8 text-emerald-400 font-mono text-xs">{record.checkIn?.time ? new Date(record.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                                                <td className="p-8 text-rose-400 font-mono text-xs">{record.checkOut?.time ? new Date(record.checkOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                                                <td className="p-8 text-indigo-400 font-mono text-xs uppercase">{record.duration ? `${Math.floor(record.duration / 60)}H ${record.duration % 60}M` : '--'}</td>
                                                <td className="p-8 text-xs">
                                                    <span className={`px-4 py-2 rounded-[2rem] tracking-tighter font-black uppercase ${
                                                        record.status.includes('Pending') ? 'bg-yellow-500/10 text-yellow-500' :
                                                        record.status === 'Absent' ? 'bg-rose-500/10 text-rose-500' : 
                                                        'bg-emerald-500/10 text-emerald-400'
                                                    }`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'holidays' && (
                <div className="space-y-12 animate-fade-in-up max-w-4xl mx-auto">
                    <div className="flex items-center gap-6 mb-4">
                         <div className="p-4 bg-cyan-600 rounded-3xl shadow-xl shadow-cyan-900/40"><Umbrella className="text-white" size={32} /></div>
                         <div>
                            <h3 className="text-4xl font-black text-white">Company Calendar</h3>
                            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-2">Public & Corporate Scheduled Holidays</p>
                         </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {holidays.map(h => (
                            <div key={h._id} className="glass-card p-1 bg-gradient-to-br from-white/10 to-transparent rounded-[2.5rem] group hover:scale-[1.02] transition-all">
                                <div className="bg-slate-900/80 rounded-[2.4rem] p-8 flex items-center gap-8 group-hover:bg-slate-900 transition-colors">
                                    <div className="w-20 h-20 bg-slate-800 rounded-3xl flex flex-col items-center justify-center border border-white/5 shadow-inner">
                                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{new Date(h.date).toLocaleString('default', { month: 'short' })}</span>
                                        <span className="text-3xl font-black text-white">{new Date(h.date).getDate()}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-2xl font-black text-white tracking-tight uppercase">{h.title}</h4>
                                        <div className="flex items-center gap-3 mt-2 text-xs font-bold text-gray-500">
                                            <Briefcase size={12} className="text-cyan-500" /> {h.type} Observed
                                        </div>
                                    </div>
                                    <ChevronRight className="text-gray-800 group-hover:text-cyan-500 transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {holidays.length === 0 && (
                        <div className="text-center py-20 bg-white/5 border border-white/5 rounded-[3rem] border-dashed">
                             <p className="text-gray-600 font-black uppercase tracking-[0.2em]">No holiday logs detected</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EmployeeAttendance;
