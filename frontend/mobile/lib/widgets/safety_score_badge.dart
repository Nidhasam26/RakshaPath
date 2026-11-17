import 'package:flutter/material.dart';

/// Compact badge displaying the route Safety Score (out of 10.0).
/// Covers PRD: B6 (Safety Score out of 10 per route with a breakdown of what lowered it)
/// TODO: Wire up tap interaction to open Safety Score breakdown bottom sheet.
class SafetyScoreBadge extends StatelessWidget {
  final double score;
  final VoidCallback? onTap;

  const SafetyScoreBadge({
    super.key,
    required this.score,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = score >= 8.0
        ? const Color(0xFF10B981)
        : (score >= 6.0 ? const Color(0xFFF59E0B) : const Color(0xFFEF4444));

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.2),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color, width: 1.5),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.shield, size: 16, color: color),
            const SizedBox(width: 4),
            Text(
              '${score.toStringAsFixed(1)} / 10',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 13,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
