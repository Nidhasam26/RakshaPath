import 'package:flutter_test/flutter_test.dart';
import 'package:rakshapath/data/repositories/sos_repository.dart';
import 'package:rakshapath/data/services/local_cache_service.dart';
import 'package:rakshapath/models/sos_queue_item.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  group('SOS Queue & Sync State Tests', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({});
    });

    test('enqueues new SOS with pending status and correct telemetry', () async {
      final cacheService = LocalCacheService();
      final now = DateTime(2026, 10, 15, 20, 0);

      final item = SosQueueItem(
        id: 'sos_q_01',
        lat: 12.9340,
        lng: 77.6280,
        createdAt: now,
        status: 'pending',
        message: 'SOS. I need help. My location: https://maps.google.com/?q=12.934,77.628 [20:00]',
        recipients: ['+919876543210', '112'],
        channel: 'sms',
      );

      await cacheService.enqueueSos(item);

      final queue = await cacheService.getSosQueue();
      expect(queue.length, 1);
      expect(queue.first.id, 'sos_q_01');
      expect(queue.first.status, 'pending');
      expect(queue.first.isPending, isTrue);
      expect(queue.first.recipients, contains('112'));
    });

    test('updates status from pending to sms_opened when user returns from SMS app', () async {
      final cacheService = LocalCacheService();
      final now = DateTime(2026, 10, 15, 20, 5);

      final item = SosQueueItem(
        id: 'sos_q_02',
        lat: 12.9340,
        lng: 77.6280,
        createdAt: now,
        status: 'pending',
        message: 'SOS alert text',
        recipients: ['112'],
      );

      await cacheService.enqueueSos(item);
      await cacheService.updateSosStatus('sos_q_02', 'sms_opened');

      final queue = await cacheService.getSosQueue();
      expect(queue.first.status, 'sms_opened');
      expect(queue.first.isSmsOpened, isTrue);
    });

    test('syncs pending alert and marks as synced without deleting record', () async {
      final cacheService = LocalCacheService();
      final mockSosRepo = MockSosRepository();
      final now = DateTime(2026, 10, 15, 20, 10);

      final item = SosQueueItem(
        id: 'sos_q_03',
        lat: 12.9340,
        lng: 77.6280,
        createdAt: now,
        status: 'sms_opened',
        message: 'SOS alert text',
        recipients: ['112'],
      );

      await cacheService.enqueueSos(item);

      final unsyncedBefore = await cacheService.getUnsyncedCount();
      expect(unsyncedBefore, 1);

      // Requirement 6: "a Sync now button that marks it synced in the mock repository. Never delete a pending alert silently."
      final syncTime = DateTime(2026, 10, 15, 20, 15);
      final syncedCount = await cacheService.markAllPendingSynced(syncedAt: syncTime);
      expect(syncedCount, 1);

      // Verify synced into mock repository
      await mockSosRepo.syncQueuedAlert(item);
      final repoAlert = await mockSosRepo.getSosStatus('sos_q_03');
      expect(repoAlert, isNotNull);
      expect(repoAlert!.id, 'sos_q_03');

      // Verify persistent queue still retains item (marked as synced, never deleted)
      final queue = await cacheService.getSosQueue();
      expect(queue.length, 1);
      expect(queue.first.status, 'synced');
      expect(queue.first.isSynced, isTrue);
      expect(queue.first.syncedAt, syncTime);

      final unsyncedAfter = await cacheService.getUnsyncedCount();
      expect(unsyncedAfter, 0);
    });

    test('tracks multiple unsynced alerts correctly', () async {
      final cacheService = LocalCacheService();

      await cacheService.enqueueSos(SosQueueItem(
        id: 'alert_1',
        lat: 12.9,
        lng: 77.6,
        createdAt: DateTime.now(),
        status: 'pending',
        message: 'msg1',
        recipients: ['112'],
      ));
      await cacheService.enqueueSos(SosQueueItem(
        id: 'alert_2',
        lat: 12.91,
        lng: 77.61,
        createdAt: DateTime.now(),
        status: 'sms_opened',
        message: 'msg2',
        recipients: ['112'],
      ));

      expect(await cacheService.getUnsyncedCount(), 2);

      await cacheService.markAllPendingSynced();
      expect(await cacheService.getUnsyncedCount(), 0);

      final queue = await cacheService.getSosQueue();
      expect(queue.length, 2);
      expect(queue.every((e) => e.status == 'synced'), isTrue);
    });
  });
}
