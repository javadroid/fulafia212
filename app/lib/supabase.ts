import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://rxttmdeetclcneakguew.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4dHRtZGVldGNsY25lYWtndWV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0OTA4OTYsImV4cCI6MjA3NzA2Njg5Nn0.g5e8_mb0-_UQy0HjuX9CyFMmKFavscDJnW3zjIgV4NE";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DatabaseStudent {
  id: string;
  full_name: string;
  matric_number: string;
  image: string;
  session: string;
  semester: string;
  registration_date: string;
  created_at: string;
}

export interface DatabaseStudentCourse {
  id: string;
  student_id: string;
  course_code: string;
  created_at: string;
}

export interface DatabaseAttendanceRecord {
  id: string;
  matric_number: string;
  course_code: string;
  verification_date: string;
  invigilator_name: string;
  created_at: string;
}
