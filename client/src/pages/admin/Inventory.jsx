import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
    Warehouse, Plus, Search, Edit2, Trash2, X,
    Package, Boxes, TrendingDown, Layers,
    Zap, Archive, ArrowRight, Tag,
    ShoppingBag, Landmark, ChevronRight, User
} from 'lucide-react';
import Modal from '../../components/ui/Modal';

const Inventory = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [inventoryForm, setInventoryForm] = useState({ name: '', quantity: '', vendors: [], variant: '' });
    const [vendorInput, setVendorInput] = useState('');

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/inventory');
            setInventory(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleAddInventory = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/api/inventory/${editingId}`, inventoryForm);
            } else {
                await api.post('/api/inventory', inventoryForm);
            }
            setIsInventoryModalOpen(false);
            fetchInventory();
            setInventoryForm({ name: '', quantity: '', vendors: [], variant: '' });
            setEditingId(null);
        } catch (err) {
            alert('Error saving inventory');
        }
    };

    const handleDeleteInventory = async (id) => {
        if (!window.confirm('Are you sure you want to delete this industrial asset?')) return;
        try {
            await api.delete(`/api/inventory/${id}`);
            fetchInventory();
        } catch (err) {
            alert('Error deleting item');
        }
    };

    const handleEditInventory = (item) => {
        setInventoryForm({
            name: item.name,
            quantity: item.quantity,
            vendors: item.vendors || [],
            variant: item.variant || ''
        });
        setEditingId(item._id);
        setIsInventoryModalOpen(true);
    };

    const handleAddVendorToForm = (e) => {
        e.preventDefault();
        if (vendorInput.trim()) {
            setInventoryForm({ ...inventoryForm, vendors: [...inventoryForm.vendors, vendorInput.trim()] });
            setVendorInput('');
        }
    };

    const handleRemoveVendorFromForm = (idx) => {
        const newVendors = inventoryForm.vendors.filter((_, i) => i !== idx);
        setInventoryForm({ ...inventoryForm, vendors: newVendors });
    };

    const openAddModal = () => {
        setEditingId(null);
        setInventoryForm({ name: '', quantity: '', vendors: [], variant: '' });
        setIsInventoryModalOpen(true);
    };

    const filteredInventory = inventory.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.variant && i.variant.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-10 pb-20 animate-fade-in">
             {/* Header Section */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                <div className="lg:col-span-1 space-y-4">
                     <h1 className="text-4xl font-black text-white tracking-tighter italic">"Material Vault"</h1>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Operational Stockpile & Logistics</p>
                </div>
                
                <div className="lg:col-span-3 flex flex-col md:flex-row gap-6">
                     <div className="flex-1 glass-card p-1 items-center flex bg-white/[0.02]">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Locate industrial assets by name, variant or batch..."
                                className="glass-input w-full pl-16 bg-transparent border-none focus:ring-0 text-sm font-bold placeholder-slate-700 h-14"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                     </div>
                     <button
                        onClick={openAddModal}
                        className="glass-button px-8 py-4 whitespace-nowrap flex items-center justify-center gap-3 transition-all active:scale-95"
                    >
                        <Plus size={18} /> Catalog Asset
                    </button>
                </div>
            </div>

            {/* Quick Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                     { label: 'Stock Categories', value: [...new Set(inventory.map(i => i.name))].length, icon: Layers, color: 'text-indigo-500' },
                     { label: 'Global Units', value: inventory.reduce((acc, i) => acc + (parseInt(i.quantity) || 0), 0), icon: Boxes, color: 'text-emerald-500' },
                     { label: 'Deficiency Alerts', value: inventory.filter(i => parseInt(i.quantity) < 10).length, icon: TrendingDown, color: 'text-rose-500' },
                     { label: 'Active Supply Chains', value: [...new Set(inventory.flatMap(i => i.vendors || []))].length, icon: Landmark, color: 'text-amber-500' }
                 ].map((stat, i) => (
                    <div key={i} className="glass-card p-6 flex flex-col items-start bg-white/[0.01] hover:bg-white/[0.03] transition-all">
                        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/5">
                            <stat.icon className={stat.color} size={18} />
                        </div>
                        <div className="text-2xl font-black text-white font-mono tracking-tighter italic">{loading ? '...' : stat.value}</div>
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1 italic">{stat.label}</p>
                    </div>
                 ))}
            </div>

            {/* Main Inventory Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full py-24 text-center animate-pulse text-slate-700 font-black uppercase text-xs tracking-[0.5em]">Synchronizing Inventory Database...</div>
                ) : filteredInventory.length === 0 ? (
                    <div className="col-span-full py-24 text-center text-slate-700 border-2 border-dashed border-white/5 rounded-[4rem] font-black uppercase text-xs tracking-[0.2em] italic">No Logistics Data Detected...</div>
                ) : filteredInventory.map(item => (
                    <div key={item._id} className="glass-card glass-card-hover group p-1 h-full">
                        <div className="p-8 space-y-8 flex flex-col h-full">
                            {/* Visual Asset Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 border border-white/5 flex items-center justify-center shadow-inner group-hover:rotate-12 group-hover:border-indigo-500/30 transition-all duration-700">
                                        <Archive size={28} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tighter truncate max-w-[150px] uppercase italic">{item.name}</h3>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2 italic">
                                            <Tag size={10} className="text-indigo-500" /> {item.variant || 'Standard Build'}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button onClick={() => handleEditInventory(item)} className="p-3 bg-white/5 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 rounded-2xl border border-white/5 transition-all">
                                        <Edit2 size={16} />
                                     </button>
                                </div>
                            </div>

                            {/* Quantitative Visualization */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic">Stock Saturation</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${parseInt(item.quantity) > 10 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {item.quantity} Units Available
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${parseInt(item.quantity) > 10 ? 'bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]'}`} 
                                        style={{ width: `${Math.min((parseInt(item.quantity) / 100) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Distribution Nodes */}
                            <div className="space-y-3 flex-1">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic flex items-center gap-2">
                                    <Landmark size={12} className="text-slate-800" /> Verified Supply Chain
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {item.vendors && item.vendors.length > 0 ? (
                                        item.vendors.map((v, i) => (
                                            <div key={i} className="px-3 py-1 bg-white/[0.03] border border-white/5 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-tight group-hover:text-white group-hover:border-indigo-500/20 transition-all">
                                                {v}
                                            </div>
                                        ))
                                    ) : (
                                        <span className="text-[10px] font-bold text-slate-800 italic">No nodes established</span>
                                    )}
                                </div>
                            </div>

                            {/* Origin Trace */}
                            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                                        <User size={14} className="text-slate-600" />
                                     </div>
                                     <div className="text-[9px] font-black">
                                         <p className="text-slate-700 uppercase tracking-widest">Origin Point</p>
                                         <p className="text-slate-500 uppercase">{item.addedBy?.fullName || 'Root System'}</p>
                                     </div>
                                 </div>
                                 <button onClick={() => handleDeleteInventory(item._id)} className="p-3 text-slate-800 hover:text-rose-500 transition-colors">
                                    <Trash2 size={16} />
                                 </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Catalog Modal */}
            <Modal isOpen={isInventoryModalOpen} onClose={() => setIsInventoryModalOpen(false)} title={editingId ? "Modify Asset Configuration" : "Initialize New Industrial Asset"}>
                <form onSubmit={handleAddInventory} className="space-y-10 p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 italic">Asset Designation</label>
                            <input required className="glass-input w-full font-black text-sm tracking-tight" placeholder="e.g. CORE-FIBER-OPTIC" value={inventoryForm.name} onChange={e => setInventoryForm({ ...inventoryForm, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 italic">Variant Specs</label>
                            <input className="glass-input w-full font-black text-sm tracking-tight" placeholder="e.g. 500M / GRADE-A" value={inventoryForm.variant} onChange={e => setInventoryForm({ ...inventoryForm, variant: e.target.value })} />
                        </div>
                    </div>

                    <div className="space-y-4 p-8 glass-card bg-indigo-500/5 border-none">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3 mb-2 italic">
                            <Boxes size={14} className="text-indigo-500" /> Initial Quantization
                        </label>
                        <input required type="number" className="glass-input w-full font-mono font-black text-2xl tracking-tighter text-center bg-transparent border-none shadow-none focus:ring-0" placeholder="000" value={inventoryForm.quantity} onChange={e => setInventoryForm({ ...inventoryForm, quantity: e.target.value })} />
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                             <div className="h-full bg-indigo-500 w-[100%] animate-shimmer" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 italic flex items-center gap-3">
                            <Landmark size={14} className="text-indigo-500" /> Supply Chain Nodes
                        </label>
                        <div className="flex gap-4">
                            <input className="glass-input flex-1 font-bold text-sm" placeholder="Enter distribution partner ID..." value={vendorInput} onChange={e => setVendorInput(e.target.value)} />
                            <button type="button" onClick={handleAddVendorToForm} className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 active:scale-90 transition-all">
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {inventoryForm.vendors.map((v, idx) => (
                                <div key={idx} className="group flex items-center gap-4 bg-white/5 border border-white/[0.02] pl-5 pr-3 py-2.5 rounded-2xl hover:border-indigo-500/30 transition-all">
                                    <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-tight italic transition-colors">{v}</span>
                                    <button type="button" onClick={() => handleRemoveVendorFromForm(idx)} className="p-1 text-slate-700 hover:text-rose-500 transition-colors">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            {inventoryForm.vendors.length === 0 && <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest py-3">No Nodes Linked...</span>}
                        </div>
                    </div>

                    <button type="submit" className="glass-button w-full shadow-indigo-500/40 font-black text-sm py-6">
                        {editingId ? "Commit Config Redefinition" : "Initialize Asset Deprivation Control"}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Inventory;
