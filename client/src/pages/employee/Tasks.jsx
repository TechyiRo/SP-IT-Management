import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { Calendar, AlertCircle, ArrowRight, Zap, CheckCircle2, Clock, PauseCircle, CheckSquare2, RotateCcw, ChevronLeft, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────────
   Status Configuration
───────────────────────────────────────── */
const STATUS_CONFIG = [
    {
        key: 'all',
        label: 'All Tasks',
        emoji: '📋',
        icon: Filter,
        gradient: 'from-violet-500 via-purple-600 to-indigo-600',
        glow: 'rgba(139,92,246,0.6)',
        border: 'border-violet-400/40',
        bg: 'bg-violet-500/15',
        text: 'text-violet-300',
        badge: 'bg-violet-500/30 text-violet-200',
        shine: '#a78bfa',
        desc: 'All assigned tasks',
    },
    {
        key: 'In Progress',
        label: 'In Progress',
        emoji: '⚡',
        icon: Zap,
        gradient: 'from-blue-500 via-cyan-500 to-teal-500',
        glow: 'rgba(6,182,212,0.6)',
        border: 'border-cyan-400/40',
        bg: 'bg-cyan-500/15',
        text: 'text-cyan-300',
        badge: 'bg-cyan-500/30 text-cyan-200',
        shine: '#67e8f9',
        desc: 'Currently working on',
    },
    {
        key: 'Pending',
        label: 'Pending',
        emoji: '⏳',
        icon: Clock,
        gradient: 'from-yellow-500 via-amber-500 to-orange-500',
        glow: 'rgba(245,158,11,0.6)',
        border: 'border-yellow-400/40',
        bg: 'bg-yellow-500/15',
        text: 'text-yellow-300',
        badge: 'bg-yellow-500/30 text-yellow-200',
        shine: '#fde68a',
        desc: 'Waiting to be started',
    },
    {
        key: 'On Hold',
        label: 'On Hold',
        emoji: '⏸️',
        icon: PauseCircle,
        gradient: 'from-orange-500 via-red-400 to-pink-500',
        glow: 'rgba(249,115,22,0.6)',
        border: 'border-orange-400/40',
        bg: 'bg-orange-500/15',
        text: 'text-orange-300',
        badge: 'bg-orange-500/30 text-orange-200',
        shine: '#fdba74',
        desc: 'Temporarily paused',
    },
    {
        key: 'Resolved',
        label: 'Resolved',
        emoji: '✅',
        icon: CheckCircle2,
        gradient: 'from-emerald-500 via-green-500 to-teal-500',
        glow: 'rgba(16,185,129,0.6)',
        border: 'border-emerald-400/40',
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-300',
        badge: 'bg-emerald-500/30 text-emerald-200',
        shine: '#6ee7b7',
        desc: 'Issue resolved',
    },
    {
        key: 'Completed',
        label: 'Completed',
        emoji: '🏆',
        icon: CheckSquare2,
        gradient: 'from-green-400 via-lime-500 to-emerald-600',
        glow: 'rgba(132,204,22,0.5)',
        border: 'border-green-400/40',
        bg: 'bg-green-500/15',
        text: 'text-green-300',
        badge: 'bg-green-500/30 text-green-200',
        shine: '#86efac',
        desc: 'Fully completed',
    },
];

/* ─────────────────────────────────────────
   3D Status Card Component
───────────────────────────────────────── */
function StatusCard({ config, count, isActive, onClick, index }) {
    const cardRef = useRef(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [hovered, setHovered] = useState(false);

    const handleMouseMove = (e) => {
        const el = cardRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        // Reduce sensitivity for a smoother experience, especially on small screens
        const sensitivity = window.innerWidth < 768 ? 10 : 20;
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * sensitivity;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * -sensitivity;
        setTilt({ x, y });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
        setHovered(false);
    };

    const animationDelay = `${index * 100}ms`;

    return (
        <div
            ref={cardRef}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: `perspective(900px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) ${hovered ? 'scale(1.06) translateY(-8px)' : isActive ? 'scale(1.04) translateY(-4px)' : 'scale(1)'}`,
                transition: hovered ? 'transform 0.1s ease-out' : 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                animationDelay,
                boxShadow: (hovered || isActive) ? `0 20px 60px ${config.glow}, 0 0 0 1px ${config.shine}40` : `0 8px 24px rgba(0,0,0,0.4)`,
            }}
            className={`
                relative cursor-pointer rounded-2xl overflow-hidden
                border ${config.border}
                ${isActive ? config.bg : 'bg-white/5 hover:bg-white/8'}
                backdrop-blur-xl
                animate-[fadeSlideUp_0.5s_ease_forwards]
                opacity-0
            `}
        >
            {/* ── Gradient Top Bar ── */}
            <div className={`h-1 w-full bg-gradient-to-r ${config.gradient}`} />

            {/* ── Shine Overlay ── */}
            <div
                style={{
                    background: `radial-gradient(circle at ${50 + tilt.x * 2}% ${50 - tilt.y * 2}%, ${config.shine}22, transparent 70%)`,
                }}
                className="absolute inset-0 pointer-events-none transition-all duration-150"
            />

            {/* ── Animated Ring (active) ── */}
            {isActive && (
                <div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{ boxShadow: `inset 0 0 0 2px ${config.shine}60` }}
                />
            )}

            {/* ── Content ── */}
            <div className="p-5 relative z-10">
                {/* Emoji + Count Row */}
                <div className="flex items-start justify-between mb-3">
                    <span
                        className="text-4xl select-none"
                        style={{
                            filter: `drop-shadow(0 0 8px ${config.glow})`,
                            animation: hovered ? 'emojiPop 0.4s ease' : 'none',
                        }}
                    >
                        {config.emoji}
                    </span>
                    <div className={`text-4xl font-black ${config.text} tabular-nums leading-none`}
                        style={{ textShadow: `0 0 20px ${config.glow}` }}
                    >
                        {count}
                    </div>
                </div>

                {/* Label */}
                <h3 className={`text-base font-bold ${config.text} mb-0.5`}>{config.label}</h3>
                <p className="text-xs text-gray-400/80">{config.desc}</p>

                {/* Bottom Row */}
                <div className="flex items-center justify-between mt-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${config.badge}`}>
                        {count} task{count !== 1 ? 's' : ''}
                    </span>
                    <ArrowRight
                        size={14}
                        className={`${config.text} transition-transform duration-300 ${hovered ? 'translate-x-1' : ''}`}
                    />
                </div>
            </div>

            {/* ── Corner Glow Orb ── */}
            <div
                className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-30"
                style={{ background: config.shine }}
            />
        </div>
    );
}

/* ─────────────────────────────────────────
   Priority Dot
───────────────────────────────────────── */
const PriorityDot = ({ priority }) => {
    const colors = {
        Urgent: 'bg-red-500',
        High: 'bg-red-400',
        Medium: 'bg-yellow-400',
        Low: 'bg-green-400',
    };
    return (
        <span className={`w-2.5 h-2.5 rounded-full ${colors[priority] || 'bg-gray-400'} ${priority === 'Urgent' || priority === 'High' ? 'animate-pulse' : ''}`} />
    );
};

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
const EmployeeTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await api.get('/api/tasks/me');
                setTasks(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, []);

    /* Count per status */
    const countFor = (key) => {
        if (key === 'all') return tasks.length;
        return tasks.filter(t => t.status === key).length;
    };

    /* Filtered tasks */
    const filtered = activeFilter === 'all' ? tasks : tasks.filter(t => t.status === activeFilter);

    /* Active config */
    const activeConfig = STATUS_CONFIG.find(s => s.key === activeFilter) || STATUS_CONFIG[0];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                <p className="text-gray-400 animate-pulse">Loading your tasks...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">
            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
                        My Tasks 🎯
                    </h1>
                    <p className="text-gray-400 text-[10px] sm:text-sm mt-1">Tap a card to filter your tasks</p>
                </div>
                {activeFilter !== 'all' && (
                    <button
                        onClick={() => setActiveFilter('all')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all text-sm"
                    >
                        <ChevronLeft size={14} />
                        Show All
                    </button>
                )}
            </div>

            {/* ── 3D Status Cards Grid ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {STATUS_CONFIG.map((config, i) => (
                    <StatusCard
                        key={config.key}
                        config={config}
                        count={countFor(config.key)}
                        isActive={activeFilter === config.key}
                        onClick={() => setActiveFilter(config.key)}
                        index={i}
                    />
                ))}
            </div>

            {/* ── Filter Bar ── */}
            <div className="flex items-center gap-3">
                <div className={`h-6 w-1 rounded-full bg-gradient-to-b ${activeConfig.gradient}`} />
                <h2 className={`text-lg font-bold ${activeConfig.text}`}>
                    {activeConfig.emoji} {activeConfig.label}
                </h2>
                <span className={`ml-1 text-sm px-2.5 py-0.5 rounded-full ${activeConfig.badge}`}>
                    {filtered.length}
                </span>
            </div>

            {/* ── Task Cards ── */}
            {filtered.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                    <div className="text-6xl mb-4 animate-bounce">🎉</div>
                    <h3 className="text-xl font-bold text-white mb-2">
                        {activeFilter === 'all' ? 'No tasks assigned yet!' : `No ${activeFilter} tasks`}
                    </h3>
                    <p className="text-gray-400 text-sm">
                        {activeFilter === 'all'
                            ? "You're all clear — no tasks assigned to you."
                            : `You have no tasks with status "${activeFilter}" right now.`}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((task, idx) => {
                        const cfg = STATUS_CONFIG.find(s => s.key === task.status) || STATUS_CONFIG[0];
                        return (
                            <TaskCard key={task._id} task={task} cfg={cfg} idx={idx} onNavigate={() => navigate(`/employee/tasks/${task._id}`)} />
                        );
                    })}
                </div>
            )}

            {/* ── Global Keyframes ── */}
            <style>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: perspective(900px) translateY(30px) rotateX(8deg); }
                    to   { opacity: 1; transform: perspective(900px) translateY(0) rotateX(0deg); }
                }
                @keyframes emojiPop {
                    0%   { transform: scale(1); }
                    40%  { transform: scale(1.4) rotate(-10deg); }
                    70%  { transform: scale(0.9) rotate(5deg); }
                    100% { transform: scale(1); }
                }
                @keyframes shimmer {
                    0%   { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .card-enter {
                    animation: fadeSlideUp 0.4s ease forwards;
                }
            `}</style>
        </div>
    );
};

/* ─────────────────────────────────────────
   Task Card Sub-Component
───────────────────────────────────────── */
function TaskCard({ task, cfg, idx, onNavigate }) {
    const [hovered, setHovered] = useState(false);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const ref = useRef(null);

    const handleMouseMove = (e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const sensitivity = window.innerWidth < 768 ? 6 : 12;
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * sensitivity;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * -sensitivity;
        setTilt({ x, y });
    };

    const isUrgent = task.priority === 'Urgent' || task.priority === 'High';
    const daysLeft = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysLeft < 0;

    return (
        <div
            ref={ref}
            onClick={onNavigate}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setHovered(false); }}
            style={{
                transform: `perspective(700px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) ${hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)'}`,
                transition: hovered ? 'transform 0.1s ease-out' : 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                boxShadow: hovered ? `0 16px 40px ${cfg.glow}50, 0 0 0 1px ${cfg.shine}30` : '0 4px 16px rgba(0,0,0,0.3)',
                animationDelay: `${idx * 60}ms`,
            }}
            className={`
                relative cursor-pointer rounded-2xl overflow-hidden
                bg-white/5 backdrop-blur-xl
                border ${cfg.border}
                card-enter opacity-0
                group
            `}
        >
            {/* Top Accent Bar */}
            <div className={`h-0.5 w-full bg-gradient-to-r ${cfg.gradient} opacity-70`} />

            {/* Hover Glow */}
            {hovered && (
                <div
                    className="absolute inset-0 pointer-events-none rounded-2xl"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${cfg.shine}18, transparent 60%)` }}
                />
            )}

            <div className="p-5 space-y-4 relative z-10">
                {/* Status + Priority */}
                <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                        <span>{cfg.emoji}</span>
                        {task.status}
                    </span>
                    <PriorityDot priority={task.priority} />
                </div>

                {/* Title */}
                <h3 className={`text-base font-bold text-white group-hover:${cfg.text} transition-colors line-clamp-2 leading-snug`}>
                    {task.title}
                </h3>

                {/* Description */}
                <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                    {task.description ? task.description.replace(/<[^>]*>?/gm, '') : 'No description provided.'}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-white/8">
                    <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-red-400' : daysLeft <= 2 ? 'text-orange-400' : 'text-gray-400'}`}>
                        <Calendar size={12} />
                        <span>
                            {isOverdue
                                ? `⚠️ Overdue ${Math.abs(daysLeft)}d`
                                : daysLeft === 0
                                    ? '🔥 Due today'
                                    : `Due in ${daysLeft}d`}
                        </span>
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${cfg.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
                        Open <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EmployeeTasks;
