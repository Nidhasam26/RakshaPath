import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../data/repositories/auth_repository.dart';

/// Provider for AuthRepository instance.
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return MockAuthRepository();
});

/// Riverpod state data model for authentication.
class AuthState {
  final bool isLoading;
  final User? user;
  final String? errorMessage;

  const AuthState({
    this.isLoading = false,
    this.user,
    this.errorMessage,
  });

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    bool? isLoading,
    User? user,
    String? errorMessage,
    bool clearUser = false,
    bool clearError = false,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      user: clearUser ? null : (user ?? this.user),
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

/// Riverpod Notifier for managing login session and auth operations.
class AuthNotifier extends Notifier<AuthState> {
  late final AuthRepository _repository;

  @override
  AuthState build() {
    _repository = ref.read(authRepositoryProvider);
    // Asynchronously verify local persisted session on app startup
    Future.microtask(() => checkSession());
    return const AuthState(isLoading: true);
  }

  Future<void> checkSession() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _repository.getCurrentUser();
      state = AuthState(isLoading: false, user: user);
    } catch (_) {
      state = const AuthState(isLoading: false);
    }
  }

  Future<bool> signIn(String phone, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _repository.signIn(phone, password);
      state = AuthState(isLoading: false, user: user);
      return true;
    } catch (e) {
      final message = e.toString().replaceFirst('Exception: ', '');
      state = AuthState(isLoading: false, errorMessage: message);
      return false;
    }
  }

  Future<bool> signUp(String name, String phone, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _repository.signUp(name, phone, password);
      state = AuthState(isLoading: false, user: user);
      return true;
    } catch (e) {
      final message = e.toString().replaceFirst('Exception: ', '');
      state = AuthState(isLoading: false, errorMessage: message);
      return false;
    }
  }

  Future<void> signOut() async {
    state = state.copyWith(isLoading: true);
    try {
      await _repository.signOut();
    } finally {
      state = const AuthState(isLoading: false, user: null);
    }
  }

  void clearError() {
    if (state.errorMessage != null) {
      state = state.copyWith(clearError: true);
    }
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
