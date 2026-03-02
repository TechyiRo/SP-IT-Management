import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Search, Plus, Eye, ChevronRight, Settings } from 'lucide-react';
import * as xlsx from 'xlsx';

export default function ManageVendors() {
    const [vendors, setVendors] = useState([]);
    const [allPrices, setAllPrices] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchVendors();
        fetchAllPrices();
    }, []);

    const fetchVendors = async () => {
        try {
            const res = await api.get('/api/vendors');
            setVendors(res.data);
        } catch (err) {
            console.error('Failed to fetch vendors', err);
        }
    };

    const fetchAllPrices = async () => {
        try {
            const res = await api.get('/api/prices/all');
            setAllPrices(res.data);
        } catch (err) {
            console.error('Failed to fetch all prices', err);
        }
    };

    // Helper functions to generate mock data based on the UI screenshot since the backend doesn't have all these fields yet
    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
            case 'pending':
                return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
            case 'on hold':
                return 'bg-red-500/20 text-red-400 border border-red-500/30';
            case 'contracted':
                return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
            case 'negotiating':
                return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
        }
    };

    const getTrendStyle = (trend) => {
        if (!trend) return null;
        if (trend.startsWith('+')) return <span className="text-emerald-400 flex items-center text-xs">📈 {trend}</span>;
        if (trend.startsWith('-')) return <span className="text-red-400 flex items-center text-xs">📉 {trend}</span>;
        return <span className="text-gray-400 text-xs">{trend}</span>;
    };


    // Mock data for the cards to match the design EXACTLY, falling back to real data if available
    const dashboardCards = vendors.length > 0 ? vendors.map((v, i) => ({
        id: v._id,
        name: v.name,
        category: v.category || `Tier ${i + 1} • General`,
        amount: `₹${(Math.random() * 250000 + 50000).toLocaleString('en-IN', { minimumIntegerDigits: 1, maximumFractionDigits: 0 })}`,
        status: i % 3 === 0 ? 'ACTIVE' : i % 3 === 1 ? 'PENDING' : 'ON HOLD',
        icon: i % 4 === 0 ? '🚚' : i % 4 === 1 ? '☁️' : i % 4 === 2 ? '🦾' : '🛡️',
        color: v.tagColor || (i % 2 === 0 ? '#1e3a8a' : '#4c1d95') // Dark blue or purple fallback
    })) : [
        { id: 1, name: 'Global Logistics 📦', category: 'Tier 1 • Enterprise', amount: '₹12,40,000', status: 'ACTIVE', icon: '🚚', color: '#1e3a8a' },
        { id: 2, name: 'Cloud Systems', category: 'Tier 2 • SaaS', amount: '₹8,90,000', status: 'PENDING', icon: '☁️', color: '#1e40af' },
        { id: 3, name: 'Precision Parts', category: 'Tier 1 • Hardware', amount: '₹24,15,000', status: 'ACTIVE', icon: '🦾', color: '#4c1d95' },
        { id: 4, name: 'Elite Security', category: 'Tier 3 • Protection', amount: '₹5,20,000', status: 'ON HOLD', icon: '🛡️', color: '#7f1d1d' },
    ];

    // Mock data for the table to match the design
    const tableData = [
        { id: 1, name: 'Global Logistics', category: 'Supply Chain', index: 85, trend: '+4.2%', status: 'CONTRACTED' },
        { id: 2, name: 'Cloud Systems', category: 'Infrastructure', index: 62, trend: '-1.8%', status: 'NEGOTIATING' },
    ];


    return (
        <div className="flex h-[calc(100vh-8rem)] bg-[#0f1115] text-white font-sans overflow-hidden rounded-2xl border border-white/5">

            {/* Sidebar Overlay specific to this view */}
            <div className="w-64 bg-[#141b25] border-r border-white/5 flex flex-col pt-8">
                <div className="px-6 mb-10 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-white font-bold tracking-wide">VendorPro</h2>
                        <p className="text-[10px] text-cyan-500 font-medium">Premium Management</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-[#1e293b] text-cyan-400 rounded-xl font-medium border border-cyan-900/50 shadow-[0_4px_20px_-5px_rgba(6,182,212,0.15)]">
                        <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                        </svg>
                        Dashboard
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        Vendors
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path>
                        </svg>
                        Comparison
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        Analytics
                    </button>
                </nav>

                <div className="p-4 mt-auto">
                    <button className="w-full flex items-center justify-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 bg-white/[0.02] border border-white/5 rounded-xl transition-colors mb-4">
                        <Settings className="w-5 h-5" />
                        Settings
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto relative">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none -z-10" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-pink-900/10 rounded-full blur-[100px] pointer-events-none -z-10" />

                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Welcome back, Admin 👋</h1>
                        <p className="text-gray-400 text-sm">Manage your high-end vendor network with 3D insights.</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-10 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search vendors, categories, or price points..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#181d27] border border-white/5 rounded-2xl py-4 pl-12 pr-16 text-gray-300 focus:outline-none focus:border-cyan-500/30 focus:bg-[#1c222e] transition-all shadow-inner"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50">
                        <kbd className="bg-white/5 px-2 py-1 rounded text-xs border border-white/10 font-mono">⌘</kbd>
                        <kbd className="bg-white/5 px-2 py-1 rounded text-xs border border-white/10 font-mono">K</kbd>
                    </div>
                </div>

                {/* Vendor Overview Cards */}
                <div className="mb-10">
                    <div className="flex justify-between items-end mb-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2">Vendor Overview 📦</h2>
                        <button className="text-cyan-400 text-sm font-bold hover:underline">View all vendors</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {dashboardCards.map(card => (
                            <div key={card.id} className="bg-[#181d27] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors cursor-pointer group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

                                {/* 3D Icon Box */}
                                <div className="h-32 rounded-xl mb-4 relative overflow-hidden flex items-center justify-center border border-white/5" style={{ backgroundColor: `${card.color}20` }}>
                                    <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent mix-blend-overlay" />
                                    {/* Appears like a floating 3D icon */}
                                    <span className="text-5xl filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transform group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-500">{card.icon}</span>

                                    <div className="absolute top-3 right-3">
                                        <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${getStatusStyle(card.status)}`}>
                                            {card.status}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-white font-bold text-lg mb-1">{card.name}</h3>
                                    <p className="text-gray-500 text-xs mb-4">{card.category}</p>

                                    <div className="flex justify-between items-end">
                                        <div>
                                            <span className="text-cyan-400 font-bold text-lg">{card.amount}</span>
                                            <span className="text-gray-500 text-[10px] ml-1">/mo</span>
                                        </div>
                                        <ChevronRight className="text-gray-600 group-hover:text-cyan-400 transition-colors w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Price Comparison Matrix Table */}
                <div className="bg-[#181d27] border border-white/5 rounded-2xl overflow-hidden relative">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Price Comparison Matrix</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs bg-white/5 px-3 py-1.5 rounded-full border border-white/5">Last 30 Days</span>
                            <button className="p-1 hover:bg-white/5 rounded-lg text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <table className="w-full text-left">
                        <thead className="bg-[#1c222e] border-b border-white/5">
                            <tr>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Vendor Name</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Category</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Price Index</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Performance</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tableData.map(row => (
                                <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-cyan-900/30 flex items-center justify-center text-cyan-500">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                                </svg>
                                            </div>
                                            <span className="text-sm font-bold text-gray-200">{row.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-400">{row.category}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${row.index}%` }} />
                                            </div>
                                            <span className="text-xs text-gray-400">{row.index}%</span>
                                        </div>
                                    </td>
                                    <td className="p-4">{getTrendStyle(row.trend)}</td>
                                    <td className="p-4 text-right">
                                        <span className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${getStatusStyle(row.status)}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
