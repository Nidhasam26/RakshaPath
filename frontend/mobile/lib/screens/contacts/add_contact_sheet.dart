import 'package:flutter/material.dart';

/// Modal bottom sheet to add a new trusted contact with 10-digit phone validation.
/// Covers PRD: D8 (Save 1 to 5 trusted contacts)
/// TODO: Add contact type selector (family vs police/helpdesk) and input validation.
class AddContactSheet extends StatelessWidget {
  const AddContactSheet({super.key});

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      height: 280,
      child: Center(
        child: Text('Add Contact Sheet (TODO: Add Contact Form)'),
      ),
    );
  }
}
