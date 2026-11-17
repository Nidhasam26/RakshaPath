import 'package:flutter/material.dart';

/// Fullscreen high-priority warning triggered when a hazard is detected ahead.
/// Covers PRD: C3 (Push warning: "Flooding ahead in 5 km. Tap for safer road"), C4 (Opens alternate route)
/// TODO: Add audio chime, dismiss timeout, and "View Alternate Route" button.
class WarningScreen extends StatelessWidget {
  const WarningScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Color(0xFF7F1D1D),
      body: Center(
        child: Text(
          'Warning Screen (TODO: Proactive Hazard Warning Ahead)',
          style: TextStyle(color: Colors.white),
        ),
      ),
    );
  }
}
