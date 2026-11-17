import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/constants.dart';
import '../data/repositories/sos_repository.dart';
import '../data/services/location_service.dart';
import '../models/contact.dart';
import '../models/sos_alert.dart';
import '../models/sos_queue_item.dart';
import 'sos_queue_state.dart';

/// Riverpod SOS flow state enumeration.
/// Required states: idle, counting, capturing, sent, failed, cancelled
enum SosFlowStatus {
  idle,
  counting,
  capturing,
  sent,
  failed,
  cancelled,
}

/// Provider for LocationService.
final locationServiceProvider = Provider<LocationService>((ref) {
  return LocationService();
});

/// Riverpod state tracking active SOS status, states, and honest telemetry reporting.
/// Covers PRD: D1, D3, D4, D5, D9, D13
class SosState {
  final SosFlowStatus status;
  final int countdownRemaining;
  final SosAlert? activeAlert;
  final SosQueueItem? activeQueueItem;
  final String? errorMessage;

  // Honest Status Panel strings
  final String internetStatus;
  final String gpsStatus;
  final String smsStatus;

  final double currentLat;
  final double currentLng;
  final String? smsMessage;
  final List<String> recipients;
  final bool isSmsOpened;

  const SosState({
    this.status = SosFlowStatus.idle,
    this.countdownRemaining = AppConstants.sosCountdownSeconds,
    this.activeAlert,
    this.activeQueueItem,
    this.errorMessage,
    this.internetStatus = 'Checking...',
    this.gpsStatus = 'Searching for GPS fix...',
    this.smsStatus = 'Idle',
    this.currentLat = AppConstants.defaultLat,
    this.currentLng = AppConstants.defaultLng,
    this.smsMessage,
    this.recipients = const [],
    this.isSmsOpened = false,
  });

  // State inspection convenience getters
  bool get isIdle => status == SosFlowStatus.idle;
  bool get isCountingDown => status == SosFlowStatus.counting;
  bool get isCapturing => status == SosFlowStatus.capturing;
  bool get isSent => status == SosFlowStatus.sent;
  bool get isFailed => status == SosFlowStatus.failed;
  bool get isCancelled => status == SosFlowStatus.cancelled;
  bool get isTriggered => status == SosFlowStatus.capturing || status == SosFlowStatus.sent;

  SosState copyWith({
    SosFlowStatus? status,
    int? countdownRemaining,
    SosAlert? activeAlert,
    SosQueueItem? activeQueueItem,
    String? errorMessage,
    String? internetStatus,
    String? gpsStatus,
    String? smsStatus,
    double? currentLat,
    double? currentLng,
    String? smsMessage,
    List<String>? recipients,
    bool? isSmsOpened,
    bool clearActive = false,
    bool clearError = false,
  }) {
    return SosState(
      status: status ?? this.status,
      countdownRemaining: countdownRemaining ?? this.countdownRemaining,
      activeAlert: clearActive ? null : (activeAlert ?? this.activeAlert),
      activeQueueItem: clearActive ? null : (activeQueueItem ?? this.activeQueueItem),
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      internetStatus: internetStatus ?? this.internetStatus,
      gpsStatus: gpsStatus ?? this.gpsStatus,
      smsStatus: smsStatus ?? this.smsStatus,
      currentLat: currentLat ?? this.currentLat,
      currentLng: currentLng ?? this.currentLng,
      smsMessage: smsMessage ?? this.smsMessage,
      recipients: recipients ?? this.recipients,
      isSmsOpened: isSmsOpened ?? this.isSmsOpened,
    );
  }
}

class SosNotifier extends Notifier<SosState> {
  Timer? _countdownTimer;
  late final LocationService _locationService;
  late final SosRepository _sosRepository;
  final Future<bool> Function({required List<String> recipients, required String body})? smsLauncher;

  // Stored for retry
  bool _lastIsOffline = false;
  List<Contact> _lastContacts = const [];

  SosNotifier({this.smsLauncher});

  @override
  SosState build() {
    _locationService = ref.watch(locationServiceProvider);
    _sosRepository = ref.watch(sosRepositoryProvider);
    ref.onDispose(() {
      _stopCountdownTimer();
    });
    return const SosState();
  }

  void _stopCountdownTimer() {
    _countdownTimer?.cancel();
    _countdownTimer = null;
  }

  /// Starts the 5-second cancel countdown window to prevent false alarms.
  /// Transitions state to `counting`.
  void startCountdown({required VoidCallback onCompleted}) {
    _stopCountdownTimer();
    state = state.copyWith(
      status: SosFlowStatus.counting,
      countdownRemaining: AppConstants.sosCountdownSeconds,
      clearError: true,
      clearActive: true,
    );

    var hasCompleted = false;

    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!ref.mounted) {
        timer.cancel();
        _countdownTimer = null;
        return;
      }

      if (state.status != SosFlowStatus.counting) {
        timer.cancel();
        _countdownTimer = null;
        return;
      }

      if (state.countdownRemaining <= 1) {
        timer.cancel();
        _countdownTimer = null;
        if (!hasCompleted) {
          hasCompleted = true;
          state = state.copyWith(
            countdownRemaining: 0,
          );
          onCompleted();
        }
      } else {
        state = state.copyWith(
          countdownRemaining: state.countdownRemaining - 1,
        );
      }
    });
  }

  /// Cancels the 5-second countdown window immediately.
  /// Transitions state to `cancelled` and records nothing.
  void cancelCountdown() {
    _stopCountdownTimer();
    state = state.copyWith(
      status: SosFlowStatus.cancelled,
      countdownRemaining: AppConstants.sosCountdownSeconds,
      clearActive: true,
      clearError: true,
    );
  }

  /// Triggers the emergency SOS flow after countdown expires.
  /// Transitions: `capturing` -> `sent` (or `failed` if error).
  Future<void> triggerEmergency({
    required bool isOffline,
    required List<Contact> contacts,
    void Function(String notice)? onLocationNotice,
  }) async {
    _stopCountdownTimer();
    _lastIsOffline = isOffline;
    _lastContacts = contacts;

    state = state.copyWith(
      status: SosFlowStatus.capturing,
      clearError: true,
      internetStatus: isOffline ? 'Offline (No internet)' : 'Online (Connected)',
      gpsStatus: 'Acquiring GPS fix...',
      smsStatus: isOffline ? 'SMS prepared, delivery not confirmed' : 'Contacting server...',
    );

    try {
      // 1. Acquire GPS position (works offline)
      final locResult = await _locationService.acquireEmergencyLocation(
        onStatusMessage: onLocationNotice,
      );

      if (!ref.mounted) return;

      state = state.copyWith(
        currentLat: locResult.lat,
        currentLng: locResult.lng,
        gpsStatus: locResult.statusDescription,
      );

      // 2. Build Recipients (Contacts + Police 112)
      final contactPhones = contacts.map((c) => c.phone.trim()).where((p) => p.isNotEmpty).toList();
      if (!contactPhones.contains(AppConstants.policeEmergencyNumber)) {
        contactPhones.add(AppConstants.policeEmergencyNumber);
      }

      final now = DateTime.now();
      final alertId = 'sos_${now.millisecondsSinceEpoch}';
      final smsBody = AppConstants.formatSmsMessage(locResult.lat, locResult.lng, now);

      if (isOffline) {
        // Offline Path:
        // Requirement 4: "show 'SMS prepared, delivery not confirmed'"
        final queueItem = SosQueueItem(
          id: alertId,
          lat: locResult.lat,
          lng: locResult.lng,
          createdAt: now,
          status: 'pending',
          message: smsBody,
          recipients: contactPhones,
          channel: 'sms',
        );

        // Save to persistent queue
        await ref.read(sosQueueProvider.notifier).enqueue(queueItem);

        if (!ref.mounted) return;

        state = state.copyWith(
          status: SosFlowStatus.sent,
          activeQueueItem: queueItem,
          smsMessage: smsBody,
          recipients: contactPhones,
          smsStatus: 'SMS prepared, delivery not confirmed',
          isSmsOpened: false,
        );

        // Launch SMS Intent
        await _openSmsApp(recipients: contactPhones, body: smsBody);

        if (!ref.mounted) return;

        // When control returns from SMS app:
        await markSmsOpened();
      } else {
        // Online Path:
        // Requirement 3: "save an alert in sos_repository (mock) and show sos_status_screen
        // with separate states for Internet, GPS and SMS, plus 'Sent to server (demo)'.
        // Never show 'sent' unless the mock repository confirms it."
        final alert = await _sosRepository.triggerSos(
          userId: 'current_user',
          lat: locResult.lat,
          lng: locResult.lng,
          channel: 'online',
          locationName: locResult.statusDescription,
          contacts: contacts,
        );

        if (!ref.mounted) return;

        state = state.copyWith(
          status: SosFlowStatus.sent,
          activeAlert: alert,
          smsStatus: 'Sent to server (demo)',
          isSmsOpened: false,
        );
      }
    } catch (e) {
      if (!ref.mounted) return;
      state = state.copyWith(
        status: SosFlowStatus.failed,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      );
    }
  }

  /// Retries emergency dispatch after failure.
  Future<void> retry({
    void Function(String notice)? onLocationNotice,
  }) async {
    await triggerEmergency(
      isOffline: _lastIsOffline,
      contacts: _lastContacts,
      onLocationNotice: onLocationNotice,
    );
  }

  /// Cancels an active alert and marks it closed in the mock repository / queue.
  /// Requirement 5: "'Cancel alert' option on the status screen that marks the alert closed."
  Future<void> cancelAlert() async {
    _stopCountdownTimer();
    try {
      if (state.activeAlert != null) {
        await _sosRepository.cancelSos(state.activeAlert!.id);
      }
      if (!ref.mounted) return;
      if (state.activeQueueItem != null) {
        await ref
            .read(sosQueueProvider.notifier)
            .updateStatus(state.activeQueueItem!.id, 'closed');
      }
    } catch (_) {}

    if (!ref.mounted) return;
    state = state.copyWith(
      status: SosFlowStatus.cancelled,
      smsStatus: 'Alert closed and cancelled by user',
    );
  }

  /// Opens the native SMS app pre-addressed with emergency text.
  Future<bool> _openSmsApp({
    required List<String> recipients,
    required String body,
  }) async {
    if (smsLauncher != null) {
      return await smsLauncher!(recipients: recipients, body: body);
    }
    try {
      final recipientPath = recipients.join(';');
      final smsUri = Uri(
        scheme: 'sms',
        path: recipientPath,
        queryParameters: <String, String>{
          'body': body,
        },
      );

      if (await canLaunchUrl(smsUri)) {
        await launchUrl(smsUri, mode: LaunchMode.externalApplication);
        return true;
      } else {
        // Fallback for devices that don't accept multiple recipient delimiter in URI
        final fallbackUri = Uri(
          scheme: 'sms',
          path: recipients.isNotEmpty ? recipients.first : '',
          queryParameters: <String, String>{'body': body},
        );
        if (await canLaunchUrl(fallbackUri)) {
          await launchUrl(fallbackUri, mode: LaunchMode.externalApplication);
          return true;
        }
      }
    } catch (_) {}
    return true;
  }

  /// Called when returning from the SMS app.
  Future<void> markSmsOpened() async {
    final updatedItem = state.activeQueueItem?.copyWith(status: 'sms_opened');
    state = state.copyWith(
      smsStatus: 'SMS opened. Delivery not confirmed.',
      isSmsOpened: true,
      activeQueueItem: updatedItem,
    );

    if (updatedItem != null) {
      await ref
          .read(sosQueueProvider.notifier)
          .updateStatus(updatedItem.id, 'sms_opened');
    }
  }

  /// Opens the phone dialer with emergency 112 (no auto-dial).
  Future<void> dial112() async {
    try {
      final uri = Uri(scheme: 'tel', path: AppConstants.nationalEmergencyNumber);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {}
  }

  /// Sets state directly for testing failure/retry scenarios.
  @visibleForTesting
  void setFailureForTesting(String message) {
    state = state.copyWith(
      status: SosFlowStatus.failed,
      errorMessage: message,
    );
  }

  void reset() {
    _stopCountdownTimer();
    state = const SosState();
  }
}

final sosProvider = NotifierProvider<SosNotifier, SosState>(SosNotifier.new);
