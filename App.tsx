import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OfflineProvider } from './src/context/OfflineContext';
import { AuthProvider } from './src/context/AuthContext';
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
                            <RootNavigator />
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
