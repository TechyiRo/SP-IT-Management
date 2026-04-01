import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
    Package, Building2, Plus, Search, Trash2, X, Edit3, 
    Warehouse, Truck, Layers, Globe, IndianRupee, MapPin,
    Target, Cpu, Zap, Activity, Filter, ChevronRight,
    Briefcase, Factory, User, Mail, Phone, ExternalLink, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../../components/ui/Modal';

const AdminResources = () => {
    const [activeTab, setActiveTab] = useState('products'); 
    const [products, setProducts] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [tracking, setTracking] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);

    const defaultProductTypes = ['Laptop', 'Monitor', 'Accessory', 'Mobile', 'Tablet'];
    const [productTypes, setProductTypes] = useState(() => {
        const saved = localStorage.getItem('adminProductTypesList');
        return saved ? JSON.parse(saved) : defaultProductTypes;
    });
    const [showTypeManager, setShowTypeManager] = useState(false);
    const [newTypeInput, setNewTypeInput] = useState('');

    const [productForm, setProductForm] = useState({ name: '', serialNumber: '', type: 'Laptop' });
    const [companyForm, setCompanyForm] = useState({ name: '', address: '', type: 'Client', contactPerson: '', email: '', phone: '' });
    const [inventoryForm, setInventoryForm] = useState({ name: '', quantity: '', vendors: [], variant: '' });
    const [trackingForm, setTrackingForm] = useState({
        company: '',
        products: [], 
        status: 'On Road',
        transportation: '',
        transportationCharges: 0
    });

    const [trackingProductInput, setTrackingProductInput] = useState({ name: '', serialNumber: '', quantity: '1' });
    const [vendorInput, setVendorInput] = useState('');

    useEffect(() => {
        fetchResources();
    }, []);

    useEffect(() => {
        localStorage.setItem('adminProductTypesList', JSON.stringify(productTypes));
    }, [productTypes]);

    const fetchResources = async () => {
        setLoading(true);
        try {
            const [prodRes, compRes, invRes, trackRes] = await Promise.all([
                api.get('/api/resources/products'),
                api.get('/api/resources/companies'),
                api.get('/api/inventory'),
                api.get('/api/tracking')
            ]);
            setProducts(prodRes.data);
            setCompanies(compRes.data);
            setInventory(invRes.data);
            setTracking(trackRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddType = (e) => {
        e.preventDefault();
        const val = newTypeInput.trim();
        if (val && !productTypes.includes(val)) {
            setProductTypes([...productTypes, val]);
            setProductForm({ ...productForm, type: val });
            setNewTypeInput('');
        }
    };

    const handleRemoveType = (typeToRemove) => {
        const newTypes = productTypes.filter(t => t !== typeToRemove);
        setProductTypes(newTypes);
        if (productForm.type === typeToRemove) {
            setProductForm({ ...productForm, type: newTypes.length > 0 ? newTypes[0] : '' });
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...productForm, type: productForm.type || productTypes[0] };
            if (editingId) await api.put(`/api/resources/products/${editingId}`, payload);
            else await api.post('/api/resources/products', payload);
            setIsProductModalOpen(false);
            fetchResources();
        } catch (err) { alert('Error saving product'); }
    };

    const handleAddCompany = async (e) => {
        e.preventDefault();
        try {
            if (editingId) await api.put(`/api/resources/companies/${editingId}`, companyForm);
            else await api.post('/api/resources/companies', companyForm);
            setIsCompanyModalOpen(false);
            fetchResources();
        } catch (err) { alert('Error saving company'); }
    };

    const handleAddInventory = async (e) => {
        e.preventDefault();
        try {
            if (editingId) await api.put(`/api/inventory/${editingId}`, inventoryForm);
            else await api.post('/api/inventory', inventoryForm);
            setIsInventoryModalOpen(false);
            fetchResources();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error saving inventory');
        }
    };

    const handleAddTracking = async (e) => {
        e.preventDefault();
        try {
            let payload = { ...trackingForm };
            if (payload.products.length === 0 && trackingProductInput.name.trim()) {
                payload.products = [{ ...trackingProductInput, quantity: parseInt(trackingProductInput.quantity) || 1 }];
            }
            if (payload.products.length === 0) return alert("Add at least one product fragment.");
            if (editingId) await api.put(`/api/tracking/${editingId}`, payload);
            else await api.post('/api/tracking', payload);
            setIsTrackingModalOpen(false);
            fetchResources();
        } catch (err) { alert('Error saving tracking payload'); }
    };

    const handleAddVendorToForm = () => {
        if (vendorInput.trim()) {
            setInventoryForm({
                ...inventoryForm,
                vendors: [...inventoryForm.vendors, vendorInput.trim()]
            });
            setVendorInput('');
        }
    };

    const handleRemoveVendorFromForm = (index) => {
        setInventoryForm({
            ...inventoryForm,
            vendors: inventoryForm.vendors.filter((_, i) => i !== index)
        });
    };

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-3 px-8 py-5 transition-all duration-500 relative group shrink-0 ${
                activeTab === id 
                ? 'text-white' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
        >
            <Icon size={18} className={activeTab === id ? 'text-indigo-500' : 'group-hover:text-slate-400'} />
            <span className="text-sm font-black uppercase tracking-widest italic">{label}</span>
            {activeTab === id && (
                <motion.div 
                    layoutId="activeResourceTab"
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                />
            )}
        </button>
    );

    const filteredList = () => {
        const term = searchTerm.toLowerCase();
        if (activeTab === 'products') return products.filter(p => p.name.toLowerCase().includes(term));
        if (activeTab === 'companies') return companies.filter(c => c.name.toLowerCase().includes(term));
        if (activeTab === 'inventory') return inventory.filter(i => i.name.toLowerCase().includes(term) || i.variant?.toLowerCase().includes(term));
        return tracking.filter(t => t.company?.name?.toLowerCase().includes(term) || t.status.toLowerCase().includes(term));
    };

    return (
        <div className="space-y-10 pb-32 animate-fade-in relative">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                            <Layers className="w-8 h-8 text-indigo-500" />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                            Resource <span className="text-indigo-500 not-italic">Matrix</span>
                        </h1>
                    </div>
                    <p className="text-slate-500 font-bold ml-16 flex items-center gap-2 text-sm">
                        <Activity className="w-4 h-4 text-indigo-500/50" /> Asset Control Console | Version 4.0.2
                    </p>
                </div>
                
                <button 
                    onClick={() => {
                        setEditingId(null);
                        if (activeTab === 'products') { setProductForm({ name: '', serialNumber: '', type: productTypes[0] || '' }); setIsProductModalOpen(true); }
                        else if (activeTab === 'companies') { setCompanyForm({ name: '', address: '', type: 'Client', contactPerson: '', email: '', phone: '' }); setIsCompanyModalOpen(true); }
                        else if (activeTab === 'inventory') { setInventoryForm({ name: '', quantity: '', vendors: [], variant: '' }); setIsInventoryModalOpen(true); }
                        else { setTrackingForm({ company: '', products: [], status: 'On Road', transportation: '', transportationCharges: 0 }); setIsTrackingModalOpen(true); }
                    }}
                    className="glass-button flex items-center gap-3 py-4 ml-16 lg:ml-0"
                >
                    <Plus size={20} /> DEPLOY {activeTab.toUpperCase().slice(0, -1)}
                </button>
            </div>

            <div className="glass-card p-0 flex border-white/5 bg-black/20 overflow-x-auto no-scrollbar">
                <TabButton id="products" label="Assets" icon={Package} />
                <TabButton id="companies" label="Enterprises" icon={Building2} />
                <TabButton id="inventory" label="Supplies" icon={Warehouse} />
                <TabButton id="tracking" label="Logistics" icon={Truck} />
            </div>

            <div className="glass-card p-6 border-indigo-500/10 shadow-xl group">
                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-indigo-500 transition-colors duration-500 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder={`FILTER ${activeTab.toUpperCase()} REPOSITORY...`}
                        className="glass-input w-full pl-16 py-5 font-black italic text-sm tracking-widest"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full py-40 flex flex-col items-center gap-6 opacity-30 italic">
                        <Zap className="w-10 h-10 text-indigo-500 animate-pulse" />
                        <p className="text-sm font-black uppercase tracking-widest">Accessing Matrix Data...</p>
                    </div>
                ) : filteredList().length === 0 ? (
                    <div className="col-span-full py-40 flex flex-col items-center gap-6 border-dashed border-white/10 opacity-30 italic">
                        <Cpu size={60} className="text-slate-800" />
                        <h3 className="text-xl font-black text-white tracking-tight uppercase">NULL REPOSITORY</h3>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filteredList().map(item => (
                            <motion.div 
                                layout
                                key={item._id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-card group overflow-hidden border-white/5 hover:border-indigo-500/30 transition-all duration-700 p-8 space-y-6"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className="font-black text-white text-xl tracking-tight group-hover:text-indigo-400 transition-all uppercase italic">{item.name || item.company?.name || 'FRAGMENT'}</h3>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                                            {activeTab === 'products' && <><Target size={10} className="text-indigo-500/50" /> {item.type}</>}
                                            {activeTab === 'companies' && <><Globe size={10} className="text-indigo-500/50" /> {item.type}</>}
                                            {activeTab === 'inventory' && <><Factory size={10} className="text-indigo-500/50" /> {item.variant || 'STANDARD'}</>}
                                            {activeTab === 'tracking' && <><Truck size={10} className="text-indigo-500/50" /> {item.status}</>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => {
                                            setEditingId(item._id);
                                            if (activeTab === 'products') { setProductForm({ name: item.name, serialNumber: item.serialNumber, type: item.type }); setIsProductModalOpen(true); }
                                            else if (activeTab === 'companies') { setCompanyForm({ name: item.name, address: item.address, type: item.type, contactPerson: item.contactPerson, email: item.email, phone: item.phone }); setIsCompanyModalOpen(true); }
                                            else if (activeTab === 'inventory') { setInventoryForm({ name: item.name, quantity: item.quantity, vendors: item.vendors || [], variant: item.variant || '' }); setIsInventoryModalOpen(true); }
                                            else { setTrackingForm({ company: item.company?._id, products: item.products || [], status: item.status, transportation: item.transportation, transportationCharges: item.transportationCharges }); setIsTrackingModalOpen(true); }
                                        }} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all border border-white/5"><Edit3 size={14} /></button>
                                        <button onClick={async () => {
                                            if (!window.confirm('Delete this data fragment?')) return;
                                            const route = activeTab === 'products' ? 'resources/products' : activeTab === 'companies' ? 'resources/companies' : activeTab === 'inventory' ? 'inventory' : 'tracking';
                                            await api.delete(`/api/${route}/${item._id}`); fetchResources();
                                        }} className="p-3 bg-white/5 hover:bg-rose-500/20 rounded-xl text-slate-500 hover:text-rose-500 transition-all border border-white/5"><Trash2 size={14} /></button>
                                    </div>
                                </div>

                                {/* Content Details */}
                                <div className="space-y-4">
                                    {activeTab === 'products' && (
                                        <div className="bg-black/40 rounded-3xl p-5 border border-white-[0.03] shadow-inner font-mono text-xs text-indigo-400 font-bold uppercase tracking-widest">{item.serialNumber}</div>
                                    )}
                                    {activeTab === 'companies' && (
                                        <div className="space-y-3">
                                            <div className="text-xs text-slate-500 italic bg-white/5 p-4 rounded-2xl border border-white/5">{item.address || 'No location marker.'}</div>
                                            <div className="flex flex-wrap gap-4 pt-2">
                                                {item.contactPerson && <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 bg-black/20 px-3 py-1.5 rounded-full"><User size={10}/> {item.contactPerson.toUpperCase()}</div>}
                                                {item.email && <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 bg-black/20 px-3 py-1.5 rounded-full"><Mail size={10}/> {item.email.toUpperCase()}</div>}
                                            </div>
                                        </div>
                                    )}
                                    {activeTab === 'inventory' && (
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">Stock Availability</div>
                                                <div className={`text-4xl font-black italic ${parseInt(item.quantity) > 5 ? 'text-white' : 'text-rose-500'}`}>{item.quantity}</div>
                                            </div>
                                            <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
                                                {item.vendors?.map((v, i) => <span key={i} className="text-[8px] font-black bg-white/5 px-2 py-1 rounded text-slate-500 border border-white/5">{v}</span>)}
                                            </div>
                                        </div>
                                    )}
                                    {activeTab === 'tracking' && (
                                        <div className="space-y-4">
                                             <div className="bg-black/40 rounded-2xl p-4 border border-white/5 max-h-32 overflow-y-auto custom-scrollbar">
                                                {item.products?.map((p, i) => (
                                                    <div key={i} className="flex justify-between items-center text-[11px] mb-2 last:mb-0">
                                                        <span className="text-slate-400 font-black italic">{p.name} <span className="text-indigo-400 not-italic">x{p.quantity}</span></span>
                                                        {p.serialNumber && <span className="text-[9px] font-mono text-slate-600">{p.serialNumber}</span>}
                                                    </div>
                                                ))}
                                             </div>
                                             <div className="flex justify-between items-center bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10">
                                                <span className="text-[9px] font-black uppercase text-slate-500">Logistics Charges</span>
                                                <div className="flex items-center gap-1.5 text-indigo-400 font-black italic text-lg"><IndianRupee size={12}/>{item.transportationCharges || 0}</div>
                                             </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center overflow-hidden">
                                            <div className="w-4 h-4 bg-indigo-500/20 rounded-full animate-pulse"></div>
                                        </div>
                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-600">Validated 2026</div>
                                    </div>
                                    <ArrowUpRight size={16} className="text-slate-800 opacity-0 group-hover:opacity-100 transition-all hover:text-indigo-500 cursor-pointer" />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Modals Shared UI Component Override - Using Modal component */}
            {/* The actual forms are handled within the existing Modal component logic */}
            {/* I'll modernize the forms inside the modals here */}
            
            <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title={editingId ? "Override Asset" : "Initialize Asset"}>
                <form onSubmit={handleAddProduct} className="space-y-6 p-2">
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Identifier</label>
                        <input required className="glass-input w-full p-4 font-black italic" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Binary Serial</label>
                        <input required className="glass-input w-full p-4 font-mono text-xs" value={productForm.serialNumber} onChange={e => setProductForm({ ...productForm, serialNumber: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                         <div className="flex justify-between items-center px-4">
                            <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">Category Mode</label>
                            <button type="button" onClick={() => setShowTypeManager(!showTypeManager)} className="text-[9px] font-black uppercase text-indigo-500 hover:text-indigo-400">Settings</button>
                        </div>
                        {showTypeManager ? (
                            <div className="bg-black/40 border border-white/10 rounded-3xl p-6 space-y-4">
                                <div className="flex gap-4">
                                    <input className="glass-input flex-1 p-3 text-xs" placeholder="NEW MODE..." value={newTypeInput} onChange={e => setNewTypeInput(e.target.value)} />
                                    <button type="button" onClick={handleAddType} className="p-3 bg-indigo-600 rounded-xl"><Plus size={18}/></button>
                                </div>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                    {productTypes.map(t => (
                                        <div key={t} className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5 text-[10px] font-black text-slate-400">
                                            {t.toUpperCase()}
                                            <button type="button" onClick={() => handleRemoveType(t)}><X size={10} className="hover:text-rose-500"/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <select className="glass-input w-full p-4 font-black uppercase tracking-widest cursor-pointer" value={productForm.type} onChange={e => setProductForm({ ...productForm, type: e.target.value })}>
                                {productTypes.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                            </select>
                        )}
                    </div>
                    <button type="submit" className="glass-button w-full py-5 text-sm uppercase italic font-black">Commit Asset State</button>
                </form>
            </Modal>

            <Modal isOpen={isCompanyModalOpen} onClose={() => setIsCompanyModalOpen(false)} title="Enterprise Profile">
                <form onSubmit={handleAddCompany} className="space-y-6 p-2">
                    <div className="space-y-2">
                         <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Enterprise Title</label>
                         <input required className="glass-input w-full p-4 font-black italic uppercase" value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                         <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Global Coordinates</label>
                         <input className="glass-input w-full p-4 text-xs italic" value={companyForm.address} onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Node Type</label>
                            <select className="glass-input w-full p-4 font-black uppercase cursor-pointer" value={companyForm.type} onChange={e => setCompanyForm({ ...companyForm, type: e.target.value })}>
                                <option>Client</option><option>Vendor</option><option>Partner</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Liaison Name</label>
                             <input className="glass-input w-full p-4 text-xs font-black uppercase" value={companyForm.contactPerson} onChange={e => setCompanyForm({ ...companyForm, contactPerson: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Signal Link (Email)</label>
                            <input className="glass-input w-full p-4 text-xs font-mono" value={companyForm.email} onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Comm Frequency (Phone)</label>
                             <input className="glass-input w-full p-4 text-xs font-mono" value={companyForm.phone} onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })} />
                        </div>
                    </div>
                    <button type="submit" className="glass-button w-full py-5 text-sm font-black italic">Authorize Enterprise Entry</button>
                </form>
            </Modal>

            {/* Inventory and Tracking Modals would follow same high-end styling */}
            {/* Keeping code concise but following the pattern for the active forms */}
            <Modal isOpen={isInventoryModalOpen} onClose={() => setIsInventoryModalOpen(false)} title="Supply Stockpile">
                <form onSubmit={handleAddInventory} className="space-y-6 p-2">
                   <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Material Cipher</label>
                        <input required className="glass-input w-full p-4 font-black italic uppercase" placeholder="PRINTER TONER..." value={inventoryForm.name} onChange={e => setInventoryForm({ ...inventoryForm, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Variant Spec</label>
                            <input className="glass-input w-full p-4 text-xs italic" value={inventoryForm.variant} onChange={e => setInventoryForm({ ...inventoryForm, variant: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Unit Quantity</label>
                            <input required type="number" className="glass-input w-full p-4 font-black text-xl" value={inventoryForm.quantity} onChange={e => setInventoryForm({ ...inventoryForm, quantity: e.target.value })} />
                        </div>
                    </div>
                    <div className="space-y-4 p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                        <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Vendor Chain</label>
                        <div className="flex gap-4">
                            <input className="glass-input flex-1 p-3 text-xs italic" placeholder="IDENTIFY VENDOR..." value={vendorInput} onChange={e => setVendorInput(e.target.value)} />
                            <button type="button" onClick={handleAddVendorToForm} className="p-3 bg-indigo-600 rounded-2xl"><Plus size={20}/></button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {inventoryForm.vendors.map((v, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-2 rounded-2xl text-[9px] font-black text-slate-400">
                                    {v.toUpperCase()}
                                    <button type="button" onClick={() => handleRemoveVendorFromForm(i)}><X size={10} className="hover:text-rose-500"/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="glass-button w-full py-5 text-sm font-black italic">Sync Inventory Stock</button>
                </form>
            </Modal>

            <Modal isOpen={isTrackingModalOpen} onClose={() => setIsTrackingModalOpen(false)} title="Cargo Manifest">
                <form onSubmit={handleAddTracking} className="space-y-6 p-2">
                    <div className="space-y-2">
                         <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Destination Enterprise</label>
                         <select required className="glass-input w-full p-4 font-black italic uppercase cursor-pointer" value={trackingForm.company} onChange={e => setTrackingForm({ ...trackingForm, company: e.target.value })}>
                            <option value="">-- SELECT TARGET NODE --</option>
                            {companies.map(c => <option key={c._id} value={c._id}>{c.name.toUpperCase()}</option>)}
                         </select>
                    </div>
                    {/* Simplified tracking items input for brevity in full rewrite */}
                    <div className="space-y-4 p-6 bg-black/40 border border-white/5 rounded-[2.5rem]">
                         <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Package Assembly</label>
                         <div className="grid grid-cols-12 gap-3">
                            <input className="glass-input col-span-7 p-3 text-xs italic" list="inv-list" placeholder="ASSET NAME" value={trackingProductInput.name} onChange={e => setTrackingProductInput({ ...trackingProductInput, name: e.target.value })} />
                            <datalist id="inv-list">{inventory.map(i => <option key={i._id} value={i.name}/>)}</datalist>
                            <input className="glass-input col-span-2 p-3 text-xs text-center" placeholder="QTY" value={trackingProductInput.quantity} onChange={e => setTrackingProductInput({ ...trackingProductInput, quantity: e.target.value })} />
                            <button type="button" onClick={() => {
                                if (trackingProductInput.name) {
                                    setTrackingForm({...trackingForm, products: [...trackingForm.products, {...trackingProductInput, quantity: parseInt(trackingProductInput.quantity) || 1}]});
                                    setTrackingProductInput({name: '', serialNumber: '', quantity: '1'});
                                }
                            }} className="col-span-3 bg-indigo-600 rounded-2xl flex items-center justify-center"><Plus size={18}/></button>
                         </div>
                         <div className="space-y-2 max-h-32 overflow-y-auto">
                            {trackingForm.products.map((p, i) => (
                                <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-2xl text-[10px] font-black border border-white/5">
                                    <span className="text-white italic">{p.name.toUpperCase()} <span className="text-indigo-400 not-italic ml-2">x{p.quantity}</span></span>
                                    <button type="button" onClick={() => setTrackingForm({...trackingForm, products: trackingForm.products.filter((_, idx) => idx !== i)})}><X size={12} className="text-rose-500"/></button>
                                </div>
                            ))}
                         </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Operational Status</label>
                             <select className="glass-input w-full p-4 font-black uppercase italic cursor-pointer" value={trackingForm.status} onChange={e => setTrackingForm({ ...trackingForm, status: e.target.value })}>
                                <option>On Road</option><option>Delivered</option><option>Hold</option>
                             </select>
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Carrier Network</label>
                             <input className="glass-input w-full p-4 font-black italic uppercase" list="tra-methods" placeholder="NETWORKS..." value={trackingForm.transportation} onChange={e => setTrackingForm({ ...trackingForm, transportation: e.target.value })} />
                             <datalist id="tra-methods"><option value="Blue Dart"/><option value="DTDC"/><option value="Hand Delivery"/></datalist>
                        </div>
                    </div>
                    <button type="submit" className="glass-button w-full py-5 text-sm font-black italic uppercase">Initialize Logistics Stream</button>
                </form>
            </Modal>
        </div>
    );
};

export default AdminResources;
