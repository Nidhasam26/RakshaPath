import 'package:flutter_test/flutter_test.dart';
import 'package:rakshapath/core/constants.dart';
import 'package:rakshapath/models/contact.dart';

void main() {
  group('Offline SMS Text Format & Recipient Tests', () {
    test('formats SOS SMS text matching exact PRD specification', () {
      final time = DateTime(2026, 10, 15, 22, 30, 45);
      const lat = 12.9340;
      const lng = 77.6280;

      // Requirement 5: "SOS. I need help. My location: https://maps.google.com/?q=LAT,LNG [time]"
      final message = AppConstants.formatSmsMessage(lat, lng, time);

      expect(
        message,
        'SOS. I need help. My location: https://maps.google.com/?q=12.934,77.628 [2026-10-15 22:30:45]',
      );
      expect(message.startsWith('SOS. I need help. My location: https://maps.google.com/?q='), isTrue);
      expect(message.contains('12.934,77.628'), isTrue);
      expect(message.endsWith('[2026-10-15 22:30:45]'), isTrue);
    });

    test('gathers all saved contacts plus configurable police emergency number', () {
      final savedContacts = [
        const Contact(id: 'c1', name: 'Amma', phone: '+919876543210', type: 'family'),
        const Contact(id: 'c2', name: 'Brother', phone: '+919876543211', type: 'family'),
      ];

      final recipients = savedContacts.map((c) => c.phone.trim()).toList();
      if (!recipients.contains(AppConstants.policeEmergencyNumber)) {
        recipients.add(AppConstants.policeEmergencyNumber);
      }

      expect(recipients.length, 3);
      expect(recipients, contains('+919876543210'));
      expect(recipients, contains('+919876543211'));
      expect(recipients, contains('112'));
      expect(AppConstants.policeEmergencyNumber, '112');
    });

    test('builds valid sms: URI with body parameter', () {
      final recipients = ['+919876543210', '112'];
      const body = 'SOS. I need help. My location: https://maps.google.com/?q=12.934,77.628 [2026-10-15 22:30:00]';

      final smsUri = Uri(
        scheme: 'sms',
        path: recipients.join(';'),
        queryParameters: {'body': body},
      );

      expect(smsUri.scheme, 'sms');
      expect(smsUri.path, '+919876543210;112');
      expect(smsUri.queryParameters['body'], body);
    });
  });
}
