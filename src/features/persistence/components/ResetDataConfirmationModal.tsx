import { useEffect, useState } from 'react'
import { SoundFX } from '../../audio/SoundFXEngine.js'

export interface ResetDataConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmReset: () => Promise<void> | void
}

export function ResetDataConfirmationModal({
  isOpen,
  onClose,
  onConfirmReset,
}: ResetDataConfirmationModalProps) {
  const [isWiping, setIsWiping] = useState(false)

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isWiping) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isWiping, onClose])

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsWiping(true)
    SoundFX.playClick()
    try {
      await onConfirmReset()
    } finally {
      setIsWiping(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md font-mono select-none p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-rose-500/50 bg-gradient-to-b from-rose-950/90 via-gray-950 to-black p-6 shadow-2xl shadow-rose-950/60">
        {/* Header with Warning Icon */}
        <div className="flex items-center gap-3 border-b border-rose-500/20 pb-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-950/80 border border-rose-500/40 text-xl shadow-inner text-rose-400">
            ⚠️
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Xác Nhận Xóa Dữ Liệu
            </h2>
            <p className="text-[11px] text-rose-300/90 font-medium">
              Khởi động lại toàn bộ thế giới mới
            </p>
          </div>
        </div>

        {/* Warning Body */}
        <div className="mt-4 space-y-3 text-xs text-gray-300">
          <p className="leading-relaxed text-gray-200">
            Hành động này sẽ <strong className="text-rose-400 font-bold">xóa vĩnh viễn</strong> toàn bộ tiến trình và dữ liệu đã lưu trữ trên trình duyệt:
          </p>

          <div className="rounded-xl border border-white/5 bg-black/60 p-3 space-y-2 text-[11px] text-gray-300">
            <div className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span>Toàn bộ các bản lưu trong Kho lưu trữ (World Archives)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span>Phiên chơi tự động lưu (Auto-Save Session)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span>Lịch sử các loài sinh vật, quần thể và chỉ số hành tinh</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span>Đặt lại và mở màn hình chọn câu hỏi tạo hành tinh mới (Genesis)</span>
            </div>
          </div>

          <p className="text-[11px] italic text-rose-400/90 bg-rose-950/30 border border-rose-500/20 rounded-lg p-2">
            ⚠️ Lưu ý: Sau khi xóa dữ liệu, bạn sẽ không thể hoàn tác hay khôi phục lại thế giới cũ!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-white/10 text-xs">
          <button
            onClick={() => {
              SoundFX.playClick()
              onClose()
            }}
            disabled={isWiping}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
          >
            Hủy bỏ (Giữ lại)
          </button>

          <button
            onClick={handleConfirm}
            disabled={isWiping}
            className="flex items-center gap-2 rounded-lg border border-rose-500 bg-rose-600 px-4 py-2 font-bold text-white shadow-lg shadow-rose-900/50 hover:bg-rose-500 transition-all disabled:opacity-50"
          >
            {isWiping ? (
              <>
                <span className="flex h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Đang xóa sạch...</span>
              </>
            ) : (
              <>
                <span>🗑️</span>
                <span>Xóa sạch & Chơi mới</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

