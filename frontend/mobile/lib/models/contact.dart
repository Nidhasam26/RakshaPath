/// Trusted emergency contact data model.
/// Covers PRD: D8 (Save 1 to 5 trusted contacts)
/// TODO: Add phone number format validation and local secure persistence.
class Contact {
  final String id;
  final String? userId;
  final String name;
  final String phone;
  final String type; // 'family' or 'police'

  const Contact({
    required this.id,
    this.userId,
    required this.name,
    required this.phone,
    required this.type,
  });
}
