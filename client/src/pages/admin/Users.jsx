import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, Search, Edit2, Trash2, UserPlus, Shield, Eye, EyeOff, Check, X } from 'lucide-react';
import Modal from '../../components/ui/Modal';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Edit Mode State
    const [editMode, setEditMode] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        email: '',
        designation: 'Developer',
        department: 'IT',
        phone: '',
        address: '',
        baseSalary: '',
        employeeId: '',
        role: 'employee',
        status: 'active',
        permissions: {
            canAddProducts: false,
            canAddCompanies: false,
            canViewAllTasks: false,
            canAddWorkDetails: true,
            canViewReports: false,
            canAccessResources: false
        }
    });

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/api/users');
            setUsers(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            username: '', password: '', fullName: '', email: '', designation: 'Developer', department: 'IT', phone: '', address: '', baseSalary: '', employeeId: '', role: 'employee', status: 'active',
            permissions: { canAddProducts: false, canAddCompanies: false, canViewAllTasks: false, canAddWorkDetails: true, canViewReports: false, canAccessResources: false }
        });
        setEditMode(false);
        setCurrentUserId(null);
        setShowPassword(false);
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleEdit = (user) => {
        setFormData({
            username: user.username || '',
            password: '', // Don't populate password
            fullName: user.fullName || '',
            email: user.email || '',
            designation: user.designation || 'Developer',
            department: user.department || 'IT',
            phone: user.phone || '',
            address: user.address || '',
            baseSalary: user.baseSalary || '',
            employeeId: user.employeeId || '',
            role: user.role || 'employee',
            status: user.status || 'active',
            permissions: {
                canAddProducts: user.permissions?.canAddProducts || false,
                canAddCompanies: user.permissions?.canAddCompanies || false,
                canViewAllTasks: user.permissions?.canViewAllTasks || false,
                canAddWorkDetails: user.permissions?.canAddWorkDetails || true,
                canViewReports: user.permissions?.canViewReports || false,
                canAccessResources: user.permissions?.canAccessResources || false
            }
        });
        setEditMode(true);
        setCurrentUserId(user._id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            await api.delete(`/api/users/${id}`);
            fetchUsers();
        } catch (err) {
            console.error(err);
            alert('Error deleting user');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await api.put(`/api/users/${currentUserId}`, formData);
            } else {
                await api.post('/api/users', {
                    ...formData,
                    joinDate: new Date()
                });
            }
            setIsModalOpen(false);
            fetchUsers();
            resetForm();
        } catch (err) {
            console.error(err);
            alert(editMode ? 'Error updating user' : 'Error creating user');
        }
    };

    const togglePermission = (key) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [key]: !prev.permissions[key]
            }
        }));
    };

    const calculatePasswordStrength = (password) => {
        if (!password) return { score: 0, label: 'None', color: 'bg-gray-700' };
        let score = 0;
        if (password.length > 6) score++;
        if (password.length > 10) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
        if (score <= 4) return { score, label: 'Medium', color: 'bg-yellow-500' };
        return { score, label: 'Strong', color: 'bg-green-500' };
    };

    const passwordStrength = calculatePasswordStrength(formData.password);

    const filteredUsers = Array.isArray(users) ? users.filter(user =>
        (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()))
    ) : [];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">User Management</h1>
                    <p className="text-sm text-gray-400">Manage employees, roles, and permissions</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="glass-button flex items-center gap-2 group"
                >
                    <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Add New User
                </button>
            </div>

            <div className="glass-card p-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search users by name or ID..."
                        className="glass-input w-full pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10 uppercase text-xs text-gray-400">
                        <tr>
                            <th className="p-4">Employee</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Department</th>
                            <th className="p-4">Base Salary</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {loading ? (
                            <tr><td colSpan="5" className="p-8 text-center"><div className="animate-pulse text-cyan-400">Loading users...</div></td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">No users found</td></tr>
                        ) : filteredUsers.map(user => (
                            <tr key={user._id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow overflow-hidden">
                                            {user.profilePicture ? (
                                                <img
                                                    src={user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:5000${user.profilePicture}`}
                                                    alt={user.fullName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                user.fullName ? user.fullName.charAt(0) : 'U'
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">{user.fullName || 'No Name'}</div>
                                            <div className="text-sm text-gray-400">@{user.username}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-300">{user.department}</td>
                                <td className="p-4 text-emerald-400 font-mono">₹ {(user.baseSalary || 0).toLocaleString()}</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium max-w-fit flex items-center gap-1 ${user.status === 'active' ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(user)} className="p-2 hover:bg-white/10 rounded-lg text-cyan-400 transition-colors" title="Edit">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(user._id)} className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition-colors" title="Delete">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editMode ? "Edit User" : "Create New User"}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info Section */}
                    <div className="space-y-4">
                        <h4 className="text-sm uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-700 pb-2">Basic Information</h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-400">Username</label>
                                <input required className="glass-input w-full" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-400">Full Name</label>
                                <input required className="glass-input w-full" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-400">Password {editMode && '(Leave blank to keep current)'}</label>
                            <div className="relative">
                                <input
                                    required={!editMode}
                                    type={showPassword ? "text" : "password"}
                                    className="glass-input w-full pr-10"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {/* Strength Indicator */}
                            {formData.password && (
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                                        <div className={`h-full transition-all duration-300 ${passwordStrength.color}`} style={{ width: `${(passwordStrength.score / 5) * 100}%` }}></div>
                                    </div>
                                    <span className="text-xs text-gray-400">{passwordStrength.label}</span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-400">Email</label>
                                <input required type="email" className="glass-input w-full" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-400">Designation</label>
                                <select className="glass-input w-full bg-slate-900" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })}>
                                    <option>Developer</option>
                                    <option>Designer</option>
                                    <option>Manager</option>
                                    <option>HR</option>
                                    <option>Sales</option>
                                    <option>Support</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-400">Department</label>
                                <input required className="glass-input w-full" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-400">Employee ID</label>
                                <input required className="glass-input w-full" value={formData.employeeId} onChange={e => setFormData({ ...formData, employeeId: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-400">Base Salary (Monthly)</label>
                                <input type="number" className="glass-input w-full" placeholder="e.g. 15000" value={formData.baseSalary} onChange={e => setFormData({ ...formData, baseSalary: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-400">Address</label>
                                <input className="glass-input w-full" placeholder="Full Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-400">Role</label>
                                <select className="glass-input w-full bg-slate-900" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                    <option value="employee">Employee</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-400">Status</label>
                                <select className="glass-input w-full bg-slate-900" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Permissions Section */}
                    {formData.role === 'employee' && (
                        <div className="space-y-4">
                            <h4 className="text-sm uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-700 pb-2 flex items-center gap-2">
                                <Shield className="w-4 h-4" /> Permissions
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                                {Object.entries({
                                    canAddProducts: 'Can Add Products',
                                    canAddCompanies: 'Can Add Companies',
                                    canViewAllTasks: 'Can View All Tasks',
                                    canAddWorkDetails: 'Can Add Work Details',
                                    canViewReports: 'Can View Reports',
                                    canAccessResources: 'Can Access Resources'
                                }).map(([key, label]) => (
                                    <div key={key} className="flex items-center justify-between p-3 glass-card hover:bg-white/5 transition-colors cursor-pointer" onClick={() => togglePermission(key)}>
                                        <span className="text-sm text-gray-300">{label}</span>
                                        <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${formData.permissions[key] ? 'bg-cyan-500' : 'bg-gray-700'}`}>
                                            <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform duration-300 ${formData.permissions[key] ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button type="submit" className="w-full glass-button mt-4 py-3 text-sm font-bold uppercase tracking-wide">
                        {editMode ? 'Update User' : 'Create User Account'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};
export default Users;
