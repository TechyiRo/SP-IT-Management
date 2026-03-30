import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Clock, MapPin, CheckCircle, XCircle, AlertCircle, FileText, Upload, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const EmployeeAttendance = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [todayRecord, setTodayRecord] = useState(null);
    const [history, setHistory] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Half Day Form
    const [showHalfDayForm, setShowHalfDayForm] = useState(false);
    const [halfDayReason, setHalfDayReason] = useState('');
    const [halfDayType, setHalfDayType] = useState('First Half');
    const [file, setFile] = useState(null);

    // Leave Form
    const [showLeaveForm, setShowLeaveForm] = useState(false);
    const [leaveReason, setLeaveReason] = useState('');
    const [leaveFile, setLeaveFile] = useState(null);

    // Forgotten Check-out
    const [forgotRecord, setForgotRecord] = useState(null);
    const [forgotCheckOutTime, setForgotCheckOutTime] = useState('');
    const [overtimeMinutes, setOvertimeMinutes] = useState(0);
    const [forgotReason, setForgotReason] = useState('');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        fetchAttendanceData();
        return () => clearInterval(timer);
    }, []);

    const fetchAttendanceData = async () => {
        try {
            const res = await api.get('/api/attendance/me');
            setHistory(res.data);

            const today = new Date().toDateString();
            const record = res.data.find(a => new Date(a.date).toDateString() === today);
            setTodayRecord(record || null);

            // Check if any forgotten checkout exists
            const forgot = res.data.find(a => a.forgotCheckOut === true);
            if (forgot) {
                setForgotRecord(forgot);
            } else {
                setForgotRecord(null);
            }

            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleCheckInRequest = async () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        const getPosition = () => {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
        };

        try {
            setLoading(true);
            const position = await getPosition();
            const { latitude, longitude } = position.coords;
            const locationLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

            await api.post('/api/attendance/check-in', {
                location: locationLink,
                remarks: 'Regular Check-in'
            });
            alert('Check-In Request Sent! 🟢');
            fetchAttendanceData();
        } catch (err) {
            console.error(err);
            // Allow check-in even if location fails, but note it
            const errorMsg = err.code === 1 ? "Location Denied" : "Location Unavailable";

            try {
                await api.post('/api/attendance/check-in', {
                    location: errorMsg,
                    remarks: 'Regular Check-in (Location Failed)'
                });
                alert('Check-In Request Sent (without location)! 🟢');
                fetchAttendanceData();
            } catch (innerErr) {
                alert(innerErr.response?.data?.msg || 'Request Failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOutRequest = async () => {
        try {
            await api.post('/api/attendance/check-out', { remarks: 'Regular Check-out' });
            alert('Check-Out Request Sent! 🔴');
            fetchAttendanceData();
        } catch (err) {
            const data = err.response?.data;
            let msg = data?.msg || 'Request Failed';
            if (data?.debug) {
                msg += `\nDebug: Found=${data.debug.found}, Status=${data.debug.checkInStatus}, Date=${data.debug.serverDate}`;
            }
            alert(msg);
        }
    };

    const handleHalfDaySubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('reason', halfDayReason);
            formData.append('type', halfDayType);
            if (file) formData.append('attachment', file);

            await api.post('/api/attendance/half-day', formData);
            alert('Half-Day Request Sent! 🌓');
            setShowHalfDayForm(false);
            fetchAttendanceData();
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.msg || err.response?.data || err.message || 'Request Failed';
            alert(`Request Failed: ${typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg}`);
        }
    };

    const handleLeaveSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('reason', leaveReason);
            if (leaveFile) formData.append('attachment', leaveFile);

            await api.post('/api/attendance/leave', formData);
            alert('Leave Request Sent! 🏖️');
            setShowLeaveForm(false);
            fetchAttendanceData();
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.msg || err.response?.data || err.message || 'Request Failed';
            alert(`Request Failed: ${typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg}`);
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        try {
            const baseDate = new Date(forgotRecord.date).toDateString();
            const fullDateStr = `${baseDate} ${forgotCheckOutTime}`;
            
            await api.post(`/api/attendance/forgot-checkout/${forgotRecord._id}`, {
                checkOutTime: fullDateStr,
                overtimeMinutes: Number(overtimeMinutes),
                reason: forgotReason
            });
            alert('Checkout Time Submitted Successfully! ✅');
            setForgotRecord(null);
            fetchAttendanceData();
        } catch (err) {
            console.error(err);
            alert('Failed to submit: ' + (err.response?.data?.msg || err.message));
        }
    };

    const getStatusDisplay = () => {
        if (!todayRecord) {
            return {
                text: "Not Checked In",
                emoji: "🔴",
                action: "checkin",
                message: "Mark your presence now"
            };
        }

        const { checkIn, checkOut, halfDay, leave, status } = todayRecord;

        if (leave?.isRequested && leave.status === 'Pending') {
            return { text: "Leave Pending", emoji: "🏖️", action: "wait", message: "Waiting for admin approval" };
        }

        if (leave?.status === 'Approved') {
            return { text: "On Leave", emoji: "🏖️", action: "done", message: "Enjoy your leave!" };
        }

        if (halfDay?.isRequested && halfDay.status === 'Pending') {
            return { text: "Half Day Pending", emoji: "🌓", action: "wait", message: "Waiting for admin approval" };
        }

        // Check In Pending
        if (checkIn?.status === 'Pending') {
            const now = new Date();
            const isAfter530 = now.getHours() > 17 || (now.getHours() === 17 && now.getMinutes() >= 30);

            if (isAfter530) {
                if (checkOut?.status === 'Pending') {
                    return { text: "Check-Out Pending", emoji: "⏳", action: "wait", message: "Waiting for admin approval" };
                }
                if (checkOut?.status === 'Approved') {
                    return { text: "Checked Out", emoji: "🔚", action: "done", message: "Day completed!" };
                }
                if (checkOut?.status === 'Rejected') {
                    return { text: "Check-Out Rejected", emoji: "❌", action: "checkout", message: "Check-out rejected. Try again?" };
                }
                return { text: "Check-In Pending (After 5:30 PM)", emoji: "🕒", action: "checkout", message: "You can check out now" };
            }
            return { text: "Check-In Pending", emoji: "🕒", action: "wait", message: "Waiting for admin approval" };
        }

        // Check In Approval
        if (checkIn?.status === 'Approved') {
            // Check Out Pending
            if (checkOut?.status === 'Pending') {
                return { text: "Check-Out Pending", emoji: "⏳", action: "wait", message: "Waiting for admin approval" };
            }
            // Checked Out Completed
            if (checkOut?.status === 'Approved') {
                return { text: "Checked Out", emoji: "🔚", action: "done", message: "Day completed!" };
            }
            // Checked Out Rejected?
            if (checkOut?.status === 'Rejected') {
                return { text: "Check-Out Rejected", emoji: "❌", action: "checkout", message: "Check-out rejected. Try again?" };
            }

            // Default: Checked In (Present)
            return { text: "Present", emoji: "🟢", action: "checkout", message: "Working..." };
        }

        if (checkIn?.status === 'Rejected') {
            return { text: "Check-In Rejected", emoji: "❌", action: "contact_admin", message: "Contact Admin" };
        }
        
        if (status === 'Forgot Check-Out') {
             return { text: "Missing Checkout", emoji: "⚠️", action: "forgot", message: "Please update your missing checkout" };
        }

        return { text: status, emoji: "❓", action: "none", message: "" };
    };

    const statusInfo = getStatusDisplay();

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-sm">
                    Attendance Portal
                </h1>
                <div className="text-sm font-medium text-gray-300 bg-white/5 px-6 py-3 rounded-full border border-white/10 shadow-inner flex items-center gap-2">
                    <Calendar size={18} className="text-cyan-400" />
                    {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Main Action Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-10 md:p-14 flex flex-col items-center justify-center text-center min-h-[450px] mb-12 transition-all duration-500 hover:shadow-[0_16px_48px_rgba(0,0,0,0.6)] group">
                
                {/* Dynamic Background Glows */}
                <div className={`absolute top-0 right-1/4 w-96 h-96 rounded-full blur-[120px] -translate-y-1/2 opacity-30 pointer-events-none transition-all duration-1000 group-hover:opacity-50 ${
                    statusInfo.action === 'checkin' ? 'bg-cyan-500' :
                    statusInfo.action === 'checkout' ? 'bg-rose-500' : 'bg-purple-500'
                }`}></div>
                <div className={`absolute bottom-0 left-1/4 w-80 h-80 rounded-full blur-[100px] translate-y-1/2 opacity-20 pointer-events-none transition-all duration-1000 group-hover:opacity-40 ${
                    statusInfo.action === 'checkin' ? 'bg-blue-600' :
                    statusInfo.action === 'checkout' ? 'bg-orange-600' : 'bg-indigo-600'
                }`}></div>

                {/* Live Clock Profile */}
                <div className="z-10 flex flex-col items-center justify-center mb-10">
                    <div className="relative mb-6">
                        <div className="absolute -inset-3 rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition duration-700 bg-gradient-to-r from-cyan-400 to-purple-500 animate-pulse-slow"></div>
                        <div className="relative w-40 h-40 rounded-full bg-black/60 border border-white/20 flex items-center justify-center shadow-[inset_0_0_30px_rgba(255,255,255,0.05)] backdrop-blur-xl">
                            <span className="text-7xl drop-shadow-2xl">{statusInfo.emoji}</span>
                        </div>
                    </div>
                    <div className="text-6xl md:text-8xl font-mono font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-2xl mb-2">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="z-10 mb-12 bg-white/5 border border-white/10 px-8 py-4 rounded-2xl backdrop-blur-xl shadow-lg ring-1 ring-white/5">
                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide">{statusInfo.text}</h2>
                    {statusInfo.message && <p className="text-base text-gray-400 mt-2 font-medium">{statusInfo.message}</p>}
                </div>

                {/* Actions */}
                <div className="flex gap-6 z-10 flex-col sm:flex-row flex-wrap justify-center w-full max-w-3xl">
                    {statusInfo.action === 'checkin' && (
                        <>
                            <button onClick={handleCheckInRequest} className="group relative w-full sm:w-auto overflow-hidden rounded-full p-[2px] transition-transform hover:scale-105 hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] flex-1 max-w-xs">
                                <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 opacity-80 group-hover:opacity-100 transition-opacity duration-300"></span>
                                <span className="relative flex items-center justify-center gap-3 bg-gray-900/90 backdrop-blur-xl px-8 py-5 rounded-full text-white font-bold text-lg transition-all group-hover:bg-transparent">
                                    <Clock size={24} className="group-hover:animate-bounce" /> Request Check-In
                                </span>
                            </button>
                            <button onClick={() => setShowLeaveForm(!showLeaveForm)} className="group relative w-full sm:w-auto overflow-hidden rounded-full p-[2px] transition-transform hover:scale-105 hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] flex-1 max-w-xs">
                                <span className="absolute inset-0 bg-gradient-to-r from-orange-400 to-rose-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300"></span>
                                <span className="relative flex items-center justify-center gap-3 bg-gray-900/90 backdrop-blur-xl px-8 py-5 rounded-full text-white font-bold text-lg transition-all group-hover:bg-transparent">
                                    <FileText size={24} /> Request Leave
                                </span>
                            </button>
                        </>
                    )}

                    {statusInfo.action === 'checkout' && (
                        <button onClick={handleCheckOutRequest} className="group relative w-full sm:w-auto overflow-hidden rounded-full p-[2px] transition-transform hover:scale-105 hover:shadow-[0_0_40px_rgba(225,29,72,0.5)] flex-1 max-w-sm">
                            <span className="absolute inset-0 bg-gradient-to-r from-rose-500 to-red-600 opacity-80 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></span>
                            <span className="relative flex items-center justify-center gap-3 bg-gray-900/90 backdrop-blur-xl px-10 py-5 rounded-full text-white font-bold text-xl transition-all group-hover:bg-transparent">
                                <Clock size={26} /> Complete Check-Out
                            </span>
                        </button>
                    )}

                    {!showHalfDayForm && !showLeaveForm && !todayRecord && (
                        <button onClick={() => setShowHalfDayForm(true)} className="group relative w-full sm:w-auto overflow-hidden rounded-full p-[1px] transition-transform hover:scale-105">
                            <span className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-40 group-hover:opacity-80 transition-opacity duration-300"></span>
                            <span className="relative flex items-center justify-center gap-2 bg-gray-900/90 backdrop-blur-xl px-8 py-4 rounded-full text-purple-200 font-medium transition-all hover:text-white">
                                Request Half Day
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Leave / Half Day Forms */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {showLeaveForm && (
                    <div className="col-span-1 border border-orange-500/30 bg-gradient-to-br from-gray-900/90 to-gray-900/50 backdrop-blur-3xl p-8 md:p-10 rounded-[2.5rem] shadow-[0_16px_40px_rgba(0,0,0,0.4)] animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 blur-[60px] rounded-full"></div>
                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-4">
                                <span className="bg-gradient-to-br from-orange-500/20 to-rose-500/20 p-3 rounded-2xl shadow-inner border border-white/5"><FileText className="text-orange-400" size={24} /></span>
                                Full Day Leave
                            </h3>
                            <button onClick={() => setShowLeaveForm(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><XCircle className="text-gray-400 hover:text-white" size={28} /></button>
                        </div>
                        <form onSubmit={handleLeaveSubmit} className="space-y-6 relative z-10">
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-3 tracking-wide">Reason for Leave</label>
                                <textarea className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all outline-none resize-none shadow-inner" required value={leaveReason} onChange={e => setLeaveReason(e.target.value)} placeholder="Please elaborate..." rows="3"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-3 tracking-wide">Supporting Document (Optional)</label>
                                <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-orange-500/40 transition-colors bg-black/20 group cursor-pointer">
                                    <input type="file" className="text-sm text-gray-400 file:mr-5 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-500/20 file:text-orange-300 hover:file:bg-orange-500/30 cursor-pointer w-full transition-colors" onChange={e => setLeaveFile(e.target.files[0])} />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 text-white font-bold text-lg py-4 rounded-2xl shadow-[0_8px_20px_rgba(249,115,22,0.3)] transform active:scale-[0.98] transition-all">Submit Leave Request</button>
                        </form>
                    </div>
                )}

                {showHalfDayForm && (
                     <div className="col-span-1 border border-purple-500/30 bg-gradient-to-br from-gray-900/90 to-gray-900/50 backdrop-blur-3xl p-8 md:p-10 rounded-[2.5rem] shadow-[0_16px_40px_rgba(0,0,0,0.4)] animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 blur-[60px] rounded-full"></div>
                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-4">
                                <span className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 p-3 rounded-2xl shadow-inner border border-white/5"><Clock className="text-purple-400" size={24} /></span>
                                Half Day Request
                            </h3>
                            <button onClick={() => setShowHalfDayForm(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><XCircle className="text-gray-400 hover:text-white" size={28} /></button>
                        </div>
                        <form onSubmit={handleHalfDaySubmit} className="space-y-6 relative z-10">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-3 tracking-wide">Which Half?</label>
                                    <select className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all outline-none appearance-none shadow-inner cursor-pointer" value={halfDayType} onChange={e => setHalfDayType(e.target.value)}>
                                        <option value="First Half" className="bg-gray-900">First Half (Morning)</option>
                                        <option value="Second Half" className="bg-gray-900">Second Half (Afternoon)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-3 tracking-wide">Reason</label>
                                <textarea className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all outline-none resize-none shadow-inner" required value={halfDayReason} onChange={e => setHalfDayReason(e.target.value)} placeholder="Please elaborate..." rows="2"></textarea>
                            </div>
                            <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-lg py-4 rounded-2xl shadow-[0_8px_20px_rgba(147,51,234,0.3)] transform active:scale-[0.98] transition-all">Submit Half Day</button>
                        </form>
                    </div>
                )}
            </div>

            {/* Forgot Check-Out Alert / Form */}
            {forgotRecord && (
                <div className="border border-red-500/40 bg-gradient-to-r from-red-950/60 to-black/80 backdrop-blur-3xl p-8 md:p-10 rounded-[2.5rem] shadow-[0_16px_40px_rgba(220,38,38,0.2)] mb-10 animate-pulse-slow">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        <div className="bg-gradient-to-br from-red-500/20 to-rose-500/20 p-5 rounded-3xl shadow-inner border border-red-500/20 shrink-0">
                            <AlertCircle className="text-red-400 drop-shadow-lg" size={40} />
                        </div>
                        <div className="flex-1 w-full text-center md:text-left">
                            <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-400 mb-3 tracking-tight">Action Required: Missing Check-Out</h3>
                            <p className="text-lg text-gray-300 mb-8 max-w-2xl">
                                We noticed you didn't check out on <b className="text-white bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 ml-1">{new Date(forgotRecord.date).toLocaleDateString()}</b>. 
                                Please update your time below.
                            </p>
                            <form onSubmit={handleForgotSubmit} className="bg-black/50 p-8 rounded-[2rem] border border-white/5 space-y-8 shadow-inner">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-300 mb-3 tracking-wide">Actual Check-Out Time <span className="text-red-500">*</span></label>
                                        <input 
                                            type="time" 
                                            required 
                                            className="w-full bg-white/5 border border-red-500/40 rounded-2xl p-5 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all shadow-inner text-lg" 
                                            value={forgotCheckOutTime} 
                                            onChange={e => setForgotCheckOutTime(e.target.value)} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-300 mb-3 tracking-wide">Overtime (Minutes)</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white focus:ring-2 focus:ring-white/20 outline-none transition-all shadow-inner text-lg placeholder-gray-600" 
                                            value={overtimeMinutes} 
                                            onChange={e => setOvertimeMinutes(e.target.value)} 
                                            placeholder="e.g., 60"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-3 tracking-wide">Reason / Remarks <span className="text-red-500">*</span></label>
                                    <textarea 
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white focus:ring-2 focus:ring-white/20 outline-none transition-all resize-none shadow-inner placeholder-gray-600 text-lg" 
                                        required 
                                        value={forgotReason} 
                                        onChange={e => setForgotReason(e.target.value)} 
                                        placeholder="Explain the missed check-out..." 
                                        rows="2"
                                    ></textarea>
                                </div>
                                <button type="submit" className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold py-5 rounded-2xl shadow-[0_12px_30px_rgba(220,38,38,0.4)] transform active:scale-[0.98] transition-all text-xl tracking-wide">
                                    Resolve Missed Check-Out
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* History Table */}
            <div className="bg-gray-900/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-4">
                        <span className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 p-4 rounded-2xl shadow-inner border border-white/5"><Calendar className="text-cyan-400" size={24} /></span>
                        Attendance Tracking
                    </h3>
                </div>
                
                <div className="overflow-hidden rounded-3xl border border-white/5 bg-black/60 shadow-inner">
                    <div className="overflow-x-auto min-h-[300px]">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-white/5 text-xs uppercase tracking-widest text-gray-400 font-bold border-b border-white/10">
                                    <th className="px-8 py-6">Date</th>
                                    <th className="px-8 py-6">Status</th>
                                    <th className="px-8 py-6">Check In</th>
                                    <th className="px-8 py-6">Check Out</th>
                                    <th className="px-8 py-6">Duration</th>
                                    <th className="px-8 py-6">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {history.length > 0 ? history.map(record => (
                                    <tr key={record._id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-6 text-gray-200 font-semibold text-base">
                                            {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border shadow-sm ${
                                                record.status === 'Present' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                record.status === 'Checked-Out' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                record.status === 'Half Day' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                record.status === 'On Leave' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                record.status === 'Over Work' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                record.status.includes('Pending') ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                                {record.status === 'Present' ? <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> : ''}
                                                {record.status === 'Present' ? 'Present' :
                                                    record.status === 'Absent' ? 'Absent' :
                                                    record.status === 'Half Day' ? 'Half Day' :
                                                    record.status === 'On Leave' ? 'On Leave' :
                                                    record.status === 'Over Work' ? 'Over Work' :
                                                    record.status === 'Checked-Out' ? 'Checked-Out' :
                                                    record.status.includes('Pending') ? 'Pending' : record.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-gray-300">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-base font-medium">{record.checkIn?.time ? new Date(record.checkIn.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span>
                                                {record.checkIn?.status === 'Pending' && <span className="text-yellow-500 text-[10px] uppercase font-bold mt-1 tracking-wider">Awaiting Approval</span>}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-gray-300">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-base font-medium">{record.checkOut?.time ? new Date(record.checkOut.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span>
                                                {record.checkOut?.status === 'Pending' && <span className="text-yellow-500 text-[10px] uppercase font-bold mt-1 tracking-wider">Awaiting Approval</span>}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {record.duration ? (
                                                <span className="inline-block bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-cyan-400 font-mono text-sm font-bold shadow-sm">
                                                    {`${Math.floor(record.duration / 60)}h ${record.duration % 60}m`}
                                                </span>
                                            ) : <span className="text-gray-600 font-mono">--</span>}
                                        </td>
                                        <td className="px-8 py-6 text-gray-400 max-w-xs truncate font-medium" title={record.adminRemarks}>
                                            {record.adminRemarks || '-'}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-500 gap-4">
                                                <Calendar size={40} className="opacity-40" />
                                                <p className="text-lg font-medium">No attendance records found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default EmployeeAttendance;
