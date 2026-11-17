import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';

/// Application bootstrap entry point wrapping app with Riverpod ProviderScope.
/// Covers PRD: Section 6 (Level 1 Core initialization)
/// TODO: Initialize native Android push channels and local persistent cache.
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    const ProviderScope(
      child: RakshaPathApp(),
    ),
  );
}
