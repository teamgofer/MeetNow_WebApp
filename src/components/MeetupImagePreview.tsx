import React, { useState } from 'react';
import { FaImage, FaTimes } from 'react-icons/fa';

interface MeetupImagePreviewProps {
  onImageSelected: (file: File | null) => void;
  className?: string;
}

/**
 * Component for selecting and previewing images without immediate upload
 * The actual upload will occur only when the meetup is created
 */
const MeetupImagePreview: React.FC<MeetupImagePreviewProps> = ({
  onImageSelected,
  className = '',
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states
    setError(null);

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }

    // Max 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image is too large. Maximum size is 5MB.');
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // Pass the file to parent component for later upload
    onImageSelected(file);
  };

  // Handle cancellation
  const handleCancel = () => {
    // Clean up the object URL to prevent memory leaks
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview(null);
    setError(null);

    // Notify parent that image was removed
    onImageSelected(null);
  };

  return (
    <div className={`meetup-image-preview ${className}`}>
      {/* Image Preview */}
      {preview && (
        <div className="preview-container relative mb-3">
          <img src={preview} alt="Preview" className="w-full h-32 object-cover rounded-md" />
          <button
            onClick={handleCancel}
            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
            title="Remove image"
            type="button"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {!preview && (
        <div className="file-input-container">
          <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 cursor-pointer bg-gray-50 transition-colors">
            <FaImage className="text-gray-500" />
            <span className="text-gray-700">Select Image</span>
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      )}

      {/* Error Message */}
      {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}
    </div>
  );
};

export default MeetupImagePreview;
