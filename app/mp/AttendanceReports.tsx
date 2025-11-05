import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Image } from 'react-native';
import { BarChart3, Users, Calendar, Filter, Eye } from 'lucide-react-native';

import AttendanceDetailModal from './AttendanceDetailModal';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';
import { Student, CourseAttendance } from '../types';

const AttendanceReports: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [detailModalCourse, setDetailModalCourse] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<CourseAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          .from('course_attendance')
          .select('*');
        if (attendanceError) throw attendanceError;
        setAttendanceRecords(attendanceData || []);
      } catch (err: any) {
        console.error('Error fetching data:', err.message);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get all unique courses from registered students
  const allCourses = Array.from(
    new Set(students.flatMap(student => student.courses))
  ).sort();

  const getStudentsForCourse = (courseCode: string) => {
    return students.filter(student => student.courses.includes(courseCode));
  };

  const getAttendanceForCourse = (courseCode: string) => {
    return attendanceRecords.filter(record => record.courseCode === courseCode);
  };

  const getCourseStats = (courseCode: string) => {
    const registeredStudents = getStudentsForCourse(courseCode);
    const attendanceList = getAttendanceForCourse(courseCode);
    
    return {
      registered: registeredStudents.length,
      attended: attendanceList.length,
      percentage: registeredStudents.length > 0 
        ? Math.round((attendanceList.length / registeredStudents.length) * 100)
        : 0
    };
  };

  const getAttendanceDetails = (courseCode: string) => {
    const attendanceList = getAttendanceForCourse(courseCode);
    
    // Only return students who were actually verified (have attendance records)
    return attendanceList.map(attendance => {
      const student = students.find(s => s.matricNumber === attendance.matricNumber);
      return {
        student: student!,
        attendance,
        status: 'present'
      };
    }).filter(detail => detail.student); // Filter out any records where student wasn't found
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0d9488" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <BarChart3 size={24} color="#0d9488" />
            </View>
            <Text style={styles.headerTitle}>Attendance Reports</Text>
          </View>
          
          <View style={styles.filterContainer}>
            <Filter size={16} color="#6b7280" />
            <Picker
              selectedValue={selectedCourse}
              onValueChange={(itemValue) => setSelectedCourse(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="All Courses" value="" />
              {allCourses.map(course => (
                <Picker.Item key={course} label={course} value={course} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Course Statistics */}
        <View style={styles.courseStatsGrid}>
          {(selectedCourse ? [selectedCourse] : allCourses).map(course => {
            const stats = getCourseStats(course);
            return (
              <TouchableOpacity
                key={course}
                style={styles.courseStatCard}
                onPress={() => setDetailModalCourse(course)}
              >
                <Text style={styles.courseStatTitle}>{course}</Text>
                <View style={styles.courseStatRow}>
                  <Text style={styles.courseStatLabel}>Registered:</Text>
                  <Text style={styles.courseStatValue}>{stats.registered}</Text>
                </View>
                <View style={styles.courseStatRow}>
                  <Text style={styles.courseStatLabel}>Attended:</Text>
                  <Text style={[styles.courseStatValue, styles.textGreen]}>{stats.attended}</Text>
                </View>
                <View style={styles.courseStatRow}>
                  <Text style={styles.courseStatLabel}>Attendance:</Text>
                  <Text style={[styles.courseStatValue, stats.percentage >= 70 ? styles.textGreen : styles.textRed]}>
                    {stats.percentage}%
                  </Text>
                </View>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[styles.progressBarFill, stats.percentage >= 70 ? styles.bgGreen : styles.bgRed, { width: `${stats.percentage}%` }]}
                  />
                </View>
                <View style={styles.detailsLink}>
                  <Eye size={16} color="#0f766e" />
                  <Text style={styles.detailsLinkText}>Click to view details</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {detailModalCourse && (
        <AttendanceDetailModal
          course={detailModalCourse}
          students={students}
          attendanceRecords={attendanceRecords}
          onClose={() => setDetailModalCourse(null)}
        />
      )}

      {/* Detailed Attendance List */}
      {selectedCourse && (
        <View style={styles.card}>
          <View style={styles.detailedHeader}>
            <Text style={styles.detailedTitle}>
              Verified Students: {selectedCourse}
            </Text>
            {/* Export CSV functionality removed for React Native */}
          </View>

          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Attended Student</Text>
            <Text style={styles.tableHeaderText}>Matric Number</Text>
            <Text style={styles.tableHeaderText}>Verification Date</Text>
            <Text style={styles.tableHeaderText}>Verified By (Invigilator)</Text>
          </View>
          {getAttendanceDetails(selectedCourse).map(({ student, attendance }) => (
            <View key={student.id} style={styles.tableRow}>
              <View style={styles.tableCellStudent}>
                <View style={styles.studentImageContainer}>
                  <Image
                    source={{ uri: student.image }}
                    style={styles.studentImage}
                  />
                </View>
                <View>
                  <Text style={styles.studentName}>{student.fullName}</Text>
                  <Text style={styles.attendedStatus}>✓ Attended Exam</Text>
                </View>
              </View>
              <Text style={styles.tableCellMatric}>{student.matricNumber}</Text>
              <Text style={styles.tableCellDate}>{new Date(attendance.verificationDate).toLocaleString()}</Text>
              <View style={styles.tableCellInvigilator}>
                <Text style={styles.invigilatorName}>{attendance.invigilatorName}</Text>
                <Text style={styles.invigilatorRole}>Invigilator</Text>
              </View>
            </View>
          ))}

          {getAttendanceDetails(selectedCourse).length === 0 && (
            <View style={styles.noStudentsContainer}>
              <Users size={48} color="#9ca3af" style={styles.noStudentsIcon} />
              <Text style={styles.noStudentsText}>No students have attended this course exam yet.</Text>
            </View>
          )}

          {/* Verification Summary */}
          {getAttendanceDetails(selectedCourse).length > 0 && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Exam Attendance Summary:</Text>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryTextBold}>{getAttendanceDetails(selectedCourse).length}</Text> student(s) attended {selectedCourse} exam
              </Text>
              <View style={styles.summaryStudentsList}>
                <Text style={styles.summaryStudentsListTitle}>Students who attended and their invigilators:</Text>
                {getAttendanceDetails(selectedCourse).map(detail => (
                  <View key={detail.student.id} style={styles.summaryStudentCard}>
                    <View style={styles.summaryStudentCardContent}>
                      <View>
                        <Text style={styles.summaryStudentName}>{detail.student.fullName}</Text>
                        <Text style={styles.summaryStudentMatric}>({detail.student.matricNumber})</Text>
                      </View>
                      <View style={styles.summaryStudentDetails}>
                        <Text style={styles.summaryInvigilator}>Invigilator: {detail.attendance.invigilatorName}</Text>
                        <Text style={styles.summaryDate}>
                          {new Date(detail.attendance.verificationDate).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Overall Statistics */}
      {!selectedCourse && (
        <View style={styles.card}>
          <Text style={styles.overallStatsTitle}>Overall Statistics</Text>
          <View style={styles.overallStatsGrid}>
            <View style={styles.overallStatItem}>
              <Text style={styles.overallStatValue}>{students.length}</Text>
              <Text style={styles.overallStatLabel}>Total Students</Text>
            </View>
            <View style={styles.overallStatItem}>
              <Text style={styles.overallStatValue}>{allCourses.length}</Text>
              <Text style={styles.overallStatLabel}>Total Courses</Text>
            </View>
            <View style={styles.overallStatItem}>
              <Text style={styles.overallStatValue}>{attendanceRecords.length}</Text>
              <Text style={styles.overallStatLabel}>Total Verifications</Text>
            </View>
            <View style={styles.overallStatItem}>
              <Text style={styles.overallStatValue}>
                {students.reduce((total, student) => total + student.courses.length, 0)}
              </Text>
              <Text style={styles.overallStatLabel}>Total Enrollments</Text>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#0d9488',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    backgroundColor: '#ccfbf1', // teal-100
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937', // gray-800
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  picker: {
    height: 40,
    width: 150,
    borderColor: '#d1d5db', // gray-300
    borderWidth: 1,
    borderRadius: 8,
  },
  courseStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  courseStatCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#f0fdfa', // from-teal-50
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccfbf1', // teal-100
  },
  courseStatTitle: {
    fontWeight: '600',
    color: '#1f2937', // gray-800
    marginBottom: 8,
  },
  courseStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  courseStatLabel: {
    fontSize: 14,
    color: '#4b5563', // gray-600
  },
  courseStatValue: {
    fontWeight: '500',
  },
  textGreen: {
    color: '#16a34a', // green-600
  },
  textRed: {
    color: '#dc2626', // red-600
  },
  progressBarBackground: {
    backgroundColor: '#e5e7eb', // gray-200
    borderRadius: 9999,
    height: 8,
    marginTop: 16,
  },
  progressBarFill: {
    height: 8,
    borderRadius: 9999,
  },
  bgGreen: {
    backgroundColor: '#22c55e', // green-500
  },
  bgRed: {
    backgroundColor: '#ef4444', // red-500
  },
  detailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    color: '#0f766e', // teal-700
    fontWeight: '500',
    fontSize: 14,
    marginTop: 16,
  },
  detailsLinkText: {
    color: '#0f766e',
    fontWeight: '500',
    fontSize: 14,
  },
  detailedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  detailedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937', // gray-800
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb', // gray-200
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderText: {
    flex: 1,
    fontWeight: '600',
    color: '#374151', // gray-700
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6', // gray-100
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tableCellStudent: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  studentImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb', // gray-200
  },
  studentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  studentName: {
    fontWeight: '600',
    color: '#1f2937', // gray-900
  },
  attendedStatus: {
    fontSize: 12,
    color: '#047857', // green-600
    fontWeight: '500',
  },
  tableCellMatric: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563', // gray-600
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', // font-mono
  },
  tableCellDate: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563', // gray-600
  },
  tableCellInvigilator: {
    flex: 1,
    flexDirection: 'column',
  },
  invigilatorName: {
    fontWeight: '600',
    color: '#1f2937', // gray-900
  },
  invigilatorRole: {
    fontSize: 12,
    color: '#2563eb', // blue-600
    fontWeight: '500',
  },
  noStudentsContainer: {
    textAlign: 'center',
    paddingVertical: 48,
    alignItems: 'center',
  },
  noStudentsIcon: {
    marginBottom: 16,
  },
  noStudentsText: {
    color: '#6b7280', // gray-500
  },
  summaryContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f0fdf4', // green-50
    borderWidth: 1,
    borderColor: '#bbf7d0', // green-200
    borderRadius: 8,
  },
  summaryTitle: {
    fontWeight: '600',
    color: '#065f46', // green-800
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#047857', // green-700
    marginBottom: 8,
  },
  summaryTextBold: {
    fontWeight: 'bold',
  },
  summaryStudentsList: {
    marginTop: 12,
  },
  summaryStudentsListTitle: {
    fontWeight: '500',
    color: '#065f46', // green-800
    marginBottom: 8,
  },
  summaryStudentCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0', // green-200
    marginBottom: 8,
  },
  summaryStudentCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryStudentName: {
    fontWeight: '600',
    color: '#1f2937', // gray-900
  },
  summaryStudentMatric: {
    color: '#4b5563', // gray-600
    marginLeft: 8,
  },
  summaryStudentDetails: {
    textAlign: 'right',
  },
  summaryInvigilator: {
    fontSize: 14,
    color: '#047857', // green-700
    fontWeight: '500',
  },
  summaryDate: {
    fontSize: 12,
    color: '#6b7280', // gray-500
  },
  overallStatsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937', // gray-800
    marginBottom: 24,
  },
  overallStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  overallStatItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  overallStatValue: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#2563eb', // blue-600 (example, will vary)
    marginBottom: 8,
  },
  overallStatLabel: {
    fontSize: 14,
    color: '#4b5563', // gray-600
  },
});

export default AttendanceReports;