import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { CountdownDisplay } from './';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './card';
import { ChevronUp, ChevronDown, Palette, Clock } from 'lucide-react';
import MeetupListItem, { IMeetup, ILocation } from './MeetupListItem';

interface INearbyMeetupsProps {
  meetups: IMeetup[];
  currentLocation: ILocation;
  currentMeetupId?: string | undefined;
  className?: string;
  onMeetupSelect?: (id: string) => void;
  useStopwatch?: boolean;
}

type ColorScheme = 'A' | 'B';
type PanelState = 'closed' | 'half-open' | 'full-open';

const colorSchemes = {
  A: {
    background: 'from-indigo-50 via-purple-50/90 to-pink-50/80',
    hover: 'from-indigo-100/30 via-purple-100/20 to-pink-100/30',
    shimmer: 'from-indigo-200/0 via-purple-200/20 to-pink-200/0',
    text: {
      primary: 'text-indigo-900',
      secondary: 'text-purple-700/70',
      hover: 'text-purple-600',
      accent: 'text-indigo-600',
    },
    gradients: {
      badge: 'from-indigo-200 via-purple-200 to-pink-200',
      item: 'from-indigo-100 via-purple-100 to-pink-100',
      hover: 'from-indigo-200 group-hover:via-purple-200 group-hover:to-pink-200',
    },
    scrollbar: 'scrollbar-thumb-purple-200',
  },
  B: {
    background: 'from-emerald-50 via-orange-50/90 to-rose-50/80',
    hover: 'from-emerald-100/30 via-orange-100/20 to-rose-100/30',
    shimmer: 'from-emerald-200/0 via-orange-200/20 to-rose-200/0',
    text: {
      primary: 'text-emerald-900',
      secondary: 'text-orange-700/70',
      hover: 'text-orange-600',
      accent: 'text-emerald-600',
    },
    gradients: {
      badge: 'from-emerald-200 via-orange-200 to-rose-200',
      item: 'from-emerald-100 via-orange-100 to-rose-100',
      hover: 'from-emerald-200 group-hover:via-orange-200 group-hover:to-rose-200',
    },
    scrollbar: 'scrollbar-thumb-orange-200',
  },
};

export function NearbyMeetups({
  meetups,
  currentLocation,
  currentMeetupId,
  className,
  onMeetupSelect,
  useStopwatch = true,
}: INearbyMeetupsProps) {
  const [panelState, setPanelState] = useState<PanelState>('closed');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('A');
  const [useStopwatchDisplay, setUseStopwatchDisplay] = useState<boolean>(useStopwatch);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const isOpen = panelState !== 'closed';

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [meetups, isOpen]);

  const calculateDistance = (meetup: IMeetup) => {
    const R = 6371; // Earth's radius in km
    const lat1 = (currentLocation.lat * Math.PI) / 180;
    const lat2 = (meetup.location.lat * Math.PI) / 180;
    const dLat = ((meetup.location.lat - currentLocation.lat) * Math.PI) / 180;
    const dLon = ((meetup.location.lng - currentLocation.lng) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  const getLocationName = (address: string) => {
    return address.split(',')[0];
  };

  const handleMeetupClick = (id: string) => {
    if (onMeetupSelect) {
      onMeetupSelect(id);
    }
  };

  const toggleWithArrow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPanelState(prev => prev === 'closed' ? 'half-open' : 'closed');
  };

  const handleTitleClick = () => {
    setPanelState(prev => prev === 'full-open' ? 'closed' : 'full-open');
  };

  const toggleColorScheme = () => {
    setColorScheme(prev => (prev === 'A' ? 'B' : 'A'));
  };

  const toggleStopwatchDisplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUseStopwatchDisplay(prev => !prev);
  };

  const colors = colorSchemes[colorScheme];

  const handleMeetupSelect = (id: string) => {
    if (onMeetupSelect) {
      onMeetupSelect(id);
    }
  };

  const handleMeetupHover = (id: string | null) => {
    setHoveredId(id);
  };

  return (
    <Card
      className={cn(
        `bg-gradient-to-br ${colors.background} backdrop-blur-sm border-none overflow-hidden`,
        'shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.8),_inset_2px_2px_4px_rgba(0,0,0,0.1)]',
        'rounded-2xl',
        'transition-all duration-500 ease-in-out',
        'hover:shadow-[inset_-3px_-3px_6px_rgba(255,255,255,0.8),_inset_3px_3px_6px_rgba(0,0,0,0.1)]',
        `animate-gradient-x bg-gradient-to-r ${colors.background} bg-[length:200%_200%]`,
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3',
          'border-b border-gray-200/30',
          `hover:bg-gradient-to-r ${colors.hover} transition-all duration-500`,
          'shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)]',
          'active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]',
          'relative overflow-hidden group'
        )}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-r ${colors.shimmer} opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%]`}
        ></div>
        <h3 
          className={`font-semibold text-base flex items-center ${colors.text.primary} relative cursor-pointer`}
          onClick={handleTitleClick}
        >
          Nearby Meetups
          {meetups.length > 0 && (
            <span
              className={`ml-2 bg-gradient-to-r ${colors.gradients.badge} px-2.5 py-0.5 rounded-full text-sm font-medium ${colors.text.primary} shadow-sm animate-pulse`}
            >
              {meetups.length}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleStopwatchDisplay}
            className={`p-1 rounded-full hover:bg-white/50 transition-colors ${useStopwatchDisplay ? colors.text.accent : 'text-gray-400'}`}
            title={`${useStopwatchDisplay ? 'Switch to basic timer' : 'Switch to stopwatch timer'}`}
          >
            <Clock size={16} />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              toggleColorScheme();
            }}
            className="p-1 rounded-full hover:bg-white/50 transition-colors"
            title={`Switch to ${colorScheme === 'A' ? 'Scheme B' : 'Scheme A'}`}
          >
            <Palette size={16} className={colors.text.accent} />
          </button>
          <button
            onClick={toggleWithArrow}
            className={cn(
              `${colors.text.hover} transition-all duration-500 cursor-pointer`,
              isOpen ? '' : 'transform rotate-180'
            )}
          >
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      <div
        ref={contentRef}
        className={cn(
          'transition-all duration-500 ease-in-out overflow-hidden',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          maxHeight: isOpen 
            ? (panelState === 'full-open' 
                ? 'calc(100vh - 120px)'
                : (contentHeight ? `${contentHeight}px` : '300px')) 
            : '0px',
        }}
      >
        <CardContent className="p-3">
          <div
            className={`overflow-y-auto space-y-2 pr-1 ${panelState === 'full-open' ? 'max-h-[calc(100vh-150px)]' : 'max-h-[400px]'} scrollbar-thin ${colors.scrollbar} scrollbar-track-transparent`}
          >
            {meetups.map(meetup => (
              <MeetupListItem
                key={meetup.id}
                meetup={meetup}
                currentLocation={currentLocation}
                isSelected={meetup.id === currentMeetupId}
                colorScheme={colorScheme}
                onSelect={handleMeetupSelect}
                onHover={handleMeetupHover}
                useStopwatch={useStopwatchDisplay}
              />
            ))}
            
            {meetups.length === 0 && (
              <div className={`p-4 text-center text-sm ${colors.text.secondary}`}>
                No meetups nearby at the moment.
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
