import React from 'react';
import {  StatusBar, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function AppWebview() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'} />
      <WebView
        source={{ uri: 'https://fulafia2131.onrender.com/' }}
        style={{ flex: 1 }}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </SafeAreaView>
  );
}
