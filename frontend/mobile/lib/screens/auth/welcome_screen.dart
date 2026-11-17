import 'package:flutter/material.dart';
import '../../core/constants.dart';
import '../../core/demo_tag.dart';
import '../../core/router.dart';

/// Welcome landing screen presenting brand tagline and access buttons.
/// Full-width image header at the top (about 35% of screen height) with dark overlay,
/// and action panel below it.
/// Covers PRD: Section 1 (Overview), Section 15 (Accessibility & contrast)
class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final screenHeight = MediaQuery.of(context).size.height;
    final headerHeight = (screenHeight * 0.35).clamp(220.0, 320.0);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      body: SingleChildScrollView(
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Full-width Image Header (approx 35% screen height) with Dark Overlay
            SizedBox(
              width: double.infinity,
              height: headerHeight,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  // Vector Illustration / Compressed WebP Asset
                  Semantics(
                    label: 'Vector illustration of safe highway route under rain with safety shield and alert pins',
                    image: true,
                    child: Image.asset(
                      'assets/images/welcome_header.webp',
                      fit: BoxFit.cover,
                      width: double.infinity,
                      height: headerHeight,
                      semanticLabel: 'Vector illustration of safe highway route under rain with safety shield and alert pins',
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          color: const Color(0xFF0F172A),
                          child: const Center(
                            child: Icon(Icons.shield_rounded, size: 64, color: Color(0xFFE11D48)),
                          ),
                        );
                      },
                    ),
                  ),

                  // High-Contrast Dark Gradient Overlay ensuring readable typography
                  Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.black.withValues(alpha: 0.35),
                            const Color(0xFF0F172A).withValues(alpha: 0.70),
                            isDark ? const Color(0xFF0F172A) : const Color(0xFF0F172A),
                          ],
                          stops: const [0.0, 0.65, 1.0],
                        ),
                      ),
                    ),
                  ),

                  // Header Branding & Demo Indicator Over Image
                  SafeArea(
                    bottom: false,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              color: const Color(0xFFE11D48).withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFFE11D48), width: 2),
                            ),
                            child: const Icon(
                              Icons.shield_rounded,
                              size: 30,
                              color: Color(0xFFE11D48),
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            AppConstants.appName,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.5,
                              color: Color(0xFFF8FAFC),
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            AppConstants.appTagline,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF94A3B8),
                            ),
                          ),
                          const SizedBox(height: 8),
                          const DemoTag(label: 'Demo Mode'),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Form / Content Section below image header
            Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Key Benefits Card
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1),
                            width: 1.5,
                          ),
                        ),
                        child: Column(
                          children: [
                            _buildFeatureRow(
                              icon: Icons.warning_amber_rounded,
                              iconColor: const Color(0xFFF59E0B),
                              title: 'Proactive Road Warnings',
                              subtitle: 'Automatic alerts before reaching flooded or blocked roads.',
                              isDark: isDark,
                            ),
                            Divider(
                              height: 24,
                              color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                            ),
                            _buildFeatureRow(
                              icon: Icons.alt_route_rounded,
                              iconColor: const Color(0xFF38BDF8),
                              title: 'Safer Alternate Routes',
                              subtitle: 'Avoid hazardous stretches with safety-scored navigation.',
                              isDark: isDark,
                            ),
                            Divider(
                              height: 24,
                              color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                            ),
                            _buildFeatureRow(
                              icon: Icons.sos_rounded,
                              iconColor: const Color(0xFFE11D48),
                              title: 'One-Press Emergency SOS',
                              subtitle: 'Instant broadcast to police dashboard and emergency contacts.',
                              isDark: isDark,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Action Buttons (High contrast, rectangular with 8px radius, no pill shape)
                      ElevatedButton(
                        key: const Key('welcome_signin_button'),
                        onPressed: () {
                          Navigator.pushNamed(context, AppRouter.signIn);
                        },
                        child: const Text('Sign In'),
                      ),
                      const SizedBox(height: 12),

                      OutlinedButton(
                        key: const Key('welcome_signup_button'),
                        onPressed: () {
                          Navigator.pushNamed(context, AppRouter.signUp);
                        },
                        child: const Text('Create Account'),
                      ),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureRow({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required bool isDark,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: iconColor.withValues(alpha: 0.4), width: 1),
          ),
          child: Icon(
            icon,
            size: 20,
            color: iconColor,
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                  height: 1.35,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
