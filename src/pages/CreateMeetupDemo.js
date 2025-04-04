import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { IoAdd } from 'react-icons/io5';
import CreateMeetup from '../components/CreateMeetup.tsx';
const CreateMeetupDemo = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [createdMeetup, setCreatedMeetup] = useState(null);
    const handleOpenModal = () => {
        setIsModalOpen(true);
    };
    const handleCloseModal = meetup => {
        setIsModalOpen(false);
        if (meetup) {
            setCreatedMeetup(meetup);
        }
    };
    return (_jsxs("div", { className: "create-meetup-demo-page", children: [_jsxs("header", { className: "demo-header", children: [_jsx("h1", { children: "MeetNow CreateMeetup Demo" }), _jsx("p", { children: "Click the button below to create a new meetup using our enhanced location search" })] }), _jsx("div", { className: "demo-actions", children: _jsxs("button", { className: "create-button", onClick: handleOpenModal, children: [_jsx(IoAdd, { size: 20 }), " Create New Meetup"] }) }), createdMeetup && (_jsxs("div", { className: "created-meetup-preview", children: [_jsx("h2", { children: "Your Created Meetup" }), _jsxs("div", { className: "meetup-card", children: [_jsx("h3", { children: createdMeetup.title }), _jsxs("p", { className: "meetup-location", children: [_jsx("span", { className: "location-label", children: "Location:" }), " ", createdMeetup.address] }), _jsxs("p", { className: "meetup-datetime", children: [_jsx("span", { className: "datetime-label", children: "When:" }), ' ', new Date(createdMeetup.start_time).toLocaleString()] }), createdMeetup.description && (_jsx("p", { className: "meetup-description", children: createdMeetup.description })), _jsxs("div", { className: "meetup-details", children: [_jsxs("span", { className: "meetup-duration", children: [createdMeetup.duration, " minutes"] }), _jsxs("span", { className: "meetup-participants", children: ["Max ", createdMeetup.max_participants, " people"] })] })] })] })), isModalOpen && (_jsx("div", { className: "modal-overlay", children: _jsx("div", { className: "modal-container", children: _jsx(CreateMeetup, { onClose: handleCloseModal }) }) })), _jsx("style", { jsx: true, children: `
        .create-meetup-demo-page {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }

        .demo-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .demo-header h1 {
          color: #333;
          margin-bottom: 10px;
        }

        .demo-header p {
          color: #666;
          font-size: 1.1rem;
        }

        .demo-actions {
          display: flex;
          justify-content: center;
          margin-bottom: 40px;
        }

        .create-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #4a90e2;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 12px 24px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .create-button:hover {
          background-color: #3a80d2;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          backdrop-filter: blur(3px);
        }

        .modal-container {
          width: 100%;
          max-width: 600px;
        }

        .created-meetup-preview {
          margin-top: 30px;
          background-color: #f9f9f9;
          border-radius: 10px;
          padding: 20px;
        }

        .created-meetup-preview h2 {
          color: #333;
          margin-bottom: 15px;
          font-size: 1.3rem;
          text-align: center;
        }

        .meetup-card {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .meetup-card h3 {
          color: #333;
          margin: 0 0 15px 0;
          font-size: 1.5rem;
        }

        .meetup-location,
        .meetup-datetime {
          margin-bottom: 10px;
          color: #555;
        }

        .location-label,
        .datetime-label {
          font-weight: 600;
          color: #444;
        }

        .meetup-description {
          margin: 15px 0;
          padding-top: 15px;
          border-top: 1px solid #eee;
          color: #666;
          line-height: 1.5;
        }

        .meetup-details {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }

        .meetup-duration,
        .meetup-participants {
          font-size: 0.9rem;
          color: #777;
          background-color: #f5f5f5;
          padding: 5px 10px;
          border-radius: 4px;
        }

        @media (max-width: 600px) {
          .create-meetup-demo-page {
            padding: 15px;
          }

          .modal-overlay {
            padding: 0;
          }

          .modal-container {
            height: 100%;
            max-width: 100%;
          }
        }
      ` })] }));
};
export default CreateMeetupDemo;
//# sourceMappingURL=CreateMeetupDemo.js.map