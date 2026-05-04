import { useState, useEffect } from 'react'
import axios from 'axios'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronDown, faChevronUp, faCheckCircle, faTimesCircle, faClock,
  faBars, faTimes, faSignOutAlt, faUserCircle, faInfoCircle, faCamera, faCalendarAlt, faEdit, faUserTie, faTrash, faHistory, faHome, faArrowLeft, faImage, faExternalLinkAlt, faSearchPlus, faUserShield, faUserGear, faUpload, faExclamationTriangle, faChartLine, faListAlt
} from '@fortawesome/free-solid-svg-icons'

import BASE_URL from '../config'

function QEIndex() {
  const userStr = localStorage.getItem('nyati_user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [pendingReports, setPendingReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const [view, setView] = useState('dashboard') // 'dashboard', 'main', 'reworks', 'rework-detail'
  const [reworkFilter, setReworkFilter] = useState('approval') // 'approval' or 'waiting'
  const [dashboardStats, setDashboardStats] = useState({
    pendingReview: 0,
    todayChecklist: 0,
    waitingRework: 0,
    projectHealth: { approved: 85, pending: 10, returned: 5 }
  });
  const [reworkApprovals, setReworkApprovals] = useState([])
  const [returnedReports, setReturnedReports] = useState([])
  const [selectedRework, setSelectedRework] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [filterType, setFilterType] = useState('all') // 'all', 'today', 'pending'
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [activeItemIdx, setActiveItemIdx] = useState(null);

  const [buildingOptions, setBuildingOptions] = useState([]);
  const [floorOptions, setFloorOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);

  const [rejectFormData, setRejectFormData] = useState({
    observation: '',
    remark: '',
    mediaFiles: []
  });

  const currentUser = user?.fullName || 'QE User'
  const role = "Quality Engineer"
  const projectSite = user?.siteName || "Nyati Unitree"

  useEffect(() => {
    fetchInitialData();
    fetchPendingReports();
    fetchDashboardStats();

    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const [resPending, resRework, resReturned] = await Promise.allSettled([
        axios.get(`${BASE_URL}/api/all-reports`),
        axios.get(`${BASE_URL}/api/qe/rework-approvals`),
        axios.get(`${BASE_URL}/api/qe/returned-reports`)
      ]);

      const pending = resPending.status === 'fulfilled' && Array.isArray(resPending.value.data) ? resPending.value.data : [];
      const reworks = resRework.status === 'fulfilled' && Array.isArray(resRework.value.data) ? resRework.value.data : [];
      const returned = resReturned.status === 'fulfilled' && Array.isArray(resReturned.value.data) ? resReturned.value.data : [];

      setPendingReports(pending);
      setReworkApprovals(reworks);
      setReturnedReports(returned);

      const d = new Date();
      const today = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

      const todayCount = pending.filter(r => r.date === today).length;
      const olderCount = pending.filter(r => r.date !== today).length;

      setDashboardStats({
        pendingReview: olderCount,
        todayChecklist: todayCount,
        waitingRework: returned.length,
        projectHealth: {
          approved: 85,
          pending: 10,
          returned: 5
        }
      });
    } catch (err) {
      console.error("QE Dash stats error", err);
    }
  };

  const fetchInitialData = async () => {
    try {
      const [resBld, resFlr, resUnit] = await Promise.all([
        axios.get(`${BASE_URL}/api/buildings`),
        axios.get(`${BASE_URL}/api/floors`),
        axios.get(`${BASE_URL}/api/units`)
      ]);
      setBuildingOptions(resBld.data.map(b => b.name));
      setFloorOptions(resFlr.data.map(f => f.name));
      setUnitOptions(resUnit.data.map(u => u.name));
    } catch (err) {
      console.error("QE Filters load karne mein error!", err);
    }
  };

  const fetchPendingReports = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/all-reports`)
      setPendingReports(Array.isArray(res.data) ? res.data : [])
      setLoading(false)
    } catch (err) {
      console.error("Error fetching reports", err)
      setLoading(false)
    }
  }

  const fetchReworkApprovals = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/qe/rework-approvals`);
      setReworkApprovals(Array.isArray(res.data) ? res.data : []);
      setView('reworks');
      setIsSidebarOpen(false);
    } catch (err) {
      alert("Rework data fetch karne mein error!");
    } finally {
      setLoading(false);
    }
  }

  const handleReworkDecision = async (status) => {
    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/api/qe/rework-final-status`, {
        reportId: selectedRework._id,
        status: status,
        updatedAt: new Date().toLocaleString('en-GB', { hour12: true })
      });
      if (res.data.success) {
        alert(`Rework ${status} successfully!`);
        setView('reworks');
        fetchReworkApprovals();
      }
    } catch (err) {
      alert("Status update failed!");
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newMedia = files.map(file => ({
      file: file,
      previewUrl: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image'
    }));
    setRejectFormData(prev => ({
      ...prev,
      mediaFiles: [...prev.mediaFiles, ...newMedia]
    }));
  };

  const removeMedia = (index) => {
    const updatedMedia = rejectFormData.mediaFiles.filter((_, i) => i !== index);
    setRejectFormData({ ...rejectFormData, mediaFiles: updatedMedia });
  };

  const handleDecision = (idx, decision) => {
    const updated = { ...selectedReport };
    const currentDecision = updated.items[idx].qeDecision;
    if (decision === 'Reject') {
      if (currentDecision === 'Reject') {
        updated.items[idx].qeDecision = null;
        updated.items[idx].rejectDetails = null;
        setSelectedReport(updated);
      } else {
        setActiveItemIdx(idx);
        setIsRejectModalOpen(true);
      }
    } else {
      if (currentDecision === 'Approve') {
        updated.items[idx].qeDecision = null;
      } else {
        updated.items[idx].qeDecision = decision;
        updated.items[idx].rejectDetails = null;
      }
      setSelectedReport(updated);
    }
  }

  const saveRejectDetails = () => {
    const updated = { ...selectedReport };
    updated.items[activeItemIdx].qeDecision = 'Reject';
    updated.items[activeItemIdx].rejectDetails = { ...rejectFormData };
    setSelectedReport(updated);
    setIsRejectModalOpen(false);
    setRejectFormData({ observation: '', remark: '', mediaFiles: [] });
  }

  const handleLogout = () => {
    localStorage.removeItem('nyati_user')
    window.location.href = '/'
  }

  const submitFinalDecision = async () => {
    if (!selectedReport) return;
    const allDecided = selectedReport.items.every(i => i.qeDecision);
    if (!allDecided) return alert("Saare items ka decision karein!");

    const finalStatus = selectedReport.items.some(i => i.qeDecision === 'Reject') ? 'Returned' : 'Approved';

    const formData = new FormData();
    formData.append('id', selectedReport._id);
    formData.append('overallStatus', finalStatus);
    formData.append('qeName', currentUser);

    const items = selectedReport.items.map((item, idx) => ({
      index: idx,
      qeDecision: item.qeDecision === 'Approve' ? 'pass' : 'fail',
      qeRemarks: item.rejectDetails?.remark || '',
      observation: item.rejectDetails?.observation || '',
      updatedAt: new Date().toLocaleString('en-GB', { hour12: true }),
      fileCount: (item.qeDecision === 'Reject' && item.rejectDetails?.mediaFiles) ? item.rejectDetails.mediaFiles.length : 0
    }));

    formData.append('itemsData', JSON.stringify(items));

    selectedReport.items.forEach((item) => {
      if (item.qeDecision === 'Reject' && item.rejectDetails?.mediaFiles) {
        item.rejectDetails.mediaFiles.forEach((m) => {
          formData.append('media', m.file);
        });
      }
    });

    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/api/final-approve-report`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        alert(`Report ${finalStatus}!`);
        setSelectedReport(null);
        fetchPendingReports();
      }
    } catch (err) {
      console.error(err);
      alert("Submission Error!");
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/150?text=No+Image";
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return path.startsWith('http') ? path : `${BASE_URL}${cleanPath}`;
  };

  if (!user || !user.fullName) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
        <FontAwesomeIcon icon={faUserCircle} size="3x" className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold">Session Expired</h2>
        <p className="text-gray-500 mb-6">Pehle login page par jaakar login karein.</p>
        <button onClick={() => window.location.href = '/'} className="bg-[#004080] text-white px-8 py-3 rounded-lg font-bold shadow-lg">Go to Login</button>
      </div>
    );
  }

  return (
    <div className="max-w-[500px] mx-auto min-h-screen bg-white border-x border-gray-200 pb-24 font-sans relative shadow-xl overflow-x-hidden">

      {/* --- REJECT MODAL --- */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[450px] bg-white rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden">
            <div className="bg-[#004080] p-4 text-white">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold uppercase tracking-widest">QC Details</h4>
                <button onClick={() => setIsRejectModalOpen(false)}><FontAwesomeIcon icon={faTimes} /></button>
              </div>
              <h2 className="text-sm font-bold mt-1">{activeItemIdx + 1}. {selectedReport?.items[activeItemIdx]?.question}</h2>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto bg-gray-50">
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2 mb-1"><FontAwesomeIcon icon={faInfoCircle} /> Observation</label>
                <input type="text" className="w-full border-b border-gray-300 py-1 focus:outline-none focus:border-[#004080] text-sm" placeholder="Enter observation..." value={rejectFormData.observation} onChange={(e) => setRejectFormData({ ...rejectFormData, observation: e.target.value })} />
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2 mb-1"><FontAwesomeIcon icon={faEdit} /> Remark</label>
                <textarea className="w-full border-b border-gray-300 py-1 focus:outline-none focus:border-[#004080] text-sm resize-none" rows="2" placeholder="Enter remarks..." value={rejectFormData.remark} onChange={(e) => setRejectFormData({ ...rejectFormData, remark: e.target.value })} />
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold text-gray-700">Photos and Videos</span>
                  <label className="cursor-pointer bg-gray-100 p-3 rounded-full hover:bg-gray-200 transition-colors">
                    <FontAwesomeIcon icon={faCamera} className="text-[#004080] text-xl" />
                    <input type="file" accept="image/*,video/*" capture="environment" multiple className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
                <div className="flex flex-wrap gap-3">
                  {rejectFormData.mediaFiles.map((m, index) => (
                    <div key={index} className="relative w-20 h-20 border rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                      {m.type === 'image' ? <img src={m.previewUrl} alt="prev" className="w-full h-full object-cover" /> : <video src={m.previewUrl} className="w-full h-full object-cover" />}
                      <button onClick={() => removeMedia(index)} className="absolute top-0 right-0 bg-red-600 text-white w-5 h-5 flex items-center justify-center text-[10px] rounded-bl-lg"><FontAwesomeIcon icon={faTimes} /></button>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={saveRejectDetails} className="w-full py-3 bg-[#004080] text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform uppercase text-sm tracking-widest">Save Details</button>
            </div>
          </div>
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <div className={`fixed inset-0 z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#004080] text-white p-6 shadow-2xl">
          <div className="flex justify-between items-start mb-10">
            <h5 className="text-sm font-bold italic leading-tight w-4/5">Nyati Engineers & Consultants Pvt. Ltd</h5>
            <button onClick={() => setIsSidebarOpen(false)}><FontAwesomeIcon icon={faTimes} className="text-2xl" /></button>
          </div>
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/20 pb-4">
              <FontAwesomeIcon icon={faUserCircle} className="text-3xl" />
              <div>
                <p className="text-sm font-bold truncate w-32">{currentUser}</p>
                <p className="text-[10px] opacity-70">{role}</p>
              </div>
            </div>
            <nav className="space-y-4">
              <button onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} className="w-full text-left p-2 hover:bg-white/10 rounded-md transition-colors flex items-center gap-3"><FontAwesomeIcon icon={faHome} /> Home</button>
              <button onClick={() => { setView('reworks'); setReworkFilter('approval'); setIsSidebarOpen(false); }} className="w-full text-left p-2 hover:bg-white/10 rounded-md transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faHistory} />
                  <span>Reworks for Approval</span>
                </div>
                {reworkApprovals.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{reworkApprovals.length}</span>}
              </button>
              <button onClick={handleLogout} className="w-full text-left p-2 hover:bg-red-500 rounded-md transition-colors flex items-center gap-3 mt-10 text-red-200"><FontAwesomeIcon icon={faSignOutAlt} /> Sign Out</button>
            </nav>
          </div>
        </div>
      </div>

      {/* --- TOP NAVBAR --- */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100 sticky top-0 bg-white z-40">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-[#004080] hover:bg-gray-100 rounded-md relative">
          <FontAwesomeIcon icon={faBars} className="text-2xl" />
          {reworkApprovals.length > 0 && (
            <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-ping border-2 border-white"></span>
          )}
        </button>
        <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
        <div className="w-10"></div>
      </div>

      {/* --- DASHBOARD VIEW --- */}
      {view === 'dashboard' && (
        <div className="p-4 animate-in fade-in duration-500">
          {/* USER PROFILE CARD */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-md flex items-center gap-4 mb-6 mt-2 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50/50 rounded-bl-full -mr-10 -mt-10"></div>
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-100 shrink-0 relative z-10">
              <FontAwesomeIcon icon={faUserGear} className="text-[#004080] text-2xl" />
            </div>
            <div className="flex-1 overflow-hidden relative z-10">
              <h2 className="text-[16px] font-black text-gray-900 uppercase truncate leading-tight">{currentUser}</h2>
              <div className="flex flex-col gap-0.5 mt-1">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div> {role}</span>
                <span className="text-[9px] font-black text-gray-500 uppercase truncate opacity-70 tracking-tight"><FontAwesomeIcon icon={faCalendarAlt} className="mr-1 text-blue-300" /> {projectSite}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center border-b-4 border-b-orange-400 cursor-pointer active:scale-95 transition-transform" onClick={() => { setView('main'); setFilterType('pending'); }}>
              <div className="w-10 h-10 bg-orange-50 rounded-full mx-auto flex items-center justify-center mb-2"><FontAwesomeIcon icon={faClock} className="text-orange-500" /></div>
              <p className="text-xl font-black text-gray-900">{dashboardStats.pendingReview}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase">Pending Review</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center border-b-4 border-b-blue-500 cursor-pointer active:scale-95 transition-transform" onClick={() => { setView('main'); setFilterType('today'); }}>
              <div className="w-10 h-10 bg-blue-50 rounded-full mx-auto flex items-center justify-center mb-2"><FontAwesomeIcon icon={faListAlt} className="text-blue-500" /></div>
              <p className="text-xl font-black text-blue-600">{dashboardStats.todayChecklist}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Today's Checklist</p>
            </div>
          </div>

          {/* REWORKS CARD */}
          <div onClick={() => { setView('reworks'); setReworkFilter('waiting'); }} className="bg-white border-2 border-gray-100 rounded-2xl p-5 shadow-sm hover:border-orange-200 transition-all cursor-pointer group mb-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                  <FontAwesomeIcon icon={faHistory} size="xl" />
                </div>
                <div>
                  <p className="text-xl font-black text-gray-900 leading-none">{returnedReports.length}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Waiting for Decision (Reworks)</p>
                </div>
              </div>
            </div>
          </div>


        </div>
      )}

      {/* --- REVIEW VIEW --- */}
      {view === 'main' && (
        <div className="animate-in fade-in duration-500">
          <div className="p-4">
            <button onClick={() => { setView('dashboard'); setSelectedReport(null); }} className="mb-4 text-[#004080] font-black flex items-center gap-2 text-xs uppercase tracking-widest"><FontAwesomeIcon icon={faArrowLeft} /> Dashboard</button>
            <h2 className="text-sm font-black text-[#004080] uppercase mb-4 tracking-widest pl-2 border-l-4 border-[#004080]">
              {filterType === 'today' ? "Today's Checklist Review" : "Pending Checklists Review"}
            </h2>

            {selectedReport ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                <div className="bg-[#004080] text-white p-3 rounded-t-lg flex justify-between items-center shadow-md">
                  <h3 className="font-bold text-xs uppercase tracking-wider">CHECKLIST REVIEW:</h3>
                  <FontAwesomeIcon icon={faTimesCircle} className="cursor-pointer" onClick={() => setSelectedReport(null)} />
                </div>
                <div className="border border-gray-200 border-t-0 rounded-b-lg bg-white mb-6 shadow-lg overflow-hidden">
                  {selectedReport.items.map((item, idx) => (
                    <div key={idx} className="border-b border-gray-100 last:border-0 p-3 bg-white">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-[12px] font-bold text-gray-800 leading-tight">{idx + 1}. {item.question}</p>
                          {item.photos && item.photos.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto mt-2 pb-1">
                              {item.photos.map((img, i) => (
                                <img
                                  key={i}
                                  src={getImageUrl(img)}
                                  className="w-12 h-12 object-cover rounded-md border shadow-sm cursor-pointer"
                                  onClick={() => window.open(getImageUrl(img), '_blank')}
                                  alt="report"
                                  onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Error"; }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => handleDecision(idx, 'Approve')} className={`px-4 py-2 rounded-md border font-black text-[10px] tracking-wider transition-all min-w-[65px] ${item.qeDecision === 'Approve' ? 'bg-green-600 border-green-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-400'}`}>PASS</button>
                          <button onClick={() => handleDecision(idx, 'Reject')} className={`px-4 py-2 rounded-md border font-black text-[10px] tracking-wider transition-all min-w-[65px] ${item.qeDecision === 'Reject' ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-400'}`}>REJECT</button>
                        </div>
                      </div>
                      {item.qeDecision === 'Reject' && item.rejectDetails?.observation && (
                        <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-100">
                          <p className="text-[10px] font-bold text-red-600">Observation: {item.rejectDetails.observation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={submitFinalDecision} className="w-full py-4 bg-[#004080] text-white font-black rounded-lg shadow-xl hover:bg-[#003366] transition-all uppercase tracking-widest text-sm sticky bottom-4" disabled={loading}>
                  <FontAwesomeIcon icon={loading ? faClock : faCheckCircle} className="mr-2" />
                  {loading ? "Submitting..." : "Final Approve Report"}
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-500">
                {pendingReports.filter(r => {
                  const today = new Date().toLocaleDateString('en-GB');
                  if (filterType === 'today') return r.date === today;
                  if (filterType === 'pending') return r.date !== today;
                  return true;
                }).length > 0 ? (
                  pendingReports.filter(r => {
                    const today = new Date().toLocaleDateString('en-GB');
                    if (filterType === 'today') return r.date === today;
                    if (filterType === 'pending') return r.date !== today;
                    return true;
                  }).map((report, idx) => (
                    <div key={idx} onClick={() => setSelectedReport(report)} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:border-[#004080] transition-colors cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold bg-blue-50 text-[#004080] px-2 py-0.5 rounded uppercase">{report.block} | {report.floor}</span>
                        <span className="text-[10px] text-gray-400">{report.date}</span>
                      </div>
                      <p className="text-xs font-black text-gray-800 group-hover:text-[#004080] transition-colors">{report.projectName}</p>
                      <p className="text-[10px] text-gray-500 mt-1 font-bold italic">{report.location} | {report.unitType || 'N/A'}</p>
                      <div className="mt-3 flex items-center justify-end">
                        <button className="text-[9px] font-black text-[#004080] uppercase flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">Open Checklist <FontAwesomeIcon icon={faExternalLinkAlt} /></button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="mt-20 text-center text-gray-400 opacity-60 flex flex-col items-center">
                    <FontAwesomeIcon icon={faClock} size="3x" className="mb-4" />
                    <p className="text-xs font-semibold">No checklists found for this category.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- REWORKS VIEW --- */}
      {view === 'reworks' && (
        <div className="p-4 animate-in slide-in-from-right duration-300">
          <button onClick={() => setView('dashboard')} className="mb-4 text-[#004080] font-bold flex items-center gap-2"><FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard</button>
          <h2 className="text-sm font-black text-[#004080] uppercase mb-4 tracking-widest pl-2 border-l-4 border-[#004080]">
            {reworkFilter === 'approval' ? "Reworks for Approval" : "Waiting for SE Action"}
          </h2>
          {(reworkFilter === 'approval' ? reworkApprovals : returnedReports).length > 0 ? (
            <div className="space-y-4">
              {(reworkFilter === 'approval' ? reworkApprovals : returnedReports).map((report, idx) => (
                <div key={idx} onClick={() => { setSelectedRework(report); setView('rework-detail'); }} className={`bg-white border rounded-xl shadow-sm p-4 hover:border-[#004080] transition-colors cursor-pointer ${reworkFilter === 'waiting' ? 'border-l-4 border-l-orange-400' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${reworkFilter === 'approval' ? 'bg-blue-100 text-[#004080]' : 'bg-orange-50 text-orange-600'}`}>
                      {report.block} | {report.floor}
                    </span>
                    <span className="text-[10px] text-gray-400">{report.date}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-800">{report.projectName}</p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {reworkFilter === 'approval' ? `Item: ${report.itemName || "Checklist Item"}` : `Observations: ${report.items?.filter(i => i.qeDecision === 'fail').length} issues`}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-[10px] font-bold italic ${reworkFilter === 'approval' ? 'text-green-600' : 'text-orange-500'}`}>
                      {reworkFilter === 'approval' ? '● Action Taken by SE' : '● Pending with Site Engineer'}
                    </span>
                    <button className="text-[10px] font-black text-[#004080] uppercase flex items-center gap-1">
                      {reworkFilter === 'approval' ? "Review" : "View Details"} <FontAwesomeIcon icon={faExternalLinkAlt} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-20 text-center text-gray-400 opacity-60">
              <FontAwesomeIcon icon={faHistory} size="3x" className="mb-4" />
              <p className="text-xs font-semibold">No reworks {reworkFilter === 'approval' ? 'pending approval' : 'in waiting'}.</p>
            </div>
          )}
        </div>
      )}

      {/* --- REWORK DETAIL VIEW --- */}
      {view === 'rework-detail' && (
        <div className="p-4 animate-in slide-in-from-bottom duration-400 pb-32">
          <button onClick={() => setView('reworks')} className="mb-4 text-[#004080] font-bold flex items-center gap-2 text-sm"><FontAwesomeIcon icon={faArrowLeft} /> Back to List</button>

          <div className="bg-[#004080] text-white p-4 rounded-xl mb-6 shadow-lg">
            <h3 className="text-xs font-bold uppercase mb-1">Rework Verification</h3>
            <p className="text-lg font-bold">{selectedRework?.block} - {selectedRework?.floor}</p>
            <p className="text-[11px] opacity-80">{selectedRework?.unitType} | {selectedRework?.location} | {selectedRework?.projectName}</p>
          </div>

          <div className="space-y-10 px-2">
            {selectedRework?.items?.filter(i => i.qeDecision === 'fail').map((item, itemIdx) => (
              <div key={itemIdx} className="space-y-6">

                <div className="bg-gray-100 rounded-xl px-4 py-2 text-center">
                  <p className="text-[10px] font-black text-gray-500 uppercase">{item.category}</p>
                  <p className="text-xs font-bold text-gray-800">{item.question}</p>
                </div>

                <div className="flex flex-col items-start max-w-[90%]">
                  <div className="flex items-center gap-2 mb-1.5 ml-1">
                    <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center border border-red-200">
                      <FontAwesomeIcon icon={faUserShield} className="text-red-600 text-xs" />
                    </div>
                    <span className="text-[11px] font-black text-gray-500 uppercase">Quality Engineer (Initial)</span>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-3xl rounded-tl-none p-4 shadow-sm w-full">
                    <p className="text-[10px] font-black text-red-600 uppercase mb-1 flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faInfoCircle} /> Issue Observed:
                    </p>

                    <p className="text-xs font-black text-gray-900 mb-3 bg-white/50 p-2 rounded-lg">
                      {item.observation || 'No observation provided'}
                    </p>

                    {item.mediaUrls && item.mediaUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2.5 mb-3">
                        {item.mediaUrls.map((img, idx) => (
                          <div key={idx} className="relative group overflow-hidden rounded-xl border-2 border-red-100">
                            <img
                              src={getImageUrl(img)}
                              className="w-24 h-24 object-cover transition-transform group-hover:scale-105"
                              onClick={() => window.open(getImageUrl(img), '_blank')}
                              alt="QE Evidence"
                              onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Error"; }}
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <FontAwesomeIcon icon={faSearchPlus} className="text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-1 mt-2 text-gray-500 bg-white/50 p-1.5 rounded-lg border border-red-100">
                      <FontAwesomeIcon icon={faEdit} className="text-[10px]" />
                      <p className="text-[10px] font-medium leading-tight">
                        Remark: {item.qeRemark || 'No remark provided.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end ml-auto max-w-[90%]">
                  <div className="flex items-center gap-2 mb-1.5 mr-1">
                    <span className="text-[11px] font-black text-gray-500 uppercase">Site Engineer (Action)</span>
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center border border-green-200">
                      <FontAwesomeIcon icon={faUserGear} className="text-green-600 text-xs" />
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-3xl rounded-tr-none p-4 shadow-sm w-full">
                    <p className="text-[10px] font-black text-green-600 uppercase mb-1">Work Completion Report:</p>

                    {item.reworkRemark ? (
                      <>
                        <p className="text-xs font-black text-gray-900 mb-3 bg-white/50 p-2 rounded-lg">
                          {item.reworkRemark}
                        </p>

                        {item.reworkMediaUrls && item.reworkMediaUrls.length > 0 && (
                          <div className="flex flex-wrap gap-2.5 mb-2">
                            {item.reworkMediaUrls.map((img, idx) => (
                              <div key={idx} className="relative group overflow-hidden rounded-xl border-2 border-green-100">
                                <img
                                  src={getImageUrl(img)}
                                  className="w-24 h-24 object-cover transition-transform group-hover:scale-105"
                                  onClick={() => window.open(getImageUrl(img), '_blank')}
                                  alt="SE Rework"
                                  onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Error"; }}
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <FontAwesomeIcon icon={faSearchPlus} className="text-white" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-green-100">
                          <span className="text-[9px] text-gray-500 font-black uppercase tracking-tighter">
                            <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" /> Submitted
                          </span>
                          <span className="text-[9px] font-bold text-green-700 bg-white px-2 py-0.5 rounded-full border border-green-100">
                            Ready for Review ✅
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-yellow-700 font-bold">
                          ⏳ SE ne abhi rework submit nahi kiya hai
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full py-2.5 mt-10 bg-gray-50 text-gray-500 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors border border-dashed border-gray-200 shadow-inner"
          >
            <FontAwesomeIcon icon={faHistory} className="mr-2" />
            {showHistory ? "Hide Previous Rejection Rounds" : `View History (${(selectedRework?.history || []).length} Rounds)`}
          </button>

          {showHistory && (
            <div className="mt-5 space-y-4 animate-in slide-in-from-top duration-300 px-1 border-l-2 border-dashed border-gray-100 ml-1">
              {(selectedRework?.history || []).length > 0 ? selectedRework.history.map((h, i) => (
                <div key={i} className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm relative ml-3">
                  <div className="absolute top-3 -left-[14px] w-2.5 h-2.5 bg-gray-100 rounded-full border border-gray-200"></div>
                  <div className="flex justify-between text-[9px] font-bold mb-1.5 pb-1.5 border-b border-gray-50">
                    <span className="text-red-500 uppercase flex items-center gap-1"><FontAwesomeIcon icon={faClock} /> Round {h.round} Rejected</span>
                    <span className="text-gray-400 font-medium">{h.date}</span>
                  </div>
                  <p className="text-[10px] text-gray-700 font-medium">QE Remark: <span className='font-bold text-gray-900'>{h.remark}</span></p>
                </div>
              )) : <p className="text-center text-[10px] text-gray-400 italic py-4">No previous rejection history found.</p>}
            </div>
          )}

          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] p-4 bg-white border-t flex gap-3 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] rounded-t-2xl">
            <button onClick={() => handleReworkDecision('Rejected')} className="flex-1 py-4 bg-red-600 text-white font-black rounded-xl shadow-lg hover:bg-red-700 uppercase text-xs tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={faTimesCircle} /> Reject Again
            </button>
            <button onClick={() => handleReworkDecision('Approved')} className="flex-1 py-4 bg-green-600 text-white font-black rounded-xl shadow-lg hover:bg-green-700 uppercase text-xs tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={faCheckCircle} /> Pass Rework
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 z-[200] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#004080] rounded-full animate-spin"></div>
          <p className="mt-4 text-[10px] font-black text-[#004080] uppercase tracking-widest">Processing Review...</p>
        </div>
      )}
    </div>
  )
}

export default QEIndex;