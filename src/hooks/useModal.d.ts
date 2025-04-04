export interface IModalOptions {
    initialState?: boolean;
    animationDuration?: number;
}
export interface IModalState {
    isOpen: boolean;
    isAnimating: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
    animationDuration: number;
}
declare const useModal: ({ initialState, animationDuration, }?: IModalOptions) => IModalState;
export default useModal;
