import { ReactNode } from 'react';
export interface IUIStateContext {
    isLocationSearchOpen: boolean;
    openLocationSearch: () => void;
    closeLocationSearch: () => void;
}
export interface IUIStateProviderProps {
    children: ReactNode;
}
export declare function UIStateProvider({ children }: IUIStateProviderProps): JSX.Element;
export declare function useUIState(): IUIStateContext;
export default useUIState;
