import 'package:flutter/material.dart';
import '../screens/auth/sign_in_screen.dart';
import '../screens/auth/sign_up_screen.dart';
import '../screens/auth/welcome_screen.dart';
import '../screens/home_shell.dart';

/// Application routing definitions with authentication guard.
/// Covers PRD: Section 8 (Key user flows), Section 12 (Auth routing)
class AppRouter {
  static const String welcome = '/welcome';
  static const String signIn = '/sign-in';
  static const String signUp = '/sign-up';
  static const String home = '/home';

  static Route<dynamic> generateRoute(
    RouteSettings settings, {
    required bool isAuthenticated,
  }) {
    // Router Guard: Unauthenticated users attempting to access protected screens
    if (!isAuthenticated && settings.name == home) {
      return MaterialPageRoute(
        settings: const RouteSettings(name: welcome),
        builder: (_) => const WelcomeScreen(),
      );
    }

    // Router Guard: Authenticated users attempting to access guest auth screens
    if (isAuthenticated &&
        (settings.name == welcome ||
            settings.name == signIn ||
            settings.name == signUp)) {
      return MaterialPageRoute(
        settings: const RouteSettings(name: home),
        builder: (_) => const HomeShell(),
      );
    }

    switch (settings.name) {
      case home:
        return MaterialPageRoute(
          settings: settings,
          builder: (_) => const HomeShell(),
        );
      case signIn:
        return MaterialPageRoute(
          settings: settings,
          builder: (_) => const SignInScreen(),
        );
      case signUp:
        return MaterialPageRoute(
          settings: settings,
          builder: (_) => const SignUpScreen(),
        );
      case welcome:
      default:
        return MaterialPageRoute(
          settings: settings,
          builder: (_) =>
              isAuthenticated ? const HomeShell() : const WelcomeScreen(),
        );
    }
  }
}
