import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/mock_data.dart';
import '../data/repositories/hazard_repository.dart';
import '../data/services/local_cache_service.dart';
import '../models/hazard.dart';
import '../models/route_info.dart';
import 'connectivity_state.dart';

/// Riverpod state data model for map rendering, hazards, and offline cache notice.
/// Requirement 3: "save the last hazards and route with a saved-at time.
/// When offline, show them with a 'Last updated [time], may be outdated' label.
/// If nothing is cached, say so clearly. Hazards past their expiry must not be shown as active."
class MapState {
  final bool isLoading;
  final List<Hazard> hazards;
  final RouteInfo? activeRoute;
  final Hazard? selectedHazard;
  final bool isOffline;
  final DateTime? savedAt;
  final String? cachedStatusMessage;
  final bool hasCachedData;

  const MapState({
    this.isLoading = false,
    this.hazards = const [],
    this.activeRoute,
    this.selectedHazard,
    this.isOffline = false,
    this.savedAt,
    this.cachedStatusMessage,
    this.hasCachedData = false,
  });

  MapState copyWith({
    bool? isLoading,
    List<Hazard>? hazards,
    RouteInfo? activeRoute,
    Hazard? selectedHazard,
    bool? isOffline,
    DateTime? savedAt,
    String? cachedStatusMessage,
    bool? hasCachedData,
    bool clearSelected = false,
  }) {
    return MapState(
      isLoading: isLoading ?? this.isLoading,
      hazards: hazards ?? this.hazards,
      activeRoute: activeRoute ?? this.activeRoute,
      selectedHazard: clearSelected ? null : (selectedHazard ?? this.selectedHazard),
      isOffline: isOffline ?? this.isOffline,
      savedAt: savedAt ?? this.savedAt,
      cachedStatusMessage: cachedStatusMessage ?? this.cachedStatusMessage,
      hasCachedData: hasCachedData ?? this.hasCachedData,
    );
  }
}

class MapNotifier extends Notifier<MapState> {
  @override
  MapState build() {
    // Listen to connectivity changes to trigger automatic reload
    ref.listen<ConnectivityState>(connectivityProvider, (previous, next) {
      if (previous?.status != next.status) {
        loadMapData(isOffline: next.isOffline);
      }
    });

    final initialOffline = ref.read(connectivityProvider).isOffline;
    Future.microtask(() => loadMapData(isOffline: initialOffline));
    return const MapState(isLoading: true);
  }

  /// Formats the savedAt timestamp into human-readable representation.
  static String formatSavedAt(DateTime time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final min = time.minute.toString().padLeft(2, '0');
    final m = time.month.toString().padLeft(2, '0');
    final d = time.day.toString().padLeft(2, '0');
    return '$d/$m $hour:$min';
  }

  Future<void> loadMapData({required bool isOffline}) async {
    state = state.copyWith(isLoading: true, isOffline: isOffline);
    final cacheService = ref.read(localCacheServiceProvider);
    final hazardRepo = ref.read(hazardRepositoryProvider);

    if (isOffline) {
      // 1. Offline Mode: Fetch cached hazards and route
      final cachedHazards = await cacheService.getCachedHazards();
      final cachedRoute = await cacheService.getCachedRoute();
      if (!ref.mounted) return;

      if (cachedHazards == null && cachedRoute == null) {
        state = const MapState(
          isLoading: false,
          isOffline: true,
          hazards: [],
          activeRoute: null,
          hasCachedData: false,
          cachedStatusMessage: 'No cached hazards or routes available offline.',
        );
        return;
      }

      final effectiveTime = cachedHazards?.savedAt ?? cachedRoute?.savedAt ?? DateTime.now();
      final timeStr = formatSavedAt(effectiveTime);
      final hazardsList = cachedHazards?.hazards ?? const <Hazard>[];

      state = MapState(
        isLoading: false,
        isOffline: true,
        hazards: hazardsList,
        activeRoute: cachedRoute?.route,
        savedAt: effectiveTime,
        hasCachedData: true,
        cachedStatusMessage: 'Last updated $timeStr, may be outdated',
      );
    } else {
      // 2. Online Mode: Load live/mock data and refresh persistent cache
      final fetchedHazards = await hazardRepo.getHazards();
      const defaultRoute = MockData.sampleRoute;

      // Save to local cache with current time
      final now = DateTime.now();
      await cacheService.saveHazards(fetchedHazards, savedAt: now);
      await cacheService.saveRoute(defaultRoute, savedAt: now);
      if (!ref.mounted) return;

      state = MapState(
        isLoading: false,
        isOffline: false,
        hazards: fetchedHazards,
        activeRoute: defaultRoute,
        savedAt: now,
        hasCachedData: true,
        cachedStatusMessage: null,
      );
    }
  }

  void selectHazard(Hazard? hazard) {
    state = state.copyWith(selectedHazard: hazard, clearSelected: hazard == null);
  }
}

final mapProvider = NotifierProvider<MapNotifier, MapState>(MapNotifier.new);
