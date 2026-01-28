import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bell, Check, X, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
        // Poll every 10 seconds for better responsiveness
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const fetchNotifications = async () => {
        // Avoid setting global loading state to prevent flickering for polling
        // setLoading(true); 
        try {
            const res = await axios.get('http://localhost:5000/api/notifications');
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.read).length);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
        // setLoading(false);
    };

    const handleManualRefresh = (e) => {
        e.stopPropagation();
        setLoading(true);
        fetchNotifications().then(() => setLoading(false));
    };

    const markAsRead = async (id, e) => {
        e.stopPropagation(); // Prevent navigation when clicking mark as read
        try {
            await axios.put(`http://localhost:5000/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.put('http://localhost:5000/api/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const handleNotificationClick = (notif) => {
        if (!notif.read) {
            markAsRead(notif._id, { stopPropagation: () => { } });
        }
        setIsOpen(false);
        if (notif.onModel === 'Task' && notif.relatedId) {
            navigate(notif.relatedId ? `/employee/tasks/${notif.relatedId}` : '/employee/tasks');
        }
        // Handle other types if needed
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold border-2 border-slate-900">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 glass-card bg-slate-900/95 border border-white/10 rounded-xl shadow-xl z-50 animate-fade-in-up">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">Notifications</h3>
                            <button onClick={handleManualRefresh} className={`text-gray-400 hover:text-white ${loading ? 'animate-spin' : ''}`}>
                                <RefreshCw size={14} />
                            </button>
                        </div>

                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="text-xs text-cyan-400 hover:text-cyan-300">
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                No notifications
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {notifications.map(notif => (
                                    <div
                                        key={notif._id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${!notif.read ? 'bg-white/5' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notif.read ? 'bg-cyan-500' : 'bg-transparent'}`} />
                                            <div className="flex-1">
                                                <p className={`text-sm ${!notif.read ? 'text-white' : 'text-gray-400'}`}>
                                                    {notif.message}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(notif.createdAt).toLocaleDateString()} • {new Date(notif.createdAt).toLocaleTimeString()}
                                                </p>
                                            </div>
                                            {!notif.read && (
                                                <button
                                                    onClick={(e) => markAsRead(notif._id, e)}
                                                    className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white h-fit"
                                                    title="Mark as read"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notifications;
