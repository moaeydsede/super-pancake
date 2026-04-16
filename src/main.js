import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  query,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  addDoc,
  updateDoc,
  getDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const APP_VERSION = '5.0.0';
const ADMIN_UID = 'JxKXouwjdadht4wSMPf1qtbeW9n1';
const firebaseConfig = {
  apiKey: "AIzaSyBc-zCwcSNsVupzAAHWeUWKGHLdcrzg2iQ",
  authDomain: "erp-pro-7307c.firebaseapp.com",
  projectId: "erp-pro-7307c",
  storageBucket: "erp-pro-7307c.firebasestorage.app",
  messagingSenderId: "481869823115",
  appId: "1:481869823115:web:68ea96d2a4ef5b732fa88e",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const permissionsCatalog = [
  { key: 'materials', label: 'إدارة المواد' },
  { key: 'openingBalance', label: 'رصيد أول المدة' },
  { key: 'inbound', label: 'فواتير الوارد والمرتجع' },
  { key: 'issue', label: 'فواتير المنصرف' },
  { key: 'stockAudit', label: 'جرد المخزون' },
  { key: 'modelMovement', label: 'حركة المخزون' },
  { key: 'userManagement', label: 'المستخدمون والصلاحيات' },
  { key: 'auditLogs', label: 'متابعة الإدارة' },
];

const navItems = [
  { route: 'dashboard', icon: '◉', title: 'الرئيسية', permission: null },
  { route: 'materials', icon: '◌', title: 'المواد', permission: 'materials' },
  { route: 'opening-balance', icon: '◎', title: 'رصيد أول المدة', permission: 'openingBalance' },
  { route: 'inbound', icon: '⬇', title: 'الوارد والمرتجع', permission: 'inbound' },
  { route: 'issue', icon: '⬆', title: 'المنصرف', permission: 'issue' },
  { route: 'stock-audit', icon: '▣', title: 'جرد المخزون', permission: 'stockAudit' },
  { route: 'movement', icon: '⇄', title: 'حركة المخزون' , permission: 'modelMovement' },
  { route: 'users', icon: '◍', title: 'المستخدمون', permission: 'userManagement' },
  { route: 'admin-monitor', icon: '◈', title: 'متابعة الإدارة', permission: 'auditLogs' },
];

const ALL_PERMISSIONS = Object.fromEntries(permissionsCatalog.map((item) => [item.key, true]));
const BASE_USER_PERMISSIONS = Object.fromEntries(permissionsCatalog.map((item) => [item.key, false]));

const emptyData = () => ({
  materials: [],
  openingInvoices: [],
  inboundInvoices: [],
  issueInvoices: [],
  users: [],
  auditLogs: [],
});

const appEl = document.getElementById('app');
let deferredInstallPrompt = null;
let profileUnsub = null;
let dataUnsubs = [];
let activeSubscriptionKey = '';

const state = {
  route: getRoute(),
  notice: '',
  booted: false,
  authReady: false,
  dataReady: false,
  syncing: false,
  ui: {
    mobileMenuOpen: false,
    installAvailable: false,
    installed: window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
    globalSearch: '',
    passwordVisible: false,
  },
  filters: {
    materialsSearch: '',
    materialsGroup: 'الكل',
    materialsModel: 'الكل',
    stockSearch: '',
    groupFilter: 'الكل',
    modelFilter: 'الكل',
    movementSearch: '',
    movementModel: 'الكل',
    movementType: 'الكل',
    invoiceSearch: {
      opening: '',
      inbound: '',
      issue: '',
    },
    auditSearch: '',
    auditAction: 'الكل',
    auditModule: 'الكل',
  },
  forms: {},
  editing: {
    materialId: null,
    opening: null,
    inbound: null,
    issue: null,
    userId: null,
  },
  session: null,
  profile: null,
  data: emptyData(),
};

function uid(prefix = 'ID') {
  if (crypto?.randomUUID) return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function getRoute() {
  const route = window.location.hash.replace('#', '').trim() || 'dashboard';
  return navItems.some((item) => item.route === route) ? route : 'dashboard';
}

function makeEmptyData() {
  return emptyData();
}

function normalizePermissions(user = {}) {
  return user.role === 'admin' ? { ...ALL_PERMISSIONS } : { ...BASE_USER_PERMISSIONS, ...(user.permissions || {}) };
}

function normalizeData(input) {
  const data = {
    materials: Array.isArray(input.materials) ? input.materials : [],
    openingInvoices: Array.isArray(input.openingInvoices) ? input.openingInvoices : [],
    inboundInvoices: Array.isArray(input.inboundInvoices) ? input.inboundInvoices : [],
    issueInvoices: Array.isArray(input.issueInvoices) ? input.issueInvoices : [],
    users: Array.isArray(input.users) ? input.users : [],
    auditLogs: Array.isArray(input.auditLogs) ? input.auditLogs : [],
  };

  data.materials = data.materials.map((item) => ({
    id: item.id || uid('MAT'),
    code: item.code || '',
    name: item.name || '',
    mainGroup: item.mainGroup || 'قطع غيار',
    model: item.model || 'M-450',
    unit: item.unit || 'قطعة',
    minQty: Number(item.minQty || 0),
    createdAt: item.createdAt || new Date().toISOString(),
    createdBy: item.createdBy || 'system',
    updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
  }));

  const normalizeInvoice = (item) => ({
    id: item.id || uid('INV'),
    invoiceNo: item.invoiceNo || '',
    date: item.date || today(),
    warehouse: item.warehouse || 'المستودع الرئيسي',
    supplier: item.supplier || '',
    department: item.department || '',
    model: item.model || 'M-450',
    type: item.type || '',
    notes: item.notes || '',
    createdBy: item.createdBy || 'system',
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
    lines: Array.isArray(item.lines)
      ? item.lines.map((line) => ({
          materialId: line.materialId || '',
          code: line.code || '',
          materialName: line.materialName || '',
          mainGroup: line.mainGroup || '',
          model: line.model || '',
          unit: line.unit || '',
          qty: Number(line.qty || 0),
        }))
      : [],
  });

  data.openingInvoices = data.openingInvoices.map(normalizeInvoice);
  data.inboundInvoices = data.inboundInvoices.map(normalizeInvoice);
  data.issueInvoices = data.issueInvoices.map(normalizeInvoice);

  data.users = data.users.map((user, index) => ({
    id: user.id || user.uid || uid('USR'),
    uid: user.uid || user.id || uid('USR'),
    username: user.username || user.email?.split('@')[0] || `user${index + 1}`,
    displayName: user.displayName || user.name || 'مستخدم',
    email: user.email || '',
    role: user.id === ADMIN_UID || user.uid === ADMIN_UID || user.role === 'admin' ? 'admin' : 'user',
    status: ['active', 'pending', 'suspended'].includes(user.status) ? user.status : 'active',
    permissions: normalizePermissions(user.id === ADMIN_UID || user.uid === ADMIN_UID ? { ...user, role: 'admin' } : user),
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: user.updatedAt || user.createdAt || new Date().toISOString(),
  }));

  data.auditLogs = data.auditLogs.map((entry) => ({
    id: entry.id || uid('AUD'),
    at: entry.at || new Date().toISOString(),
    userId: entry.userId || 'system',
    userName: entry.userName || 'System',
    module: entry.module || 'النظام',
    action: entry.action || 'سجل',
    description: entry.description || '',
    details: entry.details || '',
  }));

  return data;
}

function saveData() {}

function loadSession() {
  return null;
}

function saveSession(user) {
  state.session = user ? sanitizeSessionUser(user) : null;
}

function sanitizeSessionUser(user) {
  if (!user) return null;
  return {
    id: user.id || user.uid,
    uid: user.uid || user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    role: user.id === ADMIN_UID || user.uid === ADMIN_UID || user.role === 'admin' ? 'admin' : 'user',
    status: user.status,
    permissions: normalizePermissions(user.id === ADMIN_UID || user.uid === ADMIN_UID ? { ...user, role: 'admin' } : user),
  };
}

function clearDataSubscriptions() {
  dataUnsubs.forEach((unsubscribe) => {
    try { unsubscribe?.(); } catch {}
  });
  dataUnsubs = [];
  activeSubscriptionKey = '';
}

function resetRemoteData() {
  state.data = normalizeData(makeEmptyData());
}

function collectionPath(key) {
  return {
    materials: 'materials',
    openingInvoices: 'openingInvoices',
    inboundInvoices: 'inboundInvoices',
    issueInvoices: 'issueInvoices',
    users: 'users',
    auditLogs: 'auditLogs',
  }[key];
}

function sortByField(list, field) {
  return [...list].sort((a, b) => String(b[field] || '').localeCompare(String(a[field] || '')));
}

function resolveSnapshotData(snapshot, key) {
  const rows = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  const normalized = normalizeData({ ...makeEmptyData(), [key]: rows })[key];
  const field = key === 'auditLogs' ? 'at' : key === 'materials' ? 'createdAt' : key === 'users' ? 'createdAt' : 'date';
  return sortByField(normalized, field);
}

function subscribeCollection(key, collectionRef, readyKey, onReady) {
  return;
}

async function createAdminProfile(authUser) {
  const payload = {
    uid: authUser.uid,
    username: (authUser.email || 'admin').split('@')[0],
    displayName: authUser.displayName || 'مدير النظام',
    email: authUser.email || '',
    role: 'admin',
    status: 'active',
    permissions: { ...ALL_PERMISSIONS },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'users', authUser.uid), payload, { merge: true });
  return payload;
}

function makeReadyTracker(expectedKeys) {
  const ready = new Set();
  return (key) => {
    ready.add(key);
    if (ready.size >= expectedKeys.length) {
      state.dataReady = true;
      state.syncing = false;
      render();
    }
  };
}

function watchCollection(key, collectionName, orderField, readyKey, markReady, maxRows = null) {
  let ref = collection(db, collectionName);
  if (maxRows) {
    ref = query(ref, orderBy(orderField, 'desc'), limit(maxRows));
  } else {
    ref = query(ref, orderBy(orderField, 'desc'));
  }
  let initialized = false;
  const unsubscribe = onSnapshot(
    ref,
    (snapshot) => {
      state.data[key] = resolveSnapshotData(snapshot, key);
      if (!initialized) {
        initialized = true;
        markReady(readyKey);
      }
      render();
    },
    (error) => {
      console.error(error);
      if (!initialized) {
        initialized = true;
        markReady(readyKey);
      }
      toast('تعذر مزامنة بعض البيانات');
    },
  );
  dataUnsubs.push(unsubscribe);
}

function subscribeDomainCollections(profile) {
  const permissionsKey = JSON.stringify(profile.permissions || {});
  const nextKey = `${profile.id}:${profile.role}:${profile.status}:${permissionsKey}`;
  if (activeSubscriptionKey === nextKey) return;

  clearDataSubscriptions();
  activeSubscriptionKey = nextKey;
  state.syncing = true;
  state.dataReady = false;
  state.data.users = profile.role === 'admin' ? state.data.users : [profile];
  state.data.auditLogs = profile.role === 'admin' ? state.data.auditLogs : [];

  const expected = ['materials', 'opening', 'inbound', 'issue', 'users', 'audit'];
  const markReady = makeReadyTracker(expected);

  watchCollection('materials', 'materials', 'createdAt', 'materials', markReady);
  watchCollection('openingInvoices', 'openingInvoices', 'date', 'opening', markReady);
  watchCollection('inboundInvoices', 'inboundInvoices', 'date', 'inbound', markReady);
  watchCollection('issueInvoices', 'issueInvoices', 'date', 'issue', markReady);

  if (profile.role === 'admin' || profile.permissions?.userManagement) {
    watchCollection('users', 'users', 'createdAt', 'users', markReady);
  } else {
    state.data.users = [profile];
    markReady('users');
  }

  if (profile.role === 'admin' || profile.permissions?.auditLogs) {
    watchCollection('auditLogs', 'auditLogs', 'at', 'audit', markReady, 500);
  } else {
    state.data.auditLogs = [];
    markReady('audit');
  }

  render();
}

function attachProfileListener(authUser) {
  if (profileUnsub) {
    try { profileUnsub(); } catch {}
  }

  state.authReady = false;
  state.dataReady = false;
  state.syncing = true;
  render();

  profileUnsub = onSnapshot(
    doc(db, 'users', authUser.uid),
    async (snapshot) => {
      try {
        let profileData = snapshot.exists() ? { id: snapshot.id, uid: snapshot.id, ...snapshot.data() } : null;

        if (!profileData && authUser.uid === ADMIN_UID) {
          profileData = await createAdminProfile(authUser);
          profileData = { id: authUser.uid, uid: authUser.uid, ...profileData };
        }

        if (!profileData) {
          state.profile = null;
          saveSession(null);
          state.authReady = true;
          state.syncing = false;
          resetRemoteData();
          render();
          await signOut(auth);
          return;
        }

        const normalizedProfile = normalizeData({ ...makeEmptyData(), users: [profileData] }).users[0];
        state.profile = normalizedProfile;
        saveSession(normalizedProfile);
        state.authReady = true;

        if (normalizedProfile.status !== 'active') {
          state.syncing = false;
          resetRemoteData();
          render();
          await signOut(auth);
          return;
        }

        subscribeDomainCollections(normalizedProfile);
      } catch (error) {
        console.error(error);
        toast('تعذر تحميل بيانات المستخدم');
      }
    },
    (error) => {
      console.error(error);
      state.authReady = true;
      state.syncing = false;
      toast('تعذر ربط حساب Firebase');
      render();
    },
  );
}

async function bootstrapFirebase() {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (error) {
    console.error(error);
  }

  onAuthStateChanged(auth, (user) => {
    clearDataSubscriptions();
    resetRemoteData();
    if (!user) {
      if (profileUnsub) {
        try { profileUnsub(); } catch {}
        profileUnsub = null;
      }
      state.profile = null;
      saveSession(null);
      state.authReady = true;
      state.dataReady = false;
      state.syncing = false;
      render();
      return;
    }
    attachProfileListener(user);
  });
}

function seedForms() {
  state.forms.login = { identifier: '', password: '' };
  state.forms.material = makeMaterialForm();
  state.forms.opening = makeInvoiceForm('opening');
  state.forms.inbound = makeInvoiceForm('inbound');
  state.forms.issue = makeInvoiceForm('issue');
  state.forms.user = makeUserForm();
}

function makeMaterialForm(item = null) {
  return {
    code: item?.code || nextMaterialCode(),
    name: item?.name || '',
    mainGroup: item?.mainGroup || 'قطع غيار',
    model: item?.model || 'M-450',
    unit: item?.unit || 'قطعة',
    minQty: item?.minQty ?? 0,
  };
}

function makeInvoiceForm(kind, item = null) {
  const config = {
    opening: { prefix: 'OB', notes: 'رصيد أول المدة', model: 'M-450', type: '' },
    inbound: { prefix: 'IN', notes: 'وارد', model: 'M-450', type: 'وارد' },
    issue: { prefix: 'IS', notes: 'منصرف', model: 'M-450', type: '' },
  }[kind];

  return {
    invoiceNo: item?.invoiceNo || nextInvoiceCode(config.prefix),
    date: item?.date || today(),
    warehouse: item?.warehouse || 'المستودع الرئيسي',
    model: item?.model || config.model,
    notes: item?.notes || config.notes,
    supplier: item?.supplier || '',
    department: item?.department || '',
    type: item?.type || config.type,
    lines: item?.lines?.length
      ? item.lines.map((line) => ({ rowId: uid('ROW'), materialId: line.materialId, qty: Number(line.qty || 1) }))
      : [makeLineItem(state.data.materials[0]?.id || '')],
  };
}

function makeUserForm(item = null) {
  return {
    username: item?.username || '',
    displayName: item?.displayName || '',
    email: item?.email || '',
    password: '',
    role: item?.role || 'user',
    status: item?.status || 'active',
    permissions: item?.role === 'admin' ? { ...ALL_PERMISSIONS } : { ...BASE_USER_PERMISSIONS, ...(item?.permissions || { materials: true }) },
  };
}

function makeLineItem(materialId = '') {
  return {
    rowId: uid('ROW'),
    materialId,
    qty: 1,
  };
}

function nextMaterialCode() {
  const max = state.data.materials.reduce((acc, item) => {
    const match = String(item.code || '').match(/(\d+)$/);
    return Math.max(acc, match ? Number(match[1]) : 1000);
  }, 1000);
  return `MAT-${String(max + 1).padStart(4, '0')}`;
}

function nextInvoiceCode(prefix) {
  const sourceMap = {
    OB: state.data.openingInvoices,
    IN: state.data.inboundInvoices,
    IS: state.data.issueInvoices,
  };
  const source = sourceMap[prefix] || [];
  const year = new Date().getFullYear();
  const max = source.reduce((acc, item) => {
    const match = String(item.invoiceNo || '').match(/(\d+)$/);
    return Math.max(acc, match ? Number(match[1]) : 0);
  }, 0);
  return `${prefix}-${year}-${String(max + 1).padStart(3, '0')}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function registerPWA() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => null);
}

async function installApp() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  if (choice?.outcome === 'accepted') {
    state.ui.installAvailable = false;
    toast('تم طلب تثبيت التطبيق');
  }
  deferredInstallPrompt = null;
  render();
}

function toast(message) {
  state.notice = message;
  render();
  window.clearTimeout(toast._id);
  toast._id = window.setTimeout(() => {
    state.notice = '';
    render();
  }, 3200);
}

function hasPermission(permission) {
  if (!permission) return true;
  const current = state.session;
  if (!current) return false;
  if (current.role === 'admin') return true;
  return Boolean(current.permissions?.[permission]);
}

function isLocked() {
  return !state.session;
}

function currentUser() {
  return state.profile || null;
}

async function addAudit(action, module, description, details = '') {
  const current = currentUser();
  if (!current) return;
  const entry = {
    at: new Date().toISOString(),
    userId: current.id || current.uid || 'guest',
    userName: current.displayName || current.username || 'مستخدم',
    module,
    action,
    description,
    details,
  };
  try {
    await addDoc(collection(db, 'auditLogs'), entry);
  } catch (error) {
    console.error(error);
  }
}

function setFormValue(path, value) {
  const [root, field] = path.split('.');
  if (!state.forms[root]) return;
  state.forms[root][field] = value;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function selected(value, expected) {
  return value === expected ? 'selected' : '';
}

function checked(value) {
  return value ? 'checked' : '';
}

function routeTitle(route) {
  return navItems.find((item) => item.route === route)?.title || 'الرئيسية';
}

function getCollectionMeta(route) {
  if (route === 'opening-balance') return { key: 'openingInvoices', formKey: 'opening', title: 'رصيد أول المدة' };
  if (route === 'inbound') return { key: 'inboundInvoices', formKey: 'inbound', title: 'الوارد والمرتجع' };
  if (route === 'issue') return { key: 'issueInvoices', formKey: 'issue', title: 'المنصرف' };
  return null;
}


function rerenderAndRefocus(selector) {
  render();
  const el = appEl.querySelector(selector);
  if (!el) return;
  el.focus();
  if (typeof el.selectionStart === 'number') {
    const pos = String(el.value || '').length;
    try { el.setSelectionRange(pos, pos); } catch {}
  }
}

function renderBootLayout() {
  return `
    <div class="auth-shell">
      <section class="auth-visual luxury-card">
        <div class="auth-badge">ERP PRO FIREBASE</div>
        <h1>منصة احترافية متعددة الأجهزة</h1>
        <p>مزامنة مباشرة بين الجوالات مع قاعدة بيانات Firebase وصلاحيات كاملة وسجل إداري حي.</p>
      </section>
      <section class="auth-panel glass-card boot-panel">
        <div class="spinner-orb"></div>
        <h3>جاري التهيئة</h3>
        <p class="auth-note">ربط المصادقة والبيانات المباشرة</p>
      </section>
    </div>
  `;
}

function render() {
  if (!state.authReady || (state.session && !state.dataReady && state.syncing)) {
    appEl.innerHTML = renderBootLayout();
    return;
  }

  if (isLocked()) {
    appEl.innerHTML = renderAuthLayout();
    return;
  }

  const currentRoute = navItems.find((item) => item.route === state.route);
  if (currentRoute && !hasPermission(currentRoute.permission)) {
    state.route = 'dashboard';
    window.location.hash = '#dashboard';
  }

  appEl.innerHTML = `
    <div class="app-shell ${state.ui.mobileMenuOpen ? 'menu-open' : ''}">
      <button class="mobile-backdrop" type="button" data-action="close-menu" aria-label="إغلاق"></button>
      ${renderSidebar()}
      <main class="main-shell">
        ${renderTopbar()}
        ${renderSearchPanel()}
        ${state.notice ? `<div class="notice-bar glass-card">${escapeHtml(state.notice)}</div>` : ''}
        <section class="content-shell">${renderView()}</section>
      </main>
      ${renderMobileDock()}
      ${renderInstallFab()}
    </div>
  `;
}

function renderAuthLayout() {
  return `
    <div class="auth-shell">
      <section class="auth-visual luxury-card">
        <div class="auth-badge">ERP PRO FIREBASE</div>
        <h1>إدارة مواد وفواتير وصلاحيات باحترافية كاملة</h1>
        <p>نسخة Firebase متزامنة بين أكثر من موبايل مع مصادقة آمنة، صلاحيات تفصيلية، ومتابعة حركة الإدارة لحظيًا.</p>
        <div class="hero-stats auth-stats">
          <div class="stat-card"><span>المواد</span><strong>${state.data.materials.length}</strong></div>
          <div class="stat-card"><span>الفواتير</span><strong>${state.data.openingInvoices.length + state.data.inboundInvoices.length + state.data.issueInvoices.length}</strong></div>
          <div class="stat-card"><span>المستخدمون</span><strong>${state.data.users.length}</strong></div>
        </div>
      </section>

      <section class="auth-panel glass-card">
        <div class="section-head compact">
          <div>
            <h3>تسجيل الدخول</h3>
            <p>الدخول عبر Firebase Authentication</p>
          </div>
        </div>
        <form id="login-form" class="form-grid auth-form single-column-form">
          <label>
            <span>البريد الإلكتروني</span>
            <input name="identifier" data-bind="login.identifier" value="${escapeHtml(state.forms.login.identifier)}" placeholder="name@example.com" autocomplete="username" required />
          </label>
          <label>
            <span>كلمة المرور</span>
            <div class="password-wrap">
              <input name="password" data-bind="login.password" value="${escapeHtml(state.forms.login.password)}" type="${state.ui.passwordVisible ? 'text' : 'password'}" placeholder="••••••••" autocomplete="current-password" required />
              <button type="button" class="ghost-mini-btn" data-action="toggle-password">${state.ui.passwordVisible ? 'إخفاء' : 'إظهار'}</button>
            </div>
          </label>
          <button class="primary-btn full" type="submit">دخول النظام</button>
          <div class="auth-note">Firebase Auth • Firestore Realtime Sync • PWA</div>
        </form>
      </section>
    </div>
  `;
}

function renderSidebar() {
  const user = state.session;
  return `
    <aside class="sidebar glass-card ${state.ui.mobileMenuOpen ? 'open' : ''}">
      <div class="sidebar-mobile-head">
        <button class="icon-btn" type="button" data-action="close-menu">✕</button>
      </div>
      <div class="brand-block">
        <div class="brand-logo">EP</div>
        <div>
          <div class="brand-title">ERP PRO</div>
          <div class="brand-subtitle">Luxury Inventory Suite</div>
        </div>
      </div>
      <div class="profile-card">
        <div class="avatar-ring">${escapeHtml((user?.displayName || 'U').slice(0, 1))}</div>
        <div>
          <div class="profile-name">${escapeHtml(user?.displayName || '')}</div>
          <div class="profile-role">${user?.role === 'admin' ? 'Administrator' : escapeHtml(user?.username || '')}</div>
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
        <div class="mini-kpi"><span>الإصدار</span><strong>${APP_VERSION}</strong></div>
        <div class="mini-kpi"><span>التثبيت</span><strong>${state.ui.installed ? 'Installed' : 'Browser Mode'}</strong></div>
      </div>
    </aside>
  `;
}

function renderTopbar() {
  const summary = getSummary();
  return `
    <header class="topbar glass-card">
      <div>
        <h1 class="page-title">${routeTitle(state.route)}</h1>
        <p class="page-subtitle">إدارة مواد وفواتير وصلاحيات بواجهة احترافية متوافقة مع الجوال</p>
      </div>
      <div class="topbar-actions full-width-mobile">
        <button class="icon-btn mobile-only" type="button" data-action="toggle-menu">☰</button>
        <label class="top-search">
          <span>بحث احترافي</span>
          <input placeholder="ابحث في المواد، الفواتير، المستخدمين" value="${escapeHtml(state.ui.globalSearch)}" data-ui-field="globalSearch" />
        </label>
        <div class="status-pill connected">${state.session?.role === 'admin' ? 'ADMIN' : 'USER'}</div>
        <div class="status-pill demo">STOCK ${summary.totalStock}</div>
        ${state.ui.installAvailable && !state.ui.installed ? '<button class="secondary-btn install-inline" type="button" data-action="install-app">تثبيت التطبيق</button>' : ''}
        <button class="ghost-btn" type="button" data-action="logout">خروج</button>
      </div>
    </header>
  `;
}

function renderSearchPanel() {
  const q = state.ui.globalSearch.trim();
  if (!q) return '';
  const results = getGlobalSearchResults(q);
  return `
    <section class="glass-card quick-search-panel">
      <div class="section-head compact">
        <div>
          <h3>نتائج البحث</h3>
          <p>${escapeHtml(q)} • ${results.total} نتيجة</p>
        </div>
        <button class="ghost-mini-btn" type="button" data-action="clear-global-search">مسح</button>
      </div>
      <div class="search-grid">
        ${renderSearchBlock('مواد', results.materials.map((item) => `<div class="search-hit"><strong>${escapeHtml(item.code)}</strong><span>${escapeHtml(item.name)} • ${escapeHtml(item.model)}</span></div>`))}
        ${renderSearchBlock('فواتير', results.invoices.map((item) => `<div class="search-hit"><strong>${escapeHtml(item.invoiceNo)}</strong><span>${escapeHtml(item.kind)} • ${escapeHtml(item.date)} • ${escapeHtml(item.model || item.warehouse || '-')}</span></div>`))}
        ${state.session?.role === 'admin' ? renderSearchBlock('مستخدمون', results.users.map((item) => `<div class="search-hit"><strong>${escapeHtml(item.username)}</strong><span>${escapeHtml(item.displayName)} • ${escapeHtml(item.role)}</span></div>`)) : ''}
      </div>
    </section>
  `;
}

function renderSearchBlock(title, rows) {
  return `
    <div class="search-block">
      <div class="search-block-head">${title}</div>
      <div class="search-block-body">
        ${rows.length ? rows.join('') : '<div class="empty-state small">لا توجد نتائج</div>'}
      </div>
    </div>
  `;
}

function renderMobileDock() {
  const items = navItems.filter((item) => hasPermission(item.permission));
  return `
    <nav class="mobile-dock glass-card">
      ${items
        .map(
          (item) => `
            <a class="mobile-dock-item ${state.route === item.route ? 'active' : ''}" href="#${item.route}">
              <span class="mobile-dock-icon">${item.icon}</span>
              <span>${item.title}</span>
            </a>
          `,
        )
        .join('')}
    </nav>
  `;
}

function renderInstallFab() {
  if (!state.ui.installAvailable || state.ui.installed) return '';
  return `<button class="install-fab" type="button" data-action="install-app">تثبيت</button>`;
}

function renderView() {
  switch (state.route) {
    case 'dashboard':
      return renderDashboard();
    case 'materials':
      return renderMaterials();
    case 'opening-balance':
      return renderInvoiceScreen('opening-balance');
    case 'inbound':
      return renderInvoiceScreen('inbound');
    case 'issue':
      return renderInvoiceScreen('issue');
    case 'stock-audit':
      return renderStockAudit();
    case 'movement':
      return renderMovement();
    case 'users':
      return renderUsers();
    case 'admin-monitor':
      return renderAdminMonitor();
    default:
      return renderDashboard();
  }
}

function renderDashboard() {
  const summary = getSummary();
  const lowStock = getLowStock();
  const latestInvoices = [...state.data.inboundInvoices, ...state.data.issueInvoices, ...state.data.openingInvoices]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 5);

  return `
    <div class="dashboard-grid">
      <section class="hero-banner luxury-card">
        <div class="hero-copy">
          <span class="hero-tag">EXECUTIVE CONTROL CENTER</span>
          <h2>لوحة قيادة تنفيذية فخمة للمخزون والفواتير والمراقبة</h2>
          <p>تحكم كامل بالمواد، فواتير الوارد والمنصرف، الصلاحيات، وسجل حركات الإدارة في تجربة سريعة ومريحة على الموبايل.</p>
          <div class="hero-actions">
            ${hasPermission('materials') ? '<a href="#materials" class="primary-btn">إدارة المواد</a>' : ''}
            ${hasPermission('inbound') ? '<a href="#inbound" class="secondary-btn">فاتورة وارد</a>' : ''}
          </div>
        </div>
        <div class="hero-metrics">
          <div class="metric-orb"><span>المخزون الكلي</span><strong>${summary.totalStock}</strong></div>
          <div class="metric-orb"><span>مواد حرجة</span><strong>${lowStock.length}</strong></div>
          <div class="metric-orb"><span>سجلات اليوم</span><strong>${summary.todayActions}</strong></div>
        </div>
      </section>

      <section class="kpi-row">
        ${[
          ['المواد', summary.materials],
          ['الوارد', summary.inboundInvoices],
          ['المنصرف', summary.issueInvoices],
          ['المستخدمون', summary.users],
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
            <h3>أحدث الفواتير</h3>
            <p>ملخص سريع لآخر العمليات المسجلة</p>
          </div>
        </div>
        <div class="invoice-preview-stack">
          ${latestInvoices
            .map(
              (invoice) => `
                <article class="invoice-mini-card">
                  <div class="invoice-mini-head">
                    <strong>${escapeHtml(invoice.invoiceNo)}</strong>
                    <span>${escapeHtml(invoice.date)}</span>
                  </div>
                  <div class="mini-tags">
                    <span>${escapeHtml(invoice.model || '-')}</span>
                    <span>${escapeHtml(invoice.type || invoice.department || 'حركة')}</span>
                    <span>${escapeHtml(invoice.warehouse || '-')}</span>
                  </div>
                  <div class="mini-lines">
                    ${invoice.lines.slice(0, 3).map((line) => `<div><span>${escapeHtml(line.materialName)}</span><strong>${escapeHtml(line.qty)} ${escapeHtml(line.unit)}</strong></div>`).join('')}
                  </div>
                </article>
              `,
            )
            .join('')}
        </div>
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
                .slice(0, 6)
                .map(
                  (row) => `
                    <div class="stack-item warning">
                      <div>
                        <strong>${escapeHtml(row.materialName)}</strong>
                        <span>${escapeHtml(row.mainGroup)} • ${escapeHtml(row.model)}</span>
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
            <h3>التوزيع حسب المجموعة</h3>
            <p>تجميع المخزون حسب المجموعات الرئيسية</p>
          </div>
        </div>
        <div class="bar-chart">
          ${Object.entries(summary.byGroup)
            .map(([group, value]) => {
              const max = Math.max(...Object.values(summary.byGroup), 1);
              return `
                <div class="bar-row">
                  <span>${escapeHtml(group)}</span>
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

function renderMaterials() {
  const rows = getFilteredMaterials();
  const editing = state.editing.materialId ? state.data.materials.find((item) => item.id === state.editing.materialId) : null;
  const groups = ['الكل', ...new Set(state.data.materials.map((item) => item.mainGroup))];
  const models = ['الكل', ...new Set(state.data.materials.map((item) => item.model))];

  return `
    <div class="two-column-layout">
      <section class="glass-card sticky-panel">
        <div class="section-head">
          <div>
            <h3>${editing ? 'تعديل المادة' : 'إضافة مادة جديدة'}</h3>
            <p>إضافة، تعديل، ومنع حذف المواد المرتبطة بفواتير</p>
          </div>
          ${editing ? '<button class="ghost-btn" type="button" data-action="cancel-material-edit">إلغاء</button>' : ''}
        </div>
        <form id="material-form" class="form-grid">
          <label><span>كود المادة</span><input name="code" data-bind="material.code" value="${escapeHtml(state.forms.material.code)}" required /></label>
          <label><span>اسم المادة</span><input name="name" data-bind="material.name" value="${escapeHtml(state.forms.material.name)}" required /></label>
          <label><span>المجموعة الرئيسية</span><input name="mainGroup" data-bind="material.mainGroup" value="${escapeHtml(state.forms.material.mainGroup)}" required /></label>
          <label><span>الموديل</span><input name="model" data-bind="material.model" value="${escapeHtml(state.forms.material.model)}" required /></label>
          <label><span>الوحدة</span><input name="unit" data-bind="material.unit" value="${escapeHtml(state.forms.material.unit)}" required /></label>
          <label><span>الحد الأدنى</span><input name="minQty" type="number" min="0" data-bind="material.minQty" value="${escapeHtml(state.forms.material.minQty)}" required /></label>
          <div class="action-row full">
            <button class="primary-btn" type="submit">${editing ? 'حفظ التعديل' : 'حفظ المادة'}</button>
          </div>
        </form>
      </section>

      <section class="glass-card">
        <div class="section-head">
          <div>
            <h3>دليل المواد</h3>
            <p>بحث احترافي، تصفية بالمجموعة والموديل، وتعديل أو حذف مباشر</p>
          </div>
        </div>
        <div class="filters-row">
          <label><span>بحث</span><input value="${escapeHtml(state.filters.materialsSearch)}" data-filter="materialsSearch" placeholder="اسم المادة أو الكود" /></label>
          <label><span>المجموعة</span>${renderSelect('materialsGroup', groups, state.filters.materialsGroup, 'data-filter="materialsGroup"')}</label>
          <label><span>الموديل</span>${renderSelect('materialsModel', models, state.filters.materialsModel, 'data-filter="materialsModel"')}</label>
        </div>
        ${renderTable(
          ['الكود', 'المادة', 'المجموعة', 'الموديل', 'الوحدة', 'الحد الأدنى', 'الإجراءات'],
          rows.map((item) => [
            escapeHtml(item.code),
            escapeHtml(item.name),
            escapeHtml(item.mainGroup),
            escapeHtml(item.model),
            escapeHtml(item.unit),
            escapeHtml(item.minQty),
            `<div class="table-actions"><button class="ghost-mini-btn" data-action="edit-material" data-id="${escapeHtml(item.id)}">تعديل</button><button class="danger-mini-btn" data-action="delete-material" data-id="${escapeHtml(item.id)}">حذف</button></div>`,
          ]),
        )}
      </section>
    </div>
  `;
}

function renderInvoiceScreen(route) {
  const meta = getCollectionMeta(route);
  const form = state.forms[meta.formKey];
  const list = filterInvoices(meta.formKey, state.data[meta.key]);
  const editing = state.editing[meta.formKey] ? state.data[meta.key].find((item) => item.id === state.editing[meta.formKey]) : null;

  return `
    <div class="two-column-layout invoice-layout">
      <section class="glass-card sticky-panel">
        <div class="section-head">
          <div>
            <h3>${editing ? `تعديل فاتورة ${meta.title}` : `إضافة فاتورة ${meta.title}`}</h3>
            <p>إضافة متعددة البنود مع حفظ وتعديل وحذف</p>
          </div>
          <div class="action-row">
            ${editing ? `<button class="ghost-btn" type="button" data-action="cancel-invoice-edit" data-form="${meta.formKey}">إلغاء</button>` : ''}
            <button class="ghost-btn" type="button" data-action="add-line" data-form="${meta.formKey}">إضافة بند</button>
          </div>
        </div>

        <form id="${meta.formKey}-form" class="form-grid invoice-form">
          <label><span>رقم الفاتورة</span><input name="invoiceNo" data-bind="${meta.formKey}.invoiceNo" value="${escapeHtml(form.invoiceNo)}" required /></label>
          <label><span>التاريخ</span><input name="date" type="date" data-bind="${meta.formKey}.date" value="${escapeHtml(form.date)}" required /></label>
          <label><span>المستودع</span><input name="warehouse" data-bind="${meta.formKey}.warehouse" value="${escapeHtml(form.warehouse)}" required /></label>
          <label><span>الموديل</span><input name="model" data-bind="${meta.formKey}.model" value="${escapeHtml(form.model)}" required /></label>
          ${meta.formKey === 'inbound' ? `
            <label><span>نوع الحركة</span>
              <select name="type" data-bind="inbound.type">
                <option value="وارد" ${selected(form.type, 'وارد')}>وارد</option>
                <option value="مرتجع" ${selected(form.type, 'مرتجع')}>مرتجع</option>
              </select>
            </label>
            <label><span>المورد / الجهة</span><input name="supplier" data-bind="inbound.supplier" value="${escapeHtml(form.supplier)}" /></label>
          ` : ''}
          ${meta.formKey === 'issue' ? `<label><span>القسم / الجهة المستفيدة</span><input name="department" data-bind="issue.department" value="${escapeHtml(form.department)}" /></label>` : ''}
          <label class="full"><span>ملاحظات</span><textarea name="notes" data-bind="${meta.formKey}.notes">${escapeHtml(form.notes)}</textarea></label>
          <div class="full line-items-card">
            <div class="line-items-head">
              <strong>بنود الفاتورة</strong>
              <span>${form.lines.length} بند</span>
            </div>
            ${form.lines.map((line, index) => renderLineItem(meta.formKey, line, index)).join('')}
          </div>
          <div class="action-row full">
            <button class="primary-btn" type="submit">${editing ? 'حفظ التعديل' : 'حفظ الفاتورة'}</button>
          </div>
        </form>
      </section>

      <section class="glass-card">
        <div class="section-head">
          <div>
            <h3>سجل الفواتير</h3>
            <p>بحث مباشر وتحرير وحذف الفواتير</p>
          </div>
        </div>
        <div class="filters-row single-filter-row">
          <label><span>بحث في الفواتير</span><input value="${escapeHtml(state.filters.invoiceSearch[meta.formKey])}" data-invoice-filter="${meta.formKey}" placeholder="رقم الفاتورة أو المادة أو الموديل" /></label>
        </div>
        <div class="invoice-preview-stack long-list">
          ${list.length
            ? list.map((invoice) => renderInvoiceCard(meta.formKey, invoice)).join('')
            : '<div class="empty-state">لا توجد نتائج مطابقة</div>'}
        </div>
      </section>
    </div>
  `;
}

function renderLineItem(formKey, line, index) {
  const material = state.data.materials.find((item) => item.id === line.materialId) || state.data.materials[0];
  return `
    <div class="line-item-row">
      <label>
        <span>المادة ${index + 1}</span>
        <select data-line-form="${formKey}" data-line-row="${line.rowId}" data-line-field="materialId">
          ${state.data.materials.map((item) => `<option value="${escapeHtml(item.id)}" ${selected(item.id, line.materialId || material?.id)}>${escapeHtml(item.code)} — ${escapeHtml(item.name)}</option>`).join('')}
        </select>
      </label>
      <label>
        <span>الكمية</span>
        <input type="number" min="1" value="${escapeHtml(line.qty)}" data-line-form="${formKey}" data-line-row="${line.rowId}" data-line-field="qty" />
      </label>
      <div class="line-meta">
        <span>${escapeHtml(material?.mainGroup || '-')}</span>
        <strong>${escapeHtml(material?.model || '-')}</strong>
      </div>
      ${state.forms[formKey].lines.length > 1 ? `<button class="danger-icon" type="button" data-action="remove-line" data-form="${formKey}" data-row="${line.rowId}">×</button>` : '<div></div>'}
    </div>
  `;
}

function renderInvoiceCard(formKey, invoice) {
  return `
    <article class="invoice-mini-card detailed-card">
      <div class="invoice-mini-head">
        <strong>${escapeHtml(invoice.invoiceNo)}</strong>
        <span>${escapeHtml(invoice.date)}</span>
      </div>
      <div class="mini-tags">
        <span>${escapeHtml(invoice.model || '-')}</span>
        <span>${escapeHtml(invoice.type || invoice.department || 'حركة')}</span>
        <span>${escapeHtml(invoice.warehouse || '-')}</span>
      </div>
      <div class="mini-lines">
        ${invoice.lines.map((line) => `<div><span>${escapeHtml(line.materialName)}</span><strong>${escapeHtml(line.qty)} ${escapeHtml(line.unit)}</strong></div>`).join('')}
      </div>
      <div class="table-actions invoice-card-actions">
        <button class="ghost-mini-btn" data-action="edit-invoice" data-form="${formKey}" data-id="${escapeHtml(invoice.id)}">تعديل</button>
        <button class="danger-mini-btn" data-action="delete-invoice" data-form="${formKey}" data-id="${escapeHtml(invoice.id)}">حذف</button>
      </div>
    </article>
  `;
}

function renderStockAudit() {
  const rows = getFilteredStockRows();
  const groups = ['الكل', ...new Set(state.data.materials.map((item) => item.mainGroup))];
  const models = ['الكل', ...new Set(state.data.materials.map((item) => item.model))];
  return `
    <div class="stack-layout">
      <section class="glass-card">
        <div class="section-head">
          <div>
            <h3>جرد المخزون</h3>
            <p>فلترة فورية حسب المادة والمجموعة والموديل</p>
          </div>
        </div>
        <div class="filters-row">
          <label><span>بحث</span><input value="${escapeHtml(state.filters.stockSearch)}" data-filter="stockSearch" placeholder="اسم المادة أو الكود" /></label>
          <label><span>المجموعة</span>${renderSelect('groupFilter', groups, state.filters.groupFilter, 'data-filter="groupFilter"')}</label>
          <label><span>الموديل</span>${renderSelect('modelFilter', models, state.filters.modelFilter, 'data-filter="modelFilter"')}</label>
        </div>
        ${renderTable(
          ['الكود', 'المادة', 'المجموعة', 'الموديل', 'الوحدة', 'الرصيد الحالي', 'الحد الأدنى'],
          rows.map((row) => [
            escapeHtml(row.code),
            escapeHtml(row.materialName),
            escapeHtml(row.mainGroup),
            escapeHtml(row.model),
            escapeHtml(row.unit),
            badgeNumber(row.balance),
            escapeHtml(row.minQty),
          ]),
        )}
      </section>
    </div>
  `;
}

function renderMovement() {
  const logs = getFilteredMovements();
  const models = ['الكل', ...new Set(getMovementLogs().map((item) => item.model).filter(Boolean))];
  return `
    <div class="stack-layout">
      <section class="glass-card">
        <div class="section-head">
          <div>
            <h3>حركة الوارد والمنصرف</h3>
            <p>متابعة مخزون تفصيلية حسب الموديل ونوع الحركة مع بحث مباشر</p>
          </div>
        </div>
        <div class="filters-row compact-grid three-on-wide">
          <label><span>بحث</span><input value="${escapeHtml(state.filters.movementSearch)}" data-filter="movementSearch" placeholder="رقم الفاتورة أو المادة" /></label>
          <label><span>الموديل</span>${renderSelect('movementModel', models, state.filters.movementModel, 'data-filter="movementModel"')}</label>
          <label><span>نوع الحركة</span>${renderSelect('movementType', ['الكل', 'وارد', 'مرتجع', 'منصرف', 'رصيد أول المدة'], state.filters.movementType, 'data-filter="movementType"')}</label>
        </div>
        ${renderTable(
          ['التاريخ', 'رقم الفاتورة', 'نوع الحركة', 'الموديل', 'المادة', 'الكمية'],
          logs.map((item) => [
            escapeHtml(item.date),
            escapeHtml(item.invoiceNo),
            escapeHtml(item.type),
            escapeHtml(item.model || '-'),
            escapeHtml(item.materialName),
            badgeNumber(item.qty),
          ]),
        )}
      </section>
    </div>
  `;
}

function renderUsers() {
  const editing = state.editing.userId ? state.data.users.find((item) => item.id === state.editing.userId) : null;
  return `
    <div class="two-column-layout">
      <section class="glass-card sticky-panel">
        <div class="section-head">
          <div>
            <h3>${editing ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</h3>
            <p>إدارة مستخدمين Firebase وصلاحيات تفصيلية</p>
          </div>
          ${editing ? '<button class="ghost-btn" type="button" data-action="cancel-user-edit">إلغاء</button>' : ''}
        </div>
        <form id="user-form" class="form-grid">
          <label><span>اسم المستخدم</span><input name="username" data-bind="user.username" value="${escapeHtml(state.forms.user.username)}" required /></label>
          <label><span>الاسم الظاهر</span><input name="displayName" data-bind="user.displayName" value="${escapeHtml(state.forms.user.displayName)}" required /></label>
          <label><span>البريد الإلكتروني</span><input name="email" type="email" data-bind="user.email" value="${escapeHtml(state.forms.user.email)}" ${editing ? 'readonly' : ''} required /></label>
          <label><span>كلمة المرور ${editing ? '(للمستخدم الجديد فقط)' : ''}</span><input name="password" type="password" data-bind="user.password" value="${escapeHtml(state.forms.user.password)}" ${editing ? 'placeholder="تُنشأ عند إضافة مستخدم جديد"' : 'required'} /></label>
          <label><span>الدور</span>
            <select name="role" data-bind="user.role" ${editing?.id === ADMIN_UID ? 'disabled' : ''}>
              <option value="user" ${selected(state.forms.user.role, 'user')}>User</option>
              <option value="admin" ${selected(state.forms.user.role, 'admin')}>Admin</option>
            </select>
          </label>
          <label><span>الحالة</span>
            <select name="status" data-bind="user.status" ${editing?.id === ADMIN_UID ? 'disabled' : ''}>
              <option value="active" ${selected(state.forms.user.status, 'active')}>Active</option>
              <option value="pending" ${selected(state.forms.user.status, 'pending')}>Pending</option>
              <option value="suspended" ${selected(state.forms.user.status, 'suspended')}>Suspended</option>
            </select>
          </label>
          <div class="full permission-grid">
            ${permissionsCatalog
              .map(
                (perm) => `
                  <label class="permission-chip ${state.forms.user.permissions[perm.key] ? 'on' : ''} ${state.forms.user.role === 'admin' || editing?.id === ADMIN_UID ? 'disabled' : ''}">
                    <input type="checkbox" data-permission="${perm.key}" ${checked(state.forms.user.permissions[perm.key])} ${state.forms.user.role === 'admin' || editing?.id === ADMIN_UID ? 'disabled' : ''} />
                    <span>${perm.label}</span>
                  </label>
                `,
              )
              .join('')}
          </div>
          <div class="action-row full"><button class="primary-btn" type="submit">${editing ? 'حفظ التعديل' : 'حفظ المستخدم'}</button></div>
        </form>
      </section>

      <section class="glass-card">
        <div class="section-head">
          <div>
            <h3>سجل المستخدمين</h3>
            <p>حسابات Firebase وصلاحيات الوصول</p>
          </div>
        </div>
        ${renderTable(
          ['المستخدم', 'الاسم', 'البريد', 'الدور', 'الحالة', 'الصلاحيات', 'الإجراءات'],
          state.data.users.map((user) => [
            escapeHtml(user.username),
            escapeHtml(user.displayName),
            escapeHtml(user.email),
            user.role === 'admin' ? '<span class="status-chip success">Admin</span>' : '<span class="status-chip info">User</span>',
            statusText(user.status),
            Object.entries(user.permissions || {})
              .filter(([, enabled]) => enabled)
              .map(([key]) => permissionsCatalog.find((item) => item.key === key)?.label)
              .filter(Boolean)
              .map((text) => escapeHtml(text))
              .join(' • '),
            `<div class="table-actions"><button class="ghost-mini-btn" data-action="edit-user" data-id="${escapeHtml(user.id)}">تعديل</button>${user.id !== state.session?.id && user.id !== ADMIN_UID ? `<button class="danger-mini-btn" data-action="delete-user" data-id="${escapeHtml(user.id)}">تعطيل</button>` : ''}</div>`,
          ]),
        )}
      </section>
    </div>
  `;
}

function renderAdminMonitor() {
  const logs = getFilteredAuditLogs();
  const actions = ['الكل', ...new Set(state.data.auditLogs.map((item) => item.action))];
  const modules = ['الكل', ...new Set(state.data.auditLogs.map((item) => item.module))];
  return `
    <div class="stack-layout">
      <section class="glass-card">
        <div class="section-head">
          <div>
            <h3>شاشة متابعة حركات الإدارة</h3>
            <p>سجل كامل لتسجيل الدخول والإضافة والتعديل والحذف للمراجعة الإدارية</p>
          </div>
        </div>
        <div class="filters-row three-on-wide">
          <label><span>بحث</span><input value="${escapeHtml(state.filters.auditSearch)}" data-filter="auditSearch" placeholder="الوصف أو اسم المستخدم" /></label>
          <label><span>الإجراء</span>${renderSelect('auditAction', actions, state.filters.auditAction, 'data-filter="auditAction"')}</label>
          <label><span>الوحدة</span>${renderSelect('auditModule', modules, state.filters.auditModule, 'data-filter="auditModule"')}</label>
        </div>
        ${renderTable(
          ['الوقت', 'المستخدم', 'الوحدة', 'الإجراء', 'الوصف', 'تفاصيل'],
          logs.map((item) => [
            escapeHtml(formatDateTime(item.at)),
            escapeHtml(item.userName),
            escapeHtml(item.module),
            `<span class="status-chip info">${escapeHtml(item.action)}</span>`,
            escapeHtml(item.description),
            escapeHtml(item.details || '-'),
          ]),
        )}
      </section>
    </div>
  `;
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

function renderSelect(id, options, current, extra = '') {
  return `
    <select id="${id}" ${extra}>
      ${options.map((item) => `<option value="${escapeHtml(item)}" ${selected(item, current)}>${escapeHtml(item)}</option>`).join('')}
    </select>
  `;
}

function badgeNumber(value) {
  const type = Number(value) < 0 ? 'negative' : Number(value) === 0 ? 'neutral' : 'positive';
  return `<span class="delta-pill ${type}">${escapeHtml(value)}</span>`;
}

function statusText(value) {
  const mapping = {
    active: '<span class="status-chip success">Active</span>',
    pending: '<span class="status-chip warning">Pending</span>',
    suspended: '<span class="status-chip danger">Suspended</span>',
  };
  return mapping[value] || `<span class="status-chip info">${escapeHtml(value)}</span>`;
}

function getSummary() {
  const rows = getStockRows();
  const todayStr = today();
  return {
    materials: state.data.materials.length,
    openingInvoices: state.data.openingInvoices.length,
    inboundInvoices: state.data.inboundInvoices.length,
    issueInvoices: state.data.issueInvoices.length,
    users: state.data.users.length,
    totalStock: rows.reduce((sum, row) => sum + row.balance, 0),
    byGroup: rows.reduce((acc, row) => {
      acc[row.mainGroup] = (acc[row.mainGroup] || 0) + row.balance;
      return acc;
    }, {}),
    todayActions: state.data.auditLogs.filter((item) => String(item.at).slice(0, 10) === todayStr).length,
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

  state.data.openingInvoices.forEach((invoice) => addLines(invoice.lines, 1));
  state.data.inboundInvoices.forEach((invoice) => addLines(invoice.lines, 1));
  state.data.issueInvoices.forEach((invoice) => addLines(invoice.lines, -1));

  return Array.from(map.values()).sort((a, b) => a.materialName.localeCompare(b.materialName, 'ar'));
}

function getFilteredMaterials() {
  const q = state.filters.materialsSearch.trim().toLowerCase();
  return state.data.materials.filter((item) => {
    const bySearch = !q || [item.code, item.name, item.mainGroup, item.model].join(' ').toLowerCase().includes(q);
    const byGroup = state.filters.materialsGroup === 'الكل' || item.mainGroup === state.filters.materialsGroup;
    const byModel = state.filters.materialsModel === 'الكل' || item.model === state.filters.materialsModel;
    return bySearch && byGroup && byModel;
  });
}

function getFilteredStockRows() {
  const q = state.filters.stockSearch.trim().toLowerCase();
  return getStockRows().filter((row) => {
    const bySearch = !q || [row.materialName, row.code, row.mainGroup, row.model].join(' ').toLowerCase().includes(q);
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
  state.data.openingInvoices.forEach((invoice) => {
    invoice.lines.forEach((line) => rows.push({ date: invoice.date, invoiceNo: invoice.invoiceNo, type: 'رصيد أول المدة', model: invoice.model || line.model, materialName: line.materialName, qty: line.qty }));
  });
  state.data.inboundInvoices.forEach((invoice) => {
    invoice.lines.forEach((line) => rows.push({ date: invoice.date, invoiceNo: invoice.invoiceNo, type: invoice.type || 'وارد', model: invoice.model || line.model, materialName: line.materialName, qty: line.qty }));
  });
  state.data.issueInvoices.forEach((invoice) => {
    invoice.lines.forEach((line) => rows.push({ date: invoice.date, invoiceNo: invoice.invoiceNo, type: 'منصرف', model: invoice.model || line.model, materialName: line.materialName, qty: line.qty }));
  });
  return rows.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function getFilteredMovements() {
  const q = state.filters.movementSearch.trim().toLowerCase();
  return getMovementLogs().filter((entry) => {
    const bySearch = !q || [entry.invoiceNo, entry.materialName, entry.model, entry.type].join(' ').toLowerCase().includes(q);
    const byModel = state.filters.movementModel === 'الكل' || entry.model === state.filters.movementModel;
    const byType = state.filters.movementType === 'الكل' || entry.type === state.filters.movementType;
    return bySearch && byModel && byType;
  });
}

function getFilteredAuditLogs() {
  const q = state.filters.auditSearch.trim().toLowerCase();
  return state.data.auditLogs.filter((entry) => {
    const bySearch = !q || [entry.userName, entry.description, entry.details, entry.module].join(' ').toLowerCase().includes(q);
    const byAction = state.filters.auditAction === 'الكل' || entry.action === state.filters.auditAction;
    const byModule = state.filters.auditModule === 'الكل' || entry.module === state.filters.auditModule;
    return bySearch && byAction && byModule;
  });
}

function filterInvoices(formKey, collection) {
  const q = state.filters.invoiceSearch[formKey].trim().toLowerCase();
  return collection
    .filter((invoice) => {
      if (!q) return true;
      const haystack = [
        invoice.invoiceNo,
        invoice.date,
        invoice.warehouse,
        invoice.model,
        invoice.supplier,
        invoice.department,
        invoice.type,
        invoice.notes,
        ...invoice.lines.map((line) => `${line.materialName} ${line.code}`),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function getGlobalSearchResults(query) {
  const q = query.trim().toLowerCase();
  const materials = state.data.materials.filter((item) => [item.code, item.name, item.mainGroup, item.model].join(' ').toLowerCase().includes(q)).slice(0, 5);
  const invoices = [...state.data.openingInvoices, ...state.data.inboundInvoices, ...state.data.issueInvoices]
    .filter((item) => [item.invoiceNo, item.date, item.model, item.warehouse, item.supplier, item.department, item.type, ...item.lines.map((line) => `${line.materialName} ${line.code}`)].join(' ').toLowerCase().includes(q))
    .map((item) => ({ ...item, kind: item.type || item.department || item.notes || 'فاتورة' }))
    .slice(0, 6);
  const users = state.data.users.filter((item) => [item.username, item.displayName, item.email, item.role].join(' ').toLowerCase().includes(q)).slice(0, 4);
  return { materials, invoices, users, total: materials.length + invoices.length + (state.session?.role === 'admin' ? users.length : 0) };
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function findUser(identifier) {
  const normalized = String(identifier || '').trim().toLowerCase();
  return state.data.users.find((user) => user.username.toLowerCase() === normalized || user.email.toLowerCase() === normalized) || null;
}

async function submitLogin(event) {
  event.preventDefault();
  const email = String(state.forms.login.identifier || '').trim();
  const password = String(state.forms.login.password || '').trim();

  if (!email || !password) {
    toast('أدخل البريد الإلكتروني وكلمة المرور');
    return;
  }

  try {
    state.authReady = false;
    state.syncing = true;
    render();
    await signInWithEmailAndPassword(auth, email, password);
    state.forms.login.password = '';
  } catch (error) {
    console.error(error);
    state.authReady = true;
    state.syncing = false;
    toast('فشل تسجيل الدخول');
    render();
  }
}

async function logout() {
  try {
    const user = currentUser();
    if (user) await addAudit('خروج', 'المصادقة', `تم تسجيل الخروج بواسطة ${user.username}`, user.email || '');
    await signOut(auth);
  } catch (error) {
    console.error(error);
  }
  state.ui.mobileMenuOpen = false;
  state.ui.globalSearch = '';
  state.route = 'dashboard';
  render();
}

async function submitMaterial(event) {
  event.preventDefault();
  if (!hasPermission('materials')) return;
  const payload = {
    id: state.editing.materialId || state.forms.material.code.trim() || uid('MAT'),
    code: state.forms.material.code.trim(),
    name: state.forms.material.name.trim(),
    mainGroup: state.forms.material.mainGroup.trim(),
    model: state.forms.material.model.trim(),
    unit: state.forms.material.unit.trim(),
    minQty: Number(state.forms.material.minQty || 0),
    createdAt: state.editing.materialId ? state.data.materials.find((item) => item.id === state.editing.materialId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
    createdBy: currentUser()?.username || currentUser()?.email || 'firebase',
    updatedAt: new Date().toISOString(),
  };

  if (!payload.code || !payload.name) {
    toast('أكمل بيانات المادة');
    return;
  }

  const duplicate = state.data.materials.find((item) => item.code === payload.code && item.id !== state.editing.materialId);
  if (duplicate) {
    toast('كود المادة مستخدم بالفعل');
    return;
  }

  try {
    await setDoc(doc(db, 'materials', payload.id), payload, { merge: true });
    await addAudit(state.editing.materialId ? 'تعديل' : 'إضافة', 'المواد', `${state.editing.materialId ? 'تم تعديل' : 'تمت إضافة'} المادة ${payload.code}`, payload.name);
    toast(state.editing.materialId ? 'تم تعديل المادة بنجاح' : 'تمت إضافة المادة بنجاح');
    state.editing.materialId = null;
    state.forms.material = makeMaterialForm();
    render();
  } catch (error) {
    console.error(error);
    toast('تعذر حفظ المادة');
  }
}

function editMaterial(id) {
  const item = state.data.materials.find((row) => row.id === id);
  if (!item) return;
  state.editing.materialId = id;
  state.forms.material = makeMaterialForm(item);
  render();
}

async function deleteMaterial(id) {
  const item = state.data.materials.find((row) => row.id === id);
  if (!item) return;
  const referenced = [...state.data.openingInvoices, ...state.data.inboundInvoices, ...state.data.issueInvoices].some((invoice) => invoice.lines.some((line) => line.materialId === id));
  if (referenced) {
    toast('لا يمكن حذف مادة مرتبطة بفواتير');
    return;
  }
  if (!window.confirm(`حذف المادة ${item.code} ؟`)) return;
  try {
    await deleteDoc(doc(db, 'materials', id));
    await addAudit('حذف', 'المواد', `تم حذف المادة ${item.code}`, item.name);
    if (state.editing.materialId === id) {
      state.editing.materialId = null;
      state.forms.material = makeMaterialForm();
    }
    toast('تم حذف المادة');
  } catch (error) {
    console.error(error);
    toast('تعذر حذف المادة');
  }
}

function resetMaterialForm() {
  state.editing.materialId = null;
  state.forms.material = makeMaterialForm();
  render();
}

function addLine(formKey) {
  state.forms[formKey].lines.push(makeLineItem(state.data.materials[0]?.id || ''));
  render();
}

function removeLine(formKey, rowId) {
  state.forms[formKey].lines = state.forms[formKey].lines.filter((item) => item.rowId !== rowId);
  if (!state.forms[formKey].lines.length) state.forms[formKey].lines.push(makeLineItem(state.data.materials[0]?.id || ''));
  render();
}

function getLineDetails(line) {
  const material = state.data.materials.find((item) => item.id === line.materialId);
  if (!material) return null;
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

async function submitInvoice(event, formKey, collectionName, moduleLabel) {
  event.preventDefault();
  const form = state.forms[formKey];
  const lines = form.lines.map(getLineDetails).filter(Boolean).filter((line) => Number(line.qty) > 0);

  if (!form.invoiceNo.trim() || !form.date || !form.warehouse.trim()) {
    toast('أكمل بيانات الفاتورة');
    return;
  }
  if (!lines.length) {
    toast('أضف بندًا واحدًا على الأقل');
    return;
  }

  const editingId = state.editing[formKey];
  const duplicate = state.data[collectionName].find((item) => item.invoiceNo === form.invoiceNo.trim() && item.id !== editingId);
  if (duplicate) {
    toast('رقم الفاتورة مستخدم بالفعل');
    return;
  }

  const previous = editingId ? state.data[collectionName].find((item) => item.id === editingId) : null;
  const payload = {
    id: editingId || form.invoiceNo.trim(),
    invoiceNo: form.invoiceNo.trim(),
    date: form.date,
    warehouse: form.warehouse.trim(),
    model: form.model.trim(),
    notes: form.notes.trim(),
    supplier: form.supplier.trim(),
    department: form.department.trim(),
    type: form.type,
    createdBy: previous?.createdBy || currentUser()?.username || currentUser()?.email || 'firebase',
    createdAt: previous?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lines,
  };

  try {
    await setDoc(doc(db, collectionName, payload.id), payload, { merge: true });
    await addAudit(editingId ? 'تعديل' : 'إضافة', moduleLabel, `${editingId ? 'تم تعديل' : 'تمت إضافة'} الفاتورة ${payload.invoiceNo}`, `${payload.lines.length} بنود`);
    toast(editingId ? 'تم تعديل الفاتورة' : 'تم حفظ الفاتورة');
    state.editing[formKey] = null;
    state.forms[formKey] = makeInvoiceForm(formKey);
    render();
  } catch (error) {
    console.error(error);
    toast('تعذر حفظ الفاتورة');
  }
}

function editInvoice(formKey, id) {
  const metaMap = {
    opening: 'openingInvoices',
    inbound: 'inboundInvoices',
    issue: 'issueInvoices',
  };
  const invoice = state.data[metaMap[formKey]].find((item) => item.id === id);
  if (!invoice) return;
  state.editing[formKey] = id;
  state.forms[formKey] = makeInvoiceForm(formKey, invoice);
  render();
}

async function deleteInvoice(formKey, id) {
  const metaMap = {
    opening: { collection: 'openingInvoices', label: 'رصيد أول المدة' },
    inbound: { collection: 'inboundInvoices', label: 'الوارد والمرتجع' },
    issue: { collection: 'issueInvoices', label: 'المنصرف' },
  };
  const meta = metaMap[formKey];
  const invoice = state.data[meta.collection].find((item) => item.id === id);
  if (!invoice) return;
  if (!window.confirm(`حذف الفاتورة ${invoice.invoiceNo} ؟`)) return;
  try {
    await deleteDoc(doc(db, meta.collection, id));
    await addAudit('حذف', meta.label, `تم حذف الفاتورة ${invoice.invoiceNo}`, `${invoice.lines.length} بنود`);
    if (state.editing[formKey] === id) {
      state.editing[formKey] = null;
      state.forms[formKey] = makeInvoiceForm(formKey);
    }
    toast('تم حذف الفاتورة');
  } catch (error) {
    console.error(error);
    toast('تعذر حذف الفاتورة');
  }
}

function resetInvoiceForm(formKey) {
  state.editing[formKey] = null;
  state.forms[formKey] = makeInvoiceForm(formKey);
  render();
}

async function submitUser(event) {
  event.preventDefault();
  if (!hasPermission('userManagement')) return;
  const form = state.forms.user;
  const editingId = state.editing.userId;

  if (!form.username.trim() || !form.displayName.trim() || !form.email.trim()) {
    toast('أكمل بيانات المستخدم');
    return;
  }

  if (!editingId && !form.password.trim()) {
    toast('كلمة المرور مطلوبة للمستخدم الجديد');
    return;
  }

  const usernameExists = state.data.users.find((item) => item.username.toLowerCase() === form.username.trim().toLowerCase() && item.id !== editingId);
  if (usernameExists) {
    toast('اسم المستخدم مستخدم بالفعل');
    return;
  }

  const emailExists = state.data.users.find((item) => item.email.toLowerCase() === form.email.trim().toLowerCase() && item.id !== editingId);
  if (emailExists) {
    toast('البريد الإلكتروني مستخدم بالفعل');
    return;
  }

  const previous = editingId ? state.data.users.find((item) => item.id === editingId) : null;
  if (editingId === state.session?.id && form.status !== 'active') {
    toast('لا يمكن تعطيل الحساب الحالي أثناء العمل');
    return;
  }

  if (editingId === ADMIN_UID) {
    form.role = 'admin';
    form.status = 'active';
  }

  const payload = {
    uid: editingId || '',
    username: form.username.trim(),
    displayName: form.displayName.trim(),
    email: form.email.trim(),
    role: form.role,
    status: form.status,
    permissions: form.role === 'admin' ? { ...ALL_PERMISSIONS } : { ...BASE_USER_PERMISSIONS, ...form.permissions },
    createdAt: previous?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    if (editingId) {
      payload.uid = editingId;
      if (editingId === ADMIN_UID) {
        payload.role = 'admin';
        payload.status = 'active';
        payload.permissions = { ...ALL_PERMISSIONS };
      }
      await setDoc(doc(db, 'users', editingId), payload, { merge: true });
      await addAudit('تعديل', 'المستخدمون', `تم تعديل المستخدم ${payload.username}`, payload.role);
      toast('تم تعديل المستخدم');
    } else {
      const appName = `secondary-${Date.now()}`;
      const secondaryApp = initializeApp(firebaseConfig, appName);
      const secondaryAuth = getAuth(secondaryApp);
      await setPersistence(secondaryAuth, inMemoryPersistence);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, form.email.trim(), form.password.trim());
      payload.uid = userCredential.user.uid;
      await setDoc(doc(db, 'users', userCredential.user.uid), payload, { merge: true });
      await addAudit('إضافة', 'المستخدمون', `تمت إضافة مستخدم ${payload.username}`, payload.role);
      await deleteApp(secondaryApp);
      toast('تمت إضافة المستخدم');
    }

    state.editing.userId = null;
    state.forms.user = makeUserForm();
    render();
  } catch (error) {
    console.error(error);
    toast('تعذر حفظ المستخدم');
  }
}

function editUser(id) {
  const user = state.data.users.find((item) => item.id === id);
  if (!user) return;
  state.editing.userId = id;
  state.forms.user = makeUserForm(user);
  render();
}

async function deleteUser(id) {
  if (id === state.session?.id || id === ADMIN_UID) {
    toast('لا يمكن تعطيل هذا المستخدم');
    return;
  }
  const user = state.data.users.find((item) => item.id === id);
  if (!user) return;
  if (!window.confirm(`تعطيل المستخدم ${user.username} ؟`)) return;
  try {
    await setDoc(doc(db, 'users', id), {
      uid: id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      role: 'user',
      status: 'suspended',
      permissions: { ...BASE_USER_PERMISSIONS },
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    await addAudit('تعطيل', 'المستخدمون', `تم تعطيل المستخدم ${user.username}`, user.email);
    if (state.editing.userId === id) {
      state.editing.userId = null;
      state.forms.user = makeUserForm();
    }
    toast('تم تعطيل المستخدم');
  } catch (error) {
    console.error(error);
    toast('تعذر تعطيل المستخدم');
  }
}

function resetUserForm() {
  state.editing.userId = null;
  state.forms.user = makeUserForm();
  render();
}


async function handleClick(event) {
  const actionEl = event.target.closest('[data-action]');
  if (!actionEl) return;
  const { action, id, form, row } = actionEl.dataset;

  switch (action) {
    case 'toggle-menu':
      state.ui.mobileMenuOpen = !state.ui.mobileMenuOpen;
      render();
      break;
    case 'close-menu':
      state.ui.mobileMenuOpen = false;
      render();
      break;
    case 'toggle-password':
      state.ui.passwordVisible = !state.ui.passwordVisible;
      render();
      break;
    case 'install-app':
      await installApp();
      break;
    case 'logout':
      await logout();
      break;
    case 'clear-global-search':
      state.ui.globalSearch = '';
      render();
      break;
    case 'edit-material':
      editMaterial(id);
      break;
    case 'delete-material':
      await deleteMaterial(id);
      break;
    case 'cancel-material-edit':
      resetMaterialForm();
      break;
    case 'add-line':
      addLine(form);
      break;
    case 'remove-line':
      removeLine(form, row);
      break;
    case 'edit-invoice':
      editInvoice(form, id);
      break;
    case 'delete-invoice':
      await deleteInvoice(form, id);
      break;
    case 'cancel-invoice-edit':
      resetInvoiceForm(form);
      break;
    case 'edit-user':
      editUser(id);
      break;
    case 'delete-user':
      await deleteUser(id);
      break;
    case 'cancel-user-edit':
      resetUserForm();
      break;
    default:
      break;
  }
}

async function handleSubmit(event) {
  switch (event.target.id) {
    case 'login-form':
      await submitLogin(event);
      break;
    case 'material-form':
      await submitMaterial(event);
      break;
    case 'opening-form':
      await submitInvoice(event, 'opening', 'openingInvoices', 'رصيد أول المدة');
      break;
    case 'inbound-form':
      await submitInvoice(event, 'inbound', 'inboundInvoices', 'الوارد والمرتجع');
      break;
    case 'issue-form':
      await submitInvoice(event, 'issue', 'issueInvoices', 'المنصرف');
      break;
    case 'user-form':
      await submitUser(event);
      break;
    default:
      break;
  }
}

function handleInput(event) {
  const bind = event.target.dataset.bind;
  const uiField = event.target.dataset.uiField;
  const filter = event.target.dataset.filter;
  const invoiceFilter = event.target.dataset.invoiceFilter;

  if (bind) {
    setFormValue(bind, event.target.value);
    return;
  }

  if (uiField) {
    state.ui[uiField] = event.target.value;
    rerenderAndRefocus(`[data-ui-field=\"${uiField}\"]`);
    return;
  }

  if (filter) {
    state.filters[filter] = event.target.value;
    rerenderAndRefocus(`[data-filter=\"${filter}\"]`);
    return;
  }

  if (invoiceFilter) {
    state.filters.invoiceSearch[invoiceFilter] = event.target.value;
    rerenderAndRefocus(`[data-invoice-filter=\"${invoiceFilter}\"]`);
    return;
  }

  if (event.target.dataset.lineField) {
    const { lineForm, lineRow, lineField } = event.target.dataset;
    const row = state.forms[lineForm].lines.find((item) => item.rowId === lineRow);
    if (!row) return;
    row[lineField] = lineField === 'qty' ? Number(event.target.value || 0) : event.target.value;
    if (lineField === 'materialId') render();
  }
}

function handleChange(event) {
  if (event.target.dataset.permission) {
    const key = event.target.dataset.permission;
    state.forms.user.permissions[key] = event.target.checked;
    render();
    return;
  }

  if (event.target.dataset.bind === 'user.role') {
    state.forms.user.role = event.target.value;
    state.forms.user.permissions = event.target.value === 'admin' ? { ...ALL_PERMISSIONS } : { ...BASE_USER_PERMISSIONS, ...state.forms.user.permissions };
    render();
    return;
  }

  if (event.target.dataset.filter) {
    state.filters[event.target.dataset.filter] = event.target.value;
    render();
    return;
  }

  if (event.target.dataset.lineField) {
    handleInput(event);
  }
}

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
  toast('تم تثبيت التطبيق');
});

window.addEventListener('load', async () => {
  seedForms();
  registerPWA();
  appEl.addEventListener('click', handleClick);
  appEl.addEventListener('submit', handleSubmit);
  appEl.addEventListener('input', handleInput);
  appEl.addEventListener('change', handleChange);
  state.booted = true;
  render();
  await bootstrapFirebase();
});
