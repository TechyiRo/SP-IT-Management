import React from 'react';
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';

// Temporary fallback to textarea due to React 19 incompatibility with ReactQuill
const RichTextEditor = ({ value, onChange, placeholder }) => {
    return (
        <div className="rich-text-editor-container">
            <textarea
                className="glass-input w-full h-32 resize-none p-3 rounded-lg border border-white/10 bg-slate-900/50 text-gray-200"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
            <p className="text-xs text-yellow-500 mt-1">Rich Text Editor temporarily disabled for compatibility check.</p>
        </div>
    );
};

export default RichTextEditor;
