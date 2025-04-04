export interface IAccordionHeader extends HTMLElement {
    nextElementSibling: HTMLElement;
    parentElement: HTMLElement;
    querySelector(selector: string): Element | null;
}
export interface ISliderElements {
    track: HTMLElement;
    trackInner: HTMLElement;
    progress: HTMLElement;
    thumb: HTMLElement;
    valueDisplay: HTMLElement;
}
export interface ICarouselElements {
    container: HTMLElement;
    track: HTMLElement;
    slides: HTMLElement[];
    prevButton: HTMLElement;
    nextButton: HTMLElement;
    indicators: HTMLElement[];
}
export interface IColorPickerElements {
    input: HTMLInputElement;
    preview: HTMLElement;
    hueSlider: HTMLElement;
    saturationSlider: HTMLElement;
    lightnessSlider: HTMLElement;
}
export interface IMapOverlay {
    container: HTMLElement;
    map: any;
    options: Record<string, unknown>;
}
export interface IWeatherData {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
}
export interface ITrafficData {
    congestion: number;
    incidents: Array<{
        type: string;
        severity: number;
        location: [number, number];
    }>;
}
export interface IPollutionData {
    aqi: number;
    pollutants: Record<string, number>;
    location: [number, number];
}
export interface ISunshineData {
    uvIndex: number;
    cloudCover: number;
    forecast: Array<{
        time: string;
        uvIndex: number;
        cloudCover: number;
    }>;
}
export interface IFogOfWarOptions {
    defaultRadius: number;
    maxRadius: number;
    color: string;
    opacity: number;
}
export interface ILocation {
    lat: number;
    lng: number;
}
export interface IDragEvent extends MouseEvent {
    clientX: number;
    clientY: number;
}
export interface ITouchEvent extends Event {
    touches: TouchList;
}
