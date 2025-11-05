import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, TextInput, ActivityIndicator } from 'react-native';
import { Users, Filter, Search, BookOpen, Calendar } from 'lucide-react-native';
import { Student, CourseAttendance } from '../types';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';

const StudentDetails: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<CourseAttendance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('*');
        if (studentsError) throw studentsError;
        setStudents(studentsData || []);

        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance_records')
          .select('*');
        if (attendanceError) throw attendanceError;
        setAttendanceRecords(attendanceData || []);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const sessions = useMemo(() => {
    return Array.from(new Set(students.map(s => s.session))).sort().reverse();
  }, [students]);

  const semesters = useMemo(() => {
    return Array.from(new Set(students.map(s => s.semester))).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSession = !selectedSession || student.session === selectedSession;
      const matchesSemester = !selectedSemester || student.semester === selectedSemester;
      const matchesSearch = !searchQuery ||
        student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.matricNumber.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSession && matchesSemester && matchesSearch;
    });
  }, [students, selectedSession, selectedSemester, searchQuery]);

  const getStudentAttendance = (matricNumber: string) => {
    return attendanceRecords.filter(record => record.matricNumber === matricNumber);
  };

  const getAttendancePercentage = (student: Student) => {
    const attended = getStudentAttendance(student.matricNumber).length;
    const total = student.courses.length;
    return total > 0 ? Math.round((attended / total) * 100) : 0;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading student details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={() => { /* Implement retry logic or navigate away */ }} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Users size={24} color="#2563eb" />
          </View>
          <Text style={styles.headerTitle}>Registered Students</Text>
        </View>

        <View style={styles.filtersGrid}>
          <View>
            <Text style={styles.filterLabel}>
              <Calendar size={16} color="#4b5563" /> Filter by Session
            </Text>
            <Picker
              selectedValue={selectedSession}
              onValueChange={(itemValue) => setSelectedSession(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="All Sessions" value="" />
              {sessions.map(session => (
                <Picker.Item key={session} label={session} value={session} />
              ))}
            </Picker>
          </View>

          <View>
            <Text style={styles.filterLabel}>
              <Filter size={16} color="#4b5563" /> Filter by Semester
            </Text>
            <Picker
              selectedValue={selectedSemester}
              onValueChange={(itemValue) => setSelectedSemester(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="All Semesters" value="" />
              {semesters.map(semester => (
                <Picker.Item key={semester} label={semester} value={semester} />
              ))}
            </Picker>
          </View>

          <View>
            <Text style={styles.filterLabel}>
              <Search size={16} color="#4b5563" /> Search Student
            </Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Name or Matric Number"
              style={styles.textInput}
            />
          </View>
        </View>

        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            Showing <Text style={styles.infoBannerTextBold}>{filteredStudents.length}</Text> student{filteredStudents.length !== 1 ? 's' : ''}
            {selectedSession && ` in ${selectedSession}`}
            {selectedSemester && ` (${selectedSemester})`}
          </Text>
        </View>
      </View>

      <View style={styles.studentsGrid}>
        {filteredStudents.map(student => {
          const attendance = getStudentAttendance(student.matricNumber);
          const attendancePercentage = getAttendancePercentage(student);

          return (
            <View key={student.id} style={styles.studentCard}>
              <View style={styles.studentCardContent}>
                <View style={styles.studentImageContainer}>
                  <Image
                    source={{ uri: student.image }}
                    style={styles.studentImage}
                  />
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName} numberOfLines={1}>{student.fullName}</Text>
                  <Text style={styles.studentMatric}>{student.matricNumber}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Session:</Text>
                <Text style={styles.detailValue}>{student.session}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Semester:</Text>
                <Text style={styles.detailValue}>{student.semester}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Registered:</Text>
                <Text style={styles.detailValue}>{new Date(student.registrationDate).toLocaleDateString()}</Text>
              </View>

              <View style={styles.coursesSection}>
                <View style={styles.coursesHeader}>
                  <BookOpen size={16} color="#2563eb" />
                  <Text style={styles.coursesTitle}>Courses: {student.courses.length}</Text>
                </View>
                <ScrollView style={styles.coursesList}>
                  {student.courses.map((course, index) => {
                    const hasAttended = attendance.some(a => a.courseCode === course);
                    return (
                      <View key={index} style={styles.courseItem}>
                        <Text style={styles.courseName} numberOfLines={1}>{course}</Text>
                        {hasAttended && (
                          <Text style={styles.courseAttended}>Attended</Text>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.attendanceSection}>
                <View style={styles.attendanceHeader}>
                  <Text style={styles.attendanceTitle}>Exam Attendance</Text>
                  <Text style={[styles.attendancePercentage, attendancePercentage >= 70 ? styles.textGreen : styles.textRed]}>
                    {attendancePercentage}%
                  </Text>
                </View>
                <Text style={styles.attendanceSummary}>
                  {attendance.length} of {student.courses.length} exams attended
                </Text>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[styles.progressBarFill, attendancePercentage >= 70 ? styles.bgGreen : styles.bgRed, { width: `${attendancePercentage}%` }]}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {filteredStudents.length === 0 && (
        <View style={styles.noStudentsCard}>
          <Users size={48} color="#9ca3af" style={styles.noStudentsIcon} />
          <Text style={styles.noStudentsText}>No students found matching your filters.</Text>
          {(selectedSession || selectedSemester || searchQuery) && (
            <TouchableOpacity
              onPress={() => {
                setSelectedSession('');
                setSelectedSemester('');
                setSearchQuery('');
              }}
              style={styles.clearFiltersButton}
            >
              <Text style={styles.clearFiltersButtonText}>Clear filters</Text>
            </TouchableOpacity>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4b5563',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626', // red-600
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  filtersGrid: {
    // This will need to be adjusted for responsive layout in RN
    // For simplicity, using column layout for now
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151', // gray-700
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  picker: {
    height: 40,
    borderColor: '#d1d5db', // gray-300
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  textInput: {
    height: 40,
    borderColor: '#d1d5db', // gray-300
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  infoBanner: {
    backgroundColor: '#eff6ff', // blue-50
    borderColor: '#bfdbfe', // blue-200
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  infoBannerText: {
    fontSize: 14,
    color: '#1e40af', // blue-800
  },
  infoBannerTextBold: {
    fontWeight: 'bold',
  },
  studentsGrid: {
    // Adjust for grid layout in RN, perhaps using FlatList or custom logic
    // For now, stacking vertically
    gap: 16,
  },
  studentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 24,
  },
  studentCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  studentImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e5e7eb', // gray-200
    flexShrink: 0,
  },
  studentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  studentInfo: {
    flex: 1,
    minWidth: 0,
  },
  studentName: {
    fontWeight: '600',
    color: '#1f2937', // gray-900
    fontSize: 18,
  },
  studentMatric: {
    fontSize: 14,
    color: '#4b5563', // gray-600
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', // font-mono
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6', // gray-100
    paddingBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#4b5563', // gray-600
  },
  detailValue: {
    fontWeight: '500',
    color: '#1f2937', // gray-900
  },
  coursesSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb', // gray-200
    paddingTop: 16,
    marginTop: 16,
  },
  coursesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  coursesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151', // gray-700
  },
  coursesList: {
    maxHeight: 120,
  },
  courseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb', // gray-50
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  courseName: {
    color: '#374151', // gray-700
    flex: 1,
  },
  courseAttended: {
    color: '#047857', // green-600
    fontWeight: '500',
    marginLeft: 8,
  },
  attendanceSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb', // gray-200
    paddingTop: 16,
    marginTop: 16,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  attendanceTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151', // gray-700
  },
  attendancePercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  attendanceSummary: {
    fontSize: 12,
    color: '#4b5563', // gray-600
    marginBottom: 8,
  },
  progressBarBackground: {
    backgroundColor: '#e5e7eb', // gray-200
    borderRadius: 9999,
    height: 8,
  },
  progressBarFill: {
    height: 8,
    borderRadius: 9999,
  },
  textGreen: {
    color: '#16a34a', // green-600
  },
  textRed: {
    color: '#dc2626', // red-600
  },
  bgGreen: {
    backgroundColor: '#22c55e', // green-500
  },
  bgRed: {
    backgroundColor: '#ef4444', // red-500
  },
  noStudentsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 48,
    alignItems: 'center',
    textAlign: 'center',
  },
  noStudentsIcon: {
    marginBottom: 16,
  },
  noStudentsText: {
    color: '#6b7280', // gray-500
    marginBottom: 16,
  },
  clearFiltersButton: {
    marginTop: 16,
  },
  clearFiltersButtonText: {
    color: '#2563eb', // blue-600
    fontWeight: '500',
  },
});

export default StudentDetails;