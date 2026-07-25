type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      {/*
        ★サイズを固定（h-[32rem]。ビューポートが低い端末ではmax-hで収める）にし、
          overflow-y-autoはここでは付けない。スクロールする範囲は中身（children）側で
          flex-1 + overflow-y-auto を使って自分で決める（ヘッダー/フッターを固定しつつ
          中央だけスクロールさせたい、といったレイアウトを子側で自由に組めるようにするため）。
      */}
      <div
        className="bg-white rounded-2xl max-w-lg w-full h-[32rem] max-h-[80vh] relative shadow-xl border border-stone-200/60 text-stone-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-stone-400 hover:text-stone-700 text-xl transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 bg-white/80"
        >
          ✕
        </button>

        {/* 子要素が h-full flex flex-col で全体に広がれるよう、ここは min-h-0 の flex-1 コンテナにする */}
        <div className="flex-1 min-h-0 p-6 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
