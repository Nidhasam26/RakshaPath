import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/constants.dart';
import 'core/router.dart';
import 'core/theme.dart';
import 'screens/auth/welcome_screen.dart';
import 'screens/home_shell.dart';
import 'state/auth_state.dart';

/// Application root MaterialApp widget with reactive authentication guard.
/// Covers PRD: Section 1 (Overview), Section 12 (Users), Section 15 (Theme and accessibility)
class RakshaPathApp extends ConsumerWidget {
  const RakshaPathApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return MaterialApp(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      home: authState.isLoading
          ? const _SplashScreen()
          : (authState.isAuthenticated ? const HomeShell() : const WelcomeScreen()),
      onGenerateRoute: (settings) => AppRouter.generateRoute(
        settings,
        isAuthenticated: authState.isAuthenticated,
      ),
    );
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: const Color(0xFFE11D48).withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFFE11D48), width: 2),
                ),
                child: const Icon(
                  Icons.shield_rounded,
                  size: 40,
                  color: Color(0xFFE11D48),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                AppConstants.appName,
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                AppConstants.appTagline,
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 32),
              const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: Color(0xFFE11D48),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
