import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/services/local_cache_service.dart';
import '../models/sos_queue_item.dart';


class SosQueueState {
  final List<SosQueueItem> queue;
  final bool isLoading;
  final bool isSyncing;
  final String? message;

  const SosQueueState({
    this.queue = const [],
    this.isLoading = false,
    this.isSyncing = false,
    this.message,
  });

  int get pendingCount => queue.where((item) => item.status != 'synced').length;
  bool get hasUnsynced => pendingCount > 0;
  List<SosQueueItem> get unsyncedAlerts =>
      queue.where((item) => item.status != 'synced').toList();

  SosQueueState copyWith({
    List<SosQueueItem>? queue,
    bool? isLoading,
    bool? isSyncing,
    String? message,
    bool clearMessage = false,
  }) {
    return SosQueueState(
      queue: queue ?? this.queue,
      isLoading: isLoading ?? this.isLoading,
      isSyncing: isSyncing ?? this.isSyncing,
      message: clearMessage ? null : (message ?? this.message),
    );
  }
}

class SosQueueNotifier extends Notifier<SosQueueState> {
  late final LocalCacheService _cacheService;

  @override
  SosQueueState build() {
    _cacheService = ref.watch(localCacheServiceProvider);
    Future.microtask(() => loadQueue());
    return const SosQueueState(isLoading: true);
  }

  Future<void> loadQueue() async {
    final items = await _cacheService.getSosQueue();
    if (!ref.mounted) return;
    state = state.copyWith(queue: items, isLoading: false);
  }

  Future<void> enqueue(SosQueueItem item) async {
    await _cacheService.enqueueSos(item);
    if (!ref.mounted) return;
    await loadQueue();
  }

  Future<void> updateStatus(String id, String status) async {
    await _cacheService.updateSosStatus(id, status);
    if (!ref.mounted) return;
    await loadQueue();
  }

  /// Syncs all unsynced alerts when internet is restored.
  /// Requirement 6: "a Sync now button that marks it synced in the mock repository.
  /// Never delete a pending alert silently."
  Future<int> syncNow() async {
    state = state.copyWith(isSyncing: true, clearMessage: true);
    final count = await _cacheService.markAllPendingSynced(syncedAt: DateTime.now());
    if (!ref.mounted) return count;
    await loadQueue();
    if (!ref.mounted) return count;
    state = state.copyWith(
      isSyncing: false,
      message: count > 0 ? '$count SOS alert(s) successfully synced.' : 'No alerts needed sync.',
    );
    return count;
  }
}

final sosQueueProvider =
    NotifierProvider<SosQueueNotifier, SosQueueState>(SosQueueNotifier.new);
