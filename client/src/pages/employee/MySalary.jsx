import { Download, Share2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../../api/axios';

const MySalary = () => {
    const { user } = useAuth();
    const [salaryData, setSalaryData] = useState(null);
    const [month] = useState('01'); // Default for demo
    const [year] = useState('2026');

    useEffect(() => {
        if (user) {
            fetchMySalary();
        }
    }, [user, month, year]);

    const fetchMySalary = async () => {
        // 1. Try to get Finalized Payroll Record
        try {
            const res = await api.get(`/api/payroll/status/${user._id}?month=${month}&year=${year}`);
            if (res.data) {
                // Found Finalized Record
                const p = res.data;
                setSalaryData({
                    type: 'FINAL',
                    month: `${month}/${year}`,
                    user: user.fullName,
                    role: user.designation,
                    baseSalary: p.baseSalary,
                    workingDays: p.presentDays,
                    totalHours: p.totalHours,
                    hourlyRate: p.hourlyRate.toFixed(2),
                    earnings: p.calculatedWithHours,
                    bonus: p.bonus,
                    deductions: p.deductions,
                    netSalary: p.netSalary,
                    status: p.status // Generated/Paid
                });
                return;
            }
        } catch (err) {
            console.error('Error fetching payroll status:', err);
        }

        // 2. If no finalized record, show Estimated (Dynamic)
        calculateEstimatedSalary();
    };

    const calculateEstimatedSalary = () => {
        const baseSalary = user.baseSalary || 0;
        const totalDaysInMonth = 30;
        const standardHoursPerDay = 8;

        // Mocking attendance data for estimate
        const workedHours = 192;

        const hourlyRate = (baseSalary / totalDaysInMonth) / standardHoursPerDay;
        const calculatedPay = Math.round(hourlyRate * workedHours);

        setSalaryData({
            type: 'ESTIMATE',
            month: `${month}/${year}`,
            user: user.fullName,
            role: user.designation,
            baseSalary: baseSalary,
            workingDays: 24,
            totalHours: workedHours,
            hourlyRate: hourlyRate.toFixed(2),
            earnings: calculatedPay,
            bonus: 0,
            deductions: 0,
            netSalary: calculatedPay,
            status: 'Pending'
        });
    };

    if (!salaryData) return <div className="text-white">Loading salary data...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-6">My Salary</h1>

            {/* Salary Slip Card */}
            <div className="glass-card overflow-hidden relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

                {/* Header */}
                <div className="bg-white/5 p-6 border-b border-white/10 flex justify-between items-start relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                SP
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">SP IT Technologies</h2>
                                <p className="text-xs text-gray-400">Pvt. Ltd.</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-sm text-gray-400 uppercase tracking-wider">Salary Slip For</h3>
                            <p className="text-xl font-bold text-white">{salaryData.month}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${salaryData.type === 'FINAL'
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            }`}>
                            {salaryData.type === 'FINAL' ? 'GENERATED' : 'ESTIMATE'}
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 relative z-10">
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Employee Name</p>
                            <p className="font-bold text-white">{salaryData.user}</p>
                            <p className="text-xs text-gray-400 mt-1">{salaryData.role}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1">Total Worked Hours</p>
                            <p className="font-mono text-xl text-yellow-400">{salaryData.totalHours} Hrs</p>
                            {salaryData.type === 'FINAL' && (
                                <p className="text-xs text-gray-400 mt-1">Finalized</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-dashed border-white/10">
                            <span className="text-gray-400 text-sm">Base Salary</span>
                            <span className="text-white font-medium">₹ {salaryData.baseSalary.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-dashed border-white/10">
                            <span className="text-emerald-400 text-sm">Hourly Earnings ({salaryData.hourlyRate}/hr)</span>
                            <span className="text-white font-medium">₹ {salaryData.earnings.toLocaleString()}</span>
                        </div>
                        {salaryData.bonus > 0 && (
                            <div className="flex justify-between items-center py-2 border-b border-dashed border-white/10">
                                <span className="text-green-400 text-sm">Bonus</span>
                                <span className="text-white font-medium">+ ₹ {salaryData.bonus}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center py-2 border-b border-dashed border-white/10">
                            <span className="text-red-400 text-sm">Deductions</span>
                            <span className="text-white font-medium">- ₹ {salaryData.deductions}</span>
                        </div>
                    </div>

                    {/* Total */}
                    <div className="mt-8 pt-6 border-t border-white/20 flex justify-between items-center">
                        <div>
                            <p className="text-sm text-gray-400">Net Salary Payable</p>
                            <p className="text-xs text-gray-500">Transferred to Bank Acc ending **8899</p>
                        </div>
                        <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                            ₹ {salaryData.netSalary.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-white/5 p-4 flex gap-3 justify-end">
                    <button className="glass-button text-sm flex items-center gap-2">
                        <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                        <Download className="w-4 h-4" /> Download PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MySalary;
