# DATABASE DESIGN

## 方針

ブラウザから実DBへ任意クエリを送らない。事件ごとのJSONを読み込み、各データソース専用アダプターが許可済み構文だけを解釈する。

```mermaid
flowchart TD
  UI[捜査端末 UI] --> Adapter[データソースアダプター]
  Adapter --> Engine[安全なクエリエンジン]
  Engine --> Case[事件JSON]
  Engine --> Result[結果セット]
  Result --> Evidence[証拠化]
```

## M01のSQL風構文

```sql
SELECT * | column[, column]
FROM table
[WHERE column = value];
```

`eval` やブラウザ内SQLiteは使用しない。字句を限定した正規表現パーサーで処理する。将来はPEGパーサーへ置換可能。

## 将来のアダプター

| ID | 表現 | 例 |
| --- | --- | --- |
| hotel | SQL | `SELECT * FROM rooms` |
| access | 検索式 | `room:404 AND time:[22:00 TO 23:00]` |
| camera | タイムライン | カメラ・時間帯・人物タグ |
| payment | フィルター | 金額、端末、決済手段 |
| facility | 時系列 | メトリクスと時間範囲 |
| staff | グラフ | 人物から部署・権限を探索 |

## 証拠の安定性

証拠は表示中の行番号ではなく、事件ファイルで定義した不変IDを参照する。データ表示順が変わってもセーブデータを壊さない。

## セーブデータ

初期版は `localStorage` を使用し、次を保存する。

- caseId / schemaVersion
- 発見済み証拠ID
- 実行済みクエリの履歴
- ケースボードのノード座標と接続
- 推理提出の下書き
- ヒント使用回数

事件ファイルとセーブデータには別のバージョン番号を持たせ、移行関数を用意する。
