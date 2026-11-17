import 'package:flutter/material.dart';

/// Screen for managing 1 to 5 trusted family and emergency contacts.
/// Covers PRD: D8 (Save 1 to 5 trusted contacts)
/// TODO: Wire up contact picker from device address book, relationship tags, and delete dialog.
class ContactsScreen extends StatelessWidget {
  const ContactsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text('Contacts Screen (TODO: 1 to 5 Trusted Emergency Contacts)'),
      ),
    );
  }
}
