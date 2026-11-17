/// Global application constants and configuration defaults.
/// Covers PRD: Section 13 (API endpoints), Section 14 (Safety score thresholds)
class AppConstants {
  static const String appName = 'RakshaPath';
  static const String appTagline = 'Know the danger before you reach it';
  static const String appVersion = '1.0.0';

  // Default coordinate center (Bengaluru)
  static const double defaultLat = 12.9340;
  static const double defaultLng = 77.6280;

  // SOS parameters
  static const int sosCountdownSeconds = 5;
  static const String nationalEmergencyNumber = '112';
  static const String policeEmergencyNumber = '112';

  // Network reachability check settings
  static const String reachabilityCheckUrl = 'https://clients3.google.com/generate_204';
  static const Duration reachabilityTimeout = Duration(milliseconds: 2500);

  // Proximity thresholds
  static const double hazardRouteBufferMeters = 200.0;
  static const double pushWarningDistanceMeters = 5000.0;

  /// Builds the offline SMS alert message text.
  /// Format required: "SOS. I need help. My location: https://maps.google.com/?q=LAT,LNG [time]"
  static String formatSmsMessage(double lat, double lng, DateTime time) {
    final y = time.year.toString().padLeft(4, '0');
    final m = time.month.toString().padLeft(2, '0');
    final d = time.day.toString().padLeft(2, '0');
    final h = time.hour.toString().padLeft(2, '0');
    final min = time.minute.toString().padLeft(2, '0');
    final s = time.second.toString().padLeft(2, '0');
    final timeStr = '$y-$m-$d $h:$min:$s';
    return 'SOS. I need help. My location: https://maps.google.com/?q=$lat,$lng [$timeStr]';
  }

  // Validation helpers
  static String? validatePhone(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Phone number is required';
    }
    final trimmed = value.trim();
    if (!RegExp(r'^\d{10}$').hasMatch(trimmed)) {
      return 'Phone number must be exactly 10 digits';
    }
    return null;
  }

  static String? validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return null;
  }

  static String? validateName(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Full name is required';
    }
    if (value.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    return null;
  }
}
