/// Emergency SOS alert telemetry data model.
/// Covers PRD: D3 (Capture GPS), D4 (Online SOS alert), D5 (Offline SMS alert), D13 (Status honest display)
/// TODO: Add device battery level, network signal strength, and offline retry queue tracking.
class SosAlert {
  final String id;
  final String userId;
  final double lat;
  final double lng;
  final String? locationName;
  final DateTime createdAt;
  final String channel; // 'online' or 'sms'
  final String status; // 'new', 'acknowledged', 'closed'
  final String? acknowledgedBy;
  final DateTime? closedAt;
  final String? note;

  const SosAlert({
    required this.id,
    required this.userId,
    required this.lat,
    required this.lng,
    this.locationName,
    required this.createdAt,
    required this.channel,
    required this.status,
    this.acknowledgedBy,
    this.closedAt,
    this.note,
  });
}
