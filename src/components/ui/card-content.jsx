import React from 'react';
import PropTypes from 'prop-types';

const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

CardContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export default CardContent;