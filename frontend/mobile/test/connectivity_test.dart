import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:rakshapath/data/services/network_reachability_service.dart';
import 'package:rakshapath/state/connectivity_state.dart';

class FakeConnectivity implements Connectivity {
  final _controller = StreamController<List<ConnectivityResult>>.broadcast();
  List<ConnectivityResult> currentResults = [ConnectivityResult.wifi];

  @override
  Stream<List<ConnectivityResult>> get onConnectivityChanged => _controller.stream;

  @override
  Future<List<ConnectivityResult>> checkConnectivity() async => currentResults;

  void emit(List<ConnectivityResult> results) {
    currentResults = results;
    _controller.add(results);
  }

  void dispose() {
    _controller.close();
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  group('Connectivity & Reachability Tests', () {
    test('NetworkReachabilityService returns true on HTTP 200/204', () async {
      final mockClient = MockClient((request) async {
        return http.Response('', 204);
      });
      final service = NetworkReachabilityService(
        client: mockClient,
        timeout: const Duration(seconds: 1),
      );

      final isReachable = await service.checkReachability();
      expect(isReachable, isTrue);
    });

    test('NetworkReachabilityService returns false on HTTP error or timeout', () async {
      final mockClient = MockClient((request) async {
        return http.Response('Server error', 500);
      });
      final service = NetworkReachabilityService(
        client: mockClient,
        timeout: const Duration(seconds: 1),
      );

      final isReachable = await service.checkReachability();
      expect(isReachable, isFalse);
    });

    test('ConnectivityNotifier transitions to offline when no interface is available', () async {
      final fakeConn = FakeConnectivity();
      final mockClient = MockClient((request) async => http.Response('', 204));
      final reachability = NetworkReachabilityService(client: mockClient);

      final container = ProviderContainer(
        overrides: [
          connectivityProvider.overrideWith(
            () => ConnectivityNotifier(
              connectivity: fakeConn,
              reachabilityService: reachability,
            ),
          ),
        ],
      );
      addTearDown(container.dispose);
      addTearDown(fakeConn.dispose);

      final notifier = container.read(connectivityProvider.notifier);

      // Verify status change for testing
      notifier.setStatusForTesting(ConnectivityStatus.offline);
      expect(container.read(connectivityProvider).isOffline, isTrue);
      expect(container.read(connectivityProvider).status, ConnectivityStatus.offline);
    });

    test('ConnectivityNotifier detects offline when Wi-Fi is connected but reachability fails', () async {
      final fakeConn = FakeConnectivity();
      // Wi-Fi connected, but ping fails (captive portal / dead link)
      final failingClient = MockClient((request) async => throw Exception('Connection reset'));
      final reachability = NetworkReachabilityService(
        client: failingClient,
        timeout: const Duration(milliseconds: 100),
      );

      final container = ProviderContainer(
        overrides: [
          connectivityProvider.overrideWith(
            () => ConnectivityNotifier(
              connectivity: fakeConn,
              reachabilityService: reachability,
            ),
          ),
        ],
      );
      addTearDown(container.dispose);
      addTearDown(fakeConn.dispose);

      final notifier = container.read(connectivityProvider.notifier);
      await notifier.checkReachability();

      expect(container.read(connectivityProvider).isOffline, isTrue);
      expect(container.read(connectivityProvider).isOnline, isFalse);
    });

    test('ConnectivityNotifier transitions to online when reachability succeeds', () async {
      final fakeConn = FakeConnectivity();
      final successClient = MockClient((request) async => http.Response('', 204));
      final reachability = NetworkReachabilityService(
        client: successClient,
        timeout: const Duration(milliseconds: 100),
      );

      final container = ProviderContainer(
        overrides: [
          connectivityProvider.overrideWith(
            () => ConnectivityNotifier(
              connectivity: fakeConn,
              reachabilityService: reachability,
            ),
          ),
        ],
      );
      addTearDown(container.dispose);
      addTearDown(fakeConn.dispose);

      final notifier = container.read(connectivityProvider.notifier);
      await notifier.checkReachability();

      expect(container.read(connectivityProvider).isOnline, isTrue);
      expect(container.read(connectivityProvider).isOffline, isFalse);
      expect(container.read(connectivityProvider).status, ConnectivityStatus.online);
    });
  });
}
