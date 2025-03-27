import { useState, useCallback, useEffect, useRef } from 'react';
import logger from '../utils/Logger';

const useMeetupChat = (meetupId) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!meetupId) {
      setError('Meetup ID is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/meetups/${meetupId}/messages`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data);
      logger.info('Chat messages fetched successfully', { 
        meetupId,
        messageCount: data.length 
      });
      return data;
    } catch (err) {
      setError(err.message);
      logger.error('Failed to fetch chat messages', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [meetupId]);

  const sendMessage = useCallback(async (content) => {
    if (!meetupId) {
      setError('Meetup ID is required');
      return;
    }

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/meetups/${meetupId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const newMessage = await response.json();
      setMessages(prev => [...prev, newMessage]);
      logger.info('Message sent successfully', newMessage);
      return newMessage;
    } catch (err) {
      logger.error('Failed to send message', err);
      throw err;
    }
  }, [meetupId]);

  const deleteMessage = useCallback(async (messageId) => {
    if (!meetupId) {
      setError('Meetup ID is required');
      return;
    }

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/meetups/${meetupId}/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      setMessages(prev => 
        prev.filter(m => m.id !== messageId)
      );
      logger.info('Message deleted successfully', { messageId });
    } catch (err) {
      logger.error('Failed to delete message', err);
      throw err;
    }
  }, [meetupId]);

  const connectToChat = useCallback(() => {
    if (!meetupId) {
      setError('Meetup ID is required');
      return;
    }

    try {
      // TODO: Replace with actual WebSocket connection
      const ws = new WebSocket(`ws://api.example.com/meetups/${meetupId}/chat`);

      ws.onopen = () => {
        setIsConnected(true);
        logger.info('Chat connection established');
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        setMessages(prev => [...prev, message]);
        logger.debug('New message received', message);
      };

      ws.onclose = () => {
        setIsConnected(false);
        logger.warn('Chat connection closed');
      };

      ws.onerror = (error) => {
        setError('WebSocket connection error');
        logger.error('Chat connection error', error);
      };

      return ws;
    } catch (err) {
      logger.error('Failed to connect to chat', err);
      throw err;
    }
  }, [meetupId]);

  const disconnectFromChat = useCallback((ws) => {
    if (ws) {
      ws.close();
      setIsConnected(false);
      logger.info('Chat connection closed');
    }
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch messages and connect to chat on mount
  useEffect(() => {
    if (meetupId) {
      fetchMessages();
      const ws = connectToChat();
      return () => disconnectFromChat(ws);
    }
  }, [meetupId, fetchMessages, connectToChat, disconnectFromChat]);

  return {
    messages,
    isLoading,
    error,
    isConnected,
    messagesEndRef,
    sendMessage,
    deleteMessage,
    connectToChat,
    disconnectFromChat
  };
};

export default useMeetupChat; 
 
 
 
 
 