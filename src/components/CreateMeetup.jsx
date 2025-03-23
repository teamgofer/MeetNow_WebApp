import { ensureProfile } from '../utils/auth';

const CreateMeetup = ({ onClose, location }) => {
  // ... existing state and refs

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // First ensure user has a profile
      await ensureProfile();
      
      // Then create the meetup
      const meetupData = {
        title: title || 'Meetup at ' + (address || 'Selected Location'),
        description,
        location,
        address,
        max_participants: parseInt(maxParticipants) || 10
      };
      
      const result = await createMeetup(meetupData);
      
      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Failed to create meetup');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // ... rest of the component
}; 