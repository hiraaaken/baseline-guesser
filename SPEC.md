# baseline-guesser 仕様書

> Issue #1(要件・仕様の検討)の議論をもとにまとめた仕様ドラフト。実装を進めながら随時更新する。

## 1. コンセプト

**CSSプロパティが各主要ブラウザでいつからサポートされたか(＝Baseline情報)だけを手がかりに、そのCSSプロパティ名を当てる4択クイズ。**

CSSに詳しい人ほど「あ、このタイミングでBaseline入りしたのはあれだ」と当てられる、知識と時代感覚を試すゲーム。逆に「まだBaseline入りしていないと思ってた機能が実はもう対応済みだった」という発見も狙う。

### ポジショニング

対象は「CSSプロパティのBaseline対応時期を気にする層」という、フロントエンド界隈の中でもかなり狭いコミュニティ。広い層への迎合は狙わず、**このニッチに深く刺さること** を優先する。

## 2. ゲームルール

### 2.1 画面フロー

1. **ホーム画面**: タイトルと「問題を始める」ボタンのみのシンプルな構成。**ログイン機能は設けない**(匿名プレイ)
2. **コース選択画面**: 寿司打を参考に、**4つのコース**から1つを選ぶ
   - 初級(5問)/ 中級(10問)/ 上級(15問): 難易度別。出題数に加え、誤答(distractor)をBaseline時期がどれだけ近いプロパティから選ぶか(distractorWindow)を変える。上級ほど近い時期のプロパティが混ざり見分けにくくなる
   - 限定対応(Limited availability): Baseline日付を持たない `baseline:false` のプロパティが対象。「いつBaseline入りしたか」ではなく「どのブラウザの組み合わせで対応しているか」を当てる、別軸のクイズ(2.4節)
3. **プレイ画面**: コースを選ぶと、サーバーが出題データを生成してクイズが始まる(2.3節)
4. **フィードバック**: 1問ごとに回答直後、正誤・正解・補足説明を表示
5. **リザルト画面**: コース終了後にスコアを表示

### 2.2 出題されるヒント(ブラウザ対応状況カード)

MDN/web.dev の Baseline ウィジェットを参考にしたカードUIで、対象プロパティの**名前を伏せた状態**で以下の情報のみを提示する。

- **Baselineバッジ**: 「Baseline Widely available」または「Baseline Newly available」のラベル+アイコン+対応開始時期(例: 「since July 2015」)
- **ブラウザ対応状況アイコン列**: **Chrome → Edge → Firefox → Safari** の順にアイコンを並べる
  - 対応済みのブラウザ: アイコンにチェックマークを重ね、その近くに対応開始バージョン番号を表示(例: Chrome ✅ 57)
  - 非対応のブラウザ: アイコンにバツマークを重ねる(バージョン番号は表示しない)

プロパティ名・説明文・使用例コードは、名前が推測できてしまうため出題画面では一切出さない(MDN由来の説明文は多くの場合プロパティ名を文中に含むため、回答前には表示せず、回答後のフィードバックでのみ見せる)。

### 2.3 出題ロジック(サーバーサイド)

- クイズの生成・判定は **SvelteKitのバックエンド(APIルート)側で行う**(5節参照)
- コース選択画面で「コースを選ぶ」→ フロントエンドがサーバーへ開始リクエストを送る → サーバーがビルド時にバンドルした Baseline データ(3節)から、そのコースに応じた問題セットをランダムに生成してレスポンスを返す
- **正解のプロパティ名はレスポンスに含めない**(クライアントの開発者ツールで正解が見えてしまうのを防ぐため)。回答はクライアント→サーバーに送信し、サーバー側で正誤判定して結果(正誤・正解名・補足説明)を返す
- **選択肢(4択)の生成ロジック**:
  - 正解1つ + 誤答(distractor)3つで構成
  - 誤答は **正解と Baseline 時期が近いプロパティ** から優先的に選ぶ(バージョン表を見ただけでは選べないようにし、実際の知識・記憶を問う難易度にする)
  - 実装イメージ: 全プロパティをBaseline日付でソートし、正解の前後から近い順に3件をサンプリング

### 2.4 出題対象の範囲

- **Baseline情報を持つ全CSSプロパティ**を対象とする(Widely available / Newly available / Limited availability を問わず絞り込みなし)
- ベンダープレフィックス付きプロパティ、廃止(deprecated)プロパティは出題対象外とする
- `baseline: false`(Limited availability)のプロパティは、Baseline日付を持たないため通常のコース(初級/中級/上級)には混ぜず、**「限定対応」コース専用のプール**として扱う
  - 出題内容: 対象プロパティの対応ブラウザアイコン(2.2節と同じUI)を見せ、「どのプロパティか」を当てる。Baselineバッジは表示しない(まだBaselineに達していないため)
  - 誤答(distractor)の選び方: Baseline時期という軸が使えないため、代わりに**対応ブラウザの組み合わせパターン(fingerprint)が近いもの**を選ぶ(Chrome/Edge/Firefox/Safariそれぞれの対応有無をビット列とみなし、Hamming距離が小さい順)

### 2.5 スコア・記録

- コースごと(初級/中級/上級)のベストスコア・クリア回数・累積正答率を `localStorage` に保存
- ログイン機能がないため、記録は端末単位(ブラウザ単位)で完結する
- グローバルなランキング・集計は現時点ではスコープ外(7節の将来検討事項)

## 3. データソース

- [`web-features`](https://www.npmjs.com/package/web-features)(web-platform-dx が公開する Baseline データの npm パッケージ)を利用する
- ビルド時に `web-features` から CSS プロパティに該当するフィーチャー(`compat_features` が `css.properties.*` のもの)を抽出し、静的JSONとしてバックエンド(サーバー)側にバンドルする
  - プロパティ名
  - Baseline ステータス(`high` / `low` / `false`)
  - Baseline 日付(`baseline_low_date`)
  - ブラウザ別サポート開始バージョン(`status.support.chrome` など)
- このデータはサーバー(SvelteKitのAPIルート)からのみ参照し、クライアントには問題生成後の出題データのみを渡す(全プロパティ一覧や正解データをクライアントに持たせない)
- ランタイムで外部APIを叩くことはしない(ビルド時にバンドル済みのデータのみを使用)

### 技術検証: Baselineデータ取得方法

- `web-features` npmパッケージとは別に、[webstatus.dev](https://github.com/GoogleChrome/webstatus.dev) が公開するREST API(`https://api.webstatus.dev/v1/features`)からも同等のBaselineデータを取得可能なことを確認した
  - 認証不要の公開API
  - レスポンスにブラウザ別(Chrome/Edge/Firefox/Safari)のサポート開始バージョン・日付、Baselineステータス・日付が含まれる(例: `/v1/features/backdrop-filter`)
  - `?q=group:css` のようなクエリでCSS関連フィーチャーの絞り込みも可能
- 本仕様では外部APIへの実行時依存を避けるため、引き続き **`web-features` npmパッケージをビルド時にバンドルする方式を採用**する(障害・レート制限・仕様変更などの外部要因でゲームが止まるリスクを避けるため)
  - webstatus.dev APIは、将来的にデータ鮮度をより重視したくなった場合の代替/バックアップ手段として記録しておく

## 4. 画面構成(UI)

1. **ホーム画面**: タイトル、「問題を始める」ボタン
2. **コース選択画面**: 3コース(難易度別、詳細は7節)から1つを選ぶ
3. **プレイ画面**: ブラウザ対応状況カード(2.2節)+ 4択の選択肢 + 現在の問題数/正解数表示
4. **フィードバック(正誤表示)**: 正誤 + 正解プロパティ名 + 補足説明 + 「次の問題へ」ボタン
5. **リザルト画面**: コースのスコアを表示

## 5. 技術スタック

- **SvelteKit** でフロントエンド・バックエンドの両方を実装する
  - フロントエンド: 画面(ホーム/コース選択/プレイ/リザルト)とUIコンポーネント
  - バックエンド: SvelteKitのAPIルート(`+server.ts` 等)で、出題生成・回答判定のロジックを実装
- ホスティングは **Cloudflare Pages/Workers**(`adapter-cloudflare` を使用)
- ログイン・会員登録機能は設けない(匿名プレイ。進捗・記録はすべて端末の `localStorage` に保存)
- データ生成はビルド前処理スクリプト(Node.js)で `web-features` から静的JSONを出力し、サーバー側コードにバンドルする
- 出題トークンの一時保存に **Cloudflare KV** を利用する(6節参照)
- 言語は **TypeScript**。ただし **TypeScript 7(ネイティブGoコンパイラ版)は現時点では使わず、7未満の最新版(`sv create` 既定の `^6.0` 系)にピンする**
  - 理由: TS 7は `svelte-check`/`svelte2tsx` が依存するCJS API形状を提供しておらず、起動時にクラッシュする(2026-07時点、Svelteチームは対応中・未リリース)
  - Svelte language-toolsがTS 7に正式対応した時点で移行を検討する(7節に追記)

## 6. API設計

SvelteKitのAPIルート(`src/routes/api/**/+server.ts`)として実装する。

> 対象ユーザーはフロントエンドエンジニア層(1節)であり、DevToolsのNetworkタブを覗くのは当然の行動として想定する。そのため正解はレスポンスに含めず、`questionToken` + Cloudflare KV によるサーバーサイド判定を必須の設計とする(クライアント側だけで完結する簡易実装は採用しない)。

### `POST /api/course/start`

- Request: `{ courseId: "beginner" | "intermediate" | "advanced" }`
- サーバー側処理:
  1. コース定義(出題数・難易度パラメータ)に応じて、バンドル済みBaselineデータからランダムに正解プロパティを選定
  2. 各問について、正解とBaseline時期が近い誤答3件を選定し、4択をシャッフル
  3. 問題ごとにランダムな **`questionToken`**(不透明なID)を発行し、Cloudflare KVに `{ questionToken: 正解プロパティ名 }` をTTL付き(例: 15分)で保存する
- Response: `{ questions: QuizQuestion[] }`(`QuizQuestion` は `questionToken` を含み、正解プロパティ名は含まない。6節末のデータモデル参照)
- コースの全問をこの1回のリクエストでまとめて生成・返却する(1問ごとに都度リクエストする方式は採用しない)

### `POST /api/answer`

- Request: `{ questionToken: string, choice: string }`
- サーバー側処理: KVから `questionToken` に対応する正解プロパティ名を取得して照合し、**照合後にそのKVエントリを削除**(使い捨てトークンとし、同じ問題への再回答・リプレイを防ぐ)
- Response: `{ correct: boolean, correctAnswer: string, description?: string }`

コース一覧(4コースのメタ情報)は変動が少ないため、API化せずSvelteKitフロントエンド側の静的設定として保持する。

## 7. データモデル(案)

```ts
// "limited" = Limited availability(baseline:falseで日付を持たない)
type BaselineStatus = "high" | "low" | "limited";

// サーバー内部で保持するプロパティデータ(クライアントには渡さない)
interface CssPropertyData {
  name: string;           // 例: "gap"
  baselineStatus: BaselineStatus;
  baselineDate: string | null;  // 例: "2020-09-15"。limitedの場合はnull
  support: {
    chrome: string | null;  // null = 非対応
    edge: string | null;
    firefox: string | null;
    safari: string | null;
  };
  description: string;   // 答え合わせ時に表示する簡単な説明
}

// サーバー → クライアント: 出題(正解は含まない)
interface QuizQuestion {
  questionToken: string;   // Cloudflare KVに正解と紐付けて保存される、不透明な使い捨てトークン
  baselineStatus: BaselineStatus;
  baselineDate: string | null;
  support: CssPropertyData["support"];
  choices: string[];       // 4択のプロパティ名(シャッフル済み)
}

// クライアント → サーバー: 回答
interface AnswerRequest {
  questionToken: string;
  choice: string;
}

// サーバー → クライアント: 判定結果
interface AnswerResult {
  correct: boolean;
  correctAnswer: string;
  description?: string;
}
```

## 8. 今後の検討事項(未確定・要議論)

- **コースのスコア指標**: 正答数のみか、寿司打のようにタイム要素(回答スピード)も加味するか
- 説明文(description)の出典・取得方法(MDNデータを別途組み込むか、`web-features` の `description` フィールドで足りるか)
- モバイル対応・アクセシビリティ要件
- **保留中: TypeScript 7への移行** — `svelte-check`/`svelte2tsx` がTS 7のネイティブコンパイラに対応次第、7未満の版からの移行を検討する
- **保留中: デイリーチャレンジモード・SNS共有機能**
  - 以前の検討では Wordle 型のデイリーモード(全員同じ問題+結果のSNS共有)をニッチ層への訴求の軸として想定していたが、現時点ではランダム出題のコース制を優先し、デイリーモードは一旦スコープ外とする
  - ニッチ層への浸透・拡散という当初の狙いを考えると、コース制が軌道に乗った後に再検討する価値がある
- 将来的なバックエンド活用の拡張(グローバルな正答率統計、ランキングなど。現状はログインなし・永続化なしのため実現には別途設計が必要)
