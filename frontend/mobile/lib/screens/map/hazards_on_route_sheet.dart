import 'package:flutter/material.dart';

/// Modal bottom sheet listing all hazards detected within 200m buffer of active route.
/// Covers PRD: B3 (List hazards within 200m of the route), B6 (Safety score breakdown)
/// TODO: Wire up list items with distance-from-start markers and severity indicators.
class HazardsOnRouteSheet extends StatelessWidget {
  const HazardsOnRouteSheet({super.key});

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      height: 320,
      child: Center(
        child: Text('Hazards On Route Sheet (TODO: 200m Spatial Buffer Incident List)'),
      ),
    );
  }
}
