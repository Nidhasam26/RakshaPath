import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../models/user.dart';

/// Abstract authentication repository interface.
/// Covers PRD: Section 12 (Users) and Level 1 Core Auth
abstract class AuthRepository {
  Future<User?> signIn(String phone, String password);
  Future<User?> signUp(String name, String phone, String password);
  Future<void> signOut();
  Future<User?> getCurrentUser();
  Future<bool> isSignedIn();
}

/// Mock implementation of AuthRepository backed by SharedPreferences session persistence.
class MockAuthRepository implements AuthRepository {
  static const String keyUserId = 'rp_auth_user_id';
  static const String keyUserName = 'rp_auth_user_name';
  static const String keyUserPhone = 'rp_auth_user_phone';
  static const String keyRegisteredUsers = 'rp_mock_registered_users';

  // Default demo user credentials
  static const String demoPhone = '9876543210';
  static const String demoPassword = 'password123';
  static const String demoName = 'Rohan Sharma';

  final SharedPreferences? _injectedPrefs;

  MockAuthRepository({SharedPreferences? prefs}) : _injectedPrefs = prefs;

  Future<SharedPreferences> get _prefs async =>
      _injectedPrefs ?? await SharedPreferences.getInstance();

  String _hashPassword(String password) {
    return sha256.convert(utf8.encode(password)).toString();
  }

  Future<Map<String, Map<String, String>>> _getRegisteredUsers() async {
    final prefs = await _prefs;
    final raw = prefs.getString(keyRegisteredUsers);
    if (raw == null || raw.isEmpty) {
      // Seed with default demo account
      return {
        demoPhone: {
          'id': 'usr_demo_01',
          'name': demoName,
          'phone': demoPhone,
          'passwordHash': _hashPassword(demoPassword),
        }
      };
    }
    try {
      final decoded = jsonDecode(raw) as Map<String, dynamic>;
      final result = <String, Map<String, String>>{};
      decoded.forEach((key, value) {
        if (value is Map) {
          result[key] = value.map((k, v) => MapEntry(k.toString(), v.toString()));
        }
      });
      // Ensure demo account is always present
      if (!result.containsKey(demoPhone)) {
        result[demoPhone] = {
          'id': 'usr_demo_01',
          'name': demoName,
          'phone': demoPhone,
          'passwordHash': _hashPassword(demoPassword),
        };
      }
      return result;
    } catch (_) {
      return {
        demoPhone: {
          'id': 'usr_demo_01',
          'name': demoName,
          'phone': demoPhone,
          'passwordHash': _hashPassword(demoPassword),
        }
      };
    }
  }

  Future<void> _saveRegisteredUsers(Map<String, Map<String, String>> users) async {
    final prefs = await _prefs;
    await prefs.setString(keyRegisteredUsers, jsonEncode(users));
  }

  @override
  Future<User?> signIn(String phone, String password) async {
    final users = await _getRegisteredUsers();
    final userRecord = users[phone];
    if (userRecord == null) {
      throw Exception('No account found for phone number $phone. Please create an account.');
    }

    final inputHash = _hashPassword(password);
    if (userRecord['passwordHash'] != inputHash) {
      throw Exception('Incorrect password. Please try again.');
    }

    final user = User(
      id: userRecord['id'] ?? 'usr_$phone',
      name: userRecord['name'] ?? 'User',
      phone: phone,
      createdAt: DateTime.now(),
    );

    // Persist active session
    final prefs = await _prefs;
    await prefs.setString(keyUserId, user.id);
    await prefs.setString(keyUserName, user.name);
    await prefs.setString(keyUserPhone, user.phone);

    return user;
  }

  @override
  Future<User?> signUp(String name, String phone, String password) async {
    final users = await _getRegisteredUsers();
    if (users.containsKey(phone) && phone != demoPhone) {
      throw Exception('An account with this phone number already exists. Please sign in.');
    }

    final newId = 'usr_${DateTime.now().millisecondsSinceEpoch}';
    final passwordHash = _hashPassword(password);

    users[phone] = {
      'id': newId,
      'name': name.trim(),
      'phone': phone.trim(),
      'passwordHash': passwordHash,
    };
    await _saveRegisteredUsers(users);

    final user = User(
      id: newId,
      name: name.trim(),
      phone: phone.trim(),
      createdAt: DateTime.now(),
    );

    // Persist active session
    final prefs = await _prefs;
    await prefs.setString(keyUserId, user.id);
    await prefs.setString(keyUserName, user.name);
    await prefs.setString(keyUserPhone, user.phone);

    return user;
  }

  @override
  Future<void> signOut() async {
    final prefs = await _prefs;
    await prefs.remove(keyUserId);
    await prefs.remove(keyUserName);
    await prefs.remove(keyUserPhone);
  }

  @override
  Future<User?> getCurrentUser() async {
    final prefs = await _prefs;
    final userId = prefs.getString(keyUserId);
    final userName = prefs.getString(keyUserName);
    final userPhone = prefs.getString(keyUserPhone);

    if (userId != null && userPhone != null) {
      return User(
        id: userId,
        name: userName ?? 'User',
        phone: userPhone,
      );
    }
    return null;
  }

  @override
  Future<bool> isSignedIn() async {
    final user = await getCurrentUser();
    return user != null;
  }
}
