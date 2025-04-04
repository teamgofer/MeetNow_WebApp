import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { cn } from '@/lib/utils';
const NearbyPlaces = ({ places, className }) => {
  const formatDistance = distance => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };
  return _jsxs('div', {
    className: cn('space-y-4', className),
    children: [
      _jsx('h4', { className: 'text-sm font-semibold', children: 'Nearby Places' }),
      _jsx('div', {
        className: 'space-y-3',
        children: places.map((place, index) =>
          _jsxs(
            'div',
            {
              className: 'flex items-start justify-between p-2 hover:bg-gray-50 rounded-md',
              children: [
                _jsxs('div', {
                  className: 'flex-1',
                  children: [
                    _jsx('div', { className: 'text-sm font-medium', children: place.name }),
                    place.address &&
                      _jsx('div', { className: 'text-xs text-gray-500', children: place.address }),
                    _jsx('div', { className: 'text-xs text-gray-400 mt-1', children: place.type }),
                  ],
                }),
                _jsxs('div', {
                  className: 'flex items-center space-x-2',
                  children: [
                    place.rating &&
                      _jsxs('div', {
                        className: 'text-xs text-yellow-500',
                        children: ['\u2605 ', place.rating.toFixed(1)],
                      }),
                    _jsx('div', {
                      className: 'text-xs text-gray-500',
                      children: formatDistance(place.distance),
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
  });
};
export default NearbyPlaces;
//# sourceMappingURL=NearbyPlaces.js.map
