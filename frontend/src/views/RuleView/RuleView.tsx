export function RuleView() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">ルール説明</h2>

      <section>
        <h3 className="font-bold text-indigo-300 mb-1">基本ルール</h3>
        <p className="text-sm text-gray-300">
          交互にしりとりの単語を入力し合い、相手のHPを0にすれば勝利です。
          1ターンの制限時間は15秒。時間内に入力できないとターンを失います。
        </p>
      </section>

      <section>
        <h3 className="font-bold text-indigo-300 mb-1">ダメージについて</h3>
        <p className="text-sm text-gray-300">
          入力した単語が短いほど、ダメージは指数関数的に大きくなります。
          1文字の単語は最大威力ですが、しりとりで1文字を続けるのは至難の業。
          短期決戦を狙うか、安全に長い単語で立ち回るかが戦略の鍵になります。
        </p>
      </section>

      <section>
        <h3 className="font-bold text-indigo-300 mb-1">反射（カウンター）</h3>
        <p className="text-sm text-gray-300">
          相手が入力している最中に、あなたが同じ単語を入力すると「反射」が発動し、
          カウンターダメージを与えられます。相手の思考を読む心理戦がカギです。
        </p>
      </section>

      <section>
        <h3 className="font-bold text-indigo-300 mb-1">キャラクター</h3>
        <p className="text-sm text-gray-300">
          4人のキャラクターから1人を選んで対戦します。それぞれHPや固有スキルが異なります。
        </p>
      </section>
    </div>
  );
}