// Demo data. Text pairs are [Arabic, English].
window.D = {
  // SHA-256 of the pricing password
  devHash: '6d416bd44b627339627dddafc23eea477f1cb4789f3481a443280d08c42d5807',
  developer: { whatsapp: '', email: '' },

  // [id, ar, en, domain (for the logo), brand colour, url]
  platforms: [
    ['qiwa', 'قوى', 'Qiwa', 'qiwa.sa', '#0f7a6c', 'https://qiwa.sa'],
    ['mudad', 'مدد', 'Mudad', 'mdd.sa', '#1d6f5a', 'https://www.mdd.sa/'],
    ['gosi', 'التأمينات الاجتماعية', 'GOSI', 'gosi.gov.sa', '#1a7f4b', 'https://www.gosi.gov.sa'],
    ['hrsd', 'وزارة الموارد البشرية', 'HRSD', 'hrsd.gov.sa', '#2b6e3f', 'https://www.hrsd.gov.sa'],
    ['musaned', 'مساند', 'Musaned', 'musaned.com.sa', '#7a5a1f', 'https://musaned.com.sa'],
    ['sdb', 'بنك التنمية الاجتماعية', 'Social Development Bank', 'www.sdb.gov.sa', '#0e6b57', 'https://www.sdb.gov.sa/ar'],
    ['najiz', 'ناجز', 'Najiz', 'najiz.sa', '#b08a3e', 'https://najiz.sa/applications/landing'],
  ],

  // [id, platform ('' = AR SOLVIA service), ar, en, desc ar, desc en, price SAR, audience, business days, icon]
  services: [
    ['s1', 'qiwa', 'قوى — إدارة عقود العمل', 'Qiwa — Employment contracts', 'مراجعة المستندات، تجهيز الطلب، ومتابعة مختص من AR SOLVIA.', 'Document review, request preparation and follow-up by an AR SOLVIA specialist.', 350, 'all', 3, 'file-signature'],
    ['s2', 'mudad', 'مُدد — حماية الأجور', 'Mudad — Wage protection', 'مراجعة المستندات، تجهيز الطلب، ومتابعة مختص من AR SOLVIA.', 'Document review, request preparation and follow-up by an AR SOLVIA specialist.', 450, 'all', 2, 'wallet'],
    ['s3', 'gosi', 'التأمينات الاجتماعية', 'Social Insurance (GOSI)', 'مراجعة المستندات، تجهيز الطلب، ومتابعة مختص من AR SOLVIA.', 'Document review, request preparation and follow-up by an AR SOLVIA specialist.', 250, 'all', 2, 'shield-check'],
    ['s4', 'hrsd', 'خدمات الموارد البشرية', 'HR services (HRSD)', 'مراجعة المستندات، تجهيز الطلب، ومتابعة مختص من AR SOLVIA.', 'Document review, request preparation and follow-up by an AR SOLVIA specialist.', 300, 'all', 4, 'users'],
    ['s5', 'musaned', 'مساند — خدمات الاستقدام', 'Musaned — Recruitment', 'مراجعة المستندات، تجهيز الطلب، ومتابعة مختص من AR SOLVIA.', 'Document review, request preparation and follow-up by an AR SOLVIA specialist.', 500, 'all', 5, 'house'],
    ['s6', 'sdb', 'بنك التنمية الاجتماعية', 'Social Development Bank', 'مراجعة المستندات، تجهيز الطلب، ومتابعة مختص من AR SOLVIA.', 'Document review, request preparation and follow-up by an AR SOLVIA specialist.', 400, 'all', 5, 'landmark'],
    ['s7', 'najiz', 'ناجز — الخدمات العدلية', 'Najiz — Judicial services', 'مراجعة المستندات، تجهيز الطلب، ومتابعة مختص من AR SOLVIA.', 'Document review, request preparation and follow-up by an AR SOLVIA specialist.', 300, 'all', 3, 'scale'],
    ['s8', '', 'إدارة الموارد البشرية عن بُعد', 'Remote HR management', 'مراجعة المستندات، تجهيز الطلب، ومتابعة مختص من AR SOLVIA.', 'Document review, request preparation and follow-up by an AR SOLVIA specialist.', 1500, 'all', 5, 'briefcase-business'],
    ['s9', '', 'استشارة عمالية', 'Labour consultation', 'مراجعة المستندات، تجهيز الطلب، ومتابعة مختص من AR SOLVIA.', 'Document review, request preparation and follow-up by an AR SOLVIA specialist.', 200, 'all', 1, 'messages-square'],
    ['s10', '', 'تسجيل المنشآت في المنصات', 'Registering companies on platforms', 'مراجعة المستندات، تجهيز الطلب، ومتابعة مختص من AR SOLVIA.', 'Document review, request preparation and follow-up by an AR SOLVIA specialist.', 350, 'all', 3, 'building-2'],
    ['s11', '', 'طلبات الخدمات الحكومية', 'Government service requests', 'مراجعة المستندات، تجهيز الطلب، ومتابعة مختص من AR SOLVIA.', 'Document review, request preparation and follow-up by an AR SOLVIA specialist.', 300, 'all', 3, 'landmark'],
    ['s12', '', 'إعداد النماذج والمستندات', 'Preparing forms & documents', 'مراجعة المستندات، تجهيز الطلب، ومتابعة مختص من AR SOLVIA.', 'Document review, request preparation and follow-up by an AR SOLVIA specialist.', 150, 'all', 1, 'file-text'],
  ],
  followUpFee: 50,

  staff: [
    ['AO', 'أحمد العتيبي', 'Ahmed Alotaibi', 'employee'],
    ['NS', 'نورة السبيعي', 'Noura Alsubaie', 'employee'],
    ['KH', 'خالد الحربي', 'Khalid Alharbi', 'employee'],
    ['RH', 'روان هاشم', 'Rawan Hashim', 'supervisor'],
  ],

  customers: [
    ['C1', 'عبدالله تمّار', 'Abdullah Tammar', 'ind', '+966 55 012 3456'],
    ['C2', 'مسار التجارية', 'Masar Trading', 'biz', '+966 11 410 2200'],
    ['C3', 'ريم القحطاني', 'Reem Alqahtani', 'ind', '+966 50 778 9911'],
    ['C4', 'ركن الأعمال', 'Rukn Business', 'biz', '+966 12 655 3100'],
    ['C5', 'فهد الشهري', 'Fahad Alshehri', 'ind', '+966 54 332 1180'],
  ],

  // type: t = ticket only, f = ticket + follow-up
  tickets: [
    { id: 'REQ-10429', svc: 's1', cust: 'C1', st: 'progress', p: 'high', emp: 'AO', age: 30, type: 'f', ch: 'whatsapp', paid: 400 },
    { id: 'REQ-10428', svc: 's3', cust: 'C2', st: 'new', p: 'urgent', emp: '', age: 2, type: 'f', ch: 'web', paid: 300 },
    { id: 'REQ-10426', svc: 's7', cust: 'C3', st: 'new', p: 'normal', emp: '', age: 5, type: 't', ch: 'web', paid: 300 },
    { id: 'REQ-10425', svc: 's5', cust: 'C5', st: 'progress', p: 'normal', emp: 'NS', age: 60, type: 'f', ch: 'sms', paid: 550 },
    { id: 'REQ-10422', svc: 's2', cust: 'C4', st: 'waiting', p: 'normal', emp: 'NS', age: 20, type: 't', ch: 'web', paid: 450 },
    { id: 'REQ-10420', svc: 's8', cust: 'C4', st: 'progress', p: 'high', emp: 'KH', age: 130, type: 'f', ch: 'whatsapp', paid: 1550 },
    { id: 'REQ-10419', svc: 's10', cust: 'C2', st: 'progress', p: 'normal', emp: 'AO', age: 26, type: 't', ch: 'web', paid: 350 },
    { id: 'REQ-10418', svc: 's3', cust: 'C2', st: 'done', p: 'normal', emp: 'KH', age: 20, type: 't', ch: 'web', paid: 250 },
    { id: 'REQ-10412', svc: 's9', cust: 'C1', st: 'done', p: 'low', emp: 'AO', age: 6, type: 't', ch: 'web', paid: 200 },
  ],

  forms: [
    ['نموذج تفويض', 'Authorisation form', 'PDF'],
    ['قائمة مستندات نقل الخدمات', 'Transfer documents checklist', 'PDF'],
    ['نموذج بيانات الموظفين', 'Employee data template', 'XLSX'],
    ['نموذج طلب استشارة', 'Consultation request form', 'PDF'],
  ],

  /* ---------------- Pricing page (hidden, password) ----------------
     All prices in SAR, excluding VAT. Change them here.            */
  pricing: {
    build: [
      // [ar, en, desc ar, desc en, price]
      ['تصميم الواجهات والواجهة الأمامية', 'UI/UX design & front-end', 'الموقع العام، تطبيق العميل للجوال والكمبيوتر، بوابة الموظفين والمشرف، عربي/إنجليزي، داكن/فاتح', 'Public site, customer app (mobile + desktop), staff & supervisor portal, AR/EN, dark/light', 7000],
      ['الواجهة الخلفية وواجهات API', 'Back-end & APIs', 'الدخول برمز OTP، الخدمات، التذاكر، الإسناد، الصلاحيات، الفواتير، التقارير', 'OTP login, services, tickets, assignment, roles, invoices, reports', 10000],
      ['قاعدة البيانات', 'Database', 'تصميم قاعدة البيانات، الفهارس، النسخ الاحتياطي، نقل البيانات الحالية', 'Schema, indexes, backups, import of existing data', 2500],
      ['المحادثة والتحديثات الفورية (WebSocket)', 'Real-time chat & live updates (WebSocket)', 'محادثة بين العميل والموظف وتحديث التذاكر لحظيًا', 'Customer ↔ staff chat and live ticket updates', 2000],
      ['الربط مع الخدمات الخارجية', 'Integrations', 'الرسائل، واتساب، بوابة الدفع، الفوترة الإلكترونية، الاجتماعات الافتراضية', 'SMS, WhatsApp, payment gateway, e-invoicing, video meetings', 3500],
      ['الأمان والحماية', 'Security', 'تشفير، حماية OWASP، سجل تدقيق، صلاحيات دقيقة، متطلبات نظام حماية البيانات الشخصية', 'Encryption, OWASP hardening, audit log, fine-grained roles, PDPL basics', 2500],
      ['تجهيز الخادم والإطلاق', 'Server setup & deployment', 'إعداد الخادم في السعودية، SSL، المراقبة، النشر الآلي', 'Saudi server setup, SSL, monitoring, CI/CD', 1500],
      ['الاختبار والتدريب والإطلاق', 'Testing, training & launch', 'اختبار شامل، تدريب الموظفين، أدلة الاستخدام', 'Full testing, staff training, user guides', 1000],
    ],
    buildOptional: [
      ['تطبيقات الجوال (iOS و Android)', 'Native mobile apps (iOS & Android)', 'نشر التطبيق في App Store و Google Play', 'Published on the App Store and Google Play', 10000],
      ['الدخول عبر نفاذ', 'Nafath login', 'التحقق من الهوية الوطنية', 'National ID verification', 2500],
    ],
    // monthly care plans (my work)
    care: [
      ['أساسي', 'Basic', 'إصلاح الأعطال والتحديثات الأمنية', 'Bug fixes and security updates', 1500],
      ['قياسي', 'Standard', 'الأساسي + دعم ٨×٥ واستجابة خلال ٤ ساعات + تعديلات بسيطة', 'Basic + 8×5 support, 4h response, small changes', 2500],
      ['متقدم', 'Premium', 'القياسي + تطوير مستمر ١٠ ساعات شهريًا + مراقبة ٢٤/٧', 'Standard + 10 dev hours/month + 24/7 monitoring', 4000],
    ],
    // outside services: client pays the provider. [ar, en, note ar, note en, once, month, year]
    external: [
      ['server', 'الخادم داخل السعودية', 'Server in Saudi Arabia', 'server', [
        ['STC Cloud (الرياض/جدة)', 'STC Cloud (Riyadh/Jeddah)', '4 vCPU · 8GB · قاعدة بيانات مُدارة', '4 vCPU · 8GB · managed DB', 0, 1100, 0],
        ['Oracle Cloud (جدة/الرياض)', 'Oracle Cloud (Jeddah/Riyadh)', '4 OCPU · 16GB · نسخ احتياطي', '4 OCPU · 16GB · backups', 0, 750, 0],
        ['Google Cloud (الدمام)', 'Google Cloud (Dammam)', '4 vCPU · 8GB · Cloud SQL', '4 vCPU · 8GB · Cloud SQL', 0, 950, 0],
        ['خادم VPS سعودي (بداية)', 'Saudi VPS (starter)', 'مناسب للبداية وحتى ٥٠٠ طلب يوميًا', 'Good to start, up to ~500 requests/day', 0, 350, 0],
      ]],
      ['otp', 'الرسائل النصية ورمز الدخول OTP', 'SMS & OTP codes', 'message-square-lock', [
        ['Unifonic', 'Unifonic', '≈ ٥٬٠٠٠ رسالة شهريًا · ٠٫٠٩ ر.س', '~5,000 SMS/month · 0.09 SAR', 0, 450, 0],
        ['Taqnyat', 'Taqnyat', '≈ ٥٬٠٠٠ رسالة شهريًا · ٠٫٠٧ ر.س', '~5,000 SMS/month · 0.07 SAR', 0, 350, 0],
        ['Msegat', 'Msegat', '≈ ٥٬٠٠٠ رسالة شهريًا · ٠٫٠٧٥ ر.س', '~5,000 SMS/month · 0.075 SAR', 0, 375, 0],
      ]],
      ['whatsapp', 'واتساب للأعمال API', 'WhatsApp Business API', 'message-circle', [
        ['Meta Cloud API (مباشر)', 'Meta Cloud API (direct)', 'رسوم المحادثات فقط', 'Conversation fees only', 0, 200, 0],
        ['Unifonic WhatsApp', 'Unifonic WhatsApp', 'اشتراك + رسوم المحادثات، دعم محلي', 'Plan + conversation fees, local support', 0, 550, 0],
        ['360dialog', '360dialog', 'اشتراك شهري + رسوم المحادثات', 'Monthly plan + conversation fees', 0, 400, 0],
      ]],
      ['ws', 'التحديثات الفورية (WebSocket)', 'Real-time (WebSocket)', 'radio-tower', [
        ['على نفس الخادم', 'On our own server', 'بدون تكلفة إضافية', 'No extra cost', 0, 0, 0],
        ['Pusher Channels', 'Pusher Channels', 'خدمة مُدارة', 'Managed service', 0, 185, 0],
        ['Ably', 'Ably', 'خدمة مُدارة عالية التحمل', 'Managed, high availability', 0, 110, 0],
      ]],
      ['pay', 'بوابة الدفع', 'Payment gateway', 'credit-card', [
        ['Moyasar', 'Moyasar', 'مدى، Apple Pay، STC Pay، فيزا · رسوم لكل عملية', 'Mada, Apple Pay, STC Pay, Visa · per-transaction fees', 0, 0, 0],
        ['HyperPay', 'HyperPay', 'رسوم تفعيل + رسوم لكل عملية', 'Setup fee + per-transaction fees', 1500, 0, 0],
        ['Tap Payments', 'Tap Payments', 'رسوم لكل عملية', 'Per-transaction fees', 0, 0, 0],
      ]],
      ['meet', 'الاجتماعات الافتراضية', 'Video meetings', 'video', [
        ['Jitsi على خادمنا', 'Self-hosted Jitsi', 'بدون اشتراك', 'No subscription', 0, 0, 0],
        ['Zoom (٣ حسابات)', 'Zoom (3 hosts)', 'اشتراك Pro', 'Pro plan', 0, 165, 0],
        ['Microsoft Teams', 'Microsoft Teams', 'ضمن Microsoft 365 (٣ مستخدمين)', 'Via Microsoft 365 (3 users)', 0, 170, 0],
      ]],
      ['einv', 'الفوترة الإلكترونية (زاتكا)', 'E-invoicing (ZATCA)', 'receipt', [
        ['ربط مباشر مع فاتورة', 'Direct Fatoora integration', 'مشمول في التطوير', 'Included in the build', 0, 0, 0],
        ['مزود فوترة معتمد', 'Certified e-invoicing provider', 'اشتراك شهري', 'Monthly plan', 0, 150, 0],
      ]],
      ['email', 'البريد الإلكتروني', 'Email', 'mail', [
        ['Amazon SES', 'Amazon SES', 'رسائل النظام والإشعارات', 'System emails', 0, 20, 0],
        ['Zoho Mail (٥ مستخدمين)', 'Zoho Mail (5 users)', 'بريد للموظفين', 'Staff mailboxes', 0, 60, 0],
      ]],
      ['domain', 'النطاق والشهادة', 'Domain & SSL', 'globe', [
        ['نطاق ‎.sa + SSL مجاني', '.sa domain + free SSL', 'سنويًا', 'Yearly', 0, 0, 200],
        ['نطاق ‎.com + SSL مجاني', '.com domain + free SSL', 'سنويًا', 'Yearly', 0, 0, 60],
      ]],
    ],
    terms: { vat: 0, split: ['٤٠٪ عند التوقيع · ٤٠٪ عند التسليم للاختبار · ٢٠٪ عند الإطلاق', '40% on signing · 40% at test delivery · 20% at launch'], weeks: 8, validity: 30 },
  },
};
