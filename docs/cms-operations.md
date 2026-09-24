# CMS 維運手冊

本手冊是教學部網站 Supabase CMS 的正式操作依據，適用於內容管理員、專案擁有者與發佈維護者。日常內容一律從 `/admin/login` 進入 CMS 處理，不直接改產生後的快照或 `supabase/seed.sql`。

目前發佈狀態：`offline implementation verified; production Supabase integration blocked`。離線實作與驗證已完成，但尚未以核准的正式環境憑證執行 hosted migration、Auth、Storage、Edge Function 或 checkpoint 整合驗證。

## 架構與內容權威

Supabase 中已發佈的內容是上線後的權威來源。網站固定管理下列 12 組文件身分，每種只能有指定的 `stable_key`：

| `kind` | `stable_key` |
| --- | --- |
| `site_copy` | `global` |
| `centers` | `directory` |
| `people` | `directory` |
| `news` | `announcements` |
| `activities` | `calendar` |
| `kpis` | `department` |
| `honors` | `department` |
| `digital_materials` | `page` |
| `facdev` | `page` |
| `ebm` | `page` |
| `holistic` | `page` |
| `holistic_research` | `registry` |

瀏覽器啟動時會立即顯示已提交的 `src/content/generated/cms-snapshot.json`，再匿名讀取 Supabase。每份遠端文件通過身分、格式與版本驗證後才會個別取代快照。某份文件遺失、格式錯誤、版本較舊或讀取失敗時，只有該份文件回退到快照，其餘有效文件照常更新。完全未設定 Supabase 瀏覽器環境時，網站可離線使用整份快照。

`npm run content:generate` 只供初始 bootstrap 與本機來源開發，會從程式庫來源產生快照及 seed。Supabase 啟用後，日常內容不可再靠修改 `src/data/` 上線，也不可手改快照或 seed。

## 初次建置與管理員

### Hosted Auth 設定

在 Supabase Dashboard 先完成下列設定：

1. 到 Authentication 設定關閉公開 email signup。
2. 關閉 anonymous sign-in。
   - 洩漏密碼檢查（HaveIBeenPwned）僅限 Pro 以上方案，目前方案無法啟用，Security Advisor 會持續顯示此警告。替代做法：在 Authentication 的密碼設定把最短長度設為至少 12 字元並要求大小寫、數字與符號，且每位管理員使用密碼管理器產生的唯一密碼。升級方案後應立即啟用此檢查。
3. 確認 Site URL 與允許的 redirect URL 只包含受信任的管理站來源。
4. 到 Authentication 的 Users 頁面，為每位內容管理員以 email/password 手動建立各自的 Auth user。每人一個帳號、不可共用，修訂紀錄的 actor 欄位才能對應到實際操作者。不要開放訪客自行註冊。
5. 逐一複製各使用者頁面顯示的 Auth UUID。加入 allowlist 時必須使用這個完整值，不能使用 email、另行產生的 UUID 或 CMS 文件 UUID。

本機 `supabase/config.toml` 也將 signup 與 anonymous sign-in 設為關閉，但 hosted 專案必須在 Dashboard 另行確認，提交本機設定不會自動改掉 hosted Auth 設定。

### 加入 allowlist

`public.cms_admins.user_id` 是指向 `auth.users.id` 的外鍵，所以 Auth user 必須先存在。以下 SQL 使用 psql 變數，角括號內容只是不可直接執行的標記：

```sql
\set cms_admin_user_id '<AUTH-USER-UUID-FROM-DASHBOARD>'

begin;

insert into public.cms_admins (user_id)
values (:'cms_admin_user_id'::uuid)
on conflict (user_id) do nothing;

select user_id
from public.cms_admins
where user_id = :'cms_admin_user_id'::uuid;

commit;
```

查詢必須剛好回傳預期的 Auth UUID。之後以該帳號登入 `/admin/login`，確認可進入管理總覽，才算完成配置。

### 撤銷權限

撤銷時依下列順序操作：

1. 先從 allowlist 移除精確 UUID。這會讓後續 RLS、RPC 與 Edge Function 授權立即失敗，即使瀏覽器暫時仍顯示舊的登入畫面，也不能再寫入。
2. 在 hosted Auth 管理介面撤銷該使用者的有效工作階段，並停用或刪除帳號。
3. 用另一個未授權瀏覽器確認 `/admin` 無法進入，並確認原工作階段的儲存、發佈及媒體操作都遭拒。

```sql
\set cms_admin_user_id '<AUTH-USER-UUID-FROM-DASHBOARD>'

begin;

delete from public.cms_admins
where user_id = :'cms_admin_user_id'::uuid;

select count(*) as remaining_rows
from public.cms_admins
where user_id = :'cms_admin_user_id'::uuid;

commit;
```

`remaining_rows` 必須是 `0`。若先刪除 Auth user，外鍵也會連帶刪除 allowlist 列，但操作上仍應先明確撤銷 allowlist，避免在帳號管理失敗時留下可寫權限。歷史修訂的建立、發佈與封存紀錄會保留，相關 actor 欄位可依外鍵規則變成 `null`。

### 密碼遺失或疑似外洩

現行管理站沒有自助註冊或密碼重設頁。不要為了救援帳號暫時開啟 signup，也不要把 hosted recovery link 指向沒有重設流程的管理站。

1. 疑似外洩時，先按上一節撤銷 allowlist 與工作階段。
2. 若 hosted Dashboard 提供管理既有使用者密碼的操作，由專案擁有者在 Dashboard 完成，並確認 Auth UUID 沒有改變，再重新加入 allowlist。
3. 若 Dashboard 無法直接完成密碼管理，刪除舊 Auth user，為同一人手動建立新的 email/password user，再把新使用者的精確 UUID 加入 allowlist。
4. 以新密碼登入並確認管理總覽後，檢查 allowlist 每一列都對應一位目前在職的管理員，且沒有殘留舊帳號。

## 環境變數與金鑰界線

### 瀏覽器與網站建置

前端只接受成對設定的：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

兩者都未設定時，公開站使用 committed snapshot，管理登入顯示設定未完成。只設其中一個或格式錯誤時會視為設定錯誤。Vercel 與任何實際提供管理頁的部署環境都要各自設定這兩項，Pages 若要連線 CMS 也同樣需要在其建置環境提供。

### Checkpoint 操作者

`npm run content:checkpoint` 只接受：

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `CMS_ADMIN_EMAIL`
- `CMS_ADMIN_PASSWORD`

建議在受信任的互動 shell 讀入，不把值寫進命令歷史：

```bash
read -r SUPABASE_URL
read -r SUPABASE_PUBLISHABLE_KEY
read -r CMS_ADMIN_EMAIL
read -rs CMS_ADMIN_PASSWORD
export SUPABASE_URL SUPABASE_PUBLISHABLE_KEY CMS_ADMIN_EMAIL CMS_ADMIN_PASSWORD
npm run content:checkpoint
unset SUPABASE_URL SUPABASE_PUBLISHABLE_KEY CMS_ADMIN_EMAIL CMS_ADMIN_PASSWORD
```

Checkpoint 會以該管理員登入、確認 Auth 身分、呼叫 `is_cms_admin()`，完成後在本機登出。它不需要也拒絕 service-role 或 secret key 環境變數。

### Edge Function

`cms-publish` 執行時需要 Supabase Edge Function 提供的 managed variables：`SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`，並需要自行設定 `CMS_ADMIN_ALLOWED_ORIGINS`。Allowed origins 是以逗號分隔的完整 origin，只能含協定、主機與選用 port，不可含路徑。每個實際管理站來源都要明列，不能使用萬用字元。

**Service-role 與其他 secret key 絕對不能進入瀏覽器、`VITE_*` 變數、checkpoint 命令、shell 歷史、提交檔案或 CI 產物。** 它們只能留在 Supabase 管理的 Edge Function 執行環境。前端與 checkpoint 一律使用 publishable key，實際寫入權限仍由登入身分、allowlist、RLS 與 RPC 檢查決定。

## 日常內容操作

1. 前往 `/admin/login`，以自己的管理員帳號登入，不共用他人帳號。
2. 從管理總覽選擇 12 種內容之一。先看狀態、版本與 edit token，再開始修改中英文欄位。
3. 按「儲存草稿」。若目前沒有 active draft，系統會從可用的目前修訂自動建立草稿，再儲存本次內容。儲存草稿不會改變公開站。
4. 看到「草稿已儲存」後再發佈。按「發佈」會先開確認對話框，只有按「確認發佈」才會送出。成功訊息出現後，該修訂才成為 Supabase 公開內容。
5. 到公開頁重新載入並核對中英文、圖片及受影響路由。若尚未建立新 checkpoint，部署中的舊快照仍只是斷線時的 fallback。

若儲存或發佈出現版本衝突，表示伺服器已有較新的 edit token。按「重新載入並保留編輯內容」，系統會取得最新修訂與 token，同時保留目前編輯文字。檢查差異，重新套用必要內容，再儲存。不要反覆按舊的發佈按鈕，也不要用資料庫直接覆蓋版本欄位。

「封存」也有確認對話框。若目前有 active draft，封存的是該草稿，既有 published 修訂仍是 Supabase 公開內容；管理頁會回到該 published 修訂，之後仍可編輯並儲存為新草稿。只有在沒有 active draft 而封存 published 修訂時，該文件才會失去 Supabase 公開版本，公開站會對該文件使用 committed snapshot。此時管理頁只保留 archived 修訂作參考，現行介面無法直接復原或複製該修訂，因此不要把封存 published 修訂當成日常下架操作。若需恢復，停止內容操作並交由維護者設計及驗證新的修訂流程，不可直接改封存列。

頁面有未儲存內容或作業仍在等待時，站內換頁會要求確認；關閉或重新載入分頁也會觸發瀏覽器提示。選「繼續編輯」或「繼續等待」會留在原頁。若選擇離開，未儲存內容會遺失；等待中的請求雖會取消，但伺服器可能已完成，回來後必須重新載入確認結果。

## 圖片與清理

### 儲存模型

- `draft-media` 是私有 bucket。只有 allowlisted 管理員可在自己的 UUID 路徑下上傳、讀取簽章預覽與刪除。
- `public-media` 是公開 bucket。發佈流程把草稿引用複製成依 SHA-256 內容雜湊命名的不可變路徑。瀏覽器角色不能覆寫或刪除公開物件。
- 接受 JPEG、PNG、WebP。瀏覽器、bucket 與發佈檢查的有效上限都是 10 MiB。檔名副檔名、MIME、實際容器、尺寸與內容雜湊必須一致。
- 私有預覽使用短效 signed URL，目前有效期為 5 分鐘。到期後由介面重新簽發，不應複製成公開網址。

發佈時，Edge Function 先驗證目前管理員、版本與所有草稿圖片，再逐一建立或重用 `public-media` 內容位址，核對公開物件完整性，最後才完成修訂發佈並把 payload 內的草稿引用換成公開引用。相同內容可安全重用，公開路徑不會被覆寫。

### 更換、解除連結與刪除

1. 上傳新圖片並等 signed preview 出現。
2. 儲存草稿，確認新引用已寫入。
3. 發佈並確認公開頁圖片正常。
4. 「解除連結」只會移除編輯內容中的引用，不會刪除 Storage 物件。
5. 要永久刪除草稿物件，先解除連結並成功儲存草稿。待清理區只會檢查目前管理頁工作階段內的編輯器；資料庫另會阻止刪除任何已儲存草稿仍引用的物件。其他分頁、瀏覽器或工作階段中的未儲存引用不在檢查範圍，清理前須先儲存或關閉其他編輯工作階段。

目前工作階段中的編輯器內容無法解析時，系統會保守視為仍有引用並禁止刪除。資料庫刪除政策也會再次檢查所有 saved draft，所以不要繞過介面清理。`public-media` 物件屬於不可變發佈資產，不使用日常草稿清理流程刪除。

### 失敗復原

- 上傳失敗：原圖片引用維持不變。確認登入與網路後重試。若檔案已建立但預覽或後續採用失敗，它會列在「待清理上傳」。先確認沒有 editor 或 saved draft claim，再永久刪除。
- 預覽失敗：圖片仍在私有 bucket，連結不會因無法簽章而自動換掉。重新登入或重試預覽，不能把私有路徑改成公開路徑。
- 儲存失敗：保留頁面內容，不要清掉新上傳。修正錯誤或衝突並成功儲存後再處理舊圖。
- 發佈失敗：草稿不會被當成已發佈。部分公開內容位址可能已建立，重試會依內容雜湊安全重用。重新載入確認修訂狀態，修正明示錯誤後再發佈，不要手動刪除 `public-media`。
- 刪除失敗：保留目前頁面，只有介面仍確認無引用時才能重試。若回應不明、頁面已重新載入或待清理項目已消失，記錄完整物件路徑並停止操作，交由維護者從 Storage 核對狀態；現行介面無法在重新載入後重新列出未被草稿引用的上傳。

## Snapshot 與 checkpoint

### Bootstrap 產生器

```bash
npm run content:generate
npm run content:check
```

`content:generate` 從本機來源產生 `src/content/generated/cms-snapshot.json` 與 `supabase/seed.sql`，用途是初始資料、本機離線開發及 serializer 開發，不是日常 CMS 發佈。兩個檔案都有固定排序與穩定序列化，不可手改。只要來源抽取、contract 或 serializer 改變，就要重新產生兩者，並讓 `npm run content:check` 同時通過快照與 seed。

### Supabase 權威 checkpoint

```bash
npm run content:checkpoint
```

Checkpoint 是經管理員驗證的 Supabase 權威匯出，只更新 committed snapshot。遠端回應必須沒有 row failure，並剛好包含上述 12 組有效且不重複的身分，缺一、多一、格式錯誤或版本資料無法解析都會失敗。

寫入時會在快照同一目錄建立權限受限的暫存檔，寫完並同步檔案後，以同檔案系統 rename 一次取代目標。讀者只會看到完整舊檔或完整新檔，這是 atomic visibility，不代表斷電 durability，因為目錄本身沒有額外同步。下載、驗證、寫入、同步或 rename 失敗時，既有目標維持不變。若失敗後的 close 或 remove cleanup 也失敗，命令會明確回報 cleanup failure，且可能留下它所指出的暫存檔，需人工核對檔名後刪除。

成功匯出後要檢查 diff，確認只包含預期內容，再跑 tests、typecheck 與兩種 base build。`content:check` 比對的是 bootstrap/local-source 產生器；若權威 Supabase 內容已和本機來源不同，checkpoint 後不應拿它判定遠端快照錯誤，也不能執行 `content:generate` 覆蓋較新的 Supabase checkpoint。只有修改來源抽取、contract 或 serializer 時，才要求重新產生的 snapshot 與 seed 一起通過 `content:check`。Checkpoint 不是資料庫備份。

## 驗證與部署

### 不需 Supabase 的離線 gate

```bash
npm test
npm run content:check
npm run typecheck
npm run build
VITE_BASE=/tmuh-mededu-website/ npm run build
test -f dist/index.html
test -f dist/404.html
```

目前已驗證的基準是 210 個測試檔、1659 個測試，以及 content check、typecheck、根路徑 build 與 Pages base-path build。改動可見介面後仍需以瀏覽器檢查中英文、明暗主題、手機與桌機。

### 本機資料庫

只有已安裝相容 Supabase CLI 且 Docker 可用時才執行：

```bash
supabase db start
supabase db reset --local
supabase db lint --local --fail-on error
supabase test db --local
supabase stop --no-backup
```

沒有本機條件時，可到 GitHub Actions 手動執行 `Verify Supabase database`。`.github/workflows/supabase-database.yml` 只在 `workflow_dispatch` 啟動，會建立暫時的本機資料庫、套用全部 migrations、lint、執行 pgTAP，最後清除環境。這不是 hosted production 驗證。

### Hosted Supabase 與 Edge Function

只有在取得核准的 hosted 專案權限與憑證後，才可連結專案、套用 migrations、設定 `CMS_ADMIN_ALLOWED_ORIGINS`、部署 `cms-publish`，並執行 Auth、RLS、RPC、Storage、發佈與 checkpoint 整合驗證。部署前必須確認：

- hosted Auth 的 signup 與 anonymous sign-in 已關閉。
- 12 組文件身分與 migrations 完整套用。
- `draft-media` 私有、`public-media` 公開且 bucket 限制正確。
- Edge Function managed variables 可用，allowed origins 已設成實際管理站 origin。
- 操作者使用 publishable key，沒有把 privileged key 帶入前端或 checkpoint。

具備核准權限且已安裝相容 Supabase CLI 時，從已審查的版本依序執行。角括號內容必須由操作者在執行前替換，不能照抄：

```bash
supabase link --project-ref '<APPROVED-PROJECT-REF>'
supabase db push
supabase secrets set CMS_ADMIN_ALLOWED_ORIGINS='<ADMIN-SITE-ORIGIN>'
supabase functions deploy cms-publish
```

完成後要在 Dashboard 核對 migration 與 Function 版本，再執行實際管理員登入、匿名拒絕、媒體發佈、公開讀取及 checkpoint gate。Supabase 提供的 managed variables 不需用 `secrets set` 重複寫入。

未具備上述條件時，不要嘗試 production 指令，也不能宣稱 hosted 整合通過。

### 網站部署

Vercel 使用根路徑 build 與 `vercel.json` SPA rewrite。將兩個 `VITE_SUPABASE_*` 瀏覽器變數設在實際要連線 CMS 的 Vercel environment，推送 `main` 後由 Vercel 專案自動建置。

GitHub Pages 目前由 `gh-pages` 分支提供，`npm run deploy` 會透過 `predeploy` 做 typecheck 與 `VITE_BASE=/tmuh-mededu-website/` build，再發佈 `dist/`。`.github/workflows/deploy.yml` 是手動替代方案，只有當 Settings、Pages、Source 已切換成 GitHub Actions 才能使用。Pages 沒有 rewrite，Vite build 會產生 `dist/404.html` 支援 SPA 深層連結。

Edge Function 與前端是兩個部署單位。只部署網站不會套用 migration 或更新 Function，只部署 Function也不會更新 committed snapshot。正式釋出前要逐項確認版本、環境變數、allowed origins 與 checkpoint 狀態。
