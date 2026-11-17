import 'package:geolocator/geolocator.dart';
import '../../core/constants.dart';

class LocationResult {
  final double lat;
  final double lng;
  final String statusDescription;
  final bool isPermissionGranted;
  final bool isFallback;

  const LocationResult({
    required this.lat,
    required this.lng,
    required this.statusDescription,
    required this.isPermissionGranted,
    required this.isFallback,
  });
}

/// Service managing GPS and location permissions with honest fallback reporting.
/// Requirement 8: "request location only when needed, with a clear reason.
/// If denied, show a clear message and use the last known location."
class LocationService {
  final Future<Position?> Function()? getCurrentPositionOverride;
  final Future<Position?> Function()? getLastKnownPositionOverride;

  LocationService({
    this.getCurrentPositionOverride,
    this.getLastKnownPositionOverride,
  });

  Future<LocationResult> acquireEmergencyLocation({
    void Function(String message)? onStatusMessage,
  }) async {
    try {
      if (getCurrentPositionOverride != null) {
        final pos = await getCurrentPositionOverride!();
        if (pos != null) {
          return LocationResult(
            lat: pos.latitude,
            lng: pos.longitude,
            statusDescription: 'GPS lock acquired (${pos.latitude.toStringAsFixed(4)}, ${pos.longitude.toStringAsFixed(4)})',
            isPermissionGranted: true,
            isFallback: false,
          );
        }
      }

      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        onStatusMessage?.call('Device GPS is disabled. Attempting to use last known fix.');
        final last = await _getLastKnownOrFallback();
        return LocationResult(
          lat: last.lat,
          lng: last.lng,
          statusDescription: 'GPS disabled. Using last known fix (${last.lat.toStringAsFixed(4)}, ${last.lng.toStringAsFixed(4)})',
          isPermissionGranted: false,
          isFallback: true,
        );
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        onStatusMessage?.call('Requesting location permission to share exact GPS coordinates with emergency responders.');
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        onStatusMessage?.call('Location permission denied. Using last known fix.');
        final last = await _getLastKnownOrFallback();
        return LocationResult(
          lat: last.lat,
          lng: last.lng,
          statusDescription: 'Permission denied. Using last known fix (${last.lat.toStringAsFixed(4)}, ${last.lng.toStringAsFixed(4)})',
          isPermissionGranted: false,
          isFallback: true,
        );
      }

      // Permission granted - obtain current GPS fix (works offline without internet!)
      try {
        final position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            timeLimit: Duration(seconds: 4),
          ),
        );
        return LocationResult(
          lat: position.latitude,
          lng: position.longitude,
          statusDescription: 'GPS lock acquired (${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)})',
          isPermissionGranted: true,
          isFallback: false,
        );
      } catch (_) {
        // Timeout or signal lost: fall back to last known fix
        final last = await _getLastKnownOrFallback();
        return LocationResult(
          lat: last.lat,
          lng: last.lng,
          statusDescription: 'Using last known GPS fix (${last.lat.toStringAsFixed(4)}, ${last.lng.toStringAsFixed(4)})',
          isPermissionGranted: true,
          isFallback: true,
        );
      }
    } catch (_) {
      // In tests or headless environments where platform channel is absent
      return const LocationResult(
        lat: AppConstants.defaultLat,
        lng: AppConstants.defaultLng,
        statusDescription: 'Reference coordinates (${AppConstants.defaultLat}, ${AppConstants.defaultLng})',
        isPermissionGranted: false,
        isFallback: true,
      );
    }
  }

  Future<({double lat, double lng})> _getLastKnownOrFallback() async {
    try {
      if (getLastKnownPositionOverride != null) {
        final pos = await getLastKnownPositionOverride!();
        if (pos != null) {
          return (lat: pos.latitude, lng: pos.longitude);
        }
      }
      final lastPos = await Geolocator.getLastKnownPosition();
      if (lastPos != null) {
        return (lat: lastPos.latitude, lng: lastPos.longitude);
      }
    } catch (_) {}
    return (lat: AppConstants.defaultLat, lng: AppConstants.defaultLng);
  }
}
