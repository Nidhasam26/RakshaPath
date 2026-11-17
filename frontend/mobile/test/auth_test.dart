import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:rakshapath/core/constants.dart';
import 'package:rakshapath/core/router.dart';
import 'package:rakshapath/data/repositories/auth_repository.dart';
import 'package:rakshapath/screens/auth/sign_in_screen.dart';
import 'package:rakshapath/screens/auth/sign_up_screen.dart';
import 'package:rakshapath/screens/auth/welcome_screen.dart';
import 'package:rakshapath/screens/home_shell.dart';
import 'package:rakshapath/state/auth_state.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Validation Tests', () {
    test('validatePhone requires 10-digit numeric value', () {
      expect(AppConstants.validatePhone(null), 'Phone number is required');
      expect(AppConstants.validatePhone(''), 'Phone number is required');
      expect(AppConstants.validatePhone('   '), 'Phone number is required');
      expect(AppConstants.validatePhone('12345'), 'Phone number must be exactly 10 digits');
      expect(AppConstants.validatePhone('12345678901'), 'Phone number must be exactly 10 digits');
      expect(AppConstants.validatePhone('98765abcde'), 'Phone number must be exactly 10 digits');
      expect(AppConstants.validatePhone('9876543210'), isNull);
    });

    test('validatePassword requires at least 6 characters', () {
      expect(AppConstants.validatePassword(null), 'Password is required');
      expect(AppConstants.validatePassword(''), 'Password is required');
      expect(AppConstants.validatePassword('12345'), 'Password must be at least 6 characters');
      expect(AppConstants.validatePassword('123456'), isNull);
      expect(AppConstants.validatePassword('password123'), isNull);
    });

    test('validateName requires at least 2 characters', () {
      expect(AppConstants.validateName(null), 'Full name is required');
      expect(AppConstants.validateName(''), 'Full name is required');
      expect(AppConstants.validateName('A'), 'Name must be at least 2 characters');
      expect(AppConstants.validateName('Rohan Sharma'), isNull);
    });
  });

  group('MockAuthRepository Tests', () {
    late MockAuthRepository repo;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      repo = MockAuthRepository();
    });

    test('initial state is unauthenticated', () async {
      expect(await repo.isSignedIn(), isFalse);
      expect(await repo.getCurrentUser(), isNull);
    });

    test('signs in successfully with demo credentials', () async {
      final user = await repo.signIn(
        MockAuthRepository.demoPhone,
        MockAuthRepository.demoPassword,
      );
      expect(user, isNotNull);
      expect(user!.name, MockAuthRepository.demoName);
      expect(user.phone, MockAuthRepository.demoPhone);

      expect(await repo.isSignedIn(), isTrue);
      final currentUser = await repo.getCurrentUser();
      expect(currentUser?.phone, MockAuthRepository.demoPhone);
    });

    test('fails sign in with wrong password', () async {
      expect(
        () => repo.signIn(MockAuthRepository.demoPhone, 'wrongpassword'),
        throwsA(isA<Exception>()),
      );
      expect(await repo.isSignedIn(), isFalse);
    });

    test('fails sign in with unknown phone number', () async {
      expect(
        () => repo.signIn('9999999999', 'password123'),
        throwsA(isA<Exception>()),
      );
      expect(await repo.isSignedIn(), isFalse);
    });

    test('signs up new user and persists session', () async {
      final user = await repo.signUp('Priya Patel', '9123456780', 'securePass');
      expect(user, isNotNull);
      expect(user!.name, 'Priya Patel');
      expect(user.phone, '9123456780');

      expect(await repo.isSignedIn(), isTrue);

      // Sign out and sign back in with new account
      await repo.signOut();
      expect(await repo.isSignedIn(), isFalse);

      final loggedInUser = await repo.signIn('9123456780', 'securePass');
      expect(loggedInUser?.name, 'Priya Patel');
      expect(await repo.isSignedIn(), isTrue);
    });

    test('signOut clears stored session', () async {
      await repo.signIn(
        MockAuthRepository.demoPhone,
        MockAuthRepository.demoPassword,
      );
      expect(await repo.isSignedIn(), isTrue);

      await repo.signOut();
      expect(await repo.isSignedIn(), isFalse);
      expect(await repo.getCurrentUser(), isNull);
    });
  });

  group('Router Guard Tests', () {
    test('unauthenticated user cannot reach home route', () {
      final route = AppRouter.generateRoute(
        const RouteSettings(name: AppRouter.home),
        isAuthenticated: false,
      );
      expect(route, isA<MaterialPageRoute>());
      final materialRoute = route as MaterialPageRoute;
      final widget = materialRoute.builder(
        // ignore: invalid_use_of_protected_member
        _MockBuildContext(),
      );
      expect(widget, isA<WelcomeScreen>());
    });

    test('unauthenticated user can reach welcome, sign-in, and sign-up', () {
      final welcomeRoute = AppRouter.generateRoute(
        const RouteSettings(name: AppRouter.welcome),
        isAuthenticated: false,
      ) as MaterialPageRoute;
      expect(welcomeRoute.builder(_MockBuildContext()), isA<WelcomeScreen>());

      final signInRoute = AppRouter.generateRoute(
        const RouteSettings(name: AppRouter.signIn),
        isAuthenticated: false,
      ) as MaterialPageRoute;
      expect(signInRoute.builder(_MockBuildContext()), isA<SignInScreen>());

      final signUpRoute = AppRouter.generateRoute(
        const RouteSettings(name: AppRouter.signUp),
        isAuthenticated: false,
      ) as MaterialPageRoute;
      expect(signUpRoute.builder(_MockBuildContext()), isA<SignUpScreen>());
    });

    test('authenticated user is redirected away from auth screens to home', () {
      final welcomeRoute = AppRouter.generateRoute(
        const RouteSettings(name: AppRouter.welcome),
        isAuthenticated: true,
      ) as MaterialPageRoute;
      expect(welcomeRoute.builder(_MockBuildContext()), isA<HomeShell>());

      final signInRoute = AppRouter.generateRoute(
        const RouteSettings(name: AppRouter.signIn),
        isAuthenticated: true,
      ) as MaterialPageRoute;
      expect(signInRoute.builder(_MockBuildContext()), isA<HomeShell>());

      final signUpRoute = AppRouter.generateRoute(
        const RouteSettings(name: AppRouter.signUp),
        isAuthenticated: true,
      ) as MaterialPageRoute;
      expect(signUpRoute.builder(_MockBuildContext()), isA<HomeShell>());

      final homeRoute = AppRouter.generateRoute(
        const RouteSettings(name: AppRouter.home),
        isAuthenticated: true,
      ) as MaterialPageRoute;
      expect(homeRoute.builder(_MockBuildContext()), isA<HomeShell>());
    });
  });

  group('Riverpod Auth State Tests', () {
    test('AuthNotifier updates state on signIn and signOut', () async {
      SharedPreferences.setMockInitialValues({});
      final container = ProviderContainer();
      addTearDown(container.dispose);

      // Initial state
      final initial = container.read(authProvider);
      expect(initial.isLoading, isTrue);

      // Wait for session check
      await container.read(authProvider.notifier).checkSession();
      expect(container.read(authProvider).isAuthenticated, isFalse);

      // Sign in
      final success = await container.read(authProvider.notifier).signIn(
            MockAuthRepository.demoPhone,
            MockAuthRepository.demoPassword,
          );
      expect(success, isTrue);
      expect(container.read(authProvider).isAuthenticated, isTrue);
      expect(container.read(authProvider).user?.name, MockAuthRepository.demoName);

      // Sign out
      await container.read(authProvider.notifier).signOut();
      expect(container.read(authProvider).isAuthenticated, isFalse);
      expect(container.read(authProvider).user, isNull);
    });

    test('AuthNotifier sets error message on bad password', () async {
      SharedPreferences.setMockInitialValues({});
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final success = await container.read(authProvider.notifier).signIn(
            MockAuthRepository.demoPhone,
            'badpass',
          );
      expect(success, isFalse);
      expect(container.read(authProvider).isAuthenticated, isFalse);
      expect(container.read(authProvider).errorMessage, isNotNull);
    });
  });

  group('Auth Screen UI & Image Header Tests', () {
    testWidgets('WelcomeScreen renders image header and branding', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: WelcomeScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byType(Image), findsOneWidget);
      expect(find.byType(SingleChildScrollView), findsOneWidget);
      expect(find.text(AppConstants.appName), findsOneWidget);
      expect(find.byKey(const Key('welcome_signin_button')), findsOneWidget);
      expect(find.byKey(const Key('welcome_signup_button')), findsOneWidget);
    });

    testWidgets('SignInScreen renders full-width header image and form scrolls', (tester) async {
      SharedPreferences.setMockInitialValues({});
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: SignInScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byType(Image), findsOneWidget);
      expect(find.text('Welcome Back'), findsOneWidget);
      expect(find.text('Mobile Phone Number'), findsOneWidget);
      expect(find.text('Password'), findsOneWidget);
      expect(find.byType(SingleChildScrollView), findsOneWidget);

      await tester.drag(find.byType(SingleChildScrollView), const Offset(0, -200));
      await tester.pump();
      expect(find.byKey(const Key('signin_submit_button')), findsOneWidget);
    });

    testWidgets('SignUpScreen renders full-width header image and form scrolls', (tester) async {
      SharedPreferences.setMockInitialValues({});
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: SignUpScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byType(Image), findsOneWidget);
      expect(find.text('Join RakshaPath'), findsOneWidget);
      expect(find.text('Full Name'), findsOneWidget);
      expect(find.text('Mobile Phone Number'), findsOneWidget);
      expect(find.text('Password'), findsOneWidget);
      expect(find.byType(SingleChildScrollView), findsOneWidget);

      await tester.drag(find.byType(SingleChildScrollView), const Offset(0, -200));
      await tester.pump();
      expect(find.byKey(const Key('signup_submit_button')), findsOneWidget);
    });
  });
}

// Lightweight mock build context for route tests
class _MockBuildContext implements BuildContext {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
