import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';
const EnhancedLocationPopupVerso = ({ location, onFlip, onSubmit, className, }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSubmit?.({
            title: formData.get('title'),
            description: formData.get('description'),
            maxParticipants: parseInt(formData.get('maxParticipants')),
            date: formData.get('date'),
            time: formData.get('time'),
        });
    };
    return (_jsxs("div", { className: cn('w-[400px] bg-white rounded-lg shadow-lg overflow-hidden', className), children: [_jsx("div", { className: "p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white", children: _jsxs("h3", { className: "text-lg font-semibold flex items-center gap-2", children: [_jsx(MapPin, { className: "w-5 h-5" }), "Create New Meetup"] }) }), _jsxs("form", { onSubmit: handleSubmit, className: "p-4 space-y-4", children: [_jsx(Card, { className: "p-4", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "title", children: "Title" }), _jsx(Input, { id: "title", name: "title", placeholder: "Enter meetup title", required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "description", children: "Description" }), _jsx(Textarea, { id: "description", name: "description", placeholder: "Enter meetup description", className: "min-h-[80px]", required: true })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "date", className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "w-4 h-4" }), "Date"] }), _jsx(Input, { id: "date", name: "date", type: "date", required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "time", className: "flex items-center gap-2", children: [_jsx(Clock, { className: "w-4 h-4" }), "Time"] }), _jsx(Input, { id: "time", name: "time", type: "time", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "maxParticipants", className: "flex items-center gap-2", children: [_jsx(Users, { className: "w-4 h-4" }), "Max Participants"] }), _jsx(Input, { id: "maxParticipants", name: "maxParticipants", type: "number", min: "2", defaultValue: "10", required: true })] })] }) }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { type: "button", variant: "outline", className: "flex-1", onClick: onFlip, children: "Back" }), _jsx(Button, { type: "submit", className: "flex-1", children: "Create Meetup" })] })] })] }));
};
export default EnhancedLocationPopupVerso;
//# sourceMappingURL=EnhancedLocationPopupVerso.js.map