import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import LocationStats from './LocationStats';
import PopularTimes from './PopularTimes';
import NearbyPlaces from './NearbyPlaces';
import CreateMeetupForm from './CreateMeetupForm';
import styles from './TemporaryLocationMarkerCard.module.css';
const TemporaryLocationMarkerCard = ({ location, onCreateMeetup, className, onClose }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);
  const handleCreateMeetup = meetup => {
    if (onCreateMeetup) {
      onCreateMeetup(meetup);
    }
    setIsFlipped(false);
    if (onClose) {
      onClose();
    }
  };
  return _jsx('div', {
    className: cn(styles.temporaryLocationMarkerCard, isVisible && styles.fadeIn, className),
    children: _jsxs('div', {
      className: cn(styles.cardInner, isFlipped ? styles.isFlipped : ''),
      children: [
        _jsx('div', {
          className: styles.cardRecto,
          children: _jsxs('div', {
            className: 'p-4 space-y-4',
            children: [
              _jsxs('div', {
                className: 'flex items-center justify-between',
                children: [
                  _jsxs('div', {
                    children: [
                      _jsx('h3', {
                        className: 'text-lg font-semibold',
                        children: location.display_name,
                      }),
                      _jsxs('p', {
                        className: 'text-sm text-gray-500',
                        children: [location.lat.toFixed(6), ', ', location.lng.toFixed(6)],
                      }),
                    ],
                  }),
                  _jsx('button', {
                    onClick: () => onClose?.(),
                    className: 'text-gray-500 hover:text-gray-700',
                    children: _jsx('svg', {
                      xmlns: 'http://www.w3.org/2000/svg',
                      className: 'h-5 w-5',
                      viewBox: '0 0 20 20',
                      fill: 'currentColor',
                      children: _jsx('path', {
                        fillRule: 'evenodd',
                        d: 'M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z',
                        clipRule: 'evenodd',
                      }),
                    }),
                  }),
                ],
              }),
              _jsxs('div', {
                className: styles.statsContainer,
                children: [
                  location.stats && _jsx(LocationStats, { stats: location.stats }),
                  location.stats?.popularTimes &&
                    location.stats.popularTimes.length > 0 &&
                    _jsx(PopularTimes, { popularTimes: location.stats.popularTimes }),
                  location.nearbyPlaces &&
                    location.nearbyPlaces.length > 0 &&
                    _jsx(NearbyPlaces, { places: location.nearbyPlaces }),
                ],
              }),
              _jsx('button', {
                onClick: () => setIsFlipped(true),
                className:
                  'w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors',
                children: 'Create Meetup',
              }),
            ],
          }),
        }),
        _jsx('div', {
          className: styles.cardVerso,
          children: _jsxs('div', {
            className: 'p-4 space-y-4',
            children: [
              _jsxs('div', {
                className: 'flex items-center justify-between',
                children: [
                  _jsx('h3', { className: 'text-lg font-semibold', children: 'Create New Meetup' }),
                  _jsx('button', {
                    onClick: () => setIsFlipped(false),
                    className: 'text-gray-500 hover:text-gray-700',
                    children: _jsx('svg', {
                      xmlns: 'http://www.w3.org/2000/svg',
                      className: 'h-5 w-5',
                      viewBox: '0 0 20 20',
                      fill: 'currentColor',
                      children: _jsx('path', {
                        fillRule: 'evenodd',
                        d: 'M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z',
                        clipRule: 'evenodd',
                      }),
                    }),
                  }),
                ],
              }),
              _jsx('div', {
                className: styles.formContainer,
                children: _jsx(CreateMeetupForm, {
                  location: location,
                  onSubmit: handleCreateMeetup,
                }),
              }),
            ],
          }),
        }),
      ],
    }),
  });
};
export default TemporaryLocationMarkerCard;
//# sourceMappingURL=TemporaryLocationMarkerCard.js.map
