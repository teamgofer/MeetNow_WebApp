import messageHistoryService from '../../services/messageHistoryService';
import { api } from '../../../../services/api';
import { URLS } from '../../constants';

// Mock the API
jest.mock('../../../../services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn()
  }
}));

describe('messageHistoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadMessageHistory', () => {
    const mockResponse = {
      data: {
        messages: [
          { id: 'msg1', content: 'Hello', timestamp: '2023-06-12T12:00:00Z' },
          { id: 'msg2', content: 'Hi there', timestamp: '2023-06-12T12:05:00Z' }
        ]
      }
    };

    it('should fetch messages with correct parameters', async () => {
      api.get.mockResolvedValue(mockResponse);
      
      await messageHistoryService.loadMessageHistory('region-123', {
        limit: 30,
        before: 1686571200000, // 2023-06-12T12:00:00Z in milliseconds
        after: 1686570000000 // 5 minutes earlier
      });
      
      expect(api.get).toHaveBeenCalledWith(URLS.MESSAGE_HISTORY, {
        params: {
          regionId: 'region-123',
          limit: 30,
          before: 1686571200000,
          after: 1686570000000
        }
      });
    });

    it('should return messages from the response', async () => {
      api.get.mockResolvedValue(mockResponse);
      
      const result = await messageHistoryService.loadMessageHistory('region-123');
      
      expect(result).toEqual(mockResponse.data.messages);
      expect(result).toHaveLength(2);
    });

    it('should use default limit when not provided', async () => {
      api.get.mockResolvedValue(mockResponse);
      
      await messageHistoryService.loadMessageHistory('region-123');
      
      expect(api.get).toHaveBeenCalledWith(
        URLS.MESSAGE_HISTORY, 
        expect.objectContaining({
          params: expect.objectContaining({
            limit: 50 // Default limit
          })
        })
      );
    });

    it('should handle empty response', async () => {
      api.get.mockResolvedValue({ data: {} });
      
      const result = await messageHistoryService.loadMessageHistory('region-123');
      
      expect(result).toEqual([]);
    });

    it('should throw an error when API request fails', async () => {
      const error = new Error('API error');
      api.get.mockRejectedValue(error);
      
      await expect(messageHistoryService.loadMessageHistory('region-123'))
        .rejects.toThrow(error);
    });
  });

  describe('loadOlderMessages', () => {
    it('should call loadMessageHistory with correct parameters', async () => {
      const spy = jest.spyOn(messageHistoryService, 'loadMessageHistory').mockResolvedValue([]);
      const timestamp = 1686571200000;
      
      await messageHistoryService.loadOlderMessages('region-123', timestamp, 15);
      
      expect(spy).toHaveBeenCalledWith('region-123', {
        limit: 15,
        before: timestamp
      });
    });

    it('should use default limit when not provided', async () => {
      const spy = jest.spyOn(messageHistoryService, 'loadMessageHistory').mockResolvedValue([]);
      const timestamp = 1686571200000;
      
      await messageHistoryService.loadOlderMessages('region-123', timestamp);
      
      expect(spy).toHaveBeenCalledWith('region-123', {
        limit: 20, // Default limit for older messages
        before: timestamp
      });
    });

    it('should propagate errors from loadMessageHistory', async () => {
      const error = new Error('API error');
      jest.spyOn(messageHistoryService, 'loadMessageHistory').mockRejectedValue(error);
      
      await expect(messageHistoryService.loadOlderMessages('region-123', 1686571200000))
        .rejects.toThrow(error);
    });
  });

  describe('loadMessagesBeforeArrival', () => {
    it('should call loadMessageHistory with correct parameters', async () => {
      const spy = jest.spyOn(messageHistoryService, 'loadMessageHistory').mockResolvedValue([]);
      const enteredAt = 1686571200000;
      
      await messageHistoryService.loadMessagesBeforeArrival('region-123', enteredAt, 25);
      
      expect(spy).toHaveBeenCalledWith('region-123', {
        limit: 25,
        before: enteredAt
      });
    });

    it('should use default limit when not provided', async () => {
      const spy = jest.spyOn(messageHistoryService, 'loadMessageHistory').mockResolvedValue([]);
      const enteredAt = 1686571200000;
      
      await messageHistoryService.loadMessagesBeforeArrival('region-123', enteredAt);
      
      expect(spy).toHaveBeenCalledWith('region-123', {
        limit: 50, // Default limit for messages before arrival
        before: enteredAt
      });
    });

    it('should propagate errors from loadMessageHistory', async () => {
      const error = new Error('API error');
      jest.spyOn(messageHistoryService, 'loadMessageHistory').mockRejectedValue(error);
      
      await expect(messageHistoryService.loadMessagesBeforeArrival('region-123', 1686571200000))
        .rejects.toThrow(error);
    });
  });

  describe('markMessagesAsRead', () => {
    it('should call API with correct parameters', async () => {
      const mockResponse = { data: { success: true } };
      api.post.mockResolvedValue(mockResponse);
      
      await messageHistoryService.markMessagesAsRead('region-123');
      
      expect(api.post).toHaveBeenCalledWith(URLS.MARK_MESSAGES_READ, { regionId: 'region-123' });
    });

    it('should return data from response', async () => {
      const mockResponse = { data: { success: true } };
      api.post.mockResolvedValue(mockResponse);
      
      const result = await messageHistoryService.markMessagesAsRead('region-123');
      
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw an error when API request fails', async () => {
      const error = new Error('API error');
      api.post.mockRejectedValue(error);
      
      await expect(messageHistoryService.markMessagesAsRead('region-123'))
        .rejects.toThrow(error);
    });
  });

  describe('deleteMessage', () => {
    it('should call API with correct parameters', async () => {
      const mockResponse = { data: { success: true } };
      api.delete.mockResolvedValue(mockResponse);
      
      await messageHistoryService.deleteMessage('msg-123');
      
      expect(api.delete).toHaveBeenCalledWith(`${URLS.MESSAGES}/msg-123`);
    });

    it('should return data from response', async () => {
      const mockResponse = { data: { success: true } };
      api.delete.mockResolvedValue(mockResponse);
      
      const result = await messageHistoryService.deleteMessage('msg-123');
      
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw an error when API request fails', async () => {
      const error = new Error('API error');
      api.delete.mockRejectedValue(error);
      
      await expect(messageHistoryService.deleteMessage('msg-123'))
        .rejects.toThrow(error);
    });
  });
}); 