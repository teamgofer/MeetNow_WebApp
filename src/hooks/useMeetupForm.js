import { useState, useCallback } from 'react';
import logger from '../utils/Logger';

const useMeetupForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: null,
    startTime: '',
    endTime: '',
    maxParticipants: 10,
    category: '',
    tags: []
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.location) {
      newErrors.location = 'Location is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      if (end <= start) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    if (formData.maxParticipants < 2) {
      newErrors.maxParticipants = 'Maximum participants must be at least 2';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    logger.debug('Form input changed', { name, value });
  }, [errors]);

  const handleLocationSelect = useCallback((location) => {
    setFormData(prev => ({
      ...prev,
      location
    }));
    logger.debug('Location selected', location);
  }, []);

  const handleTagAdd = useCallback((tag) => {
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tag]
    }));
    logger.debug('Tag added', { tag });
  }, []);

  const handleTagRemove = useCallback((tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
    logger.debug('Tag removed', { tag: tagToRemove });
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      location: null,
      startTime: '',
      endTime: '',
      maxParticipants: 10,
      category: '',
      tags: []
    });
    setErrors({});
    setIsSubmitting(false);
    logger.debug('Form reset');
  }, []);

  const handleSubmit = useCallback(async (onSubmit) => {
    if (!validateForm()) {
      logger.warn('Form validation failed', errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      logger.info('Form submitted successfully', formData);
      resetForm();
    } catch (error) {
      logger.error('Form submission failed', error);
      setErrors(prev => ({
        ...prev,
        submit: error.message
      }));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, errors, resetForm]);

  return {
    formData,
    errors,
    isSubmitting,
    handleInputChange,
    handleLocationSelect,
    handleTagAdd,
    handleTagRemove,
    resetForm,
    handleSubmit
  };
};

export default useMeetupForm; 
 
 
 
 
 