import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { auth } from '../services/firebase/config';
import {
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { UserProfile } from '../types';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
let GoogleSignin: any = null;
let statusCodes: any = {};

if (!isExpoGo) {
  try {
    const nativeModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = nativeModule.GoogleSignin;
    statusCodes = nativeModule.statusCodes;
  } catch (e) {
    console.log('Native GoogleSignin module not available');
  }
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  accessToken: string | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshTokens: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '65870687688-82s558nhgelajjc8ackoa6gnb9r3t1qe.apps.googleusercontent.com';

const IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
  '65870687688-m9plrvb7ppq8hv8u3j9h2dmndqrlks6s.apps.googleusercontent.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isExpoGo && GoogleSignin) {
      try {
        GoogleSignin.configure({
          webClientId: WEB_CLIENT_ID,
          iosClientId: IOS_CLIENT_ID,
          offlineAccess: true,
          scopes: [
            'profile',
            'email',
            'https://www.googleapis.com/auth/business.manage',
          ],
        });
      } catch (e) {
        console.warn('Native GoogleSignin configure note:', e);
      }
    }

    // Attempt silent restore of existing Google session on app startup
    const restoreGoogleSession = async () => {
      if (!isExpoGo && GoogleSignin) {
        try {
          const response = await GoogleSignin.signInSilently();
          const userInfo = (response as any)?.data?.user || (response as any)?.user;
          if (userInfo) {
            const tokens = await GoogleSignin.getTokens();
            if (tokens?.accessToken) {
              setAccessToken(tokens.accessToken);
              setUser({
                uid: userInfo.id || userInfo.email,
                email: userInfo.email,
                displayName: userInfo.name || userInfo.email.split('@')[0],
                photoURL: userInfo.photo || undefined,
              });
            }
          }
        } catch {
          // No previous silent session
        }
      }
      setIsLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, (fUser) => {
      setFirebaseUser(fUser);
      if (fUser && !user) {
        setUser({
          uid: fUser.uid,
          email: fUser.email || '',
          displayName: fUser.displayName || fUser.email?.split('@')[0] || 'User',
          photoURL: fUser.photoURL || undefined,
        });
      }
    });

    restoreGoogleSession();

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (isExpoGo || !GoogleSignin) {
      Alert.alert(
        'APK Required for Native Google Sign-In',
        'Please open DigiLocal from the installed Android APK to use native Google Sign-In.'
      );
      return;
    }

    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Clear any stale cached token before fresh sign-in
      try {
        await GoogleSignin.signOut();
      } catch {
        // ignore if not signed in
      }

      const signInResult = await GoogleSignin.signIn();

      if ((signInResult as any)?.type === 'cancelled') {
        setIsLoading(false);
        return;
      }

      const userInfo = (signInResult as any)?.data?.user || (signInResult as any)?.user;
      if (!userInfo) {
        setIsLoading(false);
        return;
      }

      // Request GMB manage scope explicitly if needed
      try {
        await GoogleSignin.addScopes({
          scopes: ['https://www.googleapis.com/auth/business.manage'],
        });
      } catch (scopeErr) {
        console.log('Scope request note:', scopeErr);
      }

      const tokens = await GoogleSignin.getTokens();
      if (!tokens?.accessToken) {
        throw new Error('Google did not return an OAuth access token.');
      }

      setAccessToken(tokens.accessToken);
      setUser({
        uid: userInfo.id || userInfo.email,
        email: userInfo.email,
        displayName: userInfo.name || userInfo.email.split('@')[0],
        photoURL: userInfo.photo || undefined,
      });

      if (tokens.idToken) {
        try {
          const credential = GoogleAuthProvider.credential(tokens.idToken, tokens.accessToken);
          await signInWithCredential(auth, credential);
        } catch (fbAuthErr) {
          console.log('Firebase auth link note:', fbAuthErr);
        }
      }
    } catch (error: any) {
      if (error.code === statusCodes?.SIGN_IN_CANCELLED) {
        // User cancelled
      } else {
        Alert.alert(
          `Google Sign-In Error (Code: ${error.code || 'Unknown'})`,
          `${error.message || 'Authentication failed'}\n\nChecklist in Google Cloud Console (Project 65870687688):\n1. Android Client ID package: com.digilocal.app\n2. Android Client ID SHA-1: EA:83:69:EE:06:EB:93:D0:45:FE:B8:6D:13:45:54:D6:A9:30:6E:6F\n3. Audience > Test users: Add your Gmail ID`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTokens = async (): Promise<string | null> => {
    if (isExpoGo || !GoogleSignin) return accessToken;
    try {
      const tokens = await GoogleSignin.getTokens();
      setAccessToken(tokens.accessToken);
      return tokens.accessToken;
    } catch (e) {
      console.warn('Token refresh error:', e);
      return accessToken;
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (!isExpoGo && GoogleSignin) {
        await GoogleSignin.signOut();
      }
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Sign out error:', e);
    } finally {
      setAccessToken(null);
      setUser(null);
      setFirebaseUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        accessToken,
        isLoading,
        signInWithGoogle,
        signOut,
        refreshTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
