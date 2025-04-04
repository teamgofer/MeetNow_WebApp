import React from 'react';
import type { ILocationStats } from '@/types/location';
interface LocationStatsProps {
  stats: ILocationStats;
  className?: string;
}
declare const LocationStats: React.FC<LocationStatsProps>;
export default LocationStats;
