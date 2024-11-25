import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, ScrollView, RefreshControl } from 'react-native';
import { initializeAuth, getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function AccountScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const auth = getAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUser({ ...userDoc.data(), email: user.email });
        }
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setCurrentUser({ ...userDoc.data(), email: user.email });
      }
      
      setIsLoggedIn(true);
      setError('');
    } catch (error: any) {
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Invalid email or password');
          break;
        default:
          setError('An error occurred. Please try again.');
          console.error(error);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      setEmail('');
      setPassword('');
      setError('');
      setCurrentUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user document in Firestore using email
      await setDoc(doc(db, 'users', user.uid), {
        displayName: email.split('@')[0],
        email: user.email,
        badges: [],
        joinDate: new Date().toISOString()
      });
      
      setIsLoggedIn(true);
      setError('');
    } catch (error: any) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('Email already registered');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/weak-password':
          setError('Password is too weak');
          break;
        default:
          setError('Registration failed. Please try again.');
          console.error(error);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (auth.currentUser) {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setCurrentUser({ ...userDoc.data(), email: auth.currentUser.email });
      }
    }
    setRefreshing(false);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        refreshControl={
          isLoggedIn ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#7a232f']}
              tintColor="#7a232f"
            />
          ) : undefined
        }
      >
        <ThemedText type="title" style={styles.title}>Account</ThemedText>

        <ThemedView style={styles.inputContainer}>
          {!isLoggedIn && (
            <>
              {isRegistering ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#666666"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#666666"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                  {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
                  <TouchableOpacity 
                    style={styles.button}
                    onPress={handleRegister}
                  >
                    <ThemedText style={styles.buttonText}>Register</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, styles.secondaryButton]}
                    onPress={() => setIsRegistering(false)}
                  >
                    <ThemedText style={styles.buttonText}>Back to Login</ThemedText>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#666666"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#666666"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                  {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
                  <TouchableOpacity 
                    style={styles.button}
                    onPress={handleLogin}
                  >
                    <ThemedText style={styles.buttonText}>Sign In</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setIsRegistering(true)}
                  >
                    <ThemedText style={styles.registerText}>Don't have an account? Register here</ThemedText>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
          {isLoggedIn ? (
            <ThemedView>
              <ThemedText>Welcome, {currentUser?.email}!</ThemedText>
              <ThemedView style={styles.badgesContainer}>
                <ThemedText style={styles.badgesTitle}>Your Badges:</ThemedText>
                {currentUser?.badges && currentUser.badges.length > 0 ? (
                  currentUser.badges.map((badge: string, index: number) => (
                    <ThemedText key={index} style={styles.badge}>{badge}</ThemedText>
                  ))
                ) : (
                  <ThemedText style={styles.noBadges}>No badges earned yet</ThemedText>
                )}
              </ThemedView>
              <TouchableOpacity 
                style={[styles.button, styles.loginButton]}
                onPress={handleSignOut}
              >
                <ThemedText style={styles.buttonText}>Sign Out</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ) : null}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
    marginTop: 100,
    textAlign: 'center',
    marginVertical: 40,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: '#000000'
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center'
  },
  badgesContainer: {
    marginVertical: 20,
    padding: 10,
  },
  badgesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  badge: {
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderRadius: 5,
    marginVertical: 5,
    color: '#000000'
  },
  noBadges: {
    fontStyle: 'italic',
    color: '#666',
  },
  secondaryButton: {
    backgroundColor: '#666',
    marginTop: 10,
  },
  registerText: {
    color: '#2196F3',
    textAlign: 'center',
    marginTop: 10,
  },
});
