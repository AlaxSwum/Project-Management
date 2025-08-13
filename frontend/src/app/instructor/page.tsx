'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { CalendarIcon, ClockIcon, MapPinIcon, FolderIcon, UserGroupIcon, ClipboardDocumentListIcon, ChartBarIcon, PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export const dynamic = 'force-dynamic';

interface ClassItem {
  id: number;
  class_title: string;
  class_type: string;
  target_audience: string;
  class_date: string;
  start_time: string;
  end_time: string;
  duration: string;
  location: string;
  instructor_name: string;
  class_description: string;
  learning_objectives: string[];
  max_participants: number;
  current_participants: number;
  status: string;
  folder_name?: string;
}

interface Student {
  id: number;
  student_name: string;
  email: string;
  phone_number?: string;
  discord_id?: string;
  facebook_link?: string;
  enrolled_at: string;
  notes?: string;
}

interface AttendanceFolder {
  id: number;
  attendance_date: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
}

interface AttendanceRecord {
  id: number;
  student_id: number;
  student_name: string;
  status: 'present' | 'absent' | 'late';
  reason?: string | null;
}

interface StudentKPI {
  student_id: number;
  student_name: string;
  total_classes: number;
  attended_classes: number;
  attendance_rate: number;
  absent_excused: number;
  absent_unexcused: number;
  recent_trend: 'improving' | 'declining' | 'stable';
}

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [classTab, setClassTab] = useState('students'); // students, attendance, kpi
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceFolders, setAttendanceFolders] = useState<AttendanceFolder[]>([]);
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [studentKPIs, setStudentKPIs] = useState<StudentKPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // New attendance folder form
  const [showNewFolderForm, setShowNewFolderForm] = useState(false);
  const [newFolderDate, setNewFolderDate] = useState(new Date().toISOString().split('T')[0]);

  // Check if user is instructor
  useEffect(() => {
    if (user && user.role !== 'instructor') {
      window.location.href = '/dashboard';
    }
  }, [user]);

  // Load assigned classes for instructor
  useEffect(() => {
    if (user && user.role === 'instructor') {
      loadInstructorClasses();
    }
  }, [user]);

  // Load class data when class is selected
  useEffect(() => {
    if (selectedClass) {
      if (classTab === 'students') {
        loadClassStudents();
      } else if (classTab === 'attendance') {
        loadAttendanceFolders();
      } else if (classTab === 'kpi') {
        loadStudentKPIs();
      }
    }
  }, [selectedClass, classTab]);

  // Load attendance records when folder/date is selected
  useEffect(() => {
    if (selectedClass && selectedAttendanceDate && selectedFolderId) {
      loadAttendanceRecords();
    }
  }, [selectedClass, selectedAttendanceDate, selectedFolderId]);

  const loadInstructorClasses = async () => {
    try {
      setLoading(true);
      console.log('📚 Loading classes for instructor:', user?.id, user?.name);
      
      const { data: instructorClasses, error: classesError } = await supabase
        .from('classes_instructors')
        .select(`
          classes!inner (
            *,
            classes_folders(name)
          )
        `)
        .eq('instructor_id', user?.id)
        .eq('is_active', true);

      if (classesError) {
        console.error('❌ Error loading instructor classes:', classesError);
        setMessage(`Error loading classes: ${classesError.message}`);
        return;
      }

      console.log('🔍 Raw instructor classes data:', instructorClasses);

      // Format classes from junction table result  
      const filteredClasses = instructorClasses
        ?.filter((item: any) => {
          const shouldInclude = !item.classes.class_title?.toLowerCase().includes('general training all staff');
          console.log(`🔍 Class "${item.classes.class_title}" - Status: ${item.classes.status}, Include: ${shouldInclude}`);
          return shouldInclude;
        })
        ?.map((item: any) => ({
          ...item.classes,
          folder_name: item.classes.classes_folders?.name || 'No Folder'
        })) || [];

      console.log('🔍 Classes after filtering:', filteredClasses);

      // Get actual student counts for each class
      const classesWithCounts = await Promise.all(
        filteredClasses.map(async (classItem) => {
          const { data: participants, error } = await supabase
            .from('classes_participants')
            .select('id')
            .eq('class_id', classItem.id);
          
          return {
            ...classItem,
            current_participants: participants?.length || 0
          };
        })
      );

      console.log('📚 Final loaded classes:', classesWithCounts);
      setClasses(classesWithCounts);
      setMessage('');
    } catch (error) {
      console.error('💥 Error in loadInstructorClasses:', error);
      setMessage('Error loading classes');
    } finally {
      setLoading(false);
    }
  };

  const loadClassStudents = async () => {
    if (!selectedClass) return;

    try {
      setLoading(true);
      const { data: studentsData, error } = await supabase
        .from('classes_participants')
        .select('*')
        .eq('class_id', selectedClass.id);

      if (error) {
        console.error('Error loading students:', error);
        setMessage('Error loading students');
        return;
      }

      setStudents(studentsData || []);
      setMessage('');
    } catch (error) {
      console.error('Error loading students:', error);
      setMessage('Error loading students');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceFolders = async () => {
    if (!selectedClass) return;

    try {
      setLoading(true);
      // Get attendance folders for this class
      const { data: folderData, error } = await supabase
        .from('class_attendance_folders')
        .select('id, class_id, attendance_date')
        .eq('class_id', selectedClass.id)
        .order('attendance_date', { ascending: false });

      if (error && error.code !== 'PGRST116') { // Table might not exist yet
        console.error('Error loading attendance folders:', error);
        setMessage('Error loading attendance data');
        return;
      }

      if (!folderData || folderData.length === 0) {
        setAttendanceFolders([]);
        setMessage('');
        return;
      }

      // Get stats for each folder
      const folders: AttendanceFolder[] = await Promise.all(
        folderData.map(async (folder) => {
          const { data: daily } = await supabase
            .from('class_daily_attendance')
            .select('status')
            .eq('folder_id', folder.id);

          const present = daily?.filter((r: any) => r.status === 'present').length || 0;
          const absent = daily?.filter((r: any) => r.status === 'absent').length || 0;
          const late = daily?.filter((r: any) => r.status === 'late').length || 0;

          return {
            id: folder.id,
            attendance_date: folder.attendance_date,
            present_count: present,
            absent_count: absent,
            late_count: late,
            total_students: present + absent + late
          } as AttendanceFolder;
        })
      );

      setAttendanceFolders(folders);
      setMessage('');
    } catch (error) {
      console.error('Error loading attendance folders:', error);
      setMessage('Error loading attendance data');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceRecords = async () => {
    if (!selectedClass || !selectedAttendanceDate || !selectedFolderId) return;

    try {
      setLoading(true);
      const { data: records, error } = await supabase
        .from('class_daily_attendance')
        .select('id, student_id, student_name, status, reason')
        .eq('folder_id', selectedFolderId);

      if (error) {
        console.error('Error loading attendance records:', error);
        setMessage('Error loading attendance records');
        return;
      }

      setAttendanceRecords(records || []);
      setMessage('');
    } catch (error) {
      console.error('Error loading attendance records:', error);
      setMessage('Error loading attendance records');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentKPIs = async () => {
    // Placeholder to avoid runtime errors while KPI UI is "Coming Soon"
    setStudentKPIs([]);
  };

  const createAttendanceFolder = async () => {
    if (!selectedClass || !newFolderDate) return;

    try {
      setLoading(true);
      
      // First create the attendance folder
      const { data: folder, error: folderError } = await supabase
        .from('class_attendance_folders')
        .insert({
          class_id: selectedClass.id,
          attendance_date: newFolderDate,
          created_by: user?.id
        })
        .select()
        .single();

      if (folderError) {
        console.error('Error creating attendance folder:', folderError);
        setMessage(`Error creating attendance folder: ${folderError.message}`);
        return;
      }

      // Get all students in the class
      const { data: classStudents } = await supabase
        .from('classes_participants')
        .select('*')
        .eq('class_id', selectedClass.id);

      if (!classStudents || classStudents.length === 0) {
        setMessage('No students found in this class');
        return;
      }

      // Create daily attendance records for each student (default present)
      const attendanceRecords = classStudents.map((student: any) => ({
        folder_id: folder.id,
        student_id: student.id,
        student_name: student.student_name,
        status: 'present' as const,
        reason: null,
        recorded_by: user?.id
      }));

      const { error: recordsError } = await supabase
        .from('class_daily_attendance')
        .insert(attendanceRecords);

      if (recordsError) {
        console.error('Error creating attendance records:', recordsError);
        setMessage(`Error creating attendance records: ${recordsError.message}`);
        return;
      }

      setMessage('Attendance folder created successfully');
      setShowNewFolderForm(false);
      setNewFolderDate(new Date().toISOString().split('T')[0]);
      await loadAttendanceFolders();
      setSelectedFolderId(folder.id);
      setSelectedAttendanceDate(folder.attendance_date);
      await loadAttendanceRecords();
    } catch (error) {
      console.error('Error creating attendance folder:', error);
      setMessage(`Error creating attendance folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const updateAttendanceStatus = async (recordId: number, newStatus: 'present' | 'absent' | 'late') => {
    try {
      const { error } = await supabase
        .from('class_daily_attendance')
        .update({ status: newStatus })
        .eq('id', recordId);

      if (error) {
        console.error('Error updating attendance:', error);
        setMessage('Error updating attendance');
        return;
      }

      // Reload records
      loadAttendanceRecords();
      loadAttendanceFolders(); // Refresh folder stats
      setMessage('Attendance updated successfully');
    } catch (error) {
      console.error('Error updating attendance:', error);
      setMessage('Error updating attendance');
    }
  };

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (user.role !== 'instructor') {
    return <div className="flex justify-center items-center min-h-screen">Access denied. Instructor role required.</div>;
  }

  return (
    <div className="instructor-dashboard" style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--background)',
      fontFamily: "'Mabry Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <Sidebar projects={[]} onCreateProject={() => {}} />
      
      <div style={{
        flex: '1',
        marginLeft: '16rem',
        padding: 'var(--spacing-xl)'
      }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-2xl)',
          padding: 'var(--spacing-xl)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {/* Header */}
          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '650',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-sm)',
              fontFamily: "'Mabry Pro', 'Inter', sans-serif",
              letterSpacing: '-0.025em'
            }}>
              Instructor Dashboard
            </h1>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '1.125rem',
              fontFamily: "'Mabry Pro', 'Inter', sans-serif"
            }}>
              Welcome back, {user.name}! Manage your classes and track student progress.
            </p>
          </div>

          {message && (
            <div style={{
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--spacing-lg)',
              backgroundColor: message.includes('Error') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: message.includes('Error') ? 'var(--status-blocked)' : 'var(--status-completed)',
              border: message.includes('Error') ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
              fontFamily: "'Mabry Pro', 'Inter', sans-serif"
            }}>
              {message}
            </div>
          )}

          {!selectedClass ? (
            /* My Classes View */
            <div>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-lg)',
                fontFamily: "'Mabry Pro', 'Inter', sans-serif",
                letterSpacing: '-0.025em'
              }}>
                My Classes
              </h2>

              {loading ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 'var(--spacing-xl) 0', 
                  fontFamily: "'Mabry Pro', 'Inter', sans-serif",
                  color: 'var(--text-secondary)'
                }}>Loading classes...</div>
              ) : classes.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 'var(--spacing-2xl) 0', 
                  color: 'var(--text-muted)', 
                  fontFamily: "'Mabry Pro', 'Inter', sans-serif"
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📚</div>
                  <h3 style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: '600', 
                    marginBottom: 'var(--spacing-sm)', 
                    color: 'var(--text-primary)',
                    fontFamily: "'Mabry Pro', 'Inter', sans-serif"
                  }}>No Classes Assigned</h3>
                  <p>You don't have any classes assigned yet. Contact your administrator.</p>
                </div>
              ) : (
                <div className="grid-responsive-3" style={{
                  gap: 'var(--spacing-lg)'
                }}>
                  {classes.map((classItem) => (
                    <div
                      key={classItem.id}
                      onClick={() => setSelectedClass(classItem)}
                      className="card-hover"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-xl)',
                        padding: 'var(--spacing-lg)',
                        boxShadow: 'var(--shadow-sm)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-normal)',
                        fontFamily: "'Mabry Pro', 'Inter', sans-serif",
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        justifyContent: 'space-between', 
                        marginBottom: 'var(--spacing-sm)' 
                      }}>
                        <h3 style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          lineHeight: '1.25',
                          flex: '1',
                          marginRight: 'var(--spacing-sm)',
                          fontFamily: "'Mabry Pro', 'Inter', sans-serif",
                          letterSpacing: '-0.025em'
                        }}>
                          {classItem.class_title}
                        </h3>
                        <span className="status-badge" style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: 'var(--text-secondary)',
                          backgroundColor: 'var(--surface-dark)',
                          padding: 'var(--spacing-xs) var(--spacing-sm)',
                          borderRadius: 'var(--radius-full)',
                          border: '1px solid var(--border)',
                          fontFamily: "'Mabry Pro', 'Inter', sans-serif"
                        }}>
                          {classItem.status}
                        </span>
                      </div>

                      <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          fontSize: '0.875rem', 
                          color: 'var(--text-secondary)', 
                          marginBottom: 'var(--spacing-sm)',
                          fontFamily: "'Mabry Pro', 'Inter', sans-serif"
                        }}>
                          <CalendarIcon style={{ height: '1rem', width: '1rem', marginRight: 'var(--spacing-sm)' }} />
                          {classItem.class_date}
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          fontSize: '0.875rem', 
                          color: 'var(--text-secondary)', 
                          marginBottom: 'var(--spacing-sm)',
                          fontFamily: "'Mabry Pro', 'Inter', sans-serif"
                        }}>
                          <ClockIcon style={{ height: '1rem', width: '1rem', marginRight: 'var(--spacing-sm)' }} />
                          {classItem.start_time} - {classItem.end_time}
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          fontSize: '0.875rem', 
                          color: 'var(--text-secondary)', 
                          marginBottom: 'var(--spacing-sm)',
                          fontFamily: "'Mabry Pro', 'Inter', sans-serif"
                        }}>
                          <MapPinIcon style={{ height: '1rem', width: '1rem', marginRight: 'var(--spacing-sm)' }} />
                          {classItem.location}
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          fontSize: '0.875rem', 
                          color: 'var(--text-secondary)',
                          fontFamily: "'Mabry Pro', 'Inter', sans-serif"
                        }}>
                          <FolderIcon style={{ height: '1rem', width: '1rem', marginRight: 'var(--spacing-sm)' }} />
                          {classItem.folder_name}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ 
                          fontSize: '0.875rem', 
                          color: 'var(--text-primary)', 
                          fontFamily: "'Mabry Pro', 'Inter', sans-serif" 
                        }}>
                          <span style={{ fontWeight: '600' }}>{classItem.current_participants}</span>
                          <span style={{ color: 'var(--text-muted)' }}> / {classItem.max_participants} students</span>
                        </div>
                        <button className="btn-primary-solid" style={{
                          background: 'var(--primary)',
                          color: 'var(--text-inverse)',
                          padding: 'var(--spacing-sm) var(--spacing-md)',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all var(--transition-normal)',
                          fontFamily: "'Mabry Pro', 'Inter', sans-serif",
                          boxShadow: 'var(--shadow-sm)'
                        }}>
                          Manage
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Class Details View */
            <div>
              {/* Back Button */}
              <button
                onClick={() => {
                  setSelectedClass(null);
                  setClassTab('students');
                }}
                className="btn-outline"
                style={{
                  marginBottom: 'var(--spacing-lg)',
                  fontFamily: "'Mabry Pro', 'Inter', sans-serif"
                }}
              >
                ← Back to My Classes
              </button>

              {/* Class Header */}
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-sm)',
                  fontFamily: "'Mabry Pro', 'Inter', sans-serif",
                  letterSpacing: '-0.025em'
                }}>
                  {selectedClass.class_title}
                </h2>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontFamily: "'Mabry Pro', 'Inter', sans-serif"
                }}>
                  {selectedClass.current_participants} students • {selectedClass.class_date} • {selectedClass.start_time} - {selectedClass.end_time}
                </p>
              </div>

              {/* Class Tabs */}
              <div style={{
                display: 'flex',
                gap: 'var(--spacing-xs)',
                marginBottom: 'var(--spacing-lg)',
                backgroundColor: 'var(--surface-dark)',
                padding: 'var(--spacing-xs)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border)'
              }}>
                {[
                  { id: 'students', label: 'Students', icon: UserGroupIcon },
                  { id: 'attendance', label: 'Attendance', icon: ClipboardDocumentListIcon },
                  { id: 'kpi', label: 'KPI', icon: ChartBarIcon }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setClassTab(tab.id)}
                      style={{
                        flex: '1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--spacing-sm)',
                        padding: 'var(--spacing-sm) var(--spacing-lg)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        transition: 'all var(--transition-normal)',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: "'Mabry Pro', 'Inter', sans-serif",
                        backgroundColor: classTab === tab.id ? 'var(--surface)' : 'transparent',
                        color: classTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                        boxShadow: classTab === tab.id ? 'var(--shadow-sm)' : 'none'
                      }}
                    >
                      <Icon style={{ height: '1rem', width: '1rem' }} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              {classTab === 'students' && (
                <div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--spacing-md)',
                    fontFamily: "'Mabry Pro', 'Inter', sans-serif",
                    letterSpacing: '-0.025em'
                  }}>
                    Student List
                  </h3>
                  
                  {loading ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: 'var(--spacing-xl) 0',
                      color: 'var(--text-secondary)',
                      fontFamily: "'Mabry Pro', 'Inter', sans-serif"
                    }}>Loading students...</div>
                  ) : students.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: 'var(--spacing-2xl) 0', 
                      color: 'var(--text-muted)',
                      fontFamily: "'Mabry Pro', 'Inter', sans-serif"
                    }}>
                      <UserGroupIcon style={{ height: '4rem', width: '4rem', margin: '0 auto var(--spacing-md)', color: 'var(--border-dark)' }} />
                      <h4 style={{ 
                        fontSize: '1.125rem', 
                        fontWeight: '600', 
                        marginBottom: 'var(--spacing-sm)',
                        color: 'var(--text-primary)',
                        fontFamily: "'Mabry Pro', 'Inter', sans-serif"
                      }}>No Students Enrolled</h4>
                      <p>No students are currently enrolled in this class.</p>
                    </div>
                  ) : (
                    <div style={{
                      background: 'var(--surface)',
                      borderRadius: 'var(--radius-2xl)',
                      border: '2px solid var(--border)',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-lg)',
                      margin: '0 auto',
                      maxWidth: '100%'
                    }}>
                      <div style={{
                        background: 'var(--surface-light)',
                        padding: 'var(--spacing-md)',
                        borderBottom: '2px solid var(--border)'
                      }}>
                        <h4 style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          textAlign: 'center',
                          margin: '0',
                          fontFamily: "'Mabry Pro', 'Inter', sans-serif"
                        }}>
                          Class Students ({students.length})
                        </h4>
                      </div>
                      
                      <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse',
                        fontFamily: "'Mabry Pro', 'Inter', sans-serif"
                      }}>
                        <thead style={{ background: 'var(--surface-dark)' }}>
                          <tr>
                            <th style={{ 
                              padding: 'var(--spacing-md)', 
                              textAlign: 'center', 
                              fontSize: '0.875rem', 
                              fontWeight: '600', 
                              color: 'var(--text-secondary)',
                              borderBottom: '2px solid var(--border)',
                              borderRight: '1px solid var(--border)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.025em'
                            }}>Student Name</th>
                            <th style={{ 
                              padding: 'var(--spacing-md)', 
                              textAlign: 'center', 
                              fontSize: '0.875rem', 
                              fontWeight: '600', 
                              color: 'var(--text-secondary)',
                              borderBottom: '2px solid var(--border)',
                              borderRight: '1px solid var(--border)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.025em'
                            }}>Email</th>
                            <th style={{ 
                              padding: 'var(--spacing-md)', 
                              textAlign: 'center', 
                              fontSize: '0.875rem', 
                              fontWeight: '600', 
                              color: 'var(--text-secondary)',
                              borderBottom: '2px solid var(--border)',
                              borderRight: '1px solid var(--border)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.025em'
                            }}>Phone</th>
                            <th style={{ 
                              padding: 'var(--spacing-md)', 
                              textAlign: 'center', 
                              fontSize: '0.875rem', 
                              fontWeight: '600', 
                              color: 'var(--text-secondary)',
                              borderBottom: '2px solid var(--border)',
                              borderRight: '1px solid var(--border)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.025em'
                            }}>Discord ID</th>
                            <th style={{ 
                              padding: 'var(--spacing-md)', 
                              textAlign: 'center', 
                              fontSize: '0.875rem', 
                              fontWeight: '600', 
                              color: 'var(--text-secondary)',
                              borderBottom: '2px solid var(--border)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.025em'
                            }}>Enrolled Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((student, index) => (
                            <tr key={student.id} style={{
                              borderBottom: index < students.length - 1 ? '1px solid var(--border)' : 'none',
                              transition: 'background-color var(--transition-normal)',
                              cursor: 'default'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-light)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <td style={{ 
                                padding: 'var(--spacing-md)', 
                                textAlign: 'center',
                                color: 'var(--text-primary)', 
                                fontWeight: '500',
                                borderRight: '1px solid var(--border)',
                                fontFamily: "'Mabry Pro', 'Inter', sans-serif"
                              }}>{student.student_name}</td>
                              <td style={{ 
                                padding: 'var(--spacing-md)', 
                                textAlign: 'center',
                                color: 'var(--text-secondary)',
                                borderRight: '1px solid var(--border)',
                                fontFamily: "'Mabry Pro', 'Inter', sans-serif",
                                maxWidth: '280px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }} title={student.email}>{student.email}</td>
                              <td style={{ 
                                padding: 'var(--spacing-md)', 
                                textAlign: 'center',
                                color: 'var(--text-secondary)',
                                borderRight: '1px solid var(--border)',
                                fontFamily: "'Mabry Pro', 'Inter', sans-serif"
                              }}>{student.phone_number ? student.phone_number : (
                                <span style={{
                                  background: 'var(--surface-dark)',
                                  color: 'var(--text-secondary)',
                                  padding: '0.125rem 0.5rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  border: '1px solid var(--border)'
                                }}>N/A</span>
                              )}</td>
                              <td style={{ 
                                padding: 'var(--spacing-md)', 
                                textAlign: 'center',
                                color: 'var(--text-secondary)',
                                borderRight: '1px solid var(--border)',
                                fontFamily: "'Mabry Pro', 'Inter', sans-serif",
                                maxWidth: '220px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }} title={student.discord_id || 'N/A'}>{student.discord_id ? student.discord_id : (
                                <span style={{
                                  background: 'var(--surface-dark)',
                                  color: 'var(--text-secondary)',
                                  padding: '0.125rem 0.5rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  border: '1px solid var(--border)'
                                }}>N/A</span>
                              )}</td>
                              <td style={{ 
                                padding: 'var(--spacing-md)', 
                                textAlign: 'center',
                                color: 'var(--text-muted)', 
                                fontSize: '0.875rem',
                                fontFamily: "'Mabry Pro', 'Inter', sans-serif"
                              }}>
                                {new Date(student.enrolled_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {classTab === 'attendance' && (
                <div>
                  {/* Create Folder */}
                  <div style={{
                    display: 'flex',
                    gap: 'var(--spacing-sm)',
                    alignItems: 'center',
                    marginBottom: 'var(--spacing-lg)'
                  }}>
                    <input
                      type="date"
                      value={newFolderDate}
                      onChange={(e) => setNewFolderDate(e.target.value)}
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <button
                      onClick={createAttendanceFolder}
                      className="btn-primary-solid"
                      style={{
                        background: 'var(--primary)',
                        color: 'var(--text-inverse)',
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        borderRadius: 'var(--radius-lg)',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Create Attendance Day
                    </button>
                  </div>

                  {/* Folders list */}
                  <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <h4 style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--spacing-sm)'
                    }}>
                      Attendance Days
                    </h4>
                    {attendanceFolders.length === 0 ? (
                      <div style={{ color: 'var(--text-secondary)' }}>No attendance days yet.</div>
                    ) : (
                      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                        {attendanceFolders.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => {
                              setSelectedFolderId(f.id);
                              setSelectedAttendanceDate(f.attendance_date);
                            }}
                            style={{
                              padding: 'var(--spacing-sm) var(--spacing-md)',
                              borderRadius: 'var(--radius-full)',
                              border: '1px solid var(--border)',
                              background: selectedFolderId === f.id ? 'var(--primary-soft)' : 'var(--surface)',
                              color: selectedFolderId === f.id ? 'var(--primary)' : 'var(--text-secondary)'
                            }}
                          >
                            {new Date(f.attendance_date).toLocaleDateString()} · P {f.present_count} · A {f.absent_count} · L {f.late_count}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Records table */}
                  {selectedFolderId && (
                    <div style={{
                      background: 'var(--surface)',
                      borderRadius: 'var(--radius-2xl)',
                      border: '2px solid var(--border)',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-lg)'
                    }}>
                      <div style={{
                        background: 'var(--surface-light)',
                        padding: 'var(--spacing-md)',
                        borderBottom: '2px solid var(--border)'
                      }}>
                        <h4 style={{ margin: 0, textAlign: 'center' }}>
                          {new Date(selectedAttendanceDate).toLocaleDateString()} Attendance
                        </h4>
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'var(--surface-dark)' }}>
                          <tr>
                            <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Student</th>
                            <th style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>Status</th>
                            <th style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceRecords.map((rec) => (
                            <tr key={rec.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: 'var(--spacing-md)' }}>{rec.student_name}</td>
                              <td style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                                <span style={{
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '9999px',
                                  border: '1px solid var(--border)',
                                  background: 'var(--surface-light)',
                                  color: rec.status === 'present' ? 'var(--status-completed)' : rec.status === 'late' ? 'var(--status-in-progress)' : 'var(--status-blocked)',
                                  fontWeight: 600,
                                  fontSize: '0.875rem'
                                }}>
                                  {rec.status}
                                </span>
                              </td>
                              <td style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                                  <button
                                    onClick={() => updateAttendanceStatus(rec.id, 'present')}
                                    style={{
                                      padding: '0.25rem 0.75rem',
                                      borderRadius: '0.5rem',
                                      border: '1px solid var(--border)',
                                      background: rec.status === 'present' ? 'var(--primary-soft)' : 'var(--surface)',
                                      color: rec.status === 'present' ? 'var(--primary)' : 'var(--text-secondary)'
                                    }}
                                  >Present</button>
                                  <button
                                    onClick={() => updateAttendanceStatus(rec.id, 'late')}
                                    style={{
                                      padding: '0.25rem 0.75rem',
                                      borderRadius: '0.5rem',
                                      border: '1px solid var(--border)',
                                      background: rec.status === 'late' ? 'var(--primary-soft)' : 'var(--surface)',
                                      color: rec.status === 'late' ? 'var(--primary)' : 'var(--text-secondary)'
                                    }}
                                  >Late</button>
                                  <button
                                    onClick={() => updateAttendanceStatus(rec.id, 'absent')}
                                    style={{
                                      padding: '0.25rem 0.75rem',
                                      borderRadius: '0.5rem',
                                      border: '1px solid var(--border)',
                                      background: rec.status === 'absent' ? 'var(--primary-soft)' : 'var(--surface)',
                                      color: rec.status === 'absent' ? 'var(--primary)' : 'var(--text-secondary)'
                                    }}
                                  >Absent</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {classTab === 'kpi' && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 'var(--spacing-2xl)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-2xl)',
                    border: '2px solid var(--border)',
                    padding: 'var(--spacing-2xl)',
                    boxShadow: 'var(--shadow-lg)',
                    maxWidth: '500px',
                    width: '100%'
                  }}>
                    <ChartBarIcon style={{ 
                      height: '4rem', 
                      width: '4rem', 
                      margin: '0 auto var(--spacing-lg)', 
                      color: 'var(--text-muted)' 
                    }} />
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--spacing-sm)',
                      fontFamily: "'Mabry Pro', 'Inter', sans-serif"
                    }}>
                      Student KPI & Performance
                    </h3>
                    <p style={{
                      fontSize: '1.125rem',
                      color: 'var(--text-secondary)',
                      marginBottom: 'var(--spacing-md)',
                      fontFamily: "'Mabry Pro', 'Inter', sans-serif"
                    }}>
                      Coming Soon
                    </p>
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-muted)',
                      fontFamily: "'Mabry Pro', 'Inter', sans-serif"
                    }}>
                      Comprehensive KPI tracking and performance analytics will be available soon. Monitor student progress, attendance rates, and achievement metrics.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
