import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { cn } from '@/lib/utils';
const CreateMeetupForm = ({ location, onSubmit, className }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [image, setImage] = useState(null);
  const handleSubmit = e => {
    e.preventDefault();
    const meetupData = {
      lat: location.lat,
      lng: location.lng,
      title,
      description,
      address: location.address || '',
      duration,
      image: image || '',
      status: 'active',
    };
    onSubmit(meetupData);
  };
  const handleImageChange = e => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
    }
  };
  return _jsxs('form', {
    onSubmit: handleSubmit,
    className: cn('space-y-4', className),
    children: [
      _jsxs('div', {
        children: [
          _jsx('label', {
            htmlFor: 'title',
            className: 'block text-sm font-medium text-gray-700',
            children: 'Title',
          }),
          _jsx('input', {
            type: 'text',
            id: 'title',
            value: title,
            onChange: e => setTitle(e.target.value),
            className:
              'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm',
            required: true,
          }),
        ],
      }),
      _jsxs('div', {
        children: [
          _jsx('label', {
            htmlFor: 'description',
            className: 'block text-sm font-medium text-gray-700',
            children: 'Description',
          }),
          _jsx('textarea', {
            id: 'description',
            value: description,
            onChange: e => setDescription(e.target.value),
            rows: 3,
            className:
              'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm',
            required: true,
          }),
        ],
      }),
      _jsxs('div', {
        children: [
          _jsx('label', {
            htmlFor: 'duration',
            className: 'block text-sm font-medium text-gray-700',
            children: 'Duration (minutes)',
          }),
          _jsxs('select', {
            id: 'duration',
            value: duration,
            onChange: e => setDuration(Number(e.target.value)),
            className:
              'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm',
            children: [
              _jsx('option', { value: 30, children: '30 minutes' }),
              _jsx('option', { value: 60, children: '1 hour' }),
              _jsx('option', { value: 120, children: '2 hours' }),
              _jsx('option', { value: 180, children: '3 hours' }),
            ],
          }),
        ],
      }),
      _jsxs('div', {
        children: [
          _jsx('label', {
            htmlFor: 'image',
            className: 'block text-sm font-medium text-gray-700',
            children: 'Image (optional)',
          }),
          _jsx('input', {
            type: 'file',
            id: 'image',
            accept: 'image/*',
            onChange: handleImageChange,
            className:
              'mt-1 block w-full text-sm text-gray-500\n            file:mr-4 file:py-2 file:px-4\n            file:rounded-md file:border-0\n            file:text-sm file:font-semibold\n            file:bg-blue-50 file:text-blue-700\n            hover:file:bg-blue-100',
          }),
        ],
      }),
      _jsx('button', {
        type: 'submit',
        className:
          'w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors',
        children: 'Create Meetup',
      }),
    ],
  });
};
export default CreateMeetupForm;
//# sourceMappingURL=CreateMeetupForm.js.map
