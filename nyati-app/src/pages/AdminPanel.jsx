import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom' // ✅ Navigation ke liye add kiya
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faTrash, faSignOutAlt } from '@fortawesome/free-solid-svg-icons' // ✅ Logout icon add kiya

// AdminPanel.jsx mein ye update karein
const BASE_URL = 'http://192.168.12.93:5000'

function AdminPanel() {
  const [category, setCategory] = useState('Column')
  const [question, setQuestion] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate() // ✅ Navigate function initialize kiya

  // ✅ Logout Function: Jo storage clear karke login page pe bhej dega
  const handleLogout = () => {
    if (window.confirm('Do you want to logout?')) {
      localStorage.removeItem('nyati_user') // User data delete karein
      navigate('/') // Login page par bhejein
    }
  }

  // 1. Items load karne ka function
  const loadItems = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/checklist-items`)
      // Server se data milte hi items state update hogi aur screen pe dikhne lagega
      setItems(res.data)
    } catch (err) {
      console.error('Failed to load items!', err)
    }
  }

  useEffect(() => { loadItems() }, [])

  // 2. Naya Item Add karne ka function
  const addItem = async () => {
    if (!question.trim()) return alert('Fill Question')
    setLoading(true)
    try {
      const res = await axios.post(`${BASE_URL}/api/add-checklist-item`, { 
        category, 
        questionText: question 
      })
      if (res.data.success) {
        alert('New Checklist Added.')
        setQuestion('') // Input box khaali karne ke liye
        loadItems() // List ko refresh karne ke liye taaki naya item neeche dikh jaye
      }
    } catch (err) {
      alert('Server is not responding. Please check your connection.')
    }
    setLoading(false)
  }

  // 3. Item Delete karne ka function
  const deleteItem = async (itemId) => {
    if (!itemId) return alert("Item ID nahi mili!");
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const res = await axios.delete(`${BASE_URL}/api/delete-checklist-item/${itemId}`);
      if (res.data.success) {
        alert('Delete Success!');
        loadItems(); // Refresh list taaki delete hua item screen se hat jaye
      }
    } catch (err) {
      console.error("Delete Error:", err);
      alert('Failed to delete item. Backend connection error.');
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7f9] py-10 px-4">
      <div className="bg-white p-6 rounded-2xl max-w-2xl mx-auto shadow-md">

        {/* Header with Logout Button */}
        <div className="flex justify-between items-center border-b-2 border-[#E76F2E] pb-3 mb-5">
          <h2 className="text-xl font-bold text-[#004080]">
            Checklist Admin Panel
          </h2>
          
          {/* ✅ LOGOUT BUTTON ADD KIYA */}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold text-xs hover:bg-red-600 hover:text-white transition-all border border-red-100"
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            LOGOUT
          </button>
        </div>

        {/* Add New Item Section */}
        <div className="mb-6">
          <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-sm mb-3 bg-white"
          >
            <option>Column</option>
            <option>Beam & Slab</option>
            <option>Block Work</option>
            <option>Plaster</option>
            <option>Flooring</option>
            <option>Dado</option>
            <option>Fire Fighting</option>
          </select>

          <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Question</label>
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            placeholder="Enter inspection question (e.g. Check Plumb)"
            className="w-full p-3 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:border-[#004080]"
          />

          <button
            onClick={addItem}
            disabled={loading}
            className="w-full py-3 bg-[#004080] text-white font-bold rounded-lg hover:bg-blue-900 transition disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            {loading ? 'Adding...' : 'ADD TO DATABASE'}
          </button>
        </div>

        {/* Items Display Section */}
        <div>
          <h3 className="font-bold text-gray-700 mb-3">
            Current Checklist Points: 
            <span className="ml-2 bg-[#004080] text-white text-xs px-2 py-1 rounded-full">{items.length}</span>
          </h3>

          <div className="max-h-[400px] overflow-y-auto pr-2">
            {items.length === 0
              ? <p className="text-gray-400 text-sm text-center py-4">Koi items nahi hain abhi.</p>
              : items.map((item) => (
                  <div 
                    key={item._id} 
                    className="flex justify-between items-center bg-gray-50 border border-gray-100 px-4 py-3 rounded-lg mb-2 hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-[#E76F2E] uppercase tracking-wider">
                        {item.category}
                      </span>
                      <span className="text-sm text-gray-700">
                        {item.questionText}
                      </span>
                    </div>
                    
                    {/* DELETE BUTTON */}
                    <button 
                      onClick={() => deleteItem(item._id)} 
                      className="text-red-400 hover:text-red-600 p-2 transition-colors ml-4"
                      title="Delete Point"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel