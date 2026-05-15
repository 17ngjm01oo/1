IMF DataMapper / WEO のデータを使って、米国の名目GDP推移を1980年から2025年まで折れ線グラフで表示するWebページを作ってください。

目的：
- 最初は「United States / GDP, current prices / billions of U.S. dollars / 1980–2025」を表示する。
- ただし、将来的に他の国、日本・中国・ドイツなど、他の指標、GDP per capita、real GDP growth、PPP GDPなども追加しやすい設計にする。
- 単発のハードコードではなく、国コード・指標コード・期間を変更すれば再利用できる構造にする。

使用データ：
- IMF DataMapper APIを使う。
- データセットは WEO、指標は `NGDPD` を使う。
- 国コードは `USA`。
- 期間は 1980年から2025年。
- `NGDPD` は GDP, current prices、単位は billions of U.S. dollars として扱う。
- 2025年がIMF上で推計値または予測値の場合でも、そのまま表示する。ただしUI上で「2025 may be an IMF estimate/projection depending on the WEO vintage」のような注記を入れる。

技術要件：
- まずはシンプルな静的Webアプリとして作る。
- HTML / CSS / JavaScript で実装する。
- グラフ描画には Chart.js を使う。
- データ取得ロジック、データ整形ロジック、グラフ描画ロジックを分離する。
- 将来的にReactやNext.jsへ移行しやすいよう、関数名とファイル構成を明確にする。

希望するファイル構成：
- `index.html`
- `styles.css`
- `src/config.js`
- `src/imfApi.js`
- `src/transform.js`
- `src/chart.js`
- `src/main.js`

設計方針：
1. `config.js`
   - 初期設定をまとめる。
   - 例：
     - dataset: "WEO"
     - indicatorCode: "NGDPD"
     - countryCode: "USA"
     - startYear: 1980
     - endYear: 2025
     - chartTitle: "United States GDP, current prices"
     - unitLabel: "Billions of U.S. dollars"

2. `imfApi.js`
   - IMF DataMapper APIからデータを取得する関数を作る。
   - 関数例：
     - `fetchImfSeries({ indicatorCode, countryCode })`
   - APIレスポンスの構造が想定と違う場合に備えて、consoleに取得データを出力し、エラー処理も入れる。
   - API URLは一箇所で管理する。
   - IMF APIのv2仕様に合わせて実装する。
   - もしv2のURL形式で問題が出る場合は、実際のレスポンスを確認しながら修正しやすいようにコメントを残す。

3. `transform.js`
   - IMFから取得したJSONを、Chart.jsで使いやすい配列に変換する。
   - 出力形式：
     [
       { year: 1980, value: 2857.3 },
       { year: 1981, value: ... },
       ...
     ]
   - startYear/endYearでフィルタする。
   - 数値でない値、null、欠損値は除外する。
   - 年は昇順に並べる。

4. `chart.js`
   - Chart.jsで折れ線グラフを描画する。
   - x軸は年。
   - y軸はGDP、単位は billions of U.S. dollars。
   - ツールチップでは `2025: 30,000 billion USD` のように読みやすく表示する。
   - 将来的に複数国比較に拡張できるよう、datasetsを配列で扱う。

5. `main.js`
   - configを読み込み、IMFからデータ取得、整形、グラフ描画までを実行する。
   - 読み込み中表示、エラー表示を実装する。
   - 失敗時には画面上に「Failed to load IMF data」と表示し、consoleに詳細を出す。

UI要件：
- ページ上部にタイトル：
  “United States GDP, current prices”
- サブタイトル：
  “IMF World Economic Outlook, 1980–2025”
- グラフ下に注記：
  “Source: IMF World Economic Outlook via IMF DataMapper API. Values are in billions of current U.S. dollars.”
- 2025年について：
  “Recent years may include IMF estimates or projections depending on the WEO vintage.”
- 最低限きれいに見えるCSSを付ける。
- PCでもスマホでも見やすいレスポンシブ設計にする。

重要：
- まず動く最小構成を優先する。
- デザインを凝りすぎない。
- 将来の横展開を考え、国・指標・期間をconfigで差し替えられるようにする。
- ハードコードされたGDP値の表を直接書き込まない。必ずIMF APIから取得する。
- ただし、API仕様の都合で取得に失敗する場合は、原因をコメントで説明し、修正箇所が分かるようにする。
- 完成後、ローカルで動かす手順もREADME形式で簡潔に書いてください。

最後に以下を出力してください：
1. 作成したファイル一覧
2. ローカルでの起動方法
3. IMF API URLの確認方法
4. 日本・中国・ドイツなどを追加する場合に変更すべき箇所
5. GDP per capitaなど別指標を追加する場合に変更すべき箇所