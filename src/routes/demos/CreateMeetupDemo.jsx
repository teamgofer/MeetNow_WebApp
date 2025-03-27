import React, { useState } from 'react';
import CreateMeetup from '../components/CreateMeetup';
import { IoAdd } from 'react-icons/io5';

/**
 * Meetup object interface
 * @typedef {Object} Meetup
 * @property {string} title - Meetup title
 * @property {string} description - Meetup description
 * @property {number} lat - Latitude
 * @property {number} lng - Longitude
 * @property {string} address - Address
 * @property {number} max_participants - Maximum participants
 * @property {number} duration - Duration in minutes
 * @property {string} start_time - Start time ISO string
 */

/**
 * Demo page for the CreateMeetup component
 */
const CreateMeetupDemo = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  /** @type {[Meetup|null, React.Dispatch<React.SetStateAction<Meetup|null>>]} */
  const [createdMeetup, setCreatedMeetup] = useState(null);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  /**
   * Handle closing the modal
   * @param {Meetup|undefined} meetup - The created meetup or undefined
   */
  const handleCloseModal = (meetup) => {
    setIsModalOpen(false);
    if (meetup) {
      setCreatedMeetup(meetup);
    }
  };

  return (
    <div className="create-meetup-demo-page">
      <header className="demo-header">
        <h1>MeetNow CreateMeetup Demo</h1>
        <p>Click the button below to create a new meetup using our enhanced location search</p>
      </header>

      <div className="demo-actions">
        <button className="create-button" onClick={handleOpenModal}>
          <IoAdd size={20} /> Create New Meetup
        </button>
      </div>

      {createdMeetup && (
        <div className="created-meetup-preview">
          <h2>Your Created Meetup</h2>
          <div className="meetup-card">
            <h3>{createdMeetup.title}</h3>
            <p className="meetup-location">
              <span className="location-label">Location:</span> {createdMeetup.address}
            </p>
            <p className="meetup-datetime">
              <span className="datetime-label">When:</span> {new Date(createdMeetup.start_time).toLocaleString()}
            </p>
            {createdMeetup.description && (
              <p className="meetup-description">{createdMeetup.description}</p>
            )}
            <div className="meetup-details">
              <span className="meetup-duration">{createdMeetup.duration} minutes</span>
              <span className="meetup-participants">Max {createdMeetup.max_participants} people</span>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <CreateMeetup onClose={handleCloseModal} />
          </div>
        </div>
      )}

      <style jsx>{`
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

        .meetup-location, .meetup-datetime {
          margin-bottom: 10px;
          color: #555;
        }

        .location-label, .datetime-label {
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

        .meetup-duration, .meetup-participants {
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
      `}</style>
    </div>
  );
};

export default CreateMeetupDemo; 