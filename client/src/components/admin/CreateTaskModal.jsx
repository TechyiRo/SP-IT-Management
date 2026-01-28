
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Flag, Tag, Layers, Briefcase, User, CheckSquare, Paperclip, Plus, Trash2 } from 'lucide-react';
// import ReactQuill from 'react-quill'; // REMOVED: Incompatible with React 19
// import 'react-quill/dist/quill.snow.css'; // Import styles

export default function CreateTaskModal({ isOpen, onClose, onTaskCreate, onTaskUpdate, users = [], companies = [], products = [], taskToEdit = null }) {
    const isEditMode = !!taskToEdit;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        category: 'Development',
        deadline: '',
        assignedTo: [], // Array of user IDs
        company: '',
        product: '',
        adminNotes: '',
        requirements: [] // Array of { text: string }
    });

    const [reqInput, setReqInput] = useState('');
    const [attachments, setAttachments] = useState([]);

    // Reset or Populate form when modal opens
    useEffect(() => {
        if (isOpen) {
            if (taskToEdit) {
                // Populate for Edit
                setFormData({
                    title: taskToEdit.title || '',
                    description: taskToEdit.description || '',
                    priority: taskToEdit.priority || 'Medium',
                    category: taskToEdit.category || 'Development',
                    deadline: taskToEdit.deadline ? new Date(taskToEdit.deadline).toISOString().split('T')[0] : '',
                    assignedTo: taskToEdit.assignedTo ? taskToEdit.assignedTo.map(u => typeof u === 'object' ? u._id : u) : [],
                    company: taskToEdit.company ? (typeof taskToEdit.company === 'object' ? taskToEdit.company._id : taskToEdit.company) : '',
                    product: taskToEdit.products && taskToEdit.products.length > 0
                        ? (typeof taskToEdit.products[0] === 'object' ? taskToEdit.products[0]._id : taskToEdit.products[0])
                        : '',
                    adminNotes: taskToEdit.adminNotes || '',
                    requirements: taskToEdit.taskRequirements ? taskToEdit.taskRequirements.map(r => ({ text: r.text, completed: r.completed })) : []
                });
            } else {
                // Reset for Create
                setFormData({
                    title: '',
                    description: '',
                    priority: 'Medium',
                    category: 'Development',
                    deadline: '',
                    assignedTo: [],
                    company: '',
                    product: '',
                    adminNotes: '',
                    requirements: []
                });
            }
            setReqInput('');
            setAttachments([]);
        }
    }, [isOpen, taskToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // const handleQuillChange = (value) => {
    //     setFormData(prev => ({ ...prev, description: value }));
    // };

    const handleAddRequirement = () => {
        if (!reqInput.trim()) return;
        setFormData(prev => ({
            ...prev,
            requirements: [...prev.requirements, { text: reqInput, completed: false }]
        }));
        setReqInput('');
    };

    const removeRequirement = (index) => {
        setFormData(prev => ({
            ...prev,
            requirements: prev.requirements.filter((_, i) => i !== index)
        }));
    };

    const handleUserToggle = (userId) => {
        setFormData(prev => {
            const isSelected = prev.assignedTo.includes(userId);
            if (isSelected) {
                return { ...prev, assignedTo: prev.assignedTo.filter(id => id !== userId) };
            } else {
                return { ...prev, assignedTo: [...prev.assignedTo, userId] };
            }
        });
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            setAttachments(Array.from(e.target.files));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Prepare payload - sanitize empty strings for ObjectIds
        const payload = {
            ...formData,
            company: formData.company || null, // Handle empty string
            products: formData.product ? [formData.product] : [], // Map single product to array
        };

        // Remove the original 'product' field as schema uses 'products'
        delete payload.product;

        // If company is null, remove it entirely to be safe (optional, but cleaner)
        if (!payload.company) delete payload.company;

        if (isEditMode) {
            onTaskUpdate(taskToEdit._id, payload);
        } else {
            onTaskCreate(payload);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Layers className="text-indigo-400" /> {isEditMode ? 'Edit Task' : 'Create New Task'}
                            </h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

                            {/* Basic Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-indigo-200 mb-1">Task Title</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="e.g. Implement Auth"
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-indigo-200 mb-1">Priority</label>
                                            <div className="relative">
                                                <Flag className="absolute left-3 top-3 text-gray-400" size={16} />
                                                <select
                                                    name="priority"
                                                    value={formData.priority}
                                                    onChange={handleChange}
                                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                                                >
                                                    <option value="Low">Low</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="High">High</option>
                                                    <option value="Urgent">Urgent</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-indigo-200 mb-1">Category</label>
                                            <div className="relative">
                                                <Tag className="absolute left-3 top-3 text-gray-400" size={16} />
                                                <select
                                                    name="category"
                                                    value={formData.category}
                                                    onChange={handleChange}
                                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                                                >
                                                    <option value="Development">Development</option>
                                                    <option value="Design">Design</option>
                                                    <option value="Marketing">Marketing</option>
                                                    <option value="Maintenance">Maintenance</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-indigo-200 mb-1">Deadline</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-3 text-gray-400" size={16} />
                                            <input
                                                type="date"
                                                name="deadline"
                                                value={formData.deadline}
                                                onChange={handleChange}
                                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Relationships */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-indigo-200 mb-1">Company</label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-3 top-3 text-gray-400" size={16} />
                                                <select
                                                    name="company"
                                                    value={formData.company}
                                                    onChange={handleChange}
                                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                                                >
                                                    <option value="">Select Company</option>
                                                    {companies.map(c => (
                                                        <option key={c._id} value={c._id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-indigo-200 mb-1">Product</label>
                                            <div className="relative">
                                                <Layers className="absolute left-3 top-3 text-gray-400" size={16} />
                                                <select
                                                    name="product"
                                                    value={formData.product}
                                                    onChange={handleChange}
                                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                                                >
                                                    <option value="">Select Product</option>
                                                    {products.map(p => (
                                                        <option key={p._id} value={p._id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-indigo-200 mb-2">Assign To</label>
                                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                                            {users.length > 0 ? users.map(user => (
                                                <div key={user._id}
                                                    onClick={() => handleUserToggle(user._id)}
                                                    className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${formData.assignedTo.includes(user._id) ? 'bg-indigo-600/30 border border-indigo-500/50' : 'hover:bg-slate-700/50'}`}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold ring-2 ring-white/10">
                                                        {user.fullName ? user.fullName.charAt(0) : 'U'}
                                                    </div>
                                                    <span className="text-gray-300 text-sm">{user.fullName || user.username}</span>
                                                    {formData.assignedTo.includes(user._id) && <CheckSquare size={16} className="ml-auto text-indigo-400" />}
                                                </div>
                                            )) : <p className="text-gray-500 text-xs text-center py-2">No users available</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Rich Text Description */}
                            <div>
                                <label className="block text-sm font-medium text-indigo-200 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Enter task details..."
                                    className="w-full h-40 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                                />
                                {/* 
                                <div className="bg-slate-100 rounded-lg overflow-hidden text-slate-900 border border-slate-700">
                                    <ReactQuill
                                        theme="snow"
                                        value={formData.description}
                                        onChange={handleQuillChange}
                                        className="h-40 mb-10"
                                    />
                                </div> 
                                */}
                            </div>

                            {/* Requirements / Checklist */}
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-indigo-200 mb-2">Task Requirements / Checklist</label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={reqInput}
                                        onChange={(e) => setReqInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddRequirement()}
                                        placeholder="Add a specific requirement..."
                                        className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                    <button
                                        onClick={handleAddRequirement}
                                        className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/40 transition-colors"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {formData.requirements.map((req, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg border border-white/5">
                                            <span className="text-gray-300 text-sm">{req.text}</span>
                                            <button onClick={() => removeRequirement(idx)} className="text-red-400 hover:text-red-300 opacity-60 hover:opacity-100">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {formData.requirements.length === 0 && (
                                        <p className="text-gray-500 text-sm italic text-center py-2">No specific requirements added.</p>
                                    )}
                                </div>
                            </div>

                            {/* Admin Notes */}
                            <div>
                                <label className="block text-sm font-medium text-amber-200/80 mb-1 flex items-center gap-2">
                                    Admin Notes <span className="text-xs text-gray-500">(Private)</span>
                                </label>
                                <textarea
                                    name="adminNotes"
                                    value={formData.adminNotes}
                                    onChange={handleChange}
                                    placeholder="Internal notes, budget details, etc..."
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 h-20"
                                />
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10 bg-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="text-xs text-gray-500">
                                <span className="text-indigo-400">{formData.assignedTo.length} users</span> assigned • Priority: <span className={formData.priority === 'High' || formData.priority === 'Urgent' ? 'text-red-400' : 'text-emerald-400'}>{formData.priority}</span>
                            </div>

                            <div className="flex gap-3 w-full md:w-auto">
                                <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-800 text-gray-300 hover:bg-slate-700 transition-colors flex-1 md:flex-none text-center">
                                    Cancel
                                </button>
                                <button onClick={handleSubmit} className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex-1 md:flex-none text-center flex items-center justify-center gap-2">
                                    <Layers size={18} /> {isEditMode ? 'Update Task' : 'Create Task'}
                                </button>
                            </div>
                        </div>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
