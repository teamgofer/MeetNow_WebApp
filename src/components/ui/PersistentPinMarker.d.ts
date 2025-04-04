export default PersistentPinMarker;
declare function PersistentPinMarker({ id, position, icon, popupContent, isVisible, zIndexOffset, eventHandlers, className, }: {
    id: any;
    position: any;
    icon: any;
    popupContent: any;
    isVisible?: boolean | undefined;
    zIndexOffset?: number | undefined;
    eventHandlers?: {} | undefined;
    className?: string | undefined;
}): import("react/jsx-runtime").JSX.Element | null;
declare namespace PersistentPinMarker {
    namespace propTypes {
        let id: PropTypes.Validator<string>;
        let position: PropTypes.Validator<NonNullable<NonNullable<PropTypes.InferProps<{
            lat: PropTypes.Validator<number>;
            lng: PropTypes.Validator<number>;
        }> | (number | null | undefined)[] | null | undefined>>>;
        let icon: PropTypes.Requireable<object>;
        let popupContent: PropTypes.Requireable<PropTypes.ReactNodeLike>;
        let isVisible: PropTypes.Requireable<boolean>;
        let zIndexOffset: PropTypes.Requireable<number>;
        let eventHandlers: PropTypes.Requireable<object>;
        let className: PropTypes.Requireable<string>;
    }
}
import PropTypes from 'prop-types';
