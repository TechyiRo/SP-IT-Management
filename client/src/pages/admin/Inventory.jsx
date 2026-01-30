import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Warehouse, Plus, Search, Edit, Trash2, X } from 'lucide-react';
import Modal from '../../components/ui/Modal';

const Inventory = () => {
    const [inventory, setInventory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [inventoryForm, setInventoryForm] = useState({ name: '', quantity: '', vendors: [], variant: '' });
    const [vendorInput, setVendorInput] = useState('');

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const res = await api.get('/api/inventory');
            setInventory(res.data);
        } catch (err) {
            console.error(err);
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
        if (!window.confirm('Are you sure you want to delete this item?')) return;
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">Material Inventory</h1>
            </div>

            <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        className="glass-input w-full pl-9 py-2 text-sm"
                        placeholder="Search inventory..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={openAddModal}
                    className="glass-button flex items-center gap-2 text-sm px-4 py-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Material
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInventory.map(item => (
                    <div key={item._id} className="glass-card p-6 hover:shadow-lg transition-transform hover:-translate-y-1 relative group">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleEditInventory(item)}
                                className="p-1.5 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20"
                            >
                                <Edit size={14} />
                            </button>
                            <button
                                onClick={() => handleDeleteInventory(item._id)}
                                className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                        <h3 className="font-bold text-lg mb-2 pr-12">
                            {item.name}
                            {item.variant && <span className="ml-2 text-sm font-normal text-cyan-300">({item.variant})</span>}
                        </h3>

                        <div className="flex justify-between items-center mb-4">
                            <p className="text-sm text-gray-400">Available Qty: <span className={parseInt(item.quantity) > 0 ? "text-cyan-400 font-bold" : "text-red-400 font-bold"}>{item.quantity}</span></p>
                            <span className={`text-xs px-2 py-1 rounded border ${parseInt(item.quantity) > 0
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
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
                        {item.addedBy && (
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <p className="text-xs text-gray-500">Added by: {item.addedBy.fullName}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <Modal isOpen={isInventoryModalOpen} onClose={() => setIsInventoryModalOpen(false)} title={editingId ? "Edit Material" : "Add Material"}>
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

                    <button type="submit" className="glass-button w-full mt-4">{editingId ? "Update" : "Save"} Material</button>
                </form>
            </Modal>
        </div>
    );
};

export default Inventory;
