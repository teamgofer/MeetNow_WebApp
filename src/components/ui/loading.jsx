import React from 'react';
import PropTypes from 'prop-types';
import LoadingSpinner from './LoadingSpinner';

const Loading = ({ text = 'Loading...', className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <LoadingSpinner size="large" color="blue" />
      {text && (
        <p className="mt-2 text-gray-600 text-sm">{text}</p>
      )}
    </div>
  );
};

Loading.propTypes = {
  text: PropTypes.string,
  className: PropTypes.string
};

export default Loading;