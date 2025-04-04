import { EventEmitter } from 'events';
import { LocationUtils } from '../utils/LocationUtils';
export class GeofenceService extends EventEmitter {
    constructor() {
        super(...arguments);
        this.geofences = new Map();
        this.activeGeofences = new Set();
        this.dwellStartTimes = new Map();
    }
    addGeofence(geofence) {
        this.geofences.set(geofence.id, geofence);
    }
    removeGeofence(id) {
        this.geofences.delete(id);
        this.activeGeofences.delete(id);
        this.dwellStartTimes.delete(id);
    }
    updateLocation(latitude, longitude) {
        for (const geofence of this.geofences.values()) {
            const distance = LocationUtils.calculateDistance(latitude, longitude, geofence.latitude, geofence.longitude);
            if (distance <= geofence.radius) {
                this._handleEnter(geofence);
            }
            else {
                this._handleExit(geofence);
            }
        }
    }
    getActiveGeofences() {
        return Array.from(this.activeGeofences).map(id => this.geofences.get(id));
    }
    isInsideAnyGeofence(latitude, longitude) {
        for (const geofence of this.geofences.values()) {
            const distance = LocationUtils.calculateDistance(latitude, longitude, geofence.latitude, geofence.longitude);
            if (distance <= geofence.radius) {
                return true;
            }
        }
        return false;
    }
    onEnter(callback) {
        this.on('enter', callback);
        return () => this.off('enter', callback);
    }
    onExit(callback) {
        this.on('exit', callback);
        return () => this.off('exit', callback);
    }
    onDwell(callback) {
        this.on('dwell', callback);
        return () => this.off('dwell', callback);
    }
    _handleEnter(geofence) {
        if (!this.activeGeofences.has(geofence.id)) {
            this.activeGeofences.add(geofence.id);
            this.dwellStartTimes.set(geofence.id, Date.now());
            this.emit('enter', { geofence });
            geofence.onEnter?.();
        }
    }
    _handleExit(geofence) {
        if (this.activeGeofences.has(geofence.id)) {
            const startTime = this.dwellStartTimes.get(geofence.id);
            if (startTime) {
                const duration = Date.now() - startTime;
                this.emit('dwell', { geofence, duration });
                geofence.onDwell?.(duration);
            }
            this.activeGeofences.delete(geofence.id);
            this.dwellStartTimes.delete(geofence.id);
            this.emit('exit', { geofence });
            geofence.onExit?.();
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