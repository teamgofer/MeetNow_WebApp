import React from 'react';
import PropTypes from 'prop-types';

const Input = ({ className = '', type = 'text', ...props }) => {
  return (
    <input
      type={type}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
      {...props}
    />
  );
};

Input.propTypes = {
  className: PropTypes.string,
  type: PropTypes.string
};

export default Input;