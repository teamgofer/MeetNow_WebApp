import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { FaExclamationCircle } from 'react-icons/fa';

import { handleValidationError } from '../../utils/error-handler';

/**
 * Form validation component with error handling and display
 */
const FormValidation = ({
  children,
  onSubmit,
  validationSchema,
  className = '',
  showErrors = true,
}) => {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form values from children
  useEffect(() => {
    const initialValues = {};
    React.Children.forEach(children, child => {
      if (React.isValidElement(child) && child.props.name) {
        initialValues[child.props.name] = child.props.value || '';
      }
    });
    setValues(initialValues);
  }, [children]);

  // Handle input change
  const handleChange = (name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  // Handle input blur
  const handleBlur = name => {
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));

    // Validate field on blur
    validateField(name);
  };

  // Validate a single field
  const validateField = name => {
    if (!validationSchema) return;

    try {
      validationSchema.validateSyncAt(name, values);
      setErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        [name]: err.message,
      }));
    }
  };

  // Validate all fields
  const validateForm = () => {
    if (!validationSchema) return true;

    try {
      validationSchema.validateSync(values, { abortEarly: false });
      setErrors({});
      return true;
    } catch (err) {
      const validationErrors = {};
      err.inner.forEach(error => {
        validationErrors[error.path] = error.message;
      });
      setErrors(validationErrors);
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (validateForm()) {
        await onSubmit(values);
      } else {
        // Handle validation errors
        handleValidationError(errors);
      }
    } catch (error) {
      // Handle submission errors
      setErrors(prev => ({
        ...prev,
        submit: error.message,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clone children with validation props
  const renderChildren = () => {
    return React.Children.map(children, child => {
      if (!React.isValidElement(child)) return child;

      return React.cloneElement(child, {
        value: values[child.props.name] || '',
        onChange: e => handleChange(child.props.name, e.target.value),
        onBlur: () => handleBlur(child.props.name),
        error: touched[child.props.name] ? errors[child.props.name] : null,
        isSubmitting,
      });
    });
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {renderChildren()}

      {showErrors && errors.submit && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                {errors.submit}
              </h3>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

FormValidation.propTypes = {
  children: PropTypes.node.isRequired,
  onSubmit: PropTypes.func.isRequired,
  validationSchema: PropTypes.object,
  className: PropTypes.string,
  showErrors: PropTypes.bool,
};

/**
 * Form field component with validation display
 */
export const FormField = ({
  name,
  label,
  type = 'text',
  value = '',
  onChange,
  onBlur,
  error,
  isSubmitting,
  className = '',
  ...props
}) => {
  const inputClasses = `
    block w-full rounded-md shadow-sm
    ${
      error
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    }
    sm:text-sm
  `;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}

      <div className="mt-1">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={isSubmitting}
          className={inputClasses}
          {...props}
        />
      </div>

      {error && (
        <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
          <FaExclamationCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

FormField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  error: PropTypes.string,
  isSubmitting: PropTypes.bool,
  className: PropTypes.string,
};

export default FormValidation;
