import { Download, Share2, Receipt, PenTool, Upload, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import html2pdf from 'html2pdf.js';
import api from '../../api/axios';

const MySalary = () => {
    const { user } = useAuth();
    const [salaryData, setSalaryData] = useState(null);
    const currentDate = new Date();
    const currentMonthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
    const currentYearStr = String(currentDate.getFullYear());

    const [month, setMonth] = useState(currentMonthStr);
    const [year, setYear] = useState(currentYearStr);
    const [loading, setLoading] = useState(false);
    
    // Signature states
    const [employeeSignature, setEmployeeSignature] = useState(null);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [signatureType, setSignatureType] = useState('draw'); // 'draw' or 'upload'
    const sigCanvas = useRef(null);
    const printRef = useRef(null);

    const handleDownloadPDF = () => {
        const element = printRef.current;
        if (!element) return;

        const opt = {
            margin:       10,
            filename:     `${salaryData.user}_Salary_Slip_${salaryData.month.replace('/', '-')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Delay download to ensure UI is ready
        html2pdf().set(opt).from(element).save();
    };

    const handleClearSignature = () => {
        if (sigCanvas.current) {
            sigCanvas.current.clear();
        }
    };

    const handleSaveSignature = () => {
        if (sigCanvas.current) {
            if (sigCanvas.current.isEmpty()) {
                alert("Please draw your signature before saving.");
                return;
            }
            // Use getCanvas() instead of getTrimmedCanvas() to avoid cropping issues with transparent backgrounds
            setEmployeeSignature(sigCanvas.current.getCanvas().toDataURL('image/png'));
            setShowSignatureModal(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEmployeeSignature(reader.result);
                setShowSignatureModal(false);
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        if (user) {
            fetchMySalary();
        }
    }, [user, month, year]);

    const fetchMySalary = async () => {
        setLoading(true);
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

        // 2. If no finalized record, show Estimated (Dynamic live calculation)
        try {
            const breakdownRes = await api.get(`/api/payroll/breakdown/${user._id}?month=${month}&year=${year}`);
            if (breakdownRes.data) {
                const b = breakdownRes.data;
                setSalaryData({
                    type: 'ESTIMATE',
                    month: `${month}/${year}`,
                    user: user.fullName,
                    role: user.designation,
                    baseSalary: b.user.baseSalary,
                    workingDays: b.summary.workingDays,
                    totalHours: b.summary.totalHours,
                    hourlyRate: b.summary.dailyRate, // daily rate instead of hourly rate to avoid confusion
                    earnings: b.summary.netSalary + b.summary.totalCuts - b.summary.totalOvertimePay, // Calculated base earned before overtime
                    bonus: b.summary.totalOvertimePay, // Show overtime in bonus section
                    deductions: b.summary.totalCuts,
                    netSalary: b.summary.netSalary,
                    status: 'Pending'
                });
            }
        } catch (err) {
            console.error('Error calculating estimate:', err);
            setSalaryData(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !salaryData) return <div className="text-white flex items-center gap-2 animate-pulse">Loading salary data...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Caveat:wght@400..700&display=swap');
                .clean-font { font-family: 'Outfit', sans-serif; }
                .handwriting { font-family: 'Caveat', cursive; }
                .paper-texture {
                    background-color: #ffffff;
                    background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E");
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1);
                }
                .ink-blue { color: #0f172a; }
                .ink-red { color: #dc2626; }
            `}</style>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Receipt className="text-emerald-400" /> My Salary Slip
                    </h1>
                    <p className="text-gray-400 mt-1 flex items-center gap-2">View and download your monthly payroll <span className="animate-bounce">📝</span></p>
                </div>
                <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-xl border border-white/10 shrink-0">
                    <select value={month} onChange={(e) => setMonth(e.target.value)} className="bg-transparent text-white outline-none border-none font-medium cursor-pointer">
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
                    <span className="text-gray-500">/</span>
                    <select value={year} onChange={(e) => setYear(e.target.value)} className="bg-transparent text-white outline-none border-none font-medium cursor-pointer">
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                    </select>
                </div>
                <div className="flex gap-3 hidden sm:flex">
                    <button className="glass-button text-sm flex items-center gap-2 hover:bg-white/10">
                        <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button onClick={handleDownloadPDF} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20 group">
                        <Download className="w-4 h-4 group-hover:translate-y-1 transition-transform" /> Download PDF
                    </button>
                </div>
            </div>

            {/* Salary Slip "Paper" Wrapper */}
            <div className="relative mt-8 group" ref={printRef}>
                {/* Decorative Shadow/Back (hidden during print usually, but kept for aesthetics) */}
                <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl transform scale-[1.02] opacity-50 transition-colors duration-700 data-html2canvas-ignore"></div>
                
                {/* The Paper Component */}
                <div className="paper-texture rounded-xl relative z-10 overflow-hidden border border-slate-200 clean-font bg-white">
                    
                    {/* Header */}
                    <div className="p-8 border-b border-slate-200 flex justify-between items-start relative bg-slate-50/50">
                        {/* Fake Stamp */}
                        {salaryData.type === 'FINAL' && (
                            <div className="absolute top-6 right-8 border-[3px] border-red-600/60 rounded-lg px-4 py-1 flex items-center justify-center transform rotate-12 opacity-80 pointer-events-none group-hover:scale-105 transition-all">
                                <span className="handwriting text-3xl ink-red font-bold tracking-widest">APPROVED</span>
                            </div>
                        )}

                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg border border-slate-700">
                                    SP
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">SP IT Technologies</h2>
                                    <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">Private Limited</p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">Salary Slip For</h3>
                                <div className="inline-block relative">
                                    <p className="text-4xl ink-blue font-bold mt-1 tracking-tight">{salaryData.month}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-8 relative">
                        {/* Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                            <span className="text-8xl font-serif font-bold text-slate-900 transform -rotate-45">CONFIDENTIAL</span>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-10 relative z-10">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold mb-2">Employee Name</p>
                                <p className="text-3xl ink-blue leading-none font-bold">{salaryData.user}</p>
                                <p className="text-lg text-slate-500 mt-2 font-medium">{salaryData.role}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold mb-2">Total Worked</p>
                                <p className="text-3xl ink-blue font-bold">{salaryData.totalHours} <span className="text-xl text-slate-400 font-medium">Hrs</span></p>
                                {salaryData.type === 'FINAL' && (
                                    <p className="text-xs text-emerald-600 font-bold uppercase mt-2 tracking-wide">Finalized</p>
                                )}
                            </div>
                        </div>

                        {/* Breakdown Section */}
                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors">
                                <span className="text-slate-600 text-xs font-bold uppercase tracking-widest">Base Salary</span>
                                <span className="text-2xl ink-blue font-semibold">₹ {parseInt(salaryData.baseSalary).toLocaleString()}</span>
                            </div>
                            
                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors">
                                <span className="text-slate-600 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                    Computed Earnings <span className="text-[10px] lowercase tracking-normal bg-slate-200 px-2 py-1 rounded-md text-slate-600">
                                        {salaryData.type === 'FINAL' ? `@${salaryData.hourlyRate}/hr` : `Base Paid`}
                                    </span>
                                </span>
                                <span className="text-2xl text-emerald-600 font-semibold">₹ {parseInt(salaryData.earnings).toLocaleString()}</span>
                            </div>

                            {salaryData.bonus > 0 && (
                                <div className="flex justify-between items-center bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                                    <span className="text-emerald-700 text-xs font-bold uppercase tracking-widest">
                                        {salaryData.type === 'FINAL' ? 'Bonus / Allowances' : 'Overtime Earned'}
                                    </span>
                                    <span className="text-2xl text-emerald-700 font-semibold">+ ₹ {parseInt(salaryData.bonus).toLocaleString()}</span>
                                </div>
                            )}

                            {salaryData.deductions > 0 && (
                                <div className="flex justify-between items-center bg-red-50/50 p-4 rounded-xl border border-red-100">
                                    <span className="text-red-600 text-xs font-bold uppercase tracking-widest">Deductions (Cuts)</span>
                                    <span className="text-2xl text-red-600 font-semibold">- ₹ {parseInt(salaryData.deductions).toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        {/* Total Net Pay Box */}
                        <div className="mt-8 p-6 bg-slate-800 rounded-2xl flex flex-col sm:flex-row justify-between items-center sm:items-end relative z-10 shadow-xl overflow-hidden">
                            <div className="absolute right-0 top-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                            
                            <div className="text-center sm:text-left mb-4 sm:mb-0">
                                <p className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-2">Net Salary Payable</p>
                                <p className="text-sm text-slate-300 font-medium">Transferred to Bank Account</p>
                            </div>
                            <div className="text-center sm:text-right">
                                <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Total Transfer</span>
                                <span className="text-5xl sm:text-6xl text-white font-bold tracking-tight">
                                    ₹{parseInt(salaryData.netSalary).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="mt-12 grid grid-cols-2 gap-8 text-center pt-8 border-t border-slate-200 relative z-10">
                            <div>
                                {/* Director signature uses the provided image file */}
                                <img src="/director.png" onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/150x80/ffffff/1a365d?text=Director+Sign" }} alt="Director Signature" className="h-24 mx-auto object-contain -translate-y-2 opacity-90 drop-shadow-sm mix-blend-multiply" />
                                <div className="w-40 h-px bg-slate-300 mx-auto mt-2"></div>
                                <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-2 font-bold">Director Signature</p>
                            </div>
                            <div className="flex flex-col items-center justify-end h-full relative group">
                                {employeeSignature ? (
                                    <div className="relative group/edit cursor-pointer" onClick={() => setShowSignatureModal(true)}>
                                        <img src={employeeSignature} alt="Employee Signature" className="h-[75px] mx-auto object-contain mix-blend-multiply drop-shadow-sm pointer-events-none" />
                                        <div className="absolute inset-0 bg-white/80 opacity-0 group-hover/edit:opacity-100 transition-opacity flex items-center justify-center rounded data-html2canvas-ignore">
                                            <span className="text-xs font-bold text-slate-600 bg-white px-2 py-1 rounded shadow-sm">Edit</span>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setShowSignatureModal(true)}
                                        className="h-12 px-4 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded-xl text-xs font-bold transition-all flex items-center gap-2 mb-2 group/btn data-html2canvas-ignore"
                                    >
                                        <PenTool className="w-3 h-3 group-hover/btn:scale-110 transition-transform" /> Add Signature
                                    </button>
                                )}
                                <div className="w-40 h-px bg-slate-300 mx-auto mt-auto"></div>
                                <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-2 font-bold">Employee Signature</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Signature Modal */}
            {showSignatureModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Add Your Signature</h3>
                            <button onClick={() => setShowSignatureModal(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-lg">
                                <button 
                                    onClick={() => setSignatureType('draw')} 
                                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-2 ${signatureType === 'draw' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <PenTool className="w-4 h-4" /> Draw
                                </button>
                                <button 
                                    onClick={() => setSignatureType('upload')} 
                                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-2 ${signatureType === 'upload' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Upload className="w-4 h-4" /> Upload
                                </button>
                            </div>

                            {signatureType === 'draw' ? (
                                <div className="flex flex-col items-center">
                                    <div className="border border-slate-300 rounded-lg bg-white overflow-hidden cursor-crosshair relative shadow-inner mb-4">
                                        <SignatureCanvas 
                                            ref={sigCanvas}
                                            penColor="#0f172a"
                                            velocityFilterWeight={0.7}
                                            minWidth={1.5}
                                            maxWidth={3}
                                            canvasProps={{width: 350, height: 160, className: "bg-transparent touch-none"}}
                                        />
                                        <span className="absolute bottom-2 left-2 text-[10px] text-slate-300 font-medium pointer-events-none tracking-widest uppercase">Sign Here</span>
                                    </div>
                                    <div className="flex gap-3 w-full">
                                        <button onClick={handleClearSignature} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-colors">
                                            Clear
                                        </button>
                                        <button onClick={handleSaveSignature} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20">
                                            Save Signature
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 p-8 text-center hover:bg-slate-100 transition-colors cursor-pointer relative">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-slate-600">Select signature image</p>
                                    <p className="text-xs text-slate-400 mt-1">PNG or JPG, up to 2MB</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MySalary;
