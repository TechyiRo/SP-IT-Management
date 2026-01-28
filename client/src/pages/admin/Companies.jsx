import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Building2, Search } from 'lucide-react';

const Companies = () => {
    const [companies, setCompanies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const res = await api.get('/api/resources/companies');
            setCompanies(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const filteredCompanies = companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">Company Registry</h1>

            <div className="glass-card p-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input className="glass-input w-full pl-9 py-2 text-sm" placeholder="Search companies..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.length === 0 ? (
                    <div className="col-span-full glass-card p-12 text-center text-gray-500">No companies found.</div>
                ) : filteredCompanies.map(c => (
                    <div key={c._id} className="glass-card p-6 border-l-4 border-l-purple-500 hover:shadow-lg transition-transform hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-purple-500/20 p-3 rounded-xl text-purple-400"><Building2 className="w-6 h-6" /></div>
                            <span className="text-xs bg-white/10 px-2 py-1 rounded">{c.type}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{c.name}</h3>
                        <p className="text-sm text-gray-400 mb-4">{c.address || 'No address provided'}</p>
                        <div className="text-xs text-gray-500 border-t border-white/10 pt-4 flex justify-between">
                            <span>Added by: {c.addedBy?.fullName}</span>
                            <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default Companies;
