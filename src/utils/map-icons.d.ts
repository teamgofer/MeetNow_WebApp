import L from 'leaflet';
export declare const createMapIcons: () => {
    userLocationIcon: L.Icon<L.IconOptions>;
    meetupIcon: L.DivIcon;
    selectedMeetupIcon: L.DivIcon;
    expiredMeetupIcon: L.DivIcon;
    pinIcon: L.DivIcon;
    defaultIcon: L.DivIcon;
    bluePinIcon: L.DivIcon;
    greenPinIcon: L.DivIcon;
    purplePinIcon: L.DivIcon;
    temporaryPinIcon: L.DivIcon;
    getPinIconByColor: (color: string, isTemporary?: boolean) => L.DivIcon;
};
export default createMapIcons;
