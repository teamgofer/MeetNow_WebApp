import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { FaImage, FaUpload, FaTimes, FaCheck } from 'react-icons/fa';
import { ErrorTypes } from '@/utils/error-handler';
import { getUploadPresignedUrl, getSignedViewUrl } from '../utils/wasabi-storage';
const MeetupImageUploader = ({ onImageUploaded, meetupId, className = '', isAnonymous = false, }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
    const [signedViewUrl, setSignedViewUrl] = useState(null);
    const [fallbackImageUrl, setFallbackImageUrl] = useState(null);
    const ERROR_CATEGORIES = {
        UPLOAD: 'upload',
        URL_GENERATION: 'url_generation',
        VALIDATION: 'validation',
        NETWORK: 'network',
        UNKNOWN: 'unknown',
    };
    const ERROR_RECOVERY_STRATEGIES = {
        [ERROR_CATEGORIES.UPLOAD]: async (error, retryCount = 0) => {
            if (retryCount < 3) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                return true;
            }
            return false;
        },
        [ERROR_CATEGORIES.URL_GENERATION]: async (error, retryCount = 0) => {
            if (retryCount < 3) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                return true;
            }
            return false;
        },
        [ERROR_CATEGORIES.NETWORK]: async (error, retryCount = 0) => {
            if (retryCount < 3) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                return true;
            }
            return false;
        },
        [ERROR_CATEGORIES.VALIDATION]: async (error) => {
            return false;
        },
        [ERROR_CATEGORIES.UNKNOWN]: async (error) => {
            return false;
        },
    };
    const categorizeError = (error) => {
        if (error.message.includes('upload'))
            return ERROR_CATEGORIES.UPLOAD;
        if (error.message.includes('url'))
            return ERROR_CATEGORIES.URL_GENERATION;
        if (error.message.includes('network'))
            return ERROR_CATEGORIES.NETWORK;
        if (error.message.includes('validation'))
            return ERROR_CATEGORIES.VALIDATION;
        return ERROR_CATEGORIES.UNKNOWN;
    };
    const handleError = async (error, operation) => {
        const category = categorizeError(error);
        const retryCount = error.retryCount || 0;
        console.error(`Error during ${operation}:`, {
            category,
            error: error.message,
            retryCount,
            timestamp: new Date().toISOString(),
        });
        if (ERROR_RECOVERY_STRATEGIES[category]) {
            const shouldRetry = await ERROR_RECOVERY_STRATEGIES[category](error, retryCount);
            if (shouldRetry) {
                error.retryCount = retryCount + 1;
                return null;
            }
        }
        return {
            success: false,
            error: error.message || `Failed to ${operation}`,
            category,
        };
    };
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setError(null);
        setUploadStatus(null);
        setUploadProgress(0);
        setUploadedImageUrl(null);
        setSignedViewUrl(null);
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
        setSelectedFile(file);
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);
    };
    useEffect(() => {
        const generateSignedUrl = async () => {
            if (uploadedImageUrl) {
                try {
                    const signedUrl = await getSignedViewUrl(uploadedImageUrl, 86400, isAnonymous);
                    console.log('Generated signed view URL for uploaded image');
                    setSignedViewUrl(signedUrl);
                }
                catch (err) {
                    console.error('Error generating signed URL for viewing:', err);
                    setError('Failed to generate image URL. Please try again.');
                    setSignedViewUrl(null);
                }
            }
        };
        generateSignedUrl();
    }, [uploadedImageUrl, isAnonymous]);
    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select an image first');
            return;
        }
        try {
            setUploading(true);
            setUploadProgress(10);
            setError(null);
            const timestamp = Date.now();
            const extension = selectedFile.name.split('.').pop().toLowerCase();
            const filename = `meetup_${timestamp}.${extension}`;
            const filePath = `meetups/${filename}`;
            console.log('Starting upload process with simplified path:', {
                filePath,
                contentType: selectedFile.type,
                fileSize: selectedFile.size,
                isAnonymous,
            });
            let uploadUrlResult;
            let retryCount = 0;
            while (retryCount < 3) {
                try {
                    uploadUrlResult = await getUploadPresignedUrl(filePath, selectedFile.type, 300, isAnonymous);
                    if (uploadUrlResult.success && uploadUrlResult.uploadUrl) {
                        break;
                    }
                }
                catch (error) {
                    const handledError = await handleError(error, 'generate upload URL');
                    if (!handledError)
                        break;
                    retryCount++;
                }
            }
            if (!uploadUrlResult?.success || !uploadUrlResult.uploadUrl) {
                throw new Error('Failed to generate upload URL after multiple attempts');
            }
            console.log('Got presigned URL, starting upload');
            setUploadProgress(30);
            let uploadSuccess = false;
            retryCount = 0;
            while (!uploadSuccess && retryCount < 3) {
                try {
                    const uploadResponse = await fetch(uploadUrlResult.uploadUrl, {
                        method: 'PUT',
                        body: selectedFile,
                        headers: {
                            'Content-Type': selectedFile.type,
                        },
                    });
                    if (uploadResponse.ok) {
                        uploadSuccess = true;
                    }
                    else {
                        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
                    }
                }
                catch (error) {
                    const handledError = await handleError(error, 'upload file');
                    if (!handledError)
                        break;
                    retryCount++;
                }
            }
            if (!uploadSuccess) {
                throw new Error('Failed to upload file after multiple attempts');
            }
            console.log('Upload successful, generating view URL');
            setUploadProgress(70);
            let signedUrl;
            retryCount = 0;
            while (!signedUrl && retryCount < 3) {
                try {
                    signedUrl = await getSignedViewUrl(uploadUrlResult.path, 86400, isAnonymous);
                }
                catch (error) {
                    const handledError = await handleError(error, 'generate view URL');
                    if (!handledError)
                        break;
                    retryCount++;
                }
            }
            if (!signedUrl) {
                throw new Error('Failed to generate view URL after multiple attempts');
            }
            console.log('Generated view URL successfully');
            setUploadProgress(90);
            setUploadedImageUrl(uploadUrlResult.path);
            setSignedViewUrl(signedUrl);
            setUploadStatus('success');
            setUploadProgress(100);
            if (onImageUploaded) {
                onImageUploaded(uploadUrlResult.path, signedUrl);
            }
        }
        catch (error) {
            await handleError(error, 'complete upload process');
        }
        finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };
    const handleCancel = () => {
        setSelectedFile(null);
        setPreview(null);
        setUploadStatus(null);
        setUploadProgress(0);
        setError(null);
        setUploadedImageUrl(null);
        setSignedViewUrl(null);
    };
    const handleImageError = async (e) => {
        try {
            if (!uploadedImageUrl)
                return;
            console.error('Failed to load signed URL image');
            try {
                console.log('Regenerating signed URL for', uploadedImageUrl);
                const newSignedUrl = await getSignedViewUrl(uploadedImageUrl, 86400, isAnonymous);
                if (newSignedUrl) {
                    console.log('Regenerated signed URL:', newSignedUrl);
                    e.target.src = newSignedUrl;
                    setSignedViewUrl(newSignedUrl);
                    return;
                }
            }
            catch (err) {
                console.error('Error regenerating signed URL:', err);
            }
            console.log('Falling back to placeholder image');
            e.target.src = '/images/placeholder.png';
            e.target.style.opacity = '0.7';
            setFallbackImageUrl('/images/placeholder.png');
        }
        catch (error) {
            const result = await handleError(error, ErrorTypes.STORAGE);
            e.target.src = '/images/placeholder.png';
            e.target.style.opacity = '0.7';
            setFallbackImageUrl('/images/placeholder.png');
        }
    };
    const handleImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        try {
            if (file.size > 5 * 1024 * 1024) {
                const error = new Error('Image size must be less than 5MB');
                error.type = ErrorTypes.VALIDATION;
                throw error;
            }
            if (!file.type.startsWith('image/')) {
                const error = new Error('File must be an image');
                error.type = ErrorTypes.VALIDATION;
                throw error;
            }
            setUploading(true);
            setError(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
            const timestamp = Date.now();
            const extension = file.name.split('.').pop()?.toLowerCase() || 'file';
            const path = `meetups/meetup_${timestamp}.${extension}`;
            const uploadUrlResult = await getUploadPresignedUrl(path, file.type, 7200, isAnonymous);
            if (!uploadUrlResult.success || !uploadUrlResult.uploadUrl) {
                throw new Error(uploadUrlResult.error?.toString() || 'Failed to generate upload URL');
            }
            const uploadResponse = await fetch(uploadUrlResult.uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
            });
            if (!uploadResponse.ok) {
                throw new Error(`Upload failed: ${uploadResponse.statusText}`);
            }
            const signedUrl = await getSignedViewUrl(uploadUrlResult.path || '', 86400, isAnonymous);
            if (!signedUrl) {
                throw new Error('Failed to generate view URL');
            }
            setUploadedImageUrl(uploadUrlResult.path || '');
            setSignedViewUrl(signedUrl);
            onImageUploaded(uploadUrlResult.path || '', signedUrl);
        }
        catch (error) {
            console.error('Error in handleImageChange:', error);
            const result = await handleError(error, error.type || ErrorTypes.UPLOAD);
            if (result) {
                setError(result.message);
                setPreview(null);
                setUploadedImageUrl(null);
                setSignedViewUrl(null);
            }
        }
        finally {
            setUploading(false);
        }
    };
    return (_jsxs("div", { className: `meetup-image-uploader ${className}`, children: [preview && !signedViewUrl && (_jsxs("div", { className: "preview-container relative mb-3", children: [_jsx("img", { src: preview, alt: "Preview", className: "w-full h-32 object-cover rounded-md" }), _jsx("button", { onClick: handleCancel, className: "absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full", title: "Remove image", children: _jsx(FaTimes, {}) })] })), signedViewUrl && (_jsxs("div", { className: "preview-container relative mb-3", children: [_jsx("img", { src: signedViewUrl, alt: "Uploaded", className: "w-full h-32 object-cover rounded-md", onError: handleImageError }), _jsx("button", { onClick: handleCancel, className: "absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full", title: "Remove image", children: _jsx(FaTimes, {}) }), _jsx("button", { onClick: async () => {
                            try {
                                console.log('Testing direct signed URL generation for:', uploadedImageUrl);
                                const newSignedUrl = await getSignedViewUrl(uploadedImageUrl, 3600, true);
                                console.log('Generated direct signed URL:', newSignedUrl);
                                if (newSignedUrl) {
                                    const testImg = new Image();
                                    testImg.onload = () => console.log('Test image loaded successfully');
                                    testImg.onerror = e => console.error('Test image failed to load:', e);
                                    testImg.src = newSignedUrl;
                                    window.open(newSignedUrl, '_blank');
                                }
                            }
                            catch (err) {
                                console.error('Error in direct signed URL test:', err);
                            }
                        }, className: "absolute top-1 left-1 p-1 bg-gray-200 text-gray-700 rounded text-xs z-10", title: "Test signed URL generation", children: "Test URL" })] })), !preview && !signedViewUrl && (_jsx("div", { className: "file-input-container", children: _jsxs("label", { className: "flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 cursor-pointer bg-gray-50 transition-colors", children: [_jsx(FaImage, { className: "text-gray-500" }), _jsx("span", { className: "text-gray-700", children: "Select Image" }), _jsx("input", { type: "file", accept: "image/*", onChange: handleFileChange, className: "hidden" })] }) })), selectedFile && !uploadStatus && (_jsx("button", { onClick: handleUpload, disabled: uploading, className: "mt-2 flex items-center justify-center gap-2 w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors", children: uploading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "spinner mr-2" }), _jsxs("span", { children: [Math.round(uploadProgress), "%"] })] })) : (_jsxs(_Fragment, { children: [_jsx(FaUpload, {}), _jsx("span", { children: "Upload Image" })] })) })), uploadStatus === 'success' && (_jsxs("div", { className: "mt-2 flex items-center text-green-600", children: [_jsx(FaCheck, { className: "mr-2" }), _jsx("span", { children: "Upload successful!" })] })), error && _jsx("div", { className: "mt-2 text-red-500 text-sm", children: error }), uploading && (_jsx("div", { className: "mt-2 w-full bg-gray-200 rounded-full h-2.5", children: _jsx("div", { className: "bg-blue-600 h-2.5 rounded-full transition-all duration-300", style: { width: `${uploadProgress}%` } }) })), uploadedImageUrl && (_jsxs("div", { className: "mt-4", children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: "Preview" }), _jsx("div", { className: "relative w-full h-48 rounded-lg overflow-hidden border border-gray-200", children: fallbackImageUrl ? (_jsx("img", { src: fallbackImageUrl, alt: "Meetup placeholder", className: "w-full h-full object-cover" })) : (_jsx("img", { src: signedViewUrl || uploadedImageUrl, alt: "Meetup preview", className: "w-full h-full object-cover", onError: handleImageError })) })] }))] }));
};
MeetupImageUploader.propTypes = {
    onImageUploaded: PropTypes.func.isRequired,
    meetupId: PropTypes.string,
    className: PropTypes.string,
    isAnonymous: PropTypes.bool,
};
export default MeetupImageUploader;
const style = document.createElement('style');
style.textContent = `
  .spinner {
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top: 2px solid white;
    width: 16px;
    height: 16px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
//# sourceMappingURL=MeetupImageUploader.js.map