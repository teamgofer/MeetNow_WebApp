import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
const MapClickHandler = ({ onMapClick }) => {
    const map = useMap();
    useEffect(() => {
        if (!map)
            return;
        map.on('click', onMapClick);
        return () => {
            map.off('click', onMapClick);
        };
    }, [map, onMapClick]);
    return null;
};
export default MapClickHandler;
//# sourceMappingURL=MapClickHandler.js.map