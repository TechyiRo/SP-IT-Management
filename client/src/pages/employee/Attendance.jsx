import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { 
    Clock, CheckCircle, XCircle, AlertCircle, 
    ChevronRight, TrendingUp, Briefcase, 
    Umbrella, CalendarDays, Smartphone, ShieldCheck,
    LogOut, Sun, Hourglass, Coffee, Sunrise,
    Activity, Fingerprint, Lock, Unlock, PowerOff,
    Timer, ArrowRight, Zap, BarChart3, Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const EmployeeAttendance = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('terminal');
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

    // Poll every 15 seconds to pick up admin approvals quickly
    useEffect(() => {
        const poller = setInterval(() => fetchData(true), 15000);
        return () => clearInterval(poller);
    }, []);

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
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

            const forgot = attendanceRes.data.find(a => a.forgotCheckOut === true);
            setForgotRecord(forgot || null);
        } catch (err) {
            console.error(err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleCheckInRequest = async () => {
        const getPos = () => new Promise((res, rej) => navigator.geolocation?.getCurrentPosition(res, rej));
        try {
            setLoading(true);
            let locationLink = 'Manual Check-in';
            try {
                const pos = await getPos();
                locationLink = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
            } catch { console.warn('Location Access Denied'); }

            await api.post('/api/attendance/check-in', { location: locationLink, remarks: 'Portal Request' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.msg || 'Request Error');
        } finally { setLoading(false); }
    };

    const handleCheckOutRequest = async () => {
        try {
            setLoading(true);
            await api.post('/api/attendance/check-out', { remarks: 'Portal Logout' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.msg || 'Checkout Error');
        } finally { setLoading(false); }
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
        } catch { alert('Request Failed'); }
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
        } catch { alert('Request Failed'); }
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
        } catch { alert('Failed to submit missing checkout'); }
    };

    // ─── Status Logic: determines what employee sees ───
    // PRIORITY ORDER:
    // 1. Approved leave/half-day → final done states
    // 2. Approved check-in → show checkout (HIGHEST active priority)
    // 3. Pending check-in → waiting for admin
    // 4. Pending leave/half-day (only if no check-in exists)
    // 5. Fallback statuses
    const getStatusDisplay = () => {
        if (!todayRecord) return { text: "Offline", emoji: "💤", action: "checkin", gradient: "from-slate-600 via-slate-700 to-slate-800", icon: PowerOff, desc: "You haven't checked in yet. Start your shift!" };
        const { checkIn, checkOut, halfDay, leave, status } = todayRecord;

        // ── APPROVED LEAVE: Employee is on leave for the day ──
        if (leave?.status === 'Approved') return { text: "On Leave", emoji: "🌴", action: "done", gradient: "from-amber-400 via-orange-500 to-rose-500", icon: Umbrella, desc: "Enjoy your day off! Leave has been approved." };

        // ── APPROVED CHECK-IN: This is the ACTIVE state — always show checkout ──
        if (checkIn?.status === 'Approved') {
            if (checkOut?.status === 'Pending') return { text: "Checkout Pending", emoji: "🕐", action: "wait", gradient: "from-blue-500 via-indigo-600 to-violet-700", icon: Hourglass, desc: "Your checkout request is awaiting admin approval." };
            if (checkOut?.status === 'Approved') {
                const statusMap = {
                    'Half Day': { emoji: "🌗", gradient: "from-amber-400 via-yellow-500 to-orange-500" },
                    'Full Day': { emoji: "✅", gradient: "from-emerald-400 via-green-500 to-teal-600" },
                    'Over Work': { emoji: "🔥", gradient: "from-fuchsia-500 via-pink-500 to-rose-600" },
                };
                const mapped = statusMap[status] || { emoji: "🏁", gradient: "from-emerald-400 via-teal-500 to-cyan-600" };
                return { text: status || "Shift Complete", emoji: mapped.emoji, action: "done", gradient: mapped.gradient, icon: CheckCircle, desc: `Your shift is complete. Duration: ${todayRecord.duration ? Math.floor(todayRecord.duration/60) + 'h ' + (todayRecord.duration%60) + 'm' : 'calculating...'}` };
            }
            // ✅ CHECK-IN APPROVED, no checkout yet — SHOW CHECKOUT BUTTON
            return { text: "On Duty", emoji: "💼", action: "checkout", gradient: "from-emerald-400 via-cyan-500 to-blue-500", icon: Unlock, desc: "You are checked in. Click below when your shift ends." };
        }

        // ── PENDING CHECK-IN: Waiting for admin to approve entry ──
        if (checkIn?.status === 'Pending') {
            const isAfter530 = currentTime.getHours() > 17 || (currentTime.getHours() === 17 && currentTime.getMinutes() >= 30);
            if (isAfter530) return { text: "Late Exit", emoji: "🚨", action: "checkout", gradient: "from-rose-500 via-red-600 to-rose-800", icon: LogOut, desc: "It is past 5:30 PM. You can request checkout now." };
            return { text: "Awaiting Approval", emoji: "⏳", action: "wait", gradient: "from-sky-400 via-blue-500 to-indigo-600", icon: Lock, desc: "Your check-in request is pending admin approval." };
        }

        // ── PENDING LEAVE/HALF-DAY: Only shown if no check-in at all ──
        if (leave?.status === 'Pending') return { text: "Leave Pending", emoji: "🏖️", action: "wait", gradient: "from-amber-500 via-orange-500 to-red-500", icon: Umbrella, desc: "Your leave request is awaiting admin approval." };
        if (halfDay?.status === 'Pending') return { text: "Half-Day Pending", emoji: "🌗", action: "wait", gradient: "from-violet-500 via-purple-600 to-indigo-700", icon: Coffee, desc: "Half-day request is being reviewed by admin." };

        // ── FALLBACK STATUSES ──
        if (status === 'Forgot Check-Out') return { text: "Missed Checkout", emoji: "⚠️", action: "forgot", gradient: "from-red-600 via-rose-700 to-slate-900", icon: AlertCircle, desc: "You forgot to check out. Please submit the missing time." };
        if (status === 'Holiday') return { text: "Holiday", emoji: "🎉", action: "done", gradient: "from-indigo-400 via-purple-500 to-pink-500", icon: Award, desc: "Today is a company holiday. Enjoy your day!" };
        if (status === 'Absent') return { text: "Absent", emoji: "❌", action: "none", gradient: "from-rose-600 via-red-700 to-rose-900", icon: XCircle, desc: "Marked absent for today." };

        return { text: status || "Unknown", emoji: "📋", action: "none", gradient: "from-slate-600 to-slate-800", icon: Activity, desc: "Status is being processed." };
    };

    const sInfo = getStatusDisplay();
    const StatusIcon = sInfo.icon || Activity;

    // ─── Computed Stats ───
    const stats = useMemo(() => {
        const present = history.filter(h => ['Present', 'Checked-Out', 'Full Day', 'Over Work'].includes(h.status)).length;
        const absent = history.filter(h => h.status === 'Absent').length;
        const halfDays = history.filter(h => h.status === 'Half Day').length;
        const leaves = history.filter(h => h.status === 'On Leave').length;
        const overwork = history.filter(h => h.status === 'Over Work').length;
        const totalHours = Math.floor(history.reduce((acc, h) => acc + (h.duration || 0), 0) / 60);
        const totalMins = history.reduce((acc, h) => acc + (h.duration || 0), 0) % 60;
        return { present, absent, halfDays, leaves, overwork, totalHours, totalMins };
    }, [history]);

    // ─── Status emoji/color lookup for history table ───
    const getStatusStyle = (status) => {
        const map = {
            'Present': { emoji: '✅', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
            'Full Day': { emoji: '✅', bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
            'Absent': { emoji: '❌', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
            'Half Day': { emoji: '🌗', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
            'On Leave': { emoji: '🏖️', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
            'Over Work': { emoji: '🔥', bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/20' },
            'Checked-Out': { emoji: '🏁', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
            'Holiday': { emoji: '🎉', bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
            'Forgot Check-Out': { emoji: '⚠️', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
        };
        if (status?.includes('Pending')) return { emoji: '⏳', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' };
        return map[status] || { emoji: '📋', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' };
    };

    const NavTab = ({ id, label, icon: Icon, badge }) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300 text-[10px] md:text-xs font-black uppercase tracking-wider relative ${
                activeTab === id 
                    ? 'bg-white/10 text-white shadow-lg border border-white/10' 
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
        >
            <Icon size={16} />
            <span className="hidden xs:inline">{label}</span>
            {badge > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-[9px] text-white flex items-center justify-center">{badge}</span>}
        </button>
    );

    if (loading && history.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-white/10 border-t-cyan-500 rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Loading Attendance...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 md:space-y-8 pb-24 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            
            {/* ═══════ HEADER ═══════ */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                        ⏰ Attendance
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                            <ShieldCheck size={10} className="text-cyan-500" /> Secure
                        </span>
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Smartphone size={10} className="text-blue-500" /> GPS
                        </span>
                    </div>
                </div>
                
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3 md:px-6 md:py-4 text-right w-full sm:w-auto">
                    <div className="text-2xl md:text-3xl font-mono font-black text-white tracking-tight">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                        {currentTime.toLocaleDateString('en-US', { day: 'numeric', month: 'long', weekday: 'long' })}
                    </div>
                </div>
            </div>

            {/* ═══════ NAVIGATION ═══════ */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl flex gap-1.5 p-1.5 shadow-xl">
                <NavTab id="terminal" label="Terminal" icon={Fingerprint} />
                <NavTab id="history" label="History" icon={BarChart3} />
                <NavTab id="calendar" label="Holidays" icon={CalendarDays} />
            </div>

            {/* ══════════════════════════════════════════════
                TAB 1: TERMINAL — Check In / Out / Status
            ══════════════════════════════════════════════ */}
            {activeTab === 'terminal' && (
                <div className="space-y-6 md:space-y-8">
                    
                    {/* Main Status Hero */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Status Card — takes 2/3 on large */}
                        <div className="lg:col-span-2">
                            <div className={`relative rounded-3xl bg-gradient-to-br ${sInfo.gradient} p-6 sm:p-8 md:p-12 overflow-hidden shadow-2xl min-h-[320px] md:min-h-[400px] flex flex-col items-center justify-center`}>
                                {/* Decorative orbs */}
                                <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-[100px] -translate-y-1/3 translate-x-1/4"></div>
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4"></div>

                                <div className="relative z-10 text-center w-full max-w-lg mx-auto space-y-6">
                                    {/* Status Icon */}
                                    <div className="w-20 h-20 md:w-24 md:h-24 bg-white/15 backdrop-blur-xl rounded-3xl mx-auto flex items-center justify-center border border-white/20 shadow-2xl">
                                        <StatusIcon size={40} className="text-white drop-shadow-lg" />
                                    </div>

                                    {/* Title + emoji */}
                                    <div>
                                        <span className="text-5xl md:text-6xl">{sInfo.emoji}</span>
                                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight mt-2 drop-shadow-xl">
                                            {sInfo.text}
                                        </h2>
                                        <p className="text-white/70 text-sm md:text-base font-medium mt-3 max-w-sm mx-auto leading-relaxed">
                                            {sInfo.desc}
                                        </p>
                                    </div>

                                    {/* ── ACTION BUTTONS ── */}
                                    {sInfo.action === 'checkin' && (
                                        <div className="space-y-4 pt-2">
                                            <button 
                                                onClick={handleCheckInRequest}
                                                disabled={loading}
                                                className="w-full max-w-sm mx-auto bg-white text-gray-900 py-5 md:py-6 rounded-2xl font-black text-lg md:text-xl uppercase tracking-wider shadow-[0_15px_40px_rgba(255,255,255,0.25)] hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                            >
                                                🚪 Check In <ArrowRight size={20} />
                                            </button>
                                            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                                                <button onClick={() => setShowLeaveForm(true)} className="bg-black/25 hover:bg-black/40 text-white py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-wider border border-white/15 transition-all flex items-center justify-center gap-1.5">🏖️ Leave</button>
                                                <button onClick={() => setShowHalfDayForm(true)} className="bg-black/25 hover:bg-black/40 text-white py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-wider border border-white/15 transition-all flex items-center justify-center gap-1.5">🌗 Half Day</button>
                                            </div>
                                        </div>
                                    )}

                                    {sInfo.action === 'checkout' && (
                                        <div className="space-y-4 pt-2">
                                            <button 
                                                onClick={handleCheckOutRequest}
                                                disabled={loading}
                                                className="w-full max-w-sm mx-auto bg-black/80 text-white py-5 md:py-6 rounded-2xl font-black text-lg md:text-xl uppercase tracking-wider shadow-[0_15px_40px_rgba(0,0,0,0.4)] hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/10 disabled:opacity-50"
                                            >
                                                🏃 Check Out <LogOut size={20} />
                                            </button>
                                            {todayRecord?.checkIn?.time && (
                                                <p className="text-white/40 text-xs font-medium">
                                                    Checked in at {new Date(todayRecord.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {sInfo.action === 'wait' && (
                                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/15 max-w-sm mx-auto">
                                            <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Hourglass className="text-white animate-pulse" size={24} />
                                            </div>
                                            <p className="text-white/80 text-sm font-bold">Waiting for admin approval...</p>
                                            <p className="text-white/40 text-xs mt-2">Auto-refreshing every 15 seconds</p>
                                        </div>
                                    )}

                                    {sInfo.action === 'done' && (
                                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/15 max-w-sm mx-auto">
                                            <CheckCircle className="text-white mx-auto mb-3" size={36} />
                                            <p className="text-white font-black text-lg">🏆 All Done!</p>
                                            {todayRecord?.duration > 0 && (
                                                <p className="text-white/60 text-sm mt-2 font-mono">
                                                    Duration: {Math.floor(todayRecord.duration / 60)}h {todayRecord.duration % 60}m
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {sInfo.action === 'forgot' && (
                                        <div className="space-y-4 pt-2">
                                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/15 max-w-sm mx-auto">
                                                <AlertCircle className="text-white mx-auto mb-3" size={36} />
                                                <p className="text-white font-black">Missed Checkout Detected</p>
                                                <p className="text-white/50 text-xs mt-2">Please submit missing checkout via History tab</p>
                                            </div>
                                            <button onClick={() => setActiveTab('history')} className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/10">
                                                Resolve Now →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Sidebar */}
                        <div className="lg:col-span-1 space-y-4">
                            {/* Today's Info Card */}
                            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5 md:p-6 space-y-5 shadow-xl">
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <Activity size={10} className="text-cyan-500" /> Monthly Overview
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Present', value: stats.present, emoji: '✅', color: 'text-emerald-400' },
                                        { label: 'Absent', value: stats.absent, emoji: '❌', color: 'text-rose-400' },
                                        { label: 'Half Day', value: stats.halfDays, emoji: '🌗', color: 'text-amber-400' },
                                        { label: 'Leaves', value: stats.leaves, emoji: '🏖️', color: 'text-purple-400' },
                                    ].map(s => (
                                        <div key={s.label} className="bg-white/3 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-all">
                                            <div className="text-lg">{s.emoji}</div>
                                            <div className={`text-2xl font-black ${s.color} tracking-tight`}>{s.value}</div>
                                            <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{s.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Hours Card */}
                            <div className="bg-gradient-to-br from-cyan-900/30 to-slate-900/50 backdrop-blur-xl border border-cyan-500/10 rounded-2xl p-5 shadow-xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
                                        <Timer size={18} className="text-cyan-400" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-white tracking-tight">{stats.totalHours}h {stats.totalMins}m</div>
                                        <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Total Hours</div>
                                    </div>
                                </div>
                                {stats.overwork > 0 && (
                                    <div className="flex items-center gap-2 mt-3 p-2.5 bg-fuchsia-500/10 rounded-lg border border-fuchsia-500/20">
                                        <span className="text-sm">🔥</span>
                                        <span className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest">{stats.overwork} Overtime Days</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── MODALS: Leave / Half-Day Forms ── */}
                    {(showLeaveForm || showHalfDayForm) && (
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-50 flex items-center justify-center p-4">
                            <div className="bg-slate-950 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                                {showLeaveForm && (
                                    <div className="p-6 md:p-8 space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-xl font-black text-white flex items-center gap-3">🏖️ Request Leave</h3>
                                            <button onClick={() => setShowLeaveForm(false)} className="text-gray-600 hover:text-white transition-colors"><XCircle size={22} /></button>
                                        </div>
                                        <form onSubmit={handleLeaveSubmit} className="space-y-5">
                                            <textarea 
                                                required className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm font-medium placeholder:text-gray-600 focus:border-orange-500/40 focus:outline-none transition-all resize-none" 
                                                placeholder="Reason for leave..." rows="3" value={leaveForm.reason}
                                                onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})}
                                            />
                                            <button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.98]">Submit Leave Request</button>
                                        </form>
                                    </div>
                                )}
                                {showHalfDayForm && (
                                    <div className="p-6 md:p-8 space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-xl font-black text-white flex items-center gap-3">🌗 Half Day Request</h3>
                                            <button onClick={() => setShowHalfDayForm(false)} className="text-gray-600 hover:text-white transition-colors"><XCircle size={22} /></button>
                                        </div>
                                        <form onSubmit={handleHalfDaySubmit} className="space-y-5">
                                            <select 
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm font-bold appearance-none focus:border-purple-500/40 focus:outline-none transition-all"
                                                value={halfDayForm.type} onChange={e => setHalfDayForm({...halfDayForm, type: e.target.value})}
                                            >
                                                <option value="First Half">First Half (9 AM - 1 PM)</option>
                                                <option value="Second Half">Second Half (1 PM - 5:30 PM)</option>
                                            </select>
                                            <textarea 
                                                required className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm font-medium placeholder:text-gray-600 focus:border-purple-500/40 focus:outline-none transition-all resize-none" 
                                                placeholder="Reason for half-day..." rows="3" value={halfDayForm.reason}
                                                onChange={e => setHalfDayForm({...halfDayForm, reason: e.target.value})}
                                            />
                                            <button className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.98]">Submit Half Day</button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════
                TAB 2: HISTORY — Attendance Log Table
            ══════════════════════════════════════════════ */}
            {activeTab === 'history' && (
                <div className="space-y-6">
                    
                    {/* Summary Stats Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                        {[
                            { label: 'Present', value: stats.present, emoji: '✅', gradient: 'from-emerald-500/10 to-emerald-900/10', border: 'border-emerald-500/15' },
                            { label: 'Absent', value: stats.absent, emoji: '❌', gradient: 'from-rose-500/10 to-rose-900/10', border: 'border-rose-500/15' },
                            { label: 'Leaves', value: stats.leaves, emoji: '🏖️', gradient: 'from-purple-500/10 to-purple-900/10', border: 'border-purple-500/15' },
                            { label: 'Hours', value: `${stats.totalHours}h`, emoji: '⏱️', gradient: 'from-cyan-500/10 to-cyan-900/10', border: 'border-cyan-500/15' },
                        ].map(s => (
                            <div key={s.label} className={`bg-gradient-to-br ${s.gradient} border ${s.border} rounded-2xl p-4 md:p-5 backdrop-blur-xl shadow-lg`}>
                                <div className="text-xl md:text-2xl">{s.emoji}</div>
                                <div className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">{s.value}</div>
                                <div className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Table — Responsive: cards on mobile, table on desktop */}
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/3 border-b border-white/5">
                                    <tr className="text-[9px] uppercase font-black tracking-[0.3em] text-gray-500">
                                        <th className="px-6 py-5">📅 Date</th>
                                        <th className="px-6 py-5">🟢 In</th>
                                        <th className="px-6 py-5">🔴 Out</th>
                                        <th className="px-6 py-5">⏱️ Duration</th>
                                        <th className="px-6 py-5 text-right">📊 Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/3">
                                    {history.map(record => {
                                        const ss = getStatusStyle(record.status);
                                        return (
                                            <tr key={record._id} className="hover:bg-white/3 transition-all">
                                                <td className="px-6 py-4">
                                                    <div className="text-white text-sm font-bold">{new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                                                    <div className="text-[9px] text-gray-600 uppercase font-bold tracking-widest">{new Date(record.date).toLocaleDateString('en-GB', { weekday: 'long' })}</div>
                                                </td>
                                                <td className="px-6 py-4 text-emerald-400 font-mono text-xs font-bold">
                                                    {record.checkIn?.time ? new Date(record.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}
                                                </td>
                                                <td className="px-6 py-4 text-rose-400 font-mono text-xs font-bold">
                                                    {record.checkOut?.time ? new Date(record.checkOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}
                                                </td>
                                                <td className="px-6 py-4 text-cyan-400 font-mono text-xs font-bold">
                                                    {record.duration ? `${Math.floor(record.duration / 60)}h ${record.duration % 60}m` : '--'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${ss.bg} ${ss.text} ${ss.border}`}>
                                                        {ss.emoji} {record.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y divide-white/5">
                            {history.map(record => {
                                const ss = getStatusStyle(record.status);
                                return (
                                    <div key={record._id} className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-white text-sm font-bold">{new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                                <div className="text-[9px] text-gray-600 uppercase font-bold tracking-widest">{new Date(record.date).toLocaleDateString('en-GB', { weekday: 'long' })}</div>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider border ${ss.bg} ${ss.text} ${ss.border}`}>
                                                {ss.emoji} {record.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="bg-white/3 rounded-lg p-2">
                                                <div className="text-[8px] text-gray-600 font-bold uppercase">🟢 In</div>
                                                <div className="text-emerald-400 font-mono text-[11px] font-bold mt-0.5">
                                                    {record.checkIn?.time ? new Date(record.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}
                                                </div>
                                            </div>
                                            <div className="bg-white/3 rounded-lg p-2">
                                                <div className="text-[8px] text-gray-600 font-bold uppercase">🔴 Out</div>
                                                <div className="text-rose-400 font-mono text-[11px] font-bold mt-0.5">
                                                    {record.checkOut?.time ? new Date(record.checkOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}
                                                </div>
                                            </div>
                                            <div className="bg-white/3 rounded-lg p-2">
                                                <div className="text-[8px] text-gray-600 font-bold uppercase">⏱️ Hrs</div>
                                                <div className="text-cyan-400 font-mono text-[11px] font-bold mt-0.5">
                                                    {record.duration ? `${Math.floor(record.duration / 60)}h ${record.duration % 60}m` : '--'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {history.length === 0 && (
                            <div className="p-16 text-center text-gray-600 font-bold uppercase tracking-widest text-xs">No attendance records found</div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════
                TAB 3: HOLIDAYS — Company Calendar
            ══════════════════════════════════════════════ */}
            {activeTab === 'calendar' && (
                <div className="space-y-8 max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-4 bg-indigo-500/20 border border-indigo-500/20 rounded-2xl shadow-lg shadow-indigo-500/10">
                            <CalendarDays size={28} className="text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">🎉 Holiday Calendar</h3>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Company Scheduled Days Off</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {holidays.map(h => (
                            <div key={h._id} className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 flex items-center gap-5 hover:border-indigo-500/20 hover:bg-slate-900/80 transition-all duration-300 group shadow-lg">
                                <div className="w-16 h-16 bg-slate-950 rounded-2xl flex flex-col items-center justify-center border border-white/5 shrink-0 group-hover:border-indigo-500/20 transition-all">
                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{new Date(h.date).toLocaleString('default', { month: 'short' })}</span>
                                    <span className="text-2xl font-black text-white leading-tight">{new Date(h.date).getDate()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-lg font-black text-white tracking-tight truncate group-hover:text-indigo-400 transition-colors">{h.title}</h4>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                                            h.type === 'Public' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                        }`}>
                                            {h.type}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="text-gray-800 group-hover:text-indigo-500 transition-colors shrink-0" size={18} />
                            </div>
                        ))}
                    </div>

                    {holidays.length === 0 && (
                        <div className="text-center py-16 bg-white/3 border border-white/5 border-dashed rounded-2xl">
                            <span className="text-4xl mb-4 block">📅</span>
                            <p className="text-gray-600 font-bold uppercase tracking-widest text-xs">No holidays scheduled yet</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EmployeeAttendance;
