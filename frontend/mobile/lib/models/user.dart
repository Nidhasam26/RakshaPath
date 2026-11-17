/// User profile data model.
/// Covers PRD: Section 12 (Users data model: id, name, phone, push_token, created_at)
/// TODO: Add authentication token storage and profile avatar metadata.
class User {
  final String id;
  final String name;
  final String phone;
  final String? pushToken;
  final DateTime? createdAt;

  const User({
    required this.id,
    required this.name,
    required this.phone,
    this.pushToken,
    this.createdAt,
  });
}
