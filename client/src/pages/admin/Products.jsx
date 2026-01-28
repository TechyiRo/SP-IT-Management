import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Package, Search } from 'lucide-react';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/api/resources/products');
            setProducts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">Product Inventory</h1>

            <div className="glass-card p-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input className="glass-input w-full pl-9 py-2 text-sm" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10 uppercase text-xs text-gray-400">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">S/N</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Added By</th>
                            <th className="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {filteredProducts.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">No products found.</td></tr>
                        ) : filteredProducts.map(p => (
                            <tr key={p._id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 flex items-center gap-3">
                                    <div className="bg-cyan-500/20 p-2 rounded-lg text-cyan-400"><Package className="w-4 h-4" /></div>
                                    <span className="font-medium text-white">{p.name}</span>
                                </td>
                                <td className="p-4 text-gray-400 font-mono text-xs">{p.serialNumber}</td>
                                <td className="p-4 text-gray-300">{p.type}</td>
                                <td className="p-4 text-gray-400 text-sm">{p.addedBy?.fullName || 'Unknown'}</td>
                                <td className="p-4"><span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">{p.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default Products;
