# baseline-guesser

CSSプロパティが各主要ブラウザでいつからサポートされたか(＝Baseline情報)だけを手がかりに、そのCSSプロパティ名を当てる4択クイズアプリ。詳細な仕様は [`SPEC.md`](./SPEC.md) を参照。

## Baselineデータについて

Baselineデータは [`web-features`](https://www.npmjs.com/package/web-features) パッケージから [`scripts/generate-baseline-data.ts`](./scripts/generate-baseline-data.ts) で抽出している。

- `web-features` の `features` は「機能単位」のデータで、1つのfeatureが複数のCSSプロパティ・複数の文脈をまとめていることがある(例: `absolute-positioning` というfeatureが `position`/`align-self`/`justify-self` など複数のプロパティ関連の挙動を束ねている)
- 各featureは `status.by_compat_key` に、[MDN Browser Compat Data](https://github.com/mdn/browser-compat-data) 形式のキー(compat key。例: `css.properties.gap`)ごとの詳細なBaseline/対応ブラウザ情報を持つ
- compat keyには `css.properties.position.absolute` のような「特定の値・文脈付き」のものも含まれるため、`css.properties.<name>` という「素のプロパティキー」だけを正規表現で抽出している(詳細は生成スクリプト参照)

## 開発環境

コンテナベースの開発環境([`.devcontainer/`](./.devcontainer))を使う。ランタイムはColima、パッケージマネージャーはaube。

### 前提条件

- [Colima](https://github.com/abiosoft/colima) が起動していること(`colima status` で確認、未起動なら `colima start`)
- `devcontainer` CLI が導入済みであること(`mise use -g npm:@devcontainers/cli` などで導入)

### コンテナのビルド・起動

```sh
devcontainer up --workspace-folder .
```

Dockerfileの変更後など、作り直したい場合は `--remove-existing-container` を付ける。

### コンテナ内でコマンドを実行する

`devcontainer exec --workspace-folder . -- bash -lc "cd /workspace && <command>"` は毎回打つには長いので、[`bin/dcx`](./bin/dcx) というラッパースクリプトを用意している。以降のコマンド例はすべてこれを使う。

```sh
bin/dcx <command>
```

### 依存のインストール

```sh
bin/dcx aube install
```

未承認のビルドスクリプト(`esbuild`/`workerd`など)がある場合は、内容を確認して承認する。

```sh
bin/dcx aube approve-builds
```

### 開発サーバーの起動

`devcontainer` CLI単体では `devcontainer.json` の `forwardPorts` が効かない([devcontainers/cli#186](https://github.com/devcontainers/cli/issues/186))ため、`--host` 指定とコンテナ側の `runArgs` によるポート公開(設定済み)の両方が必要。

```sh
bin/dcx aube run dev -- --host 0.0.0.0
```

ブラウザで [http://localhost:5173](http://localhost:5173) を開いて確認する。

### Neovimを使う場合

`devcontainer-cli.nvim`(dotfiles側に設定済み)を使うと、上記の一部をコマンドで代替できる。

- `:DevcontainerUp` — コンテナのビルド・起動
- `:DevcontainerConnect` — コンテナ内の対話ターミナルを開く
- `:DevcontainerExec [cmd]` — コンテナ内でコマンドを実行

## ビルド

```sh
bin/dcx aube run build
```

`aube run preview` でプロダクションビルドをプレビューできる。

デプロイ先はCloudflare Pages/Workers(`adapter-cloudflare`)を想定(詳細は [`SPEC.md`](./SPEC.md) 5節)。
