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
  date: string;
  total_students: number;
  present_count: number;
  absent_count: number;
}

interface AttendanceRecord {
  id: number;
  student_id: number;
  student_name: string;
  status: 'present' | 'absent';
  absence_type?: 'excused' | 'unexcused' | 'sick' | 'family';
  reason?: string;
  notes?: string;
  date: string;
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

  // Load attendance records when date is selected
  useEffect(() => {
    if (selectedClass && selectedAttendanceDate) {
      loadAttendanceRecords();
    }
  }, [selectedClass, selectedAttendanceDate]);

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
      // Get unique attendance dates for this class
      const { data: attendanceData, error } = await supabase
        .from('class_attendance')
        .select('date')
        .eq('class_id', selectedClass.id);

      if (error && error.code !== 'PGRST116') { // Table might not exist yet
        console.error('Error loading attendance folders:', error);
        setMessage('Error loading attendance data');
        return;
      }

      // Group by date and calculate stats
      const dateGroups = (attendanceData || []).reduce((acc: any, record: any) => {
        const date = record.date;
        if (!acc[date]) {
          acc[date] = { date, records: [] };
        }
        acc[date].records.push(record);
        return acc;
      }, {});

      const folders: AttendanceFolder[] = await Promise.all(
        Object.values(dateGroups).map(async (group: any) => {
          const { data: dayRecords } = await supabase
            .from('class_attendance')
            .select('status')
            .eq('class_id', selectedClass.id)
            .eq('date', group.date);

          const present = dayRecords?.filter(r => r.status === 'present').length || 0;
          const absent = dayRecords?.filter(r => r.status === 'absent').length || 0;

          return {
            date: group.date,
            total_students: present + absent,
            present_count: present,
            absent_count: absent
          };
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
    if (!selectedClass || !selectedAttendanceDate) return;

    try {
      setLoading(true);
      const { data: records, error } = await supabase
        .from('class_attendance')
        .select('*')
        .eq('class_id', selectedClass.id)
        .eq('date', selectedAttendanceDate);

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
    if (!selectedClass) return;

    try {
      setLoading(true);
      
      // Get all students for this class
      const { data: classStudents } = await supabase
        .from('classes_participants')
        .select('*')
        .eq('class_id', selectedClass.id);

      if (!classStudents) {
        setStudentKPIs([]);
        return;
      }

      // Calculate KPIs for each student
      const kpis: StudentKPI[] = await Promise.all(
        classStudents.map(async (student) => {
          // Get attendance records for this student
          const { data: attendanceRecords } = await supabase
            .from('class_attendance')
            .select('status, absence_type')
            .eq('class_id', selectedClass.id)
            .eq('student_id', student.id);

          const totalClasses = attendanceRecords?.length || 0;
          const attendedClasses = attendanceRecords?.filter(r => r.status === 'present').length || 0;
          const absentExcused = attendanceRecords?.filter(r => r.status === 'absent' && r.absence_type === 'excused').length || 0;
          const absentUnexcused = attendanceRecords?.filter(r => r.status === 'absent' && ['unexcused', 'sick', 'family'].includes(r.absence_type)).length || 0;
          
          const attendanceRate = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
          
          // Determine trend (simplified)
          let recent_trend: 'improving' | 'declining' | 'stable' = 'stable';
          if (attendanceRate > 80) recent_trend = 'improving';
          else if (attendanceRate < 60) recent_trend = 'declining';

          return {
            student_id: student.id,
            student_name: student.student_name,
            total_classes: totalClasses,
            attended_classes: attendedClasses,
            attendance_rate: Math.round(attendanceRate),
            absent_excused: absentExcused,
            absent_unexcused: absentUnexcused,
            recent_trend
          };
        })
      );

      setStudentKPIs(kpis);
      setMessage('');
    } catch (error) {
      console.error('Error loading student KPIs:', error);
      setMessage('Error loading student KPIs');
    } finally {
      setLoading(false);
    }
  };

  const createAttendanceFolder = async () => {
    if (!selectedClass || !newFolderDate) return;

    try {
      setLoading(true);
      
      // Create attendance records for all students in the class
      const { data: classStudents } = await supabase
        .from('classes_participants')
        .select('*')
        .eq('class_id', selectedClass.id);

      if (!classStudents) {
        setMessage('No students found in this class');
        return;
      }

      // Insert attendance records for each student (default to present)
      const attendanceRecords = classStudents.map(student => ({
        class_id: selectedClass.id,
        student_id: student.id,
        student_name: student.student_name,
        date: newFolderDate,
        status: 'present' as const,
        recorded_by: user?.id
      }));

      const { error } = await supabase
        .from('class_attendance')
        .insert(attendanceRecords);

      if (error) {
        console.error('Error creating attendance folder:', error);
        setMessage('Error creating attendance folder');
        return;
      }

      setMessage('Attendance folder created successfully');
      setShowNewFolderForm(false);
      setNewFolderDate(new Date().toISOString().split('T')[0]);
      loadAttendanceFolders();
    } catch (error) {
      console.error('Error creating attendance folder:', error);
      setMessage('Error creating attendance folder');
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendanceStatus = async (recordId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'present' ? 'absent' : 'present';
      
      const { error } = await supabase
        .from('class_attendance')
        .update({ 
          status: newStatus,
          absence_type: newStatus === 'absent' ? 'unexcused' : null
        })
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
    <div className="flex min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Sidebar projects={[]} onCreateProject={() => {}} />
      
      <div className="flex-1 ml-64 p-8">
        <div style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          {/* Header */}
          <div className="mb-8">
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#2d3748', marginBottom: '8px' }}>
              Instructor Dashboard
            </h1>
            <p style={{ color: '#718096', fontSize: '16px' }}>
              Welcome back, {user.name}! Manage your classes and track student progress.
            </p>
          </div>

          {message && (
            <div className={`p-4 rounded-lg mb-6 ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}

          {!selectedClass ? (
            /* My Classes View */
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d3748', marginBottom: '24px' }}>
                My Classes
              </h2>

              {loading ? (
                <div className="text-center py-8">Loading classes...</div>
              ) : classes.length === 0 ? (
                <div className="text-center py-12" style={{ color: '#718096' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>No Classes Assigned</h3>
                  <p>You don't have any classes assigned yet. Contact your administrator.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classes.map((classItem) => (
                    <div
                      key={classItem.id}
                      onClick={() => setSelectedClass(classItem)}
                      className="cursor-pointer"
                      style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        border: '1px solid #e2e8f0',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2d3748', lineHeight: '1.4' }}>
                          {classItem.class_title}
                        </h3>
                        <span 
                          style={{ 
                            fontSize: '12px', 
                            fontWeight: '600', 
                            color: '#718096',
                            backgroundColor: '#f7fafc',
                            padding: '4px 8px',
                            borderRadius: '6px'
                          }}
                        >
                          {classItem.status}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm" style={{ color: '#718096' }}>
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {classItem.class_date}
                        </div>
                        <div className="flex items-center text-sm" style={{ color: '#718096' }}>
                          <ClockIcon className="h-4 w-4 mr-2" />
                          {classItem.start_time} - {classItem.end_time}
                        </div>
                        <div className="flex items-center text-sm" style={{ color: '#718096' }}>
                          <MapPinIcon className="h-4 w-4 mr-2" />
                          {classItem.location}
                        </div>
                        <div className="flex items-center text-sm" style={{ color: '#718096' }}>
                          <FolderIcon className="h-4 w-4 mr-2" />
                          {classItem.folder_name}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm" style={{ color: '#4a5568' }}>
                          <span style={{ fontWeight: '600' }}>{classItem.current_participants}</span>
                          <span style={{ color: '#718096' }}> / {classItem.max_participants} students</span>
                        </div>
                        <button
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
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
                style={{
                  background: 'transparent',
                  color: '#667eea',
                  border: '1px solid #667eea',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginBottom: '24px'
                }}
              >
                ← Back to My Classes
              </button>

              {/* Class Header */}
              <div className="mb-6">
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d3748', marginBottom: '8px' }}>
                  {selectedClass.class_title}
                </h2>
                <p style={{ color: '#718096' }}>
                  {selectedClass.current_participants} students • {selectedClass.class_date} • {selectedClass.start_time} - {selectedClass.end_time}
                </p>
              </div>

              {/* Class Tabs */}
              <div className="flex space-x-1 mb-6" style={{ backgroundColor: '#f7fafc', padding: '4px', borderRadius: '12px' }}>
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
                        background: classTab === tab.id ? 'white' : 'transparent',
                        color: classTab === tab.id ? '#667eea' : '#718096',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                        boxShadow: classTab === tab.id ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              {classTab === 'students' && (
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#2d3748', marginBottom: '16px' }}>
                    Student List
                  </h3>
                  
                  {loading ? (
                    <div className="text-center py-8">Loading students...</div>
                  ) : students.length === 0 ? (
                    <div className="text-center py-12" style={{ color: '#718096' }}>
                      <UserGroupIcon className="h-16 w-16 mx-auto mb-4" style={{ color: '#cbd5e0' }} />
                      <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No Students Enrolled</h4>
                      <p>No students are currently enrolled in this class.</p>
                    </div>
                  ) : (
                    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                      <table style={{ width: '100%' }}>
                        <thead style={{ backgroundColor: '#f8fafc' }}>
                          <tr>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>Student Name</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>Email</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>Phone</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>Discord ID</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>Enrolled</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((student, index) => (
                            <tr key={student.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '16px', color: '#2d3748', fontWeight: '500' }}>{student.student_name}</td>
                              <td style={{ padding: '16px', color: '#718096' }}>{student.email}</td>
                              <td style={{ padding: '16px', color: '#718096' }}>{student.phone_number || 'N/A'}</td>
                              <td style={{ padding: '16px', color: '#718096' }}>{student.discord_id || 'N/A'}</td>
                              <td style={{ padding: '16px', color: '#718096', fontSize: '14px' }}>
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
                  <div className="flex items-center justify-between mb-6">
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#2d3748' }}>
                      Attendance Tracking
                    </h3>
                    <button
                      onClick={() => setShowNewFolderForm(true)}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <PlusIcon className="h-4 w-4" />
                      New Attendance
                    </button>
                  </div>

                  {showNewFolderForm && (
                    <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#2d3748', marginBottom: '12px' }}>
                        Create New Attendance Folder
                      </h4>
                      <div className="flex items-center gap-4">
                        <input
                          type="date"
                          value={newFolderDate}
                          onChange={(e) => setNewFolderDate(e.target.value)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db',
                            fontSize: '14px'
                          }}
                        />
                        <button
                          onClick={createAttendanceFolder}
                          disabled={loading}
                          style={{
                            background: '#10b981',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Create
                        </button>
                        <button
                          onClick={() => setShowNewFolderForm(false)}
                          style={{
                            background: '#6b7280',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Attendance Folders */}
                  {loading ? (
                    <div className="text-center py-8">Loading attendance data...</div>
                  ) : attendanceFolders.length === 0 ? (
                    <div className="text-center py-12" style={{ color: '#718096' }}>
                      <ClipboardDocumentListIcon className="h-16 w-16 mx-auto mb-4" style={{ color: '#cbd5e0' }} />
                      <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No Attendance Records</h4>
                      <p>Create your first attendance folder to start tracking.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {attendanceFolders.map((folder) => (
                        <div
                          key={folder.date}
                          onClick={() => setSelectedAttendanceDate(folder.date)}
                          className="cursor-pointer"
                          style={{
                            background: selectedAttendanceDate === folder.date ? '#e0e7ff' : 'white',
                            borderRadius: '12px',
                            padding: '20px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            border: selectedAttendanceDate === folder.date ? '2px solid #667eea' : '1px solid #e2e8f0',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#2d3748', marginBottom: '8px' }}>
                            {new Date(folder.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="flex items-center justify-between">
                            <span style={{ color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
                              Present: {folder.present_count}
                            </span>
                            <span style={{ color: '#ef4444', fontSize: '14px', fontWeight: '600' }}>
                              Absent: {folder.absent_count}
                            </span>
                          </div>
                          <div style={{ color: '#718096', fontSize: '12px', marginTop: '4px' }}>
                            Total: {folder.total_students} students
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected Date Attendance */}
                  {selectedAttendanceDate && (
                    <div>
                      <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#2d3748', marginBottom: '16px' }}>
                        Attendance for {new Date(selectedAttendanceDate).toLocaleDateString()}
                      </h4>
                      
                      {attendanceRecords.length === 0 ? (
                        <div className="text-center py-8" style={{ color: '#718096' }}>
                          No attendance records for this date.
                        </div>
                      ) : (
                        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                          <table style={{ width: '100%' }}>
                            <thead style={{ backgroundColor: '#f8fafc' }}>
                              <tr>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>Student</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>Status</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>Type</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>Reason</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {attendanceRecords.map((record) => (
                                <tr key={record.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                                  <td style={{ padding: '16px', color: '#2d3748', fontWeight: '500' }}>{record.student_name}</td>
                                  <td style={{ padding: '16px', textAlign: 'center' }}>
                                    <span
                                      style={{
                                        background: record.status === 'present' ? '#d1fae5' : '#fee2e2',
                                        color: record.status === 'present' ? '#065f46' : '#991b1b',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                      }}
                                    >
                                      {record.status === 'present' ? 'Present' : 'Absent'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '16px', color: '#718096' }}>
                                    {record.status === 'absent' ? record.absence_type || 'N/A' : '-'}
                                  </td>
                                  <td style={{ padding: '16px', color: '#718096' }}>
                                    {record.reason || '-'}
                                  </td>
                                  <td style={{ padding: '16px', textAlign: 'center' }}>
                                    <button
                                      onClick={() => toggleAttendanceStatus(record.id, record.status)}
                                      style={{
                                        background: record.status === 'present' ? '#ef4444' : '#10b981',
                                        color: 'white',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        margin: '0 auto'
                                      }}
                                    >
                                      {record.status === 'present' ? (
                                        <>
                                          <XMarkIcon className="h-3 w-3" />
                                          Mark Absent
                                        </>
                                      ) : (
                                        <>
                                          <CheckIcon className="h-3 w-3" />
                                          Mark Present
                                        </>
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {classTab === 'kpi' && (
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#2d3748', marginBottom: '16px' }}>
                    Student KPI & Performance
                  </h3>
                  
                  {loading ? (
                    <div className="text-center py-8">Loading KPI data...</div>
                  ) : studentKPIs.length === 0 ? (
                    <div className="text-center py-12" style={{ color: '#718096' }}>
                      <ChartBarIcon className="h-16 w-16 mx-auto mb-4" style={{ color: '#cbd5e0' }} />
                      <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No KPI Data</h4>
                      <p>Start tracking attendance to generate student KPIs.</p>
                    </div>
                  ) : (
                    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                      <table style={{ width: '100%' }}>
                        <thead style={{ backgroundColor: '#f8fafc' }}>
                          <tr>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>Student Name</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>Attendance Rate</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>Total Classes</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>Attended</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>Excused</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>Unexcused</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>Trend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentKPIs.map((kpi) => (
                            <tr key={kpi.student_id} style={{ borderTop: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '16px', color: '#2d3748', fontWeight: '500' }}>{kpi.student_name}</td>
                              <td style={{ padding: '16px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                  <div
                                    style={{
                                      width: '60px',
                                      height: '6px',
                                      backgroundColor: '#e2e8f0',
                                      borderRadius: '3px',
                                      overflow: 'hidden'
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: `${kpi.attendance_rate}%`,
                                        height: '100%',
                                        backgroundColor: kpi.attendance_rate >= 80 ? '#10b981' : kpi.attendance_rate >= 60 ? '#f59e0b' : '#ef4444',
                                        borderRadius: '3px'
                                      }}
                                    />
                                  </div>
                                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748' }}>
                                    {kpi.attendance_rate}%
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: '16px', textAlign: 'center', color: '#718096' }}>{kpi.total_classes}</td>
                              <td style={{ padding: '16px', textAlign: 'center', color: '#10b981', fontWeight: '600' }}>{kpi.attended_classes}</td>
                              <td style={{ padding: '16px', textAlign: 'center', color: '#f59e0b', fontWeight: '600' }}>{kpi.absent_excused}</td>
                              <td style={{ padding: '16px', textAlign: 'center', color: '#ef4444', fontWeight: '600' }}>{kpi.absent_unexcused}</td>
                              <td style={{ padding: '16px', textAlign: 'center' }}>
                                <span
                                  style={{
                                    background: kpi.recent_trend === 'improving' ? '#d1fae5' : kpi.recent_trend === 'declining' ? '#fee2e2' : '#f3f4f6',
                                    color: kpi.recent_trend === 'improving' ? '#065f46' : kpi.recent_trend === 'declining' ? '#991b1b' : '#374151',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                  }}
                                >
                                  {kpi.recent_trend}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}