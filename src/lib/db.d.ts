declare const pool: any;
export declare function query(text: string, params?: any[]): Promise<any>;
export declare const geo: {
    createPoint: (lat: number, lng: number) => string;
    withinRadius: (lat: number, lng: number, radiusInMeters: number) => string;
};
export default pool;
