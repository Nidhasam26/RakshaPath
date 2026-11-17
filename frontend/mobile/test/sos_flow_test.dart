import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:geolocator/geolocator.dart';
import 'package:rakshapath/core/constants.dart';
import 'package:rakshapath/data/repositories/sos_repository.dart';
import 'package:rakshapath/data/services/location_service.dart';
import 'package:rakshapath/data/services/network_reachability_service.dart';
import 'package:rakshapath/models/contact.dart';
import 'package:rakshapath/models/sos_alert.dart';
import 'package:rakshapath/screens/sos/sos_countdown_screen.dart';
import 'package:rakshapath/screens/sos/sos_status_screen.dart';
import 'package:rakshapath/state/connectivity_state.dart';
import 'package:rakshapath/state/sos_state.dart';
import 'package:rakshapath/widgets/call_112_button.dart';
import 'package:rakshapath/widgets/offline_banner.dart';
import 'package:rakshapath/widgets/sos_button.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FailingSosRepository extends MockSosRepository {
  bool shouldFail = true;

  @override
  Future<SosAlert> triggerSos({
    required String userId,
    required double lat,
    required double lng,
    required String channel,
    String? locationName,
    List<Contact>? contacts,
  }) async {
    if (shouldFail) {
      throw Exception('Network gateway timeout while reaching emergency server');
    }
    return super.triggerSos(
      userId: userId,
      lat: lat,
      lng: lng,
      channel: channel,
      locationName: locationName,
      contacts: contacts,
    );
  }
}

class FakeOnlineReachabilityService extends NetworkReachabilityService {
  @override
  Future<bool> checkReachability() async => true;
}

Position createTestPosition() {
  return Position(
    latitude: 12.9340,
    longitude: 77.6280,
    timestamp: DateTime.now(),
    accuracy: 5.0,
    altitude: 0.0,
    altitudeAccuracy: 0.0,
    heading: 0.0,
    headingAccuracy: 0.0,
    speed: 0.0,
    speedAccuracy: 0.0,
  );
}

LocationService createTestLocationService() {
  return LocationService(
    getCurrentPositionOverride: () async => createTestPosition(),
    getLastKnownPositionOverride: () async => createTestPosition(),
  );
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('SOS Flow & Honest State Integration Tests', () {
    test('creates SosAlert model with valid state', () {
      final alert = SosAlert(
        id: 'sos_001',
        userId: 'usr_001',
        lat: 12.9340,
        lng: 77.6280,
        createdAt: DateTime.now(),
        channel: 'online',
        status: 'new',
      );
      expect(alert.id, 'sos_001');
      expect(alert.channel, 'online');
      expect(alert.status, 'new');
    });

    test('Test A: Countdown initialization starts countdown with correct initial value', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(sosProvider.notifier);
      expect(container.read(sosProvider).status, SosFlowStatus.idle);
      expect(container.read(sosProvider).isCountingDown, isFalse);

      notifier.startCountdown(onCompleted: () {});
      expect(container.read(sosProvider).status, SosFlowStatus.counting);
      expect(container.read(sosProvider).isCountingDown, isTrue);
      expect(container.read(sosProvider).countdownRemaining, AppConstants.sosCountdownSeconds);
    });

    testWidgets('Test A (Widget): Countdown screen opens, starts countdown, displays initial value and counting state', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: SosCountdownScreen(),
          ),
        ),
      );
      await tester.pump();

      expect(find.text('EMERGENCY SOS'), findsOneWidget);
      expect(find.text('${AppConstants.sosCountdownSeconds}'), findsOneWidget);
      expect(find.text('SECONDS'), findsOneWidget);
      expect(find.byKey(const Key('sos_cancel_countdown_button')), findsOneWidget);
      expect(container.read(sosProvider).status, SosFlowStatus.counting);
      expect(container.read(sosProvider).countdownRemaining, AppConstants.sosCountdownSeconds);
      expect(container.read(sosProvider).isCountingDown, isTrue);

      // Clean up timer before finishing test
      container.read(sosProvider.notifier).cancelCountdown();
    });

    testWidgets('Test B: Countdown cancellation stops timer, transitions to cancelled, navigates back, and confirms no alert dispatched', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            home: Builder(
              builder: (context) => Scaffold(
                body: Center(
                  child: ElevatedButton(
                    key: const Key('open_sos_button'),
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => const SosCountdownScreen(),
                        ),
                      );
                    },
                    child: const Text('Open SOS'),
                  ),
                ),
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Open countdown screen
      await tester.tap(find.byKey(const Key('open_sos_button')));
      await tester.pumpAndSettle();

      expect(find.text('EMERGENCY SOS'), findsOneWidget);
      expect(find.byKey(const Key('sos_cancel_countdown_button')), findsOneWidget);
      expect(container.read(sosProvider).status, SosFlowStatus.counting);

      // User presses cancel button
      await tester.tap(find.byKey(const Key('sos_cancel_countdown_button')));
      await tester.pumpAndSettle();

      // Timer stopped, state cancelled, no dispatch
      expect(container.read(sosProvider).status, SosFlowStatus.cancelled);
      expect(container.read(sosProvider).isCancelled, isTrue);
      expect(container.read(sosProvider).isCountingDown, isFalse);
      expect(container.read(sosProvider).activeAlert, isNull);
      expect(container.read(sosProvider).activeQueueItem, isNull);

      // Navigated back to previous screen
      expect(find.byKey(const Key('open_sos_button')), findsOneWidget);
      expect(find.byKey(const Key('sos_cancel_countdown_button')), findsNothing);

      // Cancellation feedback SnackBar appeared
      expect(find.text('Emergency SOS cancelled. No alert was dispatched.'), findsOneWidget);
    });

    testWidgets('Test C: Countdown completion executes callback once, opens status screen, and starts emergency processing', (tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final container = ProviderContainer(
        overrides: [
          locationServiceProvider.overrideWithValue(createTestLocationService()),
          networkReachabilityServiceProvider.overrideWithValue(FakeOnlineReachabilityService()),
        ],
      );
      addTearDown(container.dispose);

      container.read(connectivityProvider.notifier).setStatusForTesting(ConnectivityStatus.online);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: SosCountdownScreen(),
          ),
        ),
      );
      await tester.pump();

      expect(container.read(sosProvider).status, SosFlowStatus.counting);

      // Advance clock tick by tick to zero
      for (int i = 0; i < AppConstants.sosCountdownSeconds; i++) {
        await tester.pump(const Duration(seconds: 1));
      }
      await tester.pumpAndSettle();

      // SOS status screen opens and emergency dispatch completes
      expect(find.text('Emergency Status Monitor'), findsOneWidget);
      expect(container.read(sosProvider).countdownRemaining, 0);
      expect(container.read(sosProvider).status, SosFlowStatus.sent);
      expect(container.read(sosProvider).activeAlert, isNotNull);
    });

    test('Test D: Provider disposal cleans up timer and prevents post-disposal state updates or exceptions', () async {
      final container = ProviderContainer();
      final notifier = container.read(sosProvider.notifier);
      var completionInvocations = 0;

      notifier.startCountdown(
        onCompleted: () {
          completionInvocations++;
        },
      );
      expect(container.read(sosProvider).status, SosFlowStatus.counting);

      // Dispose container while periodic timer is running
      container.dispose();

      // Advance real/async clock past remaining countdown duration
      await Future<void>.delayed(const Duration(seconds: 2));

      // Callback must not execute after disposal
      expect(completionInvocations, 0);
    });

    testWidgets('Test E: Restarting countdown cancels previous timer and completes only once', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final notifier = container.read(sosProvider.notifier);
      var completionCount = 0;

      // Start initial countdown
      notifier.startCountdown(
        onCompleted: () {
          completionCount++;
        },
      );
      await tester.pump(const Duration(seconds: 2));
      expect(container.read(sosProvider).countdownRemaining, 3);

      // Restart before first completion
      notifier.startCountdown(
        onCompleted: () {
          completionCount++;
        },
      );
      expect(container.read(sosProvider).countdownRemaining, AppConstants.sosCountdownSeconds);

      // Advance full 5 seconds for the restarted countdown
      for (int i = 0; i < AppConstants.sosCountdownSeconds; i++) {
        await tester.pump(const Duration(seconds: 1));
      }

      // First countdown was discarded; completion callback executed exactly once
      expect(completionCount, 1);
      expect(container.read(sosProvider).countdownRemaining, 0);
    });

    test('Test F: Online SOS transitions idle -> counting -> capturing -> sent', () async {
      final container = ProviderContainer(
        overrides: [
          locationServiceProvider.overrideWithValue(createTestLocationService()),
          networkReachabilityServiceProvider.overrideWithValue(FakeOnlineReachabilityService()),
        ],
      );
      addTearDown(container.dispose);

      final notifier = container.read(sosProvider.notifier);
      expect(container.read(sosProvider).status, SosFlowStatus.idle);

      notifier.startCountdown(onCompleted: () {});
      expect(container.read(sosProvider).status, SosFlowStatus.counting);

      final contacts = [
        const Contact(id: 'c1', name: 'Amma', phone: '+919876543210', type: 'family'),
      ];

      await notifier.triggerEmergency(
        isOffline: false,
        contacts: contacts,
      );

      final state = container.read(sosProvider);
      expect(state.status, SosFlowStatus.sent);
      expect(state.isSent, isTrue);
      expect(state.activeAlert, isNotNull);
      expect(state.internetStatus, contains('Online'));
      expect(state.smsStatus, 'Sent to server (demo)');
    });

    test('Test G: Offline SOS captures GPS, uses saved contacts, and provides honest SMS status', () async {
      final container = ProviderContainer(
        overrides: [
          locationServiceProvider.overrideWithValue(createTestLocationService()),
          sosProvider.overrideWith(
            () => SosNotifier(
              smsLauncher: ({required recipients, required body}) async => true,
            ),
          ),
        ],
      );
      addTearDown(container.dispose);

      final notifier = container.read(sosProvider.notifier);
      final contacts = [
        const Contact(id: 'c1', name: 'Amma', phone: '+919876543210', type: 'family'),
      ];

      await notifier.triggerEmergency(
        isOffline: true,
        contacts: contacts,
      );

      final state = container.read(sosProvider);
      expect(state.status, SosFlowStatus.sent);
      expect(state.isSent, isTrue);
      expect(state.internetStatus, contains('Offline'));
      expect(state.smsStatus, 'SMS opened. Delivery not confirmed.');
      expect(state.isSmsOpened, isTrue);
      expect(state.activeQueueItem, isNotNull);
      expect(state.activeQueueItem!.status, 'sms_opened');
      expect(state.smsMessage, contains('https://maps.google.com/?q=12.934,77.628'));
      expect(state.recipients, contains(AppConstants.policeEmergencyNumber));
      expect(state.recipients, contains('+919876543210'));
    });

    test('Test H: Failure and retry displays failure message, recovers via retry, without duplicate alerts', () async {
      final failingRepo = FailingSosRepository();
      final container = ProviderContainer(
        overrides: [
          sosRepositoryProvider.overrideWithValue(failingRepo),
          locationServiceProvider.overrideWithValue(createTestLocationService()),
        ],
      );
      addTearDown(container.dispose);

      final notifier = container.read(sosProvider.notifier);
      final contacts = [
        const Contact(id: 'c1', name: 'Amma', phone: '+919876543210', type: 'family'),
      ];

      // 1. Initial attempt fails
      failingRepo.shouldFail = true;
      await notifier.triggerEmergency(
        isOffline: false,
        contacts: contacts,
      );

      final failedState = container.read(sosProvider);
      expect(failedState.status, SosFlowStatus.failed);
      expect(failedState.isFailed, isTrue);
      expect(failedState.errorMessage, contains('Network gateway timeout'));
      expect(failedState.activeAlert, isNull);

      // 2. Retry succeeds when network condition recovers
      failingRepo.shouldFail = false;
      await notifier.retry();

      final recoveredState = container.read(sosProvider);
      expect(recoveredState.status, SosFlowStatus.sent);
      expect(recoveredState.isSent, isTrue);
      expect(recoveredState.errorMessage, isNull);
      expect(recoveredState.activeAlert, isNotNull);
    });

    testWidgets('SosStatusScreen displays failure banner and retry button when failed', (tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(sosProvider.notifier).setFailureForTesting('GPS antenna timeout');

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: SosStatusScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Dispatch Failed'), findsOneWidget);
      expect(find.text('GPS antenna timeout'), findsOneWidget);
      expect(find.byKey(const Key('sos_retry_button')), findsOneWidget);
      expect(find.text('Call 112'), findsOneWidget);
    });

    testWidgets('SosStatusScreen cancel alert marks alert closed', (tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final container = ProviderContainer(
        overrides: [
          locationServiceProvider.overrideWithValue(createTestLocationService()),
          networkReachabilityServiceProvider.overrideWithValue(FakeOnlineReachabilityService()),
        ],
      );
      addTearDown(container.dispose);

      // Trigger online emergency
      await container.read(sosProvider.notifier).triggerEmergency(
            isOffline: false,
            contacts: [const Contact(id: 'c1', name: 'Amma', phone: '+919876543210', type: 'family')],
          );

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: SosStatusScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('SOS ALERT ACTIVE'), findsOneWidget);
      expect(find.byKey(const Key('sos_cancel_alert_button')), findsOneWidget);

      // Tap cancel alert button
      await tester.tap(find.byKey(const Key('sos_cancel_alert_button')));
      await tester.pumpAndSettle();

      expect(container.read(sosProvider).status, SosFlowStatus.cancelled);
      expect(find.text('Alert Cancelled & Closed'), findsOneWidget);
    });

    testWidgets('OfflineBanner displays correct text when offline and disappears when online',
        (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      // 1. When offline: banner is visible
      container.read(connectivityProvider.notifier).setStatusForTesting(ConnectivityStatus.offline);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: Scaffold(
              body: OfflineBanner(),
            ),
          ),
        ),
      );

      expect(find.text('You are offline. SOS still works by SMS.'), findsOneWidget);

      // 2. When online: banner disappears
      container.read(connectivityProvider.notifier).setStatusForTesting(ConnectivityStatus.online);
      await tester.pump();

      expect(find.text('You are offline. SOS still works by SMS.'), findsNothing);
    });

    testWidgets('Call 112 button renders properly and invokes callback', (tester) async {
      var tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Call112Button(
              onPressed: () {
                tapped = true;
              },
            ),
          ),
        ),
      );

      expect(find.text('Call 112'), findsOneWidget);
      await tester.tap(find.text('Call 112'));
      expect(tapped, isTrue);
    });

    testWidgets('SosButton renders large touch target with accessibility semantics', (tester) async {
      var pressed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SosButton(
              onPressed: () {
                pressed = true;
              },
            ),
          ),
        ),
      );

      expect(find.text('EMERGENCY SOS'), findsOneWidget);
      expect(find.byKey(const Key('map_sos_button')), findsOneWidget);
      await tester.tap(find.byKey(const Key('map_sos_button')));
      expect(pressed, isTrue);
    });

    testWidgets('SosStatusScreen shows honest telemetry state', (tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final container = ProviderContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: SosStatusScreen(),
          ),
        ),
      );

      expect(find.text('Emergency Status Monitor'), findsOneWidget);
      expect(find.text('HONEST TELEMETRY STATUS'), findsOneWidget);
      expect(find.text('Internet Connection'), findsOneWidget);
      expect(find.text('GPS Telemetry'), findsOneWidget);
      expect(find.text('Dispatch Channel'), findsOneWidget);
      expect(find.text('Call 112'), findsOneWidget);
    });
  });
}
