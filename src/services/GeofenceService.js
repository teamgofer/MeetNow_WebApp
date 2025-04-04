import { EventEmitter } from 'events';
import { LocationUtils } from '../features/proximity-chat/utils/LocationUtils';
export class GeofenceService extends EventEmitter {
    constructor() {
        super();
        this.geofences = new Map();
        this.dwellTimers = new Map();
        this.lastPosition = null;
    }
    addGeofence(geofence) {
        if (!this.geofences.has(geofence.id)) {
            this.geofences.set(geofence.id, geofence);
            if (this.lastPosition) {
                this.checkGeofence(geofence, this.lastPosition);
            }
        }
    }
    removeGeofence(id) {
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
    getActiveGeofences() {
        return Array.from(this.geofences.values());
    }
    updateLocation(position) {
        this.lastPosition = position;
        Array.from(this.geofences.values()).forEach(geofence => this.checkGeofence(geofence, position));
    }
    isInsideAnyGeofence(position) {
        return Array.from(this.geofences.values()).some(geofence => this.isInsideGeofence(position, geofence));
    }
    checkGeofence(geofence, position) {
        const wasInside = this.lastPosition
            ? this.isInsideGeofence(this.lastPosition, geofence)
            : false;
        const isInside = this.isInsideGeofence(position, geofence);
        if (isInside && !wasInside) {
            this.handleGeofenceEnter(geofence);
        }
        else if (!isInside && wasInside) {
            this.handleGeofenceExit(geofence);
        }
    }
    isInsideGeofence(position, geofence) {
        const distance = LocationUtils.calculateDistance(position.coords.latitude, position.coords.longitude, geofence.latitude, geofence.longitude);
        return distance <= geofence.radius;
    }
    handleGeofenceEnter(geofence) {
        this.emit('enter', { geofence });
        if (geofence.onEnter) {
            geofence.onEnter();
        }
        const timer = setTimeout(() => {
            this.handleGeofenceDwell(geofence);
        }, 5000);
        this.dwellTimers.set(geofence.id, timer);
    }
    handleGeofenceExit(geofence) {
        this.emit('exit', { geofence });
        if (geofence.onExit) {
            geofence.onExit();
        }
        const timer = this.dwellTimers.get(geofence.id);
        if (timer) {
            clearTimeout(timer);
            this.dwellTimers.delete(geofence.id);
        }
    }
    handleGeofenceDwell(geofence) {
        this.emit('dwell', { geofence, duration: 5000 });
        if (geofence.onDwell) {
            geofence.onDwell(5000);
        }
    }
    on(event, listener) {
        return super.on(event, listener);
    }
    emit(event, data) {
        return super.emit(event, data);
    }
}
//# sourceMappingURL=GeofenceService.js.map