import 'package:flutter/material.dart';

/// Large high-visibility Emergency SOS trigger button.
/// Covers PRD: D1 (Large SOS button always visible on the map screen), D2 (Button trigger)
class SosButton extends StatelessWidget {
  final VoidCallback? onPressed;

  const SosButton({super.key, this.onPressed});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Emergency SOS button. Activates 5-second countdown.',
      child: ElevatedButton(
        key: const Key('map_sos_button'),
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFE11D48),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          elevation: 0,
        ),
        child: const Text(
          'EMERGENCY SOS',
          style: TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: 16,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }
}
