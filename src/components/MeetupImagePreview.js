import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { FaImage, FaTimes } from 'react-icons/fa';
const MeetupImagePreview = ({ onImageSelected, className = '', }) => {
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState(null);
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setError(null);
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Please select a valid image file (JPEG, PNG, GIF, WEBP)');
            return;
        }
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('Image is too large. Maximum size is 5MB.');
            return;
        }
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);
        onImageSelected(file);
    };
    const handleCancel = () => {
        if (preview) {
            URL.revokeObjectURL(preview);
        }
        setPreview(null);
        setError(null);
        onImageSelected(null);
    };
    return (_jsxs("div", { className: `meetup-image-preview ${className}`, children: [preview && (_jsxs("div", { className: "preview-container relative mb-3", children: [_jsx("img", { src: preview, alt: "Preview", className: "w-full h-32 object-cover rounded-md" }), _jsx("button", { onClick: handleCancel, className: "absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full", title: "Remove image", type: "button", children: _jsx(FaTimes, {}) })] })), !preview && (_jsx("div", { className: "file-input-container", children: _jsxs("label", { className: "flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 cursor-pointer bg-gray-50 transition-colors", children: [_jsx(FaImage, { className: "text-gray-500" }), _jsx("span", { className: "text-gray-700", children: "Select Image" }), _jsx("input", { type: "file", accept: "image/*", onChange: handleFileChange, className: "hidden" })] }) })), error && _jsx("div", { className: "mt-2 text-red-500 text-sm", children: error })] }));
};
export default MeetupImagePreview;
//# sourceMappingURL=MeetupImagePreview.js.map