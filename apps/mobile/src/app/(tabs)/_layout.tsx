import { Text } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { HeaderMenu } from '../../components/HeaderMenu';
import { COLORS } from '../../lib/constants';
import { FiltersProvider } from '../../lib/filters';

export default function TabsLayout() {
  return (
    <FiltersProvider>
      <Tabs
        screenOptions={{
          headerRight: () => <HeaderMenu />,
          headerTitleStyle: { color: COLORS.text },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.muted,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Liste',
            headerTitle: 'FlohmarktRadar',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📋</Text>,
          }}
        />
        <Tabs.Screen
          name="karte"
          options={{
            title: 'Karte',
            headerTitle: 'FlohmarktRadar',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🗺️</Text>,
          }}
        />
      </Tabs>
    </FiltersProvider>
  );
}
