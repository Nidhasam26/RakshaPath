import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/hazard.dart';
import '../mock_data.dart';
import '../services/local_cache_service.dart';

/// Abstract hazard repository interface.
/// Covers PRD: A1, A2, A4 (Hazard collection and normalisation), B2 (Hazard pins)
abstract class HazardRepository {
  Future<List<Hazard>> getHazards({
    double? minLat,
    double? minLng,
    double? maxLat,
    double? maxLng,
    String? type,
    bool isOffline = false,
  });

  Future<Hazard?> getHazardById(String id);
}

/// Concrete mock repository with automatic local caching and offline retrieval.
class MockHazardRepository implements HazardRepository {
  final LocalCacheService _cacheService;
  List<Hazard> _inMemoryHazards;

  MockHazardRepository({LocalCacheService? cacheService})
      : _cacheService = cacheService ?? LocalCacheService(),
        _inMemoryHazards = List.from(MockData.sampleHazards);

  @override
  Future<List<Hazard>> getHazards({
    double? minLat,
    double? minLng,
    double? maxLat,
    double? maxLng,
    String? type,
    bool isOffline = false,
  }) async {
    if (isOffline) {
      // Offline mode: load strictly from persistent cache
      final cached = await _cacheService.getCachedHazards();
      if (cached == null) {
        return [];
      }
      return cached.hazards;
    }

    // Online mode: use in-memory / backend data and cache it
    final active = _inMemoryHazards.where((h) => h.isActive).toList();
    await _cacheService.saveHazards(active);
    return active;
  }

  @override
  Future<Hazard?> getHazardById(String id) async {
    try {
      return _inMemoryHazards.firstWhere((h) => h.id == id);
    } catch (_) {
      final cached = await _cacheService.getCachedHazards();
      if (cached != null) {
        try {
          return cached.hazards.firstWhere((h) => h.id == id);
        } catch (_) {}
      }
      return null;
    }
  }

  void addHazard(Hazard hazard) {
    _inMemoryHazards.add(hazard);
  }

  void setHazards(List<Hazard> hazards) {
    _inMemoryHazards = List.from(hazards);
  }
}

final hazardRepositoryProvider = Provider<HazardRepository>((ref) {
  final cacheService = ref.watch(localCacheServiceProvider);
  return MockHazardRepository(cacheService: cacheService);
});
