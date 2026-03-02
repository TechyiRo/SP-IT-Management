import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Search, Bell, Plus, FileText, Check, AlertCircle, X, Activity, TrendingUp, Building2, Package } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function VendorPrices() {
    const [vendors, setVendors] = useState([]);
    const [selectedVendorId, setSelectedVendorId] = useState(null);
    const [products, setProducts] = useState([]);
    const [myPrices, setMyPrices] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal States
    const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
    const [activeProduct, setActiveProduct] = useState(null);
    const [priceForm, setPriceForm] = useState({ buyingPrice: '', sellingPrice: '' });
    const [isSaving, setIsSaving] = useState(false);

    // Add Vendor Modal
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [vendorForm, setVendorForm] = useState({ name: '', category: '', tagColor: '#22d3ee' });

    // Add Product Modal
    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
    const [productForm, setProductForm] = useState({ name: '', description: '', unit: 'piece', vendorPrice: '' });

    useEffect(() => {
        fetchVendors();
        fetchMyPrices();
    }, []);

    const fetchVendors = async () => {
        try {
            const res = await api.get('/api/vendors');
            setVendors(res.data);
            if (res.data.length > 0 && !selectedVendorId) {
                setSelectedVendorId(res.data[0]._id);
                fetchProducts(res.data[0]._id);
            } else if (selectedVendorId) {
                fetchProducts(selectedVendorId);
            }
        } catch (err) {
            console.error('Failed to fetch vendors:', err);
        }
    };

    const fetchMyPrices = async () => {
        try {
            const res = await api.get('/api/prices/me');
            setMyPrices(res.data);
        } catch (err) {
            console.error('Failed to fetch prices:', err);
        }
    };

    const fetchProducts = async (vendorId) => {
        try {
            const res = await api.get(`/api/vendors/${vendorId}/products`);
            // Add mock styling properties to products for the UI
            const productsWithStyles = res.data.map((p, i) => ({
                ...p,
                trend: i % 3 === 0 ? '-4.2%' : i % 3 === 1 ? '+12.5%' : 'STABLE',
                iconBg: i % 3 === 0 ? 'bg-blue-500/20 text-blue-400' : i % 3 === 1 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-cyan-500/20 text-cyan-400',
                icon: i % 3 === 0 ? 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' : i % 3 === 1 ? 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' : 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
            }));
            setProducts(productsWithStyles);
        } catch (err) {
            console.error('Failed to fetch products:', err);
        }
    };

    const handleSelectVendor = (vendorId) => {
        setSelectedVendorId(vendorId);
        fetchProducts(vendorId);
    };

    // --- Action Handlers --- 
    const handleCreateVendor = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/vendors', vendorForm);
            fetchVendors();
            setIsVendorModalOpen(false);
            setVendorForm({ name: '', category: '', tagColor: '#22d3ee' });
        } catch (err) {
            console.error(err);
            alert('Failed to add vendor');
        }
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        if (!selectedVendorId) return alert("Select a vendor first");
        try {
            await api.post(`/api/vendors/${selectedVendorId}/products`, {
                ...productForm,
                vendorPrice: Number(productForm.vendorPrice)
            });
            fetchProducts(selectedVendorId);
            setIsAddProductModalOpen(false);
            setProductForm({ name: '', description: '', unit: 'piece', vendorPrice: '' });
        } catch (err) {
            console.error(err);
            alert('Failed to add product');
        }
    };

    const openProductPriceModal = (product) => {
        const existingPrice = myPrices.find(p => p.product._id === product._id);
        setPriceForm({
            buyingPrice: existingPrice?.buyingPrice || '',
            sellingPrice: existingPrice?.sellingPrice || ''
        });
        setActiveProduct(product);
        setIsPriceModalOpen(true);
    };

    const handleSaveMyPrice = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.post('/api/prices', {
                product: activeProduct._id,
                buyingPrice: Number(priceForm.buyingPrice),
                sellingPrice: Number(priceForm.sellingPrice)
            });
            await fetchMyPrices();
            setIsPriceModalOpen(false);
        } catch (err) {
            alert('Failed to save prices');
        } finally {
            setIsSaving(false);
        }
    };

    // --- Helpers ---
    const getExistingPriceMetadata = (productId) => myPrices.find(p => p.product._id === productId);

    const getDifferenceBadge = (vendorPrice, myBuyingPrice) => {
        if (!myBuyingPrice) return null;
        const diff = myBuyingPrice - vendorPrice;
        const diffPercent = ((diff / vendorPrice) * 100).toFixed(1);

        if (diff < 0) return { label: 'CHEAPER', value: `${diffPercent}%`, bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-400' };
        if (diff > 0) return { label: 'EXPENSIVE', value: `+${diffPercent}%`, bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', dot: 'bg-red-400' };
        return { label: 'EQUAL', value: '', bg: 'bg-gray-500/10 border-gray-500/30', text: 'text-gray-400', dot: 'bg-gray-400' };
    };

    const getTrendIcon = (trend) => {
        if (trend.includes('-')) return <span className="flex items-center gap-1 text-emerald-400 text-xs"><TrendingUp className="w-3 h-3 transform rotate-180" /> {trend}</span>;
        if (trend.includes('+')) return <span className="flex items-center gap-1 text-red-400 text-xs"><TrendingUp className="w-3 h-3" /> {trend}</span>;
        return <span className="flex items-center gap-1 text-gray-500 text-xs"><div className="w-3 h-[2px] bg-gray-500"></div> STABLE</span>;
    };


    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text("SP IT Technologies", 14, 20);
        doc.setFontSize(14);
        doc.text("Vendor Pricing Analysis Report", 14, 30);
        const tableColumn = ["Product", "Vendor Price", "My Buy Price", "Difference", "Margin"];
        const tableRows = myPrices.map(item => [
            item.product?.name || 'N/A',
            `₹${item.product?.vendorPrice || 0}`,
            `₹${item.buyingPrice || 0}`,
            `${(((item.buyingPrice - item.product?.vendorPrice) / item.product?.vendorPrice) * 100).toFixed(1)}%`,
            `${item.margin}%`
        ]);
        doc.autoTable({ head: [tableColumn], body: tableRows, startY: 40 });
        doc.save(`Pricing_Analysis_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Target Margin calculation for modal
    const currentMargin = priceForm.buyingPrice && priceForm.sellingPrice ? (((priceForm.sellingPrice - priceForm.buyingPrice) / priceForm.sellingPrice) * 100).toFixed(1) : 0;
    const currentProfit = priceForm.buyingPrice && priceForm.sellingPrice ? (priceForm.sellingPrice - priceForm.buyingPrice) : 0;
    const progressToGoal = Math.min((currentMargin / 40) * 100, 100);

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-[#0f1115] text-white font-sans overflow-hidden rounded-2xl border border-white/5 relative">

            {/* Darker background glows */}
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-sky-900/10 rounded-full blur-[150px] pointer-events-none -z-10" />

            {/* Top Navigation specific to this view */}
            <div className="absolute top-0 left-0 right-0 h-20 bg-[#141b25] border-b border-white/5 flex justify-between items-center px-8 z-10">
                <div className="flex items-center gap-12">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-xl flex items-center justify-center p-2 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                            <Activity className="w-full h-full text-white" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold tracking-wider leading-tight">SP IT Technologies</h2>
                            <p className="text-[9px] text-cyan-400 font-bold tracking-widest uppercase">Employee Comparison Engine</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="relative group hidden lg:block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-64 bg-[#1e2633] border border-white/5 rounded-full py-2.5 pl-10 pr-4 text-sm text-gray-300 focus:outline-none focus:border-cyan-500/30 transition-all"
                        />
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-sky-500 rounded-xl text-sm font-bold text-black shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] transition-all flex items-center gap-2" onClick={() => setIsVendorModalOpen(true)}>
                        <Plus className="w-4 h-4" /> Create Vendor
                    </button>
                </div>
            </div>

            {/* Sidebar (Vendors List) */}
            <div className="w-72 bg-[#0f1115] border-r border-white/5 flex flex-col pt-28 px-6 pb-6 h-full z-0 overflow-y-auto custom-scrollbar">
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h3 className="text-white font-bold text-lg">Active Vendors</h3>
                        <p className="text-gray-500 text-xs">{vendors.length} partners currently tracking</p>
                    </div>
                </div>

                <div className="flex-1 space-y-3">
                    {vendors.map(vendor => (
                        <div
                            key={vendor._id}
                            onClick={() => handleSelectVendor(vendor._id)}
                            className={`border rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all ${selectedVendorId === vendor._id ? 'bg-[#1e2633]/80 border-cyan-500/50 shadow-[0_4px_20px_-5px_rgba(6,182,212,0.15)] relative overflow-hidden group' : 'bg-transparent border-white/5 hover:border-white/10'}`}
                        >
                            {selectedVendorId === vendor._id && <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent pointer-events-none" />}
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center opacity-80 border border-white/10" style={{ backgroundColor: vendor.tagColor + '20', color: vendor.tagColor }}>
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold transition-colors ${selectedVendorId === vendor._id ? 'text-cyan-300' : 'text-gray-300'}`}>{vendor.name}</p>
                                    <p className="text-[9px] text-gray-500 font-bold tracking-wider uppercase">{vendor.category || 'GENERAL'}</p>
                                </div>
                            </div>
                            {selectedVendorId === vendor._id && <span className="text-cyan-400 text-lg relative z-10">›</span>}
                        </div>
                    ))}

                    {vendors.length === 0 && (
                        <div className="text-center p-4 border border-dashed border-white/10 rounded-2xl text-gray-500 text-sm">
                            No vendors available. Create one to get started.
                        </div>
                    )}
                </div>

                <div className="pt-4 mt-auto border-t border-white/5 relative z-20">
                    <button onClick={() => selectedVendorId ? setIsAddProductModalOpen(true) : alert('Select a vendor first')} className="w-full h-12 rounded-xl bg-transparent border border-cyan-500/30 border-dashed text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50 flex items-center justify-center gap-2 font-bold transition-all text-sm">
                        <Plus className="w-4 h-4" /> Add Product to Vendor
                    </button>
                    <div className="h-4"></div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 pt-28 px-8 overflow-y-auto pb-28 relative">

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#1e2633]/80 border border-white/5 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-2xl"></div>
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-semibold mb-0.5">Avg. Market Variance</p>
                            <h3 className="text-white text-2xl font-bold">-12.4%</h3>
                        </div>
                    </div>
                    <div className="bg-[#1e2633]/80 border border-white/5 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-2xl"></div>
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-semibold mb-0.5">Potential Savings</p>
                            <h3 className="text-white text-2xl font-bold">₹2,38,000</h3>
                        </div>
                    </div>
                    <div className="bg-[#1e2633]/80 border border-white/5 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 rounded-l-2xl"></div>
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-semibold mb-0.5">Active Vendors</p>
                            <h3 className="text-white text-2xl font-bold">{vendors.length} Partners</h3>
                        </div>
                    </div>
                </div>

                {/* Main Table Area */}
                <div className="bg-[#141b25] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative z-20">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                Vendor Pricing Analysis
                                <span className="bg-[#304860] text-cyan-300 text-[9px] px-2.5 py-1 rounded-full border border-cyan-800 tracking-wider">LIVE DATA</span>
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">Comparing global vendor benchmarks against your localized inputs</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="px-4 py-2 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-500/20 transition-all" onClick={fetchVendors}>
                                <Activity className="w-4 h-4" /> Sync Pricing
                            </button>
                        </div>
                    </div>

                    <table className="w-full text-left">
                        <thead className="bg-[#181d27] border-b border-white/5">
                            <tr>
                                <th className="p-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Product List</th>
                                <th className="p-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Vendor Base Price</th>
                                <th className="p-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Your Action</th>
                                <th className="p-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Difference</th>
                                <th className="p-5 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right pr-8">Negotiation Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {products.length === 0 ? (
                                <tr><td colSpan="5" className="p-10 text-center text-gray-500">No products found for this vendor. Click "Add Product" to add one.</td></tr>
                            ) : (
                                filteredProducts.map(product => {
                                    const userPriceData = getExistingPriceMetadata(product._id);
                                    const diffBadge = getDifferenceBadge(product.vendorPrice, userPriceData?.buyingPrice);

                                    return (
                                        <tr key={product._id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => openProductPriceModal(product)}>
                                            <td className="p-5 flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl ${product.iconBg || 'bg-cyan-500/20 text-cyan-400'} flex items-center justify-center border border-white/5 group-hover:scale-105 transition-transform`}>
                                                    <Package className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">{product.name}</p>
                                                    <p className="text-[10px] text-gray-500 font-medium">{product.description || 'No description'}</p>
                                                </div>
                                            </td>
                                            <td className="p-5 text-sm font-bold text-gray-300">
                                                ₹{product.vendorPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-5">
                                                <div className="inline-flex">
                                                    <span className={`px-4 py-2 rounded-xl text-sm font-mono border ${userPriceData ? 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10' : 'border-white/10 text-gray-500 bg-[#161d27] group-hover:border-cyan-500/40 group-hover:text-cyan-400'}`}>
                                                        {userPriceData ? `₹${userPriceData.buyingPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'Negotiate / Input Price...'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                {diffBadge ? (
                                                    <div className={`inline-flex flex-col border rounded-full px-4 py-1.5 ${diffBadge.bg}`}>
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${diffBadge.dot}`}></div>
                                                            <span className={`text-[9px] font-bold ${diffBadge.text}`}>{diffBadge.label}</span>
                                                        </div>
                                                        {diffBadge.value && <span className={`text-[10px] pl-3 ${diffBadge.text}`}>({diffBadge.value})</span>}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-600 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="p-5 pr-8">
                                                <div className="flex justify-end">
                                                    {userPriceData ? (
                                                        <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                                                            <div className={`h-full ${userPriceData.profit > 0 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500'} rounded-full`} style={{ width: `${Math.min(Math.abs(userPriceData.margin || 0), 100)}%` }}></div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-16 h-2 bg-gray-800/50 rounded-full"></div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Floating Export Button */}
                <button onClick={exportToPDF} className="fixed bottom-10 right-10 bg-[#1e2633] border border-white/10 text-gray-300 hover:text-white hover:border-white/30 font-bold py-4 px-6 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all flex items-center gap-3 z-50">
                    <FileText className="w-5 h-5" />
                    <span>Download Report</span>
                </button>
            </div>


            {/* Modals */}
            {/* Create Vendor Modal */}
            {isVendorModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-[#0f1115]/90 backdrop-blur-sm" onClick={() => setIsVendorModalOpen(false)} />
                    <div className="relative w-full max-w-md bg-[#161d27] border border-white/10 rounded-3xl shadow-2xl p-8 z-10">
                        <button onClick={() => setIsVendorModalOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-2xl font-bold text-white mb-6">Partner Vendor Registration</h3>
                        <form onSubmit={handleCreateVendor} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 mb-2 block">Vendor Name</label>
                                <input type="text" required value={vendorForm.name} onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })} className="w-full bg-[#0f1115] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500" placeholder="e.g. Cisco Systems" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 mb-2 block">Category</label>
                                <input type="text" value={vendorForm.category} onChange={e => setVendorForm({ ...vendorForm, category: e.target.value })} className="w-full bg-[#0f1115] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500" placeholder="e.g. Networking" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 mb-2 block">Tag Color</label>
                                <div className="flex gap-2">
                                    {['#22d3ee', '#818cf8', '#34d399', '#f87171', '#facc15'].map(color => (
                                        <button type="button" key={color} onClick={() => setVendorForm({ ...vendorForm, tagColor: color })} className={`w-8 h-8 rounded-full border-2 transition-transform ${vendorForm.tagColor === color ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }}></button>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-bold py-3 px-4 rounded-xl mt-4 transition-colors">Register Vendor</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Product Modal */}
            {isAddProductModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-[#0f1115]/90 backdrop-blur-sm" onClick={() => setIsAddProductModalOpen(false)} />
                    <div className="relative w-full max-w-md bg-[#161d27] border border-white/10 rounded-3xl shadow-2xl p-8 z-10">
                        <button onClick={() => setIsAddProductModalOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-2xl font-bold text-white mb-6">Add Vendor Product</h3>
                        <form onSubmit={handleCreateProduct} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 mb-2 block">Product/Component Name</label>
                                <input type="text" required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} className="w-full bg-[#0f1115] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500" placeholder="e.g. Server Rack Mount" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 mb-2 block">Description</label>
                                <input type="text" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} className="w-full bg-[#0f1115] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500" placeholder="Optional details..." />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 mb-2 block">Global Vendor Price (₹)</label>
                                <input type="number" required value={productForm.vendorPrice} onChange={e => setProductForm({ ...productForm, vendorPrice: e.target.value })} className="w-full bg-[#0f1115] border border-white/10 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-cyan-500" placeholder="0.00" />
                            </div>
                            <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 px-4 rounded-xl mt-4 transition-colors">Add Product to Catalog</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Futuristic Price Negotiation Modal */}
            {isPriceModalOpen && activeProduct && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-[#0f1115]/90 backdrop-blur-sm" onClick={() => setIsPriceModalOpen(false)} />
                    <div className="relative w-full max-w-3xl bg-[#161d27] border border-white/5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row shadow-[0_0_50px_rgba(34,211,238,0.1)]">
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

                        <div className="p-8 flex-1 border-r border-white/5 relative z-10">
                            <div className="mb-8">
                                <h3 className="text-2xl font-extrabold text-white tracking-tight">Price Negotiation Protocol</h3>
                                <p className="text-xs text-cyan-400 font-medium mt-1">Input your localized procurement rates for {activeProduct.name}</p>
                            </div>

                            <form onSubmit={handleSaveMyPrice} id="priceForm" className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-white flex items-center gap-1 mb-2">Internal Buying Rate <span className="text-green-400">💸</span></label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                        <input type="number" required value={priceForm.buyingPrice} onChange={e => setPriceForm({ ...priceForm, buyingPrice: e.target.value })} className="w-full bg-[#0f1115] border border-white/10 rounded-xl py-3.5 pl-8 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors shadow-inner font-mono" placeholder="0.00" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-white flex items-center gap-1 mb-2">Customer Selling Rate <span className="text-yellow-400">💰</span></label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                        <input type="number" required value={priceForm.sellingPrice} onChange={e => setPriceForm({ ...priceForm, sellingPrice: e.target.value })} className="w-full bg-[#0f1115] border border-white/10 rounded-xl py-3.5 pl-8 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors shadow-inner font-mono" placeholder="0.00" />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <div className="bg-[#0f1115] border border-white/5 rounded-xl p-4 flex justify-between items-center relative overflow-hidden">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${currentProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500'} opacity-50`}></div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">CALCULATED PROFIT</p>
                                            <p className={`text-xl font-bold ${currentProfit >= 0 ? 'text-white' : 'text-red-400'}`}>
                                                {currentProfit >= 0 ? '+' : ''}₹{Math.abs(currentProfit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className={`text-xs px-2.5 py-1 rounded bg-white/5 border border-white/5 flex items-center gap-1 ${currentProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            <TrendingUp className="w-3 h-3" /> {currentMargin}%
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="bg-[#1e2633]/30 w-80 p-8 flex flex-col justify-between relative">
                            <button onClick={() => setIsPriceModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>

                            <div className="text-center mt-6">
                                <h4 className="text-white font-bold text-sm">Margin Analysis</h4>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center py-8">
                                <div className="relative w-40 h-40">
                                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#2a3441" strokeWidth="8" />
                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="url(#gradient)" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * Math.min(Math.max(currentMargin, 0), 100)) / 100} className="transition-all duration-500 ease-out" strokeLinecap="round" />
                                        <defs>
                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#22d3ee" />
                                                <stop offset="100%" stopColor="#3b82f6" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-extrabold text-white">{currentMargin}<span className="text-lg text-gray-400">%</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-6 right-6 flex gap-3 z-[101]">
                            <button type="submit" form="priceForm" disabled={isSaving} className="px-6 py-2.5 bg-cyan-400 text-black rounded-lg text-sm font-bold flex items-center gap-2 shadow-[0_4px_15px_rgba(34,211,238,0.3)] hover:bg-cyan-300 disabled:opacity-50 transition-colors">
                                {isSaving ? 'Saving...' : 'Lock Parameters'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
