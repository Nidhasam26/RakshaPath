import 'package:flutter/material.dart';
import '../core/demo_tag.dart';
import '../widgets/offline_banner.dart';
import '../widgets/sync_queue_banner.dart';
import 'map/map_screen.dart';
import 'profile/profile_screen.dart';

/// Primary bottom navigation shell container holding Map, Trip, Contacts, and Profile.
/// Covers PRD: Section 6 (Level 1 Core Navigation), Section 8 (Key user flows)
/// Requirement 2: "a slim, high-contrast banner on every tab when offline:
/// 'You are offline. SOS still works by SMS.' Disappears when back online."
/// Requirement 6: "When internet returns, show '1 SOS alert waiting to sync' and a Sync now button"
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _currentIndex = 0;

  final List<Widget> _tabs = [
    const MapScreen(),
    const _TabPlaceholder(
      title: 'Trip Telemetry',
      subtitle: 'Active route navigation, location stream, and ahead-of-danger push alerts.',
      icon: Icons.navigation_rounded,
      tag: 'Trip Module',
    ),
    const _TabPlaceholder(
      title: 'Trusted Contacts',
      subtitle: 'Manage 1 to 5 emergency family and police contacts for instant alert dispatch.',
      icon: Icons.contacts_rounded,
      tag: 'Contacts Module',
    ),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // Slim high-contrast banner displayed on every tab when offline (Requirement 2)
            const OfflineBanner(),

            // Sync prompt banner displayed when back online with pending alerts (Requirement 6)
            const SyncQueueBanner(),

            // Active Tab Content
            Expanded(
              child: IndexedStack(
                index: _currentIndex,
                children: _tabs,
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
        indicatorColor: const Color(0xFFE11D48).withValues(alpha: 0.15),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.map_outlined),
            selectedIcon: Icon(Icons.map_rounded, color: Color(0xFFE11D48)),
            label: 'Map',
          ),
          NavigationDestination(
            icon: Icon(Icons.navigation_outlined),
            selectedIcon: Icon(Icons.navigation_rounded, color: Color(0xFFE11D48)),
            label: 'Trip',
          ),
          NavigationDestination(
            icon: Icon(Icons.contacts_outlined),
            selectedIcon: Icon(Icons.contacts_rounded, color: Color(0xFFE11D48)),
            label: 'Contacts',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline_rounded),
            selectedIcon: Icon(Icons.person_rounded, color: Color(0xFFE11D48)),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

class _TabPlaceholder extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final String tag;

  const _TabPlaceholder({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.tag,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        elevation: 0,
        backgroundColor: Colors.transparent,
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 412),
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE11D48).withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(icon, size: 36, color: const Color(0xFFE11D48)),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    title,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    subtitle,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 16),
                  DemoTag(label: '$tag (Pending Logic)'),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
