export default MultipleMeetupsAlert;
export function SingleMeetupAlert({ meetup, onDismiss, onJoin, className }: {
    meetup: any;
    onDismiss: any;
    onJoin: any;
    className?: string | undefined;
}): import("react/jsx-runtime").JSX.Element | null;
export namespace SingleMeetupAlert {
    namespace propTypes {
        let meetup: PropTypes.Requireable<PropTypes.InferProps<{
            id: PropTypes.Validator<string>;
            title: PropTypes.Validator<string>;
            location: PropTypes.Requireable<PropTypes.InferProps<{
                display_name: PropTypes.Requireable<string>;
            }>>;
            start_time: PropTypes.Validator<string>;
        }>>;
        let onDismiss: PropTypes.Requireable<(...args: any[]) => any>;
        let onJoin: PropTypes.Requireable<(...args: any[]) => any>;
        let className: PropTypes.Requireable<string>;
    }
}
export function MultipleMeetupsAlert({ meetups, onView, onClose, autoHideAfter, }: {
    meetups?: never[] | undefined;
    onView: any;
    onClose: any;
    autoHideAfter?: number | undefined;
}): import("react/jsx-runtime").JSX.Element | null;
export namespace MultipleMeetupsAlert {
    export namespace propTypes_1 {
        let meetups: PropTypes.Requireable<(PropTypes.InferProps<{
            id: PropTypes.Validator<string>;
            title: PropTypes.Validator<string>;
            location: PropTypes.Requireable<PropTypes.InferProps<{
                display_name: PropTypes.Requireable<string>;
            }>>;
            distance_meters: PropTypes.Requireable<number>;
            distance_formatted: PropTypes.Requireable<string>;
            start_time: PropTypes.Validator<string>;
        }> | null | undefined)[]>;
        let onView: PropTypes.Requireable<(...args: any[]) => any>;
        let onClose: PropTypes.Requireable<(...args: any[]) => any>;
        let autoHideAfter: PropTypes.Requireable<number>;
    }
    export { propTypes_1 as propTypes };
}
import PropTypes from 'prop-types';
