import React from 'react';
import { LatLngExpression } from 'leaflet';
interface TestMapProps {
    center?: LatLngExpression;
    zoom?: number;
    height?: string;
    width?: string;
}
declare const TestMap: React.FC<TestMapProps>;
export default TestMap;
