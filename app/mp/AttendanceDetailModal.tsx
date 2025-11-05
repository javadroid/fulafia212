import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { X, User, Calendar, UserCheck, CheckCircle, AlertCircle } from 'lucide-react-native';
import { Student, CourseAttendance } from '../types'; // Adjust path as needed

interface AttendanceDetailModalProps {
  course: string;
  students: Student[];
  attendanceRecords: CourseAttendance[];
  onClose: () => void;
}

const AttendanceDetailModal: React.FC<AttendanceDetailModalProps> = ({
  course,
  students,
  attendanceRecords,
  onClose,
}) => {
  const registeredStudents = students.filter(s => s.courses.includes(course));
  const courseAttendance = attendanceRecords.filter(a => a.courseCode === course);

  const getAttendanceStatus = (matricNumber: string) => {
    return courseAttendance.find(a => a.matricNumber === matricNumber);
  };

  const attendedCount = courseAttendance.length;
  const absentCount = registeredStudents.length - attendedCount;
  const attendancePercentage = registeredStudents.length > 0
    ? Math.round((attendedCount / registeredStudents.length) * 100)
    : 0;

  return (
    <View style={styles.overlay}>
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{course}</Text>
            <Text style={styles.headerSubtitle}>Detailed Attendance Status</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
          >
            <X size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <User size={32} color="#2563eb" style={styles.summaryIcon} />
            <Text style={styles.summaryCount}>{registeredStudents.length}</Text>
            <Text style={styles.summaryLabel}>Registered</Text>
          </View>
          <View style={styles.summaryCard}>
            <CheckCircle size={32} color="#16a34a" style={styles.summaryIcon} />
            <Text style={styles.summaryCount}>{attendedCount}</Text>
            <Text style={styles.summaryLabel}>Attended</Text>
          </View>
          <View style={styles.summaryCard}>
            <AlertCircle size={32} color="#dc2626" style={styles.summaryIcon} />
            <Text style={styles.summaryCount}>{absentCount}</Text>
            <Text style={styles.summaryLabel}>Absent</Text>
          </View>
        </View>

        <View style={styles.attendanceRateContainer}>
          <View style={styles.attendanceRateHeader}>
            <Text style={styles.attendanceRateLabel}>Overall Attendance Rate</Text>
            <Text style={[styles.attendanceRateValue, attendancePercentage >= 70 ? styles.textGreen : styles.textRed]}>
              {attendancePercentage}%
            </Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View
              style={[styles.progressBarFill, attendancePercentage >= 70 ? styles.bgGreen : styles.bgRed, { width: `${attendancePercentage}%` }]}
            />
          </View>
        </View>

        <ScrollView style={styles.studentListScroll}>
          <Text style={styles.studentListTitle}>Student List</Text>
          <View style={styles.studentListContainer}>
            {registeredStudents.map(student => {
              const attendance = getAttendanceStatus(student.matricNumber);
              const isPresent = !!attendance;

              return (
                <View
                  key={student.id}
                  style={[
                    styles.studentCard,
                    isPresent ? styles.studentCardPresent : styles.studentCardAbsent,
                  ]}
                >
                  <View style={styles.studentCardContent}>
                    <View style={styles.studentInfo}>
                      <View style={styles.studentImageContainer}>
                        <Image
                          source={{ uri: student.image }}
                          style={styles.studentImage}
                        />
                      </View>
                      <View>
                        <Text style={styles.studentName}>{student.fullName}</Text>
                        <Text style={styles.studentMatric}>{student.matricNumber}</Text>
                        <Text style={styles.studentSession}>{student.session} - {student.semester}</Text>
                      </View>
                    </View>

                    <View style={styles.attendanceStatus}>
                      {isPresent ? (
                        <View style={styles.attendanceStatusPresent}>
                          <View style={styles.attendanceStatusRow}>
                            <CheckCircle size={20} color="#047857" />
                            <Text style={styles.attendanceStatusTextPresent}>Attended</Text>
                          </View>
                          <View style={styles.attendanceDetailRow}>
                            <Calendar size={12} color="#4b5563" />
                            <Text style={styles.attendanceDetailText}>{new Date(attendance.verificationDate).toLocaleString()}</Text>
                          </View>
                          <View style={styles.attendanceDetailRow}>
                            <UserCheck size={12} color="#4b5563" />
                            <Text style={styles.attendanceDetailTextBold}>{attendance.invigilatorName}</Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.attendanceStatusAbsent}>
                          <AlertCircle size={20} color="#b91c1c" />
                          <Text style={styles.attendanceStatusTextAbsent}>Absent</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButtonFooter}
          >
            <Text style={styles.closeButtonFooterText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#06b6d4', // from-teal-500
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#ccfbf1', // teal-100
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  summaryCard: {
    backgroundColor: '#eff6ff', // blue-50
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  summaryIcon: {
    marginBottom: 8,
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af', // blue-900
  },
  summaryLabel: {
    fontSize: 12,
    color: '#3b82f6', // blue-700
  },
  attendanceRateContainer: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  attendanceRateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  attendanceRateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151', // gray-700
  },
  attendanceRateValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  textGreen: {
    color: '#16a34a', // green-600
  },
  textRed: {
    color: '#dc2626', // red-600
  },
  progressBarBackground: {
    backgroundColor: '#e5e7eb', // gray-200
    borderRadius: 9999, // full
    height: 12,
  },
  progressBarFill: {
    height: 12,
    borderRadius: 9999, // full
  },
  bgGreen: {
    backgroundColor: '#22c55e', // green-500
  },
  bgRed: {
    backgroundColor: '#ef4444', // red-500
  },
  studentListScroll: {
    flex: 1,
    padding: 24,
  },
  studentListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937', // gray-800
    marginBottom: 16,
  },
  studentListContainer: {
    gap: 12, // space-y-3
  },
  studentCard: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
  },
  studentCardPresent: {
    borderColor: '#bbf7d0', // green-200
    backgroundColor: '#f0fdf4', // green-50
  },
  studentCardAbsent: {
    borderColor: '#fecaca', // red-200
    backgroundColor: '#fef2f2', // red-50
  },
  studentCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // space-x-3
  },
  studentImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontWeight: '600',
    color: '#1f2937', // gray-900
  },
  studentMatric: {
    fontSize: 14,
    color: '#4b5563', // gray-600
    fontFamily: 'monospace', // font-mono
  },
  studentSession: {
    fontSize: 12,
    color: '#6b7280', // gray-500
  },
  attendanceStatus: {
    alignItems: 'flex-end',
  },
  attendanceStatusPresent: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  attendanceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // space-x-1
    color: '#047857', // green-700
    fontWeight: '600',
    marginBottom: 4,
  },
  attendanceStatusTextPresent: {
    color: '#047857',
    fontWeight: '600',
  },
  attendanceStatusAbsent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // space-x-1
    color: '#b91c1c', // red-700
    fontWeight: '600',
  },
  attendanceStatusTextAbsent: {
    color: '#b91c1c',
    fontWeight: '600',
  },
  attendanceDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // space-x-1
    fontSize: 12,
    color: '#4b5563', // gray-600
  },
  attendanceDetailText: {
    fontSize: 12,
    color: '#4b5563',
  },
  attendanceDetailTextBold: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    backgroundColor: '#f9fafb', // gray-50
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  closeButtonFooter: {
    width: '100%',
    backgroundColor: '#1f2937', // gray-800
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonFooterText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default AttendanceDetailModal;