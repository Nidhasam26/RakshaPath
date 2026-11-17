import 'package:flutter/material.dart';

/// Full-width image header with a dark contrast overlay for authentication screens.
/// Covers requirement: full-width image header at top (approx 35% of screen height),
/// dark overlay for text readability, accessibility labels, and non-side-by-side phone layout.
class AuthHeaderImage extends StatelessWidget {
  final String imagePath;
  final String semanticLabel;
  final String title;
  final String? subtitle;
  final Widget? trailingBadge;
  final bool showBackButton;

  const AuthHeaderImage({
    super.key,
    required this.imagePath,
    required this.semanticLabel,
    required this.title,
    this.subtitle,
    this.trailingBadge,
    this.showBackButton = false,
  });

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    // Exactly ~35% of screen height with reasonable min/max clamps
    final headerHeight = (screenHeight * 0.35).clamp(220.0, 320.0);
    final scaffoldBg = Theme.of(context).scaffoldBackgroundColor;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SizedBox(
      height: headerHeight,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Full-width raster/vector header illustration with accessibility semantics
          Semantics(
            label: semanticLabel,
            image: true,
            child: Image.asset(
              imagePath,
              fit: BoxFit.cover,
              alignment: Alignment.center,
              errorBuilder: (context, error, stackTrace) {
                // High-contrast fallback container if asset loading fails
                return Container(
                  color: const Color(0xFF0F172A),
                  child: const Center(
                    child: Icon(Icons.shield_rounded, size: 48, color: Color(0xFFE11D48)),
                  ),
                );
              },
            ),
          ),

          // 2. High-contrast dark overlay so text stays readable
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withValues(alpha: 0.45),
                  Colors.black.withValues(alpha: 0.65),
                  isDark ? scaffoldBg.withValues(alpha: 0.95) : const Color(0xFF0F172A).withValues(alpha: 0.90),
                ],
                stops: const [0.0, 0.6, 1.0],
              ),
            ),
          ),

          // 3. Navigation Back Button (when applicable)
          if (showBackButton)
            Positioned(
              top: MediaQuery.of(context).padding.top + 8,
              left: 12,
              child: IconButton(
                icon: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 24),
                tooltip: 'Back',
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),

          // 4. Header Text & Badge content anchored over overlay
          Positioned(
            left: 24,
            right: 24,
            bottom: 20,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (trailingBadge != null) ...[
                  trailingBadge!,
                  const SizedBox(height: 8),
                ],
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    letterSpacing: -0.5,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    subtitle!,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.white.withValues(alpha: 0.85),
                      height: 1.3,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
