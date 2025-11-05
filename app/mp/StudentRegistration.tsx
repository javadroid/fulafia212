import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { User, Plus, X, AlertCircle, CheckCircle, Camera, BookOpen, Calendar } from 'lucide-react-native';

import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';
import { Student } from '../types';


const availableCourses = [
  'CSC 301 - Data Structures',
  'CSC 302 - Computer Architecture',
  'CSC 303 - Database Systems',
  'CSC 304 - Software Engineering',
  'CSC 305 - Operating Systems',
  'MTH 301 - Numerical Analysis',
  'MTH 302 - Linear Algebra',
  'STA 301 - Statistics',
  'PHY 301 - Physics III',
  'ENG 301 - Technical Writing'
];

const StudentRegistration: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    matricNumber: '',
    image: '',
    session: '2024/2025',
    semester: 'First Semester',
    courses: [] as string[]
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Placeholder for image handling in React Native
  const handleImageChange = () => {
    // In a real React Native app, you would use an image picker library here
    // For now, we'll just set a placeholder image or leave it empty
    setFormData(prev => ({
      ...prev,
      image: 'https://via.placeholder.com/150' // Placeholder image
    }));
    setMessage({ type: 'error', text: 'Image upload is not yet implemented in React Native.' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCourseToggle = (courseCode: string) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.includes(courseCode)
        ? prev.courses.filter(c => c !== courseCode)
        : [...prev.courses, courseCode]
    }));
  };

  const checkDuplicateRegistration = async (matricNumber: string, courses: string[]) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('matricNumber, courses')
      .eq('matricNumber', matricNumber)
      .single();
    setLoading(false);

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error checking duplicate registration:', error);
      return [];
    }

    if (data) {
      return courses.filter(course => data.courses.includes(course));
    }
    return [];
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Validation
    if (!formData.fullName || !formData.matricNumber || !formData.image || formData.courses.length === 0) {
      setMessage({ type: 'error', text: 'Please fill in all fields and select at least one course.' });
      setLoading(false);
      return;
    }

    const duplicateCourses = await checkDuplicateRegistration(formData.matricNumber, formData.courses);
    
    if (duplicateCourses.length > 0) {
      setMessage({ 
        type: 'error', 
        text: `Student is already registered for: ${duplicateCourses.join(', ')}` 
      });
      setLoading(false);
      return;
    }

    const newStudent: Student = {
      id: Date.now().toString(), // Supabase will generate its own ID
      ...formData,
      registrationDate: new Date().toISOString()
    };

    const { error } = await supabase.from('students').insert([newStudent]);
    setLoading(false);

    if (error) {
      console.error('Error registering student:', error);
      setMessage({ type: 'error', text: 'Error registering student.' });
    } else {
      setMessage({ type: 'success', text: 'Student registered successfully!' });
      // Reset form
      setFormData({
        fullName: '',
        matricNumber: '',
        image: '',
        session: '2024/2025',
        semester: 'First Semester',
        courses: []
      });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <User size={24} color="#2563eb" />
          </View>
          <Text style={styles.headerTitle}>Student Registration</Text>
        </View>

        {message && (
          <View style={[
            styles.messageContainer,
            message.type === 'success' ? styles.successMessage : styles.errorMessage
          ]}>
            {message.type === 'success' ? (
              <CheckCircle size={20} color="#16a34a" />
            ) : (
              <AlertCircle size={20} color="#dc2626" />
            )}
            <Text style={message.type === 'success' ? styles.successText : styles.errorText}>
              {message.text}
            </Text>
          </View>
        )}

        <View style={styles.form}>
          <View>
            <Text style={styles.label}>
              Full Name
            </Text>
            <TextInput
              value={formData.fullName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
              style={styles.textInput}
              placeholder="Enter student's full name"
            />
          </View>

          <View>
            <Text style={styles.label}>
              Matric Number
            </Text>
            <TextInput
              value={formData.matricNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, matricNumber: text.toUpperCase() }))}
              style={styles.textInput}
              placeholder="e.g., CSC/2020/001"
            />
          </View>

          <View style={styles.pickerGroup}>
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>
                Session
              </Text>
              <Picker
                selectedValue={formData.session}
                onValueChange={(itemValue) => setFormData(prev => ({ ...prev, session: String(itemValue) }))}
                style={styles.picker}
              >
                <Picker.Item label="2024/2025" value="2024/2025" />
                <Picker.Item label="2023/2024" value="2023/2024" />
                <Picker.Item label="2022/2023" value="2022/2023" />
                <Picker.Item label="2021/2022" value="2021/2022" />
              </Picker>
            </View>
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>
                Semester
              </Text>
              <Picker
                selectedValue={formData.semester}
                onValueChange={(itemValue) => setFormData(prev => ({ ...prev, semester: String(itemValue) }))}
                style={styles.picker}
              >
                <Picker.Item label="First Semester" value="First Semester" />
                <Picker.Item label="Second Semester" value="Second Semester" />
              </Picker>
            </View>
          </View>

          <View>
            <Text style={styles.label}>
              Student Image
            </Text>
            <TouchableOpacity onPress={handleImageChange} style={styles.imagePickerButton}>
              <Camera size={20} color="#4b5563" />
              <Text style={styles.imagePickerButtonText}>Select Image (Not Implemented)</Text>
            </TouchableOpacity>
            {formData.image && (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: formData.image }}
                  style={styles.imagePreview}
                />
              </View>
            )}
          </View>

          <View>
            <Text style={styles.label}>
              Select Courses
            </Text>
            <View style={styles.coursesGrid}>
              {availableCourses.map((course) => {
                const isSelected = formData.courses.includes(course);
                const isDuplicate = false; // This will be checked on submit
                
                return (
                  <TouchableOpacity
                    key={course}
                    onPress={() => handleCourseToggle(course)}
                    style={[
                      styles.courseButton,
                      isDuplicate
                        ? styles.courseButtonDuplicate
                        : isSelected
                        ? styles.courseButtonSelected
                        : styles.courseButtonDefault
                    ]}
                  >
                    <View style={styles.courseButtonContent}>
                      <Text style={[
                        styles.courseButtonText,
                        isDuplicate ? styles.courseButtonTextDuplicate : isSelected ? styles.courseButtonTextSelected : styles.courseButtonTextDefault
                      ]}>{course}</Text>
                      {isSelected && !isDuplicate && <CheckCircle size={16} color="#2563eb" />}
                      {isDuplicate && <X size={16} color="#dc2626" />}
                    </View>
                    {isDuplicate && (
                      <Text style={styles.duplicateText}>Already registered</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            {formData.courses.length > 0 && (
              <Text style={styles.courseCountText}>
                {formData.courses.length} course{formData.courses.length !== 1 ? 's' : ''} selected
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Plus size={20} color="white" />
                <Text style={styles.submitButtonText}>
                  Register Student
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f3f4f6', // gray-100
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 24,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  iconContainer: {
    backgroundColor: '#e0f2fe', // blue-100
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937', // gray-800
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  successMessage: {
    backgroundColor: '#ecfdf5', // green-50
    borderColor: '#a7f3d0', // green-200
  },
  errorMessage: {
    backgroundColor: '#fef2f2', // red-50
    borderColor: '#fecaca', // red-200
  },
  successText: {
    color: '#065f46', // green-800
    marginLeft: 8,
  },
  errorText: {
    color: '#991b1b', // red-800
    marginLeft: 8,
  },
  form: {
    gap: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151', // gray-700
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db', // gray-300
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2937', // gray-900
  },
  pickerGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  pickerContainer: {
    flex: 1,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#d1d5db', // gray-300
    borderRadius: 8,
    height: 40,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db', // gray-300
    borderRadius: 8,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#f9fafb', // gray-50
  },
  imagePickerButtonText: {
    fontSize: 16,
    color: '#4b5563', // gray-600
  },
  imagePreviewContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  coursesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  courseButton: {
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: '48%', // Approx half width with gap
  },
  courseButtonDefault: {
    borderColor: '#e5e7eb', // gray-200
    backgroundColor: '#f9fafb', // gray-50
  },
  courseButtonSelected: {
    borderColor: '#3b82f6', // blue-500
    backgroundColor: '#eff6ff', // blue-50
  },
  courseButtonDuplicate: {
    borderColor: '#fca5a5', // red-300
    backgroundColor: '#fef2f2', // red-50
  },
  courseButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  courseButtonText: {
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  courseButtonTextDefault: {
    color: '#374151', // gray-700
  },
  courseButtonTextSelected: {
    color: '#2563eb', // blue-700
  },
  courseButtonTextDuplicate: {
    color: '#dc2626', // red-600
  },
  duplicateText: {
    fontSize: 12,
    color: '#dc2626', // red-600
    marginTop: 4,
  },
  courseCountText: {
    fontSize: 14,
    color: '#4b5563', // gray-600
    marginTop: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb', // blue-600
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default StudentRegistration;