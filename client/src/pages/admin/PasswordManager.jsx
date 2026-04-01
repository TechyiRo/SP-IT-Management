import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Lock, Key, Shield, Eye, EyeOff, Plus, Trash2, 
    Building2, Save, Search, Edit3, ShieldAlert, 
    Globe, Terminal, Cpu, Zap, ChevronRight, X
} from 'lucide-react';
import Modal from '../../components/ui/Modal';

const colorMap = {
    blue: { text: 'text-blue-400', border: 'border-blue-500/30', glow: 'shadow-blue-500/20', bg: 'bg-blue-500/10' },
    red: { text: 'text-rose-400', border: 'border-rose-500/30', glow: 'shadow-rose-500/20', bg: 'bg-rose-500/10' },
    green: { text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20', bg: 'bg-emerald-500/10' },
    purple: { text: 'text-fuchsia-400', border: 'border-fuchsia-500/30', glow: 'shadow-fuchsia-500/20', bg: 'bg-fuchsia-500/10' },
    orange: { text: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/20', bg: 'bg-amber-500/10' },
};

const PasswordManager = () => {
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState('');
    const [credentials, setCredentials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [newCredentials, setNewCredentials] = useState([
        { name: '', username: '', password: '', details: '', color: 'blue' }
    ]);

    const [editingCredential, setEditingCredential] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState({});

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        if (selectedCompany) {
            fetchCredentials(selectedCompany);
        } else {
            setCredentials([]);
        }
    }, [selectedCompany]);

    const fetchCompanies = async () => {
        try {
            const res = await axios.get('/api/resources/companies');
            setCompanies(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchCredentials = async (companyId) => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/credentials/${companyId}`);
            setCredentials(res.data);
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    const handleAddRow = () => {
        setNewCredentials([...newCredentials, { name: '', username: '', password: '', details: '', color: 'blue' }]);
    };

    const handleRemoveRow = (index) => {
        const list = [...newCredentials];
        list.splice(index, 1);
        setNewCredentials(list);
    };

    const handleInputChange = (index, field, value) => {
        const list = [...newCredentials];
        list[index][field] = value;
        setNewCredentials(list);
    };

    const handleSave = async () => {
        if (!selectedCompany) return alert('Select enterprise node first');
        const toSave = newCredentials.filter(c => c.name && c.username && c.password);
        if (toSave.length === 0) return alert('Enter at least one valid fragment');

        setSaving(true);
        try {
            await axios.post('/api/credentials', {
                companyId: selectedCompany,
                credentials: toSave
            });
            setNewCredentials([{ name: '', username: '', password: '', details: '', color: 'blue' }]);
            fetchCredentials(selectedCompany);
        } catch (err) {
            alert('Encryption sequence failed');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (cred) => {
        setEditingCredential({ ...cred });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingCredential.name || !editingCredential.username || !editingCredential.password) return;
        setSaving(true);
        try {
            const res = await axios.put(`/api/credentials/${editingCredential._id}`, editingCredential);
            setCredentials(credentials.map(c => c._id === res.data._id ? res.data : c));
            setIsEditModalOpen(false);
            setEditingCredential(null);
        } catch (err) {
            alert('Update sequence interrupted');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Erase this data fragment forever?')) return;
        try {
            await axios.delete(`/api/credentials/${id}`);
            setCredentials(credentials.filter(c => c._id !== id));
        } catch (err) { console.error(err); }
    };

    const toggleVisibility = (id) => {
        setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const filteredCredentials = credentials.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10 pb-32 animate-fade-in relative">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                            <Shield className="w-8 h-8 text-indigo-500" />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                            Key <span className="text-indigo-500 not-italic">Vault</span>
                        </h1>
                    </div>
                    <p className="text-slate-500 font-bold ml-16 flex items-center gap-2 text-sm">
                        <Terminal className="w-4 h-4 text-indigo-500/50" /> Secure Storage Hub v4.0 | AES-256 Protocol
                    </p>
                </div>
                
                <div className="flex items-center gap-5 ml-16 lg:ml-0 bg-black/20 p-2 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-4 px-6 group">
                        <Building2 className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                        <select 
                            className="bg-transparent text-white outline-none border-none font-black text-sm p-4 cursor-pointer uppercase tracking-widest min-w-[200px]"
                            value={selectedCompany}
                            onChange={(e) => setSelectedCompany(e.target.value)}
                        >
                            <option value="">-- SELECT SECTOR --</option>
                            {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {selectedCompany ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: Input Console */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-12 xl:col-span-4 space-y-6"
                    >
                        <div className="glass-card p-8 border-indigo-500/10 shadow-2xl space-y-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full"></div>
                            
                            <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                                <Plus className="text-indigo-500" />
                                <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Deposit <span className="text-indigo-500 not-italic">Fragment</span></h2>
                            </div>

                            <div className="space-y-6">
                                {newCredentials.map((cred, index) => (
                                    <motion.div layout key={index} className="space-y-4 p-6 bg-black/40 rounded-[2rem] border border-white/5 relative group">
                                        {newCredentials.length > 1 && (
                                            <button onClick={() => handleRemoveRow(index)} className="absolute top-4 right-4 text-slate-600 hover:text-rose-500 transition-colors">
                                                <X size={16} />
                                            </button>
                                        )}
                                        
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 ml-4">Identifier</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. AWS ROOT ACCESS"
                                                className="glass-input w-full p-4 text-sm font-black italic tracking-wide"
                                                value={cred.name}
                                                onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 ml-4">Username</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="UID/EMAIL"
                                                    className="glass-input w-full p-4 text-xs font-mono"
                                                    value={cred.username}
                                                    onChange={(e) => handleInputChange(index, 'username', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 ml-4">Cipher</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="PASSWORD"
                                                    className="glass-input w-full p-4 text-xs font-mono"
                                                    value={cred.password}
                                                    onChange={(e) => handleInputChange(index, 'password', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    onClick={handleAddRow}
                                    className="flex-1 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all active:scale-95"
                                >
                                    + ADD BLOCK
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-[2] glass-button py-4 flex items-center justify-center gap-3 text-xs tracking-[0.2em]"
                                >
                                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                                    {saving ? 'ENCRYPTING...' : 'INITIALIZE SAVE'}
                                </button>
                            </div>
                        </div>

                        {/* Security Tip */}
                        <div className="glass-card p-8 bg-indigo-500/5 border-indigo-500/20">
                             <div className="flex items-center gap-4 mb-4">
                                <ShieldAlert className="text-indigo-400" size={20} />
                                <h4 className="text-sm font-black text-white uppercase italic">Security Protocol</h4>
                             </div>
                             <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
                                Credentials stored in the Key Vault are encrypted. Only administrators with authenticated tokens can perform bypass operations.
                             </p>
                        </div>
                    </motion.div>

                    {/* Right: Repository */}
                    <div className="lg:col-span-12 xl:col-span-8 space-y-6">
                        <div className="glass-card p-6 flex items-center gap-6 border-indigo-500/10 shadow-xl">
                            <div className="relative flex-1">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                <input 
                                    type="text" 
                                    placeholder="SEARCH KEY REPOSITORY..." 
                                    className="glass-input w-full pl-16 py-4 font-black italic text-sm tracking-widest"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="hidden md:flex items-center gap-4 px-6 border-l border-white/10 uppercase font-black text-[10px] tracking-[0.3em] text-slate-600 italic">
                                <Cpu size={14} className="text-indigo-500" />
                                {filteredCredentials.length} Nodes Found
                            </div>
                        </div>

                        {loading ? (
                            <div className="glass-card py-40 flex flex-col items-center justify-center gap-6 opacity-30 italic">
                                <motion.div 
                                    animate={{ rotate: 360 }} 
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                >
                                    <Zap size={40} className="text-indigo-500" />
                                </motion.div>
                                <p className="text-sm font-black uppercase tracking-widest">Accessing Vault Data...</p>
                            </div>
                        ) : filteredCredentials.length === 0 ? (
                            <div className="glass-card py-40 flex flex-col items-center justify-center gap-6 opacity-30 italic border-dashed border-white/10">
                                <ShieldAlert size={60} className="text-slate-800" />
                                <div className="text-center space-y-1">
                                    <h3 className="text-xl font-black text-white tracking-tight uppercase">NULL REPOSITORY</h3>
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">No key fragments detected in this sector</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <AnimatePresence mode="popLayout">
                                    {filteredCredentials.map(cred => {
                                        const theme = colorMap[cred.color || 'blue'];
                                        return (
                                            <motion.div
                                                layout
                                                key={cred._id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className={`glass-card p-0 overflow-hidden group border-white/5 hover:border-white/10 transition-all duration-700 hover:${theme.glow}`}
                                            >
                                                <div className={`p-8 space-y-6 relative`}>
                                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${theme.bg.replace('10', '80')}`}></div>
                                                    
                                                    <div className="flex justify-between items-start">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-3">
                                                                <h3 className={`text-lg font-black italic uppercase tracking-tight group-hover:${theme.text} transition-colors`}>{cred.name}</h3>
                                                            </div>
                                                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">Fragment ID: {cred._id.slice(-8).toUpperCase()}</p>
                                                        </div>
                                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                                                            <button onClick={() => handleEdit(cred)} className="p-3 bg-white/5 hover:bg-indigo-500/20 rounded-xl text-slate-500 hover:text-indigo-400 transition-all shadow-xl"><Edit3 size={14} /></button>
                                                            <button onClick={() => handleDelete(cred._id)} className="p-3 bg-white/5 hover:bg-rose-500/20 rounded-xl text-slate-500 hover:text-rose-500 transition-all shadow-xl"><Trash2 size={14} /></button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="bg-black/40 rounded-3xl p-5 border border-white-[0.03] space-y-4 shadow-inner">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 ml-1">Access Point</span>
                                                                <div className="flex items-center justify-between text-xs font-mono bg-white/5 p-3 rounded-2xl group/sub">
                                                                    <span className="text-indigo-300 font-bold truncate max-w-[150px]">{cred.username}</span>
                                                                    <Globe size={10} className="text-slate-700 group-hover/sub:text-indigo-500 transition-colors" />
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 ml-1">Cipher Key</span>
                                                                <div className="flex items-center justify-between text-xs font-mono bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-2xl group/sub transition-all hover:bg-indigo-500/10">
                                                                    <span className="text-white font-bold tracking-[0.3em]">
                                                                        {visiblePasswords[cred._id] ? cred.password : '••••••••••••'}
                                                                    </span>
                                                                    <button onClick={() => toggleVisibility(cred._id)} className="text-slate-600 hover:text-indigo-400 transition-colors">
                                                                        {visiblePasswords[cred._id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {cred.details && (
                                                            <div className="relative p-5 rounded-3xl bg-white/[0.02] border border-white/5 italic text-[11px] text-slate-400 leading-relaxed font-medium">
                                                                <span className="absolute -top-3 left-6 px-2 bg-[#050505] text-[8px] font-black uppercase tracking-[0.2em] text-slate-700">Metadata</span>
                                                                "{cred.details}"
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-between pt-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center overflow-hidden">
                                                                <div className="w-4 h-4 bg-indigo-500/20 rounded-full animate-pulse"></div>
                                                            </div>
                                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-600">Authorized by <span className="text-slate-400 ml-1">{cred.addedBy?.fullName || 'SYSTEM'}</span></div>
                                                        </div>
                                                        <div className="text-[9px] font-mono text-slate-700 font-bold">{new Date(cred.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="glass-card py-48 flex flex-col items-center justify-center gap-8 border-dashed border-white/10 opacity-50 relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent"></div>
                     <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-10 bg-slate-900/50 rounded-full border border-white/5 shadow-2xl relative z-10"
                     >
                        <Lock size={80} className="text-slate-800" />
                     </motion.div>
                     <div className="text-center space-y-4 relative z-10">
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Vault <span className="text-indigo-500 not-italic">Locked</span></h2>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.4em] max-w-sm mx-auto leading-relaxed">Select specialized sector node to bypass security and access key fragments</p>
                     </div>
                </div>
            )}

            {/* Edit Modal Custom Styling */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/80">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#050505] w-full max-w-xl overflow-hidden rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                    >
                         <div className="p-12 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Fragment <span className="text-indigo-500 not-italic">Override</span></h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-4 bg-white/5 hover:bg-rose-500/20 rounded-2xl text-slate-500 hover:text-rose-500 transition-all duration-500 border border-white/5"><X size={24} /></button>
                        </div>
                        
                        {editingCredential && (
                            <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="p-12 space-y-8 font-bold">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Entity Identifier</label>
                                        <input 
                                            type="text" 
                                            value={editingCredential.name}
                                            onChange={(e) => setEditingCredential({ ...editingCredential, name: e.target.value })}
                                            className="glass-input w-full p-4 font-black italic uppercase tracking-wider"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Access Point</label>
                                            <input 
                                                type="text" 
                                                value={editingCredential.username}
                                                onChange={(e) => setEditingCredential({ ...editingCredential, username: e.target.value })}
                                                className="glass-input w-full p-4 text-xs font-mono"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Cipher Key</label>
                                            <input 
                                                type="text" 
                                                value={editingCredential.password}
                                                onChange={(e) => setEditingCredential({ ...editingCredential, password: e.target.value })}
                                                className="glass-input w-full p-4 text-xs font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Metadata Analysis</label>
                                        <textarea 
                                            value={editingCredential.details}
                                            onChange={(e) => setEditingCredential({ ...editingCredential, details: e.target.value })}
                                            className="glass-input w-full p-4 text-xs h-24 italic resize-none"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4">Tag Signature</label>
                                        <div className="flex gap-4">
                                            {Object.keys(colorMap).map(color => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setEditingCredential({ ...editingCredential, color })}
                                                    className={`w-10 h-10 rounded-2xl border-2 transition-all duration-500 flex items-center justify-center ${editingCredential.color === color ? 'border-white scale-110 shadow-lg' : 'border-white/5 opacity-40 hover:opacity-100'}`}
                                                    style={{ backgroundColor: `var(--color-${color}-500, ${color})` }}
                                                >
                                                    <div className={`w-4 h-4 rounded-full bg-${color}-500 shadow-[0_0_10px_rgba(255,255,255,0.2)]`}></div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" disabled={saving} className="glass-button w-full py-6 text-base tracking-[0.2em] font-black italic shadow-indigo-500/30">
                                    {saving ? 'UPDATING ARCHIVE...' : 'COMMIT FRAGMENT UPDATE'}
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default PasswordManager;
