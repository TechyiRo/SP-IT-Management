import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEye, FaEyeSlash, FaPlus, FaTrash, FaBuilding, FaLock, FaUser, FaSave, FaSearch, FaEdit } from 'react-icons/fa';
import Modal from '../../components/ui/Modal';

// Helper for color mapping to proper Tailwind classes to avoid purge issues
const colorMap = {
    blue: { text: 'text-blue-400', border: 'border-blue-500', bg: 'bg-blue-500', hoverBorder: 'hover:border-blue-500/50' },
    red: { text: 'text-red-400', border: 'border-red-500', bg: 'bg-red-500', hoverBorder: 'hover:border-red-500/50' },
    green: { text: 'text-green-400', border: 'border-green-500', bg: 'bg-green-500', hoverBorder: 'hover:border-green-500/50' },
    purple: { text: 'text-purple-400', border: 'border-purple-500', bg: 'bg-purple-500', hoverBorder: 'hover:border-purple-500/50' },
    orange: { text: 'text-orange-400', border: 'border-orange-500', bg: 'bg-orange-500', hoverBorder: 'hover:border-orange-500/50' },
};

const PasswordManager = () => {
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState('');
    const [credentials, setCredentials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // New Credentials Form State
    const [newCredentials, setNewCredentials] = useState([
        { name: '', username: '', password: '', details: '', color: 'blue' }
    ]);

    // Edit State
    const [editingCredential, setEditingCredential] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Visibilty toggle state for list
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
        } catch (err) {
            console.error(err);
        }
    };

    const fetchCredentials = async (companyId) => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/credentials/${companyId}`);
            setCredentials(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
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
        if (!selectedCompany) return alert('Please select a company first');

        // Filter out empty rows
        const toSave = newCredentials.filter(c => c.name && c.username && c.password);
        if (toSave.length === 0) return alert('Please enter at least one credential');

        setSaving(true);
        try {
            await axios.post('/api/credentials', {
                companyId: selectedCompany,
                credentials: toSave
            });
            // Reset form and refresh list
            setNewCredentials([{ name: '', username: '', password: '', details: '', color: 'blue' }]);
            fetchCredentials(selectedCompany);
            alert('Credentials saved successfully');
        } catch (err) {
            console.error(err);
            alert('Error saving credentials');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (cred) => {
        setEditingCredential({ ...cred });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingCredential.name || !editingCredential.username || !editingCredential.password) {
            return alert('Name, Username and Password are required');
        }

        setSaving(true);
        try {
            const res = await axios.put(`/api/credentials/${editingCredential._id}`, editingCredential);
            // Update list
            setCredentials(credentials.map(c => c._id === res.data._id ? res.data : c));
            setIsEditModalOpen(false);
            setEditingCredential(null);
            alert('Updated successfully');
        } catch (err) {
            console.error(err);
            alert('Failed to update credential');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this credential?')) return;
        try {
            await axios.delete(`/api/credentials/${id}`);
            setCredentials(credentials.filter(c => c._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const toggleVisibility = (id) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    return (
        <div className="p-6 text-white min-h-screen">
            <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Password Manager
            </h1>

            {/* Company Selection */}
            <div className="mb-8 max-w-xl">
                <label className="block text-gray-400 mb-2">Select Company</label>
                <div className="relative">
                    <FaBuilding className="absolute left-3 top-3 text-gray-500" />
                    <select
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500"
                    >
                        <option value="">-- Choose a Company --</option>
                        {companies.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedCompany && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Add New Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm"
                    >
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <FaPlus className="text-green-400" /> Add New Passwords
                        </h2>

                        <div className="space-y-4">
                            {newCredentials.map((cred, index) => (
                                <div key={index} className="flex flex-col gap-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 relative">
                                    {newCredentials.length > 1 && (
                                        <button
                                            onClick={() => handleRemoveRow(index)}
                                            className="absolute top-2 right-2 text-red-400 hover:text-red-300"
                                        >
                                            <FaTrash size={12} />
                                        </button>
                                    )}
                                    <input
                                        type="text"
                                        placeholder="Service Name (e.g. AWS)"
                                        value={cred.name}
                                        onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                                        className="bg-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            placeholder="Username/Email"
                                            value={cred.username}
                                            onChange={(e) => handleInputChange(index, 'username', e.target.value)}
                                            className="bg-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Password"
                                            value={cred.password}
                                            onChange={(e) => handleInputChange(index, 'password', e.target.value)}
                                            className="bg-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4 mt-6">
                            <button
                                onClick={handleAddRow}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors flex items-center gap-2"
                            >
                                <FaPlus /> Add Another Row
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg text-sm font-semibold shadow-lg transition-all flex items-center gap-2 ml-auto"
                            >
                                <FaSave /> {saving ? 'Saving...' : 'Save All'}
                            </button>
                        </div>
                    </motion.div>

                    {/* List Section */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <FaLock className="text-blue-400" /> Stored Credentials
                        </h2>

                        {loading ? (
                            <div className="text-center text-gray-500 py-8">Loading...</div>
                        ) : credentials.length === 0 ? (
                            <div className="text-center text-gray-500 py-8 bg-slate-800/30 rounded-lg border border-slate-700 border-dashed">
                                No credentials found for this company.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {credentials.map(cred => (
                                    <motion.div
                                        key={cred._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`bg-slate-800 p-4 rounded-lg border border-l-4 transition-colors group border-slate-700 hover:border-${cred.color || 'blue'}-500/50`}
                                        style={{ borderLeftColor: `var(--color-${cred.color || 'blue'}-500)` }} /* Fallback or class-based approach needed */
                                    >
                                        <div className={`relative overflow-hidden`}>
                                            <div className={`absolute top-0 left-0 w-1 h-full bg-${cred.color || 'blue'}-500`}></div> {/* Left Border Strip */}
                                            <div className="pl-3">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className={`font-semibold text-lg text-${cred.color || 'blue'}-400`}>{cred.name}</h3>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleEdit(cred)}
                                                            className="text-gray-500 hover:text-blue-400 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(cred._id)}
                                                            className="text-gray-500 hover:text-red-400 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                                                    <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50 flex flex-col">
                                                        <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Username</span>
                                                        <span className="font-mono text-gray-300">{cred.username}</span>
                                                    </div>
                                                    <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50 flex flex-col relative">
                                                        <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Password</span>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-mono text-gray-300">
                                                                {visiblePasswords[cred._id] ? cred.password : '••••••••••••'}
                                                            </span>
                                                            <button
                                                                onClick={() => toggleVisibility(cred._id)}
                                                                className={`text-gray-400 hover:text-${cred.color || 'blue'}-400 ml-2`}
                                                            >
                                                                {visiblePasswords[cred._id] ? <FaEyeSlash /> : <FaEye />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {cred.details && (
                                                    <div className="bg-slate-900/30 p-3 rounded border border-slate-700/30 text-sm text-gray-400 italic mb-2">
                                                        "{cred.details}"
                                                    </div>
                                                )}

                                                <div className="mt-3 text-xs text-gray-500 flex items-center justify-end gap-1">
                                                    Added by: <span className="text-gray-400">{cred.addedBy?.fullName || 'Unknown'}</span>
                                                    <span className="mx-1">•</span>
                                                    {new Date(cred.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Credential"
            >
                {editingCredential && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-400 mb-1 text-sm">Service Name</label>
                            <input
                                type="text"
                                value={editingCredential.name}
                                onChange={(e) => setEditingCredential({ ...editingCredential, name: e.target.value })}
                                className="w-full bg-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-400 mb-1 text-sm">Username</label>
                                <input
                                    type="text"
                                    value={editingCredential.username}
                                    onChange={(e) => setEditingCredential({ ...editingCredential, username: e.target.value })}
                                    className="w-full bg-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-1 text-sm">Password</label>
                                <input
                                    type="text"
                                    value={editingCredential.password}
                                    onChange={(e) => setEditingCredential({ ...editingCredential, password: e.target.value })}
                                    className="w-full bg-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1 text-sm">Details</label>
                            <textarea
                                value={editingCredential.details}
                                onChange={(e) => setEditingCredential({ ...editingCredential, details: e.target.value })}
                                className="w-full bg-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 h-24 resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2 text-sm">Color Tag</label>
                            <div className="flex gap-2">
                                {Object.keys(colorMap).map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setEditingCredential({ ...editingCredential, color })}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${editingCredential.color === color ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                        style={{ backgroundColor: `var(--color-${color}-500, ${color})` }}
                                    >
                                        <div className={`w-full h-full rounded-full bg-${color}-500`}></div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={saving}
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg text-white font-semibold hover:from-blue-500 hover:to-blue-400 disabled:opacity-50"
                            >
                                {saving ? 'Updating...' : 'Update Credential'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PasswordManager;
