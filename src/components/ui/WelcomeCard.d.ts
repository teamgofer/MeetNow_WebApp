import React from 'react';
interface WelcomeCardProps {
    isVisible: boolean;
    onClose: () => void;
}
declare const WelcomeCard: React.FC<WelcomeCardProps>;
export default WelcomeCard;
