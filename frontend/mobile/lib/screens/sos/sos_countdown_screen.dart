import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants.dart';
import '../../core/demo_tag.dart';
import '../../state/connectivity_state.dart';
import '../../state/contacts_state.dart';
import '../../state/sos_state.dart';
import '../../widgets/call_112_button.dart';
import 'sos_status_screen.dart';

/// 5-second emergency SOS countdown screen to prevent false alarms.
/// Covers PRD: D9 (5-second cancel window to avoid false alarms)
class SosCountdownScreen extends ConsumerStatefulWidget {
  const SosCountdownScreen({super.key});

  @override
  ConsumerState<SosCountdownScreen> createState() => _SosCountdownScreenState();
}

class _SosCountdownScreenState extends ConsumerState<SosCountdownScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startCountdown();
    });
  }

  void _startCountdown() {
    ref.read(sosProvider.notifier).startCountdown(
      onCompleted: () async {
        if (!mounted) return;
        final isOffline = ref.read(connectivityProvider).isOffline;
        final contacts = ref.read(contactsProvider).contacts;

        // Navigate immediately to status screen so capturing/telemetry is shown live
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => const SosStatusScreen(),
          ),
        );

        // Trigger SOS flow in background
        await ref.read(sosProvider.notifier).triggerEmergency(
              isOffline: isOffline,
              contacts: contacts,
            );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final sosState = ref.watch(sosProvider);
    final isOffline = ref.watch(connectivityProvider).isOffline;

    return Scaffold(
      backgroundColor: const Color(0xFF881337), // Intense deep crimson
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Header
              Column(
                children: [
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              isOffline ? Icons.wifi_off_rounded : Icons.wifi_rounded,
                              color: Colors.white,
                              size: 16,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              isOffline ? 'Offline Mode (SMS Fallback)' : 'Online Mode (Server Dispatch)',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      const DemoTag(label: 'Demo data'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'EMERGENCY SOS',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    isOffline
                        ? 'Preparing emergency SMS with GPS fix to saved contacts & 112.'
                        : 'Transmitting emergency alert with live GPS telemetry to police dashboard.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                      height: 1.4,
                    ),
                  ),
                ],
              ),

              // Countdown Ring
              Center(
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 180,
                      height: 180,
                      child: CircularProgressIndicator(
                        value: sosState.countdownRemaining / AppConstants.sosCountdownSeconds,
                        strokeWidth: 8,
                        backgroundColor: Colors.white.withValues(alpha: 0.2),
                        valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    ),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${sosState.countdownRemaining}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 68,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const Text(
                          'SECONDS',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 2,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Action buttons (large touch targets, minimum 56px height)
              Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton.icon(
                      key: const Key('sos_cancel_countdown_button'),
                      onPressed: () {
                        final messenger = ScaffoldMessenger.of(context);
                        ref.read(sosProvider.notifier).cancelCountdown();
                        if (Navigator.of(context).canPop()) {
                          Navigator.of(context).pop();
                        }
                        messenger.showSnackBar(
                          const SnackBar(
                            content: Text('Emergency SOS cancelled. No alert was dispatched.'),
                            duration: Duration(seconds: 2),
                          ),
                        );
                      },
                      icon: const Icon(Icons.close_rounded, size: 24),
                      label: const Text(
                        'CANCEL ALERT (FALSE ALARM)',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: const Color(0xFF881337),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        elevation: 0,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Call112Button(
                    onPressed: () {
                      ref.read(sosProvider.notifier).dial112();
                    },
                  ),
                  const SizedBox(height: 10),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
