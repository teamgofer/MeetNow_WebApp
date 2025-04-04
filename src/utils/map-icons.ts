import L from 'leaflet';

/**
 * Create custom SVG icons for map markers
 * @returns Object containing all map icon instances
 */
export const createMapIcons = () => {
  // User location marker (smiley earth icon)
  const userLocationIcon = L.icon({
    iconUrl: './images/smiley-earth-icon.png',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
    className: 'user-location-marker smiley-earth',
  });

  // Meetup marker (pink circle with ring)
  const meetupIcon = L.divIcon({
    className: 'meetup-marker-icon',
    html: `
      <div class="meetup-marker-inner">
        <div class="meetup-outer-ring"></div>
        <div class="meetup-inner-dot"></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
    shadowSize: [0, 0],
    shadowAnchor: [0, 0],
  });

  // Simple icon for selected meetup (not actually used since MemoizedMeetupMarker handles rendering)
  const selectedMeetupIcon = L.divIcon({
    className: 'meetup-marker-icon',
    html: `
      <div class="meetup-marker-inner">
        <div class="meetup-outer-ring selected"></div>
        <div class="meetup-inner-dot"></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
    shadowSize: [0, 0],
    shadowAnchor: [0, 0],
  });

  // Expired meetup marker (gray)
  const expiredMeetupIcon = L.divIcon({
    className: 'meetup-marker-icon',
    html: `
      <div class="meetup-marker-inner">
        <div class="meetup-outer-ring"></div>
        <div class="meetup-inner-dot expired"></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
    shadowSize: [0, 0],
    shadowAnchor: [0, 0],
  });

  // Pin marker (red)
  const pinIcon = L.divIcon({
    className: 'pin-marker-icon',
    html: `
      <div class="pin-marker-container">
        <div class="pin-marker" style="background-color: #f56565">
          <div class="pin-head" style="background-color: #f56565"></div>
          <div class="pin-shadow"></div>
        </div>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42],
    shadowSize: [0, 0],
    shadowAnchor: [0, 0],
  });

  // Create a default icon that doesn't rely on external images
  const defaultIcon = L.divIcon({
    className: 'default-marker-icon',
    html: `
      <div class="default-marker-inner">
        <div class="default-marker-dot"></div>
        <div class="default-marker-ring"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
    shadowSize: [0, 0],
    shadowAnchor: [0, 0],
  });

  // Blue pin marker
  const bluePinIcon = L.divIcon({
    className: 'pin-marker-icon',
    html: `
      <div class="pin-marker-container">
        <div class="pin-marker" style="background-color: #3b82f6">
          <div class="pin-head" style="background-color: #3b82f6"></div>
          <div class="pin-shadow"></div>
        </div>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42],
    shadowSize: [0, 0],
    shadowAnchor: [0, 0],
  });

  // Green pin marker
  const greenPinIcon = L.divIcon({
    className: 'pin-marker-icon',
    html: `
      <div class="pin-marker-container">
        <div class="pin-marker" style="background-color: #48bb78">
          <div class="pin-head" style="background-color: #48bb78"></div>
          <div class="pin-shadow"></div>
        </div>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42],
    shadowSize: [0, 0],
    shadowAnchor: [0, 0],
  });

  // Purple pin marker
  const purplePinIcon = L.divIcon({
    className: 'pin-marker-icon',
    html: `
      <div class="pin-marker-container">
        <div class="pin-marker" style="background-color: #9f7aea">
          <div class="pin-head" style="background-color: #9f7aea"></div>
          <div class="pin-shadow"></div>
        </div>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42],
    shadowSize: [0, 0],
    shadowAnchor: [0, 0],
  });

  // Temporary pin marker (with pulse effect)
  const temporaryPinIcon = L.divIcon({
    className: 'pin-marker-icon',
    html: `
      <div class="pin-marker-container temporary">
        <div class="pin-marker" style="background-color: #f56565">
          <div class="pin-head" style="background-color: #f56565"></div>
          <div class="pin-shadow"></div>
        </div>
        <div class="pin-pulse"></div>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42],
    shadowSize: [0, 0],
    shadowAnchor: [0, 0],
  });

  // Helper function to get pin icon by color
  const getPinIconByColor = (color: string, isTemporary: boolean = false) => {
    if (isTemporary) return temporaryPinIcon;

    switch (color) {
      case 'blue':
        return bluePinIcon;
      case 'green':
        return greenPinIcon;
      case 'purple':
        return purplePinIcon;
      case 'red':
      default:
        return pinIcon;
    }
  };

  return {
    userLocationIcon,
    meetupIcon,
    selectedMeetupIcon,
    expiredMeetupIcon,
    pinIcon,
    defaultIcon,
    bluePinIcon,
    greenPinIcon,
    purplePinIcon,
    temporaryPinIcon,
    getPinIconByColor,
  };
};

export default createMapIcons; 
 