import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Alert, Linking } from 'react-native';
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
import { FirestoreDatabase } from '../services/database/firestoreService';

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
  signInAsDemo: () => Promise<void>;
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

const MOBILE_REVERSE_SCHEME =
  'com.googleusercontent.apps.65870687688-m9plrvb7ppq8hv8u3j9h2dmndqrlks6s';

const MOBILE_REVERSE_REDIRECT_URI = `${MOBILE_REVERSE_SCHEME}:/oauthredirect`;

const STORAGE_AUTH_KEY = '@digilocal_google_auth_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const processedCodesRef = useRef<Set<string>>(new Set());

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

  /**
   * Parses an incoming Google OAuth redirect URL (e.g. com.googleusercontent.apps...:/oauthredirect?code=...)
   * and exchanges the authorization code for an access_token, refresh_token, and id_token.
   */
  const completeOAuthRedirectUrl = async (redirectUrl: string): Promise<boolean> => {
    if (!redirectUrl || !redirectUrl.includes('com.googleusercontent.apps.')) {
      return false;
    }

    const rawQuery = (redirectUrl.split('?')[1] || redirectUrl.split('#')[1] || '').split('#')[0];
    if (!rawQuery) {
      return false;
    }

    const params = new URLSearchParams(rawQuery);
    const code = params.get('code');
    const oauthError = params.get('error');

    if (oauthError) {
      throw new Error(`Google OAuth returned: ${oauthError}`);
    }

    if (!code) {
      return false;
    }

    if (processedCodesRef.current.has(code)) {
      return true;
    }
    processedCodesRef.current.add(code);

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
      processedCodesRef.current.delete(code);
      throw new Error(
        tokenData.error_description ||
          tokenData.error ||
          'Failed to exchange authorization code for access token'
      );
    }

    const token: string = tokenData.access_token;
    const idToken: string | undefined = tokenData.id_token;
    const refreshTok: string | undefined = tokenData.refresh_token;

    let profileJson: any = {};
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userInfoRes.ok) {
        profileJson = await userInfoRes.json();
      }
    } catch {
      // Fallback to id_token payload if userinfo request fails
    }

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

    // Persist directly to Firebase Firestore DB
    try {
      const bizId = `biz_${profile.uid.slice(0, 8)}`;
      await FirestoreDatabase.saveGoogleOAuthConnection(bizId, {
        accountEmail: profile.email,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        accessToken: token,
        refreshToken: refreshTok,
        connectedByUid: profile.uid,
      });
    } catch (dbErr) {
      console.log('[AuthContext] Firestore save Google OAuth note:', dbErr);
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
  };

  useEffect(() => {
    if (!isExpoGo && GoogleSignin) {
      try {
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
      } catch (e) {
        console.warn('Native GoogleSignin configure note:', e);
      }
    }

    const restoreGoogleSession = async () => {
      // 1. Check persisted OAuth session first and refresh token if expired
      try {
        const raw = await AsyncStorage.getItem(STORAGE_AUTH_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.user && parsed?.accessToken) {
            setUser(parsed.user);
            let activeTok: string = parsed.accessToken;
            const savedRefresh: string | null = parsed.refreshToken || null;
            if (savedRefresh) {
              setRefreshTokenValue(savedRefresh);
            }

            // Verify if token is still valid or needs refresh
            let needsRefresh = Date.now() - (parsed.savedAt || 0) > 40 * 60 * 1000;
            if (!needsRefresh) {
              try {
                const checkRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${activeTok}` },
                });
                if (checkRes.status === 401) {
                  needsRefresh = true;
                }
              } catch {
                // Network offline, keep cached token for now
              }
            }

            if (needsRefresh && savedRefresh) {
              try {
                const body = new URLSearchParams({
                  client_id: MOBILE_OAUTH_CLIENT_ID,
                  grant_type: 'refresh_token',
                  refresh_token: savedRefresh,
                }).toString();
                const res = await fetch('https://oauth2.googleapis.com/token', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body,
                });
                const data = await res.json();
                if (res.ok && data.access_token) {
                  activeTok = data.access_token;
                  await persistSession(parsed.user, activeTok, savedRefresh);
                }
              } catch {
                // Ignore refresh network error
              }
            }

            setAccessToken(activeTok);
          }
        }
      } catch {
        // ignore
      }

      // 2. Check if app was opened/resumed with a pending Google OAuth redirect URL
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && initialUrl.includes('com.googleusercontent.apps.')) {
          await completeOAuthRedirectUrl(initialUrl);
        }
      } catch {
        // ignore
      }

      // 3. Also attempt silent restore of native Google session if available
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

    const linkingSub = Linking.addEventListener('url', async (event) => {
      if (event?.url && event.url.includes('com.googleusercontent.apps.')) {
        try {
          setIsLoading(true);
          await completeOAuthRedirectUrl(event.url);
        } catch (err) {
          console.warn('Linking OAuth completion error:', err);
        } finally {
          setIsLoading(false);
        }
      }
    });

    const unsubscribe = onAuthStateChanged(auth, (fUser) => {
      setFirebaseUser(fUser);
    });

    restoreGoogleSession();

    return () => {
      linkingSub.remove();
      unsubscribe();
    };
  }, []);

  /**
   * Google-compliant OAuth 2.0 Authorization Code flow using the verified Reverse Client ID scheme.
   * Works across Android & iOS without requiring Android SHA-1 matching.
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
      `&prompt=${encodeURIComponent('consent select_account')}`;

    let capturedRedirectUrl: string | null = null;
    let resolveRedirectPromise: ((url: string | null) => void) | null = null;
    const redirectCapturePromise = new Promise<string | null>((resolve) => {
      resolveRedirectPromise = resolve;
    });

    const tempLinkingSub = Linking.addEventListener('url', (event) => {
      if (event?.url && event.url.includes('com.googleusercontent.apps.')) {
        capturedRedirectUrl = event.url;
        if (resolveRedirectPromise) {
          resolveRedirectPromise(event.url);
        }
      }
    });

    try {
      // Pass MOBILE_REVERSE_SCHEME as returnUrl prefix so both :/oauthredirect and :///oauthredirect match
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        MOBILE_REVERSE_SCHEME
      );

      let finalUrl: string | null =
        result.type === 'success' && result.url ? result.url : capturedRedirectUrl;

      // On Android, AppState change to 'active' often resolves openAuthSessionAsync with 'dismiss'
      // a few milliseconds before Linking delivers the deep link intent. Wait up to 2500ms for it.
      if (!finalUrl) {
        finalUrl = await Promise.race([
          redirectCapturePromise,
          new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 2500)),
        ]);
      }

      if (!finalUrl) {
        return false;
      }

      return await completeOAuthRedirectUrl(finalUrl);
    } finally {
      tempLinkingSub.remove();
    }
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

    const signInResult = await GoogleSignin.signIn();
    if (!signInResult || signInResult.type === 'cancelled') {
      return false;
    }

    const userInfo = signInResult?.data?.user || signInResult?.user;
    if (!userInfo) {
      return false;
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
      // 1. Primary Flow: Google-compliant Reverse-Client-ID OAuth 2.0 Code Flow
      // Works across all Android/iOS builds regardless of keystore SHA-1 and requests GMB scope in one step
      const oauthCompleted = await signInWithReverseSchemeOAuth();
      if (oauthCompleted) {
        return;
      }

      // 2. Fallback Flow: Native Google Sign-In (if user has matching SHA-1 registered)
      if (!isExpoGo && GoogleSignin) {
        try {
          const nativeCompleted = await tryNativeGoogleSignIn();
          if (nativeCompleted) {
            return;
          }
        } catch (nativeErr: any) {
          console.log(
            'Native Google Sign-In note:',
            nativeErr?.code,
            nativeErr?.message
          );
        }
      }
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

  const signInAsDemo = async () => {
    setIsLoading(true);
    try {
      const demoProfile: UserProfile = {
        uid: 'demo_business_owner_101',
        email: 'demo.owner@digilocal.ai',
        displayName: 'Rahul Sharma (DigiBirds)',
        photoURL: undefined,
      };
      const demoToken = 'demo_access_token_verified_101';
      setAccessToken(demoToken);
      setUser(demoProfile);
      await persistSession(demoProfile, demoToken);
    } catch (e) {
      console.warn('Demo login error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTokens = async (): Promise<string | null> => {
    let candidateRefresh = refreshTokenValue;
    if (!candidateRefresh) {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_AUTH_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.refreshToken) {
            candidateRefresh = parsed.refreshToken;
            setRefreshTokenValue(parsed.refreshToken);
          }
        }
      } catch {
        // ignore
      }
    }

    if (candidateRefresh) {
      try {
        const body = new URLSearchParams({
          client_id: MOBILE_OAUTH_CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: candidateRefresh,
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
            await persistSession(user, data.access_token, candidateRefresh);
          }
          return data.access_token;
        }
      } catch (e) {
        console.warn('OAuth token refresh error:', e);
      }
    }

    if (!isExpoGo && GoogleSignin) {
      try {
        const tokens = await GoogleSignin.getTokens();
        if (tokens?.accessToken && tokens.accessToken !== accessToken) {
          setAccessToken(tokens.accessToken);
          return tokens.accessToken;
        }
      } catch {
        // ignore
      }
    }

    return null;
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
