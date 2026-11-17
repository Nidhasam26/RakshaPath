import 'package:flutter/material.dart';

/// Screen presenting the safer alternate road that bypasses the hazard area.
/// Covers PRD: B5 (Suggest a safer alternate road that avoids the hazard area, with extra time)
/// TODO: Add comparison metrics (+12 min, +2.6 km, Safety Score 8.5 vs 6.5) and "Accept Reroute".
class AlternateRouteView extends StatelessWidget {
  const AlternateRouteView({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text('Alternate Route View (TODO: Avoid-Area Reroute Comparison)'),
      ),
    );
  }
}
