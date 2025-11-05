export interface Student {
  id: string;
  fullName: string;
  matricNumber: string;
  image: string;
  courses: string[];
  session: string;
  semester: string;
  registrationDate: string;
}

export interface CourseAttendance {
  id: string;
  matricNumber: string;
  courseCode: string;
  verificationDate: string;
  invigilatorName: string;
}