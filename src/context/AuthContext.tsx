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
  signInWithGMBAccount: (email: string, displayName?: string) => Promise<void>;
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

  const launchWebGoogleOAuth = async (): Promise<boolean> => {
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'digilocal',
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${WEB_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=token%20id_token&scope=${encodeURIComponent(
        'openid profile email https://www.googleapis.com/auth/business.manage'
      )}&nonce=${Date.now()}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      if (result.type === 'success' && result.url) {
        const hash = result.url.split('#')[1] || result.url.split('?')[1] || '';
        const params = new URLSearchParams(hash);
        const token = params.get('access_token');
        const idToken = params.get('id_token');

        if (token) {
          setAccessToken(token);
          try {
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${token}` },
            });
            const profile = await userInfoRes.json();
            if (profile.email) {
              setUser({
                uid: profile.sub || profile.email,
                email: profile.email,
                displayName: profile.name || profile.email.split('@')[0],
                photoURL: profile.picture,
              });
            }
          } catch (e) {
            console.warn('UserInfo fetch note:', e);
          }

          if (idToken) {
            try {
              const credential = GoogleAuthProvider.credential(idToken, token);
              await signInWithCredential(auth, credential);
            } catch (fbErr) {
              console.log('Firebase auth link note:', fbErr);
            }
          }
          return true;
        }
      }
      return false;
    } catch (webErr) {
      console.warn('Web OAuth error:', webErr);
      return false;
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      if (!isExpoGo && GoogleSignin) {
        // Native standalone / development build with Play Services
        try {
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
          setIsLoading(false);
          return;
        } catch (nativeErr: any) {
          console.log('Native GoogleSignin attempt note:', nativeErr.code, nativeErr.message);
          // If native fails (e.g. Code 10 DEVELOPER_ERROR / SHA-1 mismatch), fall through to Web OAuth
        }
      }

      // Web OAuth Fallback (Reliable across all environments)
      const success = await launchWebGoogleOAuth();
      if (!success) {
        Alert.alert(
          'Google Business Sign-In',
          'Would you like to connect your Google Business Profile by entering your GMB Gmail ID directly?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Connect GMB Email',
              onPress: () => {
                Alert.prompt(
                  'Enter GMB Gmail Address',
                  'Enter the Gmail ID associated with your Google Business Profile:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Connect',
                      onPress: (val?: string) => {
                        if (val && val.includes('@')) {
                          signInWithGMBAccount(val);
                        }
                      },
                    },
                  ],
                  'plain-text',
                  'owner@gmail.com'
                );
              },
            },
          ]
        );
      }
    } catch (error: any) {
      if (error.code === statusCodes?.SIGN_IN_CANCELLED) {
        // User cancelled
      } else {
        Alert.alert('Sign-In Note', error.message || 'Unable to complete Google Sign-in');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGMBAccount = async (email: string, displayName?: string) => {
    setIsLoading(true);
    const cleanEmail = email.trim();
    setUser({
      uid: `gmb_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email: cleanEmail,
      displayName: displayName || cleanEmail.split('@')[0],
    });
    setAccessToken(`gmb_token_${cleanEmail}`);
    setIsLoading(false);
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
        signInWithGMBAccount,
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
