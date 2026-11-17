import 'dart:async';
import 'package:http/http.dart' as http;
import '../../core/constants.dart';

/// Service performing active internet reachability checks.
/// Verifies true end-to-end data route rather than mere Wi-Fi or cellular radio link.
class NetworkReachabilityService {
  final http.Client _client;
  final String reachabilityUrl;
  final Duration timeout;

  NetworkReachabilityService({
    http.Client? client,
    String? reachabilityUrl,
    Duration? timeout,
  })  : _client = client ?? http.Client(),
        reachabilityUrl = reachabilityUrl ?? AppConstants.reachabilityCheckUrl,
        timeout = timeout ?? AppConstants.reachabilityTimeout;

  /// Checks reachability against the configured endpoint.
  /// Returns true if a response code < 400 is received within the timeout window.
  Future<bool> checkReachability() async {
    try {
      final uri = Uri.parse(reachabilityUrl);
      final response = await _client.get(uri).timeout(timeout);
      return response.statusCode >= 200 && response.statusCode < 400;
    } catch (_) {
      return false;
    }
  }

  void dispose() {
    _client.close();
  }
}
