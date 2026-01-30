import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, UserCheck, CheckSquare, FileText, Package, IndianRupee, MapPin } from 'lucide-react';
import clsx from 'clsx';
import Notifications from '../components/ui/Notifications';
import { useState, useEffect } from 'react';
import EmployeeProfileModal from '../components/profile/EmployeeProfileModal';
import api from '../api/axios';

const EmployeeLayout = () => {
    const { logout, user } = useAuth();
    const location = useLocation();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [gpsStatus, setGpsStatus] = useState('initializing'); // initializing, active, error

    // Live Location Heartbeat (Every 15 mins)
    useEffect(() => {
        const updateLocation = () => {
            if (!navigator.geolocation) {
                setGpsStatus('error');
                return;
            }

            console.log('Requesting location...');
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                setGpsStatus('active');

                // Optional: Reverse Geocoding can be done here or in backend.
                // For now, sending coords. We can fetch address via a free API like Nominatim if needed,
                // or just store coords and let Admin frontend resolve it.
                // Let's try a simple fetch if possible, or just send coords.

                try {
                    // Simple reverse geocode (Client-side to avoid backend complexity for now)
                    let address = 'Unknown Location';
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const data = await res.json();
                        address = data.display_name || 'Map Location';
                    } catch (e) { console.error('Geocode failed', e); }

                    await api.put('/api/users/location', {
                        latitude, longitude, address
                    });
                    console.log('Live location updated');
                } catch (err) {
                    console.error('Error updating location heartbeat', err);
                    // Still 'active' regarding GPS, but API failed.
                }
            }, (err) => {
                console.warn('Location access denied or unavailable', err);
                setGpsStatus('error');
            }, { enableHighAccuracy: true });
        };

        // Initial call
        if (user && user.role === 'employee') {
            updateLocation();
            const interval = setInterval(updateLocation, 15 * 60 * 1000); // 15 Minutes
            return () => clearInterval(interval);
        }
    }, [user]);

    const menuItems = [
        { path: '/employee', icon: Home, label: 'Dashboard' },
        { path: '/employee/attendance', icon: UserCheck, label: 'Attendance' },
        { path: '/employee/tasks', icon: CheckSquare, label: 'My Tasks' },
        { path: '/employee/work-log', icon: FileText, label: 'Work Log' },

        // Conditional Render
        ...(user?.permissions?.canAccessResources ? [{ path: '/employee/resources', icon: Package, label: 'Resources' }] : []),

        { path: '/employee/salary', icon: IndianRupee, label: 'My Salary' },
    ];

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Desktop Sidebar (visible on md+) */}
            <aside className="fixed md:relative inset-y-0 left-0 z-50 w-64 glass-card m-0 md:m-4 md:mr-0 rounded-none md:rounded-2xl flex flex-col transition-transform duration-300 ease-in-out">
                <div className="p-6 border-b border-white/10 flex items-center gap-3">
                    <img src="/logo.png" alt="SP IT Logo" className="w-10 h-10 object-contain" />
                    <span className="font-bold text-lg tracking-wide">SP IT</span>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                                    isActive ? "bg-primary/20 text-white shadow-lg border border-white/10" : "text-gray-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <Icon className={clsx("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-cyan-400" : "text-gray-400 group-hover:text-cyan-400")} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10 space-y-4">
                    {/* GPS Status Indicator */}
                    <div className={`text-xs flex items-center gap-2 justify-center py-1 rounded border ${gpsStatus === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        gpsStatus === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${gpsStatus === 'active' ? 'bg-green-500 animate-pulse' : gpsStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                        {gpsStatus === 'active' ? 'GPS Active' : gpsStatus === 'error' ? 'GPS Error - Check Settings' : 'GPS Initializing...'}
                    </div>

                    <div className="glass-card bg-black/20 p-4 rounded-xl cursor-pointer hover:bg-black/30 transition-colors" onClick={() => setIsProfileOpen(true)}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                                {user?.username?.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user?.fullName}</p>
                                <p className="text-xs text-gray-400 truncate">{user?.designation}</p>
                            </div>
                            <Notifications />
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-card m-0 rounded-b-none rounded-t-2xl z-50 flex justify-around p-4 border-t border-white/10">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                "flex flex-col items-center gap-1 transition-colors",
                                isActive ? "text-cyan-400" : "text-gray-500"
                            )}
                        >
                            <Icon className={clsx("w-6 h-6", isActive && "animate-bounce")} />
                            <span className="text-[10px]">{item.label}</span>
                        </Link>
                    );
                })}
                <button onClick={logout} className="flex flex-col items-center gap-1 text-red-400">
                    <LogOut className="w-6 h-6" />
                    <span className="text-[10px]">Logout</span>
                </button>
            </nav>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="glass-card min-h-full p-6 animate-fade-in-up">
                    <Outlet />
                </div>
            </main>

            <EmployeeProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        </div>
    );
};

export default EmployeeLayout;
