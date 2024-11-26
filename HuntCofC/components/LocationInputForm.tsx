import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, ScrollView, StyleSheet, Alert } from 'react-native';
import { LocationData } from '../types/location';
import { Ionicons } from '@expo/vector-icons';

type LocationFormProps = {
  newLocation: any;
  setNewLocation: any;
  onSubmit: (locationData: Partial<LocationData>) => void;
  onClose: () => void;
  onDelete?: () => void;
  useCurrentLocation: () => void;
  formatDate: (date: string) => string;
};

export const LocationInputForm = ({ 
  newLocation, 
  setNewLocation, 
  onSubmit, 
  onClose,
  onDelete,
  useCurrentLocation,
  formatDate
}: LocationFormProps) => {

  const handleSubmit = () => {
    try {
      // Parse the date
      const [month, day, year] = newLocation.eventDate.split('/');
      
      // Parse the time
      let [hours, minutes] = newLocation.startTime.split(':').map(num => parseInt(num) || 0);
      
      // Convert to 24-hour format
      if (newLocation.startPeriod === 'PM' && hours !== 12) {
        hours += 12;
      }
      if (newLocation.startPeriod === 'AM' && hours === 12) {
        hours = 0;
      }

      // Create ISO datetime string
      const formattedDateTime = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

      // Parse duration from HH:MM to total minutes
      const [durationHours, durationMinutes] = newLocation.duration.split(':').map(num => parseInt(num) || 0);
      const totalMinutes = (durationHours * 60) + durationMinutes;

      const locationData: Partial<LocationData> = {
        title: newLocation.name,
        description: newLocation.description,
        latitude: Number(newLocation.latitude),
        longitude: Number(newLocation.longitude),
        startTime: formattedDateTime,
        duration: totalMinutes
      };

      onSubmit(locationData);
    } catch (error) {
      console.error('Error formatting submission data:', error);
      Alert.alert('Error', 'Failed to submit location data. Please check your inputs.');
    }
  };

  const formatTimeInput = (text: string) => {
    // Remove any non-numeric characters
    const numbers = text.replace(/\D/g, '');
    
    // Handle backspace
    if (text.length < newLocation.startTime.length) {
      return text;
    }
    
    // Format as HH:MM
    if (numbers.length <= 2) {
      const hour = parseInt(numbers);
      if (hour > 12) return '12';
      return numbers;
    }
    
    return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`;
  };

  return (
    <ScrollView style={styles.formContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.formTitle}>Edit Event</Text>
        {onDelete && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={onDelete}
          >
            <Ionicons name="trash-outline" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Location Name"
        placeholderTextColor="#444"
        value={newLocation.name}
        onChangeText={(text) => setNewLocation({...newLocation, name: text})}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Description"
        placeholderTextColor="#444"
        value={newLocation.description}
        onChangeText={(text) => setNewLocation({...newLocation, description: text})}
      />

      <Text style={styles.inputLabel}>Coordinates</Text>
      <TextInput
        style={styles.input}
        placeholder="Latitude"
        placeholderTextColor="#444"
        value={newLocation.latitude}
        onChangeText={(text) => {
          // Allow negative numbers and decimals
          if (text === '-' || text === '' || /^-?\d*\.?\d*$/.test(text)) {
            setNewLocation({...newLocation, latitude: text})
          }
        }}
        keyboardType="numbers-and-punctuation"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Longitude"
        placeholderTextColor="#444"
        value={newLocation.longitude}
        onChangeText={(text) => {
          // Allow negative numbers and decimals
          if (text === '-' || text === '' || /^-?\d*\.?\d*$/.test(text)) {
            setNewLocation({...newLocation, longitude: text})
          }
        }}
        keyboardType="numbers-and-punctuation"
      />

      <TouchableOpacity
        style={[styles.button, styles.locationButton]}
        onPress={useCurrentLocation}
      >
        <Text style={styles.buttonText}>Use Current Location</Text>
      </TouchableOpacity>

      <Text style={styles.inputLabel}>Event Date</Text>
      <TextInput
        style={styles.input}
        placeholder="MM/DD/YYYY"
        placeholderTextColor="#666"
        value={newLocation.eventDate}
        onChangeText={(text) => {
          const formatted = formatDate(text);
          setNewLocation({...newLocation, eventDate: formatted});
        }}
      />

      <Text style={styles.inputLabel}>Start Time</Text>
      <View style={styles.timeInputRow}>
        <TextInput
          style={[styles.input, styles.timeInput]}
          placeholder="HH:MM"
          placeholderTextColor="#666"
          value={newLocation.startTime}
          onChangeText={(text) => {
            const formatted = formatTimeInput(text);
            if (formatted.length <= 5) {
              setNewLocation({...newLocation, startTime: formatted});
            }
          }}
          keyboardType="numeric"
          maxLength={5}
        />
        <View style={styles.periodContainer}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              newLocation.startPeriod === 'AM' && styles.periodActive
            ]}
            onPress={() => setNewLocation({ ...newLocation, startPeriod: 'AM' })}
          >
            <Text style={[
              styles.periodText,
              newLocation.startPeriod === 'AM' && { color: 'white' }
            ]}>AM</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              newLocation.startPeriod === 'PM' && styles.periodActive
            ]}
            onPress={() => setNewLocation({ ...newLocation, startPeriod: 'PM' })}
          >
            <Text style={[
              styles.periodText,
              newLocation.startPeriod === 'PM' && { color: 'white' }
            ]}>PM</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.inputLabel}>Duration</Text>
      <View style={styles.timeInputRow}>
        <View style={styles.durationContainer}>
          <Text style={styles.durationLabel}>Hours</Text>
          <View style={styles.stepperContainer}>
            <TouchableOpacity 
              style={styles.stepperButton}
              onPress={() => {
                const [hours, minutes] = newLocation.duration.split(':');
                const currentHours = parseInt(hours) || 0;
                if (currentHours > 0) {
                  setNewLocation({
                    ...newLocation, 
                    duration: `${(currentHours - 1).toString().padStart(2, '0')}:${minutes || '00'}`
                  });
                }
              }}
            >
              <Text style={styles.stepperText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.durationValue}>{newLocation.duration.split(':')[0] || '00'}</Text>
            <TouchableOpacity 
              style={styles.stepperButton}
              onPress={() => {
                const [hours, minutes] = newLocation.duration.split(':');
                const currentHours = parseInt(hours) || 0;
                setNewLocation({
                  ...newLocation, 
                  duration: `${(currentHours + 1).toString().padStart(2, '0')}:${minutes || '00'}`
                });
              }}
            >
              <Text style={styles.stepperText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.durationContainer}>
          <Text style={styles.durationLabel}>Minutes</Text>
          <View style={styles.stepperContainer}>
            <TouchableOpacity 
              style={styles.stepperButton}
              onPress={() => {
                const [hours, minutes] = newLocation.duration.split(':');
                const currentMinutes = parseInt(minutes) || 0;
                if (currentMinutes >= 15) {
                  setNewLocation({
                    ...newLocation, 
                    duration: `${hours || '00'}:${(currentMinutes - 15).toString().padStart(2, '0')}`
                  });
                }
              }}
            >
              <Text style={styles.stepperText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.durationValue}>{newLocation.duration.split(':')[1] || '00'}</Text>
            <TouchableOpacity 
              style={styles.stepperButton}
              onPress={() => {
                const [hours, minutes] = newLocation.duration.split(':');
                const currentMinutes = parseInt(minutes) || 0;
                if (currentMinutes < 45) {
                  setNewLocation({
                    ...newLocation, 
                    duration: `${hours || '00'}:${(currentMinutes + 15).toString().padStart(2, '0')}`
                  });
                }
              }}
            >
              <Text style={styles.stepperText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]}
          onPress={onClose}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.submitButton]}
          onPress={handleSubmit}
        >
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 25,
  },
  eventContainer: {
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 16,
    color: '#222',
    marginBottom: 5,
    marginTop: 10,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeInput: {
    flex: 1,
    marginRight: 10,
    marginBottom: 0,
  },
  periodPicker: {
    width: 120,
    height: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    color: '#222',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    paddingVertical: 5,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#222',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  locationButton: {
    backgroundColor: '#2196F3',
    marginBottom: 10,
    width: '100%',
  },
  submitButton: {
    backgroundColor: '#7a232f',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  periodContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginLeft: 10,
    gap: 8,
  },
  periodButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    width: 60,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  periodActive: {
    backgroundColor: '#7a232f',
    borderColor: '#661c26',
  },
  periodText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 18,
  },
  timeColon: {
    fontSize: 16,
    color: '#222',
    marginHorizontal: 5,
  },
  durationContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 12,
    margin: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  durationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  stepperButton: {
    width: 36,
    height: 36,
    backgroundColor: '#7a232f',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
  },
  stepperText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 24,
  },
  durationValue: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 35,
    textAlign: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#dc3545',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}); 