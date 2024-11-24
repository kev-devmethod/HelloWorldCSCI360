import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import * as FileSystem from 'expo-file-system';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import users from '../../assets/users.json';

// This is our pseudo backend "database" implemented as a simple object
// In a real app, this would be a proper backend server with a real database
const pseudoBackend = {
  // Remove usersFilePath as we'll use the imported users directly

  loadUsers: async function() {
    try {
      return users;
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  },

  // Get user data
  getUser: async function(username: string) {
    const users = await this.loadUsers();
    return users.find((user: any) => user.username === username);
  },

  // Validate user
  validateUser: async function(username: string, password: string) {
    const user = await this.getUser(username);
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

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    try {
      // If user exists, validate credentials
      if (await pseudoBackend.validateUser(username, password)) {
        const user = await pseudoBackend.getUser(username);
        setCurrentUser(user);
        setIsLoggedIn(true);
        setError('');
      } else {
        setError('Invalid username or password');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      console.error(error);
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
              placeholderTextColor="#666666"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
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
          </>
        ) : (
          <ThemedView>
            <ThemedText>Welcome, {currentUser.username}!</ThemedText>
            <ThemedView style={styles.badgesContainer}>
              <ThemedText style={styles.badgesTitle}>Your Badges:</ThemedText>
              {currentUser.badges && currentUser.badges.length > 0 ? (
                currentUser.badges.map((badge, index) => (
                  <ThemedText key={index} style={styles.badge}>{badge}</ThemedText>
                ))
              ) : (
                <ThemedText style={styles.noBadges}>No badges earned yet</ThemedText>
              )}
            </ThemedView>
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
});
