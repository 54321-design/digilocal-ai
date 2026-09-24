import { NativeModules } from 'react-native';

// Safe polyfill for Expo Go environment where RNGoogleSignin native binary module is absent
try {
  if (!NativeModules.RNGoogleSignin) {
    NativeModules.RNGoogleSignin = {
      configure: async () => {},
      signIn: async () => ({ user: null }),
      signOut: async () => {},
      getTokens: async () => ({ accessToken: null, idToken: null }),
      playServicesAvailable: async () => true,
      hasPlayServices: async () => true,
      isSignedIn: async () => false,
      getCurrentUser: () => null,
      clearCachedAccessToken: async () => {},
      revokeAccess: async () => {},
      addScopes: async () => null,
      addListener: () => {},
      removeListeners: () => {},
    };
  }
} catch (e) {
  // Silent fallback
}
