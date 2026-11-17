import 'package:flutter/material.dart';

/// Modal bottom sheet displaying detailed metadata for a tapped hazard pin.
/// Covers PRD: B2 (Hazards shown as pins), Section 15 (Data source, time, confidence transparency)
/// TODO: Add source authority badges, reporting timestamp, and expiry countdown.
class HazardDetailSheet extends StatelessWidget {
  const HazardDetailSheet({super.key});

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      height: 240,
      child: Center(
        child: Text('Hazard Detail Sheet (TODO: Incident Transparency Metadata)'),
      ),
    );
  }
}
