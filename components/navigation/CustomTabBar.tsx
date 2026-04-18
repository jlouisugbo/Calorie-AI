import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = [
  { name: 'home', icon: 'home' as const, label: 'Home' },
  { name: 'calendar', icon: 'calendar' as const, label: 'Calendar' },
  { name: 'log', icon: 'camera' as const, label: null, isCenter: true },
  { name: 'chat', icon: 'message-circle' as const, label: 'Chat' },
  { name: 'profile', icon: 'user' as const, label: 'Profile' },
];

const FOREST_500 = '#3c6e21';
const CREAM_100 = '#f9f4e8';
const BEIGE_300 = '#d9c49a';
const OLIVE_500 = '#6b7d38';

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeRoute = state.routes[state.index]?.name;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
      {TABS.map((tab) => {
        const isActive = activeRoute === tab.name;

        if (tab.isCenter) {
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => navigation.navigate(tab.name)}
              style={styles.centerWrapper}
              activeOpacity={0.85}
            >
              <View style={[styles.centerButton, isActive && styles.centerButtonActive]}>
                <Feather name="camera" size={26} color={CREAM_100} />
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => navigation.navigate(tab.name)}
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            <Feather name={tab.icon} size={22} color={isActive ? FOREST_500 : BEIGE_300} />
            {tab.label && (
              <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: CREAM_100,
    borderTopWidth: 1,
    borderTopColor: '#e9dbbe',
    paddingTop: 8,
    paddingHorizontal: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#16280d',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: BEIGE_300,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: FOREST_500,
  },
  centerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: FOREST_500,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    marginTop: -24,
    ...Platform.select({
      ios: {
        shadowColor: '#16280d',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  centerButtonActive: {
    backgroundColor: OLIVE_500,
  },
});
