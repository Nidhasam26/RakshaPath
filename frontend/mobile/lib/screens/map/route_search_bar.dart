import 'package:flutter/material.dart';

/// Floating route search bar for entering origin and destination.
/// Covers PRD: B1 (User enters start and destination; app draws the route)
/// TODO: Wire up Nominatim geocoding autocomplete and recent searches list.
class RouteSearchBar extends StatelessWidget {
  const RouteSearchBar({super.key});

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      child: Text('Route Search Bar (TODO: Autocomplete Search)'),
    );
  }
}
