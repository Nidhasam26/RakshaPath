import 'package:flutter_test/flutter_test.dart';
import 'package:rakshapath/data/services/local_cache_service.dart';
import 'package:rakshapath/models/hazard.dart';
import 'package:rakshapath/models/route_info.dart';
import 'package:rakshapath/state/map_state.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  group('Cache & Expiry Handling Tests', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({});
    });

    test('saves and loads hazards with savedAt timestamp', () async {
      final cacheService = LocalCacheService();
      final savedTime = DateTime(2026, 10, 15, 14, 30);

      final hazard = Hazard(
        id: 'haz_101',
        type: 'waterlogging',
        lat: 12.9250,
        lng: 77.6350,
        severity: 4,
        confidence: 0.9,
        source: 'TomTom',
        description: 'Severe water logging at junction',
        startTime: DateTime(2026, 10, 15, 14, 0),
        expiresAt: DateTime(2026, 10, 15, 18, 0),
      );

      await cacheService.saveHazards([hazard], savedAt: savedTime);

      // Verify cached retrieval
      final result = await cacheService.getCachedHazards(
        referenceTime: DateTime(2026, 10, 15, 15, 0), // before expiry
      );

      expect(result, isNotNull);
      expect(result!.hazards.length, 1);
      expect(result.hazards.first.id, 'haz_101');
      expect(result.savedAt, savedTime);
      expect(result.expiredCount, 0);
    });

    test('excludes expired hazards when loading from cache', () async {
      final cacheService = LocalCacheService();
      final now = DateTime(2026, 10, 15, 16, 0);

      final activeHazard = Hazard(
        id: 'haz_active',
        type: 'accident',
        lat: 12.9300,
        lng: 77.6200,
        severity: 3,
        confidence: 0.85,
        source: 'Police',
        description: 'Accident blocking left lane',
        expiresAt: DateTime(2026, 10, 15, 18, 0), // Future: active
      );

      final expiredHazard = Hazard(
        id: 'haz_expired',
        type: 'pothole',
        lat: 12.9100,
        lng: 77.6100,
        severity: 2,
        confidence: 0.7,
        source: 'Crowd',
        description: 'Temporary roadblock cleared',
        expiresAt: DateTime(2026, 10, 15, 14, 0), // Past: expired!
      );

      await cacheService.saveHazards([activeHazard, expiredHazard], savedAt: now);

      final result = await cacheService.getCachedHazards(referenceTime: now);

      expect(result, isNotNull);
      expect(result!.totalCount, 2);
      expect(result.expiredCount, 1);
      // Requirement 3: "Hazards past their expiry must not be shown as active."
      expect(result.hazards.length, 1);
      expect(result.hazards.first.id, 'haz_active');
      expect(result.hazards.any((h) => h.id == 'haz_expired'), isFalse);
    });

    test('returns null when no hazards or routes are cached', () async {
      final cacheService = LocalCacheService();
      final hazardsResult = await cacheService.getCachedHazards();
      final routeResult = await cacheService.getCachedRoute();

      expect(hazardsResult, isNull);
      expect(routeResult, isNull);
    });

    test('saves and retrieves route info with savedAt timestamp', () async {
      final cacheService = LocalCacheService();
      final savedTime = DateTime(2026, 10, 15, 10, 15);

      const route = RouteInfo(
        routeId: 'rt_cached_01',
        originName: 'Indiranagar',
        destinationName: 'MG Road',
        distanceKm: 5.4,
        durationMinutes: 18,
        safetyScore: 8.2,
        scoreBreakdown: {'Base': 10.0, 'Hazard': -1.8},
        primaryCoordinates: [
          [77.6400, 12.9780],
          [77.6080, 12.9750],
        ],
      );

      await cacheService.saveRoute(route, savedAt: savedTime);

      final result = await cacheService.getCachedRoute();
      expect(result, isNotNull);
      expect(result!.route.routeId, 'rt_cached_01');
      expect(result.route.safetyScore, 8.2);
      expect(result.savedAt, savedTime);
    });

    test('formats savedAt timestamp correctly for outdated cache label', () {
      final time = DateTime(2026, 10, 15, 9, 5);
      final formatted = MapNotifier.formatSavedAt(time);
      expect(formatted, '15/10 09:05');
    });
  });
}
