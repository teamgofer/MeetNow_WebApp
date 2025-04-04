import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { IoCloseOutline } from 'react-icons/io5';
import LocationInfoMode from './LocationInfoMode';
import LocationFormMode from './LocationFormMode';
export var MeetupCardMode;
(function (MeetupCardMode) {
    MeetupCardMode["LOCATION_INFO"] = "location_info";
    MeetupCardMode["CREATE_FORM"] = "create_form";
    MeetupCardMode["HIDDEN"] = "hidden";
})(MeetupCardMode || (MeetupCardMode = {}));
const MultiModeMeetupCard = ({ location, onClose, onCreateMeetup, onGetDirections, className = '', isLoading = false, }) => {
    const [mode, setMode] = useState(location ? MeetupCardMode.LOCATION_INFO : MeetupCardMode.HIDDEN);
    const handleSwitchToCreateMode = useCallback(() => {
        setMode(MeetupCardMode.CREATE_FORM);
    }, []);
    const handleSwitchToInfoMode = useCallback(() => {
        setMode(MeetupCardMode.LOCATION_INFO);
    }, []);
    const handleSubmitForm = useCallback(async (formData) => {
        if (onCreateMeetup && location) {
            await onCreateMeetup({
                ...formData,
                location,
            });
            onClose();
        }
    }, [location, onCreateMeetup, onClose]);
    if (!location || mode === MeetupCardMode.HIDDEN) {
        return null;
    }
    return (_jsx("div", { className: `fixed top-0 left-0 right-0 z-50 bg-white shadow-xl rounded-b-lg max-w-md mx-auto slide-down ${className}`, children: _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: onClose, className: "absolute top-2 right-2 z-10 p-1 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-gray-900 transition-colors", "aria-label": "Close", children: _jsx(IoCloseOutline, { size: 24 }) }), mode === MeetupCardMode.LOCATION_INFO && (_jsx(LocationInfoMode, { location: location, onCreateMeetup: handleSwitchToCreateMode, onGetDirections: onGetDirections })), mode === MeetupCardMode.CREATE_FORM && (_jsx(LocationFormMode, { location: location, onSubmit: handleSubmitForm, onCancel: handleSwitchToInfoMode, isLoading: isLoading }))] }) }));
};
export default MultiModeMeetupCard;
//# sourceMappingURL=MultiModeMeetupCard.js.map