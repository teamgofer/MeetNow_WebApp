export declare const toPostGISPoint: (location: {
    lat: number;
    lng: number;
}) => string;
export declare function fromPostGISPoint(postgisPoint: any): {
    lat: number;
    lng: number;
};
export declare const processPostGISMeetups: (meetupData: any) => any;
export declare const calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
export declare const getSearchRadiusFromZoom: (zoomLevel: number) => number;
