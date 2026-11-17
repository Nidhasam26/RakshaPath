import 'package:flutter/material.dart';

/// Active trip navigation and telemetry monitor screen.
/// Covers PRD: C1 ("Start trip" registration), C2 (Send location every 30-60s)
/// TODO: Wire up background location updates, speed display, and "End Trip" action.
class TripScreen extends StatelessWidget {
  const TripScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text('Trip Screen (TODO: Active Journey Telemetry & Navigation)'),
      ),
    );
  }
}
