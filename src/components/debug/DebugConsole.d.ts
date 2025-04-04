export default DebugConsole;
declare function DebugConsole({ isVisible, className, mapRef, mapNavigator, userLocation, selectedLocation, onNavigationTest, }: {
    isVisible?: boolean | undefined;
    className?: string | undefined;
    mapRef: any;
    mapNavigator: any;
    userLocation: any;
    selectedLocation: any;
    onNavigationTest: any;
}): import("react/jsx-runtime").JSX.Element | null;
declare namespace DebugConsole {
    namespace propTypes {
        let isVisible: PropTypes.Requireable<boolean>;
        let className: PropTypes.Requireable<string>;
        let mapRef: PropTypes.Requireable<object>;
        let mapNavigator: PropTypes.Requireable<object>;
        let userLocation: PropTypes.Requireable<PropTypes.InferProps<{
            lat: PropTypes.Requireable<number>;
            lng: PropTypes.Requireable<number>;
        }>>;
        let selectedLocation: PropTypes.Requireable<PropTypes.InferProps<{
            lat: PropTypes.Requireable<number>;
            lng: PropTypes.Requireable<number>;
        }>>;
        let onNavigationTest: PropTypes.Requireable<(...args: any[]) => any>;
    }
}
import PropTypes from 'prop-types';
