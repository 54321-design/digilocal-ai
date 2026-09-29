import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
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

const MOBILE_OAUTH_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
  '65870687688-m9plrvb7ppq8hv8u3j9h2dmndqrlks6s.apps.googleusercontent.com';

const MOBILE_REVERSE_REDIRECT_URI =
  'com.googleusercontent.apps.65870687688-m9plrvb7ppq8hv8u3j9h2dmndqrlks6s:/oauthredirect';

const STORAGE_AUTH_KEY = '@digilocal_google_auth_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const persistSession = async (
    profile: UserProfile,
    token: string,
    refreshTok?: string | null
  ) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_AUTH_KEY,
        JSON.stringify({
          user: profile,
          accessToken: token,
          refreshToken: refreshTok || null,
          savedAt: Date.now(),
        })
      );
    } catch {
      // ignore storage error
    }
  };

  useEffect(() => {
    if (!isExpoGo && GoogleSignin) {
      try {
        // Configure without offlineAccess/serverAuthCode first to prevent Android Code 10 DEVELOPER_ERROR
        GoogleSignin.configure({
          iosClientId: MOBILE_OAUTH_CLIENT_ID,
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

    const restoreGoogleSession = async () => {
      // 1. Check persisted OAuth session first
      try {
        const raw = await AsyncStorage.getItem(STORAGE_AUTH_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.user && parsed?.accessToken) {
            setUser(parsed.user);
            setAccessToken(parsed.accessToken);
            if (parsed.refreshToken) {
              setRefreshTokenValue(parsed.refreshToken);
            }
          }
        }
      } catch {
        // ignore
      }

      // 2. Also attempt silent restore of native Google session if available
      if (!isExpoGo && GoogleSignin) {
        try {
          const response = await GoogleSignin.signInSilently();
          const userInfo = (response as any)?.data?.user || (response as any)?.user;
          if (userInfo) {
            const tokens = await GoogleSignin.getTokens();
            if (tokens?.accessToken) {
              const profile: UserProfile = {
                uid: userInfo.id || userInfo.email,
                email: userInfo.email,
                displayName: userInfo.name || userInfo.email.split('@')[0],
                photoURL: userInfo.photo || undefined,
              };
              setAccessToken(tokens.accessToken);
              setUser(profile);
              await persistSession(profile, tokens.accessToken);
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
    });

    restoreGoogleSession();

    return () => unsubscribe();
  }, []);

  /**
   * Google-compliant OAuth 2.0 Authorization Code flow using the verified Reverse Client ID scheme.
   * Works across Android & iOS without requiring Android SHA-1 matching or custom 'digilocal://' scheme.
   */
  const signInWithReverseSchemeOAuth = async (): Promise<boolean> => {
    const scope = 'openid profile email https://www.googleapis.com/auth/business.manage';
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${encodeURIComponent(MOBILE_OAUTH_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(MOBILE_REVERSE_REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline` +
      `&prompt=select_account`;

    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      MOBILE_REVERSE_REDIRECT_URI
    );

    if (result.type !== 'success' || !result.url) {
      return false;
    }

    const queryPart = result.url.split('?')[1] || result.url.split('#')[1] || '';
    const params = new URLSearchParams(queryPart);
    const code = params.get('code');
    const oauthError = params.get('error');

    if (oauthError) {
      throw new Error(`Google OAuth returned: ${oauthError}`);
    }

    if (!code) {
      return false;
    }

    // Exchange authorization code for access_token, refresh_token, and id_token
    const tokenBody = new URLSearchParams({
      client_id: MOBILE_OAUTH_CLIENT_ID,
      code,
      grant_type: 'authorization_code',
      redirect_uri: MOBILE_REVERSE_REDIRECT_URI,
    }).toString();

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody,
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(
        tokenData.error_description ||
          tokenData.error ||
          'Failed to exchange authorization code for access token'
      );
    }

    const token: string = tokenData.access_token;
    const idToken: string | undefined = tokenData.id_token;
    const refreshTok: string | undefined = tokenData.refresh_token;

    // Fetch authenticated user's Google profile
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const profileJson = await userInfoRes.json();

    const profile: UserProfile = {
      uid: profileJson.sub || profileJson.email || 'google_user',
      email: profileJson.email || '',
      displayName:
        profileJson.name ||
        (profileJson.email ? profileJson.email.split('@')[0] : 'Google User'),
      photoURL: profileJson.picture || undefined,
    };

    setAccessToken(token);
    if (refreshTok) {
      setRefreshTokenValue(refreshTok);
    }
    setUser(profile);
    await persistSession(profile, token, refreshTok);

    if (idToken) {
      try {
        const credential = GoogleAuthProvider.credential(idToken, token);
        await signInWithCredential(auth, credential);
      } catch (fbErr) {
        console.log('Firebase auth link note:', fbErr);
      }
    }

    return true;
  };

  const tryNativeGoogleSignIn = async (): Promise<boolean> => {
    if (isExpoGo || !GoogleSignin) {
      return false;
    }

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    try {
      await GoogleSignin.signOut();
    } catch {
      // ignore if not signed in
    }

    let signInResult: any = null;
    try {
      // Attempt 1: Native Sign-In without webClientId/offlineAccess (avoids Code 10 from serverAuthCode)
      GoogleSignin.configure({
        iosClientId: MOBILE_OAUTH_CLIENT_ID,
        scopes: [
          'profile',
          'email',
          'https://www.googleapis.com/auth/business.manage',
        ],
      });
      signInResult = await GoogleSignin.signIn();
    } catch (firstErr: any) {
      if (firstErr?.code === statusCodes?.SIGN_IN_CANCELLED) {
        return true;
      }
      // Attempt 2: Retry with webClientId configured
      GoogleSignin.configure({
        webClientId: WEB_CLIENT_ID,
        iosClientId: MOBILE_OAUTH_CLIENT_ID,
        offlineAccess: false,
        scopes: [
          'profile',
          'email',
          'https://www.googleapis.com/auth/business.manage',
        ],
      });
      signInResult = await GoogleSignin.signIn();
    }

    if (signInResult?.type === 'cancelled') {
      return true;
    }

    const userInfo = signInResult?.data?.user || signInResult?.user;
    if (!userInfo) {
      return false;
    }

    try {
      await GoogleSignin.addScopes({
        scopes: ['https://www.googleapis.com/auth/business.manage'],
      });
    } catch {
      // Scope already included
    }

    const tokens = await GoogleSignin.getTokens();
    if (!tokens?.accessToken) {
      return false;
    }

    const profile: UserProfile = {
      uid: userInfo.id || userInfo.email,
      email: userInfo.email,
      displayName: userInfo.name || userInfo.email.split('@')[0],
      photoURL: userInfo.photo || undefined,
    };

    setAccessToken(tokens.accessToken);
    setUser(profile);
    await persistSession(profile, tokens.accessToken);

    if (tokens.idToken) {
      try {
        const credential = GoogleAuthProvider.credential(
          tokens.idToken,
          tokens.accessToken
        );
        await signInWithCredential(auth, credential);
      } catch (fbAuthErr) {
        console.log('Firebase auth link note:', fbAuthErr);
      }
    }

    return true;
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      // 1. Try Native Android/iOS Google Sign-In first
      if (!isExpoGo && GoogleSignin) {
        try {
          const completed = await tryNativeGoogleSignIn();
          if (completed) {
            return;
          }
        } catch (nativeErr: any) {
          console.log(
            'Native Google Sign-In fell back to Reverse-Scheme OAuth:',
            nativeErr?.code,
            nativeErr?.message
          );
        }
      }

      // 2. Automatic Fallback: Google-compliant Reverse-Client-ID OAuth 2.0 Code Flow
      await signInWithReverseSchemeOAuth();
    } catch (error: any) {
      if (error?.code !== statusCodes?.SIGN_IN_CANCELLED) {
        Alert.alert(
          'Google Sign-In Error',
          error?.message || 'Unable to complete Google Sign-In. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTokens = async (): Promise<string | null> => {
    if (!isExpoGo && GoogleSignin) {
      try {
        const tokens = await GoogleSignin.getTokens();
        if (tokens?.accessToken) {
          setAccessToken(tokens.accessToken);
          return tokens.accessToken;
        }
      } catch {
        // Fall through to OAuth refresh token if available
      }
    }

    if (refreshTokenValue) {
      try {
        const body = new URLSearchParams({
          client_id: MOBILE_OAUTH_CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: refreshTokenValue,
        }).toString();
        const res = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        });
        const data = await res.json();
        if (res.ok && data.access_token) {
          setAccessToken(data.access_token);
          if (user) {
            await persistSession(user, data.access_token, refreshTokenValue);
          }
          return data.access_token;
        }
      } catch (e) {
        console.warn('OAuth token refresh error:', e);
      }
    }

    return accessToken;
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem(STORAGE_AUTH_KEY);
      if (!isExpoGo && GoogleSignin) {
        try {
          await GoogleSignin.signOut();
        } catch {
          // ignore
        }
      }
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Sign out error:', e);
    } finally {
      setAccessToken(null);
      setRefreshTokenValue(null);
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
