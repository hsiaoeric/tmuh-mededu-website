/* =========================================================
   臺北醫學大學附設醫院 教學部 — 互動與版面渲染
   Dept. of Medical Education, TMU Hospital

   內容全部來自 content.js；本檔負責：
   語言切換 · 行動選單 · 平滑捲動 · 進場動畫 · 視差 ·
   中心手風琴 · 榮譽輪播 · 數字累加 · 聯絡表單驗證
   ========================================================= */
(function () {
  'use strict';

  var C = window.CONTENT;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NAV_H = 72;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------- 語言 ---------------- */
  var lang = 0; // 0 = 中文, 1 = English
  try {
    var saved = window.localStorage.getItem('mededu-lang');
    if (saved === 'en') lang = 1;
  } catch (e) { /* localStorage 不可用時維持預設 */ }

  /** 取出 [zh, en] 配對中的目前語言字串。 */
  function L(pair) {
    if (pair == null) return '';
    return Array.isArray(pair) ? (pair[lang] || pair[0] || '') : String(pair);
  }
  var isZh = function () { return lang === 0; };

  /* ---------------- 圖示 ---------------- */
  var S = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
  var ICONS = {
    cap: '<path d="M12 4 2.5 8.5 12 13l9.5-4.5L12 4Z"/><path d="M6.5 10.7V16c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6v-5.3M21.5 8.5V14"/>',
    skills: '<path d="M7 3v5a4 4 0 0 0 8 0V3"/><path d="M5.5 3H8M14 3h2.5"/><path d="M11 12v3a4.5 4.5 0 0 0 9 0v-1.6"/><circle cx="19.5" cy="10.8" r="1.8"/>',
    chart: '<path d="M4 19.5h16"/><rect x="5.5" y="11" width="3.2" height="6"/><rect x="10.4" y="7" width="3.2" height="10"/><rect x="15.3" y="13.4" width="3.2" height="3.6"/>',
    holistic: '<path d="M12 20.5s-7-4.4-7-9.4A3.9 3.9 0 0 1 12 8.6a3.9 3.9 0 0 1 7 2.5c0 5-7 9.4-7 9.4Z"/><path d="M12 8.6V3.5"/><path d="M9.4 5.2 12 3.5l2.6 1.7"/>',
    research: '<path d="M10 3.5h4"/><path d="M11 3.5v5.2L6.6 17a2.6 2.6 0 0 0 2.3 3.9h6.2a2.6 2.6 0 0 0 2.3-3.9L13 8.7V3.5"/><path d="M8.3 14.4h7.4"/>',
    heart: '<path d="M12 20s-7-4.2-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.8-7 9-7 9Z"/>',
    brain: '<path d="M9.5 4.5A2.8 2.8 0 0 0 6.7 7.3 2.6 2.6 0 0 0 5 9.8c0 1 .5 1.8 1.3 2.3-.5.5-.8 1.2-.8 2A2.8 2.8 0 0 0 8.3 17c.2 1.4 1.4 2.5 2.9 2.5V4.5h-1.7Z"/><path d="M14.5 4.5A2.8 2.8 0 0 1 17.3 7.3 2.6 2.6 0 0 1 19 9.8c0 1-.5 1.8-1.3 2.3.5.5.8 1.2.8 2A2.8 2.8 0 0 1 15.7 17c-.2 1.4-1.4 2.5-2.9 2.5V4.5h1.7Z"/>',
    sprout: '<path d="M12 20v-7"/><path d="M12 13c0-3.3 2.2-5.5 5.6-5.9C17.2 10.6 15.2 12.8 12 13Z"/><path d="M12 13c0-2.8-1.7-4.7-4.7-5.1C7.6 10.9 9.3 12.8 12 13Z"/>',
    network: '<circle cx="12" cy="5" r="2.2"/><circle cx="5" cy="18" r="2.2"/><circle cx="19" cy="18" r="2.2"/><path d="M10.5 6.9 6.4 15.9M13.5 6.9l4.1 9M7.2 18h9.6"/>',
    team: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2.4"/><path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6S14 16 14.6 19M16 14.6c2 .3 3.6 1.7 4.1 4.4"/>',
    award: '<circle cx="12" cy="9" r="5"/><path d="m8.8 13.4-1.3 6.4L12 17.6l4.5 2.2-1.3-6.4"/>',
    bulb: '<path d="M12 3a6 6 0 0 0-3.5 10.9V17h7v-3.1A6 6 0 0 0 12 3Z"/><path d="M9.5 20h5"/>',
    clipboard: '<rect x="6" y="4.5" width="12" height="16" rx="2.4"/><path d="M9.5 4.5V3.4h5v1.1"/><path d="M9.2 10h5.6M9.2 13.5h5.6M9.2 17h3.4"/>',
    phone: '<path d="M6.4 3.8h3l1.5 3.7-1.9 1.4a11 11 0 0 0 5.1 5.1l1.4-1.9 3.7 1.5v3a1.8 1.8 0 0 1-2 1.8A15.3 15.3 0 0 1 4.6 5.8a1.8 1.8 0 0 1 1.8-2Z"/>',
    pin: '<path d="M12 21s6.5-5.6 6.5-10.4a6.5 6.5 0 0 0-13 0C5.5 15.4 12 21 12 21Z"/><circle cx="12" cy="10.4" r="2.4"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.2 2.4 3.3 5.3 3.3 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.3-5.3-3.3-8.5S9.8 5.9 12 3.5Z"/>',
    hub: '<circle cx="12" cy="12" r="2.6"/><circle cx="12" cy="4.6" r="1.9"/><circle cx="5.2" cy="17" r="1.9"/><circle cx="18.8" cy="17" r="1.9"/><path d="M12 6.5v2.9M10 13.6l-3.2 2M14 13.6l3.2 2"/>',
    board: '<rect x="3.5" y="5" width="17" height="13" rx="2.4"/><path d="M7.5 9.5h9M7.5 13h5.5"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.4"/><path d="m4.5 7.5 7.5 5.4 7.5-5.4"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.4V12l3 1.8"/>',
    calendar: '<rect x="4" y="5.5" width="16" height="14" rx="2.4"/><path d="M8 3.5v4M16 3.5v4M4 10h16"/>',
    users: '<circle cx="12" cy="8" r="3.2"/><path d="M5.5 19.5c.7-3.4 3.3-5.2 6.5-5.2s5.8 1.8 6.5 5.2"/>',
    spark: '<path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9 12 3.5Z"/>',
    chevron: '<path d="m6 9.5 6 6 6-6"/>',
    arrowL: '<path d="M15 5l-7 7 7 7"/>',
    arrowR: '<path d="M9 5l7 7-7 7"/>',
  };
  function icon(name, size) {
    var d = ICONS[name] || ICONS.spark;
    var s = size || 22;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" ' + S + ' aria-hidden="true">' + d + '</svg>';
  }

  /* ---------------- 小工具 ---------------- */
  function initials(en) {
    var w = (en || '').replace(/[^A-Za-z ]/g, '').trim().split(/\s+/).filter(Boolean);
    if (w.length >= 2) return (w[0][0] + w[w.length - 1][0]).toUpperCase();
    return (en || '?').slice(0, 2).toUpperCase();
  }
  function fmtDate(iso) {
    var a = iso.split('-');
    if (a.length !== 3) return iso;
    if (isZh()) return a[0] + '/' + a[1] + '/' + a[2];
    var m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return m[Number(a[1]) - 1] + ' ' + Number(a[2]) + ', ' + a[0];
  }
  function head(eyebrow, title, desc, light) {
    return (
      '<header class="section__head' + (light ? ' section__head--light' : '') + '">' +
      '<p class="eyebrow' + (light ? ' eyebrow--light' : '') + ' reveal">' + L(eyebrow) + '</p>' +
      '<h2 class="section__title reveal" data-reveal-delay="60">' + L(title) + '</h2>' +
      (desc ? '<p class="section__lede reveal" data-reveal-delay="120">' + L(desc) + '</p>' : '') +
      '</header>'
    );
  }

  /** 人員名片。 */
  function personCard(person, accent, opts) {
    opts = opts || {};
    var name = L(person.name);
    var en = person.name[1];
    var role = L(C.role[person.role] || ['', '']);
    var dept = L(person.dept).split('｜');
    var pos = C.portraitPosition[person.slug] || 'center';
    // 首字縮寫永遠先放；有照片時蓋在上面，萬一檔案讀取失敗 onerror 會移除 <img> 自動回退。
    var hasPhoto = person.slug && C.portraits.indexOf(person.slug) >= 0;
    var photo =
      '<span class="person__ini">' + initials(en) + '</span>' +
      (hasPhoto
        ? '<img src="assets/' + person.slug + '.jpg" alt="" loading="lazy" ' +
          'style="object-position:' + pos + '" onerror="this.remove()" />'
        : '');
    var profile = person.hubId
      ? '<a class="person__link" href="https://hub.tmu.edu.tw/zh/persons/' + person.hubId + '/" target="_blank" rel="noopener">' +
        L(C.centers.profileLabel) + ' ↗</a>'
      : '';
    var duty = person.duty
      ? '<span class="person__duty"><em>' + L(C.org.dutyLabel) + '</em>' + L(person.duty) + '</span>'
      : '';
    return (
      '<figure class="person' + (opts.compact ? ' person--compact' : '') + '" style="--accent:' + accent + '">' +
      '<div class="person__ph">' + photo + '</div>' +
      '<figcaption>' +
      '<strong>' + name + '</strong>' +
      (isZh() ? '<span class="person__en">' + en + '</span>' : '') +
      '<span class="person__role">' + role + '</span>' +
      dept.map(function (d) { return '<span class="person__dept">' + d + '</span>'; }).join('') +
      duty + profile +
      '</figcaption></figure>'
    );
  }

  /** KPI 數字列。 */
  function kpiRow(kpis) {
    return (
      '<ul class="kpis">' +
      kpis.map(function (k, i) {
        var val = k.display
          ? '<strong style="color:' + k.color + '">' + k.display + '</strong>'
          : '<strong style="color:' + k.color + '" data-count="' + k.num + '"' +
            (k.suffix ? ' data-suffix="' + k.suffix + '"' : '') + '>0</strong>';
        return (
          '<li class="reveal" data-reveal-delay="' + i * 60 + '">' + val +
          '<span>' + L(k.label) + '</span>' +
          (k.subtitle ? '<em>' + L(k.subtitle) + '</em>' : '') +
          '</li>'
        );
      }).join('') +
      '</ul>'
    );
  }

  /* =========================================================
     各區塊渲染
     ========================================================= */

  function renderChrome() {
    document.documentElement.lang = isZh() ? 'zh-Hant' : 'en';
    document.title = L(C.meta.docTitle);
    $('[data-brand1]').textContent = L(C.meta.brand1);
    $('[data-brand2]').textContent = L(C.meta.brand2);
    $('[data-navcta]').textContent = L(C.navCta);
    $('[data-hero-scroll]').textContent = L(C.hero.scroll);
    $('.skip-link').textContent = isZh() ? '跳至主要內容' : 'Skip to content';
    var lb = $('[data-lang-toggle]');
    lb.textContent = L(C.meta.langBtn);
    lb.setAttribute('aria-label', isZh() ? 'Switch to English' : '切換為中文');
    $('[data-nav-list]').innerHTML = C.nav
      .map(function (n) { return '<li><a href="' + n.href + '" data-scroll>' + L(n.label) + '</a></li>'; })
      .join('');
    $('[data-menu-toggle]').setAttribute('aria-label', isZh() ? '開啟選單' : 'Open menu');
  }

  function renderHero() {
    var h = C.hero;
    $('[data-hero]').innerHTML =
      '<p class="eyebrow eyebrow--light reveal">' + L(h.eyebrow) + '</p>' +
      '<h1 class="hero__title reveal" data-reveal-delay="80">' + L(h.title1) + '<br /><em>' + L(h.title2) + '</em></h1>' +
      '<p class="hero__lede reveal" data-reveal-delay="160">' + L(h.tag) + '</p>' +
      '<div class="hero__actions reveal" data-reveal-delay="240">' +
      '<a class="btn btn--primary" href="#centers" data-scroll>' + L(h.ctaPrimary) + '</a>' +
      '<a class="btn btn--ghost" href="#about" data-scroll>' + L(h.ctaGhost) + '</a>' +
      '</div>' +
      '<ul class="hero__meta reveal" data-reveal-delay="320">' +
      h.stats.map(function (s) {
        return '<li><strong data-count="' + s.num + '">0</strong><span>' + L(s.label) + '</span></li>';
      }).join('') +
      '</ul>' +
      '<p class="hero__note reveal" data-reveal-delay="380">' + L(h.statsNote) + '</p>';
  }

  function renderAbout() {
    var a = C.about;
    $('[data-about]').innerHTML =
      '<div class="container">' +
      head(a.eyebrow, a.title, a.desc) +
      '<div class="grid grid--3">' +
      a.cards.map(function (c, i) {
        return (
          '<article class="card reveal" data-reveal-delay="' + i * 70 + '">' +
          '<span class="card__icon">' + icon(c.icon) + '</span>' +
          '<h3>' + L(c.title) + '</h3><p>' + L(c.body) + '</p></article>'
        );
      }).join('') +
      '</div></div>';
  }

  /* ---------- 中心手風琴內部區塊 ---------- */
  function blockCards(b, accent) {
    return (
      subhead(b) +
      '<div class="grid grid--2">' +
      b.items.map(function (it, i) {
        var color = it.color || accent;
        return (
          '<article class="minicard reveal" data-reveal-delay="' + i * 60 + '" style="--accent:' + color + '">' +
          '<span class="minicard__icon">' + icon(it.icon, 20) + '</span>' +
          '<h5>' + L(it.title) + '</h5><p>' + L(it.desc) + '</p></article>'
        );
      }).join('') +
      '</div>'
    );
  }

  function blockNumbered(b, accent) {
    return (
      subhead(b) +
      '<ol class="numlist">' +
      b.items.map(function (it, i) {
        return (
          '<li class="reveal" data-reveal-delay="' + i * 60 + '" style="--accent:' + accent + '">' +
          '<span class="numlist__tag">' + it.tag + '</span>' +
          '<h5>' + L(it.title) + '</h5><p>' + L(it.desc) + '</p></li>'
        );
      }).join('') +
      '</ol>'
    );
  }

  function blockGroups(b) {
    return (
      subhead(b) +
      '<div class="grid grid--3">' +
      b.items.map(function (g, i) {
        return (
          '<article class="groupcard reveal" data-reveal-delay="' + i * 50 + '" style="--accent:' + g.color + '">' +
          '<h5>' + L(g.name) + '</h5><p>' + L(g.desc) + '</p>' +
          '<div class="groupcard__lead"><em>' + L(b.leadLabel) + '</em>' +
          '<span>' + L(g.lead.name) + '</span><small>' + L(g.lead.dept) + '</small></div>' +
          '</article>'
        );
      }).join('') +
      '</div>'
    );
  }

  function blockTimeline(b) {
    return (
      subhead(b) +
      '<ol class="timeline">' +
      b.items.map(function (st, i) {
        return (
          '<li class="reveal" data-reveal-delay="' + i * 70 + '" style="--accent:' + st.color + '">' +
          '<div class="timeline__meta"><span class="timeline__phase">' + L(st.phase) + '</span>' +
          '<strong>' + L(st.name) + '</strong><em>' + L(st.years) + '</em></div>' +
          '<ul class="timeline__items">' +
          st.items.map(function (x) { return '<li>' + L(x) + '</li>'; }).join('') +
          '</ul></li>'
        );
      }).join('') +
      '</ol>'
    );
  }

  function blockAwardTracks(b) {
    return (
      subhead(b) +
      '<div class="grid grid--3">' +
      b.tracks.map(function (tr, i) {
        return (
          '<div class="tracktable reveal" data-reveal-delay="' + i * 60 + '">' +
          '<h5>' + L(tr.title) + '</h5>' +
          '<table><thead><tr><th>' + L(b.colSession) + '</th><th>' + L(b.colAward) + '</th></tr></thead><tbody>' +
          tr.rows.map(function (r) {
            return (
              '<tr><td>' + L(r.sess) + '</td><td>' +
              '<span class="pill" style="--accent:' + r.tone + '">' + L(r.award) + '</span>' +
              (r.note ? '<small>' + L(r.note) + '</small>' : '') +
              '</td></tr>'
            );
          }).join('') +
          '</tbody></table></div>'
        );
      }).join('') +
      '</div>'
    );
  }

  function blockCourses(b) {
    return (
      subhead(b) +
      '<div class="grid grid--3">' +
      b.groups.map(function (g, i) {
        return (
          '<div class="courselist reveal" data-reveal-delay="' + i * 60 + '" style="--accent:' + g.color + '">' +
          '<h5>' + L(g.title) + '</h5><ul>' +
          g.rows.map(function (r) {
            return '<li><span>' + L(r.name) + '</span><em>' + L(r.detail) + '</em></li>';
          }).join('') +
          '</ul></div>'
        );
      }).join('') +
      '</div>'
    );
  }

  function blockAlgee(b, accent) {
    return (
      subhead(b) +
      '<ol class="algee">' +
      b.items.map(function (it, i) {
        return (
          '<li class="reveal" data-reveal-delay="' + i * 60 + '" style="--accent:' + accent + '">' +
          '<span class="algee__letter">' + it.letter + '</span>' +
          '<div><h5>' + L(it.title) + '</h5><p>' + L(it.desc) + '</p></div></li>'
        );
      }).join('') +
      '</ol>'
    );
  }

  function blockPeople(b, accent) {
    return (
      subhead(b) +
      '<div class="people' + (b.compact ? ' people--compact' : '') + '">' +
      b.items.map(function (person) { return personCard(person, accent, { compact: b.compact }); }).join('') +
      '</div>'
    );
  }

  function blockAi(b, accent) {
    return (
      subhead(b) +
      '<div class="aiflow">' +
      b.flow.map(function (f, i) {
        return (
          '<div class="aiflow__step reveal" data-reveal-delay="' + i * 60 + '" style="--accent:' + f.color + '">' +
          '<span class="aiflow__role">' + L(f.role) + '</span>' +
          '<h5>' + L(f.title) + '</h5><p>' + L(f.text) + '</p></div>'
        );
      }).join('') +
      '</div>' +
      '<div class="grid grid--2 aiextra">' +
      '<div class="panelbox reveal"><h5>' + L(b.problemsTitle) + '</h5><ul class="ticklist">' +
      b.problems.map(function (x) { return '<li>' + L(x) + '</li>'; }).join('') +
      '</ul></div>' +
      '<ol class="steps reveal" data-reveal-delay="80">' +
      b.steps.map(function (s) {
        return '<li class="step step--light"><span class="step__num">' + s.n + '</span><h5>' + L(s.title) + '</h5><p>' + L(s.text) + '</p></li>';
      }).join('') +
      '</ol></div>' +
      '<h5 class="minihead">' + L(b.teamLabel) + '</h5>' +
      '<div class="people people--compact">' +
      b.team.map(function (person) { return personCard(person, accent, { compact: true }); }).join('') +
      '</div>'
    );
  }

  function blockSymposium(b, accent) {
    var tr = b.training;
    return (
      subhead(b) +
      '<div class="grid grid--2">' +
      b.items.map(function (s, i) {
        return (
          '<article class="sympo reveal" data-reveal-delay="' + i * 50 + '" style="--accent:' + accent + '">' +
          '<div class="sympo__year">' + s.year + '</div>' +
          '<div class="sympo__body"><span class="sympo__ed">' + L(s.edition) + '</span>' +
          '<h5>' + L(s.title) + '</h5>' +
          '<p class="sympo__meta">' + icon('calendar', 14) + L(s.dates) + (s.time ? ' · ' + s.time : '') + '</p>' +
          '<p class="sympo__meta">' + icon('users', 14) + L(b.hostLabel) +
          (s.attendees ? ' · ' + s.attendees + ' ' + L(b.attendeesLabel) : '') +
          (s.satisfaction ? ' · ' + L(b.satisfactionLabel) + ' ' + s.satisfaction : '') +
          '</p></div></article>'
        );
      }).join('') +
      '</div>' +
      '<div class="panelbox panelbox--stats reveal">' +
      '<div><h5>' + L(tr.title) + '</h5><p>' + L(tr.desc) + '</p></div>' +
      '<ul class="ministats">' +
      tr.stats.map(function (s) {
        return '<li><strong data-count="' + s.num + '"' + (s.suffix ? ' data-suffix="' + s.suffix + '"' : '') +
          '>0</strong><span>' + L(s.label) + '</span></li>';
      }).join('') +
      '</ul></div>'
    );
  }

  function subhead(b) {
    return (
      '<div class="subhead reveal">' +
      '<h4>' + L(b.title) + '</h4>' +
      (b.desc ? '<p>' + L(b.desc) + '</p>' : '') +
      '</div>'
    );
  }

  var BLOCK = {
    cards: blockCards,
    numbered: blockNumbered,
    groups: blockGroups,
    timeline: blockTimeline,
    awardtracks: blockAwardTracks,
    courses: blockCourses,
    algee: blockAlgee,
    people: blockPeople,
    ai: blockAi,
    symposium: blockSymposium,
  };

  function renderCenters() {
    var s = C.centers;
    $('[data-centers]').innerHTML =
      '<div class="container">' +
      head(s.eyebrow, s.title, s.desc) +
      '<div class="ctrs">' +
      s.list.map(function (ct, i) {
        var accent = C.accent[ct.id];
        var pid = 'ctr-panel-' + ct.id;
        var body =
          '<p class="ctr__intro">' + L(ct.intro) + '</p>' +
          '<ul class="chips">' + ct.chips.map(function (c) { return '<li>' + L(c) + '</li>'; }).join('') + '</ul>' +
          (ct.kpis ? kpiRow(ct.kpis) : '') +
          ct.body.map(function (x) { return '<p class="ctr__body">' + L(x) + '</p>'; }).join('') +
          ct.blocks.map(function (b) { return '<section class="ctrblock">' + (BLOCK[b.kind] || subhead)(b, accent) + '</section>'; }).join('') +
          '<section class="ctrblock"><div class="subhead reveal"><h4>' + L(s.membersLabel) + '</h4></div>' +
          '<div class="people">' + ct.people.map(function (person) { return personCard(person, accent); }).join('') + '</div>' +
          '</section>' +
          '<div class="ctr__foot">' +
          '<p class="ctr__contact">' + icon('phone', 16) +
          '<span><em>' + L(s.contactLabel) + '</em>' + L(ct.contactPerson) +
          (L(ct.contactExt) ? '　' + L(ct.contactExt) : '') + '</span></p>' +
          '<p class="ctr__quote">「' + L(ct.closing) + '」</p>' +
          '</div>';

        return (
          '<article class="ctr reveal" data-reveal-delay="' + i * 50 + '" style="--accent:' + accent + '">' +
          '<h3 class="ctr__h"><button class="ctr__head" type="button" aria-expanded="false" aria-controls="' + pid + '" data-acc>' +
          '<span class="ctr__icon">' + icon(ct.icon, 22) + '</span>' +
          '<span class="ctr__titles"><span class="ctr__name">' + L(ct.name) + '</span>' +
          '<span class="ctr__tag">' + L(ct.tagline) + '</span></span>' +
          '<span class="ctr__chev" aria-hidden="true">' + icon('chevron', 20) + '</span>' +
          '</button></h3>' +
          '<div class="ctr__wrap" id="' + pid + '"><div class="ctr__panel">' + body + '</div></div>' +
          '</article>'
        );
      }).join('') +
      '</div></div>';
  }

  function renderOrg() {
    var o = C.org;
    $('[data-org]').innerHTML =
      '<div class="container">' +
      head(o.eyebrow, o.title, o.desc) +
      '<div class="orgroot reveal">' +
      '<span class="orgroot__top">' + L(o.rootTop) + '</span>' +
      '<strong class="orgroot__main">' + L(o.rootMain) + '</strong>' +
      '<div class="orgroot__units">' +
      C.centers.list.map(function (ct) {
        return '<a class="orgunit" href="#centers" data-scroll data-open-center="' + ct.id + '" style="--accent:' +
          C.accent[ct.id] + '">' + icon(ct.icon, 18) + '<span>' + L(ct.name) + '</span></a>';
      }).join('') +
      '<span class="orgunit orgunit--admin" style="--accent:' + C.accent.admin + '">' +
      icon('clipboard', 18) + '<span>' + (isZh() ? '行政團隊' : 'Administrative Team') + '</span></span>' +
      '</div></div>' +
      '<p class="orgnote reveal">' + L(o.intro) + '</p>' +
      '<div class="subhead reveal"><h4>' + L(o.leadershipTitle) + '</h4></div>' +
      '<div class="people">' + o.leadership.map(function (person) { return personCard(person, C.accent.admin); }).join('') + '</div>' +
      '<div class="subhead reveal"><h4>' + L(o.specialistsTitle) + '</h4></div>' +
      '<ul class="duties">' +
      o.specialists.map(function (person, i) {
        return (
          '<li class="reveal" data-reveal-delay="' + (i % 4) * 50 + '">' +
          '<span class="duties__ini">' + initials(person.name[1]) + '</span>' +
          '<span class="duties__name">' + L(person.name) + '<em>' + L(C.role[person.role]) + '</em></span>' +
          '<span class="duties__duty">' + L(person.duty) + '</span></li>'
        );
      }).join('') +
      '</ul></div>';
  }

  function renderImpact() {
    var im = C.impact;
    $('[data-impact-inner]').innerHTML =
      head(im.eyebrow, im.title, im.desc, true) +
      '<div class="snqbar reveal">' +
      im.yearCounts.map(function (y) {
        return '<div class="snqbar__item"><strong data-count="' + y.count + '">0</strong><span>' + y.year + '</span></div>';
      }).join('') +
      '<div class="snqbar__note">' + L(im.snqTitle) + '</div>' +
      '</div>' +

      '<div class="carousel reveal" data-carousel aria-roledescription="carousel" aria-label="' + L(im.snqTitle) + '">' +
      '<div class="carousel__viewport"><ul class="carousel__track" data-carousel-track>' +
      im.snq.map(function (pj, i) {
        return (
          '<li class="slide" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' / ' + im.snq.length + '">' +
          '<article class="snq">' +
          '<div class="snq__top"><span class="snq__year">' + pj.certYear + '</span>' +
          '<span class="snq__badge">' + L(pj.badge) + '</span></div>' +
          '<h4>' + L(pj.title) + '</h4>' +
          (pj.renewal ? '<p class="snq__renew">' + icon('spark', 14) + L(pj.renewal) + '</p>' : '') +
          '<div class="snq__tablewrap"><table class="snq__table"><thead><tr><th>' + L(im.colUnit) + '</th><th>' +
          L(im.colRole) + '</th><th>' + L(im.colPerson) + '</th></tr></thead><tbody>' +
          pj.members.map(function (m) {
            return '<tr><td>' + L(m.unit) + '</td><td>' + L(m.role) + '</td><td>' + L(m.person) + '</td></tr>';
          }).join('') +
          '</tbody></table></div></article></li>'
        );
      }).join('') +
      '</ul></div>' +
      '<div class="carousel__bar">' +
      '<div class="carousel__dots" role="tablist" aria-label="' + L(im.snqTitle) + '" data-carousel-dots></div>' +
      '<div class="carousel__nav">' +
      '<button class="cbtn" type="button" aria-label="' + (isZh() ? '上一則' : 'Previous') + '" data-carousel-prev>' + icon('arrowL', 18) + '</button>' +
      '<button class="cbtn" type="button" aria-label="' + (isZh() ? '下一則' : 'Next') + '" data-carousel-next>' + icon('arrowR', 18) + '</button>' +
      '</div></div></div>' +

      '<div class="nhqa reveal">' +
      '<div class="nhqa__head"><span class="nhqa__k">' + L(im.nhqaTitle) + '</span>' +
      '<span class="nhqa__year">' + L(im.nhqa.year) + ' · ' + L(im.nhqa.awardNote) + '</span></div>' +
      '<h4>' + L(im.nhqa.project) + '</h4>' +
      '<dl class="nhqa__grid">' +
      '<div><dt>' + (isZh() ? '組別' : 'Track') + '</dt><dd>' + L(im.nhqa.group) + '</dd></div>' +
      '<div><dt>' + (isZh() ? '領域' : 'Domain') + '</dt><dd>' + L(im.nhqa.domain) + '</dd></div>' +
      '<div><dt>' + (isZh() ? '時間地點' : 'When & where') + '</dt><dd>' + L(im.nhqa.event) + '</dd></div>' +
      '<div><dt>' + L(im.colPerson) + '</dt><dd>' + im.nhqa.leads.map(L).join('、') + '</dd></div>' +
      '</dl>' +
      '<ul class="tags">' + im.nhqa.keywords.map(function (k) { return '<li>' + L(k) + '</li>'; }).join('') + '</ul>' +
      '<p class="nhqa__link"><a href="#centers" data-scroll data-open-center="ebm">' + L(im.ebmLink) + '</a></p>' +
      '</div>' +
      '<p class="datasource reveal">' + L(im.dataSource) + '</p>';
  }

  function renderNews() {
    var n = C.news;
    var newest = n.items.map(function (x) { return x.date; }).sort().reverse()[0];
    var items = n.items.slice().sort(function (a, b) {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return b.date.localeCompare(a.date);
    });
    $('[data-news]').innerHTML =
      '<div class="container">' +
      head(n.eyebrow, n.title, n.desc) +
      '<p class="updated reveal">' + icon('clock', 14) + L(n.updatedLabel) + '：' + fmtDate(newest) +
      '　<a href="' + n.boardUrl + '" target="_blank" rel="noopener">' + L(n.boardLink) + '</a></p>' +
      '<div class="newslist">' +
      items.map(function (a, i) {
        var st = a.stat;
        return (
          '<article class="news reveal" data-reveal-delay="' + i * 70 + '"' + (a.pinned ? ' data-pinned="1"' : '') + '>' +
          (st
            ? '<div class="news__stat"><strong' + (st.small ? ' class="is-small"' : '') + '>' + st.top + '</strong>' +
              '<span>' + L(st.topLabel) + '</span>' +
              (st.bottom ? '<b>' + st.bottom + '</b><span>' + L(st.bottomLabel) + '</span>' : '') +
              '</div>'
            : '') +
          '<div class="news__body">' +
          '<div class="news__meta"><span class="news__tag">' + L(a.tag) + '</span>' +
          '<time>' + fmtDate(a.date) + '</time></div>' +
          '<h4>' + L(a.title) + '</h4>' +
          '<ul>' + a.lines.map(function (x) { return '<li>' + L(x) + '</li>'; }).join('') + '</ul>' +
          '</div></article>'
        );
      }).join('') +
      '</div>' +

      '<div class="subhead reveal" style="margin-top:2.5rem"><h4>' + L(n.actTitle) + '</h4><p>' + L(n.actDesc) + '</p></div>' +
      '<div class="grid grid--2">' +
      n.activities.map(function (act, i) {
        return (
          '<article class="act reveal" data-reveal-delay="' + i * 70 + '">' +
          '<span class="act__cat">' + L(act.cat) + '</span>' +
          '<h4>' + L(act.title) + '</h4>' +
          '<p class="act__when">' + icon('calendar', 15) + L(act.date) + '</p>' +
          '<dl class="act__grid">' +
          '<div><dt>' + L(act.labels.place) + '</dt><dd>' + L(act.place) + '</dd></div>' +
          '<div><dt>' + L(act.labels.speaker) + '</dt><dd>' + L(act.speaker) + '</dd></div>' +
          '<div><dt>' + L(act.labels.topic) + '</dt><dd>' + L(act.topic) + '</dd></div>' +
          '</dl>' +
          '<div class="act__foot"><span class="pill" style="--accent:#4f8c7d">' + L(act.status) + '</span>' +
          '<span class="act__enrolled">' + L(act.enrolled) + '</span></div>' +
          (act.link ? '<a class="act__cta" href="' + act.link + '" target="_blank" rel="noopener">' + L(act.cta) + '</a>' : '') +
          '</article>'
        );
      }).join('') +
      '</div></div>';
  }

  function renderContact() {
    var ct = C.contact;
    var f = ct.form;
    var field = function (id, label, control, extra) {
      return (
        '<div class="field">' +
        '<label for="' + id + '">' + label + (extra || '') + '</label>' + control +
        '<p class="field__error" id="' + id + '-error" aria-live="polite"></p></div>'
      );
    };

    $('[data-contact]').innerHTML =
      '<div class="container">' +
      head(ct.eyebrow, ct.title, ct.desc) +
      '<div class="grid grid--3 ctcards">' +
      ct.cards.map(function (c, i) {
        return (
          '<article class="ctcard reveal" data-reveal-delay="' + i * 50 + '" style="--accent:' + c.color + '">' +
          '<h4>' + L(c.center) + '</h4>' +
          '<p class="ctcard__person"><em>' + L(ct.windowLabel) + '</em>' + L(c.person) + '</p>' +
          (L(c.ext) ? '<p class="ctcard__ext">' + icon('phone', 15) + L(c.ext) + '</p>' : '') +
          '</article>'
        );
      }).join('') +
      '</div>' +

      '<div class="contact">' +
      '<form class="form reveal" novalidate data-form>' +
      '<h4 class="form__title">' + L(f.title) + '</h4>' +
      '<p class="form__note">' + L(f.note) + '</p>' +
      field('name', L(f.nameLabel), '<input id="name" name="name" type="text" autocomplete="name" required data-error="' + L(f.nameError) + '" />') +
      '<div class="field-row">' +
      field('email', L(f.emailLabel), '<input id="email" name="email" type="email" autocomplete="email" required data-error="' + L(f.emailError) + '" />') +
      field('phone', L(f.phoneLabel), '<input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" data-error="' + L(f.phoneError) + '" />', ' <span class="opt">' + L(f.phoneOptional) + '</span>') +
      '</div>' +
      field('unit', L(f.unitLabel), '<input id="unit" name="unit" type="text" required data-error="' + L(f.unitError) + '" />') +
      field('topic', L(f.topicLabel),
        '<select id="topic" name="topic" required data-error="' + L(f.topicError) + '">' +
        '<option value="">' + L(f.topicPlaceholder) + '</option>' +
        f.topics.map(function (t) { return '<option>' + L(t) + '</option>'; }).join('') +
        '</select>') +
      field('message', L(f.messageLabel), '<textarea id="message" name="message" rows="4" required minlength="15" data-error="' + L(f.messageError) + '"></textarea>') +
      '<label class="check"><input type="checkbox" id="consent" name="consent" required data-error="' + L(f.consentError) + '" />' +
      '<span>' + L(f.consentLabel) + '</span></label>' +
      '<p class="field__error" id="consent-error" aria-live="polite"></p>' +
      '<button class="btn btn--primary btn--block" type="submit" data-submit-label="' + L(f.submit) + '">' + L(f.submit) + '</button>' +
      '<p class="form__status" role="status" aria-live="polite" data-form-status></p>' +
      '</form>' +

      '<aside class="contact__side reveal" data-reveal-delay="100">' +
      '<div class="map"><iframe title="' + L(ct.mapTitle) + '" src="https://www.google.com/maps?q=' +
      encodeURIComponent(ct.mapQuery) + '&output=embed" width="100%" height="100%" style="border:0" ' +
      'loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>' +
      '<ul class="info">' +
      ct.info.map(function (r, i) {
        var v = L(r.v);
        if (i === 1) v = '<a href="tel:+886227372181">' + v + '</a>';
        return '<li><span class="info__k">' + L(r.k) + '</span><span class="info__v">' + v + '</span></li>';
      }).join('') +
      '</ul></aside></div></div>';
  }

  function renderFooter() {
    $('[data-foot-copy]').textContent = L(C.footer.copy);
    $('[data-foot-links]').innerHTML = C.footer.links
      .map(function (l) {
        return '<li><a href="' + l.href + '" target="_blank" rel="noopener" aria-label="' + L(l.label) +
          '" title="' + L(l.label) + '">' + icon(l.icon, 19) + '</a></li>';
      })
      .join('');
  }

  /* =========================================================
     互動
     ========================================================= */

  /* ---------- 進場動畫 ---------- */
  var revealObserver = null;
  function initReveal() {
    var els = $$('.reveal');
    els.forEach(function (el) {
      var d = el.getAttribute('data-reveal-delay');
      if (d) el.style.setProperty('--reveal-delay', d + 'ms');
    });
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    if (revealObserver) revealObserver.disconnect();
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        revealObserver.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.1 });
    els.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- 數字累加 ---------- */
  var countObserver = null;
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var decimals = (String(target).split('.')[1] || '').length;
    if (reduceMotion) { el.textContent = target.toFixed(decimals) + suffix; return; }
    var start = performance.now();
    (function step(now) {
      var pr = Math.min((now - start) / 1400, 1);
      var eased = 1 - Math.pow(1 - pr, 3);
      var v = target * eased;
      el.textContent = (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString()) + suffix;
      if (pr < 1) requestAnimationFrame(step);
    })(start);
  }
  function initCounters() {
    var els = $$('[data-count]');
    if (!('IntersectionObserver' in window)) { els.forEach(countUp); return; }
    if (countObserver) countObserver.disconnect();
    countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        countUp(e.target);
        countObserver.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    els.forEach(function (el) { countObserver.observe(el); });
  }

  /* ---------- 中心手風琴 ---------- */
  function initAccordions() {
    $$('[data-acc]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        setAccordion(btn, !open);
        if (!open) {
          window.setTimeout(function () {
            var top = btn.getBoundingClientRect().top + window.scrollY - NAV_H - 12;
            if (btn.getBoundingClientRect().top < NAV_H + 8) {
              window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
            }
          }, 60);
        }
      });
    });
  }
  function setAccordion(btn, open) {
    btn.setAttribute('aria-expanded', String(open));
    var wrap = document.getElementById(btn.getAttribute('aria-controls'));
    if (wrap) wrap.classList.toggle('is-open', open);
    var card = btn.closest('.ctr');
    if (card) card.classList.toggle('is-open', open);
  }
  /** 由其他區塊的連結開啟指定中心。 */
  function openCenter(id) {
    var btn = $('[aria-controls="ctr-panel-' + id + '"]');
    if (!btn) return;
    if (btn.getAttribute('aria-expanded') !== 'true') setAccordion(btn, true);
    window.setTimeout(function () {
      var top = btn.getBoundingClientRect().top + window.scrollY - NAV_H - 12;
      window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
    }, 80);
  }

  /* ---------- 輪播 ---------- */
  var carouselTimer = null;
  function initCarousel() {
    if (carouselTimer) { window.clearInterval(carouselTimer); carouselTimer = null; }
    var root = $('[data-carousel]');
    if (!root) return;
    var track = $('[data-carousel-track]', root);
    var slides = $$('.slide', track);
    var dotsWrap = $('[data-carousel-dots]', root);
    var index = 0;

    var dots = slides.map(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'dot';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', (isZh() ? '第 ' : 'Item ') + (i + 1) + (isZh() ? ' 則' : ''));
      b.addEventListener('click', function () { go(i); restart(); });
      if (dotsWrap) dotsWrap.appendChild(b);
      return b;
    });

    function go(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = 'translate3d(' + (-index * 100) + '%,0,0)';
      dots.forEach(function (d, n) { d.setAttribute('aria-selected', String(n === index)); });
      slides.forEach(function (s, n) { s.setAttribute('aria-hidden', String(n !== index)); });
    }
    function start() { if (!reduceMotion) carouselTimer = window.setInterval(function () { go(index + 1); }, 7000); }
    function stop() { if (carouselTimer) { window.clearInterval(carouselTimer); carouselTimer = null; } }
    function restart() { stop(); start(); }

    var prev = $('[data-carousel-prev]', root);
    var next = $('[data-carousel-next]', root);
    if (prev) prev.addEventListener('click', function () { go(index - 1); restart(); });
    if (next) next.addEventListener('click', function () { go(index + 1); restart(); });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });

    root.setAttribute('tabindex', '0');
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(index - 1); restart(); }
      if (e.key === 'ArrowRight') { go(index + 1); restart(); }
    });

    var startX = 0, dx = 0, dragging = false;
    root.addEventListener('touchstart', function (e) { dragging = true; startX = e.touches[0].clientX; dx = 0; stop(); }, { passive: true });
    root.addEventListener('touchmove', function (e) { if (dragging) dx = e.touches[0].clientX - startX; }, { passive: true });
    root.addEventListener('touchend', function () {
      if (dragging && Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1));
      dragging = false;
      start();
    });

    go(0);
    start();
  }

  /* ---------- 聯絡表單驗證 ---------- */
  function initForm() {
    var form = $('[data-form]');
    if (!form) return;
    var f = C.contact.form;
    var status = $('[data-form-status]', form);
    var emailRe = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
    var phoneRe = /^[+\d][\d\s().#-]{7,20}$/;

    function setError(field, message) {
      var node = document.getElementById(field.id + '-error');
      if (node) node.textContent = message || '';
      if (message) {
        field.setAttribute('aria-invalid', 'true');
        if (node) field.setAttribute('aria-describedby', node.id);
      } else {
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');
      }
      return !message;
    }

    function validate(field) {
      var value = (field.value || '').trim();
      var custom = field.getAttribute('data-error') || '';
      if (field.type === 'checkbox') return setError(field, field.checked ? '' : custom);
      if (field.required && !value) return setError(field, custom);
      if (field.type === 'email' && value && !emailRe.test(value)) return setError(field, custom);
      if (field.type === 'tel' && value && !phoneRe.test(value)) return setError(field, custom);
      if (field.minLength > 0 && value && value.length < field.minLength) return setError(field, custom);
      return setError(field, '');
    }

    var fields = $$('input, select, textarea', form);
    fields.forEach(function (field) {
      field.addEventListener('blur', function () { validate(field); });
      field.addEventListener('input', function () {
        if (field.getAttribute('aria-invalid') === 'true') validate(field);
      });
      if (field.type === 'checkbox' || field.tagName === 'SELECT') {
        field.addEventListener('change', function () { validate(field); });
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstInvalid = null;
      fields.forEach(function (field) { if (!validate(field) && !firstInvalid) firstInvalid = field; });
      if (firstInvalid) {
        if (status) { status.classList.add('is-error'); status.textContent = L(f.invalid); }
        firstInvalid.focus();
        return;
      }
      var button = $('button[type=submit]', form);
      if (button) { button.disabled = true; button.textContent = L(f.sending); }
      if (status) { status.classList.remove('is-error'); status.textContent = ''; }
      // 本版本無後端，僅模擬送出。
      window.setTimeout(function () {
        form.reset();
        fields.forEach(function (field) { setError(field, ''); });
        if (button) { button.disabled = false; button.textContent = button.getAttribute('data-submit-label'); }
        if (status) { status.classList.remove('is-error'); status.textContent = L(f.success); }
      }, 800);
    });
  }

  /* ---------- 平滑捲動 ---------- */
  function initScrollLinks() {
    $$('[data-scroll]').forEach(function (link) {
      if (link.dataset.bound === '1') return;
      link.dataset.bound = '1';
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('href');
        if (!id || id.charAt(0) !== '#') return;
        var target = id === '#top' ? document.body : document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        setMenu(false);
        var center = link.getAttribute('data-open-center');
        if (center) { openCenter(center); return; }
        var top = id === '#top' ? 0 : target.getBoundingClientRect().top + window.scrollY - NAV_H + 1;
        window.scrollTo({ top: Math.max(top, 0), behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });
  }

  /* ---------- 行動選單 ---------- */
  var toggle = $('[data-menu-toggle]');
  var menu = $('#primary-menu');
  var scrim = $('[data-menu-scrim]');
  var nav = $('[data-nav]');

  function menuIsOpen() { return !!toggle && toggle.getAttribute('aria-expanded') === 'true'; }
  function setNavState() {
    if (nav) nav.classList.toggle('is-solid', window.scrollY > 40 || menuIsOpen());
  }
  function setMenu(open) {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? (isZh() ? '關閉選單' : 'Close menu') : (isZh() ? '開啟選單' : 'Open menu'));
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
    setNavState();
    if (!scrim) return;
    if (open) {
      scrim.hidden = false;
      requestAnimationFrame(function () { scrim.classList.add('is-open'); });
    } else {
      scrim.classList.remove('is-open');
      window.setTimeout(function () { scrim.hidden = true; }, 300);
    }
  }

  if (toggle) toggle.addEventListener('click', function () { setMenu(!menuIsOpen()); });
  if (scrim) scrim.addEventListener('click', function () { setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuIsOpen()) { setMenu(false); toggle.focus(); }
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900 && menuIsOpen()) setMenu(false);
  });

  /* ---------- 視差與 scroll-spy ---------- */
  var layers = $$('[data-parallax]').map(function (el) {
    return {
      el: el,
      speed: parseFloat(el.getAttribute('data-parallax')) || 0,
      scale: parseFloat(el.getAttribute('data-parallax-scale')) || 1,
    };
  });
  function paintParallax() {
    var vh = window.innerHeight;
    for (var i = 0; i < layers.length; i++) {
      var la = layers[i];
      var r = la.el.getBoundingClientRect();
      if (r.bottom < -300 || r.top > vh + 300) continue;
      var delta = r.top + r.height / 2 - vh / 2;
      var y = Math.round(-delta * la.speed * 100) / 100;
      la.el.style.transform = 'translate3d(0,' + y + 'px,0)' + (la.scale !== 1 ? ' scale(' + la.scale + ')' : '');
    }
  }
  function paintSpy() {
    var links = $$('.nav__list a');
    var pos = window.scrollY + NAV_H + 90;
    var activeId = null;
    links.forEach(function (a) {
      var sec = document.querySelector(a.getAttribute('href'));
      if (sec && sec.offsetTop <= pos) activeId = a.getAttribute('href');
    });
    links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === activeId); });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      setNavState();
      if (!reduceMotion) paintParallax();
      paintSpy();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- 語言切換 ---------- */
  $('[data-lang-toggle]').addEventListener('click', function () {
    lang = lang === 0 ? 1 : 0;
    try { window.localStorage.setItem('mededu-lang', isZh() ? 'zh' : 'en'); } catch (e) { /* 忽略 */ }
    var y = window.scrollY;
    renderAll();
    window.scrollTo({ top: y, behavior: 'auto' });
  });

  /* ---------- 啟動 ---------- */
  function renderAll() {
    renderChrome();
    renderHero();
    renderAbout();
    renderCenters();
    renderOrg();
    renderImpact();
    renderNews();
    renderContact();
    renderFooter();

    initScrollLinks();
    initAccordions();
    initCarousel();
    initForm();
    initReveal();
    initCounters();
    setNavState();
    if (!reduceMotion) paintParallax();
    paintSpy();
  }

  renderAll();
})();
