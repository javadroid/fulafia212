import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { Search, UserCheck, AlertCircle, CheckCircle, User, Calendar, BookOpen } from 'lucide-react-native';
import { Student, CourseAttendance } from '../types';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';

const StudentVerification: React.FC = () => {
  const [matricNumber, setMatricNumber] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [invigilatorName, setInvigilatorName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!matricNumber.trim()) {
      setMessage({ type: 'error', text: 'Please enter a matric number.' });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('matricNumber', matricNumber.trim().toUpperCase())
      .single();
    setLoading(false);

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error searching student:', error);
      setMessage({ type: 'error', text: 'Error searching student.' });
      setSelectedStudent(null);
      return;
    }

    if (data) {
      setSelectedStudent(data as Student);
      setMessage(null);
    } else {
      setSelectedStudent(null);
      setMessage({ type: 'error', text: 'Student not found. Please check the matric number.' });
    }
  };

  const isAlreadyVerified = async (matricNum: string, courseCode: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('course_attendance')
      .select('*')
      .eq('matricNumber', matricNum)
      .eq('courseCode', courseCode);
    setLoading(false);

    if (error) {
      console.error('Error checking attendance:', error);
      return false;
    }
    return data && data.length > 0;
  };

  const handleMarkAttendance = async () => {
    if (!selectedStudent || !selectedCourse || !invigilatorName.trim()) {
      setMessage({ type: 'error', text: 'Please select a course and enter invigilator name.' });
      return;
    }

    setLoading(true);
    const alreadyVerified = await isAlreadyVerified(selectedStudent.matricNumber, selectedCourse);
    setLoading(false);

    if (alreadyVerified) {
      setMessage({
        type: 'error',
        text: 'Student has already been verified for this course exam.'
      });
      return;
    }

    const attendance: Omit<CourseAttendance, 'id'> = {
      matricNumber: selectedStudent.matricNumber,
      courseCode: selectedCourse,
      verificationDate: new Date().toISOString(),
      invigilatorName: invigilatorName.trim()
    };

    setLoading(true);
    const { error } = await supabase.from('course_attendance').insert([attendance]);
    setLoading(false);

    if (error) {
      console.error('Error marking attendance:', error);
      setMessage({ type: 'error', text: 'Error marking attendance.' });
    } else {
      setMessage({
        type: 'success',
        text: 'Student attendance marked successfully!'
      });

      // Reset form
      setSelectedStudent(null);
      setSelectedCourse('');
      setMatricNumber('');
    }

    setTimeout(() => setMessage(null), 3000);
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <UserCheck size={24} color="#22c55e" />
          </View>
          <Text style={styles.headerTitle}>Student Verification</Text>
        </View>

        {message && (
          <View style={[
            styles.messageContainer,
            message.type === 'success' ? styles.successMessage :
            message.type === 'error' ? styles.errorMessage : styles.infoMessage
          ]}>
            {message.type === 'success' ? (
              <CheckCircle size={20} color="#16a34a" />
            ) : (
              <AlertCircle size={20} color="#dc2626" />
            )}
            <Text style={[
              message.type === 'success' ? styles.successText :
              message.type === 'error' ? styles.errorText : styles.infoText
            ]}>
              {message.text}
            </Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.searchSection}>
            <View style={styles.flex1}>
              <Text style={styles.label}>
                Enter Matric Number
              </Text>
              <TextInput
                value={matricNumber}
                onChangeText={(text) => setMatricNumber(text.toUpperCase())}
                onKeyPress={handleKeyPress}
                style={styles.textInput}
                placeholder="e.g., CSC/2020/001"
              />
            </View>
            <View style={styles.searchButtonContainer}>
              <TouchableOpacity
                onPress={handleSearch}
                style={styles.searchButton}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Search size={16} color="white" />
                    <Text style={styles.searchButtonText}>Search</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View>
            <Text style={styles.label}>
              Invigilator Name
            </Text>
            <TextInput
              value={invigilatorName}
              onChangeText={(text) => setInvigilatorName(text)}
              style={styles.textInput}
              placeholder="Enter your name"
            />
          </View>
        </View>
      </View>

      {selectedStudent && (
        <View style={styles.card}>
          <Text style={styles.studentDetailsHeader}>
            <User size={20} color="#1f2937" />
            <Text>Student Details</Text>
          </Text>

          <View style={styles.studentInfoGrid}>
            <View style={styles.studentInfoSection}>
              <View style={styles.studentImageContainer}>
                <Image
                  source={{ uri: selectedStudent.image }}
                  style={styles.studentImage}
                />
              </View>
              <View>
                <Text style={styles.studentName}>{selectedStudent.fullName}</Text>
                <Text style={styles.studentMatric}>{selectedStudent.matricNumber}</Text>
                <View style={styles.registrationDateContainer}>
                  <Calendar size={16} color="#6b7280" />
                  <Text style={styles.registrationDateText}>
                    Registered: {new Date(selectedStudent.registrationDate).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>

            <View>
              <Text style={styles.selectCourseHeader}>
                <BookOpen size={16} color="#374151" />
                <Text>Select Course for Verification</Text>
              </Text>
              <View style={styles.coursePickerContainer}>
                <Picker
                  selectedValue={selectedCourse}
                  onValueChange={(itemValue) => setSelectedCourse(String(itemValue))}
                  style={styles.coursePicker}
                >
                  <Picker.Item label="-- Select Course --" value="" />
                  {selectedStudent.courses.map(course => (
                    <Picker.Item key={course} label={course} value={course} />
                  ))}
                </Picker>
              </View>
              <TouchableOpacity
                onPress={handleMarkAttendance}
                style={styles.markAttendanceButton}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <UserCheck size={20} color="white" />
                    <Text style={styles.markAttendanceButtonText}>
                      Mark Attendance
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    backgroundColor: '#dcfce7', // green-100
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
  infoMessage: {
    backgroundColor: '#eff6ff', // blue-50
    borderColor: '#bfdbfe', // blue-200
  },
  successText: {
    color: '#065f46', // green-800
    marginLeft: 8,
  },
  errorText: {
    color: '#991b1b', // red-800
    marginLeft: 8,
  },
  infoText: {
    color: '#1e40af', // blue-800
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
  searchSection: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  searchButtonContainer: {
    justifyContent: 'flex-end',
  },
  searchButton: {
    backgroundColor: '#22c55e', // green-500
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  studentDetailsHeader: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937', // gray-800
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  studentInfoGrid: {
    // For simplicity, using a single column layout for now
    // Can be adapted to two columns with flexWrap and appropriate widths
    gap: 24,
  },
  studentInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  studentImageContainer: {
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e5e7eb', // gray-200
  },
  studentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937', // gray-800
  },
  studentMatric: {
    color: '#4b5563', // gray-600
    marginBottom: 4,
  },
  registrationDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  registrationDateText: {
    fontSize: 14,
    color: '#6b7280', // gray-500
  },
  selectCourseHeader: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151', // gray-700
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coursePickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db', // gray-300
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    marginBottom: 16,
  },
  coursePicker: {
    height: 40,
  },
  markAttendanceButton: {
    backgroundColor: '#22c55e', // green-500
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  markAttendanceButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default StudentVerification;