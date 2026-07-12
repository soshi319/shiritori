type FirstTurnAnnouncementProps = {
  isMeFirst: boolean;
  opponentName: string;
};

export function FirstTurnAnnouncement({ isMeFirst, opponentName }: FirstTurnAnnouncementProps) {
  return (
    <div className="flex h-screen items-center justify-center flex-col gap-6 p-6">
      <p className="text-gray-400">対戦相手：{opponentName}</p>

      <div className="flex flex-col items-center gap-3 animate-popIn">
        <div
          className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-3xl font-extrabold ${
            isMeFirst
              ? 'border-yellow-400 text-yellow-400'
              : 'border-blue-400 text-blue-400'
          }`}
        >
          {isMeFirst ? '先' : '後'}
        </div>

        <p className="text-2xl font-bold">
          {isMeFirst ? 'あなたが先攻です！' : 'あなたが後攻です'}
        </p>

        {!isMeFirst && (
          <p className="text-sm text-gray-400">後攻ボーナスとしてHPが少し多い状態で始まります</p>
        )}
      </div>
    </div>
  );
}