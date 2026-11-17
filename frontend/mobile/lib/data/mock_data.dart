import '../models/hazard.dart';
import '../models/contact.dart';
import '../models/user.dart';
import '../models/route_info.dart';

/// Central repository of offline mock and demo dataset.
/// Covers PRD: A7 (Sample hazard set for demos and tests)
/// TODO: Flesh out complete multi-city offline scenario data.
class MockData {
  static const User sampleUser = User(
    id: 'usr_001',
    name: 'Rohan Sharma',
    phone: '+919876512345',
  );

  static final List<Contact> sampleContacts = [
    const Contact(
      id: 'c_01',
      name: 'Amma',
      phone: '+919876543210',
      type: 'family',
    ),
    const Contact(
      id: 'c_02',
      name: 'Police Control Room',
      phone: '112',
      type: 'police',
    ),
  ];

  static final List<Hazard> sampleHazards = [
    const Hazard(
      id: 'haz_01',
      type: 'flood',
      lat: 12.9180,
      lng: 77.6230,
      severity: 3,
      confidence: 0.95,
      source: 'Open-Meteo & TomTom',
      description: 'Water logging near Silk Board underpass.',
    ),
  ];

  static const RouteInfo sampleRoute = RouteInfo(
    routeId: 'rt_001',
    originName: 'Koramangala 4th Block',
    destinationName: 'MG Road Metro Station',
    distanceKm: 7.2,
    durationMinutes: 24,
    safetyScore: 6.5,
    scoreBreakdown: {
      'Base Score': 10.0,
      'Active Hazard Deduction': -2.0,
      'Weather Risk': -1.0,
      'Night Travel': -0.5,
    },
    primaryCoordinates: [
      [77.6280, 12.9340],
      [77.6230, 12.9180],
      [77.6080, 12.9750],
    ],
  );
}
