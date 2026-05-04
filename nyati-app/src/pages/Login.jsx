import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

import BASE_URL from '../config'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const checkLogin = async () => {
    if (!username || !password) return alert('Username aur Password dono bharo!')
    setLoading(true)
    try {
      const res = await axios.post(`${BASE_URL}/api/login`, { username, password })

      if (res.data.success) {
        // Aapka existing data structure
        const userData = {
          fullName: res.data.fullName,
          role: res.data.role,
          siteName: res.data.siteName,
          block: res.data.block,
          floor: res.data.floor,
          initials: res.data.fullName
            ? res.data.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : 'US'
        }

        // ✅ localStorage mein save karo
        localStorage.setItem('nyati_user', JSON.stringify(userData))

        // ✅ LOGIN SUCCESS HONE KE BAAD KA LOGIC (ADD KIYA GAYA)
        // Hum res.data.role use kar rahe hain kyunki aapka backend wahi bhej raha hai
        if (res.data.role === 'ADMIN') {
          navigate('/admin'); // Admin ko checklist page pe bhejo
        } else if (res.data.role === 'SE') {
          navigate('/se');
        } else if (res.data.role === 'QE') {
          navigate('/qe');
        } else if (res.data.role === 'HOD') {
          navigate('/hod');
        } else {
          alert('Unknown role: ' + res.data.role)
        }

      } else {
        alert('Galat Password ya ID hai!')
      }
    } catch (err) {
      console.error("Login error:", err)
      alert('Server connect nahi ho raha!')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#eef2f3] flex items-center justify-center px-4">
      <div className="bg-white p-10 rounded-2xl shadow-lg w-full max-w-sm text-center">

        {/* Logo */}
        <div className="flex justify-center mb-2">
          <img
            src="/logo.png"
            alt="Nyati Logo"
            className="h-12 w-auto"
          />
        </div>

        <h1 className="text-lg font-black text-[#004080] mt-4 uppercase tracking-normal">NECPL Quality Application</h1>
        <hr className="mt-4 mb-6 border-gray-100" />

        <h2 className="text-base font-semibold text-gray-700 mb-6">User Login</h2>

        <div className="text-left mb-3">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Username</label>
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg mt-1 text-sm focus:outline-none focus:border-[#004080] bg-gray-50"
          />
        </div>

        <div className="text-left mb-6">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && checkLogin()}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg mt-1 text-sm focus:outline-none focus:border-[#004080] bg-gray-50"
          />
        </div>

        <button
          onClick={checkLogin}
          disabled={loading}
          className="w-full py-3 bg-[#004080] text-white font-bold rounded-lg hover:bg-blue-900 transition disabled:opacity-60 uppercase tracking-widest text-sm"
        >
          {loading ? 'Signing in...' : 'SIGN IN'}
        </button>

        <p className="text-[9px] text-gray-300 mt-6">© 2026 Nyati Group | All Rights Reserved</p>
      </div>
    </div>
  )
}

export default Login