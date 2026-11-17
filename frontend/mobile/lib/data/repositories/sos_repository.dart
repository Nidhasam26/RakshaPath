import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/sos_alert.dart';
import '../../models/contact.dart';
import '../../models/sos_queue_item.dart';

/// Abstract emergency SOS repository interface.
/// Covers PRD: D3 (Capture GPS), D4 (Online SOS), D5 (Offline SMS SOS), D7 (Local retry queue)
abstract class SosRepository {
  Future<SosAlert> triggerSos({
    required String userId,
    required double lat,
    required double lng,
    required String channel,
    String? locationName,
    List<Contact>? contacts,
  });

  Future<void> cancelSos(String sosId);
  Future<SosAlert?> getSosStatus(String sosId);
  Future<void> syncQueuedAlert(SosQueueItem item);
}

/// Concrete mock repository handling online simulated dispatches and synced alerts.
class MockSosRepository implements SosRepository {
  final Map<String, SosAlert> _alerts = {};

  @override
  Future<SosAlert> triggerSos({
    required String userId,
    required double lat,
    required double lng,
    required String channel,
    String? locationName,
    List<Contact>? contacts,
  }) async {
    final alert = SosAlert(
      id: 'sos_${DateTime.now().millisecondsSinceEpoch}',
      userId: userId,
      lat: lat,
      lng: lng,
      locationName: locationName ?? 'GPS Fix',
      createdAt: DateTime.now(),
      channel: channel,
      status: channel == 'online' ? 'acknowledged' : 'new',
      note: channel == 'online' ? 'Sent to server (demo)' : 'Prepared offline',
    );
    _alerts[alert.id] = alert;
    return alert;
  }

  @override
  Future<void> cancelSos(String sosId) async {
    final existing = _alerts[sosId];
    if (existing != null) {
      _alerts[sosId] = SosAlert(
        id: existing.id,
        userId: existing.userId,
        lat: existing.lat,
        lng: existing.lng,
        locationName: existing.locationName,
        createdAt: existing.createdAt,
        channel: existing.channel,
        status: 'closed',
        closedAt: DateTime.now(),
        note: 'Cancelled by user',
      );
    }
  }

  @override
  Future<SosAlert?> getSosStatus(String sosId) async {
    return _alerts[sosId];
  }

  @override
  Future<void> syncQueuedAlert(SosQueueItem item) async {
    final alert = SosAlert(
      id: item.id,
      userId: 'offline_user',
      lat: item.lat,
      lng: item.lng,
      locationName: 'Offline GPS Fix',
      createdAt: item.createdAt,
      channel: item.channel,
      status: 'acknowledged',
      note: 'Synced from offline queue',
    );
    _alerts[item.id] = alert;
  }
}

final sosRepositoryProvider = Provider<SosRepository>((ref) {
  return MockSosRepository();
});
