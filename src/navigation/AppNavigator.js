import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';

import { onAuthChange, getUserProfile } from '../services/authService';

// Auth
import LoginScreen           from '../screens/LoginScreen';
import RegisterScreen        from '../screens/RegisterScreen';
// Customer
import HomeScreen            from '../screens/HomeScreen';
import SearchScreen          from '../screens/SearchScreen';
import BusinessProfileScreen from '../screens/BusinessProfileScreen';
import MapViewScreen         from '../screens/MapViewScreen';
import ProfileScreen         from '../screens/ProfileScreen';
// Owner
import OwnerDashboardScreen  from '../screens/OwnerDashboardScreen';
import CreateListingScreen   from '../screens/CreateListingScreen';
import PromotionsScreen      from '../screens/PromotionsScreen';
// Admin
import AdminPanelScreen      from '../screens/AdminPanelScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const tabStyle = {
  headerShown: false,
  tabBarActiveTintColor: '#5B4BC4',
  tabBarInactiveTintColor: '#888',
  tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#e0e0e0', height: 60, paddingBottom: 8 }
};

function CustomerTabs() {
  return (
    <Tab.Navigator screenOptions={tabStyle}>
      <Tab.Screen name="Home"    component={HomeScreen}    options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Search"  component={SearchScreen}  options={{ tabBarLabel: 'Search' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

function OwnerTabs() {
  return (
    <Tab.Navigator screenOptions={tabStyle}>
      <Tab.Screen name="Dashboard"     component={OwnerDashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="CreateListing" component={CreateListingScreen}  options={{ tabBarLabel: 'Add Listing' }} />
      <Tab.Screen name="Promotions"    component={PromotionsScreen}     options={{ tabBarLabel: 'Promotions' }} />
      <Tab.Screen name="Profile"       component={ProfileScreen}        options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={tabStyle}>
      <Tab.Screen name="AdminPanel" component={AdminPanelScreen} options={{ tabBarLabel: 'Admin Panel' }} />
      <Tab.Screen name="Profile"    component={ProfileScreen}    options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [user, setUser]         = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        setUser(firebaseUser);
        setUserRole(profile?.role || 'customer');
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#5B4BC4" /></View>;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login"    component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : userRole === 'admin' ? (
          <Stack.Screen name="AdminTabs" component={AdminTabs} />
        ) : userRole === 'business_owner' ? (
          <Stack.Screen name="OwnerTabs" component={OwnerTabs} />
        ) : (
          // Customer stack — tabs + full-screen overlays
          <>
            <Stack.Screen name="CustomerTabs"    component={CustomerTabs} />
            <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} />
            <Stack.Screen name="MapView"         component={MapViewScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
