import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Package, Building2, Plus, Search } from 'lucide-react';
import Modal from '../../components/ui/Modal';

const EmployeeResources = () => {
    const [activeTab, setActiveTab] = useState('products'); // products | companies
    const [products, setProducts] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [productForm, setProductForm] = useState({ name: '', serialNumber: '', type: 'Laptop' });
    const [companyForm, setCompanyForm] = useState({ name: '', address: '', type: 'Client' });

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const prodRes = await api.get('/api/resources/products');
            setProducts(prodRes.data);
            const compRes = await api.get('/api/resources/companies');
            setCompanies(compRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/resources/products', productForm);
            setIsProductModalOpen(false);
            fetchResources();
            setProductForm({ name: '', serialNumber: '', type: 'Laptop' });
        } catch (err) {
            alert('Error adding product');
        }
    };

    const handleAddCompany = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/resources/companies', companyForm);
            setIsCompanyModalOpen(false);
            fetchResources();
            setCompanyForm({ name: '', address: '', type: 'Client' });
        } catch (err) {
            alert('Error adding company');
        }
    };

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-t-xl transition-all ${activeTab === id
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">Resource Management</h1>
            </div>

            <div className="flex border-b border-white/10">
                <TabButton id="products" label="My Products" icon={Package} />
                <TabButton id="companies" label="My Companies" icon={Building2} />
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
                    onClick={() => activeTab === 'products' ? setIsProductModalOpen(true) : setIsCompanyModalOpen(true)}
                    className="glass-button flex items-center gap-2 text-sm px-4 py-2"
                >
                    <Plus className="w-4 h-4" />
                    Add {activeTab === 'products' ? 'Product' : 'Company'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeTab === 'products' ? filteredProducts : filteredCompanies).map(item => (
                    <div key={item._id} className="glass-card p-6 hover:shadow-lg transition-transform hover:-translate-y-1">
                        <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                        <p className="text-sm text-gray-400 mb-4">{activeTab === 'products' ? item.serialNumber : item.address}</p>
                        <span className="text-xs bg-white/10 px-2 py-1 rounded">{item.type}</span>
                    </div>
                ))}
            </div>

            <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Add New Product">
                <form onSubmit={handleAddProduct} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Name</label>
                        <input required className="glass-input w-full" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Serial Number</label>
                        <input required className="glass-input w-full" value={productForm.serialNumber} onChange={e => setProductForm({ ...productForm, serialNumber: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Type</label>
                        <select className="glass-input w-full bg-slate-900" value={productForm.type} onChange={e => setProductForm({ ...productForm, type: e.target.value })}>
                            <option>Laptop</option>
                            <option>Monitor</option>
                            <option>Accessory</option>
                        </select>
                    </div>
                    <button type="submit" className="glass-button w-full mt-4">Save Product</button>
                </form>
            </Modal>

            <Modal isOpen={isCompanyModalOpen} onClose={() => setIsCompanyModalOpen(false)} title="Add New Company">
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
                    <button type="submit" className="glass-button w-full mt-4">Save Company</button>
                </form>
            </Modal>
        </div>
    );
};

export default EmployeeResources;
