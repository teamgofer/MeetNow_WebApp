import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { cn } from '@/lib/utils';
const formatDate = date => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
};
const LocationStats = ({ stats, className }) => {
  return _jsxs('div', {
    className: cn('space-y-4', className),
    children: [
      _jsxs('div', {
        className: 'grid grid-cols-2 gap-4',
        children: [
          _jsxs('div', {
            className: 'bg-gray-50 p-3 rounded-lg',
            children: [
              _jsx('div', { className: 'text-sm text-gray-500', children: 'Total Meetups' }),
              _jsx('div', { className: 'text-lg font-semibold', children: stats.totalMeetups }),
            ],
          }),
          _jsxs('div', {
            className: 'bg-gray-50 p-3 rounded-lg',
            children: [
              _jsx('div', { className: 'text-sm text-gray-500', children: 'Active Meetups' }),
              _jsx('div', { className: 'text-lg font-semibold', children: stats.activeMeetups }),
            ],
          }),
        ],
      }),
      _jsxs('div', {
        className: 'grid grid-cols-2 gap-4',
        children: [
          _jsxs('div', {
            className: 'bg-gray-50 p-3 rounded-lg',
            children: [
              _jsx('div', { className: 'text-sm text-gray-500', children: 'Average Rating' }),
              _jsx('div', {
                className: 'text-lg font-semibold',
                children: stats.averageRating ? `${stats.averageRating.toFixed(1)}/5` : 'N/A',
              }),
            ],
          }),
          _jsxs('div', {
            className: 'bg-gray-50 p-3 rounded-lg',
            children: [
              _jsx('div', { className: 'text-sm text-gray-500', children: 'Total Visits' }),
              _jsx('div', { className: 'text-lg font-semibold', children: stats.totalVisits || 0 }),
            ],
          }),
        ],
      }),
      stats.lastMeetup &&
        _jsxs('div', {
          className: 'bg-gray-50 p-3 rounded-lg',
          children: [
            _jsx('div', { className: 'text-sm text-gray-500', children: 'Last Meetup' }),
            _jsx('div', {
              className: 'text-lg font-semibold',
              children: formatDate(new Date(stats.lastMeetup)),
            }),
          ],
        }),
      stats.popularTimes &&
        stats.popularTimes.length > 0 &&
        _jsxs('div', {
          className: 'mt-4',
          children: [
            _jsx('h4', { className: 'text-sm font-semibold mb-2', children: 'Popular Times' }),
            _jsx('div', {
              className: 'space-y-2',
              children: stats.popularTimes.map((time, index) =>
                _jsxs(
                  'div',
                  {
                    className: 'flex items-center justify-between',
                    children: [
                      _jsxs('span', {
                        className: 'text-sm text-gray-600',
                        children: [
                          new Date(2000, 0, time.dayOfWeek + 1).toLocaleDateString('en-US', {
                            weekday: 'short',
                          }),
                          ' ',
                          time.hour,
                          ':00',
                        ],
                      }),
                      _jsxs('div', {
                        className: 'flex items-center',
                        children: [
                          _jsx('div', {
                            className: 'w-20 h-2 bg-gray-200 rounded-full mr-2',
                            children: _jsx('div', {
                              className: 'h-full bg-blue-500 rounded-full',
                              style: {
                                width: `${(time.count / Math.max(...stats.popularTimes.map(t => t.count))) * 100}%`,
                              },
                            }),
                          }),
                          _jsx('span', {
                            className: 'text-sm text-gray-500',
                            children: time.count,
                          }),
                        ],
                      }),
                    ],
                  },
                  index
                )
              ),
            }),
          ],
        }),
    ],
  });
};
export default LocationStats;
//# sourceMappingURL=LocationStats.js.map
