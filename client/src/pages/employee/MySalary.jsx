import { Download, Share2, Receipt, PenTool, Upload, X, ShieldCheck, Clock, FileText, AlertCircle, ChevronRight, IndianRupee } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import html2pdf from 'html2pdf.js';
import api from '../../api/axios';

const MySalary = () => {
    const { user } = useAuth();
    const currentDate = new Date();
    const [month, setMonth] = useState(String(currentDate.getMonth() + 1).padStart(2, '0'));
    const [year, setYear] = useState(String(currentDate.getFullYear()));
    const [loading, setLoading] = useState(false);
    const [salaryData, setSalaryData] = useState(null);
    const [statusText, setStatusText] = useState('Checking Status...');

    // Signature states
    const [employeeSignature, setEmployeeSignature] = useState(null);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [signatureType, setSignatureType] = useState('draw');
    const sigCanvas = useRef(null);
    const printRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchMySalary();
        }
    }, [user, month, year]);

    const fetchMySalary = async () => {
        setLoading(true);
        setSalaryData(null);
        setStatusText('Analyzing Payroll...');
        try {
            const res = await api.get(`/api/payroll/status/${user._id}?month=${month}&year=${year}`);
            if (res.data) {
                const p = res.data;
                // Double check status: if only Finalized/Paid are allowed by backend, they will be here.
                setSalaryData({
                    type: 'FINAL',
                    id: p._id,
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
                    status: p.status,
                    paymentDate: p.paymentDate
                });
            } else {
                setStatusText('Payroll Pending Admin Finalization');
            }
        } catch (err) {
            console.error('Error fetching payroll:', err);
            setSalaryData(null);
            setStatusText('Error fetching data');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        const element = printRef.current;
        if (!element) return;
        const opt = {
            margin: 10,
            filename: `${salaryData.user}_SalarySlip_${salaryData.month.replace('/', '-')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    const handleSaveSignature = () => {
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
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

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-40 gap-6">
            <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            <div className="text-xl font-black text-white animate-pulse tracking-[0.2em] uppercase">Retrieving Payroll...</div>
        </div>
    );

    if (!salaryData) return (
        <div className="max-w-2xl mx-auto py-20 text-center animate-fade-in">
            {/* Empty State UI */}
            <div className="glass-card p-12 space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform">
                    <AlertCircle className="w-64 h-64 text-white" />
                </div>
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <Clock className="w-10 h-10 text-emerald-500 animate-pulse" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white">{statusText}</h2>
                    <p className="text-gray-500 font-bold max-w-sm mx-auto">
                        Your salary slip for <span className="text-emerald-500">{month}/{year}</span> is currently being processed by the accounts department.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-xl border border-white/10 w-fit mx-auto">
                    <select value={month} onChange={(e) => setMonth(e.target.value)} className="bg-transparent text-white outline-none border-none font-black text-sm uppercase cursor-pointer">
                        <option value="01">Jan</option><option value="02">Feb</option><option value="03">Mar</option><option value="04">Apr</option>
                        <option value="05">May</option><option value="06">Jun</option><option value="07">Jul</option><option value="08">Aug</option>
                        <option value="09">Sep</option><option value="10">Oct</option><option value="11">Nov</option><option value="12">Dec</option>
                    </select>
                    <div className="w-px h-3 bg-white/10"></div>
                    <select value={year} onChange={(e) => setYear(e.target.value)} className="bg-transparent text-white outline-none border-none font-black text-sm cursor-pointer">
                        <option value="2026">2026</option><option value="2025">2025</option>
                    </select>
                </div>
                <p className="text-[10px] text-gray-700 uppercase font-bold tracking-widest pt-4">Usually generated by the 1st of every month</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-10 pb-32">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Caveat:wght@400..700&display=swap');
                .clean-font { font-family: 'Space+Grotesk', sans-serif; }
                .handwriting { font-family: 'Caveat', cursive; }
                .paper-texture {
                    background-color: #ffffff;
                    background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E");
                    box-shadow: 0 40px 100px -20px rgba(0,0,0,0.5);
                }
            `}</style>

            {/* Header Control Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-4">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-emerald-500 rounded-3xl shadow-xl shadow-emerald-500/20">
                        <FileText className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white">Salary <span className="text-emerald-500">Vault</span></h1>
                        <p className="text-gray-500 font-bold flex items-center gap-2 mt-1">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Securely view and download slips
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-4 bg-slate-900 p-2 rounded-2xl border border-white/10 grow">
                        <Calendar className="w-5 h-5 text-emerald-500 ml-2" />
                        <select value={month} onChange={(e) => setMonth(e.target.value)} className="bg-transparent text-white outline-none border-none font-black text-sm uppercase grow cursor-pointer">
                            <option value="01">Jan</option><option value="02">Feb</option><option value="03">Mar</option><option value="04">Apr</option>
                            <option value="05">May</option><option value="06">Jun</option><option value="07">Jul</option><option value="08">Aug</option>
                            <option value="09">Sep</option><option value="10">Oct</option><option value="11">Nov</option><option value="12">Dec</option>
                        </select>
                        <div className="w-px h-4 bg-white/10"></div>
                        <select value={year} onChange={(e) => setYear(e.target.value)} className="bg-transparent text-white outline-none border-none font-black text-sm cursor-pointer grow">
                            <option value="2026">2026</option><option value="2025">2025</option>
                        </select>
                    </div>
                    <button onClick={handleDownloadPDF} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 group grow md:grow-0">
                        <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" /> PDF
                    </button>
                </div>
            </div>

            {/* The Document */}
            <div className="relative group animate-fade-in-up" ref={printRef}>
                <div className="absolute inset-0 bg-emerald-500/10 rounded-[2.5rem] blur-3xl transform scale-105 opacity-50 data-html2canvas-ignore"></div>
                
                <div className="paper-texture rounded-[2.5rem] relative z-10 overflow-hidden border border-slate-200 clean-font bg-white">
                    {/* Top Branding Section */}
                    <div className="p-12 border-b-2 border-slate-100 flex justify-between items-start relative bg-slate-50/50">
                        {/* Status Stamp */}
                        <div className="absolute top-12 right-12 border-[5px] border-emerald-600/40 rounded-2xl px-8 py-2 flex items-center justify-center transform rotate-12 opacity-80 pointer-events-none group-hover:scale-110 transition-all font-black text-emerald-600 uppercase tracking-[0.4em] text-4xl handwriting">
                            {salaryData.status === 'Paid' ? 'PAID' : 'APPROVED'}
                        </div>

                        <div className="space-y-8">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-2xl border-4 border-slate-700/50">
                                    SP
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">SP IT Management</h2>
                                    <p className="text-xs text-slate-400 uppercase tracking-[0.3em] font-black mt-2">Professional Payroll Portal</p>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-[10px] text-slate-400 uppercase tracking-[0.5em] font-black">Official Payment Slip For</h3>
                                <p className="text-6xl font-black text-slate-900 mt-2 tracking-tighter uppercase">{new Date(0, month-1).toLocaleString('default', { month: 'long' })} <span className="text-emerald-500">{year}</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="p-12 space-y-12 relative">
                        {/* Confidential Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
                            <span className="text-[12rem] font-black text-slate-900 transform -rotate-45 tracking-widest">OFFICIAL</span>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-12 relative z-10">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-4">Payee Details</p>
                                <div className="space-y-1">
                                    <p className="text-4xl font-black text-slate-900 leading-none">{salaryData.user}</p>
                                    <p className="text-sm text-emerald-600 font-black uppercase tracking-widest">{salaryData.role}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-4">Engagement Stats</p>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-end gap-2 text-slate-900">
                                        <span className="text-4xl font-black">{salaryData.totalHours}</span>
                                        <span className="text-base font-bold text-slate-400 mb-1">Hrs Logged</span>
                                    </div>
                                    <div className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase">Verified Attendance</div>
                                </div>
                            </div>
                        </div>

                        {/* Calculation Block */}
                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-slate-300 transition-all group/row">
                                <div className="flex items-center gap-4">
                                    <div className="w-1.5 h-6 bg-slate-200 group-hover:bg-slate-400 transition-colors rounded-full"></div>
                                    <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Base Salary Distribution</span>
                                </div>
                                <span className="text-2xl font-black text-slate-900">₹ {parseInt(salaryData.baseSalary).toLocaleString()}</span>
                            </div>
                            
                            <div className="flex justify-between items-center p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-slate-300 transition-all group/row">
                                <div className="flex items-center gap-4">
                                    <div className="w-1.5 h-6 bg-emerald-200 group-hover:bg-emerald-400 transition-colors rounded-full"></div>
                                    <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Calculated Performance Pay</span>
                                </div>
                                <span className="text-2xl font-black text-emerald-600">₹ {parseInt(salaryData.earnings).toLocaleString()}</span>
                            </div>

                            {(salaryData.bonus > 0 || salaryData.deductions > 0) && (
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    {salaryData.bonus > 0 && (
                                        <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-100 flex flex-col gap-2">
                                            <span className="text-emerald-700 text-[10px] font-black uppercase tracking-widest">Total Allowances</span>
                                            <span className="text-2xl font-black text-emerald-700">+ ₹ {parseInt(salaryData.bonus).toLocaleString()}</span>
                                        </div>
                                    )}
                                    {salaryData.deductions > 0 && (
                                        <div className="p-6 bg-red-500/5 rounded-3xl border border-red-100 flex flex-col gap-2">
                                            <span className="text-red-600 text-[10px] font-black uppercase tracking-widest">Absence Deductions</span>
                                            <span className="text-2xl font-black text-red-600">- ₹ {parseInt(salaryData.deductions).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Net Total Block */}
                        <div className="mt-12 p-10 bg-slate-900 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center relative z-10 shadow-2xl overflow-hidden group/net">
                            <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover/net:bg-emerald-500/20 transition-all duration-700"></div>
                            
                            <div className="text-center md:text-left space-y-2 mb-8 md:mb-0">
                                <p className="text-[10px] uppercase tracking-[0.3em] font-black text-emerald-400">Net Payable Amount</p>
                                <p className="text-base text-slate-400 font-bold">Successfully credited to primary bank account</p>
                                <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <ShieldCheck className="w-3 h-3 text-emerald-500" /> Encrypted & Secure Payout
                                </div>
                            </div>
                            <div className="text-center md:text-right">
                                <div className="flex items-center justify-center md:justify-end gap-4 text-white">
                                    <div className="p-3 bg-white/5 rounded-2xl hidden md:block"><IndianRupee className="w-8 h-8" /></div>
                                    <span className="text-6xl md:text-8xl font-black tracking-tighter">
                                        ₹{parseInt(salaryData.netSalary).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Signature Section */}
                        <div className="mt-16 pt-16 border-t-2 border-slate-100 grid grid-cols-2 gap-20 relative z-10">
                            <div className="flex flex-col items-center">
                                <img 
                                    src="/director.png" 
                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/200x100/ffffff/1a365d?text=Director+Authorized" }} 
                                    alt="Authorized Sign" 
                                    className="h-28 object-contain mix-blend-multiply opacity-90 transition-transform hover:scale-105 duration-500" 
                                />
                                <div className="w-full h-0.5 bg-slate-900 mx-auto mt-4 rounded-full"></div>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-900 mt-4 font-black">Authorized Signatory</p>
                            </div>
                            
                            <div className="flex flex-col items-center justify-end group/sign">
                                {employeeSignature ? (
                                    <div className="relative cursor-pointer" onClick={() => setShowSignatureModal(true)}>
                                        <img src={employeeSignature} alt="Payee Sign" className="h-24 object-contain mix-blend-multiply transition-transform hover:scale-105 duration-500" />
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-3 py-1 rounded-full font-black uppercase opacity-0 group-hover/sign:opacity-100 transition-all data-html2canvas-ignore whitespace-nowrap">Click to Edit</div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setShowSignatureModal(true)}
                                        className="mb-6 p-6 border-4 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-[2rem] transition-all flex flex-col items-center gap-3 data-html2canvas-ignore"
                                    >
                                        <PenTool className="w-6 h-6" />
                                        <span className="text-[10px] uppercase font-black tracking-widest text-center">Add Digital<br/>Signature</span>
                                    </button>
                                )}
                                <div className="w-full h-px bg-slate-200 mx-auto mt-auto"></div>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 mt-4 font-black">Payee Signature</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Signature Modal */}
            {showSignatureModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-[0_0_100px_rgba(16,185,129,0.2)] animate-fade-in-up border border-slate-100">
                        <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900">Digital <span className="text-emerald-500">Signature</span></h3>
                                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Verify your acceptance of the payout</p>
                            </div>
                            <button onClick={() => setShowSignatureModal(false)} className="w-12 h-12 bg-slate-50 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-2xl transition-all flex items-center justify-center border border-slate-100 uppercase font-black text-lg">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-10 space-y-10">
                            <div className="flex gap-4 p-2 bg-slate-50 rounded-[2rem] border border-slate-100">
                                {['draw', 'upload'].map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => setSignatureType(t)} 
                                        className={`flex-1 py-4 text-xs font-black rounded-3xl transition-all uppercase tracking-[0.2em] ${signatureType === t ? 'bg-white text-emerald-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {t === 'draw' ? 'Hand Draw' : 'Image Upload'}
                                    </button>
                                ))}
                            </div>

                            {signatureType === 'draw' ? (
                                <div className="space-y-8">
                                    <div className="border-4 border-slate-50 rounded-[2.5rem] bg-slate-50/30 overflow-hidden cursor-crosshair relative group/canvas shadow-inner">
                                        <SignatureCanvas 
                                            ref={sigCanvas}
                                            penColor="#0f172a"
                                            velocityFilterWeight={0.7}
                                            minWidth={2}
                                            maxWidth={5}
                                            canvasProps={{width: 500, height: 250, className: "bg-transparent"}}
                                        />
                                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10 font-black text-5xl text-slate-900 uppercase tracking-[0.5em]">Sign Here</div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={() => sigCanvas.current.clear()} className="flex-1 py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-[1.5rem] transition-all uppercase tracking-widest">
                                            Reset Canvas
                                        </button>
                                        <button onClick={handleSaveSignature} className="flex-1 py-5 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-[1.5rem] transition-all uppercase tracking-widest shadow-2xl">
                                            Attach to Document
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-4 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50 p-20 text-center hover:bg-emerald-50/30 transition-all cursor-pointer relative group">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <Upload className="w-16 h-16 text-emerald-500 mx-auto mb-6 group-hover:scale-110 transition-transform" />
                                    <p className="text-xl font-black text-slate-900">Select Image File</p>
                                    <p className="text-xs text-slate-400 mt-2 uppercase font-black tracking-widest">PNG / JPG / WEBP (MAX 2MB)</p>
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
