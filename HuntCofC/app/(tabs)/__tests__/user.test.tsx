import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { jest } from '@jest/globals';
import AccountScreen from '../user';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

describe('AccountScreen', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('renders login form when not logged in', () => {
    const { getByPlaceholderText, getByText } = render(<AccountScreen />);
    
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('handles login successfully', async () => {
    const mockUser = {
      uid: '123',
      email: 'test@example.com',
    };

    const signInWithEmailAndPassword = require('firebase/auth').signInWithEmailAndPassword;
    signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });

    const getDoc = require('firebase/firestore').getDoc;
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        displayName: 'Test User',
        badges: ['Badge1'],
      }),
    });

    const { getByPlaceholderText, getByText } = render(<AccountScreen />);
    
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalled();
    });
  });

  it('handles login errors', async () => {
    const signInWithEmailAndPassword = require('firebase/auth').signInWithEmailAndPassword;
    signInWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/wrong-password' });

    const { getByPlaceholderText, getByText } = render(<AccountScreen />);
    
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpassword');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(getByText('Invalid email or password')).toBeTruthy();
    });
  });

  it('handles registration successfully', async () => {
    const mockUser = {
      uid: '123',
      email: 'new@example.com',
    };

    const createUserWithEmailAndPassword = require('firebase/auth').createUserWithEmailAndPassword;
    createUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });

    const setDoc = require('firebase/firestore').setDoc;
    setDoc.mockResolvedValueOnce({});

    const { getByText, getByPlaceholderText } = render(<AccountScreen />);
    
    // Switch to registration mode
    fireEvent.press(getByText("Don't have an account? Register here"));
    
    fireEvent.changeText(getByPlaceholderText('Email'), 'new@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Register'));

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalled();
    });
  });

  it('handles registration errors', async () => {
    const createUserWithEmailAndPassword = require('firebase/auth').createUserWithEmailAndPassword;
    createUserWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });

    const { getByText, getByPlaceholderText } = render(<AccountScreen />);
    
    // Switch to registration mode
    fireEvent.press(getByText("Don't have an account? Register here"));
    
    fireEvent.changeText(getByPlaceholderText('Email'), 'existing@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Register'));

    await waitFor(() => {
      expect(getByText('Email already registered')).toBeTruthy();
    });
  });

  it('handles sign out', async () => {
    const signOut = require('firebase/auth').signOut;
    signOut.mockResolvedValueOnce();

    // Mock authenticated state
    const onAuthStateChanged = require('firebase/auth').onAuthStateChanged;
    onAuthStateChanged.mockImplementationOnce((auth, callback) => {
      callback({ email: 'test@example.com' });
      return () => {};
    });

    const { getByText } = render(<AccountScreen />);
    
    fireEvent.press(getByText('Sign Out'));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
  });
}); 