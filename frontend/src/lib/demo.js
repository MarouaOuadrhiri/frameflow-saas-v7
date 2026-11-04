'use client';

// ============================================================================
// FrameFlow — FRONTEND DEMO MODE (portfolio build)
//
// When DEMO_MODE is on, api.js never touches the network: every /api call is
// answered locally from the in-memory dataset below, which mirrors the cloud
// demo seed (database/seed.demo.sql) and the backend response shapes exactly.
//
// Enabled by default for the hosted demo; set NEXT_PUBLIC_DEMO_MODE=0 at
// build time to disable it (e.g. for a real deployment with a live backend).
// State lives in module memory: edits work during the session and a page
// refresh resets everything back to the seed.
// ============================================================================

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== '0';

const now = Date.now();
const hoursAgo = (h) => new Date(now - h * 3600 * 1000).toISOString();

const user = {
  id: 1,
  name: 'Yassine Bennani',
  email: 'yassine@frameflow.studio',
  role: 'Director',
  initials: 'YB',
  created_at: '2026-08-01T00:00:00.000Z',
};

let nextId = 1000;
const nid = () => ++nextId;

const db = {
  clients: [
    { id: 1, user_id: 1, name: 'Sarah & Yassine', company: null, email: 'sarah.elamrani@gmail.com', phone: '+212 661 22 33 44', created_at: '2026-08-20T10:00:00.000Z' },
    { id: 2, user_id: 1, name: 'Nova Records', company: 'Nova Records', email: 'contact@novarecords.ma', phone: '+212 522 11 22 33', created_at: '2026-08-21T10:00:00.000Z' },
    { id: 3, user_id: 1, name: 'Aura Cosmetics', company: 'Aura Cosmetics', email: 'marketing@aura.ma', phone: '+212 522 44 55 66', created_at: '2026-08-22T10:00:00.000Z' },
    { id: 4, user_id: 1, name: 'Yasmine Idrissi', company: 'Yasmine Studio', email: 'yasmine@studio.ma', phone: '+212 664 77 88 99', created_at: '2026-08-23T10:00:00.000Z' },
    { id: 5, user_id: 1, name: 'TechBridge Morocco', company: 'TechBridge', email: 'events@techbridge.ma', phone: '+212 537 22 44 66', created_at: '2026-08-24T10:00:00.000Z' },
  ],
  projects: [
    { id: 1, user_id: 1, client_id: 1, name: 'Wedding Story', type: 'Wedding Film', status: 'production', thumb: 'linear-gradient(135deg,#3a2a1f,#1a1410)', deadline: '2026-10-08', start_date: null, location: null, description: null, production_notes: null, price: 12000, paid: 9000, progress: 72, created_at: '2026-09-01T09:00:00.000Z' },
    { id: 2, user_id: 1, client_id: 2, name: 'NOVA — Music Video', type: 'Music Video', status: 'post-production', thumb: 'linear-gradient(135deg,#241a2e,#100a17)', deadline: '2026-09-29', start_date: null, location: null, description: null, production_notes: null, price: 38000, paid: 19000, progress: 85, created_at: '2026-08-25T09:00:00.000Z' },
    { id: 3, user_id: 1, client_id: 3, name: 'AURA — Brand Commercial', type: 'Commercial', status: 'planning', thumb: 'linear-gradient(135deg,#2e1f18,#150e0a)', deadline: '2026-11-02', start_date: null, location: null, description: null, production_notes: null, price: 54000, paid: 20000, progress: 18, created_at: '2026-09-05T09:00:00.000Z' },
    { id: 4, user_id: 1, client_id: 4, name: 'Fashion Editorial — Yasmine', type: 'Fashion Editorial', status: 'review', thumb: 'linear-gradient(135deg,#1c2432,#0d1119)', deadline: '2026-09-25', start_date: null, location: null, description: null, production_notes: null, price: 9500, paid: 9500, progress: 94, created_at: '2026-09-10T09:00:00.000Z' },
    { id: 5, user_id: 1, client_id: 5, name: 'TechBridge Summit', type: 'Corporate Event', status: 'completed', thumb: 'linear-gradient(135deg,#1a2a24,#0b120f)', deadline: '2026-08-14', start_date: null, location: null, description: null, production_notes: null, price: 22000, paid: 22000, progress: 100, created_at: '2026-07-28T09:00:00.000Z' },
    { id: 6, user_id: 1, client_id: 4, name: 'Café Bloom — Social Reel', type: 'Social / Reels', status: 'pre-production', thumb: 'linear-gradient(135deg,#2a1e1a,#130c0a)', deadline: '2026-10-20', start_date: null, location: null, description: null, production_notes: null, price: 6000, paid: 2000, progress: 8, created_at: '2026-09-18T09:00:00.000Z' },
  ],
  equipment: [
    { id: 1, user_id: 1, name: 'Sony A7 III', brand: 'Sony', model: null, category: 'Cameras', price: 15000, purchase_date: '2025-04-12', condition: 'Excellent', damaged: 0, photo: null, created_at: '2025-04-12T09:00:00.000Z' },
    { id: 2, user_id: 1, name: 'Sony A7S III', brand: 'Sony', model: null, category: 'Cameras', price: 32000, purchase_date: '2024-11-02', condition: 'Excellent', damaged: 0, photo: null, created_at: '2024-11-02T09:00:00.000Z' },
    { id: 3, user_id: 1, name: '24-70mm f/2.8 GM', brand: 'Sony', model: null, category: 'Lenses', price: 18500, purchase_date: '2024-06-20', condition: 'Good', damaged: 0, photo: null, created_at: '2024-06-20T09:00:00.000Z' },
    { id: 4, user_id: 1, name: '50mm f/1.4', brand: 'Sony', model: null, category: 'Lenses', price: 9200, purchase_date: '2024-06-20', condition: 'Excellent', damaged: 0, photo: null, created_at: '2024-06-20T09:00:00.000Z' },
    { id: 5, user_id: 1, name: 'DJI RS3 Gimbal', brand: 'DJI', model: null, category: 'Accessories', price: 6800, purchase_date: '2024-09-01', condition: 'Good', damaged: 0, photo: null, created_at: '2024-09-01T09:00:00.000Z' },
    { id: 6, user_id: 1, name: 'DJI Mavic 3', brand: 'DJI', model: null, category: 'Drones', price: 22000, purchase_date: '2024-03-15', condition: 'Fair', damaged: 0, photo: null, created_at: '2024-03-15T09:00:00.000Z' },
    { id: 7, user_id: 1, name: 'Rode Wireless GO II', brand: 'Rode', model: null, category: 'Audio', price: 2900, purchase_date: '2024-02-10', condition: 'Damaged', damaged: 1, photo: null, created_at: '2024-02-10T09:00:00.000Z' },
    { id: 8, user_id: 1, name: 'Aputure 300D II', brand: 'Aputure', model: null, category: 'Lighting', price: 9800, purchase_date: '2023-12-05', condition: 'Excellent', damaged: 0, photo: null, created_at: '2023-12-05T09:00:00.000Z' },
    { id: 9, user_id: 1, name: 'Manfrotto 055 Tripod', brand: 'Manfrotto', model: null, category: 'Tripods', price: 2200, purchase_date: '2023-08-19', condition: 'Good', damaged: 0, photo: null, created_at: '2023-08-19T09:00:00.000Z' },
    { id: 10, user_id: 1, name: 'Sony 64GB CFexpress', brand: 'Sony', model: null, category: 'Memory Cards', price: 1450, purchase_date: '2025-01-11', condition: 'Excellent', damaged: 0, photo: null, created_at: '2025-01-11T09:00:00.000Z' },
    { id: 11, user_id: 1, name: 'V-Mount Battery 190Wh', brand: 'IDX', model: null, category: 'Batteries', price: 2600, purchase_date: '2024-05-08', condition: 'Good', damaged: 0, photo: null, created_at: '2024-05-08T09:00:00.000Z' },
    { id: 12, user_id: 1, name: 'SSD 2TB T7', brand: 'Samsung', model: null, category: 'Storage', price: 2800, purchase_date: '2024-10-30', condition: 'Excellent', damaged: 0, photo: null, created_at: '2024-10-30T09:00:00.000Z' },
    { id: 13, user_id: 1, name: 'Sennheiser MKH 416', brand: 'Sennheiser', model: null, category: 'Audio', price: 8900, purchase_date: '2023-07-01', condition: 'Excellent', damaged: 0, photo: null, created_at: '2023-07-01T09:00:00.000Z' },
    { id: 14, user_id: 1, name: 'Zhiyun Crane 3S', brand: 'Zhiyun', model: null, category: 'Accessories', price: 7200, purchase_date: '2023-05-22', condition: 'Lost', damaged: 1, photo: null, created_at: '2023-05-22T09:00:00.000Z' },
  ],
  expenses: [
    { id: 1, user_id: 1, project_id: 1, date: '2026-09-12', description: 'Drone insurance — one day', category: 'Equipment', amount: 450, payment_method: 'Card', created_at: '2026-09-12T09:00:00.000Z' },
    { id: 2, user_id: 1, project_id: 1, date: '2026-09-10', description: 'Team transport — venue scouting', category: 'Transport', amount: 320, payment_method: 'Cash', created_at: '2026-09-10T09:00:00.000Z' },
    { id: 3, user_id: 1, project_id: 1, date: '2026-09-06', description: 'Second shooter day rate', category: 'Staff', amount: 1500, payment_method: 'Transfer', created_at: '2026-09-06T09:00:00.000Z' },
    { id: 4, user_id: 1, project_id: 1, date: '2026-09-02', description: 'Lens rental — 85mm f/1.4', category: 'Equipment', amount: 600, payment_method: 'Card', created_at: '2026-09-02T09:00:00.000Z' },
  ],
  payments: [
    { id: 1, user_id: 1, project_id: 1, date: '2026-09-01', amount: 3600, method: 'Bank transfer', notes: 'Deposit', status: 'paid', created_at: '2026-09-01T09:00:00.000Z' },
    { id: 2, user_id: 1, project_id: 1, date: '2026-09-14', amount: 5400, method: 'Cash', notes: 'Second payment', status: 'paid', created_at: '2026-09-14T09:00:00.000Z' },
    { id: 3, user_id: 1, project_id: 2, date: '2026-08-20', amount: 19000, method: 'Bank transfer', notes: 'Deposit', status: 'paid', created_at: '2026-08-20T09:00:00.000Z' },
    { id: 4, user_id: 1, project_id: 3, date: '2026-09-05', amount: 20000, method: 'Bank transfer', notes: 'Deposit', status: 'paid', created_at: '2026-09-05T09:00:00.000Z' },
    { id: 5, user_id: 1, project_id: 4, date: '2026-09-12', amount: 9500, method: 'Cash', notes: 'Full payment', status: 'paid', created_at: '2026-09-12T09:00:00.000Z' },
    { id: 6, user_id: 1, project_id: 5, date: '2026-08-01', amount: 22000, method: 'Bank transfer', notes: 'Final payment', status: 'paid', created_at: '2026-08-01T09:00:00.000Z' },
    { id: 7, user_id: 1, project_id: 6, date: '2026-09-18', amount: 2000, method: 'Cash', notes: 'Deposit', status: 'paid', created_at: '2026-09-18T09:00:00.000Z' },
  ],
  purchaseItems: [
    { id: 1, user_id: 1, project_id: 1, item: 'Extra V-Mount Battery', category: 'Batteries', qty: 2, est_price: 2600, priority: 'High', status: 'To buy', created_at: '2026-09-15T09:00:00.000Z' },
    { id: 2, user_id: 1, project_id: 1, item: '128GB CFexpress Card', category: 'Memory Cards', qty: 3, est_price: 750, priority: 'High', status: 'To buy', created_at: '2026-09-15T09:00:00.000Z' },
    { id: 3, user_id: 1, project_id: 2, item: 'Rode Wireless GO II (replacement)', category: 'Audio', qty: 1, est_price: 2900, priority: 'Medium', status: 'Ordered', created_at: '2026-09-15T09:00:00.000Z' },
    { id: 4, user_id: 1, project_id: 3, item: 'Zhiyun Crane 3S (replacement)', category: 'Accessories', qty: 1, est_price: 7200, priority: 'Medium', status: 'To buy', created_at: '2026-09-15T09:00:00.000Z' },
    { id: 5, user_id: 1, project_id: 4, item: 'ND Filter Set 82mm', category: 'Accessories', qty: 1, est_price: 1100, priority: 'Low', status: 'Received', created_at: '2026-09-15T09:00:00.000Z' },
  ],
  tasks: [
    { id: 1, user_id: 1, project_id: 1, title: 'Scout ceremony venue lighting', column: 'To Do', priority: 'high', created_at: '2026-09-15T09:00:00.000Z' },
    { id: 2, user_id: 1, project_id: 3, title: 'Confirm drone permit for rooftop shoot', column: 'To Do', priority: 'urgent', created_at: '2026-09-15T09:00:00.000Z' },
    { id: 3, user_id: 1, project_id: 2, title: 'Draft shot list for chorus scene', column: 'To Do', priority: 'medium', created_at: '2026-09-15T09:00:00.000Z' },
    { id: 4, user_id: 1, project_id: 1, title: 'Color grade reception footage', column: 'In Progress', priority: 'high', created_at: '2026-09-15T09:00:00.000Z' },
    { id: 5, user_id: 1, project_id: 2, title: 'Sound design — bridge section', column: 'In Progress', priority: 'medium', created_at: '2026-09-15T09:00:00.000Z' },
    { id: 6, user_id: 1, project_id: 2, title: 'Client review — final trailer cut', column: 'Review', priority: 'high', created_at: '2026-09-15T09:00:00.000Z' },
    { id: 7, user_id: 1, project_id: 4, title: 'Approve retouched stills', column: 'Review', priority: 'medium', created_at: '2026-09-15T09:00:00.000Z' },
    { id: 8, user_id: 1, project_id: 5, title: 'Deliver highlight reel', column: 'Done', priority: 'low', created_at: '2026-09-15T09:00:00.000Z' },
    { id: 9, user_id: 1, project_id: 5, title: 'Upload raw files to archive', column: 'Done', priority: 'low', created_at: '2026-09-15T09:00:00.000Z' },
  ],
  events: [
    { id: 1, user_id: 1, project_id: 3, title: 'AURA Shoot', date: '2026-09-24', color: 'accent', kind: 'Shoot', created_at: '2026-09-15T09:00:00.000Z' },
    { id: 2, user_id: 1, project_id: 4, title: 'Client review', date: '2026-09-25', color: 'warning', kind: 'Review', created_at: '2026-09-15T09:00:00.000Z' },
    { id: 3, user_id: 1, project_id: 2, title: 'NOVA deadline', date: '2026-09-27', color: 'danger', kind: 'Deadline', created_at: '2026-09-15T09:00:00.000Z' },
    { id: 4, user_id: 1, project_id: 2, title: 'NOVA delivery', date: '2026-09-29', color: 'success', kind: 'Delivery', created_at: '2026-09-15T09:00:00.000Z' },
    { id: 5, user_id: 1, project_id: 1, title: 'Payment due', date: '2026-09-14', color: 'info', kind: 'Payment', created_at: '2026-09-15T09:00:00.000Z' },
    { id: 6, user_id: 1, project_id: 1, title: 'Wedding delivery', date: '2026-10-08', color: 'success', kind: 'Delivery', created_at: '2026-09-15T09:00:00.000Z' },
  ],
  notifications: [
    { id: 1, user_id: 1, icon: 'payments', color: 'info', text: 'Payment of <b>3,000 DH</b> due in 2 days — Wedding Story.', is_read: 0, created_at: hoursAgo(0.2) },
    { id: 2, user_id: 1, icon: 'issues', color: 'danger', text: "3 equipment items missing for tomorrow's AURA shoot.", is_read: 0, created_at: hoursAgo(1) },
    { id: 3, user_id: 1, icon: 'calendar', color: 'warning', text: 'Fashion Editorial deadline is tomorrow.', is_read: 0, created_at: hoursAgo(3) },
    { id: 4, user_id: 1, icon: 'equipment', color: 'warning', text: 'Wedding Story is 12% above planned equipment budget.', is_read: 0, created_at: hoursAgo(24) },
  ],
  folders: [
    { id: 1, project_id: 1, name: 'Photos', file_count: 24 },
    { id: 2, project_id: 1, name: 'Videos', file_count: 12 },
    { id: 3, project_id: 1, name: 'Documents', file_count: 6 },
    { id: 4, project_id: 1, name: 'Contracts', file_count: 3 },
    { id: 5, project_id: 1, name: 'Invoices', file_count: 8 },
    { id: 6, project_id: 1, name: 'Final Deliverables', file_count: 15 },
  ],
  projectEquipment: [
    { id: 1, project_id: 1, equipment_id: 1, item_name: 'Sony A7 III', status: 'ok', est_price: 0 },
    { id: 2, project_id: 1, equipment_id: 3, item_name: '24-70mm f/2.8 GM', status: 'ok', est_price: 0 },
    { id: 3, project_id: 1, equipment_id: null, item_name: 'Extra V-Mount Battery', status: 'missing', est_price: 2600 },
    { id: 4, project_id: 1, equipment_id: null, item_name: '128GB CFexpress Card', status: 'missing', est_price: 750 },
    { id: 5, project_id: 1, equipment_id: 7, item_name: 'Rode Wireless GO II', status: 'damaged', est_price: 2900 },
    { id: 6, project_id: 1, equipment_id: 9, item_name: 'Manfrotto 055 Tripod', status: 'ok', est_price: 0 },
  ],
  fileItems: [],
};

// ---------------------------------------------------------------------------
// Helpers mirroring the backend enrichments
// ---------------------------------------------------------------------------
const clientName = (id) => db.clients.find((c) => c.id === id)?.name || null;
const sum = (rows, key) => rows.reduce((a, r) => a + Number(r[key] || 0), 0);

function enrichProject(p) {
  return {
    ...p,
    client_name: clientName(p.client_id),
    expenses_total: sum(db.expenses.filter((e) => e.project_id === p.id), 'amount'),
    paid_total: sum(db.payments.filter((x) => x.project_id === p.id && x.status === 'paid'), 'amount'),
    equip_count: db.projectEquipment.filter((g) => g.project_id === p.id).length,
  };
}

function enrichGear(g) {
  const e = g.equipment_id ? db.equipment.find((x) => x.id === g.equipment_id) : null;
  return {
    ...g,
    equip_name: e?.name || null,
    equip_brand: e?.brand || null,
    equip_photo: e?.photo || null,
    equip_category: e?.category || null,
    equip_price: e?.price ?? null,
    equip_damaged: e?.damaged ?? 0,
  };
}

function dashboard() {
  const active = db.projects.filter((p) => !['completed', 'archived'].includes(p.status));
  const totalRevenue = sum(active, 'price');
  const totalExpenses = sum(db.expenses.filter((e) => active.some((p) => p.id === e.project_id)), 'amount');
  const netProfit = totalRevenue - totalExpenses;
  const damaged = db.equipment.filter((e) => e.damaged === 1);

  const smartAlerts = [];
  const gearBad = db.projectEquipment.filter((g) => g.status !== 'ok');
  if (gearBad.length) {
    const names = [...new Set(gearBad.map((g) => db.projects.find((p) => p.id === g.project_id)?.name).filter(Boolean))];
    smartAlerts.push({
      icon: 'issues',
      color: 'danger',
      text: `${gearBad.length} equipment item${gearBad.length > 1 ? 's need' : ' needs'} attention (${names.join(', ')}).`,
    });
  }
  if (damaged.length) {
    smartAlerts.push({
      icon: 'equipment',
      color: 'danger',
      text: `${damaged.length} gear item${damaged.length > 1 ? 's are' : ' is'} damaged.`,
    });
  }

  // Last 6 calendar months (oldest -> newest), like the backend.
  const months = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 5; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
    const label = m.toLocaleDateString('en-US', { month: 'short' });
    const revenue = sum(db.payments.filter((x) => x.status === 'paid' && String(x.date).startsWith(key)), 'amount');
    const expenses = sum(db.expenses.filter((x) => String(x.date).startsWith(key)), 'amount');
    months.push({ month: key, label, revenue, expenses, profit: revenue - expenses });
  }

  const byCat = {};
  for (const e of db.expenses) byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount);
  const expensesByCategory = Object.entries(byCat)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  return {
    kpis: {
      activeProjects: active.length,
      totalRevenue,
      totalExpenses,
      netProfit,
      margin: totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0,
      equipmentValue: sum(db.equipment, 'price'),
      equipmentCount: db.equipment.length,
    },
    activeProjects: [...active]
      .sort((a, b) => String(a.deadline || '9999').localeCompare(String(b.deadline || '9999')))
      .slice(0, 3)
      .map(enrichProject),
    smartAlerts: smartAlerts.slice(0, 4),
    damagedEquipment: {
      count: damaged.length,
      items: damaged.map((e) => ({ id: e.id, name: e.name, category: e.category })),
    },
    timeline: [...db.events]
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .slice(0, 6)
      .map((e) => ({ ...e, project_name: db.projects.find((p) => p.id === e.project_id)?.name || null })),
    monthly: months,
    expensesByCategory,
  };
}

function projectSummary(id) {
  const p = db.projects.find((x) => x.id === id);
  if (!p) throw new Error('Project not found');
  const expenses = db.expenses.filter((e) => e.project_id === id);
  const payments = db.payments.filter((x) => x.project_id === id);
  const budget = Number(p.price);
  const expensesTotal = sum(expenses, 'amount');
  const paid = sum(payments.filter((x) => x.status === 'paid'), 'amount');
  const profit = budget - expensesTotal;
  return {
    budget,
    expensesTotal,
    profit,
    margin: budget > 0 ? Number(((profit / budget) * 100).toFixed(1)) : 0,
    paid,
    remaining: budget - paid,
    progress: Number(p.progress),
    expenses: [...expenses].sort((a, b) => String(b.date).localeCompare(String(a.date))),
    payments: [...payments].sort((a, b) => String(b.date).localeCompare(String(a.date))),
    equipment: db.projectEquipment.filter((g) => g.project_id === id).map(enrichGear),
  };
}

// ---------------------------------------------------------------------------
// Router — returns the same `data` payload the real backend would send.
// ---------------------------------------------------------------------------
export async function demoRequest(method, rawPath, body) {
  const [pathPart, queryPart] = String(rawPath).split('?');
  const q = new URLSearchParams(queryPart || '');
  const seg = pathPart.split('/').filter(Boolean); // e.g. ['api','projects','3','summary']
  const res = seg[1];
  const id = seg[2] ? Number(seg[2]) : null;
  const sub = seg[3] || null;
  const b = body || {};

  // --- Auth ---------------------------------------------------------------
  if (res === 'auth' && seg[2] === 'login' && method === 'POST') {
    if (b.email === user.email && b.password === 'demo1234') {
      return { user, token: 'demo-token' };
    }
    throw new Error('Invalid email or password');
  }
  if (res === 'auth' && seg[2] === 'me') return { user };
  if (res === 'auth' && seg[2] === 'register') {
    throw new Error('Public registration is disabled. Ask the studio administrator for access.');
  }

  // --- Dashboard ------------------------------------------------------------
  if (res === 'dashboard' && method === 'GET') return dashboard();

  // --- Projects -------------------------------------------------------------
  if (res === 'projects') {
    if (method === 'GET' && id && sub === 'summary') return projectSummary(id);
    if (method === 'GET' && id) {
      const p = db.projects.find((x) => x.id === id);
      if (!p) throw new Error('Project not found');
      return enrichProject(p);
    }
    if (method === 'GET') {
      let rows = [...db.projects];
      if (q.get('status')) rows = rows.filter((p) => p.status === q.get('status'));
      return rows.sort((a, z) => z.id - a.id).map(enrichProject);
    }
    if (method === 'POST' && id && sub === 'equipment') {
      const eqId = b.equipment_id ? Number(b.equipment_id) : null;
      const eq = eqId ? db.equipment.find((x) => x.id === eqId) : null;
      const row = {
        id: nid(),
        project_id: id,
        equipment_id: eqId,
        item_name: eq?.name || String(b.item_name || '').trim(),
        status: 'ok',
        est_price: Number(b.est_price) || 0,
      };
      db.projectEquipment.push(row);
      return enrichGear(row);
    }
    if (method === 'DELETE' && id && sub === 'equipment') {
      const gearId = Number(seg[4]);
      db.projectEquipment = db.projectEquipment.filter((g) => g.id !== gearId);
      return { deleted: true };
    }
    if (method === 'POST') {
      const row = {
        id: nid(),
        user_id: 1,
        client_id: b.client_id ? Number(b.client_id) : null,
        name: b.name || 'Untitled project',
        type: b.type || 'Production',
        status: b.status || 'planning',
        thumb: b.thumb || 'linear-gradient(135deg,#2a2118,#120d09)',
        deadline: b.deadline || null,
        start_date: b.start_date || null,
        location: b.location || null,
        description: b.description || null,
        production_notes: b.production_notes || null,
        price: Number(b.price) || 0,
        paid: Number(b.paid ?? b.deposit) || 0,
        progress: Number(b.progress) || 0,
        created_at: new Date().toISOString(),
      };
      db.projects.push(row);
      if (Array.isArray(b.equipment_ids)) {
        for (const eqId of b.equipment_ids) {
          const eq = db.equipment.find((x) => x.id === Number(eqId));
          if (eq) db.projectEquipment.push({ id: nid(), project_id: row.id, equipment_id: eq.id, item_name: eq.name, status: 'ok', est_price: 0 });
        }
      }
      return enrichProject(row);
    }
    if (method === 'DELETE' && id) {
      db.projects = db.projects.filter((p) => p.id !== id);
      return { deleted: true };
    }
  }

  // --- Clients ---------------------------------------------------------------
  if (res === 'clients') {
    if (method === 'GET') return [...db.clients];
    if (method === 'POST') {
      const row = { id: nid(), user_id: 1, created_at: new Date().toISOString(), ...b };
      db.clients.push(row);
      return row;
    }
  }

  // --- Equipment ---------------------------------------------------------------
  if (res === 'equipment') {
    if (method === 'GET') return [...db.equipment];
    if (method === 'POST') {
      const row = { id: nid(), user_id: 1, photo: null, created_at: new Date().toISOString(), ...b, price: Number(b.price) || 0, damaged: b.damaged ? 1 : 0 };
      db.equipment.push(row);
      return row;
    }
    if (method === 'PUT' && id) {
      const row = db.equipment.find((x) => x.id === id);
      if (row) Object.assign(row, b);
      return row || {};
    }
  }

  // --- Tasks ---------------------------------------------------------------
  if (res === 'tasks') {
    if (method === 'GET') {
      let rows = [...db.tasks];
      if (q.get('project_id')) rows = rows.filter((t) => t.project_id === Number(q.get('project_id')));
      return rows;
    }
    if (method === 'POST') {
      const row = { id: nid(), user_id: 1, created_at: new Date().toISOString(), column: 'To Do', priority: 'medium', ...b, project_id: b.project_id ? Number(b.project_id) : null };
      db.tasks.push(row);
      return row;
    }
    if (method === 'PUT' && id) {
      const row = db.tasks.find((x) => x.id === id);
      if (row) Object.assign(row, b);
      return row || {};
    }
    if (method === 'DELETE' && id) {
      db.tasks = db.tasks.filter((t) => t.id !== id);
      return { deleted: true };
    }
  }

  // --- Expenses / Payments ---------------------------------------------------
  if (res === 'expenses' || res === 'payments') {
    const table = res === 'expenses' ? db.expenses : db.payments;
    if (method === 'GET') {
      let rows = [...table];
      if (q.get('project_id')) rows = rows.filter((r) => r.project_id === Number(q.get('project_id')));
      return rows.sort((a, z) => String(z.date).localeCompare(String(a.date)));
    }
    if (method === 'POST') {
      const row = { id: nid(), user_id: 1, created_at: new Date().toISOString(), ...b, project_id: b.project_id ? Number(b.project_id) : null, amount: Number(b.amount) || 0 };
      if (res === 'payments' && !row.status) row.status = 'paid';
      table.push(row);
      return row;
    }
  }

  // --- Purchase list -----------------------------------------------------------
  if (res === 'purchase-items') {
    if (method === 'GET') return [...db.purchaseItems];
    if (method === 'POST') {
      const row = { id: nid(), user_id: 1, created_at: new Date().toISOString(), status: 'To buy', ...b, project_id: b.project_id ? Number(b.project_id) : null };
      db.purchaseItems.push(row);
      return row;
    }
    if (method === 'PUT' && id) {
      const row = db.purchaseItems.find((x) => x.id === id);
      if (row) Object.assign(row, b);
      return row || {};
    }
  }

  // --- Calendar events -----------------------------------------------------------
  if (res === 'events') {
    if (method === 'GET') {
      let rows = [...db.events];
      const month = q.get('month');
      if (month) rows = rows.filter((e) => String(e.date).startsWith(month));
      return rows.map((e) => ({ ...e, project_name: db.projects.find((p) => p.id === e.project_id)?.name || null }));
    }
    if (method === 'POST') {
      const row = { id: nid(), user_id: 1, created_at: new Date().toISOString(), color: 'accent', kind: 'Shoot', ...b, project_id: b.project_id ? Number(b.project_id) : null };
      db.events.push(row);
      return row;
    }
  }

  // --- Notifications -----------------------------------------------------------
  if (res === 'notifications') {
    if (method === 'GET') return [...db.notifications];
    if (method === 'PUT' && seg[2] === 'read-all') {
      db.notifications.forEach((n) => (n.is_read = 1));
      return { updated: true };
    }
    if (method === 'PUT' && id) {
      const n = db.notifications.find((x) => x.id === id);
      if (n) n.is_read = 1;
      return n || {};
    }
  }

  // --- Files (folders + items) ---------------------------------------------------
  if (res === 'files') {
    if (method === 'GET' && seg[2] === 'items') {
      let rows = [...db.fileItems];
      if (q.get('project_id')) rows = rows.filter((f) => f.project_id === Number(q.get('project_id')));
      if (q.get('folder_id')) rows = rows.filter((f) => f.folder_id === Number(q.get('folder_id')));
      return rows;
    }
    if (method === 'GET') {
      let rows = [...db.folders];
      if (q.get('project_id')) rows = rows.filter((f) => f.project_id === Number(q.get('project_id')));
      return rows;
    }
    if (method === 'POST') {
      const row = { id: nid(), project_id: b.project_id ? Number(b.project_id) : null, name: b.name || 'New folder', file_count: 0 };
      db.folders.push(row);
      return row;
    }
    if (method === 'DELETE' && seg[2] === 'items') {
      const fileId = Number(seg[3]);
      db.fileItems = db.fileItems.filter((f) => f.id !== fileId);
      return { deleted: true };
    }
  }

  // --- Fallback: never crash the UI in demo mode -------------------------------
  if (method === 'GET') return [];
  return {};
}

// Multipart uploads in demo mode: pretend the upload worked.
export async function demoUpload(path, formData) {
  if (path.includes('/api/files/upload')) {
    let name = 'file';
    try {
      const f = formData.get('file');
      if (f && f.name) name = f.name;
    } catch {
      // keep default name
    }
    const row = {
      id: nid(),
      project_id: Number(formData.get('project_id')) || null,
      folder_id: Number(formData.get('folder_id')) || null,
      original_name: name,
      mime_type: 'application/octet-stream',
      size: 0,
      created_at: new Date().toISOString(),
      uploaded_by: user.name,
    };
    db.fileItems.unshift(row);
    return row;
  }
  // Equipment photo upload: acknowledge without storing an image.
  const m = String(path).match(/\/api\/equipment\/(\d+)\/photo/);
  if (m) {
    const row = db.equipment.find((x) => x.id === Number(m[1]));
    return row || {};
  }
  return {};
}
