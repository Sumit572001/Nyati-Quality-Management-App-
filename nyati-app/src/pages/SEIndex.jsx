import { useState, useEffect } from 'react'
import axios from 'axios'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronDown, faChevronUp, faCheckCircle, faArrowLeft, faCheckSquare, faSquare,
  faBars, faTimes, faSignOutAlt, faUserCircle, faHistory, faHome, faInfoCircle, faUserTie, faCalendarAlt,
  faCamera, faUpload, faTrash, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons'

const BASE_URL = 'http://192.168.12.93:5000'

const buildingOptions = [];
const floorOptions = [];
const unitTypeOptions = [];

function SEIndex() {
  const user = JSON.parse(localStorage.getItem('nyati_user') || '{}')
  const currentUser = user.fullName || 'SE User' 
  const role = user.role === 'SE' ? 'Site Engineer' : (user.role || 'Site Engineer')
  const project = user.siteName || 'Nyati Project'

  const [categories, setCategories] = useState([])
  const [selectedCats, setSelectedCats] = useState([])
  const [showQCDropdown, setShowQCDropdown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('main') 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [reworkReports, setReworkReports] = useState([])
  const [historyReports, setHistoryReports] = useState([])
  const [reportData, setReportData] = useState([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
  const [reportView, setReportView] = useState('filter') // 'filter' | 'table'
  const [downloadedReports, setDownloadedReports] = useState([])
  const [selectedRework, setSelectedRework] = useState(null);
  const [reworkRemark, setReworkRemark] = useState('');
  const [reworkPhotos, setReworkPhotos] = useState([]);
  const [categorySelection, setCategorySelection] = useState({});

  const [spotData, setSpotData] = useState({
  buildingArea: '',
  floorLevel: '',
  unitType: '', // <--- Ye line add karein
  locationUnit: ''
})

  useEffect(() => {
    fetchInitialData();
  }, [])

  const fetchInitialData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/checklist-items`);
      const grouped = {}
      res.data.forEach(item => {
        if (!grouped[item.category]) grouped[item.category] = []
        grouped[item.category].push(item)
      })
      const arr = Object.entries(grouped).map(([name, items]) => ({ name, items }))
      setCategories(arr)
      setLoading(false)
    } catch (err) {
      console.error("Initial fetch error", err);
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
      console.error("Error fetching rework", err);
      alert("Rework list load nahi ho pa rahi hai!");
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
    console.error("Error fetching history", err);
    alert("History load nahi ho pa rahi!");
  } finally {
    setLoading(false);
  }
}

const fetchReport = async () => {
  if (!fromDate) return alert('Please select From Date!')
  try {
    setLoading(true)
    const res = await axios.get(
      `${BASE_URL}/api/se-report?user=${encodeURIComponent(currentUser)}&from=${fromDate}&to=${toDate}`
    )
    setReportData(Array.isArray(res.data) ? res.data : [])
    setReportView('table')
  } catch (err) {
    alert('Report load nahi ho pa rahi!')
  } finally {
    setLoading(false)
  }
}

const downloadExcel = () => {
  if (reportData.length === 0) return alert('Koi data nahi hai!')
  
  const headers = ['Sr No', 'Date', 'Location', 'Checklist', 'Engineer Name', 'QA Name', 'Remark']
  const rows = []
  let srNo = 1
  
  reportData.forEach(report => {
    report.items.forEach(item => {
      let remark = 'Pending'
      if (item.qeDecision === 'pass') remark = 'Approved'
      else if (item.qeDecision === 'fail' && report.status === 'Approved') remark = 'Rework Approved'
      else if (item.qeDecision === 'fail' && report.status === 'Returned') remark = 'Rework Reject'
      
      rows.push([
        srNo++,
        report.submittedAt || report.date || '',
        `${report.block} | ${report.floor} | ${report.location || ''}`,
        item.category || '',
        report.submittedBy || '',
        'Quality Engineer',
        remark
      ])
    })
  })
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Nyati_Report_${fromDate}_to_${toDate}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  // ✅ Download Report section mein save karo
  const newReport = {
    id: Date.now(),
    filename: `Nyati_Report_${fromDate}_to_${toDate}.csv`,
    fromDate,
    toDate,
    downloadedAt: new Date().toLocaleString('en-GB'),
    csvContent
  }
  setDownloadedReports(prev => [newReport, ...prev])
}

  const handleSpotInputChange = (e) => {
    const { name, value } = e.target
    setSpotData(prev => ({ ...prev, [name]: value }))
  }

  const toggleCategory = (cat) => {
    const isSelected = selectedCats.find(c => c.name === cat.name);
    if (isSelected) {
      setSelectedCats(selectedCats.filter(c => c.name !== cat.name));
    } else {
      setSelectedCats([...selectedCats, cat]);
    }
  }

  const handleInitialSubmit = () => {
    if (!spotData.buildingArea || !spotData.floorLevel) {
        return alert('Please fill Building and Floor details first!');
    }
    if (selectedCats.length === 0) {
      return alert('Kam se kam ek QC Category select karein!')
    }
    setView('checklist')
  }

  const handleLogout = () => {
  localStorage.removeItem('nyati_user')
  window.location.href = '/' // Simple redirect
}

  const openReworkForm = (item, reportId, itemIndexInReport) => {
    setSelectedRework({ ...item, reportId, itemIndexInReport });
    setView('rework-form');
    setReworkRemark('');
    setReworkPhotos([]);
  }

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map(file => ({
      file: file,
      preview: URL.createObjectURL(file)
    }));
    setReworkPhotos([...reworkPhotos, ...newPhotos]);
  }

  const removePhoto = (index) => {
    const updated = [...reworkPhotos];
    updated.splice(index, 1);
    setReworkPhotos(updated);
  }

  const submitReworkResponse = async () => {
    if (!reworkRemark) return alert("Please enter rework remark!");
    
    const formData = new FormData();
    formData.append('id', selectedRework.reportId);
    
    const reworkData = [{
        index: selectedRework.itemIndexInReport,
        reworkRemark: reworkRemark,
        fileCount: reworkPhotos.length
    }];
    
    formData.append('itemsData', JSON.stringify(reworkData));
    reworkPhotos.forEach(p => formData.append('media', p.file));

    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/api/submit-rework`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        alert("Rework Submitted to QE Successfully!");
        fetchReworkReports(); 
      }
    } catch (err) {
      alert("Submission failed!");
    } finally {
      setLoading(false);
    }
  }

  const submitFinalReport = async () => {
    const allItems = [];
    selectedCats.forEach(cat => {
      const isHeaderChecked = categorySelection[cat.name] || false;
      cat.items.forEach((item) => {
        allItems.push({
          question: item.questionText,
          category: cat.name,
          status: isHeaderChecked ? 'Passed' : 'Not Checked',
          photos: [],
          qeDecision: '',
          qeRemark: '',
          observation: ''
        });
      });
    });

    if (allItems.length === 0) return alert("Select a category!");

    const reportData = {
    projectName: project,
    block: spotData.buildingArea || 'N/A',
    floor: spotData.floorLevel || 'N/A',
    unitType: spotData.unitType || 'N/A',
    location: spotData.locationUnit || 'N/A',
    submittedBy: currentUser,
    items: allItems,
    status: 'Pending',
    // Niche wali line ko update kiya gaya hai (Date + Time ke liye)
    submittedAt: new Date().toLocaleString('en-GB', { hour12: true }), 
    date: new Date().toLocaleDateString('en-GB') 
  };

    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/api/submit-report`, reportData)
      if (res.data.success) {
        alert('Checklist Sent to QE!');
        // ✅ FIX: reload ki jagah sirf state reset karo
        setView('main');
        setSelectedCats([]);
        setCategorySelection({});
        setSpotData({ buildingArea: '', floorLevel: '', locationUnit: '' });
      }
    } catch (err) {
      alert('Submission Failed!');
    } finally {
      setLoading(false);
    }
}

  const handleHeaderCheckboxChange = (catName) => {
    setCategorySelection(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto shadow-sm pb-10 relative overflow-x-hidden font-sans">
      
      {/* SIDEBAR */}
      <div className={`fixed inset-0 z-[100] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#004080] text-white p-6 shadow-2xl">
          <div className="flex justify-between items-start mb-10">
            <h5 className="text-sm font-bold italic leading-tight w-4/5">Nyati Engineers & Consultants Pvt. Ltd</h5>
            <button onClick={() => setIsSidebarOpen(false)}><FontAwesomeIcon icon={faTimes} className="text-2xl" /></button>
          </div>
          <nav className="space-y-4">
            <button onClick={() => { setView('main'); setIsSidebarOpen(false); }} className="w-full text-left p-3 hover:bg-white/10 rounded-md flex items-center gap-3"><FontAwesomeIcon icon={faHome} /> Home</button>
            <button onClick={fetchReworkReports} className="w-full text-left p-3 hover:bg-white/10 rounded-md flex items-center gap-3"><FontAwesomeIcon icon={faHistory} /> Pending Reworks</button>
            <button onClick={fetchHistoryReports} className="w-full text-left p-3 hover:bg-white/10 rounded-md flex items-center gap-3"><FontAwesomeIcon icon={faCheckCircle} /> History</button>
            <button 
               onClick={() => { setView('report'); setReportView('filter'); setIsSidebarOpen(false); }} 
               className="w-full text-left p-3 hover:bg-white/10 rounded-md flex items-center gap-3"
            >
              <FontAwesomeIcon icon={faUpload} /> Report
            </button>
            <button 
              onClick={() => { setView('downloadReport'); setIsSidebarOpen(false); }} 
              className="w-full text-left p-3 hover:bg-white/10 rounded-md flex items-center gap-3"
            >
              <FontAwesomeIcon icon={faHistory} /> Report Download
            </button>
            <button onClick={handleLogout} className="w-full text-left p-3 hover:bg-red-500 rounded-md flex items-center gap-3 mt-10 text-red-200"><FontAwesomeIcon icon={faSignOutAlt} /> Sign Out</button>
          </nav>
        </div>
      </div>

      {/* NAVBAR */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100 sticky top-0 bg-white z-40">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-[#004080] hover:bg-gray-100 rounded-md transition-colors"><FontAwesomeIcon icon={faBars} className="text-2xl" /></button>
        <img src="https://www.nyatigroup.com/Nyati-logo-seo.png" alt="Logo" className="h-8 w-auto" />
        <div className="w-10"></div>
      </div>

      {/* MAIN VIEW */}
      {view === 'main' && (
        <>
          <div className="p-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-md flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0">
                <FontAwesomeIcon icon={faUserTie} className="text-[#004080] text-xl" />
              </div>
              <div className="flex-1 overflow-hidden">
                <h2 className="text-[15px] font-black text-gray-900 uppercase truncate leading-none">{currentUser}</h2>
                <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-wider">Designation: {role}</p>
                <p className="text-[9px] font-black text-gray-500 mt-1 uppercase truncate opacity-70"><FontAwesomeIcon icon={faCalendarAlt} className="mr-1"/> Project: {project}</p>
              </div>
            </div>
          </div>

          <div className="px-6 mt-2">
            <h3 className="text-[#004080] font-black text-xs border-l-4 border-[#004080] pl-2 mb-4 uppercase tracking-widest">Identify Location</h3>
            <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm">
  {/* Building Dropdown */}
  <div className="space-y-1">
    <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Building</label>
    <select name="buildingArea" value={spotData.buildingArea} onChange={handleSpotInputChange} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 outline-none text-sm focus:border-[#004080]">
      <option value="">Select Building</option>
      {buildingOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
    </select>
  </div>

  {/* Floor Dropdown */}
  <div className="space-y-1">
    <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Floor</label>
    <select name="floorLevel" value={spotData.floorLevel} onChange={handleSpotInputChange} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 outline-none text-sm focus:border-[#004080]">
      <option value="">Select Floor</option>
      {floorOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
    </select>
  </div>

  {/* Unit Type Dropdown (Naya Box) */}
  <div className="space-y-1">
    <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Unit/Area</label>
    <select name="unitType" value={spotData.unitType} onChange={handleSpotInputChange} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 outline-none text-sm focus:border-[#004080]">
      <option value="">Select Unit Type</option>
      {unitTypeOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
    </select>
  </div>

  {/* Location Manual Typing */}
  <div className="space-y-1">
    <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Location</label>
    <input name="locationUnit" value={spotData.locationUnit} onChange={handleSpotInputChange} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 outline-none text-sm focus:border-[#004080]" placeholder="Enter Unit/Flat No" />
  </div>
</div>

            <div className="mt-8">
              <h3 className="text-[#004080] font-black text-xs border-l-4 border-[#004080] pl-2 mb-4 uppercase tracking-widest">Select Checklist Categories</h3>
              <div onClick={() => setShowQCDropdown(!showQCDropdown)} className="w-full p-4 border-2 border-gray-200 rounded-xl flex justify-between items-center bg-white cursor-pointer shadow-sm active:scale-95 transition-all">
                <span className="font-bold text-xs truncate pr-4 text-gray-700">{selectedCats.length > 0 ? selectedCats.map(c => c.name).join(', ') : '-- SELECT CATEGORIES --'}</span>
                <FontAwesomeIcon icon={showQCDropdown ? faChevronUp : faChevronDown} className="text-gray-400" />
              </div>
              {showQCDropdown && (
                <div className="w-full mt-2 bg-white border border-gray-200 shadow-xl rounded-xl max-h-60 overflow-y-auto z-20">
                  {categories.map((cat, i) => {
                    const isSelected = selectedCats.find(c => c.name === cat.name);
                    return (
                      <div key={i} onClick={() => toggleCategory(cat)} className={`p-4 border-b last:border-0 flex items-center justify-between cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}>
                        <span className={`text-xs font-bold ${isSelected ? 'text-[#004080]' : 'text-gray-600'}`}>{cat.name}</span>
                        <FontAwesomeIcon icon={isSelected ? faCheckSquare : faSquare} className={isSelected ? 'text-[#004080]' : 'text-gray-300'} />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <button onClick={handleInitialSubmit} className="w-full mt-12 py-4 bg-[#004080] text-white font-black rounded-xl uppercase shadow-lg shadow-blue-900/20 active:scale-95 transition-all tracking-widest text-sm">PROCEED TO CHECKLIST</button>
          </div>
        </>
      )}

      {/* CHECKLIST VIEW */}
      {view === 'checklist' && (
        <div className="px-4 animate-in slide-in-from-right duration-300 mt-4 pb-20">
          <button onClick={() => setView('main')} className="mb-6 text-[#004080] font-bold flex items-center gap-2 text-sm"><FontAwesomeIcon icon={faArrowLeft} /> Back</button>
          <div className="space-y-6">
            {selectedCats.map((cat, catIdx) => {
              const isSelectedAll = categorySelection[cat.name] || false;
              return (
                <div key={catIdx} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-[#004080] text-white p-4 font-bold text-xs uppercase tracking-widest flex justify-between items-center">
                    <span>{cat.name}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] opacity-60">SELECT ALL</span>
                        <input type="checkbox" className="w-5 h-5 accent-green-500 cursor-pointer" checked={isSelectedAll} onChange={() => handleHeaderCheckboxChange(cat.name)} />
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 space-y-2">
                    {cat.items.map((item, idx) => (
                      <div key={idx} className={`p-4 rounded-xl border transition-all duration-300 ${isSelectedAll ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 shadow-sm'}`}>
                        <label className="text-[11px] font-bold text-gray-700 leading-tight block">{item.questionText}</label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 max-w-md mx-auto z-40">
             <button onClick={submitFinalReport} className="w-full py-4 bg-green-600 text-white font-black rounded-xl uppercase shadow-xl flex items-center justify-center gap-2 tracking-widest text-sm" disabled={loading}>
                <FontAwesomeIcon icon={loading ? faUpload : faCheckCircle} /> {loading ? "SUBMITTING..." : "SUBMIT REPORT TO QE"}
             </button>
          </div>
        </div>
      )}

      {/* REWORK VIEW (LIST) */}
      {view === 'rework' && (
        <div className="px-4 animate-in slide-in-from-left duration-300 mt-4 pb-10">
          <button onClick={() => setView('main')} className="mb-4 text-[#004080] font-bold flex items-center gap-2 text-sm"><FontAwesomeIcon icon={faArrowLeft} /> Back</button>
          <div className="flex items-center gap-2 mb-6 border-l-4 border-red-500 pl-3">
             <h2 className="text-sm font-black text-red-600 uppercase tracking-widest">Pending Reworks</h2>
             <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{reworkReports.length}</span>
          </div>

          <div className="space-y-6">
            {reworkReports.length > 0 ? reworkReports.map((report, rIdx) => (
              <div key={rIdx} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden border-t-4 border-t-red-500">
                <div className="bg-red-50 p-3 flex justify-between items-center border-b border-red-100">
                  <div className="flex flex-col">
                      <span className="text-[10px] font-black text-red-700 uppercase">{report.block} | {report.floor}</span>
                      <span className="text-[9px] text-gray-500 font-bold">{report.location}</span>
                  </div>
                  <span className="text-[9px] text-gray-400 font-bold">{report.date}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {report.items.map((item, iIdx) => {
                    if (item.qeDecision === 'fail') {
                        return (
                         <div key={iIdx} className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-center group" onClick={() => openReworkForm(item, report._id, iIdx)}>
                             <div className="flex-1">
                                <p className="text-[11px] font-bold text-gray-800 leading-tight group-hover:text-red-600 transition-colors">{item.question}</p>
                                <p className="text-[9px] text-gray-400 mt-1 italic"><FontAwesomeIcon icon={faExclamationTriangle} className="mr-1"/> Needs Attention</p>
                             </div>
                             <FontAwesomeIcon icon={faChevronDown} className="text-gray-300 -rotate-90 group-hover:text-red-400" />
                         </div>
                        )
                    }
                    return null;
                  })}
                </div>
              </div>
            )) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300 opacity-60">
                    <FontAwesomeIcon icon={faCheckCircle} size="3x" className="mb-4" />
                    <p className="text-xs font-bold uppercase tracking-widest">All Reworks Completed!</p>
                </div>
            )}
          </div>
        </div>
      )}

      {/* REWORK ACTION FORM */}
{view === 'rework-form' && selectedRework && (
  <div className="px-4 animate-in slide-in-from-bottom duration-400 mt-4 pb-20">
    <button onClick={() => setView('rework')} className="mb-6 text-[#004080] font-bold flex items-center gap-2 text-sm">
      <FontAwesomeIcon icon={faArrowLeft} /> Back to Rework List
    </button>
    
    <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-[#004080] text-white p-5">
          <span className="text-[9px] uppercase font-black tracking-widest opacity-60">{selectedRework.category}</span>
          <h3 className="text-sm font-black mt-1 leading-snug">{selectedRework.question}</h3>
      </div>
      
      <div className="p-5 space-y-6">
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-4">
              <div>
                  <p className="text-[9px] font-black text-red-600 uppercase mb-1 tracking-tighter">
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-1"/> QE Observation
                  </p>
                  <p className="text-xs font-black text-gray-900 bg-white/50 p-2 rounded-lg border border-red-50 shadow-sm">
                    {selectedRework.observation || 'Points failed at site inspection'}
                  </p>
              </div>
              <div>
                  <p className="text-[9px] font-black text-red-600 uppercase mb-1 tracking-tighter">
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-1"/> QE Remark
                  </p>
                  <p className="text-xs font-black text-gray-900 bg-white/50 p-2 rounded-lg border border-red-50 shadow-sm">
                    {selectedRework.qeRemark || 'Please rectify and resubmit.'}
                  </p>
              </div>

              {/* Reference Photos (From QE) - Fixed Image Logic */}
              {selectedRework.mediaUrls && selectedRework.mediaUrls.length > 0 && (
                  <div className="mt-4">
                      <p className="text-[9px] font-black text-red-600 uppercase mb-2">Reference Photos (From QE)</p>
                      <div className="flex flex-wrap gap-2">
                          {selectedRework.mediaUrls.map((imgUrl, idx) => (
                              <img 
                                key={idx} 
                                src={imgUrl.startsWith('http') ? imgUrl : `${BASE_URL}${imgUrl}`} 
                                alt="QE ref" 
                                className="w-20 h-20 object-cover rounded-lg border-2 border-white shadow-md cursor-pointer" 
                                onClick={() => window.open(imgUrl.startsWith('http') ? imgUrl : `${BASE_URL}${imgUrl}`, '_blank')} 
                              />
                          ))}
                      </div>
                  </div>
              )}
          </div>

          <div className="border-t border-gray-100 pt-5">
              <h4 className="text-xs font-black text-green-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Site Engineer Action
              </h4>
              <div className="space-y-5">
                  <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Your Remark (Correction Details)</label>
                      <textarea 
                        className="w-full border-2 border-gray-100 rounded-xl p-3 text-xs focus:border-green-500 outline-none mt-1 transition-colors min-h-[100px]" 
                        placeholder="Explain how you fixed this issue..." 
                        value={reworkRemark} 
                        onChange={(e) => setReworkRemark(e.target.value)} 
                      />
                  </div>
                  <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase block mb-3 ml-1">Attach Photos of work done</label>
                      <div className="flex flex-wrap gap-3">
                          <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-[#004080] hover:text-[#004080]">
                              <FontAwesomeIcon icon={faCamera} className="text-2xl mb-1" />
                              <span className="text-[8px] font-black uppercase">Add Photo</span>
                              <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoChange} />
                          </label>
                          {reworkPhotos.map((p, idx) => (
                              <div key={idx} className="relative w-20 h-20 group">
                                  <img src={p.preview} alt="prev" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                                  <button 
                                    onClick={() => removePhoto(idx)} 
                                    className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-[10px] flex items-center justify-center shadow-lg"
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>

          <button 
            onClick={submitReworkResponse} 
            disabled={loading} 
            className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-green-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
          >
            <FontAwesomeIcon icon={loading ? faUpload : faCheckCircle} /> {loading ? 'SUBMITTING...' : 'SEND FOR APPROVAL'}
          </button>
      </div>
    </div>
  </div>
)}


{/* HISTORY VIEW */}
{view === 'history' && (
  <div className="px-4 animate-in slide-in-from-left duration-300 mt-4 pb-10">
    <button onClick={() => setView('main')} className="mb-4 text-[#004080] font-bold flex items-center gap-2 text-sm">
      <FontAwesomeIcon icon={faArrowLeft} /> Back
    </button>
    <div className="flex items-center gap-2 mb-6 border-l-4 border-green-500 pl-3">
      <h2 className="text-sm font-black text-green-600 uppercase tracking-widest">Approved History</h2>
      <span className="bg-green-100 text-green-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
        {historyReports.reduce((acc, r) => acc + r.items.filter(i => i.qeDecision === 'pass').length, 0)} Points
      </span>
    </div>

    {historyReports.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-20 text-gray-300 opacity-60">
        <FontAwesomeIcon icon={faCheckCircle} size="3x" className="mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest">No approved reports yet</p>
      </div>
    ) : (
      <div className="space-y-6">
        {historyReports.map((report, rIdx) => {
          const passedItems = report.items.filter(i => i.qeDecision === 'pass')
          if (passedItems.length === 0) return null
          return (
            <div key={rIdx} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden border-t-4 border-t-green-500">
              
              {/* Report Header */}
              <div className="bg-green-50 p-3 flex justify-between items-center border-b border-green-100">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-green-700 uppercase">{report.block} | {report.floor}</span>
                  <span className="text-[9px] text-gray-500 font-bold">{report.location}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-gray-400 font-bold block">{report.date}</span>
                  <span className="text-[9px] bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">
                    {report.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Passed Items */}
              <div className="divide-y divide-gray-50">
                {passedItems.map((item, iIdx) => (
                  <div key={iIdx} className="p-4 flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-xs" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-gray-800 leading-tight">{item.question}</p>
                      <span className="text-[9px] font-bold text-green-600 uppercase mt-0.5 block">
                        {item.category}
                      </span>
                    </div>
                    <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                      ✅ PASS
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
                <p className="text-[9px] text-gray-400 font-bold">
                  {passedItems.length} of {report.items.length} points cleared by QE
                </p>
              </div>
            </div>
          )
        })}
      </div>
    )}
  </div>
)}


{/* REPORT VIEW */}
{view === 'report' && (
  <div className="px-4 animate-in slide-in-from-right duration-300 mt-4 pb-10">
    <button onClick={() => setView('main')} className="mb-4 text-[#004080] font-bold flex items-center gap-2 text-sm">
      <FontAwesomeIcon icon={faArrowLeft} /> Back
    </button>

    <div className="flex items-center gap-2 mb-6 border-l-4 border-[#004080] pl-3">
      <h2 className="text-sm font-black text-[#004080] uppercase tracking-widest">Report</h2>
    </div>

    {reportView === 'filter' && (
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-5">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 outline-none text-sm focus:border-[#004080]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 outline-none text-sm focus:border-[#004080]"
          />
        </div>
        <button
          onClick={fetchReport}
          disabled={loading}
          className="w-full py-4 bg-[#004080] text-white font-black rounded-xl uppercase tracking-widest text-sm shadow-lg active:scale-95 transition-all"
        >
          {loading ? 'Loading...' : 'SUBMIT'}
        </button>
      </div>
    )}

    {reportView === 'table' && (
      <>
        {/* Excel Download Button */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setReportView('filter')}
            className="text-[#004080] font-bold text-xs flex items-center gap-1"
          >
            ← Change Dates
          </button>
          <button
            onClick={downloadExcel}
            className="flex items-center gap-2 bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow active:scale-95 transition-all"
          >
            <FontAwesomeIcon icon={faUpload} /> Download Excel
          </button>
        </div>

        {reportData.length === 0 ? (
          <div className="text-center py-16 text-gray-300">
            <p className="text-xs font-bold uppercase">Is date range mein koi data nahi</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-[#004080] text-white">
                  <th className="p-2 text-left whitespace-nowrap border-r border-blue-700">Sr No</th>
                  <th className="p-2 text-left whitespace-nowrap border-r border-blue-700">Date & Time (SE)</th>
                  <th className="p-2 text-left whitespace-nowrap border-r border-blue-700">Date & Time (QE)</th>
                  <th className="p-2 text-left whitespace-nowrap border-r border-blue-700">Location</th>
                  <th className="p-2 text-left whitespace-nowrap border-r border-blue-700">Checklist</th>
                  <th className="p-2 text-left whitespace-nowrap border-r border-blue-700">Engineer Name</th>
                  <th className="p-2 text-left whitespace-nowrap border-r border-blue-700">QA Name</th>
                  <th className="p-2 text-left whitespace-nowrap">Remark</th>
                </tr>
              </thead>
              <tbody>
  {(() => {
    let srNo = 1;
    return reportData.flatMap((report, rIdx) =>
      report.items.map((item, iIdx) => {
        let remark = 'Pending';
        let remarkColor = 'text-orange-500';
        if (item.qeDecision === 'pass') { 
          remark = 'Approved'; 
          remarkColor = 'text-green-600'; 
        } else if (item.qeDecision === 'fail' && report.status === 'Approved') { 
          remark = 'Rework Approved'; 
          remarkColor = 'text-blue-600'; 
        } else if (item.qeDecision === 'fail' && report.status === 'Returned') { 
          remark = 'Rework Reject'; 
          remarkColor = 'text-red-600'; 
        }

        return (
          <tr key={`${rIdx}-${iIdx}`} className={`border-b border-gray-100 ${srNo % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
            <td className="p-2 font-bold text-gray-500 border-r border-gray-100">{srNo++}</td>

            {/* 1. SE Date & Time Column */}
            <td className="p-2 text-gray-700 border-r border-gray-100 text-[9px]">
  <span className="block font-bold">{report.date || '-'}</span>
  <span className="block text-gray-400">{report.submittedAt ? report.submittedAt.split(',')[1]?.trim() || '' : ''}</span>
</td>

            {/* 2. QE Date & Time Column */}
            <td className="p-2 text-gray-700 border-r border-gray-100 text-[9px]">
  {item.qeDecision ? (
    <>
      <span className="block font-bold">{report.updatedAt ? report.updatedAt.split(',')[0] : report.date || '-'}</span>
      <span className="block text-gray-400">{report.updatedAt ? report.updatedAt.split(',')[1]?.trim() || '' : ''}</span>
    </>
  ) : (
    <span className="text-orange-400 italic">Waiting...</span>
  )}
</td>

            <td className="p-2 text-gray-700 border-r border-gray-100">
              <span className="block">{report.block}</span>
              <span className="block text-gray-400">{report.floor}</span>
              <span className="block text-[#004080] font-bold">{report.unitType || ''}</span>
              <span className="block text-gray-400">{report.location}</span>
            </td>

            <td className="p-2 text-gray-700 border-r border-gray-100 max-w-[80px]">
              <span className="block font-bold text-[#004080]">{item.category}</span>
              <span className="block text-gray-500 truncate">{item.question?.substring(0, 30)}...</span>
            </td>

            <td className="p-2 text-gray-700 border-r border-gray-100 whitespace-nowrap">{report.submittedBy || '-'}</td>
            <td className="p-2 text-gray-700 border-r border-gray-100 whitespace-nowrap">Quality Engineer</td>
            <td className={`p-2 font-black ${remarkColor} whitespace-nowrap`}>{remark}</td>
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


{/* REPORT DOWNLOAD VIEW */}
{view === 'downloadReport' && (
  <div className="px-4 animate-in slide-in-from-right duration-300 mt-4 pb-10">
    <button onClick={() => setView('main')} className="mb-4 text-[#004080] font-bold flex items-center gap-2 text-sm">
      <FontAwesomeIcon icon={faArrowLeft} /> Back
    </button>

    <div className="flex items-center gap-2 mb-6 border-l-4 border-green-500 pl-3">
      <h2 className="text-sm font-black text-green-600 uppercase tracking-widest">Report Download</h2>
      <span className="bg-green-100 text-green-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
        {downloadedReports.length} Files
      </span>
    </div>

    {downloadedReports.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-20 text-gray-300 opacity-60">
        <FontAwesomeIcon icon={faUpload} size="3x" className="mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest text-center">
          Abhi koi report download nahi ki hai
        </p>
        <p className="text-[9px] text-gray-300 mt-2 text-center">
          Report section mein jaake Excel download karo
        </p>
      </div>
    ) : (
      <div className="space-y-3">
        {downloadedReports.map((report) => (
          <div key={report.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 flex items-center gap-3">
              {/* File Icon */}
              <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faUpload} className="text-green-600 text-lg" />
              </div>

              {/* File Info */}
              <div className="flex-1 overflow-hidden">
                <p className="text-[11px] font-black text-gray-800 truncate">{report.filename}</p>
                <p className="text-[9px] text-gray-400 mt-0.5">
                  {report.fromDate} → {report.toDate}
                </p>
                <p className="text-[9px] text-gray-300 mt-0.5">
                  Downloaded: {report.downloadedAt}
                </p>
              </div>

              {/* Re-Download Button */}
              <button
                onClick={() => {
                  const blob = new Blob([report.csvContent], { type: 'text/csv;charset=utf-8;' })
                  const url = URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = report.filename
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  URL.revokeObjectURL(url)
                }}
                className="shrink-0 bg-[#004080] text-white text-[9px] font-black px-3 py-2 rounded-lg shadow active:scale-95 transition-all uppercase"
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}

      {loading && (
          <div className="fixed inset-0 z-[200] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-[#004080] rounded-full animate-spin"></div>
              <p className="mt-4 text-[10px] font-black text-[#004080] uppercase tracking-widest">Processing Data...</p>
          </div>
      )}
    </div>
  )
}

export default SEIndex;