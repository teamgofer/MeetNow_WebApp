import { useState, useCallback, useEffect } from 'react';
import { errorHandlingService } from '../utils/ErrorHandlingService';
import { ErrorTypes, ErrorSeverity } from '../utils/error-handler';
const useMeetupForm = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: null,
        date: new Date().toISOString().split('T')[0] || '',
        time: '18:00',
        duration: '60',
        maxParticipants: '10',
        isPublic: true
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    useEffect(() => {
        if (isDirty) {
            const saveData = async () => {
                try {
                    localStorage.setItem('meetupFormDraft', JSON.stringify(formData));
                }
                catch (error) {
                    errorHandlingService.handleError({
                        type: ErrorTypes.STORAGE,
                        message: error instanceof Error ? error.message : 'Storage error',
                        severity: ErrorSeverity.ERROR,
                        context: {
                            isStorageError: true,
                            isRequired: false
                        }
                    });
                }
            };
            saveData();
        }
    }, [formData, isDirty]);
    useEffect(() => {
        const loadSavedData = async () => {
            try {
                const savedData = localStorage.getItem('meetupFormDraft');
                if (savedData) {
                    const parsedData = JSON.parse(savedData);
                    setFormData(parsedData);
                    setIsDirty(true);
                }
            }
            catch (error) {
                errorHandlingService.handleError({
                    type: ErrorTypes.STORAGE,
                    message: error instanceof Error ? error.message : 'Storage error',
                    severity: ErrorSeverity.ERROR,
                    context: {
                        isStorageError: true,
                        isRequired: false
                    }
                });
            }
        };
        loadSavedData();
    }, []);
    const validateField = useCallback((name, value) => {
        switch (name) {
            case 'title':
                if (!value?.trim()) {
                    return 'Title is required';
                }
                if (value.length > 100) {
                    return 'Title must be less than 100 characters';
                }
                break;
            case 'description':
                if (value?.length > 1000) {
                    return 'Description must be less than 1000 characters';
                }
                break;
            case 'location':
                if (!value) {
                    return 'Location is required';
                }
                if (!value.lat || !value.lng) {
                    return 'Invalid location coordinates';
                }
                break;
            case 'date':
                if (!value) {
                    return 'Date is required';
                }
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (selectedDate < today) {
                    return 'Date cannot be in the past';
                }
                break;
            case 'time':
                if (!value) {
                    return 'Time is required';
                }
                const [hours, minutes] = value.split(':').map(Number);
                if (isNaN(hours) || isNaN(minutes)) {
                    return 'Invalid time format';
                }
                break;
            case 'duration':
                const durationNum = parseInt(value);
                if (isNaN(durationNum) || durationNum < 15 || durationNum > 480) {
                    return 'Duration must be between 15 and 480 minutes';
                }
                break;
            case 'maxParticipants':
                const participantsNum = parseInt(value);
                if (isNaN(participantsNum) || participantsNum < 2 || participantsNum > 100) {
                    return 'Maximum participants must be between 2 and 100';
                }
                break;
        }
        return '';
    }, []);
    const validateForm = useCallback(() => {
        const newErrors = {};
        let isValid = true;
        Object.keys(formData).forEach((fieldName) => {
            const error = validateField(fieldName, formData[fieldName]);
            if (error) {
                newErrors[fieldName] = error;
                isValid = false;
            }
        });
        setErrors(newErrors);
        return isValid;
    }, [formData, validateField]);
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        if (!name || !(name in formData))
            return;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setIsDirty(true);
        const error = validateField(name, value);
        if (error) {
            setErrors(prev => ({
                ...prev,
                [name]: error
            }));
        }
        else {
            setErrors(prev => {
                const { [name]: _, ...rest } = prev;
                return rest;
            });
        }
    }, [validateField, formData]);
    const handleLocationSelect = useCallback((location) => {
        setFormData(prev => ({
            ...prev,
            location
        }));
        setIsDirty(true);
        const error = validateField('location', location);
        if (error) {
            setErrors(prev => ({
                ...prev,
                location: error
            }));
        }
        else {
            setErrors(prev => {
                const { location: _, ...rest } = prev;
                return rest;
            });
        }
    }, [validateField]);
    const clearForm = useCallback(() => {
        setFormData({
            title: '',
            description: '',
            location: null,
            date: new Date().toISOString().split('T')[0] || '',
            time: '18:00',
            duration: '60',
            maxParticipants: '10',
            isPublic: true
        });
        setErrors({});
        setIsDirty(false);
        localStorage.removeItem('meetupFormDraft');
    }, []);
    const getFormData = useCallback(() => {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(formData.time)) {
            throw new Error('Invalid time format. Expected HH:mm (24-hour)');
        }
        const [hoursStr, minutesStr] = formData.time.split(':');
        const hours = Number(hoursStr);
        const minutes = Number(minutesStr);
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(formData.date)) {
            throw new Error('Invalid date format. Expected YYYY-MM-DD');
        }
        const meetupDateTime = new Date(formData.date);
        if (isNaN(meetupDateTime.getTime())) {
            throw new Error('Invalid date');
        }
        meetupDateTime.setHours(hours, minutes, 0, 0);
        if (!formData.location) {
            throw new Error('Location is required');
        }
        const duration = parseInt(formData.duration);
        const maxParticipants = parseInt(formData.maxParticipants);
        if (isNaN(duration) || isNaN(maxParticipants)) {
            throw new Error('Invalid duration or max participants');
        }
        return {
            title: formData.title.trim(),
            description: formData.description.trim(),
            lat: formData.location.lat,
            lng: formData.location.lng,
            address: formData.location.display_name ?? '',
            duration,
            max_participants: maxParticipants,
            start_time: meetupDateTime.toISOString(),
            isPublic: formData.isPublic ?? true
        };
    }, [formData]);
    return {
        formData,
        errors,
        isSubmitting,
        isDirty,
        handleInputChange,
        handleLocationSelect,
        validateForm,
        clearForm,
        getFormData,
        setIsSubmitting
    };
};
export default useMeetupForm;
const useMeetupForm = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: null,
        date: new Date().toISOString().split('T')[0] || '',
        time: '18:00',
        duration: '60',
        maxParticipants: '10',
        isPublic: true
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    useEffect(() => {
        if (isDirty) {
            const saveData = async () => {
                try {
                    localStorage.setItem('meetupFormDraft', JSON.stringify(formData));
                }
                catch (error) {
                    errorHandlingService.handleError({
                        type: ErrorTypes.STORAGE,
                        message: error instanceof Error ? error.message : 'Storage error',
                        severity: ErrorSeverity.ERROR,
                        context: {
                            isStorageError: true,
                            isRequired: false
                        }
                    });
                }
            };
            saveData();
        }
    }, [formData, isDirty]);
    useEffect(() => {
        const loadSavedData = async () => {
            try {
                const savedData = localStorage.getItem('meetupFormDraft');
                if (savedData) {
                    const parsedData = JSON.parse(savedData);
                    setFormData(parsedData);
                    setIsDirty(true);
                }
            }
            catch (error) {
                errorHandlingService.handleError({
                    type: ErrorTypes.STORAGE,
                    message: error instanceof Error ? error.message : 'Storage error',
                    severity: ErrorSeverity.ERROR,
                    context: {
                        isStorageError: true,
                        isRequired: false
                    }
                });
            }
        };
        loadSavedData();
    }, []);
    const validateField = useCallback((name, value) => {
        switch (name) {
            case 'title':
                if (!value?.trim()) {
                    return 'Title is required';
                }
                if (value.length > 100) {
                    return 'Title must be less than 100 characters';
                }
                break;
            case 'description':
                if (value?.length > 1000) {
                    return 'Description must be less than 1000 characters';
                }
                break;
            case 'location':
                if (!value) {
                    return 'Location is required';
                }
                if (!value.lat || !value.lng) {
                    return 'Invalid location coordinates';
                }
                break;
            case 'date':
                if (!value) {
                    return 'Date is required';
                }
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (selectedDate < today) {
                    return 'Date cannot be in the past';
                }
                break;
            case 'time':
                if (!value) {
                    return 'Time is required';
                }
                const [hours, minutes] = value.split(':').map(Number);
                if (isNaN(hours) || isNaN(minutes)) {
                    return 'Invalid time format';
                }
                break;
            case 'duration':
                const durationNum = parseInt(value);
                if (isNaN(durationNum) || durationNum < 15 || durationNum > 480) {
                    return 'Duration must be between 15 and 480 minutes';
                }
                break;
            case 'maxParticipants':
                const participantsNum = parseInt(value);
                if (isNaN(participantsNum) || participantsNum < 2 || participantsNum > 100) {
                    return 'Maximum participants must be between 2 and 100';
                }
                break;
        }
        return '';
    }, []);
    const validateForm = useCallback(() => {
        const newErrors = {};
        let isValid = true;
        Object.keys(formData).forEach((fieldName) => {
            const error = validateField(fieldName, formData[fieldName]);
            if (error) {
                newErrors[fieldName] = error;
                isValid = false;
            }
        });
        setErrors(newErrors);
        return isValid;
    }, [formData, validateField]);
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        if (!name || !(name in formData))
            return;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setIsDirty(true);
        const error = validateField(name, value);
        if (error) {
            setErrors(prev => ({
                ...prev,
                [name]: error
            }));
        }
        else {
            setErrors(prev => {
                const { [name]: _, ...rest } = prev;
                return rest;
            });
        }
    }, [validateField, formData]);
    const handleLocationSelect = useCallback((location) => {
        setFormData(prev => ({
            ...prev,
            location
        }));
        setIsDirty(true);
        const error = validateField('location', location);
        if (error) {
            setErrors(prev => ({
                ...prev,
                location: error
            }));
        }
        else {
            setErrors(prev => {
                const { location: _, ...rest } = prev;
                return rest;
            });
        }
    }, [validateField]);
    const clearForm = useCallback(() => {
        setFormData({
            title: '',
            description: '',
            location: null,
            date: new Date().toISOString().split('T')[0] || '',
            time: '18:00',
            duration: '60',
            maxParticipants: '10',
            isPublic: true
        });
        setErrors({});
        setIsDirty(false);
        localStorage.removeItem('meetupFormDraft');
    }, []);
    const getFormData = useCallback(() => {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(formData.time)) {
            throw new Error('Invalid time format. Expected HH:mm (24-hour)');
        }
        const [hoursStr, minutesStr] = formData.time.split(':');
        const hours = Number(hoursStr);
        const minutes = Number(minutesStr);
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(formData.date)) {
            throw new Error('Invalid date format. Expected YYYY-MM-DD');
        }
        const meetupDateTime = new Date(formData.date);
        if (isNaN(meetupDateTime.getTime())) {
            throw new Error('Invalid date');
        }
        meetupDateTime.setHours(hours, minutes, 0, 0);
        if (!formData.location) {
            throw new Error('Location is required');
        }
        const duration = parseInt(formData.duration);
        const maxParticipants = parseInt(formData.maxParticipants);
        if (isNaN(duration) || isNaN(maxParticipants)) {
            throw new Error('Invalid duration or max participants');
        }
        return {
            title: formData.title.trim(),
            description: formData.description.trim(),
            lat: formData.location.lat,
            lng: formData.location.lng,
            address: formData.location.display_name ?? '',
            duration,
            max_participants: maxParticipants,
            start_time: meetupDateTime.toISOString(),
            isPublic: formData.isPublic ?? true
        };
    }, [formData]);
    return {
        formData,
        errors,
        isSubmitting,
        isDirty,
        handleInputChange,
        handleLocationSelect,
        validateForm,
        clearForm,
        getFormData,
        setIsSubmitting
    };
};
export default useMeetupForm;
//# sourceMappingURL=useMeetupForm.js.map