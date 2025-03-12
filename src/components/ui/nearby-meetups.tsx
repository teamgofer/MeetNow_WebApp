import * as React from 'react';
import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';

interface Location {
  lat: number;
  lng: number;
}

interface Meetup {
  id: string;
  location: Location;
  address: string;
  title?: string;
  description?: string;
  created_at: string;
  expires_at: string;
  status: 'active' | 'cancelled';
}

interface NearbyMeetupsProps {
  meetups: Meetup[];
  currentLocation: Location;
  currentMeetupId?: string;
  className?: string;
}

export function NearbyMeetups({
  meetups,
  currentLocation,
  currentMeetupId,
  className,
}: NearbyMeetupsProps) {
  const calculateDistance = (meetup: Meetup) => {
    const R = 6371; // Earth's radius in km
    const lat1 = currentLocation.lat * Math.PI / 180;
    const lat2 = meetup.location.lat * Math.PI / 180;
    const dLat = (meetup.location.lat - currentLocation.lat) * Math.PI / 180;
    const dLon = (meetup.location.lng - currentLocation.lng) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Card className={cn('bg-white/50 backdrop-blur-sm border border-white/20', className)}>
      <CardContent>
        <h3 className="text-lg font-semibold mb-4">Nearby Meetups</h3>
        <div className="space-y-4">
          {meetups.map((meetup) => (
            <div
              key={meetup.id}
              className={cn(
                'p-4 rounded-md border',
                meetup.id === currentMeetupId
                  ? 'bg-primary/10 border-primary'
                  : 'bg-white/80 border-gray-200'
              )}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{meetup.title || 'Instant Meetup'}</h4>
                  <p className="text-sm text-gray-600">{meetup.address}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {calculateDistance(meetup)} away
                </span>
              </div>
              {meetup.description && (
                <p className="mt-2 text-sm text-gray-700">{meetup.description}</p>
              )}
              <div className="mt-2 text-xs text-gray-500">
                Created at {formatTime(meetup.created_at)}
                {' • '}
                Expires at {formatTime(meetup.expires_at)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 