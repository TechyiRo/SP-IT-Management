import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Truck, Plus, Search, Edit, Trash2, X } from 'lucide-react';
import Modal from '../../components/ui/Modal';

const Tracking = () => {
    const [tracking, setTracking] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [trackingForm, setTrackingForm] = useState({
        company: '',
        products: [],
        status: 'On Road',
        transportation: '',
        transportationCharges: 0
    });
    const [trackingProductInput, setTrackingProductInput] = useState({ name: '', serialNumber: '' });

    useEffect(() => {
        fetchTracking();
        fetchCompanies();
    }, []);

    const fetchTracking = async () => {
        try {
            const res = await api.get('/api/tracking');
            setTracking(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchCompanies = async () => {
        try {
            const res = await api.get('/api/resources/companies');
            setCompanies(res.data);
        } catch (err) {
            console.error(err);
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
            fetchTracking();
            setTrackingForm({ company: '', products: [], status: 'On Road', transportation: '', transportationCharges: 0 });
            setEditingId(null);
        } catch (err) {
            alert('Error saving tracking record');
        }
    };

    const handleDeleteTracking = async (id) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;
        try {
            await api.delete(`/api/tracking/${id}`);
            fetchTracking();
        } catch (err) {
            alert('Error deleting record');
        }
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

    const handleRemoveProductFromForm = (idx) => {
        const newProds = trackingForm.products.filter((_, i) => i !== idx);
        setTrackingForm({ ...trackingForm, products: newProds });
    };

    const openAddModal = () => {
        setEditingId(null);
        setTrackingForm({ company: '', products: [], status: 'On Road', transportation: '', transportationCharges: 0 });
        setIsTrackingModalOpen(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Delivered': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'Hold': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20'; // On Road
        }
    };

    const filteredTracking = tracking.filter(t =>
        (t.company?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">Material Tracking</h1>
            </div>

            <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        className="glass-input w-full pl-9 py-2 text-sm"
                        placeholder="Search tracking..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={openAddModal}
                    className="glass-button flex items-center gap-2 text-sm px-4 py-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Tracking
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTracking.map(item => (
                    <div key={item._id} className="glass-card p-6 hover:shadow-lg transition-transform hover:-translate-y-1 relative group">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleEditTracking(item)}
                                className="p-1.5 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20"
                            >
                                <Edit size={14} />
                            </button>
                            <button
                                onClick={() => handleDeleteTracking(item._id)}
                                className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        <div className="mb-4">
                            <h3 className="font-bold text-lg pr-12">{item.company?.name || 'Unknown Company'}</h3>
                            {item.addedBy && <p className="text-xs text-gray-500">Added by: {item.addedBy.fullName}</p>}
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-start">
                                <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(item.status)}`}>
                                    {item.status}
                                </span>
                                <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">{new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>

                            <div className="pt-2 border-t border-white/5">
                                <p className="text-xs text-gray-500 uppercase mb-2">Products:</p>
                                <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                                    {item.products.map((p, i) => (
                                        <li key={i}>
                                            {p.name} {p.serialNumber && <span className="text-xs text-gray-500">({p.serialNumber})</span>}
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
                    </div>
                ))}
            </div>

            <Modal isOpen={isTrackingModalOpen} onClose={() => setIsTrackingModalOpen(false)} title={editingId ? "Edit Tracking Record" : "Add Material Tracking"}>
                <form onSubmit={handleAddTracking} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Select Company</label>
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
                            <input
                                className="glass-input flex-1 text-sm"
                                placeholder="Product Name"
                                value={trackingProductInput.name}
                                onChange={e => setTrackingProductInput({ ...trackingProductInput, name: e.target.value })}
                            />
                            <input
                                className="glass-input w-1/3 text-sm"
                                placeholder="Serial No"
                                value={trackingProductInput.serialNumber}
                                onChange={e => setTrackingProductInput({ ...trackingProductInput, serialNumber: e.target.value })}
                            />
                            <button type="button" onClick={handleAddProductToForm} className="p-2 bg-cyan-600 rounded hover:bg-cyan-500 text-white">
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="space-y-1 mt-2">
                            {trackingForm.products.map((p, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white/5 p-2 rounded text-sm">
                                    <span className="text-gray-300">{p.name} {p.serialNumber && <span className="text-gray-500">({p.serialNumber})</span>}</span>
                                    <button type="button" onClick={() => handleRemoveProductFromForm(idx)} className="text-red-400 hover:text-red-300">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
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
                            list="admin-transport-methods"
                            placeholder="Select or Type"
                            value={trackingForm.transportation}
                            onChange={e => setTrackingForm({ ...trackingForm, transportation: e.target.value })}
                        />
                        <datalist id="admin-transport-methods">
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

export default Tracking;
