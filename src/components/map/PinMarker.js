import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { createMapIcons } from '../../utils/map-icons';
const PinMarker = ({ id, position, title = 'Pinned Location', address, color = 'red', isTemporary = false, onClick, selected = false, showPopup = false, icon, }) => {
    const icons = useMemo(() => createMapIcons(), []);
    const pinIcon = useMemo(() => {
        if (icon)
            return icon;
        return getPinIconByColor(color, isTemporary);
    }, [color, isTemporary, icon]);
    function getPinIconByColor(color, isTemp) {
        if (isTemp) {
            return icons.temporaryPinIcon;
        }
        switch (color) {
            case 'blue':
                return icons.bluePinIcon;
            case 'green':
                return icons.greenPinIcon;
            case 'purple':
                return icons.purplePinIcon;
            case 'red':
            default:
                return icons.pinIcon;
        }
    }
    const handleClick = () => {
        if (onClick) {
            onClick(id);
        }
    };
    return (_jsx(Marker, { position: position, icon: pinIcon, eventHandlers: {
            click: handleClick,
        }, zIndexOffset: selected ? 1000 : 0, children: showPopup && (_jsx(Popup, { className: "pin-popup", autoClose: false, closeOnClick: false, children: _jsxs("div", { className: "p-3", children: [_jsx("h3", { className: "font-medium text-gray-900", children: title }), address && _jsx("p", { className: "text-xs mt-1 text-gray-500", children: address }), isTemporary && (_jsx("div", { className: "text-xs mt-1 text-blue-500 font-medium", children: "Temporary location" }))] }) })) }));
};
export default PinMarker;
//# sourceMappingURL=PinMarker.js.map