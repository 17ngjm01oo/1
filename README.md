# IMF GDP Chart

IMF DataMapper API から事前取得した WEO の `NGDPD` と `NGDPDPC` データを静的JSONとして読み込み、国別の名目GDPと1人当たり名目GDPの推移を 1980-2026 年の折れ線グラフで表示する静的Webアプリです。

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

公開サイトの閲覧者のブラウザから IMF API へ直接アクセスしません。表示用データは `data/imf/` の静的JSONを読み込みます。

IMF DataMapper API から最新データを取得して静的JSONを更新する場合は、管理者が以下を実行してください。

```bash
npm run update-data
```

生成されるファイル:

```text
data/imf/nominal-gdp.json
data/imf/nominal-gdp-per-capita.json
```

更新スクリプトは以下の形式で IMF DataMapper API にアクセスします。`NGDPDPC` も同じ形式で取得します。

```text
https://www.imf.org/external/datamapper/api/v1/NGDPD?periods=1980,1981,...,2026
```

DataMapper の画面URLでは `NGDPD@WEO` のように dataset を含めますが、更新スクリプトでは指標単位のJSONを取得します。

API のベースURLは `scripts/update-data.py` と `src/config.js` に集約しています。将来 SDMX API や別バージョンへ移す場合は、更新スクリプトと `src/config.js` の設定を合わせて変更してください。

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
staticDataPath: "./data/imf/nominal-gdp.json",
unitLabel: "Billions of U.S. dollars",
```

GDP per capita などへ変更する場合は、IMF DataMapper の指標コードを確認し、`indicatorCode`、表示用の `titleTemplate`、`unitLabel`、`staticDataPath` を合わせて変更してください。

新しい指標を追加する場合は、`seriesConfigs` に `canvasId`、`statusId`、`indicatorCode`、`titleTemplate`、`unitLabel`、`staticDataPath` などを持つ設定を追加し、`index.html` に同じIDの `canvas` とステータス要素を持つブロックを追加します。あわせて `scripts/update-data.py` の `SERIES` に指標コードと出力ファイル名を追加してください。

## 期間を変更する場合

`src/config.js` の `seriesConfigs` にある対象グラフの以下を変更します。

```js
startYear: 1980,
endYear: 2026,
```

`scripts/update-data.py` が `periods` クエリを生成し、`src/transform.js` が同じ期間でフィルタします。
