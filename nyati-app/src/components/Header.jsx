import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserCircle, faStickyNote, faSignOutAlt } from '@fortawesome/free-solid-svg-icons'

function Header({ userName, initials, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <div className="flex justify-between items-center bg-[#004080] text-white px-4 py-3 sticky top-0 z-50 shadow-md">
      <h2 className="text-lg font-bold">NYATI EXECUTION</h2>

      <div className="relative flex items-center cursor-pointer" onClick={() => setDropdownOpen(!dropdownOpen)}>
        <span className="text-xs mr-2">{userName}</span>
        <div className="w-8 h-8 bg-white text-[#004080] rounded-full flex items-center justify-center font-bold text-sm">
          {initials}
        </div>

        {dropdownOpen && (
          <div className="absolute top-full right-0 mt-2 bg-white shadow-lg rounded-lg w-40 z-50 border border-gray-100 overflow-hidden">
            <a href="#" className="flex items-center gap-2 px-3 py-3 text-sm text-gray-700 border-b hover:bg-gray-50">
              <FontAwesomeIcon icon={faUserCircle} /> My Profile
            </a>
            <a href="#" className="flex items-center gap-2 px-3 py-3 text-sm text-gray-700 border-b hover:bg-gray-50">
              <FontAwesomeIcon icon={faStickyNote} /> Manager Notes
            </a>
            <a href="#" onClick={onLogout} className="flex items-center gap-2 px-3 py-3 text-sm text-red-500 hover:bg-gray-50">
              <FontAwesomeIcon icon={faSignOutAlt} /> Sign-out
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default Header