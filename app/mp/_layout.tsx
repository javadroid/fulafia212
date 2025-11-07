import { Stack } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

export default function Mp() {
  return (
    <Stack
    initialRouteName='Webview'
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 200,
        ...(Platform.OS === 'ios' && {
          presentation: 'card',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }),
      }}
    >
      <Stack.Screen   
        name="Webview" 
        options={{ 
          headerShown: false,
          animation: 'fade',
        }} 
      />

     

    </Stack>
  );
}