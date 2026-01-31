import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Package, Building2, Plus, Search, Trash2, X, Edit, Warehouse, Truck } from 'lucide-react';
import Modal from '../../components/ui/Modal';

const Resources = () => {
    const [activeTab, setActiveTab] = useState('products'); // products | companies | inventory | tracking
    const [products, setProducts] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [tracking, setTracking] = useState([]);

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);

    // Dynamic Product Types State
    const defaultProductTypes = ['Laptop', 'Monitor', 'Accessory', 'Mobile', 'Tablet'];
    const [productTypes, setProductTypes] = useState(() => {
        const saved = localStorage.getItem('employeeProductTypesList');
        return saved ? JSON.parse(saved) : defaultProductTypes;
    });
    const [showTypeManager, setShowTypeManager] = useState(false);
    const [newTypeInput, setNewTypeInput] = useState('');

    const [productForm, setProductForm] = useState({ name: '', serialNumber: '', type: 'Laptop' });
    const [companyForm, setCompanyForm] = useState({ name: '', address: '', type: 'Client', contactPerson: '', email: '', phone: '' });
    const [inventoryForm, setInventoryForm] = useState({ name: '', quantity: '', vendors: [], variant: '' });
    const [trackingForm, setTrackingForm] = useState({
        company: '',
        products: [], // [{ name, serialNumber }]
        status: 'On Road',
        transportation: '',
        transportationCharges: 0
    });

    // Temporary state for adding a product within the tracking form
    const [trackingProductInput, setTrackingProductInput] = useState({ name: '', serialNumber: '', quantity: '1' });

    const [vendorInput, setVendorInput] = useState('');

    useEffect(() => {
        fetchResources();
    }, []);

    useEffect(() => {
        localStorage.setItem('employeeProductTypesList', JSON.stringify(productTypes));
    }, [productTypes]);

    const fetchResources = async () => {
        try {
            const prodRes = await api.get('/api/resources/products');
            setProducts(prodRes.data);
            const compRes = await api.get('/api/resources/companies');
            setCompanies(compRes.data);
            const invRes = await api.get('/api/inventory');
            setInventory(invRes.data);
            const trackRes = await api.get('/api/tracking');
            setTracking(trackRes.data);
        } catch (err) {
            console.error(err);
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
            if (editingId) {
                await api.put(`/api/resources/products/${editingId}`, payload);
            } else {
                await api.post('/api/resources/products', payload);
            }
            setIsProductModalOpen(false);
            fetchResources();
            setProductForm({ name: '', serialNumber: '', type: productTypes[0] || '' });
            setEditingId(null);
        } catch (err) {
            alert('Error saving product');
        }
    };

    const handleAddCompany = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/api/resources/companies/${editingId}`, companyForm);
            } else {
                await api.post('/api/resources/companies', companyForm);
            }
            setIsCompanyModalOpen(false);
            fetchResources();
            setCompanyForm({ name: '', address: '', type: 'Client', contactPerson: '', email: '', phone: '' });
            setEditingId(null);

            // If we came from tracking modal (simplistic check: if tracking modal was the goal)
            // Ideally we'd have a 'returnTo' state, but for now user can just re-open tracking
        } catch (err) {
            alert('Error saving company');
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
            fetchResources();
            setInventoryForm({ name: '', quantity: '', vendors: [], variant: '' });
            setEditingId(null);
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.msg || (typeof err.response?.data === 'string' ? err.response?.data : JSON.stringify(err.response?.data)) || 'Error saving inventory';
            alert(errorMsg);
        }
    };

    const handleAddTracking = async (e) => {
        e.preventDefault();
        try {
            // Logic to handle if user forgot to click "+" button but filled the input
            let payload = { ...trackingForm };
            if (payload.products.length === 0 && trackingProductInput.name.trim()) {
                const pendingProduct = {
                    ...trackingProductInput,
                    name: trackingProductInput.name.trim(),
                    quantity: parseInt(trackingProductInput.quantity) || 1
                };
                payload.products = [pendingProduct];
                setTrackingProductInput({ name: '', serialNumber: '', quantity: '1' });
            }

            if (payload.products.length === 0) {
                alert("Please add at least one product to the tracking record.");
                return;
            }

            if (editingId) {
                await api.put(`/api/tracking/${editingId}`, payload);
            } else {
                await api.post('/api/tracking', payload);
            }
            setIsTrackingModalOpen(false);
            fetchResources();
            setTrackingForm({ company: '', products: [], status: 'On Road', transportation: '', transportationCharges: 0 });
            setEditingId(null);
        } catch (err) {
            alert('Error saving tracking record');
        }
    };

    const handleAddProductToTracking = () => {
        if (trackingProductInput.name.trim()) {
            setTrackingForm({
                ...trackingForm,
                products: [...trackingForm.products, {
                    ...trackingProductInput,
                    name: trackingProductInput.name.trim(),
                    quantity: parseInt(trackingProductInput.quantity) || 1
                }]
            });
            setTrackingProductInput({ name: '', serialNumber: '', quantity: '1' });
        }
    };

    const handleRemoveProductFromTracking = (idx) => {
        const newProds = trackingForm.products.filter((_, i) => i !== idx);
        setTrackingForm({ ...trackingForm, products: newProds });
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

    const handleEditProduct = (item) => {
        setProductForm({ name: item.name, serialNumber: item.serialNumber, type: item.type });
        setEditingId(item._id);
        setIsProductModalOpen(true);
    };



    const handleEditCompany = (item) => {
        setCompanyForm({
            name: item.name,
            address: item.address,
            type: item.type,
            contactPerson: item.contactPerson || '',
            email: item.email || '',
            phone: item.phone || ''
        });
        setEditingId(item._id);
        setIsCompanyModalOpen(true);
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

    const openAddModal = (type) => {
        setEditingId(null);
        if (type === 'products') {
            setProductForm({ name: '', serialNumber: '', type: productTypes[0] || '' });
            setIsProductModalOpen(true);
        } else if (type === 'companies') {
            setCompanyForm({ name: '', address: '', type: 'Client', contactPerson: '', email: '', phone: '' });
            setIsCompanyModalOpen(true);
        } else if (type === 'inventory') {
            setInventoryForm({ name: '', quantity: '', vendors: [], variant: '' });
            setIsInventoryModalOpen(true);
        } else { // type === 'tracking'
            setTrackingForm({ company: '', products: [], status: 'On Road', transportation: '', transportationCharges: 0 });
            setIsTrackingModalOpen(true);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Delivered': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'Hold': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20'; // On Road
        }
    };

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-t-xl transition-all whitespace-nowrap shrink-0 ${activeTab === id
                ? 'bg-white/10 text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredCompanies = companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredInventory = inventory.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.variant && i.variant.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    // Simple filter for tracking based on company name or status
    const filteredTracking = tracking.filter(t =>
        (t.company?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getActiveList = () => {
        if (activeTab === 'products') return filteredProducts;
        if (activeTab === 'companies') return filteredCompanies;
        if (activeTab === 'inventory') return filteredInventory;
        return filteredTracking;
    };

    const getAddLabel = () => {
        if (activeTab === 'products') return 'Product';
        if (activeTab === 'companies') return 'Company';
        if (activeTab === 'inventory') return 'Material';
        return 'Tracking';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">Resource Management</h1>
            </div>

            <div className="flex gap-2 border-b border-white/10 overflow-x-auto no-scrollbar">
                <TabButton id="products" label="My Products" icon={Package} />
                <TabButton id="companies" label="My Companies" icon={Building2} />
                <TabButton id="inventory" label="Material Inventory" icon={Warehouse} />
                <TabButton id="tracking" label="Material Tracking" icon={Truck} />
            </div>

            <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        className="glass-input w-full pl-9 py-2 text-sm"
                        placeholder={`Search ${activeTab}...`}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => openAddModal(activeTab)}
                    className="glass-button flex items-center gap-2 text-sm px-4 py-2"
                >
                    <Plus className="w-4 h-4" />
                    Add {getAddLabel()}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getActiveList().map(item => (
                    <div key={item._id} className="glass-card p-6 hover:shadow-lg transition-transform hover:-translate-y-1 relative group">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => {
                                    if (activeTab === 'products') handleEditProduct(item);
                                    else if (activeTab === 'companies') handleEditCompany(item);
                                    else if (activeTab === 'inventory') handleEditInventory(item);
                                    else handleEditTracking(item);
                                }}
                                className="p-1.5 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20"
                            >
                                <Edit size={14} />
                            </button>
                            <button
                                onClick={() => {
                                    alert('Permission Denied: Only Admins can delete items. Please contact Admin.');
                                }}
                                className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        {/* Title Logic */}
                        {activeTab !== 'tracking' && (
                            <h3 className="font-bold text-lg mb-2 pr-12">
                                {item.name}
                                {activeTab === 'inventory' && item.variant && (
                                    <span className="ml-2 text-sm font-normal text-cyan-300">({item.variant})</span>
                                )}
                            </h3>
                        )}

                        {activeTab === 'tracking' && (
                            <div className="mb-4">
                                <h3 className="font-bold text-lg pr-12">{item.company?.name || 'Unknown Company'}</h3>
                            </div>
                        )}

                        {activeTab === 'products' && (
                            <>
                                <p className="text-sm text-gray-400 mb-4">{item.serialNumber}</p>
                                <span className="text-xs bg-white/10 px-2 py-1 rounded">{item.type}</span>
                            </>
                        )}

                        {activeTab === 'companies' && (
                            <>
                                <p className="text-sm text-gray-400 mb-4">{item.address}</p>
                                {(item.contactPerson || item.email || item.phone) && (
                                    <div className="mb-4 pt-3 border-t border-white/5 space-y-1">
                                        {item.contactPerson && <p className="text-xs text-gray-300 grid grid-cols-[60px_1fr]"><span className="text-gray-500">Contact:</span> {item.contactPerson}</p>}
                                        {item.email && <p className="text-xs text-gray-300 grid grid-cols-[60px_1fr]"><span className="text-gray-500">Email:</span> {item.email}</p>}
                                        {item.phone && <p className="text-xs text-gray-300 grid grid-cols-[60px_1fr]"><span className="text-gray-500">Phone:</span> {item.phone}</p>}
                                    </div>
                                )}
                                <span className="text-xs bg-white/10 px-2 py-1 rounded">{item.type}</span>
                            </>
                        )}

                        {activeTab === 'inventory' && (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-sm text-gray-400">Available Qty: <span className={parseInt(item.quantity) > 0 ? "text-cyan-400 font-bold" : "text-red-400 font-bold"}>{item.quantity}</span></p>
                                    <span className={`text-xs px-2 py-1 rounded border ${parseInt(item.quantity) > 0
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                                        } `}>
                                        {parseInt(item.quantity) > 0 ? 'In Stock' : 'Out of Stock'}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 uppercase">Vendors:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {item.vendors && item.vendors.length > 0 ? (
                                            item.vendors.map((v, i) => (
                                                <span key={i} className="text-xs bg-white/5 px-2 py-0.5 rounded text-gray-300">{v}</span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-500 italic">No vendors</span>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'tracking' && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(item.status)} `}>
                                        {item.status}
                                    </span>
                                    <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">{new Date(item.createdAt).toLocaleDateString()}</span>
                                </div>

                                <div className="pt-2 border-t border-white/5">
                                    <p className="text-xs text-gray-500 uppercase mb-2">Products:</p>
                                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                                        {item.products.map((p, i) => (
                                            <li key={i}>
                                                {p.name} <span className="text-cyan-400 font-bold text-xs">x{p.quantity || 1}</span> {p.serialNumber && <span className="text-xs text-gray-500">({p.serialNumber})</span>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="pt-2 border-t border-white/5 space-y-1">
                                    <p className="text-xs text-gray-400 flex justify-between">
                                        <span>Transport:</span> <span className="text-white">{item.transportation}</span>
                                    </p>
                                    <p className="text-xs text-gray-400 flex justify-between">
                                        <span>Charges:</span> <span className="text-white">₹{item.transportationCharges}</span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Product Modal */}
            <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title={editingId ? "Edit Product" : "Add New Product"}>
                <form onSubmit={handleAddProduct} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Name</label>
                        <input required className="glass-input w-full" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Serial Number</label>
                        <input required className="glass-input w-full" value={productForm.serialNumber} onChange={e => setProductForm({ ...productForm, serialNumber: e.target.value })} />
                    </div>

                    {/* Dynamic Product Type Selection */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-gray-300">Type</label>
                            <button type="button" onClick={() => setShowTypeManager(!showTypeManager)} className="text-xs text-cyan-400 hover:text-cyan-300">
                                {showTypeManager ? 'Close Manager' : 'Manage Types'}
                            </button>
                        </div>

                        {showTypeManager ? (
                            <div className="bg-slate-900/90 border border-white/10 rounded-lg p-3 mb-2 animate-fade-in">
                                <div className="flex gap-2 mb-3">
                                    <input
                                        className="glass-input flex-1 h-8 text-xs"
                                        placeholder="New type..."
                                        value={newTypeInput}
                                        onChange={e => setNewTypeInput(e.target.value)}
                                    />
                                    <button type="button" onClick={handleAddType} className="p-2 bg-cyan-600 rounded hover:bg-cyan-500 text-white">
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                    {productTypes.map(t => (
                                        <div key={t} className="flex justify-between items-center text-xs bg-white/5 p-1.5 rounded">
                                            <span className="text-gray-300">{t}</span>
                                            <button type="button" onClick={() => handleRemoveType(t)} className="text-red-400 hover:text-red-300">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <select
                                className="glass-input w-full bg-slate-900"
                                value={productForm.type}
                                onChange={e => setProductForm({ ...productForm, type: e.target.value })}
                            >
                                {productTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        )}
                    </div>

                    <button type="submit" className="glass-button w-full mt-4">{editingId ? "Update" : "Save"} Product</button>
                </form>
            </Modal>

            {/* Company Modal */}
            <Modal isOpen={isCompanyModalOpen} onClose={() => setIsCompanyModalOpen(false)} title={editingId ? "Edit Company" : "Add New Company"}>
                <form onSubmit={handleAddCompany} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Company Name</label>
                        <input required className="glass-input w-full" value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Address</label>
                        <input className="glass-input w-full" value={companyForm.address} onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Type</label>
                        <select className="glass-input w-full bg-slate-900" value={companyForm.type} onChange={e => setCompanyForm({ ...companyForm, type: e.target.value })}>
                            <option>Client</option>
                            <option>Vendor</option>
                            <option>Partner</option>
                        </select>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Contact Details (Optional)</label>
                        <div className="space-y-3">
                            <div>
                                <input className="glass-input w-full text-sm" placeholder="Contact Person Name" value={companyForm.contactPerson} onChange={e => setCompanyForm({ ...companyForm, contactPerson: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input className="glass-input w-full text-sm" placeholder="Email" value={companyForm.email} onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} />
                                <input className="glass-input w-full text-sm" placeholder="Phone" value={companyForm.phone} onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="glass-button w-full mt-4">{editingId ? "Update" : "Save"} Company</button>
                </form>
            </Modal>

            {/* Inventory Modal */}
            <Modal isOpen={isInventoryModalOpen} onClose={() => setIsInventoryModalOpen(false)} title={editingId ? "Edit Inventory" : "Add Material Inventory"}>
                <form onSubmit={handleAddInventory} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Product Name</label>
                        <input
                            required
                            className="glass-input w-full"
                            placeholder="e.g. Printer A4 Paper"
                            value={inventoryForm.name}
                            onChange={e => setInventoryForm({ ...inventoryForm, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Variant / Specification (Optional)</label>
                        <input
                            className="glass-input w-full"
                            placeholder="e.g. 1 Meter, 500GB, etc."
                            value={inventoryForm.variant}
                            onChange={e => setInventoryForm({ ...inventoryForm, variant: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Available Quantity</label>
                        <input
                            required
                            type="number"
                            className="glass-input w-full"
                            placeholder="e.g. 50"
                            value={inventoryForm.quantity}
                            onChange={e => setInventoryForm({ ...inventoryForm, quantity: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Vendors</label>
                        <div className="flex gap-2">
                            <input
                                className="glass-input flex-1"
                                placeholder="Add Vendor (e.g. R-ISHA)"
                                value={vendorInput}
                                onChange={e => setVendorInput(e.target.value)}
                            />
                            <button type="button" onClick={handleAddVendorToForm} className="p-2 bg-cyan-600 rounded-lg text-white hover:bg-cyan-500">
                                <Plus size={20} />
                            </button>
                        </div>
                        {/* Vendor List */}
                        <div className="flex flex-wrap gap-2 mt-2">
                            {inventoryForm.vendors.map((v, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                                    <span className="text-xs text-gray-300">{v}</span>
                                    <button type="button" onClick={() => handleRemoveVendorFromForm(idx)} className="text-gray-500 hover:text-red-400">
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="glass-button w-full mt-4">{editingId ? "Update" : "Save"} Inventory</button>
                </form>
            </Modal>

            {/* Material Tracking Modal */}
            <Modal isOpen={isTrackingModalOpen} onClose={() => setIsTrackingModalOpen(false)} title={editingId ? "Edit Tracking Record" : "Add Material Tracking"}>
                <form onSubmit={handleAddTracking} className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-gray-300">Select Company</label>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsTrackingModalOpen(false);
                                    setIsCompanyModalOpen(true);
                                }}
                                className="text-xs text-cyan-400 hover:text-cyan-300"
                            >
                                + Add New Company
                            </button>
                        </div>
                        <select
                            required
                            className="glass-input w-full bg-slate-900"
                            value={trackingForm.company}
                            onChange={e => setTrackingForm({ ...trackingForm, company: e.target.value })}
                        >
                            <option value="">-- Select Company --</option>
                            {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2 border-t border-b border-white/10 py-3">
                        <label className="text-sm font-medium text-gray-300">Products</label>
                        <div className="flex gap-2">
                            {/* Inventory Suggestion Input */}
                            <input
                                className="glass-input flex-1 text-sm list-none"
                                list="employee-inventory-suggestions"
                                placeholder="Select Product from Inventory"
                                value={trackingProductInput.name}
                                onChange={e => setTrackingProductInput({ ...trackingProductInput, name: e.target.value })}
                            />
                            <datalist id="employee-inventory-suggestions">
                                {inventory.map(item => (
                                    <option key={item._id} value={item.name}>
                                        {item.variant ? `${item.name} (${item.variant})` : item.name} - Available: {item.quantity}
                                    </option>
                                ))}
                            </datalist>

                            <input
                                type="number"
                                className="glass-input w-20 text-sm"
                                placeholder="Qty"
                                min="1"
                                value={trackingProductInput.quantity}
                                onChange={e => setTrackingProductInput({ ...trackingProductInput, quantity: e.target.value })}
                            />
                            <input
                                className="glass-input w-1/3 text-sm"
                                placeholder="Serial No (Optional)"
                                value={trackingProductInput.serialNumber}
                                onChange={e => setTrackingProductInput({ ...trackingProductInput, serialNumber: e.target.value })}
                            />
                            <button type="button" onClick={handleAddProductToTracking} className="p-2 bg-cyan-600 rounded hover:bg-cyan-500 text-white">
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="space-y-1 mt-2">
                            {trackingForm.products.map((p, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white/5 p-2 rounded text-sm">
                                    <span className="text-gray-300">
                                        {p.name} <span className="text-cyan-400 font-bold mx-1">x{p.quantity || 1}</span>
                                        {p.serialNumber && <span className="text-gray-500">({p.serialNumber})</span>}
                                    </span>
                                    <button type="button" onClick={() => handleRemoveProductFromTracking(idx)} className="text-red-400 hover:text-red-300">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            {trackingForm.products.length === 0 && <p className="text-xs text-gray-500 italic">No products added.</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Delivery Status</label>
                            <select
                                className="glass-input w-full bg-slate-900"
                                value={trackingForm.status}
                                onChange={e => setTrackingForm({ ...trackingForm, status: e.target.value })}
                            >
                                <option value="On Road">On Road</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Hold">Hold</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Transportation Charges (₹)</label>
                            <input
                                type="number"
                                className="glass-input w-full"
                                value={trackingForm.transportationCharges}
                                onChange={e => setTrackingForm({ ...trackingForm, transportationCharges: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Transportation / Courier</label>
                        <input
                            className="glass-input w-full list-none"
                            list="transport-methods"
                            placeholder="Select or Type (e.g. DTDC)"
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

                    <button type="submit" className="glass-button w-full mt-4">{editingId ? "Update" : "Save"} Tracking Record</button>
                </form>
            </Modal>
        </div>
    );
};

export default Resources;

