import 'hazard.dart';

/// Route analysis data model containing route geometry, safety scoring, and hazards.
/// Covers PRD: B1 (Route display), B5 (Alternate route), B6 (Safety score)
/// TODO: Add OSRM GeoJSON polyline decoding and dynamic duration computation.
class RouteInfo {
  final String routeId;
  final String originName;
  final String destinationName;
  final double distanceKm;
  final int durationMinutes;
  final double safetyScore;
  final Map<String, double> scoreBreakdown;
  final List<List<double>> primaryCoordinates;
  final List<List<double>>? alternateCoordinates;
  final List<Hazard> hazardsOnRoute;

  const RouteInfo({
    required this.routeId,
    required this.originName,
    required this.destinationName,
    required this.distanceKm,
    required this.durationMinutes,
    required this.safetyScore,
    required this.scoreBreakdown,
    required this.primaryCoordinates,
    this.alternateCoordinates,
    this.hazardsOnRoute = const [],
  });

  Map<String, dynamic> toJson() {
    return {
      'routeId': routeId,
      'originName': originName,
      'destinationName': destinationName,
      'distanceKm': distanceKm,
      'durationMinutes': durationMinutes,
      'safetyScore': safetyScore,
      'scoreBreakdown': scoreBreakdown,
      'primaryCoordinates': primaryCoordinates,
      'alternateCoordinates': alternateCoordinates,
      'hazardsOnRoute': hazardsOnRoute.map((h) => h.toJson()).toList(),
    };
  }

  factory RouteInfo.fromJson(Map<String, dynamic> json) {
    return RouteInfo(
      routeId: json['routeId'] as String,
      originName: json['originName'] as String,
      destinationName: json['destinationName'] as String,
      distanceKm: (json['distanceKm'] as num).toDouble(),
      durationMinutes: json['durationMinutes'] as int,
      safetyScore: (json['safetyScore'] as num).toDouble(),
      scoreBreakdown: (json['scoreBreakdown'] as Map<String, dynamic>).map(
        (k, v) => MapEntry(k, (v as num).toDouble()),
      ),
      primaryCoordinates: (json['primaryCoordinates'] as List)
          .map((coord) => (coord as List).map((c) => (c as num).toDouble()).toList())
          .toList(),
      alternateCoordinates: json['alternateCoordinates'] != null
          ? (json['alternateCoordinates'] as List)
              .map((coord) => (coord as List).map((c) => (c as num).toDouble()).toList())
              .toList()
          : null,
      hazardsOnRoute: json['hazardsOnRoute'] != null
          ? (json['hazardsOnRoute'] as List)
              .map((h) => Hazard.fromJson(h as Map<String, dynamic>))
              .toList()
          : const [],
    );
  }
}
