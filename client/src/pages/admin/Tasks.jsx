import { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, Search, Calendar, User, Clock, AlertCircle, 
    LayoutList, Kanban, MoreVertical, CheckCircle, XCircle, 
    PauseCircle, PlayCircle, Clock3, Filter, Zap, 
    ChevronRight, ExternalLink, MessageCircle, Share2,
    Target, Layers, Cpu, Activity, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CreateTaskModal from '../../components/admin/CreateTaskModal';

const Tasks = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('list'); 
    const [editingTask, setEditingTask] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [filterStatus, setFilterStatus] = useState('All');

    const STATUS_TYPES = [
        { name: 'Pending', icon: Clock3, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        { name: 'In Progress', icon: PlayCircle, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { name: 'On Hold', icon: PauseCircle, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
        { name: 'Completed', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        { name: 'Cancelled', icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tasksRes, usersRes, companiesRes, productsRes] = await Promise.all([
                api.get('/api/tasks'),
                api.get('/api/users'),
                api.get('/api/resources/companies'),
                api.get('/api/resources/products')
            ]);
            setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
            setUsers(usersRes.data);
            setCompanies(companiesRes.data);
            setProducts(productsRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsAppShare = async (task, e) => {
        e.stopPropagation();
        const user = task.assignedTo && task.assignedTo.length > 0 ? task.assignedTo[0] : null;
        const phone = user?.phone;
        if (!phone) return alert('No active communication channel found for this personnel.');

        const cardId = `task-card-${task._id}`;
        let card = document.getElementById(cardId);
        if (!card) {
            const container = document.createElement('div');
            container.id = cardId;
            container.style.position = 'fixed'; container.style.top = '-9999px'; container.style.left = '-9999px';
            container.style.width = '400px'; container.style.background = '#050505';
            container.style.padding = '32px'; container.style.borderRadius = '24px';
            container.style.color = 'white'; container.style.fontFamily = 'Inter, system-ui, sans-serif';
            container.style.border = '1px solid rgba(255,255,255,0.1)';
            container.innerHTML = `
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
                    <div style="width: 48px; height: 48px; background: #6366f1; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 20px;">SP</div>
                    <div>
                        <div style="font-size: 10px; color: #64748b; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">TASK ASSIGNMENT</div>
                        <div style="font-size: 16px; font-weight: 900; color: white; letter-spacing: -0.5px;">SP SYSTEMS CONSOLE</div>
                    </div>
                </div>
                <div style="margin-bottom: 24px;">
                    <div style="font-size: 10px; color: #475569; font-weight: 900; text-transform: uppercase; margin-bottom: 8px;">SIGNAL IDENTIFIER</div>
                    <div style="font-size: 22px; font-weight: 900; color: white; line-height: 1.2; font-style: italic;">${task.title}</div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                    <div style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="font-size: 9px; color: #475569; font-weight: 900; margin-bottom: 6px;">PRIORITY</div>
                        <div style="font-size: 14px; color: ${task.priority === 'High' ? '#f43f5e' : '#6366f1'}; font-weight: 900; font-style: italic;">${task.priority ? task.priority.toUpperCase() : 'NORMAL'}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="font-size: 9px; color: #475569; font-weight: 900; margin-bottom: 6px;">TIMEOUT</div>
                        <div style="font-size: 14px; color: white; font-weight: 900;">${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'INDETERMINATE'}</div>
                    </div>
                </div>
                <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 11px; color: #64748b; font-weight: 700;">Personnel: <span style="color: white; font-weight: 900;">${task.assignedTo && task.assignedTo[0] ? task.assignedTo[0].fullName.toUpperCase() : 'UNASSIGNED'}</span></div>
                    <div style="font-size: 8px; color: #334155; font-weight: 900; letter-spacing: 1px;">ENCRYPTED v4.0</div>
                </div>
            `;
            document.body.appendChild(container);
            card = container;
        }

        try {
            const canvas = await html2canvas(card, { backgroundColor: null, scale: 2 });
            canvas.toBlob(async (blob) => {
                try {
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                    const message = `[SIGNAL DETECTED] *New Task Assignment*\n\n` +
                        `*Identifier:* ${task.title}\n` +
                        `*Priority:* ${task.priority?.toUpperCase()}\n` +
                        `*Timeout:* ${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}\n\n` +
                        `*Access Console:* https://spittechnologies.vercel.app/employee/tasks\n\n` +
                        `_Encryption active. Access permitted for authorized personnel only._`;

                    const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                    setShowToast(true); setTimeout(() => setShowToast(false), 5000);
                    window.open(url, '_blank');
                } catch (err) {
                    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(task.title)}`, '_blank');
                }
                document.body.removeChild(card);
            });
        } catch (err) { if (card) document.body.removeChild(card); }
    };

    const getPriorityStyle = (priority) => {
        switch (priority) {
            case 'High': case 'Urgent': return 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/5';
            case 'Medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5';
            case 'Low': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5';
            default: return 'bg-slate-800/50 text-slate-400 border-white/5';
        }
    };

    const getStatusStyle = (status) => {
        const match = STATUS_TYPES.find(s => s.name === status);
        return match ? `${match.color} ${match.bg} ${match.border}` : 'text-white bg-white/5 border-white/10';
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || task.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-10 pb-32 animate-fade-in">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                            <Layers className="w-8 h-8 text-indigo-500" />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                            Task <span className="text-indigo-500 not-italic">Console</span>
                        </h1>
                    </div>
                    <p className="text-slate-500 font-bold ml-16 flex items-center gap-2 text-sm">
                        <Activity className="w-4 h-4 text-indigo-500/50" /> Strategic Work Orchestration | Build 2026.04
                    </p>
                </div>
                
                <div className="flex items-center gap-4 ml-16 lg:ml-0">
                    <div className="bg-black/20 p-1 rounded-2xl border border-white/5 flex items-center shadow-inner">
                        <button onClick={() => setViewMode('list')} className={`p-4 rounded-xl transition-all duration-500 ${viewMode === 'list' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40' : 'text-slate-500 hover:text-slate-300'}`}><LayoutList size={20} /></button>
                        <button onClick={() => setViewMode('board')} className={`p-4 rounded-xl transition-all duration-500 ${viewMode === 'board' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40' : 'text-slate-500 hover:text-slate-300'}`}><Kanban size={20} /></button>
                    </div>
                    <button 
                        onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
                        className="glass-button flex items-center gap-3 py-4"
                    >
                        <Plus size={20} /> INITIALIZE MISSION
                    </button>
                </div>
            </div>

            {/* Global Filters & Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <motion.div 
                    onClick={() => setFilterStatus('All')}
                    whileHover={{ y: -4 }}
                    className={`glass-card p-6 cursor-pointer border-indigo-500/10 transition-all duration-500 ${filterStatus === 'All' ? 'bg-indigo-500/10 border-indigo-500/40 shadow-indigo-500/10' : 'hover:bg-white/[0.04]'}`}
                >
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Global Stack</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white italic">{tasks.length}</span>
                        <span className="text-[9px] font-bold text-slate-600 uppercase">Fragments</span>
                    </div>
                </motion.div>
                {STATUS_TYPES.map(status => (
                    <motion.div 
                        key={status.name}
                        onClick={() => setFilterStatus(status.name)}
                        whileHover={{ y: -4 }}
                        className={`glass-card p-6 cursor-pointer border-white/5 transition-all duration-500 ${filterStatus === status.name ? `${status.bg} ${status.border} shadow-lg` : 'hover:bg-white/[0.03]'}`}
                    >
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${status.color}`}>{status.name}</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-white italic">{tasks.filter(t => t.status === status.name).length}</span>
                            <status.icon size={12} className={status.color} />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Search Nexus */}
            <div className="glass-card p-4 border-indigo-500/10 shadow-xl group">
                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-indigo-500 transition-colors duration-500 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="SCAN TASK DATABASE..." 
                        className="glass-input w-full pl-16 py-5 font-black italic text-sm tracking-widest"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Render Plane */}
            <AnimatePresence mode="wait">
                {viewMode === 'list' ? (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="glass-card overflow-hidden border-white/5 bg-black/30 shadow-2xl"
                    >
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.02] border-b border-white/5 text-[9px] uppercase font-black text-slate-600 tracking-[0.4em]">
                                    <tr>
                                        <th className="p-8">Objective Identifier</th>
                                        <th className="p-8">Assigned Personnel</th>
                                        <th className="p-8">Timeline</th>
                                        <th className="p-8">Priority</th>
                                        <th className="p-8">Registry Status</th>
                                        <th className="p-8 text-right">Settings</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.02]">
                                    {filteredTasks.length === 0 ? (
                                        <tr><td colSpan="6" className="p-32 text-center text-slate-700 font-black uppercase tracking-widest italic">No matching task signals detected</td></tr>
                                    ) : (
                                        filteredTasks.map(task => (
                                            <tr key={task._id} onClick={() => navigate(`/admin/tasks/${task._id}`)} className="hover:bg-white/[0.03] transition-all group cursor-pointer backdrop-blur-sm">
                                                <td className="p-8">
                                                    <div className="space-y-1.5">
                                                        <div className="text-white text-sm font-black tracking-tight group-hover:text-indigo-400 transition-colors uppercase italic">{task.title}</div>
                                                        <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center gap-2">
                                                            <Target size={10} className="text-indigo-500/50" />
                                                            {task.category || 'GENERAL OPERATIONS'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <div className="flex -space-x-3">
                                                        {task.assignedTo?.map((u, i) => (
                                                            <div key={i} className="w-10 h-10 rounded-2xl bg-slate-900 border-2 border-slate-950 flex items-center justify-center font-black text-xs text-white shadow-xl hover:translate-y-[-2px] hover:z-10 transition-all duration-500" title={u.fullName}>
                                                                {u.fullName?.charAt(0)}
                                                            </div>
                                                        ))}
                                                        {(!task.assignedTo || task.assignedTo.length === 0) && <span className="text-slate-800 font-black text-[10px] uppercase italic">Unassigned</span>}
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <div className="flex items-center gap-3 text-slate-400 font-mono text-xs">
                                                        <Clock size={12} className="text-indigo-500" />
                                                        {task.deadline ? new Date(task.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '∞'}
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <span className={`px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border ${getPriorityStyle(task.priority)}`}>
                                                        {task.priority || 'NORMAL'}
                                                    </span>
                                                </td>
                                                <td className="p-8">
                                                    <span className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(task.status)}`}>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
                                                        {task.status}
                                                    </span>
                                                </td>
                                                <td className="p-8 text-right">
                                                    <div className="flex items-center justify-end gap-3 lg:opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                                                        <button onClick={(e) => handleWhatsAppShare(task, e)} className="p-4 bg-white/5 hover:bg-emerald-500/20 rounded-2xl text-slate-500 hover:text-emerald-400 transition-all border border-white/5 active:scale-95 shadow-xl"><Share2 size={16} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); setEditingTask(task); setIsModalOpen(true); }} className="p-4 bg-white/5 hover:bg-indigo-500/20 rounded-2xl text-slate-500 hover:text-indigo-400 transition-all border border-white/5 active:scale-95 shadow-xl"><Edit3 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }}
                        className="glass-card py-32 flex flex-col items-center justify-center gap-6 border-dashed border-white/10 italic bg-black/20"
                    >
                        <Kanban size={50} className="text-slate-800" />
                        <div className="text-center space-y-2">
                             <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Board Logic offline</h3>
                             <p className="text-sm font-bold text-slate-600 uppercase tracking-widest max-w-sm mx-auto leading-relaxed">Dynamic grid reconfiguration is currently in maintenance. Use List Roster for operational duties.</p>
                             <button onClick={() => setViewMode('list')} className="mt-6 text-indigo-400 font-black uppercase tracking-widest text-[10px] hover:text-indigo-300 transition-colors flex items-center gap-2 mx-auto">
                                <ChevronRight size={14} /> Back to Roster Grid
                             </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <CreateTaskModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
                onTaskCreate={async (d) => { await api.post('/api/tasks', d); setIsModalOpen(false); fetchData(); }}
                onTaskUpdate={async (id, d) => { await api.put(`/api/tasks/${id}`, d); setIsModalOpen(false); fetchData(); }}
                users={users} companies={companies} products={products} taskToEdit={editingTask} refreshData={fetchData}
            />

            {/* Global Communication Signal Toast */}
            <AnimatePresence>
                {showToast && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-12 right-12 bg-[#050505] border border-white/10 p-8 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] z-[100] flex items-center gap-6"
                    >
                        <div className="p-4 bg-indigo-500 rounded-2xl shadow-xl shadow-indigo-500/30"><MessageCircle className="text-white" size={24} /></div>
                        <div>
                            <h4 className="text-lg font-black text-white italic uppercase tracking-tight">Signal Sent!</h4>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Image fragment encoded in clipboard. Use CTRL+V.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Tasks;
