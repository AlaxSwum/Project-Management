'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { CalendarIcon, ClockIcon, MapPinIcon, FolderIcon } from '@heroicons/react/24/outline';

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

interface AbsenceRecord {
  id: number;
  class_id: number;
  student_id: number;
  student_name: string;
  absence_date: string;
  absence_type: 'excused' | 'unexcused' | 'sick' | 'family';
  reason: string;
  notes?: string;
  recorded_by: number;
  recorded_at: string;
}

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('classes');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // New absence form state
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [newAbsence, setNewAbsence] = useState({
    student_id: '',
    absence_date: new Date().toISOString().split('T')[0],
    absence_type: 'excused' as 'excused' | 'unexcused' | 'sick' | 'family',
    reason: '',
    notes: ''
  });

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

  const loadInstructorClasses = async () => {
    try {
      setLoading(true);
      console.log('📚 Loading classes for instructor:', user?.id, user?.name);
      
      // Use original working method - query classes table directly
      console.log('🔍 User data for query:', { id: user?.id, name: user?.name, email: user?.email });
      
      // Query by instructor_name since instructor_id column doesn't exist
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          *,
          classes_folders(name)
        `)
        .eq('instructor_name', user?.name || '');

      if (classesError) {
        console.error('❌ Error loading instructor classes:', classesError);
        console.error('❌ Error details:', {
          message: classesError.message,
          details: classesError.details,
          hint: classesError.hint,
          code: classesError.code
        });
        setMessage(`Error loading classes: ${classesError.message}`);
        return;
      }

      console.log('🔍 Raw classes data:', classesData);

      // Filter out planning status and general training classes
      const filteredClasses = classesData
        ?.filter(classItem => {
          const shouldInclude = classItem.status !== 'planning' && 
            !classItem.class_title?.toLowerCase().includes('general training all staff');
          console.log(`🔍 Class "${classItem.class_title}" - Status: ${classItem.status}, Include: ${shouldInclude}`);
          return shouldInclude;
        })
        ?.map(classItem => ({
          ...classItem,
          folder_name: classItem.classes_folders?.name || 'No Folder'
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

  const loadClassStudents = async (classId: number) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('classes_participants')
        .select('id, student_name, email, phone_number, discord_id, enrolled_at, notes')
        .eq('class_id', classId);

      if (error) {
        console.error('Error loading students:', error);
        setMessage('Error loading students');
        return;
      }

      setStudents(data || []);
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error loading students');
    } finally {
      setLoading(false);
    }
  };

  const loadClassAbsences = async (classId: number) => {
    try {
      setLoading(true);
      
      // First check if absence table exists, if not we'll show a message
      const { data, error } = await supabase
        .from('class_absences')
        .select('*')
        .eq('class_id', classId);

      if (error) {
        console.error('Error loading absences:', error);
        // Table might not exist yet
        setAbsences([]);
        return;
      }

      setAbsences(data || []);
    } catch (error) {
      console.error('Error:', error);
      setAbsences([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClassSelect = (classItem: ClassItem) => {
    setSelectedClass(classItem);
    setActiveTab('students');
    loadClassStudents(classItem.id);
    loadClassAbsences(classItem.id);
  };

  const handleRecordAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClass || !newAbsence.student_id) {
      setMessage('Please select a student');
      return;
    }

    try {
      setLoading(true);
      
      // Create absence table if it doesn't exist
      await supabase.rpc('create_absence_table_if_not_exists');
      
      const { data, error } = await supabase
        .from('class_absences')
        .insert([{
          class_id: selectedClass.id,
          student_id: parseInt(newAbsence.student_id),
          student_name: students.find(s => s.id === parseInt(newAbsence.student_id))?.student_name || '',
          absence_date: newAbsence.absence_date,
          absence_type: newAbsence.absence_type,
          reason: newAbsence.reason,
          notes: newAbsence.notes,
          recorded_by: user?.id
        }]);

      if (error) {
        console.error('Error recording absence:', error);
        setMessage('Error recording absence');
        return;
      }

      setMessage('Absence recorded successfully');
      setShowAbsenceForm(false);
      setNewAbsence({
        student_id: '',
        absence_date: new Date().toISOString().split('T')[0],
        absence_type: 'excused',
        reason: '',
        notes: ''
      });
      
      // Reload absences
      loadClassAbsences(selectedClass.id);
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error recording absence');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'instructor') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">This page is only accessible to instructors.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .instructor-container {
          min-height: 100vh;
          display: flex;
          background: linear-gradient(135deg, #F5F5ED 0%, #FAFAF2 100%);
          position: relative;
          overflow: hidden;
        }
        .main-content {
          flex: 1;
          margin-left: 280px;
          background: transparent;
          position: relative;
          z-index: 1;
        }
        .header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
          padding: 2.25rem 2rem;
          position: sticky;
          top: 0;
          z-index: 20;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
        }
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1400px;
          margin: 0 auto;
        }
        .title {
          font-size: 2.25rem;
          font-weight: 900;
          background: linear-gradient(135deg, #1F2937 0%, #4B5563 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .section-container {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }
      `}</style>
      <div className="instructor-container">
        <Sidebar projects={[]} onCreateProject={() => {}} />
        <div className="main-content">
          <div className="header">
            <div className="header-content">
              <h1 className="title">Instructor Dashboard</h1>
              <p style={{ color: '#6b7280', fontSize: '1rem' }}>Welcome back, {user.name}</p>
            </div>
          </div>
          <div className="section-container">

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              {message}
            </div>
          )}

      {/* Tab Navigation */}
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid #e5e7eb' }}>
        <nav style={{ display: 'flex', gap: '2rem' }}>
          <button
            onClick={() => setActiveTab('classes')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'classes' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'classes' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'classes' ? '600' : '400',
              cursor: 'pointer'
            }}
          >
            My Classes
          </button>
          {selectedClass && (
            <>
              <button
                onClick={() => setActiveTab('students')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'students' ? '2px solid #3b82f6' : '2px solid transparent',
                  color: activeTab === 'students' ? '#3b82f6' : '#6b7280',
                  fontWeight: activeTab === 'students' ? '600' : '400',
                  cursor: 'pointer'
                }}
              >
                Students ({selectedClass.class_title})
              </button>
              <button
                onClick={() => setActiveTab('absences')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'absences' ? '2px solid #3b82f6' : '2px solid transparent',
                  color: activeTab === 'absences' ? '#3b82f6' : '#6b7280',
                  fontWeight: activeTab === 'absences' ? '600' : '400',
                  cursor: 'pointer'
                }}
              >
                Attendance
              </button>
            </>
          )}
        </nav>
      </div>

          {/* Tab Content */}
          {activeTab === 'classes' && (
            <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', borderRadius: '8px' }}>
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#111827', marginBottom: '1rem' }}>
                  Your Assigned Classes
                </h3>
                
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '1rem' }}>Loading classes...</div>
                ) : classes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    <p>No classes assigned to you yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {classes.map((classItem) => (
                      <div
                        key={classItem.id}
                        onClick={() => handleClassSelect(classItem)}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '1.5rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          backgroundColor: 'white',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                          position: 'relative' as const,
                          overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontWeight: '600', fontSize: '1.125rem', color: '#111827', marginBottom: '0.25rem' }}>
                              {classItem.class_title}
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                              {classItem.class_type} • {classItem.target_audience}
                            </p>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <CalendarIcon style={{ height: '1rem', width: '1rem', color: '#9ca3af' }} />
                                {new Date(classItem.class_date).toLocaleDateString()}
                              </span>
                              <span style={{ color: '#d1d5db' }}>•</span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <ClockIcon style={{ height: '1rem', width: '1rem', color: '#9ca3af' }} />
                                {classItem.start_time} - {classItem.end_time}
                              </span>
                              <span style={{ color: '#d1d5db' }}>•</span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <MapPinIcon style={{ height: '1rem', width: '1rem', color: '#9ca3af' }} />
                                {classItem.location}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <FolderIcon style={{ height: '1rem', width: '1rem', color: '#9ca3af' }} />
                              {classItem.folder_name}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'flex-end',
                              gap: '0.5rem' 
                            }}>
                              <div style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: '#475569'
                              }}>
                                {classItem.current_participants || 0}/{classItem.max_participants} Students
                              </div>
                              {classItem.status !== 'active' && (
                                <span style={{
                                  fontSize: '0.75rem',
                                  color: '#64748b',
                                  textTransform: 'capitalize'
                                }}>
                                  {classItem.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'students' && selectedClass && (
            <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', borderRadius: '8px' }}>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#111827' }}>
                    Students in {selectedClass.class_title}
                  </h3>
                  <button
                    onClick={() => setActiveTab('classes')}
                    style={{ color: '#3b82f6', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    ← Back to Classes
                  </button>
                </div>
                
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Loading students...</div>
                ) : students.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                    <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No students enrolled yet</p>
                    <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Students will appear here when they enroll in this class.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ backgroundColor: '#f8fafc' }}>
                        <tr>
                          <th style={{
                            padding: '1rem 1.5rem',
                            textAlign: 'left',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#4b5563',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid #e5e7eb'
                          }}>
                            Student Information
                          </th>
                          <th style={{
                            padding: '1rem 1.5rem',
                            textAlign: 'left',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#4b5563',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid #e5e7eb'
                          }}>
                            Contact Details
                          </th>
                          <th style={{
                            padding: '1rem 1.5rem',
                            textAlign: 'left',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#4b5563',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid #e5e7eb'
                          }}>
                            Discord ID
                          </th>
                          <th style={{
                            padding: '1rem 1.5rem',
                            textAlign: 'left',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#4b5563',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid #e5e7eb'
                          }}>
                            Enrollment Date
                          </th>
                        </tr>
                      </thead>
                      <tbody style={{ backgroundColor: 'white' }}>
                        {students.map((student, index) => (
                          <tr key={student.id} style={{
                            backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                            borderBottom: '1px solid #f3f4f6'
                          }}>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{
                                  width: '2.5rem',
                                  height: '2.5rem',
                                  borderRadius: '50%',
                                  backgroundColor: '#3b82f6',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginRight: '0.75rem'
                                }}>
                                  <span style={{ color: 'white', fontWeight: '600', fontSize: '0.875rem' }}>
                                    {student.student_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                                    {student.student_name}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                    Student ID: {student.id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                              <div>
                                <div style={{ fontSize: '0.875rem', color: '#111827', marginBottom: '0.25rem' }}>
                                  {student.email}
                                </div>
                                {student.phone_number && (
                                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                    📞 {student.phone_number}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0.25rem 0.75rem',
                                backgroundColor: student.discord_id ? '#dbeafe' : '#f3f4f6',
                                color: student.discord_id ? '#1e40af' : '#6b7280',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: '500'
                              }}>
                                {student.discord_id ? `@${student.discord_id}` : 'Not provided'}
                              </div>
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                              <div style={{ fontSize: '0.875rem', color: '#111827' }}>
                                {new Date(student.enrolled_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                {new Date(student.enrolled_at).toLocaleDateString('en-US', { weekday: 'long' })}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'absences' && selectedClass && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Attendance - {selectedClass.class_title}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowAbsenceForm(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                    >
                      Record Absence
                    </button>
                    <button
                      onClick={() => setActiveTab('students')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      ← Back to Students
                    </button>
                  </div>
                </div>

                {/* Absence Form Modal */}
                {showAbsenceForm && (
                  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                      <div className="mt-3">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Record Student Absence</h3>
                        <form onSubmit={handleRecordAbsence}>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Student</label>
                            <select
                              value={newAbsence.student_id}
                              onChange={(e) => setNewAbsence({...newAbsence, student_id: e.target.value})}
                              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                              required
                            >
                              <option value="">Select a student</option>
                              {students.map((student) => (
                                <option key={student.id} value={student.id}>
                                  {student.student_name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Absence Date</label>
                            <input
                              type="date"
                              value={newAbsence.absence_date}
                              onChange={(e) => setNewAbsence({...newAbsence, absence_date: e.target.value})}
                              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                              required
                            />
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Absence Type</label>
                            <select
                              value={newAbsence.absence_type}
                              onChange={(e) => setNewAbsence({...newAbsence, absence_type: e.target.value as any})}
                              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                            >
                              <option value="excused">Excused</option>
                              <option value="unexcused">Unexcused</option>
                              <option value="sick">Sick</option>
                              <option value="family">Family Emergency</option>
                            </select>
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Reason</label>
                            <input
                              type="text"
                              value={newAbsence.reason}
                              onChange={(e) => setNewAbsence({...newAbsence, reason: e.target.value})}
                              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                              required
                            />
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                            <textarea
                              value={newAbsence.notes}
                              onChange={(e) => setNewAbsence({...newAbsence, notes: e.target.value})}
                              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                              rows={3}
                            />
                          </div>

                          <div className="flex justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => setShowAbsenceForm(false)}
                              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={loading}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                              {loading ? 'Recording...' : 'Record Absence'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Absences List */}
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Loading attendance records...</div>
                ) : absences.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                    <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No absence records yet</p>
                    <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Attendance records will appear here when absences are recorded.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ backgroundColor: '#f8fafc' }}>
                        <tr>
                          <th style={{
                            padding: '1rem 1.5rem',
                            textAlign: 'left',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#4b5563',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid #e5e7eb'
                          }}>
                            Student
                          </th>
                          <th style={{
                            padding: '1rem 1.5rem',
                            textAlign: 'left',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#4b5563',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid #e5e7eb'
                          }}>
                            Absence Date
                          </th>
                          <th style={{
                            padding: '1rem 1.5rem',
                            textAlign: 'left',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#4b5563',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid #e5e7eb'
                          }}>
                            Type
                          </th>
                          <th style={{
                            padding: '1rem 1.5rem',
                            textAlign: 'left',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#4b5563',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid #e5e7eb'
                          }}>
                            Details
                          </th>
                          <th style={{
                            padding: '1rem 1.5rem',
                            textAlign: 'left',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#4b5563',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid #e5e7eb'
                          }}>
                            Recorded
                          </th>
                        </tr>
                      </thead>
                      <tbody style={{ backgroundColor: 'white' }}>
                        {absences.map((absence, index) => (
                          <tr key={absence.id} style={{
                            backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                            borderBottom: '1px solid #f3f4f6'
                          }}>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{
                                  width: '2rem',
                                  height: '2rem',
                                  borderRadius: '50%',
                                  backgroundColor: '#ef4444',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginRight: '0.75rem'
                                }}>
                                  <span style={{ color: 'white', fontWeight: '600', fontSize: '0.75rem' }}>
                                    {absence.student_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>
                                    {absence.student_name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                              <div style={{ fontSize: '0.875rem', color: '#111827', marginBottom: '0.125rem' }}>
                                {new Date(absence.absence_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                {new Date(absence.absence_date).toLocaleDateString('en-US', { weekday: 'long' })}
                              </div>
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0.375rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                backgroundColor: 
                                  absence.absence_type === 'excused' ? '#dcfce7' :
                                  absence.absence_type === 'sick' ? '#dbeafe' :
                                  absence.absence_type === 'family' ? '#f3e8ff' : '#fee2e2',
                                color:
                                  absence.absence_type === 'excused' ? '#166534' :
                                  absence.absence_type === 'sick' ? '#1e40af' :
                                  absence.absence_type === 'family' ? '#7c3aed' : '#991b1b'
                              }}>
                                {absence.absence_type === 'excused' ? '✓ Excused' :
                                 absence.absence_type === 'sick' ? '🤒 Sick' :
                                 absence.absence_type === 'family' ? '👨‍👩‍👧‍👦 Family' : '❌ Unexcused'}
                              </span>
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                              <div style={{ fontSize: '0.875rem', color: '#111827', marginBottom: '0.25rem' }}>
                                {absence.reason}
                              </div>
                              {absence.notes && (
                                <div style={{ 
                                  fontSize: '0.75rem', 
                                  color: '#6b7280',
                                  fontStyle: 'italic',
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#f9fafb',
                                  borderRadius: '4px',
                                  borderLeft: '3px solid #e5e7eb'
                                }}>
                                  {absence.notes}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                {new Date(absence.recorded_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  );
}
