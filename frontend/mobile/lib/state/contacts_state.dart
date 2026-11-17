import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/repositories/contact_repository.dart';
import '../models/contact.dart';

/// Riverpod state management for trusted emergency contacts.
/// Covers PRD: D8 (Save 1 to 5 trusted contacts)
class ContactsState {
  final bool isLoading;
  final List<Contact> contacts;
  final String? errorMessage;

  const ContactsState({
    this.isLoading = false,
    this.contacts = const [],
    this.errorMessage,
  });

  ContactsState copyWith({
    bool? isLoading,
    List<Contact>? contacts,
    String? errorMessage,
    bool clearError = false,
  }) {
    return ContactsState(
      isLoading: isLoading ?? this.isLoading,
      contacts: contacts ?? this.contacts,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

class ContactsNotifier extends Notifier<ContactsState> {
  late final ContactRepository _repository;

  @override
  ContactsState build() {
    _repository = ref.watch(contactRepositoryProvider);
    Future.microtask(() => loadContacts());
    return const ContactsState(isLoading: true);
  }

  Future<void> loadContacts() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final list = await _repository.getContacts('current_user');
      state = ContactsState(isLoading: false, contacts: list);
    } catch (e) {
      state = ContactsState(isLoading: false, errorMessage: e.toString());
    }
  }

  Future<void> addContact(Contact contact) async {
    state = state.copyWith(isLoading: true);
    await _repository.addContact('current_user', contact);
    await loadContacts();
  }

  Future<void> deleteContact(String contactId) async {
    state = state.copyWith(isLoading: true);
    await _repository.deleteContact('current_user', contactId);
    await loadContacts();
  }
}

final contactsProvider =
    NotifierProvider<ContactsNotifier, ContactsState>(ContactsNotifier.new);
