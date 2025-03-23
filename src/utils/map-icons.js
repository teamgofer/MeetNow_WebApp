import L from 'leaflet';

export const createMapIcons = () => {
  const userIcon = L.divIcon({
    className: 'user-marker',
    html: `<div class="user-marker-inner">
             <div class="pulse-circle"></div>
             <div class="marker-dot"></div>
           </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  const meetupIcon = L.divIcon({
    className: 'meetup-marker',
    html: `<div class="meetup-marker-inner">
             <div class="meetup-inner-dot"></div>
             <div class="meetup-outer-ring"></div>
           </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  return {
    userIcon,
    meetupIcon
  };
};

export default createMapIcons;