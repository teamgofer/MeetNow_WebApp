import * as React from 'react';
export interface IInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
}
declare const Input: React.ForwardRefExoticComponent<IInputProps & React.RefAttributes<HTMLInputElement>>;
export { Input };
