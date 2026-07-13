type FirstTurnAnnouncementProps = {
  isMeFirst: boolean;
  opponentName: string;
};

export function FirstTurnAnnouncement({ isMeFirst, opponentName }: FirstTurnAnnouncementProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center flex-col gap-6 p-6 bg-zinc-400 text-zinc-900">
      <p className="text-sm font-medium text-zinc-700">対戦相手：{opponentName}</p>

      <div className="flex flex-col items-center gap-4 animate-popIn">
        <div
          className={`w-24 h-24 rounded-full border-4 flex items-center justify-center text-3xl font-black bg-white shadow-sm ${
            isMeFirst
              ? 'border-amber-500 text-amber-600 shadow-amber-600/10'
              : 'border-blue-500 text-blue-600 shadow-blue-600/10'
          }`}
        >
          {isMeFirst ? '先' : '後'}
        </div>

        <p className="text-2xl font-black tracking-wide text-zinc-900">
          {isMeFirst ? 'あなたが先攻です！' : 'あなたが後攻です'}
        </p>

        {/* {!isMeFirst && (
          <p className="text-sm font-medium text-zinc-700 bg-white/40 px-4 py-1.5 rounded-full border border-zinc-300/30">
            後攻ボーナスとしてHPが少し多い状態で始まります
          </p>
        )} */}
      </div>
    </div>
  );
}