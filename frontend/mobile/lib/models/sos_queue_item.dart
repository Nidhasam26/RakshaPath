/// Model representing an offline/queued SOS alert event.
/// Covers PRD: D5 (Offline SMS fallback), D7 (Local retry queue), D13 (Honest state)
class SosQueueItem {
  final String id;
  final double lat;
  final double lng;
  final DateTime createdAt;
  /// Status values: 'pending', 'sms_opened', 'synced'
  final String status;
  final String message;
  final List<String> recipients;
  final DateTime? syncedAt;
  final String channel; // 'sms' or 'online'

  const SosQueueItem({
    required this.id,
    required this.lat,
    required this.lng,
    required this.createdAt,
    required this.status,
    required this.message,
    required this.recipients,
    this.syncedAt,
    this.channel = 'sms',
  });

  bool get isPending => status == 'pending';
  bool get isSmsOpened => status == 'sms_opened';
  bool get isSynced => status == 'synced';

  SosQueueItem copyWith({
    String? id,
    double? lat,
    double? lng,
    DateTime? createdAt,
    String? status,
    String? message,
    List<String>? recipients,
    DateTime? syncedAt,
    String? channel,
  }) {
    return SosQueueItem(
      id: id ?? this.id,
      lat: lat ?? this.lat,
      lng: lng ?? this.lng,
      createdAt: createdAt ?? this.createdAt,
      status: status ?? this.status,
      message: message ?? this.message,
      recipients: recipients ?? this.recipients,
      syncedAt: syncedAt ?? this.syncedAt,
      channel: channel ?? this.channel,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'lat': lat,
      'lng': lng,
      'createdAt': createdAt.toIso8601String(),
      'status': status,
      'message': message,
      'recipients': recipients,
      'syncedAt': syncedAt?.toIso8601String(),
      'channel': channel,
    };
  }

  factory SosQueueItem.fromJson(Map<String, dynamic> json) {
    return SosQueueItem(
      id: json['id'] as String,
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      createdAt: DateTime.parse(json['createdAt'] as String),
      status: json['status'] as String,
      message: json['message'] as String,
      recipients: (json['recipients'] as List).map((e) => e.toString()).toList(),
      syncedAt: json['syncedAt'] != null ? DateTime.parse(json['syncedAt'] as String) : null,
      channel: (json['channel'] as String?) ?? 'sms',
    );
  }
}
