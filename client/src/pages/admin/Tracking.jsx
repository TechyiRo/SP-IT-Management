import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
    Truck, Plus, Search, Edit3, Trash2, X, 
    Navigation, Package, MapPin, IndianRupee, 
    Calendar, CheckCircle2, AlertCircle, Clock,
    MoreVertical, ArrowUpRight, Activity, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../../components/ui/Modal';

const Tracking = () => {
    const [tracking, setTracking] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);

    const [trackingForm, setTrackingForm] = useState({
        company: '',
        products: [],
        status: 'On Road',
        transportation: '',
        transportationCharges: 0
    });
    const [trackingProductInput, setTrackingProductInput] = useState({ name: '', serialNumber: '' });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [trackingRes, companiesRes] = await Promise.all([
                api.get('/api/tracking'),
                api.get('/api/resources/companies')
            ]);
            setTracking(trackingRes.data);
            setCompanies(companiesRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTracking = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/api/tracking/${editingId}`, trackingForm);
            } else {
                await api.post('/api/tracking', trackingForm);
            }
            setIsTrackingModalOpen(false);
            fetchAllData();
            setTrackingForm({ company: '', products: [], status: 'On Road', transportation: '', transportationCharges: 0 });
            setEditingId(null);
        } catch (err) {
            alert('Error saving tracking fragment');
        }
    };

    const handleDeleteTracking = async (id) => {
        if (!window.confirm('Erase this logistics record?')) return;
        try {
            await api.delete(`/api/tracking/${id}`);
            fetchAllData();
        } catch (err) { alert('Deletion failed'); }
    };

    const handleEditTracking = (item) => {
        setTrackingForm({
            company: item.company._id,
            products: item.products || [],
            status: item.status,
            transportation: item.transportation,
            transportationCharges: item.transportationCharges
        });
        setEditingId(item._id);
        setIsTrackingModalOpen(true);
    };

    const handleAddProductToForm = () => {
        if (trackingProductInput.name.trim()) {
            setTrackingForm({
                ...trackingForm,
                products: [...trackingForm.products, { ...trackingProductInput }]
            });
            setTrackingProductInput({ name: '', serialNumber: '' });
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Delivered': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5';
            case 'Hold': return 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/5';
            default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5'; // On Road
        }
    };

    const filteredTracking = tracking.filter(t =>
        (t.company?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10 pb-32 animate-fade-in relative">
            {/* Command Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                            <Navigation className="w-8 h-8 text-indigo-500" />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                            Logistics <span className="text-indigo-500 not-italic">Stream</span>
                        </h1>
                    </div>
                    <p className="text-slate-500 font-bold ml-16 flex items-center gap-2 text-sm">
                        <Activity className="w-4 h-4 text-indigo-500/50" /> Supply Chain Monitoring | Real-time v2.4
                    </p>
                </div>
                
                <button 
                    onClick={() => { setEditingId(null); setTrackingForm({ company: '', products: [], status: 'On Road', transportation: '', transportationCharges: 0 }); setIsTrackingModalOpen(true); }}
                    className="glass-button flex items-center gap-3 py-4 ml-16 lg:ml-0"
                >
                    <Plus size={20} /> INITIALIZE SHIPMENT
                </button>
            </div>

            {/* Intelligent Search Deck */}
            <div className="glass-card p-6 border-indigo-500/10 shadow-xl group">
                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-indigo-500 transition-colors duration-500 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="SCAN SHIPMENT REPOSITORY..." 
                        className="glass-input w-full pl-16 py-5 font-black italic text-sm tracking-widest"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Delivery Grid */}
            {loading ? (
                 <div className="glass-card py-40 flex flex-col items-center justify-center gap-6 opacity-30 italic">
                    <Zap className="w-10 h-10 text-indigo-500 animate-pulse" />
                    <p className="text-sm font-black uppercase tracking-widest">Synchronizing Logistics Deck...</p>
                </div>
            ) : filteredTracking.length === 0 ? (
                <div className="glass-card py-40 flex flex-col items-center justify-center gap-6 border-dashed border-white/10 opacity-30 italic">
                    <Truck size={60} className="text-slate-800" />
                    <div className="text-center space-y-1">
                        <h3 className="text-xl font-black text-white tracking-tight uppercase">NULL STREAM</h3>
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">No active cargo fragments detected</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredTracking.map(item => (
                            <motion.div 
                                layout
                                key={item._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card group p-0 overflow-hidden border-white/5 hover:border-indigo-500/30 transition-all duration-700"
                            >
                                {/* Indicator Line */}
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${item.status === 'Delivered' ? 'bg-emerald-500' : item.status === 'Hold' ? 'bg-rose-500' : 'bg-amber-500'} shadow-[0_0_15px_rgba(0,0,0,0.5)]`}></div>
                                
                                <div className="p-8 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1.5">
                                            <h3 className="font-black text-white text-xl tracking-tight uppercase italic group-hover:text-indigo-400 transition-colors uppercase">{item.company?.name || 'GHOST SECTOR'}</h3>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                                                <MapPin size={10} className="text-indigo-500/50" />
                                                SECURE NODE
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditTracking(item)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all active:scale-90 border border-white/5"><Edit3 size={14} /></button>
                                            <button onClick={() => handleDeleteTracking(item._id)} className="p-3 bg-white/5 hover:bg-rose-500/20 rounded-xl text-slate-500 hover:text-rose-500 transition-all active:scale-90 border border-white/5"><Trash2 size={14} /></button>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className={`px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border backdrop-blur-md ${getStatusStyle(item.status)}`}>
                                            {item.status}
                                        </span>
                                        <div className="flex items-center gap-3 text-slate-600 font-mono text-[10px] uppercase font-bold">
                                            <Calendar size={12} className="text-indigo-500/50" />
                                            {new Date(item.createdAt).toLocaleDateString('en-GB')}
                                        </div>
                                    </div>

                                    <div className="bg-black/40 rounded-3xl p-6 border border-white-[0.03] space-y-4 shadow-inner">
                                        <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                                            <Package size={14} className="text-indigo-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Inventory Bundle</span>
                                        </div>
                                        <ul className="space-y-3">
                                            {item.products.map((p, i) => (
                                                <li key={i} className="flex justify-between items-center group/item transition-all hover:translate-x-2">
                                                    <span className="text-sm font-black text-white italic truncate max-w-[150px]">{p.name}</span>
                                                    <span className="text-[10px] font-mono text-slate-600 bg-white/5 px-3 py-1 rounded-full border border-white/5">{p.serialNumber || 'N/A'}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Cargo Provider</div>
                                            <div className="text-xs font-black text-white italic truncate">{item.transportation?.toUpperCase() || 'MANUAL'}</div>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Usage Charges</div>
                                            <div className="flex items-center gap-2 text-indigo-400 font-black italic">
                                                <IndianRupee size={10} />
                                                <span className="text-sm mt-[-2px]">{item.transportationCharges || 0}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center">
                                                <div className="w-4 h-4 bg-indigo-500/20 rounded-full animate-pulse"></div>
                                            </div>
                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-600">Dispatched by <span className="text-slate-400 ml-1">{item.addedBy?.fullName || 'SYSTEM'}</span></div>
                                        </div>
                                        <ArrowUpRight size={16} className="text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Logistic Overlay Console (Modal) */}
            {isTrackingModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/80">
                     <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#050505] w-full max-w-xl overflow-hidden rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                    >
                         <div className="p-12 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Cargo <span className="text-indigo-500 not-italic">Manifest</span></h3>
                            <button onClick={() => setIsTrackingModalOpen(false)} className="p-4 bg-white/5 hover:bg-rose-500/20 rounded-2xl text-slate-500 hover:text-rose-500 transition-all duration-500 border border-white/5"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleAddTracking} className="p-12 space-y-8 font-bold">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Target Node</label>
                                    <select 
                                        required 
                                        className="glass-input w-full p-5 font-black uppercase tracking-widest cursor-pointer appearance-none"
                                        value={trackingForm.company}
                                        onChange={e => setTrackingForm({ ...trackingForm, company: e.target.value })}
                                    >
                                        <option value="">-- SELECT ENTERPRISE --</option>
                                        {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-4 p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                                    <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Inventory Injection</label>
                                    <div className="flex gap-4">
                                        <input 
                                            className="glass-input flex-[2] p-4 text-xs font-black italic"
                                            placeholder="PRODUCT NAME"
                                            value={trackingProductInput.name}
                                            onChange={e => setTrackingProductInput({ ...trackingProductInput, name: e.target.value })}
                                        />
                                        <input 
                                            className="glass-input flex-1 p-4 text-xs font-mono"
                                            placeholder="SERIAL#"
                                            value={trackingProductInput.serialNumber}
                                            onChange={e => setTrackingProductInput({ ...trackingProductInput, serialNumber: e.target.value })}
                                        />
                                        <button type="button" onClick={handleAddProductToForm} className="p-4 bg-indigo-600 rounded-2xl hover:bg-indigo-500 text-white shadow-xl transition-all active:scale-90"><Plus size={20} /></button>
                                    </div>
                                    <div className="space-y-2 mt-4">
                                        {trackingForm.products.map((p, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5 text-xs">
                                                <span className="text-white font-black italic">{p.name} <span className="text-slate-600 font-mono ml-2">[{p.serialNumber || 'N/A'}]</span></span>
                                                <button type="button" onClick={() => setTrackingForm({ ...trackingForm, products: trackingForm.products.filter((_, i) => i !== idx) })} className="text-rose-500/50 hover:text-rose-500"><X size={16} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Stream Status</label>
                                        <select 
                                            className="glass-input w-full p-4 font-black uppercase tracking-widest cursor-pointer appearance-none"
                                            value={trackingForm.status}
                                            onChange={e => setTrackingForm({ ...trackingForm, status: e.target.value })}
                                        >
                                            <option value="On Road">ON ROAD / TRANSIT</option>
                                            <option value="Delivered">DELIVERED / FINAL</option>
                                            <option value="Hold">HOLD / INTERRUPTED</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Resource Cost</label>
                                        <input 
                                            type="number"
                                            className="glass-input w-full p-4 font-black"
                                            value={trackingForm.transportationCharges}
                                            onChange={e => setTrackingForm({ ...trackingForm, transportationCharges: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Carrier Network</label>
                                    <input 
                                        className="glass-input w-full p-4 font-black italic tracking-wider uppercase"
                                        list="transport-methods"
                                        placeholder="SELECT OR IDENTIFY CARRIER"
                                        value={trackingForm.transportation}
                                        onChange={e => setTrackingForm({ ...trackingForm, transportation: e.target.value })}
                                    />
                                    <datalist id="transport-methods">
                                        <option value="Hand Delivery" />
                                        <option value="Blue Dart" />
                                        <option value="DTDC" />
                                        <option value="Professional Courier" />
                                    </datalist>
                                </div>
                            </div>
                            <button type="submit" className="glass-button w-full py-6 text-base tracking-[0.2em] font-black italic shadow-indigo-500/30">
                                {editingId ? 'COMMIT FRAGMENT UPDATE' : 'INITIALIZE MANIFEST ENROLLMENT'}
                            </button>
                        </form>
                     </motion.div>
                </div>
            )}
        </div>
    );
};

export default Tracking;
