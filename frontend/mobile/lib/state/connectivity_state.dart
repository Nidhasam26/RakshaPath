import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/services/network_reachability_service.dart';

/// Riverpod connectivity status state enum.
/// Requirement 1: Riverpod connectivity_state.dart exposes: online, offline, checking.
enum ConnectivityStatus {
  online,
  offline,
  checking,
}

/// State data model holding current connectivity status and verification timestamp.
class ConnectivityState {
  final ConnectivityStatus status;
  final DateTime? lastChecked;

  const ConnectivityState({
    this.status = ConnectivityStatus.checking,
    this.lastChecked,
  });

  bool get isOnline => status == ConnectivityStatus.online;
  bool get isOffline => status == ConnectivityStatus.offline;
  bool get isChecking => status == ConnectivityStatus.checking;

  ConnectivityState copyWith({
    ConnectivityStatus? status,
    DateTime? lastChecked,
  }) {
    return ConnectivityState(
      status: status ?? this.status,
      lastChecked: lastChecked ?? this.lastChecked,
    );
  }
}

/// Provider for reachability service.
final networkReachabilityServiceProvider = Provider<NetworkReachabilityService>((ref) {
  final service = NetworkReachabilityService();
  ref.onDispose(() => service.dispose());
  return service;
});

/// Riverpod notifier managing connectivity monitoring and real reachability checks.
class ConnectivityNotifier extends Notifier<ConnectivityState> {
  Connectivity? _connectivity;
  NetworkReachabilityService? _reachabilityService;
  StreamSubscription<List<ConnectivityResult>>? _subscription;

  ConnectivityNotifier({
    Connectivity? connectivity,
    NetworkReachabilityService? reachabilityService,
  })  : _connectivity = connectivity,
        _reachabilityService = reachabilityService;

  @override
  ConnectivityState build() {
    _connectivity ??= Connectivity();
    _reachabilityService ??= ref.watch(networkReachabilityServiceProvider);

    _subscription = _connectivity!.onConnectivityChanged.listen(_handleConnectivityChanged);
    ref.onDispose(() {
      _subscription?.cancel();
    });

    // Run initial reachability check
    Future.microtask(() => checkReachability());

    return const ConnectivityState(status: ConnectivityStatus.checking);
  }

  void _handleConnectivityChanged(List<ConnectivityResult> results) {
    if (!ref.mounted) return;
    if (results.isEmpty || (results.length == 1 && results.first == ConnectivityResult.none)) {
      // Disconnected at interface level
      state = ConnectivityState(
        status: ConnectivityStatus.offline,
        lastChecked: DateTime.now(),
      );
      return;
    }

    // Radio connected (Wi-Fi / Cellular) - verify active reachability
    checkReachability();
  }

  /// Performs real reachability check to verify true internet access.
  Future<void> checkReachability() async {
    if (!ref.mounted) return;
    state = state.copyWith(status: ConnectivityStatus.checking);

    final reachability = _reachabilityService ?? NetworkReachabilityService();
    final hasInternet = await reachability.checkReachability();

    if (!ref.mounted) return;
    state = ConnectivityState(
      status: hasInternet ? ConnectivityStatus.online : ConnectivityStatus.offline,
      lastChecked: DateTime.now(),
    );
  }

  /// Manually force a status for testing or preview purposes.
  void setStatusForTesting(ConnectivityStatus status) {
    state = ConnectivityState(status: status, lastChecked: DateTime.now());
  }
}

final connectivityProvider =
    NotifierProvider<ConnectivityNotifier, ConnectivityState>(ConnectivityNotifier.new);
