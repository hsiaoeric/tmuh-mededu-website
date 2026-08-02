# 臺北醫學大學附設醫院 教學部官網 — 原始碼

> Design Component 原始檔：`教學部官網.dc.html`（共 1789 行）
> 此檔可直接於瀏覽器開啟；打包後的單一離線版本為 `教學部官網-standalone.html`。

**頁籤 / 視圖**：教學部首頁（dept）、全人照護教育中心（holistic）、實證醫學中心（ebm）、教師發展中心（facdev）、其餘中心入口頁（building）。

---

## 教學部官網.dc.html

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&amp;family=Noto+Serif+TC:wght@600;700;900&amp;family=IBM+Plex+Sans:wght@400;500;600;700&amp;family=IBM+Plex+Mono:wght@500&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="_ds/morandi-clinical-bi-design-system-a682d4f0-980c-4cde-894c-7381f27d1f2d/tokens/colors.css">
<meta name="ext-resource-dependency" content="assets/hero.jpg" data-resource-id="hero">
<meta name="ext-resource-dependency" content="assets/ming-de-chen.jpg" data-resource-id="ming-de-chen">
<meta name="ext-resource-dependency" content="assets/shumei-chen.jpg" data-resource-id="shumei-chen">
<meta name="ext-resource-dependency" content="assets/jen-chieh-wu.jpg" data-resource-id="jen-chieh-wu">
<meta name="ext-resource-dependency" content="assets/hsiu-chen-lin.jpg" data-resource-id="hsiu-chen-lin">
<meta name="ext-resource-dependency" content="assets/sheng-feng-lin.jpg" data-resource-id="sheng-feng-lin">
<meta name="ext-resource-dependency" content="assets/faith-ruofan-liao.jpg" data-resource-id="faith-ruofan-liao">
<meta name="ext-resource-dependency" content="assets/ling-cheng-mong.jpg" data-resource-id="ling-cheng-mong">
<meta name="ext-resource-dependency" content="assets/chung-che-wu.jpg" data-resource-id="chung-che-wu">
<meta name="ext-resource-dependency" content="assets/lai-lei-ting.jpg" data-resource-id="lai-lei-ting">
<meta name="ext-resource-dependency" content="assets/jeng-cheng-wu.jpg" data-resource-id="jeng-cheng-wu">
<meta name="ext-resource-dependency" content="assets/li-hsuan-wang.jpg" data-resource-id="li-hsuan-wang">
<meta name="ext-resource-dependency" content="assets/chun-chao-chang.jpg" data-resource-id="chun-chao-chang">
<meta name="ext-resource-dependency" content="assets/tu-hsueh-yeh.jpg" data-resource-id="tu-hsueh-yeh">
<meta name="ext-resource-dependency" content="assets/li-fang-chang.jpg" data-resource-id="li-fang-chang">
<meta name="ext-resource-dependency" content="assets/shu-liu-guo.jpg" data-resource-id="shu-liu-guo">
<meta name="ext-resource-dependency" content="assets/tien-shang-chu.jpg" data-resource-id="tien-shang-chu">
<meta name="ext-resource-dependency" content="assets/nien-hsuan-tsao.jpg" data-resource-id="nien-hsuan-tsao">
<meta name="ext-resource-dependency" content="assets/fang-chun-fan.jpg" data-resource-id="fang-chun-fan">
<meta name="ext-resource-dependency" content="assets/chien-yu-chen.jpg" data-resource-id="chien-yu-chen">
<meta name="ext-resource-dependency" content="assets/hsin-yi-chiu.jpg" data-resource-id="hsin-yi-chiu">
<meta name="ext-resource-dependency" content="assets/hung-wei-tsai.jpg" data-resource-id="hung-wei-tsai">
<style>
  :root{
    --teal:#4f8c7d; --teal-700:#3a6b5f; --teal-50:#e6f0ec; --teal-glow:rgba(79,140,125,.5);
    --bg:#F4F6F4; --bg2:#EFEBE6; --surface:#FFFFFF; --surface-2:#FBFAF8;
    --border:#DCD9D2; --grid:#E6E2DC; --text:#2A2E2B; --body:#4A4540; --muted:#827C73;
    --shadow-card:0 1px 2px rgba(74,69,64,.05); --shadow-lift:0 18px 40px rgba(46,55,50,.16);
  }
  [data-theme="dark"]{
    --teal:#6db5a1; --teal-700:#8fcab8; --teal-50:#1a2a25; --teal-glow:rgba(109,181,161,.4);
    --bg:#161b18; --bg2:#1b211d; --surface:#1f2622; --surface-2:#252d28;
    --border:#333c36; --grid:#2a322d; --text:#ece9e3; --body:#cbc6bd; --muted:#8f8a80;
    --shadow-card:0 1px 2px rgba(0,0,0,.4); --shadow-lift:0 18px 44px rgba(0,0,0,.55);
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
  body{font-family:'IBM Plex Sans','Noto Sans TC',sans-serif;}
  ::selection{background:var(--teal);color:#fff;}
  @keyframes draw{to{stroke-dashoffset:0;}}
  @keyframes floatchip{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
  @keyframes pulsering{0%{transform:scale(1);opacity:.55;}70%{transform:scale(2.1);opacity:0;}100%{opacity:0;}}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes blink{0%,100%{opacity:.35;}50%{opacity:1;}}
  @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;}}
  ::-webkit-scrollbar{width:11px;height:11px;}
  ::-webkit-scrollbar-thumb{background:var(--border);border-radius:9px;border:3px solid var(--bg);}
  ::-webkit-scrollbar-track{background:var(--bg);}
</style>
</helmet>
<div ref="{{ rootRef }}" data-theme="{{ theme }}" style="--teal:{{ teal }};position:relative;min-height:100vh;background:var(--bg);color:var(--body);font-family:'IBM Plex Sans','Noto Sans TC',sans-serif;font-size:16px;line-height:1.7;overflow-x:clip;transition:background .4s ease,color .4s ease;">

  <svg width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs><symbol id="ic-heart" viewBox="0 0 24 24"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></symbol><symbol id="ic-arrow" viewBox="0 0 24 24"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></symbol><symbol id="ic-phone" viewBox="0 0 24 24"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></symbol><symbol id="ic-pin" viewBox="0 0 24 24"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle></symbol><symbol id="ic-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></symbol><symbol id="ic-moon" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></symbol><symbol id="ic-cap" viewBox="0 0 24 24"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"></path><path d="M22 10v6"></path><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"></path></symbol><symbol id="ic-skills" viewBox="0 0 24 24"><path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"></path><path d="M9 11V6a3 3 0 0 1 6 0v5"></path><path d="M12 15v3"></path></symbol><symbol id="ic-chart" viewBox="0 0 24 24"><path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="m19 9-5 5-4-4-3 3"></path></symbol><symbol id="ic-holistic" viewBox="0 0 24 24"><path d="M12 8a2.83 2.83 0 0 1 4 4l-4 4-4-4a2.83 2.83 0 0 1 4-4"></path><circle cx="12" cy="12" r="9"></circle></symbol><symbol id="ic-research" viewBox="0 0 24 24"><path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle><path d="M11 8v6"></path><path d="M8 11h6"></path></symbol><symbol id="ic-admin" viewBox="0 0 24 24"><path d="M3 21h18"></path><path d="M5 21V7l8-4v18"></path><path d="M19 21V11l-6-4"></path><path d="M9 9v.01"></path><path d="M9 12v.01"></path><path d="M9 15v.01"></path></symbol><symbol id="ic-brain" viewBox="0 0 24 24"><path d="M12 5a3 3 0 1 0-5.997.142 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"></path><path d="M12 5a3 3 0 1 1 5.997.142 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"></path></symbol><symbol id="ic-sprout" viewBox="0 0 24 24"><path d="M7 20h10"></path><path d="M10 20c5.5-2.5.8-6.4 3-10"></path><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"></path><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"></path></symbol><symbol id="ic-network" viewBox="0 0 24 24"><circle cx="12" cy="5" r="2.5"></circle><path d="M12 7.5v3"></path><circle cx="5" cy="19" r="2.5"></circle><circle cx="19" cy="19" r="2.5"></circle><path d="M12 10.5 6.5 16.8"></path><path d="m12 10.5 5.5 6.3"></path></symbol><symbol id="ic-team" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></symbol><symbol id="ic-book" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></symbol><symbol id="ic-award" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"></circle><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path></symbol><symbol id="ic-bulb" viewBox="0 0 24 24"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path><path d="M9 18h6"></path><path d="M10 22h4"></path></symbol><symbol id="ic-clipboard" viewBox="0 0 24 24"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="m9 14 2 2 4-4"></path></symbol><symbol id="ic-bell" viewBox="0 0 24 24"><path d="M10.268 21a2 2 0 0 0 3.464 0"></path><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path></symbol><symbol id="ic-calendar" viewBox="0 0 24 24"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></symbol></defs></svg>
  <canvas ref="{{ canvasRef }}" style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:.9;"></canvas>
  <div ref="{{ glowRef }}" style="position:fixed;top:0;left:0;width:560px;height:560px;margin:-280px 0 0 -280px;border-radius:50%;pointer-events:none;z-index:0;background:radial-gradient(circle,var(--teal-glow),transparent 62%);opacity:.5;filter:blur(36px);transition:opacity .5s ease;will-change:transform;"></div>

  <header style="position:sticky;top:0;z-index:50;backdrop-filter:saturate(1.4) blur(14px);background:color-mix(in srgb,var(--surface) 82%,transparent);border-bottom:1px solid var(--border);">
    <div style="max-width:1240px;margin:0 auto;padding:13px 28px;display:flex;align-items:center;justify-content:space-between;gap:20px;">
      <button onClick="{{ goHome }}" style="display:flex;align-items:center;gap:12px;background:none;border:none;cursor:pointer;text-align:left;">
        <div style="width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:linear-gradient(140deg,var(--teal),var(--teal-700));box-shadow:0 6px 16px var(--teal-glow);flex-shrink:0;">
          <span style="display:block;width:23px;height:23px;color:#fff;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#ic-heart"></use></svg></span>
        </div>
        <div style="display:flex;flex-direction:column;line-height:1.22;">
          <span style="font-family:'Noto Sans TC',sans-serif;font-weight:700;font-size:15.5px;color:var(--text);letter-spacing:.01em;">{{ t.brand1 }}</span>
          <span style="font-family:'IBM Plex Sans',sans-serif;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);">{{ t.brand2 }}</span>
        </div>
      </button>
      <nav style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;justify-content:flex-end;">
        <sc-for list="{{ navItems }}" as="item" hint-placeholder-count="5">
          <button onClick="{{ item.onClick }}" style="padding:8px 14px;border:none;background:none;cursor:pointer;font-family:'Noto Sans TC',sans-serif;font-weight:600;font-size:14px;color:{{ item.color }};border-radius:8px;transition:color .2s,background .2s;" onMouseEnter="{{ item.enter }}" onMouseLeave="{{ item.leave }}">{{ item.label }}</button>
        </sc-for>
        <button onClick="{{ toggleLang }}" style="margin-left:6px;padding:7px 13px;border:1px solid var(--border);background:var(--surface);cursor:pointer;border-radius:999px;font-family:'IBM Plex Sans',sans-serif;font-weight:700;font-size:12.5px;color:var(--teal-700);letter-spacing:.04em;display:flex;align-items:center;gap:5px;">{{ t.langBtn }}</button>
        <button onClick="{{ toggleTheme }}" aria-label="theme" style="width:38px;height:38px;border:1px solid var(--border);background:var(--surface);cursor:pointer;border-radius:999px;display:flex;align-items:center;justify-content:center;color:var(--body);">
          <span style="display:block;width:18px;height:18px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#{{ themeIconId }}"></use></svg></span>
        </button>
      </nav>
    </div>
  </header>

  <!-- ============ DEPT VIEW ============ -->
  <sc-if value="{{ isDept }}" hint-placeholder-val="{{ true }}">
  <div style="position:relative;z-index:1;">

    <!-- HERO -->
    <section id="top" style="max-width:1240px;margin:0 auto;padding:46px 28px 30px;">
      <!-- Variant A : split -->
      <sc-if value="{{ heroA }}" hint-placeholder-val="{{ false }}">
        <div style="display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:center;">
          <div data-reveal="">
            <div style="display:inline-flex;align-items:center;gap:9px;padding:6px 14px;border-radius:999px;background:var(--teal-50);border:1px solid color-mix(in srgb,var(--teal) 28%,transparent);margin-bottom:22px;">
              <span style="width:7px;height:7px;border-radius:50%;background:var(--teal);box-shadow:0 0 0 4px color-mix(in srgb,var(--teal) 22%,transparent);"></span>
              <span style="font-family:'IBM Plex Sans',sans-serif;font-size:11.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--teal-700);">{{ t.heroEyebrow }}</span>
            </div>
            <h1 style="font-family:'Noto Serif TC',serif;font-weight:900;font-size:clamp(40px,5vw,66px);line-height:1.1;color:var(--text);letter-spacing:.01em;">{{ t.heroTitle1 }}<br><span style="color:var(--teal);">{{ t.heroTitle2 }}</span></h1>
            <div style="width:72px;height:5px;border-radius:999px;background:linear-gradient(90deg,var(--teal),transparent);margin:24px 0 22px;"></div>
            <p style="font-size:17.5px;line-height:1.85;color:var(--body);max-width:540px;">{{ t.heroTag }}</p>
            <div style="display:flex;gap:14px;margin-top:32px;flex-wrap:wrap;">
              <button onClick="{{ scrollOrg }}" style="display:inline-flex;align-items:center;gap:9px;padding:14px 26px;border:none;border-radius:12px;cursor:pointer;background:linear-gradient(140deg,var(--teal),var(--teal-700));color:#fff;font-family:'Noto Sans TC',sans-serif;font-weight:700;font-size:15.5px;box-shadow:0 12px 26px var(--teal-glow);">{{ t.ctaOrg }}<span style="display:block;width:18px;height:18px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#ic-arrow"></use></svg></span></button>
              <button onClick="{{ enterHolistic }}" style="display:inline-flex;align-items:center;gap:9px;padding:14px 26px;border:1px solid var(--border);border-radius:12px;cursor:pointer;background:var(--surface);color:var(--text);font-family:'Noto Sans TC',sans-serif;font-weight:700;font-size:15.5px;">{{ t.ctaHolistic }}</button>
            </div>
          </div>
          <div data-reveal="" data-reveal-delay="120" style="position:relative;">
            <div style="position:relative;border-radius:22px;overflow:hidden;box-shadow:var(--shadow-lift);border:1px solid var(--border);">
              <img ref="{{ heroRef }}" alt="TMUH" style="width:100%;height:clamp(320px,40vw,440px);object-fit:cover;display:block;">
              <div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,rgba(20,30,26,.34));"></div>
            </div>
            <div style="position:absolute;left:-22px;bottom:34px;display:flex;flex-direction:column;gap:12px;animation:floatchip 6s ease-in-out infinite;">
              <div style="display:flex;align-items:center;gap:12px;padding:13px 18px;border-radius:14px;background:var(--surface);box-shadow:var(--shadow-lift);border:1px solid var(--border);">
                <span style="font-family:'IBM Plex Sans';font-weight:700;font-size:30px;color:var(--teal);">6</span>
                <span style="font-family:'Noto Sans TC';font-weight:600;font-size:13.5px;color:var(--body);line-height:1.3;">{{ t.chipCenters }}</span>
              </div>
            </div>
            <div style="position:absolute;right:-18px;top:30px;padding:12px 18px;border-radius:14px;background:var(--surface);box-shadow:var(--shadow-lift);border:1px solid var(--border);display:flex;align-items:center;gap:11px;animation:floatchip 6s ease-in-out infinite .8s;">
              <span style="font-family:'IBM Plex Sans';font-weight:700;font-size:30px;color:var(--teal-700);">11</span>
              <span style="font-family:'Noto Sans TC';font-weight:600;font-size:13.5px;color:var(--body);line-height:1.3;">{{ t.chipSeed }}</span>
            </div>
          </div>
        </div>
      </sc-if>
      <!-- Variant B : full-bleed banner -->
      <sc-if value="{{ heroB }}" hint-placeholder-val="{{ false }}">
        <div data-reveal="" style="position:relative;border-radius:26px;overflow:hidden;box-shadow:var(--shadow-lift);min-height:clamp(420px,52vw,560px);display:flex;align-items:center;">
          <img ref="{{ heroRef }}" alt="TMUH" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">
          <div style="position:absolute;inset:0;background:linear-gradient(100deg,rgba(22,40,34,.9) 0%,rgba(22,40,34,.6) 44%,rgba(22,40,34,.12) 80%);"></div>
          <div style="position:relative;padding:clamp(34px,5vw,72px);max-width:760px;">
            <div style="display:inline-flex;align-items:center;gap:9px;padding:6px 14px;border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.3);margin-bottom:24px;">
              <span style="font-family:'IBM Plex Sans';font-size:11.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#eafff7;">{{ t.heroEyebrow }}</span>
            </div>
            <h1 style="font-family:'Noto Serif TC',serif;font-weight:900;font-size:clamp(44px,6vw,76px);line-height:1.08;color:#fff;text-shadow:0 3px 26px rgba(0,0,0,.35);">{{ t.heroTitle1 }}<br><span style="color:#bfe9dc;">{{ t.heroTitle2 }}</span></h1>
            <div style="width:80px;height:5px;border-radius:999px;background:#bfe9dc;margin:26px 0 22px;"></div>
            <p style="font-size:18px;line-height:1.85;color:#e6f3ee;max-width:560px;">{{ t.heroTag }}</p>
            <div style="display:flex;gap:14px;margin-top:32px;flex-wrap:wrap;">
              <button onClick="{{ scrollOrg }}" style="display:inline-flex;align-items:center;gap:9px;padding:14px 26px;border:none;border-radius:12px;cursor:pointer;background:#fff;color:var(--teal-700);font-family:'Noto Sans TC';font-weight:700;font-size:15.5px;">{{ t.ctaOrg }}<span style="display:block;width:18px;height:18px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#ic-arrow"></use></svg></span></button>
              
            </div>
            <div style="margin-top:24px;">
              <div style="font-family:'IBM Plex Sans';font-size:10.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#bfe9dc;margin-bottom:11px;">{{ centerPagesTitle }}</div>
              <div style="display:flex;gap:9px;flex-wrap:wrap;max-width:680px;">
                <sc-for list="{{ centerLinks }}" as="c" hint-placeholder-count="5">
                  <button onClick="{{ c.onClick }}" style="display:inline-flex;align-items:center;gap:7px;padding:9px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.42);background:rgba(255,255,255,.12);color:#fff;font-family:'Noto Sans TC';font-weight:600;font-size:13px;cursor:pointer;" style-hover="background:rgba(255,255,255,.26);">
                    <span style="width:16px;height:16px;display:block;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#{{ c.iconId }}"></use></svg></span>
                    {{ c.name }}<span style="font-size:10.5px;opacity:.82;">· {{ c.statusLabel }}</span>
                  </button>
                </sc-for>
              </div>
            </div>
          </div>
        </div>
      </sc-if>
    </section>

    <!-- KPI DASHBOARD -->
    <section style="max-width:1240px;margin:0 auto;padding:34px 28px;">
      <div data-reveal style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:24px;flex-wrap:wrap;">
        <div>
          <div style="font-family:'IBM Plex Sans';font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--teal);margin-bottom:6px;">{{ t.kpiEyebrow }}</div>
          <h2 style="font-family:'Noto Sans TC';font-weight:900;font-size:30px;color:var(--text);">{{ t.kpiTitle }}</h2>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(186px,1fr));gap:18px;">
        <sc-for list="{{ kpis }}" as="k" hint-placeholder-count="5">
          <div data-reveal data-reveal-delay="{{ k.delay }}" style="position:relative;padding:24px 22px;border-radius:16px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-card);overflow:hidden;">
            <div style="position:absolute;top:0;left:0;width:3px;height:100%;background:{{ k.color }};"></div>
            <div style="display:flex;align-items:baseline;gap:4px;">
              <span data-count="{{ k.num }}" data-suffix="{{ k.suffix }}" style="font-family:'IBM Plex Sans';font-weight:700;font-size:54px;line-height:1;color:var(--text);font-variant-numeric:tabular-nums;">0</span>
            </div>
            <div style="font-family:'Noto Sans TC';font-weight:700;font-size:15px;color:var(--text);margin-top:12px;">{{ k.zh }}</div>
            <div style="font-family:'IBM Plex Sans';font-size:11.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin-top:2px;">{{ k.en }}</div>
          </div>
        </sc-for>
      </div>
    </section>

    <!-- ORG CHART -->
    <section id="org" style="max-width:1240px;margin:0 auto;padding:46px 28px;">
      <div data-reveal="" style="text-align:center;max-width:680px;margin:0 auto 14px;">
        <div style="font-family:'IBM Plex Sans';font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--teal);margin-bottom:8px;">Organizational Structure</div>
        <h2 style="font-family:'Noto Sans TC';font-weight:900;font-size:34px;color:var(--text);">{{ t.orgTitle }}</h2>
        <p style="font-size:16px;color:var(--muted);margin-top:12px;">{{ t.orgDesc }}</p>
      </div>
      <!-- layout switch -->
      <div data-reveal="" style="display:flex;justify-content:center;gap:8px;margin:22px 0 30px;">
        <button onClick="{{ setOrgA }}" style="padding:8px 18px;border-radius:999px;cursor:pointer;font-family:'Noto Sans TC';font-weight:600;font-size:13.5px;border:1px solid {{ orgABorder }};background:{{ orgABg }};color:{{ orgAColor }};">{{ t.layoutTree }}</button>
        <button onClick="{{ setOrgB }}" style="padding:8px 18px;border-radius:999px;cursor:pointer;font-family:'Noto Sans TC';font-weight:600;font-size:13.5px;border:1px solid {{ orgBBorder }};background:{{ orgBBg }};color:{{ orgBColor }};">{{ t.layoutHub }}</button>
      </div>

      <!-- Variant A : Tree -->
      <sc-if value="{{ orgTree }}" hint-placeholder-val="{{ true }}">
        <div style="display:flex;flex-direction:column;align-items:center;">
          <div style="padding:14px 30px;border-radius:14px;background:linear-gradient(140deg,var(--teal),var(--teal-700));color:#fff;text-align:center;box-shadow:0 12px 26px var(--teal-glow);">
            <div style="font-family:'Noto Sans TC';font-weight:700;font-size:18px;">{{ t.hospital }}</div>
            <div style="font-family:'IBM Plex Sans';font-size:11px;letter-spacing:.08em;opacity:.9;">Taipei Medical University Hospital</div>
          </div>
          <div style="width:2px;height:26px;background:var(--border);"></div>
          <div style="padding:11px 26px;border-radius:12px;background:var(--surface);border:1.5px solid var(--teal);color:var(--text);text-align:center;font-family:'Noto Sans TC';font-weight:700;font-size:16px;box-shadow:var(--shadow-card);">{{ t.dept }}<span style="display:block;font-family:'IBM Plex Sans';font-weight:500;font-size:10.5px;letter-spacing:.06em;color:var(--muted);">Six functional units</span></div>
          <div style="width:2px;height:26px;background:var(--border);"></div>
          <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:14px;width:100%;">
            <sc-for list="{{ centers }}" as="c" hint-placeholder-count="6">
              <button onClick="{{ c.onClick }}" style="position:relative;padding:18px 12px;border-radius:14px;cursor:pointer;border:1.5px solid {{ c.nodeBorder }};background:{{ c.nodeBg }};text-align:center;transition:transform .25s,box-shadow .25s,border-color .25s;box-shadow:{{ c.nodeShadow }};" onMouseEnter="{{ c.enter }}" onMouseLeave="{{ c.leave }}">
                <span style="display:block;width:34px;height:34px;margin:0 auto 9px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,{{ c.color }} 16%,transparent);color:{{ c.color }};"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#{{ c.iconId }}"></use></svg></span>
                <span style="display:block;font-family:'Noto Sans TC';font-weight:700;font-size:14px;color:var(--text);line-height:1.3;">{{ c.name }}</span>
                <span style="display:block;font-family:'IBM Plex Sans';font-size:10.5px;color:var(--muted);margin-top:4px;">{{ c.countLabel }}</span>
              </button>
            </sc-for>
          </div>
        </div>
      </sc-if>

      <!-- Variant B : Hub -->
      <sc-if value="{{ orgHub }}" hint-placeholder-val="{{ false }}">
        <div style="position:relative;width:100%;max-width:760px;margin:0 auto;aspect-ratio:1.45/1;">
          <svg viewBox="0 0 100 70" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible;">
            <sc-for list="{{ centers }}" as="c" hint-placeholder-count="6">
              <line x1="50" y1="35" x2="{{ c.hx }}" y2="{{ c.hy }}" stroke="{{ c.color }}" stroke-width=".4" stroke-dasharray="60" stroke-dashoffset="60" style="animation:draw 1.1s ease forwards .2s;opacity:.55;"></line>
            </sc-for>
          </svg>
          <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:128px;height:128px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:linear-gradient(140deg,var(--teal),var(--teal-700));color:#fff;box-shadow:0 14px 32px var(--teal-glow);z-index:2;">
            <div style="font-family:'Noto Sans TC';font-weight:800;font-size:18px;">{{ t.deptShort }}</div>
            <div style="font-family:'IBM Plex Sans';font-size:9.5px;letter-spacing:.1em;opacity:.9;margin-top:2px;">DEPT. OF<br>MED. EDUCATION</div>
          </div>
          <sc-for list="{{ centers }}" as="c" hint-placeholder-count="6">
            <button onClick="{{ c.onClick }}" style="position:absolute;left:{{ c.hleft }};top:{{ c.htop }};transform:translate(-50%,-50%);width:118px;padding:14px 10px;border-radius:14px;cursor:pointer;border:1.5px solid {{ c.nodeBorder }};background:{{ c.nodeBg }};text-align:center;box-shadow:{{ c.nodeShadow }};z-index:3;transition:transform .25s,box-shadow .25s;" onMouseEnter="{{ c.enterHub }}" onMouseLeave="{{ c.leaveHub }}">
              <span style="display:block;width:30px;height:30px;margin:0 auto 7px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,{{ c.color }} 16%,transparent);color:{{ c.color }};"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#{{ c.iconId }}"></use></svg></span>
              <span style="display:block;font-family:'Noto Sans TC';font-weight:700;font-size:12.5px;color:var(--text);line-height:1.25;">{{ c.name }}</span>
            </button>
          </sc-for>
        </div>
      </sc-if>

      <!-- Active center panel -->
      <sc-if value="{{ active }}" hint-placeholder-val="{{ false }}">
        <div style="margin-top:34px;border-radius:20px;overflow:hidden;border:1px solid var(--border);background:var(--surface);box-shadow:var(--shadow-lift);">
          <div style="padding:26px 30px;background:linear-gradient(120deg,color-mix(in srgb,{{ active.color }} 16%,var(--surface)),var(--surface));border-bottom:1px solid var(--border);display:flex;align-items:center;gap:16px;">
            <span style="width:50px;height:50px;border-radius:13px;display:flex;align-items:center;justify-content:center;background:{{ active.color }};color:#fff;flex-shrink:0;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#{{ active.iconId }}"></use></svg></span>
            <div style="flex:1;">
              <div style="font-family:'Noto Sans TC';font-weight:900;font-size:23px;color:var(--text);">{{ active.name }}</div>
              <div style="font-family:'IBM Plex Sans';font-size:12px;letter-spacing:.05em;color:var(--muted);text-transform:uppercase;">{{ active.en }}</div>
            </div>
            <button onClick="{{ closeActive }}" aria-label="close" style="width:34px;height:34px;border-radius:50%;border:1px solid var(--border);background:var(--surface);cursor:pointer;color:var(--muted);font-size:16px;flex-shrink:0;">✕</button>
          </div>
          <div style="padding:24px 30px 30px;">
            <p style="font-size:15.5px;line-height:1.8;color:var(--body);border-left:3px solid {{ active.color }};padding-left:16px;margin-bottom:8px;">{{ active.intro }}</p>
            <sc-if value="{{ active.contactLine }}" hint-placeholder-val="{{ false }}">
              <div style="display:inline-flex;align-items:center;gap:9px;margin:14px 0 22px;padding:8px 16px;border-radius:999px;background:var(--teal-50);font-family:'Noto Sans TC';font-size:13.5px;color:var(--teal-700);font-weight:600;">
                <span style="display:block;width:15px;height:15px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#ic-phone"></use></svg></span>{{ active.contactLine }}
              </div>
            </sc-if>
            <sc-if value="{{ active.hasPeople }}" hint-placeholder-val="{{ true }}">
              <div style="font-family:'Noto Sans TC';font-weight:700;font-size:15px;color:var(--text);margin:6px 0 16px;display:flex;align-items:center;gap:10px;"><span style="width:5px;height:20px;border-radius:9px;background:{{ active.color }};"></span>{{ t.members }}</div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(216px,1fr));gap:16px;">
                <sc-for list="{{ active.people }}" as="p" hint-placeholder-count="3">
                  <div data-reveal="" style="position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:22px 18px 20px;background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:0 1px 2px rgba(74,69,64,.05);transition:transform .35s cubic-bezier(.2,0,.2,1),box-shadow .35s,border-color .35s;overflow:hidden;" style-hover="transform:translateY(-6px);box-shadow:0 16px 34px rgba(74,69,64,.16);border-color:color-mix(in srgb,{{ p.accent }} 45%,var(--border));">
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:{{ p.accent }};opacity:.9;"></div>
  <div style="position:relative;width:88px;height:88px;border-radius:50%;padding:3px;background:linear-gradient(140deg,{{ p.accent }},transparent 70%);">
    <sc-if value="{{ p.hasPhoto }}" hint-placeholder-val="{{ false }}"><img ref="{{ p.imgRef }}" alt="{{ p.fullname }}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;border:2px solid var(--surface);display:block;"></sc-if>
    <sc-if value="{{ p.noPhoto }}" hint-placeholder-val="{{ true }}"><div style="width:100%;height:100%;border-radius:50%;border:2px solid var(--surface);display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Sans',sans-serif;font-weight:600;font-size:24px;color:#fff;background:{{ p.accent }};">{{ p.initials }}</div></sc-if>
  </div>
  <div style="font-family:'Noto Sans TC',sans-serif;font-weight:700;font-size:17px;color:var(--text);line-height:1.25;margin-top:4px;">{{ p.fullname }}</div>
  <div style="font-family:'IBM Plex Sans',sans-serif;font-size:11.5px;letter-spacing:.04em;color:var(--muted);text-transform:uppercase;">{{ p.sub }}</div>
  <div style="margin-top:4px;padding:3px 13px;border-radius:999px;font-size:12px;font-weight:600;color:{{ p.accent }};background:color-mix(in srgb,{{ p.accent }} 13%,transparent);border:1px solid color-mix(in srgb,{{ p.accent }} 30%,transparent);">{{ p.role }}</div>
  <div style="font-size:12.5px;color:var(--muted);line-height:1.45;margin-top:2px;white-space:pre-line;">{{ p.dept }}</div>
  <sc-if value="{{ p.duty }}" hint-placeholder-val="{{ false }}"><div style="margin-top:8px;width:100%;padding:9px 11px;border-radius:9px;background:color-mix(in srgb,{{ p.accent }} 8%,transparent);border:1px solid color-mix(in srgb,{{ p.accent }} 18%,transparent);text-align:left;"><div style="font-family:'IBM Plex Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:{{ p.accent }};margin-bottom:3px;">{{ p.dutyLabel }}</div><div style="font-family:'Noto Sans TC',sans-serif;font-size:12px;line-height:1.55;color:var(--body);">{{ p.duty }}</div></div></sc-if>
  <sc-if value="{{ p.profile }}" hint-placeholder-val="{{ false }}"><a href="{{ p.profile }}" target="_blank" rel="noopener" style="margin-top:6px;display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--teal-700);">{{ p.profileLabel }} ↗</a></sc-if>
</div>
                </sc-for>
              </div>
            </sc-if>
            <sc-if value="{{ active.isAdmin }}" hint-placeholder-val="{{ true }}">
              <div style="display:flex;flex-direction:column;align-items:center;">
                <div style="font-family:'IBM Plex Sans',sans-serif;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:{{ active.color }};font-weight:600;margin-bottom:10px;">{{ active.cap1 }}</div>
                <div style="width:250px;"><sc-for list="{{ active.adminL1 }}" as="p" hint-placeholder-count="1"><div data-reveal="" style="position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:22px 18px 20px;background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:0 1px 2px rgba(74,69,64,.05);transition:transform .35s cubic-bezier(.2,0,.2,1),box-shadow .35s,border-color .35s;overflow:hidden;" style-hover="transform:translateY(-6px);box-shadow:0 16px 34px rgba(74,69,64,.16);border-color:color-mix(in srgb,{{ p.accent }} 45%,var(--border));">
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:{{ p.accent }};opacity:.9;"></div>
  <div style="position:relative;width:88px;height:88px;border-radius:50%;padding:3px;background:linear-gradient(140deg,{{ p.accent }},transparent 70%);">
    <sc-if value="{{ p.hasPhoto }}" hint-placeholder-val="{{ false }}"><img ref="{{ p.imgRef }}" alt="{{ p.fullname }}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;border:2px solid var(--surface);display:block;"></sc-if>
    <sc-if value="{{ p.noPhoto }}" hint-placeholder-val="{{ true }}"><div style="width:100%;height:100%;border-radius:50%;border:2px solid var(--surface);display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Sans',sans-serif;font-weight:600;font-size:24px;color:#fff;background:{{ p.accent }};">{{ p.initials }}</div></sc-if>
  </div>
  <div style="font-family:'Noto Sans TC',sans-serif;font-weight:700;font-size:17px;color:var(--text);line-height:1.25;margin-top:4px;">{{ p.fullname }}</div>
  <div style="font-family:'IBM Plex Sans',sans-serif;font-size:11.5px;letter-spacing:.04em;color:var(--muted);text-transform:uppercase;">{{ p.sub }}</div>
  <div style="margin-top:4px;padding:3px 13px;border-radius:999px;font-size:12px;font-weight:600;color:{{ p.accent }};background:color-mix(in srgb,{{ p.accent }} 13%,transparent);border:1px solid color-mix(in srgb,{{ p.accent }} 30%,transparent);">{{ p.role }}</div>
  <div style="font-size:12.5px;color:var(--muted);line-height:1.45;margin-top:2px;white-space:pre-line;">{{ p.dept }}</div>
  <sc-if value="{{ p.duty }}" hint-placeholder-val="{{ false }}"><div style="margin-top:8px;width:100%;padding:9px 11px;border-radius:9px;background:color-mix(in srgb,{{ p.accent }} 8%,transparent);border:1px solid color-mix(in srgb,{{ p.accent }} 18%,transparent);text-align:left;"><div style="font-family:'IBM Plex Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:{{ p.accent }};margin-bottom:3px;">{{ p.dutyLabel }}</div><div style="font-family:'Noto Sans TC',sans-serif;font-size:12px;line-height:1.55;color:var(--body);">{{ p.duty }}</div></div></sc-if>
  <sc-if value="{{ p.profile }}" hint-placeholder-val="{{ false }}"><a href="{{ p.profile }}" target="_blank" rel="noopener" style="margin-top:6px;display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--teal-700);">{{ p.profileLabel }} ↗</a></sc-if>
</div></sc-for></div>
                <div style="width:2px;height:30px;background:var(--border);"></div>
                <div style="font-family:'IBM Plex Sans',sans-serif;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:{{ active.color }};font-weight:600;margin-bottom:10px;">{{ active.cap2 }}</div>
                <div style="width:250px;"><sc-for list="{{ active.adminL2 }}" as="p" hint-placeholder-count="1"><div data-reveal="" style="position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:22px 18px 20px;background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:0 1px 2px rgba(74,69,64,.05);transition:transform .35s cubic-bezier(.2,0,.2,1),box-shadow .35s,border-color .35s;overflow:hidden;" style-hover="transform:translateY(-6px);box-shadow:0 16px 34px rgba(74,69,64,.16);border-color:color-mix(in srgb,{{ p.accent }} 45%,var(--border));">
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:{{ p.accent }};opacity:.9;"></div>
  <div style="position:relative;width:88px;height:88px;border-radius:50%;padding:3px;background:linear-gradient(140deg,{{ p.accent }},transparent 70%);">
    <sc-if value="{{ p.hasPhoto }}" hint-placeholder-val="{{ false }}"><img ref="{{ p.imgRef }}" alt="{{ p.fullname }}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;border:2px solid var(--surface);display:block;"></sc-if>
    <sc-if value="{{ p.noPhoto }}" hint-placeholder-val="{{ true }}"><div style="width:100%;height:100%;border-radius:50%;border:2px solid var(--surface);display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Sans',sans-serif;font-weight:600;font-size:24px;color:#fff;background:{{ p.accent }};">{{ p.initials }}</div></sc-if>
  </div>
  <div style="font-family:'Noto Sans TC',sans-serif;font-weight:700;font-size:17px;color:var(--text);line-height:1.25;margin-top:4px;">{{ p.fullname }}</div>
  <div style="font-family:'IBM Plex Sans',sans-serif;font-size:11.5px;letter-spacing:.04em;color:var(--muted);text-transform:uppercase;">{{ p.sub }}</div>
  <div style="margin-top:4px;padding:3px 13px;border-radius:999px;font-size:12px;font-weight:600;color:{{ p.accent }};background:color-mix(in srgb,{{ p.accent }} 13%,transparent);border:1px solid color-mix(in srgb,{{ p.accent }} 30%,transparent);">{{ p.role }}</div>
  <div style="font-size:12.5px;color:var(--muted);line-height:1.45;margin-top:2px;white-space:pre-line;">{{ p.dept }}</div>
  <sc-if value="{{ p.duty }}" hint-placeholder-val="{{ false }}"><div style="margin-top:8px;width:100%;padding:9px 11px;border-radius:9px;background:color-mix(in srgb,{{ p.accent }} 8%,transparent);border:1px solid color-mix(in srgb,{{ p.accent }} 18%,transparent);text-align:left;"><div style="font-family:'IBM Plex Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:{{ p.accent }};margin-bottom:3px;">{{ p.dutyLabel }}</div><div style="font-family:'Noto Sans TC',sans-serif;font-size:12px;line-height:1.55;color:var(--body);">{{ p.duty }}</div></div></sc-if>
  <sc-if value="{{ p.profile }}" hint-placeholder-val="{{ false }}"><a href="{{ p.profile }}" target="_blank" rel="noopener" style="margin-top:6px;display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--teal-700);">{{ p.profileLabel }} ↗</a></sc-if>
</div></sc-for></div>
                <div style="width:2px;height:30px;background:var(--border);"></div>
                <div style="font-family:'IBM Plex Sans',sans-serif;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:{{ active.color }};font-weight:600;margin-bottom:10px;">{{ active.cap3 }}</div>
                <div style="display:flex;gap:18px;flex-wrap:wrap;justify-content:center;"><sc-for list="{{ active.adminL3 }}" as="p" hint-placeholder-count="2"><div data-reveal="" style="position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:22px 18px 20px;background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:0 1px 2px rgba(74,69,64,.05);transition:transform .35s cubic-bezier(.2,0,.2,1),box-shadow .35s,border-color .35s;overflow:hidden;" style-hover="transform:translateY(-6px);box-shadow:0 16px 34px rgba(74,69,64,.16);border-color:color-mix(in srgb,{{ p.accent }} 45%,var(--border));">
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:{{ p.accent }};opacity:.9;"></div>
  <div style="position:relative;width:88px;height:88px;border-radius:50%;padding:3px;background:linear-gradient(140deg,{{ p.accent }},transparent 70%);">
    <sc-if value="{{ p.hasPhoto }}" hint-placeholder-val="{{ false }}"><img ref="{{ p.imgRef }}" alt="{{ p.fullname }}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;border:2px solid var(--surface);display:block;"></sc-if>
    <sc-if value="{{ p.noPhoto }}" hint-placeholder-val="{{ true }}"><div style="width:100%;height:100%;border-radius:50%;border:2px solid var(--surface);display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Sans',sans-serif;font-weight:600;font-size:24px;color:#fff;background:{{ p.accent }};">{{ p.initials }}</div></sc-if>
  </div>
  <div style="font-family:'Noto Sans TC',sans-serif;font-weight:700;font-size:17px;color:var(--text);line-height:1.25;margin-top:4px;">{{ p.fullname }}</div>
  <div style="font-family:'IBM Plex Sans',sans-serif;font-size:11.5px;letter-spacing:.04em;color:var(--muted);text-transform:uppercase;">{{ p.sub }}</div>
  <div style="margin-top:4px;padding:3px 13px;border-radius:999px;font-size:12px;font-weight:600;color:{{ p.accent }};background:color-mix(in srgb,{{ p.accent }} 13%,transparent);border:1px solid color-mix(in srgb,{{ p.accent }} 30%,transparent);">{{ p.role }}</div>
  <div style="font-size:12.5px;color:var(--muted);line-height:1.45;margin-top:2px;white-space:pre-line;">{{ p.dept }}</div>
  <sc-if value="{{ p.duty }}" hint-placeholder-val="{{ false }}"><div style="margin-top:8px;width:100%;padding:9px 11px;border-radius:9px;background:color-mix(in srgb,{{ p.accent }} 8%,transparent);border:1px solid color-mix(in srgb,{{ p.accent }} 18%,transparent);text-align:left;"><div style="font-family:'IBM Plex Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:{{ p.accent }};margin-bottom:3px;">{{ p.dutyLabel }}</div><div style="font-family:'Noto Sans TC',sans-serif;font-size:12px;line-height:1.55;color:var(--body);">{{ p.duty }}</div></div></sc-if>
  <sc-if value="{{ p.profile }}" hint-placeholder-val="{{ false }}"><a href="{{ p.profile }}" target="_blank" rel="noopener" style="margin-top:6px;display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--teal-700);">{{ p.profileLabel }} ↗</a></sc-if>
</div></sc-for></div>
                <div style="width:2px;height:30px;background:var(--border);"></div>
                <div style="font-family:'IBM Plex Sans',sans-serif;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:{{ active.color }};font-weight:600;margin-bottom:10px;">{{ active.cap4 }}</div>
                <div style="width:250px;"><sc-for list="{{ active.adminL4 }}" as="p" hint-placeholder-count="1"><div data-reveal="" style="position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:22px 18px 20px;background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:0 1px 2px rgba(74,69,64,.05);transition:transform .35s cubic-bezier(.2,0,.2,1),box-shadow .35s,border-color .35s;overflow:hidden;" style-hover="transform:translateY(-6px);box-shadow:0 16px 34px rgba(74,69,64,.16);border-color:color-mix(in srgb,{{ p.accent }} 45%,var(--border));">
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:{{ p.accent }};opacity:.9;"></div>
  <div style="position:relative;width:88px;height:88px;border-radius:50%;padding:3px;background:linear-gradient(140deg,{{ p.accent }},transparent 70%);">
    <sc-if value="{{ p.hasPhoto }}" hint-placeholder-val="{{ false }}"><img ref="{{ p.imgRef }}" alt="{{ p.fullname }}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;border:2px solid var(--surface);display:block;"></sc-if>
    <sc-if value="{{ p.noPhoto }}" hint-placeholder-val="{{ true }}"><div style="width:100%;height:100%;border-radius:50%;border:2px solid var(--surface);display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Sans',sans-serif;font-weight:600;font-size:24px;color:#fff;background:{{ p.accent }};">{{ p.initials }}</div></sc-if>
  </div>
  <div style="font-family:'Noto Sans TC',sans-serif;font-weight:700;font-size:17px;color:var(--text);line-height:1.25;margin-top:4px;">{{ p.fullname }}</div>
  <div style="font-family:'IBM Plex Sans',sans-serif;font-size:11.5px;letter-spacing:.04em;color:var(--muted);text-transform:uppercase;">{{ p.sub }}</div>
  <div style="margin-top:4px;padding:3px 13px;border-radius:999px;font-size:12px;font-weight:600;color:{{ p.accent }};background:color-mix(in srgb,{{ p.accent }} 13%,transparent);border:1px solid color-mix(in srgb,{{ p.accent }} 30%,transparent);">{{ p.role }}</div>
  <div style="font-size:12.5px;color:var(--muted);line-height:1.45;margin-top:2px;white-space:pre-line;">{{ p.dept }}</div>
  <sc-if value="{{ p.duty }}" hint-placeholder-val="{{ false }}"><div style="margin-top:8px;width:100%;padding:9px 11px;border-radius:9px;background:color-mix(in srgb,{{ p.accent }} 8%,transparent);border:1px solid color-mix(in srgb,{{ p.accent }} 18%,transparent);text-align:left;"><div style="font-family:'IBM Plex Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:{{ p.accent }};margin-bottom:3px;">{{ p.dutyLabel }}</div><div style="font-family:'Noto Sans TC',sans-serif;font-size:12px;line-height:1.55;color:var(--body);">{{ p.duty }}</div></div></sc-if>
  <sc-if value="{{ p.profile }}" hint-placeholder-val="{{ false }}"><a href="{{ p.profile }}" target="_blank" rel="noopener" style="margin-top:6px;display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--teal-700);">{{ p.profileLabel }} ↗</a></sc-if>
</div></sc-for></div>
                <div style="width:2px;height:30px;background:var(--border);"></div>
                <div style="display:flex;align-items:center;gap:10px;align-self:stretch;margin-bottom:16px;"><span style="width:5px;height:20px;border-radius:9px;background:{{ active.color }};"></span><span style="font-family:'Noto Sans TC',sans-serif;font-weight:700;font-size:15px;color:var(--text);">{{ active.cap5 }}</span><span style="flex:1;height:1px;background:var(--border);"></span></div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(206px,1fr));gap:16px;width:100%;">
                  <sc-for list="{{ active.adminL5 }}" as="p" hint-placeholder-count="6">
                    <div data-reveal="" style="position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:22px 18px 20px;background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:0 1px 2px rgba(74,69,64,.05);transition:transform .35s cubic-bezier(.2,0,.2,1),box-shadow .35s,border-color .35s;overflow:hidden;" style-hover="transform:translateY(-6px);box-shadow:0 16px 34px rgba(74,69,64,.16);border-color:color-mix(in srgb,{{ p.accent }} 45%,var(--border));">
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:{{ p.accent }};opacity:.9;"></div>
  <div style="position:relative;width:88px;height:88px;border-radius:50%;padding:3px;background:linear-gradient(140deg,{{ p.accent }},transparent 70%);">
    <sc-if value="{{ p.hasPhoto }}" hint-placeholder-val="{{ false }}"><img ref="{{ p.imgRef }}" alt="{{ p.fullname }}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;border:2px solid var(--surface);display:block;"></sc-if>
    <sc-if value="{{ p.noPhoto }}" hint-placeholder-val="{{ true }}"><div style="width:100%;height:100%;border-radius:50%;border:2px solid var(--surface);display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Sans',sans-serif;font-weight:600;font-size:24px;color:#fff;background:{{ p.accent }};">{{ p.initials }}</div></sc-if>
  </div>
  <div style="font-family:'Noto Sans TC',sans-serif;font-weight:700;font-size:17px;color:var(--text);line-height:1.25;margin-top:4px;">{{ p.fullname }}</div>
  <div style="font-family:'IBM Plex Sans',sans-serif;font-size:11.5px;letter-spacing:.04em;color:var(--muted);text-transform:uppercase;">{{ p.sub }}</div>
  <div style="margin-top:4px;padding:3px 13px;border-radius:999px;font-size:12px;font-weight:600;color:{{ p.accent }};background:color-mix(in srgb,{{ p.accent }} 13%,transparent);border:1px solid color-mix(in srgb,{{ p.accent }} 30%,transparent);">{{ p.role }}</div>
  <div style="font-size:12.5px;color:var(--muted);line-height:1.45;margin-top:2px;white-space:pre-line;">{{ p.dept }}</div>
  <sc-if value="{{ p.duty }}" hint-placeholder-val="{{ false }}"><div style="margin-top:8px;width:100%;padding:9px 11px;border-radius:9px;background:color-mix(in srgb,{{ p.accent }} 8%,transparent);border:1px solid color-mix(in srgb,{{ p.accent }} 18%,transparent);text-align:left;"><div style="font-family:'IBM Plex Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:{{ p.accent }};margin-bottom:3px;">{{ p.dutyLabel }}</div><div style="font-family:'Noto Sans TC',sans-serif;font-size:12px;line-height:1.55;color:var(--body);">{{ p.duty }}</div></div></sc-if>
  <sc-if value="{{ p.profile }}" hint-placeholder-val="{{ false }}"><a href="{{ p.profile }}" target="_blank" rel="noopener" style="margin-top:6px;display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--teal-700);">{{ p.profileLabel }} ↗</a></sc-if>
</div>
                  </sc-for>
                </div>
              </div>
            </sc-if>
            <sc-if value="{{ active.empty }}" hint-placeholder-val="{{ false }}">
              <div style="text-align:center;padding:36px;border:1.5px dashed var(--border);border-radius:14px;color:var(--muted);font-family:'Noto Sans TC';">{{ t.formingTeam }}</div>
            </sc-if>
          </div>
        </div>
      </sc-if>
    </section>

    <!-- NEWS & EVENTS placeholders -->
    <section id="news" style="max-width:1240px;margin:0 auto;padding:30px 28px 46px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px;">
        <sc-for list="{{ placeholders }}" as="b" hint-placeholder-count="2">
          <div data-reveal="" data-reveal-delay="{{ b.delay }}" style="position:relative;padding:30px 28px;border-radius:18px;border:1.5px dashed var(--border);background:var(--surface-2);overflow:hidden;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
              <span style="width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,{{ b.color }} 15%,transparent);color:{{ b.color }};"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#{{ b.iconId }}"></use></svg></span>
              <div>
                <div style="font-family:'IBM Plex Sans';font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);">{{ b.en }}</div>
                <div style="font-family:'Noto Sans TC';font-weight:800;font-size:20px;color:var(--text);">{{ b.zh }}</div>
              </div>
            </div>
            <p style="font-size:14.5px;line-height:1.75;color:var(--muted);">{{ b.desc }}</p>
            <div style="display:inline-flex;align-items:center;gap:8px;margin-top:18px;padding:6px 14px;border-radius:999px;background:color-mix(in srgb,var(--teal) 14%,transparent);">
              <span style="width:7px;height:7px;border-radius:50%;background:var(--teal);animation:blink 1.8s ease-in-out infinite;"></span>
              <span style="font-family:'Noto Sans TC';font-size:12.5px;font-weight:600;color:var(--teal-700);">{{ t.comingSoon }}</span>
            </div>
          </div>
        </sc-for>
      </div>
    </section>

    <!-- CONTACT -->
    <section id="contact" style="max-width:1240px;margin:0 auto;padding:20px 28px 60px;">
      <div data-reveal="" style="text-align:center;margin-bottom:26px;">
        <div style="font-family:'IBM Plex Sans';font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--teal);margin-bottom:8px;">Contact</div>
        <h2 style="font-family:'Noto Sans TC';font-weight:900;font-size:30px;color:var(--text);">{{ t.contactTitle }}</h2>
      </div><div style="display: grid; grid-template-columns: repeat(auto-fill,minmax(238px,1fr)); gap: 16px; position: relative">
        <sc-for list="{{ contacts }}" as="c" hint-placeholder-count="4">
          <div data-reveal="" style="padding: 22px 22px; border-radius: 16px; background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-card); transform: none; width: 279px; height: 123px; align-self: auto; display: block; justify-content: flex-start; border-style: solid">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
              <span style="width:8px;height:8px;border-radius:50%;background:{{ c.color }};"></span>
              <span style="font-family:'Noto Sans TC';font-weight:700;font-size:14.5px;color:var(--text);">{{ c.center }}</span>
            </div>
            <div style="font-family:'Noto Sans TC';font-size:14px;color:var(--body);margin-bottom:7px;">{{ c.person }}</div><div style="display:flex;align-items:center;gap:8px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--teal-700);">
              <span style="display:block;width:14px;height:14px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#ic-phone"></use></svg></span>{{ c.ext }}
            </div>
            
          </div>
        </sc-for>
      </div>
      
    </section>
  </div>
  </sc-if>

  <!-- ============ HOLISTIC VIEW ============ -->
  <sc-if value="{{ isHolistic }}" hint-placeholder-val="{{ false }}">
  <div style="position:relative;z-index:1;">
    <!-- holistic hero -->
    <section id="top" style="max-width:1240px;margin:0 auto;padding:46px 28px 24px;">
      <div data-reveal="" style="position:relative;border-radius:26px;overflow:hidden;box-shadow:var(--shadow-lift);min-height:clamp(380px,46vw,500px);display:flex;align-items:center;">
        <img ref="{{ heroRef }}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">
        <div style="position:absolute;inset:0;background:linear-gradient(110deg,rgba(28,52,44,.92),rgba(28,52,44,.5) 55%,rgba(28,52,44,.12));"></div>
        <div style="position:relative;padding:clamp(34px,5vw,70px);max-width:720px;">
          <div style="font-family:'IBM Plex Sans';font-size:11.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#bfe9dc;margin-bottom:18px;">Center for Education in Holistic Care and Human Flourishing</div>
          <h1 style="font-family:'Noto Serif TC',serif;font-weight:900;font-size:clamp(38px,5vw,62px);line-height:1.14;color:#fff;text-shadow:0 3px 24px rgba(0,0,0,.4);">{{ t.hHeroTitle }}</h1>
          <p style="font-size:17px;line-height:1.85;color:#e6f3ee;max-width:560px;margin-top:22px;">{{ t.hHeroTag }}</p>
          <div style="display:flex;gap:14px;margin-top:30px;flex-wrap:wrap;">
            <button onClick="{{ scrollMhfa }}" style="display:inline-flex;align-items:center;gap:9px;padding:13px 24px;border:none;border-radius:12px;cursor:pointer;background:#fff;color:var(--teal-700);font-family:'Noto Sans TC';font-weight:700;font-size:15px;">{{ t.hCtaMhfa }}<span style="display:block;width:17px;height:17px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#ic-arrow"></use></svg></span></button>
            <button onClick="{{ enterDept }}" style="padding:13px 24px;border:1px solid rgba(255,255,255,.5);border-radius:12px;cursor:pointer;background:rgba(255,255,255,.08);color:#fff;font-family:'Noto Sans TC';font-weight:700;font-size:15px;">{{ t.backDept }}</button>
          </div>
        </div>
      </div>
    </section>

    <!-- about + kpi -->
    <section id="h-about" style="max-width:1240px;margin:0 auto;padding:40px 28px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:46px;align-items:center;">
        <div data-reveal="">
          <div style="font-family:'IBM Plex Sans';font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--teal);margin-bottom:8px;">About Us</div>
          <h2 style="font-family:'Noto Sans TC';font-weight:900;font-size:32px;color:var(--text);margin-bottom:18px;">{{ t.hAboutTitle }}</h2>
          <p style="font-size:16.5px;line-height:1.9;color:var(--body);">{{ t.hAboutBody }}</p>
        </div>
        <div data-reveal="" data-reveal-delay="120" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <sc-for list="{{ hKpis }}" as="k" hint-placeholder-count="4">
            <div style="padding:22px;border-radius:16px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-card);position:relative;overflow:hidden;">
              <div style="position:absolute;top:0;left:0;width:100%;height:3px;background:{{ k.color }};"></div>
              <span data-count="{{ k.num }}" data-suffix="{{ k.suffix }}" style="font-family:'IBM Plex Sans';font-weight:700;font-size:42px;color:var(--text);font-variant-numeric:tabular-nums;display:{{ k.numDisplay }};">0</span><span style="font-family:'IBM Plex Sans';font-weight:700;font-size:42px;color:var(--text);font-variant-numeric:tabular-nums;display:{{ k.staticDisplay }};">{{ k.display }}</span>
              <div style="font-family:'Noto Sans TC';font-weight:600;font-size:13.5px;color:var(--body);margin-top:6px;">{{ k.label }}</div>
            </div>
          </sc-for>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(248px,1fr));gap:18px;margin-top:36px;">
        <sc-for list="{{ hFeatures }}" as="f" hint-placeholder-count="4">
          <div data-reveal="" data-reveal-delay="{{ f.delay }}" style="padding:28px 24px;border-radius:18px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-card);transition:transform .3s,box-shadow .3s;" onMouseEnter="{{ f.enter }}" onMouseLeave="{{ f.leave }}">
            <span style="width:48px;height:48px;border-radius:13px;display:flex;align-items:center;justify-content:center;background:linear-gradient(140deg,var(--teal),var(--teal-700));color:#fff;margin-bottom:16px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#{{ f.iconId }}"></use></svg></span>
            <div style="font-family:'Noto Sans TC';font-weight:800;font-size:18px;color:var(--text);margin-bottom:8px;">{{ f.title }}</div>
            <p style="font-size:14.5px;line-height:1.75;color:var(--muted);">{{ f.desc }}</p>
          </div>
        </sc-for>
      </div>
    </section>

    <!-- holistic members -->
    <section id="h-members" style="max-width:1240px;margin:0 auto;padding:6px 28px 24px;">
      <div data-reveal="" style="font-family:'Noto Sans TC';font-weight:800;font-size:22px;color:var(--text);margin-bottom:18px;display:flex;align-items:center;gap:10px;"><span style="width:5px;height:24px;border-radius:3px;background:var(--teal);"></span>{{ hMembersTitle }}</div>
      <div data-reveal="" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(228px,1fr));gap:16px;max-width:760px;">
        <sc-for list="{{ holisticMembers }}" as="p" hint-placeholder-count="3">
          <div style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:22px 16px 18px;border-radius:16px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-card);position:relative;overflow:hidden;">
            <div style="position:absolute;top:0;left:0;right:0;height:3px;background:{{ p.accent }};opacity:.9;"></div>
            <div style="position:relative;width:88px;height:88px;border-radius:50%;padding:3px;background:linear-gradient(140deg,{{ p.accent }},transparent 70%);">
              <sc-if value="{{ p.hasPhoto }}" hint-placeholder-val="{{ false }}"><img ref="{{ p.imgRef }}" alt="{{ p.fullname }}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;border:2px solid var(--surface);"></sc-if>
              <sc-if value="{{ p.noPhoto }}" hint-placeholder-val="{{ true }}"><div style="width:100%;height:100%;border-radius:50%;border:2px solid var(--surface);display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Sans';font-weight:700;font-size:26px;color:#fff;background:linear-gradient(140deg,{{ p.accent }},color-mix(in srgb,{{ p.accent }} 55%,#000));">{{ p.initials }}</div></sc-if>
            </div>
            <div style="font-family:'Noto Sans TC',sans-serif;font-weight:700;font-size:17px;color:var(--text);line-height:1.25;margin-top:10px;">{{ p.fullname }}</div>
            <div style="font-family:'IBM Plex Sans';font-size:12.5px;color:var(--muted);margin-top:2px;">{{ p.sub }}</div>
            <div style="margin-top:8px;padding:3px 13px;border-radius:999px;font-size:12px;font-weight:600;color:{{ p.accent }};background:color-mix(in srgb,{{ p.accent }} 13%,transparent);border:1px solid color-mix(in srgb,{{ p.accent }} 30%,transparent);">{{ p.role }}</div>
            <div style="font-size:12.5px;color:var(--muted);line-height:1.45;margin-top:6px;white-space:pre-line;">{{ p.dept }}</div>
            <sc-if value="{{ p.profile }}" hint-placeholder-val="{{ false }}"><a href="{{ p.profile }}" target="_blank" rel="noopener" style="margin-top:8px;display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:{{ p.accent }};text-decoration:none;">{{ p.profileLabel }} ↗</a></sc-if>
          </div>
        </sc-for>
      </div>
    </section>

    <!-- MHFA / ALGEE -->
    <section id="mhfa" style="max-width:1240px;margin:0 auto;padding:40px 28px;">
      <div data-reveal="" style="text-align:center;max-width:680px;margin:0 auto 30px;">
        <div style="font-family:'IBM Plex Sans';font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--teal);margin-bottom:8px;">Mental Health First Aid</div>
        <h2 style="font-family:'Noto Sans TC';font-weight:900;font-size:34px;color:var(--text);">{{ t.mhfaTitle }}</h2>
        <p style="font-size:16px;line-height:1.8;color:var(--muted);margin-top:12px;">{{ t.mhfaIntro }}</p>
      </div>
      <div style="display:grid;grid-template-columns:74px 1fr;gap:0;background:var(--surface);border:1px solid var(--border);border-radius:20px;overflow:hidden;box-shadow:var(--shadow-card);">
        <div style="display:flex;flex-direction:column;background:var(--surface-2);border-right:1px solid var(--border);">
          <sc-for list="{{ algee }}" as="a" hint-placeholder-count="5">
            <button onClick="{{ a.onClick }}" style="position:relative;flex:1;min-height:76px;border:none;cursor:pointer;background:{{ a.tabBg }};display:flex;align-items:center;justify-content:center;border-bottom:1px solid var(--border);transition:background .25s;">
              <span style="font-family:'Noto Serif TC',serif;font-weight:900;font-size:30px;color:{{ a.tabColor }};">{{ a.letter }}</span>
              <span style="position:absolute;right:0;top:0;bottom:0;width:3px;background:{{ a.bar }};"></span>
            </button>
          </sc-for>
        </div>
        <div style="padding:38px 40px;display:flex;flex-direction:column;justify-content:center;min-height:300px;">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px;">
            <span style="width:54px;height:54px;border-radius:14px;background:linear-gradient(140deg,var(--teal),var(--teal-700));color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Noto Serif TC',serif;font-weight:900;font-size:28px;">{{ activeAlgee.letter }}</span>
            <div>
              <div style="font-family:'IBM Plex Sans';font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--teal);font-weight:600;">Step {{ activeAlgee.step }} / 5</div>
              <div style="font-family:'Noto Sans TC';font-weight:900;font-size:25px;color:var(--text);">{{ activeAlgee.title }}</div>
            </div>
          </div>
          <p style="font-size:17px;line-height:1.9;color:var(--body);">{{ activeAlgee.desc }}</p>
          <div style="display:flex;gap:6px;margin-top:26px;">
            <sc-for list="{{ algee }}" as="a" hint-placeholder-count="5">
              <span style="height:5px;flex:1;border-radius:9px;background:{{ a.dot }};transition:background .25s;"></span>
            </sc-for>
          </div>
        </div>
      </div>
    </section>

    <!-- instructors + seed teachers -->
    <section id="seed" style="max-width:1240px;margin:0 auto;padding:40px 28px;">
      <div data-reveal="" style="margin-bottom:22px;">
        <div style="font-family:'IBM Plex Sans';font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--teal);margin-bottom:8px;">Instructors</div>
        <h2 style="font-family:'Noto Sans TC';font-weight:900;font-size:28px;color:var(--text);">{{ t.instructorsTitle }}</h2>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(216px,1fr));gap:16px;margin-bottom:44px;">
        <sc-for list="{{ instructors }}" as="p" hint-placeholder-count="2">
          <div data-reveal="" style="position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:22px 18px 20px;background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:0 1px 2px rgba(74,69,64,.05);transition:transform .35s cubic-bezier(.2,0,.2,1),box-shadow .35s,border-color .35s;overflow:hidden;" style-hover="transform:translateY(-6px);box-shadow:0 16px 34px rgba(74,69,64,.16);border-color:color-mix(in srgb,{{ p.accent }} 45%,var(--border));">
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:{{ p.accent }};opacity:.9;"></div>
  <div style="position:relative;width:88px;height:88px;border-radius:50%;padding:3px;background:linear-gradient(140deg,{{ p.accent }},transparent 70%);">
    <sc-if value="{{ p.hasPhoto }}" hint-placeholder-val="{{ false }}"><img ref="{{ p.imgRef }}" alt="{{ p.fullname }}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;border:2px solid var(--surface);display:block;"></sc-if>
    <sc-if value="{{ p.noPhoto }}" hint-placeholder-val="{{ true }}"><div style="width:100%;height:100%;border-radius:50%;border:2px solid var(--surface);display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Sans',sans-serif;font-weight:600;font-size:24px;color:#fff;background:{{ p.accent }};">{{ p.initials }}</div></sc-if>
  </div>
  <div style="font-family:'Noto Sans TC',sans-serif;font-weight:700;font-size:17px;color:var(--text);line-height:1.25;margin-top:4px;">{{ p.fullname }}</div>
  <div style="font-family:'IBM Plex Sans',sans-serif;font-size:11.5px;letter-spacing:.04em;color:var(--muted);text-transform:uppercase;">{{ p.sub }}</div>
  <div style="margin-top:4px;padding:3px 13px;border-radius:999px;font-size:12px;font-weight:600;color:{{ p.accent }};background:color-mix(in srgb,{{ p.accent }} 13%,transparent);border:1px solid color-mix(in srgb,{{ p.accent }} 30%,transparent);">{{ p.role }}</div>
  <div style="font-size:12.5px;color:var(--muted);line-height:1.45;margin-top:2px;white-space:pre-line;">{{ p.dept }}</div>
  <sc-if value="{{ p.duty }}" hint-placeholder-val="{{ false }}"><div style="margin-top:8px;width:100%;padding:9px 11px;border-radius:9px;background:color-mix(in srgb,{{ p.accent }} 8%,transparent);border:1px solid color-mix(in srgb,{{ p.accent }} 18%,transparent);text-align:left;"><div style="font-family:'IBM Plex Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:{{ p.accent }};margin-bottom:3px;">{{ p.dutyLabel }}</div><div style="font-family:'Noto Sans TC',sans-serif;font-size:12px;line-height:1.55;color:var(--body);">{{ p.duty }}</div></div></sc-if>
  <sc-if value="{{ p.profile }}" hint-placeholder-val="{{ false }}"><a href="{{ p.profile }}" target="_blank" rel="noopener" style="margin-top:6px;display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--teal-700);">{{ p.profileLabel }} ↗</a></sc-if>
</div>
        </sc-for>
      </div>
      <div data-reveal="" style="margin-bottom:22px;">
        <div style="font-family:'IBM Plex Sans';font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--teal);margin-bottom:8px;">Seed Teachers</div>
        <h2 style="font-family:'Noto Sans TC';font-weight:900;font-size:28px;color:var(--text);">{{ t.seedTitle }}</h2>
        <p style="font-size:15.5px;color:var(--muted);margin-top:8px;">{{ t.seedDesc }}</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;">
        <sc-for list="{{ seedTeachers }}" as="p" hint-placeholder-count="6">
          <div data-reveal="" style="position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:22px 18px 20px;background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:0 1px 2px rgba(74,69,64,.05);transition:transform .35s cubic-bezier(.2,0,.2,1),box-shadow .35s,border-color .35s;overflow:hidden;" style-hover="transform:translateY(-6px);box-shadow:0 16px 34px rgba(74,69,64,.16);border-color:color-mix(in srgb,{{ p.accent }} 45%,var(--border));">
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:{{ p.accent }};opacity:.9;"></div>
  <div style="position:relative;width:88px;height:88px;border-radius:50%;padding:3px;background:linear-gradient(140deg,{{ p.accent }},transparent 70%);">
    <sc-if value="{{ p.hasPhoto }}" hint-placeholder-val="{{ false }}"><img ref="{{ p.imgRef }}" alt="{{ p.fullname }}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;border:2px solid var(--surface);display:block;"></sc-if>
    <sc-if value="{{ p.noPhoto }}" hint-placeholder-val="{{ true }}"><div style="width:100%;height:100%;border-radius:50%;border:2px solid var(--surface);display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Sans',sans-serif;font-weight:600;font-size:24px;color:#fff;background:{{ p.accent }};">{{ p.initials }}</div></sc-if>
  </div>
  <div style="font-family:'Noto Sans TC',sans-serif;font-weight:700;font-size:17px;color:var(--text);line-height:1.25;margin-top:4px;">{{ p.fullname }}</div>
  <div style="font-family:'IBM Plex Sans',sans-serif;font-size:11.5px;letter-spacing:.04em;color:var(--muted);text-transform:uppercase;">{{ p.sub }}</div>
  <div style="margin-top:4px;padding:3px 13px;border-radius:999px;font-size:12px;font-weight:600;color:{{ p.accent }};background:color-mix(in srgb,{{ p.accent }} 13%,transparent);border:1px solid color-mix(in srgb,{{ p.accent }} 30%,transparent);">{{ p.role }}</div>
  <div style="font-size:12.5px;color:var(--muted);line-height:1.45;margin-top:2px;white-space:pre-line;">{{ p.dept }}</div>
  <sc-if value="{{ p.duty }}" hint-placeholder-val="{{ false }}"><div style="margin-top:8px;width:100%;padding:9px 11px;border-radius:9px;background:color-mix(in srgb,{{ p.accent }} 8%,transparent);border:1px solid color-mix(in srgb,{{ p.accent }} 18%,transparent);text-align:left;"><div style="font-family:'IBM Plex Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:{{ p.accent }};margin-bottom:3px;">{{ p.dutyLabel }}</div><div style="font-family:'Noto Sans TC',sans-serif;font-size:12px;line-height:1.55;color:var(--body);">{{ p.duty }}</div></div></sc-if>
  <sc-if value="{{ p.profile }}" hint-placeholder-val="{{ false }}"><a href="{{ p.profile }}" target="_blank" rel="noopener" style="margin-top:6px;display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--teal-700);">{{ p.profileLabel }} ↗</a></sc-if>
</div>
        </sc-for>
      </div>
    </section>

    <!-- AI ecosystem -->
    <section id="scope2" style="max-width:1240px;margin:0 auto;padding:30px 28px 50px;">
      <div data-reveal="" style="position:relative;border-radius:22px;overflow:hidden;padding:42px 40px;background:linear-gradient(135deg,color-mix(in srgb,var(--teal) 22%,var(--surface)),var(--surface));border:1px solid var(--border);box-shadow:var(--shadow-card);">
        <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;background:var(--surface);border:1px solid color-mix(in srgb,var(--teal) 30%,transparent);margin-bottom:16px;">
          <span style="width:8px;height:8px;border-radius:50%;background:var(--teal);animation:blink 1.8s ease-in-out infinite;"></span>
          <span style="font-family:'IBM Plex Sans';font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--teal-700);">Healthy Taiwan Deep Cultivation · Scope 2</span>
        </div>
        <h2 style="font-family:'Noto Sans TC';font-weight:900;font-size:28px;color:var(--text);max-width:760px;line-height:1.35;margin-bottom:14px;">{{ t.aiTitle }}</h2>
        <p style="font-size:16px;line-height:1.85;color:var(--body);max-width:820px;">{{ t.aiBody }}</p>

        <!-- ecosystem -->
        <div style="margin-top:30px;padding:28px;border-radius:18px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-card);">
          <h3 style="font-family:'Noto Sans TC';font-weight:800;font-size:20px;color:var(--text);margin-bottom:8px;">{{ aiEcoTitle }}</h3>
          <p style="font-size:14.5px;line-height:1.8;color:var(--muted);max-width:860px;margin-bottom:22px;">{{ aiEcoBody }}</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;">
            <sc-for list="{{ aiFlow }}" as="s" hint-placeholder-count="4">
              <div style="position:relative;padding:18px 16px;border-radius:14px;background:var(--surface-2);border:1px solid var(--border);">
                <div style="position:absolute;top:0;left:0;width:100%;height:3px;background:{{ s.color }};border-radius:14px 14px 0 0;"></div>
                <div style="font-family:'IBM Plex Sans';font-size:10.5px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:{{ s.color }};margin-bottom:6px;">{{ s.role }}</div>
                <div style="font-family:'Noto Sans TC';font-weight:700;font-size:15px;color:var(--text);margin-bottom:6px;">{{ s.title }}</div>
                <div style="font-size:12.5px;line-height:1.6;color:var(--muted);">{{ s.text }}</div>
              </div>
            </sc-for>
          </div>
        </div>

        <!-- 4 steps -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:18px;">
          <sc-for list="{{ aiSteps }}" as="s" hint-placeholder-count="4">
            <div style="display:flex;gap:13px;padding:18px 16px;border-radius:14px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-card);">
              <span style="flex-shrink:0;font-family:'IBM Plex Sans';font-weight:700;font-size:22px;color:var(--teal);font-variant-numeric:tabular-nums;">{{ s.n }}</span>
              <div>
                <div style="font-family:'Noto Sans TC';font-weight:700;font-size:14.5px;color:var(--text);margin-bottom:4px;">{{ s.title }}</div>
                <div style="font-size:12.5px;line-height:1.6;color:var(--muted);">{{ s.text }}</div>
              </div>
            </div>
          </sc-for>
        </div>

        <!-- problems solved -->
        <div style="margin-top:18px;padding:24px 26px;border-radius:16px;background:color-mix(in srgb,var(--teal) 8%,var(--surface));border:1px solid color-mix(in srgb,var(--teal) 22%,var(--border));">
          <div style="font-family:'Noto Sans TC';font-weight:800;font-size:16px;color:var(--text);margin-bottom:14px;">{{ aiProblemsTitle }}</div>
          <div style="display:flex;flex-direction:column;gap:11px;">
            <sc-for list="{{ aiProblems }}" as="p" hint-placeholder-count="3">
              <div style="display:flex;align-items:flex-start;gap:11px;">
                <span style="flex-shrink:0;width:20px;height:20px;margin-top:2px;border-radius:50%;background:var(--teal);color:#fff;display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;display:block"><path d="M20 6 9 17l-5-5"></path></svg></span>
                <span style="font-size:14.5px;line-height:1.7;color:var(--body);">{{ p }}</span>
              </div>
            </sc-for>
          </div>
        </div>

        <div style="font-family:'Noto Sans TC';font-weight:700;font-size:15px;color:var(--text);margin:28px 0 14px;display:flex;align-items:center;gap:10px;"><span style="width:5px;height:20px;border-radius:9px;background:#5E7A8C;"></span>{{ aiTeamLabel }}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(216px,1fr));gap:16px;">
          <sc-for list="{{ aiTeam }}" as="p" hint-placeholder-count="3">
            <div data-reveal="" style="position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:22px 18px 20px;background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:0 1px 2px rgba(74,69,64,.05);transition:transform .35s cubic-bezier(.2,0,.2,1),box-shadow .35s,border-color .35s;overflow:hidden;" style-hover="transform:translateY(-6px);box-shadow:0 16px 34px rgba(74,69,64,.16);border-color:color-mix(in srgb,{{ p.accent }} 45%,var(--border));">
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:{{ p.accent }};opacity:.9;"></div>
  <div style="position:relative;width:88px;height:88px;border-radius:50%;padding:3px;background:linear-gradient(140deg,{{ p.accent }},transparent 70%);">
    <sc-if value="{{ p.hasPhoto }}" hint-placeholder-val="{{ false }}"><img ref="{{ p.imgRef }}" alt="{{ p.fullname }}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;border:2px solid var(--surface);display:block;"></sc-if>
    <sc-if value="{{ p.noPhoto }}" hint-placeholder-val="{{ true }}"><div style="width:100%;height:100%;border-radius:50%;border:2px solid var(--surface);display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Sans',sans-serif;font-weight:600;font-size:24px;color:#fff;background:{{ p.accent }};">{{ p.initials }}</div></sc-if>
  </div>
  <div style="font-family:'Noto Sans TC',sans-serif;font-weight:700;font-size:17px;color:var(--text);line-height:1.25;margin-top:4px;">{{ p.fullname }}</div>
  <div style="font-family:'IBM Plex Sans',sans-serif;font-size:11.5px;letter-spacing:.04em;color:var(--muted);text-transform:uppercase;">{{ p.sub }}</div>
  <div style="margin-top:4px;padding:3px 13px;border-radius:999px;font-size:12px;font-weight:600;color:{{ p.accent }};background:color-mix(in srgb,{{ p.accent }} 13%,transparent);border:1px solid color-mix(in srgb,{{ p.accent }} 30%,transparent);">{{ p.role }}</div>
  <div style="font-size:12.5px;color:var(--muted);line-height:1.45;margin-top:2px;white-space:pre-line;">{{ p.dept }}</div>
  <sc-if value="{{ p.duty }}" hint-placeholder-val="{{ false }}"><div style="margin-top:8px;width:100%;padding:9px 11px;border-radius:9px;background:color-mix(in srgb,{{ p.accent }} 8%,transparent);border:1px solid color-mix(in srgb,{{ p.accent }} 18%,transparent);text-align:left;"><div style="font-family:'IBM Plex Sans',sans-serif;font-size:9.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:{{ p.accent }};margin-bottom:3px;">{{ p.dutyLabel }}</div><div style="font-family:'Noto Sans TC',sans-serif;font-size:12px;line-height:1.55;color:var(--body);">{{ p.duty }}</div></div></sc-if>
  <sc-if value="{{ p.profile }}" hint-placeholder-val="{{ false }}"><a href="{{ p.profile }}" target="_blank" rel="noopener" style="margin-top:6px;display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--teal-700);">{{ p.profileLabel }} ↗</a></sc-if>
</div>
          </sc-for>
        </div>
      </div>
    </section>

    <!-- ANNOUNCEMENTS -->
    <section id="h-news" style="max-width:1240px;margin:0 auto;padding:40px 28px;">
      <div data-reveal style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:8px;flex-wrap:wrap;">
        <div>
          <div style="font-family:'IBM Plex Sans';font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--teal);margin-bottom:6px;">{{ annEyebrow }}</div>
          <h2 style="font-family:'Noto Sans TC';font-weight:900;font-size:32px;color:var(--text);">{{ annTitle }}</h2>
        </div>
      </div>
      <p data-reveal style="font-size:14.5px;line-height:1.75;color:var(--muted);max-width:680px;margin-bottom:24px;">{{ annNote }}</p>
      <div style="display:flex;flex-direction:column;gap:16px;">
        <sc-for list="{{ announcements }}" as="a" hint-placeholder-count="3">
          <div data-reveal data-reveal-delay="{{ a.delay }}" style="display:grid;grid-template-columns:168px 1fr;background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:var(--shadow-card);">
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:24px 14px;background:color-mix(in srgb,var(--teal) 8%,var(--surface-2));border-right:1px solid var(--border);text-align:center;">
              <div style="font-family:'IBM Plex Sans';font-weight:700;font-size:{{ a.statFont }};line-height:1.05;color:var(--teal-700);font-variant-numeric:tabular-nums;">{{ a.statTop }}</div>
              <div style="font-family:'Noto Sans TC';font-size:11.5px;color:var(--muted);">{{ a.statTopLabel }}</div>
              <sc-if value="{{ a.statBot }}" hint-placeholder-val="{{ false }}">
                <div style="font-family:'IBM Plex Sans';font-weight:700;font-size:26px;line-height:1.1;color:var(--teal);margin-top:8px;font-variant-numeric:tabular-nums;">{{ a.statBot }}</div>
                <div style="font-family:'Noto Sans TC';font-size:11.5px;color:var(--muted);">{{ a.statBotLabel }}</div>
              </sc-if>
            </div>
            <div style="padding:22px 26px;">
              <span style="display:inline-block;padding:3px 13px;border-radius:999px;font-family:'Noto Sans TC';font-size:12px;font-weight:600;color:{{ a.tagColor }};background:{{ a.tagBg }};margin-bottom:11px;">{{ a.tag }}</span>
              <div style="font-family:'Noto Sans TC';font-weight:800;font-size:19px;color:var(--text);margin-bottom:10px;">{{ a.title }}</div>
              <div style="display:flex;flex-direction:column;gap:5px;">
                <sc-for list="{{ a.lines }}" as="ln" hint-placeholder-count="2">
                  <p style="font-size:14.5px;line-height:1.7;color:var(--body);">{{ ln }}</p>
                </sc-for>
              </div>
            </div>
          </div>
        </sc-for>
      </div>
    </section>

    <!-- ACTIVITIES -->
    <section id="h-activities" style="max-width:1240px;margin:0 auto;padding:20px 28px 40px;">
      <div data-reveal style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:8px;flex-wrap:wrap;">
        <div>
          <div style="font-family:'IBM Plex Sans';font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--teal);margin-bottom:6px;">{{ actEyebrow }}</div>
          <h2 style="font-family:'Noto Sans TC';font-weight:900;font-size:32px;color:var(--text);">{{ actTitle }}</h2>
        </div>
      </div>
      <p data-reveal style="font-size:14.5px;line-height:1.75;color:var(--muted);max-width:680px;margin-bottom:24px;">{{ actNote }}</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:18px;">
        <sc-for list="{{ activities }}" as="a" hint-placeholder-count="1">
          <div data-reveal style="background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:var(--shadow-card);transition:transform .3s,box-shadow .3s;" style-hover="transform:translateY(-5px);box-shadow:var(--shadow-lift);">
            <div style="padding:22px 24px 18px;">
              <span style="display:inline-block;padding:4px 13px;border-radius:999px;font-family:'Noto Sans TC';font-size:12px;font-weight:600;color:var(--teal-700);background:var(--teal-50);margin-bottom:14px;">{{ a.cat }}</span>
              <div style="font-family:'Noto Sans TC';font-weight:800;font-size:19px;color:var(--text);margin-bottom:16px;">{{ a.title }}</div>
              <div style="display:flex;flex-direction:column;gap:10px;font-size:14px;color:var(--body);">
                <div style="display:flex;align-items:center;gap:10px;"><span style="width:17px;height:17px;color:var(--teal);flex-shrink:0;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#ic-calendar"></use></svg></span>{{ a.date }}</div>
                <div style="display:flex;align-items:center;gap:10px;"><span style="width:17px;height:17px;color:var(--teal);flex-shrink:0;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#ic-pin"></use></svg></span>{{ a.place }}</div>
                <div style="display:flex;align-items:center;gap:10px;"><span style="width:17px;height:17px;color:var(--teal);flex-shrink:0;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#ic-brain"></use></svg></span>{{ a.speaker }}</div>
                <div style="display:flex;align-items:flex-start;gap:10px;"><span style="width:17px;height:17px;margin-top:2px;color:var(--teal);flex-shrink:0;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#ic-chart"></use></svg></span>{{ a.topic }}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 24px;border-top:1px solid var(--border);background:var(--surface-2);font-family:'Noto Sans TC';font-size:13px;">
              <span style="color:var(--muted);">{{ a.enrolled }}</span>
              <sc-if value="{{ a.hasLink }}" hint-placeholder-val="{{ false }}"><a href="{{ a.link }}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;color:var(--teal-700);font-weight:600;text-decoration:none;" style-hover="text-decoration:underline;"><span style="width:7px;height:7px;border-radius:50%;background:var(--teal);animation:blink 1.8s ease-in-out infinite;"></span>{{ a.status }}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;display:block"><use href="#ic-arrow"></use></svg></a></sc-if><sc-if value="{{ a.noLink }}" hint-placeholder-val="{{ true }}"><span style="display:inline-flex;align-items:center;gap:6px;color:var(--teal-700);font-weight:600;"><span style="width:7px;height:7px;border-radius:50%;background:var(--teal);animation:blink 1.8s ease-in-out infinite;"></span>{{ a.status }}</span></sc-if>
            </div>
          </div>
        </sc-for>
      </div>
    </section>

    <!-- holistic contact -->
    <section id="h-contact" style="max-width:1240px;margin:0 auto;padding:10px 28px 60px;">
      <div data-reveal="" style="display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:stretch;">
        <div style="padding:30px;border-radius:18px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-card);">
          <div style="font-family:'IBM Plex Sans';font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--teal);margin-bottom:8px;">Contact</div>
          <h2 style="font-family:'Noto Sans TC';font-weight:900;font-size:26px;color:var(--text);margin-bottom:18px;">{{ t.contactTitle }}</h2>
          <div style="display:flex;flex-direction:column;gap:14px;">
            <div style="display:flex;align-items:center;gap:12px;"><span style="width:36px;height:36px;border-radius:10px;background:var(--teal-50);color:var(--teal);display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#ic-phone"></use></svg></span><div><div style="font-family:'Noto Sans TC';font-weight:600;font-size:14.5px;color:var(--text);">{{ t.hContactPerson }}</div><div style="font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--muted);">{{ t.hContactExt }}</div></div></div>
            <div style="display:flex;align-items:center;gap:12px;"><span style="width:36px;height:36px;border-radius:10px;background:var(--teal-50);color:var(--teal);display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#ic-pin"></use></svg></span><div style="font-family:'Noto Sans TC';font-size:14.5px;color:var(--body);">{{ t.hContactPlace }}</div></div>
          </div>
        </div>
        <div style="padding:30px;border-radius:18px;background:linear-gradient(140deg,var(--teal),var(--teal-700));color:#fff;display:flex;flex-direction:column;justify-content:center;">
          <span style="display:block;width:34px;height:34px;color:rgba(255,255,255,.9);margin-bottom:14px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#ic-heart"></use></svg></span>
          <p style="font-family:'Noto Serif TC',serif;font-weight:700;font-size:22px;line-height:1.6;">{{ t.hContactQuote }}</p>
        </div>
      </div>
    </section>
  </div>
  </sc-if>

  <!-- ============ EBM VIEW ============ -->
  <sc-if value="{{ isEbm }}" hint-placeholder-val="{{ false }}">
  <div data-screen-label="EBM Center" style="position:relative;z-index:1;">

    <!-- ebm hero -->
    <section id="top" style="max-width:1240px;margin:0 auto;padding:46px 28px 26px;">
      <div data-reveal="" style="position:relative;border-radius:26px;overflow:hidden;box-shadow:var(--shadow-lift);background:linear-gradient(135deg,{{ ebm.ink }},#33414f 60%,#3c4d59);">
        <div style="position:absolute;inset:0;background-image:radial-gradient(circle at 18% 22%,rgba(176,137,75,.22),transparent 42%),radial-gradient(circle at 88% 78%,rgba(94,122,140,.28),transparent 46%);"></div>
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,{{ ebm.gold }},{{ ebm.goldSoft }} 50%,{{ ebm.blue }});"></div>
        <div style="position:relative;padding:clamp(34px,5vw,66px);">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:36px;align-items:center;">
            <div>
              <div style="font-family:'IBM Plex Sans';font-size:11.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:{{ ebm.goldSoft }};margin-bottom:18px;">{{ ebm.eyebrow }}</div>
              <h1 style="font-family:'Noto Serif TC',serif;font-weight:900;font-size:clamp(34px,4.6vw,56px);line-height:1.16;color:#fff;text-shadow:0 3px 24px rgba(0,0,0,.35);">{{ ebm.heroTitle }}</h1>
              <p style="font-size:16.5px;line-height:1.85;color:#dfe6ec;max-width:560px;margin-top:22px;">{{ ebm.heroTag }}</p>
            </div>
            <div style="display:flex;justify-content:center;">
              <svg viewBox="0 0 440 360" role="img" aria-label="Evidence-based medicine: literature search, data and books" style="width:100%;max-width:440px;height:auto;display:block;">
                <!-- floating data dots -->
                <circle cx="60" cy="60" r="5" fill="#C4A268" opacity=".7"></circle>
                <circle cx="402" cy="96" r="6" fill="#8AA6B6" opacity=".6"></circle>
                <circle cx="386" cy="44" r="4" fill="#6E8A77" opacity=".7"></circle>
                <path d="M44 120 l0 16 M36 128 l16 0" stroke="#C4A268" stroke-width="3" stroke-linecap="round" opacity=".6"></path>
                <path d="M414 250 l0 14 M407 257 l14 0" stroke="#8AA6B6" stroke-width="3" stroke-linecap="round" opacity=".5"></path>
                <!-- back paper -->
                <g transform="rotate(-8 150 150)">
                  <rect x="96" y="78" width="150" height="190" rx="10" fill="#EFE7D8"></rect>
                  <rect x="116" y="104" width="92" height="7" rx="3.5" fill="#C9BCA3"></rect>
                  <rect x="116" y="122" width="110" height="6" rx="3" fill="#D9CFBC"></rect>
                  <rect x="116" y="138" width="78" height="6" rx="3" fill="#D9CFBC"></rect>
                  <rect x="116" y="154" width="104" height="6" rx="3" fill="#D9CFBC"></rect>
                </g>
                <!-- main dashboard card -->
                <g transform="rotate(4 270 170)">
                  <rect x="170" y="74" width="214" height="196" rx="16" fill="#FFFFFF"></rect>
                  <rect x="170" y="74" width="214" height="40" rx="16" fill="#B0894B"></rect>
                  <rect x="170" y="98" width="214" height="16" fill="#B0894B"></rect>
                  <circle cx="192" cy="94" r="5" fill="#fff" opacity=".85"></circle>
                  <circle cx="210" cy="94" r="5" fill="#fff" opacity=".5"></circle>
                  <rect x="320" y="89" width="48" height="10" rx="5" fill="#fff" opacity=".4"></rect>
                  <!-- bar chart -->
                  <rect x="196" y="206" width="22" height="40" rx="4" fill="#8AA6B6"></rect>
                  <rect x="228" y="184" width="22" height="62" rx="4" fill="#5E7A8C"></rect>
                  <rect x="260" y="196" width="22" height="50" rx="4" fill="#6E8A77"></rect>
                  <rect x="292" y="168" width="22" height="78" rx="4" fill="#C4A268"></rect>
                  <rect x="324" y="150" width="22" height="96" rx="4" fill="#B0894B"></rect>
                  <!-- trend line -->
                  <path d="M207 200 L239 176 L271 188 L303 158 L335 140" fill="none" stroke="#2E3A45" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".55"></path>
                  <circle cx="207" cy="200" r="4" fill="#2E3A45" opacity=".7"></circle>
                  <circle cx="335" cy="140" r="4" fill="#2E3A45" opacity=".7"></circle>
                  <line x1="190" y1="250" x2="356" y2="250" stroke="#E0DBD6" stroke-width="2"></line>
                </g>
                <!-- magnifier -->
                <g>
                  <circle cx="322" cy="232" r="40" fill="#5E7A8C" opacity=".14"></circle>
                  <circle cx="322" cy="232" r="40" fill="none" stroke="#C4A268" stroke-width="9"></circle>
                  <line x1="352" y1="262" x2="384" y2="296" stroke="#B0894B" stroke-width="13" stroke-linecap="round"></line>
                </g>
                <!-- book stack -->
                <g>
                  <rect x="44" y="300" width="150" height="24" rx="5" fill="#5E7A8C"></rect>
                  <rect x="58" y="300" width="8" height="24" fill="#42606F"></rect>
                  <rect x="52" y="278" width="142" height="24" rx="5" fill="#6E8A77"></rect>
                  <rect x="66" y="278" width="8" height="24" fill="#557060"></rect>
                  <rect x="46" y="256" width="148" height="24" rx="5" fill="#C4A268"></rect>
                  <rect x="60" y="256" width="8" height="24" fill="#A07C3E"></rect>
                </g>
              </svg>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:30px;">
            <sc-for list="{{ ebm.kpis }}" as="k" hint-placeholder-count="4">
              <div data-reveal="" data-reveal-delay="{{ k.delay }}" style="padding:16px 14px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);">
                <div style="display:flex;align-items:baseline;gap:1px;font-family:'IBM Plex Sans';font-weight:800;font-size:34px;color:#fff;"><span data-count="{{ k.num }}" data-suffix="{{ k.suffix }}">0</span></div>
                <div style="font-family:'Noto Sans TC';font-size:12.5px;color:#c8d2da;margin-top:4px;line-height:1.4;">{{ k.label }}</div>
              </div>
            </sc-for>
          </div>
        </div>
      </div>
    </section>

    <!-- ebm about / mission -->
    <section id="ebm-about" style="max-width:1240px;margin:0 auto;padding:32px 28px 16px;">
      <div data-reveal="" style="display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center;">
        <div>
          <div style="font-family:'IBM Plex Sans';font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:{{ ebm.gold }};margin-bottom:10px;">{{ ebm.aboutEyebrow }}</div>
          <h2 style="font-family:'Noto Sans TC';font-weight:900;font-size:clamp(26px,3vw,34px);color:var(--text);line-height:1.3;margin-bottom:18px;">{{ ebm.aboutTitle }}</h2>
          <p style="font-size:16px;line-height:1.9;color:var(--body);border-left:3px solid {{ ebm.gold }};padding-left:18px;margin-bottom:16px;">{{ ebm.aboutBody }}</p>
          <p style="font-size:15px;line-height:1.85;color:var(--muted);">{{ ebm.aboutBody2 }}</p>
        </div>
        <div style="display:grid;gap:14px;">
          <sc-for list="{{ ebm.kpis }}" as="k" hint-placeholder-count="4">
            <div style="display:flex;align-items:center;gap:16px;padding:16px 20px;border-radius:14px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-card);">
              <div style="font-family:'IBM Plex Sans';font-weight:800;font-size:30px;color:{{ k.color }};min-width:64px;">{{ k.num }}{{ k.suffix }}</div>
              <div style="font-family:'Noto Sans TC';font-size:14.5px;color:var(--body);">{{ k.label }}</div>
            </div>
          </sc-for>
        </div>
      </div>
    </section>

    <!-- ebm members -->
    <section style="max-width:1240px;margin:0 auto;padding:30px 28px 14px;">
      <div data-reveal="" style="font-family:'Noto Sans TC';font-weight:800;font-size:18px;color:var(--text);margin-bottom:18px;display:flex;align-items:center;gap:10px;"><span style="width:5px;height:22px;border-radius:3px;background:{{ ebm.gold }};"></span>{{ ebm.membersTitle }}</div>
      <div data-reveal="" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(228px,1fr));gap:16px;max-width:760px;">
        <sc-for list="{{ ebm.members }}" as="p" hint-placeholder-count="3">
          <div style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:22px 16px 18px;border-radius:16px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-card);position:relative;overflow:hidden;">
            <div style="position:absolute;top:0;left:0;right:0;height:3px;background:{{ p.accent }};opacity:.9;"></div>
            <div style="position:relative;width:88px;height:88px;border-radius:50%;padding:3px;background:linear-gradient(140deg,{{ p.accent }},transparent 70%);">
              <sc-if value="{{ p.hasPhoto }}" hint-placeholder-val="{{ false }}"><img ref="{{ p.imgRef }}" alt="{{ p.fullname }}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;border:2px solid var(--surface);"></sc-if>
              <sc-if value="{{ p.noPhoto }}" hint-placeholder-val="{{ true }}"><div style="width:100%;height:100%;border-radius:50%;border:2px solid var(--surface);display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Sans';font-weight:700;font-size:26px;color:#fff;background:linear-gradient(140deg,{{ p.accent }},color-mix(in srgb,{{ p.accent }} 55%,#000));">{{ p.initials }}</div></sc-if>
            </div>
            <div style="font-family:'Noto Sans TC',sans-serif;font-weight:700;font-size:17px;color:var(--text);line-height:1.25;margin-top:10px;">{{ p.fullname }}</div>
            <div style="font-family:'IBM Plex Sans';font-size:12.5px;color:var(--muted);margin-top:2px;">{{ p.sub }}</div>
            <div style="margin-top:8px;padding:3px 13px;border-radius:999px;font-size:12px;font-weight:600;color:{{ p.accent }};background:color-mix(in srgb,{{ p.accent }} 13%,transparent);border:1px solid color-mix(in srgb,{{ p.accent }} 30%,transparent);">{{ p.role }}</div>
            <div style="font-size:12.5px;color:var(--muted);line-height:1.45;margin-top:6px;white-space:pre-line;">{{ p.dept }}</div>
            <sc-if value="{{ p.profile }}" hint-placeholder-val="{{ false }}"><a href="{{ p.profile }}" target="_blank" rel="noopener" style="margin-top:8px;display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:{{ p.accent }};text-decoration:none;">{{ p.profileLabel }} ↗</a></sc-if>
          </div>
        </sc-for>
      </div>
    </section>

    <!-- ebm missions -->
    <section id="ebm-missions" style="max-width:1240px;margin:0 auto;padding:38px 28px 18px;">
      <div data-reveal="" style="text-align:center;margin-bottom:30px;">
        <div style="font-family:'IBM Plex Sans';font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:{{ ebm.gold }};margin-bottom:8px;">{{ ebm.missionsEyebrow }}</div>
        <h2 style="font-family:'Noto Sans TC';font-weight:900;font-size:clamp(26px,3vw,34px);color:var(--text);">{{ ebm.missionsTitle }}</h2>
        <p style="font-size:15px;line-height:1.8;color:var(--muted);max-width:640px;margin:12px auto 0;">{{ ebm.missionsDesc }}</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;">
        <sc-for list="{{ ebm.missions }}" as="m" hint-placeholder-count="4">
          <div data-reveal="" style="position:relative;padding:26px 24px;border-radius:18px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-card);overflow:hidden;">
            <div style="position:absolute;top:0;left:0;width:3px;bottom:0;background:{{ ebm.gold }};"></div>
            <div style="font-family:'IBM Plex Sans';font-weight:800;font-size:40px;color:color-mix(in srgb,{{ ebm.gold }} 32%,transparent);line-height:1;">{{ m.tag }}</div>
            <h3 style="font-family:'Noto Sans TC';font-weight:800;font-size:18px;color:var(--text);margin:12px 0 10px;line-height:1.4;">{{ m.title }}</h3>
            <p style="font-size:14px;line-height:1.8;color:var(--body);">{{ m.desc }}</p>
          </div>
        </sc-for>
      </div>
    </section>

    <!-- ebm awards -->
    <section id="ebm-awards" style="max-width:1240px;margin:0 auto;padding:38px 28px 18px;">
      <div data-reveal="" style="text-align:center;margin-bottom:30px;">
        <div style="font-family:'IBM Plex Sans';font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:{{ ebm.gold }};margin-bottom:8px;">{{ ebm.awardsEyebrow }}</div>
        <h2 style="font-family:'Noto Sans TC';font-weight:900;font-size:clamp(26px,3vw,34px);color:var(--text);">{{ ebm.awardsTitle }}</h2>
        <p style="font-size:15px;line-height:1.8;color:var(--muted);max-width:680px;margin:12px auto 0;">{{ ebm.awardsDesc }}</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:22px;">
        <div data-reveal="" style="padding:26px;border-radius:18px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-card);">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="width:34px;height:34px;border-radius:9px;background:color-mix(in srgb,{{ ebm.gold }} 14%,transparent);color:{{ ebm.gold }};display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:19px;height:19px;display:block"><use href="#ic-chart"></use></svg></span><h3 style="font-family:'Noto Sans TC';font-weight:800;font-size:17px;color:var(--text);">{{ ebm.awardsLitTitle }}</h3></div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <sc-for list="{{ ebm.awardsLit }}" as="a" hint-placeholder-count="4">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:11px;background:color-mix(in srgb,{{ a.tone }} 7%,transparent);border:1px solid color-mix(in srgb,{{ a.tone }} 22%,transparent);">
                <div style="font-family:'Noto Sans TC';font-weight:600;font-size:14px;color:var(--text);">{{ a.sess }}</div>
                <div style="display:inline-flex;align-items:center;gap:7px;"><span style="width:9px;height:9px;border-radius:50%;background:{{ a.tone }};"></span><span style="font-family:'Noto Sans TC';font-weight:700;font-size:13.5px;color:{{ a.tone }};">{{ a.award }}</span></div>
              </div>
            </sc-for>
          </div>
        </div>
        <div data-reveal="" data-reveal-delay="90" style="padding:26px;border-radius:18px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-card);">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="width:34px;height:34px;border-radius:9px;background:color-mix(in srgb,{{ ebm.blue }} 16%,transparent);color:{{ ebm.blue }};display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:19px;height:19px;display:block"><use href="#ic-skills"></use></svg></span><h3 style="font-family:'Noto Sans TC';font-weight:800;font-size:17px;color:var(--text);">{{ ebm.awardsClinTitle }}</h3></div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <sc-for list="{{ ebm.awardsClin }}" as="a" hint-placeholder-count="3">
              <div style="padding:12px 14px;border-radius:11px;background:color-mix(in srgb,{{ a.tone }} 7%,transparent);border:1px solid color-mix(in srgb,{{ a.tone }} 22%,transparent);">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
                  <div style="font-family:'Noto Sans TC';font-weight:600;font-size:14px;color:var(--text);">{{ a.sess }}</div>
                  <div style="display:inline-flex;align-items:center;gap:7px;"><span style="width:9px;height:9px;border-radius:50%;background:{{ a.tone }};"></span><span style="font-family:'Noto Sans TC';font-weight:700;font-size:13.5px;color:{{ a.tone }};">{{ a.award }}</span></div>
                </div>
                <sc-if value="{{ a.note }}" hint-placeholder-val="{{ false }}"><div style="font-size:12.5px;line-height:1.6;color:var(--muted);margin-top:7px;">{{ a.note }}</div></sc-if>
              </div>
            </sc-for>
          </div>
        </div>
        <div data-reveal="" data-reveal-delay="180" style="padding:26px;border-radius:18px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-card);">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="width:34px;height:34px;border-radius:9px;background:color-mix(in srgb,#7A95A8 16%,transparent);color:#7A95A8;display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:19px;height:19px;display:block"><use href="#ic-research"></use></svg></span><h3 style="font-family:'Noto Sans TC';font-weight:800;font-size:17px;color:var(--text);">{{ ebm.awardsTransTitle }}</h3></div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <sc-for list="{{ ebm.awardsTrans }}" as="a" hint-placeholder-count="2">
              <div style="padding:12px 14px;border-radius:11px;background:color-mix(in srgb,{{ a.tone }} 7%,transparent);border:1px solid color-mix(in srgb,{{ a.tone }} 22%,transparent);">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
                  <div style="font-family:'Noto Sans TC';font-weight:600;font-size:14px;color:var(--text);">{{ a.sess }}</div>
                  <div style="display:inline-flex;align-items:center;gap:7px;"><span style="width:9px;height:9px;border-radius:50%;background:{{ a.tone }};"></span><span style="font-family:'Noto Sans TC';font-weight:700;font-size:13.5px;color:{{ a.tone }};">{{ a.award }}</span></div>
                </div>
                <sc-if value="{{ a.note }}" hint-placeholder-val="{{ false }}"><div style="font-size:12.5px;line-height:1.6;color:var(--muted);margin-top:7px;">{{ a.note }}</div></sc-if>
              </div>
            </sc-for>
          </div>
        </div>
      </div>
    </section>

    <!-- ebm journey -->
    <section id="ebm-journey" style="max-width:1240px;margin:0 auto;padding:38px 28px 18px;">
      <div data-reveal="" style="text-align:center;margin-bottom:30px;">
        <div style="font-family:'IBM Plex Sans';font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:{{ ebm.gold }};margin-bottom:8px;">{{ ebm.journeyEyebrow }}</div>
        <h2 style="font-family:'Noto Sans TC';font-weight:900;font-size:clamp(26px,3vw,34px);color:var(--text);">{{ ebm.journeyTitle }}</h2>
        <p style="font-size:15px;line-height:1.8;color:var(--muted);max-width:680px;margin:12px auto 0;">{{ ebm.journeyDesc }}</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;">
        <sc-for list="{{ ebm.stages }}" as="s" hint-placeholder-count="3">
          <div data-reveal="" style="border-radius:18px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-card);overflow:hidden;display:flex;flex-direction:column;">
            <div style="padding:18px 22px;background:linear-gradient(135deg,color-mix(in srgb,{{ s.color }} 16%,var(--surface)),var(--surface));border-bottom:1px solid var(--border);">
              <div style="font-family:'IBM Plex Sans';font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:{{ s.color }};">{{ s.phase }}</div>
              <div style="font-family:'Noto Serif TC',serif;font-weight:900;font-size:21px;color:var(--text);margin-top:4px;">{{ s.name }}</div>
              <div style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:var(--muted);margin-top:4px;">{{ s.years }}</div>
            </div>
            <div style="padding:18px 22px;display:flex;flex-direction:column;gap:11px;">
              <sc-for list="{{ s.items }}" as="it" hint-placeholder-count="4">
                <div style="display:flex;gap:10px;align-items:flex-start;"><span style="width:7px;height:7px;border-radius:50%;background:{{ s.color }};margin-top:7px;flex:none;"></span><span style="font-size:13.5px;line-height:1.7;color:var(--body);">{{ it }}</span></div>
              </sc-for>
            </div>
          </div>
        </sc-for>
      </div>
    </section>

    <!-- ebm courses -->
    <section id="ebm-courses" style="max-width:1240px;margin:0 auto;padding:38px 28px 18px;">
      <div data-reveal="" style="text-align:center;margin-bottom:30px;">
        <div style="font-family:'IBM Plex Sans';font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:{{ ebm.gold }};margin-bottom:8px;">{{ ebm.coursesEyebrow }}</div>
        <h2 style="font-family:'Noto Sans TC';font-weight:900;font-size:clamp(26px,3vw,34px);color:var(--text);">{{ ebm.coursesTitle }}</h2>
        <p style="font-size:15px;line-height:1.8;color:var(--muted);max-width:680px;margin:12px auto 0;">{{ ebm.coursesDesc }}</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;">
        <sc-for list="{{ ebm.courseGroups }}" as="g" hint-placeholder-count="3">
          <div data-reveal="" style="border-radius:18px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-card);overflow:hidden;">
            <div style="padding:18px 22px;display:flex;align-items:center;gap:11px;border-bottom:1px solid var(--border);"><span style="width:36px;height:36px;border-radius:10px;background:color-mix(in srgb,{{ g.color }} 14%,transparent);color:{{ g.color }};display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;display:block"><use href="#{{ g.gicon }}"></use></svg></span><h3 style="font-family:'Noto Sans TC';font-weight:800;font-size:16.5px;color:var(--text);">{{ g.title }}</h3></div>
            <div style="padding:8px 22px 18px;">
              <sc-for list="{{ g.rows }}" as="row" hint-placeholder-count="3">
                <div style="padding:13px 0;border-bottom:1px solid var(--border);">
                  <div style="font-family:'Noto Sans TC';font-weight:600;font-size:14px;color:var(--text);line-height:1.5;">{{ row.name }}</div>
                  <div style="font-size:12.5px;color:{{ g.color }};margin-top:4px;font-weight:600;">{{ row.detail }}</div>
                </div>
              </sc-for>
            </div>
          </div>
        </sc-for>
      </div>
    </section>

    <!-- ebm closing + contact -->
    <section id="ebm-contact" style="max-width:1240px;margin:0 auto;padding:34px 28px 60px;">
      <div data-reveal="" style="display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:stretch;">
        <div style="padding:32px;border-radius:18px;background:linear-gradient(140deg,{{ ebm.ink }},#3c4d59);color:#fff;display:flex;flex-direction:column;justify-content:center;">
          <span style="display:block;width:34px;height:34px;color:{{ ebm.goldSoft }};margin-bottom:16px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#ic-chart"></use></svg></span>
          <h2 style="font-family:'Noto Serif TC',serif;font-weight:800;font-size:22px;line-height:1.55;margin-bottom:14px;">{{ ebm.closingTitle }}</h2>
          <p style="font-size:14.5px;line-height:1.85;color:#d3dbe2;">{{ ebm.closingBody }}</p>
        </div>
        <div style="padding:32px;border-radius:18px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-card);display:flex;flex-direction:column;justify-content:center;">
          <div style="font-family:'IBM Plex Sans';font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:{{ ebm.gold }};margin-bottom:8px;">Contact</div>
          <h3 style="font-family:'Noto Sans TC';font-weight:900;font-size:24px;color:var(--text);margin-bottom:18px;">{{ t.contactTitle }}</h3>
          <div style="display:flex;flex-direction:column;gap:14px;">
            <div style="display:flex;align-items:center;gap:12px;"><span style="width:36px;height:36px;border-radius:10px;background:color-mix(in srgb,{{ ebm.gold }} 13%,transparent);color:{{ ebm.gold }};display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#ic-phone"></use></svg></span><div><div style="font-family:'Noto Sans TC';font-weight:600;font-size:14.5px;color:var(--text);">{{ ebm.contactPerson }}</div><div style="font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--muted);">{{ ebm.contactExt }}</div></div></div>
            <div style="display:flex;align-items:center;gap:12px;"><span style="width:36px;height:36px;border-radius:10px;background:color-mix(in srgb,{{ ebm.gold }} 13%,transparent);color:{{ ebm.gold }};display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#ic-pin"></use></svg></span><div style="font-family:'Noto Sans TC';font-size:14.5px;color:var(--body);">{{ ebm.contactPlace }}</div></div>
            <p style="font-family:'Noto Serif TC',serif;font-weight:700;font-size:16px;line-height:1.7;color:{{ ebm.gold }};margin-top:6px;border-left:3px solid {{ ebm.gold }};padding-left:14px;">{{ ebm.contactQuote }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
  </sc-if>

  <!-- ============ FACULTY DEVELOPMENT VIEW ============ -->
  <sc-if value="{{ isFacdev }}" hint-placeholder-val="{{ false }}">
  <div data-screen-label="Faculty Development Center" style="position:relative;z-index:1;">

    <!-- fd hero -->
    <section id="top" style="max-width:1240px;margin:0 auto;padding:46px 28px 26px;">
      <div data-reveal="" style="position:relative;border-radius:26px;overflow:hidden;box-shadow:var(--shadow-lift);background:linear-gradient(135deg,{{ facdev.ink }},#4a3a2e 58%,#54433a);">
        <div style="position:absolute;inset:0;background-image:radial-gradient(circle at 16% 20%,rgba(168,122,107,.30),transparent 44%),radial-gradient(circle at 88% 82%,rgba(143,168,152,.24),transparent 48%);"></div>
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,{{ facdev.clay }},{{ facdev.claySoft }} 50%,{{ facdev.sage }});"></div>
        <div style="position:relative;padding:clamp(34px,5vw,64px);">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:36px;align-items:center;">
            <div>
              <div style="font-family:'IBM Plex Sans';font-size:11.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:{{ facdev.claySoft }};margin-bottom:18px;">{{ facdev.eyebrow }}</div>
              <h1 style="font-family:'Noto Serif TC',serif;font-weight:900;font-size:clamp(32px,4.4vw,54px);line-height:1.18;color:#fff;text-shadow:0 3px 24px rgba(0,0,0,.32);">{{ facdev.heroTitle }}</h1>
              <p style="font-size:16.5px;line-height:1.85;color:#e7e0d8;max-width:560px;margin-top:22px;">{{ facdev.heroTag }}</p>
            </div>
            <div style="display:flex;justify-content:center;">
              <svg viewBox="0 0 440 360" role="img" aria-label="Faculty teaching: blackboard, books, teacher and graduation cap" style="width:100%;max-width:430px;height:auto;display:block;">
                <circle cx="58" cy="60" r="5" fill="#C49A8C" opacity=".7"></circle>
                <circle cx="404" cy="92" r="6" fill="#8FA898" opacity=".6"></circle>
                <path d="M40 120 l0 16 M32 128 l16 0" stroke="#C49A8C" stroke-width="3" stroke-linecap="round" opacity=".55"></path>
                <path d="M414 254 l0 14 M407 261 l14 0" stroke="#8FA898" stroke-width="3" stroke-linecap="round" opacity=".5"></path>
                <!-- presentation board -->
                <g>
                  <rect x="118" y="58" width="252" height="172" rx="12" fill="#FFFFFF"></rect>
                  <rect x="118" y="58" width="252" height="172" rx="12" fill="none" stroke="#E0DBD6" stroke-width="2"></rect>
                  <rect x="118" y="58" width="252" height="30" rx="12" fill="#A87A6B"></rect>
                  <rect x="118" y="74" width="252" height="14" fill="#A87A6B"></rect>
                  <rect x="138" y="106" width="120" height="9" rx="4.5" fill="#C9BCA3"></rect>
                  <rect x="138" y="126" width="174" height="7" rx="3.5" fill="#E0DBD6"></rect>
                  <rect x="138" y="142" width="150" height="7" rx="3.5" fill="#E0DBD6"></rect>
                  <!-- mini bar chart on board -->
                  <rect x="270" y="168" width="16" height="34" rx="3" fill="#8FA898"></rect>
                  <rect x="292" y="156" width="16" height="46" rx="3" fill="#7A95A8"></rect>
                  <rect x="314" y="176" width="16" height="26" rx="3" fill="#B69B66"></rect>
                  <rect x="336" y="148" width="16" height="54" rx="3" fill="#A87A6B"></rect>
                  <line x1="138" y1="204" x2="352" y2="204" stroke="#E0DBD6" stroke-width="2"></line>
                  <!-- easel legs -->
                  <path d="M150 230 l-26 70 M338 230 l26 70" stroke="#6E5A4C" stroke-width="7" stroke-linecap="round"></path>
                  <path d="M132 286 h60" stroke="#6E5A4C" stroke-width="6" stroke-linecap="round"></path>
                </g>
                <!-- pointer / teacher hand -->
                <line x1="92" y1="300" x2="168" y2="150" stroke="#54433a" stroke-width="6" stroke-linecap="round"></line>
                <circle cx="170" cy="146" r="7" fill="#C49A8C"></circle>
                <!-- graduation cap -->
                <g transform="translate(360 196)">
                  <path d="M0 14 L34 2 L68 14 L34 26 Z" fill="#3A2E25"></path>
                  <path d="M14 20 v14 c0 5 40 5 40 0 v-14" fill="none" stroke="#3A2E25" stroke-width="4"></path>
                  <line x1="68" y1="14" x2="68" y2="34" stroke="#A87A6B" stroke-width="3"></line>
                  <circle cx="68" cy="36" r="4" fill="#A87A6B"></circle>
                </g>
                <!-- book stack -->
                <g>
                  <rect x="40" y="306" width="150" height="22" rx="5" fill="#7A95A8"></rect>
                  <rect x="54" y="306" width="8" height="22" fill="#5E7A8C"></rect>
                  <rect x="48" y="286" width="142" height="22" rx="5" fill="#8FA898"></rect>
                  <rect x="62" y="286" width="8" height="22" fill="#6E8A77"></rect>
                  <rect x="42" y="266" width="148" height="22" rx="5" fill="#C49A8C"></rect>
                  <rect x="56" y="266" width="8" height="22" fill="#A87A6B"></rect>
                </g>
              </svg>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:30px;">
            <sc-for list="{{ facdev.kpis }}" as="k" hint-placeholder-count="4">
              <div data-reveal="" data-reveal-delay="{{ k.delay }}" style="padding:16px 14px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);">
                <div style="display:flex;align-items:baseline;gap:1px;font-family:'IBM Plex Sans';font-weight:800;font-size:34px;color:#fff;"><span data-count="{{ k.num }}" data-suffix="{{ k.suffix }}">0</span></div>
                <div style="font-family:'Noto Sans TC';font-size:12.5px;color:#e2dace;margin-top:4px;line-height:1.4;">{{ k.label }}</div>
              </div>
            </sc-for>
          </div>
        </div>
      </div>
    </section>

    <!-- fd about -->
    <section id="fd-about" style="max-width:1240px;margin:0 auto;padding:32px 28px 16px;">
      <div data-reveal="" style="display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center;">
        <div>
          <div style="font-family:'IBM Plex Sans';font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:{{ facdev.clay }};margin-bottom:10px;">{{ facdev.aboutEyebrow }}</div>
          <h2 style="font-family:'Noto Sans TC';font-weight:900;font-size:clamp(26px,3vw,34px);color:var(--text);line-height:1.3;margin-bottom:18px;">{{ facdev.aboutTitle }}</h2>
          <p style="font-size:16px;line-height:1.9;color:var(--body);border-left:3px solid {{ facdev.clay }};padding-left:18px;margin-bottom:16px;">{{ facdev.aboutBody }}</p>
          <p style="font-size:15px;line-height:1.85;color:var(--muted);">{{ facdev.aboutBody2 }}</p>
        </div>
        <div style="display:grid;gap:14px;">
          <sc-for list="{{ facdev.kpis }}" as="k" hint-placeholder-count="4">
            <div style="display:flex;align-items:center;gap:16px;padding:16px 20px;border-radius:14px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-card);">
              <div style="font-family:'IBM Plex Sans';font-weight:800;font-size:30px;color:{{ k.color }};min-width:64px;">{{ k.num }}{{ k.suffix }}</div>
              <div style="font-family:'Noto Sans TC';font-size:14.5px;color:var(--body);">{{ k.label }}</div>
            </div>
          </sc-for>
        </div>
      </div>
    </section>

    <!-- fd members -->
    <section id="fd-members" style="max-width:1240px;margin:0 auto;padding:30px 28px 14px;">
      <div data-reveal="" style="font-family:'Noto Sans TC';font-weight:800;font-size:18px;color:var(--text);margin-bottom:18px;display:flex;align-items:center;gap:10px;"><span style="width:5px;height:22px;border-radius:3px;background:{{ facdev.clay }};"></span>{{ facdev.membersTitle }}</div>
      <div data-reveal="" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(228px,1fr));gap:16px;max-width:760px;">
        <sc-for list="{{ facdev.members }}" as="p" hint-placeholder-count="3">
          <div style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:22px 16px 18px;border-radius:16px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-card);position:relative;overflow:hidden;">
            <div style="position:absolute;top:0;left:0;right:0;height:3px;background:{{ p.accent }};opacity:.9;"></div>
            <div style="position:relative;width:88px;height:88px;border-radius:50%;padding:3px;background:linear-gradient(140deg,{{ p.accent }},transparent 70%);">
              <sc-if value="{{ p.hasPhoto }}" hint-placeholder-val="{{ false }}"><img ref="{{ p.imgRef }}" alt="{{ p.fullname }}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;border:2px solid var(--surface);"></sc-if>
              <sc-if value="{{ p.noPhoto }}" hint-placeholder-val="{{ true }}"><div style="width:100%;height:100%;border-radius:50%;border:2px solid var(--surface);display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Sans';font-weight:700;font-size:26px;color:#fff;background:linear-gradient(140deg,{{ p.accent }},color-mix(in srgb,{{ p.accent }} 55%,#000));">{{ p.initials }}</div></sc-if>
            </div>
            <div style="font-family:'Noto Sans TC',sans-serif;font-weight:700;font-size:17px;color:var(--text);line-height:1.25;margin-top:10px;">{{ p.fullname }}</div>
            <div style="font-family:'IBM Plex Sans';font-size:12.5px;color:var(--muted);margin-top:2px;">{{ p.sub }}</div>
            <div style="margin-top:8px;padding:3px 13px;border-radius:999px;font-size:12px;font-weight:600;color:{{ p.accent }};background:color-mix(in srgb,{{ p.accent }} 13%,transparent);border:1px solid color-mix(in srgb,{{ p.accent }} 30%,transparent);">{{ p.role }}</div>
            <div style="font-size:12.5px;color:var(--muted);line-height:1.45;margin-top:6px;white-space:pre-line;">{{ p.dept }}</div>
            <sc-if value="{{ p.profile }}" hint-placeholder-val="{{ false }}"><a href="{{ p.profile }}" target="_blank" rel="noopener" style="margin-top:8px;display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:{{ p.accent }};text-decoration:none;">{{ p.profileLabel }} ↗</a></sc-if>
          </div>
        </sc-for>
      </div>
    </section>

    <!-- fd services -->
    <section id="fd-services" style="max-width:1240px;margin:0 auto;padding:38px 28px 18px;">
      <div data-reveal="" style="text-align:center;margin-bottom:30px;">
        <div style="font-family:'IBM Plex Sans';font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:{{ facdev.clay }};margin-bottom:8px;">{{ facdev.servicesEyebrow }}</div>
        <h2 style="font-family:'Noto Sans TC';font-weight:900;font-size:clamp(26px,3vw,34px);color:var(--text);">{{ facdev.servicesTitle }}</h2>
        <p style="font-size:15px;line-height:1.8;color:var(--muted);max-width:640px;margin:12px auto 0;">{{ facdev.servicesDesc }}</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(248px,1fr));gap:18px;">
        <sc-for list="{{ facdev.services }}" as="s" hint-placeholder-count="4">
          <div data-reveal="" style="position:relative;padding:28px 24px;border-radius:18px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-card);overflow:hidden;">
            <div style="position:absolute;top:0;left:0;width:3px;bottom:0;background:{{ s.tone }};"></div>
            <span style="width:48px;height:48px;border-radius:13px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,{{ s.tone }} 14%,transparent);color:{{ s.tone }};margin-bottom:16px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px;display:block"><use href="#{{ s.icon }}"></use></svg></span>
            <h3 style="font-family:'Noto Sans TC';font-weight:800;font-size:18px;color:var(--text);margin-bottom:10px;line-height:1.4;">{{ s.title }}</h3>
            <p style="font-size:14px;line-height:1.8;color:var(--body);">{{ s.desc }}</p>
          </div>
        </sc-for>
      </div>
    </section>

    <!-- fd groups (org tree) -->
    <section id="fd-groups" style="max-width:1240px;margin:0 auto;padding:38px 28px 18px;">
      <div data-reveal="" style="text-align:center;margin-bottom:30px;">
        <div style="font-family:'IBM Plex Sans';font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:{{ facdev.clay }};margin-bottom:8px;">{{ facdev.groupsEyebrow }}</div>
        <h2 style="font-family:'Noto Sans TC';font-weight:900;font-size:clamp(26px,3vw,34px);color:var(--text);">{{ facdev.groupsTitle }}</h2>
        <p style="font-size:15px;line-height:1.8;color:var(--muted);max-width:680px;margin:12px auto 0;">{{ facdev.groupsDesc }}</p>
      </div>
      <!-- root node -->
      <div data-reveal="" style="display:flex;flex-direction:column;align-items:center;">
        <div style="display:inline-flex;align-items:center;gap:11px;padding:14px 26px;border-radius:14px;background:linear-gradient(135deg,{{ facdev.ink }},#54433a);color:#fff;box-shadow:var(--shadow-lift);"><span style="width:24px;height:24px;color:{{ facdev.claySoft }};"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#ic-cap"></use></svg></span><span style="font-family:'Noto Serif TC',serif;font-weight:800;font-size:18px;">{{ facdev.groupRoot }}</span></div>
        <div style="width:2px;height:26px;background:var(--border);"></div>
        <div style="width:100%;max-width:1040px;height:2px;background:var(--border);"></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;margin-top:0;">
        <sc-for list="{{ facdev.groups }}" as="g" hint-placeholder-count="6">
          <div data-reveal="" style="display:flex;flex-direction:column;align-items:center;">
            <div style="width:2px;height:18px;background:var(--border);"></div>
            <div style="width:100%;border-radius:18px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-card);overflow:hidden;">
              <div style="padding:16px 20px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border);background:linear-gradient(135deg,color-mix(in srgb,{{ g.tone }} 14%,var(--surface)),var(--surface));"><span style="width:9px;height:24px;border-radius:3px;background:{{ g.tone }};flex:none;"></span><h3 style="font-family:'Noto Sans TC';font-weight:800;font-size:17px;color:var(--text);line-height:1.3;">{{ g.name }}</h3></div>
              <div style="padding:18px 20px;">
                <div style="display:flex;align-items:center;gap:13px;margin-bottom:14px;">
                  <div style="position:relative;width:54px;height:54px;border-radius:50%;padding:2px;background:linear-gradient(140deg,{{ g.tone }},transparent 70%);flex:none;">
                    <sc-if value="{{ g.leadHasPhoto }}" hint-placeholder-val="{{ false }}"><img ref="{{ g.leadImgRef }}" alt="{{ g.leadName }}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;border:2px solid var(--surface);"></sc-if>
                    <sc-if value="{{ g.leadNoPhoto }}" hint-placeholder-val="{{ true }}"><div style="width:100%;height:100%;border-radius:50%;border:2px solid var(--surface);display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Sans';font-weight:700;font-size:18px;color:#fff;background:linear-gradient(140deg,{{ g.tone }},color-mix(in srgb,{{ g.tone }} 55%,#000));">{{ g.leadInitials }}</div></sc-if>
                  </div>
                  <div>
                    <div style="font-family:'IBM Plex Sans';font-size:9.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:{{ g.tone }};">{{ facdev.groupLeadLabel }}</div>
                    <div style="font-family:'Noto Sans TC';font-weight:700;font-size:16px;color:var(--text);line-height:1.25;">{{ g.leadName }}</div>
                    <div style="font-family:'IBM Plex Sans';font-size:11.5px;color:var(--muted);">{{ g.leadRole }}</div>
                  </div>
                </div>
                <p style="font-size:13.5px;line-height:1.7;color:var(--body);">{{ g.desc }}</p>
              </div>
            </div>
          </div>
        </sc-for>
      </div>
    </section>

    <!-- fd news + activities (reserved) -->
    <section id="fd-news" style="max-width:1240px;margin:0 auto;padding:38px 28px 12px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px;">
        <div data-reveal="" style="display:flex;flex-direction:column;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;"><span style="width:34px;height:34px;border-radius:9px;background:color-mix(in srgb,{{ facdev.clay }} 13%,transparent);color:{{ facdev.clay }};display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;display:block"><use href="#ic-bell"></use></svg></span><div><div style="font-family:'IBM Plex Sans';font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:{{ facdev.clay }};">{{ facdev.newsEyebrow }}</div><h2 style="font-family:'Noto Sans TC';font-weight:900;font-size:24px;color:var(--text);">{{ facdev.newsTitle }}</h2></div></div>
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:200px;padding:34px 26px;border-radius:18px;border:1.5px dashed var(--border);background:var(--surface-2);">
            <span style="width:40px;height:40px;border-radius:11px;background:color-mix(in srgb,{{ facdev.clay }} 13%,transparent);color:{{ facdev.clay }};display:flex;align-items:center;justify-content:center;margin-bottom:14px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:21px;height:21px;display:block"><use href="#ic-bell"></use></svg></span>
            <span style="display:inline-block;padding:3px 13px;border-radius:999px;font-size:12px;font-weight:600;color:{{ facdev.clay }};background:color-mix(in srgb,{{ facdev.clay }} 12%,transparent);margin-bottom:12px;">{{ facdev.reservedTag }}</span>
            <p style="font-size:14px;line-height:1.75;color:var(--muted);max-width:340px;">{{ facdev.reservedNote }}</p>
          </div>
        </div>
        <div data-reveal="" data-reveal-delay="90" style="display:flex;flex-direction:column;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;"><span style="width:34px;height:34px;border-radius:9px;background:color-mix(in srgb,{{ facdev.sage }} 16%,transparent);color:{{ facdev.sage }};display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;display:block"><use href="#ic-calendar"></use></svg></span><div><div style="font-family:'IBM Plex Sans';font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:{{ facdev.sage }};">{{ facdev.actEyebrow }}</div><h2 style="font-family:'Noto Sans TC';font-weight:900;font-size:24px;color:var(--text);">{{ facdev.actTitle }}</h2></div></div>
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:200px;padding:34px 26px;border-radius:18px;border:1.5px dashed var(--border);background:var(--surface-2);">
            <span style="width:40px;height:40px;border-radius:11px;background:color-mix(in srgb,{{ facdev.sage }} 16%,transparent);color:{{ facdev.sage }};display:flex;align-items:center;justify-content:center;margin-bottom:14px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:21px;height:21px;display:block"><use href="#ic-calendar"></use></svg></span>
            <span style="display:inline-block;padding:3px 13px;border-radius:999px;font-size:12px;font-weight:600;color:{{ facdev.sage }};background:color-mix(in srgb,{{ facdev.sage }} 15%,transparent);margin-bottom:12px;">{{ facdev.reservedTag }}</span>
            <p style="font-size:14px;line-height:1.75;color:var(--muted);max-width:340px;">{{ facdev.reservedNote }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- fd closing + contact -->
    <section id="fd-contact" style="max-width:1240px;margin:0 auto;padding:34px 28px 60px;">
      <div data-reveal="" style="display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:stretch;">
        <div style="padding:32px;border-radius:18px;background:linear-gradient(140deg,{{ facdev.ink }},#54433a);color:#fff;display:flex;flex-direction:column;justify-content:center;">
          <span style="display:block;width:34px;height:34px;color:{{ facdev.claySoft }};margin-bottom:16px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#ic-cap"></use></svg></span>
          <h2 style="font-family:'Noto Serif TC',serif;font-weight:800;font-size:22px;line-height:1.55;margin-bottom:14px;">{{ facdev.closingTitle }}</h2>
          <p style="font-size:14.5px;line-height:1.85;color:#e2dace;">{{ facdev.closingBody }}</p>
        </div>
        <div style="padding:32px;border-radius:18px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-card);display:flex;flex-direction:column;justify-content:center;">
          <div style="font-family:'IBM Plex Sans';font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:{{ facdev.clay }};margin-bottom:8px;">Contact</div>
          <h3 style="font-family:'Noto Sans TC';font-weight:900;font-size:24px;color:var(--text);margin-bottom:18px;">{{ t.contactTitle }}</h3>
          <div style="display:flex;flex-direction:column;gap:14px;">
            <div style="display:flex;align-items:center;gap:12px;"><span style="width:36px;height:36px;border-radius:10px;background:color-mix(in srgb,{{ facdev.clay }} 13%,transparent);color:{{ facdev.clay }};display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#ic-phone"></use></svg></span><div><div style="font-family:'Noto Sans TC';font-weight:600;font-size:14.5px;color:var(--text);">{{ facdev.contactPerson }}</div><div style="font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--muted);">{{ facdev.contactExt }}</div></div></div>
            <div style="display:flex;align-items:center;gap:12px;"><span style="width:36px;height:36px;border-radius:10px;background:color-mix(in srgb,{{ facdev.clay }} 13%,transparent);color:{{ facdev.clay }};display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#ic-pin"></use></svg></span><div style="font-family:'Noto Sans TC';font-size:14.5px;color:var(--body);">{{ facdev.contactPlace }}</div></div>
            <p style="font-family:'Noto Serif TC',serif;font-weight:700;font-size:16px;line-height:1.7;color:{{ facdev.clay }};margin-top:6px;border-left:3px solid {{ facdev.clay }};padding-left:14px;">{{ facdev.contactQuote }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
  </sc-if>

  <!-- ============ BUILDING (center placeholder) VIEW ============ -->
  <sc-if value="{{ isBuilding }}" hint-placeholder-val="{{ false }}">
  <div style="position:relative;z-index:1;min-height:64vh;display:flex;align-items:center;justify-content:center;padding:60px 28px;">
    <div data-reveal="" style="max-width:560px;text-align:center;">
      <span style="width:74px;height:74px;margin:0 auto 22px;border-radius:20px;display:flex;align-items:center;justify-content:center;background:linear-gradient(140deg,{{ building.color }},color-mix(in srgb,{{ building.color }} 55%,#000));color:#fff;box-shadow:0 14px 32px color-mix(in srgb,{{ building.color }} 40%,transparent);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:34px;height:34px;display:block"><use href="#{{ building.iconId }}"></use></svg></span>
      <div style="font-family:'IBM Plex Sans';font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:{{ building.color }};margin-bottom:10px;">{{ building.en }}</div>
      <h1 style="font-family:'Noto Serif TC',serif;font-weight:900;font-size:clamp(30px,4vw,42px);color:var(--text);line-height:1.2;margin-bottom:6px;">{{ building.name }}</h1>
      <div style="display:inline-flex;align-items:center;gap:9px;margin:14px 0 20px;padding:7px 16px;border-radius:999px;background:color-mix(in srgb,var(--teal) 12%,transparent);">
        <span style="width:8px;height:8px;border-radius:50%;background:var(--teal);animation:blink 1.8s ease-in-out infinite;"></span>
        <span style="font-family:'Noto Sans TC';font-size:13.5px;font-weight:700;color:var(--teal-700);">{{ buildingTitle }}</span>
      </div>
      <p style="font-size:16px;line-height:1.85;color:var(--body);margin-bottom:14px;">{{ building.intro }}</p>
      <p style="font-size:14.5px;line-height:1.8;color:var(--muted);margin-bottom:30px;">{{ buildingDesc }}</p>
      <button onClick="{{ enterDept }}" style="display:inline-flex;align-items:center;gap:9px;padding:13px 26px;border:none;border-radius:12px;cursor:pointer;background:linear-gradient(140deg,var(--teal),var(--teal-700));color:#fff;font-family:'Noto Sans TC';font-weight:700;font-size:15px;box-shadow:0 12px 26px var(--teal-glow);">{{ t.backDept }}</button>
    </div>
  </div>
  </sc-if>

  <!-- FOOTER -->
  <footer style="position:relative;z-index:1;border-top:1px solid var(--border);background:var(--surface-2);">
    <div style="max-width:1240px;margin:0 auto;padding:40px 28px;display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:13px;">
        <div style="width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:linear-gradient(140deg,var(--teal),var(--teal-700));"><span style="display:block;width:21px;height:21px;color:#fff;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#ic-heart"></use></svg></span></div>
        <div style="line-height:1.4;"><div style="font-family:'Noto Sans TC';font-weight:700;font-size:14.5px;color:var(--text);">{{ t.footBrand }}</div><div style="font-family:'IBM Plex Sans';font-size:11px;color:var(--muted);">{{ t.footBrandEn }}</div></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;max-width:560px;">
        <div style="display:flex;align-items:center;gap:9px;font-size:13px;color:var(--body);"><span style="width:15px;height:15px;color:var(--muted);flex:none;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#ic-pin"></use></svg></span>{{ t.footAddr }}</div>
        <div style="display:flex;align-items:center;gap:9px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--body);"><span style="width:15px;height:15px;color:var(--muted);flex:none;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><use href="#ic-phone"></use></svg></span>{{ t.footTel }}</div>
        <p style="font-size:12px;color:var(--muted);margin-top:6px;">{{ t.footNote }}</p>
      </div>
    </div>
  </footer>
</div>

<template id="__bundler_thumbnail">
  <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(140deg,#4f8c7d,#3a6b5f);">
    <svg viewBox="0 0 24 24" width="36%" height="36%" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
  </div>
</template></x-dc>
<script type="text/x-dc" data-dc-script data-props="{&quot;heroVariant&quot;:{&quot;editor&quot;:&quot;enum&quot;,&quot;options&quot;:[&quot;B&quot;,&quot;A&quot;],&quot;default&quot;:&quot;B&quot;,&quot;tsType&quot;:&quot;string&quot;},&quot;orgVariant&quot;:{&quot;editor&quot;:&quot;enum&quot;,&quot;options&quot;:[&quot;A&quot;,&quot;B&quot;],&quot;default&quot;:&quot;A&quot;,&quot;tsType&quot;:&quot;string&quot;},&quot;lang&quot;:{&quot;editor&quot;:&quot;enum&quot;,&quot;options&quot;:[&quot;zh&quot;,&quot;en&quot;],&quot;default&quot;:&quot;zh&quot;,&quot;tsType&quot;:&quot;string&quot;},&quot;defaultDark&quot;:{&quot;editor&quot;:&quot;boolean&quot;,&quot;default&quot;:false,&quot;tsType&quot;:&quot;boolean&quot;},&quot;accent&quot;:{&quot;editor&quot;:&quot;color&quot;,&quot;default&quot;:&quot;#4f8c7d&quot;,&quot;tsType&quot;:&quot;string&quot;}}">
class Component extends DCLogic {
  constructor(props){
    super(props);
    this.state = {
      lang: props.lang || 'zh',
      theme: props.defaultDark ? 'dark' : 'light',
      view: 'dept',
      orgVariant: props.orgVariant || 'A',
      heroVariant: props.heroVariant || 'A',
      active: 'admin',
      algee: 0,
    };
  }

  // ---- data ----
  R = {
    director:['中心主任','Director'], deputy:['中心副主任','Deputy Director'],
    cadmin:['中心行政專員','Center Administrator'], instructor:['指導員','Instructor'],
    seed:['種子教師','Seed Teacher'], vp:['教學副院長','VP · Medical Education'], lead:['負責人','Lead'],
    ddir:['教學部主任','Department Director'], ddep:['教學部副主任','Deputy Director'],
    head:['教學部組長','Section Head'], spec:['行政專員','Administrative Specialist'],
    pm:['專案經理','Project Manager'], ai:['AI 專家顧問','AI Expert Advisor'],
    eng:['專案工程師','Project Engineer'],
  };
  initialsOf(en){ const w=(en||'').replace(/[^A-Za-z ]/g,'').trim().split(/\s+/).filter(Boolean); if(w.length>=2) return (w[0][0]+w[w.length-1][0]).toUpperCase(); return (en||'?').slice(0,2).toUpperCase(); }
  res(slug){ return slug ? ((typeof window!=='undefined' && window.__resources && window.__resources[slug]) || ('assets/'+slug+'.jpg')) : ''; }
  P(zh,en,role,dZh,dEn,photo,link,dutyZh,dutyEn){ return {zh,en,role,dZh,dEn,slug:photo||'',photo:photo?('assets/'+photo+'.jpg'):'',link:link?('https://hub.tmu.edu.tw/zh/persons/'+link+'/'):'',ini:this.initialsOf(en),dutyZh:dutyZh||'',dutyEn:dutyEn||''}; }

  buildCenters(){
    const P=this.P.bind(this);
    return [
      {id:'faculty_dev',zh:'教師發展中心',en:'Faculty Development Center',color:'#A87A6B',hx:50,hy:6,hleft:'50%',htop:'9%',
        introZh:'全院臨床教師培育，並協助學校教職相關事務，提升整體教學品質與師資專業發展。',
        introEn:'Hospital-wide clinical faculty development and support for academic appointments, strengthening teaching quality and professional growth.',
        contactZh:'陳均茹',contactEn:'Chun-Ju Chen',ext:'分機 3757',
        people:[P('陳明德','Ming-De Chen','director','西醫 · 副教授','Physician · Assoc. Prof.','ming-de-chen','ming-de-chen'),
                P('陳淑美','Shu-Mei Chen','deputy','西醫 · 副教授','Physician · Assoc. Prof.','shumei-chen','shumei-chen'),
                P('陳均茹','Chun-Ju Chen','cadmin','行政','Administration','','')]},
      {id:'clinical_skills',zh:'臨床技能中心',en:'Clinical Skills Center',color:'#5E7A8C',hx:84,hy:21,hleft:'85%',htop:'30%',
        introZh:'規劃並執行醫學生客觀結構式臨床測驗（OSCE）與各式模擬訓練，培養紮實的臨床技能。',
        introEn:'Designing and running OSCE and simulation-based training to build solid clinical skills.',
        contactZh:'張家銘、賴哲民',contactEn:'Chia-Ming Chang · Che-Min Lai',ext:'分機 3770',
        people:[P('吳人傑','Jen-Chieh Wu','director','西醫 · 助理教授','Physician · Asst. Prof.','jen-chieh-wu','jen-chieh-wu'),
                P('蔡鴻維','Hung-Wei Tsai','deputy','西醫 · 講師','Physician · Lecturer','hung-wei-tsai','hung-wei-tsai'),
                P('賴哲民','Che-Min Lai','cadmin','行政','Administration','',''),
                P('張家銘','Chia-Ming Chang','cadmin','行政','Administration','','')]},
      {id:'ebm',zh:'實證醫學中心',en:'Evidence-Based Medicine Center',color:'#B69B66',hx:84,hy:49,hleft:'85%',htop:'71%',
        introZh:'推動實證醫學（EBM），將實證精神落實於醫療品質，提升臨床決策與照護成效。',
        introEn:'Advancing Evidence-Based Medicine, embedding evidence into care quality and clinical decisions.',
        contactZh:'江明憲',contactEn:'Ming-Hsien Chiang',ext:'分機 3760',
        people:[P('林秀真','Hsiu-Chen Lin','director','西醫 · 副教授','Physician · Assoc. Prof.','hsiu-chen-lin','hsiu-chen-lin'),
                P('林聖峰','Sheng-Feng Lin','deputy','西醫 · 副教授','Physician · Assoc. Prof.','sheng-feng-lin','sheng-feng-lin'),
                P('江明憲','Ming-Hsien Chiang','cadmin','行政','Administration','','')]},
      {id:'holistic',zh:'全人照護教育中心',en:'Center for Education in Holistic Care and Human Flourishing',color:'#4f8c7d',hx:50,hy:64,hleft:'50%',htop:'91%',
        introZh:'以人為本，照顧每一個完整的人。結合醫療、心理與關懷的力量，推動「心理健康急救 MHFA」，培育跨領域種子教師。',
        introEn:'People first — caring for the whole person. Uniting medical, psychological and compassionate care to promote Mental Health First Aid.',
        contactZh:'江明憲',contactEn:'Ming-Hsien Chiang',ext:'分機 3760',deep:true,
        people:[P('廖若帆','Faith Ruofan Liao','director','護理 · 副教授','Nursing · Assoc. Prof.','faith-ruofan-liao','faith-ruofan-liao'),
                P('孟令城','Ling-Cheng Mong','deputy','牙醫','Dentist','ling-cheng-mong','ling-cheng-mong'),
                P('江明憲','Ming-Hsien Chiang','cadmin','行政','Administration','','')]},
      {id:'med_edu_research',zh:'醫學教育研究中心',en:'Medical Education Research Center',color:'#6E8A77',hx:16,hy:49,hleft:'15%',htop:'71%',
        introZh:'以實證與資料驅動的方法研究醫學教育，發展教學評量工具與成效分析，將研究成果回饋至課程設計與教師發展。',
        introEn:'Studying medical education with evidence- and data-driven methods, developing assessment tools and feeding findings back into curriculum design.',
        contactZh:'陳麗玉',contactEn:'Li-Yu Chen',ext:'',
        people:[P('陳建宇','Chien-Yu Chen','director','西醫 · 教授','Physician · Professor','chien-yu-chen','chien-yu-chen'),
                P('邱欣怡','Hsin-Yi Chiu','deputy','西醫 · 助理教授','Physician · Asst. Prof.','hsin-yi-chiu','hsin-yi-chiu'),
                P('陳麗玉','Li-Yu Chen','cadmin','行政','Administration','','')]},
      {id:'admin',zh:'行政團隊',en:'Administrative Team',color:'#8a8076',hx:16,hy:21,hleft:'15%',htop:'30%',
        introZh:'依職責與分工協同運作，從教學副院長、教學部主任、副主任、組長到各行政專員，支援教學部各項業務的推動。',
        introEn:'Working in coordinated roles — from the VP for Medical Education and department directors to administrative specialists — to support all teaching operations.',
        contactZh:'',contactEn:'',ext:'',
        people:[P('張君照','Chun-Chao Chang','vp','西醫 · 教授','Physician · Professor','chun-chao-chang','chun-chao-chang'),
                P('葉篤學','Tu-Hsueh Yeh','ddir','西醫 · 副教授','Physician · Assoc. Prof.','tu-hsueh-yeh','tu-hsueh-yeh'),
                P('張瓈方','Li-Fang Chang','ddep','護理 · 助理教授','Nursing · Asst. Prof.','li-fang-chang','li-fang-chang'),
                P('郭淑柳','Shu-Liu Guo','ddep','護理 · 助理教授','Nursing · Asst. Prof.','shu-liu-guo','shu-liu-guo'),
                P('王怡文','Yi-Wen Wang','head','行政','Administration','',''),
                P('楊明芳','Ming-Fang Yang','spec','行政','Administration','','','TMS相關業務、新人訓','TMS operations, new staff training'),
                P('羅翊芳','Yi-Fang Lo','spec','行政','Administration','','','職類相關業務、教學門診','Profession-track operations, teaching clinics'),
                P('曾牧雲','Mu-Yun Tseng','spec','行政','Administration','','','實習醫學生相關業務','Clerkship medical student operations'),
                P('李珮暄','Pei-Hsuan Lee','spec','行政','Administration','','','住院醫師相關業務、PEC、CCC','Resident operations, PEC, CCC'),
                P('張筱雯','Hsiao-Wen Chang','spec','行政','Administration','','','PGY相關業務','PGY operations'),
                P('陳均茹','Chun-Ju Chen','spec','行政','Administration','','','教發中心、大人提、教職相關業務','Faculty Development Center, grants & academic appointments'),
                P('江明憲','Ming-Hsien Chiang','spec','行政','Administration','','','實證中心、全人中心、BI相關業務、EP系統相關業務','EBM & Holistic Centers, BI operations, e-Portfolio system'),
                P('賴哲民','Che-Min Lai','spec','行政','Administration','','','臨技中心、OSCE相關業務','Clinical Skills Center, OSCE operations'),
                P('張家銘','Chia-Ming Chang','spec','行政','Administration','','','臨技中心、OSCE相關業務','Clinical Skills Center, OSCE operations'),
                P('張淑慧','Shu-Hui Chang','spec','美術設計','Graphic Design','','','美術設計、平面設計','Art & graphic design'),
                P('高偉劭','Wei-Shao Kao','spec','影音','Audiovisual','','','影音相關業務','Audiovisual production')]},
    ];
  }
  holisticData(){
    const P=this.P.bind(this);
    return {
      instructors:[ P('廖若帆','Faith Ruofan Liao','instructor','護理 · 副教授<br>教學部 全人中心','Nursing · Assoc. Prof.<br>Holistic Center','faith-ruofan-liao','faith-ruofan-liao'),
                    P('吳忠哲','Chung-Che Wu','instructor','西醫 · 副教授<br>神經外科','Physician · Assoc. Prof.<br>Neurosurgery','chung-che-wu','chung-che-wu') ],
      seed:[ P('丁禮莉','Lai-Lei Ting','seed','西醫<br>放射腫瘤科','Physician<br>Radiation Oncology','lai-lei-ting',''),
             P('吳政誠','Jeng-Cheng Wu','seed','西醫 · 助理教授<br>泌尿科','Physician · Asst. Prof.<br>Urology','jeng-cheng-wu',''),
             P('彭思媛','Szu-Yuan Peng','seed','社工<br>社工室','Social Work<br>Social Work Office','',''),
             P('王莉萱','Li-Hsuan Wang','seed','藥劑 · 教授<br>藥劑部','Pharmacy · Prof.<br>Pharmacy','li-hsuan-wang',''),
             P('范芳郡','Fang-Chun Fan','seed','放射<br>影像醫學部','Radiology<br>Medical Imaging','fang-chun-fan',''),
             P('曹念萱','Nien-Hsuan Tsao','seed','護理<br>護理部','Nursing<br>Nursing Dept.','nien-hsuan-tsao',''),
             P('曲天尚','Tien-Shang Chu','seed','護理<br>護理部','Nursing<br>Nursing Dept.','tien-shang-chu',''),
             P('高倩琪','Chien-Chi Kao','seed','關懷師<br>員工關懷中心','Chaplain<br>Staff Care','',''),
             P('蔡宜庭','Yi-Ting Tsai','seed','臨床心理<br>精神科','Clinical Psych.<br>Psychiatry','',''),
             P('葉雅文','Ya-Wen Yeh','seed','語言治療<br>復健醫學部','Speech Therapy<br>Rehab Medicine','',''),
             P('王怡文','Yi-Wen Wang','seed','行政<br>教學部','Administration<br>Medical Education','','') ],
      ai:[ P('廖若帆','Faith Ruofan Liao','pm','副主任 · 副教授','Deputy Director · Assoc. Prof.','faith-ruofan-liao','faith-ruofan-liao'),
           P('邵軒磊','Hsuan-Lei Shao','ai','教授','Professor','',''),
           P('Diana Gonzalez','Diana Gonzalez','eng','MD · 範疇二團隊','MD · Scope 2 Team','','') ],
    };
  }

  STR = {
    zh:{ brand1:'臺北醫學大學附設醫院',brand2:'教學部 · Medical Education', langBtn:'EN', footBrand:'臺北醫學大學附設醫院 教學部', footBrandEn:'Dept. of Medical Education · TMU Hospital', footAddr:'地址：110301 臺北市信義區吳興街 252 號', footTel:'電話：(02) 2737-2181',
      navAbout:'關於',navOrg:'組織架構',navHolistic:'全人照護中心',navNews:'公告',navContact:'聯絡',navMhfa:'心理健康急救',navSeed:'種子教師',backDept:'返回教學部',
      heroEyebrow:'Taipei Medical University Hospital',heroTitle1:'卓越醫學教育',heroTitle2:'育成醫療人才',
      heroTag:'以人為本的全人醫療教育，結合教師發展、臨床技能、實證醫學與全人照護，培育兼具同理心與專業能力的醫療人才。',
      ctaOrg:'探索組織架構',ctaHolistic:'進入全人照護中心',chipCenters:'教育中心',chipSeed:'種子教師',
      kpiEyebrow:'At a Glance',kpiTitle:'教學部一覽',dataSource:'資料來源：教學部 績效管理組 BI 團隊 · AY114',
      orgTitle:'教學部組織架構',orgDesc:'六大功能單位協同運作，點擊任一中心查看團隊組成與聯絡窗口。',layoutTree:'組織樹',layoutHub:'中樞圖',
      hospital:'臺北醫學大學附設醫院',dept:'教學部',deptShort:'教學部',members:'團隊成員',formingTeam:'團隊籌備中，敬請期待。',
      comingSoon:'即將串接',contactTitle:'聯絡我們',
      newsZh:'最新公告',newsEn:'Announcements',newsDesc:'中心與教學部的最新訊息。未來與活動管理平台串接後，將自動顯示「對外看板」的公告。',
      eventsZh:'近期活動',eventsEn:'Activities',eventsDesc:'課程、講座與培訓資訊。未來將與「教學部活動管理平台」即時串接，自動顯示最新活動並開放線上報名。',
      hHeroTitle:'以人為本，照顧每一個完整的人',
      hHeroTag:'全人照護教育中心結合醫療、心理與關懷的力量，推動「心理健康急救 Mental Health First Aid」，培育跨領域種子教師，讓身心健康的支持，走進每一個臨床現場與校園角落。',
      hCtaMhfa:'了解心理健康急救',
      hAboutTitle:'關於全人照護教育中心',
      hAboutBody:'全人照護（Holistic Care）相信健康不只是沒有疾病，而是身、心、社會與心靈的整體安適。我們以教育為起點，讓每一位醫療同仁都具備關懷與初步協助的能力。',
      mhfaTitle:'心理健康急救 ALGEE',mhfaIntro:'就像 CPR 之於身體急救，MHFA 教我們在他人陷入心理困擾或危機時，能夠及時察覺、陪伴與協助轉介。點選每個字母，認識五個行動步驟。',
      instructorsTitle:'中心指導員',seedTitle:'MHFA 種子教師團隊',seedDesc:'來自全院 11 個科部、橫跨 10 種專業職類，將心理健康急救的種子帶回各自的工作現場。',
      aiTitle:'台灣健康深耕計畫範疇二：打造 AI 全人照護教育生態系',
      aiBody:'本範疇以「打造 AI 全人照護教育生態系」為核心，串連全人照護教育、人工智慧專業、醫學教育研究與實作場域，發展可導入臨床與校園的 AI 輔助教學資源、案例素材與評量回饋機制，支持醫療人才在科技輔助下深化同理、溝通與全人照護能力。',
      hContactPerson:'行政專員：江明憲',hContactExt:'分機 3760',hContactPlace:'臺北醫學大學附設醫院 · 教學部 全人照護教育中心',
      hContactQuote:'以教育推動全人照護，讓關懷成為每一位醫療人的本能。',
      footNote:'© 臺北醫學大學附設醫院 教學部　本網站僅供單位展示使用。',
    },
    en:{ brand1:'Taipei Medical Univ. Hospital',brand2:'Dept. of Medical Education',langBtn:'中',footBrand:'Dept. of Medical Education, TMU Hospital', footBrandEn:'Taipei Medical University Hospital', footAddr:'No. 252, Wuxing St., Xinyi Dist., Taipei 110301, Taiwan', footTel:'Tel: (02) 2737-2181',
      navAbout:'About',navOrg:'Organization',navHolistic:'Holistic Care',navNews:'News',navContact:'Contact',navMhfa:'MHFA',navSeed:'Seed Teachers',backDept:'Back to Dept.',
      heroEyebrow:'Taipei Medical University Hospital',heroTitle1:'Excellence in',heroTitle2:'Medical Education',
      heroTag:'People-centered whole-person medical education — uniting faculty development, clinical skills, evidence-based medicine and holistic care to nurture compassionate, competent clinicians.',
      ctaOrg:'Explore the Organization',ctaHolistic:'Enter Holistic Care Center',chipCenters:'Education Centers',chipSeed:'Seed Teachers',
      kpiEyebrow:'At a Glance',kpiTitle:'The Department at a Glance',dataSource:'Source: Performance Mgmt · BI Team · AY114',
      orgTitle:'Organizational Structure',orgDesc:'Six functional units working in concert. Tap any center to view its team and contact.',layoutTree:'Tree',layoutHub:'Hub',
      hospital:'Taipei Medical University Hospital',dept:'Dept. of Medical Education',deptShort:'MED EDU',members:'Team Members',formingTeam:'Team being formed — stay tuned.',
      comingSoon:'Coming soon',contactTitle:'Contact Us',
      newsZh:'Announcements',newsEn:'Announcements',newsDesc:'Latest news from the center and the department. Once connected to the activity platform, the public board will appear here automatically.',
      eventsZh:'Activities',eventsEn:'Activities',eventsDesc:'Courses, talks and training. Will connect live to the department activity platform, auto-showing events with online registration.',
      hHeroTitle:'People first — caring for the whole person',
      hHeroTag:'The Center unites medical, psychological and compassionate care to promote Mental Health First Aid, nurturing interdisciplinary seed teachers so support reaches every clinical setting and campus corner.',
      hCtaMhfa:'Learn about MHFA',
      hAboutTitle:'About the Center',
      hAboutBody:'Holistic Care holds that health is not merely the absence of disease, but the whole-person wellbeing of body, mind, society and spirit. We begin with education, so every clinician can offer care and first-line support.',
      mhfaTitle:'Mental Health First Aid · ALGEE',mhfaIntro:'Like CPR for the body, MHFA teaches us to notice, accompany and help refer someone in psychological distress or crisis. Tap each letter to explore the five action steps.',
      instructorsTitle:'Center Instructors',seedTitle:'MHFA Seed Teacher Team',seedDesc:'From 11 departments across 10 professional disciplines, carrying the seeds of mental health first aid back to their own workplaces.',
      aiTitle:'Healthy Taiwan Deep Cultivation, Scope 2: Building an AI Holistic Care Education Ecosystem',
      aiBody:'Centered on building an AI holistic-care education ecosystem, this scope connects holistic care education, AI expertise, medical-education research and real practice settings — developing AI-assisted teaching resources, case materials and assessment feedback for clinical and campus use, deepening empathy, communication and whole-person care.',
      hContactPerson:'Administrator: Ming-Hsien Chiang',hContactExt:'Ext. 3760',hContactPlace:'TMU Hospital · Holistic Care Education Center, Dept. of Medical Education',
      hContactQuote:'Education that makes holistic care second nature to every clinician.',
      footNote:'© Taipei Medical University Hospital, Dept. of Medical Education. For unit display only.',
    },
  };

  ALGEE = [
    {l:'A',zh:['接近、評估與協助危機','主動關懷，留意潛在的自傷或危機徵兆，在安全前提下評估狀況並適時介入。'],en:['Approach, assess & assist','Reach out with care, watch for signs of self-harm or crisis, and step in safely when needed.']},
    {l:'L',zh:['不帶批判地聆聽','放下評價，給予一個安全、被理解的傾訴空間，讓對方願意說出感受。'],en:['Listen non-judgmentally','Set judgment aside and offer a safe, understanding space so the person feels heard.']},
    {l:'G',zh:['給予支持與資訊','提供正確、實用的身心健康資訊，並表達理解與支持。'],en:['Give support & information','Share accurate, practical mental-health information alongside understanding and support.']},
    {l:'E',zh:['鼓勵尋求專業協助','協助對方連結醫療與專業資源，跨出求助的第一步。'],en:['Encourage professional help','Help the person connect with medical and professional resources, and take the first step.']},
    {l:'E',zh:['鼓勵其他支持','善用家庭、同儕與社區的支持網絡，讓關懷持續發生。'],en:['Encourage other supports','Draw on family, peer and community networks so support continues over time.']},
  ];

  // ---- icons ----
  ic(p){ return {__html:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%">'+p+'</svg>'}; }
  icons(){ return {
    heart:this.ic('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>'),
    arrow:this.ic('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'),
    phone:this.ic('<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>'),
    pin:this.ic('<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>'),
    sun:this.ic('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>'),
    moon:this.ic('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'),
    cap:this.ic('<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>'),
    skills:this.ic('<path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"/><path d="M9 11V6a3 3 0 0 1 6 0v5"/><path d="M12 15v3"/>'),
    chart:this.ic('<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9-5 5-4-4-3 3"/>'),
    holistic:this.ic('<path d="M12 8a2.83 2.83 0 0 1 4 4l-4 4-4-4a2.83 2.83 0 0 1 4-4"/><circle cx="12" cy="12" r="9"/>'),
    research:this.ic('<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/><path d="M11 8v6"/><path d="M8 11h6"/>'),
    admin:this.ic('<path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/>'),
    brain:this.ic('<path d="M12 5a3 3 0 1 0-5.997.142 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.142 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>'),
    sprout:this.ic('<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>'),
    network:this.ic('<circle cx="12" cy="5" r="2.5"/><path d="M12 7.5v3"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M12 10.5 6.5 16.8"/><path d="m12 10.5 5.5 6.3"/>'),
    bell:this.ic('<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>'),
    calendar:this.ic('<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>'),
  };}

  // ---- handlers ----
  toggleLang = () => this.setState(s=>({lang:s.lang==='zh'?'en':'zh'}));
  toggleTheme = () => this.setState(s=>({theme:s.theme==='light'?'dark':'light'}));
  setView = (v) => this.setState({view:v});
  enterCenter = (id) => { if(id==='holistic') this.setState({view:'holistic'}); else if(id==='ebm') this.setState({view:'ebm'}); else if(id==='faculty_dev') this.setState({view:'facdev'}); else this.setState({view:'building',buildingId:id}); };
  setActive = (id) => this.setState(s=>({active:s.active===id?null:id}));
  setOrg = (v) => this.setState({orgVariant:v});
  setAlgee = (i) => this.setState({algee:i});
  scrollTo = (id) => { if(!this.root) return; const el=this.root.querySelector('#'+id); if(el) window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-72,behavior:'smooth'}); };

  // ---- lifecycle / effects ----
  componentDidMount(){ this._prevView=this.state.view; this._prevTheme=this.state.theme; this.initCanvas(); this.initGlow(); this.reveal(); window.addEventListener('scroll',this._sc=()=>this.reveal(),{passive:true}); window.addEventListener('resize',this._rz=()=>{ this.sizeCanvas(); this.reveal(); }); }
  componentDidUpdate(pp,ps){ const pv=(ps&&'view'in ps)?ps.view:this._prevView; const pt=(ps&&'theme'in ps)?ps.theme:this._prevTheme; if(pv!==undefined&&pv!==this.state.view){ window.scrollTo({top:0,behavior:'auto'}); } if(pt!==undefined&&pt!==this.state.theme){ this.particleColor(); } this._prevView=this.state.view; this._prevTheme=this.state.theme; requestAnimationFrame(()=>this.reveal()); }
  componentWillUnmount(){ cancelAnimationFrame(this._raf); window.removeEventListener('resize',this._rz); window.removeEventListener('scroll',this._sc); if(this._mm) window.removeEventListener('mousemove',this._mm); }

  particleColor(){ this._pc = this.state.theme==='dark' ? '109,181,161' : '79,140,125'; }
  sizeCanvas(){ const c=this.canvas; if(!c) return; const r=window.devicePixelRatio||1; c.width=window.innerWidth*r; c.height=window.innerHeight*r; const x=c.getContext('2d'); x.setTransform(r,0,0,r,0,0); }
  initCanvas(){ const c=this.canvas; if(!c) return; this.particleColor(); this.sizeCanvas(); const ctx=c.getContext('2d');
    const N=Math.min(64,Math.round(window.innerWidth/26)); const W=()=>window.innerWidth,H=()=>window.innerHeight;
    this.pts=Array.from({length:N},()=>({x:Math.random()*W(),y:Math.random()*H(),vx:(Math.random()-.5)*.28,vy:(Math.random()-.5)*.28,r:Math.random()*1.6+.6}));
    this.mouse={x:-999,y:-999};
    const loop=()=>{ const w=W(),h=H(); ctx.clearRect(0,0,w,h); const col=this._pc;
      for(const p of this.pts){ p.x+=p.vx;p.y+=p.vy; if(p.x<0||p.x>w)p.vx*=-1; if(p.y<0||p.y>h)p.vy*=-1;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.283); ctx.fillStyle='rgba('+col+',.5)'; ctx.fill(); }
      for(let i=0;i<this.pts.length;i++){ for(let j=i+1;j<this.pts.length;j++){ const a=this.pts[i],b=this.pts[j];
        const dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy); if(d<118){ ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.strokeStyle='rgba('+col+','+(.13*(1-d/118))+')'; ctx.lineWidth=.7; ctx.stroke(); } }
        const mdx=this.pts[i].x-this.mouse.x,mdy=this.pts[i].y-this.mouse.y,md=Math.hypot(mdx,mdy); if(md<170){ ctx.beginPath(); ctx.moveTo(this.pts[i].x,this.pts[i].y); ctx.lineTo(this.mouse.x,this.mouse.y); ctx.strokeStyle='rgba('+col+','+(.22*(1-md/170))+')'; ctx.lineWidth=.8; ctx.stroke(); } }
      this._raf=requestAnimationFrame(loop); };
    loop();
  }
  initGlow(){ this._mm=(e)=>{ if(this.glow) this.glow.style.transform='translate('+e.clientX+'px,'+e.clientY+'px)'; if(this.mouse){ this.mouse.x=e.clientX; this.mouse.y=e.clientY; } }; window.addEventListener('mousemove',this._mm); }
  reveal(){ if(!this.root) return; const vh=window.innerHeight||800;
    this.root.querySelectorAll('[data-reveal]:not([data-seen])').forEach(el=>{ const d=el.getAttribute('data-reveal-delay')||0; el.style.willChange='opacity,transform'; el.style.transition='opacity .7s cubic-bezier(.2,0,.2,1) '+d+'ms,transform .7s cubic-bezier(.2,0,.2,1) '+d+'ms';
      if(el.getBoundingClientRect().top < vh*0.92){ el.setAttribute('data-seen','1'); requestAnimationFrame(()=>{ el.style.opacity='1'; el.style.transform='none'; }); el.querySelectorAll('[data-count]').forEach(c=>this.countUp(c)); }
      else { el.style.opacity='0'; el.style.transform='translateY(26px)'; } });
  }
  countUp(el){ if(el.getAttribute('data-done')) return; el.setAttribute('data-done','1'); const target=parseFloat(el.getAttribute('data-count'))||0; const suf=el.getAttribute('data-suffix')||''; const dur=1200,t0=performance.now();
    const step=(now)=>{ const p=Math.min(1,(now-t0)/dur); const e=1-Math.pow(1-p,3); el.textContent=Math.round(target*e)+suf; if(p<1) requestAnimationFrame(step); }; requestAnimationFrame(step);
  }

  hover(el,on,lift){ el.style.transform=on?('translateY('+(lift||-5)+'px)'):'translateY(0)'; el.style.boxShadow=on?'var(--shadow-lift)':'var(--shadow-card)'; }

  renderVals(){
    const { lang, theme, view, orgVariant, active, algee } = this.state;
    const isZh = lang==='zh';
    const t = this.STR[lang];
    const I = this.icons();
    const cap = (e)=>{ e.currentTarget.style.color='var(--teal)'; e.currentTarget.style.background='var(--teal-50)'; };
    const uncap = (e)=>{ e.currentTarget.style.color='var(--text)'; e.currentTarget.style.background='none'; };

    const centersRaw = this.buildCenters();
    const iconFor = {faculty_dev:'ic-cap',clinical_skills:'ic-skills',ebm:'ic-chart',holistic:'ic-holistic',med_edu_research:'ic-research',admin:'ic-admin'};
    const fullBodySlugs = {'chung-che-wu':'center 18%','tien-shang-chu':'center 16%','nien-hsuan-tsao':'center 16%','fang-chun-fan':'center 16%','chien-yu-chen':'center 14%','hsin-yi-chiu':'center 10%','hung-wei-tsai':'center 8%'};
    const resolveP = (p,accent)=>({ fullname:isZh?p.zh:p.en, sub:isZh?p.en:p.zh, role:this.R[p.role][isZh?0:1], dept:(isZh?p.dZh:p.dEn).split('<br>').join(String.fromCharCode(10)), photo:this.res(p.slug), imgRef:(el)=>{ if(el){ const src=this.res(p.slug); if(el.getAttribute('data-src')!==src){ el.setAttribute('data-src',src); el.src=src; } el.style.objectPosition=fullBodySlugs[p.slug]||'center'; } }, initials:p.ini, accent, hasPhoto:!!p.slug, noPhoto:!p.slug, profile:p.link, profileLabel:isZh?'個人學術檔案':'Academic Profile', duty:isZh?p.dutyZh:p.dutyEn, dutyLabel:isZh?'主要業務':'Main Duties' });

    const centers = centersRaw.map(c=>{
      const on = active===c.id;
      return { id:c.id, name:isZh?c.zh:c.en, color:c.color, iconId:iconFor[c.id], hx:c.hx, hy:c.hy, hleft:c.hleft, htop:c.htop,
        countLabel:c.people.length?((isZh?'':'')+c.people.length+(isZh?' 位':'')):(isZh?'籌備中':'—'),
        nodeBorder: on?c.color:'var(--border)', nodeBg: on?('color-mix(in srgb,'+c.color+' 12%,var(--surface))'):'var(--surface)', nodeShadow: on?'var(--shadow-lift)':'var(--shadow-card)',
        onClick:()=>this.setActive(c.id),
        enter:(e)=>{ if(!on){ e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='var(--shadow-lift)'; e.currentTarget.style.borderColor=c.color; } },
        leave:(e)=>{ if(!on){ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='var(--shadow-card)'; e.currentTarget.style.borderColor='var(--border)'; } },
        enterHub:(e)=>{ e.currentTarget.style.transform='translate(-50%,-50%) scale(1.06)'; e.currentTarget.style.boxShadow='var(--shadow-lift)'; },
        leaveHub:(e)=>{ e.currentTarget.style.transform='translate(-50%,-50%) scale(1)'; e.currentTarget.style.boxShadow=on?'var(--shadow-lift)':'var(--shadow-card)'; },
      };
    });
    const activeRaw = centersRaw.find(c=>c.id===active);
    let activeObj=null;
    if(activeRaw){ const contactLine = activeRaw.ext ? ((isZh?activeRaw.contactZh:activeRaw.contactEn)+' · '+activeRaw.ext) : '';
      const isAdmin = activeRaw.id==='admin';
      const byRole=(r)=>activeRaw.people.filter(p=>p.role===r).map(p=>resolveP(p,activeRaw.color));
      activeObj={ id:activeRaw.id, name:isZh?activeRaw.zh:activeRaw.en, en:activeRaw.en, color:activeRaw.color, iconId:iconFor[activeRaw.id],
        intro:isZh?activeRaw.introZh:activeRaw.introEn, contactLine, isAdmin, hasPeople:(activeRaw.people.length>0 && !isAdmin), empty:activeRaw.people.length===0,
        people:activeRaw.people.map(p=>resolveP(p,activeRaw.color)),
        adminL1:byRole('vp'), adminL2:byRole('ddir'), adminL3:byRole('ddep'), adminL4:byRole('head'), adminL5:byRole('spec'),
        cap1:isZh?'教學副院長':'VP · Medical Education', cap2:isZh?'教學部主任':'Department Director', cap3:isZh?'教學部副主任':'Deputy Directors', cap4:isZh?'教學部組長':'Section Head', cap5:isZh?'行政專員 · 業務分工':'Administrative Specialists · Duties' }; }

    // KPI
    const kdata=[ [5,'','教育中心','Education Centers','#4f8c7d'],
      [102,'','種子教師','Seed Teachers','#A87A6B'],
      [13,'','專業職類','Disciplines','#5E7A8C'],
      [4,'','教學型主治','Teaching Attendings','#B69B66'],
      [4,'','職類教學型醫事人員','Teaching Allied Health','#7A95A8'] ];
    const kpis=kdata.map((k,i)=>({num:k[0],suffix:k[1],zh:isZh?k[2]:k[3],en:k[3],color:k[4],delay:i*70}));

    // nav
    const mkNav=(label,fn)=>({ label, color:'var(--body)', onClick:fn, enter:cap, leave:uncap });
    let navItems;
    if(view==='dept'){ navItems=[ mkNav(t.navAbout,()=>this.scrollTo('top')), mkNav(t.navOrg,()=>this.scrollTo('org')), mkNav(t.navNews,()=>this.scrollTo('news')), mkNav(t.navContact,()=>this.scrollTo('contact')) ]; }
    else if(view==='holistic'){ navItems=[ mkNav(t.navAbout,()=>this.scrollTo('h-about')), mkNav(t.navMhfa,()=>this.scrollTo('mhfa')), mkNav(t.navSeed,()=>this.scrollTo('seed')), mkNav(isZh?'健康台灣':'Healthy Taiwan',()=>this.scrollTo('scope2')), mkNav(isZh?'最新公告':'News',()=>this.scrollTo('h-news')), mkNav(isZh?'近期活動':'Activities',()=>this.scrollTo('h-activities')), mkNav(t.navContact,()=>this.scrollTo('h-contact')), mkNav(t.backDept,()=>this.setView('dept')) ]; }
    else if(view==='ebm'){ navItems=[ mkNav(isZh?'中心簡介':'About',()=>this.scrollTo('ebm-about')), mkNav(isZh?'核心任務':'Missions',()=>this.scrollTo('ebm-missions')), mkNav(isZh?'競賽成就':'Awards',()=>this.scrollTo('ebm-awards')), mkNav(isZh?'推動歷程':'Journey',()=>this.scrollTo('ebm-journey')), mkNav(isZh?'訓練課程':'Courses',()=>this.scrollTo('ebm-courses')), mkNav(t.navContact,()=>this.scrollTo('ebm-contact')), mkNav(t.backDept,()=>this.setView('dept')) ]; }
    else if(view==='facdev'){ navItems=[ mkNav(isZh?'中心簡介':'About',()=>this.scrollTo('fd-about')), mkNav(isZh?'中心成員':'Members',()=>this.scrollTo('fd-members')), mkNav(isZh?'核心業務':'Services',()=>this.scrollTo('fd-services')), mkNav(isZh?'六大培育小組':'Groups',()=>this.scrollTo('fd-groups')), mkNav(isZh?'最新公告':'News',()=>this.scrollTo('fd-news')), mkNav(t.navContact,()=>this.scrollTo('fd-contact')), mkNav(t.backDept,()=>this.setView('dept')) ]; }
    else { navItems=[ mkNav(t.backDept,()=>this.setView('dept')) ]; }

    // contacts (dept)
    const contacts = [{center:isZh?'教學部':'Dept. of Medical Education',person:isZh?'王怡文':'Yi-Wen Wang',ext:isZh?'分機 3752':'Ext. 3752',color:'#4f8c7d'}, ...centersRaw.filter(c=>c.ext).map(c=>({ center:isZh?c.zh:c.en, person:isZh?c.contactZh:c.contactEn, ext:c.ext, color:c.color }))];

    // center page entry links
    const centerLinks = ['faculty_dev','clinical_skills','ebm','holistic','med_edu_research'].map(id=>centersRaw.find(c=>c.id===id)).map(c=>{ const ready=(c.id==='holistic'||c.id==='ebm'||c.id==='faculty_dev'); return { id:c.id, name:isZh?c.zh:c.en, en:c.en, color:c.color, iconId:iconFor[c.id], ready, notReady:!ready, statusLabel: ready?(isZh?'進入專頁':'Enter page'):(isZh?'建置中':'In progress'), onClick:()=>this.enterCenter(c.id) }; });
    const buildingRaw = centersRaw.find(c=>c.id===this.state.buildingId);
    const buildingObj = buildingRaw ? { name:isZh?buildingRaw.zh:buildingRaw.en, en:buildingRaw.en, color:buildingRaw.color, iconId:iconFor[buildingRaw.id], intro:isZh?buildingRaw.introZh:buildingRaw.introEn } : null;

    // AI ecosystem (Scope 2)
    const aiEcoTitle = isZh?'AI 全人照護教學模擬生態系':'AI Holistic-Care Teaching Simulation Ecosystem';
    const aiEcoBody = isZh?'本計畫的核心不是單一工具，而是一個可以反覆練習、即時回饋、持續累積案例的教學模擬生態系。以全人臨床情境為主軸，串接 AI 病人、教案 AI 化、平板與 VR 模擬練習、全人學習成效回饋，以及 Line AI ChatBot 隨身助教，讓教師設計情境、學生進入情境，AI 協助互動與回饋。':'The core is not a single tool but a teaching-simulation ecosystem for repeated practice, instant feedback and an accumulating case library — connecting AI patients, AI-authored cases, tablet & VR simulation, holistic learning feedback and a Line AI ChatBot assistant.';
    const aiFlow = [
      {role:isZh?'教師端':'Faculty', title:isZh?'教案 AI 化':'AI-authored cases', text:isZh?'把全人照護目標、臨床任務與討論問題轉成可互動的情境教案。':'Turn holistic-care goals, clinical tasks and discussion prompts into interactive case scenarios.', color:'#4f8c7d'},
      {role:isZh?'情境內容':'Scenario', title:isZh?'全人臨床情境':'Whole-person clinical context', text:isZh?'以醫學、人文、心理、倫理與照護脈絡設計案例。':'Cases designed across medical, humanistic, psychological, ethical and care contexts.', color:'#6E8A77'},
      {role:isZh?'學生端':'Student', title:isZh?'平板與 VR 模擬練習':'Tablet & VR simulation', text:isZh?'學生透過問診、判斷、醫令與治療計畫練習臨床推理。':'Students practice clinical reasoning through history-taking, judgment, orders and treatment plans.', color:'#5E7A8C'},
      {role:isZh?'回饋端':'Feedback', title:isZh?'即時回饋與 Line AI ChatBot':'Instant feedback & Line AI ChatBot', text:isZh?'提供學習歷程回饋與全人臨床隨身助教，支援課後延伸學習。':'Learning-process feedback plus an on-the-go holistic clinical assistant for after-class study.', color:'#B69B66'} ];
    const aiSteps = [
      {n:'01', title:isZh?'情境設計':'Scenario design', text:isZh?'教師將全人照護能力指標轉為臨床任務與討論問題':'Faculty translate holistic-care competencies into clinical tasks and prompts'},
      {n:'02', title:isZh?'AI 病人互動':'AI patient interaction', text:isZh?'學生與 AI 病人進行問診、診斷說明與治療溝通':'Students conduct history-taking, diagnosis and treatment communication with an AI patient'},
      {n:'03', title:isZh?'模擬練習導入':'Simulation practice', text:isZh?'結合平板、VR 與小組討論，讓課程更貼近臨床現場':'Tablet, VR and group discussion bring courses closer to the clinical floor'},
      {n:'04', title:isZh?'回饋與延伸':'Feedback & extension', text:isZh?'以即時回饋與 ChatBot 協助學生整理學習成效':'Instant feedback and the ChatBot help students consolidate learning outcomes'} ];
    const aiProblems = isZh?[
      '讓全人照護不只停留在理念，而是變成可操作、可練習、可回饋的教學流程。',
      '讓學生在進入真實臨床前，先透過 AI 病人練習問診、判斷、溝通與治療計畫。',
      '讓教師能快速產出情境教案，並透過學習成效回饋持續修正課程。' ]:[
      'Make holistic care operational, practiceable and measurable — not just an ideal.',
      'Let students rehearse history-taking, judgment, communication and treatment with AI patients before real clinics.',
      'Help faculty rapidly produce case scenarios and refine courses through learning-outcome feedback.' ];

    // placeholders
    const placeholders=[ {zh:t.newsZh,en:t.newsEn,desc:t.newsDesc,iconId:'ic-bell',color:'#A87A6B',delay:0}, {zh:t.eventsZh,en:t.eventsEn,desc:t.eventsDesc,iconId:'ic-calendar',color:'#5E7A8C',delay:100} ];

    // holistic
    const H=this.holisticData();
    const ANN_URL='https://script.google.com/a/macros/h.tmu.edu.tw/s/AKfycby2MW_ys1HQsgsgb_HnP0gKucbWONkN_cA_aFM3P98GJCS6f5B0JP4zTmiDeEVMjgnB/exec';
    const announcements=[
      { pinned:true, tagZh:'置頂', tagEn:'Pinned', statTop:'Q1', statTopLabel:isZh?'期刊分區':'Journal Q', statBot:'IF 10.3', statBotLabel:isZh?'影響係數':'Impact factor',
        titleZh:'學術發表與國際舞台', titleEn:'Scholarship & the international stage',
        linesZh:['THSS 外科論文獲頂尖國際期刊 International Journal of Surgery 收錄（Q1，IF 10.3）。','國際研討會 AMEE×3、ISQua×3；','ISQua 2026 取得 30 分鐘專場，以 Virtual Patient 人機互動探討罕病 Calciphylaxis 之疼痛控制，獲主辦方來信肯定。'],
        linesEn:['A THSS surgical paper accepted by the top journal International Journal of Surgery (Q1, IF 10.3).','International conferences: AMEE ×3, ISQua ×3;','ISQua 2026 granted a 30-min session using a Virtual Patient to explore pain control in the rare disease Calciphylaxis, praised by the organizers.'] },
      { pinned:false, tagZh:'公告', tagEn:'News', statTop:'56', statTopLabel:isZh?'人參與':'attendees',
        titleZh:'歐洲虛擬醫院跨域交流', titleEn:'Cross-border exchange with a European virtual hospital',
        linesZh:['捷克馬薩里克大學（Masaryk University）虛擬醫學部 Tereza Vafkova 副主任來校專題演講。','56 位醫師、教授與研究人員線上線下參與，深化全人照護與 AI 輔助教學交流，強化「健康臺灣深耕計畫」國際合作。'],
        linesEn:['Deputy Director Tereza Vafkova of the virtual medical faculty at Masaryk University (Czechia) gave a campus keynote.','56 physicians, professors and researchers joined online and in person, deepening holistic-care and AI-assisted teaching exchange under the Healthy Taiwan initiative.'] },
      { pinned:false, tagZh:'公告', tagEn:'News', statTop:'112.05.01', statTopLabel:isZh?'成立日':'Founded', small:true,
        titleZh:'全人照護教育中心正式成立', titleEn:'The Center is officially established',
        linesZh:['依《全人照護教育中心設置要點》於教學部成立；','以勝任能力為導向，推動全人照護、靈性關懷與醫學人文之教學實踐及應用研究，並以教育與研究輔助院內各單位提升全人照護品質。'],
        linesEn:['Established within the Dept. of Medical Education under the Center\'s founding charter;','Competency-oriented, advancing teaching practice and applied research in holistic care, spiritual care and medical humanities, supporting every unit in raising holistic-care quality.'] },
    ].map((a,i)=>({ ...a, tag:isZh?a.tagZh:a.tagEn, title:isZh?a.titleZh:a.titleEn, lines:isZh?a.linesZh:a.linesEn,
      tagColor:a.pinned?'#B07A4A':'#4f8c7d', tagBg:a.pinned?'color-mix(in srgb,#B07A4A 14%,transparent)':'color-mix(in srgb,#4f8c7d 13%,transparent)',
      statFont:a.small?'26px':'40px', delay:i*70 }));
    const annNote=isZh?'中心與教學部的最新訊息。未來與活動管理平台串接後，將自動顯示「對外看板」的公告。':'Latest news from the center and department. Once linked to the activity platform, the public board will appear here automatically.';
    const activities=[
      { catZh:'全人教師發展課程', catEn:'Holistic Faculty Development', titleZh:'停下來，是最負責任的事', titleEn:'To pause is the most responsible act',
        dateZh:'2026/07/22（三）12:30–13:30', dateEn:'Wed 2026/07/22 12:30–13:30', placeZh:'線上視訊', placeEn:'Online',
        speakerZh:'北醫附醫精神科 鐘國軒主任', speakerEn:'Dir. Kuo-Hsuan Chung, Psychiatry, TMUH', topicZh:'教師的全人自我觀照', topicEn:'Teachers\' whole-person self-reflection',
        enrolledZh:'已報名 0 人', enrolledEn:'0 enrolled', statusZh:'TMS 5416', statusEn:'TMS 5416', link:'https://tms2.tmu.edu.tw/epf/dashboard/creditStatistics/courseRecords/5416' },
    ].map(a=>({ cat:isZh?a.catZh:a.catEn, title:isZh?a.titleZh:a.titleEn, date:isZh?a.dateZh:a.dateEn, place:isZh?a.placeZh:a.placeEn, speaker:isZh?a.speakerZh:a.speakerEn, topic:isZh?a.topicZh:a.topicEn, enrolled:isZh?a.enrolledZh:a.enrolledEn, status:isZh?a.statusZh:a.statusEn, link:a.link||'', hasLink:!!a.link, noLink:!a.link }));
    const actNote=isZh?'課程、講座與培訓資訊。未來將與「教學部活動管理平台」即時串接，自動顯示最新活動並開放線上報名。':'Courses, talks and training. Will connect live to the department activity platform, auto-showing events with online registration.';
    const holisticRaw = centersRaw.find(c=>c.id==='holistic');
    const holisticMembers = holisticRaw ? holisticRaw.people.map(p=>resolveP(p,'#4f8c7d')) : [];
    const hMembersTitle = isZh?'中心成員':'Center Members';
    const hKpis=[ {num:2,label:isZh?'MHFA 指導員':'MHFA Instructors',color:'#5E7A8C'},
      {num:11,label:isZh?'MHFA 種子教師':'MHFA Seed Teachers',color:'#B69B66'},
      {num:142,label:isZh?'全人種子教師':'Holistic Seed Teachers',color:'#4f8c7d'},
      {display:'?',label:isZh?'發表論文':'Publications',color:'#A87A6B'} ]
      .map(k=>({ num:k.num||0, suffix:'', display:k.display||'', numDisplay:k.display==null?'inline':'none', staticDisplay:k.display==null?'none':'inline', label:k.label, color:k.color }));
    const hFeatures=[ {iconId:'ic-brain',title:isZh?'心理健康急救':'Mental Health First Aid',desc:isZh?'引進國際 MHFA 課程，培訓同仁辨識、陪伴並適時轉介需要協助的人。':'International MHFA training to recognize, accompany and refer those who need help.',delay:0},
      {iconId:'ic-sprout',title:isZh?'種子教師培育':'Seed Teacher Cultivation',desc:isZh?'集結護理、醫師、藥劑、社工、心理、語言治療等跨領域人才，將關懷文化向下扎根。':'Bringing together nursing, medicine, pharmacy, social work, psychology and more to root a culture of care.',delay:100},
      {iconId:'ic-network',title:isZh?'跨科部協作':'Cross-Department Collaboration',desc:isZh?'串連臨床各單位與校園資源，打造彼此支持、能即時伸出援手的健康職場。':'Linking clinical units and campus resources into a supportive, responsive, healthy workplace.',delay:200},
      {iconId:'ic-team',title:isZh?'全人教育小組':'Holistic Education Working Group',desc:isZh?'跨越西醫、中醫、牙醫與各醫事職類，組成專責團隊，共同鑽研全人照護教案設計與教學發展，讓全人精神在每個專業領域生根。':'A dedicated cross-professional team — uniting Western medicine, TCM, dentistry and all allied-health roles — to co-develop holistic-care teaching cases and curricula across every discipline.',delay:300} ];
    const featHover=(on)=>(e)=>this.hover(e.currentTarget,on,-6);
    hFeatures.forEach(f=>{ f.enter=featHover(true); f.leave=featHover(false); });

    const algeeList=this.ALGEE.map((a,i)=>{ const on=i===algee; return { letter:a.l, onClick:()=>this.setAlgee(i),
      tabBg: on?'var(--surface)':'transparent', tabColor: on?'var(--teal)':'var(--muted)', bar: on?'var(--teal)':'transparent', dot: i<=algee?'var(--teal)':'var(--border)' }; });
    const aa=this.ALGEE[algee]; const activeAlgee={ letter:aa.l, step:algee+1, title:isZh?aa.zh[0]:aa.en[0], desc:isZh?aa.zh[1]:aa.en[1] };

    // ===== Faculty Development deep page =====
    const P = this.P.bind(this);
    const FD_INK='#3A2E25', FD_CLAY='#A87A6B', FD_CLAY_SOFT='#C49A8C', FD_SAGE='#8FA898', FD_BLUE='#7A95A8', FD_OCHRE='#B69B66';
    const fdRaw = centersRaw.find(c=>c.id==='faculty_dev');
    const fdMembers = fdRaw ? fdRaw.people.map(p=>resolveP(p,FD_CLAY)) : [];
    const fdKpis=[ {num:102,suffix:'',zh:'\u7a2e\u5b50\u6559\u5e2b',en:'Seed Teachers',color:FD_CLAY},
      {num:125,suffix:'',zh:'\u5408\u8058\u6559\u8077',en:'Joint Appointments',color:FD_BLUE},
      {num:6,suffix:'',zh:'114 \u5b78\u5e74\u65b0\u8058\u6559\u8077',en:'New Appointments (AY114)',color:FD_SAGE},
      {num:6,suffix:'',zh:'\u516d\u5927\u57f9\u80b2\u5c0f\u7d44',en:'Cultivation Groups',color:FD_OCHRE} ];
    const fdServices=[
      {icon:'ic-cap', tone:FD_CLAY, zh:'\u5168\u9662\u81e8\u5e8a\u6559\u5e2b\u767c\u5c55\u8207\u57f9\u8a13', en:'Hospital-wide Faculty Development & Training',
        descZh:'\u4f9d\u91ab\u7b56\u6703\uff08JCT\uff09\u898f\u7bc4\u8207\u91ab\u9662\u8a55\u9451\u8981\u6c42\uff0c\u898f\u5283\u7cfb\u7d71\u6027\u3001\u5206\u5c64\u7684\u5e2b\u8cc7\u57f9\u80b2\u8ab2\u7a0b\uff0c\u57f9\u8a13\u5168\u9662\u897f\u91ab\u3001\u4e2d\u91ab\u3001\u7259\u91ab\u53ca\u5404\u91ab\u4e8b\u8077\u985e\u81e8\u5e8a\u6559\u5e2b\uff0c\u5960\u5b9a\u7d2e\u5be6\u7684\u6559\u5b78\u77e5\u80fd\u57fa\u790e\u3002',
        descEn:'Systematic, tiered faculty-training curricula aligned with JCT standards and hospital accreditation, covering clinical teachers across Western medicine, TCM, dentistry and all allied-health roles.'},
      {icon:'ic-award', tone:FD_BLUE, zh:'\u6559\u8077\u65b0\u8058\u8207\u5347\u7b49\u696d\u52d9', en:'Academic Appointment & Promotion',
        descZh:'\u5354\u52a9\u81e8\u5e8a\u4eba\u54e1\u7533\u8acb\u81fa\u5317\u91ab\u5b78\u5927\u5b78\u6559\u8077\uff08\u65b0\u8058\uff09\u8207\u8077\u7d1a\u5347\u7b49\uff0c\u63d0\u4f9b\u8cc7\u683c\u8ad6\u8a3a\u3001\u6587\u4ef6\u5be9\u67e5\u8207\u6d41\u7a0b\u5354\u52a9\uff0c\u9298\u63a5\u81e8\u5e8a\u670d\u52d9\u8207\u5b78\u8853\u767c\u5c55\u3002',
        descEn:'Guiding clinical staff through TMU academic-appointment and promotion applications \u2014 eligibility advice, document review and process support that bridges clinical service and scholarship.'},
      {icon:'ic-bulb', tone:FD_OCHRE, zh:'\u6559\u5b78\u8b80\u66f8\u6703\u8207\u734e\u9805\u8a55\u9078', en:'Teaching Journal Club & Awards',
        descZh:'\u6bcf\u6708\u8209\u8fa6\u6559\u5b78\u8b80\u66f8\u6703\uff0c\u6df1\u5316\u6559\u5b78\u77e5\u80fd\u4ea4\u6d41\uff1b\u6bcf\u5e74\u8fa6\u7406\u300c\u512a\u826f\u6559\u5e2b\u734e\u300d\u8207\u300c\u6559\u5b78\u5275\u65b0\u734e\u300d\u8a55\u9078\uff0c\u8868\u63da\u5353\u8d8a\u6559\u5b78\u8207\u5275\u65b0\u6559\u6cd5\uff0c\u71df\u9020\u91cd\u8996\u6559\u5b78\u7684\u9662\u5167\u6587\u5316\u3002',
        descEn:'Monthly teaching journal clubs deepen pedagogical exchange; annual Outstanding Teacher and Teaching Innovation awards celebrate excellence and nurture a teaching-valued culture.'},
      {icon:'ic-clipboard', tone:FD_SAGE, zh:'\u6559\u5e2b\u767c\u5c55\u59d4\u54e1\u6703', en:'Faculty Development Committee',
        descZh:'\u6bcf\u5b63\u53ec\u958b\u4e00\u6b21\u59d4\u54e1\u6703\uff0c\u8ffd\u8e64\u5168\u9662\u81e8\u5e8a\u6559\u5e2b\u57f9\u8a13\u5b8c\u6210\u72c0\u6cc1\uff0c\u6aa2\u8996\u91ab\u9662\u6574\u9ad4\u6559\u5b78\u6210\u6548\uff0c\u4e26\u64da\u4ee5\u6efe\u52d5\u4fee\u6b63\u5e2b\u8cc7\u767c\u5c55\u7b56\u7565\u3002',
        descEn:'Quarterly committee meetings track faculty-training completion across the hospital, review overall teaching effectiveness, and iteratively refine development strategy.'} ];
    const fdGroups=[
      {zh:'CBME\u2013\u8ab2\u7a0b\u7d44', en:'CBME \u00b7 Curriculum', tone:FD_CLAY, p:fdRaw&&P('\u90b1\u6b23\u6021','Hsin-Yi Chiu','lead','\u897f\u91ab \u00b7 \u52a9\u7406\u6559\u6388','Physician \u00b7 Asst. Prof.','hsin-yi-chiu','hsin-yi-chiu'),
        descZh:'\u898f\u5283\u4ee5\u52dd\u4efb\u80fd\u529b\u70ba\u5c0e\u5411\uff08CBME\uff09\u7684\u8ab2\u7a0b\u8a2d\u8a08\u8207\u91cc\u7a0b\u7891\u67b6\u69cb\u3002', descEn:'Competency-based curriculum design and milestone frameworks.'},
      {zh:'CBME\u2013\u8a55\u91cf\u7d44', en:'CBME \u00b7 Assessment', tone:FD_BLUE, p:fdRaw&&P('\u5433\u653f\u8aa0','Jeng-Cheng Wu','lead','\u897f\u91ab \u00b7 \u52a9\u7406\u6559\u6388','Physician \u00b7 Asst. Prof.','jeng-cheng-wu','jeng-cheng-wu'),
        descZh:'\u767c\u5c55 Mini-CEX\u3001DOPS\u3001CbD \u7b49\u8a55\u91cf\u5de5\u5177\u8207 EPA \u4fe1\u6548\u5ea6\u5206\u6790\u3002', descEn:'Mini-CEX, DOPS, CbD tools and EPA reliability/validity analysis.'},
      {zh:'\u6c38\u7e8c\u97cc\u6027\u7d44', en:'Sustainability & Resilience', tone:FD_SAGE, p:fdRaw&&P('\u9673\u5efa\u5b87','Chien-Yu Chen','lead','\u897f\u91ab \u00b7 \u6559\u6388','Physician \u00b7 Professor','chien-yu-chen','chien-yu-chen'),
        descZh:'\u63a8\u52d5\u6559\u5e2b\u8eab\u5fc3\u6c38\u7e8c\u8207\u8077\u5834\u97cc\u6027\uff0c\u6df1\u5316\u6559\u5b78\u71b1\u60c5\u8207\u8077\u6daf\u767c\u5c55\u3002', descEn:'Faculty wellbeing, workplace resilience and career development.'},
      {zh:'\u79d1\u6280\u8f14\u5c0e\u6559\u5b78\u7d44', en:'Technology-Enhanced Teaching', tone:FD_OCHRE, p:fdRaw&&P('\u5433\u4eba\u5091','Jen-Chieh Wu','lead','\u897f\u91ab \u00b7 \u52a9\u7406\u6559\u6388','Physician \u00b7 Asst. Prof.','jen-chieh-wu','jen-chieh-wu'),
        descZh:'\u5c0e\u5165\u6578\u4f4d\u8207\u6a21\u64ec\u79d1\u6280\u8f14\u52a9\u6559\u5b78\uff0c\u63d0\u5347\u6559\u5b78\u4e92\u52d5\u8207\u5b78\u7fd2\u6210\u6548\u3002', descEn:'Digital and simulation technology to enhance teaching and learning.'},
      {zh:'\u5be6\u8b49\u91ab\u5b78\u7d44', en:'Evidence-Based Medicine', tone:'#9C6F8E', p:fdRaw&&P('\u6797\u79c0\u771f','Hsiu-Chen Lin','lead','\u897f\u91ab \u00b7 \u526f\u6559\u6388','Physician \u00b7 Assoc. Prof.','hsiu-chen-lin','hsiu-chen-lin'),
        descZh:'\u5c07\u5be6\u8b49\u91ab\u5b78\u7cbe\u795e\u878d\u5165\u6559\u5b78\uff0c\u57f9\u990a\u5e2b\u751f\u5be6\u8b49\u67e5\u8b49\u8207\u61c9\u7528\u80fd\u529b\u3002', descEn:'Embedding evidence-based medicine into teaching practice.'},
      {zh:'\u5168\u4eba\u7167\u8b77\u7d44', en:'Holistic Care', tone:'#6E8A77', p:fdRaw&&P('\u5ed6\u82e5\u5e06','Faith Ruofan Liao','lead','\u8b77\u7406 \u00b7 \u526f\u6559\u6388','Nursing \u00b7 Assoc. Prof.','faith-ruofan-liao','faith-ruofan-liao'),
        descZh:'\u767c\u5c55\u5168\u4eba\u7167\u8b77\u6559\u6848\u8207\u8de8\u8077\u985e\u6559\u5b78\uff0c\u843d\u5be6\u4ee5\u4eba\u70ba\u672c\u7684\u91ab\u5b78\u6559\u80b2\u3002', descEn:'Holistic-care teaching cases and cross-professional education.'} ];
    const facdev={ ink:FD_INK, clay:FD_CLAY, claySoft:FD_CLAY_SOFT, sage:FD_SAGE, blue:FD_BLUE,
      eyebrow:'Faculty Development Center',
      heroTitle:isZh?'\u6210\u5c31\u6bcf\u4e00\u4f4d\u5353\u8d8a\u7684\u81e8\u5e8a\u6559\u5e2b':'Cultivating every outstanding clinical teacher',
      heroTag:isZh?'\u4ee5\u5e2b\u8cc7\u57f9\u80b2\u70ba\u6839\u672c\uff0c\u4e32\u9023\u8ab2\u7a0b\u3001\u8a55\u91cf\u3001\u6559\u8077\u8207\u734e\u52f5\u6a5f\u5236\uff0c\u6253\u9020\u5168\u9662\u8de8\u8077\u985e\u7684\u6559\u5b78\u5353\u8d8a\u6587\u5316\u3002':'Rooted in faculty cultivation \u2014 weaving together curriculum, assessment, appointments and recognition to build a hospital-wide culture of teaching excellence.',
      aboutEyebrow:isZh?'\u4e2d\u5fc3\u5b9a\u4f4d\u8207\u4f7f\u547d':'Mission & Positioning',
      aboutTitle:isZh?'\u4ee5\u6559\u5e2b\u767c\u5c55\uff0c\u6210\u5c31\u91ab\u5b78\u6559\u80b2':'Faculty growth, the root of medical education',
      aboutBody:isZh?'\u6559\u5e2b\u767c\u5c55\u4e2d\u5fc3\u96b8\u5c6c\u65bc\u6559\u5b78\u90e8\uff0c\u7531\u9673\u660e\u5fb7\u4e3b\u4efb\u5e36\u9818\u5718\u968a\uff0c\u8ca0\u8cac\u5168\u9662\u81e8\u5e8a\u6559\u5e2b\u7684\u57f9\u80b2\u8207\u5b78\u6821\u6559\u8077\u76f8\u95dc\u4e8b\u52d9\uff0c\u4ee5\u7cfb\u7d71\u6027\u8ab2\u7a0b\u3001\u8a55\u9451\u9075\u5faa\u8207\u59d4\u54e1\u6703\u6a5f\u5236\uff0c\u6301\u7e8c\u63d0\u5347\u6574\u9ad4\u6559\u5b78\u54c1\u8cea\u8207\u5e2b\u8cc7\u5c08\u696d\u767c\u5c55\u3002':'Within the Department of Medical Education, Director Ming-De Chen leads a team responsible for hospital-wide faculty cultivation and academic-appointment affairs \u2014 systematic curricula, accreditation alignment and a committee mechanism that continually raises teaching quality.',
      aboutBody2:isZh?'\u4e0b\u8a2d\u516d\u5927\u6559\u5b78\u57f9\u80b2\u5c0f\u7d44\uff0c\u4e32\u9023 CBME\u3001\u6c38\u7e8c\u97cc\u6027\u3001\u79d1\u6280\u6559\u5b78\u3001\u5be6\u8b49\u91ab\u5b78\u8207\u5168\u4eba\u7167\u8b77\uff0c\u8b93\u6559\u5b78\u5c08\u696d\u5728\u5404\u9818\u57df\u751f\u6839\u3002':'Six cultivation groups span CBME, sustainability, technology-enhanced teaching, evidence-based medicine and holistic care \u2014 rooting pedagogical expertise across every domain.',
      membersTitle:isZh?'\u4e2d\u5fc3\u6210\u54e1':'Center Members',
      servicesEyebrow:isZh?'\u4e2d\u5fc3\u6838\u5fc3\u696d\u52d9':'Core Services', servicesTitle:isZh?'\u56db\u5927\u6838\u5fc3\u696d\u52d9':'Four Core Services',
      servicesDesc:isZh?'\u5f9e\u57f9\u8a13\u3001\u6559\u8077\u3001\u8b80\u66f8\u6703\u5230\u59d4\u54e1\u6703\uff0c\u5168\u65b9\u4f4d\u652f\u63f4\u81e8\u5e8a\u6559\u5e2b\u7684\u5c08\u696d\u6210\u9577\u3002':'From training and appointments to journal clubs and committee oversight \u2014 supporting clinical teachers at every step.',
      groupsEyebrow:isZh?'\u6559\u5b78\u57f9\u80b2\u7d44\u7e54':'Cultivation Structure', groupsTitle:isZh?'\u516d\u5927\u6559\u5b78\u57f9\u80b2\u5c0f\u7d44':'Six Teaching Cultivation Groups',
      groupsDesc:isZh?'\u516d\u500b\u5c08\u8cac\u5c0f\u7d44\u5404\u53f8\u5176\u8077\u3001\u4e92\u76f8\u5354\u4f5c\uff0c\u5171\u540c\u6df1\u5316\u5168\u9662\u6559\u5b78\u57f9\u80b2\u7684\u5404\u500b\u9762\u5411\u3002':'Six dedicated groups, each with its own focus, jointly deepening every dimension of hospital-wide faculty cultivation.',
      groupRoot:isZh?'\u6559\u5e2b\u767c\u5c55\u4e2d\u5fc3':'Faculty Development Center',
      groupLeadLabel:isZh?'\u8ca0\u8cac\u4eba':'Lead',
      newsEyebrow:'Announcements', newsTitle:isZh?'\u6700\u65b0\u516c\u544a':'Latest News',
      actEyebrow:'Activities', actTitle:isZh?'\u8fd1\u671f\u6d3b\u52d5':'Activities',
      reservedNote:isZh?'\u6b64\u5340\u584a\u5df2\u9810\u7559\u7d66\u4e2d\u5fc3\u6700\u65b0\u516c\u544a\u8207\u8fd1\u671f\u6d3b\u52d5\u3002\u672a\u4f86\u8207\u6d3b\u52d5\u7ba1\u7406\u5e73\u53f0\u4e32\u63a5\u5f8c\uff0c\u5c07\u81ea\u52d5\u986f\u793a\u300c\u5c0d\u5916\u770b\u677f\u300d\u7684\u516c\u544a\u8207\u5831\u540d\u8cc7\u8a0a\u3002':'This space is reserved for the center\u2019s latest news and activities. Once linked to the activity-management platform, the public board\u2019s announcements will appear here automatically.',
      reservedTag:isZh?'\u5167\u5bb9\u5efa\u7f6e\u4e2d':'Coming soon',
      closingTitle:isZh?'\u597d\u7684\u6559\u5e2b\uff0c\u662f\u91ab\u5b78\u6559\u80b2\u6700\u6df1\u7684\u6839\u57fa':'Great teachers are the deepest roots of medical education',
      closingBody:isZh?'\u6559\u5e2b\u767c\u5c55\u4e2d\u5fc3\u4ee5\u7cfb\u7d71\u6027\u57f9\u80b2\u3001\u6559\u8077\u652f\u6301\u8207\u516d\u5927\u5c0f\u7d44\u5354\u4f5c\uff0c\u9678\u7e8c\u5354\u52a9\u5168\u9662\u8de8\u8077\u985e\u6559\u5e2b\u6210\u9577\uff0c\u70ba\u91ab\u5b78\u6559\u80b2\u7684\u6c38\u7e8c\u767c\u5c55\u624e\u4e0b\u6df1\u539a\u6839\u57fa\u3002':'Through systematic cultivation, appointment support and six collaborating groups, the Center helps clinical teachers across all professions grow \u2014 laying deep roots for the sustainable future of medical education.',
      contactPerson:isZh?'\u884c\u653f\u5c08\u54e1\uff1a\u9673\u5747\u8339':'Administrator: Chun-Ju Chen', contactExt:isZh?'\u5206\u6a5f 3757':'Ext. 3757',
      contactPlace:isZh?'\u81fa\u5317\u91ab\u5b78\u5927\u5b78\u9644\u8a2d\u91ab\u9662 \u00b7 \u6559\u5b78\u90e8 \u6559\u5e2b\u767c\u5c55\u4e2d\u5fc3':'TMU Hospital \u00b7 Faculty Development Center, Dept. of Medical Education',
      contactQuote:isZh?'\u6210\u5c31\u6559\u5e2b\uff0c\u5c31\u662f\u6210\u5c31\u6bcf\u4e00\u4f4d\u672a\u4f86\u7684\u91ab\u7642\u4eba\u624d\u3002':'To grow a teacher is to grow every future caregiver.',
      members:fdMembers,
      kpis:fdKpis.map((k,i)=>({...k, label:isZh?k.zh:k.en, delay:i*70})),
      services:fdServices.map(s=>({...s, title:isZh?s.zh:s.en, desc:isZh?s.descZh:s.descEn})),
      groups:fdGroups.map(g=>{ const rp=resolveP(g.p,g.tone); return {...g, name:isZh?g.zh:g.en, desc:isZh?g.descZh:g.descEn, leadName:rp.fullname, leadSub:rp.sub, leadRole:rp.role, leadImgRef:rp.imgRef, leadHasPhoto:rp.hasPhoto, leadNoPhoto:rp.noPhoto, leadInitials:rp.initials }; }) };

    // ===== EBM (Evidence-Based Medicine) deep page =====
    const EBM_INK='#26303B', EBM_GOLD='#B0894B', EBM_GOLD_SOFT='#C4A268', EBM_BLUE='#5E7A8C';
    const ebmRaw = centersRaw.find(c=>c.id==='ebm');
    const ebmMembers = ebmRaw ? ebmRaw.people.map(p=>resolveP(p,EBM_GOLD)) : [];
    const ebmKpis=[ {num:20,suffix:'+',zh:'\u5e74\u5be6\u8b49\u6df1\u8015',en:'Years since 2004',color:EBM_GOLD},
      {num:4,suffix:'',zh:'\u5927\u6838\u5fc3\u4efb\u52d9',en:'Core Missions',color:EBM_BLUE},
      {num:15,suffix:'+',zh:'\u5e74 NHQA \u6301\u7e8c\u53c3\u8207',en:'Years at NHQA',color:'#6E8A77'},
      {num:3,suffix:'',zh:'\u5927\u7af6\u8cfd\u7d44\u5225',en:'Contest Tracks',color:'#A87A6B'} ];
    const ebmMissions=[
      {tag:'01', zh:'NHQA\uff08\u73fe\u70ba NCMEA\uff09\u5be6\u8b49\u91ab\u5b78\u7af6\u8cfd', en:'NHQA / NCMEA EBM Contest',
        descZh:'\u7a4d\u6975\u53c3\u8207\u570b\u5bb6\u91ab\u7642\u54c1\u8cea\u734e\uff08NHQA\uff09\u5be6\u8b49\u91ab\u5b78\u985e\u7af6\u8cfd\uff0c\u81ea\u6c11\u570b 109 \u5e74\u69ae\u7372\u91d1\u734e\u53ca\u6f5b\u529b\u734e\uff0c110 \u5e74\u66f4\u7372\u9812\u300c\u6301\u7e8c\u53c3\u8207\u7279\u5225\u734e\uff0815 \u5e74\uff09\u300d\u3002',
        descEn:'Competing in the National Healthcare Quality Award (NHQA) EBM category \u2014 Gold and Potential Awards in 2020, and a 15-year Sustained Participation Award in 2021.'},
      {tag:'02', zh:'\u5be6\u8b49\u91ab\u5b78\u7814\u8a0e\u6703\u6295\u7a3f', en:'EBM Conference Submissions',
        descZh:'\u9f13\u52f5\u5168\u9662\u5404\u8077\u985e\u91ab\u7642\u4eba\u54e1\u5171\u540c\u53c3\u8207\u8ad6\u6587\u6295\u7a3f\uff0c\u4fc3\u9032\u9662\u5167\u5916\u5b78\u8853\u4ea4\u6d41\uff0c\u63d0\u5347\u5be6\u8b49\u91ab\u5b78\u9818\u57df\u7684\u80fd\u898b\u5ea6\u8207\u5f71\u97ff\u529b\u3002',
        descEn:'Encouraging staff across all disciplines to submit papers, fostering academic exchange and raising the hospital\u2019s visibility in evidence-based medicine.'},
      {tag:'03', zh:'EBQI \u54c1\u8cea\u6539\u5584\u5c08\u6848', en:'EBQI Quality Improvement',
        descZh:'\u5c0e\u5165\u300c\u5be6\u8b49\u91ab\u5b78\u6539\u5584\u91ab\u7642\u54c1\u8cea\u65b9\u6848\uff08EBQI\uff09\u300d\uff0c\u8de8\u9818\u57df\u767c\u6398\u81e8\u5e8a\u554f\u984c\uff0c\u900f\u904e\u5be6\u8b49\u65b9\u6cd5\u5c07\u7814\u7a76\u8b49\u64da\u8f49\u5316\u70ba\u5be6\u969b\u7684\u91ab\u7642\u54c1\u8cea\u6539\u5584\u884c\u52d5\u3002',
        descEn:'Evidence-Based Quality Improvement (EBQI) turns clinical problems into solutions across departments, translating research evidence into real quality gains.'},
      {tag:'04', zh:'\u5be6\u8b49\u91ab\u5b78\u6559\u80b2\u57f9\u8a13', en:'EBM Education & Training',
        descZh:'\u5b9a\u671f\u8fa6\u7406\u591a\u5c64\u6b21\u5be6\u8b49\u91ab\u5b78\u80fd\u529b\u57f9\u8a13\u8ab2\u7a0b\uff0c\u6db5\u84cb\u521d\u968e\u81f3\u9032\u968e\uff0c\u4e26\u8207\u5716\u66f8\u9928\u8cc7\u8a0a\u90e8\u9580\u5408\u4f5c\u8fa6\u7406\u6587\u737b\u6aa2\u7d22\u8ab2\u7a0b\u3002',
        descEn:'Multi-level EBM training from beginner to advanced, with literature-search courses run alongside the library and information department.'} ];
    const ebmAwardsLit=[
      {sess:isZh?'\u7b2c 7 \u5c46':'7th', award:isZh?'\u9280\u734e':'Silver', tone:'#9AA0A6'},
      {sess:isZh?'\u7b2c 14 \u30fb15 \u5c46':'14th \u00b7 15th', award:isZh?'\u6f5b\u529b\u734e':'Potential', tone:'#6E8A77'},
      {sess:isZh?'\u7b2c 16 \u30fb21 \u5c46':'16th \u00b7 21st', award:isZh?'\u91d1\u734e':'Gold', tone:EBM_GOLD},
      {sess:isZh?'\u7b2c 22 \u5c46':'22nd', award:isZh?'15 \u5e74\u4ee5\u4e0a\u6301\u7e8c\u53c3\u8207\u7279\u5225\u734e':'15-yr Sustained', tone:EBM_BLUE} ];
    const ebmAwardsClin=[
      {sess:isZh?'\u7b2c 10 \u5c46':'10th', award:isZh?'\u6f5b\u529b\u734e':'Potential', tone:'#6E8A77', note:''},
      {sess:isZh?'\u7279\u5225\u734e\u9805':'Special', award:isZh?'\u91d1\u734e':'Gold', tone:EBM_GOLD, note:isZh?'\u5168\u8179\u819c\u5916\u5167\u8996\u93e1\u8179\u80a1\u6e9d\u75dd\u6c23\u4fee\u88dc\u624b\u8853\u4e4b\u4eba\u5de5\u7db2\u818c\u56fa\u5b9a\u6539\u5584\u5c08\u6848':'Mesh fixation improvement in TEP inguinal hernia repair'},
      {sess:isZh?'\u7b2c 12 \u5c46':'12th', award:isZh?'\u6f5b\u529b\u734e':'Potential', tone:'#6E8A77', note:isZh?'\u9810\u9632\u6027\u6295\u8207\u985e\u56fa\u9187\u4ee5\u6539\u5584\u5168\u8eab\u9ebb\u9189\u624b\u8853\u5f8c\u4e4b\u5191\u5fc3\u5614\u5410\u5c08\u6848':'Prophylactic steroids to reduce post-anesthesia nausea & vomiting'} ];
    const ebmAwardsTrans=[
      {sess:isZh?'113 學年起':'From AY113', award:isZh?'新增參與':'Newly Joined', tone:'#7A95A8', note:isZh?'自 113 學年度起參與 NCMEA 知識轉譯組競賽，拓展實證應用新面向。':'Joined the NCMEA Knowledge-Translation track from AY113, opening a new dimension of evidence application.'},
      {sess:isZh?'推動重點':'Focus', award:isZh?'證據轉化':'Translation', tone:'#6E8A77', note:isZh?'以每月「實證醫學知識轉譯討論會」為基礎，推動證據轉化為臨床決策。':'Built on the monthly knowledge-translation forum, turning evidence into clinical decisions.'} ];
    const ebmStages=[
      {phase:isZh?'\u7b2c\u4e00\u968e\u6bb5':'Phase 1', name:isZh?'\u5960\u57fa\u968e\u6bb5':'Foundation', years:isZh?'\u6c11\u570b 93\u2013103 \u5e74':'2004\u20132014', color:EBM_GOLD,
        items:isZh?['\u6b63\u5f0f\u6210\u7acb\u5be6\u8b49\u91ab\u5b78\u4e2d\u5fc3\uff0c\u5236\u5b9a\u9662\u5167\u63a8\u52d5\u5236\u5ea6\u67b6\u69cb','\u91dd\u5c0d R\u3001PGY\u3001UGY \u53ca\u5404\u985e\u91ab\u4e8b\u4eba\u54e1\u958b\u8a2d\u9069\u5207\u8ab2\u7a0b','\u5b9a\u671f\u8209\u8fa6 EBM Journal Club\uff0c\u5efa\u7acb\u81e8\u5e8a\u8a0e\u8ad6\u6587\u5316','\u63a8\u52d5 Clinical based\u2013PBL\u2013EBM \u6574\u5408\u8ab2\u7a0b']:['Founded the EBM Center and its hospital-wide framework','Tailored courses for residents (R), PGY, UGY and allied health','Regular EBM Journal Club to build a clinical-discussion culture','Clinical-based PBL-EBM integrated curriculum']},
      {phase:isZh?'\u7b2c\u4e8c\u968e\u6bb5':'Phase 2', name:isZh?'\u64f4\u5c55\u968e\u6bb5':'Expansion', years:isZh?'\u6c11\u570b 104\u2013107 \u5e74':'2015\u20132018', color:EBM_BLUE,
        items:isZh?['\u9996\u5ea6\u5354\u8fa6\u300c\u5317\u91ab\u9ad4\u7cfb\u4e00\u6821\u4e09\u9662\u5be6\u8b49\u91ab\u5b78\u7af6\u8cfd\u300d','\u8fa6\u7406\u9662\u5167\u7af6\u8cfd\u6210\u679c\u767c\u8868\u6703','\u53c3\u8207\u81fa\u7063\u5be6\u8b49\u91ab\u5b78\u5b78\u6703\uff0c\u7531\u9662\u5167\u4eba\u54e1\u906e\u9078\u70ba\u7406\u76e3\u4e8b','\u5354\u52a9\u91ab\u7b56\u6703\u8209\u8fa6\u6587\u737b\u67e5\u8b49\u7af6\u8cfd']:['Co-hosted the TMU system one-university-three-hospital EBM contest','Held in-hospital contest result presentations','Active in the Taiwan EBM Association; elected to its board','Assisted the JCT in running literature-appraisal contests']},
      {phase:isZh?'\u7b2c\u4e09\u968e\u6bb5':'Phase 3', name:isZh?'\u6df1\u5316\u968e\u6bb5':'Deepening', years:isZh?'\u6c11\u570b 108\u2013\u81f3\u4eca':'2019\u2013Present', color:'#6E8A77',
        items:isZh?['108 \u5e74\u8209\u8fa6\u300c\u5be6\u8b49\u6559\u5b78\u8207\u81e8\u5e8a\u61c9\u7528\u767c\u8868\u6703\u300d','111\u2013113 \u5e74\u6bcf\u5e74\u8209\u8fa6\u5be6\u8b49\u91ab\u5b78\u80fd\u529b\u7af6\u8cfd\u66a8\u6210\u679c\u767c\u8868\u6703','\u6301\u7e8c\u53c3\u8207\u570b\u969b\u5be6\u8b49\u91ab\u5b78\u5b78\u8853\u6d3b\u52d5','\u7c4c\u8a2d\u300c\u81fa\u5317\u91ab\u5b78\u5927\u5b78\u8003\u79d1\u85cd\u81fa\u7063\u6821\u7d1a\u7814\u7a76\u4e2d\u5fc3\u300d']:['2019 \u201cEBM Teaching & Clinical Application\u201d showcase','Annual EBM competency contests, 2022\u20132024','Ongoing participation in international EBM activities','Establishing the Cochrane Taiwan university research center']} ];
    const ebmCourseGroups=[
      {gicon:'ic-chart', title:isZh?'\u7cfb\u7d71\u6027\u8ab2\u7a0b':'Systematic Courses', color:EBM_GOLD,
        rows:isZh?[['\u5be6\u8b49\u91ab\u5b78 Meta-analysis \u5e36\u72c0\u8ab2\u7a0b','\u6bcf\u6708 1 \u5802\u30fb\u5168\u5e74\u6301\u7e8c'],['\u6587\u737b\u67e5\u8b49\u57f9\u8a13\u73ed\uff08\u521d\u968e\uff09','\u6bcf\u5e74 2\u20134 \u6708\u30fb\u5960\u5b9a\u57fa\u790e'],['\u6587\u737b\u67e5\u8b49\u57f9\u8a13\u73ed\uff08\u9032\u968e\uff09','\u6bcf\u5e74 5\u20137 \u6708\u30fb\u9032\u968e\u5206\u6790']]:[['Meta-analysis course series','Monthly \u00b7 year-round'],['Literature appraisal (Beginner)','Feb\u2013Apr each year'],['Literature appraisal (Advanced)','May\u2013Jul each year']]},
      {gicon:'ic-skills', title:isZh?'\u61c9\u7528\u8207\u5be6\u8e10':'Application & Practice', color:EBM_BLUE,
        rows:isZh?[['\u6587\u737b\u67e5\u8b49\u9662\u5167\u7af6\u8cfd','\u6bcf\u5e74 1 \u6b21\u30fb\u5be6\u6230\u6f14\u7df4'],['\u5be6\u8b49\u77e5\u8b58\u8f49\u8b6f\u8a0e\u8ad6\u6703','\u6bcf\u6708 1 \u6b21\u30fb\u8b49\u64da\u8f49\u5316'],['\u5176\u4ed6\u76f8\u95dc\u8ab2\u7a0b','\u6bcf\u5e74\u4e0d\u5b9a\u671f\u8209\u8fa6']]:[['In-hospital appraisal contest','Once a year \u00b7 hands-on'],['Knowledge-translation forum','Monthly'],['Other related courses','Periodically']]},
      {gicon:'ic-cap', title:isZh?'\u5e2b\u8cc7\u57f9\u80b2':'Faculty Cultivation', color:'#6E8A77',
        rows:isZh?[['\u5be6\u8b49\u91ab\u5b78\u7a2e\u5b50\u5e2b\u8cc7\u57f9\u8a13\u8ab2\u7a0b','\u6bcf\u5e74 3\u20134 \u5802'],['\u9662\u5167\u5be6\u8b49\u6559\u5b78\u4eba\u624d\u5eab','\u7cfb\u7d71\u6027\u7ba1\u7406'],['\u57f9\u990a\u672a\u4f86\u5be6\u8b49\u9818\u5c0e\u8005','\u9577\u671f\u57f9\u80b2\u8a08\u756b']]:[['Seed-teacher training','3\u20134 sessions/year'],['Teaching talent pool','Systematic management'],['Future EBM leaders','Long-term program']]} ];
    const ebm={ ink:EBM_INK, gold:EBM_GOLD, goldSoft:EBM_GOLD_SOFT, blue:EBM_BLUE,
      eyebrow:'Evidence-Based Medicine Center',
      heroTitle:isZh?'提升醫療品質的關鍵引擎':'The key engine for better care quality',
      heroTag:isZh?'以「實證為基礎，引領臨床實踐，提升醫療品質，創造最佳病患照護」為核心使命，推動院內實證醫學文化。':'Anchored in evidence to lead clinical practice, raise care quality and create the best patient outcomes — advancing a hospital-wide culture of evidence-based medicine.',
      aboutEyebrow:isZh?'中心定位與核心使命':'Mission & Positioning',
      aboutTitle:isZh?'實證為基，深耕二十餘載':'Evidence at the core, two decades deep',
      aboutBody:isZh?'本中心隸屬於教學部，由林秀真主任帶領專業團隊，採多管齊下策略推動院內實證醫學文化：從競賽參與、品質改善專案到系統性教育培訓，建立起完整且可持續的發展體系。':'Within the Department of Medical Education, Director Hsiu-Chen Lin leads a multi-pronged strategy — from contests and quality-improvement projects to systematic training — building a complete, sustainable evidence-based medicine system.',
      aboutBody2:isZh?'長期致力於培育院內實證醫學專業人才，積極推動跨領域合作，並於國家級醫療品質競賽中屢創佳績。':'Cultivating in-house EBM talent, driving cross-disciplinary collaboration, and repeatedly excelling at national healthcare-quality competitions.',
      membersTitle:isZh?'中心成員':'Center Members',
      missionsEyebrow:isZh?'組織任務架構':'Organizational Mandate', missionsTitle:isZh?'四大核心任務':'Four Core Missions',
      missionsDesc:isZh?'分工明確、相互支援，共同推動全院實證醫學能量的提升。':'Clearly divided yet mutually supportive, together raising the hospital’s evidence-based medicine capacity.',
      awardsEyebrow:isZh?'NHQA（現為 NCMEA）實證醫學競賽':'NHQA / NCMEA Achievements', awardsTitle:isZh?'競賽輝煌成就':'A Record of Distinction',
      awardsDesc:isZh?'長期投入國家醫療品質獎實證醫學類競賽，於文獻查證組與臨床應用組均有亮眼成績，並自 113 學年度起參與知識轉譯組，持續拓展實證應用面向。':'Sustained investment in the NHQA EBM category — standout results in the literature-appraisal and clinical-application tracks, and from AY113 also competing in the knowledge-translation track.',
      awardsLitTitle:isZh?'文獻查證組':'Literature Appraisal Track', awardsClinTitle:isZh?'臨床應用組':'Clinical Application Track', awardsTransTitle:isZh?'知識轉譯組':'Knowledge Translation Track',
      colSession:isZh?'屆別':'Session', colAward:isZh?'獲獎紀錄':'Award',
      journeyEyebrow:isZh?'二十年的卓越發展':'Twenty Years of Progress', journeyTitle:isZh?'實證醫學推動歷程':'Our Journey',
      journeyDesc:isZh?'自民國 93 年創立至今，歷經三個階段的持續耕耘，逐步建立完整的院內實證醫學生態系統。':'From its founding in 2004, three phases of sustained effort have built a complete in-hospital EBM ecosystem.',
      coursesEyebrow:isZh?'實證中心年度訓練課程':'Annual Training Program', coursesTitle:isZh?'階梯式訓練體系':'A Stepwise Curriculum',
      coursesDesc:isZh?'依循「系統性、階梯式」設計原則，由淺入深，將實證醫學能力落實於日常臨床實務。':'A systematic, stepwise design that moves from basics to advanced application, embedding EBM into daily clinical practice.',
      closingTitle:isZh?'讓實證成為每一次臨床決策的基石':'Making evidence the foundation of every clinical decision',
      closingBody:isZh?'教學部實證醫學中心歷經二十餘年耕耘，已在本院建立起完整的實證醫學推動體系。從教育培訓、競賽參與到品質改善，持續為病患提供最佳照護品質。':'Over two decades the Center has built a complete EBM system — from training and contests to quality improvement — continually striving to deliver the best care for patients.',
      contactPerson:isZh?'行政專員：江明憲':'Administrator: Ming-Hsien Chiang', contactExt:isZh?'分機 3760':'Ext. 3760',
      contactPlace:isZh?'臺北醫學大學附設醫院 · 教學部 實證醫學中心':'TMU Hospital · EBM Center, Dept. of Medical Education',
      contactQuote:isZh?'以實證深耕醫療品質，讓最佳證據走進每一個臨床現場。':'Deepening care quality through evidence — the best evidence at every bedside.',
      members:ebmMembers, kpis:ebmKpis.map((k,i)=>({...k, label:isZh?k.zh:k.en, delay:i*70})),
      missions:ebmMissions.map(m=>({...m, title:isZh?m.zh:m.en, desc:isZh?m.descZh:m.descEn})),
      awardsLit:ebmAwardsLit, awardsClin:ebmAwardsClin, awardsTrans:ebmAwardsTrans,
      stages:ebmStages.map(s=>({...s, items:s.items})),
      courseGroups:ebmCourseGroups.map(g=>({...g, rows:g.rows.map(r=>({name:r[0], detail:r[1]}))})) };

    const orgBtn=(v)=>({ border:orgVariant===v?'var(--teal)':'var(--border)', bg:orgVariant===v?'var(--teal)':'var(--surface)', color:orgVariant===v?'#fff':'var(--body)' });
    const oa=orgBtn('A'),ob=orgBtn('B');

    return {
      rootRef:(el)=>{this.root=el;}, canvasRef:(el)=>{this.canvas=el;}, glowRef:(el)=>{this.glow=el;},
      heroSrc: this.res('hero'), heroRef:(el)=>{ if(el){ const s=this.res('hero'); if(el.getAttribute('data-src')!==s){ el.setAttribute('data-src',s); el.src=s; } } },
      theme, teal: this.props.accent || (theme==='dark'?'#6db5a1':'#4f8c7d'),
      t, isZh,
      isDept: view==='dept', isHolistic: view==='holistic', isBuilding: view==='building', isEbm: view==='ebm', ebm, isFacdev: view==='facdev', facdev, building:buildingObj,
      centerLinks, enterCenter:this.enterCenter,
      aiEcoTitle, aiEcoBody, aiFlow, aiSteps, aiProblems,
      aiProblemsTitle:isZh?'生態系要解決什麼問題？':'What does the ecosystem solve?', aiTeamLabel:isZh?'範疇二團隊':'Scope 2 Team',
      centerPagesEyebrow:'Center Pages', centerPagesTitle:isZh?'中心專頁入口':'Center Pages', centerPagesDesc:isZh?'點擊任一中心進入專頁；全人照護教育中心已上線，其餘中心專頁陸續建置中。':'Tap any center to open its page. The Holistic Care Education Center is live; others are in progress.',
      buildingTitle:isZh?'本中心專頁建置中':'This center page is in progress', buildingDesc:isZh?'內容正陸續整理上線，敬請期待。您可以先返回教學部首頁瀏覽組織架構與團隊成員。':'Content is being prepared and will be online soon. Meanwhile, return to the department home to explore the structure and teams.',
      heroA: (this.props.heroVariant||'B')==='A', heroB: (this.props.heroVariant||'B')!=='A',
      orgTree: orgVariant==='A', orgHub: orgVariant==='B',
      setOrgA:()=>this.setOrg('A'), setOrgB:()=>this.setOrg('B'),
      orgABorder:oa.border,orgABg:oa.bg,orgAColor:oa.color, orgBBorder:ob.border,orgBBg:ob.bg,orgBColor:ob.color,
      toggleLang:this.toggleLang, toggleTheme:this.toggleTheme, themeIconId: theme==='dark'?'ic-sun':'ic-moon',
      goHome:()=>this.setView('dept'), enterHolistic:()=>this.setView('holistic'), enterDept:()=>this.setView('dept'),
      scrollOrg:()=>this.scrollTo('org'), scrollMhfa:()=>this.scrollTo('mhfa'),
      navItems, centers, active:activeObj, closeActive:()=>this.setState({active:null}),
      kpis, contacts, placeholders,
      hKpis, hFeatures, holisticMembers, hMembersTitle, algee:algeeList, activeAlgee,
      instructors:H.instructors.map(p=>resolveP(p,'#4f8c7d')), seedTeachers:H.seed.map(p=>resolveP(p,'#4f8c7d')), aiTeam:H.ai.map(p=>resolveP(p,'#5E7A8C')),
      announcements, annNote, activities, actNote, annUrl:ANN_URL,
      annEyebrow:'Announcements', annTitle:isZh?'最新公告':'Latest News', actEyebrow:'Activities', actTitle:isZh?'近期活動':'Activities',
      viewAllLabel:isZh?'前往完整看板':'View full board',
      icHeart:I.heart, icArrow:I.arrow, icPhone:I.phone, icPin:I.pin,
    };
  }
}
</script>
</body>
</html>

```
