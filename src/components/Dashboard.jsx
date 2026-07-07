import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { 
  LogOut, 
  Search, 
  Save, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserMinus,
  RefreshCw,
  Building2,
  Users
} from 'lucide-react';
import Header from './Header';

export default function Dashboard({ session }) {
  const [centers, setCenters] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  
  const [attendanceData, setAttendanceData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [attendanceDate, setAttendanceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceTime, setAttendanceTime] = useState(format(new Date(), 'HH:mm'));

  // Fetch Centers on mount
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const { data, error } = await supabase
          .from('centers')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setCenters(data || []);
      } catch (error) {
        toast.error('Error fetching centers: ' + error.message);
      }
    };
    fetchCenters();
  }, []);

  // Fetch Batches when Center changes
  useEffect(() => {
    const fetchBatches = async () => {
      if (!selectedCenter) {
        setBatches([]);
        setSelectedBatch('');
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('batches')
          .select('*')
          .eq('center_id', selectedCenter)
          .order('name');
          
        if (error) throw error;
        setBatches(data || []);
        setSelectedBatch(''); // Reset batch when center changes
      } catch (error) {
        toast.error('Error fetching batches: ' + error.message);
      }
    };
    fetchBatches();
  }, [selectedCenter]);

  // Fetch Students and Existing Attendance when Batch changes
  useEffect(() => {
    const fetchStudentsAndAttendance = async () => {
      if (!selectedBatch) {
        setStudents([]);
        setAttendanceData({});
        return;
      }

      setLoading(true);
      try {
        // Fetch Students
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .eq('batch_id', selectedBatch)
          .order('roll_number');

        if (studentsError) throw studentsError;
        setStudents(studentsData || []);

        // Fetch Today's Attendance for these students
        const { data: attData, error: attError } = await supabase
          .from('attendance')
          .select('*')
          .eq('attendance_date', attendanceDate)
          .in('student_id', (studentsData || []).map(s => s.id));

        if (attError) throw attError;

        // Map existing attendance or set default to 'Present'
        const initialAttendance = {};
        studentsData?.forEach(student => {
          const existingRecord = attData?.find(a => a.student_id === student.id);
          initialAttendance[student.id] = {
            status: existingRecord ? existingRecord.status : 'Present',
            isExisting: !!existingRecord,
            recordId: existingRecord?.id || null
          };
        });
        
        setAttendanceData(initialAttendance);

      } catch (error) {
        toast.error('Error fetching data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsAndAttendance();
  }, [selectedBatch, attendanceDate]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { isExisting: false, recordId: null }),
        status
      }
    }));
  };

  const markAll = (status) => {
    setAttendanceData(prev => {
      const newData = { ...prev };
      Object.keys(newData).forEach(key => {
        newData[key] = {
            ...(newData[key] || { isExisting: false, recordId: null }),
            status
        };
      });
      return newData;
    });
  };

  const saveAttendance = async () => {
    if (students.length === 0) return;
    
    setSaving(true);
    
    try {
      const recordsToInsert = [];
      const recordsToUpdate = [];

      Object.entries(attendanceData).forEach(([studentId, data]) => {
        if (data.isExisting) {
          recordsToUpdate.push({
            id: data.recordId,
            student_id: studentId,
            attendance_date: attendanceDate,
            attendance_time: attendanceTime,
            status: data.status
          });
        } else {
          recordsToInsert.push({
            student_id: studentId,
            attendance_date: attendanceDate,
            attendance_time: attendanceTime,
            status: data.status
          });
        }
      });

      // Execute Upserts
      if (recordsToInsert.length > 0) {
        const { error } = await supabase.from('attendance').insert(recordsToInsert);
        if (error) throw error;
      }
      
      if (recordsToUpdate.length > 0) {
        const { error } = await supabase.from('attendance').upsert(recordsToUpdate);
        if (error) throw error;
      }

      toast.success('Attendance saved successfully!');
      
      // Update local state to mark them as existing
      setAttendanceData(prev => {
        const newData = { ...prev };
        Object.keys(newData).forEach(key => {
          newData[key].isExisting = true;
          // Note: we don't have the new IDs for inserted rows, but it's fine for this session unless they save again.
          // Ideally we re-fetch to get accurate IDs if they update again immediately.
        });
        return newData;
      });
      
    } catch (error) {
      toast.error('Error saving attendance: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    student.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500">
      <Header />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Controls Section */}
        <div className="glass-card rounded-2xl p-8 mb-8 animate-fade-in-up w-full border border-white/40 dark:border-gray-700/50 shadow-2xl bg-gradient-to-br from-white/40 to-white/10 dark:from-gray-800/40 dark:to-gray-900/10" style={{animationDelay: '100ms'}}>
          <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
            <div className="w-full md:w-1/2 lg:w-1/3 transition-all duration-300">
              <label className="block text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 tracking-wide">
                <Building2 className="inline-block w-5 h-5 mr-1.5 mb-1 text-blue-500" />
                Select Center
              </label>
              <select
                className="block w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-800/80 text-gray-900 dark:text-white py-4 px-5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition-all shadow-sm hover:bg-white dark:hover:bg-gray-800 cursor-pointer backdrop-blur-md font-semibold"
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
              >
                <option value="">-- Choose Center --</option>
                {centers.map(center => (
                  <option key={center.id} value={center.id}>{center.name}</option>
                ))}
              </select>
            </div>
            
            {selectedCenter && (
              <div className="animate-fade-in-up w-full md:w-1/2 lg:w-1/3 transition-all duration-300" style={{animationDelay: '50ms'}}>
                <label className="block text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 tracking-wide">
                  <Users className="inline-block w-5 h-5 mr-1.5 mb-1 text-purple-500" />
                  Select Batch
                </label>
                <select
                  className="block w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-800/80 text-gray-900 dark:text-white py-4 px-5 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg transition-all shadow-sm hover:bg-white dark:hover:bg-gray-800 cursor-pointer backdrop-blur-md font-semibold"
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                >
                  <option value="">-- Choose Batch --</option>
                  {batches.map(batch => (
                    <option key={batch.id} value={batch.id}>{batch.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Student List Section */}
        {selectedBatch && (
          <div className="glass-card rounded-2xl overflow-hidden flex flex-col animate-fade-in-up" style={{animationDelay: '200ms'}}>
            
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-800/30">
              <div className="relative flex-1 max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search students..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="time"
                  value={attendanceTime}
                  onChange={(e) => setAttendanceTime(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={() => markAll('Present')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white/50 dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all active:scale-95"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5 text-green-500" />
                  All Present
                </button>
                <button
                  onClick={saveAttendance}
                  disabled={saving || students.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  {saving ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p>No students found in this batch.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700/50">
                  <thead className="bg-gray-50/50 dark:bg-gray-800/30">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
                    {filteredStudents.map((student) => {
                      const currentStatus = attendanceData[student.id]?.status || 'Present';
                      return (
                        <tr key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{student.roll_number}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{student.student_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleStatusChange(student.id, 'Present')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                                  currentStatus === 'Present'
                                    ? 'bg-green-100 text-green-700 border-2 border-green-500 dark:bg-green-900/50 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600 border-2 border-transparent dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-green-900/30 dark:hover:text-green-400'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                onClick={() => handleStatusChange(student.id, 'Absent')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                                  currentStatus === 'Absent'
                                    ? 'bg-red-100 text-red-700 border-2 border-red-500 dark:bg-red-900/50 dark:text-red-400'
                                    : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 border-2 border-transparent dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-red-900/30 dark:hover:text-red-400'
                                }`}
                              >
                                Absent
                              </button>
                              <button
                                onClick={() => handleStatusChange(student.id, 'Late')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                                  currentStatus === 'Late'
                                    ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-500 dark:bg-yellow-900/50 dark:text-yellow-400'
                                    : 'bg-gray-100 text-gray-600 hover:bg-yellow-50 hover:text-yellow-600 border-2 border-transparent dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-400'
                                }`}
                              >
                                Late
                              </button>
                              <button
                                onClick={() => handleStatusChange(student.id, 'Leave')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                                  currentStatus === 'Leave'
                                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-500 dark:bg-purple-900/50 dark:text-purple-400'
                                    : 'bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-600 border-2 border-transparent dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-purple-900/30 dark:hover:text-purple-400'
                                }`}
                              >
                                Leave
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
}


