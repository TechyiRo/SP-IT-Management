import { useState, useEffect } from 'react';
import { IndianRupee, Calculator, Download, Calendar, Search, TrendingUp, Users, Clock, Eye, X, CheckCircle, Save, AlertCircle, CheckCircle2, MoreVertical, RefreshCcw, ArrowRight } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/ui/Modal';

const Payroll = () => {
    const currentDate = new Date();
    const [month, setMonth] = useState(String(currentDate.getMonth() + 1).padStart(2, '0'));
    const [year, setYear] = useState(String(currentDate.getFullYear()));
    const [searchTerm, setSearchTerm] = useState('');
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingAll, setProcessingAll] = useState(false);
    const [finalizingAll, setFinalizingAll] = useState(false);

    // Breakdown Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [breakdownData, setBreakdownData] = useState(null);
    const [breakdownLoading, setBreakdownLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    // Editable states in table
    const [editingBonus, setEditingBonus] = useState({}); // {userId: value}
    const [editingDeductions, setEditingDeductions] = useState({});

    useEffect(() => {
        fetchData();
    }, [month, year]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch all active employees
            const userRes = await api.get('/api/users');
            const activeEmployees = userRes.data.filter(u => u.role === 'employee' && u.status === 'active');

            // 2. Fetch existing payroll records for this month/year
            const payrollRes = await api.get(`/api/payroll/admin/all-status?month=${month}&year=${year}`);
            const payrolls = payrollRes.data;

            // Merge
            const merged = activeEmployees.map(emp => {
                const payroll = payrolls.find(p => p.employee === emp._id);
                return {
                    ...emp,
                    payroll: payroll || null,
                    status: payroll ? payroll.status : 'Not Generated'
                };
            });

            setEmployees(merged);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching data:', err);
            setLoading(false);
        }
    };

    const handleGenerateAll = async () => {
        setProcessingAll(true);
        try {
            for (const emp of employees) {
                if (emp.status === 'Not Generated' || emp.status === 'Draft') {
                    await api.post('/api/payroll/generate', {
                        userId: emp._id,
                        month,
                        year,
                        status: 'Draft'
                    });
                }
            }
            alert('✅ Drafts generated for all employees!');
            fetchData();
        } catch (err) {
            console.error('Error in batch generate:', err);
            alert('❌ Batch generation failed.');
        } finally {
            setProcessingAll(false);
        }
    };

    const handleFinalizeAll = async () => {
        if (!window.confirm('Are you sure you want to finalize all DRAFT salaries? These will immediately reflect in employee accounts.')) return;
        setFinalizingAll(true);
        try {
            await api.post('/api/payroll/finalize-all', { month, year });
            alert('✅ All draft salaries finalized!');
            fetchData();
        } catch (err) {
            console.error('Error in batch finalize:', err);
            alert('❌ Batch finalization failed.');
        } finally {
            setFinalizingAll(false);
        }
    };

    const handleUpdateFinancials = async (userId, bonus, deductions) => {
        try {
            await api.post('/api/payroll/generate', {
                userId,
                month,
                year,
                bonus,
                deductions,
                status: 'Draft' // Keep as draft when updating
            });
            fetchData();
        } catch (err) {
            console.error('Error updating financials:', err);
        }
    };

    const handleViewBreakdown = async (emp) => {
        setIsModalOpen(true);
        setBreakdownLoading(true);
        setBreakdownData(null);
        try {
            const res = await api.get(`/api/payroll/breakdown/${emp._id}?month=${month}&year=${year}`);
            setBreakdownData({
                ...res.data,
                existing: emp.payroll
            });
            setBreakdownLoading(false);
        } catch (err) {
            console.error('Error fetching breakdown:', err);
            setBreakdownLoading(false);
        }
    };

    const handleGenerateSingle = async (userId, bonus, deductions, status = 'Finalized') => {
        setGenerating(true);
        try {
            await api.post('/api/payroll/generate', {
                userId,
                month,
                year,
                bonus,
                deductions,
                status
            });
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            console.error('Error generating single:', err);
        } finally {
            setGenerating(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPayout = employees.reduce((acc, emp) => acc + (emp.payroll?.netSalary || 0), 0);
    const draftCount = employees.filter(emp => emp.status === 'Draft').length;
    const finalizedCount = employees.filter(emp => emp.status === 'Finalized').length;

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white flex items-center gap-4">
                        <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
                            <IndianRupee className="w-8 h-8 text-white" />
                        </div>
                        Payroll <span className="text-emerald-500">System</span>
                    </h1>
                    <p className="text-gray-400 mt-2 flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-500" /> Manage and finalize monthly employee payments
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3 bg-slate-900 border border-white/10 p-1.5 rounded-2xl">
                        <button 
                            onClick={handleGenerateAll}
                            disabled={processingAll}
                            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                            <RefreshCcw className={`w-4 h-4 ${processingAll ? 'animate-spin' : ''}`} />
                            Generate Drafts
                        </button>
                        <button 
                            onClick={handleFinalizeAll}
                            disabled={finalizingAll || draftCount === 0}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Finalize All ({draftCount})
                        </button>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-2xl border border-white/10">
                        <Calendar className="w-5 h-5 text-emerald-500 ml-2" />
                        <select value={month} onChange={(e) => setMonth(e.target.value)} className="bg-transparent text-white outline-none border-none font-bold text-sm cursor-pointer">
                            <option value="01">January</option>
                            <option value="02">February</option>
                            <option value="03">March</option>
                            <option value="04">April</option>
                            <option value="05">May</option>
                            <option value="06">June</option>
                            <option value="07">July</option>
                            <option value="08">August</option>
                            <option value="09">September</option>
                            <option value="10">October</option>
                            <option value="11">November</option>
                            <option value="12">December</option>
                        </select>
                        <div className="w-px h-4 bg-white/10"></div>
                        <select value={year} onChange={(e) => setYear(e.target.value)} className="bg-transparent text-white outline-none border-none font-bold text-sm cursor-pointer">
                            <option value="2026">2026</option>
                            <option value="2025">2025</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-card p-6 border-l-4 border-blue-500 flex justify-between items-center group hover:bg-white/10 transition-all">
                    <div>
                        <p className="text-xs font-black uppercase text-gray-400 tracking-wider">Total Headcount</p>
                        <h4 className="text-3xl font-black text-white mt-1">{employees.length}</h4>
                    </div>
                    <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6" />
                    </div>
                </div>
                <div className="glass-card p-6 border-l-4 border-yellow-500 flex justify-between items-center group hover:bg-white/10 transition-all">
                    <div>
                        <p className="text-xs font-black uppercase text-gray-400 tracking-wider">Draft Payrolls</p>
                        <h4 className="text-3xl font-black text-white mt-1">{draftCount}</h4>
                    </div>
                    <div className="p-4 bg-yellow-500/10 rounded-2xl text-yellow-500 group-hover:scale-110 transition-transform">
                        <Calculator className="w-6 h-6" />
                    </div>
                </div>
                <div className="glass-card p-6 border-l-4 border-emerald-500 flex justify-between items-center group hover:bg-white/10 transition-all">
                    <div>
                        <p className="text-xs font-black uppercase text-gray-400 tracking-wider">Finalized</p>
                        <h4 className="text-3xl font-black text-white mt-1">{finalizedCount}</h4>
                    </div>
                    <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                </div>
                <div className="glass-card p-6 border-l-4 border-purple-500 flex justify-between items-center group hover:bg-white/10 transition-all">
                    <div>
                        <p className="text-xs font-black uppercase text-gray-400 tracking-wider">Total Payout</p>
                        <h4 className="text-3xl font-black text-white mt-1">₹ {totalPayout.toLocaleString()}</h4>
                    </div>
                    <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-500 group-hover:scale-110 transition-transform">
                        <IndianRupee className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="glass-card overflow-hidden">
                <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                        <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
                        Employee Roster
                    </h2>
                    <div className="relative w-full md:w-96">
                        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text" 
                            placeholder="Search employee by name..." 
                            className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white text-sm focus:border-emerald-500/50 outline-none transition-all placeholder:text-gray-600" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-white/10 text-xs uppercase text-gray-400 font-black tracking-widest">
                            <tr>
                                <th className="p-6">Employee Info</th>
                                <th className="p-6">Base Salary</th>
                                <th className="p-6">Bonus (Add)</th>
                                <th className="p-6">Deductions (Sub)</th>
                                <th className="p-6">Net Payable</th>
                                <th className="p-6 text-center">Status</th>
                                <th className="p-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan="7" className="p-20 text-center text-emerald-400 animate-pulse font-black text-xl">Loading records...</td></tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr><td colSpan="7" className="p-20 text-center text-gray-500 font-bold">No employees found.</td></tr>
                            ) : filteredEmployees.map((emp) => (
                                <tr key={emp._id} className="hover:bg-white/5 transition-all group border-l-4 border-transparent hover:border-emerald-500/30">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center text-white font-black shadow-lg">
                                                {emp.fullName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-black text-white text-base">{emp.fullName}</div>
                                                <div className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-tighter">{emp.designation}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="text-white font-bold">₹ {(emp.baseSalary || 0).toLocaleString()}</div>
                                        <div className="text-[10px] text-gray-500 mt-1 uppercase font-black">Contract base</div>
                                    </td>
                                    <td className="p-6">
                                        <input 
                                            type="number" 
                                            className="w-24 bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-1.5 text-emerald-400 font-bold text-sm outline-none focus:border-emerald-500/50"
                                            defaultValue={emp.payroll?.bonus || 0}
                                            placeholder="Bonus"
                                            onBlur={(e) => handleUpdateFinancials(emp._id, e.target.value, emp.payroll?.deductions || 0)}
                                        />
                                    </td>
                                    <td className="p-6">
                                        <input 
                                            type="number" 
                                            className="w-24 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-1.5 text-red-500 font-bold text-sm outline-none focus:border-red-500/50"
                                            defaultValue={emp.payroll?.deductions || 0}
                                            placeholder="Deductions"
                                            onBlur={(e) => handleUpdateFinancials(emp._id, emp.payroll?.bonus || 0, e.target.value)}
                                        />
                                    </td>
                                    <td className="p-6">
                                        <div className="text-white font-black text-lg">
                                            ₹ {(emp.payroll?.netSalary || 0).toLocaleString()}
                                        </div>
                                        {emp.payroll?.calculatedWithHours > 0 && (
                                            <div className="text-[10px] text-gray-500 mt-1">Calculated from hours</div>
                                        )}
                                    </td>
                                    <td className="p-6 text-center">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] uppercase font-black tracking-widest ${
                                            emp.status === 'Finalized' || emp.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                            emp.status === 'Draft' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                            'bg-white/5 text-gray-500 border border-white/10'
                                        }`}>
                                            {emp.status}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleViewBreakdown(emp)}
                                                className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all shadow-sm"
                                                title="View Daily Details"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleUpdateFinancials(emp._id, emp.payroll?.bonus || 0, emp.payroll?.deductions || 0)}
                                                className="p-2 hover:bg-emerald-500/20 rounded-xl text-emerald-500 transition-all shadow-sm"
                                                title="Refresh Calculation"
                                            >
                                                <RefreshCcw className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Daily Breakdown Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="glass-card w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up border-white/20 shadow-2xl">
                        <div className="p-8 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center bg-white/5 gap-6">
                            <div>
                                <h3 className="text-3xl font-black text-white flex items-center gap-4">
                                    <div className="p-2 bg-emerald-500 rounded-xl"><Calculator className="w-6 h-6" /></div>
                                    Salary <span className="text-emerald-500">Breakdown</span>
                                </h3>
                                {breakdownData && (
                                    <p className="text-sm text-gray-400 mt-2 flex items-center gap-3">
                                        <Users className="w-4 h-4 text-emerald-500" /> <span className="font-black text-white">{breakdownData.user.name}</span> 
                                        <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                                        <Calendar className="w-4 h-4 text-emerald-500" /> <span className="font-bold uppercase opacity-60">{month}/{year}</span>
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => handleGenerateSingle(breakdownData.user.id, breakdownData.existing?.bonus || 0, breakdownData.existing?.deductions || 0, 'Finalized')}
                                    disabled={generating}
                                    className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/30 disabled:opacity-50"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    {generating ? 'Processing...' : 'Finalize Salary'}
                                </button>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/5 hover:bg-red-500/20 rounded-2xl text-gray-400 hover:text-red-500 transition-all border border-white/10 hover:border-red-500/30">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1">
                            {breakdownLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-6">
                                    <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                                    <div className="text-xl font-black text-emerald-400 animate-pulse tracking-widest uppercase">Analyzing Attendance Data...</div>
                                </div>
                            ) : breakdownData ? (
                                <div className="space-y-10">
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                                        <div className="glass-card p-6 bg-emerald-500/10 border-emerald-500/20 relative overflow-hidden group">
                                            <div className="absolute right-[-10px] top-[-10px] text-6xl opacity-10 group-hover:scale-125 transition-transform duration-500">💰</div>
                                            <div className="text-xs text-emerald-400 uppercase font-black tracking-widest">Calculated Net</div>
                                            <div className="text-3xl font-black text-white mt-1">₹ {breakdownData.summary.netSalary.toLocaleString()}</div>
                                            <div className="w-full h-1 bg-emerald-500/20 mt-4 rounded-full overflow-hidden">
                                                <div className="w-3/4 h-full bg-emerald-500"></div>
                                            </div>
                                        </div>
                                        <div className="glass-card p-6 bg-red-500/10 border-red-500/20 relative overflow-hidden group">
                                            <div className="absolute right-[-10px] top-[-10px] text-6xl opacity-10 group-hover:scale-125 transition-transform duration-500">✂️</div>
                                            <div className="text-xs text-red-400 uppercase font-black tracking-widest">Absence Cuts</div>
                                            <div className="text-2xl font-black text-white mt-1">₹ {breakdownData.summary.totalCuts.toLocaleString()}</div>
                                        </div>
                                        <div className="glass-card p-6 bg-purple-500/10 border-purple-500/20 relative overflow-hidden group">
                                            <div className="absolute right-[-10px] top-[-10px] text-6xl opacity-10 group-hover:scale-125 transition-transform duration-500">🚀</div>
                                            <div className="text-xs text-purple-400 uppercase font-black tracking-widest">OT Earnings</div>
                                            <div className="text-2xl font-black text-white mt-1">+₹ {breakdownData.summary.totalOvertimePay.toLocaleString()}</div>
                                        </div>
                                        <div className="glass-card p-6 relative overflow-hidden group bg-white/5 border-white/10">
                                            <div className="absolute right-[-10px] top-[-10px] text-6xl opacity-5 group-hover:scale-125 transition-transform duration-500">📆</div>
                                            <div className="text-xs text-gray-400 uppercase font-black tracking-widest">Attendance</div>
                                            <div className="text-2xl font-black text-white mt-1">{breakdownData.summary.presentDays} <span className="text-xs text-gray-500">Days</span></div>
                                            <div className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-tighter">Of {breakdownData.summary.workingDays} Working Days</div>
                                        </div>
                                        <div className="glass-card p-6 relative overflow-hidden group bg-gradient-to-br from-slate-900 to-black border-emerald-500/30">
                                            <div className="absolute right-[-10px] top-[-10px] text-6xl opacity-10 group-hover:scale-125 transition-transform duration-500">⏱️</div>
                                            <div className="text-xs text-emerald-400 uppercase font-black tracking-widest">Daily Base</div>
                                            <div className="text-2xl font-black text-white mt-1">₹ {breakdownData.summary.dailyRate.toLocaleString()}</div>
                                            <div className="text-[10px] text-gray-600 font-bold mt-1 uppercase">Standard Rate</div>
                                        </div>
                                    </div>

                                    {/* Daily Table */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-4">
                                            <h4 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                                Daily Attendance Logs
                                            </h4>
                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Full Month Insight</div>
                                        </div>
                                        
                                        <div className="border border-white/5 rounded-3xl overflow-hidden bg-slate-900/30">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-white/5 border-b border-white/10 uppercase text-[10px] font-black text-gray-500 tracking-[0.2em]">
                                                    <tr>
                                                        <th className="p-5">Date / Weekday</th>
                                                        <th className="p-5">Status</th>
                                                        <th className="p-5">Check In / Out</th>
                                                        <th className="p-5">Dur.</th>
                                                        <th className="p-5 text-right">Lost Amount</th>
                                                        <th className="p-5 text-right">OT Earn</th>
                                                        <th className="p-5 text-right">Net Earn</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5 font-bold">
                                                    {breakdownData.breakdown.map((day, idx) => (
                                                        <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                                            <td className="p-5">
                                                                <div className="text-white font-black">{new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                                                                <div className="text-[10px] text-gray-500 uppercase">{new Date(day.date).toLocaleDateString('en-GB', { weekday: 'long' })}</div>
                                                            </td>
                                                            <td className="p-5">
                                                                <span className={`px-4 py-1 rounded-lg text-[9px] uppercase font-black border tracking-widest ${
                                                                    day.status === 'Present' || day.status === 'Checked-Out' || day.status === 'Over Work' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                                    day.status === 'Absent' || day.status === 'Forgot Check-Out' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                                    day.status === 'Holiday' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                                    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                                }`}>
                                                                    {day.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-5 text-gray-400 text-xs">
                                                                {day.checkIn ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-emerald-500 opacity-60">IN</span> {new Date(day.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        <span className="text-slate-600 mx-1">|</span>
                                                                        <span className="text-red-500 opacity-60">OUT</span> {day.checkOut ? new Date(day.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                                    </div>
                                                                ) : <span className="opacity-20 flex items-center justify-center"><MoreVertical className="w-4 h-4 rotate-90" /></span>}
                                                            </td>
                                                            <td className="p-5">
                                                                <div className={day.hours > 0 ? "text-white" : "text-gray-600 opacity-30"}>
                                                                    {day.hours > 0 ? day.hours + 'H' : '--'}
                                                                </div>
                                                            </td>
                                                            <td className="p-5 text-right font-black text-red-500">
                                                                {day.cutAmount > 0 ? `-₹${day.cutAmount}` : ''}
                                                            </td>
                                                            <td className="p-5 text-right font-black text-purple-400">
                                                                {day.overtimePay > 0 ? `+₹${day.overtimePay}` : ''}
                                                            </td>
                                                            <td className="p-5 text-right font-black text-emerald-400 text-base">
                                                                ₹ {day.dailyPay.toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <AlertCircle className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                                    <p className="text-gray-500 font-bold">Failed to load detailed breakdown.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payroll;
