# 臺北醫學大學附設醫院 教學部官網

教學部與各中心（教師發展、臨床技能、實證醫學、全人照護、醫學教育研究）的官方網站。
採 **React + Vite + TypeScript**，雙語（中／英）、明暗主題、響應式（手機 / 平板 / 桌機）。

---

## 快速開始

```bash
npm install        # 安裝套件（第一次或換電腦時）
npm run dev        # 開發模式，瀏覽器開 http://localhost:5173
npm run build      # 產生正式版到 dist/（含型別檢查）
npm run preview    # 在本機預覽 build 後的成果
```

> 需要 Node.js 18 以上。

---

## 專案結構

```
src/
├─ main.tsx                  進入點（掛上路由 BrowserRouter + 全域 Provider）
├─ App.tsx                   依目前網址顯示對應頁面
├─ context/SiteContext.tsx   全域狀態：語言、主題、目前頁面、網址 ↔ 頁面對應
├─ i18n/                     ★ 介面文字（中英）：zh.ts / en.ts
├─ data/                     ★ 網站內容（最常更新的地方）
│  ├─ news.ts                公告 & 活動
│  ├─ people.ts              人員（姓名、職稱、照片檔名）
│  ├─ centers.ts             各中心基本資料、聯絡方式
│  ├─ kpis.ts                教學部首頁的數據
│  ├─ holistic.ts / ebm.ts / facdev.ts   各中心專頁內容
├─ views/                    各頁面（DeptView 首頁 / HolisticView / EbmView / FacdevView / BuildingView）
├─ zdepth/                   捲動堆疊引擎：engine.ts（時間軸計算）、ZStack、ZCard
├─ components/
│  ├─ common/                可重用元件（NxHero、NxCardHead、NxColophon、PersonCard、KpiCard…）
│  └─ layout/                Header、Hud（底部狀態列）、NavDropdown、背景特效
├─ hooks/                    捲動揭示、背景粒子效果
└─ styles/
   ├─ tokens.css             ★ 顏色、主題變數（改配色看這裡）
   ├─ layout.css             ★ 共用版面：eyebrow 樣式、響應式格線
   ├─ zdepth.css             捲動堆疊、底部狀態列、Nexus 元件樣式
   └─ global.css             全域基礎樣式與動畫
```

標 ★ 的是日後最常需要調整的檔案。

---

## 常見更新作業（給維護人員）

### 1. 新增 / 修改「公告」
編輯 `src/data/news.ts`，在 `ANNOUNCEMENTS` 陣列裡**複製一個 `{ ... }` 區塊**修改即可：

- `date`：發佈日期，格式 `'YYYY-MM-DD'`。網站會**自動由新到舊排序**，並用最新一則顯示「最後更新」。
- `pinned: true`：讓這則永遠置頂。
- `tag` / `title` / `lines`：都各填 `zh`（中文）與 `en`（英文）。
- `stat`：左側的數據徽章（選填）。

### 2. 新增 / 修改「活動」
同樣在 `src/data/news.ts` 的 `ACTIVITIES` 陣列。`sortDate` 用 `'YYYY-MM-DD'` 排序，`date` 是顯示用字串（可含星期、時間）。

### 3. 修改人員
`src/data/people.ts`（共用）或各中心的 `centers.ts` / `holistic.ts` 等。
照片放在 `public/`，`person(...)` 第 6、7 個參數是照片檔名（沒有照片會自動顯示姓名縮寫）。

### 4. 修改介面文字（按鈕、標題等）
`src/i18n/zh.ts`（中文）與 `src/i18n/en.ts`（英文）。兩個檔的欄位（key）必須一致，少一個英文 build 時會報錯提醒。

### 5. 調整配色 / 主題
`src/styles/tokens.css`，修改 CSS 變數即可，明暗兩套都在這裡。

---

## 捲動堆疊（Z-Depth）

本站的版型改編自 Nexus System 設計語言：每一頁都是一疊「卡片」，往下捲時新卡片由下方滑入、舊卡片縮小淡出。

每張卡片就是一個 `<ZCard>`：

```tsx
<ZCard id="org" label="06 / 組織架構">
  …這一段的全部內容…
</ZCard>
```

- `id`：錨點名稱，選單與跨頁連結靠它跳轉。
- `label`：底部狀態列顯示的段落名稱（習慣用「編號 / 名稱」）。
- `tone="dark"`：碳黑底色的卡片，通常用在每頁最後的聯絡段落。
- `center`：內容比一個畫面短時垂直居中（首頁大標、結尾段落用）。

**內容再長也不會被截斷。** 卡片比畫面高時，引擎會讓它「釘住」，內容在卡片內往上捲動（`engine.ts` 稱為 dwell），捲完才換下一張卡片。所以像研究論文清單這種很長的段落照樣完整呈現，不需要分頁。

新增一個段落＝在該頁面的 view 檔案裡加一個 `<ZCard>`，編號依序往下排即可；底部狀態列與上下箭頭會自動更新。

開啟系統的「減少動態效果」時，整個堆疊會退回成普通的長頁面，內容完全相同。

---

## 版面與設計系統（B2）

為了「改一次、全站套用」，重複的樣式已收斂成共用資源：

- **首頁大標**：用 `<NxHero>` 元件。
- **段落標題**：用 `<NxCardHead num="06" kicker="…" title="…">`，會排出「編號 / 英文小標」加分隔線的樣式。
- **頁尾資訊**（地址、電話、院徽）：用 `<NxColophon>`。捲動堆疊沒有文件底部可以放頁尾，所以這些資訊放在每一頁最後一張卡片裡，常駐的底部狀態列則負責顯示品牌與進度。
- **區塊小標**：用 `<Eyebrow>` 元件（`src/components/common/Eyebrow.tsx`），而不是每次貼一長串 inline 樣式。
- **響應式格線**：用 `src/styles/layout.css` 的 class，例如
  - `grid grid-2` / `grid-3` / `grid-4`：等寬欄，手機自動收合成單欄。
  - `grid grid-sidebar`：左寬右窄（介紹＋側欄）。
  - `grid grid-split`：左右各半。
  - `grid grid-statcard` / `grid-rail`：公告日期欄、ALGEE 字母欄。
  斷點集中在 `layout.css`，要調整手機/平板的收合行為改這裡即可。

---

## 網址與路由（A2）

每個頁面都有獨立網址，可直接分享、加書籤、用瀏覽器上一頁：

| 網址 | 頁面 |
|------|------|
| `/` | 教學部首頁 |
| `/holistic` | 全人照護教育中心 |
| `/ebm` | 實證醫學中心 |
| `/facdev` | 教師發展中心 |
| `/center/:id` | 尚未建置專頁的中心（佔位頁） |

網址 ↔ 頁面的對應集中在 `src/context/SiteContext.tsx`（`VIEW_PATH`、`parsePath`）。切換頁面時瀏覽器分頁標題也會自動更新。

---

## 部署到 Vercel（推薦）

專案已含 `vercel.json`（SPA 路由 fallback）。程式碼在 GitHub：

**https://github.com/michelleku0813-hub/tmuh-mededu-website**

### 第一次部署（約 3 分鐘）

1. 打開 [vercel.com](https://vercel.com)，用 **GitHub 帳號**登入（與上面 repo 同一個帳號）。
2. 點 **Add New… → Project**。
3. 在列表中找到 `tmuh-mededu-website`，點 **Import**。
4. 設定通常不用改（Vercel 會自動偵測 Vite）：
   - Framework Preset：**Vite**
   - Build Command：`npm run build`
   - Output Directory：`dist`
5. 點 **Deploy**，等約 1–2 分鐘。
6. 完成後會得到網址，例如 `https://tmuh-mededu-website.vercel.app`，可分享給任何人。

### 之後更新網站

改完程式後在本機執行：

```bash
git add .
git commit -m "更新說明"
git push
```

Vercel 會自動重新 build 並上線，無需再手動操作。

---

## 部署注意事項

這是**單頁應用（SPA）**，部署到靜態主機時，需設定「所有路徑都回傳 `index.html`」(SPA fallback)，否則直接打開 `/ebm` 會 404。

- **Vercel**：專案根目錄的 `vercel.json` 已設定 rewrite。
- **Netlify**：加一條 rewrite `/* → /index.html`。
- **Nginx**：`try_files $uri /index.html;`
- 先 `npm run build`，再把 `dist/` 內容上傳即可。

---

## 技術細節

- 建置工具：Vite 5
- 路由：react-router-dom 7
- 語言：TypeScript（`npm run build` 會先做型別檢查，攔截錯字／漏欄位）
- 無後端，內容皆為前端靜態資料（見 `src/data/`）
- 視覺語言改編自 Nexus System：拉絲鈦白／碳黑底色、1px 鋼灰分隔線、直角無圓角、JetBrains Mono 標籤，強調色是把院方 teal 推到霓虹的 volt mint（`--volt`）
