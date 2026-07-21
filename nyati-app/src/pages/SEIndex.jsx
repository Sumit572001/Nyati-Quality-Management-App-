import { useState, useEffect, useRef, useMemo } from 'react'
import axios from 'axios'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronDown, faChevronUp, faCheckCircle, faArrowLeft, faCheckSquare, faSquare,
  faBars, faTimes, faSignOutAlt, faUserCircle, faHistory, faHome, faInfoCircle, faUserTie, faCalendarAlt,
  faCamera, faUpload, faTrash, faExclamationTriangle, faPlus, faChartLine, faListAlt, faTrophy, faCheck,
  faClock, faImage, faSearch
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
      <label className="text-[13px] font-bold text-[#004080] uppercase ml-1">{label}</label>
      <div
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) setSearchTerm(''); }}
        className={`w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 outline-none text-base transition-all duration-200 flex justify-between items-center cursor-pointer shadow-sm ${isOpen ? 'border-[#004080] ring-2 ring-blue-50' : 'hover:border-gray-300'}`}
      >
        <span className={`truncate ${value ? 'text-gray-900 font-bold' : 'text-gray-400 font-normal'}`}>
          {value || placeholder}
        </span>
        <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} className={`text-sm transition-transform duration-200 ${isOpen ? 'text-[#004080]' : 'text-gray-400'}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in slide-in-from-top-1 duration-150">
          <div className="p-2 border-b border-gray-100 bg-gray-50/50">
            <input
              type="text"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-[#004080] focus:ring-1 focus:ring-blue-50 transition-all font-medium"
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
                  className={`px-4 py-2.5 text-sm font-bold transition-colors cursor-pointer border-l-4 ${opt === value ? 'bg-blue-50' : ''}`}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-[11px] text-gray-400 text-center uppercase font-black tracking-widest bg-gray-50/20">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusSelector({ itemId, value, onChange, isPassed }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState('bottom');
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Smart positioning - check if dropdown will go below viewport
  useEffect(() => {
    if (isOpen && containerRef.current && dropdownRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = dropdownRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - containerRect.bottom;

      if (spaceBelow < dropdownHeight + 20 && containerRect.top > dropdownHeight + 20) {
        setPosition('top');
      } else {
        setPosition('bottom');
      }
    }
  }, [isOpen]);

  const getDisplay = () => {
    if (value === 'yes') return <span className="text-green-600 text-sm font-bold">✓</span>;
    if (value === 'no') return <span className="text-red-500 text-sm font-bold">✕</span>;
    if (value === 'na') return <span className="text-orange-500 text-sm font-bold">−</span>;
    return null;
  };

  const getOptionCard = (opt, label, icon, iconColor, bgColor, borderColor) => {
    const isSelected = value === opt;
    return (
      <div
        onClick={() => { onChange(itemId, opt); setIsOpen(false); }}
        className={`cursor-pointer rounded-lg border p-2 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 min-w-[56px] ${isSelected
          ? `${bgColor} ${borderColor} shadow-sm scale-105`
          : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200'
          }`}
      >
        <span className={`${iconColor} text-sm font-bold`}>{icon}</span>
        <span className={`text-[9px] font-black uppercase tracking-wide ${isSelected ? 'text-gray-800' : 'text-gray-500'}`}>{label}</span>
      </div>
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        onClick={() => !isPassed && setIsOpen(!isOpen)}
        className={`w-9 h-9 rounded-lg border flex items-center justify-center cursor-pointer transition-all duration-200 ${isPassed ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50' :
          value === 'yes' ? 'bg-green-50 border-green-400' :
            value === 'no' ? 'bg-red-50 border-red-400' :
              value === 'na' ? 'bg-orange-50 border-orange-400' :
                'bg-white border-gray-200 hover:border-gray-300'
          }`}
      >
        {getDisplay()}
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute right-0 z-50 w-auto bg-white border border-gray-200 rounded-xl shadow-2xl p-2 animate-in fade-in zoom-in duration-150 ${position === 'top' ? 'bottom-11 slide-in-from-bottom-2' : 'top-11 slide-in-from-top-2'
            }`}
        >
          <div className="flex items-center gap-2">
            {getOptionCard('yes', 'Yes', '✓', 'text-green-600', 'bg-green-50', 'border-green-300')}
            {getOptionCard('no', 'No', '✕', 'text-red-500', 'bg-red-50', 'border-red-300')}
            {getOptionCard('na', 'N/A', '−', 'text-orange-500', 'bg-orange-50', 'border-orange-300')}
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
  const [inspectionStep, setInspectionStep] = useState(1)
  const [categorySearchTerm, setCategorySearchTerm] = useState('')
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
  const [zoomImage, setZoomImage] = useState(null);
  const [showReworkHistory, setShowReworkHistory] = useState(false);
  const [itemSelection, setItemSelection] = useState({}); // Tracking individual item selection: 'yes', 'no', 'na' or undefined
  const [todayReports, setTodayReports] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    todayTasks: 0,
    reworkCount: 0,
    compliance: 0,
    recentActivity: []
  });
  const [passedQuestions, setPassedQuestions] = useState([]); // Questions already passed for this unit
  const [rejectedQuestions, setRejectedQuestions] = useState([]); // Questions rejected and needing rework
  const [pendingQuestions, setPendingQuestions] = useState([]); // Questions awaiting QE action
  const [categoryStages, setCategoryStages] = useState({}); // Stores selected stage for each category { "Dado": "Pre Construction" }
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  const [buildingOptions, setBuildingOptions] = useState([])
  const [floorOptions, setFloorOptions] = useState([])
  const [unitTypeOptions, setUnitTypeOptions] = useState([])

  const [spotData, setSpotData] = useState({
    buildingArea: '',
    floorLevel: '',
    unitType: '',
    locationUnit: ''
  })

  // Helper: File to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Helper: Base64 to file
  const base64ToFile = (base64Data, filename, mimeType) => {
    const arr = base64Data.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mimeType });
  };

  const addToQueue = (type, payload) => {
    const queue = JSON.parse(localStorage.getItem('nyati_offline_queue') || '[]');
    queue.push({
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      type,
      payload,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('nyati_offline_queue', JSON.stringify(queue));
  };

  const processOfflineQueue = async () => {
    if (!navigator.onLine) return;
    const queue = JSON.parse(localStorage.getItem('nyati_offline_queue') || '[]');
    if (queue.length === 0) return;

    setSyncing(true);
    let remainingQueue = [...queue];

    for (const item of queue) {
      try {
        if (item.type === 'submit-report') {
          await axios.post(`${BASE_URL}/api/submit-report`, item.payload);
        } else if (item.type === 'submit-rework') {
          const formData = new FormData();
          formData.append('id', item.payload.id);
          formData.append('itemsData', JSON.stringify(item.payload.itemsData));

          if (item.payload.mediaFiles && item.payload.mediaFiles.length > 0) {
            for (const f of item.payload.mediaFiles) {
              const fileObj = base64ToFile(f.data, f.filename, f.type);
              formData.append('media', fileObj);
            }
          }
          await axios.post(`${BASE_URL}/api/submit-rework`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
        remainingQueue = remainingQueue.filter(q => q.id !== item.id);
        localStorage.setItem('nyati_offline_queue', JSON.stringify(remainingQueue));
      } catch (err) {
        console.error("Sync error for item:", item, err);
        break;
      }
    }
    setSyncing(false);
    fetchDashboardStats();
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchInitialData(), fetchDashboardStats(), checkPendingReworks(true)]);
      setLoading(false);
      processOfflineQueue();
    };
    init();
    const interval = setInterval(() => {
      checkPendingReworks(false);
      fetchDashboardStats();
      processOfflineQueue();
    }, 30000);

    const handleOnline = () => {
      setIsOnline(true);
      processOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const resAll = await axios.get(`${BASE_URL}/api/my-reports?user=${encodeURIComponent(currentUser)}`);
      const allReports = Array.isArray(resAll.data) ? resAll.data : [];
      localStorage.setItem('nyati_cache_my_reports', JSON.stringify(allReports));

      const resRework = await axios.get(`${BASE_URL}/api/rework-reports?user=${encodeURIComponent(currentUser)}`);
      const reworks = Array.isArray(resRework.data) ? resRework.data : [];
      localStorage.setItem('nyati_cache_rework_reports', JSON.stringify(reworks));

      const resHist = await axios.get(`${BASE_URL}/api/history-reports?user=${encodeURIComponent(currentUser)}`);
      const history = Array.isArray(resHist.data) ? resHist.data : [];
      localStorage.setItem('nyati_cache_history_reports', JSON.stringify(history));

      processStats(allReports, reworks, history);
    } catch (err) {
      console.error("Dashboard stats error, loading cache...", err);
      const cachedMy = localStorage.getItem('nyati_cache_my_reports');
      const cachedRework = localStorage.getItem('nyati_cache_rework_reports');
      const cachedHist = localStorage.getItem('nyati_cache_history_reports');
      processStats(
        cachedMy ? JSON.parse(cachedMy) : [],
        cachedRework ? JSON.parse(cachedRework) : [],
        cachedHist ? JSON.parse(cachedHist) : []
      );
    }
  };

  const processStats = (allReports, reworks, history) => {
    const d = new Date();
    const todayString = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const todaySubmissions = allReports.filter(r => r.date === todayString);
    setTodayReports(todaySubmissions);

    const pending = allReports.filter(r => r.status && (r.status.toLowerCase() === 'pending' || r.status === 'Rework Submitted'));
    setPendingReports(pending);
    setReworkReports(reworks);

    const totalItems = history.reduce((acc, r) => acc + (r.items?.length || 0), 0);
    const passedItems = history.reduce((acc, r) => acc + (r.items?.filter(i => i.qeDecision === 'pass').length || 0), 0);
    const compliance = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0;

    setDashboardStats({
      todayTasks: todaySubmissions.length,
      reworkCount: reworks.length,
      compliance: compliance,
      recentActivity: allReports.slice(0, 5)
    });
  };

  const checkPendingReworks = async (isInitial = false) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/rework-reports?user=${encodeURIComponent(currentUser)}`);
      const freshReports = Array.isArray(res.data) ? res.data : [];
      localStorage.setItem('nyati_cache_rework_reports', JSON.stringify(freshReports));
      setReworkReports(freshReports);

      // Keep selectedRework updated if the user has the form open
      setSelectedRework(prev => {
        if (!prev) return null;
        const freshReport = freshReports.find(r => r._id === prev.reportId);
        if (freshReport && freshReport.items && freshReport.items[prev.itemIdx]) {
          return {
            ...freshReport.items[prev.itemIdx],
            reportId: prev.reportId,
            itemIdx: prev.itemIdx
          };
        }
        return prev;
      });
    } catch (err) {
      console.error("Polling error", err);
      const cached = localStorage.getItem('nyati_cache_rework_reports');
      if (cached) {
        const cachedReports = JSON.parse(cached);
        setSelectedRework(prev => {
          if (!prev) return null;
          const freshReport = cachedReports.find(r => r._id === prev.reportId);
          if (freshReport && freshReport.items && freshReport.items[prev.itemIdx]) {
            return {
              ...freshReport.items[prev.itemIdx],
              reportId: prev.reportId,
              itemIdx: prev.itemIdx
            };
          }
          return prev;
        });
      }
    }
  };

  const fetchInitialData = async () => {
    try {
      const [clRes, bldRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/checklist-items`),
        axios.get(`${BASE_URL}/api/buildings`)
      ]);
      // Save to cache
      localStorage.setItem('nyati_cache_checklist_items', JSON.stringify(clRes.data));
      localStorage.setItem('nyati_cache_buildings', JSON.stringify(bldRes.data));

      processChecklistData(clRes.data, bldRes.data);
    } catch (err) {
      console.error("Initial fetch error, loading cache...", err);
      const cachedItems = localStorage.getItem('nyati_cache_checklist_items');
      const cachedBuildings = localStorage.getItem('nyati_cache_buildings');
      if (cachedItems && cachedBuildings) {
        processChecklistData(JSON.parse(cachedItems), JSON.parse(cachedBuildings));
      }
    }
  };

  const processChecklistData = (itemsData, buildingsData) => {
    const grouped = {};
    const sortedItems = [...itemsData].sort((a, b) => (a._id || '').localeCompare(b._id || ''));

    sortedItems.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = {};
      const sub = (item.subCategory || '').toString().trim() || 'General';
      if (!grouped[item.category][sub]) grouped[item.category][sub] = [];
      grouped[item.category][sub].push(item);
    });
    setCategories(Object.entries(grouped).map(([name, stages]) => ({ name, stages })));
    setBuildingOptions([...buildingsData.map(b => b.name)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })));
  };

  const handleSpotInputChange = async (e) => {
    const { name, value } = e.target;
    const updated = { ...spotData, [name]: value };
    if (name === 'buildingArea') {
      updated.floorLevel = '';
      updated.unitType = '';
      try {
        const res = await axios.get(`${BASE_URL}/api/floors?building=${encodeURIComponent(value)}`);
        localStorage.setItem(`nyati_cache_floors_${value}`, JSON.stringify(res.data));
        setFloorOptions(sortFloors(res.data.map(f => f.name)));
      } catch (err) {
        const cached = localStorage.getItem(`nyati_cache_floors_${value}`);
        if (cached) setFloorOptions(sortFloors(JSON.parse(cached).map(f => f.name)));
      }
    } else if (name === 'floorLevel') {
      updated.unitType = '';
      try {
        const res = await axios.get(`${BASE_URL}/api/units?building=${encodeURIComponent(spotData.buildingArea)}&floor=${encodeURIComponent(value)}`);
        localStorage.setItem(`nyati_cache_units_${spotData.buildingArea}_${value}`, JSON.stringify(res.data));
        setUnitTypeOptions(res.data.map(u => u.name));
      } catch (err) {
        const cached = localStorage.getItem(`nyati_cache_units_${spotData.buildingArea}_${value}`);
        if (cached) setUnitTypeOptions(JSON.parse(cached).map(u => u.name));
      }
    }
    setSpotData(updated);
  };

  const toggleCategory = (cat) => {
    const isSelected = selectedCats.find(c => c.name === cat.name);
    if (isSelected) {
      setSelectedCats([]);
      setCategoryStages({});
    } else {
      setSelectedCats([cat]);
      setCategoryStages({});
    }
  }

  const selectStageAndProceed = async (cat, stage) => {
    if (!spotData.buildingArea || !spotData.floorLevel || !spotData.unitType) {
      return alert("Please fill in the building information first!");
    }

    // Optimistically set selections in case checklist view needs them
    setSelectedCats([cat]);
    setCategoryStages({ [cat.name]: stage });

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
      setRejectedQuestions(res.data.rejectedQuestions || []);
      setPendingQuestions(res.data.pendingQuestions || []);
      setView('checklist');
    } catch (err) {
      console.error("Error fetching passed checkpoints", err);
      setPassedQuestions([]);
      setRejectedQuestions([]);
      setView('checklist');
    } finally {
      setLoading(false);
    }
  }

  const handleInitialSubmit = async () => {
    if (!spotData.buildingArea || !spotData.floorLevel || !spotData.unitType) return alert("Please fill in the building information first!");
    if (selectedCats.length === 0) return alert("Please select at least one category!");

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
      setRejectedQuestions(res.data.rejectedQuestions || []);
      setPendingQuestions(res.data.pendingQuestions || []);
      setView('checklist');
    } catch (err) {
      console.error("Error fetching passed checkpoints", err);
      setPassedQuestions([]);
      setRejectedQuestions([]);
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
      Object.entries(cat.stages || {}).forEach(([stageName, items]) => {
        items.forEach(item => {
          const selection = itemSelection[item._id];
          if (selection) {
            reportData.items.push({
              category: cat.name,
              stage: stageName === 'General' ? '' : stageName, // optional
              question: item.questionText,
              status: selection === 'yes' ? 'Completed' : selection === 'no' ? 'Rejected' : 'N/A',
              seDecision: selection,
              submittedAt: reportData.submittedAt
            });
          }
        });
      });
    });
    if (reportData.items.length === 0) return alert("Please select at least one item!");

    if (!navigator.onLine) {
      addToQueue('submit-report', reportData);
      alert('Checklist Queued for Offline Sync!');
      setView('dashboard');
      setSelectedCats([]);
      setItemSelection({});
      setSpotData({ buildingArea: '', floorLevel: '', unitType: '', locationUnit: '' });
      setInspectionStep(1);
      setCategorySearchTerm('');
      fetchDashboardStats();
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/api/submit-report`, reportData)
      if (res.data.success) {
        alert('Checklist Sent to QE!');
        setView('dashboard');
        setSelectedCats([]);
        setItemSelection({});
        setSpotData({ buildingArea: '', floorLevel: '', unitType: '', locationUnit: '' });
        setInspectionStep(1);
        setCategorySearchTerm('');
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
      const reworks = Array.isArray(res.data) ? res.data : [];
      localStorage.setItem('nyati_cache_rework_reports', JSON.stringify(reworks));
      setReworkReports(reworks);
      setView('rework');
      setIsSidebarOpen(false);
    } catch (err) {
      console.error("Rework fetch failed, loading cache...", err);
      const cached = localStorage.getItem('nyati_cache_rework_reports');
      setReworkReports(cached ? JSON.parse(cached) : []);
      setView('rework');
      setIsSidebarOpen(false);
    } finally {
      setLoading(false);
    }
  }

  const fetchPendingReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/my-reports?user=${encodeURIComponent(currentUser)}`);
      const reports = Array.isArray(res.data) ? res.data : [];
      localStorage.setItem('nyati_cache_my_reports', JSON.stringify(reports));
      setPendingReports(reports.filter(r => r.status && r.status.toLowerCase() === 'pending'));
      setView('pending-approval');
      setIsSidebarOpen(false);
    } catch (err) {
      console.error("Pending fetch failed, loading cache...", err);
      const cached = localStorage.getItem('nyati_cache_my_reports');
      const reports = cached ? JSON.parse(cached) : [];
      setPendingReports(reports.filter(r => r.status && r.status.toLowerCase() === 'pending'));
      setView('pending-approval');
      setIsSidebarOpen(false);
    } finally {
      setLoading(false);
    }
  }

  const fetchHistoryReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/history-reports?user=${encodeURIComponent(currentUser)}`);
      const history = Array.isArray(res.data) ? res.data : [];
      localStorage.setItem('nyati_cache_history_reports', JSON.stringify(history));
      setHistoryReports(history);
      setView('history');
      setIsSidebarOpen(false);
    } catch (err) {
      console.error("History fetch failed, loading cache...", err);
      const cached = localStorage.getItem('nyati_cache_history_reports');
      setHistoryReports(cached ? JSON.parse(cached) : []);
      setView('history');
      setIsSidebarOpen(false);
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
    const headers = ['Sr.No', 'Checklist', 'Check Point', 'Location', 'Site Engineer Name', 'Date & Time (Site Engineer)', 'Quality Engineer Name', 'Date & Time (Quality Engineer)', 'Remark']

    let srNo = 1;
    const body = reportData.flatMap(r =>
      r.items.map(it => {
        let remark = 'Pending';
        if (it.qeDecision === 'pass') remark = 'Approved';
        else if (it.qeDecision === 'fail' && r.status === 'Approved') remark = 'Rework Pass';
        else if (it.qeDecision === 'fail' && r.status === 'Returned') remark = 'Rework Reject';

        return [
          srNo++,
          it.category,
          it.question || it.questionText || '-',
          `${r.block} | ${r.floor} | ${r.location}`,
          r.submittedBy,
          r.submittedAt || r.date,
          r.qeName || '-',
          r.updatedAt || '-',
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

  const handleItemCheckboxChange = (itemId, value) => {
    if (value === undefined) {
      setItemSelection(prev => {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      });
    } else {
      setItemSelection(prev => ({ ...prev, [itemId]: value }));
    }
  };

  const openReworkForm = (item, reportId, itemIdx) => {
    setSelectedRework({ ...item, reportId, itemIdx });
    setReworkPhotos([]);
    setReworkRemark('');
    setShowReworkHistory(false);
    setView('rework-form');
  }

  const handleReworkPhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setReworkPhotos(prev => [...prev, ...files.map(f => ({ file: f, url: URL.createObjectURL(f) }))]);
  }

  const submitRework = async () => {
    if (!reworkRemark) return alert("Please enter a remark!");

    if (!navigator.onLine) {
      setLoading(true);
      try {
        const mediaFiles = [];
        for (const p of reworkPhotos) {
          const base64Data = await fileToBase64(p.file);
          mediaFiles.push({
            filename: p.file.name,
            type: p.file.type,
            data: base64Data
          });
        }

        const payload = {
          id: selectedRework.reportId,
          itemsData: [{
            index: selectedRework.itemIdx,
            reworkRemark: reworkRemark,
            fileCount: reworkPhotos.length
          }],
          mediaFiles: mediaFiles
        };

        addToQueue('submit-rework', payload);
        alert("Rework Queued for Offline Sync!");
        fetchReworkReports();
        fetchDashboardStats();
      } catch (err) {
        console.error(err);
        alert("Rework queue failed!");
      } finally {
        setLoading(false);
      }
      return;
    }

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
      {!isOnline && (
        <div className="bg-red-600 text-white text-[11px] font-black tracking-widest text-center py-2 px-4 uppercase sticky top-0 z-[9999] shadow-md flex items-center justify-center gap-2 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-white"></span>
          <span>Offline Mode — Actions will sync automatically when online</span>
        </div>
      )}
      {syncing && (
        <div className="bg-green-600 text-white text-[11px] font-black tracking-widest text-center py-2 px-4 uppercase sticky top-0 z-[9999] shadow-md flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
          <span>Syncing offline actions to server...</span>
        </div>
      )}

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
          <img src="/logo.png" alt="Logo" className="h-[44px] w-auto" />
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
              <h2 className="text-[18px] font-black text-gray-900 uppercase truncate leading-tight">{currentUser}</h2>
              <div className="flex flex-col gap-0.5 mt-1">
                <span className="text-[12px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div> {role}</span>
                <span className="text-[11px] font-black text-gray-700 uppercase truncate tracking-tight"><FontAwesomeIcon icon={faCalendarAlt} className="mr-1 text-[#004080]" /> {project}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center active:scale-95 transition-all cursor-pointer" onClick={() => setView('today-tasks')}>
              <div className="w-10 h-10 bg-blue-50 rounded-full mx-auto flex items-center justify-center mb-2"><FontAwesomeIcon icon={faListAlt} className="text-[#004080]" /></div>
              <p className="text-2xl font-black text-gray-900">{dashboardStats.todayTasks}</p>
              <p className="text-[11px] font-bold text-gray-700 uppercase">Today's Checklist</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center border-b-4 border-b-red-500 active:scale-95 transition-all cursor-pointer" onClick={fetchReworkReports}>
              <div className="w-10 h-10 bg-red-50 rounded-full mx-auto flex items-center justify-center mb-2"><FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500" /></div>
              <p className="text-2xl font-black text-red-600">{dashboardStats.reworkCount}</p>
              <p className="text-[11px] font-bold text-gray-700 uppercase">Reworks</p>
            </div>
          </div>

          <div className="mb-20">
            <div className="flex justify-between mb-4"><h3 className="text-[13px] font-bold text-gray-700 uppercase tracking-widest pl-1">Recent Activity</h3></div>
            <div className="space-y-3">
              {dashboardStats.recentActivity.filter(r => {
                const s = (r.status || '').toString().toLowerCase();
                return s === 'approved' || s === 'returned';
              }).length > 0 ? dashboardStats.recentActivity.filter(r => {
                const s = (r.status || '').toString().toLowerCase();
                return s === 'approved' || s === 'returned';
              }).map((r, i) => {
                const hasFailure = Array.isArray(r.items) && r.items.some(item => item.qeDecision === 'fail');
                const isPass = r.status === 'Approved' && !hasFailure;
                return (
                  <div key={i} className="bg-white p-3.5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPass ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      <FontAwesomeIcon icon={isPass ? faCheckCircle : faExclamationTriangle} className="text-sm" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[12px] font-black text-gray-800 truncate leading-tight uppercase">
                        {[r.block, r.floor, r.unitType].filter(Boolean).join(' | ')}
                      </p>
                      <p className="text-[11px] font-bold text-gray-700 mt-1 uppercase tracking-tighter">
                        <span className="text-blue-600">{r.submittedAt || r.date}</span>
                        <span className="text-gray-400 mx-1.5">•</span>
                        <span>{r.location || 'N/A'}</span>
                      </p>
                    </div>
                    <div className={`text-[12px] font-black uppercase tracking-widest ${isPass ? 'text-green-500' : 'text-red-500'}`}>
                      {isPass ? 'PASS' : 'FAIL'}
                    </div>
                  </div>
                );
              }) : <div className="text-center py-10 text-gray-300 text-[12px] uppercase font-bold">No recent activity</div>}
            </div>
          </div>
          <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 max-w-md mx-auto"><button onClick={() => { setView('main'); setInspectionStep(1); setCategorySearchTerm(''); setSpotData({ buildingArea: '', floorLevel: '', unitType: '', locationUnit: '' }); setSelectedCats([]); setCategoryStages({}); setItemSelection({}); }} className="bg-[#004080] text-white shadow-2xl px-10 py-5 rounded-3xl font-black text-base uppercase tracking-widest flex items-center gap-4 active:scale-95 transition-all outline outline-4 outline-white/20"><FontAwesomeIcon icon={faPlus} /> Start Inspection</button></div>
        </div>
      )}

      {/* INSPECTION VIEW */}
      {view === 'main' && (
        <div className="animate-in fade-in duration-500">
          {inspectionStep === 1 ? (
            <>
              <div className="p-4"><button onClick={() => setView('dashboard')} className="mb-4 text-[#004080] font-black text-sm uppercase"><FontAwesomeIcon icon={faArrowLeft} /> Dashboard</button></div>
              <div className="px-6 space-y-8">
                <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-200">
                  <SearchableSelect label="Building" placeholder="Select Building" options={buildingOptions} value={spotData.buildingArea} onChange={(v) => handleSpotInputChange({ target: { name: 'buildingArea', value: v } })} />
                  <SearchableSelect label="Floor" placeholder="Select Floor" options={floorOptions} value={spotData.floorLevel} onChange={(v) => handleSpotInputChange({ target: { name: 'floorLevel', value: v } })} />
                  <SearchableSelect label="Area" placeholder="Select Area" options={unitTypeOptions} value={spotData.unitType} onChange={(v) => handleSpotInputChange({ target: { name: 'unitType', value: v } })} />
                  <div className="space-y-1"><label className="text-[13px] font-bold text-[#004080] uppercase ml-1">Location</label><input name="locationUnit" value={spotData.locationUnit} onChange={handleSpotInputChange} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-base font-bold text-gray-900 placeholder:font-normal" placeholder="Column: C1,C2, C3..." /></div>
                </div>
                <button
                  onClick={() => {
                    if (!spotData.buildingArea || !spotData.floorLevel || !spotData.unitType) {
                      return alert("Please fill in the building information first!");
                    }
                    setInspectionStep(2);
                  }}
                  className="w-full py-4 bg-[#004080] text-white font-black rounded-xl uppercase shadow-lg shadow-blue-200 tracking-widest text-base translate-y-4"
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="p-4"><button onClick={() => setInspectionStep(1)} className="mb-4 text-[#004080] font-black text-sm uppercase"><FontAwesomeIcon icon={faArrowLeft} /> Location Details</button></div>
              <div className="px-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-[#004080] font-black text-sm uppercase border-l-4 border-[#004080] pl-2 ml-1">Categories</h3>

                  {/* Search Bar */}
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-[#004080] focus:ring-1 focus:ring-blue-50 transition-all font-bold"
                      placeholder="Search Categories..."
                      value={categorySearchTerm}
                      onChange={(e) => setCategorySearchTerm(e.target.value)}
                    />
                    <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    {categorySearchTerm && (
                      <button
                        onClick={() => setCategorySearchTerm('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    )}
                  </div>

                  {/* Categories List (Rendered directly) */}
                  <div className="bg-white border border-gray-200 rounded-xl shadow-xl divide-y divide-gray-100 mb-28">
                    {categories.filter(c => c.name.toLowerCase().includes(categorySearchTerm.toLowerCase())).length > 0 ? (
                      categories
                        .filter(c => c.name.toLowerCase().includes(categorySearchTerm.toLowerCase()))
                        .map((c, i) => {
                          const isSelected = selectedCats.find(s => s.name === c.name);
                          return (
                            <div key={i} className="p-1">
                              <div
                                onClick={() => toggleCategory(c)}
                                className={`p-3.5 flex justify-between items-center cursor-pointer rounded-lg transition-colors ${isSelected ? 'bg-blue-50 border border-blue-100 shadow-sm' : 'hover:bg-gray-50'}`}
                              >
                                <span className={`text-sm font-black ${isSelected ? 'text-[#004080]' : 'text-gray-700'}`}>{c.name}</span>
                                <FontAwesomeIcon
                                  icon={isSelected ? faChevronUp : faChevronDown}
                                  className={isSelected ? 'text-[#004080]' : 'text-gray-400'}
                                />
                              </div>

                              {/* STAGE SELECTION LIST - Compact Vertical stack */}
                              {isSelected && (
                                <div className="mx-3 mb-3 p-3 bg-white border border-blue-50 rounded-xl animate-in fade-in slide-in-from-top-1 duration-300 shadow-inner">
                                  <div className="flex flex-col gap-2">
                                    {['Pre Work', 'Pour Card', 'During Work', 'After Work']
                                      .filter(stage => c.stages && c.stages[stage] && c.stages[stage].length > 0)
                                      .map(stage => {
                                        const isStageSelected = categoryStages[c.name] === stage;
                                        return (
                                          <button
                                            key={stage}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              selectStageAndProceed(c, stage);
                                            }}
                                            className={`w-full px-4 py-3 rounded-xl text-[12px] font-black uppercase transition-all flex items-center justify-between border ${isStageSelected
                                              ? 'bg-[#004080] text-white border-[#004080] shadow-md'
                                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                              }`}
                                          >
                                            <span>{stage}</span>
                                            {isStageSelected ? (
                                              <FontAwesomeIcon icon={faCheckCircle} className="text-white text-xs" />
                                            ) : (
                                              <div className="w-4 h-4 rounded-full border-2 border-gray-200"></div>
                                            )}
                                          </button>
                                        );
                                      })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                    ) : (
                      <div className="p-8 text-center text-sm text-gray-400 font-bold uppercase tracking-wider">No categories found</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* CHECKLIST VIEW */}
      {view === 'checklist' && (
        <div className="p-4 animate-in slide-in-from-right duration-500">
          <button onClick={() => { setView('main'); setInspectionStep(2); }} className="mb-6 text-[#004080] font-bold text-sm"><FontAwesomeIcon icon={faArrowLeft} /> Back</button>
          <div className="space-y-6">
            {selectedCats.map((cat, ci) => (
              <div key={ci} className="border rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-[#004080] text-white p-4 font-black text-[12px] uppercase">
                  <span>{cat.name}</span>
                </div>
                <div className="p-4 space-y-8 bg-gray-50">
                  {Object.entries(cat.stages || {})
                    .filter(([stageName]) => {
                      const selectedStage = categoryStages[cat.name];
                      if (!selectedStage) return true; // Show all if none selected

                      // Strict matching for selected stage
                      // We only show 'General' items if they were specifically selected (if we add that)
                      // or if no specific stage is chosen.
                      return stageName === selectedStage;
                    })
                    .map(([stageName, items], si) => (
                      <div key={si} className="space-y-4">
                        {stageName !== 'General' && (
                          <h4 className="text-[12px] font-black text-gray-700 uppercase tracking-widest border-b border-gray-300 pb-1 mb-2 italic">
                            Stage: {stageName}
                          </h4>
                        )}
                        <div className="space-y-3">
                          {items.map((it, ii) => {
                            const cleanQ = (it.questionText || '').toString().trim().toLowerCase();
                            const isPassed = Array.isArray(passedQuestions) && passedQuestions.some(q => q.toString().trim().toLowerCase() === cleanQ);
                            const isRejected = Array.isArray(rejectedQuestions) && rejectedQuestions.some(q => q.toString().trim().toLowerCase() === cleanQ) && !isPassed;
                            const isPending = Array.isArray(pendingQuestions) && pendingQuestions.some(q => q.toString().trim().toLowerCase() === cleanQ) && !isPassed && !isRejected;
                            return (
                              <div key={ii}>
                                {isPassed ? (
                                  <div className="p-4 rounded-xl border bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed">
                                    <div className="flex items-center gap-2">
                                      <span className="text-green-500 text-sm">✅</span>
                                      <label className="text-sm text-gray-400 line-through leading-tight block font-semibold">
                                        {it.questionText}
                                      </label>
                                    </div>
                                    <span className="text-[11px] text-green-600 font-black">Already Cleared by QE</span>
                                  </div>
                                ) : isRejected ? (
                                  <div className="p-4 rounded-xl border bg-red-50 border-red-100 opacity-70 cursor-not-allowed">
                                    <div className="flex items-center gap-2">
                                      <span className="text-red-500 text-sm">❌</span>
                                      <label className="text-sm text-red-400 line-through leading-tight block font-semibold">
                                        {it.questionText}
                                      </label>
                                    </div>
                                    <span className="text-[11px] text-red-600 font-black">Rejected by Quality Engineer</span>
                                  </div>
                                ) : isPending ? (
                                  <div className="p-4 rounded-xl border bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed">
                                    <div className="flex items-center gap-2">
                                      <span className="text-orange-400 text-sm">⏳</span>
                                      <label className="text-sm text-gray-400 leading-tight block font-semibold">
                                        {it.questionText}
                                      </label>
                                    </div>
                                    <span className="text-[11px] text-orange-600 font-black">Awaiting QE Action</span>
                                  </div>
                                ) : (
                                  <div
                                    className={`p-4 rounded-xl border transition-all duration-300 flex justify-between items-center ${itemSelection[it._id] === 'yes' ? 'bg-green-50 border-green-200 shadow-sm' : itemSelection[it._id] === 'no' ? 'bg-red-50 border-red-200 shadow-sm' : itemSelection[it._id] === 'na' ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-white border-gray-100 shadow-sm'}`}
                                  >
                                    <label className={`text-sm font-bold leading-tight block flex-1 ${itemSelection[it._id] === 'yes' ? 'text-green-800' : itemSelection[it._id] === 'no' ? 'text-red-800' : itemSelection[it._id] === 'na' ? 'text-orange-700' : 'text-gray-800'}`}>
                                      {it.questionText}
                                    </label>
                                    <StatusSelector
                                      itemId={it._id}
                                      value={itemSelection[it._id]}
                                      onChange={(id, val) => handleItemCheckboxChange(id, val)}
                                      isPassed={false}
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
              </div>
            ))}
          </div>
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t max-w-md mx-auto z-40"><button onClick={submitFinalReport} className="w-full py-4 bg-green-600 text-white font-black rounded-xl uppercase shadow-xl flex items-center justify-center gap-2 tracking-widest text-base" disabled={loading}><FontAwesomeIcon icon={loading ? faUpload : faCheckCircle} /> {loading ? 'Submitting...' : 'Submit to QE'}</button></div>
        </div>
      )}

      {/* REWORK VIEW */}
      {view === 'rework' && (
        <div className="p-4 animate-in slide-in-from-left duration-300 mb-10">
          <button onClick={() => setView('dashboard')} className="mb-4 text-[#004080] font-bold text-base"><FontAwesomeIcon icon={faArrowLeft} /> Back</button>
          <div className="flex items-center gap-2 mb-6 border-l-4 border-red-500 pl-3">
            <h2 className="text-base font-black text-red-600 uppercase">Pending Rejections</h2>
            <span className="bg-red-100 text-red-600 text-[12px] px-2 py-0.5 rounded-full font-bold">{reworkReports.length}</span>
          </div>
          <div className="space-y-4">
            {reworkReports.map((r, ri) => (
              <div key={ri} className="bg-white border rounded-2xl overflow-hidden shadow-sm border-t-4 border-t-red-500">
                <div className="bg-red-50 p-3.5 flex justify-between items-center">
                  <div className="text-[12px] font-medium text-red-700 leading-tight">
                    {[r.block, r.floor, r.unitType].filter(Boolean).join(' | ')}
                    {r.location ? ` • ${r.location}` : ''}
                  </div>
                  <div className="text-[11px] text-gray-700 font-bold shrink-0">
                    {r.submittedAt || r.date}
                  </div>
                </div>
                <div className="divide-y">
                  {r.items.map((it, ii) => it.qeDecision === 'fail' && (
                    <div key={ii} className="p-4 cursor-pointer hover:bg-red-50/50 flex justify-between items-center" onClick={() => openReworkForm(it, r._id, ii)}>
                      <div className="flex-1 pr-4">
                        <p className="text-[13px] font-bold text-gray-800 leading-snug">{it.question}</p>
                        <p className="text-[10px] text-red-500 font-black mt-1 uppercase tracking-wider">REWORK REQUIRED</p>
                      </div>
                      <FontAwesomeIcon icon={faChevronDown} className="text-gray-400 -rotate-90 text-sm" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REWORK FORM */}
      {view === 'rework-form' && selectedRework && (
        <div className="p-4 animate-in slide-in-from-bottom duration-400 mb-32 text-left">
          <button onClick={fetchReworkReports} className="mb-6 text-[#004080] font-bold text-sm tracking-tight flex items-center gap-2">
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
                      <p className="text-[14px] font-medium text-gray-800 leading-tight bg-white p-3 rounded-xl border border-red-100/50 shadow-sm">
                        {selectedRework.observation || 'Please check quality again.'}
                      </p>
                    </div>

                    {selectedRework.qeRemark && (
                      <div>
                        <p className="text-[9px] font-black text-red-400 uppercase tracking-tighter mb-1">Quality Engineer Remarks</p>
                        <p className="text-[14px] font-medium text-gray-800 bg-white p-3 rounded-xl border border-red-100/50 shadow-sm leading-relaxed">
                          {selectedRework.qeRemark}
                        </p>
                      </div>
                    )}

                    {selectedRework.mediaUrls && selectedRework.mediaUrls.length > 0 && (
                      <div className="pt-2">
                        <p className="text-[9px] font-black text-red-400 uppercase tracking-tighter mb-2">Evidence from QE</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedRework.mediaUrls.map((p, i) => (
                            <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform" onClick={() => setZoomImage(getImageUrl(p))}>
                              <img src={getImageUrl(p)} className="w-full h-full object-cover" alt="qe evidence" onError={(e) => e.target.src = "https://via.placeholder.com/100?text=Error"} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* HISTORICAL REWORK CHAT (WhatsApp-like bubble chat history) */}
              {(() => {
                const historyRounds = selectedRework?.history ? selectedRework.history.slice(0, -1) : [];
                if (historyRounds.length === 0) return null;
                return (
                  <div className="space-y-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 animate-in slide-in-from-top duration-350">
                    <div className="space-y-6">
                      {historyRounds.map((h, i) => (
                        <div key={i} className="space-y-4">
                          {/* Round Separator Tag */}
                          <div className="flex justify-center my-2">
                            <span className="bg-gray-200/80 text-gray-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                              Round {h.round}
                            </span>
                          </div>

                          {/* QE Rejection Bubble (Left) */}
                          <div className="flex flex-col items-start max-w-[90%]">
                            <div className="flex items-center gap-1.5 mb-1 ml-1 text-gray-500 text-[10px] font-bold">
                              <FontAwesomeIcon icon={faUserCircle} className="text-red-500" />
                              <span>Quality Engineer</span>
                              <span className="text-[9px] opacity-70">• {h.submittedAt || h.date}</span>
                            </div>
                            <div className="bg-red-50 border border-red-100/50 rounded-2xl rounded-tl-none p-3 shadow-sm w-full">
                              <div className="space-y-2.5 text-left">
                                <div>
                                  <p className="text-[8px] font-black text-red-500 uppercase tracking-wider mb-0.5">Issue Observed</p>
                                  <p className="text-[12px] font-medium text-gray-800 bg-white p-2 rounded-lg border border-red-50/50">
                                    {h.observation || 'Please check quality again.'}
                                  </p>
                                </div>
                                {h.qeRemark && (
                                  <div>
                                    <p className="text-[8px] font-black text-red-500 uppercase tracking-wider mb-0.5">QE Remarks</p>
                                    <p className="text-[12px] font-medium text-gray-800 bg-white p-2 rounded-lg border border-red-50/50">
                                      {h.qeRemark}
                                    </p>
                                  </div>
                                )}
                                {h.mediaUrls && h.mediaUrls.length > 0 && (
                                  <div className="pt-1">
                                    <p className="text-[8px] font-black text-red-500 uppercase tracking-wider mb-1">Evidence from QE</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {h.mediaUrls.map((p, idx) => (
                                        <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-white shadow-sm cursor-pointer" onClick={() => setZoomImage(getImageUrl(p))}>
                                          <img src={getImageUrl(p)} className="w-full h-full object-cover" alt="qe history evidence" onError={(e) => e.target.src = "https://via.placeholder.com/80?text=Error"} />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* SE Fix Bubble (Right) */}
                          {(h.reworkRemark || (h.reworkMediaUrls && h.reworkMediaUrls.length > 0)) && (
                            <div className="flex flex-col items-end ml-auto max-w-[90%]">
                              <div className="flex items-center gap-1.5 mb-1 mr-1 text-gray-500 text-[10px] font-bold">
                                <span className="text-[9px] opacity-70">{h.submittedAt || h.date} •</span>
                                <span>Site Engineer</span>
                                <FontAwesomeIcon icon={faUserCircle} className="text-green-600" />
                              </div>
                              <div className="bg-green-50 border border-green-100/50 rounded-2xl rounded-tr-none p-3 shadow-sm w-full">
                                <div className="space-y-2.5 text-left">
                                  {h.reworkRemark && (
                                    <div>
                                      <p className="text-[8px] font-black text-green-600 uppercase tracking-wider mb-0.5">Work Completion Report</p>
                                      <p className="text-[12px] font-medium text-gray-800 bg-white p-2 rounded-lg border border-green-50/50">
                                        {h.reworkRemark}
                                      </p>
                                    </div>
                                  )}
                                  {h.reworkMediaUrls && h.reworkMediaUrls.length > 0 && (
                                    <div className="pt-1">
                                      <p className="text-[8px] font-black text-green-600 uppercase tracking-wider mb-1">Evidence from SE</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {h.reworkMediaUrls.map((p, idx) => (
                                          <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-white shadow-sm cursor-pointer" onClick={() => setZoomImage(getImageUrl(p))}>
                                            <img src={getImageUrl(p)} className="w-full h-full object-cover" alt="se history evidence" onError={(e) => e.target.src = "https://via.placeholder.com/80?text=Error"} />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* SE INPUT SECTION */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-700 uppercase ml-1 flex justify-between">
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
                    <label className="text-[10px] font-black text-gray-700 uppercase ml-1">Fix Evidence Photos</label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {reworkPhotos.map((p, i) => (
                      <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-xl group cursor-pointer" onClick={() => setZoomImage(p.url)}>
                        <img src={p.url} className="w-full h-full object-cover" />
                        <button onClick={(e) => { e.stopPropagation(); setReworkPhotos(prev => prev.filter((_, idx) => idx !== i)); }} className="absolute top-1 right-1 bg-red-600/90 text-white w-7 h-7 rounded-xl flex items-center justify-center text-[10px] shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    ))}
                    {reworkPhotos.length > 0 && (
                      <label className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors shrink-0">
                        <FontAwesomeIcon icon={faCamera} className="text-lg mb-1" />
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Add More</span>
                        <input type="file" multiple className="hidden" onChange={handleReworkPhotoChange} />
                      </label>
                    )}
                    {reworkPhotos.length === 0 && (
                      <label className="w-full py-10 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-300 cursor-pointer hover:bg-gray-50 transition-colors">
                        <FontAwesomeIcon icon={faCamera} size="2x" className="mb-2 opacity-50 text-[#004080]" />
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-50">At least one photo required</p>
                        <input type="file" multiple className="hidden" onChange={handleReworkPhotoChange} />
                      </label>
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
                <button onClick={() => {}} className="flex items-center gap-2 bg-green-600 text-white text-[10px] font-black px-4 py-2 rounded-lg shadow"><FontAwesomeIcon icon={faUpload} /> Export Excel</button>
              </div>

              {reportData.length === 0 ? (
                <div className="text-center py-16 text-gray-300 uppercase text-[10px] font-bold">No Records Found</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                  <table className="w-full text-[11px] font-medium border-collapse">
                    <thead>
                      <tr className="bg-[#004080] text-white uppercase tracking-wider text-[10px] leading-tight">
                        <th className="p-2 text-center border-r border-blue-700 font-bold whitespace-nowrap">Sr.No</th>
                        <th className="p-2 text-center border-r border-blue-700 font-bold">Checklist</th>
                        <th className="p-2 text-center border-r border-blue-700 font-bold min-w-[120px]">Check<br />Point</th>
                        <th className="p-2 text-center border-r border-blue-700 font-bold">Location</th>
                        <th className="p-2 text-center border-r border-blue-700 font-bold min-w-[90px]">Site Engineer<br />Name</th>
                        <th className="p-2 text-center border-r border-blue-700 font-bold min-w-[100px]">Date & Time<br />(Site Engineer)</th>
                        <th className="p-2 text-center border-r border-blue-700 font-bold min-w-[90px]">Quality Engineer<br />Name</th>
                        <th className="p-2 text-center border-r border-blue-700 font-bold min-w-[100px]">Date & Time<br />(Quality Engineer)</th>
                        <th className="p-2 text-center font-bold">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-[11px] font-medium text-gray-800">
                      {(() => {
                        let srNo = 1;
                        const formatDateTime = (val) => {
                          if (!val || val === '-') return '-';
                          const str = String(val);
                          if (str.includes(',')) {
                            const parts = str.split(',');
                            return (
                              <div className="flex flex-col items-center leading-tight">
                                <span className="whitespace-nowrap">{parts[0].trim()}</span>
                                <span className="text-[10px] text-gray-500 whitespace-nowrap">{parts.slice(1).join(',').trim()}</span>
                              </div>
                            );
                          }
                          if (str.includes(' ')) {
                            const idx = str.indexOf(' ');
                            return (
                              <div className="flex flex-col items-center leading-tight">
                                <span className="whitespace-nowrap">{str.slice(0, idx).trim()}</span>
                                <span className="text-[10px] text-gray-500 whitespace-nowrap">{str.slice(idx + 1).trim()}</span>
                              </div>
                            );
                          }
                          return val;
                        };

                        return reportData.flatMap((report, rIdx) =>
                          report.items.map((item, iIdx) => {
                            let remark = 'Pending';
                            let remarkColor = 'text-orange-500';
                            if (item.qeDecision === 'pass') { remark = 'Approved'; remarkColor = 'text-green-600'; }
                            else if (item.qeDecision === 'fail' && report.status === 'Approved') { remark = 'Rework Pass'; remarkColor = 'text-blue-600'; }
                            else if (item.qeDecision === 'fail' && report.status === 'Returned') { remark = 'Rework Reject'; remarkColor = 'text-red-600'; }

                            return (
                              <tr key={`${rIdx}-${iIdx}`} className={srNo % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                <td className="p-2 border-r font-semibold text-gray-700 text-center">{srNo++}</td>
                                <td className="p-2 border-r font-bold text-[#004080] text-center whitespace-normal min-w-[90px]">{item.category}</td>
                                <td className="p-2 border-r font-medium text-gray-900 text-center min-w-[140px]">{item.question || item.questionText || '-'}</td>
                                <td className="p-2 border-r font-medium text-gray-700 text-center min-w-[110px]">{report.block} | {report.floor} | {report.location}</td>
                                <td className="p-2 border-r font-medium text-gray-800 text-center">{report.submittedBy}</td>
                                <td className="p-2 border-r font-medium text-gray-700 text-center">{formatDateTime(report.submittedAt || report.date)}</td>
                                <td className="p-2 border-r font-medium text-gray-800 text-center">{report.qeName || '-'}</td>
                                <td className="p-2 border-r font-medium text-gray-700 text-center">{formatDateTime(report.updatedAt)}</td>
                                <td className={`p-2 font-bold text-center whitespace-nowrap ${remarkColor}`}>{remark}</td>
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

      {/* --- IMAGE ZOOM MODAL --- */}
      {zoomImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center cursor-zoom-out"
          onClick={() => setZoomImage(null)}
        >
          <span className="absolute top-4 right-5 text-white text-3xl font-bold cursor-pointer">&times;</span>
          <img
            src={zoomImage}
            className="max-w-[95%] max-h-[85vh] rounded-xl border-4 border-white/10 shadow-2xl object-contain animate-in zoom-in duration-200"
            alt="Zoomed View"
          />
        </div>
      )}

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