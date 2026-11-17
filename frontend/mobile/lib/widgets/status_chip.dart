import 'package:flutter/material.dart';

/// Status indicator chip for hardware and telemetry health (GPS, Net, SMS).
/// Covers PRD: D13 (Status panel shows Internet, GPS and SMS state honestly)
/// TODO: Add pulsing animated indicator when searching for GPS fix or retrying network.
class StatusChip extends StatelessWidget {
  final String label;
  final bool isOnline;

  const StatusChip({
    super.key,
    required this.label,
    required this.isOnline,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isOnline ? const Color(0x3310B981) : const Color(0x33EF4444),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isOnline ? const Color(0xFF10B981) : const Color(0xFFEF4444),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircleAvatar(
            radius: 3,
            backgroundColor: isOnline ? const Color(0xFF10B981) : const Color(0xFFEF4444),
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: isOnline ? const Color(0xFF10B981) : const Color(0xFFEF4444),
            ),
          ),
        ],
      ),
    );
  }
}
