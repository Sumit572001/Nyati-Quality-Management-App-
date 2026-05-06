import { useState, useEffect, useRef, useMemo } from 'react'
import axios from 'axios'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronDown, faChevronUp, faCheckCircle, faArrowLeft, faCheckSquare, faSquare,
  faBars, faTimes, faSignOutAlt, faUserCircle, faHistory, faHome, faInfoCircle, faUserTie, faCalendarAlt,
  faCamera, faUpload, faTrash, faExclamationTriangle, faPlus, faChartLine, faListAlt, faTrophy, faCheck,
  faClock, faImage
} from '@fortawesome/free-solid-svg-icons'

import BASE_URL from '../config'

// --- HELPERS ---
const sortFloors = (floors) => {
  const getPriority = (name) => {
    if (!name) return 999;
    const parts = name.split('-');
    const lastPart = parts[parts.length - 1].trim().toLowerCase();

    if (lastPart.includes('basement')) return -20;
    if (lastPart.includes('lg') || lastPart.includes('lower ground')) return -10;
    if (lastPart.includes('gf') || lastPart.includes('ground')) return 0;
    if (lastPart.includes('ug') || lastPart.includes('upper ground')) return 0.5;
    if (lastPart.includes('podium')) return 0.6;
    if (lastPart.includes('stilt')) return 0.7;

    const match = lastPart.match(/\d+/);
    if (match) return parseInt(match[0]);
    return 999;
  };
  return [...floors].sort((a, b) => getPriority(a) - getPriority(b));
};

// --- COMPONENTS ---
function SearchableSelect({ options, value, onChange, placeholder, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const lowerSearch = searchTerm.toLowerCase();
    return options.filter(opt => opt.toLowerCase().includes(lowerSearch));
  }, [options, searchTerm]);

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">{label}</label>
      <div
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) setSearchTerm(''); }}
        className={`w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 outline-none text-sm transition-all duration-200 flex justify-between items-center cursor-pointer shadow-sm ${isOpen ? 'border-[#004080] ring-2 ring-blue-50' : 'hover:border-gray-300'}`}
      >
        <span className={`truncate ${value ? 'text-gray-900 font-bold' : 'text-gray-400 font-medium'}`}>
          {value || placeholder}
        </span>
        <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} className={`text-xs transition-transform duration-200 ${isOpen ? 'text-[#004080]' : 'text-gray-400'}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in slide-in-from-top-1 duration-150">
          <div className="p-2 border-b border-gray-100 bg-gray-50/50">
            <input
              type="text"
              autoFocus
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-[#004080] focus:ring-1 focus:ring-blue-50 transition-all font-medium"
              placeholder={`Search ${label}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, i) => (
                <div
                  key={i}
                  onClick={() => { onChange(opt); setIsOpen(false); setSearchTerm(''); }}
                  className={`px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer border-l-4 ${opt === value ? 'bg-blue-50 text-[#004080] border-[#004080]' : 'text-gray-600 border-transparent hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-[10px] text-gray-400 text-center uppercase font-black tracking-widest bg-gray-50/20">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SEIndex() {
  const user = JSON.parse(localStorage.getItem('nyati_user') || '{}')
  const currentUser = user.fullName || 'SE User'
  const role = user.role === 'SE' ? 'Site Engineer' : (user.role || 'Site Engineer')
  const project = user.siteName || 'Nyati Project'

  const [categories, setCategories] = useState([])
  const [selectedCats, setSelectedCats] = useState([])
  const [showQCDropdown, setShowQCDropdown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [reworkReports, setReworkReports] = useState([])
  const [pendingReports, setPendingReports] = useState([])
  const [historyReports, setHistoryReports] = useState([])
  const [reportData, setReportData] = useState([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
  const [reportView, setReportView] = useState('filter')
  const [downloadedReports, setDownloadedReports] = useState([])
  const [selectedRework, setSelectedRework] = useState(null);
  const [reworkRemark, setReworkRemark] = useState('');
  const [reworkPhotos, setReworkPhotos] = useState([]);
  const [itemSelection, setItemSelection] = useState({}); // Tracking individual item selection
  const [todayReports, setTodayReports] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    todayTasks: 0,
    reworkCount: 0,
    compliance: 0,
    recentActivity: []
  });
  const [passedQuestions, setPassedQuestions] = useState([]); // Questions already passed for this unit

  const [buildingOptions, setBuildingOptions] = useState([])
  const [floorOptions, setFloorOptions] = useState([])
  const [unitTypeOptions, setUnitTypeOptions] = useState([])

  const [spotData, setSpotData] = useState({
    buildingArea: '',
    floorLevel: '',
    unitType: '',
    locationUnit: ''
  })

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchInitialData(), fetchDashboardStats(), checkPendingReworks(true)]);
      setLoading(false);
    };
    init();
    const interval = setInterval(() => {
      checkPendingReworks(false);
      fetchDashboardStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // Use the reliable 'my-reports' endpoint
      const resAll = await axios.get(`${BASE_URL}/api/my-reports?user=${encodeURIComponent(currentUser)}`);
      const allReports = Array.isArray(resAll.data) ? resAll.data : [];

      // Filter for today's tasks
      const d = new Date();
      const todayString = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      const todaySubmissions = allReports.filter(r => r.date === todayString);
      setTodayReports(todaySubmissions);

      // Filter for Pending reports (QE hasn't acted yet)
      const pending = allReports.filter(r => r.status && (r.status.toLowerCase() === 'pending' || r.status === 'Rework Submitted'));
      setPendingReports(pending);

      // Fetch Reworks
      const resRework = await axios.get(`${BASE_URL}/api/rework-reports?user=${encodeURIComponent(currentUser)}`);
      const reworks = Array.isArray(resRework.data) ? resRework.data : [];

      // Calculate Compliance from HISTORY (approved reports)
      const resHist = await axios.get(`${BASE_URL}/api/history-reports?user=${encodeURIComponent(currentUser)}`);
      const history = Array.isArray(resHist.data) ? resHist.data : [];

      const totalItems = history.reduce((acc, r) => acc + (r.items?.length || 0), 0);
      const passedItems = history.reduce((acc, r) => acc + (r.items?.filter(i => i.qeDecision === 'pass').length || 0), 0);
      const compliance = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0;

      setDashboardStats({
        todayTasks: todaySubmissions.length,
        reworkCount: reworks.length,
        compliance: compliance,
        recentActivity: allReports.slice(0, 5)
      });
    } catch (err) {
      console.error("Dashboard stats error", err);
    }
  };

  const checkPendingReworks = async (isInitial = false) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/rework-reports?user=${encodeURIComponent(currentUser)}`);
      setReworkReports(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Polling error", err);
    }
  };

  const fetchInitialData = async () => {
    try {
      const [clRes, bldRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/checklist-items`),
        axios.get(`${BASE_URL}/api/buildings`)
      ]);
      const grouped = {}
      clRes.data.forEach(item => {
        if (!grouped[item.category]) grouped[item.category] = []
        grouped[item.category].push(item)
      })
      setCategories(Object.entries(grouped).map(([name, items]) => ({ name, items })))
      setBuildingOptions([...bldRes.data.map(b => b.name)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })))
    } catch (err) {
      console.error("Initial fetch error", err);
    }
  }

  const handleSpotInputChange = async (e) => {
    const { name, value } = e.target;
    const updated = { ...spotData, [name]: value };
    if (name === 'buildingArea') {
      updated.floorLevel = '';
      updated.unitType = '';
      const res = await axios.get(`${BASE_URL}/api/floors?building=${encodeURIComponent(value)}`);
      setFloorOptions(sortFloors(res.data.map(f => f.name)));
    } else if (name === 'floorLevel') {
      updated.unitType = '';
      const res = await axios.get(`${BASE_URL}/api/units?building=${encodeURIComponent(spotData.buildingArea)}&floor=${encodeURIComponent(value)}`);
      setUnitTypeOptions(res.data.map(u => u.name));
    }
    setSpotData(updated);
  };

  const toggleCategory = (cat) => {
    setSelectedCats(prev => prev.find(c => c.name === cat.name) ? prev.filter(c => c.name !== cat.name) : [...prev, cat]);
  }

  const handleInitialSubmit = async () => {
    if (!spotData.buildingArea || !spotData.floorLevel || !spotData.unitType) return alert("Pehle building info bhariye!");
    if (selectedCats.length === 0) return alert("Kam se kam ek category chuniye!");

    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/passed-checkpoints`, {
        params: {
          block: spotData.buildingArea,
          floor: spotData.floorLevel,
          unitType: spotData.unitType,
          location: spotData.locationUnit,
          user: currentUser
        }
      });
      setPassedQuestions(res.data.passedQuestions || []);
      setView('checklist');
    } catch (err) {
      console.error("Error fetching passed checkpoints", err);
      setPassedQuestions([]);
      setView('checklist');
    } finally {
      setLoading(false);
    }
  }

  const submitFinalReport = async () => {
    const reportData = {
      user: currentUser,
      submittedBy: currentUser,
      block: spotData.buildingArea,
      floor: spotData.floorLevel,
      unitType: spotData.unitType,
      location: spotData.locationUnit,
      date: new Date().toLocaleDateString('en-GB'),
      submittedAt: new Date().toLocaleString('en-GB', { hour12: true }),
      status: 'In-Review',
      projectName: project,
      items: []
    }
    selectedCats.forEach(cat => {
      cat.items.forEach(item => {
        if (itemSelection[item._id]) {
          reportData.items.push({
            category: cat.name,
            question: item.questionText,
            status: 'Completed',
            submittedAt: reportData.submittedAt
          });
        }
      })
    })
    if (reportData.items.length === 0) return alert("Koi bhi item select nahi kiya!");
    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/api/submit-report`, reportData)
      if (res.data.success) {
        alert('Checklist Sent to QE!');
        setView('dashboard');
        setSelectedCats([]);
        setItemSelection({});
        setSpotData({ buildingArea: '', floorLevel: '', unitType: '', locationUnit: '' });
        fetchDashboardStats();
      }
    } catch (err) {
      alert('Submission Failed!');
    } finally {
      setLoading(false);
    }
  }

  const fetchReworkReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/rework-reports?user=${encodeURIComponent(currentUser)}`);
      setReworkReports(Array.isArray(res.data) ? res.data : []);
      setView('rework');
      setIsSidebarOpen(false);
    } catch (err) {
      alert("Rework list fail!");
    } finally {
      setLoading(false);
    }
  }

  const fetchPendingReports = async () => {
    try {
      setLoading(true);
      // Using the already working 'my-reports' endpoint to avoid potential 404 errors if server hasn't restarted
      const res = await axios.get(`${BASE_URL}/api/my-reports?user=${encodeURIComponent(currentUser)}`);
      const allReports = Array.isArray(res.data) ? res.data : [];
      const pending = allReports.filter(r => r.status && r.status.toLowerCase() === 'pending');
      setPendingReports(pending);
      setView('pending-approval');
      setIsSidebarOpen(false);
    } catch (err) {
      console.error("Pending list error:", err);
      alert("Pending list fail!");
    } finally {
      setLoading(false);
    }
  }

  const fetchHistoryReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/history-reports?user=${encodeURIComponent(currentUser)}`);
      setHistoryReports(Array.isArray(res.data) ? res.data : []);
      setView('history');
      setIsSidebarOpen(false);
    } catch (err) {
      alert("History fail!");
    } finally {
      setLoading(false);
    }
  }

  const fetchReport = async () => {
    if (!fromDate) return alert('Select From Date!')
    try {
      setLoading(true)
      const res = await axios.get(`${BASE_URL}/api/se-report?user=${encodeURIComponent(currentUser)}&from=${fromDate}&to=${toDate}`)
      setReportData(Array.isArray(res.data) ? res.data : [])
      setReportView('table')
    } catch (err) {
      alert('Report error!')
    } finally {
      setLoading(false)
    }
  }

  const downloadExcel = () => {
    if (reportData.length === 0) return alert('No data!')
    const headers = ['Sr No', 'Date & Time (SE)', 'Date & Time (QE)', 'Location', 'Checklist', 'SE Name', 'QE Name', 'Remark']

    let srNo = 1;
    const body = reportData.flatMap(r =>
      r.items.map(it => {
        let remark = 'Pending';
        if (it.qeDecision === 'pass') remark = 'Approved';
        else if (it.qeDecision === 'fail' && r.status === 'Approved') remark = 'Rework Pass';
        else if (it.qeDecision === 'fail' && r.status === 'Returned') remark = 'Rework Reject';

        return [
          srNo++,
          r.submittedAt || r.date,
          r.updatedAt || '-',
          `${r.block} | ${r.floor} | ${r.location}`,
          it.category,
          r.submittedBy,
          r.qeName || '-',
          remark
        ].map(val => `"${val}"`).join(',');
      })
    ).join('\n');

    const csvContent = headers.join(',') + '\n' + body;
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Report_${fromDate}_${toDate}.csv`;
    link.click();
    setDownloadedReports(prev => [{ id: Date.now(), filename: link.download, fromDate, toDate, downloadedAt: new Date().toLocaleString(), csvContent }, ...prev]);
  }

  const handleLogout = () => { localStorage.removeItem('nyati_user'); window.location.href = '/'; }

  const handleItemCheckboxChange = (itemId, isPassed) => {
    if (isPassed) return; // Prevent change for already passed items
    setItemSelection(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const openReworkForm = (item, reportId, itemIdx) => {
    setSelectedRework({ ...item, reportId, itemIdx });
    setReworkPhotos([]);
    setReworkRemark('');
    setView('rework-form');
  }

  const handleReworkPhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setReworkPhotos(prev => [...prev, ...files.map(f => ({ file: f, url: URL.createObjectURL(f) }))]);
  }

  const submitRework = async () => {
    if (!reworkRemark) return alert("Remark likhiye!");

    // Server expects 'id', 'itemsData' (JSON string), and 'media' files
    const formData = new FormData();
    formData.append('id', selectedRework.reportId);

    const itemsData = [{
      index: selectedRework.itemIdx,
      reworkRemark: reworkRemark,
      fileCount: reworkPhotos.length
    }];
    formData.append('itemsData', JSON.stringify(itemsData));

    reworkPhotos.forEach(p => formData.append('media', p.file));

    try {
      setLoading(true);
      await axios.post(`${BASE_URL}/api/submit-rework`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert("Rework Submitted!");
      fetchReworkReports();
      fetchDashboardStats();
    } catch (err) {
      console.error("Rework submit error:", err);
      alert("Rework submission failed!");
    } finally {
      setLoading(false);
    }
  }

  const getImageUrl = (p) => p && (p.startsWith('http') ? p : `${BASE_URL}${p.startsWith('/') ? '' : '/'}${p}`);

  const [expandedHistory, setExpandedHistory] = useState({});

  const toggleHistoryItem = (idx) => {
    setExpandedHistory(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto shadow-sm pb-10 relative overflow-x-hidden font-sans">

      {/* SIDEBAR */}
      <div className={`fixed inset-0 z-[100] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#004080] text-white p-6 shadow-2xl">
          <div className="flex justify-between items-start mb-10">
            <h5 className="text-sm font-bold italic leading-tight w-4/5">Nyati Engineers</h5>
            <button onClick={() => setIsSidebarOpen(false)}><FontAwesomeIcon icon={faTimes} className="text-2xl" /></button>
          </div>
          <nav className="space-y-4">
            <button onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} className="w-full text-left p-3 hover:bg-white/10 rounded-md flex items-center gap-3"><FontAwesomeIcon icon={faHome} /> Dashboard</button>
            <button onClick={fetchReworkReports} className="w-full text-left p-3 hover:bg-white/10 rounded-md flex items-center justify-between">
              <div className="flex items-center gap-3"><FontAwesomeIcon icon={faHistory} /> <span>Pending Reworks</span></div>
              {reworkReports.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{reworkReports.length}</span>}
            </button>
            <button onClick={fetchPendingReports} className="w-full text-left p-3 hover:bg-white/10 rounded-md flex items-center justify-between">
              <div className="flex items-center gap-3"><FontAwesomeIcon icon={faClock} /> <span>Pending Approval</span></div>
              {pendingReports.length > 0 && <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingReports.length}</span>}
            </button>
            <button onClick={fetchHistoryReports} className="w-full text-left p-3 hover:bg-white/10 rounded-md flex items-center gap-3"><FontAwesomeIcon icon={faCheckCircle} /> History</button>
            <button onClick={() => { setView('report'); setReportView('filter'); setFromDate(''); setReportData([]); setIsSidebarOpen(false); }} className="w-full text-left p-3 hover:bg-white/10 rounded-md flex items-center gap-3"><FontAwesomeIcon icon={faUpload} /> Report</button>
            <button onClick={() => { setView('downloadReport'); setIsSidebarOpen(false); }} className="w-full text-left p-3 hover:bg-white/10 rounded-md flex items-center gap-3"><FontAwesomeIcon icon={faHistory} /> Report Download</button>
            <button onClick={handleLogout} className="w-full text-left p-3 hover:bg-red-500 rounded-md flex items-center gap-3 mt-10 text-red-200"><FontAwesomeIcon icon={faSignOutAlt} /> Sign Out</button>
          </nav>
        </div>
      </div>

      {/* NAVBAR */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100 sticky top-0 bg-white z-40">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-[#004080] relative">
          <FontAwesomeIcon icon={faBars} className="text-2xl" />
          {reworkReports.length > 0 && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}
        </button>
        <div className="flex flex-col items-center">
          <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
        </div>
        <div className="w-10"></div>
      </div>

      {/* DASHBOARD VIEW */}
      {view === 'dashboard' && (
        <div className="p-4 animate-in fade-in duration-500">
          {/* USER PROFILE CARD */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-md flex items-center gap-4 mb-6 mt-2 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50/50 rounded-bl-full -mr-10 -mt-10"></div>
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-100 shrink-0 relative z-10">
              <FontAwesomeIcon icon={faUserTie} className="text-[#004080] text-2xl" />
            </div>
            <div className="flex-1 overflow-hidden relative z-10">
              <h2 className="text-[16px] font-black text-gray-900 uppercase truncate leading-tight">{currentUser}</h2>
              <div className="flex flex-col gap-0.5 mt-1">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div> {role}</span>
                <span className="text-[9px] font-black text-gray-500 uppercase truncate opacity-70 tracking-tight"><FontAwesomeIcon icon={faCalendarAlt} className="mr-1 text-blue-300" /> {project}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center active:scale-95 transition-all cursor-pointer" onClick={() => setView('today-tasks')}>
              <div className="w-10 h-10 bg-blue-50 rounded-full mx-auto flex items-center justify-center mb-2"><FontAwesomeIcon icon={faListAlt} className="text-[#004080]" /></div>
              <p className="text-xl font-black text-gray-900">{dashboardStats.todayTasks}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase">Today's Checklist</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center border-b-4 border-b-red-500 active:scale-95 transition-all cursor-pointer" onClick={fetchReworkReports}>
              <div className="w-10 h-10 bg-red-50 rounded-full mx-auto flex items-center justify-center mb-2"><FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500" /></div>
              <p className="text-xl font-black text-red-600">{dashboardStats.reworkCount}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase">Reworks</p>
            </div>
          </div>

          <div className="mb-20">
            <div className="flex justify-between mb-4"><h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Recent Activity</h3></div>
            <div className="space-y-3">
              {dashboardStats.recentActivity.length > 0 ? dashboardStats.recentActivity.map((r, i) => {
                const isPass = r.status === 'Approved';
                return (
                  <div key={i} className="bg-white p-3.5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPass ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      <FontAwesomeIcon icon={isPass ? faCheckCircle : faExclamationTriangle} className="text-sm" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[10px] font-black text-gray-800 truncate leading-tight uppercase">
                        {[r.block, r.floor, r.unitType].filter(Boolean).join(' | ')}
                      </p>
                      <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{r.submittedAt || r.date} • {r.location || 'N/A'}</p>
                    </div>
                    <div className={`text-[10px] font-black uppercase tracking-widest ${isPass ? 'text-green-500' : 'text-red-500'}`}>
                      {isPass ? 'PASS' : 'FAIL'}
                    </div>
                  </div>
                );
              }) : <div className="text-center py-10 text-gray-300 text-[10px] uppercase font-bold">No recent activity</div>}
            </div>
          </div>
          <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 max-w-md mx-auto"><button onClick={() => setView('main')} className="bg-[#004080] text-white shadow-2xl px-10 py-5 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center gap-4 active:scale-95 transition-all outline outline-4 outline-white/20"><FontAwesomeIcon icon={faPlus} /> Start Inspection</button></div>
        </div>
      )}

      {/* INSPECTION VIEW */}
      {view === 'main' && (
        <div className="animate-in fade-in duration-500">
          <div className="p-4"><button onClick={() => setView('dashboard')} className="mb-4 text-[#004080] font-black text-xs uppercase"><FontAwesomeIcon icon={faArrowLeft} /> Dashboard</button></div>
          <div className="px-6 space-y-8">
            <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-200">
              <SearchableSelect label="Building" placeholder="Select Building" options={buildingOptions} value={spotData.buildingArea} onChange={(v) => handleSpotInputChange({ target: { name: 'buildingArea', value: v } })} />
              <SearchableSelect label="Floor" placeholder="Select Floor" options={floorOptions} value={spotData.floorLevel} onChange={(v) => handleSpotInputChange({ target: { name: 'floorLevel', value: v } })} />
              <SearchableSelect label="Unit/Area" placeholder="Select Unit/Type" options={unitTypeOptions} value={spotData.unitType} onChange={(v) => handleSpotInputChange({ target: { name: 'unitType', value: v } })} />
              <div className="space-y-1"><label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Location / Flat No</label><input name="locationUnit" value={spotData.locationUnit} onChange={handleSpotInputChange} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g. 501" /></div>
            </div>
            <div className="space-y-4">
              <h3 className="text-[#004080] font-black text-xs uppercase border-l-4 border-[#004080] pl-2 ml-1">Categories</h3>
              <div onClick={() => setShowQCDropdown(!showQCDropdown)} className="p-4 border-2 border-gray-200 rounded-xl bg-white flex justify-between items-center cursor-pointer shadow-sm"><span className="text-xs font-bold truncate pr-4 text-gray-700">{selectedCats.length > 0 ? selectedCats.map(c => c.name).join(', ') : '-- SELECT --'}</span><FontAwesomeIcon icon={showQCDropdown ? faChevronUp : faChevronDown} className="text-gray-400" /></div>
              {showQCDropdown && <div className="bg-white border rounded-xl shadow-xl max-h-60 overflow-y-auto">{categories.map((c, i) => (<div key={i} onClick={() => toggleCategory(c)} className={`p-4 border-b flex justify-between items-center ${selectedCats.find(s => s.name === c.name) ? 'bg-blue-50' : ''}`}><span className="text-xs font-bold">{c.name}</span><FontAwesomeIcon icon={selectedCats.find(s => s.name === c.name) ? faCheckSquare : faSquare} className={selectedCats.find(s => s.name === c.name) ? 'text-[#004080]' : 'text-gray-300'} /></div>))}</div>}
            </div>
            <button onClick={handleInitialSubmit} className="w-full py-4 bg-[#004080] text-white font-black rounded-xl uppercase shadow-lg shadow-blue-200 tracking-widest text-sm translate-y-4">Go to Checklist</button>
          </div>
        </div>
      )}

      {/* CHECKLIST VIEW */}
      {view === 'checklist' && (
        <div className="p-4 animate-in slide-in-from-right duration-500">
          <button onClick={() => setView('main')} className="mb-6 text-[#004080] font-bold text-sm"><FontAwesomeIcon icon={faArrowLeft} /> Back</button>
          <div className="space-y-6">
            {selectedCats.map((cat, ci) => (
              <div key={ci} className="border rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-[#004080] text-white p-4 font-black text-[10px] uppercase">
                  <span>{cat.name}</span>
                </div>
                <div className="p-4 space-y-4 bg-gray-50">
                  {cat.items.map((it, ii) => {
                    const isPassed = passedQuestions.includes(it.questionText);
                    return (
                      <div key={ii}>
                        {isPassed ? (
                          // INACTIVE - already passed
                          <div className="p-4 rounded-xl border bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed">
                            <div className="flex items-center gap-2">
                              <span className="text-green-500 text-sm">✅</span>
                              <label className="text-[11px] text-gray-400 line-through leading-tight block">
                                {it.questionText}
                              </label>
                            </div>
                            <span className="text-[9px] text-green-500 font-bold">Already Cleared by QE</span>
                          </div>
                        ) : (
                          // ACTIVE - normal interactive
                          <div
                            onClick={() => handleItemCheckboxChange(it._id, false)}
                            className={`p-4 rounded-xl border transition-all duration-300 flex justify-between items-center cursor-pointer ${itemSelection[it._id] ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-white border-gray-100 shadow-sm'}`}
                          >
                            <label className="text-[11px] font-bold text-gray-700 leading-tight block flex-1">
                              {it.questionText}
                            </label>
                            <input
                              type="checkbox"
                              className="w-5 h-5 accent-green-500 ml-3 shrink-0"
                              checked={itemSelection[it._id] || false}
                              readOnly
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t max-w-md mx-auto z-40"><button onClick={submitFinalReport} className="w-full py-4 bg-green-600 text-white font-black rounded-xl uppercase shadow-xl flex items-center justify-center gap-2 tracking-widest text-sm" disabled={loading}><FontAwesomeIcon icon={loading ? faUpload : faCheckCircle} /> {loading ? 'Submitting...' : 'Submit to QE'}</button></div>
        </div>
      )}

      {/* REWORK VIEW */}
      {view === 'rework' && (
        <div className="p-4 animate-in slide-in-from-left duration-300 mb-10">
          <button onClick={() => setView('dashboard')} className="mb-4 text-[#004080] font-bold"><FontAwesomeIcon icon={faArrowLeft} /> Back</button>
          <div className="flex items-center gap-2 mb-6 border-l-4 border-red-500 pl-3"><h2 className="text-sm font-black text-red-600 uppercase">Pending Rejections</h2><span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{reworkReports.length}</span></div>
          <div className="space-y-4">{reworkReports.map((r, ri) => (<div key={ri} className="bg-white border rounded-2xl overflow-hidden shadow-sm border-t-4 border-t-red-500"><div className="bg-red-50 p-3 flex justify-between"><div className="text-[10px] font-black text-red-700">{r.block} | {r.floor}</div><div className="text-[9px] text-gray-400 font-bold">{r.date}</div></div><div className="divide-y">{r.items.map((it, ii) => it.qeDecision === 'fail' && (<div key={ii} className="p-4 cursor-pointer hover:bg-red-50 flex justify-between items-center" onClick={() => openReworkForm(it, r._id, ii)}><div className="flex-1"><p className="text-[11px] font-bold text-gray-800">{it.question}</p><p className="text-[9px] text-red-500 font-bold mt-1">REWORK REQUIRED</p></div><FontAwesomeIcon icon={faChevronDown} className="text-gray-300 -rotate-90" /></div>))}</div></div>))}</div>
        </div>
      )}

      {/* REWORK FORM */}
      {view === 'rework-form' && selectedRework && (
        <div className="p-4 animate-in slide-in-from-bottom duration-400 mb-32 text-left">
          <button onClick={() => setView('rework')} className="mb-6 text-[#004080] font-bold text-sm tracking-tight flex items-center gap-2">
            <FontAwesomeIcon icon={faArrowLeft} /> Back to List
          </button>

          <div className="bg-white border rounded-3xl shadow-2xl overflow-hidden mb-10 border-gray-100">
            <div className="bg-[#004080] text-white p-5">
              <div className="flex justify-between items-start">
                <div className="text-[10px] opacity-60 uppercase font-black tracking-widest">{selectedRework.category}</div>
                <div className="px-2 py-0.5 bg-red-500/20 rounded-md text-[8px] font-black uppercase text-red-200 border border-red-500/30">Action Required</div>
              </div>
              <div className="font-black text-[15px] mt-2 leading-snug">{selectedRework.question}</div>
            </div>

            <div className="p-6 space-y-6">
              {/* QE FEEDBACK SECTION */}
              <div className="bg-red-50/50 p-5 rounded-2xl border border-red-100/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-100/20 rounded-bl-full -mr-12 -mt-12"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                      <FontAwesomeIcon icon={faInfoCircle} className="text-red-600 text-[10px]" />
                    </div>
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Quality Engineer Feedback</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] font-black text-red-400 uppercase tracking-tighter mb-1">Issue Observed</p>
                      <p className="text-sm font-black text-gray-800 leading-tight bg-white p-3 rounded-xl border border-red-100/50 shadow-sm italic">
                        "{selectedRework.observation || 'Please check quality again.'}"
                      </p>
                    </div>

                    {selectedRework.qeRemark && (
                      <div>
                        <p className="text-[9px] font-black text-red-400 uppercase tracking-tighter mb-1">QE Remarks</p>
                        <p className="text-xs font-bold text-gray-600 bg-white/40 p-2 rounded-lg leading-relaxed">
                          {selectedRework.qeRemark}
                        </p>
                      </div>
                    )}

                    {selectedRework.mediaUrls && selectedRework.mediaUrls.length > 0 && (
                      <div className="pt-2">
                        <p className="text-[9px] font-black text-red-400 uppercase tracking-tighter mb-2">Evidence from QE</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedRework.mediaUrls.map((p, i) => (
                            <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(getImageUrl(p), '_blank')}>
                              <img src={getImageUrl(p)} className="w-full h-full object-cover" alt="qe evidence" onError={(e) => e.target.src = "https://via.placeholder.com/100?text=Error"} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SE INPUT SECTION */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-1 flex justify-between">
                    <span>Status Remark</span>
                    <span className="text-blue-500">{reworkRemark.length}/500</span>
                  </label>
                  <textarea
                    className="w-full border-2 border-gray-100 rounded-2xl p-4 text-sm focus:border-[#004080] outline-none transition-all shadow-inner bg-gray-50/50"
                    rows="3"
                    placeholder="Explain what was fixed..."
                    value={reworkRemark}
                    onChange={(e) => setReworkRemark(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Fix Evidence Photos</label>
                    <label className="bg-[#004080] text-white w-10 h-10 rounded-full flex items-center justify-center cursor-pointer active:scale-90 transition-all shadow-lg hover:bg-blue-700">
                      <FontAwesomeIcon icon={faCamera} />
                      <input type="file" multiple className="hidden" onChange={handleReworkPhotoChange} />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {reworkPhotos.map((p, i) => (
                      <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-xl group">
                        <img src={p.url} className="w-full h-full object-cover" />
                        <button onClick={() => setReworkPhotos(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-600/90 text-white w-7 h-7 rounded-xl flex items-center justify-center text-[10px] shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    ))}
                    {reworkPhotos.length === 0 && (
                      <div className="w-full py-10 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-300">
                        <FontAwesomeIcon icon={faImage} size="2x" className="mb-2 opacity-30" />
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-50">At least one photo required</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={submitRework}
                className="w-full py-5 bg-[#004080] text-white font-black rounded-2xl tracking-widest text-sm uppercase shadow-2xl shadow-blue-800/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
                disabled={loading || reworkPhotos.length === 0}
              >
                <FontAwesomeIcon icon={loading ? faClock : faCheckCircle} />
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY VIEW */}
      {view === 'history' && (
        <div className="px-4 animate-in slide-in-from-right duration-300 mt-4 pb-10">
          <button onClick={() => setView('dashboard')} className="mb-4 text-[#004080] font-bold flex items-center gap-2 text-sm"><FontAwesomeIcon icon={faArrowLeft} /> Back</button>
          <div className="flex items-center gap-2 mb-6 border-l-4 border-green-500 pl-3">
            <h2 className="text-sm font-black text-green-600 uppercase tracking-widest">Inspection History</h2>
            <span className="bg-green-100 text-green-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{historyReports.length}</span>
          </div>

          <div className="space-y-4">
            {historyReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-300 opacity-60">
                <FontAwesomeIcon icon={faHistory} size="3x" className="mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest text-center">Abhi koi history nahi hai</p>
              </div>
            ) : (
              historyReports.map((report, idx) => {
                const isExpanded = expandedHistory[idx] || false;
                const passCount = report.items.filter(i => i.qeDecision === 'pass').length;
                const totalCount = report.items.length;
                const isFullyApproved = passCount === totalCount;

                return (
                  <div key={idx} className={`bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden border-t-4 ${isFullyApproved ? 'border-t-green-500' : 'border-t-orange-500'} transition-all duration-300`}>
                    <div className="bg-gray-50/30 p-3 flex justify-between items-start cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => toggleHistoryItem(idx)}>
                      <div className="flex flex-col flex-1">
                        <span className="text-[10px] font-black text-[#004080] uppercase tracking-tight">
                          {[report.block, report.floor, report.unitType].filter(Boolean).join(' | ')}
                        </span>
                        <span className="text-[9px] text-gray-400 font-bold">Location: {report.location || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        <span className="text-[9px] text-gray-400 font-bold">{report.submittedAt || report.date}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase ${isFullyApproved ? 'text-green-600' : 'text-orange-500'} flex items-center gap-1`}>
                            {isFullyApproved ? '100% CLEAR' : `${passCount}/${totalCount} PASSED`} {isFullyApproved && <FontAwesomeIcon icon={faCheckCircle} className="text-[10px]" />}
                          </span>
                          <div className={`w-6 h-6 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#004080] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                            <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="animate-in slide-in-from-top duration-300">
                        <div className="p-3 space-y-4 border-t border-gray-50 bg-white">
                          {Object.entries(
                            report.items
                              .filter(item => item.qeDecision === 'pass')
                              .reduce((acc, item) => {
                                const cat = item.category || 'General';
                                if (!acc[cat]) acc[cat] = [];
                                acc[cat].push(item);
                                return acc;
                              }, {})
                          ).map(([category, items], catIdx) => (
                            <div key={catIdx} className="space-y-2 mb-4 last:mb-0">
                              <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest pl-1">{category}</div>
                              {items.map((item, iIdx) => (
                                <div key={iIdx} className="flex items-center justify-between gap-3 text-[11px] font-bold p-3 bg-gray-50/50 rounded-xl border border-gray-100/50">
                                  <div className="flex-1">
                                    <p className="text-gray-800 leading-tight">{item.question}</p>
                                  </div>
                                  <div className={`px-2 py-1 ${item.qeDecision === 'pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} rounded-md text-[8px] font-black`}>
                                    {item.qeDecision === 'pass' ? 'PASS' : item.qeDecision === 'fail' ? 'FAIL' : 'PENDING'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                        {report.qeName && (
                          <div className="px-4 py-3 bg-[#004080]/5 flex items-center gap-2 border-t border-gray-50">
                            <div className="w-5 h-5 rounded-full bg-[#004080] flex items-center justify-center">
                              <FontAwesomeIcon icon={faUserTie} className="text-white text-[8px]" />
                            </div>
                            <span className="text-[9px] font-black text-[#004080] uppercase tracking-wider">Reviewed by: {report.qeName}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* REPORT VIEW */}
      {view === 'report' && (
        <div className="px-4 animate-in slide-in-from-right duration-300 mt-4 pb-10">
          <button onClick={() => setView('dashboard')} className="mb-4 text-[#004080] font-bold flex items-center gap-2 text-sm"><FontAwesomeIcon icon={faArrowLeft} /> Back</button>
          <div className="flex items-center gap-2 mb-6 border-l-4 border-[#004080] pl-3">
            <h2 className="text-sm font-black text-[#004080] uppercase tracking-widest">Inspection Report</h2>
          </div>

          {reportView === 'filter' ? (
            <div className="bg-white border p-5 rounded-2xl shadow-sm space-y-4">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase">From Date</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full border rounded-lg p-3 text-sm mt-1" />
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase">To Date</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full border rounded-lg p-3 text-sm mt-1" />
              </div>
              <button onClick={fetchReport} className="w-full py-4 bg-[#004080] text-white font-black rounded-xl uppercase tracking-widest text-xs">Generate Report</button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <button onClick={() => setReportView('filter')} className="text-[#004080] font-bold text-xs">← Change Dates</button>
                <button onClick={downloadExcel} className="flex items-center gap-2 bg-green-600 text-white text-[10px] font-black px-4 py-2 rounded-lg shadow"><FontAwesomeIcon icon={faUpload} /> Export Excel</button>
              </div>

              {reportData.length === 0 ? (
                <div className="text-center py-16 text-gray-300 uppercase text-[10px] font-bold">No Records Found</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                  <table className="w-full text-[9px] border-collapse">
                    <thead>
                      <tr className="bg-[#004080] text-white uppercase tracking-tighter">
                        <th className="p-2 text-left border-r border-blue-700">Sr</th>
                        <th className="p-2 text-left border-r border-blue-700">Date & Time (SE)</th>
                        <th className="p-2 text-left border-r border-blue-700">Date & Time (QE)</th>
                        <th className="p-2 text-left border-r border-blue-700">Location</th>
                        <th className="p-2 text-left border-r border-blue-700">Checklist</th>
                        <th className="p-2 text-left border-r border-blue-700">SE Name</th>
                        <th className="p-2 text-left border-r border-blue-700">QE Name</th>
                        <th className="p-2 text-left">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(() => {
                        let srNo = 1;
                        return reportData.flatMap((report, rIdx) =>
                          report.items.map((item, iIdx) => {
                            let remark = 'Pending';
                            let remarkColor = 'text-orange-500';
                            if (item.qeDecision === 'pass') { remark = 'Approved'; remarkColor = 'text-green-600'; }
                            else if (item.qeDecision === 'fail' && report.status === 'Approved') { remark = 'Rework Pass'; remarkColor = 'text-blue-600'; }
                            else if (item.qeDecision === 'fail' && report.status === 'Returned') { remark = 'Rework Reject'; remarkColor = 'text-red-600'; }

                            return (
                              <tr key={`${rIdx}-${iIdx}`} className={srNo % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                <td className="p-2 border-r">{srNo++}</td>
                                <td className="p-2 border-r whitespace-nowrap">{report.submittedAt || report.date}</td>
                                <td className="p-2 border-r whitespace-nowrap">{report.updatedAt || '-'}</td>
                                <td className="p-2 border-r">{report.block} | {report.floor} | {report.location}</td>
                                <td className="p-2 border-r font-bold text-[#004080]">{item.category}</td>
                                <td className="p-2 border-r whitespace-nowrap">{report.submittedBy}</td>
                                <td className="p-2 border-r whitespace-nowrap">{report.qeName || '-'}</td>
                                <td className={`p-2 font-black ${remarkColor}`}>{remark}</td>
                              </tr>
                            );
                          })
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TODAY TASKS LIST VIEW */}
      {view === 'today-tasks' && (
        <div className="p-4 animate-in slide-in-from-right duration-500 mb-20 text-left">
          <button onClick={() => setView('dashboard')} className="mb-6 text-[#004080] font-bold text-sm tracking-tight flex items-center gap-2">
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
          </button>

          <h2 className="text-sm font-black text-[#004080] uppercase mb-6 tracking-widest pl-3 border-l-4 border-[#004080] flex items-center justify-between">
            <span>Today's Submissions</span>
            <span className="text-[10px] bg-blue-50 px-2 py-0.5 rounded-full">{todayReports.length}</span>
          </h2>

          <div className="space-y-4">
            {todayReports.length > 0 ? todayReports.map((r, i) => (
              <div key={i} className="bg-white border-2 border-gray-50 rounded-3xl p-5 shadow-sm hover:border-blue-100 transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-[#004080] uppercase tracking-widest mb-1">{r.projectName}</span>
                    <h3 className="text-sm font-black text-gray-800 leading-tight uppercase group-hover:text-[#004080] transition-colors">
                      {[r.block, r.floor, r.unitType].filter(Boolean).join(' | ')}
                    </h3>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${r.status === 'Approved' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                    {r.status}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 py-3 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                      <FontAwesomeIcon icon={faClock} className="text-gray-400 text-xs" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400">{r.submittedAt || "Just now"}</p>
                  </div>
                  <div className="text-[10px] font-black text-gray-400 italic">
                    {r.items?.length || 0} Checkpoints
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-20 flex flex-col items-center justify-center text-gray-300">
                <FontAwesomeIcon icon={faListAlt} size="3x" className="mb-4 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">No reports submitted today</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PENDING APPROVAL LIST VIEW */}
      {view === 'pending-approval' && (
        <div className="p-4 animate-in slide-in-from-right duration-500 mb-20 text-left">
          <button onClick={() => setView('dashboard')} className="mb-6 text-[#004080] font-bold text-sm tracking-tight flex items-center gap-2">
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
          </button>

          <h2 className="text-sm font-black text-[#004080] uppercase mb-6 tracking-widest pl-3 border-l-4 border-orange-500 flex items-center justify-between">
            <span>In Review by QE</span>
            <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-black">{pendingReports.length}</span>
          </h2>

          <div className="space-y-4">
            {pendingReports.length > 0 ? pendingReports.map((r, i) => (
              <div key={i} className="bg-white border-2 border-gray-50 rounded-3xl p-5 shadow-sm hover:border-orange-100 transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1">{r.projectName}</span>
                    <h3 className="text-sm font-black text-gray-800 leading-tight uppercase group-hover:text-[#004080] transition-colors">
                      {[r.block, r.floor, r.unitType].filter(Boolean).join(' | ')}
                    </h3>
                  </div>
                  <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter bg-orange-50 text-orange-600 animate-pulse">
                    In Review
                  </div>
                </div>

                <p className="text-[10px] font-bold text-gray-500 mb-4">{r.location} | {r.unitType}</p>

                <div className="flex items-center justify-between mt-4 py-3 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-orange-400 text-xs" />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Sent On</p>
                      <p className="text-[10px] font-black text-gray-700">{r.date} at {r.submittedAt?.split(',')[1] || r.submittedAt}</p>
                      <p className="text-[9px] font-bold text-[#004080] mt-1 uppercase">{r.unitType}</p>
                    </div>
                  </div>
                  <div className="text-[10px] font-black text-gray-400 italic">
                    {r.items?.length || 0} Items
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-20 flex flex-col items-center justify-center text-gray-300">
                <FontAwesomeIcon icon={faClock} size="3x" className="mb-4 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">No reports pending for approval</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DOWNLOAD REPORT VIEW */}
      {view === 'downloadReport' && (
        <div className="px-4 animate-in slide-in-from-right duration-300 mt-4 pb-10">
          <button onClick={() => setView('dashboard')} className="mb-4 text-[#004080] font-bold flex items-center gap-2 text-sm"><FontAwesomeIcon icon={faArrowLeft} /> Back</button>
          <h2 className="text-sm font-black text-[#004080] uppercase mb-4 tracking-widest pl-2 border-l-4 border-green-500">Downloaded Reports</h2>
          {downloadedReports.map(r => (
            <div key={r.id} className="bg-white border rounded-xl p-4 mb-3 flex justify-between items-center shadow-sm">
              <div>
                <p className="text-[11px] font-black text-gray-800">{r.filename}</p>
                <p className="text-[9px] text-gray-400 mt-0.5">{r.downloadedAt}</p>
              </div>
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
            </div>
          ))}
        </div>
      )}

      {/* FOOTER STATS INFO */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-100 max-w-md mx-auto"><div className="h-full bg-[#004080] transition-all duration-1000" style={{ width: `${dashboardStats.compliance}%` }}></div></div>

      {loading && (
        <div className="fixed inset-0 z-[200] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-100 border-t-[#004080] rounded-full animate-spin"></div>
          <p className="mt-4 text-[10px] font-black text-[#004080] uppercase tracking-widest">Processing...</p>
        </div>
      )}
    </div>
  )
}

export default SEIndex;