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
        <div className="space-y-8 pb-20">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                Attendance & Workflow
            </h1>

            {/* Main Action Card */}
            <div className="glass-card p-8 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[300px]">
                {/* Background Glow */}
                <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20 ${statusInfo.action === 'checkin' ? 'bg-cyan-500' :
                    statusInfo.action === 'checkout' ? 'bg-red-500' : 'bg-purple-500'
                    }`}></div>

                {/* Clock */}
                <div className="text-5xl font-mono font-bold mb-2 text-white">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-gray-400 mb-8">{currentTime.toDateString()}</div>

                {/* Status Indicator */}
                <div className="mb-8 flex flex-col items-center">
                    <span className="text-6xl mb-2">{statusInfo.emoji}</span>
                    <h2 className="text-2xl font-bold text-white">{statusInfo.text}</h2>
                    <p className="text-sm text-gray-400 mt-1">{statusInfo.message}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-4 z-10 flex-wrap justify-center">
                    {statusInfo.action === 'checkin' && (
                        <>
                            <button onClick={handleCheckInRequest} className="glass-button bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-full flex items-center gap-2 transform hover:scale-105 transition-all">
                                <Clock size={20} /> Request Check-In 🟢
                            </button>
                            <button onClick={() => setShowLeaveForm(true)} className="glass-button bg-orange-600/80 hover:bg-orange-600 text-white px-6 py-3 rounded-full flex items-center gap-2">
                                <FileText size={20} /> Request Leave 🏖️
                            </button>
                        </>
                    )}

                    {statusInfo.action === 'checkout' && (
                        <button onClick={handleCheckOutRequest} className="glass-button bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-full flex items-center gap-2 transform hover:scale-105 transition-all">
                            <Clock size={20} /> Request Check-Out 🔴
                        </button>
                    )}

                    {!showHalfDayForm && !showLeaveForm && !todayRecord && (
                        <button onClick={() => setShowHalfDayForm(true)} className="glass-button bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 px-6 py-3 rounded-full flex items-center gap-2">
                            Half Day 🌓
                        </button>
                    )}
                </div>
            </div>

            {/* Leave Form */}
            {showLeaveForm && (
                <div className="glass-card p-6 animate-fade-in border border-orange-500/30 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">🏖️ Request Full Day Leave</h3>
                        <button onClick={() => setShowLeaveForm(false)}><XCircle className="text-gray-400 hover:text-white" size={20} /></button>
                    </div>
                    <form onSubmit={handleLeaveSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-sm text-gray-400">Attachment (Optional)</label>
                            <input type="file" className="glass-input w-full" onChange={e => setLeaveFile(e.target.files[0])} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Reason</label>
                            <textarea className="glass-input w-full" required value={leaveReason} onChange={e => setLeaveReason(e.target.value)} placeholder="Why do you need a leave?" rows="2"></textarea>
                        </div>
                        <button type="submit" className="glass-button w-full bg-orange-600 hover:bg-orange-500 text-white">Submit Leave Request</button>
                    </form>
                </div>
            )}

            {/* Half Day Form */}
            {showHalfDayForm && (
                <div className="glass-card p-6 animate-fade-in border border-purple-500/30">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">🌓 Request Half Day</h3>
                        <button onClick={() => setShowHalfDayForm(false)}><XCircle className="text-gray-400 hover:text-white" size={20} /></button>
                    </div>
                    <form onSubmit={handleHalfDaySubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Select Half</label>
                                <select className="glass-input w-full" value={halfDayType} onChange={e => setHalfDayType(e.target.value)}>
                                    <option>First Half</option>
                                    <option>Second Half</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Attachment (Optional)</label>
                                <input type="file" className="glass-input w-full" onChange={e => setFile(e.target.files[0])} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Reason</label>
                            <textarea className="glass-input w-full" required value={halfDayReason} onChange={e => setHalfDayReason(e.target.value)} placeholder="Why do you need a half day?" rows="2"></textarea>
                        </div>
                        <button type="submit" className="glass-button w-full bg-purple-600 hover:bg-purple-500 text-white">Submit Request</button>
                    </form>
                </div>
            )}

            {/* Forgot Check-Out Alert / Form */}
            {forgotRecord && (
                <div className="glass-card p-6 border-l-4 border-red-500 bg-red-500/10 mb-6 animate-pulse-slow">
                    <div className="flex items-start gap-4">
                        <AlertCircle className="text-red-400 mt-1 shrink-0" size={24} />
                        <div className="flex-1 w-full">
                            <h3 className="text-lg font-bold text-red-400 mb-1">Missing Check-Out Detected</h3>
                            <p className="text-sm text-gray-300 mb-4">
                                You forgot to complete your Check-Out on <b>{new Date(forgotRecord.date).toLocaleDateString()}</b>. 
                                Please update your check-out time. You can also request an overtime allowance if applicable.
                            </p>
                            <form onSubmit={handleForgotSubmit} className="space-y-4 bg-black/40 p-4 rounded-lg border border-red-500/20">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Actual Check-Out Time *</label>
                                        <input 
                                            type="time" 
                                            required 
                                            className="glass-input w-full border-red-500/30 focus:border-red-500" 
                                            value={forgotCheckOutTime} 
                                            onChange={e => setForgotCheckOutTime(e.target.value)} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Overtime (Minutes)</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            className="glass-input w-full" 
                                            value={overtimeMinutes} 
                                            onChange={e => setOvertimeMinutes(e.target.value)} 
                                            placeholder="Optional Overtime"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Reason / Remarks *</label>
                                    <textarea 
                                        className="glass-input w-full" 
                                        required 
                                        value={forgotReason} 
                                        onChange={e => setForgotReason(e.target.value)} 
                                        placeholder="Explain why the checkout was missed and overtime request (if any)..." 
                                        rows="2"
                                    ></textarea>
                                </div>
                                <button type="submit" className="glass-button w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                                    Submit Missing Check-Out
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* History Table */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Calendar size={18} className="text-cyan-400" /> Attendance History</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-white/10 uppercase text-xs text-gray-400">
                            <tr>
                                <th className="p-3">Date</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Check In</th>
                                <th className="p-3">Check Out</th>
                                <th className="p-3">Duration</th>
                                <th className="p-3">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {history.length > 0 ? history.map(record => (
                                <tr key={record._id} className="hover:bg-white/5 text-sm">
                                    <td className="p-3 text-gray-300">{new Date(record.date).toLocaleDateString()}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs border ${
                                            record.status === 'Present' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                            record.status === 'Checked-Out' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                                            record.status === 'Half Day' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                                            record.status === 'On Leave' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                                            record.status === 'Over Work' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                                            record.status.includes('Pending') ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                                            'bg-red-500/20 text-red-300 border-red-500/30'
                                        }`}>
                                            {record.status === 'Present' ? '🟢 Present' :
                                                record.status === 'Absent' ? '🔴 Absent' :
                                                record.status === 'Half Day' ? '🌓 Half Day' :
                                                record.status === 'On Leave' ? '🏖️ On Leave' :
                                                record.status === 'Over Work' ? '🔥 Over Work' :
                                                record.status === 'Checked-Out' ? '✅ Checked-Out' :
                                                record.status.includes('Pending') ? '🕒 Pending' : record.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-gray-400">
                                        {record.checkIn?.time ? new Date(record.checkIn.time).toLocaleTimeString() : '-'}
                                        {record.checkIn?.status === 'Pending' && <span className="text-yellow-500 ml-1">(Wait)</span>}
                                    </td>
                                    <td className="p-3 text-gray-400">
                                        {record.checkOut?.time ? new Date(record.checkOut.time).toLocaleTimeString() : '-'}
                                    </td>
                                    <td className="p-3 text-cyan-400 font-mono">
                                        {record.duration ? `${Math.floor(record.duration / 60)}h ${record.duration % 60}m` : '-'}
                                    </td>
                                    <td className="p-3 text-gray-500 text-xs italic">
                                        {record.adminRemarks || '-'}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="6" className="p-4 text-center text-gray-500">No records found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
export default EmployeeAttendance;
