/// Hazard data model representing unified road, weather, and disaster incidents.
/// Covers PRD: A4 (Unified hazard schema), B2 (Hazard pins), B3 (Hazards on route)
/// TODO: Add JSON serialization (fromJson/toJson) and GeoJSON polygon geometry parsing.
class Hazard {
  final String id;
  final String type;
  final double lat;
  final double lng;
  final List<List<double>>? polygon;
  final int severity;
  final double confidence;
  final String source;
  final String description;
  final DateTime? startTime;
  final DateTime? expiresAt;
  final DateTime? archivedAt;

  const Hazard({
    required this.id,
    required this.type,
    required this.lat,
    required this.lng,
    this.polygon,
    required this.severity,
    required this.confidence,
    required this.source,
    required this.description,
    this.startTime,
    this.expiresAt,
    this.archivedAt,
  });

  /// Check whether the hazard has expired based on current time.
  bool get isExpired {
    if (expiresAt == null) return false;
    return DateTime.now().isAfter(expiresAt!);
  }

  /// Active status: unexpired and not archived.
  bool get isActive => !isExpired && archivedAt == null;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'lat': lat,
      'lng': lng,
      'polygon': polygon,
      'severity': severity,
      'confidence': confidence,
      'source': source,
      'description': description,
      'startTime': startTime?.toIso8601String(),
      'expiresAt': expiresAt?.toIso8601String(),
      'archivedAt': archivedAt?.toIso8601String(),
    };
  }

  factory Hazard.fromJson(Map<String, dynamic> json) {
    return Hazard(
      id: json['id'] as String,
      type: json['type'] as String,
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      polygon: json['polygon'] != null
          ? (json['polygon'] as List)
              .map((poly) => (poly as List).map((c) => (c as num).toDouble()).toList())
              .toList()
          : null,
      severity: json['severity'] as int,
      confidence: (json['confidence'] as num).toDouble(),
      source: json['source'] as String,
      description: json['description'] as String,
      startTime: json['startTime'] != null ? DateTime.parse(json['startTime'] as String) : null,
      expiresAt: json['expiresAt'] != null ? DateTime.parse(json['expiresAt'] as String) : null,
      archivedAt: json['archivedAt'] != null ? DateTime.parse(json['archivedAt'] as String) : null,
    );
  }

  Hazard copyWith({
    String? id,
    String? type,
    double? lat,
    double? lng,
    List<List<double>>? polygon,
    int? severity,
    double? confidence,
    String? source,
    String? description,
    DateTime? startTime,
    DateTime? expiresAt,
    DateTime? archivedAt,
  }) {
    return Hazard(
      id: id ?? this.id,
      type: type ?? this.type,
      lat: lat ?? this.lat,
      lng: lng ?? this.lng,
      polygon: polygon ?? this.polygon,
      severity: severity ?? this.severity,
      confidence: confidence ?? this.confidence,
      source: source ?? this.source,
      description: description ?? this.description,
      startTime: startTime ?? this.startTime,
      expiresAt: expiresAt ?? this.expiresAt,
      archivedAt: archivedAt ?? this.archivedAt,
    );
  }
}
