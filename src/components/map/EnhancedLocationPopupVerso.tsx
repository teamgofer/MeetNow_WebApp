import React from 'react';
import { cn } from '@/lib/utils';
import { ILocation } from '@/types/common';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';

interface IEnhancedLocationPopupVersoProps {
  location: ILocation;
  onFlip?: () => void;
  onSubmit?: (data: {
    title: string;
    description: string;
    maxParticipants: number;
    date: string;
    time: string;
  }) => void;
  className?: string;
}

const EnhancedLocationPopupVerso: React.FC<IEnhancedLocationPopupVersoProps> = ({
  location,
  onFlip,
  onSubmit,
  className,
}) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit?.({
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      maxParticipants: parseInt(formData.get('maxParticipants') as string),
      date: formData.get('date') as string,
      time: formData.get('time') as string,
    });
  };

  return (
    <div className={cn('w-[400px] bg-white rounded-lg shadow-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Create New Meetup
        </h3>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <Card className="p-4">
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="Enter meetup title" required />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter meetup description"
                className="min-h-[80px]"
                required
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </Label>
                <Input id="date" name="date" type="date" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time
                </Label>
                <Input id="time" name="time" type="time" required />
              </div>
            </div>

            {/* Max Participants */}
            <div className="space-y-2">
              <Label htmlFor="maxParticipants" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Max Participants
              </Label>
              <Input
                id="maxParticipants"
                name="maxParticipants"
                type="number"
                min="2"
                defaultValue="10"
                required
              />
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onFlip}>
            Back
          </Button>
          <Button type="submit" className="flex-1">
            Create Meetup
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedLocationPopupVerso;
