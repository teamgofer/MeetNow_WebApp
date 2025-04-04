import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { cn } from '@/lib/utils';
const PopularTimes = ({ popularTimes, className }) => {
  const maxValue = Math.max(...popularTimes.map(pt => pt.count));
  const sortedTimes = [...popularTimes].sort((a, b) => a.hour - b.hour);
  return _jsxs('div', {
    className: cn('space-y-4', className),
    children: [
      _jsx('h4', { className: 'text-sm font-semibold', children: 'Popular Times' }),
      _jsx('div', {
        className: 'space-y-2',
        children: sortedTimes.map(time => {
          const percentage = (time.count / maxValue) * 100;
          const hourDisplay = `${time.hour.toString().padStart(2, '0')}:00`;
          return _jsxs(
            'div',
            {
              className: 'flex items-center space-x-2',
              children: [
                _jsx('div', { className: 'w-12 text-xs text-gray-500', children: hourDisplay }),
                _jsx('div', {
                  className: 'flex-1 h-2 bg-gray-100 rounded-full overflow-hidden',
                  children: _jsx('div', {
                    className: 'h-full bg-blue-500 rounded-full transition-all duration-300',
                    style: { width: `${percentage}%` },
                  }),
                }),
                _jsx('div', {
                  className: 'w-8 text-xs text-gray-500 text-right',
                  children: time.count,
                }),
              ],
            },
            `${time.dayOfWeek}-${time.hour}`
          );
        }),
      }),
    ],
  });
};
export default PopularTimes;
//# sourceMappingURL=PopularTimes.js.map
