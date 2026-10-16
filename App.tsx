import React from 'react';
import { View, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { OfflineProvider } from './src/context/OfflineContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { BusinessProvider } from './src/context/BusinessContext';
import { GoogleProvider } from './src/context/GoogleContext';
import { ReviewsProvider } from './src/context/ReviewsContext';
import { PostsProvider } from './src/context/PostsContext';
import { SocialProvider } from './src/context/SocialContext';
import { SEOProvider } from './src/context/SEOContext';
import { CopilotProvider } from './src/context/CopilotContext';
import { AdminProvider } from './src/context/AdminContext';
import { QuotaProvider } from './src/context/QuotaContext';
import { RootNavigator } from './src/navigation/RootNavigator';

function AppContent() {
  const { isLoading: authLoading } = useAuth();

  // Fast splash screen with DigiBirds 360° logo while auth/session restores
  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Image
          source={require('./assets/digibirds-logo.png')}
          style={{ width: 240, height: 80 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Once auth is ready, NavigationContainer wraps RootNavigator
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <OfflineProvider>
        <AuthProvider>
          <BusinessProvider>
            <GoogleProvider>
              <ReviewsProvider>
                <PostsProvider>
                  <SocialProvider>
                    <SEOProvider>
                      <CopilotProvider>
                        <AdminProvider>
                          <QuotaProvider>
                            <AppContent />
                          </QuotaProvider>
                        </AdminProvider>
                      </CopilotProvider>
                    </SEOProvider>
                  </SocialProvider>
                </PostsProvider>
              </ReviewsProvider>
            </GoogleProvider>
          </BusinessProvider>
        </AuthProvider>
      </OfflineProvider>
    </SafeAreaProvider>
  );
}
