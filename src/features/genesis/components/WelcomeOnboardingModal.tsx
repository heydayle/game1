interface WelcomeOnboardingModalProps {
  isOpen: boolean
  onStartCustomGenesis: () => void
  onSelectDefaultPlanet: () => void
}

export function WelcomeOnboardingModal({
  isOpen,
  onStartCustomGenesis,
  onSelectDefaultPlanet,
}: WelcomeOnboardingModalProps) {
  if (!isOpen) return null

  return (
    <div
      data-testid="welcome-onboarding-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl border border-cyan-500/30 bg-gray-950 font-sans shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden">
        {/* Header Ribbon */}
        <div className="border-b border-white/10 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 px-6 py-5 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-radial from-cyan-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/50 px-3 py-1 text-[11px] font-mono text-cyan-300 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span>CHÀO MỪNG ĐẾN VỚI EVOLUTION SANDBOX</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-wider text-white uppercase font-mono drop-shadow">
            Vũ Trụ Giả Lập Hành Tinh & Tiến Hóa
          </h1>
          <p className="mt-1 text-xs text-gray-400 max-w-lg mx-auto">
            Khám phá, kiến tạo và tác động lên dòng chảy tiến hóa sinh học trên quả địa cầu 3D tương tác.
          </p>
        </div>

        {/* Introduction Pillars */}
        <div className="overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-white/5 bg-white/5 p-3 space-y-1">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold font-mono">
                <span>🪐</span>
                <span>Vật Lý & Địa Hóa Học Động</span>
              </div>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                Quả địa cầu tự quay theo chu kỳ ngày/đêm và mùa; nồng độ khí quyển ($N_2, O_2, CO_2, CH_4$) và vỏ khoáng sản biến thiên liên tục theo chuyển động hành tinh.
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/5 p-3 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold font-mono">
                <span>🧪</span>
                <span>Khởi Sinh & Tiến Hóa Tự Nhiên</span>
              </div>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                Sự sống bắt đầu từ phản ứng hóa học nguyên tố tự tổ hợp thành tế bào đầu tiên, di truyền alen Men-đen, chọn lọc tự nhiên và phân loài theo các quần xã (biomes).
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/5 p-3 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-semibold font-mono">
                <span>⚡</span>
                <span>Thảm Họa & Tái Sinh Tự Động</span>
              </div>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                Thử thách sinh quyển với thiên thạch, siêu núi lửa, kỷ băng hà. Khi sự sống tuyệt chủng, nếu môi trường hồi phục thì hệ sinh thái mới sẽ tự động tái sinh!
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/5 p-3 space-y-1">
              <div className="flex items-center gap-2 text-purple-400 font-semibold font-mono">
                <span>💾</span>
                <span>Lưu Trữ & Âm Thanh Vũ Trụ</span>
              </div>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                Lưu thế giới vào IndexedDB, xuất/nhập hồ sơ JSON, phím tắt điều khiển nhanh và thưởng thức synth âm thanh vũ trụ mô phỏng thời gian thực.
              </p>
            </div>
          </div>

          {/* Action Choice Prompt */}
          <div className="pt-2 text-center">
            <span className="text-[11px] font-mono tracking-wider uppercase text-gray-400 font-semibold">
              Bắt đầu hành trình khởi nguyên của bạn:
            </span>
          </div>

          {/* Two Big Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {/* Option 1: Custom Genesis Protocol */}
            <button
              onClick={onStartCustomGenesis}
              className="group relative flex flex-col justify-between rounded-xl border border-blue-500/40 bg-gradient-to-b from-blue-950/40 to-blue-900/20 p-4 text-left transition-all hover:border-blue-400 hover:bg-blue-900/40 hover:shadow-lg hover:shadow-blue-500/20"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    ✦ Tạo Hành Tinh Riêng
                  </span>
                  <span className="rounded bg-blue-500/30 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-blue-300 uppercase">
                    Khuyên Dùng
                  </span>
                </div>
                <p className="text-xs text-blue-300/80 font-mono">Genesis Protocol (10 Câu hỏi)</p>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  Tự tay định hình quỹ đạo sao, khí quyển, biển cả, kiến tạo mảng và khoáng chất qua chuỗi câu hỏi khởi nguyên vũ trụ.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
                <span>Bắt đầu thiết kế</span>
                <span>→</span>
              </div>
            </button>

            {/* Option 2: Default Planet (Gaia) */}
            <button
              onClick={onSelectDefaultPlanet}
              className="group relative flex flex-col justify-between rounded-xl border border-white/15 bg-gradient-to-b from-gray-900/50 to-gray-950 p-4 text-left transition-all hover:border-emerald-500/40 hover:bg-gray-900/80 hover:shadow-lg hover:shadow-emerald-500/10"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    ⚡ Hành Tinh Mặc Định
                  </span>
                  <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-gray-400 uppercase">
                    Vào Chơi Ngay
                  </span>
                </div>
                <p className="text-xs text-emerald-400/80 font-mono">Gaia — Trái Đất Sơ Khai</p>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  Khám phá ngay hành tinh cân bằng hoàn hảo (đại dương 70%, khí quyển ôn hòa 15°C, tài nguyên phong phú).
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>Vào thẳng mô phỏng</span>
                <span>→</span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer info note */}
        <div className="border-t border-white/10 bg-gray-950 px-6 py-3 text-center text-[10px] text-gray-500 font-mono">
          Bạn luôn có thể mở lại Genesis Protocol bất kỳ lúc nào bằng phím tắt <kbd className="rounded border border-white/20 bg-black/60 px-1.5 py-0.5 text-gray-300">G</kbd> hoặc nút trên thanh công cụ.
        </div>
      </div>
    </div>
  )
}
