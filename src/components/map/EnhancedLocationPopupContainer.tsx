import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ILocation } from '@/types/common';
import EnhancedLocationPopup from './EnhancedLocationPopup';
import EnhancedLocationPopupVerso from './EnhancedLocationPopupVerso';

interface IEnhancedLocationPopupContainerProps {
  location: ILocation;
  onSubmit?: (data: {
    title: string;
    description: string;
    maxParticipants: number;
    date: string;
    time: string;
  }) => void;
  className?: string;
}

const EnhancedLocationPopupContainer: React.FC<IEnhancedLocationPopupContainerProps> = ({
  location,
  onSubmit,
  className,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleSubmit = (data: {
    title: string;
    description: string;
    maxParticipants: number;
    date: string;
    time: string;
  }) => {
    onSubmit?.(data);
  };

  return (
    <div className={cn('relative w-[400px] h-[500px] perspective-1000', className)}>
      <div
        className={cn(
          'relative w-full h-full transition-transform duration-500 transform-style-3d',
          isFlipped && 'rotate-y-180'
        )}
      >
        {/* Recto */}
        <div className="absolute w-full h-full backface-hidden">
          <EnhancedLocationPopup location={location} onFlip={() => setIsFlipped(true)} />
        </div>

        {/* Verso */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          <EnhancedLocationPopupVerso
            location={location}
            onFlip={() => setIsFlipped(false)}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedLocationPopupContainer;
