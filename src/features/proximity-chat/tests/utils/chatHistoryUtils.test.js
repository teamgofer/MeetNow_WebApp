import { 
  getMessagesInArea, 
  trackSeenMessages, 
  hasUserSeenMessage, 
  getUnseenMessagesInArea,
  paginateMessages,
  groupMessagesByTimePeriod,
  markMessagesBeforeArrival,
  sortMessagesByDate,
  groupMessagesByDate,
  formatMessageDate,
  getUnreadMessageCount
} from '../../utils/chatHistoryUtils';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('getMessagesInArea', () => {
  const testMessages = [
    {
      id: '1',
      content: 'Hello',
      timestamp: '2023-06-12T12:00:00Z',
      location: { latitude: 37.7749, longitude: -122.4194 }
    },
    {
      id: '2',
      content: 'Hi there',
      timestamp: '2023-06-12T12:05:00Z',
      location: { latitude: 37.7749, longitude: -122.4194 }
    },
    {
      id: '3',
      content: 'Too far away',
      timestamp: '2023-06-12T12:10:00Z',
      location: { latitude: 40.7128, longitude: -74.0060 } // New York
    },
    {
      id: '4',
      content: 'No location',
      timestamp: '2023-06-12T12:15:00Z',
    },
    {
      id: '5',
      content: 'Expired message',
      timestamp: '2023-06-12T12:20:00Z',
      location: { latitude: 37.7749, longitude: -122.4194 },
      isExpired: true
    }
  ];

  const sfLocation = { latitude: 37.7749, longitude: -122.4194 }; // San Francisco

  it('should return empty array for invalid inputs', () => {
    expect(getMessagesInArea(null, sfLocation, 1000)).toEqual([]);
    expect(getMessagesInArea([], null, 1000)).toEqual([]);
    expect(getMessagesInArea(undefined, undefined, undefined)).toEqual([]);
  });

  it('should filter messages by location within radius', () => {
    const result = getMessagesInArea(testMessages, sfLocation, 1000);
    // Should include messages 1 and 2, but not 3 (too far), 4 (no location), or 5 (expired)
    expect(result).toHaveLength(2);
    expect(result.map(m => m.id)).toEqual(['2', '1']); // Newest first by default
  });

  it('should include expired messages when specified', () => {
    const result = getMessagesInArea(testMessages, sfLocation, 1000, { includeExpired: true });
    // Should include messages 1, 2, and 5 (expired but included)
    expect(result).toHaveLength(3);
    expect(result.map(m => m.id)).toContain('5');
  });

  it('should exclude current user messages when specified', () => {
    const messagesWithSender = testMessages.map((msg, i) => ({
      ...msg,
      senderId: i < 2 ? 'user1' : 'user2'
    }));
    
    const result = getMessagesInArea(
      messagesWithSender, 
      sfLocation, 
      1000, 
      { excludeCurrentUser: true, currentUserId: 'user1' }
    );
    
    // Should only include messages not from user1
    expect(result.every(msg => msg.senderId !== 'user1')).toBe(true);
  });

  it('should sort messages oldest first when specified', () => {
    const result = getMessagesInArea(testMessages, sfLocation, 1000, { newestFirst: false });
    // Should be in chronological order
    expect(result.map(m => m.id)).toEqual(['1', '2']); 
  });

  it('should limit results to maxResults when specified', () => {
    const result = getMessagesInArea(testMessages, sfLocation, 1000, { maxResults: 1 });
    expect(result).toHaveLength(1);
  });

  it('should filter messages by time threshold when specified', () => {
    // Create a timestamp 30 minutes ago
    const now = new Date();
    const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);
    
    const recentMessages = [
      {
        id: 'old',
        content: 'Old message',
        timestamp: '2023-06-12T10:00:00Z', // Old
        location: { latitude: 37.7749, longitude: -122.4194 }
      },
      {
        id: 'recent',
        content: 'Recent message',
        timestamp: now.toISOString(), // Current
        location: { latitude: 37.7749, longitude: -122.4194 }
      }
    ];
    
    const result = getMessagesInArea(
      recentMessages, 
      sfLocation, 
      1000, 
      { timeThresholdMinutes: 15 }
    );
    
    // Should only include recent message
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('recent');
  });
});

describe('trackSeenMessages and hasUserSeenMessage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should return null for invalid inputs', () => {
    expect(trackSeenMessages(null, ['msg1'])).toBeNull();
    expect(trackSeenMessages('user1', null)).toBeNull();
    expect(trackSeenMessages('user1', [])).toBeNull();
  });

  it('should track seen messages in localStorage', () => {
    const result = trackSeenMessages('user1', ['msg1', 'msg2']);
    
    // Check result
    expect(result).toBeDefined();
    expect(result.messageIds).toBeDefined();
    expect(Object.keys(result.messageIds)).toContain('msg1');
    expect(Object.keys(result.messageIds)).toContain('msg2');
    
    // Check localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('should correctly determine if a message has been seen', () => {
    // Track some messages
    trackSeenMessages('user1', ['msg1', 'msg2']);
    
    // Check seen status
    expect(hasUserSeenMessage('user1', 'msg1')).toBe(true);
    expect(hasUserSeenMessage('user1', 'msg3')).toBe(false);
    expect(hasUserSeenMessage('user2', 'msg1')).toBe(false);
  });

  it('should handle multiple users separately', () => {
    trackSeenMessages('user1', ['msg1', 'msg2']);
    trackSeenMessages('user2', ['msg2', 'msg3']);
    
    expect(hasUserSeenMessage('user1', 'msg1')).toBe(true);
    expect(hasUserSeenMessage('user1', 'msg3')).toBe(false);
    expect(hasUserSeenMessage('user2', 'msg1')).toBe(false);
    expect(hasUserSeenMessage('user2', 'msg3')).toBe(true);
  });
});

describe('getUnseenMessagesInArea', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  const testMessages = [
    {
      id: 'msg1',
      content: 'Hello',
      timestamp: '2023-06-12T12:00:00Z',
      location: { latitude: 37.7749, longitude: -122.4194 }
    },
    {
      id: 'msg2',
      content: 'Hi there',
      timestamp: '2023-06-12T12:05:00Z',
      location: { latitude: 37.7749, longitude: -122.4194 }
    }
  ];

  const sfLocation = { latitude: 37.7749, longitude: -122.4194 };

  it('should return empty array for invalid inputs', () => {
    expect(getUnseenMessagesInArea(null, 'user1', sfLocation, 1000)).toEqual([]);
    expect(getUnseenMessagesInArea([], null, sfLocation, 1000)).toEqual([]);
    expect(getUnseenMessagesInArea([], 'user1', null, 1000)).toEqual([]);
  });

  it('should filter out seen messages', () => {
    // Mark one message as seen
    trackSeenMessages('user1', ['msg1']);
    
    // Get unseen messages
    const result = getUnseenMessagesInArea(testMessages, 'user1', sfLocation, 1000);
    
    // Should only include msg2
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('msg2');
  });
});

describe('paginateMessages', () => {
  const testMessages = Array.from({ length: 50 }, (_, i) => ({
    id: `msg${i + 1}`,
    content: `Message ${i + 1}`,
    timestamp: new Date(2023, 5, 12, 12, i).toISOString()
  }));

  it('should return empty result for invalid inputs', () => {
    const result = paginateMessages(null);
    expect(result.results).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
    expect(result.totalCount).toBe(0);
  });

  it('should paginate messages with default settings', () => {
    const result = paginateMessages(testMessages);
    
    // Default page size is 20
    expect(result.results).toHaveLength(20);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe(result.results[result.results.length - 1].id);
    expect(result.totalCount).toBe(50);
    
    // Should be sorted newest first by default
    expect(result.results[0].id).toBe('msg50');
  });

  it('should paginate with custom page size', () => {
    const result = paginateMessages(testMessages, 10);
    expect(result.results).toHaveLength(10);
  });

  it('should handle cursor-based pagination', () => {
    // Get first page
    const page1 = paginateMessages(testMessages, 10);
    expect(page1.results).toHaveLength(10);
    
    // Get second page using cursor
    const page2 = paginateMessages(testMessages, 10, page1.nextCursor);
    expect(page2.results).toHaveLength(10);
    expect(page2.results[0].id).not.toBe(page1.results[0].id);
    
    // Pages should not overlap
    const page1Ids = page1.results.map(m => m.id);
    const page2Ids = page2.results.map(m => m.id);
    const intersection = page1Ids.filter(id => page2Ids.includes(id));
    expect(intersection).toHaveLength(0);
  });

  it('should sort oldest first when specified', () => {
    const result = paginateMessages(testMessages, 10, null, false);
    expect(result.results[0].id).toBe('msg1');
  });

  it('should indicate when there are no more messages', () => {
    // Get last page by using large page size
    const result = paginateMessages(testMessages, 100);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });
});

describe('groupMessagesByTimePeriod', () => {
  // Create test messages with various timestamps
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 6);
  
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  const testMessages = [
    {
      id: 'today1',
      content: 'Today message 1',
      timestamp: now.toISOString()
    },
    {
      id: 'today2',
      content: 'Today message 2',
      timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0).toISOString()
    },
    {
      id: 'yesterday',
      content: 'Yesterday message',
      timestamp: yesterday.toISOString()
    },
    {
      id: 'lastWeek',
      content: 'Last week message',
      timestamp: lastWeek.toISOString()
    },
    {
      id: 'twoWeeksAgo',
      content: 'Two weeks ago message',
      timestamp: twoWeeksAgo.toISOString()
    }
  ];

  it('should return empty array for invalid inputs', () => {
    expect(groupMessagesByTimePeriod(null)).toEqual([]);
    expect(groupMessagesByTimePeriod([])).toEqual([]);
    expect(groupMessagesByTimePeriod(undefined)).toEqual([]);
  });

  it('should group messages by time periods', () => {
    const groups = groupMessagesByTimePeriod(testMessages);
    
    // Should create groups for different time periods
    expect(groups.length).toBeGreaterThan(1);
    
    // First group should be today
    expect(groups[0].type).toBe('today');
    expect(groups[0].label).toBe('Today');
    expect(groups[0].messages).toHaveLength(2);
    
    // Check if all messages are included in groups
    const totalMessages = groups.reduce((sum, group) => sum + group.messages.length, 0);
    expect(totalMessages).toBe(testMessages.length);
  });
});

describe('markMessagesBeforeArrival', () => {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  const testMessages = [
    {
      id: 'before',
      content: 'Before arrival',
      timestamp: tenMinutesAgo.toISOString()
    },
    {
      id: 'after',
      content: 'After arrival',
      timestamp: now.toISOString()
    }
  ];

  it('should return original messages for invalid inputs', () => {
    expect(markMessagesBeforeArrival(null, now)).toEqual(null);
    expect(markMessagesBeforeArrival([], null)).toEqual([]);
  });

  it('should mark messages before arrival time', () => {
    const result = markMessagesBeforeArrival(testMessages, fiveMinutesAgo);
    
    // Message from 10 minutes ago should be marked as before arrival
    expect(result.find(m => m.id === 'before').beforeArrival).toBe(true);
    
    // Recent message should not be marked
    expect(result.find(m => m.id === 'after').beforeArrival).toBe(false);
  });

  it('should handle Date or string timestamps', () => {
    // Test with Date object
    const result1 = markMessagesBeforeArrival(testMessages, fiveMinutesAgo);
    expect(result1.find(m => m.id === 'before').beforeArrival).toBe(true);
    
    // Test with ISO string
    const result2 = markMessagesBeforeArrival(testMessages, fiveMinutesAgo.toISOString());
    expect(result2.find(m => m.id === 'before').beforeArrival).toBe(true);
  });
});

describe('sortMessagesByDate', () => {
  it('should sort messages by timestamp in ascending order', () => {
    const messages = [
      { id: 'msg3', timestamp: '2023-06-12T14:00:00Z' },
      { id: 'msg1', timestamp: '2023-06-12T12:00:00Z' },
      { id: 'msg2', timestamp: '2023-06-12T13:00:00Z' },
    ];
    
    const sorted = sortMessagesByDate(messages);
    
    expect(sorted[0].id).toBe('msg1');
    expect(sorted[1].id).toBe('msg2');
    expect(sorted[2].id).toBe('msg3');
  });

  it('should handle messages with missing timestamps', () => {
    const messages = [
      { id: 'msg1', timestamp: '2023-06-12T12:00:00Z' },
      { id: 'msg2' }, // No timestamp
      { id: 'msg3', timestamp: '2023-06-12T14:00:00Z' },
    ];
    
    const sorted = sortMessagesByDate(messages);
    
    // Messages without timestamps should be at the beginning
    expect(sorted[0].id).toBe('msg2');
    expect(sorted[1].id).toBe('msg1');
    expect(sorted[2].id).toBe('msg3');
  });

  it('should handle empty array', () => {
    expect(sortMessagesByDate([])).toEqual([]);
  });

  it('should handle null or undefined input', () => {
    expect(sortMessagesByDate(null)).toEqual([]);
    expect(sortMessagesByDate(undefined)).toEqual([]);
  });
});

describe('groupMessagesByDate', () => {
  const messages = [
    { id: 'msg1', timestamp: '2023-06-12T12:00:00Z' },
    { id: 'msg2', timestamp: '2023-06-12T12:30:00Z' },
    { id: 'msg3', timestamp: '2023-06-13T14:00:00Z' },
    { id: 'msg4', timestamp: '2023-06-13T15:00:00Z' },
    { id: 'msg5', timestamp: '2023-06-14T10:00:00Z' },
  ];

  it('should group messages by date', () => {
    const grouped = groupMessagesByDate(messages);
    
    expect(Object.keys(grouped).length).toBe(3);
    expect(grouped['2023-06-12']).toHaveLength(2);
    expect(grouped['2023-06-13']).toHaveLength(2);
    expect(grouped['2023-06-14']).toHaveLength(1);
  });

  it('should handle messages with missing timestamps', () => {
    const messagesWithMissingDate = [
      { id: 'msg1', timestamp: '2023-06-12T12:00:00Z' },
      { id: 'msg2' }, // No timestamp
      { id: 'msg3', timestamp: '2023-06-13T14:00:00Z' },
    ];
    
    const grouped = groupMessagesByDate(messagesWithMissingDate);
    
    expect(Object.keys(grouped).length).toBe(3);
    expect(grouped['unknown']).toHaveLength(1);
    expect(grouped['unknown'][0].id).toBe('msg2');
  });

  it('should handle empty array', () => {
    expect(groupMessagesByDate([])).toEqual({});
  });

  it('should handle null or undefined input', () => {
    expect(groupMessagesByDate(null)).toEqual({});
    expect(groupMessagesByDate(undefined)).toEqual({});
  });
});

describe('formatMessageDate', () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  it('should format today as "Today"', () => {
    const todayStr = today.toISOString().split('T')[0];
    expect(formatMessageDate(todayStr)).toBe('Today');
  });

  it('should format yesterday as "Yesterday"', () => {
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    expect(formatMessageDate(yesterdayStr)).toBe('Yesterday');
  });

  it('should format dates within the last week with day name', () => {
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];
    const dayName = twoDaysAgo.toLocaleDateString('en-US', { weekday: 'long' });
    expect(formatMessageDate(twoDaysAgoStr)).toBe(dayName);
  });

  it('should format older dates with month and day', () => {
    const lastWeekStr = lastWeek.toISOString().split('T')[0];
    const formattedDate = lastWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    expect(formatMessageDate(lastWeekStr)).toBe(formattedDate);
  });

  it('should handle invalid date formats', () => {
    expect(formatMessageDate('invalid-date')).toBe('invalid-date');
  });

  it('should handle null or undefined input', () => {
    expect(formatMessageDate(null)).toBe('');
    expect(formatMessageDate(undefined)).toBe('');
  });
});

describe('getUnreadMessageCount', () => {
  const messages = [
    { id: 'msg1', content: 'Hello' },
    { id: 'msg2', content: 'Hi' },
    { id: 'msg3', content: 'How are you?' },
    { id: 'msg4', content: 'Test' }
  ];

  it('should return the count of unseen messages', () => {
    const seenMessages = new Set(['msg1', 'msg3']);
    
    const count = getUnreadMessageCount(messages, seenMessages);
    
    expect(count).toBe(2); // msg2 and msg4 are unseen
  });

  it('should return 0 when all messages are seen', () => {
    const seenMessages = new Set(['msg1', 'msg2', 'msg3', 'msg4']);
    
    const count = getUnreadMessageCount(messages, seenMessages);
    
    expect(count).toBe(0);
  });

  it('should return the total message count when no messages are seen', () => {
    const count = getUnreadMessageCount(messages, new Set());
    
    expect(count).toBe(4);
  });

  it('should handle messages without IDs', () => {
    const messagesWithoutIds = [
      { id: 'msg1', content: 'Hello' },
      { content: 'No ID' },
      { id: 'msg2', content: 'Hi' }
    ];
    
    const seenMessages = new Set(['msg1']);
    
    const count = getUnreadMessageCount(messagesWithoutIds, seenMessages);
    
    expect(count).toBe(2); // One without ID and msg2
  });

  it('should handle null or undefined messages', () => {
    expect(getUnreadMessageCount(null, new Set())).toBe(0);
    expect(getUnreadMessageCount(undefined, new Set())).toBe(0);
  });

  it('should handle null or undefined seenMessages', () => {
    expect(getUnreadMessageCount(messages, null)).toBe(4);
    expect(getUnreadMessageCount(messages, undefined)).toBe(4);
  });
}); 