import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { 
  Search, 
  Building2,
  Users,
  Calendar,
  Download,
  FileText
} from 'lucide-react';
import Header from './Header';

export default function Reports() {
  const [centers, setCenters] = useState([]);
  const [batches, setBatches] = useState([]);
  const [reports, setReports] = useState([]);
  
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(false);

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
        setSelectedBatch(''); 
      } catch (error) {
        toast.error('Error fetching batches: ' + error.message);
      }
    };
    fetchBatches();
  }, [selectedCenter]);

  // Fetch Reports
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('attendance_report')
          .select('*')
          .order('attendance_date', { ascending: false })
          .order('center_name', { ascending: true })
          .order('batch_name', { ascending: true })
          .order('student_name', { ascending: true });

        if (selectedDate) {
          query = query.eq('attendance_date', selectedDate);
        }
        
        // In our view, we only have center_name and batch_name text, not IDs.
        // We will filter by the name string instead of the ID.
        if (selectedCenter) {
          const center = centers.find(c => c.id === selectedCenter);
          if (center) query = query.eq('center_name', center.name);
        }

        if (selectedBatch) {
          const batch = batches.find(b => b.id === selectedBatch);
          if (batch) query = query.eq('batch_name', batch.name);
        }

        const { data, error } = await query;

        if (error) throw error;
        setReports(data || []);
      } catch (error) {
        toast.error('Error fetching reports: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [selectedCenter, selectedBatch, selectedDate, centers, batches]);

  const handleExportCSV = () => {
    if (reports.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Center', 'Batch', 'Roll Number', 'Student Name', 'Date', 'Time', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredReports.map(r => [
        `"${r.center_name}"`,
        `"${r.batch_name}"`,
        `"${r.roll_number}"`,
        `"${r.student_name}"`,
        `"${r.attendance_date}"`,
        `"${r.attendance_time}"`,
        `"${r.status}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${selectedDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredReports = reports.filter(report => 
    report.student_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    report.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filters */}
        <div className="glass-card rounded-2xl p-8 mb-8 animate-fade-in-up w-full border border-white/40 dark:border-gray-700/50 shadow-2xl bg-gradient-to-br from-white/40 to-white/10 dark:from-gray-800/40 dark:to-gray-900/10" style={{animationDelay: '100ms'}}>
          <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
            <div className="w-full md:flex-1 transition-all duration-300">
              <label className="block text-lg font-bold text-gray-800 dark:text-gray-50 mb-3 tracking-wide">
                <Calendar className="inline-block w-5 h-5 mr-1.5 mb-1 text-violet-600 dark:text-indigo-500" />
                Filter by Date
              </label>
              <input
                type="date"
                className="block w-full rounded-xl border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-[#1E1E1E]/80 text-gray-800 dark:text-gray-50 py-4 px-5 focus:ring-2 focus:ring-violet-600 dark:focus:ring-indigo-500 focus:border-transparent text-lg transition-all shadow-sm hover:bg-white dark:hover:bg-gray-800 cursor-pointer backdrop-blur-md font-semibold"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            
            <div className="w-full md:flex-1 transition-all duration-300">
              <label className="block text-lg font-bold text-gray-800 dark:text-gray-50 mb-3 tracking-wide">
                <Building2 className="inline-block w-5 h-5 mr-1.5 mb-1 text-violet-600 dark:text-indigo-500" />
                Filter by Center
              </label>
              <select
                className="block w-full rounded-xl border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-[#1E1E1E]/80 text-gray-800 dark:text-gray-50 py-4 px-5 focus:ring-2 focus:ring-violet-600 dark:focus:ring-indigo-500 focus:border-transparent text-lg transition-all shadow-sm hover:bg-white dark:hover:bg-gray-800 cursor-pointer backdrop-blur-md font-semibold"
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
              >
                <option value="">All Centers</option>
                {centers.map(center => (
                  <option key={center.id} value={center.id}>{center.name}</option>
                ))}
              </select>
            </div>
            
            {selectedCenter && (
              <div className="animate-fade-in-up w-full md:flex-1 transition-all duration-300" style={{animationDelay: '50ms'}}>
                <label className="block text-lg font-bold text-gray-800 dark:text-gray-50 mb-3 tracking-wide">
                  <Users className="inline-block w-5 h-5 mr-1.5 mb-1 text-purple-500 dark:text-violet-500" />
                  Filter by Batch
                </label>
                <select
                  className="block w-full rounded-xl border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-[#1E1E1E]/80 text-gray-800 dark:text-gray-50 py-4 px-5 focus:ring-2 focus:ring-purple-500 dark:focus:ring-violet-500 focus:border-transparent text-lg transition-all shadow-sm hover:bg-white dark:hover:bg-gray-800 cursor-pointer backdrop-blur-md font-semibold"
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                >
                  <option value="">All Batches</option>
                  {batches.map(batch => (
                    <option key={batch.id} value={batch.id}>{batch.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="glass-card rounded-2xl overflow-hidden flex flex-col animate-fade-in-up" style={{animationDelay: '200ms'}}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50/50 dark:bg-[#1E1E1E]/30">
            <div className="relative flex-1 max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search by student name or roll no..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/50 dark:bg-[#2A2A2A]/50 text-gray-800 dark:text-gray-50 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-600 dark:focus:ring-indigo-500 focus:border-violet-600 dark:focus:border-indigo-500 sm:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button
              onClick={handleExportCSV}
              disabled={filteredReports.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export to CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-20 text-gray-500 dark:text-slate-300">
                <FileText className="mx-auto h-12 w-12 text-gray-500 mb-3" />
                <p>No attendance records found for these filters.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700/50">
                <thead className="bg-neutral-50/50 dark:bg-[#1E1E1E]/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Center</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
                  {filteredReports.map((report, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">
                        {report.attendance_date} <br/>
                        <span className="text-xs text-gray-500">{report.attendance_time}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-50">
                        {report.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">
                        {report.roll_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">
                        {report.center_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">
                        {report.batch_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${report.status === 'Present' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}
                          ${report.status === 'Absent' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:bg-red-900/30 dark:text-red-400' : ''}
                          ${report.status === 'Late' ? 'bg-yellow-100 dark:bg-amber-900/30 text-yellow-800 dark:bg-yellow-900/30 dark:text-amber-400' : ''}
                          ${report.status === 'Leave' ? 'bg-violet-100 dark:bg-violet-900/30 text-purple-800 dark:bg-purple-900/30 dark:text-violet-500' : ''}
                        `}>
                          {report.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
