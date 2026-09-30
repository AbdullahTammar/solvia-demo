(() => {
/* ============================================================
   AR SOLVIA prototype — single-page app, no framework.
   Routes:  #                 public website
            #service/<id>     public service details
            #app/<role>/<page>[/<id>]
            #pricing          hidden price page (password)
   ============================================================ */
const $ = s => document.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem('solvia5-' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('solvia5-' + k, JSON.stringify(v)); } catch (e) {} },
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const en = () => document.documentElement.lang === 'en';
const A = (ar, e) => (en() ? e : ar);
const P = pair => en() ? pair[1] : pair[0];
const money = n => Math.round(+n).toLocaleString('en-US') + A(' ر.س', ' SAR');
const ic = n => `<i data-lucide="${n}"></i>`;
const icons = () => window.lucide && lucide.createIcons();
const inFrame = new URLSearchParams(location.search).has('m');
const BRAND = 'AR SOLVIA';
const back = () => ic(en() ? 'arrow-left' : 'arrow-right');
const fwd = () => ic(en() ? 'arrow-right' : 'arrow-left');

/* ---------------- state ---------------- */
let platforms = store.get('platforms', D.platforms.map(p => ({ id: p[0], ar: p[1], en: p[2], domain: p[3], color: p[4], url: p[5], logo: '' })));
let services = store.get('services', D.services.map(s => ({ id: s[0], pl: s[1], ar: s[2], en: s[3], dar: s[4], den: s[5], price: s[6], aud: s[7], days: s[8], icon: s[9], logo: '', on: true })));
let tickets = store.get('tickets', D.tickets);
let msgs = store.get('msgs', {});
let meetings = store.get('meetings', [
  { id: 'M1', tk: 'REQ-10429', cust: 'C1', emp: 'AO', ar: 'متابعة عقود العمل في قوى', en: 'Qiwa contracts follow-up', when: '30/09 · 4:30 PM' },
  { id: 'M2', tk: 'REQ-10420', cust: 'C4', emp: 'KH', ar: 'اجتماع الموارد البشرية الشهري', en: 'Monthly HR review', when: '01/10 · 11:00 AM' },
]);
let session = store.get('session', null);   // null | customer | employee | supervisor
let ctype = store.get('ctype', 'ind');       // customer account: ind (individual) | biz (company)
const cid = () => ctype === 'biz' ? 'C2' : 'C1';
const save = () => { store.set('platforms', platforms); store.set('services', services); store.set('tickets', tickets); store.set('msgs', msgs); store.set('meetings', meetings); };
const ME = { customer: 'C1', employee: 'AO', supervisor: 'RH' };
const svc = id => services.find(s => s.id === id) || services[0];
const plat = id => platforms.find(p => p.id === id);
const cust = id => D.customers.find(c => c[0] === id);
const staff = id => D.staff.find(s => s[0] === id);
const staffName = id => id && staff(id) ? A(staff(id)[1], staff(id)[2]) : A('غير مسندة', 'Unassigned');
const custName = id => A(cust(id)[1], cust(id)[2]);
const nm = o => A(o.ar, o.en);
const platName = s => plat(s.pl) ? nm(plat(s.pl)) : BRAND;
const slaOf = t => svc(t.svc).days * 24;
const daysTxt = d => `${d} ${A(d === 1 ? 'يوم عمل' : d <= 10 && d > 2 ? 'أيام عمل' : 'يوم عمل', d === 1 ? 'business day' : 'business days')}`;
const dur = h => h >= 24 ? `${Math.round(h / 24)}${A(' يوم', 'd')}` : `${h}${A(' س', 'h')}`;

function seedMsgs(t) {
  if (msgs[t.id]) return msgs[t.id];
  const c = custName(t.cust), s = svc(t.svc);
  msgs[t.id] = [
    { w: 'sys', text: A('تم إنشاء الطلب ودفع ', 'Request created and paid ') + money(t.paid), at: dur(t.age) },
    { w: 'cust', who: t.cust, text: A(`السلام عليكم، أحتاج خدمة ${s.ar}. المستندات مرفقة.`, `Hello, I need help with ${s.en}. Documents attached.`), at: dur(t.age) },
    ...(t.emp ? [{ w: 'sys', text: A('تم الإسناد إلى ', 'Assigned to ') + staffName(t.emp), at: dur(Math.max(1, t.age - 1)) },
      { w: 'staff', who: t.emp, text: A(`أهلًا ${c.split(' ')[0]}، استلمت طلبك وبدأت مراجعة المستندات. سأرسل لك التحديثات هنا وعبر واتساب.`, `Hi ${c.split(' ')[0]}, I've picked up your request and I'm reviewing the documents. Updates will come here and on WhatsApp.`), at: dur(Math.max(1, t.age - 2)) },
      { w: 'note', who: t.emp, text: A('تم التحقق من السجل التجاري. بانتظار رد المنصة.', 'CR verified. Waiting for the platform response.'), at: '1' + A(' س', 'h') }] : []),
  ];
  return msgs[t.id];
}

/* ---------------- routing ---------------- */
let R = { view: 'public' };
function parse() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (h.startsWith('pricing')) return { view: 'pricing' };
  if (h.startsWith('service/')) return { view: 'service', id: h.split('/')[1] };
  if (/^(customer|employee|supervisor)\//.test(h)) { const [role, page, id] = h.split('/'); return { view: 'app', role, page, id }; }
  if (h.startsWith('app/')) { const [, role, page, id] = h.split('/'); return { view: 'app', role, page, id }; }
  return { view: 'public', anchor: h };
}
function go(hash) { if (location.hash === '#' + hash || (hash === '' && !location.hash)) route(); else location.hash = hash; }
function route() {
  R = parse();
  if (R.view === 'app' && session !== R.role) {
    if (MENUS[R.role]) { session = R.role; store.set('session', session); }   // demo: direct links sign in
    else if (!session) { R = { view: 'public' }; history.replaceState(null, '', location.pathname + location.search); }
    else R.role = session;
  }
  closeAll(); render();
  if (R.view === 'public' && R.anchor) { const el = document.getElementById(R.anchor); if (el) { el.scrollIntoView(); return; } }
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);

/* ---------------- helpers: UI ---------------- */
function toast(msg, i = 'check') {
  const t = $('#toast'); t.innerHTML = ic(i) + '<span>' + esc(msg) + '</span>'; icons(); t.classList.add('show');
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2600);
}
function modal(html) { $('#modal').innerHTML = html; icons(); $('#modal').classList.add('show'); $('#scrim').classList.add('show'); }
function closeAll() { ['#modal', '#scrim'].forEach(s => $(s)?.classList.remove('show')); $('#side')?.classList.remove('show'); }
const mHead = (t, sub = '') => `<div class="card-h" style="margin-bottom:6px"><div><h2>${t}</h2>${sub ? `<div class="small muted">${sub}</div>` : ''}</div><button class="iconbtn" onclick="App.close()">${ic('x')}</button></div>`;
const brand = (light = false) => `<div class="brand" onclick="App.go('')"><div class="logo-mark">S</div><b ${light ? 'style="color:#fff"' : ''}>${BRAND}</b></div>`;

// Logo sources, tried in order: logos/<id>.png (official file in the repo) → Google favicon → DuckDuckGo icon → monogram
window.__logoNext = img => {
  const list = img.dataset.srcs.split('|'); const i = +img.dataset.i + 1;
  if (i < list.length) { img.dataset.i = i; img.src = list[i]; } else img.remove();
};
window.__logoOk = img => { if (img.naturalWidth < 24 && !img.src.includes('logos/')) return window.__logoNext(img); img.classList.add('ok'); };
function plogo(pid, cls = '') {
  const p = plat(pid);
  if (!p) return `<div class="plogo ${cls}" style="background:linear-gradient(135deg,var(--accent-soft),var(--surface));color:var(--accent)">${ic('sparkles')}</div>`;
  if (p.logo) return `<div class="plogo ${cls}"><img class="ok" src="${p.logo}" alt=""></div>`;
  const abbr = (en() ? p.en : p.ar).replace(/^ال/, '').slice(0, en() ? 2 : 1);
  const doms = p.domain ? [p.domain, ...(D.logoAlt[p.id] || [])] : [];
  const srcs = [`logos/${p.id}.png`, ...doms.flatMap(d => [`https://icon.horse/icon/${d}`, `https://www.google.com/s2/favicons?domain=${d}&sz=128`, `https://icons.duckduckgo.com/ip3/${d}.ico`])];
  return `<div class="plogo ${cls}"><span class="mono" style="--c:${p.color}">${esc(abbr)}</span><img alt="${esc(p.en)}" src="${srcs[0]}" data-srcs="${srcs.join('|')}" data-i="0" onload="__logoOk(this)" onerror="__logoNext(this)"></div>`;
}
function svcLogo(s, cls = '') {
  if (s.logo) return `<div class="plogo ${cls}"><img src="${s.logo}" alt=""></div>`;
  if (plat(s.pl)) return plogo(s.pl, cls);
  return `<div class="plogo ${cls}" style="background:linear-gradient(135deg,var(--accent-soft),var(--surface));color:var(--accent)">${ic(s.icon || 'sparkles')}</div>`;
}
const PAY = { mada: 'mada', apple: 'applepay', stc: 'stcpay', visa: 'visa', mc: 'mastercard', sadad: 'sadad' };
const payImg = k => `<img class="pay-ic" src="img/pay/${PAY[k]}.svg" alt="${k}">`;
const payLogos = (keys = ['mada', 'apple', 'stc', 'visa', 'mc']) => keys.map(payImg).join('');
const stat = (i, l, v, s, up = false) => `<div class="card stat"><div class="ic">${ic(i)}</div><div><div class="lbl">${l}</div><div class="val">${v}</div><div class="sub">${up ? ic('trending-up') : ''}${s}</div></div></div>`;
const hero = (eyebrow, title, sub = '', actions = '') => `<section class="hero"><div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}${actions ? `<div class="actions">${actions}</div>` : ''}</section>`;
const bars = (vals, labels, hi = vals.length - 1) => `<div class="bars">${vals.map((v, i) => `<div class="${i === hi ? 'hi' : ''}" style="height:${v}%" title="${v}"><span>${labels ? labels[i] : ''}</span></div>`).join('')}</div><div style="height:20px"></div>`;

const ST = { new: ['جديد', 'New', 'info'], progress: ['قيد التنفيذ', 'In progress', 'warn'], waiting: ['بانتظار العميل', 'Waiting on customer', 'mute'], done: ['مكتمل', 'Completed', 'ok'] };
const PR = { urgent: ['عاجل', 'Urgent', 'bad'], high: ['عالية', 'High', 'warn'], normal: ['عادية', 'Normal', 'info'], low: ['منخفضة', 'Low', 'mute'] };
const CH = { whatsapp: ['message-circle', 'WhatsApp', 'واتساب'], sms: ['smartphone', 'SMS', 'رسالة نصية'], web: ['globe', 'Web', 'الموقع'] };
const stB = s => `<span class="badge ${ST[s][2]}">${A(ST[s][0], ST[s][1])}</span>`;
const prB = p => `<span class="badge ${PR[p][2]}"><span class="d"></span>${A(PR[p][0], PR[p][1])}</span>`;
const typeB = t => t.type === 'f' ? `<span class="badge">${ic('radar')}${A('تذكرة + متابعة', 'Ticket + follow-up')}</span>` : `<span class="badge mute">${A('تذكرة فقط', 'Ticket only')}</span>`;
function slaB(t) {
  if (t.st === 'done') return `<span class="badge ok">${ic('check')}${A('ضمن المهلة', 'SLA met')}</span>`;
  const left = slaOf(t) - t.age;
  return left < 0 ? `<span class="badge bad">${ic('alarm-clock')}${A('متأخرة ', 'Overdue ')}${dur(-left)}</span>` : `<span class="badge ${left <= 12 ? 'warn' : 'mute'}">${ic('timer')}${dur(left)}${A(' متبقية', ' left')}</span>`;
}
function journey(st) {
  const steps = [['تم الاستلام', 'Received'], ['تم الدفع', 'Paid'], ['تم الإسناد', 'Assigned'], ['قيد التنفيذ', 'In progress'], ['مكتمل', 'Completed']];
  const at = { new: 2, progress: 4, waiting: 4, done: 5 }[st];
  return `<div class="journey">${steps.map((s, i) => `<div class="${i < at ? 'done' : ''} ${i === at - 1 && st !== 'done' ? 'cur' : ''}">${P(s)}</div>`).join('')}</div>`;
}
const audTxt = s => s.aud === 'biz' ? A('للمنشآت', 'Companies') : s.aud === 'ind' ? A('للأفراد', 'Individuals') : A('أفراد وشركات حسب الأهلية', 'Individuals & companies, as eligible');

/* ======================================================
   PUBLIC WEBSITE
   ====================================================== */
function pubNav() {
  return `<nav class="pub-nav">${brand()}
    <div class="links"><a href="#services">${A('الخدمات', 'Services')}</a><a href="#platforms">${A('المنصات', 'Platforms')}</a><a href="#how">${A('كيف نعمل', 'How it works')}</a><a href="#business">${A('للشركات', 'For business')}</a><a href="#faq">${A('الأسئلة الشائعة', 'FAQ')}</a></div>
    <div class="tools">
      ${inFrame ? '' : `<button class="iconbtn hide-m" title="${A('معاينة الجوال', 'Mobile preview')}" onclick="App.phone()">${ic('smartphone')}</button>`}
      <button class="pill" onclick="App.lang()">${en() ? 'العربية' : 'EN'}</button>
      <button class="iconbtn" onclick="App.theme()">${ic(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon')}</button>
      <button class="iconbtn" title="${A('عرض السعر', 'Price proposal')}" onclick="App.go('pricing')">${ic('file-signature')}</button>
      <button class="pill hide-m" onclick="App.staffLogin()">${A('دخول الموظفين', 'Staff sign in')}</button>
      <button class="btn sm" onclick="App.login()">${ic('log-in')}<span class="hide-m">${session ? A('حسابي', 'My account') : A('دخول', 'Sign in')}</span></button>
    </div></nav>`;
}
function pubFooter() {
  return `<footer class="pub"><div class="wrap">
    <div>${brand(true)}<p style="margin-top:12px">${A('خدمات حكومية. أبسط. أسرع.', 'Government services. Simpler. Faster.')}</p><div class="pay-logos" style="margin-top:12px">${payLogos()}</div></div>
    <div><h4>${A('الخدمات', 'Services')}</h4>${services.filter(s => s.on).slice(0, 5).map(s => `<a onclick="App.go('service/${s.id}')">${nm(s)}</a>`).join('')}</div>
    <div><h4>${BRAND}</h4><a href="#how">${A('كيف نعمل', 'How it works')}</a><a href="#business">${A('للشركات', 'For business')}</a><a href="#faq">${A('الأسئلة الشائعة', 'FAQ')}</a></div>
    <div><h4>${A('فريق العمل', 'Team')}</h4><a onclick="App.staffLogin()">${A('دخول الموظفين', 'Staff sign in')}</a><a>${A('الرياض، المملكة العربية السعودية', 'Riyadh, Saudi Arabia')}</a><a dir="ltr">+966 9200 00000</a></div>
  </div><div class="wrap" style="margin-top:30px;font-size:12px;opacity:.7">© 2026 ${BRAND} · ${A('نموذج تجريبي', 'Prototype')}</div></footer>`;
}
let pubAud = 'all';
function publicSite() {
  const act = services.filter(s => s.on);
  const list = act.filter(s => pubAud === 'all' || (pubAud === 'pl' ? s.pl : !s.pl));
  const q = svc('s1');
  return pubNav() + `
  <header class="p-hero"><div class="glow"></div><div class="wrap">
    <div>
      <span class="eyebrow">${ic('sparkles')}${A('خدمات حكومية. أبسط. أسرع.', 'Government services. Simpler. Faster.')}</span>
      <h1>${A('أنجز خدماتك الحكومية <em>من مكان واحد</em>', 'All your government services, <em>in one place</em>')}</h1>
      <p>${A(`${BRAND} تربط الأفراد والمنشآت بفريق مختص ينجز ويتابع خدماتك في قوى ومُدد والتأمينات وناجز ومساند وغيرها — بدفع إلكتروني ومسار واضح وتحديثات فورية عبر واتساب والرسائل.`, `${BRAND} connects people and companies with specialists who complete and track services on Qiwa, Mudad, GOSI, Najiz, Musaned and more — online payment, a clear journey and instant WhatsApp and SMS updates.`)}</p>
      <div class="cta"><button class="btn lg" onclick="App.start()">${ic('plus')}${A('ابدأ طلب خدمة', 'Start a request')}</button><button class="btn lg light" onclick="App.go('business')">${ic('building-2')}${A('حلول الشركات', 'Business solutions')}</button></div>
      <div class="trust"><div><b>+12,000</b>${A('طلب منجز', 'requests completed')}</div><div><b>${act.length}</b>${A('خدمة متاحة', 'services available')}</div><div><b>4.9/5</b>${A('رضا العملاء', 'customer rating')}</div></div>
    </div>
    <div class="mini-phone"><div class="scr">
      <div style="display:flex;justify-content:space-between;align-items:center"><b>${A('مرحبًا عبدالله 👋', 'Hi Abdullah 👋')}</b><div class="avatar sm">ع</div></div>
      <div class="small muted" style="margin:4px 0 12px">${A('طلبك قيد التنفيذ', 'Your request is in progress')}</div>
      <div class="card" style="padding:14px;border-radius:18px"><div style="display:flex;gap:10px;align-items:center">${svcLogo(q, 'sm')}<div><b style="font-size:13px">${nm(q)}</b><div class="small muted">#REQ-10429</div></div></div>${journey('progress')}</div>
      <div class="card" style="padding:12px;border-radius:18px;margin-top:10px;display:flex;gap:10px;align-items:center"><div class="ic" style="width:34px;height:34px">${ic('message-circle')}</div><div class="small"><b>${A('أحمد (المختص)', 'Ahmed (specialist)')}</b><div class="muted">${A('تم رفع الطلب في قوى ✅', 'Submitted on Qiwa ✅')}</div></div></div>
      <div class="card" style="padding:12px;border-radius:18px;margin-top:10px;display:flex;gap:10px;align-items:center"><div class="ic" style="width:34px;height:34px">${ic('video')}</div><div class="small"><b>${A('اجتماع افتراضي', 'Video meeting')}</b><div class="muted">30/09 · 4:30 PM</div></div></div>
    </div></div>
  </div></header>

  <div class="wrap strip" id="platforms"><div class="card">${platforms.map(p => `<div class="pl">${plogo(p.id)}<span>${nm(p)}</span></div>`).join('')}</div></div>

  <section class="p-sec wrap" id="services">
    <div class="head"><span class="eyebrow">${A('خدماتنا', 'Our services')}</span><h2>${A('خدمات للأفراد والمنشآت', 'Services for people and companies')}</h2><p>${A('أسعار واضحة ومدة إنجاز معروفة ومختص يتابع حتى النهاية.', 'Clear prices, known turnaround and a specialist who sees it through.')}</p></div>
    <div style="display:flex;justify-content:center;margin-bottom:22px"><div class="tabs">${[['all', 'كل الخدمات', 'All services'], ['pl', 'المنصات الحكومية', 'Government platforms'], ['own', 'خدمات الأعمال', 'Business services']].map(([k, a, e]) => `<button class="${pubAud === k ? 'active' : ''}" onclick="App.aud('${k}')">${A(a, e)}</button>`).join('')}</div></div>
    <div class="grid g3">${list.map(svcCard).join('')}</div>
  </section>

  <section class="p-sec wrap" id="how">
    <div class="head"><span class="eyebrow">${A('كيف نعمل', 'How it works')}</span><h2>${A('أربع خطوات وخدمتك منجزة', 'Four steps and it’s done')}</h2></div>
    <div class="steps">${[['smartphone', 'ادخل برمز الجوال', 'Sign in with a code', 'بدون كلمة مرور — رمز يصلك على جوالك.', 'No password — a code sent to your phone.'], ['layout-grid', 'اختر الخدمة', 'Pick a service', 'تذكرة فقط أو تذكرة مع متابعة كاملة.', 'Ticket only, or ticket with full follow-up.'], ['credit-card', 'ادفع إلكترونيًا', 'Pay online', 'مدى، Apple Pay، STC Pay، فيزا وماستركارد.', 'Mada, Apple Pay, STC Pay, Visa & Mastercard.'], ['bell-ring', 'تابع خطوة بخطوة', 'Track every step', 'تحديثات عبر واتساب والرسائل ومحادثة مع المختص.', 'Updates on WhatsApp/SMS and chat with your specialist.']].map(([i, a, e, da, de], n) => `<div class="card hov"><span class="n">0${n + 1}</span><div class="ic">${ic(i)}</div><h3 style="margin:14px 0 6px;font-size:17px">${A(a, e)}</h3><div class="muted small">${A(da, de)}</div></div>`).join('')}</div>
  </section>

  <section class="p-sec wrap">
    <div class="grid g2">
      <div class="card"><span class="badge mute">${A('تذكرة فقط', 'Ticket only')}</span><h2 style="margin:12px 0 6px">${A('ننجز الخدمة ونبلغك', 'We do it and notify you')}</h2><p class="muted">${A('مناسبة للخدمات السريعة. ترفع الطلب والمستندات، ونرسل لك النتيجة.', 'For quick services. Submit the request and documents; we send you the result.')}</p></div>
      <div class="card" style="border-color:var(--accent)"><span class="badge">${ic('radar')}${A('تذكرة + متابعة', 'Ticket + follow-up')}</span><h2 style="margin:12px 0 6px">${A('مختص يرافقك حتى النهاية', 'A specialist with you to the end')}</h2><p class="muted">${A('متابعة مستمرة مع المنصة، محادثة مباشرة، واجتماع افتراضي عند الحاجة — مقابل ', 'Ongoing follow-up with the platform, live chat and a video meeting when needed — for ')}+${money(D.followUpFee)}</p></div>
    </div>
    <div class="grid g4 section">${[['message-circle', 'تحديثات واتساب و SMS', 'WhatsApp & SMS updates'], ['video', 'اجتماعات افتراضية', 'Video meetings'], ['receipt', 'فواتير إلكترونية معتمدة', 'ZATCA e-invoices'], ['file-down', 'تحميل النماذج المطلوبة', 'Download required forms']].map(([i, a, e]) => `<div class="card hov stat"><div class="ic">${ic(i)}</div><div style="font-weight:600;align-self:center">${A(a, e)}</div></div>`).join('')}</div>
  </section>

  <section class="p-sec wrap" id="business">
    <div class="head"><span class="eyebrow">${A('للشركات', 'For business')}</span><h2>${A('إدارة الموارد البشرية لمنشأتك عن بُعد', 'Remote HR for your company')}</h2><p>${A('فريق مختص يدير قوى ومُدد والتأمينات لمنشأتك باشتراك شهري، مع تقارير واضحة.', 'A team that runs Qiwa, Mudad and GOSI for you on a monthly plan, with clear reports.')}</p></div>
    <div class="grid g3">${[['أساسية', 'Starter', 1500, ['حتى ٢٠ موظف', 'Up to 20 employees'], 3], ['نمو', 'Growth', 3500, ['حتى ١٠٠ موظف', 'Up to 100 employees'], 5], ['مؤسسات', 'Enterprise', 0, ['أكثر من ١٠٠ موظف', '100+ employees'], 6]].map(([a, e, p, s, n], i) => `<div class="card hov" style="${i === 1 ? 'border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)' : ''}">${i === 1 ? `<span class="badge">${A('الأكثر طلبًا', 'Most popular')}</span>` : ''}<h2 style="margin-top:8px">${A(a, e)}</h2><div class="muted small">${P(s)}</div><div style="font-family:var(--font-head);font-size:30px;font-weight:700;margin:14px 0 2px">${p ? money(p) : A('حسب الطلب', 'Custom')}</div><div class="small muted">${p ? A('شهريًا', 'per month') : A('نصمم لك باقة خاصة', 'A plan built for you')}</div>
      <div style="margin:14px 0">${[['قوى ومُدد والتأمينات', 'Qiwa, Mudad & GOSI'], ['تقارير شهرية', 'Monthly reports'], ['مدير حساب مخصص', 'Dedicated account manager'], ['أولوية في المهلة', 'Priority SLA'], ['اجتماع شهري', 'Monthly meeting'], ['ربط مع أنظمتكم', 'Integration with your systems']].slice(0, n).map(f => `<div style="display:flex;gap:8px;padding:4px 0">${ic('check')}${P(f)}</div>`).join('')}</div>
      <button class="btn block ${i === 1 ? '' : 'ghost'}" onclick="App.meet()">${A('اطلب اجتماعًا', 'Request a meeting')}</button></div>`).join('')}</div>
  </section>

  <section class="p-sec wrap testi">
    <div class="head"><span class="eyebrow">${A('آراء العملاء', 'Testimonials')}</span><h2>${A(`يثقون في ${BRAND}`, `They trust ${BRAND}`)}</h2></div>
    <div class="grid g3">${[['ريم ق.', 'Reem Q.', 'خلصوا لي طلب ناجز بسرعة، والمتابعة على الواتساب ممتازة.', 'They finished my Najiz request quickly — the WhatsApp follow-up was great.'], ['مسار التجارية', 'Masar Trading', 'نعتمد عليهم في قوى والتأمينات لكل موظفينا. وفّروا علينا وقت كثير.', 'We rely on them for Qiwa and GOSI for all our staff. Saved us so much time.'], ['فهد ش.', 'Fahad S.', 'الاجتماع الافتراضي مع المستشار وضّح لي كل شيء.', 'The video session with the advisor made everything clear.']].map(([a, e, qa, qe]) => `<div class="card"><div style="color:var(--accent)">★★★★★</div><p>“${A(qa, qe)}”</p><b>${A(a, e)}</b></div>`).join('')}</div>
  </section>

  <section class="p-sec wrap faq" id="faq">
    <div class="head"><span class="eyebrow">${A('الأسئلة الشائعة', 'FAQ')}</span><h2>${A('عندك سؤال؟', 'Questions?')}</h2></div>
    ${[['كيف أدخل للموقع؟', 'How do I sign in?', 'برقم جوالك فقط — يصلك رمز تحقق برسالة نصية.', 'With your mobile number — we text you a verification code.'], ['ما طرق الدفع المتاحة؟', 'How can I pay?', 'مدى، Apple Pay، STC Pay، فيزا، ماستركارد وسداد. لا نقبل النقد أو التحويل.', 'Mada, Apple Pay, STC Pay, Visa, Mastercard and SADAD. No cash or bank transfer.'], ['هل بياناتي آمنة؟', 'Is my data safe?', 'نعم، البيانات مستضافة داخل المملكة ومشفرة.', 'Yes — data is hosted in Saudi Arabia and encrypted.'], ['هل أحصل على فاتورة ضريبية؟', 'Do I get a VAT invoice?', 'نعم، فاتورة إلكترونية متوافقة مع هيئة الزكاة والضريبة والجمارك.', 'Yes — a ZATCA-compliant e-invoice.']].map(([qa, qe, aa, ae]) => `<details><summary>${A(qa, qe)}</summary><p>${A(aa, ae)}</p></details>`).join('')}
  </section>

  <section class="p-sec wrap"><div class="cta-band"><div class="glow"></div><div style="position:relative"><h2>${A('جاهز تبدأ؟', 'Ready to start?')}</h2><p>${A('ادخل برقم جوالك وارفع طلبك خلال دقيقتين.', 'Sign in with your phone and submit in two minutes.')}</p></div><div style="display:flex;gap:10px;position:relative;flex-wrap:wrap"><button class="btn lg" onclick="App.start()">${ic('plus')}${A('ابدأ الآن', 'Start now')}</button><button class="btn lg light" onclick="App.meet()">${ic('calendar')}${A('احجز اجتماعًا', 'Book a meeting')}</button></div></div></section>
  ${pubFooter()}`;
}
function svcCard(s) {
  return `<div class="card hov svc"><div class="top-l">${svcLogo(s)}<div><span class="badge mute">${platName(s)}</span><div class="small muted" style="margin-top:4px">${audTxt(s)}</div></div></div>
    <div style="font-weight:700;font-size:16px">${nm(s)}</div><div class="muted small">${A(s.dar, s.den)}</div>
    <div class="chips"><span class="badge mute">${ic('timer')}${daysTxt(s.days)}</span></div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;gap:10px;flex-wrap:wrap"><div class="price">${money(s.price)}</div>
      <div style="display:flex;gap:6px"><button class="btn sm ghost" onclick="App.go('service/${s.id}')">${A('تفاصيل الخدمة', 'Service details')}</button><button class="btn sm" onclick="App.start('${s.id}')">${A('اطلب', 'Request')}</button></div></div></div>`;
}
function servicePage() {
  const s = services.find(x => x.id === R.id); if (!s) return publicSite();
  const p = plat(s.pl);
  const related = services.filter(x => x.on && x.id !== s.id).slice(0, 3);
  return pubNav() + `<div class="wrap" style="padding-top:24px">
    <button class="link" onclick="App.go('services')">${back()}${A('كل الخدمات', 'All services')}</button>
    <div class="grid g21 section" style="align-items:start"><div>
      <section class="hero"><div style="display:flex;gap:16px;align-items:center;position:relative;z-index:1;flex-wrap:wrap">${svcLogo(s, 'lg')}<div><div class="eyebrow">${platName(s)}</div><h1 style="margin:6px 0 4px">${nm(s)}</h1><p>${audTxt(s)}</p></div></div></section>
      <div class="card section"><h2 style="margin-bottom:8px">${A('عن الخدمة', 'About this service')}</h2><p class="muted" style="margin:0">${A(s.dar, s.den)}</p>
        <div class="grid g3 section">${[['file-search', 'مراجعة المستندات', 'Document review'], ['clipboard-check', 'تجهيز الطلب ورفعه', 'Prepare & submit'], ['user-check', 'متابعة مختص', 'Specialist follow-up']].map(([i, a, e]) => `<div class="stat"><div class="ic">${ic(i)}</div><b style="align-self:center">${A(a, e)}</b></div>`).join('')}</div></div>
      <div class="card section"><h2 style="margin-bottom:8px">${A('المستندات المطلوبة', 'Required documents')}</h2>
        ${[['صورة الهوية الوطنية أو الإقامة', 'National ID or Iqama copy'], ['السجل التجاري (للمنشآت)', 'Commercial registration (companies)'], ['تفويض للمختص (نموذج جاهز)', 'Authorisation for the specialist (template provided)']].map(d => `<div class="row">${ic('file-check')}<span>${P(d)}</span></div>`).join('')}
        <button class="link" style="margin-top:8px" onclick="App.toast('${A('تم تحميل النموذج', 'Form downloaded')}','download')">${ic('download')}${A('تحميل نموذج التفويض', 'Download authorisation form')}</button></div>
      <div class="card section"><h2 style="margin-bottom:4px">${A('مسار الخدمة', 'Service journey')}</h2>${journey('new').replace('journey', 'journey" style="margin-top:20px')}</div>
    </div>
    <div style="position:sticky;top:90px"><div class="card"><div class="small muted">${A('سعر الخدمة', 'Price')}</div><div style="font-family:var(--font-head);font-size:34px;font-weight:700">${money(s.price)}</div>
      <div class="small muted">${A('غير شامل الضريبة', 'excl. VAT')}</div>
      <div class="prop" style="margin-top:12px"><span>${A('مدة الإنجاز', 'Turnaround')}</span><b>${daysTxt(s.days)}</b></div>
      <div class="prop"><span>${A('المتابعة', 'Follow-up')}</span><b>+${money(D.followUpFee)}</b></div>
      ${p ? `<div class="prop"><span>${A('المنصة', 'Platform')}</span><span style="display:flex;gap:8px;align-items:center">${plogo(p.id, 'sm')}<b>${nm(p)}</b></span></div>` : ''}
      <button class="btn lg block" style="margin-top:16px" onclick="App.start('${s.id}')">${ic('plus')}${A('اطلب الخدمة الآن', 'Request now')}</button>
      <div class="pay-logos" style="margin-top:14px;justify-content:center">${payLogos()}</div></div></div></div>
    <h2 style="margin:40px 0 16px">${A('خدمات أخرى', 'Other services')}</h2><div class="grid g3">${related.map(svcCard).join('')}</div></div>${pubFooter()}`;
}

/* ======================================================
   APP SHELL
   ====================================================== */
const MENUS = {
  customer: [['home', 'house', 'الرئيسية', 'Home'], ['services', 'layout-grid', 'الخدمات', 'Services'], ['requests', 'ticket', 'طلباتي', 'My requests'], ['meetings', 'video', 'الاجتماعات', 'Meetings'], ['invoices', 'receipt', 'الفواتير', 'Invoices'], ['forms', 'file-down', 'النماذج', 'Forms']],
  company: [['home', 'layout-dashboard', 'لوحة المنشأة', 'Company home'], ['services', 'layout-grid', 'الخدمات', 'Services'], ['requests', 'ticket', 'طلبات المنشأة', 'Company requests'], ['employees', 'users', 'الموظفون', 'Employees'], ['plan', 'gem', 'الاشتراك', 'Subscription'], ['meetings', 'video', 'الاجتماعات', 'Meetings'], ['invoices', 'receipt', 'الفواتير', 'Invoices'], ['forms', 'file-down', 'النماذج', 'Forms']],
  employee: [['desk', 'kanban', 'التذاكر', 'Tickets'], ['meetings', 'video', 'الاجتماعات', 'Meetings'], ['customers', 'contact', 'العملاء', 'Customers'], ['platforms', 'globe', 'المنصات الحكومية', 'Gov platforms'], ['forms', 'file-down', 'النماذج', 'Forms']],
  supervisor: [['overview', 'layout-dashboard', 'نظرة عامة', 'Overview'], ['desk', 'kanban', 'التذاكر', 'Tickets'], ['catalog', 'tags', 'الخدمات والأسعار', 'Services & prices'], ['team', 'users', 'الفريق والصلاحيات', 'Team & roles'], ['reports', 'chart-column', 'التقارير', 'Reports'], ['finance', 'wallet', 'المالية والفواتير', 'Finance & invoices'], ['meetings', 'video', 'الاجتماعات', 'Meetings'], ['customers', 'contact', 'العملاء', 'Customers'], ['platforms', 'globe', 'المنصات الحكومية', 'Gov platforms']],
};
const ROLE_N = { customer: ['عميل', 'Customer'], employee: ['موظف', 'Employee'], supervisor: ['مشرف', 'Supervisor'] };
const menuOf = r => MENUS[r === 'customer' && ctype === 'biz' ? 'company' : r];
const link = (page, id) => `app/${R.role}/${page}${id ? '/' + id : ''}`;
function whoAmI() {
  if (R.role === 'customer') return ctype === 'biz' ? [custName('C2'), A('حساب منشأة · خالد (مدير الموارد البشرية)', 'Company account · Khalid (HR manager)'), 'م'] : [custName('C1'), A('حساب فرد', 'Individual account'), 'ع'];
  const s = staff(ME[R.role]); return [A(s[1], s[2]), P(ROLE_N[R.role]), s[0]];
}
function appShell(content) {
  const menu = menuOf(R.role), [n, r, av] = whoAmI();
  const active = { ticket: 'desk', request: 'requests', new: 'services', invoice: R.role === 'customer' ? 'invoices' : 'finance', room: 'meetings' }[R.page] || R.page;
  const openCount = R.role === 'customer' ? tickets.filter(t => t.cust === cid() && t.st !== 'done').length : tickets.filter(t => t.st !== 'done' && (R.role === 'supervisor' || t.emp === 'AO' || !t.emp)).length;
  const badge = id => (id === 'desk' || id === 'requests') && openCount ? `<span class="badge end">${openCount}</span>` : '';
  return `<div class="app">
    <nav class="rail"><div class="logo-mark" onclick="App.go('')" title="${BRAND}">S</div>${menu.map(([id, i, a, e]) => `<button title="${A(a, e)}" class="${active === id ? 'active' : ''}" onclick="App.go('${link(id)}')">${ic(i)}</button>`).join('')}<div class="sp"></div><button title="${A('خروج', 'Sign out')}" onclick="App.logout()">${ic('log-out')}</button></nav>
    <aside class="side" id="side">
      <div style="padding:0 8px 14px">${brand()}</div>
      <div class="who"><div class="avatar">${av}</div><div><b>${esc(n)}</b><span class="small muted">${r}</span></div></div>
      <div class="grp">${A('القائمة', 'Menu')}</div>
      ${menu.map(([id, i, a, e]) => `<button class="nav ${active === id ? 'active' : ''}" onclick="App.go('${link(id)}')">${ic(i)}<span>${A(a, e)}</span>${badge(id)}</button>`).join('')}
      <div class="grp">${A('عام', 'General')}</div>
      <button class="nav" onclick="App.go('')">${ic('globe')}<span>${A('الموقع العام', 'Public website')}</span></button>
      ${inFrame ? '' : `<button class="nav" onclick="App.phone()">${ic('smartphone')}<span>${A('معاينة الجوال', 'Mobile preview')}</span></button>`}
      <button class="nav" onclick="App.logout()">${ic('log-out')}<span>${A('تسجيل الخروج', 'Sign out')}</span></button>
    </aside>
    <main class="m">
      <header class="top">
        <button class="iconbtn menu-btn" onclick="App.side()">${ic('menu')}</button>
        <label class="search">${ic('search')}<input placeholder="${A('ابحث برقم الطلب أو اسم العميل…', 'Search by request # or customer…')}" onkeydown="if(event.key==='Enter')App.search(this.value)"></label>
        <div class="sp"></div>
        ${inFrame ? '' : `<select class="input hide-m" style="width:auto;border-radius:999px;padding:7px 12px" onchange="App.as(this.value)" title="${A('عرض تجريبي', 'Demo view')}">${[['customer:ind', 'عميل فرد', 'Individual customer'], ['customer:biz', 'عميل منشأة', 'Company customer'], ['employee', 'موظف', 'Employee'], ['supervisor', 'مشرف', 'Supervisor']].map(([k, a, e]) => `<option value="${k}" ${k === (R.role === 'customer' ? 'customer:' + ctype : R.role) ? 'selected' : ''}>${A('عرض: ', 'View: ')}${A(a, e)}</option>`).join('')}</select>`}
        <button class="pill" onclick="App.lang()">${en() ? 'العربية' : 'EN'}</button>
        <button class="iconbtn" onclick="App.theme()">${ic(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon')}</button>
        <button class="iconbtn" onclick="App.notif()">${ic('bell')}<span class="dot"></span></button>
      </header>
      <div class="page">${content}</div>
    </main>
    <nav class="bottom-nav">${menu.slice(0, 4).map(([id, i, a, e]) => `<button class="${active === id ? 'active' : ''}" onclick="App.go('${link(id)}')">${ic(i)}<span>${A(a, e)}</span></button>`).join('')}<button onclick="App.side()">${ic('menu')}<span>${A('المزيد', 'More')}</span></button></nav>
  </div>`;
}

/* ======================================================
   CUSTOMER PAGES
   ====================================================== */
const C = {};
C.home = () => {
  if (ctype === 'biz') return bizHome();
  const mine = tickets.filter(t => t.cust === cid()), active = mine.filter(t => t.st !== 'done');
  const nextMeet = meetings.find(m => m.cust === cid());
  return hero(A('مرحبًا بك', 'Welcome back'), A('أهلًا عبدالله 👋', 'Hi Abdullah 👋'), A(`لديك ${active.length} طلبات نشطة. نبلغك بكل تحديث عبر واتساب.`, `You have ${active.length} active requests. We'll update you on WhatsApp.`),
    `<button class="btn" onclick="App.go('${link('services')}')">${ic('plus')}${A('طلب خدمة جديدة', 'New request')}</button>${nextMeet ? `<button class="btn light" onclick="App.go('${link('room', nextMeet.id)}')">${ic('video')}${A('اجتماعك ', 'Your meeting ')}${nextMeet.when}</button>` : ''}`) +
  `<div class="card-h section" style="margin-top:26px"><h2>${A('طلباتك النشطة', 'Active requests')}</h2><button class="link" onclick="App.go('${link('requests')}')">${A('عرض الكل', 'View all')}</button></div>
   <div class="grid g2">${active.map(reqCard).join('') || `<div class="card empty">${A('لا توجد طلبات نشطة', 'No active requests')}</div>`}</div>
   <div class="card-h section" style="margin-top:26px"><h2>${A('خدمات مقترحة', 'Suggested services')}</h2><button class="link" onclick="App.go('${link('services')}')">${A('كل الخدمات', 'All services')}</button></div>
   <div class="grid g3">${services.filter(s => s.on).slice(0, 3).map(svcCard).join('')}</div>`;
};
function reqCard(t) {
  const s = svc(t.svc);
  return `<div class="card hov" style="cursor:pointer" onclick="App.go('${link('request', t.id)}')"><div style="display:flex;gap:12px;align-items:center">${svcLogo(s)}<div style="flex:1;min-width:0"><div style="font-weight:700">${nm(s)}</div><div class="small muted">#${t.id} · ${platName(s)}</div></div>${stB(t.st)}</div>${journey(t.st)}
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span class="small muted">${A('المختص: ', 'Specialist: ')}${staffName(t.emp)}</span>${typeB(t)}</div></div>`;
}
let svcQ = '';
C.services = () => {
  const list = services.filter(s => s.on && (!svcQ || (s.ar + s.en + platName(s)).toLowerCase().includes(svcQ.toLowerCase())));
  return hero(A('الخدمات', 'Services'), A('اختر الخدمة وابدأ طلبك', 'Pick a service and start'), A('كل الخدمات مع السعر ومدة الإنجاز.', 'Every service with its price and turnaround.')) +
  `<div class="toolbar"><label class="search" style="max-width:340px">${ic('search')}<input value="${esc(svcQ)}" placeholder="${A('ابحث عن خدمة أو منصة', 'Search service or platform')}" oninput="App.svcSearch(this.value)"></label></div>
  <div class="chips" style="margin-bottom:16px"><button class="chip ${!svcQ ? 'on' : ''}" onclick="App.svcSearch('')">${A('الكل', 'All')}</button>${platforms.map(p => `<button class="chip ${svcQ === p.en ? 'on' : ''}" onclick="App.svcSearch('${esc(p.en)}')">${plogo(p.id, 'sm')}${nm(p)}</button>`).join('')}</div>
  <div class="grid g3">${list.map(svcCard).join('') || `<div class="card empty">${A('لا توجد نتائج', 'No results')}</div>`}</div>`;
};
let wiz = null;
C.new = () => {
  if (!wiz) wiz = { svc: R.id || services.find(s => s.on).id, type: 'f', step: 1, pay: 'mada', docs: [] };
  const s = svc(wiz.svc), total = s.price + (wiz.type === 'f' ? D.followUpFee : 0), vat = total * 0.15;
  const stepNames = [['الخدمة', 'Service'], ['التفاصيل', 'Details'], ['الدفع', 'Payment'], ['تم', 'Done']];
  const head = `<div class="journey" style="max-width:560px;margin:0 auto 22px">${stepNames.map((n, i) => `<div class="${i < wiz.step ? 'done' : ''} ${i === wiz.step - 1 ? 'cur' : ''}">${P(n)}</div>`).join('')}</div>`;
  const summary = `<div class="card" style="position:sticky;top:84px"><div style="display:flex;gap:12px;align-items:center">${svcLogo(s, 'lg')}<div><b>${nm(s)}</b><div class="small muted">${platName(s)}</div></div></div>
    <div class="tline" style="margin-top:14px"><span>${A('سعر الخدمة', 'Service')}</span><b>${money(s.price)}</b></div>
    ${wiz.type === 'f' ? `<div class="tline"><span>${A('المتابعة', 'Follow-up')}</span><b>${money(D.followUpFee)}</b></div>` : ''}
    <div class="tline"><span>${A('ضريبة ١٥٪', 'VAT 15%')}</span><b>${money(vat)}</b></div><div class="tline big"><span>${A('الإجمالي', 'Total')}</span><span>${money(total + vat)}</span></div>
    <div class="small muted">${ic('timer')} ${A('مدة الإنجاز: ', 'Turnaround: ')}${daysTxt(s.days)}</div></div>`;
  let body = '';
  if (wiz.step === 1) body = `<div class="card"><h2 style="margin-bottom:12px">${A('اختر الخدمة', 'Choose the service')}</h2>
      <select class="input" onchange="App.wiz('svc',this.value)">${services.filter(x => x.on).map(x => `<option value="${x.id}" ${x.id === s.id ? 'selected' : ''}>${nm(x)} — ${money(x.price)}</option>`).join('')}</select>
      <h2 style="margin:22px 0 12px">${A('نوع الطلب', 'Request type')}</h2>
      <div class="grid g2">${[['t', 'تذكرة فقط', 'Ticket only', 'ننجز الخدمة ونرسل لك النتيجة', 'We do it and send you the result', 0], ['f', 'تذكرة + متابعة', 'Ticket + follow-up', 'مختص يتابع مع المنصة ويحدثك أولًا بأول، مع محادثة واجتماع افتراضي', 'A specialist follows up with the platform, chat and video meeting included', D.followUpFee]].map(([k, a, e, da, de, fee]) => `<label class="opt ${wiz.type === k ? 'on' : ''}" onclick="App.wiz('type','${k}')"><input type="radio" ${wiz.type === k ? 'checked' : ''}><div class="grow"><b>${A(a, e)}</b><div class="small muted">${A(da, de)}</div></div><div class="pr">${fee ? '+' + money(fee) : A('مشمول', 'Included')}</div></label>`).join('')}</div>
      <div style="display:flex;justify-content:flex-end;margin-top:20px"><button class="btn" onclick="App.wiz('step',2)">${A('التالي', 'Next')}${fwd()}</button></div></div>`;
  if (wiz.step === 2) body = `<div class="card"><h2 style="margin-bottom:14px">${A('تفاصيل الطلب', 'Request details')}</h2>
      <div class="grid g2"><label class="field">${A('الاسم', 'Name')}<input class="input" value="${esc(custName(cid()))}"></label><label class="field">${A('الجوال', 'Mobile')}<input class="input" dir="ltr" value="${cust(cid())[4]}"></label></div>
      <label class="field" style="margin-top:12px">${A('الهوية الوطنية / الإقامة أو السجل التجاري', 'National ID / Iqama or CR')}<input class="input" dir="ltr" placeholder="1XXXXXXXXX"></label>
      <label class="field" style="margin-top:12px">${A('اشرح طلبك', 'Describe your request')}<textarea class="input" rows="4" placeholder="${A('مثال: توثيق عقد عمل لموظف جديد…', 'e.g. document a contract for a new employee…')}"></textarea></label>
      <div class="field" style="margin-top:12px">${A('المستندات', 'Documents')}
        <label class="attach" style="cursor:pointer;border-style:dashed;justify-content:center;padding:18px">${ic('upload-cloud')}<span>${A('اضغط لرفع الملفات', 'Click to upload files')}</span><input type="file" multiple hidden onchange="App.docs(this.files)"></label>
        ${wiz.docs.map(d => `<div class="attach">${ic('file-check')}<span style="flex:1">${esc(d)}</span><span class="badge ok">${A('مرفوع', 'Uploaded')}</span></div>`).join('')}
        <div class="small muted" style="font-weight:400">${A('تحتاج نموذجًا؟ ', 'Need a form? ')}<a onclick="App.go('${link('forms')}')" style="cursor:pointer">${A('حمّل النماذج المطلوبة', 'Download required forms')}</a></div></div>
      <label class="small" style="display:flex;gap:8px;margin-top:14px"><input type="checkbox" checked style="accent-color:var(--accent)">${A('أرسل لي التحديثات عبر واتساب والرسائل النصية', 'Send me updates on WhatsApp and SMS')}</label>
      <div style="display:flex;justify-content:space-between;margin-top:20px"><button class="btn ghost" onclick="App.wiz('step',1)">${A('رجوع', 'Back')}</button><button class="btn" onclick="App.wiz('step',3)">${A('التالي: الدفع', 'Next: payment')}${fwd()}</button></div></div>`;
  if (wiz.step === 3) body = `<div class="card"><h2 style="margin-bottom:6px">${A('الدفع الإلكتروني', 'Online payment')}</h2><div class="small muted" style="margin-bottom:12px">${ic('lock')} ${A('دفع آمن ومشفّر', 'Secure, encrypted payment')}</div>
      ${[['mada', 'mada', 'مدى', 'credit-card'], ['apple', 'Apple Pay', 'Apple Pay', 'smartphone'], ['stc', 'STC Pay', 'STC Pay', 'wallet'], ['card', 'Visa / Mastercard', 'فيزا / ماستركارد', 'credit-card'], ['sadad', 'SADAD', 'سداد', 'landmark']].map(([k, e, a, i]) => `<label class="opt ${wiz.pay === k ? 'on' : ''}" onclick="App.wiz('pay','${k}')"><input type="radio" ${wiz.pay === k ? 'checked' : ''}><div class="grow" style="align-self:center"><b>${A(a, e)}</b></div><span style="display:flex;gap:6px">${({ mada: ['mada'], apple: ['apple'], stc: ['stc'], card: ['visa', 'mc'], sadad: ['sadad'] })[k].map(payImg).join('')}</span></label>`).join('')}
      ${wiz.pay === 'mada' || wiz.pay === 'card' ? `<div class="grid g2" style="margin-top:14px"><label class="field" style="grid-column:1/-1">${A('رقم البطاقة', 'Card number')}<input class="input" dir="ltr" value="4847 •••• •••• 2231"></label><label class="field">${A('الانتهاء', 'Expiry')}<input class="input" dir="ltr" value="09/29"></label><label class="field">CVV<input class="input" dir="ltr" value="•••"></label></div>` : ''}
      <div style="display:flex;justify-content:space-between;margin-top:20px;gap:10px;flex-wrap:wrap"><button class="btn ghost" onclick="App.wiz('step',2)">${A('رجوع', 'Back')}</button><button class="btn lg" onclick="App.pay()">${ic('lock')}${A('ادفع ', 'Pay ')}${money(total + vat)}</button></div></div>`;
  if (wiz.step === 4) {
    const t = tickets.find(x => x.id === wiz.created);
    return head + `<div class="card" style="max-width:620px;margin:0 auto;text-align:center"><div class="ic" style="width:70px;height:70px;margin:0 auto;background:var(--ok-soft);color:var(--ok)">${ic('badge-check')}</div>
      <h1 style="font-size:26px;margin:14px 0 6px">${A('تم الدفع وإنشاء طلبك', 'Paid — your request is created')}</h1><div class="muted">${A('رقم الطلب', 'Request number')} <b style="color:var(--text)">#${t.id}</b> · ${A('أرسلنا التفاصيل على واتساب', 'Details sent on WhatsApp')}</div>${journey('new')}
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:10px"><button class="btn" onclick="App.go('${link('request', t.id)}')">${ic('eye')}${A('تابع الطلب', 'Track request')}</button><button class="btn ghost" onclick="App.go('${link('invoice', t.id)}')">${ic('receipt')}${A('الفاتورة', 'Invoice')}</button></div></div>`;
  }
  return head + `<div class="grid g21" style="align-items:start">${body}${summary}</div>`;
};
C.requests = () => hero(A('طلباتي', 'My requests'), A('تابع طلباتك خطوة بخطوة', 'Track each request step by step'), '', `<button class="btn" onclick="App.go('${link('services')}')">${ic('plus')}${A('طلب جديد', 'New request')}</button>`) +
  `<div class="grid g2 section">${tickets.filter(t => t.cust === cid()).map(reqCard).join('')}</div>`;
C.request = () => {
  const t = tickets.find(x => x.id === R.id); if (!t) return C.requests();
  const s = svc(t.svc), m = meetings.find(x => x.tk === t.id), thread = seedMsgs(t).filter(x => x.w !== 'note');
  return `<button class="link" onclick="App.go('${link('requests')}')" style="margin-bottom:12px">${back()}${A('كل الطلبات', 'All requests')}</button>
  <div class="grid g21" style="align-items:start"><div>
    <div class="card"><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">${svcLogo(s, 'lg')}<div style="flex:1"><div class="small muted">#${t.id} · ${platName(s)}</div><h1 style="font-size:24px">${nm(s)}</h1></div><div class="chips">${stB(t.st)}${typeB(t)}</div></div>${journey(t.st)}</div>
    <div class="card section"><div class="card-h"><h2>${A('المحادثة مع المختص', 'Chat with your specialist')}</h2><span class="badge ok"><span class="d"></span>${A('متصل', 'Online')}</span></div>
      <div class="thread" id="thread" style="max-height:460px;overflow:auto">${thread.map(x => msgHtml(x, 'cust')).join('')}</div>
      <div class="composer"><textarea id="reply" placeholder="${A('اكتب رسالتك…', 'Type a message…')}"></textarea><div class="bar"><label class="iconbtn" style="width:34px;height:34px">${ic('paperclip')}<input type="file" hidden onchange="App.toast('${A('تم إرفاق الملف', 'File attached')}')"></label><div class="sp"></div><button class="btn sm" onclick="App.send('${t.id}','cust')">${ic('send')}${A('إرسال', 'Send')}</button></div></div></div>
  </div><div>
    <div class="card"><h2 style="font-size:17px;margin-bottom:8px">${A('تفاصيل الطلب', 'Details')}</h2>
      <div class="prop"><span>${A('الجهة', 'Platform')}</span><b>${platName(s)}</b></div><div class="prop"><span>${A('المختص', 'Specialist')}</span><b>${staffName(t.emp)}</b></div>
      <div class="prop"><span>${A('المهلة', 'SLA')}</span>${slaB(t)}</div><div class="prop"><span>${A('المدفوع', 'Paid')}</span><b>${money(t.paid)}</b></div>
      <button class="btn ghost block" style="margin-top:12px" onclick="App.go('${link('invoice', t.id)}')">${ic('receipt')}${A('عرض الفاتورة', 'View invoice')}</button></div>
    <div class="card section"><h2 style="font-size:17px;margin-bottom:8px">${A('الاجتماع الافتراضي', 'Video meeting')}</h2>
      ${m ? `<div class="row"><div class="ic">${ic('video')}</div><div class="grow"><div class="t">${nm(m)}</div><div class="s">${m.when}</div></div></div><button class="btn block" onclick="App.go('${link('room', m.id)}')">${ic('video')}${A('انضم للاجتماع', 'Join meeting')}</button>`
        : `<p class="muted small">${A('تحتاج تتكلم مع المختص؟ احجز مكالمة فيديو.', 'Want to talk? Book a video call.')}</p><button class="btn ghost block" onclick="App.schedule('${t.id}')">${ic('calendar-plus')}${A('احجز اجتماعًا', 'Book a meeting')}</button>`}</div>
    <div class="card section"><h2 style="font-size:17px;margin-bottom:8px">${A('المستندات', 'Documents')}</h2><div class="attach">${ic('file-text')}<span style="flex:1">ID.pdf</span></div><div class="attach" style="margin-top:8px">${ic('file-text')}<span style="flex:1">CR.pdf</span></div></div>
  </div></div>`;
};
C.invoices = () => hero(A('الفواتير', 'Invoices'), A('فواتيرك الإلكترونية', 'Your e-invoices'), A('فواتير ضريبية متوافقة مع هيئة الزكاة والضريبة والجمارك.', 'ZATCA-compliant VAT invoices.')) + invoiceTable(tickets.filter(t => t.cust === cid()));
function invoiceTable(list) {
  return `<div class="card tbl section"><table><tr><th>${A('الفاتورة', 'Invoice')}</th><th>${A('الخدمة', 'Service')}</th>${R.role !== 'customer' ? `<th>${A('العميل', 'Customer')}</th>` : ''}<th>${A('المبلغ', 'Amount')}</th><th>${A('الحالة', 'Status')}</th></tr>
    ${list.map(t => `<tr class="click" onclick="App.go('${link('invoice', t.id)}')"><td class="muted">INV-${t.id.slice(4)}</td><td>${nm(svc(t.svc))}</td>${R.role !== 'customer' ? `<td>${custName(t.cust)}</td>` : ''}<td class="money">${money(t.paid * 1.15)}</td><td><span class="badge ok">${A('مدفوعة', 'Paid')}</span></td></tr>`).join('')}</table></div>`;
}
C.invoice = () => {
  const t = tickets.find(x => x.id === R.id) || tickets[0], s = svc(t.svc), vat = t.paid * 0.15;
  return `<div class="no-print" style="display:flex;gap:10px;margin-bottom:14px"><button class="link" onclick="history.back()">${back()}${A('رجوع', 'Back')}</button><div style="flex:1"></div><button class="btn sm ghost" onclick="window.print()">${ic('printer')}${A('طباعة / PDF', 'Print / PDF')}</button></div>
  <div class="card inv"><div style="display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap"><div class="brand"><div class="logo-mark">S</div><div><b>${BRAND}</b><div class="small muted">${A('الرقم الضريبي', 'VAT no.')} 3000 0000 0000 003</div></div></div><div style="text-align:end"><h2>${A('فاتورة ضريبية مبسطة', 'Simplified tax invoice')}</h2><div class="muted small">INV-${t.id.slice(4)} · 28/09/2026</div></div></div>
    <div class="grid g2" style="margin:22px 0"><div><div class="small muted">${A('العميل', 'Customer')}</div><b>${custName(t.cust)}</b><div class="small muted" dir="ltr" style="text-align:start">${cust(t.cust)[4]}</div></div><div><div class="small muted">${A('الطلب', 'Request')}</div><b>#${t.id}</b></div></div>
    <table><tr><th>${A('البند', 'Item')}</th><th style="text-align:end">${A('المبلغ', 'Amount')}</th></tr><tr><td>${nm(s)}${t.type === 'f' ? ' + ' + A('متابعة', 'follow-up') : ''}</td><td style="text-align:end" class="money">${money(t.paid)}</td></tr>
    <tr><td>${A('ضريبة القيمة المضافة ١٥٪', 'VAT 15%')}</td><td style="text-align:end" class="money">${money(vat)}</td></tr><tr><td><b>${A('الإجمالي', 'Total')}</b></td><td style="text-align:end" class="money"><b>${money(t.paid + vat)}</b></td></tr></table>
    <div style="display:flex;justify-content:space-between;align-items:end;margin-top:22px;gap:20px"><div class="small muted">${A('تم الدفع عبر مدى · شكرًا لتعاملكم معنا', 'Paid by mada · Thank you')}</div><div class="qr" title="ZATCA QR"></div></div></div>`;
};
C.forms = () => hero(A('النماذج', 'Forms'), A('النماذج المطلوبة', 'Required forms'), A('حمّل النماذج واملأها قبل رفع الطلب أو قبل الاجتماع.', 'Download and fill them before your request or meeting.')) +
  `<div class="grid g2 section">${D.forms.map(f => `<div class="card hov stat"><div class="ic">${ic(f[2] === 'PDF' ? 'file-text' : 'file-spreadsheet')}</div><div style="flex:1"><b>${P(f)}</b><div class="small muted">${f[2]}</div></div><button class="btn sm ghost" onclick="App.toast('${A('تم التحميل', 'Downloaded')}','download')">${ic('download')}</button></div>`).join('')}</div>`;


/* ---------------- company customer ---------------- */
const EMPS = [
  ['محمد العنزي', 'Mohammed Alanazi', 'سعودي', 'Saudi', 'ok', 'ok', ''],
  ['Rahul Kumar', 'Rahul Kumar', 'هندي', 'Indian', 'warn', 'ok', '12/10/2026'],
  ['سلمان الدوسري', 'Salman Aldosari', 'سعودي', 'Saudi', 'ok', 'ok', ''],
  ['Ahmed Hassan', 'Ahmed Hassan', 'مصري', 'Egyptian', 'ok', 'bad', '03/01/2027'],
  ['نوف الشمري', 'Nouf Alshammari', 'سعودية', 'Saudi', 'ok', 'ok', ''],
  ['Jose Santos', 'Jose Santos', 'فلبيني', 'Filipino', 'bad', 'ok', '20/10/2026'],
];
const okB = (k, a, e) => `<span class="badge ${k}">${k === 'ok' ? ic('check') : ic('alert-circle')}${A(a, e)}</span>`;
function bizHome() {
  const mine = tickets.filter(t => t.cust === 'C2'), active = mine.filter(t => t.st !== 'done');
  return hero(A('حساب منشأة', 'Company account'), A('مسار التجارية', 'Masar Trading'), A(`باقة النمو · ٤٨ موظفًا · ${active.length} طلبات نشطة · مدير حسابكم: نورة السبيعي`, `Growth plan · 48 employees · ${active.length} active requests · Account manager: Noura Alsubaie`),
    `<button class="btn" onclick="App.go('${link('services')}')">${ic('plus')}${A('طلب خدمة للمنشأة', 'New company request')}</button><button class="btn light" onclick="App.go('${link('employees')}')">${ic('users')}${A('الموظفون', 'Employees')}</button><button class="btn light" onclick="App.schedule()">${ic('video')}${A('اجتماع مع مدير الحساب', 'Meet your account manager')}</button>`) +
  `<div class="grid g4 section">${stat('users', A('الموظفون', 'Employees'), 48, A('٣١ سعودي · ١٧ غير سعودي', '31 Saudi · 17 non-Saudi'))}${stat('badge-percent', A('نطاقات', 'Nitaqat'), A('أخضر متوسط', 'Mid green'), A('نسبة التوطين ٦٤٪', 'Saudization 64%'), true)}${stat('shield-check', A('التأمينات', 'GOSI'), A('محدّثة', 'Up to date'), A('آخر تحديث قبل ٣ أيام', 'updated 3 days ago'))}${stat('wallet', A('حماية الأجور', 'Wage protection'), '98%', A('ملف سبتمبر مرفوع', 'September file submitted'), true)}</div>
  <div class="grid g21 section"><div class="card"><div class="card-h"><h2>${A('تنبيهات تحتاج إجراء', 'Needs action')}</h2><span class="badge warn">3</span></div>
    ${[['id-card', 'إقامة Jose Santos تنتهي خلال ٢٢ يومًا', 'Jose Santos’ iqama expires in 22 days', 's1'], ['file-signature', 'عقد Rahul Kumar غير موثق في قوى', 'Rahul Kumar’s contract is not documented on Qiwa', 's1'], ['shield-alert', 'Ahmed Hassan غير مسجل في التأمينات', 'Ahmed Hassan is not registered with GOSI', 's3']].map(([i, a, e, sid]) => `<div class="row"><div class="ic" style="background:var(--warn-soft);color:var(--warn)">${ic(i)}</div><div class="grow"><div class="t">${A(a, e)}</div></div><button class="btn sm" onclick="App.start('${sid}')">${A('أنجزها لي', 'Handle it')}</button></div>`).join('')}</div>
    <div class="card"><div class="card-h"><h2>${A('الاشتراك', 'Subscription')}</h2><span class="badge">${A('النمو', 'Growth')}</span></div><div class="small muted">${A('الطلبات المستخدمة هذا الشهر', 'Requests used this month')}</div><div style="display:flex;justify-content:space-between;margin:6px 0"><b>14 / 25</b><span class="small muted">${A('يتجدد ١ أكتوبر', 'Renews 1 Oct')}</span></div><div class="progress"><i style="width:56%"></i></div><button class="btn sm ghost block" style="margin-top:16px" onclick="App.go('${link('plan')}')">${A('إدارة الاشتراك', 'Manage plan')}</button></div></div>
  <div class="card-h section" style="margin-top:26px"><h2>${A('طلبات المنشأة', 'Company requests')}</h2><button class="link" onclick="App.go('${link('requests')}')">${A('عرض الكل', 'View all')}</button></div>
  <div class="grid g2">${mine.map(reqCard).join('')}</div>`;
}
C.employees = () => hero(A('الموظفون', 'Employees'), A('موظفو المنشأة', 'Company employees'), A('حالة كل موظف في قوى والتأمينات، مع طلب أي خدمة له بضغطة.', 'Each employee’s Qiwa and GOSI status — request a service for anyone in one click.'),
  `<button class="btn" onclick="App.toast('${A('تم رفع ملف الموظفين', 'Employee file uploaded')}','upload')">${ic('upload')}${A('رفع ملف Excel', 'Upload Excel')}</button>`) +
  `<div class="grid g4 section">${stat('users', A('الإجمالي', 'Total'), 48, '')}${stat('flag', A('سعوديون', 'Saudi'), 31, '64%')}${stat('id-card', A('إقامات تنتهي قريبًا', 'Iqamas expiring'), 2, A('خلال ٣٠ يومًا', 'within 30 days'))}${stat('file-warning', A('عقود غير موثقة', 'Undocumented contracts'), 1, A('في قوى', 'on Qiwa'))}</div>
  <div class="card tbl section"><table><tr><th>${A('الموظف', 'Employee')}</th><th>${A('الجنسية', 'Nationality')}</th><th>${A('عقد قوى', 'Qiwa contract')}</th><th>${A('التأمينات', 'GOSI')}</th><th>${A('انتهاء الإقامة', 'Iqama expiry')}</th><th></th></tr>
  ${EMPS.map(e => `<tr><td><div style="display:flex;gap:10px;align-items:center"><div class="avatar sm">${e[1][0]}</div><b>${A(e[0], e[1])}</b></div></td><td>${A(e[2], e[3])}</td><td>${e[4] === 'ok' ? okB('ok', 'موثق', 'Documented') : e[4] === 'warn' ? okB('warn', 'غير موثق', 'Not documented') : okB('bad', 'يحتاج تجديد', 'Renewal due')}</td><td>${e[5] === 'ok' ? okB('ok', 'مسجل', 'Registered') : okB('bad', 'غير مسجل', 'Not registered')}</td><td>${e[6] || '—'}</td><td><button class="btn sm ghost" onclick="App.start('${e[5] === 'bad' ? 's3' : 's1'}')">${A('طلب خدمة', 'Request')}</button></td></tr>`).join('')}</table></div>`;
C.plan = () => hero(A('الاشتراك', 'Subscription'), A('باقة النمو', 'Growth plan'), A('إدارة الموارد البشرية والخدمات الحكومية لمنشأتكم باشتراك شهري.', 'HR and government services for your company, monthly.'), `<button class="btn" onclick="App.meet()">${ic('arrow-up-circle')}${A('ترقية إلى المؤسسات', 'Upgrade to Enterprise')}</button>`) +
  `<div class="grid g3 section">${stat('gem', A('الباقة', 'Plan'), money(3500), A('شهريًا · تتجدد ١ أكتوبر', 'monthly · renews 1 Oct'))}${stat('ticket', A('الطلبات', 'Requests'), '14 / 25', A('هذا الشهر', 'this month'))}${stat('user-check', A('مدير الحساب', 'Account manager'), A('نورة', 'Noura'), A('متاحة ٩ص–٥م', 'available 9–5'))}</div>
  <div class="grid g2 section"><div class="card"><h2 style="margin-bottom:10px">${A('ما تشمله الباقة', 'Included')}</h2>${[['قوى ومُدد والتأمينات لكل الموظفين', 'Qiwa, Mudad & GOSI for all staff'], ['٢٥ طلبًا شهريًا', '25 requests per month'], ['تقرير شهري للموارد البشرية', 'Monthly HR report'], ['أولوية في المهلة', 'Priority SLA'], ['اجتماع شهري مع مدير الحساب', 'Monthly meeting with your account manager']].map(f => `<div class="row">${ic('check')}<span>${P(f)}</span></div>`).join('')}</div>
    <div class="card"><h2 style="margin-bottom:10px">${A('مستخدمو المنشأة', 'Company users')}</h2>${[['خالد العمري', 'Khalid Alomari', 'مدير الموارد البشرية', 'HR manager'], ['هند القرني', 'Hind Alqarni', 'محاسبة', 'Accountant']].map(u => `<div class="row"><div class="avatar sm">${u[1][0]}</div><div class="grow"><div class="t">${A(u[0], u[1])}</div><div class="s">${A(u[2], u[3])}</div></div></div>`).join('')}<button class="btn sm ghost" style="margin-top:10px" onclick="App.toast('${A('تم إرسال الدعوة', 'Invite sent')}','user-plus')">${ic('user-plus')}${A('إضافة مستخدم', 'Add user')}</button></div></div>
  <div class="card-h section" style="margin-top:26px"><h2>${A('تقارير شهرية', 'Monthly reports')}</h2></div><div class="grid g3">${['أغسطس', 'يوليو', 'يونيو'].map((m, i) => `<div class="card hov stat"><div class="ic">${ic('file-bar-chart')}</div><div style="flex:1"><b>${A('تقرير ' + m, ['August', 'July', 'June'][i] + ' report')}</b><div class="small muted">PDF</div></div><button class="btn sm ghost" onclick="App.toast('${A('تم التحميل', 'Downloaded')}','download')">${ic('download')}</button></div>`).join('')}</div>`;

/* ---------------- meetings ---------------- */
C.meetings = () => {
  const list = R.role === 'customer' ? meetings.filter(m => m.cust === cid()) : R.role === 'employee' ? meetings.filter(m => m.emp === 'AO') : meetings;
  return hero(A('الاجتماعات', 'Meetings'), A('الاجتماعات الافتراضية', 'Video meetings'), A('مكالمات فيديو بين العميل والمختص حسب الموعد، مع محادثة ومشاركة الشاشة.', 'Scheduled video calls between customer and specialist, with chat and screen sharing.'),
    `<button class="btn" onclick="App.schedule()">${ic('calendar-plus')}${A('جدولة اجتماع', 'Schedule a meeting')}</button>`) +
  `<div class="grid g2 section">${list.map(m => `<div class="card hov"><div style="display:flex;gap:12px;align-items:center"><div class="ic">${ic('video')}</div><div style="flex:1"><b>${nm(m)}</b><div class="small muted">${m.when} · #${m.tk}</div></div><span class="badge">${A('قادم', 'Upcoming')}</span></div>
    <div style="display:flex;gap:10px;align-items:center;margin-top:14px"><div class="avatar sm">${m.emp}</div><span class="small">${staffName(m.emp)}</span><span class="muted">·</span><span class="small">${custName(m.cust)}</span></div>
    <div style="display:flex;gap:8px;margin-top:14px"><button class="btn sm" onclick="App.go('${link('room', m.id)}')">${ic('video')}${A('انضم', 'Join')}</button><button class="btn sm ghost" onclick="App.toast('${A('تم نسخ رابط الاجتماع', 'Meeting link copied')}','link')">${ic('link')}${A('نسخ الرابط', 'Copy link')}</button></div></div>`).join('') || `<div class="card empty">${A('لا توجد اجتماعات', 'No meetings')}</div>`}</div>`;
};
let roomState = { mic: true, cam: true };
C.room = () => {
  const m = meetings.find(x => x.id === R.id) || meetings[0];
  const key = 'room-' + m.id; if (!msgs[key]) msgs[key] = [{ w: 'staff', who: m.emp, text: A('أهلًا، هل تسمعني بوضوح؟', 'Hi, can you hear me clearly?'), at: A('الآن', 'now') }];
  const meSide = R.role === 'customer' ? 'cust' : 'staff';
  const other = R.role === 'customer' ? [m.emp, staffName(m.emp)] : [cust(m.cust)[1][0], custName(m.cust)];
  return `<button class="link" onclick="App.go('${link('meetings')}')" style="margin-bottom:10px">${back()}${A('الاجتماعات', 'Meetings')}</button>
  <div class="card-h"><div><div class="small muted">#${m.tk} · ${m.when}</div><h2>${nm(m)}</h2></div><span class="badge bad"><span class="d"></span>${A('مباشر', 'Live')} · 12:48</span></div>
  <div class="room"><div><div class="stage">
      <div class="tile speaking"><div class="avatar">${esc(other[0])}</div><span class="nm">${esc(other[1])}</span></div>
      <div class="tile">${roomState.cam ? `<div class="avatar">${R.role === 'customer' ? 'ع' : ME[R.role]}</div>` : `<div style="opacity:.6">${ic('video-off')}</div>`}<span class="nm">${A('أنت', 'You')}${roomState.mic ? '' : ' · ' + A('مكتوم', 'muted')}</span></div>
    </div>
    <div class="ctrls"><button class="${roomState.mic ? '' : 'off'}" onclick="App.roomT('mic')">${ic(roomState.mic ? 'mic' : 'mic-off')}</button><button class="${roomState.cam ? '' : 'off'}" onclick="App.roomT('cam')">${ic(roomState.cam ? 'video' : 'video-off')}</button><button onclick="App.toast('${A('بدأت مشاركة الشاشة', 'Screen sharing started')}','monitor-up')">${ic('monitor-up')}</button><button onclick="App.toast('${A('بدأ التسجيل', 'Recording started')}','circle-dot')">${ic('circle-dot')}</button><button class="end" onclick="App.endCall()">${ic('phone-off')}</button></div></div>
    <div class="card chatbox"><h2 style="font-size:17px;margin-bottom:8px">${A('المحادثة', 'Chat')}</h2><div class="thread" id="thread">${msgs[key].map(x => msgHtml(x, meSide)).join('')}</div>
      <div style="display:flex;gap:8px;margin-top:10px"><input class="input" id="reply" placeholder="${A('اكتب رسالة…', 'Message…')}" onkeydown="if(event.key==='Enter')App.send('${key}','${meSide}')"><button class="btn sm" onclick="App.send('${key}','${meSide}')">${ic('send')}</button></div></div></div>`;
};
function msgHtml(x, meSide) {
  if (x.w === 'sys') return `<div class="msg sys"><div class="b">${ic('info')}${esc(x.text)} · ${esc(x.at)}</div></div>`;
  const mine = x.w === meSide || (x.w === 'note' && meSide === 'staff');
  const name = x.w === 'cust' ? custName(x.who) : staffName(x.who);
  const av = x.w === 'cust' ? cust(x.who)[1][0] : x.who;
  return `<div class="msg ${mine ? 'me' : ''} ${x.w === 'note' ? 'note' : ''}"><div class="avatar sm">${esc(av)}</div><div class="b"><div class="n"><b>${esc(name)}</b>${x.w === 'note' ? `<span class="badge warn">${ic('lock')}${A('ملاحظة داخلية', 'Internal note')}</span>` : ''}${x.ch ? `<span class="badge mute">${ic(CH[x.ch][0])}${A(CH[x.ch][2], CH[x.ch][1])}</span>` : ''}<span>${esc(x.at)}</span></div>${esc(x.text)}</div></div>`;
}

/* ======================================================
   STAFF: DESK + TICKET PAGE
   ====================================================== */
let desk = { view: store.get('deskview', 'board'), f: 'all', q: '' };
C.desk = () => {
  const mineId = ME[R.role];
  const base = tickets.filter(t => R.role === 'supervisor' || t.emp === mineId || !t.emp);
  const f = base.filter(t => (desk.f === 'all' || (desk.f === 'mine' && t.emp === mineId) || (desk.f === 'unassigned' && !t.emp) || (desk.f === 'late' && t.st !== 'done' && t.age > slaOf(t)) || (desk.f === 'follow' && t.type === 'f'))
    && (!desk.q || (t.id + custName(t.cust) + nm(svc(t.svc))).toLowerCase().includes(desk.q.toLowerCase())));
  const late = base.filter(t => t.st !== 'done' && t.age > slaOf(t)).length;
  return hero(A('مكتب الخدمة', 'Service desk'), R.role === 'supervisor' ? A('كل التذاكر', 'All tickets') : A('تذاكري', 'My tickets'), A('كل طلب يفتح تذكرة هنا تلقائيًا. اسحب البطاقة لتغيير حالتها، أو افتحها لإدارتها بالكامل.', 'Every request opens a ticket here. Drag cards to change status, or open one to manage it fully.')) +
  `<div class="grid g4 section">${stat('inbox', A('جديدة', 'New'), base.filter(t => t.st === 'new').length, A('بانتظار الإسناد', 'awaiting assignment'))}${stat('loader', A('قيد التنفيذ', 'In progress'), base.filter(t => t.st === 'progress').length, A('متوسط يومين', 'avg. 2 days'))}${stat('alarm-clock', A('متأخرة', 'Overdue'), late, late ? A('تحتاج تصعيد', 'need escalation') : A('ممتاز', 'all good'))}${stat('circle-check-big', A('مكتملة', 'Completed'), base.filter(t => t.st === 'done').length, A('٩٤٪ ضمن المهلة', '94% on time'), true)}</div>
  <div class="toolbar"><div class="tabs">${[['all', 'الكل', 'All'], ['mine', 'المسندة إليّ', 'Mine'], ['unassigned', 'غير مسندة', 'Unassigned'], ['late', 'متأخرة', 'Overdue'], ['follow', 'مع متابعة', 'Follow-up']].map(([k, a, e]) => `<button class="${desk.f === k ? 'active' : ''}" onclick="App.desk('f','${k}')">${A(a, e)}</button>`).join('')}</div>
    <label class="search" style="max-width:260px">${ic('search')}<input value="${esc(desk.q)}" placeholder="${A('بحث', 'Search')}" oninput="App.deskQ(this.value)"></label><div class="sp"></div>
    <div class="tabs">${[['board', 'kanban', 'لوحة', 'Board'], ['list', 'list', 'قائمة', 'List']].map(([k, i, a, e]) => `<button class="${desk.view === k ? 'active' : ''}" onclick="App.desk('view','${k}')">${ic(i)}${A(a, e)}</button>`).join('')}</div></div>
  ${desk.view === 'board' ? `<div class="kanban">${Object.keys(ST).map(c => `<div class="col" data-col="${c}"><h3>${stB(c)}<span class="muted">${f.filter(t => t.st === c).length}</span></h3>${f.filter(t => t.st === c).map(tkCard).join('')}</div>`).join('')}</div>`
  : `<div class="card tbl"><table><tr><th>#</th><th>${A('الخدمة', 'Service')}</th><th>${A('العميل', 'Customer')}</th><th>${A('النوع', 'Type')}</th><th>${A('المسؤول', 'Assignee')}</th><th>${A('الأولوية', 'Priority')}</th><th>${A('الحالة', 'Status')}</th><th>SLA</th></tr>
    ${f.map(t => `<tr class="click" onclick="App.go('${link('ticket', t.id)}')"><td class="muted">${t.id}</td><td><div style="display:flex;gap:8px;align-items:center">${svcLogo(svc(t.svc), 'sm')}${nm(svc(t.svc))}</div></td><td>${custName(t.cust)}</td><td>${typeB(t)}</td><td>${staffName(t.emp)}</td><td>${prB(t.p)}</td><td>${stB(t.st)}</td><td>${slaB(t)}</td></tr>`).join('')}</table></div>`}`;
};
function tkCard(t) {
  const pct = Math.min(100, t.age / slaOf(t) * 100), s = svc(t.svc);
  return `<div class="tk" draggable="true" data-id="${t.id}" onclick="App.go('${link('ticket', t.id)}')"><div style="display:flex;justify-content:space-between;align-items:center"><span class="id">#${t.id}</span>${prB(t.p)}</div>
    <div style="display:flex;gap:8px;align-items:center;margin:8px 0">${svcLogo(s, 'sm')}<div class="ti" style="margin:0">${nm(s)}</div></div>
    <div class="meta">${ic(CH[t.ch][0])}<span>${custName(t.cust)}</span>${t.type === 'f' ? ic('radar') : ''}<span class="avatar sm" title="${staffName(t.emp)}">${t.emp || '—'}</span></div>
    ${t.st !== 'done' ? `<div class="sla"><i class="${pct >= 100 ? 'bad' : pct > 70 ? 'warn' : ''}" style="width:${pct}%"></i></div><div style="margin-top:8px">${slaB(t)}</div>` : ''}</div>`;
}
let composeNote = false;
C.ticket = () => {
  const t = tickets.find(x => x.id === R.id); if (!t) return C.desk();
  const s = svc(t.svc), p = plat(s.pl), c = cust(t.cust), thread = seedMsgs(t), m = meetings.find(x => x.tk === t.id);
  const sup = R.role === 'supervisor';
  const queue = tickets.filter(x => sup || x.emp === 'AO' || !x.emp);
  const canned = [['تم استلام مستنداتك وجارٍ العمل على طلبك.', 'We received your documents and are working on it.'], ['نحتاج صورة من الهوية الوطنية لإكمال الطلب.', 'We need a copy of your national ID to continue.'], ['تم إنجاز طلبك بنجاح ✅', 'Your request has been completed ✅']];
  return `<div class="tk-page">
  <div class="card tk-queue"><div class="card-h" style="margin:4px 6px 8px"><b>${A('قائمة التذاكر', 'Queue')}</b><button class="link small" onclick="App.go('${link('desk')}')">${A('اللوحة', 'Board')}</button></div>
    ${queue.map(x => `<button class="q ${x.id === t.id ? 'on' : ''}" onclick="App.go('${link('ticket', x.id)}')"><div style="display:flex;justify-content:space-between;gap:6px"><span class="small muted">#${x.id}</span>${stB(x.st)}</div><div style="font-weight:600;margin:4px 0 2px">${nm(svc(x.svc))}</div><div class="small muted">${custName(x.cust)}</div></button>`).join('')}</div>

  <div style="min-width:0">
    <div class="card"><button class="link small" onclick="App.go('${link('desk')}')">${back()}${A('كل التذاكر', 'All tickets')}</button>
      <div style="display:flex;gap:14px;align-items:center;margin-top:12px;flex-wrap:wrap">${svcLogo(s, 'lg')}<div style="flex:1;min-width:200px"><div class="small muted">#${t.id} · ${platName(s)}</div><h1 style="font-size:22px">${nm(s)} — ${custName(t.cust)}</h1><div class="chips" style="margin-top:8px">${stB(t.st)}${prB(t.p)}${typeB(t)}${slaB(t)}</div></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${!t.emp && !sup ? `<button class="btn sm" onclick="App.assign('${t.id}','${ME[R.role]}')">${ic('hand')}${A('استلام التذكرة', 'Take ticket')}</button>` : ''}${t.st !== 'done' ? `<button class="btn sm ghost" onclick="App.status('${t.id}','done')">${ic('check')}${A('إغلاق كمكتمل', 'Mark completed')}</button>` : ''}</div></div>
      ${journey(t.st)}</div>

    <div class="card section"><div class="tabs" style="margin-bottom:6px"><button class="active">${ic('messages-square')}${A('المحادثة', 'Conversation')}</button><button onclick="App.toast('${A('سجل النشاط', 'Activity log')}','history')">${ic('history')}${A('النشاط', 'Activity')}</button><button onclick="App.toast('${A('مرفقان', '2 attachments')}','paperclip')">${ic('paperclip')}${A('المرفقات', 'Files')} (2)</button></div>
      <div class="thread" id="thread" style="max-height:520px;overflow:auto">${thread.map(x => msgHtml(x, 'staff')).join('')}</div>
      <div class="composer ${composeNote ? 'note' : ''}">
        <div class="bar" style="border-top:0;border-bottom:1px solid var(--border)"><div class="tabs"><button class="${composeNote ? '' : 'active'}" onclick="App.note(false)">${ic('reply')}${A('رد للعميل', 'Reply')}</button><button class="${composeNote ? 'active' : ''}" onclick="App.note(true)">${ic('lock')}${A('ملاحظة داخلية', 'Internal note')}</button></div><div class="sp"></div>
          ${composeNote ? '' : `<select class="input" id="ch" style="width:auto;padding:6px 10px">${Object.entries(CH).map(([k, v]) => `<option value="${k}">${A(v[2], v[1])}</option>`).join('')}</select>`}</div>
        <textarea id="reply" placeholder="${composeNote ? A('ملاحظة يراها الفريق فقط…', 'Only your team sees this…') : A('اكتب ردك للعميل…', 'Write to the customer…')}"></textarea>
        <div class="bar">${composeNote ? '' : `<select class="input" style="width:auto;max-width:210px;padding:6px 10px" onchange="if(this.value)document.getElementById('reply').value=this.value;this.selectedIndex=0"><option value="">${A('ردود جاهزة', 'Canned replies')}</option>${canned.map(x => `<option>${esc(P(x))}</option>`).join('')}</select>`}
          <label class="iconbtn" style="width:34px;height:34px">${ic('paperclip')}<input type="file" hidden onchange="App.toast('${A('تم إرفاق الملف', 'File attached')}')"></label><div class="sp"></div>
          <button class="btn sm" onclick="App.send('${t.id}','${composeNote ? 'note' : 'staff'}')">${ic('send')}${composeNote ? A('حفظ الملاحظة', 'Save note') : A('إرسال', 'Send')}</button></div></div></div>
  </div>

  <div class="tk-props">
    <div class="card"><h2 style="font-size:16px;margin-bottom:6px">${A('خصائص التذكرة', 'Properties')}</h2>
      <div class="prop"><span>${A('الحالة', 'Status')}</span><select class="input" onchange="App.status('${t.id}',this.value)">${Object.keys(ST).map(k => `<option value="${k}" ${t.st === k ? 'selected' : ''}>${A(ST[k][0], ST[k][1])}</option>`).join('')}</select></div>
      <div class="prop"><span>${A('الأولوية', 'Priority')}</span><select class="input" onchange="App.prio('${t.id}',this.value)">${Object.keys(PR).map(k => `<option value="${k}" ${t.p === k ? 'selected' : ''}>${A(PR[k][0], PR[k][1])}</option>`).join('')}</select></div>
      <div class="prop"><span>${A('المسؤول', 'Assignee')}</span>${sup ? `<select class="input" onchange="App.assign('${t.id}',this.value)"><option value="">${A('غير مسندة', 'Unassigned')}</option>${D.staff.filter(x => x[3] === 'employee').map(x => `<option value="${x[0]}" ${t.emp === x[0] ? 'selected' : ''}>${A(x[1], x[2])}</option>`).join('')}</select>` : `<b>${staffName(t.emp)}</b>`}</div>
      <div class="prop"><span>${A('النوع', 'Type')}</span>${typeB(t)}</div>
      <div class="prop"><span>${A('القناة', 'Channel')}</span><span>${A(CH[t.ch][2], CH[t.ch][1])}</span></div>
      <div class="prop"><span>${A('المهلة', 'SLA')}</span>${slaB(t)}</div>
      <div class="prop"><span>${A('المدفوع', 'Paid')}</span><a style="cursor:pointer" onclick="App.go('${link('invoice', t.id)}')">${money(t.paid)}</a></div>
      ${sup ? `<div class="small muted" style="margin-top:8px">${ic('shield-check')} ${A('المشرف يسند التذاكر ويعيد إسنادها', 'Supervisors assign and reassign tickets')}</div>` : ''}</div>
    <div class="card section"><h2 style="font-size:16px;margin-bottom:10px">${A('العميل', 'Customer')}</h2><div style="display:flex;gap:10px;align-items:center"><div class="avatar">${esc(c[1][0])}</div><div><b>${custName(t.cust)}</b><div class="small muted" dir="ltr" style="text-align:start">${c[4]}</div></div></div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn sm ghost" onclick="App.toast('${A('تم إرسال واتساب', 'WhatsApp sent')}','message-circle')">${ic('message-circle')}WhatsApp</button><button class="btn sm ghost" onclick="App.toast('${A('تم إرسال رسالة نصية', 'SMS sent')}','smartphone')">${ic('smartphone')}SMS</button></div></div>
    ${p ? `<div class="card section"><h2 style="font-size:16px;margin-bottom:10px">${A('المنصة', 'Platform')}</h2><div style="display:flex;gap:10px;align-items:center">${plogo(p.id)}<b style="flex:1">${nm(p)}</b><a class="btn sm ghost" href="${esc(p.url)}" target="_blank" rel="noopener">${ic('external-link')}${A('فتح', 'Open')}</a></div></div>` : ''}
    <div class="card section"><h2 style="font-size:16px;margin-bottom:10px">${A('الاجتماع', 'Meeting')}</h2>${m ? `<div class="small" style="margin-bottom:10px">${ic('calendar')} ${m.when}</div><button class="btn sm block" onclick="App.go('${link('room', m.id)}')">${ic('video')}${A('بدء الاجتماع', 'Start meeting')}</button>` : `<button class="btn sm ghost block" onclick="App.schedule('${t.id}')">${ic('calendar-plus')}${A('جدولة اجتماع مع العميل', 'Schedule with customer')}</button>`}</div>
  </div></div>`;
};
C.customers = () => hero(A('العملاء', 'Customers'), A('قاعدة بيانات العملاء', 'Customer database'), A('بيانات تجريبية.', 'Mock data.')) +
  `<div class="card tbl section"><table><tr><th>${A('العميل', 'Customer')}</th><th>${A('النوع', 'Type')}</th><th>${A('الجوال', 'Mobile')}</th><th>${A('الطلبات', 'Requests')}</th><th>${A('المدفوع', 'Paid')}</th><th></th></tr>
  ${D.customers.map(c => { const ts = tickets.filter(t => t.cust === c[0]); return `<tr><td><div style="display:flex;gap:10px;align-items:center"><div class="avatar sm">${c[1][0]}</div><b>${A(c[1], c[2])}</b></div></td><td><span class="badge ${c[3] === 'biz' ? '' : 'mute'}">${c[3] === 'biz' ? A('منشأة', 'Company') : A('فرد', 'Individual')}</span></td><td dir="ltr" style="text-align:start">${c[4]}</td><td>${ts.length}</td><td class="money">${money(ts.reduce((a, t) => a + t.paid, 0))}</td><td><button class="btn sm ghost" onclick="App.toast('${A('تم إرسال واتساب', 'WhatsApp sent')}','message-circle')">${ic('message-circle')}</button></td></tr>`; }).join('')}</table></div>`;
C.platforms = () => hero(A('المنصات الحكومية', 'Government platforms'), A('كل المنصات في مكان واحد', 'Every platform in one place'), A('وصول سريع للموظف أثناء تنفيذ الطلبات.', 'Quick access while working on requests.'),
  R.role === 'supervisor' ? `<button class="btn" onclick="App.addPlatform()">${ic('plus')}${A('إضافة منصة', 'Add platform')}</button>` : '') +
  `<div class="grid g3 section">${platforms.map(p => `<div class="card hov"><div style="display:flex;gap:12px;align-items:center">${plogo(p.id, 'lg')}<div style="flex:1"><b style="font-size:16px">${nm(p)}</b><div class="small muted">${esc(p.domain || '')}</div></div></div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;gap:8px"><span class="small muted">${tickets.filter(t => svc(t.svc).pl === p.id && t.st !== 'done').length} ${A('تذاكر مفتوحة', 'open tickets')} · ${services.filter(s => s.pl === p.id).length} ${A('خدمات', 'services')}</span><span style="display:flex;gap:6px">${R.role === 'supervisor' ? `<label class="btn sm ghost" style="cursor:pointer" title="${A('تغيير الشعار', 'Change logo')}">${ic('image-up')}<input type="file" accept="image/*" hidden onchange="App.platLogo('${p.id}',this)"></label>` : ''}<a class="btn sm ghost" href="${esc(p.url)}" target="_blank" rel="noopener">${ic('external-link')}${A('فتح', 'Open')}</a></span></div></div>`).join('')}</div>`;

/* ======================================================
   SUPERVISOR
   ====================================================== */
const empOptions = sel => D.staff.filter(x => x[3] === 'employee').map(x => `<option value="${x[0]}" ${sel === x[0] ? 'selected' : ''}>${A(x[1], x[2])}</option>`).join('');
C.overview = () => {
  const open = tickets.filter(t => t.st !== 'done'), rev = tickets.reduce((a, t) => a + t.paid, 0) + 176340;
  return hero(A('لوحة المشرف', 'Supervisor overview'), A('مساء الخير، روان', 'Good evening, Rawan'), A(`${open.length} تذاكر مفتوحة · ${open.filter(t => !t.emp).length} غير مسندة · ${open.filter(t => t.age > slaOf(t)).length} متأخرة`, `${open.length} open · ${open.filter(t => !t.emp).length} unassigned · ${open.filter(t => t.age > slaOf(t)).length} overdue`),
    `<button class="btn" onclick="App.go('${link('desk')}')">${ic('kanban')}${A('فتح التذاكر', 'Open tickets')}</button><button class="btn light" onclick="App.addService()">${ic('plus')}${A('خدمة جديدة', 'New service')}</button>`) +
  `<div class="grid g4 section">${stat('wallet', A('إيرادات الشهر', 'Revenue (month)'), money(rev), '+12%', true)}${stat('inbox', A('طلبات اليوم', 'Requests today'), 17, A('٩ عبر واتساب', '9 via WhatsApp'))}${stat('timer', A('ضمن المهلة', 'Within SLA'), '94%', '+2%', true)}${stat('star', A('رضا العملاء', 'CSAT'), '4.9', A('من ٥', 'out of 5'))}</div>
  <div class="grid g21 section"><div class="card"><div class="card-h"><h2>${A('تحتاج إسناد', 'Needs assignment')}</h2><button class="link" onclick="App.desk('f','unassigned');App.go('${link('desk')}')">${A('عرض', 'View')}</button></div>
    ${open.filter(t => !t.emp).map(t => `<div class="row"><div>${svcLogo(svc(t.svc), 'sm')}</div><div class="grow"><div class="t">#${t.id} · ${nm(svc(t.svc))}</div><div class="s">${custName(t.cust)}</div></div><select class="input" style="width:auto" onchange="App.assign('${t.id}',this.value)"><option value="">${A('إسناد إلى…', 'Assign to…')}</option>${empOptions()}</select></div>`).join('') || `<div class="empty">${A('كل التذاكر مسندة 👍', 'Everything is assigned 👍')}</div>`}</div>
    <div class="card"><h2>${A('الطلبات هذا الأسبوع', 'Requests this week')}</h2>${bars([45, 62, 58, 80, 71, 92, 66], A('أحد إثن ثلا أرب خمي جمع سبت', 'Sun Mon Tue Wed Thu Fri Sat').split(' '), 5)}</div></div>
  <div class="grid g2 section"><div class="card"><h2 style="margin-bottom:8px">${A('أداء الفريق', 'Team performance')}</h2>${teamRows()}</div>
    <div class="card"><h2 style="margin-bottom:8px">${A('حسب المنصة', 'By platform')}</h2>${platforms.slice(0, 6).map((p, i) => `<div class="row">${plogo(p.id, 'sm')}<div class="grow"><div class="t">${nm(p)}</div><div class="progress" style="margin-top:6px"><i style="width:${[82, 64, 58, 40, 33, 21][i]}%"></i></div></div><b>${[82, 64, 58, 40, 33, 21][i]}</b></div>`).join('')}</div></div>`;
};
function teamRows() {
  return D.staff.filter(s => s[3] === 'employee').map((s, i) => { const n = tickets.filter(t => t.emp === s[0] && t.st !== 'done').length, v = [96, 91, 84][i] || 90; return `<div class="row"><div class="avatar sm">${s[0]}</div><div class="grow"><div class="t">${A(s[1], s[2])}</div><div class="s">${n} ${A('تذاكر مفتوحة', 'open tickets')}</div></div><div style="width:110px"><div class="progress"><i style="width:${v}%"></i></div></div><b>${v}%</b></div>`; }).join('');
}
C.catalog = () => hero(A('الخدمات والأسعار', 'Services & prices'), A('إدارة الخدمات', 'Manage services'), A('أضف خدمة جديدة بشعارها وسعرها — تظهر فورًا في الموقع العام وللعملاء والموظفين.', 'Add a service with its logo and price — it appears instantly on the public site, for customers and staff.'),
  `<button class="btn" onclick="App.addService()">${ic('plus')}${A('إضافة خدمة', 'Add service')}</button><button class="btn light" onclick="App.addPlatform()">${ic('globe')}${A('إضافة منصة', 'Add platform')}</button><button class="btn light" onclick="App.go('services')">${ic('eye')}${A('عرض في الموقع', 'View on site')}</button>`) +
  `<div class="card tbl section"><table><tr><th>${A('الخدمة', 'Service')}</th><th>${A('الجهة', 'Platform')}</th><th>${A('السعر (ر.س)', 'Price (SAR)')}</th><th>${A('المدة (أيام عمل)', 'Days')}</th><th>${A('مفعّلة', 'Active')}</th><th></th></tr>
  ${services.map(s => `<tr><td><div style="display:flex;gap:10px;align-items:center">${svcLogo(s, 'sm')}<b>${nm(s)}</b></div></td><td>${platName(s)}</td>
    <td style="width:130px"><input class="input money" type="number" min="0" value="${s.price}" onchange="App.svcSet('${s.id}','price',+this.value)"></td><td style="width:100px"><input class="input" type="number" min="1" value="${s.days}" onchange="App.svcSet('${s.id}','days',+this.value)"></td>
    <td><input type="checkbox" ${s.on ? 'checked' : ''} style="accent-color:var(--accent);width:18px;height:18px" onchange="App.svcSet('${s.id}','on',this.checked)"></td><td><button class="iconbtn" style="width:32px;height:32px" onclick="App.addService('${s.id}')">${ic('pencil')}</button></td></tr>`).join('')}</table></div>
  <div class="card section"><div class="card-h"><h2>${A('رسوم المتابعة', 'Follow-up fee')}</h2></div><div style="display:flex;gap:10px;align-items:center;max-width:320px"><input class="input money" type="number" value="${D.followUpFee}" onchange="App.fee(+this.value)"><span class="muted">${A('ر.س لكل طلب', 'SAR per request')}</span></div></div>`;
C.team = () => {
  const perms = [['عرض التذاكر المسندة', 'View assigned tickets', 1], ['عرض كل التذاكر', 'View all tickets', 0], ['استلام التذاكر غير المسندة', 'Take unassigned tickets', 1], ['إسناد التذاكر للموظفين', 'Assign tickets to staff', 0], ['الرد على العملاء وجدولة الاجتماعات', 'Reply to customers & schedule meetings', 1], ['إضافة الخدمات وتحديد الأسعار', 'Add services & set prices', 0], ['التقارير والمالية', 'Reports & finance', 0], ['إدارة الموظفين والصلاحيات', 'Manage staff & roles', 0]];
  return hero(A('الفريق', 'Team'), A('الفريق والصلاحيات', 'Team & permissions'), A('دوران: موظف ومشرف.', 'Two roles: employee and supervisor.'), `<button class="btn" onclick="App.addStaff()">${ic('user-plus')}${A('إضافة موظف', 'Add staff')}</button>`) +
  `<div class="grid g2 section"><div class="card"><h2 style="margin-bottom:8px">${A('أعضاء الفريق', 'Members')}</h2>${D.staff.map(s => `<div class="row"><div class="avatar">${s[0]}</div><div class="grow"><div class="t">${A(s[1], s[2])}</div><div class="s">${tickets.filter(t => t.emp === s[0] && t.st !== 'done').length} ${A('تذاكر مفتوحة', 'open tickets')}</div></div><span class="badge ${s[3] === 'supervisor' ? '' : 'mute'}">${P(ROLE_N[s[3]])}</span></div>`).join('')}</div>
  <div class="card tbl"><h2 style="margin-bottom:8px">${A('الصلاحيات', 'Permissions')}</h2><table><tr><th>${A('الصلاحية', 'Permission')}</th><th>${A('موظف', 'Employee')}</th><th>${A('مشرف', 'Supervisor')}</th></tr>
    ${perms.map(p => `<tr><td>${A(p[0], p[1])}</td><td><input type="checkbox" ${p[2] ? 'checked' : ''} style="accent-color:var(--accent);width:17px;height:17px" onchange="App.toast('${A('تم حفظ الصلاحيات', 'Permissions saved')}')"></td><td><input type="checkbox" checked disabled style="accent-color:var(--accent);width:17px;height:17px"></td></tr>`).join('')}</table></div></div>`;
};
let rep = 'week';
C.reports = () => {
  const sets = { day: [[20, 35, 52, 70, 64, 88, 72, 40], '8 10 12 14 16 18 20 22'.split(' ')], week: [[45, 62, 58, 80, 71, 92, 66], A('أحد إثن ثلا أرب خمي جمع سبت', 'Sun Mon Tue Wed Thu Fri Sat').split(' ')], month: [[55, 61, 70, 66, 74, 82, 78, 90, 86, 94, 88, 99], '1 2 3 4 5 6 7 8 9 10 11 12'.split(' ')] };
  const k = { day: [23, '8,420', '96%'], week: [148, '52,180', '94%'], month: [612, '184,250', '93%'] }[rep];
  return hero(A('التقارير', 'Reports'), A('التقارير والإحصائيات', 'Reports & statistics'), A('للخدمات والقوائم المالية — يومي وأسبوعي وشهري.', 'Services and financial statements — daily, weekly and monthly.'),
    `<button class="btn" onclick="App.toast('${A('تم تجهيز ملف Excel', 'Excel export ready')}','file-spreadsheet')">${ic('file-spreadsheet')}Excel</button><button class="btn light" onclick="App.toast('${A('تم تجهيز ملف PDF', 'PDF ready')}','file-text')">${ic('file-text')}PDF</button>`) +
  `<div class="toolbar"><div class="tabs">${[['day', 'يومي', 'Daily'], ['week', 'أسبوعي', 'Weekly'], ['month', 'شهري', 'Monthly']].map(([x, a, e]) => `<button class="${rep === x ? 'active' : ''}" onclick="App.rep('${x}')">${A(a, e)}</button>`).join('')}</div></div>
  <div class="grid g3">${stat('ticket', A('الطلبات', 'Requests'), k[0], '+8%', true)}${stat('wallet', A('الإيرادات', 'Revenue'), k[1] + A(' ر.س', ' SAR'), '+12%', true)}${stat('timer', A('ضمن المهلة', 'Within SLA'), k[2], A('الهدف ٩٠٪', 'target 90%'))}</div>
  <div class="grid g2 section"><div class="card"><h2>${A('حجم الطلبات', 'Request volume')}</h2>${bars(sets[rep][0], sets[rep][1])}</div><div class="card"><h2>${A('الإيرادات', 'Revenue')}</h2>${bars(sets[rep][0].map(v => Math.max(15, v - 12)), sets[rep][1])}</div></div>
  <div class="card tbl section"><h2 style="margin-bottom:8px">${A('القائمة المالية المختصرة', 'Financial summary')}</h2><table><tr><th>${A('البند', 'Item')}</th><th style="text-align:end">${A('المبلغ', 'Amount')}</th></tr>
    ${[['إيرادات الخدمات', 'Service revenue', 132400], ['اشتراكات الشركات', 'Company plans', 51850], ['رسوم بوابة الدفع', 'Payment gateway fees', -2210], ['رسائل SMS وواتساب', 'SMS & WhatsApp', -950], ['ضريبة القيمة المضافة المستحقة', 'VAT payable', -27637]].map(r => `<tr><td>${A(r[0], r[1])}</td><td style="text-align:end" class="money">${r[2] < 0 ? '−' : ''}${money(Math.abs(r[2]))}</td></tr>`).join('')}</table></div>`;
};
C.finance = () => hero(A('المالية', 'Finance'), A('المدفوعات والفواتير الإلكترونية', 'Payments & e-invoices'), A('كل المدفوعات إلكترونية — لا نقد ولا تحويل.', 'All payments are electronic — no cash or transfers.')) +
  `<div class="grid g4 section">${stat('wallet', A('الإيرادات', 'Revenue'), money(184250), '+12%', true)}${stat('credit-card', A('مدى', 'Mada'), '58%', A('من المدفوعات', 'of payments'))}${stat('smartphone', 'Apple Pay', '27%', A('من المدفوعات', 'of payments'))}${stat('receipt', A('الضريبة المستحقة', 'VAT due'), money(27637), A('الربع الحالي', 'this quarter'))}</div>` + invoiceTable(tickets);

/* ======================================================
   PRICING (hidden page: #pricing)
   ====================================================== */
const PX = D.pricing;
let psel = store.get('psel', { opt: [], care: 1, ext: Object.fromEntries(PX.external.map(e => [e[0], 0])) });
psel.vat = false;   // freelancer: no VAT
const pricingUnlocked = () => { try { return sessionStorage.getItem('solvia-price') === '1'; } catch (e) { return false; } };
function pricingTotals() {
  const build = PX.build.reduce((a, x) => a + x[4], 0) + PX.buildOptional.filter((x, i) => psel.opt.includes(i)).reduce((a, x) => a + x[4], 0);
  const care = 0;
  let eOnce = 0, eMonth = 0, eYear = 0;
  PX.external.forEach(e => { const o = e[4][psel.ext[e[0]] || 0]; eOnce += o[4]; eMonth += o[5]; eYear += o[6]; });
  const v = psel.vat ? 1.15 : 1;
  return { build, care, eOnce, eMonth, eYear, v, now: build * v, monthly: (care + eMonth) * v, firstYear: (build + eOnce + (care + eMonth) * 12 + eYear) * v };
}
function pricingPage() {
  const top = `<nav class="pub-nav">${brand()}<div class="links"></div><div class="tools"><button class="pill" onclick="App.lang()">${en() ? 'العربية' : 'EN'}</button><button class="iconbtn" onclick="App.theme()">${ic(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon')}</button>${pricingUnlocked() ? `<button class="btn sm ghost no-print" onclick="window.print()">${ic('printer')}<span class="hide-m">PDF</span></button>` : ''}</div></nav>`;
  if (!pricingUnlocked()) return top + `<div class="wrap"><div class="card lock"><div class="ic">${ic('lock-keyhole')}</div><h2>${A('عرض السعر', 'Price proposal')}</h2><p class="muted">${A('هذه الصفحة محمية. أدخل كلمة المرور.', 'This page is protected. Enter the password.')}</p>
    <form onsubmit="App.unlock(event)" style="display:flex;gap:8px;margin-top:18px"><input class="input" type="password" id="pw" placeholder="••••••••" autofocus><button class="btn">${ic('lock-open')}${A('فتح', 'Open')}</button></form><p id="pwErr" class="small" style="color:var(--bad);min-height:18px"></p></div></div>`;
  const t = pricingTotals();
  const freqTxt = o => o[5] ? money(o[5]) + A(' / شهريًا', ' / month') : o[6] ? money(o[6]) + A(' / سنويًا', ' / year') : o[4] ? money(o[4]) + A(' مرة واحدة', ' one-time') : A('بدون رسوم ثابتة', 'No fixed fee');
  return top + `<div class="wrap" style="padding-top:24px;padding-bottom:60px">
  <section class="hero"><div class="eyebrow">${ic('file-signature')}${A('عرض سعر', 'Price proposal')} · SLV-2026-01</div><h1>${A(`تطوير منصة ${BRAND} للخدمات الحكومية`, `Building the ${BRAND} government-services platform`)}</h1>
    <p>${A('العرض من جزأين: (١) تكلفة التطوير — بناء المنصة كاملة (الواجهات، الخلفية، قاعدة البيانات، الأمان، تجهيز الخادم والإطلاق) بمبلغ ثابت. (٢) خدمات خارجية إضافية يدفعها العميل للمزود مباشرة، وأنا أتولى إعدادها وربطها.', 'Two parts: (1) the development fee — building the whole platform (interfaces, back end, database, security, server setup and launch) for one fixed amount; (2) extra outside services the client pays to providers directly, which I set up and connect.')}</p>
    <div class="actions"><span class="badge" style="background:rgba(255,255,255,.1);color:#fff">${ic('calendar')}${A('مدة التنفيذ: شهران (٨ أسابيع)', 'Delivery: 2 months (8 weeks)')}</span><span class="badge" style="background:rgba(255,255,255,.1);color:#fff">${ic('clock')}${A('صالح ', 'Valid ')}${PX.terms.validity}${A(' يومًا', ' days')}</span></div></section>

  <div class="grid g21 section" style="align-items:start"><div>
    <div class="card bucket"><div class="bucket-h"><div class="ic">${ic('code-xml')}</div><div><span class="badge">${A('تكلفة التطوير', 'My fee')}</span><h2 style="margin-top:4px">${A('بناء المنصة', 'Building the platform')}</h2></div></div>
      <p class="muted small">${A('يشمل كل شيء لتشغيل المنصة: الموقع العام، تطبيق العميل، بوابة الموظفين والمشرف، قاعدة البيانات، الأمان، وتجهيز الخادم.', 'Everything to run the platform: public site, customer app, staff & supervisor portal, database, security and server setup.')}</p>
      ${PX.build.map(x => `<div class="line"><div style="display:flex;gap:10px"><span style="color:var(--ok)">${ic('check')}</span><div><b>${A(x[0], x[1])}</b><div class="d">${A(x[2], x[3])}</div></div></div><b class="money">${money(x[4])}</b></div>`).join('')}
      <div class="line" style="background:var(--accent-soft);border-radius:14px;padding:16px;border:0;margin-top:8px;align-items:center"><b style="font-size:16px">${A('تكلفة التطوير (مبلغ ثابت)', 'Development fee (fixed)')}</b><b class="money" style="font-size:24px;color:var(--accent)">${money(PX.build.reduce((a, x) => a + x[4], 0))}</b></div></div>

    <div class="card bucket section"><div class="bucket-h"><div class="ic">${ic('server')}</div><div><span class="badge info">${A('إضافي · يدفعها العميل للمزود', 'Extra · paid to providers')}</span><h2 style="margin-top:4px">${A('الخدمات الخارجية', 'Outside services')}</h2></div></div>
      <p class="muted small">${A('تكاليف تشغيل تُدفع للشركات المزودة مباشرة (أسعار تقريبية وتتغير حسب الاستخدام). أنا أتولى إعدادها وربطها ضمن البناء.', 'Running costs paid directly to providers (estimates; they vary with usage). I set them up and connect them as part of the build.')}</p>
      ${PX.external.map(e => `<div style="margin-top:18px"><div style="display:flex;gap:8px;align-items:center;font-weight:700">${ic(e[3])}${A(e[1], e[2])}</div>
        ${e[4].map((o, i) => `<label class="opt ${(psel.ext[e[0]] || 0) === i ? 'on' : ''}"><input type="radio" name="${e[0]}" ${(psel.ext[e[0]] || 0) === i ? 'checked' : ''} onchange="App.pext('${e[0]}',${i})"><div class="grow"><b>${A(o[0], o[1])}</b>${i === 0 ? ` <span class="badge ok">${A('موصى به', 'Recommended')}</span>` : ''}<div class="small muted">${A(o[2], o[3])}</div></div><div class="pr">${freqTxt(o)}</div></label>`).join('')}</div>`).join('')}</div>
  </div>

  <div class="sumbox"><div class="card"><div class="eyebrow">${A('الملخص', 'Summary')}</div>
    <div class="tline big"><span>${A('تكلفة التطوير', 'Development fee')}</span><span class="money">${money(t.now)}</span></div>
    <div class="small muted" style="margin:16px 0 4px;font-weight:700">${A('إضافي — يُدفع للمزودين مباشرة', 'Extra — paid to providers directly')}</div>
    <div class="tline"><span>${A('خدمات خارجية شهريًا', 'Outside services monthly')}</span><b class="money">${money(t.eMonth)}${A(' /ش', ' /mo')}</b></div>
    ${t.eOnce ? `<div class="tline"><span>${A('خدمات خارجية مرة واحدة', 'Outside services one-time')}</span><b class="money">${money(t.eOnce)}</b></div>` : ''}
    ${t.eYear ? `<div class="tline"><span>${A('خدمات خارجية سنويًا', 'Outside services yearly')}</span><b class="money">${money(t.eYear)}${A(' /سنة', ' /yr')}</b></div>` : ''}
    </div>

    <div class="card section small muted">${ic('info')} ${A('أسعار الخدمات الخارجية تقديرية وتُدفع للمزودين مباشرة حسب الاستخدام الفعلي.', 'Outside-service prices are estimates, paid to providers based on actual usage.')}</div></div></div></div></div>`;
}
function sigPad() {
  const c = $('#sig'); if (!c) return;
  const r = c.getBoundingClientRect(); c.width = r.width * 2; c.height = r.height * 2;
  const x = c.getContext('2d'); x.scale(2, 2); x.lineWidth = 2.2; x.lineCap = 'round'; x.strokeStyle = '#0b2a21';
  let d = false; c.dataset.empty = '1';
  const p = e => { const b = c.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  c.onpointerdown = e => { d = true; c.setPointerCapture(e.pointerId); x.beginPath(); x.moveTo(...p(e)); };
  c.onpointermove = e => { if (!d) return; x.lineTo(...p(e)); x.stroke(); c.dataset.empty = '0'; };
  c.onpointerup = () => d = false;
}

/* ======================================================
   RENDER
   ====================================================== */
function render() {
  let html;
  if (R.view === 'pricing') html = pricingPage();
  else if (R.view === 'service') html = servicePage();
  else if (R.view === 'app') { if (!C[R.page]) R.page = menuOf(R.role)[0][0]; html = appShell(C[R.page]()); }
  else html = publicSite();
  $('#root').innerHTML = html;
  icons();
  sigPad();
  const th = $('#thread'); if (th) th.scrollTop = th.scrollHeight;
  document.querySelectorAll('.tk').forEach(el => el.ondragstart = e => e.dataTransfer.setData('id', el.dataset.id));
  document.querySelectorAll('.col').forEach(col => {
    col.ondragover = e => { e.preventDefault(); col.classList.add('over'); };
    col.ondragleave = () => col.classList.remove('over');
    col.ondrop = e => { e.preventDefault(); const id = e.dataTransfer.getData('id'); if (id) App.status(id, col.dataset.col); };
  });
}
function keepFocus(sel, v) { const i = document.querySelector(sel); if (i) { i.focus(); i.setSelectionRange(v.length, v.length); } }

/* ======================================================
   ACTIONS
   ====================================================== */
function readImage(input, cb) { const f = input.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => cb(r.result); r.readAsDataURL(f); }
const now = () => A('الآن', 'now');
window.App = {
  go, toast, close: closeAll,
  side() { $('#side')?.classList.toggle('show'); $('#scrim').classList.toggle('show'); },
  lang() { const e = !en(); document.documentElement.lang = e ? 'en' : 'ar'; document.documentElement.dir = e ? 'ltr' : 'rtl'; try { localStorage.setItem('solvia-lang', e ? 'en' : 'ar'); } catch (x) {} render(); },
  theme() { const d = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = d; try { localStorage.setItem('solvia-theme', d); } catch (x) {} render(); },
  aud(k) { pubAud = k; render(); document.getElementById('services').scrollIntoView(); },
  rep(k) { rep = k; render(); },
  svcSearch(v) { svcQ = v; render(); keepFocus('.toolbar input', v); },
  notif() { toast(R.role === 'customer' ? A('طلبك #REQ-10429 قيد التنفيذ', 'Request #REQ-10429 is in progress') : A('تذكرة جديدة #REQ-10428 — عاجلة', 'New ticket #REQ-10428 — urgent'), 'bell'); },
  search(q) { if (R.role === 'customer') { svcQ = q; go(link('services')); } else { desk.q = q; go(link('desk')); } },
  phone() {
    const h = session === 'customer' && R.view === 'app' ? '#' + link(R.page, R.id) : R.view === 'service' ? '#service/' + R.id : '';
    const w = $('#phoneWrap');
    w.innerHTML = `<button class="iconbtn phone-close" onclick="document.getElementById('phoneWrap').classList.remove('show')">${ic('x')}</button><div class="phone-frame"><iframe src="${location.pathname}?m=1${h}" title="mobile"></iframe></div>`;
    icons(); w.classList.add('show');
  },
  // --- auth ---
  login() {
    if (session) return go(`app/${session}/${menuOf(session)[0][0]}`);
    modal(mHead(A('تسجيل الدخول', 'Sign in'), A('بدون كلمة مرور — نرسل لك رمزًا على جوالك', 'No password — we text you a code')) + `
      <div id="otpStep"><div class="tabs" style="margin:12px auto 4px;width:100%;display:grid;grid-template-columns:1fr 1fr">${[['ind', 'user', 'فرد', 'Individual'], ['biz', 'building-2', 'منشأة', 'Company']].map(([k, i, a, e]) => `<button class="${ctype === k ? 'active' : ''}" onclick="App.ctype('${k}')" style="justify-content:center">${ic(i)}${A(a, e)}</button>`).join('')}</div>
      ${ctype === 'biz' ? `<label class="field" style="margin-top:10px">${A('رقم السجل التجاري / الرقم الموحد', 'CR / unified number')}<input class="input" dir="ltr" value="7001234567"></label>` : ''}
      <label class="field" style="margin-top:10px">${A('رقم الجوال', 'Mobile number')}<div style="display:flex;gap:8px;direction:ltr"><span class="input" style="width:auto">🇸🇦 +966</span><input class="input" id="phoneIn" inputmode="numeric" value="${ctype === 'biz' ? '50 410 2200' : '55 012 3456'}"></div></label>
      <button class="btn block" style="margin-top:14px" onclick="App.otpSend()">${ic('message-square-lock')}${A('أرسل الرمز', 'Send code')}</button>
      <div class="small muted" style="text-align:center;margin-top:12px">${A('موظف؟ ', 'Staff? ')}<a style="cursor:pointer" onclick="App.staffLogin()">${A('دخول الموظفين', 'Staff sign in')}</a></div></div>`);
  },
  ctype(k) { ctype = k; store.set('ctype', k); App.login(); },
  otpSend() {
    $('#otpStep').innerHTML = `<p class="muted" style="text-align:center;margin:10px 0 0">${A('أدخل الرمز المرسل إلى', 'Enter the code sent to')} <b dir="ltr">+966 ${esc($('#phoneIn').value)}</b></p>
      <div class="otp">${[4, 8, 2, 7].map(v => `<input class="input" maxlength="1" inputmode="numeric" value="${v}" oninput="this.nextElementSibling&&this.nextElementSibling.focus()">`).join('')}</div>
      <div class="small muted" style="text-align:center">${A('للتجربة: الرمز معبأ تلقائيًا', 'Demo: the code is pre-filled')}</div>
      <button class="btn block" style="margin-top:14px" onclick="App.otpOk()">${ic('log-in')}${A('تحقق ودخول', 'Verify & sign in')}</button>`;
    icons();
  },
  otpOk() { session = 'customer'; store.set('session', session); const to = App._after || 'app/customer/home'; App._after = null; closeAll(); toast(A('تم تسجيل الدخول', 'Signed in'), 'badge-check'); go(to); },
  staffLogin() {
    modal(mHead(A('دخول الموظفين', 'Staff sign in')) + `<label class="field" style="margin-top:10px">${A('البريد الوظيفي', 'Work email')}<input class="input" dir="ltr" value="ahmed@arsolvia.sa"></label><label class="field" style="margin-top:10px">${A('كلمة المرور', 'Password')}<input class="input" type="password" value="demo1234"></label>
      <div class="grid g2" style="margin-top:14px"><button class="btn" onclick="App.as('employee')">${ic('headset')}${A('دخول كموظف', 'As employee')}</button><button class="btn ghost" onclick="App.as('supervisor')">${ic('shield-check')}${A('دخول كمشرف', 'As supervisor')}</button></div>`);
  },
  as(r) { if (r.startsWith('customer')) { ctype = r.split(':')[1] || ctype; store.set('ctype', ctype); r = 'customer'; } session = r; store.set('session', r); closeAll(); const to = `app/${r}/${menuOf(r)[0][0]}`; if (location.hash === '#' + to) route(); else go(to); },
  logout() { session = null; store.set('session', null); toast(A('تم تسجيل الخروج', 'Signed out'), 'log-out'); go(''); },
  start(id) {
    const target = `app/customer/new${id ? '/' + id : ''}`;
    wiz = null;
    if (session === 'customer') return go(target);
    if (session) { session = 'customer'; store.set('session', session); return go(target); }
    App._after = target; App.login();
  },
  // --- wizard ---
  wiz(k, v) { wiz[k] = v; render(); window.scrollTo(0, 0); },
  docs(files) { wiz.docs.push(...[...files].map(f => f.name)); render(); },
  pay() {
    const s = svc(wiz.svc), id = 'REQ-' + (Math.max(...tickets.map(t => +t.id.slice(4))) + 1);
    tickets.unshift({ id, svc: s.id, cust: cid(), st: 'new', p: 'normal', emp: '', age: 0, type: wiz.type, ch: 'web', paid: s.price + (wiz.type === 'f' ? D.followUpFee : 0) });
    wiz.step = 4; wiz.created = id; save(); render(); window.scrollTo(0, 0); toast(A('تم الدفع بنجاح', 'Payment successful'), 'badge-check');
  },
  // --- tickets ---
  desk(k, v) { desk[k] = v; if (k === 'view') store.set('deskview', v); if (R.page === 'desk') render(); },
  deskQ(v) { desk.q = v; render(); keepFocus('.toolbar input', v); },
  status(id, s) { const t = tickets.find(x => x.id === id); if (t.st === s) return; t.st = s; seedMsgs(t).push({ w: 'sys', text: A('تغيرت الحالة إلى ', 'Status changed to ') + A(ST[s][0], ST[s][1]), at: now() }); save(); render(); toast(`#${id} → ${A(ST[s][0], ST[s][1])}`); },
  prio(id, p) { tickets.find(x => x.id === id).p = p; save(); render(); },
  assign(id, emp) { const t = tickets.find(x => x.id === id); t.emp = emp; if (emp && t.st === 'new') t.st = 'progress'; seedMsgs(t).push({ w: 'sys', text: emp ? A('تم الإسناد إلى ', 'Assigned to ') + staffName(emp) : A('أُلغي الإسناد', 'Unassigned'), at: now() }); save(); render(); if (emp) toast(A('تم الإسناد إلى ', 'Assigned to ') + staffName(emp), 'user-check'); },
  note(v) { composeNote = v; render(); },
  send(key, w) {
    const el = $('#reply'), text = el.value.trim(); if (!text) return;
    const t = tickets.find(x => x.id === key), list = t ? seedMsgs(t) : msgs[key];
    const who = w === 'cust' ? (t ? t.cust : cid()) : ME[R.role];
    const ch = w === 'staff' && $('#ch') ? $('#ch').value : '';
    list.push({ w, who, text, at: now(), ch: ch && ch !== 'web' ? ch : '' });
    save(); render(); if (ch && ch !== 'web') toast(A('أُرسل أيضًا عبر ', 'Also sent via ') + A(CH[ch][2], CH[ch][1]), CH[ch][0]);
    const reply = w === 'cust' ? { w: 'staff', who: t ? (t.emp || 'AO') : 'AO', text: A('شكرًا، استلمت رسالتك وسأرد عليك قريبًا.', 'Thanks — got it, I’ll get back to you shortly.') }
      : w === 'staff' ? { w: 'cust', who: t ? t.cust : cid(), text: A('تمام، شكرًا لك 👍', 'Great, thank you 👍') } : null;
    if (reply) setTimeout(() => { list.push({ ...reply, at: now() }); save(); render(); }, 1500);
  },
  schedule(tk) {
    const opts = tickets.filter(t => R.role !== 'customer' || t.cust === cid());
    modal(mHead(A('جدولة اجتماع افتراضي', 'Schedule a video meeting')) + `<div class="grid" style="gap:12px;margin-top:8px">
      <label class="field">${A('الطلب', 'Request')}<select class="input" id="mTk">${opts.map(t => `<option value="${t.id}" ${t.id === tk ? 'selected' : ''}>#${t.id} · ${nm(svc(t.svc))}</option>`).join('')}</select></label>
      <div class="grid g2"><label class="field">${A('التاريخ', 'Date')}<input class="input" type="date" id="mDate" value="2026-09-30"></label><label class="field">${A('الوقت', 'Time')}<input class="input" type="time" id="mTime" value="11:30"></label></div>
      <label class="field">${A('الموضوع', 'Topic')}<input class="input" id="mTopic" value="${A('مناقشة الطلب', 'Discuss the request')}"></label>
      <label class="small" style="display:flex;gap:8px"><input type="checkbox" checked style="accent-color:var(--accent)">${A('أرسل الرابط عبر واتساب و SMS', 'Send the link by WhatsApp & SMS')}</label>
      <button class="btn" onclick="App.saveMeeting()">${ic('calendar-check')}${A('تأكيد', 'Confirm')}</button></div>`);
  },
  saveMeeting() {
    const t = tickets.find(x => x.id === $('#mTk').value), topic = $('#mTopic').value, [y, mo, d] = $('#mDate').value.split('-');
    const m = { id: 'M' + Date.now().toString(36), tk: t.id, cust: t.cust, emp: t.emp || 'AO', ar: topic, en: topic, when: `${d}/${mo} · ${$('#mTime').value}` };
    meetings.unshift(m); seedMsgs(t).push({ w: 'sys', text: A('تمت جدولة اجتماع: ', 'Meeting scheduled: ') + m.when, at: now() }); save(); closeAll(); render(); toast(A('تمت الجدولة وإرسال الرابط', 'Scheduled — link sent'), 'calendar-check');
  },
  meet() {
    modal(mHead(A(`اطلب اجتماعًا مع فريق ${BRAND}`, `Request a meeting with ${BRAND}`), A('للشركات، إدارة الموارد البشرية عن بُعد والاشتراكات', 'For companies, remote HR and plans')) + `<div class="grid" style="gap:12px;margin-top:10px">
      <label class="field">${A('اسم المنشأة', 'Company')}<input class="input"></label><div class="grid g2"><label class="field">${A('اسم المسؤول', 'Contact')}<input class="input"></label><label class="field">${A('الجوال', 'Mobile')}<input class="input" dir="ltr"></label></div>
      <label class="field">${A('عدد الموظفين', 'Employees')}<select class="input"><option>1–20</option><option>21–100</option><option>100+</option></select></label>
      <button class="btn" onclick="App.close();App.toast('${A('تم استلام طلبك وسنتواصل معك', 'Thanks — we will contact you')}','calendar-check')">${ic('send')}${A('إرسال الطلب', 'Send request')}</button></div>`);
  },
  roomT(k) { roomState[k] = !roomState[k]; render(); },
  endCall() { toast(A('انتهى الاجتماع', 'Meeting ended'), 'phone-off'); go(link('meetings')); },
  // --- supervisor ---
  svcSet(id, k, v) { svc(id)[k] = v; save(); toast(A('تم الحفظ — يظهر في الموقع فورًا', 'Saved — live on the site')); },
  fee(v) { D.followUpFee = v; toast(A('تم الحفظ', 'Saved')); },
  addService(id) {
    const s = id ? svc(id) : { ar: '', en: '', dar: D.services[0][4], den: D.services[0][5], price: 300, days: 3, pl: '', logo: '', icon: 'sparkles' };
    App._logo = s.logo;
    modal(mHead(id ? A('تعديل خدمة', 'Edit service') : A('خدمة جديدة', 'New service'), A('تظهر في الموقع العام وللعملاء والموظفين', 'Shows on the public site, for customers and staff')) + `<div class="grid" style="gap:12px;margin-top:10px">
      <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><div id="logoPrev">${svcLogo(s, 'lg')}</div><label class="btn sm ghost" style="cursor:pointer">${ic('image-up')}${A('رفع شعار', 'Upload logo')}<input type="file" accept="image/*" hidden onchange="App.logoIn(this)"></label><span class="small muted">${A('اختياري — يُستخدم شعار المنصة إن لم يُرفع', 'Optional — the platform logo is used otherwise')}</span></div>
      <div class="grid g2"><label class="field">${A('الاسم بالعربي', 'Name (Arabic)')}<input class="input" id="sAr" value="${esc(s.ar)}" placeholder="قوى — نقل الخدمات"></label><label class="field">${A('الاسم بالإنجليزي', 'Name (English)')}<input class="input" id="sEn" dir="ltr" value="${esc(s.en)}" placeholder="Qiwa — Transfers"></label></div>
      <label class="field">${A('الوصف', 'Description')}<input class="input" id="sD" value="${esc(A(s.dar, s.den))}"></label>
      <label class="field">${A('الجهة / المنصة', 'Platform')}<select class="input" id="sPl"><option value="">${BRAND} (${A('خدمة أعمال', 'business service')})</option>${platforms.map(p => `<option value="${p.id}" ${p.id === s.pl ? 'selected' : ''}>${nm(p)}</option>`).join('')}</select></label>
      <div class="grid g2"><label class="field">${A('السعر (ر.س)', 'Price (SAR)')}<input class="input" type="number" id="sP" value="${s.price}"></label><label class="field">${A('المدة (أيام عمل)', 'Business days')}<input class="input" type="number" id="sS" value="${s.days}"></label></div>
      <button class="btn" onclick="App.saveService('${id || ''}')">${ic('check')}${A('حفظ ونشر', 'Save & publish')}</button></div>`);
  },
  logoIn(input) { readImage(input, d => { App._logo = d; $('#logoPrev').innerHTML = `<div class="plogo lg"><img src="${d}"></div>`; }); },
  saveService(id) {
    const ar = $('#sAr').value.trim(), e = $('#sEn').value.trim(); if (!ar && !e) return toast(A('أدخل اسم الخدمة', 'Enter a name'), 'circle-alert');
    const d = $('#sD').value;
    const data = { ar: ar || e, en: e || ar, dar: d, den: d, pl: $('#sPl').value, price: +$('#sP').value, days: Math.max(1, +$('#sS').value), logo: App._logo || '' };
    if (id) Object.assign(svc(id), data); else services.push({ id: 's' + Date.now().toString(36), icon: 'sparkles', aud: 'all', on: true, ...data });
    save(); closeAll(); render(); toast(A('تم النشر في الموقع العام', 'Published to the public site'), 'badge-check');
  },
  addPlatform() {
    App._logo = '';
    modal(mHead(A('منصة حكومية جديدة', 'New government platform')) + `<div class="grid" style="gap:12px;margin-top:10px">
      <div style="display:flex;gap:14px;align-items:center"><div id="logoPrev"><div class="plogo lg">${ic('image')}</div></div><label class="btn sm ghost" style="cursor:pointer">${ic('image-up')}${A('رفع الشعار', 'Upload logo')}<input type="file" accept="image/*" hidden onchange="App.logoIn(this)"></label></div>
      <div class="grid g2"><label class="field">${A('الاسم بالعربي', 'Name (Arabic)')}<input class="input" id="pAr" placeholder="أبشر أعمال"></label><label class="field">${A('الاسم بالإنجليزي', 'Name (English)')}<input class="input" id="pEn" dir="ltr" placeholder="Absher Business"></label></div>
      <label class="field">${A('رابط المنصة', 'Website')}<input class="input" id="pUrl" dir="ltr" placeholder="https://business.absher.sa"></label>
      <button class="btn" onclick="App.savePlatform()">${ic('check')}${A('حفظ', 'Save')}</button></div>`);
  },
  platLogo(id, input) { readImage(input, d => { plat(id).logo = d; save(); render(); toast(A('تم تحديث الشعار في كل الموقع', 'Logo updated everywhere'), 'image'); }); },
  savePlatform() {
    const ar = $('#pAr').value.trim(), e = $('#pEn').value.trim(), url = $('#pUrl').value.trim(); if (!ar && !e) return toast(A('أدخل اسم المنصة', 'Enter a name'), 'circle-alert');
    let domain = ''; try { domain = new URL(url).hostname; } catch (x) {}
    platforms.push({ id: 'p' + Date.now().toString(36), ar: ar || e, en: e || ar, domain, url: url || '#', color: '#1d5a45', logo: App._logo || '' });
    save(); closeAll(); render(); toast(A('تمت إضافة المنصة', 'Platform added'), 'badge-check');
  },
  addStaff() {
    modal(mHead(A('إضافة موظف', 'Add staff member')) + `<div class="grid" style="gap:12px;margin-top:10px"><label class="field">${A('الاسم', 'Name')}<input class="input" id="stN"></label><label class="field">${A('البريد', 'Email')}<input class="input" dir="ltr"></label>
      <label class="field">${A('الدور', 'Role')}<select class="input" id="stR"><option value="employee">${A('موظف', 'Employee')}</option><option value="supervisor">${A('مشرف', 'Supervisor')}</option></select></label>
      <button class="btn" onclick="App.saveStaff()">${ic('user-plus')}${A('إضافة وإرسال دعوة', 'Add & send invite')}</button></div>`);
  },
  saveStaff() { const n = $('#stN').value.trim(); if (!n) return; D.staff.push(['U' + D.staff.length, n, n, $('#stR').value]); closeAll(); render(); toast(A('تمت الإضافة', 'Added'), 'user-check'); },
  // --- pricing ---
  async unlock(e) {
    e.preventDefault();
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode($('#pw').value));
    const h = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    if (h === D.devHash) { try { sessionStorage.setItem('solvia-price', '1'); } catch (x) {} render(); } else $('#pwErr').textContent = A('كلمة المرور غير صحيحة', 'Wrong password');
  },
  pset(k, v) { psel[k] = v; store.set('psel', psel); render(); },
  popt(i, on) { psel.opt = on ? [...new Set([...psel.opt, i])] : psel.opt.filter(x => x !== i); store.set('psel', psel); render(); },
  pext(k, i) { psel.ext[k] = i; store.set('psel', psel); render(); },
  clearSig() { const c = $('#sig'); c.getContext('2d').clearRect(0, 0, c.width, c.height); c.dataset.empty = '1'; },
  approve() {
    const name = $('#apName').value.trim(), co = $('#apCo').value.trim(), c = $('#sig');
    if (!name) return toast(A('يرجى إدخال الاسم', 'Please enter your name'), 'circle-alert');
    if (c.dataset.empty === '1') return toast(A('يرجى التوقيع', 'Please sign'), 'circle-alert');
    if (!$('#apOk').checked) return toast(A('يرجى الموافقة على الشروط', 'Please accept the terms'), 'circle-alert');
    store.set('papproval', { name, co, at: Date.now(), sig: c.toDataURL('image/png') }); render(); toast(A('تمت الموافقة — شكرًا لك', 'Approved — thank you'), 'badge-check');
  },
  resetApproval() { store.set('papproval', null); render(); },
  sendApproval(kind) {
    const a = store.get('papproval', {}), t = pricingTotals(), m = v => Math.round(v).toLocaleString('en-US') + ' ر.س';
    const ext = PX.external.map(e => `• ${e[1]}: ${e[4][psel.ext[e[0]] || 0][0]}`).join('\n');
    const msg = `✅ موافقة على عرض سعر منصة ${BRAND}\nالاسم: ${a.name}${a.co ? ' — ' + a.co : ''}\nالتاريخ: ${new Date(a.at).toLocaleString('en-GB')}\n\nبناء المنصة: ${m(t.now)}\n${[40, 40, 20].map(p => `  ${p}% = ${m(t.now * p / 100)}`).join('\n')}\nالدعم الشهري: ${psel.care >= 0 ? PX.care[psel.care][0] + ' — ' + m(t.care * t.v) : 'بدون'}\nالخدمات الخارجية شهريًا: ${m(t.eMonth * t.v)}\n${ext}\nالإضافات: ${psel.opt.map(i => PX.buildOptional[i][0]).join('، ') || 'لا يوجد'}\n\nتكلفة السنة الأولى: ${m(t.firstYear)}`;
    if (kind === 'wa') window.open('https://wa.me/' + (D.developer.whatsapp || '') + '?text=' + encodeURIComponent(msg), '_blank');
    else location.href = `mailto:${D.developer.email}?subject=${encodeURIComponent(BRAND + ' — موافقة على عرض السعر')}&body=${encodeURIComponent(msg)}`;
  },
};

route();
})();
