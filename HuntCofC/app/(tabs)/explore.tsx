import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, TextInput } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// This is our pseudo backend "database" implemented as a simple object
// In a real app, this would be a proper backend server with a real database
const pseudoBackend = {
  // Store users with username as key and user data as value 
  users: new Map(),

  // Method to register/create a new user
  registerUser: function(username: string, password: string) {
    const userData = {
      username,
      password, // In a real app, this would be properly hashed
      createdAt: new Date(),
      // In a real backend, we'd have proper session tokens
      sessionToken: Math.random().toString(36).substring(7)
    };
    this.users.set(username, userData);
    return userData;
  },

  // Method to get user data
  getUser: function(username: string) {
    return this.users.get(username);
  },

  // Method to check if user exists and validate password
  validateUser: function(username: string, password: string) {
    const user = this.users.get(username);
    if (!user) return false;
    return user.password === password;
  }
};

export default function AccountScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    let user;
    if (!pseudoBackend.getUser(username)) {
      // If user doesn't exist, register them
      user = pseudoBackend.registerUser(username, password);
      setCurrentUser(user);
      setIsLoggedIn(true);
      setError('');
    } else {
      // If user exists, validate credentials
      if (pseudoBackend.validateUser(username, password)) {
        user = pseudoBackend.getUser(username);
        setCurrentUser(user);
        setIsLoggedIn(true);
        setError('');
      } else {
        setError('Invalid password');
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Account</ThemedText>

      <ThemedView style={styles.inputContainer}>
        {!isLoggedIn ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
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
          </>
        ) : (
          <ThemedView>
            <ThemedText>Welcome, {currentUser.username}!</ThemedText>
            <TouchableOpacity 
              style={[styles.button, styles.loginButton]}
              onPress={() => {
                setIsLoggedIn(false);
                setUsername('');
                setPassword('');
                setError('');
              }}
            >
              <ThemedText style={styles.buttonText}>Sign Out</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
      </ThemedView>
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
  }
});
