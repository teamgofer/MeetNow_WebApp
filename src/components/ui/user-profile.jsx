import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent } from '@/components/ui';

const UserProfile = ({ onProfileUpdate }) => {
  const [bio, setBio] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        onProfileUpdate({ bio, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBioChange = (event) => {
    setBio(event.target.value);
    onProfileUpdate({ bio: event.target.value, image: imagePreview });
  };

  return (
    <Card className="mb-4">
      <CardContent>
        <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
        <div className="space-y-4">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mb-2">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg
                    className="w-12 h-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
            </div>
            <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
              Upload Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Introduce Yourself
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Tell others about yourself..."
              value={bio}
              onChange={handleBioChange}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

UserProfile.propTypes = {
  onProfileUpdate: PropTypes.func.isRequired
};

export default UserProfile;