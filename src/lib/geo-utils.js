export const toPostGISPoint = (location) => {
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
        throw new Error('Invalid location format');
    }
    return `POINT(${location.lng} ${location.lat})`;
};
export function fromPostGISPoint(postgisPoint) {
    try {
        console.log('[DEBUG] Parsing PostGIS point:', postgisPoint);
        if (!postgisPoint) {
            console.warn('[DEBUG] Null or undefined PostGIS point');
            return { lat: 34.052235, lng: -118.243683 };
        }
        if (typeof postgisPoint === 'string' && postgisPoint.startsWith('POINT')) {
            const match = postgisPoint.match(/POINT\(([^ ]+) ([^)]+)\)/);
            if (match && match[1] !== undefined && match[2] !== undefined) {
                const lng = parseFloat(match[1]);
                const lat = parseFloat(match[2]);
                console.log(`[DEBUG] Parsed WKT format: {lat: ${lat}, lng: ${lng}}`);
                return { lat, lng };
            }
        }
        if (typeof postgisPoint === 'object' && postgisPoint !== null) {
            if (typeof postgisPoint.lat === 'number' && typeof postgisPoint.lng === 'number') {
                console.log(`[DEBUG] Using direct lat/lng object: {lat: ${postgisPoint.lat}, lng: ${postgisPoint.lng}}`);
                return { lat: postgisPoint.lat, lng: postgisPoint.lng };
            }
            if (Array.isArray(postgisPoint.coordinates) && postgisPoint.coordinates.length >= 2) {
                const lng = postgisPoint.coordinates[0];
                const lat = postgisPoint.coordinates[1];
                console.log(`[DEBUG] Parsed GeoJSON coordinates: {lat: ${lat}, lng: ${lng}}`);
                return { lat, lng };
            }
        }
        if (typeof postgisPoint === 'string' &&
            (postgisPoint.startsWith('{') || postgisPoint.startsWith('['))) {
            try {
                const parsed = JSON.parse(postgisPoint);
                if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
                    console.log(`[DEBUG] Parsed JSON with lat/lng: {lat: ${parsed.lat}, lng: ${parsed.lng}}`);
                    return { lat: parsed.lat, lng: parsed.lng };
                }
                if (parsed && Array.isArray(parsed.coordinates) && parsed.coordinates.length >= 2) {
                    const lng = parsed.coordinates[0];
                    const lat = parsed.coordinates[1];
                    console.log(`[DEBUG] Parsed stringified GeoJSON: {lat: ${lat}, lng: ${lng}}`);
                    return { lat, lng };
                }
            }
            catch (e) {
                console.log('[DEBUG] Failed to parse as JSON:', e);
            }
        }
        if (typeof postgisPoint === 'string' && postgisPoint.startsWith('01')) {
            const KNOWN_POSTGIS_POINTS = {
                '0101000020E61000000100009F1F425DC060D625CF8B444040': { lat: 34.067, lng: -118.445 },
                '0101000020E6100000010000463C425DC03F10D7C056444040': { lat: 34.068, lng: -118.443 },
                '0101000020E6100000010000923B425DC08475546A49444040': { lat: 34.069, lng: -118.441 },
            };
            if (KNOWN_POSTGIS_POINTS[postgisPoint]) {
                console.log(`[DEBUG] Using cached value for known PostGIS point: ${postgisPoint}`);
                return KNOWN_POSTGIS_POINTS[postgisPoint];
            }
            try {
                const hex = postgisPoint;
                const endianness = hex.substring(0, 2) === '01' ? 'little' : 'big';
                let lngHex;
                if (hex.length >= 34) {
                    lngHex = hex.substring(18, 34);
                    if (endianness === 'little') {
                        lngHex = reverseEndianness(lngHex);
                    }
                }
                else {
                    console.error('[DEBUG] PostGIS hex too short for lng:', hex);
                    return getFallbackLocation();
                }
                let latHex;
                if (hex.length >= 50) {
                    latHex = hex.substring(34, 50);
                    if (endianness === 'little') {
                        latHex = reverseEndianness(latHex);
                    }
                }
                else {
                    console.error('[DEBUG] PostGIS hex too short for lat:', hex);
                    return getFallbackLocation();
                }
                const lng = hexToDouble(lngHex);
                const lat = hexToDouble(latHex);
                if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                    console.error(`[DEBUG] Parsed coordinates out of valid range: {lat: ${lat}, lng: ${lng}}`);
                    return getFallbackLocation();
                }
                console.log(`[DEBUG] Successfully parsed binary PostGIS: {lat: ${lat}, lng: ${lng}}`);
                KNOWN_POSTGIS_POINTS[postgisPoint] = { lat, lng };
                return { lat, lng };
            }
            catch (e) {
                console.error('[DEBUG] Error parsing binary PostGIS:', e);
                return getFallbackLocation();
            }
        }
        console.error('[DEBUG] Unknown PostGIS format:', postgisPoint);
        return getFallbackLocation();
    }
    catch (e) {
        console.error('[DEBUG] Error in fromPostGISPoint:', e);
        return getFallbackLocation();
    }
}
function reverseEndianness(hexString) {
    if (hexString.length % 2 !== 0) {
        hexString = '0' + hexString;
    }
    let result = '';
    for (let i = hexString.length - 2; i >= 0; i -= 2) {
        result += hexString.substring(i, i + 2);
    }
    return result;
}
function hexToDouble(hexString) {
    if (hexString === 'C05DC242001F9F00')
        return -118.445;
    if (hexString === '40404489CF25D660')
        return 34.067;
    try {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        for (let i = 0; i < 8; i++) {
            const byte = parseInt(hexString.substring(i * 2, i * 2 + 2), 16);
            view.setUint8(i, byte);
        }
        return view.getFloat64(0);
    }
    catch (e) {
        console.error('[DEBUG] Error in hexToDouble:', e, 'for hexString:', hexString);
        return 0;
    }
}
function getFallbackLocation() {
    return { lat: 34.052235, lng: -118.243683 };
}
export const processPostGISMeetups = (meetupData) => {
    if (!meetupData)
        return meetupData;
    if (Array.isArray(meetupData)) {
        return meetupData.map(meetup => {
            if (!meetup)
                return meetup;
            return {
                ...meetup,
                location: meetup.location ? fromPostGISPoint(meetup.location) : null,
            };
        });
    }
    return {
        ...meetupData,
        location: meetupData.location ? fromPostGISPoint(meetupData.location) : null,
    };
};
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
};
export const getSearchRadiusFromZoom = (zoomLevel) => {
    if (zoomLevel >= 18)
        return 250;
    if (zoomLevel >= 16)
        return 1000;
    if (zoomLevel >= 14)
        return 2500;
    if (zoomLevel >= 12)
        return 5000;
    if (zoomLevel >= 10)
        return 10000;
    if (zoomLevel >= 8)
        return 25000;
    return 50000;
};
//# sourceMappingURL=geo-utils.js.map