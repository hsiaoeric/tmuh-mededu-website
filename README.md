# 臺北醫學大學附設醫院 教學部官網

教學部與各中心（教師發展、臨床技能、實證醫學、全人照護、醫學教育研究）的官方網站。
採 **React + Vite + TypeScript**，雙語（中／英）、明暗主題、響應式（手機 / 平板 / 桌機）。

---

## 線上版本

| 版本 | 網址 | 分支 |
| --- | --- | --- |
| 第一版 | <https://tmuh-mededu-website.vercel.app> | `main` |
| **第二版（改版設計）** | **<https://tmuh-mededu-living-tissue.vercel.app>** | `living-tissue` |

**第二版**是在第一版之上重做視覺與互動的設計版本，也是這個分支的內容：新增 WebGL
背景著色器、平滑捲動與逐行標題進場、章節導覽軌與橫向捲動章節，並把原本的
`src/views/` 重整為 `src/pages/`。

兩版是**各自獨立的 Vercel 專案**，共用同一個 GitHub repo：第一版跟著 `main` 自動部署，
第二版目前以手動指令從 `living-tissue` 的內容部署（見下方〈第二版的更新方式〉）。
所以改第二版不會動到第一版，第一版仍是對外的正式站。

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
├─ main.tsx                  進入點（BrowserRouter + SiteProvider）
├─ app/
│  ├─ App.tsx                版面外框與路由表
│  ├─ site.tsx               全域狀態：語言、主題（皆會記憶在瀏覽器）
│  ├─ routes.ts              網址 ↔ 中心的對應、舊網址轉址
│  └─ navigation.ts          跨頁錨點跳轉、換頁捲動歸零
├─ i18n/                     ★ 介面文字（中英）：zh.ts / en.ts
├─ data/                     ★ 網站內容（最常更新的地方）
│  ├─ news.ts                公告 & 活動
│  ├─ people.ts              人員（姓名、職稱、照片檔名）
│  ├─ centers.ts             各中心基本資料、聯絡方式
│  ├─ kpis.ts                教學部首頁的數據
│  ├─ deptAwards.ts          SNQ / NHQA 品質榮譽
│  ├─ holisticPapers.ts      全院全人相關研究論文
│  └─ holistic.ts / ebm.ts / facdev.ts   各中心專頁內容
├─ pages/
│  ├─ Home.tsx + home/       首頁各區塊（Hero、About、組織、五大中心、數據、公告、榮譽、聯絡）
│  ├─ CenterPage.tsx         依網址分派到對應中心頁
│  └─ centers/               HolisticPage / EbmPage / FacdevPage / GenericCenterPage
├─ ui/                       共用元件（Nav、Footer、Icon、Person、Stats、組織圖…）
├─ motion/                   動效：Lenis 平滑捲動、GSAP 進場、逐行標題、計數器、橫向捲動
├─ webgl/                    背景「活體組織」著色器（three.js）
└─ design/
   ├─ tokens.css             ★ 顏色、主題變數（改配色看這裡）
   ├─ base.css               ★ 文字級距、共用格線、響應式斷點
   └─ components.css         元件外觀（導覽列、卡片、表格、組織圖…）
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
照片放在 `public/assets/`，檔名為 `<slug>.jpg`；`person(...)` 第 6 個參數就是這個 slug（沒有照片、或照片檔案不存在時，會自動改顯示姓名縮寫）。

### 4. 修改介面文字（按鈕、標題等）
`src/i18n/zh.ts`（中文）與 `src/i18n/en.ts`（英文）。兩個檔的欄位（key）必須一致，少一個英文 build 時會報錯提醒。

### 5. 調整配色 / 主題
`src/design/tokens.css`，修改 CSS 變數即可，明暗兩套都在這裡。
注意：**每個變數在 `:root`（淺色）與 `[data-theme='dark']`（深色）兩區塊都要有**，只改一邊會讓另一個主題壞掉。
`--field-*` 這幾個變數是背景著色器的顏色，改配色時一併調整才會協調。

---

## 版面與設計系統

為了「改一次、全站套用」，重複的樣式已收斂成共用資源：

- **字級**：`display d1`–`d4`（大標）、`lede`、`prose`、`tiny`、`eyebrow`。中文字比英文字視覺上大得多，因此每一級都有 `:lang(zh-Hant)` 的專屬字級，切換語言時會自動套用。
- **格線**：`grid` 搭配 `g2` / `g3` / `g4`（等寬欄）、`g-editorial`（左窄右寬）、`g-aside`、`auto-fit`、`grid-people`（人員卡）。斷點集中在 `design/base.css`。
- **元件**：`card`、`panel`、`tag`、`stat`、`table`、`index-row`、`btn`、`tlink`。
- **中心代表色**：來自 `data/centers.ts` 的 `color`，以 CSS 變數 `--tone` 往下傳，卡片、標籤、圖表會自動跟著變色。

### 動效與無障礙

平滑捲動（Lenis）、逐行標題進場、數字計數、橫向捲動章節都由 `src/motion/` 提供。
**所有動效都會偵測系統的「減少動態效果」設定**：一旦開啟，平滑捲動、進場動畫與背景動畫都會停用，內容直接完整顯示。背景著色器在不支援 WebGL 時也會自動略過，只留下純色背景。

## 網址與路由（A2）

每個頁面都有獨立網址，可直接分享、加書籤、用瀏覽器上一頁：

| 網址 | 頁面 |
|------|------|
| `/` | 教學部首頁 |
| `/centers/faculty-development` | 教師發展中心 |
| `/centers/clinical-skills` | 臨床技能中心 |
| `/centers/evidence-based-medicine` | 實證醫學中心 |
| `/centers/holistic-care` | 全人照護教育中心 |
| `/centers/medical-education-research` | 醫學教育研究中心 |

舊網址（`/holistic`、`/ebm`、`/facdev`、`/center/:id`）會自動轉到新網址，舊的連結與書籤仍然有效。

網址 ↔ 中心的對應集中在 `src/app/routes.ts`。切換頁面時瀏覽器分頁標題也會自動更新。

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

第一版（`main`）到這裡就結束了，Vercel 會自動重新 build 並上線。

### 第二版的更新方式

第二版是另一個 Vercel 專案 `tmuh-mededu-living-tissue`，它的 Production Branch
仍設定為 `main`，因此 push `living-tissue` 只會產生 Preview 部署。要更新對外網址
<https://tmuh-mededu-living-tissue.vercel.app>，在 push 之後再執行：

```bash
vercel --prod
```

> `vercel --prod` 上傳的是**本機當下的檔案**，不是 GitHub 上的版本，
> 所以請先 commit 再部署，線上內容才會和版本紀錄一致。
>
> 想改成 push 就自動上線，到該專案的 **Settings → Environments → Production →
> Branch Tracking**，把分支改成 `living-tissue` 即可，之後就不必再手動執行。

---

## 部署到 GitHub Pages

目前線上預覽網址：**https://hsiaoeric.github.io/tmuh-mededu-website/**

這個 repo 的 Pages 設定是「從 `gh-pages` 分支發佈」，更新方式是在本機執行：

```bash
npm run deploy
```

會先型別檢查、用正確的網址前綴 build，再把 `dist/` 推到 `gh-pages` 分支。
**不需要合併到 `main`**，所以可以單獨預覽這個設計版本。

> 另外附了 `.github/workflows/deploy.yml`（改用 GitHub Actions 發佈的版本），
> 但要先到 **Settings → Pages → Source** 改成 **GitHub Actions** 才會生效，
> 因此目前設定成只能從 Actions 分頁手動執行，不會自動跑。

### 網址前綴（`VITE_BASE`）

GitHub Pages 的網址是 `https://<帳號>.github.io/<repo>/`，多了一層 `/<repo>/` 前綴，
因此 build 時要告訴 Vite 這個前綴。這由環境變數 `VITE_BASE` 提供，
寫在 `package.json` 的 `predeploy`（以及 workflow 的 `env:`）裡：

```jsonc
"predeploy": "npm run typecheck && VITE_BASE=/tmuh-mededu-website/ vite build"
```

- **repo 改名時**，這兩處都要一併改。
- **改用自訂網域**（網站放在根目錄）時，把它設成 `/` 或整段刪掉。
- 本機或 Vercel 不設這個變數，預設就是 `/`，所以兩邊可以共存、互不影響。

> 在程式裡要指向 `public/` 的檔案時，**請用 `assetUrl()`（`src/utils/asset.ts`）**，
> 不要直接寫 `/assets/...`。Vite 只會改寫 index.html 與 import 進來的資源，
> 程式執行時才組出來的字串不會被改寫，寫死斜線開頭在 Pages 上會全部 404。

---

## 部署注意事項

這是**單頁應用（SPA）**，部署到靜態主機時，需設定「所有路徑都回傳 `index.html`」(SPA fallback)，
否則直接打開 `/centers/holistic-care` 會 404。

- **Vercel**：專案根目錄的 `vercel.json` 已設定 rewrite。
- **GitHub Pages**：不能設 rewrite，但會用 `404.html` 回應找不到的路徑；
  因此 build 時會自動把 `index.html` 複製成 `dist/404.html`（見 `vite.config.ts`），深層連結就能正常運作。
- **Netlify**：加一條 rewrite `/* → /index.html`。
- **Nginx**：`try_files $uri /index.html;`
- 先 `npm run build`，再把 `dist/` 內容上傳即可。

---

## 技術細節

- 建置工具：Vite 5
- 路由：react-router-dom 7
- 動效：GSAP（ScrollTrigger / SplitText）+ Lenis
- 背景：three.js 全螢幕著色器（獨立 chunk，載入首頁後才下載）
- 語言：TypeScript（`npm run build` 會先做型別檢查，攔截錯字／漏欄位）
- 無後端，內容皆為前端靜態資料（見 `src/data/`）
