import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { User, UserCheck, BookOpen, Users, CheckCircle, Home } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '../lib/supabase';
import { Student, CourseAttendance } from '../types';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';


const HomeScreen = () => {
  
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<CourseAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([loadStudents(), loadAttendance()]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('*');

    if (studentsError) {
      console.error('Error loading students:', studentsError);
      throw studentsError;
    }

    if (studentsData) {
      const { data: coursesData, error: coursesError } = await supabase
        .from('student_courses')
        .select('*');

      if (coursesError) {
        console.error('Error loading student courses:', coursesError);
        throw coursesError;
      }

      const studentsWithCourses: Student[] = studentsData.map(student => {
        const studentCourses = coursesData?.filter(c => c.student_id === student.id) || [];
        return {
          id: student.id,
          fullName: student.full_name,
          matricNumber: student.matric_number,
          image: student.image,
          session: student.session,
          semester: student.semester,
          courses: studentCourses.map(c => c.course_code),
          registrationDate: student.registration_date
        };
      });

      setStudents(studentsWithCourses);
    }
  };

  const loadAttendance = async () => {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*');

    if (error) {
      console.error('Error loading attendance:', error);
      throw error;
    }

    if (data) {
      const attendance: CourseAttendance[] = data.map(record => ({
        id: record.id,
        matricNumber: record.matric_number,
        courseCode: record.course_code,
        verificationDate: record.verification_date,
        invigilatorName: record.invigilator_name
      }));

      setAttendanceRecords(attendance);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={loadData} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
    <ScrollView contentContainerStyle={styles.scrollViewContent} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <BookOpen size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Federal University of Lafia</Text>
            <Text style={styles.headerSubtitle}>Exam Verification & Attendance System</Text>
          </View>
        </View>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.homeHeader}>
          <Text style={styles.homeTitle}>Welcome to the Exam Management System</Text>
          <Text style={styles.homeSubtitle}>Choose your role to continue</Text>
        </View>

        <View style={styles.roleGrid}>
          <View style={styles.roleCard}>
            <View style={styles.roleIconContainerBlue}>
              <User size={32} color="#2563eb" />
            </View>
            <Text style={styles.roleTitle}>Course Advisor</Text>
            <Text style={styles.roleDescription}>Register students and view exam attendance reports</Text>
            <View style={styles.buttonSpace}>
              <TouchableOpacity
                onPress={() => router.push('/mp/StudentRegistration')}
                style={styles.buttonPrimary}
              >
                <Text style={styles.buttonText}>Register Students</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/mp/StudentDetails')}
                style={styles.buttonOrange}
              >
                <Text style={styles.buttonText}>View Student Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/mp/AttendanceReports')}
                style={styles.buttonTeal}
              >
                <Text style={styles.buttonText}>View Attendance Reports</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.roleCard}>
            <View style={styles.roleIconContainerGreen}>
              <UserCheck size={32} color="#16a34a" />
            </View>
            <Text style={styles.roleTitle}>Invigilator</Text>
            <Text style={styles.roleDescription}>Verify students and mark attendance for exams</Text>
            <TouchableOpacity
              onPress={() => router.push('/mp/StudentVerification')}
              style={styles.buttonGreen}
            >
              <Text style={styles.buttonText}>Verify Students</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Users size={24} color="#2563eb" />
            </View>
            <Text style={styles.statNumber}>{students.length}</Text>
            <Text style={styles.statLabel}>Registered Students</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <CheckCircle size={24} color="#16a34a" />
            </View>
            <Text style={styles.statNumber}>{attendanceRecords.length}</Text>
            <Text style={styles.statLabel}>Exam Attendances</Text>
          </View>
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  header: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.5,
    elevation: 2,
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoContainer: {
    backgroundColor: '#2563eb',
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#4b5563',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#4b5563',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  homeHeader: {
    marginBottom: 48,
  },
  homeTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  homeSubtitle: {
    fontSize: 18,
    color: '#4b5563',
    marginBottom: 32,
    textAlign: 'center',
  },
  roleGrid: {
    // flexDirection: 'row',
    // flexWrap: 'wrap',
    gap: 32,
    justifyContent: 'center',
  },
  roleCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    flex: 1,
    minWidth: 300,
    maxWidth: '48%',
    alignItems: 'center',
  },
  roleIconContainerBlue: {
    backgroundColor: '#dbeafe',
    width: 64,
    height: 64,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  roleIconContainerGreen: {
    backgroundColor: '#dcfce7',
    width: 64,
    height: 64,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  roleDescription: {
    color: '#4b5563',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonSpace: {
    gap: 12,
    width: '100%',
  },
  buttonPrimary: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonOrange: {
    backgroundColor: '#ea580c',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonTeal: {
    backgroundColor: '#0d9488',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonGreen: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  statsContainer: {
    marginTop: 48,
    backgroundColor: '#eff6ff',
    padding: 24,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    backgroundColor: '#fff',
    width: 48,
    height: 48,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.5,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#4b5563',
  },
});

export default HomeScreen;