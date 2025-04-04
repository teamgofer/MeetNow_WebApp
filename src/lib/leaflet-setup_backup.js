import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import locate control after Leaflet
import 'leaflet.locatecontrol';
import 'leaflet.locatecontrol/dist/L.Control.Locate.css';

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Initialize locate control plugin
if (!L.Control.Locate) {
  console.debug('Creating fallback Locate control');
  L.Control.Locate = L.Control.extend({
    options: {
      position: 'topright',
      layer: undefined,
      setView: true,
      keepCurrentZoomLevel: false,
      flyTo: false,
      clickBehavior: {
        inView: 'stop',
        outOfView: 'setView',
        inViewNotFollowing: 'inView',
      },
      returnToPrevBounds: false,
      cacheLocation: true,
      drawCircle: true,
      drawMarker: true,
      showCompass: true,
      markerClass: L.CircleMarker,
      compassClass: undefined,
      circleStyle: {},
      markerStyle: {},
      compassStyle: {},
      followCircleStyle: {},
      followMarkerStyle: {},
      icon: 'fa fa-map-marker',
      iconLoading: 'fa fa-spinner fa-spin',
      iconElementTag: 'span',
      circlePadding: [0, 0],
      metric: true,
      createButtonCallback: function (container, options) {
        const link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single', container);
        link.title = options.strings.title;
        const icon = L.DomUtil.create(options.iconElementTag, options.icon, link);
        return { link, icon };
      },
      strings: {
        title: 'Show me where I am',
        metersUnit: 'meters',
        feetUnit: 'feet',
        popup: 'You are within {distance} {unit} from this point',
        outsideMapBoundsMsg: 'You seem to be located outside the boundaries of the map',
      },
      locateOptions: {
        maxZoom: Infinity,
        watch: true,
        setView: false,
      },
    },

    initialize: function (options) {
      L.setOptions(this, options);
      this._map = null;
    },

    onAdd: function (map) {
      this._map = map;
      const container = L.DomUtil.create('div', 'leaflet-control-locate');
      const { link } = this.options.createButtonCallback(container, this.options);

      L.DomEvent.disableClickPropagation(container);
      return container;
    },

    onRemove: function (map) {
      this._map = null;
    },
  });
}

// Register the locate control factory
if (!L.control.locate) {
  L.control.locate = function (options) {
    return new L.Control.Locate(options);
  };
}

export const setupLeaflet = () => {
  // Ensure Leaflet is loaded
  if (!L) {
    console.error('Leaflet not loaded');
    return;
  }

  // Verify locate control is available
  if (!L.Control.Locate) {
    console.error('Leaflet locate control not available');
    return;
  }

  console.debug('Leaflet setup complete with locate control');
};
