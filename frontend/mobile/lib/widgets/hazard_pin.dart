import 'package:flutter/material.dart';

/// High-contrast map marker pin for road, weather, or disaster hazards.
/// Covers PRD: B2 (Hazards shown as coloured pins), A4 (Severity scale)
/// TODO: Add dynamic icon based on hazard type (flood, tree, closure) and severity coloring.
class HazardPin extends StatelessWidget {
  final String type;
  final int severity;
  final VoidCallback? onTap;

  const HazardPin({
    super.key,
    required this.type,
    this.severity = 2,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: severity >= 3 ? const Color(0xFFEF4444) : const Color(0xFFF59E0B),
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 2),
          boxShadow: const [
            BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2))
          ],
        ),
        child: const Icon(Icons.warning_amber_rounded, size: 20, color: Colors.white),
      ),
    );
  }
}
