import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons'

function QEItem({ item, index, onDecision }) {
  const [decision, setDecision] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [modalImg, setModalImg] = useState(null)

  const handleDecision = (status) => {
    setDecision(status)
    onDecision(index, status, remarks)
  }

  const handleRemarks = (val) => {
    setRemarks(val)
    onDecision(index, decision, val)
  }

  return (
    <>
      {/* Full Image Modal */}
      {modalImg && (
        <div
          className="fixed inset-0 bg-black bg-opacity-85 z-[9999] flex items-center justify-center"
          onClick={() => setModalImg(null)}
        >
          <span className="absolute top-4 right-5 text-white text-3xl font-bold cursor-pointer">&times;</span>
          <img src={modalImg} className="max-w-[92%] max-h-[88vh] rounded-xl border-4 border-white" />
        </div>
      )}

      <div className={`bg-white mx-3 my-3 p-4 rounded-xl shadow-sm border-l-[5px] transition-all
        ${decision === 'pass' ? 'border-green-500' : decision === 'fail' ? 'border-red-500' : 'border-gray-300'}`}>

        {/* Question */}
        <span className="text-sm font-semibold text-gray-800 leading-snug block mb-3">
          <b>{index + 1}.</b> {item.question}
        </span>

        {/* SE Evidence Photos */}
        <span className="text-[11px] font-bold text-gray-500 uppercase">SE Evidence:</span>
        <div className="flex gap-2 overflow-x-auto py-2 border-t border-gray-100 mt-1">
          {item.photos && item.photos.length > 0
            ? item.photos.map((p, i) => (
                <img
                  key={i}
                  src={p}
                  onClick={() => setModalImg(p)}
                  className="w-16 h-16 rounded-lg object-cover border border-gray-200 cursor-pointer shrink-0"
                />
              ))
            : <span className="text-gray-400 text-xs">No Photos Uploaded</span>
          }
        </div>

        {/* Pass / Fail Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => handleDecision('pass')}
            className={`flex-1 py-2 rounded-lg border-2 font-bold text-sm transition-all
              ${decision === 'pass'
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'}`}
          >
            <FontAwesomeIcon icon={faCheckCircle} className="mr-1" /> PASS
          </button>
          <button
            onClick={() => handleDecision('fail')}
            className={`flex-1 py-2 rounded-lg border-2 font-bold text-sm transition-all
              ${decision === 'fail'
                ? 'bg-red-500 text-white border-red-500'
                : 'bg-white text-gray-600 border-gray-300 hover:border-red-400'}`}
          >
            <FontAwesomeIcon icon={faTimesCircle} className="mr-1" /> FAIL
          </button>
        </div>

        {/* Remarks — Sirf Fail Pe Dikhega */}
        {decision === 'fail' && (
          <div className="mt-3 animate-pulse-once">
            <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Failure Remarks:</span>
            <textarea
              value={remarks}
              onChange={e => handleRemarks(e.target.value)}
              placeholder="Write reason for failure..."
              className="w-full p-2 rounded-lg border border-gray-300 text-sm font-sans resize-none focus:outline-none focus:border-red-400"
              rows={3}
            />
          </div>
        )}
      </div>
    </>
  )
}

export default QEItem