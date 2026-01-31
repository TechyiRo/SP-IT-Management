import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Loader, Shield } from 'lucide-react';
import NetworkBackground from '../components/NetworkBackground';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // 3D Tilt Logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseX = useSpring(x, { stiffness: 400, damping: 40 });
    const mouseY = useSpring(y, { stiffness: 400, damping: 40 });
    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["12deg", "-12deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-12deg", "12deg"]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseXVal = (e.clientX - rect.left) / width - 0.5;
        const mouseYVal = (e.clientY - rect.top) / height - 0.5;
        x.set(mouseXVal);
        y.set(mouseYVal);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const res = await login(formData.username, formData.password);
        if (!res.success) {
            setError(res.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden perspective-1000 bg-[#020617]">
            <NetworkBackground />

            {/* Ambient background glows for atmosphere (matching image deep blue/purple) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]"></div>
            </div>

            <motion.div
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 w-full max-w-[350px] mx-4"
            >
                {/* Main Glass Card */}
                <div
                    className="relative rounded-3xl p-8 overflow-hidden shadow-2xl"
                    style={{
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(2, 6, 23, 0.95) 100%)', // Much darker, almost opaque
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(6, 182, 212, 0.2)' // Cyan ring
                    }}
                >
                    {/* Top Gloss Reflection */}
                    <div className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

                    {/* Glowing Border Gradient Overlay */}
                    <div className="absolute inset-0 rounded-3xl p-[2px] bg-gradient-to-br from-cyan-500 via-transparent to-purple-600 opacity-100 pointer-events-none -z-10" style={{
                        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        maskComposite: 'exclude',
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor'
                    }}></div>

                    {/* Corner Glows - More contained */}
                    <div className="absolute -top-20 -left-20 w-40 h-40 bg-cyan-500/20 blur-[50px] rounded-full pointer-events-none"></div>
                    <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500/20 blur-[50px] rounded-full pointer-events-none"></div>

                    {/* Header */}
                    <div className="flex flex-col items-center mb-8" style={{ transform: "translateZ(30px)" }}>

                        {/* SP IT Logo */}
                        <div className="relative mb-3 group cursor-pointer">
                            <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full"></div>
                            {/* Logo Container */}
                            <div className="relative w-14 h-14 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.15)] group-hover:scale-105 transition-transform duration-300">
                                <div className="absolute inset-0 bg-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                                <span className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-br from-orange-400 to-amber-500 tracking-tighter">
                                    SP<span className="text-white ml-1.5">IT</span>
                                </span>
                            </div>

                            {/* Decorative corner accents */}
                            <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-cyan-500 rounded-tl-sm"></div>
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-cyan-500 rounded-br-sm"></div>
                        </div>

                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-xl font-bold tracking-wider text-white drop-shadow-md">
                                SECURE<span className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">FLOW</span>
                            </h1>
                        </div>
                        <p className="text-cyan-200/60 text-[9px] tracking-[0.2em] uppercase font-medium">Access Secure Environment</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-500/10 border border-red-500/30 text-red-200 p-2.5 rounded-lg mb-6 text-xs text-center shadow-[0_0_15px_rgba(239,68,68,0.1)] backdrop-blur-sm"
                            style={{ transform: "translateZ(20px)" }}
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* User ID Field */}
                        <div className="space-y-2 relative group" style={{ transform: "translateZ(20px)" }}>
                            <label className="text-[10px] font-bold text-cyan-300/70 uppercase tracking-wider ml-1">User ID</label>
                            <div className="relative overflow-hidden rounded-lg transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                                <div className="absolute inset-0 bg-slate-800/50 backdrop-blur-md"></div>
                                <input
                                    type="text"
                                    className="relative w-full bg-transparent border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder-white/10 font-light"
                                    placeholder="ENTER ID"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                                {/* Glow under input */}
                                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                            </div>
                        </div>

                        {/* Encrypted Key Field */}
                        <div className="space-y-2 relative group" style={{ transform: "translateZ(20px)" }}>
                            <label className="text-[10px] font-bold text-cyan-300/70 uppercase tracking-wider ml-1">Encrypted Key</label>
                            <div className="relative overflow-hidden rounded-lg transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                                <div className="absolute inset-0 bg-slate-800/50 backdrop-blur-md"></div>
                                <input
                                    type="password"
                                    className="relative w-full bg-transparent border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder-white/10 tracking-widest font-light"
                                    placeholder="••••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                                {/* Bottom line glow */}
                                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                            </div>
                        </div>

                        {/* Login Button */}
                        <motion.button
                            whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(6, 182, 212, 0.5)" }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            style={{ transform: "translateZ(25px)" }}
                            className="w-full relative overflow-hidden group rounded-lg p-[1px]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient-x"></div>
                            <div className="relative bg-slate-900/90 w-full h-full rounded-[7px] flex items-center justify-center py-3 group-hover:bg-slate-900/0 transition-all duration-300">
                                <span className="text-white font-bold text-sm tracking-widest uppercase flex items-center gap-2 group-hover:text-white transition-colors">
                                    {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Login'}
                                </span>
                            </div>
                        </motion.button>
                    </form>

                    {/* Footer Status */}
                    <div className="mt-8 text-center" style={{ transform: "translateZ(10px)" }}>
                        <p className="text-[9px] text-cyan-500/50 uppercase tracking-[0.3em] font-semibold animate-pulse">
                            Quantum Encryption Active
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
