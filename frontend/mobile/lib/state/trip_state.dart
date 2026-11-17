import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/route_info.dart';

/// Riverpod state management for active trip lifecycle and proximity warnings.
/// Covers PRD: C1, C2, C3 (Push notifications ahead on route), B5 (Alternate route)
/// TODO: Wire up with location stream (every 30-60s) and FCM push warning handler.
class TripState {
  final bool isTripActive;
  final String? activeTripId;
  final RouteInfo? route;
  final bool hasApproachingHazard;
  final String? approachingHazardWarning;

  const TripState({
    this.isTripActive = false,
    this.activeTripId,
    this.route,
    this.hasApproachingHazard = false,
    this.approachingHazardWarning,
  });
}

class TripNotifier extends Notifier<TripState> {
  @override
  TripState build() => const TripState();
}

final tripProvider = NotifierProvider<TripNotifier, TripState>(TripNotifier.new);
