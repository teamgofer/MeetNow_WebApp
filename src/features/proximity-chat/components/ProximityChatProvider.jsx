import React from 'react';
import PropTypes from 'prop-types';
import { ProximityChatProvider } from '../context/ProximityChatContext';
import { BlockedUsersProvider } from '../context/BlockedUsersContext';

/**
 * Provider component that wraps all context providers for the proximity chat feature
 * This makes it easier to integrate the feature into an application
 */
const ProximityChatProviderWrapper = ({ children }) => {
  return (
    <ProximityChatProvider>
      <BlockedUsersProvider>
        {children}
      </BlockedUsersProvider>
    </ProximityChatProvider>
  );
};

ProximityChatProviderWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProximityChatProviderWrapper; 