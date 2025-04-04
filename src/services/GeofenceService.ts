import { EventEmitter } from 'events';

import type { Geofence } from '../features/proximity-chat/types/geofence';
import type { GeolocationPosition } from '../features/proximity-chat/types/geolocation';
import { LocationUtils } from '../features/proximity-chat/utils/LocationUtils';

interface IGeofenceEventMap {
  enter: { geofence: Geofence };
  exit: { geofence: Geofence };
  dwell: { geofence: Geofence; duration: number };
}

export class GeofenceService extends EventEmitter {
  private geofences: Map<string, Geofence> = new Map();
  private dwellTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastPosition: GeolocationPosition | null = null;

  constructor() {
    super();
  }

  addGeofence(geofence: Geofence): void {
    if (!this.geofences.has(geofence.id)) {
      this.geofences.set(geofence.id, geofence);
      if (this.lastPosition) {
        this.checkGeofence(geofence, this.lastPosition);
      }
    }
  }

  removeGeofence(id: string): void {
    const geofence = this.geofences.get(id);
    if (geofence) {
      this.geofences.delete(id);
      const timer = this.dwellTimers.get(id);
      if (timer) {
        clearTimeout(timer);
        this.dwellTimers.delete(id);
      }
    }
  }

  getActiveGeofences(): Geofence[] {
    return Array.from(this.geofences.values());
  }

  updateLocation(position: GeolocationPosition): void {
    this.lastPosition = position;
    Array.from(this.geofences.values()).forEach(geofence => this.checkGeofence(geofence, position));
  }

  isInsideAnyGeofence(position: GeolocationPosition): boolean {
    return Array.from(this.geofences.values()).some(geofence =>
      this.isInsideGeofence(position, geofence)
    );
  }

  private checkGeofence(geofence: Geofence, position: GeolocationPosition): void {
    const wasInside = this.lastPosition
      ? this.isInsideGeofence(this.lastPosition, geofence)
      : false;
    const isInside = this.isInsideGeofence(position, geofence);

    if (isInside && !wasInside) {
      this.handleGeofenceEnter(geofence);
    } else if (!isInside && wasInside) {
      this.handleGeofenceExit(geofence);
    }
  }

  private isInsideGeofence(position: GeolocationPosition, geofence: Geofence): boolean {
    const distance = LocationUtils.calculateDistance(
      position.coords.latitude,
      position.coords.longitude,
      geofence.latitude,
      geofence.longitude
    );
    return distance <= geofence.radius;
  }

  private handleGeofenceEnter(geofence: Geofence): void {
    this.emit('enter', { geofence });
    if (geofence.onEnter) {
      geofence.onEnter();
    }

    // Start dwell timer
    const timer = setTimeout(() => {
      this.handleGeofenceDwell(geofence);
    }, 5000); // Default dwell time of 5 seconds

    this.dwellTimers.set(geofence.id, timer);
  }

  private handleGeofenceExit(geofence: Geofence): void {
    this.emit('exit', { geofence });
    if (geofence.onExit) {
      geofence.onExit();
    }

    // Clear dwell timer
    const timer = this.dwellTimers.get(geofence.id);
    if (timer) {
      clearTimeout(timer);
      this.dwellTimers.delete(geofence.id);
    }
  }

  private handleGeofenceDwell(geofence: Geofence): void {
    this.emit('dwell', { geofence, duration: 5000 });
    if (geofence.onDwell) {
      geofence.onDwell(5000);
    }
  }

  // Type-safe event emitter methods
  on<K extends keyof GeofenceEventMap>(
    event: K,
    listener: (data: GeofenceEventMap[K]) => void
  ): this {
    return super.on(event, listener);
  }

  emit<K extends keyof GeofenceEventMap>(event: K, data: GeofenceEventMap[K]): boolean {
    return super.emit(event, data);
  }
}
