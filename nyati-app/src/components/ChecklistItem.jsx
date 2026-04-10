import { useState, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCamera, faTimes } from '@fortawesome/free-solid-svg-icons'

function ChecklistItem({ item, index, onUpdate }) {
  const [checked, setChecked] = useState(false)
  const [photos, setPhotos] = useState([])
  const fileInputRef = useRef(null)

  const handlePhotoAdd = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const newPhotos = [...photos, event.target.result]
      setPhotos(newPhotos)
      onUpdate(index, checked, newPhotos)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removePhoto = (i) => {
    const newPhotos = photos.filter((_, idx) => idx !== i)
    setPhotos(newPhotos)
    onUpdate(index, checked, newPhotos)
  }

  const handleCheck = () => {
    const newChecked = !checked
    setChecked(newChecked)
    onUpdate(index, newChecked, photos)
  }

  return (
    <div className={`bg-white mx-3 my-3 p-4 rounded-xl border transition-all duration-300 
      ${checked ? 'border-l-[6px] border-green-500 bg-green-50' : 'border border-gray-200'}`}>

      <div className="flex justify-between items-start gap-3">
        <span className="text-sm font-semibold text-gray-800 leading-snug">
          <span className="text-[#E76F2E] text-[11px] block uppercase mb-1">{item.category}</span>
          {item.questionText}
        </span>
        <input
          type="checkbox"
          checked={checked}
          onChange={handleCheck}
          className="mt-1 w-5 h-5 cursor-pointer accent-green-600 shrink-0"
        />
      </div>

      <div className="mt-3">
        <div
          onClick={() => fileInputRef.current.click()}
          className="bg-gray-100 border border-dashed border-gray-400 text-gray-600 text-sm font-semibold rounded-lg py-2 text-center cursor-pointer hover:bg-gray-200 transition"
        >
          <FontAwesomeIcon icon={faCamera} className="mr-2" />
          Take Photo
        </div>

        <input
          type="file"
          accept="image/*"
          capture="camera"
          ref={fileInputRef}
          onChange={handlePhotoAdd}
          className="hidden"
        />

        {photos.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-2">
            {photos.map((photo, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300">
                <img src={photo} alt="evidence" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center border border-white"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChecklistItem