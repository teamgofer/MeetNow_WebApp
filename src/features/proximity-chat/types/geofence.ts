/**
 * Represents a geofence with a circular boundary
 */
export interface IGeofence {
  /** Unique identifier for the geofence */
  id: string;
  /** Display name for the geofence */
  name: string;
  /** Center latitude of the geofence */
  latitude: number;
  /** Center longitude of the geofence */
  longitude: number;
  /** Radius of the geofence in meters */
  radius: number;
  /** Optional callback when entering the geofence */
  onEnter?: () => void;
  /** Optional callback when exiting the geofence */
  onExit?: () => void;
  /** Optional callback when dwelling in the geofence */
  onDwell?: (duration: number) => void;
}
