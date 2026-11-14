# 課程報告（reports）

- 網址：https://ijioxc.github.io/reports/<資料夾>/ ，由 `main` 部署。
- 原本放在資料庫 repo（ijioxc.github.io）的 `web/`，已拆成獨立 repo，歷史紀錄有保留。資料庫首頁的卡片連到這裡（`sites.json`）。
- 改動從 `origin/main` 開分支再發 PR。

## 內容

| 資料夾 | 內容 | 做法 |
|---|---|---|
| `dynamics/` | 動力學期末報告 | pptx2web 產生，`player.js` 播放 |
| `hs-project/` | 高中專題 | pptx2web 產生，`player.js` 播放 |
| `ev-motor-drive/` | 電動車馬達驅動 | 手寫單頁 |
| `missile-journey/` | 通識報告，附 PDF | 手寫（`app.js`、`style.css`） |
| `triangle-doc/` | 通識報告「認識軍工概念產業」滾動式網頁 | 手寫（GSAP 滾動，`app.js`、`style.css`、`img/`） |

- `player.js`、`player.css` 是共用播放器，改了會影響所有 pptx2web 產生的報告。
- `media/` 很大，不要整個讀，要看哪張圖再讀那張。

## 新增網頁版簡報

```
python3 pptx2web.py 簡報.pptx <資料夾名稱> "標題"
```

輸出到 `<資料夾名稱>/`。做完後到資料庫 repo 的 `sites.json` 加一筆，`url` 填 `/reports/<資料夾名稱>/`。
