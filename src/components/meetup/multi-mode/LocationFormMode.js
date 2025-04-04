import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useRef } from 'react';
import { IoCalendarOutline, IoTextOutline, IoDocumentTextOutline, IoInformationCircleOutline, IoLocationOutline, IoTimeOutline, IoImageOutline, IoCloseOutline, } from 'react-icons/io5';
const LocationFormMode = ({ location, onSubmit, onCancel, isLoading = false, }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState(60);
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Please enter a title for your meetup');
            return;
        }
        setError(null);
        try {
            await onSubmit({
                title,
                description,
                duration,
                image,
            });
            setTitle('');
            setDescription('');
            setDuration(60);
            setImage(null);
            setImagePreview(null);
        }
        catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            }
            else {
                setError('An error occurred while creating the meetup');
            }
        }
    }, [title, description, duration, image, onSubmit]);
    const handleImageChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('Image must be smaller than 5MB');
                return;
            }
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    }, []);
    const handleImageClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);
    const handleClearImage = useCallback(() => {
        setImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);
    return (_jsxs("div", { className: "p-4", children: [_jsxs("h2", { className: "text-lg font-semibold mb-2 pr-8 flex items-center", children: [_jsx(IoCalendarOutline, { className: "text-blue-500 mr-2" }), "Create Meetup"] }), _jsxs("div", { className: "mb-3 text-sm bg-blue-50 p-2 rounded-md flex items-start", children: [_jsx(IoInformationCircleOutline, { className: "text-blue-500 mr-2 mt-0.5 flex-shrink-0" }), _jsxs("span", { children: ["Creating a meetup at: ", _jsx("strong", { children: location.display_name || 'Selected Location' })] })] }), error && _jsx("div", { className: "mb-3 text-sm bg-red-50 p-2 rounded-md text-red-700", children: error }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "mb-3", children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", htmlFor: "title", children: [_jsx(IoTextOutline, { className: "inline mr-1" }), " Title"] }), _jsx("input", { id: "title", type: "text", value: title, onChange: e => setTitle(e.target.value), className: "w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500", placeholder: "What's this meetup about?", required: true, maxLength: 100, disabled: isLoading })] }), _jsxs("div", { className: "mb-3", children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", htmlFor: "description", children: [_jsx(IoDocumentTextOutline, { className: "inline mr-1" }), " Description"] }), _jsx("textarea", { id: "description", value: description, onChange: e => setDescription(e.target.value), className: "w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500", placeholder: "Add some details about your meetup...", rows: 3, maxLength: 500, disabled: isLoading })] }), _jsxs("div", { className: "mb-3", children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", htmlFor: "duration", children: [_jsx(IoTimeOutline, { className: "inline mr-1" }), " Duration"] }), _jsxs("select", { id: "duration", value: duration, onChange: e => setDuration(Number(e.target.value)), className: "w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500", disabled: isLoading, children: [_jsx("option", { value: 30, children: "30 minutes" }), _jsx("option", { value: 60, children: "1 hour" }), _jsx("option", { value: 120, children: "2 hours" }), _jsx("option", { value: 180, children: "3 hours" }), _jsx("option", { value: 240, children: "4 hours" })] })] }), _jsxs("div", { className: "mb-4", children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: [_jsx(IoImageOutline, { className: "inline mr-1" }), " Image (optional)"] }), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", onChange: handleImageChange, className: "hidden", disabled: isLoading }), imagePreview ? (_jsxs("div", { className: "relative h-32 bg-gray-100 rounded-md overflow-hidden", children: [_jsx("img", { src: imagePreview, alt: "Meetup preview", className: "h-full w-full object-cover" }), _jsx("button", { type: "button", onClick: handleClearImage, className: "absolute top-1 right-1 bg-white rounded-full p-1 shadow-md", disabled: isLoading, children: _jsx(IoCloseOutline, { size: 16 }) })] })) : (_jsx("button", { type: "button", onClick: handleImageClick, className: "w-full h-32 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center hover:border-gray-400 transition-colors", disabled: isLoading, children: _jsxs("div", { className: "text-center text-gray-500", children: [_jsx(IoImageOutline, { className: "mx-auto h-8 w-8 mb-1" }), _jsx("span", { children: "Click to upload an image" })] }) }))] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { type: "submit", className: "flex-1 py-2 px-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed", disabled: isLoading, children: isLoading ? 'Creating...' : 'Create Meetup' }), _jsxs("button", { type: "button", onClick: onCancel, className: "py-2 px-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed", disabled: isLoading, children: [_jsx(IoLocationOutline, { className: "mr-2" }), "Back"] })] })] })] }));
};
export default LocationFormMode;
//# sourceMappingURL=LocationFormMode.js.map