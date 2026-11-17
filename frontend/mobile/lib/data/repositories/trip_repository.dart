import '../../models/route_info.dart';

/// Abstract trip and routing repository interface.
/// Covers PRD: B1 (Draw route), B5 (Alternate road), B6 (Safety score), C1, C2 (Trip tracking)
/// TODO: Implement concrete repository with OSRM and backend trip lifecycle endpoints.
abstract class TripRepository {
  Future<RouteInfo> getRoute({
    required double startLat,
    required double startLng,
    required double destLat,
    required double destLng,
    bool calculateAlternate = true,
  });

  Future<String> startTrip({
    required String userId,
    required String routeId,
    required String pushToken,
    required double originLat,
    required double originLng,
    required double destLat,
    required double destLng,
  });

  Future<void> updateTripLocation({
    required String tripId,
    required double lat,
    required double lng,
    double? speedMps,
  });

  Future<void> endTrip(String tripId);
}
