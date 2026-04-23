import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faTrash, faSignOutAlt, faList, faTags, faBuilding, faStairs, faHome } from '@fortawesome/free-solid-svg-icons'

const BASE_URL = 'http://192.168.12.93:5000'
// const BASE_URL = "http://localhost:5000";

function AdminPanel() {
  // Tabs State
  const [activeTab, setActiveTab] = useState('checklist')

  // Form States
  const [category, setCategory] = useState('')
  const [question, setQuestion] = useState('')
  const [newName, setNewName] = useState('') // For Building, Floor, Unit, Category names

  // Selection States for Floor/Unit Creation
  const [selectedBuilding, setSelectedBuilding] = useState('')
  const [selectedFloor, setSelectedFloor] = useState('')

  // Data Lists
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [buildings, setBuildings] = useState([])
  const [floors, setFloors] = useState([])
  const [units, setUnits] = useState([])

  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    if (window.confirm('Do you want to logout?')) {
      localStorage.removeItem('nyati_user')
      navigate('/')
    }
  }

  // Generic Load Function
  const loadData = async () => {
    try {
      const [resCl, resCat, resBld, resFlr, resUnit] = await Promise.all([
        axios.get(`${BASE_URL}/api/checklist-items`),
        axios.get(`${BASE_URL}/api/categories`),
        axios.get(`${BASE_URL}/api/buildings`),
        axios.get(`${BASE_URL}/api/floors`),
        axios.get(`${BASE_URL}/api/units`)
      ]);
      setItems(resCl.data);
      setCategories(resCat.data);
      setBuildings(resBld.data);
      setFloors(resFlr.data);
      setUnits(resUnit.data);

      // Set default category if available
      if (resCat.data.length > 0 && !category) {
        setCategory(resCat.data[0].name);
      }
      // Set default building if available
      if (resBld.data.length > 0 && !selectedBuilding) {
        setSelectedBuilding(resBld.data[0].name);
      }
    } catch (err) {
      console.error('Failed to load data!', err)
    }
  }

  useEffect(() => { loadData() }, [])

  // 1. Add Checklist Item
  const addItem = async () => {
    if (!question.trim() || !category) return alert('Fill Category and Question')
    setLoading(true)
    try {
      const res = await axios.post(`${BASE_URL}/api/add-checklist-item`, {
        category,
        questionText: question
      })
      if (res.data.success) {
        alert('New Checklist Added.')
        setQuestion('')
        loadData()
      }
    } catch (err) { alert('Error adding checklist') }
    setLoading(false)
  }

  // 2. Specialized Add Function for Building/Floor/Unit/Category
  const handleAddMaster = async () => {
    if (!newName.trim()) return alert('Name is required');
    setLoading(true);
    try {
      let endpoint = '';
      let payload = { name: newName };

      if (activeTab === 'category') {
        endpoint = 'categories';
      } else if (activeTab === 'building') {
        endpoint = 'buildings';
      } else if (activeTab === 'floor') {
        if (!selectedBuilding) return alert('Please select a Building');
        endpoint = 'floors';
        payload.buildingName = selectedBuilding;
      } else if (activeTab === 'unit') {
        if (!selectedBuilding || !selectedFloor) return alert('Please select Building and Floor');
        endpoint = 'units';
        payload.buildingName = selectedBuilding;
        payload.floorName = selectedFloor;
      }

      const res = await axios.post(`${BASE_URL}/api/${endpoint}`, payload);
      if (res.data.success) {
        alert(`${activeTab.toUpperCase()} Added!`);
        setNewName('');
        loadData();
      }
    } catch (err) {
      console.error(err);
      alert('Error adding data');
    }
    setLoading(false);
  }

  // Delete Functions
  const deleteItem = async (id, endpoint) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      const res = await axios.delete(`${BASE_URL}/api/${endpoint}/${id}`);
      if (res.data.success) { loadData(); }
    } catch (err) { alert('Delete Failed') }
  }

  // Helper for UI
  const tabs = [
    { id: 'checklist', label: 'Checklist', icon: faList },
    { id: 'category', label: 'Category', icon: faTags },
    { id: 'building', label: 'Building', icon: faBuilding },
    { id: 'floor', label: 'Floor', icon: faStairs },
    { id: 'unit', label: 'Unit/Area', icon: faHome },
  ]

  // Filter floors based on selected building for Unit tab
  const filteredFloors = floors.filter(f => f.buildingName === selectedBuilding);

  // Update selected floor when building changes or tab changes
  useEffect(() => {
    if (activeTab === 'unit') {
      // ✅ FIX: Auto-select band karo — hamesha blank rakho
      setSelectedFloor('');
    }
  }, [selectedBuilding, activeTab]);

  return (
    <div className="min-h-screen bg-[#f4f7f9] pb-10">
      {/* Header */}
      <div className="bg-[#004080] text-white p-4 sticky top-0 z-50 flex justify-between items-center shadow-lg">
        <h2 className="text-sm font-black tracking-widest uppercase">⚙️ Nyati Admin</h2>
        <button onClick={handleLogout} className="bg-red-500 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase">Logout</button>
      </div>

      {/* Tabs Menu - Mobile Friendly Scroll */}
      <div className="flex overflow-x-auto bg-white border-b sticky top-[52px] z-40 no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-none px-5 py-3 text-[10px] font-bold uppercase tracking-wider transition-all
              ${activeTab === t.id ? 'text-[#004080] border-b-4 border-[#004080]' : 'text-gray-400'}`}
          >
            <FontAwesomeIcon icon={t.icon} className="mr-1.5" /> {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto p-4">

        {/* ===== FORM SECTION ===== */}
        <div className="bg-white p-5 rounded-2xl shadow-sm mb-6 border border-gray-100">
          <h3 className="text-[#004080] font-black text-xs uppercase mb-4 border-l-4 border-[#E76F2E] pl-2">
            Add New {activeTab}
          </h3>

          {activeTab === 'checklist' ? (
            <>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Select Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl text-sm mb-4 mt-1 outline-none focus:border-[#004080]"
              >
                {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>

              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Inspection Question</label>
              <input
                type="text"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="Check Plumb / Reinforcement..."
                className="w-full p-3 border border-gray-200 rounded-xl text-sm mb-4 mt-1 outline-none focus:border-[#004080]"
              />
              <button onClick={addItem} disabled={loading} className="w-full py-4 bg-[#004080] text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg">
                {loading ? 'Processing...' : 'Add Checklist Point'}
              </button>
            </>
          ) : (
            <>
              {/* Conditional Dropdowns for Floor and Unit */}
              {(activeTab === 'floor' || activeTab === 'unit') && (
                <>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Select Building</label>
                  <select
                    value={selectedBuilding}
                    onChange={e => setSelectedBuilding(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm mb-4 mt-1 outline-none focus:border-[#004080]"
                  >
                    <option value="">-- Choose Building --</option>
                    {buildings.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                  </select>
                </>
              )}

              {activeTab === 'unit' && (
                <>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Select Floor</label>
                  <select
                    value={selectedFloor}
                    onChange={e => setSelectedFloor(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm mb-4 mt-1 outline-none focus:border-[#004080]"
                  >
                    <option value="">-- Choose Floor --</option>
                    {filteredFloors.map(f => <option key={f._id} value={f.name}>{f.name}</option>)}
                  </select>
                </>
              )}

              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{activeTab} Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder={`Enter ${activeTab} name...`}
                className="w-full p-3 border border-gray-200 rounded-xl text-sm mb-4 mt-1 outline-none focus:border-[#004080]"
              />
              <button onClick={handleAddMaster} disabled={loading} className="w-full py-4 bg-[#004080] text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg">
                {loading ? 'Processing...' : `Add ${activeTab}`}
              </button>
            </>
          )}
        </div>

        {/* ===== LIST DISPLAY SECTION ===== */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-700 font-bold text-xs uppercase">Current {activeTab}s</h3>
            <span className="bg-blue-50 text-[#004080] text-[10px] px-2 py-1 rounded-full font-bold">
              Total: {
                activeTab === 'checklist' ? items.length :
                  activeTab === 'category' ? categories.length :
                    activeTab === 'building' ? buildings.length :
                      activeTab === 'floor' ? floors.length : units.length
              }
            </span>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {activeTab === 'checklist' && items.map(item => (
              <div key={item._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div>
                  <div className="text-[9px] font-black text-[#E76F2E] uppercase">{item.category}</div>
                  <div className="text-sm text-gray-700 font-medium">{item.questionText}</div>
                </div>
                <button onClick={() => deleteItem(item._id, 'delete-checklist-item')} className="text-red-400 p-2"><FontAwesomeIcon icon={faTrash} /></button>
              </div>
            ))}

            {activeTab !== 'checklist' && (activeTab === 'category' ? categories : activeTab === 'building' ? buildings : activeTab === 'floor' ? floors : units).map(m => (
              <div key={m._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div>
                  <span className="text-sm text-gray-700 font-bold">{m.name}</span>
                  {activeTab === 'floor' && <div className="text-[9px] text-gray-400 font-bold uppercase">Building: {m.buildingName}</div>}
                  {activeTab === 'unit' && <div className="text-[9px] text-gray-400 font-bold uppercase">Bldg: {m.buildingName} | Flr: {m.floorName}</div>}
                </div>
                <button onClick={() => deleteItem(m._id, activeTab === 'category' ? 'categories' : activeTab + 's')} className="text-red-400 p-2"><FontAwesomeIcon icon={faTrash} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel