import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Text as SvgText, Circle } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { ZONE_COLORS } from '../constants';
import { getZones } from '../services/api';
import { getSocket } from '../services/socket';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_WIDTH = SCREEN_WIDTH - 32;
const MAP_SCALE = MAP_WIDTH / 600;

type Props = { navigation: any; route: { params: { incident?: any } } };

interface Zone {
  id: string;
  name: string;
  type: 'DANGER' | 'CAUTION' | 'SAFE';
  floor: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ZoneMapScreen: React.FC<Props> = ({ navigation, route }) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const incident = route.params?.incident;

  useEffect(() => {
    loadZones();
    const socket = getSocket();
    socket.on('zone:statusChanged', (updatedZone: Zone) => {
      setZones((prev) => prev.map((z) => (z.id === updatedZone.id ? updatedZone : z)));
    });
    return () => { socket.off('zone:statusChanged'); };
  }, []);

  const loadZones = async () => {
    try {
      const res = await getZones();
      setZones(res.data);
    } catch (err) {
      console.error('Failed to load zones:', err);
    }
  };

  const floorZones = zones.filter((z) => z.floor === selectedFloor);

  return (
    <LinearGradient colors={['#0A0E1A', '#0A0E1A']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🗺️ Hotel Zone Map</Text>
          {incident && (
            <Text style={styles.subtitle}>
              Active: {incident.type} at {incident.location}
            </Text>
          )}
        </View>

        {/* Floor selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorRow}>
          {[-1, 0, 1, 2, 3, 4].map((floor) => (
            <TouchableOpacity
              key={floor}
              id={`map-floor-${floor}`}
              style={[styles.floorChip, selectedFloor === floor && styles.floorChipActive]}
              onPress={() => setSelectedFloor(floor)}
            >
              <Text style={[styles.floorText, selectedFloor === floor && styles.floorTextActive]}>
                {floor === -1 ? 'B1' : floor === 0 ? 'G' : `F${floor}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Zone Map SVG */}
        <View style={styles.mapContainer}>
          <Svg width={MAP_WIDTH} height={MAP_WIDTH * 0.75}>
            {/* Hotel outline */}
            <Rect
              x={2}
              y={2}
              width={MAP_WIDTH - 4}
              height={MAP_WIDTH * 0.75 - 4}
              fill="rgba(17,24,39,0.8)"
              stroke={Colors.borderLight}
              strokeWidth={2}
              rx={8}
            />

            {floorZones.length === 0 ? (
              <SvgText
                x={MAP_WIDTH / 2}
                y={MAP_WIDTH * 0.375}
                textAnchor="middle"
                fill={Colors.textMuted}
                fontSize={14}
              >
                No zones configured for this floor
              </SvgText>
            ) : (
              floorZones.map((zone) => (
                <React.Fragment key={zone.id}>
                  <Rect
                    x={zone.x * MAP_SCALE}
                    y={zone.y * MAP_SCALE}
                    width={zone.width * MAP_SCALE}
                    height={zone.height * MAP_SCALE}
                    fill={ZONE_COLORS[zone.type]}
                    stroke={
                      zone.type === 'DANGER'
                        ? Colors.danger
                        : zone.type === 'CAUTION'
                        ? Colors.warning
                        : Colors.accentGreen
                    }
                    strokeWidth={1.5}
                    rx={4}
                  />
                  <SvgText
                    x={(zone.x + zone.width / 2) * MAP_SCALE}
                    y={(zone.y + zone.height / 2 - 6) * MAP_SCALE}
                    textAnchor="middle"
                    fill={Colors.textPrimary}
                    fontSize={9}
                    fontWeight="bold"
                  >
                    {zone.name.replace('_', ' ')}
                  </SvgText>
                  <SvgText
                    x={(zone.x + zone.width / 2) * MAP_SCALE}
                    y={(zone.y + zone.height / 2 + 8) * MAP_SCALE}
                    textAnchor="middle"
                    fill={
                      zone.type === 'DANGER'
                        ? Colors.danger
                        : zone.type === 'CAUTION'
                        ? Colors.warning
                        : Colors.accentGreen
                    }
                    fontSize={8}
                  >
                    {zone.type}
                  </SvgText>
                </React.Fragment>
              ))
            )}

            {/* Exit markers */}
            {selectedFloor === 1 && (
              <>
                <Circle cx={MAP_WIDTH - 20} cy={MAP_WIDTH * 0.375} r={8} fill={Colors.accentGreen} />
                <SvgText
                  x={MAP_WIDTH - 20}
                  y={MAP_WIDTH * 0.375 + 4}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={9}
                  fontWeight="bold"
                >
                  EXIT
                </SvgText>
              </>
            )}
          </Svg>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Zone Legend</Text>
          <View style={styles.legendRow}>
            {(['DANGER', 'CAUTION', 'SAFE'] as const).map((type) => (
              <View key={type} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor:
                        type === 'DANGER'
                          ? Colors.danger
                          : type === 'CAUTION'
                          ? Colors.warning
                          : Colors.accentGreen,
                    },
                  ]}
                />
                <Text style={styles.legendText}>{type}</Text>
              </View>
            ))}
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.accentGreen }]} />
              <Text style={styles.legendText}>EXIT</Text>
            </View>
          </View>
        </View>

        {/* Guidance shortcut if incident active */}
        {incident && (
          <TouchableOpacity
            id="view-guidance-btn"
            style={styles.guidanceBtn}
            onPress={() => navigation.navigate('SOSConfirm', { incident })}
          >
            <Text style={styles.guidanceBtnText}>← Back to Guidance</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { padding: Spacing.md, paddingTop: 60 },
  header: { marginBottom: Spacing.md },
  backBtn: { marginBottom: Spacing.sm },
  backText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
  title: { ...Typography.h2 },
  subtitle: { ...Typography.bodySmall, marginTop: 4, color: Colors.danger },

  floorRow: { marginBottom: Spacing.md },
  floorChip: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: Spacing.sm,
  },
  floorChipActive: { backgroundColor: Colors.accentBlue, borderColor: Colors.accentBlue },
  floorText: { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: '600' },
  floorTextActive: { color: '#fff' },

  mapContainer: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },

  legend: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  legendTitle: { ...Typography.label, marginBottom: Spacing.sm },
  legendRow: { flexDirection: 'row', gap: Spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { ...Typography.caption, fontWeight: '700' },

  guidanceBtn: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  guidanceBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
});
