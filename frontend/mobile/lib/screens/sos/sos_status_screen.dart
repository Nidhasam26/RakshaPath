import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/demo_tag.dart';
import '../../state/connectivity_state.dart';
import '../../state/contacts_state.dart';
import '../../state/sos_queue_state.dart';
import '../../state/sos_state.dart';
import '../../widgets/call_112_button.dart';

/// Active SOS telemetry status monitor showing Honest Internet, GPS, and SMS delivery state.
/// Handles:
/// - Online path: "Sent to server (demo)" tagged "Demo data"
/// - Offline path: "SMS prepared, delivery not confirmed"
/// - Call 112 button always visible
/// - "Cancel alert" button that marks the alert closed in the mock repository
/// - Failure state with clear error message and Retry button
///
/// Covers PRD: D4 (Online SOS to backend), D5 (Offline SMS fallback), D13 (Status panel honesty)
class SosStatusScreen extends ConsumerStatefulWidget {
  const SosStatusScreen({super.key});

  @override
  ConsumerState<SosStatusScreen> createState() => _SosStatusScreenState();
}

class _SosStatusScreenState extends ConsumerState<SosStatusScreen> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // User returned from SMS app
      final sos = ref.read(sosProvider);
      if (sos.smsStatus == 'SMS prepared, delivery not confirmed' ||
          sos.smsStatus == 'SMS prepared, waiting for you to send') {
        ref.read(sosProvider.notifier).markSmsOpened();
      }
    }
  }

  Future<void> _handleRetry() async {
    final isOffline = ref.read(connectivityProvider).isOffline;
    final contacts = ref.read(contactsProvider).contacts;

    await ref.read(sosProvider.notifier).triggerEmergency(
          isOffline: isOffline,
          contacts: contacts,
          onLocationNotice: (notice) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(notice), duration: const Duration(seconds: 3)),
              );
            }
          },
        );
  }

  Future<void> _handleCancelAlert() async {
    await ref.read(sosProvider.notifier).cancelAlert();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Alert closed and marked cancelled in emergency repository.'),
          backgroundColor: Color(0xFFE11D48),
          duration: Duration(seconds: 3),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final sosState = ref.watch(sosProvider);
    final connectivity = ref.watch(connectivityProvider);
    final queueState = ref.watch(sosQueueProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final hasPendingSync = connectivity.isOnline && queueState.hasUnsynced;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Emergency Status Monitor'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.close_rounded),
            tooltip: 'Return to Map',
            onPressed: () {
              Navigator.of(context).popUntil((route) => route.isFirst);
            },
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Failure State Banner & Retry Option
              if (sosState.isFailed) ...[
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFEF4444), width: 1.5),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444), size: 28),
                          SizedBox(width: 10),
                          Text(
                            'Dispatch Failed',
                            style: TextStyle(
                              color: Color(0xFFEF4444),
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        sosState.errorMessage ?? 'Emergency dispatch was interrupted.',
                        style: const TextStyle(
                          color: Color(0xFFF8FAFC),
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Tap Retry below to re-attempt location capture and dispatch.',
                        style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton.icon(
                          key: const Key('sos_retry_button'),
                          onPressed: _handleRetry,
                          icon: const Icon(Icons.refresh_rounded, size: 20),
                          label: const Text('RETRY EMERGENCY SOS'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFEF4444),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // 2. Cancelled State Banner
              if (sosState.isCancelled) ...[
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF10B981), width: 1.5),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.check_circle_outline_rounded, color: Color(0xFF10B981), size: 26),
                          SizedBox(width: 10),
                          Text(
                            'Alert Cancelled & Closed',
                            style: TextStyle(
                              color: Color(0xFF10B981),
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'This emergency SOS has been marked closed in the system register. No active alert is currently open.',
                        style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 14),
                      OutlinedButton(
                        key: const Key('sos_return_map_button'),
                        onPressed: () {
                          Navigator.of(context).popUntil((route) => route.isFirst);
                        },
                        child: const Text('Return to Map'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // 3. Capturing Telemetry State Indicator
              if (sosState.isCapturing) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF38BDF8).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF38BDF8), width: 1.5),
                  ),
                  child: const Row(
                    children: [
                      SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF38BDF8)),
                        ),
                      ),
                      SizedBox(width: 14),
                      Expanded(
                        child: Text(
                          'Capturing GPS & broadcasting emergency dispatch...',
                          style: TextStyle(
                            color: Color(0xFF38BDF8),
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // 4. Alert Header banner (when active or sent)
              if (sosState.isSent || sosState.isCapturing) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE11D48).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE11D48).withValues(alpha: 0.4), width: 1.5),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE11D48),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.shield_rounded, color: Colors.white, size: 24),
                      ),
                      const SizedBox(width: 14),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  'SOS ALERT ACTIVE',
                                  style: TextStyle(
                                    color: Color(0xFFE11D48),
                                    fontSize: 16,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                Spacer(),
                                DemoTag(label: 'Demo data'),
                              ],
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Live telemetry status reported directly below.',
                              style: TextStyle(
                                fontSize: 12,
                                color: Color(0xFF94A3B8),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Pending Sync Card when internet returns
              if (hasPendingSync) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF047857).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF047857).withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.cloud_upload_rounded, color: Color(0xFF047857), size: 26),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Internet Connection Restored',
                              style: TextStyle(
                                color: Color(0xFF047857),
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            Text(
                              '${queueState.pendingCount} SOS alert waiting to sync',
                              style: const TextStyle(fontSize: 12, color: Color(0xFF047857)),
                            ),
                          ],
                        ),
                      ),
                      ElevatedButton(
                        onPressed: queueState.isSyncing
                            ? null
                            : () async {
                                final count = await ref.read(sosQueueProvider.notifier).syncNow();
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text('$count alert(s) marked synced with server.'),
                                      backgroundColor: const Color(0xFF047857),
                                    ),
                                  );
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF047857),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          elevation: 0,
                        ),
                        child: queueState.isSyncing
                            ? const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Text('Sync now', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Honest Status Panel
              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(
                    color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                    width: 1.5,
                  ),
                ),
                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                child: Padding(
                  padding: const EdgeInsets.all(18.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Text(
                            'HONEST TELEMETRY STATUS',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF64748B),
                              letterSpacing: 1.2,
                            ),
                          ),
                          Spacer(),
                          DemoTag(label: 'Demo data'),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // 1. Internet Status
                      _TelemetryRow(
                        icon: connectivity.isOnline ? Icons.wifi_rounded : Icons.wifi_off_rounded,
                        iconColor: connectivity.isOnline ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                        title: 'Internet Connection',
                        status: connectivity.isOnline ? 'Online (Server demo)' : 'Offline (No internet connection)',
                        statusColor: connectivity.isOnline ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                      ),
                      const Divider(height: 24),

                      // 2. GPS Status (Says if permission was denied and last known fix used)
                      _TelemetryRow(
                        icon: Icons.gps_fixed_rounded,
                        iconColor: const Color(0xFF10B981),
                        title: 'GPS Telemetry',
                        status: sosState.gpsStatus,
                        statusColor: const Color(0xFF10B981),
                      ),
                      const Divider(height: 24),

                      // 3. Dispatch Channel Status
                      _TelemetryRow(
                        icon: sosState.smsStatus == 'Sent to server (demo)'
                            ? Icons.cloud_done_rounded
                            : Icons.sms_rounded,
                        iconColor: sosState.smsStatus == 'Sent to server (demo)'
                            ? const Color(0xFF10B981)
                            : (sosState.smsStatus.contains('not confirmed')
                                ? const Color(0xFFF59E0B)
                                : const Color(0xFF3B82F6)),
                        title: 'Dispatch Channel',
                        status: sosState.smsStatus,
                        statusColor: sosState.smsStatus == 'Sent to server (demo)'
                            ? const Color(0xFF10B981)
                            : (sosState.smsStatus.contains('not confirmed')
                                ? const Color(0xFFF59E0B)
                                : const Color(0xFF3B82F6)),
                        subtitle: sosState.smsStatus.contains('not confirmed')
                            ? 'Carrier delivery cannot be confirmed without cell ACK. Call 112 if urgent.'
                            : null,
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // SMS Content Card (When in offline mode)
              if (sosState.smsMessage != null) ...[
                Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(
                      color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                      width: 1.5,
                    ),
                  ),
                  color: isDark ? const Color(0xFF1E293B) : Colors.white,
                  child: Padding(
                    padding: const EdgeInsets.all(18.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'PREPARED SMS MESSAGE',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF64748B),
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: SelectableText(
                            sosState.smsMessage!,
                            style: const TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 12.5,
                              height: 1.4,
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Addressed to: ${sosState.recipients.join(', ')}',
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          onPressed: () async {
                            final recipientPath = sosState.recipients.join(';');
                            final smsUri = Uri(
                              scheme: 'sms',
                              path: recipientPath,
                              queryParameters: {'body': sosState.smsMessage!},
                            );
                            if (await canLaunchUrl(smsUri)) {
                              await launchUrl(smsUri, mode: LaunchMode.externalApplication);
                            }
                          },
                          icon: const Icon(Icons.send_rounded, size: 16),
                          label: const Text('Re-open SMS App'),
                          style: OutlinedButton.styleFrom(
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Always visible Call 112 button (Requirement 5)
              Call112Button(
                onPressed: () {
                  ref.read(sosProvider.notifier).dial112();
                },
              ),

              const SizedBox(height: 14),

              // Cancel Alert Option (Requirement 5: "marks the alert closed")
              if (sosState.isSent || sosState.isCapturing) ...[
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: OutlinedButton.icon(
                    key: const Key('sos_cancel_alert_button'),
                    onPressed: _handleCancelAlert,
                    icon: const Icon(Icons.cancel_outlined, size: 20, color: Color(0xFFEF4444)),
                    label: const Text(
                      'CANCEL ALERT (MARK CLOSED)',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFFEF4444),
                        letterSpacing: 0.5,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFFEF4444), width: 1.5),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
              ],

              // Return Home / Map Button
              TextButton(
                onPressed: () {
                  Navigator.of(context).popUntil((route) => route.isFirst);
                },
                child: const Text('Return to Map Screen'),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _TelemetryRow extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String status;
  final Color statusColor;
  final String? subtitle;

  const _TelemetryRow({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.status,
    required this.statusColor,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.15),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: iconColor, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 13,
                  color: Color(0xFF64748B),
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                status,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: statusColor,
                ),
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 4),
                Text(
                  subtitle!,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF94A3B8),
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}
