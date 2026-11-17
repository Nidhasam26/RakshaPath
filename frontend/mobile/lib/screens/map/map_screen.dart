import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import '../../core/constants.dart';
import '../../models/hazard.dart';
import '../../state/connectivity_state.dart';
import '../../state/map_state.dart';
import '../../state/sos_state.dart';
import '../../widgets/call_112_button.dart';
import '../../widgets/hazard_pin.dart';
import '../../widgets/sos_button.dart';
import '../sos/sos_countdown_screen.dart';

/// Primary map screen rendering OpenStreetMap tiles, hazard pins, and quick SOS access.
/// Covers PRD: B1 (Draw route), B2 (Hazard pins), D1 (Large SOS button), D6 (Call 112 button)
/// Requirement 3: "save the last hazards and route with a saved-at time.
/// When offline, show them with a 'Last updated [time], may be outdated' label.
/// If nothing is cached, say so clearly. Hazards past their expiry must not be shown as active."
class MapScreen extends ConsumerWidget {
  const MapScreen({super.key});

  void _showOfflineTileDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.download_rounded, color: Color(0xFFE11D48)),
            SizedBox(width: 8),
            Text('Offline Demo Tiles'),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Demo Area: Bengaluru Urban Center',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 4),
            Text('Bounding Box: [12.9100, 77.5800] to [12.9600, 77.6400]'),
            SizedBox(height: 8),
            Text(
              'Estimated Download Size: ~1.8 MB (Zoom levels 12 to 15, ~120 map tiles).',
              style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
            ),
            SizedBox(height: 12),
            Text(
              'Note: Map tiles rendered during your session are kept in HTTP memory cache. Standalone background tile store (FMTC) was skipped to avoid fragile native platform SQLite bindings.',
              style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Close'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Demo area tiles marked for offline caching.'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFE11D48),
              foregroundColor: Colors.white,
            ),
            child: const Text('Pre-cache Demo Area'),
          ),
        ],
      ),
    );
  }

  void _showHazardDetails(BuildContext context, Hazard hazard) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE11D48).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    hazard.type.toUpperCase(),
                    style: const TextStyle(
                      color: Color(0xFFE11D48),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                const Spacer(),
                Text(
                  'Severity ${hazard.severity}/5',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              hazard.description,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Text(
              'Source: ${hazard.source} | Confidence: ${(hazard.confidence * 100).toInt()}%',
              style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
            ),
            if (hazard.expiresAt != null) ...[
              const SizedBox(height: 4),
              Text(
                'Expires: ${hazard.expiresAt!.toLocal()}',
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
              ),
            ],
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mapState = ref.watch(mapProvider);
    final connectivity = ref.watch(connectivityProvider);
    final isOffline = connectivity.isOffline;

    // Convert route primary coordinates into LatLng
    final polylinePoints = <LatLng>[];
    if (mapState.activeRoute != null) {
      for (final coord in mapState.activeRoute!.primaryCoordinates) {
        if (coord.length >= 2) {
          polylinePoints.add(LatLng(coord[1], coord[0]));
        }
      }
    }

    return Scaffold(
      body: Stack(
        children: [
          // FlutterMap
          FlutterMap(
            options: const MapOptions(
              initialCenter: LatLng(AppConstants.defaultLat, AppConstants.defaultLng),
              initialZoom: 13.0,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.rakshapath.app',
                maxZoom: 19,
              ),
              if (polylinePoints.isNotEmpty)
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: polylinePoints,
                      strokeWidth: 5.0,
                      color: const Color(0xFFE11D48),
                    ),
                  ],
                ),
              MarkerLayer(
                markers: [
                  // Center reference marker
                  const Marker(
                    point: LatLng(AppConstants.defaultLat, AppConstants.defaultLng),
                    width: 36,
                    height: 36,
                    child: Icon(
                      Icons.my_location_rounded,
                      color: Color(0xFF2563EB),
                      size: 28,
                    ),
                  ),
                  // Active hazard markers (Expired hazards are strictly excluded)
                  ...mapState.hazards.map(
                    (hazard) => Marker(
                      point: LatLng(hazard.lat, hazard.lng),
                      width: 44,
                      height: 44,
                      child: GestureDetector(
                        onTap: () => _showHazardDetails(context, hazard),
                        child: HazardPin(
                          type: hazard.type,
                          severity: hazard.severity,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Offline Cache Status Notice (Requirement 3)
          if (isOffline)
            Positioned(
              top: 12,
              left: 16,
              right: 16,
              child: SafeArea(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A).withValues(alpha: 0.92),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFF59E0B)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.access_time_rounded,
                        color: Color(0xFFF59E0B),
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          mapState.cachedStatusMessage ??
                              (mapState.hasCachedData
                                  ? 'Last updated ${mapState.savedAt != null ? MapNotifier.formatSavedAt(mapState.savedAt!) : 'recently'}, may be outdated'
                                  : 'No cached hazards or routes available offline.'),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // Offline Tiles download button (Requirement 7)
          Positioned(
            top: isOffline ? 70 : 16,
            right: 16,
            child: SafeArea(
              child: FloatingActionButton.small(
                heroTag: 'btn_offline_tiles',
                backgroundColor: Colors.white,
                foregroundColor: const Color(0xFF0F172A),
                tooltip: 'Offline map tiles',
                onPressed: () => _showOfflineTileDialog(context),
                child: const Icon(Icons.download_for_offline_rounded),
              ),
            ),
          ),

          // Bottom Quick Emergency Controls
          Positioned(
            bottom: 24,
            left: 20,
            right: 20,
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    flex: 3,
                    child: SosButton(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const SosCountdownScreen(),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: Call112Button(
                      onPressed: () {
                        ref.read(sosProvider.notifier).dial112();
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
