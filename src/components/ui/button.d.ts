import type { ButtonHTMLAttributes } from 'react';
export interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}
declare const Button: import("react").ForwardRefExoticComponent<IButtonProps & import("react").RefAttributes<HTMLButtonElement>>;
export { Button };
