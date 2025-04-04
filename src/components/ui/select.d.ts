import * as React from 'react';
export interface ISelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
}
declare const Select: React.ForwardRefExoticComponent<ISelectProps & React.RefAttributes<HTMLSelectElement>>;
export { Select };
