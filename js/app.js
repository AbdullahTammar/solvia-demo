(() => {
const $ = s => document.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem('solvia-' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('solvia-' + k, JSON.stringify(v)); } catch (e) {} },
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ar = () => document.documentElement.lang === 'ar';
const T = k => (D.t[ar() ? 'ar' : 'en'][k] ?? D.t.en[k] ?? k);
const L = (en, a) => (ar() && a ? a : en);
const money = n => (ar() ? '' : 'SAR ') + Math.round(n).toLocaleString('en-US') + (ar() ? ' ر.س' : '');
const num = n => n.toLocaleString(ar() ? 'ar-SA' : 'en-US');
const ic = (n, cls = '') => `<i data-lucide="${n}" class="${cls}"></i>`;
const icons = () => window.lucide && lucide.createIcons();

let route = 'home';
let tickets = store.get('tickets', D.tickets);
let tkView = store.get('tkview', 'board'), tkFilter = 'all';
let approvals = [...D.approvals];

// ---------- price config ----------
function defaultCfg() {
  const items = [];
  D.catalog.forEach(g => g.items.forEach(([id, en, a, desc, price, freq]) =>
    items.push({ id, g: g.g, en, ar: a, desc, price, freq, on: D.defaultOn.includes(id), opt: ['nafath', 'pms', 'sso', 'mobile', 'reports'].includes(id) })));
  return { items, terms: { ...D.terms }, client: 'Anjum Hotels', project: 'Solvia — Hotel Operations Portal', note: '' };
}
let cfg = store.get('cfg', null) || defaultCfg();
const saveCfg = () => store.set('cfg', cfg);
const enc = o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const dec = s => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))));

function totals(items, terms) {
  const once = items.filter(i => i.freq === 'once').reduce((a, i) => a + +i.price, 0);
  const month = items.filter(i => i.freq === 'month').reduce((a, i) => a + +i.price, 0);
  const disc = once * (+terms.discount || 0) / 100;
  const base = once - disc;
  const vat = base * (+terms.vat || 0) / 100;
  return { once, month, disc, base, vat, total: base + vat, monthVat: month * (1 + (+terms.vat || 0) / 100) };
}

// ---------- shell ----------
function shell() {
  $('#rail').innerHTML = `<div class="logo">S</div>` + D.rail.map(([id, i, en, a]) =>
    `<button title="${esc(L(en, a))}" data-r="${id}" onclick="App.go('${id === 'home' ? 'home' : id}')">${ic(i)}</button>`).join('') + `<div class="sp"></div>`;
  $('#side').innerHTML = `<div class="brand"><b>Solvia</b><small>${L('Anjum Hotels · Makkah', 'فنادق أنجم · مكة المكرمة')}</small></div>` +
    D.nav.map(([g, items]) => `<div class="grp">${T(g)}</div>` + items.map(([id, i]) => {
      const b = id === 'approvals' ? `<span class="badge">${approvals.length}</span>` : id === 'tickets' ? `<span class="badge">${tickets.filter(t => t.s !== 'resolved').length}</span>` : id === 'dev' ? ic('lock', 'badge-ic') : '';
      return `<button class="nav ${id === 'dev' ? 'dev' : ''}" data-n="${id}" onclick="App.go('${id}')">${ic(i)}<span>${T(id)}</span>${b ? `<span class="badge-w" style="margin-inline-start:auto">${b}</span>` : ''}</button>`;
    }).join('')).join('');
  $('#q').placeholder = T('search');
  $('#langBtn').textContent = ar() ? 'English' : 'العربية';
  $('#themeIc').setAttribute('data-lucide', document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon');
}
function mark() {
  document.querySelectorAll('[data-n]').forEach(b => b.classList.toggle('active', b.dataset.n === route));
  const railMap = { tickets: 'tickets', sla: 'tickets' };
  document.querySelectorAll('[data-r]').forEach(b => b.classList.toggle('active', b.dataset.r === (railMap[route] || (D.rail.some(r => r[0] === route) ? route : 'home'))));
}
function render() {
  shell();
  const fn = pages[route] || (D.rail.some(r => r[0] === route) ? () => modulePage(route) : pages.home);
  $('#page').innerHTML = fn();
  mark(); icons();
  after[route] && after[route]();
  window.scrollTo(0, 0);
}
function toast(msg, i = 'check') {
  const t = $('#toast'); t.innerHTML = ic(i) + esc(msg); icons(); t.classList.add('show');
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2400);
}

const hero = (eyebrow, title, sub, actions = '') => `<section class="hero">
  <svg class="pattern" viewBox="0 0 100 100" fill="none" stroke="#e39a5e" stroke-width="1.2">${[0, 1, 2, 3].map(i => `<rect x="${20 + i * 2}" y="${20 + i * 2}" width="${60 - i * 4}" height="${60 - i * 4}" transform="rotate(${i * 22.5} 50 50)"/>`).join('')}<circle cx="50" cy="50" r="12"/></svg>
  <div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}${actions ? `<div class="actions">${actions}</div>` : ''}</section>`;
const today = () => new Date().toLocaleDateString(ar() ? 'ar-SA' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
const stat = (i, l, v, s, up = true) => `<div class="card stat"><div class="ic">${ic(i)}</div><div><div class="lbl">${l}</div><div class="val">${v}</div><div class="sub">${up ? ic('arrow-up-right') : ''}${s}</div></div></div>`;
const prBadge = p => `<span class="badge ${{ critical: 'bad', high: 'warn', medium: 'info', low: 'mute' }[p]}"><span class="d"></span>${T(p)}</span>`;
const stBadge = s => `<span class="badge ${{ open: 'info', inprogress: 'warn', onhold: 'mute', resolved: 'ok' }[s]}">${T(s)}</span>`;
const chIc = { whatsapp: 'message-circle', sms: 'smartphone', phone: 'phone', app: 'tablet-smartphone', portal: 'globe' };

// ---------- pages ----------
const pages = {
  home() {
    const open = tickets.filter(t => t.s !== 'resolved');
    return hero(`${T('overview')} · ${today()}`, T('greet'), T('heroSub'),
      `<button class="btn" onclick="App.newTicket()">${ic('plus')}${T('newTicket')}</button><button class="btn ghost" onclick="App.go('approvals')">${ic('stamp')}${T('approvals')}</button>`) +
    `<div class="grid g4 section">
      ${stat('plane-landing', T('arrivals'), num(247), `${num(97)} ${T('due')}`)}
      ${stat('users', T('inhouse'), num(2675), `${num(1047)} ${T('rooms')}`)}
      ${stat('plane-takeoff', T('departures'), num(256), `${num(1)} ${T('dueout')}`, false)}
      ${stat('percent', T('occupancy'), num(92) + '%', `+4% ${T('vsfc')}`)}
    </div>
    <div class="grid g21 section">
      <div class="card"><div class="card-h"><div><div class="eyebrow">${T('workflows')}</div><h2>${T('waiting')}</h2></div>
        <div style="display:flex;gap:10px;align-items:center"><span class="badge"><span class="d"></span>${num(approvals.length)} ${T('pending')}</span><button class="link" onclick="App.go('approvals')">${T('openQueue')}</button></div></div>
        ${approvalRows(approvals)}</div>
      <div class="card"><div class="card-h"><div><div class="eyebrow">${T('service')}</div><h2>${L('Urgent tickets', 'تذاكر عاجلة')}</h2></div><button class="link" onclick="App.go('tickets')">${L('View all', 'عرض الكل')}</button></div>
        ${open.filter(t => ['critical', 'high'].includes(t.p)).slice(0, 4).map(t => `<div class="row" onclick="App.openTicket('${t.id}')" style="cursor:pointer"><div class="ic">${ic(chIc[t.ch])}</div><div class="grow"><div class="t">${esc(t.t)}</div><div class="s">${t.id} · ${L('Room', 'غرفة')} ${esc(t.r)}</div></div>${prBadge(t.p)}</div>`).join('')}
      </div>
    </div>
    <div class="grid g2 section">
      <div class="card"><div class="card-h"><div><div class="eyebrow">${L('This week', 'هذا الأسبوع')}</div><h2>${L('Occupancy trend', 'اتجاه الإشغال')}</h2></div></div>
        <div class="bars">${[78, 82, 85, 88, 92, 96, 94].map((v, i) => `<div class="${i === 4 ? 'hi' : ''}" style="height:${v}%" title="${v}%"><span>${(ar() ? ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])[i]}</span></div>`).join('')}</div><div style="height:22px"></div></div>
      <div class="card"><div class="card-h"><div><div class="eyebrow">${T('community')}</div><h2>${L('Latest from the team', 'آخر أخبار الفريق')}</h2></div><button class="link" onclick="App.go('community')">${L('Open', 'فتح')}</button></div>
        ${feed().slice(0, 3).map(f => `<div class="row"><div class="avatar" style="width:34px;height:34px;font-size:12px">${f[0]}</div><div class="grow"><div class="t">${f[1]}</div><div class="s">${f[2]}</div></div></div>`).join('')}</div>
    </div>`;
  },
  profile() {
    return hero(T('profile'), 'Abdullah Tammar', L('IT Systems Manager · Anjum Hotel Makkah', 'مدير أنظمة تقنية المعلومات · فندق أنجم مكة')) +
    `<div class="grid g3 section">${stat('briefcase', L('Department', 'القسم'), 'IT', L('Since 2021', 'منذ ٢٠٢١'), false)}${stat('ticket-check', L('Tickets closed', 'تذاكر مغلقة'), num(312), L('+18 this month', '+١٨ هذا الشهر'))}${stat('stamp', L('Approvals given', 'موافقات'), num(128), L('avg. 2.1h response', 'متوسط ٢٫١ ساعة'), false)}</div>
    <div class="card section"><h2 style="margin-bottom:14px">${L('Details', 'التفاصيل')}</h2><div class="grid g2">
    ${[['Email', 'البريد', 'a.tammar@anjumhotels.com'], ['Phone', 'الجوال', '+966 5• ••• ••••'], ['Location', 'الموقع', L('Makkah, Ajyad', 'مكة، أجياد')], ['Manager', 'المدير', 'General Manager']].map(([e, a, v]) => `<label class="field">${L(e, a)}<input class="input" value="${esc(v)}"></label>`).join('')}</div></div>`;
  },
  community() {
    return hero(T('community'), L('What\'s happening', 'ماذا يحدث'), L('Announcements, shout-outs and news from every department.', 'الإعلانات والتقدير والأخبار من جميع الأقسام.')) +
    `<div class="card section"><div style="display:flex;gap:10px"><input class="input" placeholder="${L('Share something with the team…', 'شارك شيئًا مع الفريق…')}"><button class="btn">${ic('send')}</button></div></div>` +
    feed().map(f => `<div class="card section"><div class="row" style="padding:0"><div class="avatar">${f[0]}</div><div class="grow"><div class="t">${f[3]}</div><div class="s">${f[4]}</div></div></div><p style="margin:14px 0 10px">${f[1]}</p><div class="s muted">${f[2]}</div><div style="display:flex;gap:8px;margin-top:12px"><button class="chip">${ic('heart')} 24</button><button class="chip">${ic('message-circle')} 5</button></div></div>`).join('');
  },
  access() {
    const sys = [['Opera PMS', 'hotel', 'ok'], ['Micros POS', 'credit-card', 'ok'], ['Oracle Finance', 'landmark', 'warn'], ['HotSOS', 'wrench', 'ok'], ['Microsoft 365', 'mail', 'ok'], ['CCTV', 'cctv', 'mute']];
    return hero(T('access'), L('Your systems', 'أنظمتك'), L('See what you can reach and request anything missing — every request is approved and logged.', 'اطلع على صلاحياتك واطلب ما ينقصك — كل طلب يُعتمد ويُسجَّل.'), `<button class="btn" onclick="App.toast('${L('Request sent', 'تم إرسال الطلب')}')">${ic('key-round')}${L('Request access', 'طلب صلاحية')}</button>`) +
    `<div class="grid g3 section">${sys.map(([n, i, s]) => `<div class="card"><div class="stat"><div class="ic">${ic(i)}</div><div class="grow" style="flex:1"><div class="t" style="font-weight:500">${n}</div><div class="s muted small">${s === 'ok' ? L('Full access', 'صلاحية كاملة') : s === 'warn' ? L('Read only · request pending', 'قراءة فقط · طلب معلّق') : L('No access', 'لا توجد صلاحية')}</div></div><span class="badge ${s}">${s === 'ok' ? L('Active', 'نشط') : s === 'warn' ? L('Pending', 'معلّق') : L('None', 'لا يوجد')}</span></div></div>`).join('')}</div>`;
  },
  approvals() {
    return hero(T('workflows'), T('approvals'), L('Everything waiting on your decision, oldest first.', 'كل ما ينتظر قرارك، الأقدم أولًا.')) +
    `<div class="card section">${approvals.length ? approvalRows(approvals) : `<div class="empty">${ic('circle-check')}<p>${L('All caught up!', 'لا يوجد شيء بانتظارك!')}</p></div>`}</div>`;
  },
  requests() {
    const r = [['WF-2270', L('IT equipment · Laptop', 'معدات تقنية · حاسب محمول'), 'ok', L('Approved', 'معتمد'), 100], ['WF-2279', L('Training budget', 'ميزانية تدريب'), 'warn', L('Finance review', 'مراجعة مالية'), 60], ['WF-2290', L('Overtime · September', 'عمل إضافي · سبتمبر'), 'info', L('HR review', 'مراجعة الموارد البشرية'), 30]];
    return hero(T('workflows'), T('requests'), L('Track every request you have raised.', 'تابع جميع طلباتك.'), `<button class="btn" onclick="App.go('start')">${ic('circle-plus')}${T('start')}</button>`) +
    `<div class="card section">${r.map(([id, t, c, s, p]) => `<div class="row"><div class="ic">${ic('file-text')}</div><div class="grow"><div class="t">${t}</div><div class="s">${id}</div><div class="progress" style="margin-top:8px;max-width:280px"><i style="width:${p}%"></i></div></div><span class="badge ${c}">${s}</span></div>`).join('')}</div>`;
  },
  start() {
    const w = [['shopping-cart', 'Purchase request', 'طلب شراء'], ['plane', 'Leave request', 'طلب إجازة'], ['badge-percent', 'Rate override', 'تعديل سعر'], ['laptop', 'IT equipment', 'معدات تقنية'], ['clock', 'Overtime', 'عمل إضافي'], ['user-plus', 'New hire onboarding', 'تعيين موظف جديد'], ['receipt', 'Expense claim', 'مطالبة مصاريف'], ['key-round', 'System access', 'صلاحية نظام']];
    return hero(T('workflows'), T('start'), L('Pick a template — routing and approvers are set up for you.', 'اختر نموذجًا — المسار والمعتمدون جاهزون.')) +
    `<div class="grid g4 section">${w.map(([i, e, a]) => `<button class="card stat" style="cursor:pointer;text-align:start" onclick="App.toast('${esc(L(e, a))} — ${L('draft created', 'تم إنشاء مسودة')}')"><div class="ic">${ic(i)}</div><div><div style="font-weight:500">${L(e, a)}</div><div class="small muted">${L('~2 min', '~ دقيقتان')}</div></div></button>`).join('')}</div>`;
  },
  masters() {
    const m = [['Purchase request', 'طلب شراء', L('Requester → Dept head → Finance → GM', 'مقدم الطلب ← رئيس القسم ← المالية ← المدير العام'), 4], ['Leave request', 'طلب إجازة', L('Requester → Manager → HR', 'مقدم الطلب ← المدير ← الموارد البشرية'), 3], ['Rate override', 'تعديل سعر', L('Agent → Revenue manager', 'الموظف ← مدير الإيرادات'), 2]];
    return hero(T('workflows'), T('masters'), L('Design approval routes, SLAs and escalations.', 'صمّم مسارات الموافقة والمهل والتصعيد.')) +
    `<div class="card section"><div class="tbl-wrap"><table><tr><th>${L('Workflow', 'المسار')}</th><th>${L('Route', 'المسار')}</th><th>${L('Steps', 'الخطوات')}</th><th></th></tr>${m.map(([e, a, r, s]) => `<tr><td><b style="font-weight:500">${L(e, a)}</b></td><td class="muted">${r}</td><td>${num(s)}</td><td><span class="badge ok">${L('Live', 'مفعل')}</span></td></tr>`).join('')}</table></div></div>`;
  },
  tickets() {
    const f = tickets.filter(t => tkFilter === 'all' || (tkFilter === 'mine' && t.who === 'AT') || (tkFilter === 'urgent' && ['critical', 'high'].includes(t.p)));
    const cols = ['open', 'inprogress', 'onhold', 'resolved'];
    const breach = tickets.filter(t => t.s !== 'resolved' && t.age > t.sla).length;
    return hero(T('service'), L('Service desk', 'مكتب الخدمات'), L('Guest and staff requests from WhatsApp, SMS, phone and the app — in one board with live SLA timers.', 'طلبات النزلاء والموظفين من واتساب والرسائل والهاتف والتطبيق — في لوحة واحدة مع مؤقتات SLA مباشرة.'),
      `<button class="btn" onclick="App.newTicket()">${ic('plus')}${T('newTicket')}</button>`) +
    `<div class="grid g4 section">
      ${stat('inbox', T('open'), num(tickets.filter(t => t.s === 'open').length), L('new today: 6', 'جديد اليوم: ٦'), false)}
      ${stat('loader', T('inprogress'), num(tickets.filter(t => t.s === 'inprogress').length), L('avg. 18 min', 'متوسط ١٨ دقيقة'), false)}
      ${stat('triangle-alert', L('SLA breached', 'تجاوز SLA'), num(breach), L('needs escalation', 'يحتاج تصعيد'), false)}
      ${stat('circle-check-big', L('Resolved today', 'حُلّت اليوم'), num(tickets.filter(t => t.s === 'resolved').length + 21), L('96% within SLA', '٩٦٪ ضمن المهلة'))}
    </div>
    <div class="toolbar"><div class="tabs">${['all', 'mine', 'urgent'].map(k => `<button class="${tkFilter === k ? 'active' : ''}" onclick="App.tkFilter('${k}')">${T(k)}</button>`).join('')}</div><div style="flex:1"></div>
      <div class="tabs">${[['board', 'kanban'], ['list', 'list']].map(([k, i]) => `<button class="${tkView === k ? 'active' : ''}" onclick="App.tkView('${k}')">${ic(i)} ${T(k)}</button>`).join('')}</div></div>
    ${tkView === 'board' ? `<div class="kanban">${cols.map(c => `<div class="col" data-col="${c}"><h3>${stBadge(c)}<span class="muted">${num(f.filter(t => t.s === c).length)}</span></h3>${f.filter(t => t.s === c).map(tkCard).join('')}</div>`).join('')}</div>`
      : `<div class="card"><div class="tbl-wrap"><table><tr><th>ID</th><th>${T('title')}</th><th>${T('dept')}</th><th>${T('priority')}</th><th>${L('Status', 'الحالة')}</th><th>SLA</th></tr>${f.map(t => `<tr class="click" onclick="App.openTicket('${t.id}')"><td class="muted">${t.id}</td><td>${esc(t.t)}<div class="small muted">${L('Room', 'غرفة')} ${esc(t.r)}</div></td><td>${esc(t.d)}</td><td>${prBadge(t.p)}</td><td>${stBadge(t.s)}</td><td>${slaTxt(t)}</td></tr>`).join('')}</table></div></div>`}`;
  },
  sla() {
    const d = [['Engineering', 'الهندسة', 91, 42], ['Housekeeping', 'التدبير', 98, 18], ['Front office', 'الاستقبال', 96, 12], ['F&B', 'الأغذية', 93, 25], ['IT', 'تقنية المعلومات', 88, 55]];
    return hero(T('service'), T('sla'), L('Response targets and performance by department.', 'أهداف الاستجابة والأداء لكل قسم.')) +
    `<div class="grid g3 section">${[['critical', 15, 60], ['high', 30, 120], ['medium', 60, 240]].map(([p, r, s]) => `<div class="card"><div class="card-h">${prBadge(p)}</div><div class="small muted">${L('First response', 'أول استجابة')}</div><div class="stat"><div class="val">${num(r)} ${L('min', 'د')}</div></div><div class="small muted" style="margin-top:8px">${L('Resolve within', 'الحل خلال')} ${num(s)} ${L('min', 'د')}</div></div>`).join('')}</div>
    <div class="card section"><h2 style="margin-bottom:10px">${L('By department', 'حسب القسم')}</h2><div class="tbl-wrap"><table><tr><th>${T('dept')}</th><th>${L('Within SLA', 'ضمن المهلة')}</th><th>${L('Avg. resolve', 'متوسط الحل')}</th></tr>${d.map(([e, a, p, m]) => `<tr><td>${L(e, a)}</td><td><div style="display:flex;gap:10px;align-items:center"><div class="progress" style="flex:1;max-width:220px"><i style="width:${p}%;background:${p > 95 ? 'var(--ok)' : p > 90 ? 'var(--accent)' : 'var(--warn)'}"></i></div>${num(p)}%</div></td><td>${num(m)} ${L('min', 'د')}</td></tr>`).join('')}</table></div></div>`;
  },
  dev() { return devUnlocked() ? devPage() : lockPage(); },
  proposal() { return proposalPage(); },
};

function modulePage(id) {
  const r = D.rail.find(x => x[0] === id);
  return hero(L('Module', 'وحدة'), L(r[2], r[3]), L('This module is part of the roadmap. The layout below shows the planned KPIs.', 'هذه الوحدة ضمن خارطة الطريق. يوضح التصميم أدناه المؤشرات المخطط لها.')) +
    `<div class="grid g3 section">${stat(r[1], L('Today', 'اليوم'), num(128), L('+6% vs. last week', '+٦٪ عن الأسبوع الماضي'))}${stat('clock', L('Pending', 'معلّق'), num(12), L('3 overdue', '٣ متأخرة'), false)}${stat('circle-check', L('Completed', 'مكتمل'), num(94), L('this week', 'هذا الأسبوع'), false)}</div>`;
}
function approvalRows(list) {
  return list.map(a => `<div class="row"><div class="ic">${ic(a.ic)}</div><div class="grow"><div class="t">${L(a.t, a.a)}</div><div class="s">${a.id} · ${a.by}</div></div><b class="money" style="font-weight:500">${a.amt}</b>
    <div class="actions"><button class="btn sm ok" onclick="App.decide('${a.id}',1)">${ic('check')}<span>${T('approve')}</span></button><button class="btn sm ghost" onclick="App.decide('${a.id}',0)">${ic('x')}</button></div></div>`).join('');
}
function feed() {
  return [['GM', L('Congratulations to Housekeeping — 98% SLA this month! 🎉', 'تهانينا لقسم التدبير الفندقي — ٩٨٪ التزام بالمهلة هذا الشهر! 🎉'), L('2 hours ago', 'قبل ساعتين'), 'General Manager', L('Management', 'الإدارة')],
    ['HR', L('Ramadan working hours will be shared next week.', 'سيتم نشر ساعات العمل في رمضان الأسبوع القادم.'), L('Yesterday', 'أمس'), 'HR Team', L('Human resources', 'الموارد البشرية')],
    ['IT', L('Planned Wi-Fi maintenance Thursday 2–4 AM, towers A & B.', 'صيانة مجدولة للواي فاي الخميس ٢–٤ فجرًا، البرجان A و B.'), L('2 days ago', 'قبل يومين'), 'IT', L('Technology', 'التقنية')]];
}
function slaTxt(t) {
  const left = t.sla - t.age;
  return t.s === 'resolved' ? `<span class="badge ok">${L('Met', 'محقق')}</span>` : left < 0 ? `<span class="badge bad">${L('Breached', 'متجاوز')} ${num(-left)}${L('m', 'د')}</span>` : `<span class="badge ${left < 15 ? 'warn' : 'mute'}">${num(left)}${L('m left', 'د متبقية')}</span>`;
}
function tkCard(t) {
  const pct = Math.min(100, t.age / t.sla * 100);
  return `<div class="tk" draggable="true" data-id="${t.id}" onclick="App.openTicket('${t.id}')"><div style="display:flex;justify-content:space-between;align-items:center"><span class="id">${t.id}</span>${prBadge(t.p)}</div>
    <div class="ti">${esc(t.t)}</div><div class="meta">${ic(chIc[t.ch])}<span>${esc(t.d)} · ${esc(t.r)}</span><span class="mini-av">${t.who}</span></div>
    ${t.s !== 'resolved' ? `<div class="sla"><i class="${pct >= 100 ? 'bad' : pct > 75 ? 'warn' : ''}" style="width:${pct}%"></i></div><div class="small" style="margin-top:6px">${slaTxt(t)}</div>` : ''}</div>`;
}

// ---------- dev ----------
const devUnlocked = () => { try { return sessionStorage.getItem('solvia-dev') === '1'; } catch (e) { return false; } };
function lockPage() {
  return `<div class="card lock"><div class="ic">${ic('lock-keyhole')}</div><h2>${T('devLock')}</h2><p class="muted">${T('devLockSub')}</p>
    <form onsubmit="App.unlock(event)" style="display:flex;gap:8px;margin-top:18px"><input class="input" type="password" id="pw" placeholder="••••••••" autofocus><button class="btn">${ic('lock-open')}${T('unlock')}</button></form><p id="pwErr" class="small" style="color:var(--bad);min-height:18px"></p></div>`;
}
function devPage() {
  const t = totals(cfg.items.filter(i => i.on), cfg.terms);
  const groups = [...new Set(cfg.items.map(i => i.g))];
  return hero(L('Developer · Private', 'المطوّر · خاص'), L('Services & pricing', 'الخدمات والأسعار'), L('Set what the client pays for each service, integration and hosting. Then send them the proposal link to review, approve and sign.', 'حدّد ما يدفعه العميل لكل خدمة وربط واستضافة، ثم أرسل له رابط العرض للمراجعة والموافقة والتوقيع.'),
    `<button class="btn" onclick="App.shareProposal()">${ic('link')}${L('Copy client link', 'نسخ رابط العميل')}</button><button class="btn ghost" onclick="App.go('proposal')">${ic('eye')}${L('Preview as client', 'معاينة كعميل')}</button><button class="btn ghost" onclick="App.lockDev()">${ic('lock')}${L('Lock', 'قفل')}</button>`) +
  `<div class="grid g21 section" style="align-items:start"><div>
    <div class="card"><div class="grid g2">
      <label class="field">${L('Client', 'العميل')}<input class="input" value="${esc(cfg.client)}" oninput="App.setCfg('client',this.value)"></label>
      <label class="field">${L('Project', 'المشروع')}<input class="input" value="${esc(cfg.project)}" oninput="App.setCfg('project',this.value)"></label>
    </div><label class="field" style="margin-top:12px">${L('Note to client', 'ملاحظة للعميل')}<textarea class="input" rows="2" oninput="App.setCfg('note',this.value)">${esc(cfg.note)}</textarea></label></div>
    ${groups.map(g => `<div class="card section"><div class="card-h"><h2>${esc(g)}</h2><button class="btn sm ghost" onclick="App.addItem('${esc(g)}')">${ic('plus')}${L('Add item', 'إضافة بند')}</button></div>
      <div class="price-row price-head"><span></span><span>${L('Service', 'الخدمة')}</span><span>${L('Price (SAR)', 'السعر (ر.س)')}</span><span class="hide-m">${L('Billing', 'الفوترة')}</span><span></span></div>
      ${cfg.items.map((i, x) => i.g !== g ? '' : `<div class="price-row">
        <input type="checkbox" ${i.on ? 'checked' : ''} onchange="App.setItem(${x},'on',this.checked)" style="accent-color:var(--accent);width:18px;height:18px">
        <div><input class="input" style="padding:6px 10px;font-weight:500" value="${esc(i.en)}" oninput="App.setItem(${x},'en',this.value)">
          <input class="input small" style="padding:4px 10px;margin-top:4px;border-style:dashed" value="${esc(i.desc)}" oninput="App.setItem(${x},'desc',this.value)">
          <label class="small muted" style="display:inline-flex;gap:6px;align-items:center;margin-top:6px"><input type="checkbox" ${i.opt ? 'checked' : ''} onchange="App.setItem(${x},'opt',this.checked)" style="accent-color:var(--accent)">${L('Optional (client can remove)', 'اختياري (يمكن للعميل إزالته)')}</label></div>
        <input class="input money" type="number" min="0" step="100" value="${i.price}" oninput="App.setItem(${x},'price',+this.value)">
        <select class="input hide-m" onchange="App.setItem(${x},'freq',this.value)"><option value="once" ${i.freq === 'once' ? 'selected' : ''}>${L('One-time', 'مرة واحدة')}</option><option value="month" ${i.freq === 'month' ? 'selected' : ''}>${L('Monthly', 'شهري')}</option></select>
        <button class="iconbtn" style="width:32px;height:32px" onclick="App.delItem(${x})" title="Remove">${ic('trash-2')}</button></div>`).join('')}</div>`).join('')}
    <div class="card section"><h2 style="margin-bottom:12px">${L('Terms', 'الشروط')}</h2><div class="grid g4">
      <label class="field">${L('VAT %', 'الضريبة ٪')}<input class="input" type="number" value="${cfg.terms.vat}" oninput="App.setTerm('vat',+this.value)"></label>
      <label class="field">${L('Discount %', 'الخصم ٪')}<input class="input" type="number" value="${cfg.terms.discount}" oninput="App.setTerm('discount',+this.value)"></label>
      <label class="field">${L('Delivery (weeks)', 'التسليم (أسابيع)')}<input class="input" type="number" value="${cfg.terms.weeks}" oninput="App.setTerm('weeks',+this.value)"></label>
      <label class="field">${L('Valid (days)', 'الصلاحية (أيام)')}<input class="input" type="number" value="${cfg.terms.validity}" oninput="App.setTerm('validity',+this.value)"></label></div>
      <label class="field" style="margin-top:12px">${L('Payment schedule', 'جدول الدفعات')}<input class="input" value="${esc(cfg.terms.splitNote)}" oninput="App.setTerm('splitNote',this.value)"></label>
      <div style="margin-top:14px"><button class="btn sm ghost" onclick="App.resetCfg()">${ic('rotate-ccw')}${L('Reset to suggested prices', 'استعادة الأسعار المقترحة')}</button></div></div>
  </div>
  <div class="card total-box" id="devTotals">${totalsBox(t)}</div></div>`;
}
function totalsBox(t) {
  return `<div class="eyebrow">${L('Proposal total', 'إجمالي العرض')}</div>
    <div class="total-line" style="margin-top:10px"><span>${L('One-time subtotal', 'المجموع لمرة واحدة')}</span><b class="money">${money(t.once)}</b></div>
    ${t.disc ? `<div class="total-line"><span>${L('Discount', 'الخصم')}</span><b class="money" style="color:var(--ok)">−${money(t.disc)}</b></div>` : ''}
    <div class="total-line"><span>${L('VAT', 'ضريبة القيمة المضافة')} ${num(+cfg.terms.vat)}%</span><b class="money">${money(t.vat)}</b></div>
    <div class="total-line big"><span>${L('Total', 'الإجمالي')}</span><span class="money">${money(t.total)}</span></div>
    <div class="total-line"><span>${L('Monthly (incl. VAT)', 'شهريًا (شامل الضريبة)')}</span><b class="money">${money(t.monthVat)}</b></div>
    <div class="total-line"><span>${L('First year, all-in', 'السنة الأولى شاملة')}</span><b class="money">${money(t.total + t.monthVat * 12)}</b></div>
    <p class="small muted" style="margin-top:12px">${esc(cfg.terms.splitNote)}</p>`;
}

// ---------- proposal (client view) ----------
let prop = null, propSel = null;
function loadProposal() {
  const m = location.hash.match(/p=([\w-]+)/);
  if (m) { try { prop = dec(m[1]); } catch (e) { prop = null; } }
  if (!prop) prop = { items: cfg.items.filter(i => i.on).map(({ id, g, en, ar, desc, price, freq, opt }) => ({ id, g, en, ar, desc, price, freq, opt })), terms: cfg.terms, client: cfg.client, project: cfg.project, note: cfg.note };
  if (!propSel || propSel.k !== JSON.stringify(prop)) propSel = { k: JSON.stringify(prop), on: new Set(prop.items.map(i => i.id)) };
}
function propKey() { let h = 0; for (const c of JSON.stringify(prop)) h = (h * 31 + c.charCodeAt(0)) | 0; return 'appr-' + (h >>> 0).toString(36); }
function proposalPage() {
  loadProposal();
  const sel = prop.items.filter(i => propSel.on.has(i.id));
  const t = totals(sel, prop.terms);
  const appr = store.get(propKey(), null);
  const groups = [...new Set(prop.items.map(i => i.g))];
  const ref = 'SLV-' + propKey().slice(5, 11).toUpperCase();
  return hero(L('Proposal', 'عرض سعر') + ' · ' + ref, esc(prop.project), `${L('Prepared for', 'مقدم إلى')} <b style="color:#fff">${esc(prop.client)}</b> · ${L('Delivery in', 'التسليم خلال')} ${num(+prop.terms.weeks)} ${L('weeks', 'أسابيع')} · ${L('Valid for', 'صالح لمدة')} ${num(+prop.terms.validity)} ${L('days', 'يومًا')}`,
    `<button class="btn ghost no-print" onclick="window.print()">${ic('printer')}${L('Print / Save PDF', 'طباعة / حفظ PDF')}</button>`) +
  (prop.note ? `<div class="card section">${ic('info')} ${esc(prop.note)}</div>` : '') +
  `<div class="grid g21 section" style="align-items:start"><div>
    ${groups.map(g => `<div class="card ${g === groups[0] ? '' : 'section'}"><h2 style="margin-bottom:6px">${esc(L(g, { Platform: 'المنصة', Integrations: 'الربط والتكامل', 'Hosting & support': 'الاستضافة والدعم' }[g]))}</h2>
      ${prop.items.filter(i => i.g === g).map(i => `<label class="pp"><input type="checkbox" ${propSel.on.has(i.id) ? 'checked' : ''} ${!i.opt || appr ? 'disabled' : ''} onchange="App.propToggle('${i.id}',this.checked)">
        <div class="grow"><div style="font-weight:500">${esc(L(i.en, i.ar))} ${i.opt ? `<span class="badge mute">${L('Optional', 'اختياري')}</span>` : ''}</div><div class="small muted">${esc(i.desc)}</div></div>
        <div class="price money">${money(i.price)}<small>${i.freq === 'month' ? L('per month', 'شهريًا') : L('one-time', 'مرة واحدة')}</small></div></label>`).join('')}</div>`).join('')}
  </div><div class="total-box">
    <div class="card">${totalsBoxP(t, prop.terms)}</div>
    <div class="card section" id="approveBox">${appr ? `<div class="approved-stamp">${ic('badge-check')}<div><b>${L('Approved', 'تمت الموافقة')}</b><div class="small">${esc(appr.name)} · ${esc(appr.company)}<br>${new Date(appr.at).toLocaleString(ar() ? 'ar-SA' : 'en-GB')}</div></div></div>
        ${appr.sig ? `<img src="${appr.sig}" alt="signature" style="width:100%;margin-top:12px;border-radius:12px;background:#fff">` : ''}
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px" class="no-print"><button class="btn sm" onclick="App.sendApproval('wa')">${ic('message-circle')}WhatsApp</button><button class="btn sm ghost" onclick="App.sendApproval('mail')">${ic('mail')}${L('Email', 'البريد')}</button></div>`
      : `<h2 style="margin-bottom:12px">${T('approveSign')}</h2>
        <label class="field">${T('clientName')}<input class="input" id="apName"></label>
        <label class="field" style="margin-top:10px">${T('company')}<input class="input" id="apCo" value="${esc(prop.client)}"></label>
        <div class="field" style="margin-top:10px">${L('Signature', 'التوقيع')}<canvas class="sig" id="sig"></canvas><button class="link small" style="align-self:flex-start;padding:0" onclick="App.clearSig()">${L('Clear', 'مسح')}</button></div>
        <label class="small" style="display:flex;gap:8px;margin-top:10px"><input type="checkbox" id="apOk" style="accent-color:var(--accent)">${T('agree')}</label>
        <button class="btn" style="width:100%;justify-content:center;margin-top:14px" onclick="App.approve()">${ic('pen-line')}${T('approveSign')} · ${money(t.total)}</button>`}
    </div></div></div>`;
}
function totalsBoxP(t, terms) {
  return `<div class="eyebrow">${L('Your investment', 'قيمة الاستثمار')}</div>
    <div class="total-line" style="margin-top:10px"><span>${L('One-time', 'مرة واحدة')}</span><b class="money">${money(t.once)}</b></div>
    ${t.disc ? `<div class="total-line"><span>${L('Discount', 'الخصم')} ${num(+terms.discount)}%</span><b class="money" style="color:var(--ok)">−${money(t.disc)}</b></div>` : ''}
    <div class="total-line"><span>${L('VAT', 'الضريبة')} ${num(+terms.vat)}%</span><b class="money">${money(t.vat)}</b></div>
    <div class="total-line big"><span>${L('Total', 'الإجمالي')}</span><span class="money">${money(t.total)}</span></div>
    <div class="total-line"><span>${L('Then monthly', 'ثم شهريًا')}</span><b class="money">${money(t.monthVat)}</b></div>
    <div style="margin-top:14px"><div class="small muted" style="margin-bottom:6px">${L('Payment schedule', 'جدول الدفعات')}</div><div class="small">${esc(terms.splitNote)}</div></div>`;
}
function sigPad() {
  const c = $('#sig'); if (!c) return;
  const r = c.getBoundingClientRect(); c.width = r.width * 2; c.height = r.height * 2;
  const x = c.getContext('2d'); x.scale(2, 2); x.lineWidth = 2; x.lineCap = 'round'; x.strokeStyle = getComputedStyle(document.body).color;
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
      col.ondrop = e => { e.preventDefault(); const t = tickets.find(t => t.id === e.dataTransfer.getData('id')); if (t) { t.s = col.dataset.col; saveTk(); render(); toast(`${t.id} → ${T(t.s)}`); } };
    });
  },
};
const saveTk = () => store.set('tickets', tickets);

// ---------- public API ----------
window.App = {
  toast,
  go(r) { route = r; if (r !== 'proposal' && location.hash.startsWith('#proposal')) history.replaceState(null, '', location.pathname); else if (r !== 'proposal') history.replaceState(null, '', '#' + r); $('#side').classList.remove('show'); $('#scrim').classList.remove('show'); render(); },
  toggleSide() { $('#side').classList.toggle('show'); $('#scrim').classList.toggle('show'); },
  toggleLang() { const a = !ar(); document.documentElement.lang = a ? 'ar' : 'en'; document.documentElement.dir = a ? 'rtl' : 'ltr'; try { localStorage.setItem('solvia-lang', a ? 'ar' : 'en'); } catch (e) {} render(); },
  toggleTheme() { const d = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = d; try { localStorage.setItem('solvia-theme', d); } catch (e) {} render(); },
  closeAll() { ['#drawer', '#modal', '#scrim', '#side'].forEach(s => $(s).classList.remove('show')); },
  decide(id, ok) { approvals = approvals.filter(a => a.id !== id); render(); toast(`${id} ${ok ? L('approved', 'تمت الموافقة') : L('rejected', 'مرفوض')}`, ok ? 'check' : 'x'); },
  tkFilter(k) { tkFilter = k; render(); },
  tkView(k) { tkView = k; store.set('tkview', k); render(); },
  openTicket(id) {
    const t = tickets.find(t => t.id === id); if (!t) return;
    $('#drawer').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><span class="muted">${t.id}</span><button class="iconbtn" onclick="App.closeAll()">${ic('x')}</button></div>
      <h2 style="margin:10px 0">${esc(t.t)}</h2><div class="chips">${prBadge(t.p)}${stBadge(t.s)}${slaTxt(t)}</div>
      <div class="grid g2" style="margin-top:18px">
        <div><div class="small muted">${T('dept')}</div>${esc(t.d)}</div><div><div class="small muted">${T('room')}</div>${esc(t.r)}</div>
        <div><div class="small muted">${L('Channel', 'القناة')}</div>${ic(chIc[t.ch])} ${t.ch}</div><div><div class="small muted">${L('Assignee', 'المسؤول')}</div><span class="mini-av" style="margin:0">${t.who}</span></div></div>
      <div class="field" style="margin-top:18px">${L('Move to', 'نقل إلى')}<div class="chips">${['open', 'inprogress', 'onhold', 'resolved'].map(s => `<button class="chip ${t.s === s ? 'on' : ''}" onclick="App.setStatus('${t.id}','${s}')">${T(s)}</button>`).join('')}</div></div>
      <h3 style="margin:22px 0 4px;font-size:16px">${L('Activity', 'النشاط')}</h3><div class="timeline">
        <div>${L('Guest notified via', 'تم إشعار النزيل عبر')} ${t.ch === 'whatsapp' ? 'WhatsApp' : 'SMS'}<small>${L('2 min ago', 'قبل دقيقتين')}</small></div>
        <div>${L('Assigned to', 'أُسند إلى')} ${t.who}<small>${num(t.age - 3)} ${L('min ago', 'دقيقة')}</small></div>
        <div>${L('Ticket created', 'تم إنشاء التذكرة')}<small>${num(t.age)} ${L('min ago', 'دقيقة')}</small></div></div>
      <div style="display:flex;gap:8px;margin-top:14px"><input class="input" placeholder="${L('Add a note or reply to guest…', 'أضف ملاحظة أو رد على النزيل…')}"><button class="btn" onclick="App.toast('${L('Reply sent to guest', 'تم إرسال الرد للنزيل')}')">${ic('send')}</button></div>`;
    icons(); $('#drawer').classList.add('show'); $('#scrim').classList.add('show');
  },
  setStatus(id, s) { const t = tickets.find(t => t.id === id); t.s = s; saveTk(); render(); App.openTicket(id); toast(`${id} → ${T(s)}`); },
  newTicket() {
    $('#modal').innerHTML = `<div class="card-h"><h2>${T('newTicket')}</h2><button class="iconbtn" onclick="App.closeAll()">${ic('x')}</button></div>
      <form onsubmit="App.createTicket(event)" class="grid" style="gap:12px">
        <label class="field">${T('title')}<input class="input" name="t" required></label>
        <div class="grid g2"><label class="field">${T('dept')}<select class="input" name="d">${['Engineering', 'Housekeeping', 'Front office', 'F&B', 'IT', 'Security'].map(d => `<option>${d}</option>`).join('')}</select></label>
        <label class="field">${T('room')}<input class="input" name="r" required></label></div>
        <div class="field">${T('priority')}<div class="chips" id="prChips">${['low', 'medium', 'high', 'critical'].map(p => `<button type="button" class="chip ${p === 'medium' ? 'on' : ''}" data-p="${p}" onclick="document.querySelectorAll('#prChips .chip').forEach(c=>c.classList.toggle('on',c===this))">${T(p)}</button>`).join('')}</div></div>
        <label class="field">${T('desc')}<textarea class="input" rows="3" name="x"></textarea></label>
        <label class="small" style="display:flex;gap:8px;align-items:center"><input type="checkbox" checked style="accent-color:var(--accent)">${L('Notify guest by WhatsApp / SMS', 'إشعار النزيل عبر واتساب / رسالة نصية')}</label>
        <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" onclick="App.closeAll()">${T('cancel')}</button><button class="btn">${ic('plus')}${T('create')}</button></div></form>`;
    icons(); $('#modal').classList.add('show'); $('#scrim').classList.add('show');
  },
  createTicket(e) {
    e.preventDefault(); const f = new FormData(e.target);
    const p = document.querySelector('#prChips .on').dataset.p;
    const id = 'TK-' + (Math.max(...tickets.map(t => +t.id.slice(3))) + 1);
    tickets.unshift({ id, t: f.get('t'), d: f.get('d'), r: f.get('r'), p, s: 'open', who: 'AT', age: 0, sla: { critical: 60, high: 120, medium: 240, low: 480 }[p], ch: 'portal' });
    saveTk(); App.closeAll(); route = 'tickets'; render(); toast(`${id} ${L('created', 'تم الإنشاء')}`);
  },
  async unlock(e) {
    e.preventDefault();
    const v = $('#pw').value;
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v));
    const h = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    if (h === D.devHash) { try { sessionStorage.setItem('solvia-dev', '1'); } catch (x) {} render(); } else { $('#pwErr').textContent = T('wrongPw'); }
  },
  lockDev() { try { sessionStorage.removeItem('solvia-dev'); } catch (x) {} render(); },
  setCfg(k, v) { cfg[k] = v; saveCfg(); },
  setTerm(k, v) { cfg.terms[k] = v; saveCfg(); App.refreshTotals(); },
  setItem(x, k, v) { cfg.items[x][k] = v; saveCfg(); App.refreshTotals(); },
  refreshTotals() { const el = $('#devTotals'); if (el) el.innerHTML = totalsBox(totals(cfg.items.filter(i => i.on), cfg.terms)); },
  addItem(g) { cfg.items.push({ id: 'c' + Date.now().toString(36), g, en: L('New service', 'خدمة جديدة'), ar: '', desc: '', price: 0, freq: 'once', on: true, opt: false }); saveCfg(); render(); },
  delItem(x) { cfg.items.splice(x, 1); saveCfg(); render(); },
  resetCfg() { if (confirm(L('Reset all prices to the suggested defaults?', 'استعادة جميع الأسعار المقترحة؟'))) { cfg = defaultCfg(); saveCfg(); render(); } },
  shareProposal() {
    const p = { items: cfg.items.filter(i => i.on).map(({ id, g, en, ar, desc, price, freq, opt }) => ({ id, g, en, ar, desc, price, freq, opt })), terms: cfg.terms, client: cfg.client, project: cfg.project, note: cfg.note };
    const url = location.origin + location.pathname + '#proposal?p=' + enc(p);
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast(L('Client link copied — send it on WhatsApp', 'تم نسخ رابط العميل — أرسله عبر واتساب'), 'link'), () => prompt('Copy this link:', url));
  },
  propToggle(id, on) { on ? propSel.on.add(id) : propSel.on.delete(id); render(); },
  clearSig() { const c = $('#sig'); c.getContext('2d').clearRect(0, 0, c.width, c.height); c.dataset.empty = '1'; },
  approve() {
    const name = $('#apName').value.trim(), company = $('#apCo').value.trim(), c = $('#sig');
    if (!name) return toast(L('Please enter your name', 'يرجى إدخال الاسم'), 'circle-alert');
    if (c.dataset.empty === '1') return toast(L('Please sign in the box', 'يرجى التوقيع في المربع'), 'circle-alert');
    if (!$('#apOk').checked) return toast(L('Please accept the terms', 'يرجى الموافقة على الشروط'), 'circle-alert');
    store.set(propKey(), { name, company, at: Date.now(), sig: c.toDataURL('image/png'), items: [...propSel.on] });
    render(); toast(L('Approved — thank you!', 'تمت الموافقة — شكرًا لك!'), 'badge-check');
  },
  sendApproval(kind) {
    const a = store.get(propKey(), {}); const sel = prop.items.filter(i => a.items?.includes(i.id)); const t = totals(sel, prop.terms);
    const ref = 'SLV-' + propKey().slice(5, 11).toUpperCase();
    const msg = `✅ Proposal ${ref} APPROVED\n${prop.project}\nBy: ${a.name} (${a.company})\nDate: ${new Date(a.at).toLocaleString('en-GB')}\n\n${sel.map(i => `• ${i.en} — SAR ${(+i.price).toLocaleString()}${i.freq === 'month' ? '/mo' : ''}`).join('\n')}\n\nTotal (incl. VAT): SAR ${Math.round(t.total).toLocaleString()}\nMonthly (incl. VAT): SAR ${Math.round(t.monthVat).toLocaleString()}\nPayments: ${prop.terms.splitNote}\n\n${location.href}`;
    if (kind === 'wa') window.open('https://wa.me/' + (D.developer.whatsapp || '') + '?text=' + encodeURIComponent(msg), '_blank');
    else location.href = `mailto:${D.developer.email}?subject=${encodeURIComponent('Proposal ' + ref + ' approved')}&body=${encodeURIComponent(msg)}`;
  },
};

// boot
const h = location.hash.slice(1);
route = h.startsWith('proposal') ? 'proposal' : (pages[h] || D.rail.some(r => r[0] === h)) ? h : 'home';
if (h.includes('p=')) document.body.classList.add('client-mode');
render();
})();
