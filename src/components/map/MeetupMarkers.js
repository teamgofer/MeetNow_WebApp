import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import MeetupMarker from './MeetupMarker';
const MeetupMarkers = ({ meetups, onMeetupClick, selectedMeetupId, showPopups = true, }) => {
    if (!meetups || meetups.length === 0) {
        return null;
    }
    return (_jsx(_Fragment, { children: meetups.map(meetup => (_jsx(MeetupMarker, { id: meetup.id, position: meetup.position, title: meetup.title, description: meetup.description, address: meetup.address, distance: meetup.distance, expiresAt: meetup.expiresAt, createdAt: meetup.createdAt, onClick: onMeetupClick, selected: selectedMeetupId === meetup.id, showPopup: showPopups && selectedMeetupId === meetup.id, status: meetup.status }, meetup.id))) }));
};
export default MeetupMarkers;
//# sourceMappingURL=MeetupMarkers.js.map