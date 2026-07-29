# baseline-guesser

CSSプロパティが各主要ブラウザでいつからサポートされたか(＝Baseline情報)だけを手がかりに、そのCSSプロパティ名を当てる4択クイズアプリ。詳細な仕様は [`SPEC.md`](./SPEC.md) を参照。

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

以降のコマンドはすべて以下の形でコンテナ内で実行する。

```sh
devcontainer exec --workspace-folder . -- bash -lc "cd /workspace && <command>"
```

### 依存のインストール

```sh
devcontainer exec --workspace-folder . -- bash -lc "cd /workspace && aube install"
```

### 開発サーバーの起動

`devcontainer` CLI単体では `devcontainer.json` の `forwardPorts` が効かない([devcontainers/cli#186](https://github.com/devcontainers/cli/issues/186))ため、`--host` 指定とコンテナ側の `runArgs` によるポート公開(設定済み)の両方が必要。

```sh
devcontainer exec --workspace-folder . -- bash -lc "cd /workspace && aube run dev -- --host 0.0.0.0"
```

ブラウザで [http://localhost:5173](http://localhost:5173) を開いて確認する。

### Neovimを使う場合

`devcontainer-cli.nvim`(dotfiles側に設定済み)を使うと、上記の一部をコマンドで代替できる。

- `:DevcontainerUp` — コンテナのビルド・起動
- `:DevcontainerConnect` — コンテナ内の対話ターミナルを開く
- `:DevcontainerExec [cmd]` — コンテナ内でコマンドを実行

## ビルド

```sh
devcontainer exec --workspace-folder . -- bash -lc "cd /workspace && aube run build"
```

`aube run preview` でプロダクションビルドをプレビューできる。

デプロイ先はCloudflare Pages/Workers(`adapter-cloudflare`)を想定(詳細は [`SPEC.md`](./SPEC.md) 5節)。
