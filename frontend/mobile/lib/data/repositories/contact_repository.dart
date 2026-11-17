import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/contact.dart';
import '../mock_data.dart';

/// Abstract trusted contacts repository interface.
/// Covers PRD: D8 (Save 1 to 5 trusted contacts)
abstract class ContactRepository {
  Future<List<Contact>> getContacts(String userId);
  Future<Contact> addContact(String userId, Contact contact);
  Future<void> deleteContact(String userId, String contactId);
}

/// Concrete mock repository for emergency contacts.
class MockContactRepository implements ContactRepository {
  final List<Contact> _contacts;

  MockContactRepository({List<Contact>? initialContacts})
      : _contacts = initialContacts != null
            ? List.from(initialContacts)
            : List.from(MockData.sampleContacts);

  @override
  Future<List<Contact>> getContacts(String userId) async {
    return List.unmodifiable(_contacts);
  }

  @override
  Future<Contact> addContact(String userId, Contact contact) async {
    _contacts.add(contact);
    return contact;
  }

  @override
  Future<void> deleteContact(String userId, String contactId) async {
    _contacts.removeWhere((c) => c.id == contactId);
  }
}

final contactRepositoryProvider = Provider<ContactRepository>((ref) {
  return MockContactRepository();
});
