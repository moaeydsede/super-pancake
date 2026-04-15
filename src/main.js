const ADMIN_UID = 'JxKXouwjdadht4wSMPf1qtbeW9n1';
const firebaseConfig = {
  apiKey: 'AIzaSyBc-zCwcSNsVupzAAHWeUWKGHLdcrzg2iQ',
  authDomain: 'erp-pro-7307c.firebaseapp.com',
  projectId: 'erp-pro-7307c',
  storageBucket: 'erp-pro-7307c.firebasestorage.app',
  messagingSenderId: '481869823115',
  appId: '1:481869823115:web:68ea96d2a4ef5b732fa88e',
};

const STORAGE_KEY = 'erp-pro-luxury-data-v2';
const appEl = document.getElementById('app');
const queryFlags = new URLSearchParams(window.location.search);
const OFFLINE_PREVIEW = queryFlags.get('offline') === '1';
const GUEST_PREVIEW = queryFlags.get('guest') === '1';

const permissionsCatalog = [
  { key: 'materials', label: 'دليل المواد' },
  { key: 'modelRecipes', label: 'دليل الموديلات والقماش' },
  { key: 'openingBalance', label: 'رصيد أول المدة' },
  { key: 'inbound', label: 'فاتورة وارد' },
  { key: 'issue', label: 'فاتورة المنصرف' },
  { key: 'stockAudit', label: 'جرد المخزون' },
  { key: 'modelMovement', label: 'حركة الوارد والمرتجع' },
  { key: 'userManagement', label: 'إدارة المستخدمين' },
];

const navItems = [
  { route: 'dashboard', icon: '◉', title: 'الرئيسية', permission: null },
  { route: 'model-recipes', icon: '✦', title: 'الموديلات والقماش', permission: 'modelRecipes' },
  { route: 'materials', icon: '◌', title: 'دليل المواد', permission: 'materials' },
  { route: 'opening-balance', icon: '◎', title: 'فاتورة رصيد أول المدة', permission: 'openingBalance' },
  { route: 'inbound', icon: '⬇', title: 'فاتورة وارد', permission: 'inbound' },
  { route: 'issue', icon: '⬆', title: 'فاتورة صرف الموديلات', permission: 'issue' },
  { route: 'stock-audit', icon: '▣', title: 'جرد المخزون', permission: 'stockAudit' },
  { route: 'movement', icon: '⇄', title: 'حركة الوارد والمرتجع', permission: 'modelMovement' },
  { route: 'users', icon: '◍', title: 'المستخدمون والصلاحيات', permission: 'userManagement' },
];

const defaultPermissions = Object.fromEntries(permissionsCatalog.map((item) => [item.key, true]));
const userPermissions = Object.fromEntries(permissionsCatalog.map((item) => [item.key, false]));


const demoData = {
  materials: [
    { id: 'FAB-1001', code: 'FAB-1001', name: 'قماش كريب فاخر', mainGroup: 'أقمشة رئيسية', model: 'MDL-1001', unit: 'متر', minQty: 120, createdAt: '2026-04-01T09:00:00.000Z' },
    { id: 'FAB-1002', code: 'FAB-1002', name: 'بطانة حرير مطفي', mainGroup: 'بطانات', model: 'MDL-1001', unit: 'متر', minQty: 80, createdAt: '2026-04-01T09:30:00.000Z' },
    { id: 'FAB-1003', code: 'FAB-1003', name: 'قماش لينن بريميوم', mainGroup: 'أقمشة رئيسية', model: 'MDL-1002', unit: 'متر', minQty: 100, createdAt: '2026-04-02T10:00:00.000Z' },
    { id: 'FAB-1004', code: 'FAB-1004', name: 'سحاب معدني فاخر', mainGroup: 'إكسسوارات', model: 'MDL-1002', unit: 'قطعة', minQty: 60, createdAt: '2026-04-02T10:20:00.000Z' },
    { id: 'FAB-1005', code: 'FAB-1005', name: 'قماش جاكارد ملكي', mainGroup: 'أقمشة رئيسية', model: 'MDL-1003', unit: 'متر', minQty: 90, createdAt: '2026-04-03T11:00:00.000Z' },
    { id: 'FAB-1006', code: 'FAB-1006', name: 'أزرار مطلية ذهبي', mainGroup: 'إكسسوارات', model: 'MDL-1003', unit: 'طقم', minQty: 40, createdAt: '2026-04-03T11:25:00.000Z' },
    { id: 'FAB-1007', code: 'FAB-1007', name: 'دانتيل ناعم فاخر', mainGroup: 'تشطيبات', model: 'MDL-1004', unit: 'متر', minQty: 50, createdAt: '2026-04-04T12:00:00.000Z' },
    { id: 'FAB-1008', code: 'FAB-1008', name: 'شريط تدعيم داخلي', mainGroup: 'تشطيبات', model: 'MDL-1001', unit: 'متر', minQty: 70, createdAt: '2026-04-04T12:30:00.000Z' },
  ],
  modelRecipes: [
    {
      id: 'MDL-1001',
      modelNo: 'MDL-1001',
      modelName: 'عباية تنفيذية فاخرة',
      collection: 'Signature Line',
      notes: 'موديل رسمي يحتاج انسيابية عالية وثبات في السقوط.',
      lines: [
        { materialId: 'FAB-1001', code: 'FAB-1001', materialName: 'قماش كريب فاخر', unit: 'متر', qty: 3.2 },
        { materialId: 'FAB-1002', code: 'FAB-1002', materialName: 'بطانة حرير مطفي', unit: 'متر', qty: 1.8 },
        { materialId: 'FAB-1008', code: 'FAB-1008', materialName: 'شريط تدعيم داخلي', unit: 'متر', qty: 0.7 },
      ],
      createdAt: '2026-04-05T08:00:00.000Z',
    },
    {
      id: 'MDL-1002',
      modelNo: 'MDL-1002',
      modelName: 'فستان لينن بريميوم',
      collection: 'Resort Couture',
      notes: 'مخصص للإنتاج الموسمي بخامة خفيفة ومكونات معدنية محدودة.',
      lines: [
        { materialId: 'FAB-1003', code: 'FAB-1003', materialName: 'قماش لينن بريميوم', unit: 'متر', qty: 2.6 },
        { materialId: 'FAB-1004', code: 'FAB-1004', materialName: 'سحاب معدني فاخر', unit: 'قطعة', qty: 1 },
      ],
      createdAt: '2026-04-05T08:30:00.000Z',
    },
    {
      id: 'MDL-1003',
      modelNo: 'MDL-1003',
      modelName: 'جاكيت جاكارد ملكي',
      collection: 'Executive Gold',
      notes: 'موديل فاخر يحتاج قماش رئيسي ثقيل مع إكسسوارات تشطيب متميزة.',
      lines: [
        { materialId: 'FAB-1005', code: 'FAB-1005', materialName: 'قماش جاكارد ملكي', unit: 'متر', qty: 2.9 },
        { materialId: 'FAB-1006', code: 'FAB-1006', materialName: 'أزرار مطلية ذهبي', unit: 'طقم', qty: 1 },
      ],
      createdAt: '2026-04-05T09:00:00.000Z',
    },
    {
      id: 'MDL-1004',
      modelNo: 'MDL-1004',
      modelName: 'قفطان دانتيل فاخر',
      collection: 'Royal Occasion',
      notes: 'يعتمد على طبقات تشطيب دقيقة ومناسب للطلبات الخاصة.',
      lines: [
        { materialId: 'FAB-1007', code: 'FAB-1007', materialName: 'دانتيل ناعم فاخر', unit: 'متر', qty: 2.3 },
        { materialId: 'FAB-1002', code: 'FAB-1002', materialName: 'بطانة حرير مطفي', unit: 'متر', qty: 1.5 },
      ],
      createdAt: '2026-04-05T09:30:00.000Z',
    },
  ],
  openingInvoices: [
    {
      id: 'OB-2026-001',
      invoiceNo: 'OB-2026-001',
      date: '2026-04-01',
      warehouse: 'مخزن الأقمشة الرئيسي',
      notes: 'رصيد أول المدة',
      createdBy: 'admin',
      createdAt: '2026-04-01T08:20:00.000Z',
      lines: [
        { materialId: 'FAB-1001', code: 'FAB-1001', materialName: 'قماش كريب فاخر', mainGroup: 'أقمشة رئيسية', model: 'MDL-1001', unit: 'متر', qty: 280 },
        { materialId: 'FAB-1002', code: 'FAB-1002', materialName: 'بطانة حرير مطفي', mainGroup: 'بطانات', model: 'MDL-1001', unit: 'متر', qty: 160 },
        { materialId: 'FAB-1005', code: 'FAB-1005', materialName: 'قماش جاكارد ملكي', mainGroup: 'أقمشة رئيسية', model: 'MDL-1003', unit: 'متر', qty: 140 },
      ],
    },
  ],
  inboundInvoices: [
    {
      id: 'IN-2026-001',
      invoiceNo: 'IN-2026-001',
      date: '2026-04-08',
      warehouse: 'مخزن الأقمشة الرئيسي',
      supplier: 'دار النسيج المتقدم',
      model: 'MDL-1002',
      type: 'وارد',
      createdBy: 'warehouse.user',
      createdAt: '2026-04-08T08:30:00.000Z',
      lines: [
        { materialId: 'FAB-1003', code: 'FAB-1003', materialName: 'قماش لينن بريميوم', mainGroup: 'أقمشة رئيسية', model: 'MDL-1002', unit: 'متر', qty: 120 },
        { materialId: 'FAB-1004', code: 'FAB-1004', materialName: 'سحاب معدني فاخر', mainGroup: 'إكسسوارات', model: 'MDL-1002', unit: 'قطعة', qty: 65 },
      ],
    },
    {
      id: 'RT-2026-002',
      invoiceNo: 'RT-2026-002',
      date: '2026-04-11',
      warehouse: 'مخزن الأقمشة الرئيسي',
      supplier: 'مرتجع من خط الإنتاج',
      model: 'MDL-1001',
      type: 'مرتجع',
      createdBy: 'production.user',
      createdAt: '2026-04-11T10:30:00.000Z',
      lines: [
        { materialId: 'FAB-1001', code: 'FAB-1001', materialName: 'قماش كريب فاخر', mainGroup: 'أقمشة رئيسية', model: 'MDL-1001', unit: 'متر', qty: 18 },
        { materialId: 'FAB-1002', code: 'FAB-1002', materialName: 'بطانة حرير مطفي', mainGroup: 'بطانات', model: 'MDL-1001', unit: 'متر', qty: 6 },
      ],
    },
  ],
  issueInvoices: [
    {
      id: 'IS-2026-001',
      invoiceNo: 'IS-2026-001',
      date: '2026-04-12',
      warehouse: 'مخزن الأقمشة الرئيسي',
      department: 'خط الإنتاج التنفيذي',
      model: 'MDL-1001',
      piecesCount: 5,
      notes: 'صرف خطة إنتاج صباحية',
      createdBy: 'ops.user',
      createdAt: '2026-04-12T09:00:00.000Z',
      lines: [
        { materialId: 'FAB-1001', code: 'FAB-1001', materialName: 'قماش كريب فاخر', mainGroup: 'أقمشة رئيسية', model: 'MDL-1001', unit: 'متر', qty: 16 },
        { materialId: 'FAB-1002', code: 'FAB-1002', materialName: 'بطانة حرير مطفي', mainGroup: 'بطانات', model: 'MDL-1001', unit: 'متر', qty: 9 },
        { materialId: 'FAB-1008', code: 'FAB-1008', materialName: 'شريط تدعيم داخلي', mainGroup: 'تشطيبات', model: 'MDL-1001', unit: 'متر', qty: 4 },
      ],
    },
    {
      id: 'IS-2026-002',
      invoiceNo: 'IS-2026-002',
      date: '2026-04-13',
      warehouse: 'مخزن الأقمشة الرئيسي',
      department: 'خط المناسبات الخاصة',
      model: 'MDL-1003',
      piecesCount: 3,
      notes: 'صرف لأمر تشغيل خاص',
      createdBy: 'ops.user',
      createdAt: '2026-04-13T11:20:00.000Z',
      lines: [
        { materialId: 'FAB-1005', code: 'FAB-1005', materialName: 'قماش جاكارد ملكي', mainGroup: 'أقمشة رئيسية', model: 'MDL-1003', unit: 'متر', qty: 9 },
        { materialId: 'FAB-1006', code: 'FAB-1006', materialName: 'أزرار مطلية ذهبي', mainGroup: 'إكسسوارات', model: 'MDL-1003', unit: 'طقم', qty: 3 },
      ],
    },
  ],
  users: [
    {
      id: ADMIN_UID,
      uid: ADMIN_UID,
      displayName: 'مدير النظام',
      email: 'admin@erp-pro.com',
      role: 'admin',
      status: 'active',
      permissions: { ...defaultPermissions },
      createdAt: '2026-04-01T08:00:00.000Z',
    },
    {
      id: 'USR-1001',
      uid: 'USR-1001',
      displayName: 'مدير المخزن',
      email: 'store@erp-pro.com',
      role: 'user',
      status: 'active',
      permissions: { ...userPermissions, materials: true, modelRecipes: true, inbound: true, stockAudit: true, modelMovement: true },
      createdAt: '2026-04-07T08:00:00.000Z',
    },
    {
      id: 'USR-1002',
      uid: 'USR-1002',
      displayName: 'مشرف الإنتاج',
      email: 'ops@erp-pro.com',
      role: 'user',
      status: 'active',
      permissions: { ...userPermissions, modelRecipes: true, issue: true, stockAudit: true, modelMovement: true },
      createdAt: '2026-04-09T08:00:00.000Z',
    },
  ],
};


const state = {
  route: getRoute(),
  mode: 'local',
  booted: false,
  syncing: false,
  notice: '',
  ui: {
    mobileMenuOpen: false,
    installAvailable: false,
    installed: window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
  },
  filters: {
    stockSearch: '',
    groupFilter: 'الكل',
    modelFilter: 'الكل',
    movementModel: 'الكل',
    movementType: 'الكل',
    recipeSearch: '',
  },
  forms: {},
  session: GUEST_PREVIEW ? null : {
    isDemo: true,
    user: {
      uid: ADMIN_UID,
      displayName: 'مدير النظام',
      email: 'admin@erp-pro.com',
      role: 'admin',
      permissions: { ...defaultPermissions },
    },
  },
  data: loadLocalData(),
};

const firebaseState = {
  ready: false,
  enabled: false,
  loading: false,
  app: null,
  auth: null,
  db: null,
  modules: null,
};

let deferredInstallPrompt = null;

document.addEventListener('click', handleGlobalMenuDismiss, true);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

window.addEventListener('hashchange', () => {
  state.route = getRoute();
  state.ui.mobileMenuOpen = false;
  render();
});

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  state.ui.installAvailable = true;
  render();
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  state.ui.installAvailable = false;
  state.ui.installed = true;
  state.notice = 'تم تثبيت التطبيق';
  render();
});

window.addEventListener('load', async () => {
  seedForms();
  registerPWA();
  render();
  if (!OFFLINE_PREVIEW) await initFirebase();
});

function getRoute() {
  const hash = window.location.hash.replace('#', '').trim();
  return hash || 'dashboard';
}

function loadLocalData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoData));
    return structuredClone(demoData);
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(demoData),
      ...parsed,
    };
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoData));
    return structuredClone(demoData);
  }
}

function saveLocalData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function seedForms() {
  state.forms.material = {
    code: nextCode('FAB', state.data.materials.length + 1001),
    name: '',
    mainGroup: 'أقمشة رئيسية',
    model: 'MDL-1001',
    unit: 'متر',
    minQty: 0,
  };
  state.forms.opening = makeInvoiceForm('OB', 'رصيد أول المدة');
  state.forms.inbound = { ...makeInvoiceForm('IN', 'وارد'), supplier: '', type: 'وارد' };
  state.forms.issue = { ...makeInvoiceForm('IS', 'صرف موديل'), department: '', piecesCount: 1 };
  state.forms.user = {
    displayName: '',
    email: '',
    role: 'user',
    status: 'active',
    permissions: { ...userPermissions, materials: true, modelRecipes: true },
  };
}

function makeInvoiceForm(prefix, kind) {
  return {
    invoiceNo: nextCode(prefix, Date.now().toString().slice(-4)),
    date: today(),
    warehouse: 'المستودع الرئيسي',
    model: 'MDL-1001',
    notes: kind,
    lines: [makeLineItem()],
  };
}

function makeLineItem(materialId = '') {
  return {
    rowId: Math.random().toString(36).slice(2),
    materialId,
    qty: 1,
  };
}

function nextCode(prefix, seed) {
  return `${prefix}-${String(seed).padStart(4, '0')}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function registerPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => null);
  }
}

async function installApp() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  if (choice?.outcome === 'accepted') {
    state.ui.installAvailable = false;
  }
  deferredInstallPrompt = null;
  render();
}

async function initFirebase() {
  firebaseState.loading = true;
  render();
  try {
    const [appMod, authMod, firestoreMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'),
    ]);

    firebaseState.app = appMod.initializeApp(firebaseConfig);
    firebaseState.auth = authMod.getAuth(firebaseState.app);
    firebaseState.db = firestoreMod.getFirestore(firebaseState.app);
    firebaseState.modules = { ...appMod, ...authMod, ...firestoreMod };
    firebaseState.ready = true;
    firebaseState.enabled = true;
    state.notice = 'تم ربط Firebase بنجاح';

    authMod.onAuthStateChanged(firebaseState.auth, async (user) => {
      if (user) {
        const profile = await ensureUserProfile(user);
        state.session = {
          isDemo: false,
          user: profile,
        };
        state.mode = 'firebase';
        await refreshRemoteData();
      } else {
        state.mode = 'local';
      }
      render();
    });
  } catch (error) {
    firebaseState.enabled = false;
    state.notice = 'وضع العرض المحلي مفعل';
    render();
  } finally {
    firebaseState.loading = false;
    render();
  }
}

async function ensureUserProfile(user) {
  const { doc, getDoc, setDoc } = firebaseState.modules;
  const ref = doc(firebaseState.db, 'users', user.uid);
  const snap = await getDoc(ref);
  const isAdmin = user.uid === ADMIN_UID;
  const defaults = {
    uid: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'مستخدم',
    email: user.email || '',
    role: isAdmin ? 'admin' : 'user',
    status: 'active',
    permissions: isAdmin ? { ...defaultPermissions } : { ...userPermissions, materials: true, stockAudit: true },
    createdAt: new Date().toISOString(),
  };
  if (!snap.exists()) {
    await setDoc(ref, defaults, { merge: true });
    return { id: user.uid, ...defaults };
  }
  const profile = snap.data();
  if (isAdmin && profile.role !== 'admin') {
    await setDoc(ref, { role: 'admin', permissions: { ...defaultPermissions } }, { merge: true });
    return { id: user.uid, ...profile, role: 'admin', permissions: { ...defaultPermissions } };
  }
  return { id: user.uid, ...profile };
}

async function refreshRemoteData() {
  if (!firebaseState.enabled || !state.session?.user) return;
  state.syncing = true;
  render();
  const data = { ...state.data };
  for (const key of ['materials', 'openingInvoices', 'inboundInvoices', 'issueInvoices', 'users']) {
    data[key] = await readCollection(key);
  }
  state.data = data;
  state.syncing = false;
  render();
}

async function readCollection(name) {
  if (!firebaseState.enabled) return state.data[name];
  const { collection, getDocs } = firebaseState.modules;
  const snap = await getDocs(collection(firebaseState.db, name));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function upsertRecord(name, payload, customId = null) {
  if (firebaseState.enabled && !state.session.isDemo) {
    const { collection, doc, setDoc } = firebaseState.modules;
    const id = customId || payload.id || crypto.randomUUID();
    await setDoc(doc(firebaseState.db, name, id), sanitizeForStore({ ...payload, id }), { merge: true });
  }

  const index = state.data[name].findIndex((item) => item.id === (customId || payload.id));
  const record = { ...payload, id: customId || payload.id || crypto.randomUUID() };
  if (index === -1) state.data[name].unshift(record);
  else state.data[name][index] = record;
  saveLocalData();
}

function sanitizeForStore(value) {
  return JSON.parse(JSON.stringify(value));
}

function hasPermission(permission) {
  if (!permission) return true;
  const current = state.session?.user;
  if (!current) return false;
  if (current.role === 'admin') return true;
  return Boolean(current.permissions?.[permission]);
}

function lockScreen() {
  return !state.session?.user;
}

function render() {
  const currentRoute = navItems.find((item) => item.route === state.route);
  const allowedRoute = currentRoute && hasPermission(currentRoute.permission);
  if (currentRoute && !allowedRoute) {
    state.route = 'dashboard';
    window.location.hash = '#dashboard';
  }

  appEl.innerHTML = `
    <div class="app-shell ${state.ui.mobileMenuOpen ? 'menu-open' : ''}">
      <button class="mobile-backdrop" aria-label="إغلاق القائمة" data-action="close-menu"></button>
      ${renderSidebar()}
      <main class="main-shell">
        ${renderTopbar()}
        <section class="content-shell">
          ${lockScreen() ? renderAuth() : renderView()}
        </section>
      </main>
      ${renderMobileDock()}
      ${renderInstallFab()}
    </div>
  `;
  bindEvents();
}

function renderSidebar() {
  const current = state.session?.user;
  return `
    <aside class="sidebar glass-card ${state.ui.mobileMenuOpen ? 'open' : ''}">
      <div class="sidebar-mobile-head">
        <button class="icon-btn" type="button" data-action="close-menu">✕</button>
      </div>
      <div class="brand-block">
        <div class="brand-logo">EP</div>
        <div>
          <div class="brand-title">ERP PRO ATELIER</div>
          <div class="brand-subtitle">Luxury Manufacturing • Fabric Intelligence</div>
        </div>
      </div>
      <div class="profile-card">
        <div class="avatar-ring">${(current?.displayName || 'Z').slice(0, 1)}</div>
        <div>
          <div class="profile-name">${current?.displayName || 'وضع الضيف'}</div>
          <div class="profile-role">${current?.role === 'admin' ? 'Administrator' : current?.email || 'Local Demo'}</div>
        </div>
      </div>
      <nav class="nav-list">
        ${navItems
          .filter((item) => hasPermission(item.permission))
          .map(
            (item) => `
          <a class="nav-item ${state.route === item.route ? 'active' : ''}" href="#${item.route}">
            <span class="nav-icon">${item.icon}</span>
            <span>${item.title}</span>
          </a>
        `,
          )
          .join('')}
      </nav>
      <div class="sidebar-footer">
        <div class="mini-kpi">
          <span>Firebase</span>
          <strong>${firebaseState.enabled ? 'Connected' : 'Local Mode'}</strong>
        </div>
        <div class="mini-kpi">
          <span>UID Admin</span>
          <strong class="uid-tag">${ADMIN_UID.slice(0, 10)}...</strong>
        </div>
      </div>
    </aside>
  `;
}

function renderMobileDock() {
  if (lockScreen()) return '';
  const items = navItems.filter((item) => hasPermission(item.permission));
  return `
    <nav class="mobile-dock glass-card">
      ${items
        .map((item) => `
          <a class="mobile-dock-item ${state.route === item.route ? 'active' : ''}" href="#${item.route}">
            <span class="mobile-dock-icon">${item.icon}</span>
            <span>${item.title}</span>
          </a>
        `)
        .join('')}
    </nav>
  `;
}

function renderInstallFab() {
  if (!state.ui.installAvailable || state.ui.installed || lockScreen()) return '';
  return `<button class="install-fab" type="button" data-action="install-app">تثبيت</button>`;
}

function renderTopbar() {
  const summary = getSummary();
  return `
    <header class="topbar glass-card premium-topbar">
      <div>
        <div class="topbar-eyebrow">ERP • EXECUTIVE OPERATIONS</div>
        <h1 class="page-title">${routeTitle(state.route)}</h1>
        <p class="page-subtitle">منصة تشغيل راقية لإدارة الأقمشة والموديلات والصرف الذكي للمصانع والورش الراقية</p>
      </div>
      <div class="topbar-actions">
        <button class="icon-btn mobile-only menu-trigger" type="button" data-action="toggle-menu" aria-label="فتح القائمة">
          <span></span><span></span><span></span>
        </button>
        <div class="status-pill ${state.mode === 'firebase' ? 'connected' : 'demo'}">${state.mode === 'firebase' ? 'LIVE CLOUD' : 'LOCAL PREVIEW'}</div>
        <div class="status-pill ${state.syncing ? 'busy' : ''}">${state.syncing ? 'SYNCING' : `STOCK ${summary.totalStock}`}</div>
        <div class="status-pill">${summary.modelRecipes} MODELS</div>
        ${state.ui.installAvailable && !state.ui.installed ? '<button class="secondary-btn install-inline" type="button" data-action="install-app">تثبيت التطبيق</button>' : ''}
        ${state.session?.isDemo ? '<button class="ghost-btn" data-action="demo-reset">تهيئة البيانات</button>' : ''}
        ${state.session?.user ? `<button class="ghost-btn" data-action="logout">${state.session.isDemo ? 'تبديل المستخدم' : 'تسجيل خروج'}</button>` : ''}
      </div>
    </header>
  `;
}

function routeTitle(route) {
  return navItems.find((item) => item.route === route)?.title || 'الرئيسية';
}

function renderAuth() {
  return `
    <div class="auth-grid auth-luxury-grid">
      <section class="hero-panel glass-card auth-hero-panel">
        <div class="hero-badge">ERP PRO ATELIER</div>
        <h2>شاشة دخول احترافية لإدارة الأقمشة والموديلات</h2>
        <p>تجربة دخول فاخرة بمستوى أنظمة الشركات الكبيرة، مع إدارة صلاحيات، دليل موديلات، وصرف ذكي للقماش بناءً على رقم الموديل.</p>
        <div class="hero-stats">
          <div class="stat-card"><span>المواد</span><strong>${state.data.materials.length}</strong></div>
          <div class="stat-card"><span>الموديلات</span><strong>${state.data.modelRecipes.length}</strong></div>
          <div class="stat-card"><span>المستخدمون</span><strong>${state.data.users.length}</strong></div>
        </div>
        <div class="auth-security-list">
          <div class="security-item"><strong>صلاحيات تفصيلية</strong><span>لكل شاشة، كل حركة، وكل مستخدم</span></div>
          <div class="security-item"><strong>Lookup ذكي</strong><span>اكتب رقم الموديل لمعرفة القماش المطلوب مباشرة</span></div>
          <div class="security-item"><strong>جاهز للموبايل</strong><span>قائمة جانبية متطورة مع إغلاق تلقائي عند الضغط خارجها</span></div>
        </div>
      </section>
      <section class="auth-panel glass-card luxury-login-panel">
        <div class="section-head compact">
          <div>
            <h3>تسجيل الدخول</h3>
            <p>${state.notice || 'اسم المستخدم / البريد الإلكتروني وكلمة المرور'}</p>
          </div>
          <div class="status-chip info">Secure Access</div>
        </div>
        <form id="login-form" class="form-grid auth-form premium-auth-form">
          <label class="full">
            <span>اسم المستخدم / البريد الإلكتروني</span>
            <input name="email" type="email" placeholder="admin@erp-pro.com" autocomplete="username" />
          </label>
          <label class="full password-field">
            <span>كلمة المرور</span>
            <div class="password-wrap">
              <input id="auth-password" name="password" type="password" placeholder="••••••••" autocomplete="current-password" />
              <button class="ghost-inline-btn" type="button" data-action="toggle-password">إظهار</button>
            </div>
          </label>
          <div class="auth-hint full">
            <span>يمكن تشغيل وضع المعاينة الاحترافي فورًا عند عدم تفعيل Firebase.</span>
            <strong>Premium Demo Ready</strong>
          </div>
          <div class="action-row full">
            <button class="primary-btn" type="submit">دخول النظام</button>
            <button class="secondary-btn" type="button" data-action="demo-login">تشغيل العرض الاحترافي</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function renderView() {
  switch (state.route) {
    case 'dashboard':
      return renderDashboard();
    case 'model-recipes':
      return renderModelRecipes();
    case 'materials':
      return renderMaterials();
    case 'opening-balance':
      return renderOpeningBalance();
    case 'inbound':
      return renderInbound();
    case 'issue':
      return renderIssue();
    case 'stock-audit':
      return renderStockAudit();
    case 'movement':
      return renderMovement();
    case 'users':
      return renderUsers();
    default:
      return renderDashboard();
  }
}

function renderDashboard() {
  const summary = getSummary();
  const stockRows = getStockRows().slice(0, 5);
  const lowStock = getLowStock();
  return `
    <div class="dashboard-grid">
      <section class="hero-banner luxury-card">
        <div class="hero-copy">
          <span class="hero-tag">ADVANCED INVENTORY OPERATIONS</span>
          <h2>لوحة قيادة تنفيذية للمخزون والحركة والفواتير</h2>
          <p>واجهة تنفيذية تعرض حالة المخزون الحالية، آخر الحركات، المواد الحرجة، والمستخدمين الفعالين في تجربة بصرية راقية وفخمة.</p>
          <div class="hero-actions">
            <a href="#model-recipes" class="primary-btn">دليل الموديلات والقماش</a>
            <a href="#issue" class="secondary-btn">صرف موديل</a>
          </div>
        </div>
        <div class="hero-metrics">
          <div class="metric-orb"><span>حركة اليوم</span><strong>${summary.todayMovement}</strong></div>
          <div class="metric-orb"><span>مخزون كلي</span><strong>${summary.totalStock}</strong></div>
          <div class="metric-orb"><span>مواد حرجة</span><strong>${lowStock.length}</strong></div>
        </div>
      </section>

      <section class="kpi-row">
        ${[
          ['إجمالي المواد', summary.materials],
          ['رصيد أول المدة', summary.openingInvoices],
          ['فواتير الوارد/المرتجع', summary.inboundInvoices],
          ['فواتير صرف الموديلات', summary.issueInvoices],
        ]
          .map(
            ([label, value]) => `
          <div class="glass-card kpi-card">
            <span>${label}</span>
            <strong>${value}</strong>
          </div>
        `,
          )
          .join('')}
      </section>

      <section class="glass-card split-panel">
        <div class="section-head">
          <div>
            <h3>المخزون الحالي حسب المادة</h3>
            <p>أعلى المواد ظهورًا بعد احتساب رصيد أول المدة والوارد والمرتجع والمنصرف</p>
          </div>
        </div>
        ${renderTable(
          ['المادة', 'المجموعة', 'الموديل', 'الرصيد', 'الحد الأدنى'],
          stockRows.map((row) => [row.materialName, row.mainGroup, row.model, badgeNumber(row.balance), row.minQty]),
        )}
      </section>

      <section class="glass-card split-panel">
        <div class="section-head">
          <div>
            <h3>المواد الحرجة</h3>
            <p>مواد أقل من الحد الأدنى التشغيلي</p>
          </div>
        </div>
        <div class="stack-list">
          ${lowStock.length
            ? lowStock
                .map(
                  (row) => `
              <div class="stack-item warning">
                <div>
                  <strong>${row.materialName}</strong>
                  <span>${row.mainGroup} • ${row.model}</span>
                </div>
                <div class="delta-pill negative">${row.balance}</div>
              </div>
            `,
                )
                .join('')
            : '<div class="empty-state">لا توجد مواد حرجة حاليًا</div>'}
        </div>
      </section>

      <section class="glass-card split-panel wide">
        <div class="section-head">
          <div>
            <h3>التوزيع حسب المجموعة الرئيسية</h3>
            <p>رؤية مرئية للمخزون المجمّع</p>
          </div>
        </div>
        <div class="bar-chart">
          ${Object.entries(summary.byGroup)
            .map(([group, value]) => {
              const max = Math.max(...Object.values(summary.byGroup), 1);
              return `
              <div class="bar-row">
                <span>${group}</span>
                <div class="bar-track"><div class="bar-fill" style="width:${(value / max) * 100}%"></div></div>
                <strong>${value}</strong>
              </div>
            `;
            })
            .join('')}
        </div>
      </section>
    </div>
  `;
}


function renderModelRecipes() {
  const recipes = getFilteredModelRecipes();
  const selected = getRecipeByModelNo(state.filters.recipeSearch) || recipes[0] || null;
  return `
    <div class="stack-layout">
      <section class="glass-card lookup-hero">
        <div class="section-head">
          <div>
            <h3>دليل الموديلات والقماش</h3>
            <p>اكتب رقم الموديل لمعرفة القماش المطلوب فورًا وتجهيز صرفه مباشرة</p>
          </div>
          <a href="#issue" class="secondary-btn">الانتقال إلى شاشة الصرف</a>
        </div>
        <div class="filters-row compact-grid">
          <label class="full">
            <span>بحث برقم الموديل أو الاسم</span>
            <input id="recipe-search" value="${state.filters.recipeSearch}" placeholder="مثال: MDL-1001" />
          </label>
        </div>
        ${
          selected
            ? `
          <div class="recipe-focus-card">
            <div>
              <div class="hero-badge">${selected.collection || 'Model Recipe'}</div>
              <h2>${selected.modelNo} — ${selected.modelName}</h2>
              <p>${selected.notes || 'وصفة تشغيل معتمدة لهذا الموديل.'}</p>
            </div>
            <div class="hero-actions">
              <button class="primary-btn" type="button" data-action="issue-from-recipe" data-model="${selected.modelNo}">صرف هذا الموديل</button>
              <button class="ghost-btn" type="button" data-action="clear-recipe-search">مسح البحث</button>
            </div>
          </div>
        `
            : '<div class="empty-state">لا يوجد موديل مطابق للبحث الحالي</div>'
        }
      </section>

      <section class="glass-card">
        <div class="section-head">
          <div>
            <h3>الوصفات المعتمدة</h3>
            <p>المقادير هنا تمثل الاستهلاك القياسي لكل قطعة واحدة من الموديل</p>
          </div>
        </div>
        <div class="recipe-cards">
          ${recipes
            .map(
              (recipe) => `
            <article class="recipe-card ${selected?.id === recipe.id ? 'active' : ''}">
              <div class="recipe-card-head">
                <div>
                  <strong>${recipe.modelNo}</strong>
                  <span>${recipe.modelName}</span>
                </div>
                <button class="ghost-btn" type="button" data-action="issue-from-recipe" data-model="${recipe.modelNo}">صرف</button>
              </div>
              <div class="mini-tags">
                <span>${recipe.collection || 'Premium Line'}</span>
                <span>${recipe.lines.length} خامات</span>
              </div>
              <div class="recipe-lines">
                ${recipe.lines
                  .map(
                    (line) => `
                  <div class="recipe-line">
                    <div>
                      <strong>${line.materialName}</strong>
                      <span>${line.code}</span>
                    </div>
                    <div class="delta-pill neutral">${line.qty} ${line.unit}</div>
                  </div>
                `,
                  )
                  .join('')}
              </div>
            </article>
          `,
            )
            .join('')}
        </div>
      </section>
    </div>
  `;
}

function renderMaterials() {
  return `
    <div class="two-column-layout">
      <section class="glass-card">
        <div class="section-head">
          <div>
            <h3>إضافة خامة / مادة جديدة</h3>
            <p>إدارة القماش، البطانة، والإكسسوارات بأسلوب مؤسسي فاخر</p>
          </div>
        </div>
        <form id="material-form" class="form-grid">
          <label><span>كود المادة</span><input name="code" value="${state.forms.material.code}" required /></label>
          <label><span>اسم المادة</span><input name="name" value="${state.forms.material.name}" required /></label>
          <label><span>المجموعة الرئيسية</span><input name="mainGroup" value="${state.forms.material.mainGroup}" required /></label>
          <label><span>الموديل</span><input name="model" value="${state.forms.material.model}" required /></label>
          <label><span>الوحدة</span><input name="unit" value="${state.forms.material.unit}" required /></label>
          <label><span>الحد الأدنى</span><input name="minQty" type="number" min="0" value="${state.forms.material.minQty}" required /></label>
          <div class="action-row full"><button class="primary-btn" type="submit">حفظ المادة</button></div>
        </form>
      </section>

      <section class="glass-card">
        <div class="section-head">
          <div>
            <h3>دليل الخامات والمواد</h3>
            <p>مرجع موحّد لكل الأقمشة والبطانات والإكسسوارات المستخدمة</p>
          </div>
        </div>
        ${renderTable(
          ['الكود', 'اسم المادة', 'المجموعة', 'الموديل', 'الوحدة', 'الحد الأدنى'],
          state.data.materials.map((item) => [item.code, item.name, item.mainGroup, item.model, item.unit, item.minQty]),
        )}
      </section>
    </div>
  `;
}

function renderOpeningBalance() {
  return renderInvoiceScreen({
    formId: 'opening-form',
    screenTitle: 'فاتورة إضافة رصيد أول المدة',
    subtitle: 'إضافة رصيد أول المدة بدون أسعار وبأكثر من بند',
    form: state.forms.opening,
    type: 'opening',
    extraFields: '',
    list: state.data.openingInvoices,
  });
}

function renderInbound() {
  return renderInvoiceScreen({
    formId: 'inbound-form',
    screenTitle: 'فاتورة وارد / مرتجع',
    subtitle: 'الوارد يضاف حسب الصلاحية مع تتبع الموديل ونوع الحركة',
    form: state.forms.inbound,
    type: 'inbound',
    extraFields: `
      <label><span>نوع الحركة</span>
        <select name="type">
          ${['وارد', 'مرتجع'].map((item) => `<option ${state.forms.inbound.type === item ? 'selected' : ''}>${item}</option>`).join('')}
        </select>
      </label>
      <label><span>الجهة / المورد</span><input name="supplier" value="${state.forms.inbound.supplier || ''}" /></label>
    `,
    list: state.data.inboundInvoices,
  });
}

function renderIssue() {
  return renderInvoiceScreen({
    formId: 'issue-form',
    screenTitle: 'صرف ذكي للموديلات والقماش',
    subtitle: 'اكتب رقم الموديل وحدد عدد القطع وسيتم تجهيز وصفة القماش المقترحة للصرف',
    form: state.forms.issue,
    type: 'issue',
    extraFields: `
      <label><span>القسم / الجهة المستفيدة</span><input name="department" value="${state.forms.issue.department || ''}" /></label>
      <label><span>عدد القطع</span><input name="piecesCount" type="number" min="1" value="${state.forms.issue.piecesCount || 1}" data-sync-pieces="issue" /></label>
      <div class="full">${renderIssueRecipeAssistant(state.forms.issue.model, state.forms.issue.piecesCount)}</div>
    `,
    list: state.data.issueInvoices,
  });
}

function renderInvoiceScreen({ formId, screenTitle, subtitle, form, type, extraFields, list }) {
  return `
    <div class="two-column-layout invoice-layout">
      <section class="glass-card">
        <div class="section-head">
          <div>
            <h3>${screenTitle}</h3>
            <p>${subtitle}</p>
          </div>
          <button class="ghost-btn" type="button" data-action="add-line" data-form="${type}">إضافة بند</button>
        </div>
        <form id="${formId}" class="form-grid invoice-form" data-type="${type}">
          <label><span>رقم الفاتورة</span><input name="invoiceNo" value="${form.invoiceNo}" required /></label>
          <label><span>التاريخ</span><input name="date" type="date" value="${form.date}" required /></label>
          <label><span>المستودع</span><input name="warehouse" value="${form.warehouse}" required /></label>
          <label><span>رقم الموديل</span><input name="model" value="${form.model}" required data-sync-model="${type}" placeholder="مثال: MDL-1001" /></label>
          ${extraFields}
          <label class="full"><span>ملاحظات</span><textarea name="notes">${form.notes || ''}</textarea></label>
          <div class="full line-items-card">
            <div class="line-items-head">
              <strong>بنود الفاتورة</strong>
              <span>بدون أسعار • أكثر من بند</span>
            </div>
            ${form.lines
              .map((line, index) => {
                const material = state.data.materials.find((item) => item.id === line.materialId) || state.data.materials[0];
                return `
                <div class="line-item-row">
                  <label>
                    <span>المادة ${index + 1}</span>
                    <select data-line-material="${type}" data-row="${line.rowId}">
                      ${state.data.materials
                        .map(
                          (item) => `
                        <option value="${item.id}" ${item.id === (line.materialId || material?.id) ? 'selected' : ''}>${item.code} — ${item.name}</option>
                      `,
                        )
                        .join('')}
                    </select>
                  </label>
                  <label>
                    <span>الكمية</span>
                    <input type="number" min="1" value="${line.qty}" data-line-qty="${type}" data-row="${line.rowId}" />
                  </label>
                  <div class="line-meta">
                    <span>${material?.mainGroup || '-'}</span>
                    <strong>${material?.model || '-'}</strong>
                  </div>
                  ${form.lines.length > 1 ? `<button class="danger-icon" type="button" data-action="remove-line" data-form="${type}" data-row="${line.rowId}">×</button>` : ''}
                </div>
              `;
              })
              .join('')}
          </div>
          <div class="action-row full"><button class="primary-btn" type="submit">حفظ الفاتورة</button></div>
        </form>
      </section>

      <section class="glass-card invoice-preview-card">
        <div class="section-head">
          <div>
            <h3>آخر الحركات المحفوظة</h3>
            <p>مراجعة سريعة للحركات المحفوظة</p>
          </div>
        </div>
        <div class="invoice-preview-stack">
          ${list
            .slice(0, 4)
            .map(
              (invoice) => `
            <article class="invoice-mini-card">
              <div class="invoice-mini-head">
                <strong>${invoice.invoiceNo}</strong>
                <span>${invoice.date}</span>
              </div>
              <div class="mini-tags">
                <span>${invoice.model || '-'}</span>
                <span>${invoice.type || invoice.department || 'حركة'}</span>
                <span>${invoice.warehouse}</span>
              </div>
              <div class="mini-lines">
                ${invoice.lines.map((line) => `<div><span>${line.materialName}</span><strong>${line.qty} ${line.unit}</strong></div>`).join('')}
              </div>
            </article>
          `,
            )
            .join('')}
        </div>
      </section>
    </div>
  `;
}

function renderStockAudit() {
  const rows = getFilteredStockRows();
  return `
    <div class="stack-layout">
      <section class="glass-card">
        <div class="section-head">
          <div>
            <h3>جرد المخزون حسب المادة والمجموعة الرئيسية</h3>
            <p>فلترة مباشرة حسب المادة والمجموعة والموديل</p>
          </div>
        </div>
        <div class="filters-row">
          <label><span>بحث بالمادة</span><input id="stock-search" value="${state.filters.stockSearch}" placeholder="اسم المادة أو الكود" /></label>
          <label><span>المجموعة الرئيسية</span>${renderSelect('group-filter', ['الكل', ...new Set(state.data.materials.map((item) => item.mainGroup))], state.filters.groupFilter)}</label>
          <label><span>الموديل</span>${renderSelect('model-filter', ['الكل', ...new Set(state.data.materials.map((item) => item.model))], state.filters.modelFilter)}</label>
        </div>
        ${renderTable(
          ['الكود', 'المادة', 'المجموعة', 'الموديل', 'الوحدة', 'الرصيد الحالي'],
          rows.map((row) => [row.code, row.materialName, row.mainGroup, row.model, row.unit, badgeNumber(row.balance)]),
        )}
      </section>
    </div>
  `;
}

function renderMovement() {
  const logs = getMovementLogs().filter((entry) => {
    const byModel = state.filters.movementModel === 'الكل' || entry.model === state.filters.movementModel;
    const byType = state.filters.movementType === 'الكل' || entry.type === state.filters.movementType;
    return byModel && byType;
  });

  return `
    <div class="stack-layout">
      <section class="glass-card">
        <div class="section-head">
          <div>
            <h3>حركة الموديلات والصرف</h3>
            <p>استعراض الوارد والمرتجع والمنصرف مع تتبع الموديل والخامة في شاشة واحدة</p>
          </div>
        </div>
        <div class="filters-row compact-grid">
          <label><span>الموديل</span>${renderSelect('movement-model', ['الكل', ...new Set(getMovementLogs().map((item) => item.model))], state.filters.movementModel)}</label>
          <label><span>نوع الحركة</span>${renderSelect('movement-type', ['الكل', 'وارد', 'مرتجع', 'منصرف'], state.filters.movementType)}</label>
        </div>
        ${renderTable(
          ['التاريخ', 'رقم الفاتورة', 'نوع الحركة', 'الموديل', 'المادة', 'الكمية'],
          logs.map((item) => [item.date, item.invoiceNo, item.type, item.model, item.materialName, badgeNumber(item.qty)]),
        )}
      </section>
    </div>
  `;
}

function renderUsers() {
  return `
    <div class="two-column-layout">
      <section class="glass-card">
        <div class="section-head">
          <div>
            <h3>إضافة مستخدم وصلاحيات</h3>
            <p>للادمن فقط • صلاحيات تفصيلية لكل شاشة وحركة</p>
          </div>
        </div>
        <form id="user-form" class="form-grid">
          <label><span>الاسم</span><input name="displayName" value="${state.forms.user.displayName}" required /></label>
          <label><span>البريد الإلكتروني</span><input name="email" type="email" value="${state.forms.user.email}" required /></label>
          <label><span>الدور</span>
            <select name="role">
              <option value="user" ${state.forms.user.role === 'user' ? 'selected' : ''}>User</option>
              <option value="admin" ${state.forms.user.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
          </label>
          <label><span>الحالة</span>
            <select name="status">
              <option value="active" ${state.forms.user.status === 'active' ? 'selected' : ''}>Active</option>
              <option value="pending" ${state.forms.user.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="suspended" ${state.forms.user.status === 'suspended' ? 'selected' : ''}>Suspended</option>
            </select>
          </label>
          <div class="full permission-grid">
            ${permissionsCatalog
              .map(
                (perm) => `
              <label class="permission-chip ${state.forms.user.permissions[perm.key] ? 'on' : ''}">
                <input type="checkbox" data-perm-toggle="${perm.key}" ${state.forms.user.permissions[perm.key] ? 'checked' : ''} />
                <span>${perm.label}</span>
              </label>
            `,
              )
              .join('')}
          </div>
          <div class="action-row full"><button class="primary-btn" type="submit">حفظ المستخدم</button></div>
        </form>
      </section>

      <section class="glass-card">
        <div class="section-head">
          <div>
            <h3>سجل المستخدمين</h3>
            <p>مراقبة الدور والحالة والصلاحيات</p>
          </div>
        </div>
        ${renderTable(
          ['الاسم', 'البريد', 'الدور', 'الحالة', 'الصلاحيات'],
          state.data.users.map((user) => [
            user.displayName,
            user.email,
            user.role === 'admin' ? '<span class="status-chip success">Admin</span>' : '<span class="status-chip info">User</span>',
            statusText(user.status),
            Object.entries(user.permissions || {})
              .filter(([, value]) => value)
              .map(([key]) => permissionsCatalog.find((item) => item.key === key)?.label)
              .join(' • '),
          ]),
        )}
      </section>
    </div>
  `;
}


function getRecipeByModelNo(modelNo = '') {
  const q = String(modelNo || '').trim().toLowerCase();
  if (!q) return null;
  return state.data.modelRecipes.find((item) => item.modelNo.toLowerCase() === q || item.modelName.toLowerCase().includes(q)) || null;
}

function getFilteredModelRecipes() {
  const q = state.filters.recipeSearch.trim().toLowerCase();
  return state.data.modelRecipes.filter((item) => {
    if (!q) return true;
    return item.modelNo.toLowerCase().includes(q) || item.modelName.toLowerCase().includes(q) || (item.collection || '').toLowerCase().includes(q);
  });
}

function renderIssueRecipeAssistant(modelNo, piecesCount = 1) {
  const recipe = getRecipeByModelNo(modelNo);
  if (!recipe) {
    return `
      <div class="smart-assistant-card empty">
        <div>
          <strong>المساعد الذكي للصرف</strong>
          <p>اكتب رقم موديل صحيح مثل MDL-1001 لعرض القماش والخامات المطلوبة تلقائيًا.</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="smart-assistant-card">
      <div class="assistant-copy">
        <div class="hero-badge">${recipe.collection || 'Recipe Matched'}</div>
        <strong>${recipe.modelNo} — ${recipe.modelName}</strong>
        <p>${recipe.notes || 'وصفة تشغيل معتمدة لهذا الموديل.'}</p>
      </div>
      <div class="assistant-lines">
        ${recipe.lines
          .map((line) => `<div><span>${line.materialName}</span><strong>${formatQty(Number(line.qty) * Number(piecesCount || 1))} ${line.unit}</strong></div>`)
          .join('')}
      </div>
      <div class="assistant-actions">
        <button class="primary-btn" type="button" data-action="apply-model-recipe" data-model="${recipe.modelNo}">تحميل وصفة القماش</button>
        <a class="ghost-btn" href="#model-recipes">فتح الدليل</a>
      </div>
    </div>
  `;
}

function formatQty(value) {
  const num = Number(value || 0);
  return Number.isInteger(num) ? String(num) : num.toFixed(2).replace(/\.00$/, '');
}

function renderTable(headers, rows) {
  return `
    <div class="table-shell">
      <table class="luxury-table">
        <thead>
          <tr>${headers.map((head) => `<th>${head}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.length
            ? rows
                .map(
                  (row) => `
              <tr>
                ${row.map((cell) => `<td>${cell}</td>`).join('')}
              </tr>
            `,
                )
                .join('')
            : `<tr><td colspan="${headers.length}"><div class="empty-state">لا توجد بيانات</div></td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

function renderSelect(id, options, selected) {
  return `
    <select id="${id}">
      ${options.map((option) => `<option ${option === selected ? 'selected' : ''}>${option}</option>`).join('')}
    </select>
  `;
}

function badgeNumber(value) {
  const cls = value < 0 ? 'negative' : value === 0 ? 'neutral' : 'positive';
  return `<span class="delta-pill ${cls}">${formatQty(value)}</span>`;
}

function statusText(value) {
  const map = {
    active: '<span class="status-chip success">Active</span>',
    pending: '<span class="status-chip warning">Pending</span>',
    suspended: '<span class="status-chip danger">Suspended</span>',
  };
  return map[value] || value;
}

function getSummary() {
  const stock = getStockRows();
  const byGroup = {};
  stock.forEach((item) => {
    byGroup[item.mainGroup] = (byGroup[item.mainGroup] || 0) + item.balance;
  });
  const todayMovement = getMovementLogs().filter((item) => item.date >= '2026-04-10').length;
  return {
    materials: state.data.materials.length,
    modelRecipes: state.data.modelRecipes.length,
    openingInvoices: state.data.openingInvoices.length,
    inboundInvoices: state.data.inboundInvoices.length,
    issueInvoices: state.data.issueInvoices.length,
    totalStock: stock.reduce((sum, item) => sum + item.balance, 0),
    todayMovement,
    byGroup,
  };
}

function getStockRows() {
  const map = new Map();
  state.data.materials.forEach((material) => {
    map.set(material.id, {
      materialId: material.id,
      code: material.code,
      materialName: material.name,
      mainGroup: material.mainGroup,
      model: material.model,
      unit: material.unit,
      minQty: Number(material.minQty || 0),
      balance: 0,
    });
  });

  const addLines = (lines, sign = 1) => {
    lines.forEach((line) => {
      const row = map.get(line.materialId);
      if (!row) return;
      row.balance += Number(line.qty || 0) * sign;
    });
  };

  state.data.openingInvoices.forEach((inv) => addLines(inv.lines, 1));
  state.data.inboundInvoices.forEach((inv) => addLines(inv.lines, 1));
  state.data.issueInvoices.forEach((inv) => addLines(inv.lines, -1));

  return Array.from(map.values()).sort((a, b) => b.balance - a.balance);
}

function getFilteredStockRows() {
  return getStockRows().filter((row) => {
    const q = state.filters.stockSearch.trim().toLowerCase();
    const bySearch = !q || row.materialName.toLowerCase().includes(q) || row.code.toLowerCase().includes(q);
    const byGroup = state.filters.groupFilter === 'الكل' || row.mainGroup === state.filters.groupFilter;
    const byModel = state.filters.modelFilter === 'الكل' || row.model === state.filters.modelFilter;
    return bySearch && byGroup && byModel;
  });
}

function getLowStock() {
  return getStockRows().filter((row) => row.balance < row.minQty).sort((a, b) => a.balance - b.balance);
}

function getMovementLogs() {
  const rows = [];
  state.data.inboundInvoices.forEach((invoice) => {
    invoice.lines.forEach((line) => {
      rows.push({
        date: invoice.date,
        invoiceNo: invoice.invoiceNo,
        type: invoice.type,
        model: invoice.model || line.model,
        materialName: line.materialName,
        qty: line.qty,
      });
    });
  });
  state.data.issueInvoices.forEach((invoice) => {
    invoice.lines.forEach((line) => {
      rows.push({
        date: invoice.date,
        invoiceNo: invoice.invoiceNo,
        type: 'منصرف',
        model: invoice.model || line.model,
        materialName: line.materialName,
        qty: -Number(line.qty || 0),
      });
    });
  });
  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

function getLineDetails(line) {
  const material = state.data.materials.find((item) => item.id === line.materialId) || state.data.materials[0];
  return {
    materialId: material.id,
    code: material.code,
    materialName: material.name,
    mainGroup: material.mainGroup,
    model: material.model,
    unit: material.unit,
    qty: Number(line.qty || 0),
  };
}

function bindEvents() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', loginWithFirebase);

  const materialForm = document.getElementById('material-form');
  if (materialForm) materialForm.addEventListener('submit', submitMaterial);

  const openingForm = document.getElementById('opening-form');
  if (openingForm) openingForm.addEventListener('submit', (e) => submitInvoice(e, 'openingInvoices', 'opening'));

  const inboundForm = document.getElementById('inbound-form');
  if (inboundForm) inboundForm.addEventListener('submit', (e) => submitInvoice(e, 'inboundInvoices', 'inbound'));

  const issueForm = document.getElementById('issue-form');
  if (issueForm) issueForm.addEventListener('submit', (e) => submitInvoice(e, 'issueInvoices', 'issue'));

  const userForm = document.getElementById('user-form');
  if (userForm) userForm.addEventListener('submit', submitUser);

  document.querySelectorAll('[data-action="toggle-menu"]').forEach((btn) => btn.addEventListener('click', toggleMenu));
  document.querySelectorAll('[data-action="close-menu"]').forEach((btn) => btn.addEventListener('click', closeMenu));
  document.querySelectorAll('[data-action="install-app"]').forEach((btn) => btn.addEventListener('click', installApp));
  document.querySelectorAll('.nav-item, .mobile-dock-item').forEach((btn) => btn.addEventListener('click', closeMenu));
  document.querySelectorAll('[data-action="demo-login"]').forEach((btn) => btn.addEventListener('click', demoLogin));
  document.querySelectorAll('[data-action="logout"]').forEach((btn) => btn.addEventListener('click', logout));
  document.querySelectorAll('[data-action="demo-reset"]').forEach((btn) => btn.addEventListener('click', resetDemoData));
  document.querySelectorAll('[data-action="add-line"]').forEach((btn) => btn.addEventListener('click', addLine));
  document.querySelectorAll('[data-action="remove-line"]').forEach((btn) => btn.addEventListener('click', removeLine));
  document.querySelectorAll('[data-action="apply-model-recipe"]').forEach((btn) => btn.addEventListener('click', applyModelRecipeToIssue));
  document.querySelectorAll('[data-action="issue-from-recipe"]').forEach((btn) => btn.addEventListener('click', issueFromRecipeCard));
  document.querySelectorAll('[data-action="clear-recipe-search"]').forEach((btn) => btn.addEventListener('click', clearRecipeSearch));
  document.querySelectorAll('[data-action="toggle-password"]').forEach((btn) => btn.addEventListener('click', togglePasswordVisibility));
  document.querySelectorAll('[data-line-material]').forEach((el) => el.addEventListener('change', lineMaterialChanged));
  document.querySelectorAll('[data-line-qty]').forEach((el) => el.addEventListener('input', lineQtyChanged));
  document.querySelectorAll('[data-perm-toggle]').forEach((el) => el.addEventListener('change', permChanged));
  document.querySelectorAll('[data-sync-model]').forEach((el) => el.addEventListener('input', syncModelField));
  document.querySelectorAll('[data-sync-pieces]').forEach((el) => el.addEventListener('input', syncPiecesField));

  const stockSearch = document.getElementById('stock-search');
  if (stockSearch) stockSearch.addEventListener('input', (e) => {
    state.filters.stockSearch = e.target.value;
    render();
  });
  const groupFilter = document.getElementById('group-filter');
  if (groupFilter) groupFilter.addEventListener('change', (e) => {
    state.filters.groupFilter = e.target.value;
    render();
  });
  const modelFilter = document.getElementById('model-filter');
  if (modelFilter) modelFilter.addEventListener('change', (e) => {
    state.filters.modelFilter = e.target.value;
    render();
  });
  const movementModel = document.getElementById('movement-model');
  if (movementModel) movementModel.addEventListener('change', (e) => {
    state.filters.movementModel = e.target.value;
    render();
  });
  const movementType = document.getElementById('movement-type');
  if (movementType) movementType.addEventListener('change', (e) => {
    state.filters.movementType = e.target.value;
    render();
  });
  const recipeSearch = document.getElementById('recipe-search');
  if (recipeSearch) recipeSearch.addEventListener('input', (e) => {
    state.filters.recipeSearch = e.target.value;
    render();
  });
}


function handleGlobalMenuDismiss(event) {
  if (!state.ui.mobileMenuOpen) return;
  const insideSidebar = event.target.closest('.sidebar');
  const toggleButton = event.target.closest('[data-action="toggle-menu"]');
  if (!insideSidebar && !toggleButton) closeMenu();
}

function syncModelField(event) {
  const target = event.currentTarget.dataset.syncModel;
  if (!state.forms[target]) return;
  state.forms[target].model = event.currentTarget.value.toUpperCase();
}

function syncPiecesField(event) {
  const target = event.currentTarget.dataset.syncPieces;
  if (!state.forms[target]) return;
  state.forms[target].piecesCount = Math.max(1, Number(event.currentTarget.value || 1));
}

function buildIssueLinesFromRecipe(modelNo, piecesCount = 1) {
  const recipe = getRecipeByModelNo(modelNo);
  if (!recipe) return null;
  return recipe.lines.map((line) => ({
    rowId: Math.random().toString(36).slice(2),
    materialId: line.materialId,
    qty: Number(formatQty(Number(line.qty) * Number(piecesCount || 1))),
  }));
}

function applyModelRecipeToIssue(event) {
  const modelInput = document.querySelector('#issue-form input[name="model"]');
  const piecesInput = document.querySelector('#issue-form input[name="piecesCount"]');
  const modelNo = (event.currentTarget.dataset.model || modelInput?.value || state.forms.issue.model || '').toUpperCase();
  const piecesCount = Math.max(1, Number(piecesInput?.value || state.forms.issue.piecesCount || 1));
  const lines = buildIssueLinesFromRecipe(modelNo, piecesCount);
  if (!lines) {
    state.notice = 'لم يتم العثور على وصفة لهذا الموديل';
    render();
    return;
  }
  state.forms.issue.model = modelNo;
  state.forms.issue.lines = lines;
  state.notice = `تم تحميل وصفة القماش للموديل ${modelNo}`;
  render();
}

function issueFromRecipeCard(event) {
  const modelNo = event.currentTarget.dataset.model;
  const recipe = getRecipeByModelNo(modelNo);
  if (!recipe) return;
  state.forms.issue.model = recipe.modelNo;
  state.forms.issue.piecesCount = 1;
  state.forms.issue.lines = buildIssueLinesFromRecipe(recipe.modelNo, 1);
  state.route = 'issue';
  window.location.hash = '#issue';
  render();
}

function clearRecipeSearch() {
  state.filters.recipeSearch = '';
  render();
}

function togglePasswordVisibility() {
  const input = document.getElementById('auth-password');
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

function toggleMenu() {
  state.ui.mobileMenuOpen = !state.ui.mobileMenuOpen;
  render();
}

function closeMenu() {
  if (!state.ui.mobileMenuOpen) return;
  state.ui.mobileMenuOpen = false;
  render();
}

function demoLogin() {
  state.session = {
    isDemo: true,
    user: {
      uid: ADMIN_UID,
      displayName: 'مدير النظام',
      email: 'admin@erp-pro.com',
      role: 'admin',
      permissions: { ...defaultPermissions },
    },
  };
  state.route = 'dashboard';
  state.notice = 'تم الدخول إلى العرض الاحترافي';
  window.location.hash = '#dashboard';
  render();
}

async function loginWithFirebase(event) {
  event.preventDefault();
  if (!firebaseState.enabled) {
    state.notice = 'Firebase غير متاح حاليًا، تم فتح المعاينة الاحترافية';
    demoLogin();
    return;
  }
  const form = new FormData(event.currentTarget);
  const email = form.get('email');
  const password = form.get('password');
  try {
    const { signInWithEmailAndPassword } = firebaseState.modules;
    await signInWithEmailAndPassword(firebaseState.auth, email, password);
  } catch (error) {
    state.notice = 'تعذر تسجيل الدخول، تم فتح المعاينة المحلية';
    demoLogin();
  }
}

async function logout() {
  if (firebaseState.enabled && !state.session.isDemo) {
    const { signOut } = firebaseState.modules;
    await signOut(firebaseState.auth);
  }
  state.session = null;
  render();
}

function resetDemoData() {
  state.data = structuredClone(demoData);
  saveLocalData();
  seedForms();
  render();
}

async function submitMaterial(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = {
    id: form.get('code'),
    code: form.get('code'),
    name: form.get('name'),
    mainGroup: form.get('mainGroup'),
    model: form.get('model'),
    unit: form.get('unit'),
    minQty: Number(form.get('minQty') || 0),
    createdAt: new Date().toISOString(),
  };
  await upsertRecord('materials', payload, payload.id);
  seedForms();
  state.route = 'materials';
  render();
}

function addLine(event) {
  const target = event.currentTarget.dataset.form;
  state.forms[target].lines.push(makeLineItem(state.data.materials[0]?.id));
  render();
}

function removeLine(event) {
  const target = event.currentTarget.dataset.form;
  const rowId = event.currentTarget.dataset.row;
  state.forms[target].lines = state.forms[target].lines.filter((item) => item.rowId !== rowId);
  render();
}

function lineMaterialChanged(event) {
  const target = event.currentTarget.dataset.lineMaterial;
  const rowId = event.currentTarget.dataset.row;
  const line = state.forms[target].lines.find((item) => item.rowId === rowId);
  if (line) line.materialId = event.currentTarget.value;
}

function lineQtyChanged(event) {
  const target = event.currentTarget.dataset.lineQty;
  const rowId = event.currentTarget.dataset.row;
  const line = state.forms[target].lines.find((item) => item.rowId === rowId);
  if (line) line.qty = Number(event.currentTarget.value || 1);
}

async function submitInvoice(event, collectionName, formKey) {
  event.preventDefault();
  const fd = new FormData(event.currentTarget);
  const lines = state.forms[formKey].lines.map(getLineDetails);
  const payload = {
    id: fd.get('invoiceNo'),
    invoiceNo: fd.get('invoiceNo'),
    date: fd.get('date'),
    warehouse: fd.get('warehouse'),
    model: fd.get('model'),
    notes: fd.get('notes') || '',
    supplier: fd.get('supplier') || '',
    department: fd.get('department') || '',
    piecesCount: Number(fd.get('piecesCount') || state.forms[formKey].piecesCount || 1),
    type: fd.get('type') || '',
    createdBy: state.session?.user?.email || state.session?.user?.displayName || 'local',
    createdAt: new Date().toISOString(),
    lines,
  };
  await upsertRecord(collectionName, payload, payload.id);
  if (formKey === 'opening') state.forms.opening = makeInvoiceForm('OB', 'رصيد أول المدة');
  if (formKey === 'inbound') state.forms.inbound = { ...makeInvoiceForm('IN', 'وارد'), supplier: '', type: 'وارد' };
  if (formKey === 'issue') state.forms.issue = { ...makeInvoiceForm('IS', 'صرف موديل'), department: '', piecesCount: 1 };
  render();
}

function permChanged(event) {
  const key = event.currentTarget.dataset.permToggle;
  state.forms.user.permissions[key] = event.currentTarget.checked;
  render();
}

async function submitUser(event) {
  event.preventDefault();
  const fd = new FormData(event.currentTarget);
  const role = fd.get('role');
  const payload = {
    id: crypto.randomUUID(),
    uid: crypto.randomUUID().slice(0, 8),
    displayName: fd.get('displayName'),
    email: fd.get('email'),
    role,
    status: fd.get('status'),
    permissions: role === 'admin' ? { ...defaultPermissions } : { ...state.forms.user.permissions },
    createdAt: new Date().toISOString(),
  };
  await upsertRecord('users', payload, payload.id);
  seedForms();
  render();
}
