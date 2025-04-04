import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { cn } from '@/lib/utils';
const LocationMarkerCard = ({
  title,
  description,
  address,
  coordinates,
  distance,
  imageUrl,
  className,
}) => {
  return _jsxs('div', {
    className: cn('location-marker-card p-3 min-w-[200px] max-w-[300px]', className),
    children: [
      imageUrl &&
        _jsx('div', {
          className: 'location-marker-card-image mb-2',
          children: _jsx('img', {
            src: imageUrl,
            alt: title,
            className: 'w-full h-32 object-cover rounded-md',
            onError: e => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://via.placeholder.com/320x180?text=No+Image';
              e.currentTarget.style.opacity = '0.7';
            },
          }),
        }),
      _jsxs('div', {
        className: 'location-marker-card-content',
        children: [
          _jsx('h3', { className: 'font-semibold text-base mb-1', children: title }),
          description &&
            _jsx('p', { className: 'text-sm text-gray-600 mb-2', children: description }),
          address && _jsx('p', { className: 'text-sm text-gray-500 mb-1', children: address }),
          coordinates &&
            _jsxs('p', {
              className: 'text-xs text-gray-400',
              children: [coordinates.lat.toFixed(6), ', ', coordinates.lng.toFixed(6)],
            }),
          distance !== undefined &&
            distance !== null &&
            _jsx('p', {
              className: 'text-xs text-blue-500 mt-1',
              children:
                distance < 1000
                  ? `${Math.round(distance)}m away`
                  : `${(distance / 1000).toFixed(1)}km away`,
            }),
        ],
      }),
    ],
  });
};
export default LocationMarkerCard;
//# sourceMappingURL=LocationMarkerCard.js.map
