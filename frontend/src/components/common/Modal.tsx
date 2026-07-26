type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-stone-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* モーダル外枠コンテナ：
        外枠（背景・角丸・影・ボーダー）はすべてここで一括管理します
      */}
      <div
        className="bg-white rounded-3xl max-w-lg w-full h-[32rem] max-h-[85vh] relative shadow-2xl border border-stone-200/80 text-stone-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          aria-label="閉じる"
          className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-stone-100/80 text-stone-400 hover:text-stone-700 hover:bg-stone-200/80 transition-all duration-200 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 子要素（RuleViewなど）が入る内部パディング領域 */}
        <div className="flex-1 min-h-0 p-6 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}