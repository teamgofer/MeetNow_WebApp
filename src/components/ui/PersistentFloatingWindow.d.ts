export default PersistentFloatingWindow;
declare function PersistentFloatingWindow({ id, children, className, style, isVisible, onClose, position, zIndex, }: {
    id: any;
    children: any;
    className?: string | undefined;
    style?: {} | undefined;
    isVisible?: boolean | undefined;
    onClose: any;
    position?: string | undefined;
    zIndex?: number | undefined;
}): import("react/jsx-runtime").JSX.Element | null;
declare namespace PersistentFloatingWindow {
    namespace propTypes {
        let id: PropTypes.Validator<string>;
        let children: PropTypes.Validator<NonNullable<PropTypes.ReactNodeLike>>;
        let className: PropTypes.Requireable<string>;
        let style: PropTypes.Requireable<object>;
        let isVisible: PropTypes.Requireable<boolean>;
        let onClose: PropTypes.Requireable<(...args: any[]) => any>;
        let position: PropTypes.Requireable<string>;
        let zIndex: PropTypes.Requireable<number>;
    }
}
import PropTypes from 'prop-types';
