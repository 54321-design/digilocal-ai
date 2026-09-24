import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OfflineProvider } from './src/context/OfflineContext';
import { AuthProvider } from './src/context/AuthContext';
import { BusinessProvider } from './src/context/BusinessContext';
import { GoogleProvider } from './src/context/GoogleContext';
import { ReviewsProvider } from './src/context/ReviewsContext';
import { SEOProvider } from './src/context/SEOContext';
import { CopilotProvider } from './src/context/CopilotContext';
import { CommerceProvider } from './src/context/CommerceContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <OfflineProvider>
        <AuthProvider>
          <BusinessProvider>
            <GoogleProvider>
              <ReviewsProvider>
                <SEOProvider>
                  <CopilotProvider>
                    <CommerceProvider>
                      <RootNavigator />
                    </CommerceProvider>
                  </CopilotProvider>
                </SEOProvider>
              </ReviewsProvider>
            </GoogleProvider>
          </BusinessProvider>
        </AuthProvider>
      </OfflineProvider>
    </SafeAreaProvider>
  );
}
