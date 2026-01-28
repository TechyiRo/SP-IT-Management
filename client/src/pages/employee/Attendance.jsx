import { useState, useEffect } from 'react';
import axios from 'axios';
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

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        fetchAttendanceData();
        return () => clearInterval(timer);
    }, []);

    const fetchAttendanceData = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/attendance/me');
            setHistory(res.data);

            const today = new Date().toDateString();
            const record = res.data.find(a => new Date(a.date).toDateString() === today);
            setTodayRecord(record || null);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleCheckInRequest = async () => {
        try {
            // Optional: Get Location
            const location = "Office (Auto)"; // Placeholder for actual Geo logic
            await axios.post('http://localhost:5000/api/attendance/check-in', { location, remarks: 'Regular Check-in' });
            alert('Check-In Request Sent! 🟢');
            fetchAttendanceData();
        } catch (err) {
            alert(err.response?.data?.msg || 'Request Failed');
        }
    };

    const handleCheckOutRequest = async () => {
        try {
            await axios.post('http://localhost:5000/api/attendance/check-out', { remarks: 'Regular Check-out' });
            alert('Check-Out Request Sent! 🔴');
            fetchAttendanceData();
        } catch (err) {
            alert(err.response?.data?.msg || 'Request Failed');
        }
    };

    const handleHalfDaySubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('reason', halfDayReason);
            formData.append('type', halfDayType);
            if (file) formData.append('attachment', file);

            await axios.post('http://localhost:5000/api/attendance/half-day', formData);
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

            await axios.post('http://localhost:5000/api/attendance/leave', formData);
            alert('Leave Request Sent! 🏖️');
            setShowLeaveForm(false);
            fetchAttendanceData();
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.msg || err.response?.data || err.message || 'Request Failed';
            alert(`Request Failed: ${typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg}`);
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
                                        <span className={`px-2 py-1 rounded-full text-xs border ${record.status === 'Present' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                            record.status === 'On Leave' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                                                record.status.includes('Pending') ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                                                    'bg-red-500/20 text-red-300 border-red-500/30'
                                            }`}>
                                            {record.status === 'Present' ? '🟢 Present' :
                                                record.status === 'Absent' ? '🔴 Absent' :
                                                    record.status === 'Half Day' ? '🌓 Half Day' :
                                                        record.status === 'On Leave' ? '🏖️ On Leave' :
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
