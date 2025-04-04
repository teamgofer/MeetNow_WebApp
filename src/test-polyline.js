const samplePolyline = 'o}oeFxcejVA?@YGAe@CQAACISKBO?k@MWGEAGAAPcBi@{Am@YOa@WIEa@Wi@[SJMBUBYDKMW]KO_Cd@cFbACGW_@c@e@KMKOwB_Di@s@OSKOIMmCsDIIMQOSKOuAkBCCeB_CKQEEGGMSGGc@m@jAcBBEVc@BGr@i@@YAKOS?GFK@ALW@GHSe@o@iDwE_@i@OQEGEGNUkCoD';
function decodeGooglePolyline(encoded) {
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;
    const coordinates = [];
    while (index < len) {
        let b;
        let shift = 0;
        let result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
        lat += deltaLat;
        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
        lng += deltaLng;
        coordinates.push([lat * 1e-5, lng * 1e-5]);
    }
    return coordinates;
}
function decodeORSPolyline(encoded) {
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;
    const coordinates = [];
    while (index < len) {
        let b;
        let shift = 0;
        let result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
        lat += deltaLat;
        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
        lng += deltaLng;
        coordinates.push([lat * 1e-5, lng * 1e-5]);
    }
    return coordinates;
}
function flipCoordinates(coordinates) {
    return coordinates.map(coord => [coord[1], coord[0]]);
}
const standardDecoding = decodeGooglePolyline(samplePolyline);
const orsDecoding = decodeORSPolyline(samplePolyline);
const flippedStandard = flipCoordinates(standardDecoding);
console.log('Standard decoder points:', standardDecoding.length);
console.log('First few points:', standardDecoding.slice(0, 3));
console.log('Last few points:', standardDecoding.slice(-3));
console.log('\nORS decoder points:', orsDecoding.length);
console.log('First few points:', orsDecoding.slice(0, 3));
console.log('Last few points:', orsDecoding.slice(-3));
console.log('\nFlipped standard points:', flippedStandard.length);
console.log('First few points:', flippedStandard.slice(0, 3));
console.log('Last few points:', flippedStandard.slice(-3));
export { samplePolyline, standardDecoding, orsDecoding, flippedStandard };
//# sourceMappingURL=test-polyline.js.map