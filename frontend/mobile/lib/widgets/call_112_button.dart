import 'package:flutter/material.dart';

/// Always-visible direct 112 emergency phone call button.
/// Covers PRD: D6 (Always-visible "Call 112" button)
/// TODO: Wire up url_launcher with tel:112 intent.
class Call112Button extends StatelessWidget {
  final VoidCallback? onPressed;

  const Call112Button({super.key, this.onPressed});

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onPressed,
      icon: const Icon(Icons.phone, color: Color(0xFFEF4444)),
      label: const Text(
        'Call 112',
        style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
      ),
      style: OutlinedButton.styleFrom(
        side: const BorderSide(color: Color(0xFFEF4444)),
        backgroundColor: const Color(0x33EF4444),
      ),
    );
  }
}
