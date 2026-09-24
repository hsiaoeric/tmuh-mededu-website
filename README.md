# 臺北醫學大學附設醫院 教學部官網

教學部與各中心（教師發展、臨床技能、實證醫學、全人照護、醫學教育研究）的官方網站。
採 **React + Vite + TypeScript**，雙語（中／英）、明暗主題、響應式（手機 / 平板 / 桌機）。
網站內容由 Supabase CMS 管理，並保留 committed snapshot 供首次顯示與逐文件回退。

---

## 維運入口

- **內容更新**：由 `/admin/login` 登入 CMS，建立或儲存草稿，確認後發佈。
- **完整操作手冊**：[CMS 維運手冊](docs/cms-operations.md)
- **Vercel**：使用根路徑 build，`main` push 由 Vercel 專案自動建置，`vercel.json` 提供 SPA rewrite。
- **GitHub Pages**：目前從 `gh-pages` 分支提供，以 `npm run deploy` 發佈 repository base-path build。

目前狀態是 `offline implementation verified; production Supabase integration blocked`。這表示離線測試、內容檢查與兩種 base build 已驗證，不代表正式 Supabase 的 migration、Auth、Storage、Edge Function 或 checkpoint 已執行成功。

---

## 快速開始

```bash
npm install        # 安裝套件（第一次或換電腦時）
npm run dev        # 開發模式，瀏覽器開 http://localhost:5173
npm test           # 執行 Vitest 測試套件
npm run content:check  # 檢查 committed snapshot 與 seed 是否符合本機產生器
npm run typecheck  # 嚴格 TypeScript 型別檢查
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
├─ i18n/                     介面文字（中英）：zh.ts / en.ts
├─ content/                  CMS contracts、Supabase repository、snapshot 與公開 adapters
├─ admin/                    登入、權限、文件工作區、structured editors 與媒體管理
├─ data/                     bootstrap 與本機 fallback 來源，不是上線後的日常內容入口
│  ├─ news.ts                公告 & 活動
│  ├─ people.ts              人員（姓名、職稱、照片、分機、信箱）
│  ├─ centers.ts             各中心基本資料、聯絡方式、行政團隊名冊
│  ├─ kpis.ts                教學部首頁的數據（顧問／主治／醫事／五中心）
│  ├─ deptAwards.ts          SNQ / NHQA 品質榮譽
│  ├─ holisticPapers.ts      全院全人相關研究論文
│  └─ holistic.ts / ebm.ts / facdev.ts   各中心專頁內容
├─ pages/
│  ├─ Home.tsx + home/       首頁各區塊（Hero、About、組織、公告、一覽、榮譽、聯絡）
│  ├─ AnnouncementsPage.tsx  完整公告列表與分類篩選
│  ├─ HonorsPage.tsx         完整 SNQ / NHQA 得獎紀錄
│  ├─ DigitalMaterialsPage.tsx  數位教材室（內容建置中）
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

另有 `supabase/` 存放 migrations、database tests、seed 與 `cms-publish` Edge Function，
`scripts/content/` 負責 bootstrap 產生及 Supabase checkpoint，`docs/cms-operations.md` 是操作權威。

---

## 常見更新作業（給維護人員）

### 1. 更新網站內容

公告、活動、人員、中心資料、首頁指標、榮譽及各專頁內容都從 CMS 管理總覽進入。儲存只更新草稿，公開站要在確認對話框完成發佈後才會讀到新修訂。圖片先上傳至私有 `draft-media`，發佈時才提升到不可變的 `public-media`。

帳號配置、衝突復原、封存、圖片清理、環境變數與 checkpoint 流程請依 [CMS 維運手冊](docs/cms-operations.md)，不要直接修改 `src/content/generated/cms-snapshot.json` 或 `supabase/seed.sql`。

### 2. 本機 bootstrap 與離線 fallback

`src/data/`、`src/i18n/` 與 `scripts/content/` 仍是初始資料和本機來源開發的輸入。只有在調整來源抽取、schema、serializer 或重新建立 bootstrap 時才執行：

```bash
npm run content:generate
npm run content:check
```

Supabase 啟用後，日常內容以 CMS 為準；要把目前已發佈的 12 份權威內容寫回 committed snapshot，使用經管理員驗證的 `npm run content:checkpoint`。所需環境與安全規則見維運手冊。

### 3. 修改非 CMS 介面與設計

按鈕等共用 chrome 仍由 CMS 的 `site_copy` 文件供應，程式層的 i18n schema 位於 `src/i18n/zh.ts` 與 `src/i18n/en.ts`。兩個檔案的 key 必須一致。

### 4. 調整全站字級
根字級在 `src/design/base.css` 的 `html { font-size: …% }`。目前設為 `125%`（約等於內文 20px），全站 rem 會跟著放大。要再大／再小，只改這個百分比即可。

### 5. 調整配色 / 主題
`src/design/tokens.css`，修改 CSS 變數即可，明暗兩套都在這裡。
注意：**每個變數在 `:root`（淺色）與 `[data-theme='dark']`（深色）兩區塊都要有**，只改一邊會讓另一個主題壞掉。
`--field-*` 這幾個變數是背景著色器的顏色，改配色時一併調整才會協調。

---

## 版面與設計系統

為了「改一次、全站套用」，重複的樣式已收斂成共用資源：

- **字級**：`display d1`–`d4`（大標）、`lede`、`prose`、`tiny`、`eyebrow`。中文字比英文字視覺上大得多，因此每一級都有 `:lang(zh-Hant)` 的專屬字級，切換語言時會自動套用。全站基準字級見上方〈調整全站字級〉。
- **格線**：`grid` 搭配 `g2` / `g3` / `g4`（等寬欄）、`g-editorial`（左窄右寬）、`g-aside`、`auto-fit`、`grid-people`（人員卡）。斷點集中在 `design/base.css`。
- **元件**：`card`、`panel`、`tag`、`stat`、`table`、`btn`、`tlink`、人員名冊 `roster-row`。
- **中心代表色**：來自 `data/centers.ts` 的 `color`，以 CSS 變數 `--tone` 往下傳，卡片、標籤、圖表會自動跟著變色。

### 動效與無障礙

平滑捲動（Lenis）、逐行標題進場、數字計數、橫向捲動章節都由 `src/motion/` 提供。
**所有動效都會偵測系統的「減少動態效果」設定**：一旦開啟，平滑捲動、進場動畫與背景動畫都會停用，內容直接完整顯示。背景著色器在不支援 WebGL 時也會自動略過，只留下純色背景。

## 網址與路由（A2）

每個頁面都有獨立網址，可直接分享、加書籤、用瀏覽器上一頁：

| 網址 | 頁面 |
|------|------|
| `/` | 教學部首頁 |
| `/announcements` | 完整公告與分類篩選 |
| `/honors` | 完整品質榮譽紀錄 |
| `/digital-materials` | 數位教材室（建置中） |
| `/centers/faculty-development` | 教師發展中心 |
| `/centers/clinical-skills` | 臨床技能中心 |
| `/centers/evidence-based-medicine` | 實證醫學中心 |
| `/centers/holistic-care` | 全人照護教育中心 |
| `/centers/medical-education-research` | 醫學教育研究中心 |

舊網址（`/holistic`、`/ebm`、`/facdev`、`/center/:id`）會自動轉到新網址，舊的連結與書籤仍然有效。

網址 ↔ 中心的對應集中在 `src/app/routes.ts`。切換頁面時瀏覽器分頁標題也會自動更新。

---

## 部署到 Vercel（推薦）

專案已含 `vercel.json`，所有 SPA 路由都會 rewrite 到 `index.html`。Vercel 專案以 `npm run build` 建置、輸出 `dist/`，並在 `main` push 後自動部署。

要讓公開站讀取 Supabase 並啟用管理登入，須在對應的 Vercel environment 成對設定 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_PUBLISHABLE_KEY`。前端不可設定 service-role 或任何 secret key。CMS 內容發佈、Edge Function 部署與網站程式部署是不同作業，完整釋出順序見 [CMS 維運手冊](docs/cms-operations.md)。

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
- 內容後端：Supabase Auth、Postgres/RLS/RPC、Storage 與 `cms-publish` Edge Function
- 離線保護：提交的 12 文件 snapshot 先顯示，遠端內容逐文件驗證與取代
