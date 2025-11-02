import { useMemo } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import type {
  TicketCatalogMatchContract,
  TicketCatalogResponseContract,
  WalletAccountContract,
} from '@rayon/contracts';

import { useHermesStartupTrace } from './src/profiling/useHermesStartupTrace';

const sampleCatalog: TicketCatalogResponseContract = {
  matches: [
    {
      id: 'upcoming-match',
      opponent: 'APR FC',
      kickoff: new Date().toISOString(),
      venue: 'Amahoro Stadium',
      competition: 'Rwanda Premier League',
      status: 'scheduled',
      zones: [
        { zone: 'VIP', price: 20000, capacity: 500, remaining: 320, gate: 'VIP North' },
        { zone: 'REGULAR', price: 10000, capacity: 4000, remaining: 2140, gate: 'Blue Gate' },
      ],
    },
  ],
};

const wallet: WalletAccountContract = {
  id: 'wallet-1',
  userId: 'user-1',
  balance: 8500,
  currency: 'RWF',
  updatedAt: new Date().toISOString(),
};

function formatMatch(match: TicketCatalogMatchContract) {
  return `${match.opponent} • ${new Date(match.kickoff).toLocaleString()}`;
}

export default function App() {
  useHermesStartupTrace({ label: 'app-startup', flushDelayMs: 8000 });
  const nextMatch = useMemo(() => sampleCatalog.matches[0], []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Rayon Sports Mobile</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Next Match</Text>
          <Text accessibilityRole="header" style={styles.cardBody}>
            {formatMatch(nextMatch)}
          </Text>
          <View style={styles.zoneRow}>
            {nextMatch.zones.map((zone) => (
              <View key={zone.zone} style={styles.zoneChip}>
                <Text style={styles.zoneLabel}>{zone.zone}</Text>
                <Text style={styles.zoneDetail}>{`${zone.price.toLocaleString()} RWF`}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Wallet Snapshot</Text>
          <Text style={styles.cardBody}>{`${wallet.balance.toLocaleString()} ${wallet.currency}`}</Text>
          <Text style={styles.cardFooter}>Updated {new Date(wallet.updatedAt).toLocaleTimeString()}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    padding: 24,
    gap: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  cardBody: {
    fontSize: 18,
    fontWeight: '500',
    color: '#f1f5f9',
  },
  cardFooter: {
    fontSize: 12,
    color: '#94a3b8',
  },
  zoneRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  zoneChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#334155',
  },
  zoneLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
  },
  zoneDetail: {
    fontSize: 12,
    color: '#cbd5f5',
  },
});
