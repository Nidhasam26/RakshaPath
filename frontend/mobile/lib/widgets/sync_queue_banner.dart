import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../state/connectivity_state.dart';
import '../state/sos_queue_state.dart';

/// Banner notifying the user of pending offline SOS alerts when back online.
/// Requirement 6: "When internet returns, show '1 SOS alert waiting to sync' and a Sync now button that marks it synced in the mock repository."
class SyncQueueBanner extends ConsumerWidget {
  const SyncQueueBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final connectivity = ref.watch(connectivityProvider);
    final queueState = ref.watch(sosQueueProvider);

    // Only show when internet has returned AND there are pending alerts
    if (!connectivity.isOnline || !queueState.hasUnsynced) {
      return const SizedBox.shrink();
    }

    final count = queueState.pendingCount;
    final alertText = count == 1 ? '1 SOS alert waiting to sync' : '$count SOS alerts waiting to sync';

    return Container(
      width: double.infinity,
      color: const Color(0xFF047857), // High-contrast emerald green
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: SafeArea(
        bottom: false,
        top: false,
        child: Row(
          children: [
            const Icon(
              Icons.sync_problem_rounded,
              color: Colors.white,
              size: 20,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                alertText,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
            ElevatedButton(
              onPressed: queueState.isSyncing
                  ? null
                  : () async {
                      await ref.read(sosQueueProvider.notifier).syncNow();
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('$count SOS alert(s) marked synced with server.'),
                            backgroundColor: const Color(0xFF047857),
                            duration: const Duration(seconds: 3),
                          ),
                        );
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: const Color(0xFF047857),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                visualDensity: VisualDensity.compact,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
              child: queueState.isSyncing
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF047857)),
                    )
                  : const Text(
                      'Sync now',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
