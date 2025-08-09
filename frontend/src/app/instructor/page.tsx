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
      
      // Prefer instructor_id match; fallback to instructor_name
      const query = supabase
        .from('classes')
        .select(`
          *,
          classes_folders(name)
        `);

      const { data, error } = await query.or(`instructor_id.eq.${user?.id},instructor_name.eq.${user?.name || ''}`);

      if (error) {
        console.error('Error loading instructor classes:', error);
        setMessage('Error loading classes');
        return;
      }

      const formattedClasses = data?.map(classItem => ({
        ...classItem,
        folder_name: classItem.classes_folders?.name || 'No Folder'
      })) || [];

      setClasses(formattedClasses);
    } catch (error) {
      console.error('Error:', error);
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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar projects={[]} onCreateProject={() => {}} />
      
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Instructor Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.name}</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              {message}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('classes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'classes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                My Classes
              </button>
              {selectedClass && (
                <>
                  <button
                    onClick={() => setActiveTab('students')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'students'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Students ({selectedClass.class_title})
                  </button>
                  <button
                    onClick={() => setActiveTab('absences')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'absences'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Attendance
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'classes' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Your Assigned Classes
                </h3>
                
                {loading ? (
                  <div className="text-center py-4">Loading classes...</div>
                ) : classes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No classes assigned to you yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {classes.map((classItem) => (
                      <div
                        key={classItem.id}
                        onClick={() => handleClassSelect(classItem)}
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg text-gray-900">
                              {classItem.class_title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {classItem.class_type} • {classItem.target_audience}
                            </p>
                            <p className="text-sm text-gray-500 mt-2 flex items-center flex-wrap gap-3">
                              <span className="inline-flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4 text-gray-400" />
                                {new Date(classItem.class_date).toLocaleDateString()}
                              </span>
                              <span className="text-gray-300">•</span>
                              <span className="inline-flex items-center gap-1">
                                <ClockIcon className="h-4 w-4 text-gray-400" />
                                {classItem.start_time} - {classItem.end_time}
                              </span>
                              <span className="text-gray-300">•</span>
                              <span className="inline-flex items-center gap-1">
                                <MapPinIcon className="h-4 w-4 text-gray-400" />
                                {classItem.location}
                              </span>
                            </p>
                            <p className="text-sm text-gray-500 mt-1 inline-flex items-center gap-1">
                              <FolderIcon className="h-4 w-4 text-gray-400" />
                              {classItem.folder_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              classItem.status === 'completed' ? 'bg-green-100 text-green-800' :
                              classItem.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              classItem.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {classItem.status}
                            </span>
                            <p className="text-sm text-gray-500 mt-2">
                              {classItem.current_participants}/{classItem.max_participants} students
                            </p>
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
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Students in {selectedClass.class_title}
                  </h3>
                  <button
                    onClick={() => setActiveTab('classes')}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    ← Back to Classes
                  </button>
                </div>
                
                {loading ? (
                  <div className="text-center py-4">Loading students...</div>
                ) : students.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No students enrolled in this class yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Discord
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {students.map((student) => (
                          <tr key={student.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {student.student_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Enrolled: {new Date(student.enrolled_at).toLocaleDateString()}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{student.email}</div>
                              {student.phone_number && (
                                <div className="text-sm text-gray-500">{student.phone_number}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {student.discord_id || 'N/A'}
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
                  <div className="text-center py-4">Loading attendance records...</div>
                ) : absences.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No absence records for this class yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reason
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {absences.map((absence) => (
                          <tr key={absence.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {absence.student_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(absence.absence_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                absence.absence_type === 'excused' ? 'bg-green-100 text-green-800' :
                                absence.absence_type === 'sick' ? 'bg-blue-100 text-blue-800' :
                                absence.absence_type === 'family' ? 'bg-purple-100 text-purple-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {absence.absence_type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {absence.reason}
                              {absence.notes && (
                                <div className="text-xs text-gray-500 mt-1">{absence.notes}</div>
                              )}
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
  );
}
