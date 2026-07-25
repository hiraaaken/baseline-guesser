# baseline-guesser 仕様書 (Draft)

> Issue #1(要件・仕様の検討)の議論をもとにまとめた仕様ドラフト。実装を進めながら随時更新する。

## 1. コンセプト

**CSSプロパティが各主要ブラウザでいつからサポートされたか(＝Baseline情報)だけを手がかりに、そのCSSプロパティ名を当てる4択クイズ。**

CSSに詳しい人ほど「あ、このタイミングでBaseline入りしたのはあれだ」と当てられる、知識と時代感覚を試すゲーム。逆に「まだBaseline入りしていないと思ってた機能が実はもう対応済みだった」という発見も狙う。

## 2. ゲームルール

### 2.1 出題形式

- 1問ごとに **4択のクイズ** を出題する
- プレイヤーが4つの選択肢からCSSプロパティ名を1つ選ぶと、即座に正誤を判定してフィードバックを表示
- フィードバック後、「次の問題へ」で次の設問に進む
- **エンドレス形式**(セッション内で連続出題、終了条件なし。プレイヤーが好きなタイミングでやめられる)

### 2.2 出題されるヒント

問題画面では、対象プロパティの**名前を伏せた状態**で以下の情報のみを提示する。

- ブラウザ別サポート開始バージョン表(Chrome / Firefox / Safari / Edge それぞれの対応開始バージョン)
- Baseline日付(Baseline Widely/Newly available になった年月)

プロパティ名や説明文、使用例コードなど「名前がわかってしまう」情報は出題画面では一切出さない。

### 2.3 選択肢(4択)の生成ロジック

- 正解1つ + 誤答(distractor)3つで構成
- 誤答は **正解と Baseline 時期が近いプロパティ** から優先的に選ぶ
  - 例: 正解が2021年頃Baseline入りしたプロパティなら、同じく2021年前後にBaseline入りした別プロパティを混ぜる
  - バージョン表を見ただけでは選べないようにし、実際の知識・記憶を問う難易度にする
  - 実装イメージ: 全プロパティをBaseline日付でソートし、正解の前後から近い順に3件をサンプリング(重複カテゴリの偏りは許容)

### 2.4 出題対象の範囲

- **Baseline情報を持つ全CSSプロパティ**を対象とする(Widely available / Newly available を問わず絞り込みなし)
- ただし `baseline: false`(まだBaselineに達していない実験的機能)は、クイズの前提(いつBaseline入りしたか)が成立しないため出題対象外とする
- ベンダープレフィックス付きプロパティ、廃止(deprecated)プロパティも出題対象外とする

### 2.5 正誤判定・フィードバック

- 回答直後に正解・不正解を表示
- 正解プロパティ名、簡単な説明(MDN概要の抜粋など)、実際のバージョン表を再掲して答え合わせできるようにする
- 不正解時も同様に正解を明示する(勉強要素)

### 2.6 スコア・記録

- 連続正解数(streak)をカウントし、セッション中およびブラウザの `localStorage` にベスト記録を保持
- 出題数・正解数・正答率も累積で記録
- サーバー保存やランキング機能は現時点ではスコープ外(静的SPAのため)

## 3. データソース

- [`web-features`](https://www.npmjs.com/package/web-features)(web-platform-dx が公開する Baseline データの npm パッケージ)を利用する
- ビルド時に `web-features` から CSS プロパティに該当するフィーチャー(`compat_features` が `css.properties.*` のもの)を抽出し、静的JSONとして生成する
  - プロパティ名
  - Baseline ステータス(`high` / `low` / `false`)
  - Baseline 日付(`baseline_low_date`)
  - ブラウザ別サポート開始バージョン(`status.support.chrome` など)
- ランタイムで外部APIを叩かず、ビルド済みJSONのみで動作する(オフライン動作可能)

## 4. 画面構成(UI)

- **クイズ画面**: バージョン表 + 4択の選択肢 + 現在のstreak表示
- **結果(フィードバック)画面 / モーダル**: 正誤 + 正解プロパティ名 + 補足説明 + 「次の問題へ」ボタン
- **統計サマリー**(ヘッダー等に常時表示): 現在のstreak、ベストstreak、累計正答率

## 5. 技術スタック

- フロントエンドのみの静的SPA
- **React + Vite + TypeScript** を想定
- ホスティングは GitHub Pages を想定
- データ生成はビルド前処理スクリプト(Node.js)で `web-features` から静的JSONを出力

## 6. データモデル(案)

```ts
type BaselineStatus = "high" | "low"; // false(未Baseline)は出題対象外のため除外済み

interface QuizProperty {
  id: string;           // 例: "css.properties.gap"
  name: string;          // 例: "gap"
  baselineStatus: BaselineStatus;
  baselineDate: string;  // 例: "2020-09-15"
  support: {
    chrome: string;
    firefox: string;
    safari: string;
    edge: string;
  };
  description?: string;  // 答え合わせ時に表示する簡単な説明
}
```

## 7. 今後の検討事項(未確定・要議論)

- 誤答選定で「近さ」の閾値・件数が不足するプロパティ(Baseline初期の頃のプロパティなど)が出た場合のフォールバック挙動
- 説明文(description)の出典・取得方法(MDNデータを別途組み込むか、`web-features` の `description` フィールドで足りるか)
- 出題の重複回避(直近N問は再出題しない、など)
- モバイル対応・アクセシビリティ要件
- 将来的なバックエンド化(ランキング、デイリーモード追加など)の可能性
