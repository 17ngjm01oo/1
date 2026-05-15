# IMF GDP Chart

IMF DataMapper API から WEO の `NGDPD` と `NGDPDPC` データを取得し、米国の名目GDPと1人当たり名目GDPの推移を 1980-2026 年の折れ線グラフで表示する静的Webアプリです。

## ローカルでの起動方法

IMF API がブラウザ向けの CORS ヘッダーを返さないため、同じオリジンで配信する最小プロキシ付きサーバーで起動してください。

```bash
python3 server.py
```

ブラウザで以下を開きます。

```text
http://127.0.0.1:8001
```

## IMF API URLの確認方法

ブラウザの開発者ツールで Console を開くと、以下のログが出ます。

```text
[App] IMF API URL for verification: ...
[IMF API] Browser request URL: ...
[IMF API] Remote IMF URL: ...
[IMF API] Raw response
```

初期設定では以下の形式で IMF DataMapper API にアクセスします。`NGDPDPC` も同じ形式で取得します。

```text
https://www.imf.org/external/datamapper/api/v2/NGDPD/USA?periods=1980,1981,...,2026
```

IMF DataMapper の公開ドキュメントは現在 `api/v2` を案内しています。DataMapper の画面URLでは `NGDPD@WEO` のように dataset を含めますが、API の系列取得は `NGDPD/USA` で値が返り、レスポンス内のメタデータに `dataset: "WEO"` が含まれます。

API のベースURLは `src/config.js` の `dataSources.imfDataMapper.baseUrl` に集約しています。将来 SDMX API や別バージョンへ移す場合は、まずこの値と `src/imfApi.js` の URL 組み立て処理を変更してください。

ローカルプロキシは `server.py` の `/api/imf` で実装しています。ブラウザ側の取得先は `src/config.js` の `dataSources.imfDataMapper.proxyPath` と `useLocalProxy` で切り替えられます。

## 国を追加・変更する場合

国の一覧は `src/countries.js` の `countries` 配列で管理します。

```js
{ code: "USA", name: "United States", slug: "united-states", region: "North America" }
```

初期選択国は `src/config.js` の `selectedCountryCode` で管理します。対象グラフの表示や指標設定は `src/config.js` の `seriesConfigs` にあります。

```js
countryCode: "USA",
countryName: "United States",
```

例:

```js
countryCode: "JPN",
countryName: "Japan",
```

中国は `CHN`、ドイツは `DEU` を指定できます。複数国比較に拡張する場合は、各 `seriesConfig` を国配列にし、`src/main.js` で国ごとに取得、`src/chart.js` の `datasets` に複数系列を渡す形に拡張してください。

## 指標を変更する場合

`src/config.js` の `seriesConfigs` にある対象グラフの以下を変更します。

```js
indicatorCode: "NGDPD",
chartTitle: "United States GDP, current prices",
unitLabel: "Billions of U.S. dollars",
```

GDP per capita などへ変更する場合は、IMF DataMapper の指標コードを確認し、`indicatorCode` と表示用の `chartTitle`、`unitLabel` を合わせて変更してください。

新しい指標を追加する場合は、`seriesConfigs` に `canvasId`、`statusId`、`indicatorCode`、`chartTitle`、`unitLabel` などを持つ設定を追加し、`index.html` に同じIDの `canvas` とステータス要素を持つカードを追加します。

## 期間を変更する場合

`src/config.js` の `seriesConfigs` にある対象グラフの以下を変更します。

```js
startYear: 1980,
endYear: 2026,
```

`src/imfApi.js` が `periods` クエリを自動生成し、`src/transform.js` が同じ期間でフィルタします。
