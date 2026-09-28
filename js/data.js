// Demo data and the default Dev price catalog. Text pairs are [Arabic, English].
window.D = {
  devHash: '6d416bd44b627339627dddafc23eea477f1cb4789f3481a443280d08c42d5807',
  developer: { whatsapp: '', email: '' },

  platforms: [
    ['qiwa', 'قوى', 'Qiwa', 'briefcase-business'],
    ['mudad', 'مدد', 'Mudad', 'wallet'],
    ['gosi', 'التأمينات الاجتماعية', 'GOSI', 'shield-check'],
    ['hrsd', 'الموارد البشرية', 'HRSD', 'users'],
    ['musaned', 'مساند', 'Musaned', 'house'],
    ['sdb', 'بنك التنمية', 'SDB', 'landmark'],
    ['najiz', 'ناجز', 'Najiz', 'scale'],
    ['absher', 'أبشر أعمال', 'Absher Business', 'id-card'],
  ],

  // [id, platform, ar, en, desc ar, desc en, price (0 = on request), category, sla hours]
  services: [
    ['s1', 'qiwa', 'خدمات قوى', 'Qiwa services', 'إدارة خدمات المنشآت والموظفين', 'Establishment & employee services', 149, 'biz', 24],
    ['s2', 'mudad', 'خدمات مدد', 'Mudad services', 'حماية الأجور والعمليات المرتبطة', 'Wage protection & payroll', 99, 'biz', 24],
    ['s3', 'gosi', 'التأمينات الاجتماعية', 'GOSI', 'اشتراكات وتحديث ومتابعة', 'Subscriptions, updates & follow-up', 129, 'biz', 24],
    ['s4', 'najiz', 'خدمات ناجز', 'Najiz services', 'الخدمات العدلية والإجراءات', 'Judicial services & procedures', 199, 'ind', 48],
    ['s5', 'musaned', 'خدمات مساند', 'Musaned services', 'إجراءات العمالة المنزلية', 'Domestic labour procedures', 149, 'ind', 48],
    ['s6', 'hrsd', 'استشارات عمالية', 'Labour consultation', 'موعد مع مختص ومتابعة', 'Session with a specialist + follow-up', 249, 'ind', 72],
    ['s7', 'hrsd', 'إدارة HR عن بعد', 'Remote HR management', 'إدارة موارد بشرية للمنشآت', 'Managed HR for companies', 499, 'biz', 72],
    ['s8', 'sdb', 'بنك التنمية', 'Development Bank', 'المساعدة في خدمات التمويل', 'Help with financing services', 0, 'ind', 96],
  ],

  tickets: [
    { id: 'REQ-10429', svc: 's1', cust: ['عبدالله تمّار', 'Abdullah Tammar'], st: 'progress', p: 'high', emp: 'AO', age: 4, sla: 6, ch: 'whatsapp' },
    { id: 'REQ-10428', svc: 's3', cust: ['مسار التجارية', 'Masar Trading'], st: 'new', p: 'urgent', emp: '', age: 1, sla: 4, ch: 'web' },
    { id: 'REQ-10426', svc: 's4', cust: ['ريم القحطاني', 'Reem Alqahtani'], st: 'new', p: 'normal', emp: 'AO', age: 2, sla: 9, ch: 'web' },
    { id: 'REQ-10425', svc: 's5', cust: ['فهد الشهري', 'Fahad Alshehri'], st: 'progress', p: 'normal', emp: 'NS', age: 7, sla: 12, ch: 'sms' },
    { id: 'REQ-10422', svc: 's2', cust: ['ركن الأعمال', 'Rukn Business'], st: 'waiting', p: 'normal', emp: 'NS', age: 10, sla: 14, ch: 'web' },
    { id: 'REQ-10420', svc: 's7', cust: ['ركن الأعمال', 'Rukn Business'], st: 'progress', p: 'high', emp: 'KH', age: 20, sla: 18, ch: 'whatsapp' },
    { id: 'REQ-10418', svc: 's3', cust: ['مسار التجارية', 'Masar Trading'], st: 'done', p: 'normal', emp: 'KH', age: 5, sla: 24, ch: 'web' },
    { id: 'REQ-10412', svc: 's6', cust: ['عبدالله تمّار', 'Abdullah Tammar'], st: 'done', p: 'low', emp: 'AO', age: 3, sla: 72, ch: 'web' },
  ],
  staff: { AO: ['أحمد العتيبي', 'Ahmed Alotaibi'], NS: ['نورة السبيعي', 'Noura Alsubaie'], KH: ['خالد الحربي', 'Khalid Alharbi'] },

  // Dev price catalog (SAR): [id, ar, en, desc, price, once|month, optional]
  catalog: [
    ['منصة Solvia', 'Solvia platform', [
      ['core', 'البوابة الأساسية والحسابات والأدوار', 'Core portal, accounts & roles', 'Customer / employee / manager roles, secure login, audit log, Arabic + English', 15000, 'once', 0],
      ['catalog', 'دليل الخدمات وطلب الخدمة', 'Service catalog & request flow', 'Services per platform, request form, document upload, status journey', 14000, 'once', 0],
      ['tickets', 'نظام التذاكر مع SLA', 'Ticketing with SLA', 'Kanban board, assignment, SLA timers, escalation, customer notes', 22000, 'once', 0],
      ['payments', 'الدفع الإلكتروني', 'Online payments', 'Mada, Visa, Mastercard, Apple Pay, STC Pay via Moyasar / HyperPay', 9000, 'once', 0],
      ['invoices', 'الفواتير الإلكترونية (زاتكا)', 'E-invoicing (ZATCA phase 2)', 'VAT invoices with QR, linked to Fatoora', 8000, 'once', 0],
      ['appts', 'المواعيد والاستشارات', 'Appointments & consultations', 'Booking calendar, reminders, virtual meeting links', 7000, 'once', 1],
      ['manager', 'لوحة المدير والمالية والتقارير', 'Manager dashboard, finance & reports', 'Revenue, SLA, staff performance, Excel / PDF exports', 12000, 'once', 0],
      ['pricing', 'إدارة الأسعار والباقات', 'Pricing & subscription plans', 'Edit service prices, company plans, discounts', 6000, 'once', 0],
      ['mobile', 'تطبيق ويب للجوال (PWA)', 'Mobile web app (PWA)', 'Installable on iPhone / Android with push notifications', 9000, 'once', 1],
    ]],
    ['الربط والتكامل', 'Integrations', [
      ['sms', 'ربط الرسائل النصية SMS', 'SMS gateway integration', 'Unifonic / Taqnyat / Msegat: OTP and status updates', 3500, 'once', 0],
      ['smsc', 'رصيد الرسائل النصية', 'SMS credits (~10,000 / month)', 'Provider cost, about 0.08 SAR per SMS', 800, 'month', 0],
      ['wa', 'واتساب للأعمال API', 'WhatsApp Business API', 'Official Meta API: ticket updates, chat, message templates', 7500, 'once', 0],
      ['wac', 'رسوم محادثات واتساب', 'WhatsApp conversation fees', 'Meta fees (estimate)', 600, 'month', 0],
      ['nafath', 'التحقق عبر نفاذ', 'Nafath identity login', 'National ID verification for customers', 9000, 'once', 1],
      ['email', 'البريد الإلكتروني', 'Transactional email', 'Receipts, notifications, password reset', 1500, 'once', 0],
    ]],
    ['الاستضافة والدعم', 'Hosting & support', [
      ['ksa', 'تجهيز الاستضافة داخل السعودية', 'Saudi hosting setup', 'Riyadh / Jeddah region, NCA & PDPL data residency', 4000, 'once', 0],
      ['ksam', 'خادم سحابي في السعودية ونسخ احتياطي', 'Saudi cloud server & backups', 'Managed server, SSL, daily backups, monitoring', 1400, 'month', 0],
      ['domain', 'النطاق والشهادة', 'Domain & SSL (.sa / .com)', 'Yearly, billed monthly', 100, 'month', 0],
      ['sup', 'الدعم والصيانة', 'Support & maintenance', 'Fixes, updates, 8×5 support, 4h critical response', 2500, 'month', 1],
      ['train', 'التدريب والإطلاق', 'Training & go-live', 'Staff training, Arabic user guides, launch support', 3000, 'once', 0],
    ]],
  ],
  terms: { vat: 15, discount: 0, splitNote: '40% عند التوقيع · 40% عند الاختبار · 20% عند الإطلاق', weeks: 10, validity: 30 },
};
