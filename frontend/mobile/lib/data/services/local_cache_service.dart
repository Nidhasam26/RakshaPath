import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../models/hazard.dart';
import '../../models/route_info.dart';
import '../../models/sos_queue_item.dart';

/// Riverpod provider for LocalCacheService.
final localCacheServiceProvider = Provider<LocalCacheService>((ref) {
  return LocalCacheService();
});

class CachedHazardsResult {
  final List<Hazard> hazards;
  final int totalCount;
  final int expiredCount;
  final DateTime savedAt;

  const CachedHazardsResult({
    required this.hazards,
    required this.totalCount,
    required this.expiredCount,
    required this.savedAt,
  });
}

class CachedRouteResult {
  final RouteInfo route;
  final DateTime savedAt;

  const CachedRouteResult({
    required this.route,
    required this.savedAt,
  });
}

/// Service providing persistent local caching for hazards, routes, and offline SOS queue.
/// Uses SharedPreferences for persistent local storage.
class LocalCacheService {
  static const String _keyHazards = 'rakshapath_cached_hazards';
  static const String _keyHazardsSavedAt = 'rakshapath_cached_hazards_saved_at';
  static const String _keyRoute = 'rakshapath_cached_route';
  static const String _keyRouteSavedAt = 'rakshapath_cached_route_saved_at';
  static const String _keySosQueue = 'rakshapath_sos_queue';

  final SharedPreferences? _prefs;

  LocalCacheService([this._prefs]);

  Future<SharedPreferences> _getPrefs() async {
    return _prefs ?? await SharedPreferences.getInstance();
  }

  // ==================== HAZARD CACHE ====================

  /// Saves the active hazards list and records the saved-at timestamp.
  Future<void> saveHazards(List<Hazard> hazards, {DateTime? savedAt}) async {
    final prefs = await _getPrefs();
    final time = savedAt ?? DateTime.now();
    final encoded = jsonEncode(hazards.map((h) => h.toJson()).toList());
    await prefs.setString(_keyHazards, encoded);
    await prefs.setString(_keyHazardsSavedAt, time.toIso8601String());
  }

  /// Retrieves cached hazards, excluding expired hazards.
  /// If no cache exists, returns null.
  Future<CachedHazardsResult?> getCachedHazards({DateTime? referenceTime}) async {
    final prefs = await _getPrefs();
    final rawJson = prefs.getString(_keyHazards);
    final rawSavedAt = prefs.getString(_keyHazardsSavedAt);

    if (rawJson == null || rawSavedAt == null) {
      return null;
    }

    try {
      final savedAt = DateTime.parse(rawSavedAt);
      final list = jsonDecode(rawJson) as List;
      final allHazards = list.map((item) => Hazard.fromJson(item as Map<String, dynamic>)).toList();

      final now = referenceTime ?? DateTime.now();
      final activeHazards = allHazards.where((h) {
        if (h.expiresAt != null && now.isAfter(h.expiresAt!)) {
          return false; // Exclude expired hazards
        }
        return true;
      }).toList();

      return CachedHazardsResult(
        hazards: activeHazards,
        totalCount: allHazards.length,
        expiredCount: allHazards.length - activeHazards.length,
        savedAt: savedAt,
      );
    } catch (_) {
      return null;
    }
  }

  // ==================== ROUTE CACHE ====================

  /// Saves the active route and records the saved-at timestamp.
  Future<void> saveRoute(RouteInfo route, {DateTime? savedAt}) async {
    final prefs = await _getPrefs();
    final time = savedAt ?? DateTime.now();
    final encoded = jsonEncode(route.toJson());
    await prefs.setString(_keyRoute, encoded);
    await prefs.setString(_keyRouteSavedAt, time.toIso8601String());
  }

  /// Retrieves cached route. If none is cached, returns null.
  Future<CachedRouteResult?> getCachedRoute() async {
    final prefs = await _getPrefs();
    final rawJson = prefs.getString(_keyRoute);
    final rawSavedAt = prefs.getString(_keyRouteSavedAt);

    if (rawJson == null || rawSavedAt == null) {
      return null;
    }

    try {
      final savedAt = DateTime.parse(rawSavedAt);
      final map = jsonDecode(rawJson) as Map<String, dynamic>;
      final route = RouteInfo.fromJson(map);
      return CachedRouteResult(route: route, savedAt: savedAt);
    } catch (_) {
      return null;
    }
  }

  // ==================== SOS QUEUE ====================

  /// Retrieves all queued SOS items.
  Future<List<SosQueueItem>> getSosQueue() async {
    final prefs = await _getPrefs();
    final rawJson = prefs.getString(_keySosQueue);
    if (rawJson == null || rawJson.isEmpty) {
      return [];
    }

    try {
      final list = jsonDecode(rawJson) as List;
      return list.map((e) => SosQueueItem.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  /// Adds a new SOS item to the queue.
  /// Never deletes pending items silently.
  Future<void> enqueueSos(SosQueueItem item) async {
    final prefs = await _getPrefs();
    final queue = await getSosQueue();
    // Prepend or append to list
    final updated = [...queue, item];
    final encoded = jsonEncode(updated.map((e) => e.toJson()).toList());
    await prefs.setString(_keySosQueue, encoded);
  }

  /// Updates the status of an existing queued SOS item.
  Future<void> updateSosStatus(String id, String newStatus, {DateTime? syncedAt}) async {
    final prefs = await _getPrefs();
    final queue = await getSosQueue();
    final updated = queue.map((item) {
      if (item.id == id) {
        return item.copyWith(
          status: newStatus,
          syncedAt: syncedAt ?? item.syncedAt,
        );
      }
      return item;
    }).toList();

    final encoded = jsonEncode(updated.map((e) => e.toJson()).toList());
    await prefs.setString(_keySosQueue, encoded);
  }

  /// Marks all pending/sms_opened items in the queue as synced.
  Future<int> markAllPendingSynced({DateTime? syncedAt}) async {
    final prefs = await _getPrefs();
    final queue = await getSosQueue();
    final time = syncedAt ?? DateTime.now();
    var syncedCount = 0;

    final updated = queue.map((item) {
      if (item.status != 'synced') {
        syncedCount++;
        return item.copyWith(status: 'synced', syncedAt: time);
      }
      return item;
    }).toList();

    final encoded = jsonEncode(updated.map((e) => e.toJson()).toList());
    await prefs.setString(_keySosQueue, encoded);
    return syncedCount;
  }

  /// Returns the number of unsynced alerts currently in the queue.
  Future<int> getUnsyncedCount() async {
    final queue = await getSosQueue();
    return queue.where((item) => item.status != 'synced').length;
  }

  /// Clears only cache (does not delete pending SOS queue).
  Future<void> clearCache() async {
    final prefs = await _getPrefs();
    await prefs.remove(_keyHazards);
    await prefs.remove(_keyHazardsSavedAt);
    await prefs.remove(_keyRoute);
    await prefs.remove(_keyRouteSavedAt);
  }
}
