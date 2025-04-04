import React from 'react';

import ProximityChat from '../features/proximity-chat/components/ProximityChat';
import { ProximityChatProvider } from '../features/proximity-chat/context/ProximityChatContext';
import { LocationService } from '../features/proximity-chat/services/locationService';
import { MessageService } from '../features/proximity-chat/services/MessageService';
import { WebSocketService } from '../features/proximity-chat/services/WebSocketService';

const ProximityChatPage = () => {
  // Create service instances
  const webSocketService = new WebSocketService();
  const locationService = new LocationService();
  const messageService = new MessageService();

  return (
    <div className="h-full max-w-4xl mx-auto p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proximity Chat</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Connect and chat with people nearby in real-time
        </p>
      </header>

      <div className="h-[calc(100vh-160px)]">
        <ProximityChatProvider
          webSocketService={webSocketService}
          locationService={locationService}
          messageService={messageService}
        >
          <ProximityChat />
        </ProximityChatProvider>
      </div>
    </div>
  );
};

export default ProximityChatPage;
