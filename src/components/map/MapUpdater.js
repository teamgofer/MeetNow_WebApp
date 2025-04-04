import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { isValidLocation } from '../../lib/map/utils';
const MapUpdater = ({ center, zoom, selectedLocation, onUpdate }) => {
    const map = useMap();
    useEffect(() => {
        if (!isValidLocation(center)) {
            return;
        }
        map.setView([center.lat, center.lng], zoom);
    }, [center, zoom, map]);
    useEffect(() => {
        if (!selectedLocation ?? !isValidLocation(selectedLocation)) {
            return;
        }
        map.setView([selectedLocation.lat, selectedLocation.lng], zoom);
    }, [selectedLocation, zoom, map]);
    return null;
};
export default MapUpdater;
//# sourceMappingURL=MapUpdater.js.map