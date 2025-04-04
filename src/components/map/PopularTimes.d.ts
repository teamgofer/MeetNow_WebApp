import React from 'react';
interface IPopularTime {
  dayOfWeek: number;
  hour: number;
  count: number;
}
interface IPopularTimesProps {
  popularTimes: IPopularTime[];
  className?: string;
}
declare const PopularTimes: React.FC<IPopularTimesProps>;
export default PopularTimes;
