import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { User, DollarSign, MapPin, Briefcase, Camera, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const EmployeeProfileModal = ({ isOpen, onClose }) => {
    const { user, login } = useAuth(); // login is used to update context user data if needed, or we might need a dedicated update function
    const [formData, setFormData] = useState({
        fullName: '',
        designation: '',
        salary: '',
        address: '',
        phone: '',
        profilePicture: ''
    });
    const [loading, setLoading] = useState(false);

    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        if (isOpen && user) {
            setFormData({
                fullName: user.fullName || '',
                designation: user.designation || '',
                salary: user.salary || '',
                address: user.address || '',
                phone: user.phone || '',
                profilePicture: user.profilePicture || ''
            });
            setPreviewUrl(user.profilePicture ? (user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:5000${user.profilePicture}`) : '');
            setFile(null);
        }
    }, [isOpen, user]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        if (selectedFile) {
            const objectUrl = URL.createObjectURL(selectedFile);
            setPreviewUrl(objectUrl);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            data.append('fullName', formData.fullName);
            data.append('designation', formData.designation);
            data.append('salary', formData.salary);
            data.append('address', formData.address);
            data.append('phone', formData.phone);
            if (file) {
                data.append('profilePicture', file);
            } else {
                // If no new file, we don't strictly need to send profilePicture string if we are using the file upload middleware primarily.
                // But our backend logic handles "req.body.profilePicture" if no file.
                data.append('profilePicture', formData.profilePicture);
            }

            const res = await api.put('/api/users/profile', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert('Profile Updated Successfully!');
            onClose();
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert('Error updating profile');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                >
                    <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5 flex-shrink-0">
                        <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                        {/* Profile Image File Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
                                <Camera size={14} /> Profile Image
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                className="glass-input w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20"
                                onChange={handleFileChange}
                            />
                            {previewUrl && (
                                <img src={previewUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-cyan-500 mx-auto mt-2" />
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
                                <User size={14} /> Full Name
                            </label>
                            <input
                                required
                                className="glass-input w-full"
                                value={formData.fullName}
                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
                                <Briefcase size={14} /> Designation
                            </label>
                            <input
                                className="glass-input w-full"
                                value={formData.designation}
                                onChange={e => setFormData({ ...formData, designation: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
                                    <DollarSign size={14} /> Salary
                                </label>
                                <input
                                    className="glass-input w-full"
                                    value={formData.salary}
                                    onChange={e => setFormData({ ...formData, salary: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
                                    Phone
                                </label>
                                <input
                                    className="glass-input w-full"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
                                <MapPin size={14} /> Address
                            </label>
                            <textarea
                                className="glass-input w-full min-h-[80px]"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full glass-button mt-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold"
                        >
                            {loading ? 'Updating...' : 'Save Changes'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default EmployeeProfileModal;
