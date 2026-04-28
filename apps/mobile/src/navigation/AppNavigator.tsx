import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';

// Screens
import { LoginScreen } from '../screens/LoginScreen';
import { GuestHomeScreen } from '../screens/GuestHomeScreen';
import { EmergencyTypeScreen } from '../screens/EmergencyTypeScreen';
import { SOSConfirmScreen } from '../screens/SOSConfirmScreen';
import { ZoneMapScreen } from '../screens/ZoneMapScreen';
import { StaffDashboardScreen } from '../screens/StaffDashboardScreen';
import { StaffIncidentDetailScreen } from '../screens/StaffIncidentDetailScreen';
import { StaffCreateIncidentScreen } from '../screens/StaffCreateIncidentScreen';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: '#0A0E1A' },
  animation: 'slide_from_right' as const,
};

export const AppNavigator = () => {
  const { user } = useAppStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {!user ? (
          // Auth Stack
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : user.role === 'GUEST' ? (
          // Guest Stack
          <>
            <Stack.Screen name="GuestHome" component={GuestHomeScreen} />
            <Stack.Screen name="EmergencyType" component={EmergencyTypeScreen} />
            <Stack.Screen name="SOSConfirm" component={SOSConfirmScreen} />
            <Stack.Screen name="ZoneMap" component={ZoneMapScreen} />
          </>
        ) : (
          // Staff / Admin Stack
          <>
            <Stack.Screen name="StaffDashboard" component={StaffDashboardScreen} />
            <Stack.Screen name="StaffIncidentDetail" component={StaffIncidentDetailScreen} />
            <Stack.Screen name="StaffCreateIncident" component={StaffCreateIncidentScreen} />
            <Stack.Screen name="ZoneMap" component={ZoneMapScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
