import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
const UserLocationMarker = ({ position, accuracy = 0, showPopup = false }) => {
    const size = [44, 44];
    const anchor = [22, 22];
    const icon = L.divIcon({
        className: 'smiley-earth-marker',
        html: `
      <div style="width: ${size[0]}px; height: ${size[1]}px; display: flex; align-items: center; justify-content: center;">
        <img src="/images/smiley-earth-icon-hd.png" style="width: 100%; height: 100%; object-fit: contain;" alt="User Location" />
      </div>
    `,
        iconSize: size,
        iconAnchor: anchor
    });
    return (_jsxs(_Fragment, { children: [_jsx(Marker, { position: position, icon: icon, zIndexOffset: 1000, children: showPopup && (_jsx(Popup, { children: _jsxs("div", { children: [_jsx("strong", { children: "Your Location" }), accuracy > 0 && (_jsxs("p", { children: ["Accuracy: \u00B1", Math.round(accuracy), " meters"] }))] }) })) }), accuracy > 0 && (_jsx(Circle, { center: position, radius: accuracy, pathOptions: {
                    color: '#3388ff',
                    fillColor: '#3388ff',
                    fillOpacity: 0.1,
                    weight: 1
                } }))] }));
};
export default UserLocationMarker;
//# sourceMappingURL=UserLocationMarker.js.map