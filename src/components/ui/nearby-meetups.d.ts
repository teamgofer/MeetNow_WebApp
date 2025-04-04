import { IMeetup, ILocation } from './MeetupListItem';
interface INearbyMeetupsProps {
    meetups: IMeetup[];
    currentLocation: ILocation;
    currentMeetupId?: string | undefined;
    className?: string;
    onMeetupSelect?: (id: string) => void;
    useStopwatch?: boolean;
}
export declare function NearbyMeetups({ meetups, currentLocation, currentMeetupId, className, onMeetupSelect, useStopwatch, }: INearbyMeetupsProps): import("react/jsx-runtime").JSX.Element;
export {};
