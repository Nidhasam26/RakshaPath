import 'package:flutter/material.dart';

/// Visual tag indicator for simulated or mock demo state.
/// Covers PRD: A7 (Sample hazard set for demos and tests)
/// TODO: Conditionally display based on flavor or live backend availability flag.
class DemoTag extends StatelessWidget {
  final String label;

  const DemoTag({
    super.key,
    this.label = 'DEMO DATA',
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFFF59E0B),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.black,
          fontSize: 10,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
