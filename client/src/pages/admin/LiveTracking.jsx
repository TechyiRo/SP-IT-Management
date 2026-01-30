import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { MapPin, Clock, Search, RefreshCw, User } from 'lucide-react';

const LiveTracking = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/users');
            // Filter all employees
            const employees = res.data.filter(u => u.role === 'employee');
            setUsers(employees);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // Auto-refresh every minute to keep it "Live"
        const interval = setInterval(fetchUsers, 60000);
        return () => clearInterval(interval);
    }, []);

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">Live Employee Tracking</h1>
                    <p className="text-sm text-gray-400">Real-time location updates from active employees</p>
                </div>
                <button onClick={fetchUsers} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-cyan-400 transition-colors" title="Refresh">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="glass-card p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search employee..."
                        className="glass-input w-full pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading && users.length === 0 ? (
                <div className="text-center p-10 text-gray-500 animate-pulse">Scanning for active signals...</div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center p-10 border-2 border-dashed border-gray-800 rounded-xl">
                    <MapPin className="mx-auto w-12 h-12 text-gray-600 mb-2" />
                    <p className="text-gray-500">No employees found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map(user => {
                        const hasLocation = user.lastLocation && user.lastLocation.latitude;
                        const lastSeen = hasLocation ? new Date(user.lastLocation.timestamp) : null;
                        const isOnline = lastSeen && (new Date() - lastSeen) < (20 * 60 * 1000); // 20 mins threshold

                        return (
                            <div key={user._id} className="glass-card p-6 relative group hover:border-cyan-500/30 transition-colors">
                                <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} title={isOnline ? "Active Recently" : "Offline / No Data"}></div>

                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 overflow-hidden">
                                        {user.profilePicture ? (
                                            <img src={user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:5000${user.profilePicture}`} alt={user.fullName} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{user.fullName}</h3>
                                        <span className="text-xs text-cyan-400">{user.designation}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-white/5">
                                    {hasLocation ? (
                                        <>
                                            <div className="flex items-start gap-2 text-sm text-gray-300">
                                                <MapPin className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                                                <span className="leading-snug">{user.lastLocation.address || 'Unknown Address'}</span>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Clock className="w-3 h-3" />
                                                <span>Last seen: {lastSeen.toLocaleString()}</span>
                                            </div>

                                            <a
                                                href={`https://www.google.com/maps?q=${user.lastLocation.latitude},${user.lastLocation.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full text-center mt-2 py-2 text-xs font-bold text-slate-900 bg-cyan-400 rounded hover:bg-cyan-300 transition-colors"
                                            >
                                                VIEW ON MAP
                                            </a>
                                        </>
                                    ) : (
                                        <div className="text-center py-2">
                                            <p className="text-sm text-gray-500 italic">No location data available</p>
                                            <p className="text-xs text-gray-600 mt-1">User may have disabled GPS</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default LiveTracking;
