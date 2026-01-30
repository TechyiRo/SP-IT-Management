import { useState, useEffect } from 'react';
import { IndianRupee, Calculator, Download, Calendar, Search, TrendingUp, Users, Clock, Eye, X, CheckCircle } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/ui/Modal';

const Payroll = () => {
    const [month, setMonth] = useState('01');
    const [year, setYear] = useState('2026');
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Breakdown Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [breakdownData, setBreakdownData] = useState(null);
    const [breakdownLoading, setBreakdownLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/api/users');
            const activeEmployees = res.data.filter(u => u.role === 'employee' && u.status === 'active');
            setUsers(activeEmployees);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching users:', err);
            setLoading(false);
        }
    };

    const handleViewBreakdown = async (userId) => {
        setIsModalOpen(true);
        setBreakdownLoading(true);
        setBreakdownData(null);
        try {
            const res = await api.get(`/api/payroll/breakdown/${userId}?month=${month}&year=${year}`);
            setBreakdownData(res.data);
            setBreakdownLoading(false);
        } catch (err) {
            console.error('Error fetching breakdown:', err);
            setBreakdownLoading(false);
        }
    };

    const handleGenerateSlip = async () => {
        if (!breakdownData) return;
        setGenerating(true);
        try {
            await api.post('/api/payroll/generate', {
                userId: breakdownData.user.id,
                month,
                year,
                // bonus: 0, // Could add input fields for this
                // deductions: 0
            });
            alert('✅ Salary Slip Finalized & Generated!');
            setGenerating(false);
            setIsModalOpen(false);
        } catch (err) {
            console.error('Error generating slip:', err);
            alert('❌ Failed to generate slip.');
            setGenerating(false);
        }
    };

    // TEMPORARY ESTIMATE FOR LIST VIEW
    const calculateEstimate = (baseSalary) => {
        const salary = parseFloat(baseSalary) || 0;
        const hourlyRate = (salary / 30) / 8;
        return {
            hourlyRate: hourlyRate.toFixed(2)
        };
    };

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
                        Payroll Management
                    </h1>
                    <p className="text-gray-400 mt-1">Calculate and manage monthly salaries.</p>
                </div>

                <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-xl border border-white/10">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <select value={month} onChange={(e) => setMonth(e.target.value)} className="bg-transparent text-white outline-none border-none font-medium">
                        <option value="01">January</option>
                        <option value="02">February</option>
                    </select>
                    <span className="text-gray-500">/</span>
                    <select value={year} onChange={(e) => setYear(e.target.value)} className="bg-transparent text-white outline-none border-none font-medium">
                        <option value="2026">2026</option>
                    </select>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between gap-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-400" /> Employee List
                    </h2>
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="text" placeholder="Search..." className="glass-input pl-10 py-2 w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-white/10 text-xs uppercase text-gray-400 font-medium">
                            <tr>
                                <th className="p-4">Employee</th>
                                <th className="p-4">Base Salary</th>
                                <th className="p-4">Hourly Rate</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {filteredUsers.map((user) => {
                                const { hourlyRate } = calculateEstimate(user.baseSalary);
                                return (
                                    <tr key={user._id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <div className="font-bold text-white">{user.fullName}</div>
                                            <div className="text-xs text-gray-500">{user.designation}</div>
                                        </td>
                                        <td className="p-4 text-gray-300">₹ {(user.baseSalary || 0).toLocaleString()}</td>
                                        <td className="p-4 text-gray-400">₹ {hourlyRate} / hr</td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleViewBreakdown(user._id)}
                                                className="glass-button text-xs py-1.5 px-3 hover:bg-cyan-500/20 hover:text-cyan-400 transition-all flex items-center gap-2 ml-auto"
                                            >
                                                <Eye className="w-3 h-3" /> Process Salary
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Daily Breakdown Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div>
                                <h3 className="text-xl font-bold text-white">Salary Breakdown</h3>
                                {breakdownData && (
                                    <p className="text-sm text-gray-400">{breakdownData.user.name} • {month}/{year}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleGenerateSlip}
                                    disabled={generating}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {generating ? 'Finalizing...' : 'Finalize & Generate Slip'}
                                </button>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {breakdownLoading ? (
                                <div className="text-center py-12 text-cyan-400 animate-pulse">Calculating Daily Logic...</div>
                            ) : breakdownData ? (
                                <div className="space-y-6">
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="glass-card p-4 bg-emerald-500/10 border-emerald-500/20">
                                            <div className="text-xs text-emerald-400 uppercase font-bold">Total Pay</div>
                                            <div className="text-2xl font-bold text-white">₹ {breakdownData.summary.totalPay.toLocaleString()}</div>
                                        </div>
                                        <div className="glass-card p-4">
                                            <div className="text-xs text-gray-400 uppercase font-bold">Total Hours</div>
                                            <div className="text-xl font-bold text-white">{breakdownData.summary.totalHours} h</div>
                                        </div>
                                        <div className="glass-card p-4">
                                            <div className="text-xs text-gray-400 uppercase font-bold">Present Days</div>
                                            <div className="text-xl font-bold text-white">{breakdownData.summary.presentDays} <span className="text-xs text-gray-500">/ {breakdownData.summary.totalDays}</span></div>
                                        </div>
                                        <div className="glass-card p-4">
                                            <div className="text-xs text-gray-400 uppercase font-bold">Hourly Rate</div>
                                            <div className="text-xl font-bold text-white">₹ {breakdownData.user.hourlyRate}</div>
                                        </div>
                                    </div>

                                    {/* Daily Table */}
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-white/5 border-b border-white/10 uppercase text-xs text-gray-500">
                                            <tr>
                                                <th className="p-3">Date</th>
                                                <th className="p-3">Status</th>
                                                <th className="p-3">Check In/Out</th>
                                                <th className="p-3">Hours</th>
                                                <th className="p-3 text-right">Daily Earn</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
                                            {breakdownData.breakdown.map((day, idx) => (
                                                <tr key={idx} className="hover:bg-white/5">
                                                    <td className="p-3 text-white">
                                                        {new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${day.status === 'Present' ? 'bg-green-500/20 text-green-400' :
                                                            day.status === 'Absent' ? 'bg-red-500/20 text-red-400' :
                                                                'bg-yellow-500/20 text-yellow-400'
                                                            }`}>
                                                            {day.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-gray-400 text-xs">
                                                        {day.checkIn ? new Date(day.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'} -
                                                        {day.checkOut ? new Date(day.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                                                    </td>
                                                    <td className="p-3 font-mono text-white">
                                                        {day.hours > 0 ? day.hours + ' h' : '-'}
                                                    </td>
                                                    <td className="p-3 text-right font-bold text-emerald-400">
                                                        ₹ {day.dailyPay}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500">No data found</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payroll;
