import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { jest } from '@jest/globals';
import Index from '../index';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
}));

describe('Index (Home Screen)', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('renders the home screen title', () => {
    const { getByText } = render(<Index />);
    expect(getByText('Top Explorers')).toBeTruthy();
  });

  it('displays loading state initially', () => {
    const { getByTestId } = render(<Index />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders featured locations when data is loaded', async () => {
    const mockLocations = [
      {
        id: '1',
        title: 'Test Location 1',
        description: 'Description 1',
        latitude: 32.7831,
        longitude: -79.9373,
      },
      {
        id: '2',
        title: 'Test Location 2',
        description: 'Description 2',
        latitude: 32.7832,
        longitude: -79.9374,
      },
    ];

    // Mock the Firebase query response
    const getDocs = require('firebase/firestore').getDocs;
    getDocs.mockResolvedValueOnce({
      docs: mockLocations.map(loc => ({
        id: loc.id,
        data: () => loc,
      })),
    });

    const { getByText } = render(<Index />);

    await waitFor(() => {
      expect(getByText('Test Location 1')).toBeTruthy();
      expect(getByText('Test Location 2')).toBeTruthy();
    });
  });

  it('renders top users when data is loaded', async () => {
    const mockUsers = [
      {
        displayName: 'User1',
        badges: ['Badge1', 'Badge2'],
      },
      {
        displayName: 'User2',
        badges: ['Badge1'],
      },
      {
        displayName: 'User3',
        badges: ['Badge1', 'Badge2', 'Badge3'],
      },
    ];

    // Mock the Firebase query response for users
    const getDocs = require('firebase/firestore').getDocs;
    getDocs.mockResolvedValueOnce({
      docs: mockUsers.map((user, index) => ({
        data: () => user,
      })),
    });

    const { getByText } = render(<Index />);

    await waitFor(() => {
      expect(getByText('User1')).toBeTruthy();
      expect(getByText('User2')).toBeTruthy();
      expect(getByText('User3')).toBeTruthy();
    });
  });

  it('navigates to map screen when "See All Locations" is pressed', () => {
    const mockPush = jest.fn();
    jest.spyOn(require('expo-router'), 'useRouter').mockImplementation(() => ({
      push: mockPush,
    }));

    const { getByText } = render(<Index />);
    fireEvent.press(getByText('See All Locations'));

    expect(mockPush).toHaveBeenCalledWith('./map');
  });

  it('navigates to map screen when a location card is pressed', async () => {
    const mockPush = jest.fn();
    jest.spyOn(require('expo-router'), 'useRouter').mockImplementation(() => ({
      push: mockPush,
    }));

    const mockLocation = {
      id: '1',
      title: 'Test Location',
      description: 'Description',
      latitude: 32.7831,
      longitude: -79.9373,
    };

    const getDocs = require('firebase/firestore').getDocs;
    getDocs.mockResolvedValueOnce({
      docs: [{
        id: mockLocation.id,
        data: () => mockLocation,
      }],
    });

    const { getByText } = render(<Index />);

    await waitFor(() => {
      const locationCard = getByText('Test Location');
      fireEvent.press(locationCard);
    });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "./map",
      params: {
        focusLat: mockLocation.latitude,
        focusLong: mockLocation.longitude,
        locationId: mockLocation.id,
      },
    });
  });

  it('handles refresh control', async () => {
    const { getByTestId } = render(<Index />);
    
    const refreshControl = getByTestId('refresh-control');
    fireEvent(refreshControl, 'refresh');

    await waitFor(() => {
      expect(require('firebase/firestore').getDocs).toHaveBeenCalled();
    });
  });

  it('handles Firebase errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const getDocs = require('firebase/firestore').getDocs;
    getDocs.mockRejectedValueOnce(new Error('Firebase error'));

    render(<Index />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching data:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
}); 