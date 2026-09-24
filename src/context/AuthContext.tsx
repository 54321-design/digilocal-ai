import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
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

WebBrowser.maybeCompleteAuthSession();

// Safely obtain native GoogleSignin only when not running in Expo Go store client
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
  signInAsDemo: () => Promise<void>;
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

    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        setUser({
          uid: fUser.uid,
          email: fUser.email || '',
          displayName: fUser.displayName || fUser.email?.split('@')[0] || 'User',
          photoURL: fUser.photoURL || undefined,
        });
      } else if (!accessToken) {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [accessToken]);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      if (isExpoGo || !GoogleSignin) {
        Alert.alert(
          'Google Sign-In on Expo Go',
          'Google Security forbids "exp://" browser redirects for Web OAuth (Error 400: invalid_request).\n\nTo test all live features (Gemini AI replies, Reviews, SEO audit, Khata, POS) right now, continue in Instant Preview Mode.\n\n(For live Google Business accounts, an Android APK build is required.)',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setIsLoading(false),
            },
            {
              text: 'Continue in Preview Mode',
              onPress: () => signInAsDemo(),
            },
          ]
        );
        setIsLoading(false);
        return;
      } else {
        // Native standalone / development build with Play Services
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const signInResult = await GoogleSignin.signIn();
        const tokens = await GoogleSignin.getTokens();
        const token = tokens.accessToken;
        setAccessToken(token);

        const userInfo = (signInResult as any).data?.user || (signInResult as any).user;
        if (userInfo) {
          setUser({
            uid: userInfo.id || userInfo.email,
            email: userInfo.email,
            displayName: userInfo.name || userInfo.email.split('@')[0],
            photoURL: userInfo.photo || undefined,
          });

          if (tokens.idToken) {
            try {
              const credential = GoogleAuthProvider.credential(tokens.idToken, token);
              await signInWithCredential(auth, credential);
            } catch (fbAuthErr) {
              console.log('Firebase auth link note:', fbAuthErr);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.code === statusCodes?.SIGN_IN_CANCELLED) {
        // User cancelled
      } else if (error.code === statusCodes?.IN_PROGRESS) {
        // In progress
      } else {
        Alert.alert('Sign-In Error', error.message || 'Unable to sign in with Google');
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
      return null;
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

  const signInAsDemo = async () => {
    setIsLoading(true);
    setUser({
      uid: 'user_demo_101',
      email: 'owner@digilocal.ai',
      displayName: 'DigiLocal Business Owner',
    });
    setAccessToken('demo_preview_token');
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        accessToken,
        isLoading,
        signInWithGoogle,
        signInAsDemo,
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
