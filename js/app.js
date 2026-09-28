(() => {
const $ = s => document.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem('solvia-' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('solvia-' + k, JSON.stringify(v)); } catch (e) {} },
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const en = () => document.documentElement.lang === 'en';
const A = (ar, e) => (en() ? e : ar);                   // Arabic first
const P = pair => A(pair[0], pair[1]);
const money = n => (+n).toLocaleString('en-US') + A(' ر.س', ' SAR');
const ic = (n, cls = '') => `<i data-lucide="${n}" class="${cls}"></i>`;
const icons = () => window.lucide && lucide.createIcons();

// ---------- state ----------
let role = store.get('role', 'customer');
let route = null;
let tickets = store.get('tickets2', D.tickets);
let tkView = store.get('tkview', 'board'), tkFilter = 'all', svcCat = 'all';
const saveTk = () => store.set('tickets2', tickets);
const svc = id => D.services.find(s => s[0] === id);
const plat = id => D.platforms.find(p => p[0] === id);

const ROLES = {
  customer: ['user-round', 'عميل', 'Customer', [['home', 'house', 'الرئيسية', 'Home'], ['services', 'layout-grid', 'الخدمات', 'Services'], ['requests', 'ticket', 'طلباتي', 'My requests'], ['invoices', 'receipt', 'الفواتير', 'Invoices'], ['appointments', 'calendar-check', 'المواعيد', 'Appointments'], ['business', 'building-2', 'حلول الشركات', 'Business plans']]],
  employee: ['headset', 'موظف', 'Employee', [['dashboard', 'activity', 'لوحة العمل', 'Workspace'], ['tickets', 'kanban', 'التذاكر', 'Tickets'], ['customers', 'contact', 'العملاء', 'Customers'], ['platforms', 'globe', 'المنصات', 'Platforms'], ['appointments', 'calendar-check', 'المواعيد', 'Appointments']]],
  manager: ['chart-pie', 'مدير', 'Manager', [['dashboard', 'activity', 'لوحة المدير', 'Overview'], ['tickets', 'kanban', 'التذاكر', 'Tickets'], ['pricing', 'tags', 'الأسعار', 'Pricing'], ['finance', 'wallet', 'المالية', 'Finance'], ['reports', 'chart-column', 'التقارير', 'Reports'], ['permissions', 'shield-check', 'الصلاحيات', 'Permissions']]],
};
const DEV = [['dev', 'code-xml', 'المطوّر', 'Dev'], ['proposal', 'file-signature', 'عرض السعر', 'Proposal']];

// ---------- price config ----------
function defaultCfg() {
  const items = [];
  D.catalog.forEach(([gar, gen, list]) => list.forEach(([id, ar, e, desc, price, freq, opt]) => items.push({ id, g: gen, gar, ar, en: e, desc, price, freq, opt: !!opt, on: true })));
  return { items, terms: { ...D.terms }, client: '', project: 'Solvia — منصة الخدمات الحكومية', note: '' };
}
let cfg = store.get('cfg2', null) || defaultCfg();
const saveCfg = () => store.set('cfg2', cfg);
const enc = o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const dec = s => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))));
function totals(items, terms) {
  const once = items.filter(i => i.freq === 'once').reduce((a, i) => a + +i.price, 0);
  const month = items.filter(i => i.freq === 'month').reduce((a, i) => a + +i.price, 0);
  const disc = once * (+terms.discount || 0) / 100, base = once - disc, vat = base * (+terms.vat || 0) / 100;
  return { once, month, disc, vat, total: base + vat, monthVat: month * (1 + (+terms.vat || 0) / 100) };
}
const propPayload = () => ({ items: cfg.items.filter(i => i.on).map(({ id, g, gar, ar, en, desc, price, freq, opt }) => ({ id, g, gar, ar, en, desc, price, freq, opt })), terms: cfg.terms, client: cfg.client, project: cfg.project, note: cfg.note });

// ---------- shell ----------
const clientMode = () => document.body.classList.contains('client-mode');
function shell() {
  const railItems = Object.entries(ROLES).map(([k, [i, ar, e]]) => `<button title="${A(ar, e)}" class="${!isDev() && role === k ? 'active' : ''}" onclick="App.role('${k}')">${ic(i)}</button>`).join('');
  $('#rail').innerHTML = `<div class="logo">S</div>${railItems}<div class="sp"></div>${clientMode() ? '' : `<button title="${A('المطوّر', 'Dev')}" class="${isDev() ? 'active' : ''}" onclick="App.go('dev')">${ic('code-xml')}</button>`}`;
  const [, rar, ren, menu] = ROLES[role];
  $('#side').innerHTML = `<div class="brand"><b>Solvia</b><small>${A('خدمات حكومية. أبسط. أسرع.', 'Government services. Simpler. Faster.')}</small></div>
    <div class="grp">${A('مساحة ', '') + A(rar, ren) + A('', ' workspace')}</div>` +
    menu.map(([id, i, ar, e]) => navBtn(id, i, A(ar, e), id === 'tickets' || id === 'requests' ? count(id) : '')).join('') +
    `<div class="grp">${A('الدعم', 'Support')}</div>` + navBtn('help', 'life-buoy', A('الدعم والمساعدة', 'Help & support')) +
    (clientMode() ? `<div class="grp">${A('العرض', 'Proposal')}</div>` + navBtn('proposal', 'file-signature', A('عرض السعر', 'Proposal'))
      : `<div class="grp">${A('المطوّر', 'Developer')}</div>` + DEV.map(([id, i, ar, e]) => navBtn(id, i, A(ar, e), id === 'dev' ? ic('lock') : '')).join(''));
  $('#roleSw').innerHTML = Object.entries(ROLES).map(([k, [i, ar, e]]) => `<button class="${role === k ? 'active' : ''}" onclick="App.role('${k}')">${ic(i)}<span>${A(ar, e)}</span></button>`).join('');
  $('#q').placeholder = A('ابحث عن خدمة أو طلب…', 'Search a service or request…');
  $('#langBtn').textContent = en() ? 'العربية' : 'EN';
  $('#themeIc').setAttribute('data-lucide', document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon');
}
const navBtn = (id, i, label, badge = '') => `<button class="nav ${route === id ? 'active' : ''} ${id === 'dev' ? 'dev' : ''}" onclick="App.go('${id}')">${ic(i)}<span>${label}</span>${badge ? `<span style="margin-inline-start:auto">${badge}</span>` : ''}</button>`;
const count = id => { const n = id === 'requests' ? tickets.filter(t => t.cust[0] === 'عبدالله تمّار' && t.st !== 'done').length : tickets.filter(t => t.st !== 'done').length; return n ? `<span class="badge">${n}</span>` : ''; };
const isDev = () => route === 'dev' || route === 'proposal';

function render() {
  if (!route) route = ROLES[role][3][0][0];
  shell();
  const fn = isDev() ? pages[route] : (pages[role + ':' + route] || pages[route] || pages[role + ':' + ROLES[role][3][0][0]]);
  $('#page').innerHTML = fn();
  icons();
  after[route] && after[route]();
}
function toast(msg, i = 'check') {
  const t = $('#toast'); t.innerHTML = ic(i) + '<span>' + esc(msg) + '</span>'; icons(); t.classList.add('show');
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2400);
}
function openModal(html) { $('#modal').innerHTML = html; icons(); $('#modal').classList.add('show'); $('#scrim').classList.add('show'); }

// ---------- building blocks ----------
const pattern = `<svg class="pattern" viewBox="0 0 100 100" fill="none" stroke="#e39a5e" stroke-width="1.1">${[0, 1, 2, 3].map(i => `<rect x="${20 + i * 2}" y="${20 + i * 2}" width="${60 - i * 4}" height="${60 - i * 4}" transform="rotate(${i * 22.5} 50 50)"/>`).join('')}<circle cx="50" cy="50" r="12"/></svg>`;
const hero = (eyebrow, title, sub, actions = '', side = '') => `<section class="hero ${side ? 'split' : ''}">${pattern}<div>
  <div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}${actions ? `<div class="actions">${actions}</div>` : ''}</div>${side}</section>`;
const stat = (i, l, v, s, up = false) => `<div class="card stat"><div class="ic">${ic(i)}</div><div><div class="lbl">${l}</div><div class="val">${v}</div><div class="sub">${up ? ic('arrow-up-right') : ''}${s}</div></div></div>`;
const head = (title, sub = '', right = '') => `<div class="card-h section" style="margin-top:28px"><div><h2>${title}</h2>${sub ? `<div class="muted small">${sub}</div>` : ''}</div>${right}</div>`;
const today = () => new Date().toLocaleDateString(en() ? 'en-GB' : 'ar-SA-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' });

const ST = { new: ['جديد', 'New', 'info'], progress: ['قيد التنفيذ', 'In progress', 'warn'], waiting: ['بانتظار العميل', 'Waiting on customer', 'mute'], done: ['مكتمل', 'Completed', 'ok'] };
const PR = { urgent: ['عاجل', 'Urgent', 'bad'], high: ['عالية', 'High', 'warn'], normal: ['عادية', 'Normal', 'info'], low: ['منخفضة', 'Low', 'mute'] };
const CH = { whatsapp: 'message-circle', sms: 'smartphone', web: 'globe', phone: 'phone' };
const stB = s => `<span class="badge ${ST[s][2]}">${A(ST[s][0], ST[s][1])}</span>`;
const prB = p => `<span class="badge ${PR[p][2]}"><span class="d"></span>${A(PR[p][0], PR[p][1])}</span>`;
function slaB(t) {
  if (t.st === 'done') return `<span class="badge ok">${A('ضمن المهلة', 'SLA met')}</span>`;
  const left = t.sla - t.age;
  return left < 0 ? `<span class="badge bad">${A('متأخر', 'Overdue')} ${-left}${A('س', 'h')}</span>` : `<span class="badge ${left <= 2 ? 'warn' : 'mute'}">${left}${A('س متبقية', 'h left')}</span>`;
}
const svcName = id => A(svc(id)[2], svc(id)[3]);
const staff = k => k ? P(D.staff[k]) : A('غير مسند', 'Unassigned');
const priceTxt = p => p ? A('من ', 'From ') + money(p) : A('حسب الطلب', 'On request');

function svcCard(s) {
  const pl = plat(s[1]);
  return `<div class="card svc"><div style="display:flex;gap:12px;align-items:center"><div class="plat-tile">${ic(pl[3])}</div><div><div style="font-weight:600">${A(s[2], s[3])}</div><div class="small muted">${A(pl[1], pl[2])}</div></div></div>
    <div class="muted small">${A(s[4], s[5])}</div><div style="display:flex;gap:6px;flex-wrap:wrap"><span class="badge mute">${ic('timer')} ${A('خلال', 'within')} ${s[8]}${A(' ساعة', 'h')}</span></div>
    <div class="price">${priceTxt(s[6])}</div><button class="btn sm" onclick="App.request('${s[0]}')">${ic('plus')}${A('طلب الخدمة', 'Request')}</button></div>`;
}
function journey(st) {
  const steps = [['تم الاستلام', 'Received'], ['تم الدفع', 'Paid'], ['تم التعيين', 'Assigned'], ['قيد التنفيذ', 'In progress'], ['مكتمل', 'Done']];
  const at = { new: 1, progress: 3, waiting: 3, done: 5 }[st];
  return `<div class="journey">${steps.map((s, i) => `<div class="${i < at ? 'done' : ''} ${i === at - 1 && st !== 'done' ? 'cur' : ''}">${P(s)}</div>`).join('')}</div>`;
}
function tkCard(t) {
  const pct = Math.min(100, t.age / t.sla * 100);
  return `<div class="tk" draggable="true" data-id="${t.id}" onclick="App.openTicket('${t.id}')"><div style="display:flex;justify-content:space-between;align-items:center"><span class="id">#${t.id}</span>${prB(t.p)}</div>
    <div class="ti">${svcName(t.svc)}</div><div class="meta">${ic(CH[t.ch])}<span>${esc(P(t.cust))}</span><span class="mini-av" title="${staff(t.emp)}">${t.emp || '—'}</span></div>
    ${t.st !== 'done' ? `<div class="sla"><i class="${pct >= 100 ? 'bad' : pct > 70 ? 'warn' : ''}" style="width:${pct}%"></i></div><div class="small" style="margin-top:6px">${slaB(t)}</div>` : ''}</div>`;
}
function table(heads, rows) {
  return `<div class="card tbl-wrap"><table><tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr>${rows.join('')}</table></div>`;
}
const bars = (vals, hi) => `<div class="bars">${vals.map((v, i) => `<div class="${i === hi ? 'hi' : ''}" style="height:${v}%"></div>`).join('')}</div>`;

// ---------- pages ----------
const me = ['عبدالله تمّار', 'Abdullah Tammar'];
const pages = {
  'customer:home'() {
    const mine = tickets.filter(t => t.cust[0] === me[0]);
    const phone = `<div class="phone"><b>${A('مرحبًا عبدالله', 'Hi Abdullah')}</b><div class="small muted" style="margin-bottom:8px">${A('طلباتك النشطة', 'Your active requests')}</div>
      ${mine.slice(0, 2).map(t => `<div class="card" style="padding:12px;margin-top:8px;border-radius:14px">${stB(t.st)}<div style="font-weight:600;margin-top:6px">#${t.id} · ${svcName(t.svc)}</div><div class="small muted">${A('المختص يعمل على طلبك', 'A specialist is on it')}</div></div>`).join('')}</div>`;
    return hero(A('خدمات حكومية. أبسط. أسرع.', 'Government services. Simpler. Faster.'), A('أنجز خدماتك الحكومية من مكان واحد', 'All your government services, in one place'),
      A('Solvia تربط الأفراد والمنشآت بفريق مختص لإنجاز ومتابعة الخدمات عبر المنصات الحكومية السعودية، مع رحلة واضحة ودفع إلكتروني وتحديثات مستمرة عبر واتساب والرسائل.', 'Solvia connects people and companies with specialists who complete and track services on Saudi government platforms — clear steps, online payment and live updates by WhatsApp and SMS.'),
      `<button class="btn" onclick="App.request()">${ic('plus')}${A('ابدأ طلب خدمة', 'Start a request')}</button><button class="btn ghost" onclick="App.go('business')">${ic('building-2')}${A('حلول الشركات', 'Business plans')}</button>`, phone) +
    `<div class="grid g4 section">${stat('circle-check-big', A('طلبات منجزة', 'Requests done'), '12,480', A('منذ الإطلاق', 'since launch'), true)}${stat('timer', A('متوسط الإنجاز', 'Avg. completion'), A('٦ ساعات', '6 hours'), A('لمعظم الخدمات', 'for most services'))}${stat('star', A('رضا العملاء', 'Satisfaction'), '4.9/5', A('من ٢٬٣٠٠ تقييم', 'from 2,300 reviews'))}${stat('shield-check', A('بيانات آمنة', 'Secure data'), A('داخل السعودية', 'In Saudi'), A('استضافة محلية', 'local hosting'))}</div>` +
    head(A('المنصات التي نخدمك فيها', 'Platforms we cover'), A('وصول منظم لخدمات المنصات الحكومية الرئيسية', 'Organised access to the main government platforms')) +
    `<div class="grid g4">${D.platforms.map(p => `<button class="card stat" style="cursor:pointer;text-align:start" onclick="App.go('services')"><div class="plat-tile">${ic(p[3])}</div><div><div style="font-weight:600">${A(p[1], p[2])}</div><div class="small muted">${A(p[2], p[1])}</div></div></button>`).join('')}</div>` +
    head(A('خدمات مختارة', 'Featured services'), A('للأفراد والمنشآت', 'For individuals and companies'), `<button class="link" onclick="App.go('services')">${A('عرض الكل', 'View all')}</button>`) +
    `<div class="grid g4">${D.services.slice(0, 4).map(svcCard).join('')}</div>` +
    head(A('كيف تعمل Solvia', 'How it works')) +
    `<div class="grid g4">${[['mouse-pointer-click', 'اختر الخدمة', 'Pick a service'], ['file-up', 'ارفع المستندات', 'Upload documents'], ['credit-card', 'ادفع إلكترونيًا', 'Pay online'], ['bell-ring', 'تابع عبر واتساب', 'Track on WhatsApp']].map(([i, a, e], n) => `<div class="card"><div class="plat-tile">${ic(i)}</div><div class="eyebrow" style="margin-top:12px">${A('الخطوة', 'Step')} ${n + 1}</div><div style="font-weight:600">${A(a, e)}</div></div>`).join('')}</div>`;
  },
  'customer:services'() {
    const list = D.services.filter(s => svcCat === 'all' || s[7] === svcCat);
    return hero(A('الخدمات', 'Services'), A('اختر الخدمة المناسبة وابدأ الطلب', 'Choose a service and start'), A('أسعار واضحة، مدة إنجاز معروفة، ومختص يتابع طلبك حتى النهاية.', 'Clear prices, known turnaround, and a specialist who follows through.')) +
    `<div class="toolbar"><div class="tabs">${[['all', 'الكل', 'All'], ['ind', 'الأفراد', 'Individuals'], ['biz', 'المنشآت', 'Companies']].map(([k, a, e]) => `<button class="${svcCat === k ? 'active' : ''}" onclick="App.svcCat('${k}')">${A(a, e)}</button>`).join('')}</div></div>
    <div class="grid g4">${list.map(svcCard).join('')}</div>`;
  },
  'customer:requests'() {
    const mine = tickets.filter(t => t.cust[0] === me[0]);
    return hero(A('طلباتي', 'My requests'), A('تابع طلباتك خطوة بخطوة', 'Follow every request step by step'), A('ستصلك التحديثات عبر واتساب والرسائل النصية أيضًا.', 'You also get updates on WhatsApp and SMS.'), `<button class="btn" onclick="App.request()">${ic('plus')}${A('طلب جديد', 'New request')}</button>`) +
    mine.map(t => `<div class="card section" style="cursor:pointer" onclick="App.openTicket('${t.id}')"><div class="card-h" style="margin:0"><div><div class="small muted">#${t.id}</div><h2 style="font-size:19px">${svcName(t.svc)}</h2></div><div class="chips">${stB(t.st)}${slaB(t)}</div></div>${journey(t.st)}<div class="small muted">${A('المختص', 'Specialist')}: ${staff(t.emp)}</div></div>`).join('');
  },
  'customer:invoices'() {
    const rows = [['INV-2091', 's1', 149, '28/09'], ['INV-2077', 's4', 199, '21/09'], ['INV-2041', 's6', 249, '02/09']];
    return hero(A('الفواتير', 'Invoices'), A('فواتيرك الإلكترونية', 'Your e-invoices'), A('فواتير ضريبية متوافقة مع هيئة الزكاة والضريبة والجمارك.', 'VAT invoices compliant with ZATCA.')) +
      `<div class="section">${table([A('رقم الفاتورة', 'Invoice'), A('الخدمة', 'Service'), A('التاريخ', 'Date'), A('المبلغ', 'Amount'), A('الحالة', 'Status'), ''], rows.map(r => `<tr><td class="muted">${r[0]}</td><td>${svcName(r[1])}</td><td>${r[3]}</td><td class="money">${money(r[2])}</td><td><span class="badge ok">${A('مدفوعة', 'Paid')}</span></td><td><button class="btn sm ghost" onclick="App.toast('${A('تم تنزيل الفاتورة', 'Invoice downloaded')}')">${ic('download')}PDF</button></td></tr>`))}</div>`;
  },
  appointments() {
    return hero(A('المواعيد', 'Appointments'), A('المواعيد والاستشارات', 'Appointments & consultations'), A('احجز مكالمة افتراضية مع مختص.', 'Book a virtual call with a specialist.'), `<button class="btn" onclick="App.meeting()">${ic('calendar-plus')}${A('حجز موعد', 'Book')}</button>`) +
    `<div class="grid g2 section"><div class="card"><span class="badge">${A('قادم', 'Upcoming')}</span><h2 style="margin:10px 0 4px">${A('استشارة عمالية', 'Labour consultation')}</h2><div>${ic('calendar')} ${A('٣٠ سبتمبر · ١١:٣٠ صباحًا', '30 Sep · 11:30 AM')}</div><div class="muted small">${A('مكالمة افتراضية · ٣٠ دقيقة', 'Virtual call · 30 min')}</div><div style="margin-top:14px;display:flex;gap:8px"><button class="btn sm">${ic('video')}${A('انضم', 'Join')}</button><button class="btn sm ghost">${A('إعادة جدولة', 'Reschedule')}</button></div></div>
    <div class="card"><h2 style="margin-bottom:6px">${A('النماذج المطلوبة', 'Required forms')}</h2><p class="muted">${A('نزّل النماذج اللازمة للخدمة قبل الموعد.', 'Download the forms you need before the call.')}</p><button class="btn sm ghost" onclick="App.toast('${A('تم تنزيل النموذج', 'Form downloaded')}')">${ic('download')}${A('تنزيل نموذج', 'Download form')}</button></div></div>`;
  },
  'customer:business'() {
    const plans = [['أساسية', 'Starter', 1490, ['حتى ٢٠ موظف', 'Up to 20 staff'], 0], ['نمو', 'Growth', 3490, ['حتى ١٠٠ موظف', 'Up to 100 staff'], 1], ['مؤسسات', 'Enterprise', 0, ['أكثر من ١٠٠ موظف', '100+ staff'], 0]];
    const feats = [['خدمات قوى ومدد والتأمينات', 'Qiwa, Mudad & GOSI'], ['مدير حساب مخصص', 'Dedicated account manager'], ['تقارير شهرية', 'Monthly reports'], ['أولوية في SLA', 'Priority SLA']];
    return hero(A('حلول الشركات', 'Business'), A('إدارة HR والخدمات الحكومية لمنشأتك', 'HR and government services for your company'), A('فريق مختص يدير عمليات منشأتك الحكومية باشتراك شهري مرن.', 'A specialist team runs your government paperwork on a flexible monthly plan.'), `<button class="btn" onclick="App.meeting()">${ic('calendar-plus')}${A('احجز اجتماعًا', 'Book a meeting')}</button>`) +
    `<div class="grid g3 section">${plans.map(([a, e, p, s, best]) => `<div class="card plan ${best ? 'best' : ''}">${best ? `<span class="badge">${A('الأكثر طلبًا', 'Most popular')}</span>` : ''}<h2 style="margin-top:8px">${A(a, e)}</h2><div class="muted small">${P(s)}</div><div class="stat"><div class="val" style="margin-top:10px">${p ? money(p) : A('حسب الطلب', 'Custom')}</div></div><div class="small muted">${p ? A('شهريًا', 'per month') : ''}</div><ul>${feats.slice(0, best ? 4 : 3).map(f => `<li>${ic('check')}${P(f)}</li>`).join('')}</ul><button class="btn ${best ? '' : 'ghost'}" onclick="App.meeting()">${A('ابدأ الآن', 'Get started')}</button></div>`).join('')}</div>`;
  },

  // ----- employee & manager -----
  dashboard() {
    const open = tickets.filter(t => t.st !== 'done');
    const mgr = role === 'manager';
    return hero(`${A(mgr ? 'لوحة المدير' : 'لوحة العمل', mgr ? 'Manager overview' : 'Workspace')} · ${today()}`, A(mgr ? 'مساء الخير، عبدالله' : 'صباح الخير، أحمد', mgr ? 'Good evening, Abdullah' : 'Good morning, Ahmed'),
      A(`لديك ${open.length} طلبات مفتوحة، منها ${open.filter(t => t.age > t.sla).length} متأخرة عن المهلة.`, `${open.length} open requests, ${open.filter(t => t.age > t.sla).length} past their SLA.`),
      `<button class="btn" onclick="App.go('tickets')">${ic('kanban')}${A('فتح التذاكر', 'Open tickets')}</button>`) +
    `<div class="grid g4 section">${stat('inbox', A('تذاكر نشطة', 'Active tickets'), open.length + 40, A('+٦ منذ الصباح', '+6 since morning'), true)}${stat('sparkles', A('جديدة اليوم', 'New today'), 17, A('٩ عبر واتساب', '9 via WhatsApp'))}${stat('timer', A('ضمن SLA', 'Within SLA'), '94%', A('+٢٪ عن الأسبوع الماضي', '+2% vs last week'), true)}${mgr ? stat('wallet', A('إيرادات الشهر', 'Revenue this month'), money(184250), A('+١٢٪', '+12%'), true) : stat('circle-check-big', A('مكتملة اليوم', 'Done today'), 23, A('متوسط ٥٫٢ ساعة', 'avg. 5.2h'))}</div>
    <div class="grid g21 section"><div class="card"><div class="card-h"><h2>${A('أولوية العمل', 'Work priority')}</h2><button class="link" onclick="App.go('tickets')">${A('عرض الكل', 'View all')}</button></div>
      ${open.sort((a, b) => (a.sla - a.age) - (b.sla - b.age)).slice(0, 5).map(t => `<div class="row" style="cursor:pointer" onclick="App.openTicket('${t.id}')"><div class="ic">${ic(CH[t.ch])}</div><div class="grow"><div class="t">#${t.id} · ${svcName(t.svc)}</div><div class="s">${esc(P(t.cust))} · ${staff(t.emp)}</div></div>${prB(t.p)}${slaB(t)}</div>`).join('')}</div>
      <div class="card"><h2>${A('حركة الطلبات', 'Request volume')}</h2><div class="small muted">${A('آخر ١٠ أيام', 'Last 10 days')}</div>${bars([35, 62, 48, 75, 58, 82, 69, 91, 76, 88], 7)}</div></div>`;
  },
  tickets() {
    const f = tickets.filter(t => tkFilter === 'all' || (tkFilter === 'mine' && t.emp === 'AO') || (tkFilter === 'late' && t.st !== 'done' && t.age > t.sla) || (tkFilter === 'unassigned' && !t.emp));
    const cols = ['new', 'progress', 'waiting', 'done'];
    return hero(A('التذاكر', 'Tickets'), A('إدارة التذاكر', 'Ticket management'), A('كل الطلبات من الموقع وواتساب والرسائل في لوحة واحدة، مع مؤقت SLA لكل طلب. اسحب البطاقة لتغيير حالتها.', 'Every request from web, WhatsApp and SMS on one board with a live SLA timer. Drag a card to change its status.'),
      `<button class="btn" onclick="App.request()">${ic('plus')}${A('تذكرة جديدة', 'New ticket')}</button>`) +
    `<div class="grid g4 section">${stat('inbox', A('جديدة', 'New'), tickets.filter(t => t.st === 'new').length, A('بانتظار التعيين', 'awaiting assignment'))}${stat('loader', A('قيد التنفيذ', 'In progress'), tickets.filter(t => t.st === 'progress').length, A('متوسط ٥ ساعات', 'avg. 5h'))}${stat('triangle-alert', A('متأخرة', 'Overdue'), tickets.filter(t => t.st !== 'done' && t.age > t.sla).length, A('تحتاج تصعيد', 'need escalation'))}${stat('circle-check-big', A('مكتملة', 'Completed'), tickets.filter(t => t.st === 'done').length, A('٩٤٪ ضمن المهلة', '94% on time'), true)}</div>
    <div class="toolbar"><div class="tabs">${[['all', 'الكل', 'All'], ['mine', 'المسندة إليّ', 'Mine'], ['unassigned', 'غير مسندة', 'Unassigned'], ['late', 'متأخرة', 'Overdue']].map(([k, a, e]) => `<button class="${tkFilter === k ? 'active' : ''}" onclick="App.tkFilter('${k}')">${A(a, e)}</button>`).join('')}</div><div style="flex:1"></div>
      <div class="tabs">${[['board', 'kanban', 'لوحة', 'Board'], ['list', 'list', 'قائمة', 'List']].map(([k, i, a, e]) => `<button class="${tkView === k ? 'active' : ''}" onclick="App.tkView('${k}')">${ic(i)} ${A(a, e)}</button>`).join('')}</div></div>
    ${tkView === 'board' ? `<div class="kanban">${cols.map(c => `<div class="col" data-col="${c}"><h3>${stB(c)}<span class="muted">${f.filter(t => t.st === c).length}</span></h3>${f.filter(t => t.st === c).map(tkCard).join('')}</div>`).join('')}</div>`
      : table(['#', A('الخدمة', 'Service'), A('العميل', 'Customer'), A('المسؤول', 'Assignee'), A('الأولوية', 'Priority'), A('الحالة', 'Status'), 'SLA'], f.map(t => `<tr class="click" onclick="App.openTicket('${t.id}')"><td class="muted">${t.id}</td><td>${svcName(t.svc)}</td><td>${esc(P(t.cust))}</td><td>${staff(t.emp)}</td><td>${prB(t.p)}</td><td>${stB(t.st)}</td><td>${slaB(t)}</td></tr>`))}`;
  },
  'employee:customers'() {
    const c = [[['عبدالله تمّار', 'Abdullah Tammar'], 'ind', '05X XXX XXXX', 6], [['ركن الأعمال', 'Rukn Business'], 'biz', '011 XXX XXXX', 24], [['ريم القحطاني', 'Reem Alqahtani'], 'ind', '05X XXX XXXX', 3], [['مسار التجارية', 'Masar Trading'], 'biz', '012 XXX XXXX', 17]];
    return hero(A('العملاء', 'Customers'), A('قاعدة العملاء', 'Customer base'), A('كل العملاء وطلباتهم في مكان واحد.', 'All customers and their requests in one place.')) +
      `<div class="section">${table([A('العميل', 'Customer'), A('النوع', 'Type'), A('الجوال', 'Mobile'), A('الطلبات', 'Requests'), ''], c.map(r => `<tr><td><b style="font-weight:600">${P(r[0])}</b></td><td><span class="badge ${r[1] === 'biz' ? '' : 'mute'}">${r[1] === 'biz' ? A('منشأة', 'Company') : A('فرد', 'Individual')}</span></td><td dir="ltr" style="text-align:start">${r[2]}</td><td>${r[3]}</td><td><button class="btn sm ghost" onclick="App.toast('${A('تم إرسال رسالة واتساب', 'WhatsApp sent')}')">${ic('message-circle')}</button></td></tr>`))}</div>`;
  },
  'employee:platforms'() {
    return hero(A('المنصات', 'Platforms'), A('دليل المنصات الحكومية', 'Government platforms'), A('وصول سريع للموظفين أثناء تنفيذ الطلبات.', 'Quick access while working on requests.')) +
      `<div class="grid g3 section">${D.platforms.map(p => `<div class="card stat"><div class="plat-tile">${ic(p[3])}</div><div style="flex:1"><div style="font-weight:600">${A(p[1], p[2])}</div><div class="small muted">${tickets.filter(t => svc(t.svc)[1] === p[0] && t.st !== 'done').length} ${A('طلبات مفتوحة', 'open requests')}</div></div><button class="btn sm ghost" onclick="App.toast('${A('فتح تجريبي', 'Demo link')}')">${ic('external-link')}</button></div>`).join('')}</div>`;
  },
  'manager:pricing'() {
    return hero(A('الأسعار', 'Pricing'), A('إدارة أسعار الخدمات', 'Service pricing'), A('عدّل أسعار الخدمات ومدة الإنجاز — تظهر مباشرة للعملاء.', 'Edit prices and turnaround — customers see them immediately.')) +
      `<div class="section">${table([A('الخدمة', 'Service'), A('المنصة', 'Platform'), A('السعر', 'Price'), A('المدة', 'SLA'), ''], D.services.map((s, i) => `<tr><td><b style="font-weight:600">${A(s[2], s[3])}</b></td><td>${A(plat(s[1])[1], plat(s[1])[2])}</td><td style="max-width:130px"><input class="input money" type="number" value="${s[6]}" onchange="App.setSvc(${i},6,+this.value)"></td><td style="max-width:110px"><input class="input" type="number" value="${s[8]}" onchange="App.setSvc(${i},8,+this.value)"></td><td><span class="badge ok">${A('مفعلة', 'Live')}</span></td></tr>`))}</div>`;
  },
  'manager:finance'() {
    const r = [['PAY-9012', ['ركن الأعمال', 'Rukn Business'], 499, 'Mada'], ['PAY-9011', ['عبدالله تمّار', 'Abdullah Tammar'], 149, 'Apple Pay'], ['PAY-9008', ['ريم القحطاني', 'Reem Alqahtani'], 199, 'STC Pay'], ['PAY-9004', ['مسار التجارية', 'Masar Trading'], 3490, 'Visa']];
    return hero(A('المالية', 'Finance'), A('المالية والمدفوعات', 'Finance & payments'), '') +
      `<div class="grid g3 section">${stat('wallet', A('إيرادات الشهر', 'Month revenue'), money(184250), '+12%', true)}${stat('repeat', A('اشتراكات الشركات', 'Company plans'), 38, A('+٤ هذا الشهر', '+4 this month'), true)}${stat('receipt', A('ضريبة مستحقة', 'VAT due'), money(24032), A('الربع الحالي', 'this quarter'))}</div>
      <div class="section">${table([A('المعاملة', 'Transaction'), A('العميل', 'Customer'), A('الطريقة', 'Method'), A('المبلغ', 'Amount'), A('الحالة', 'Status')], r.map(x => `<tr><td class="muted">${x[0]}</td><td>${P(x[1])}</td><td>${x[3]}</td><td class="money">${money(x[2])}</td><td><span class="badge ok">${A('مدفوعة', 'Paid')}</span></td></tr>`))}</div>`;
  },
  'manager:reports'() {
    return hero(A('التقارير', 'Reports'), A('التقارير', 'Reports'), A('يومي · أسبوعي · شهري', 'Daily · weekly · monthly'), `<button class="btn" onclick="App.toast('${A('تم تجهيز ملف Excel', 'Excel export ready')}')">${ic('download')}${A('تصدير', 'Export')}</button>`) +
      `<div class="grid g2 section"><div class="card"><h2>${A('الطلبات', 'Requests')}</h2>${bars([40, 62, 51, 77, 68, 88, 73, 94], 7)}</div><div class="card"><h2>${A('الإيرادات', 'Revenue')}</h2>${bars([30, 45, 40, 55, 61, 67, 78, 91], 7)}</div></div>
      <div class="card section"><h2 style="margin-bottom:10px">${A('أداء الموظفين', 'Staff performance')}</h2>${Object.entries(D.staff).map(([k, n], i) => `<div class="row"><div class="avatar" style="width:34px;height:34px;font-size:12px">${k}</div><div class="grow"><div class="t">${P(n)}</div><div class="progress" style="margin-top:6px;max-width:320px"><i style="width:${[96, 91, 88][i]}%"></i></div></div><b>${[96, 91, 88][i]}%</b></div>`).join('')}</div>`;
  },
  'manager:permissions'() {
    const perms = [['عرض التذاكر', 'View tickets'], ['تعيين الطلبات', 'Assign requests'], ['إدارة الأسعار', 'Manage prices'], ['التقارير', 'Reports'], ['المالية', 'Finance']];
    return hero(A('الصلاحيات', 'Permissions'), A('الصلاحيات والأدوار', 'Roles & permissions'), '') +
      `<div class="grid g4 section">${[['مدير', 'Manager', 5], ['مشرف', 'Supervisor', 4], ['موظف', 'Employee', 2], ['مالية', 'Finance', 1]].map(([a, e, n]) => `<div class="card"><h2 style="font-size:18px;margin-bottom:8px">${A(a, e)}</h2>${perms.map((p, i) => `<label style="display:flex;gap:8px;padding:5px 0"><input type="checkbox" ${i < n || (e === 'Finance' && i === 4) ? 'checked' : ''} style="accent-color:var(--accent)">${P(p)}</label>`).join('')}</div>`).join('')}</div>`;
  },
  help() {
    return hero(A('الدعم', 'Support'), A('كيف نقدر نساعدك؟', 'How can we help?'), A('فريقنا متاح من الأحد إلى الخميس، ٩ص – ٩م.', 'Our team is available Sun–Thu, 9am – 9pm.'),
      `<button class="btn" onclick="App.toast('${A('تم فتح محادثة واتساب', 'WhatsApp chat opened')}')">${ic('message-circle')}WhatsApp</button><button class="btn ghost" onclick="App.request()">${ic('ticket')}${A('فتح تذكرة', 'Open a ticket')}</button>`);
  },
  dev() { return devUnlocked() ? devPage() : lockPage(); },
  proposal() { return proposalPage(); },
};
pages['employee:dashboard'] = pages['manager:dashboard'] = pages.dashboard;

// ---------- Dev ----------
const devUnlocked = () => { try { return sessionStorage.getItem('solvia-dev') === '1'; } catch (e) { return false; } };
function lockPage() {
  return `<div class="card lock"><div class="ic">${ic('lock-keyhole')}</div><h2>${A('منطقة المطوّر', 'Developer area')}</h2><p class="muted">${A('أدخل كلمة المرور لتعديل الخدمات والأسعار.', 'Enter the password to edit services and prices.')}</p>
    <form onsubmit="App.unlock(event)" style="display:flex;gap:8px;margin-top:18px"><input class="input" type="password" id="pw" placeholder="••••••••" autofocus><button class="btn">${ic('lock-open')}${A('فتح', 'Unlock')}</button></form><p id="pwErr" class="small" style="color:var(--bad);min-height:18px"></p></div>`;
}
function devPage() {
  const groups = [...new Set(cfg.items.map(i => i.g))];
  return hero(A('المطوّر · خاص', 'Developer · private'), A('الخدمات والأسعار', 'Services & pricing'), A('حدّد سعر كل ميزة وربط واستضافة، ثم أرسل رابط العرض للعميل ليراجع ويوافق ويوقّع.', 'Price every feature, integration and hosting item, then send the client the proposal link to review, approve and sign.'),
    `<button class="btn" onclick="App.shareProposal()">${ic('link')}${A('نسخ رابط العميل', 'Copy client link')}</button><button class="btn ghost" onclick="App.go('proposal')">${ic('eye')}${A('معاينة كعميل', 'Preview as client')}</button><button class="btn ghost" onclick="App.lockDev()">${ic('lock')}${A('قفل', 'Lock')}</button>`) +
  `<div class="grid g21 section" style="align-items:start"><div>
    <div class="card"><div class="grid g2">
      <label class="field">${A('اسم العميل', 'Client name')}<input class="input" value="${esc(cfg.client)}" oninput="App.setCfg('client',this.value)"></label>
      <label class="field">${A('المشروع', 'Project')}<input class="input" value="${esc(cfg.project)}" oninput="App.setCfg('project',this.value)"></label></div>
      <label class="field" style="margin-top:12px">${A('ملاحظة للعميل', 'Note to client')}<textarea class="input" rows="2" oninput="App.setCfg('note',this.value)">${esc(cfg.note)}</textarea></label></div>
    ${groups.map(g => { const gi = cfg.items.find(i => i.g === g); return `<div class="card section"><div class="card-h"><h2>${A(gi.gar, g)}</h2><button class="btn sm ghost" onclick="App.addItem('${esc(g)}')">${ic('plus')}${A('إضافة بند', 'Add item')}</button></div>
      <div class="price-row price-head"><span></span><span>${A('البند', 'Item')}</span><span>${A('السعر (ر.س)', 'Price (SAR)')}</span><span class="hide-m">${A('الفوترة', 'Billing')}</span><span></span></div>
      ${cfg.items.map((i, x) => i.g !== g ? '' : `<div class="price-row">
        <input type="checkbox" ${i.on ? 'checked' : ''} onchange="App.setItem(${x},'on',this.checked)" style="accent-color:var(--accent);width:18px;height:18px">
        <div><input class="input" style="padding:6px 10px;font-weight:600" value="${esc(A(i.ar, i.en))}" oninput="App.setItem(${x},'${en() ? 'en' : 'ar'}',this.value)">
          <input class="input small" style="padding:4px 10px;margin-top:4px;border-style:dashed" value="${esc(i.desc)}" oninput="App.setItem(${x},'desc',this.value)">
          <label class="small muted" style="display:inline-flex;gap:6px;align-items:center;margin-top:6px"><input type="checkbox" ${i.opt ? 'checked' : ''} onchange="App.setItem(${x},'opt',this.checked)" style="accent-color:var(--accent)">${A('اختياري (يمكن للعميل إزالته)', 'Optional (client can remove)')}</label></div>
        <input class="input money" type="number" min="0" step="100" value="${i.price}" oninput="App.setItem(${x},'price',+this.value)">
        <select class="input hide-m" onchange="App.setItem(${x},'freq',this.value)"><option value="once" ${i.freq === 'once' ? 'selected' : ''}>${A('مرة واحدة', 'One-time')}</option><option value="month" ${i.freq === 'month' ? 'selected' : ''}>${A('شهري', 'Monthly')}</option></select>
        <button class="iconbtn" style="width:32px;height:32px" onclick="App.delItem(${x})">${ic('trash-2')}</button></div>`).join('')}</div>`; }).join('')}
    <div class="card section"><h2 style="margin-bottom:12px">${A('الشروط', 'Terms')}</h2><div class="grid g4">
      <label class="field">${A('الضريبة ٪', 'VAT %')}<input class="input" type="number" value="${cfg.terms.vat}" oninput="App.setTerm('vat',+this.value)"></label>
      <label class="field">${A('الخصم ٪', 'Discount %')}<input class="input" type="number" value="${cfg.terms.discount}" oninput="App.setTerm('discount',+this.value)"></label>
      <label class="field">${A('مدة التنفيذ (أسابيع)', 'Delivery (weeks)')}<input class="input" type="number" value="${cfg.terms.weeks}" oninput="App.setTerm('weeks',+this.value)"></label>
      <label class="field">${A('صلاحية العرض (أيام)', 'Valid (days)')}<input class="input" type="number" value="${cfg.terms.validity}" oninput="App.setTerm('validity',+this.value)"></label></div>
      <label class="field" style="margin-top:12px">${A('جدول الدفعات', 'Payment schedule')}<input class="input" value="${esc(cfg.terms.splitNote)}" oninput="App.setTerm('splitNote',this.value)"></label>
      <div style="margin-top:14px"><button class="btn sm ghost" onclick="App.resetCfg()">${ic('rotate-ccw')}${A('استعادة الأسعار المقترحة', 'Reset to suggested prices')}</button></div></div>
  </div><div class="card total-box" id="devTotals">${totalsBox(totals(cfg.items.filter(i => i.on), cfg.terms), cfg.terms)}</div></div>`;
}
function totalsBox(t, terms) {
  return `<div class="eyebrow">${A('إجمالي العرض', 'Proposal total')}</div>
    <div class="total-line" style="margin-top:10px"><span>${A('المبلغ لمرة واحدة', 'One-time')}</span><b class="money">${money(t.once)}</b></div>
    ${t.disc ? `<div class="total-line"><span>${A('الخصم', 'Discount')} ${terms.discount}%</span><b class="money" style="color:var(--ok)">−${money(Math.round(t.disc))}</b></div>` : ''}
    <div class="total-line"><span>${A('ضريبة القيمة المضافة', 'VAT')} ${terms.vat}%</span><b class="money">${money(Math.round(t.vat))}</b></div>
    <div class="total-line big"><span>${A('الإجمالي', 'Total')}</span><span class="money">${money(Math.round(t.total))}</span></div>
    <div class="total-line"><span>${A('ثم شهريًا (شامل الضريبة)', 'Then monthly (incl. VAT)')}</span><b class="money">${money(Math.round(t.monthVat))}</b></div>
    <div class="total-line"><span>${A('السنة الأولى كاملة', 'First year, all-in')}</span><b class="money">${money(Math.round(t.total + t.monthVat * 12))}</b></div>
    <div style="margin-top:14px"><div class="small muted" style="margin-bottom:4px">${A('جدول الدفعات', 'Payment schedule')}</div><div class="small">${esc(terms.splitNote)}</div></div>`;
}

// ---------- proposal (client view) ----------
let prop = null, propSel = null;
function loadProposal() {
  const m = location.hash.match(/p=([\w-]+)/);
  prop = null;
  if (m) { try { prop = dec(m[1]); } catch (e) {} }
  if (!prop) prop = propPayload();
  const k = JSON.stringify(prop);
  if (!propSel || propSel.k !== k) propSel = { k, on: new Set(prop.items.map(i => i.id)) };
}
function propKey() { let h = 0; for (const c of JSON.stringify(prop)) h = (h * 31 + c.charCodeAt(0)) | 0; return 'appr-' + (h >>> 0).toString(36); }
function proposalPage() {
  loadProposal();
  const sel = prop.items.filter(i => propSel.on.has(i.id)), t = totals(sel, prop.terms), appr = store.get(propKey(), null);
  const groups = [...new Set(prop.items.map(i => i.g))], ref = 'SLV-' + propKey().slice(5, 11).toUpperCase();
  return hero(A('عرض سعر', 'Proposal') + ' · ' + ref, esc(prop.project), `${prop.client ? A('مقدم إلى ', 'Prepared for ') + `<b style="color:#fff">${esc(prop.client)}</b> · ` : ''}${A('التنفيذ خلال', 'Delivery in')} ${prop.terms.weeks} ${A('أسابيع', 'weeks')} · ${A('صالح لمدة', 'Valid for')} ${prop.terms.validity} ${A('يومًا', 'days')}`,
    `<button class="btn ghost no-print" onclick="window.print()">${ic('printer')}${A('طباعة / حفظ PDF', 'Print / Save PDF')}</button>`) +
  (prop.note ? `<div class="card section">${ic('info')} ${esc(prop.note)}</div>` : '') +
  `<div class="grid g21 section" style="align-items:start"><div>
    ${groups.map((g, gi) => { const f = prop.items.find(i => i.g === g); return `<div class="card ${gi ? 'section' : ''}"><h2 style="margin-bottom:6px">${A(f.gar, g)}</h2>
      ${prop.items.filter(i => i.g === g).map(i => `<label class="pp"><input type="checkbox" ${propSel.on.has(i.id) ? 'checked' : ''} ${!i.opt || appr ? 'disabled' : ''} onchange="App.propToggle('${i.id}',this.checked)">
        <div class="grow"><div style="font-weight:600">${esc(A(i.ar, i.en))} ${i.opt ? `<span class="badge mute">${A('اختياري', 'Optional')}</span>` : ''}</div><div class="small muted">${esc(i.desc)}</div></div>
        <div class="price money">${money(i.price)}<small>${i.freq === 'month' ? A('شهريًا', 'per month') : A('مرة واحدة', 'one-time')}</small></div></label>`).join('')}</div>`; }).join('')}
  </div><div class="total-box"><div class="card">${totalsBox(t, prop.terms)}</div>
    <div class="card section">${appr ? `<div class="approved-stamp">${ic('badge-check')}<div><b>${A('تمت الموافقة', 'Approved')}</b><div class="small">${esc(appr.name)}${appr.company ? ' · ' + esc(appr.company) : ''}<br>${new Date(appr.at).toLocaleString('en-GB')}</div></div></div>
        ${appr.sig ? `<img src="${appr.sig}" alt="" style="width:100%;margin-top:12px;border-radius:12px;background:#fff">` : ''}
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px" class="no-print"><button class="btn sm" onclick="App.sendApproval('wa')">${ic('message-circle')}${A('إرسال عبر واتساب', 'Send on WhatsApp')}</button><button class="btn sm ghost" onclick="App.sendApproval('mail')">${ic('mail')}${A('البريد', 'Email')}</button></div>`
      : `<h2 style="margin-bottom:12px">${A('الموافقة والتوقيع', 'Approve & sign')}</h2>
        <label class="field">${A('الاسم الكامل', 'Full name')}<input class="input" id="apName"></label>
        <label class="field" style="margin-top:10px">${A('الجهة / الشركة', 'Company')}<input class="input" id="apCo" value="${esc(prop.client)}"></label>
        <div class="field" style="margin-top:10px">${A('التوقيع', 'Signature')}<canvas class="sig" id="sig"></canvas><button class="link small" style="align-self:flex-start;padding:0" onclick="App.clearSig()">${A('مسح', 'Clear')}</button></div>
        <label class="small" style="display:flex;gap:8px;margin-top:10px"><input type="checkbox" id="apOk" style="accent-color:var(--accent)">${A('اطلعت على النطاق والأسعار أعلاه وأوافق على شروط الدفع.', 'I have reviewed the scope and prices above and agree to the payment terms.')}</label>
        <button class="btn" style="width:100%;justify-content:center;margin-top:14px" onclick="App.approve()">${ic('pen-line')}${A('أوافق وأوقّع', 'Approve & sign')} · ${money(Math.round(t.total))}</button>`}
    </div></div></div>`;
}
function sigPad() {
  const c = $('#sig'); if (!c) return;
  const r = c.getBoundingClientRect(); c.width = r.width * 2; c.height = r.height * 2;
  const x = c.getContext('2d'); x.scale(2, 2); x.lineWidth = 2; x.lineCap = 'round'; x.strokeStyle = '#0b2a21';
  let d = false; c.dataset.empty = '1';
  const p = e => { const b = c.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  c.onpointerdown = e => { d = true; c.setPointerCapture(e.pointerId); x.beginPath(); x.moveTo(...p(e)); };
  c.onpointermove = e => { if (!d) return; x.lineTo(...p(e)); x.stroke(); c.dataset.empty = '0'; };
  c.onpointerup = () => d = false;
}
const after = {
  proposal: sigPad,
  tickets() {
    document.querySelectorAll('.tk').forEach(el => el.ondragstart = e => e.dataTransfer.setData('id', el.dataset.id));
    document.querySelectorAll('.col').forEach(col => {
      col.ondragover = e => { e.preventDefault(); col.classList.add('over'); };
      col.ondragleave = () => col.classList.remove('over');
      col.ondrop = e => { e.preventDefault(); const t = tickets.find(t => t.id === e.dataTransfer.getData('id')); if (t) { t.st = col.dataset.col; saveTk(); render(); toast(`#${t.id} → ${A(ST[t.st][0], ST[t.st][1])}`); } };
    });
  },
};

// ---------- public API ----------
window.App = {
  toast,
  go(r) {
    route = r;
    if (r !== 'proposal' || !location.hash.includes('p=')) history.replaceState(null, '', '#' + (isDev() ? r : role + '/' + r));
    App.closeAll(); render(); window.scrollTo(0, 0);
  },
  role(k) { role = k; store.set('role', k); App.go(ROLES[k][3][0][0]); },
  toggleSide() { $('#side').classList.toggle('show'); $('#scrim').classList.toggle('show'); },
  toggleLang() { const e = !en(); document.documentElement.lang = e ? 'en' : 'ar'; document.documentElement.dir = e ? 'ltr' : 'rtl'; try { localStorage.setItem('solvia-lang', e ? 'en' : 'ar'); } catch (x) {} render(); },
  toggleTheme() { const d = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = d; try { localStorage.setItem('solvia-theme', d); } catch (x) {} render(); },
  closeAll() { ['#drawer', '#modal', '#scrim', '#side'].forEach(s => $(s).classList.remove('show')); },
  notify() { toast(A('طلبك #REQ-10429 قيد التنفيذ', 'Request #REQ-10429 is in progress'), 'bell'); },
  svcCat(k) { svcCat = k; render(); },
  tkFilter(k) { tkFilter = k; render(); },
  tkView(k) { tkView = k; store.set('tkview', k); render(); },
  setSvc(i, k, v) { D.services[i][k] = v; toast(A('تم حفظ السعر', 'Price saved')); },
  openTicket(id) {
    const t = tickets.find(t => t.id === id); if (!t) return;
    const staffView = role !== 'customer';
    $('#drawer').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><span class="muted">#${t.id}</span><button class="iconbtn" onclick="App.closeAll()">${ic('x')}</button></div>
      <h2 style="margin:10px 0">${svcName(t.svc)}</h2><div class="chips">${stB(t.st)}${prB(t.p)}${slaB(t)}</div>${journey(t.st)}
      <div class="grid g2" style="margin-top:8px">
        <div><div class="small muted">${A('العميل', 'Customer')}</div>${esc(P(t.cust))}</div><div><div class="small muted">${A('المختص', 'Specialist')}</div>${staff(t.emp)}</div>
        <div><div class="small muted">${A('القناة', 'Channel')}</div>${ic(CH[t.ch])} ${t.ch}</div><div><div class="small muted">${A('المنصة', 'Platform')}</div>${A(plat(svc(t.svc)[1])[1], plat(svc(t.svc)[1])[2])}</div></div>
      ${staffView ? `<div class="field" style="margin-top:18px">${A('تغيير الحالة', 'Change status')}<div class="chips">${Object.keys(ST).map(s => `<button class="chip ${t.st === s ? 'on' : ''}" onclick="App.setStatus('${t.id}','${s}')">${A(ST[s][0], ST[s][1])}</button>`).join('')}</div></div>
      <div class="field" style="margin-top:12px">${A('تعيين إلى', 'Assign to')}<div class="chips">${Object.keys(D.staff).map(k => `<button class="chip ${t.emp === k ? 'on' : ''}" onclick="App.assign('${t.id}','${k}')">${staff(k)}</button>`).join('')}</div></div>` : ''}
      <h3 style="margin:22px 0 4px;font-size:16px">${A('النشاط', 'Activity')}</h3><div class="timeline">
        <div>${A('تم إرسال تحديث للعميل عبر واتساب', 'Customer updated on WhatsApp')}<small>${A('قبل ١٠ دقائق', '10 min ago')}</small></div>
        <div>${A('تم تعيين المختص', 'Specialist assigned')}: ${staff(t.emp)}<small>${A('قبل', '')} ${t.age}${A(' ساعات', 'h ago')}</small></div>
        <div>${A('تم الدفع وإنشاء الطلب', 'Paid and created')}<small>${t.age}${A(' ساعات', 'h ago')}</small></div></div>
      <div style="display:flex;gap:8px;margin-top:14px"><input class="input" placeholder="${staffView ? A('اكتب ردًا للعميل…', 'Reply to customer…') : A('اكتب رسالة للمختص…', 'Message your specialist…')}"><button class="btn" onclick="App.toast('${A('تم الإرسال', 'Sent')}')">${ic('send')}</button></div>
      ${staffView ? `<div style="display:flex;gap:8px;margin-top:10px"><button class="btn sm ghost" onclick="App.toast('${A('تم إرسال واتساب للعميل', 'WhatsApp sent')}')">${ic('message-circle')}WhatsApp</button><button class="btn sm ghost" onclick="App.toast('${A('تم إرسال رسالة نصية', 'SMS sent')}')">${ic('smartphone')}SMS</button></div>` : ''}`;
    icons(); $('#drawer').classList.add('show'); $('#scrim').classList.add('show');
  },
  setStatus(id, s) { tickets.find(t => t.id === id).st = s; saveTk(); render(); App.openTicket(id); toast(`#${id} → ${A(ST[s][0], ST[s][1])}`); },
  assign(id, k) { tickets.find(t => t.id === id).emp = k; saveTk(); render(); App.openTicket(id); toast(A('تم التعيين', 'Assigned') + ': ' + staff(k)); },
  request(id = 's1') {
    const s = svc(id);
    openModal(`<div class="card-h"><div><span class="badge">${A('طلب جديد', 'New request')}</span><h2 style="margin-top:6px">${A('طلب خدمة', 'Request a service')}</h2></div><button class="iconbtn" onclick="App.closeAll()">${ic('x')}</button></div>
      <form onsubmit="App.createRequest(event)" class="grid" style="gap:12px">
        <label class="field">${A('الخدمة', 'Service')}<select class="input" name="svc" onchange="document.getElementById('rqPrice').textContent=this.selectedOptions[0].dataset.p">${D.services.map(x => `<option value="${x[0]}" data-p="${priceTxt(x[6])}" ${x[0] === id ? 'selected' : ''}>${A(x[2], x[3])}</option>`).join('')}</select></label>
        <div class="grid g2"><label class="field">${A('الاسم', 'Name')}<input class="input" value="${A(me[0], me[1])}" required></label><label class="field">${A('الجوال', 'Mobile')}<input class="input" dir="ltr" value="+966 5X XXX XXXX"></label></div>
        <label class="field">${A('تفاصيل الطلب', 'Details')}<textarea class="input" rows="3"></textarea></label>
        <div class="card" style="padding:14px;display:flex;gap:12px;align-items:center"><div class="plat-tile">${ic('file-up')}</div><div class="grow" style="flex:1"><b>${A('المستندات', 'Documents')}</b><div class="small muted">${A('الهوية أو السجل التجاري والمستندات المطلوبة', 'ID or CR and any required documents')}</div></div><button type="button" class="btn sm ghost" onclick="App.toast('${A('تم رفع الملف', 'File uploaded')}')">${ic('upload')}${A('رفع', 'Upload')}</button></div>
        <div class="field">${A('طريقة الدفع', 'Payment')}<div class="chips" id="payChips">${['Mada', 'Apple Pay', 'STC Pay', 'Visa / Mastercard'].map((m, i) => `<button type="button" class="chip ${i ? '' : 'on'}" onclick="document.querySelectorAll('#payChips .chip').forEach(c=>c.classList.toggle('on',c===this))">${m}</button>`).join('')}</div></div>
        <label class="small" style="display:flex;gap:8px"><input type="checkbox" checked style="accent-color:var(--accent)">${A('أرسل لي التحديثات عبر واتساب', 'Send me updates on WhatsApp')}</label>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div><div class="small muted">${A('الإجمالي', 'Total')}</div><b id="rqPrice" style="font-size:18px">${priceTxt(s[6])}</b></div><button class="btn">${ic('credit-card')}${A('ادفع وأنشئ الطلب', 'Pay & create')}</button></div></form>`);
  },
  createRequest(e) {
    e.preventDefault();
    const id = 'REQ-' + (Math.max(...tickets.map(t => +t.id.slice(4))) + 1), s = svc(new FormData(e.target).get('svc'));
    tickets.unshift({ id, svc: s[0], cust: me, st: 'new', p: 'normal', emp: '', age: 0, sla: s[8], ch: 'web' });
    saveTk(); App.closeAll(); render(); toast(A('تم الدفع وإنشاء الطلب ', 'Paid — created ') + '#' + id, 'badge-check');
  },
  meeting() {
    openModal(`<div class="card-h"><h2>${A('احجز اجتماعًا مع فريق Solvia', 'Book a meeting with Solvia')}</h2><button class="iconbtn" onclick="App.closeAll()">${ic('x')}</button></div>
      <form class="grid" style="gap:12px" onsubmit="event.preventDefault();App.closeAll();App.toast('${A('تم إرسال طلب الاجتماع', 'Meeting request sent')}')">
      <label class="field">${A('اسم المنشأة', 'Company')}<input class="input" required></label><label class="field">${A('اسم المسؤول', 'Contact name')}<input class="input"></label>
      <div class="grid g2"><label class="field">${A('الجوال', 'Mobile')}<input class="input" dir="ltr"></label><label class="field">${A('عدد الموظفين', 'Staff')}<select class="input"><option>1–20</option><option>21–100</option><option>100+</option></select></label></div>
      <button class="btn" style="justify-content:center">${ic('calendar-plus')}${A('إرسال', 'Send')}</button></form>`);
  },
  async unlock(e) {
    e.preventDefault();
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode($('#pw').value));
    const h = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    if (h === D.devHash) { try { sessionStorage.setItem('solvia-dev', '1'); } catch (x) {} render(); } else $('#pwErr').textContent = A('كلمة المرور غير صحيحة', 'Wrong password');
  },
  lockDev() { try { sessionStorage.removeItem('solvia-dev'); } catch (x) {} render(); },
  setCfg(k, v) { cfg[k] = v; saveCfg(); },
  setTerm(k, v) { cfg.terms[k] = v; saveCfg(); App.refreshTotals(); },
  setItem(x, k, v) { cfg.items[x][k] = v; if (k === 'ar' || k === 'en') { cfg.items[x][k === 'ar' ? 'en' : 'ar'] ||= v; } saveCfg(); App.refreshTotals(); },
  refreshTotals() { const el = $('#devTotals'); if (el) el.innerHTML = totalsBox(totals(cfg.items.filter(i => i.on), cfg.terms), cfg.terms); },
  addItem(g) { const f = cfg.items.find(i => i.g === g); cfg.items.push({ id: 'c' + Date.now().toString(36), g, gar: f.gar, ar: 'بند جديد', en: 'New item', desc: '', price: 0, freq: 'once', on: true, opt: false }); saveCfg(); render(); },
  delItem(x) { cfg.items.splice(x, 1); saveCfg(); render(); },
  resetCfg() { if (confirm(A('استعادة جميع الأسعار المقترحة؟', 'Reset all prices to the suggested defaults?'))) { cfg = defaultCfg(); saveCfg(); render(); } },
  shareProposal() {
    const url = location.origin + location.pathname + '#proposal?p=' + enc(propPayload());
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast(A('تم نسخ رابط العميل — أرسله عبر واتساب', 'Client link copied — send it on WhatsApp'), 'link'), () => prompt('Copy:', url));
  },
  propToggle(id, on) { on ? propSel.on.add(id) : propSel.on.delete(id); render(); },
  clearSig() { const c = $('#sig'); c.getContext('2d').clearRect(0, 0, c.width, c.height); c.dataset.empty = '1'; },
  approve() {
    const name = $('#apName').value.trim(), company = $('#apCo').value.trim(), c = $('#sig');
    if (!name) return toast(A('يرجى إدخال الاسم', 'Please enter your name'), 'circle-alert');
    if (c.dataset.empty === '1') return toast(A('يرجى التوقيع في المربع', 'Please sign in the box'), 'circle-alert');
    if (!$('#apOk').checked) return toast(A('يرجى الموافقة على الشروط', 'Please accept the terms'), 'circle-alert');
    store.set(propKey(), { name, company, at: Date.now(), sig: c.toDataURL('image/png'), items: [...propSel.on] });
    render(); toast(A('تمت الموافقة — شكرًا لك!', 'Approved — thank you!'), 'badge-check');
  },
  sendApproval(kind) {
    const a = store.get(propKey(), {}), sel = prop.items.filter(i => a.items?.includes(i.id)), t = totals(sel, prop.terms), ref = 'SLV-' + propKey().slice(5, 11).toUpperCase();
    const msg = `✅ تمت الموافقة على العرض ${ref}\n${prop.project}\nالاسم: ${a.name}${a.company ? ' — ' + a.company : ''}\nالتاريخ: ${new Date(a.at).toLocaleString('en-GB')}\n\n${sel.map(i => `• ${i.ar} — ${(+i.price).toLocaleString('en-US')} ر.س${i.freq === 'month' ? ' / شهريًا' : ''}`).join('\n')}\n\nالإجمالي (شامل الضريبة): ${Math.round(t.total).toLocaleString('en-US')} ر.س\nشهريًا (شامل الضريبة): ${Math.round(t.monthVat).toLocaleString('en-US')} ر.س\nالدفعات: ${prop.terms.splitNote}\n\n${location.href}`;
    if (kind === 'wa') window.open('https://wa.me/' + (D.developer.whatsapp || '') + '?text=' + encodeURIComponent(msg), '_blank');
    else location.href = `mailto:${D.developer.email}?subject=${encodeURIComponent('Proposal ' + ref + ' approved')}&body=${encodeURIComponent(msg)}`;
  },
};

// ---------- boot ----------
const h = location.hash.slice(1);
if (h.startsWith('proposal')) { route = 'proposal'; if (h.includes('p=')) document.body.classList.add('client-mode'); }
else if (h === 'dev') route = 'dev';
else if (h.includes('/')) { const [r, p] = h.split('/'); if (ROLES[r]) { role = r; route = p; } }
render();
})();
