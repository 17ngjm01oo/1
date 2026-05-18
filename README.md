# WEO GDP Chart

IMF World Economic Outlook の本体データから作成した静的JSONを読み込み、国別の名目GDPと1人当たり名目GDPの推移を 1980-2026 年の折れ線グラフで表示する静的Webアプリです。

## ローカルでの起動方法

静的ファイルとして配信してください。

```bash
python3 server.py
```

ブラウザで以下を開きます。

```text
http://127.0.0.1:8001
```

## データ更新方法

公開サイトの閲覧者のブラウザから IMF API へ直接アクセスしません。表示用データは `data/weo/current-prices.json` の静的JSONを読み込みます。

IMF World Economic Outlook の本体データから静的JSONを更新する場合は、管理者が以下を実行してください。

```bash
npm run update-data
```

IMF側のダウンロード制限などで自動取得できない場合は、WEO Entire Dataset Excel を手動でダウンロードし、以下の場所へ置いてください。

```text
data/weo/source/WEOApr2026all.xlsx
```

その後、手動Excelを同じ共通変換処理へ流します。

```bash
npm run update-data:local
```

別の場所に置いたExcelを使う場合は、パスを直接指定できます。

```bash
python3 scripts/update-weo-data-from-local.py /path/to/WEOApr2026all.xlsx
```

生成されるファイル:

```text
data/weo/current-prices.json
```

自動取得でも手動Excelでも、最終的には同じ `data/weo/current-prices.json` を生成します。更新スクリプトは WEO Entire Dataset Excel から `NGDPD`、`NGDPDPC`、`NGDP`、`NGDPPC`、`NGDP_R`、`NGDPRPC` を抽出し、サイト内部で使う共通JSON形式に変換します。

ブラウザ側の取得先は `src/config.js` の各 `seriesConfig.staticDataPath` で管理します。GitHub Pages などの静的ホスティングでは `/api/imf` やサーバー側proxyを使いません。

## 国を追加・変更する場合

国の一覧は `src/countries.js` の `countries` 配列で管理します。

```js
{ code: "USA", name: "United States", slug: "united-states", region: "North America" }
```

初期表示では国を自動選択しません。対象グラフの表示や指標設定は `src/config.js` の `seriesConfigs` にあります。

## 指標を変更する場合

`src/config.js` の `seriesConfigs` にある対象グラフの以下を変更します。

```js
indicatorCode: "NGDPD",
titleTemplate: "GDP, current prices",
staticDataPath: "./data/weo/current-prices.json",
unitLabel: "Billions of U.S. dollars",
```

GDP per capita などへ変更する場合は、WEO の指標コードを確認し、`indicatorCode`、表示用の `titleTemplate`、`unitLabel`、`staticDataPath` を合わせて変更してください。

新しい指標を追加する場合は、`seriesConfigs` に `canvasId`、`statusId`、`indicatorCode`、`titleTemplate`、`unitLabel`、`staticDataPath` などを持つ設定を追加し、`index.html` に同じIDの `canvas` とステータス要素を持つブロックを追加します。あわせて `scripts/update-weo-data.py` の `TARGET_INDICATORS` に指標コードを追加してください。

## 期間を変更する場合

`src/config.js` の `seriesConfigs` にある対象グラフの以下を変更します。

```js
startYear: 1980,
endYear: 2026,
```

`scripts/update-weo-data.py` と `src/config.js` の対象期間を合わせ、`src/transform.js` が同じ期間でフィルタします。
