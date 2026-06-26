const routes = {
  dashboard1: { title: "Dashboard", type: "admin" },
  dashboard2: { title: "Dashboard 2", type: "admin" },
  invoice: { title: "Invoice List", type: "admin" },
  "invoice-create": { title: "Create Invoice", type: "admin" },
  "invoice-details": { title: "Invoice Details", type: "admin" },
  notes: { title: "Notes", type: "admin" },
  "pricing-admin": { title: "Pricing", type: "admin" },
  account: { title: "Account Setting", type: "admin" },
  cards: { title: "Cards", type: "admin" },
  "widgets-charts": { title: "Charts", type: "admin" },
  alert: { title: "Alert", type: "admin" },
  chip: { title: "Chip", type: "admin" },
  dialogs: { title: "Dialog", type: "admin" },
  tabs: { title: "Tabs", type: "admin" },
  "form-layout": { title: "Form Layout", type: "admin" },
  "editable-table": { title: "Editable Table", type: "admin" },
  "line-chart": { title: "Line Chart", type: "admin" },
  "gradient-chart": { title: "Gredient Chart", type: "admin" },
  login: { title: "Login", type: "login" },
  "front-pricing": { title: "Pricing", type: "front" },
  about: { title: "About Us", type: "front" }
};

const app = document.getElementById("app");

const icons = {
  dashboard: '<path d="M3 12a9 9 0 1 1 18 0v5a2 2 0 0 1-2 2h-3l-2-4h-4l-2 4H5a2 2 0 0 1-2-2z"/><path d="M9 12h6"/>',
  chart: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16V9"/><path d="M13 16V6"/><path d="M18 16v-4"/>',
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h14v-9.5"/><path d="M9 20v-6h6v6"/>',
  phone: '<path d="M22 16.9v2.3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 3.5 2 2 0 0 1 4.1 1.3h2.3a2 2 0 0 1 2 1.7l.4 2.3a2 2 0 0 1-.6 1.8L7.1 8.2a16 16 0 0 0 6.7 6.7l1.1-1.1a2 2 0 0 1 1.8-.6l2.3.4a2 2 0 0 1 1.7 2z"/>',
  blog: '<path d="M4 5h16"/><path d="M4 19h16"/><path d="M6 5v14"/><path d="M18 5v14"/><path d="M8 12h8"/>',
  bag: '<path d="M6 8h12l-1 12H7z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
  chat: '<path d="M21 11.5a8 8 0 0 1-8 8H8l-5 3 1.6-5A8 8 0 1 1 21 11.5z"/>',
  user: '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>',
  invoice: '<path d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2z"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h4"/>',
  note: '<path d="M5 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5z"/><path d="M15 4v4h4"/>',
  calendar: '<path d="M7 2v4"/><path d="M17 2v4"/><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  kanban: '<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="10" rx="1"/><rect x="17" y="4" width="4" height="13" rx="1"/>',
  ticket: '<path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M9 9h6"/><path d="M9 15h6"/>',
  tag: '<path d="M20 12 12 20 4 12V4h8z"/><circle cx="8" cy="8" r="1.5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.7 2.7 0 0 1 5 1.4c0 1.8-2.5 2-2.5 3.6"/><path d="M12 17h.01"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/><path d="m3 18 9 5 9-5"/>',
  image: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 16 5-5 4 4 3-3 6 6"/><circle cx="8" cy="9" r="1.5"/>',
  tree: '<path d="M12 3v18"/><path d="M7 8h10"/><path d="M6 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M18 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>',
  widgets: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M17 13v8"/><path d="M13 17h8"/>',
  form: '<circle cx="7" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><circle cx="7" cy="17" r="3"/><circle cx="17" cy="17" r="3"/>',
  table: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M9 5v14"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  moon: '<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8z"/>',
  bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  basket: '<path d="M6 9h12l-1 10H7z"/><path d="m8 9 4-6 4 6"/><path d="M10 13v3"/><path d="M14 13v3"/>',
  settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7.1 4l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.9 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.7 1z"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5"/><path d="M14 11v5"/>',
  upload: '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M20 16v4H4v-4"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>',
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  circle: '<circle cx="12" cy="12" r="9"/>'
};

function icon(name, cls = "") {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.circle}</svg>`;
}

function logo() {
  return `<svg class="rocket-logo" viewBox="0 0 56 56" aria-hidden="true">
    <path class="fin" d="M19 31 7 34l5-11 11-2z"/>
    <path class="body" d="M47 8c-12 1-22 8-29 20l-6 1 2 12 12-2 1-6C39 30 47 20 48 8z"/>
    <circle class="window" cx="35" cy="20" r="4"/>
    <path class="fin" d="m25 37-3 12 11-5 3-12z"/>
    <path fill="#49c8e6" d="M14 42c-4 1-7 4-8 8 4-1 7-3 9-7z"/>
  </svg>`;
}

function brand() {
  return `<a class="brand" href="${pageHref("dashboard")}">${logo()}<span>Spike Admin</span></a>`;
}

function pageHref(route) {
  return `${route}.html`;
}

function avatar(n = 1, extra = "") {
  return `<span class="avatar avatar-${n} ${extra}"></span>`;
}

function navLink(route, label, iconName, extra = "", activeRoute = route) {
  const current = currentRoute();
  const active = activeRoute && current === activeRoute ? "active" : "";
  return `<a class="nav-link ${active} ${extra}" href="${pageHref(route)}">${icon(iconName)}<span>${label}</span></a>`;
}

function subLink(route, label, activeRoute = route) {
  return `<a class="nav-link ${activeRoute && currentRoute() === activeRoute ? "active" : ""}" href="${pageHref(route)}"><span>${label}</span></a>`;
}

function sidebar() {
  return `<aside class="sidebar">
    ${brand()}
    <nav>
      <section class="nav-section">
        <div class="nav-heading">Home</div>
        ${navLink("dashboard1", "Dashboard", "dashboard")}
        ${navLink("dashboard2", "Dashboard 2", "chart", currentRoute() === "dashboard2" ? "success" : "")}
        <div class="nav-parent">${icon("home")}<span>Front Pages</span><span style="margin-left:auto">⌄</span></div>
      </section>
      <section class="nav-section">
        <div class="nav-heading">Apps</div>
        ${navLink("dashboard1", "Contact", "phone", "", null)}
        <div class="nav-parent">${icon("blog")}<span>Blog</span><span style="margin-left:auto">⌄</span></div>
        <div class="nav-parent">${icon("bag")}<span>E-Commerce</span><span style="margin-left:auto">⌄</span></div>
        ${navLink("dashboard1", "Chats", "chat", "", null)}
        <div class="nav-parent">${icon("user")}<span>Users Profile</span><span style="margin-left:auto">⌄</span></div>
        <div class="nav-parent">${icon("invoice")}<span>Invoice</span><span style="margin-left:auto">⌃</span></div>
        <div class="sub-links">
          ${subLink("invoice", "List")}
          ${subLink("invoice-details", "Details")}
          ${subLink("invoice-create", "Create")}
          ${subLink("invoice-create", "Edit", null)}
        </div>
        ${navLink("notes", "Notes", "note")}
        ${navLink("dashboard1", "Calendar", "calendar", "", null)}
        ${navLink("dashboard1", "Email", "mail", "", null)}
        ${navLink("dashboard1", "Kanban", "kanban", "", null)}
        ${navLink("dashboard1", "Tickets", "ticket", "", null)}
      </section>
      <section class="nav-section">
        <div class="nav-heading">Pages</div>
        ${navLink("pricing-admin", "Pricing", "tag", currentRoute() === "pricing-admin" ? "warning" : "")}
        ${navLink("dashboard1", "FAQ", "help", "", null)}
        ${navLink("account", "Account Setting", "settings", currentRoute() === "account" ? "success" : "")}
        ${navLink("about", "Landing Page", "layers")}
        ${navLink("tabs", "Gallery Lightbox", "image", "", null)}
        ${navLink("editable-table", "Search Results", "search", "", null)}
        ${navLink("dashboard1", "Social Contacts", "user", "", null)}
        ${navLink("dashboard1", "Treeview", "tree", "", null)}
        <div class="nav-parent">${icon("widgets")}<span>Widget</span><span style="margin-left:auto">⌃</span></div>
        <div class="sub-links">
          ${subLink("cards", "Cards")}
          ${subLink("cards", "Banners", null)}
          ${subLink("widgets-charts", "Charts")}
        </div>
      </section>
      <section class="nav-section">
        <div class="nav-heading">School Pages</div>
        ${navLink("dashboard1", "Teachers", "user", "", null)}
        ${navLink("dashboard1", "Exam", "invoice", "", null)}
        ${navLink("dashboard1", "Students", "bag", "", null)}
        ${navLink("dashboard1", "Classes", "home", "", null)}
        ${navLink("dashboard1", "Attendance", "ticket", "", null)}
      </section>
      <section class="nav-section">
        <div class="nav-heading">UI</div>
        <div class="nav-parent">${icon("grid")}<span>Ui Elements</span><span style="margin-left:auto">⌃</span></div>
        <div class="sub-links">
          ${subLink("alert", "Alert")}
          ${subLink("chip", "Chip")}
          ${subLink("dialogs", "Dialog")}
          ${subLink("tabs", "Tabs")}
        </div>
      </section>
      <section class="nav-section">
        <div class="nav-heading">Forms</div>
        ${navLink("form-layout", "Form Elements", "form")}
        ${navLink("form-layout", "Form Input", "table", "", null)}
        ${navLink("form-layout", "Editor", "edit", "", null)}
      </section>
      <section class="nav-section">
        <div class="nav-heading">Tables</div>
        ${navLink("editable-table", "Basic Table", "table", "", null)}
        ${navLink("editable-table", "Dark Table", "table", "", null)}
        ${navLink("editable-table", "Density Table", "table", "", null)}
        ${navLink("editable-table", "Editable Table", "edit", currentRoute() === "editable-table" ? "success" : "")}
      </section>
      <section class="nav-section">
        <div class="nav-heading">Charts</div>
        <div class="nav-parent">${icon("chart")}<span>Apex Charts</span><span style="margin-left:auto">⌃</span></div>
        <div class="sub-links">
          ${subLink("line-chart", "Line")}
          ${subLink("gradient-chart", "Gredient")}
        </div>
      </section>
      <section class="nav-section">
        <div class="nav-heading">Authentication</div>
        ${navLink("login", "Login", "login")}
      </section>
    </nav>
    <a class="sidebar-user" href="${pageHref("account")}">
      ${avatar(1)}
      <span><strong>Mike Nielsen</strong><span>Admin</span></span>
      ${icon("login")}
    </a>
  </aside>`;
}

function topbar() {
  return `<header class="topbar">
    <button class="hamburger" aria-label="Menu"><span></span></button>
    <div class="topbar-actions">
      <label class="search">${icon("search")}<input placeholder="Try to searching ..." /></label>
      <button class="icon-btn" aria-label="Theme">${icon("moon")}</button>
      <span class="flag" aria-hidden="true"></span>
      <button class="icon-btn" aria-label="Cart">${icon("basket")}<span class="count-badge">0</span></button>
      <button class="icon-btn" aria-label="Notifications">${icon("bell")}<span class="badge-dot"></span></button>
      <a class="user-pill" href="${pageHref("account")}">${avatar(1)}<div><strong>Mike Nielsen</strong><span>Admin</span></div></a>
    </div>
  </header>`;
}

function adminShell(content, title, options = {}) {
  const pageTitle = options.noTitle ? "" : pageTitleCard(title, options.breadcrumb || "Home");
  return `<div class="admin-layout">
    ${sidebar()}
    <main class="admin-main">
      ${topbar()}
      ${pageTitle}
      <div class="page-view">${content}</div>
    </main>
    <button class="floating-settings" aria-label="Settings">${icon("settings")}</button>
    ${options.toast ? toast() : ""}
    ${options.modal ? dialogModal(true) : ""}
  </div>`;
}

function pageTitleCard(title, home = "Dashboard") {
  return `<section class="page-title-card">
    <h1>${title}</h1>
    <div class="breadcrumb"><strong>${home}</strong><span>•</span><span>${title}</span></div>
  </section>`;
}

function toast() {
  return `<div class="toast">
    ${icon("info")}
    <div><strong>Welcome to Spike Admin</strong><span>Easy to customize the Template!!!</span></div>
    ${icon("x")}
  </div>`;
}

function businessArt(small = false) {
  return `<div class="business-art ${small ? "small" : ""}" aria-hidden="true">
    <div class="plant"><span></span><span></span><span></span></div>
    <div class="desk-man"><i class="hair"></i><i class="head"></i><i class="body"></i><i class="shirt"></i><i class="arm left"></i><i class="arm right"></i><i class="laptop"></i></div>
  </div>`;
}

function orderRow(color, iconName, title, sub) {
  return `<div class="order-row">
    <span class="round-icon ${color}">${icon(iconName)}</span>
    <div><strong>${title}</strong><span>${sub}</span></div>
  </div>`;
}

function welcomeCard(compact = false) {
  return `<section class="card welcome-card ${compact ? "compact" : ""}">
    <h2>${compact ? "Welcome Jonathan Deo" : "Congratulations Jonathan"}</h2>
    <p class="subtle">${compact ? "Check all the statistics" : "You have done 38% more sales"}</p>
    ${compact ? `<a class="btn" style="margin-top:22px" href="${pageHref("dashboard1")}">Visit Now</a>` : `
      <div class="orders">
        ${orderRow("success", "basket", "64 new orders", "Processing")}
        ${orderRow("warning", "invoice", "4 orders", "On hold")}
        ${orderRow("info", "bag", "12 orders", "Delivered")}
      </div>`}
    ${businessArt(compact)}
  </section>`;
}

function metricTile(iconName, number, change, label, modifier = "") {
  return `<section class="metric-tile ${modifier}">
    <span class="tiny-icon">${icon(iconName)}</span>
    <strong>${number} <small>${change}</small></strong>
    <span>${label}</span>
  </section>`;
}

function tinyBars() {
  const fills = ["35%", "48%", "34%", "44%", "53%", "39%", "50%"];
  return `<div class="tiny-bars">${fills.map((fill) => `<span style="--fill:${fill}"></span>`).join("")}</div>`;
}

function paymentCard() {
  return `<section class="card padded">
    <div class="card-title"><div><h3>Payments</h3><p>Last 7 days</p></div><div><h3>12,389</h3><span class="percent-pill warning">-3.8%</span></div></div>
    ${tinyBars()}
    <div class="bar-labels" style="grid-column:auto;gap:18px"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
    <div style="display:grid;gap:10px;margin-top:26px">
      <div style="display:flex;justify-content:space-between"><span><i style="display:inline-block;width:11px;height:11px;border-radius:50%;border:2px solid var(--info);margin-right:8px"></i>Paypal</span><b>52%</b></div>
      <div style="display:flex;justify-content:space-between"><span><i style="display:inline-block;width:11px;height:11px;border-radius:50%;border:2px solid #8b96a5;margin-right:8px"></i>Credit Card</span><b>48%</b></div>
    </div>
  </section>`;
}

function productCard() {
  return `<section class="card padded">
    <div class="card-title"><div><h3>Products</h3><p>Last 7 days</p></div><div><h3>432</h3><span class="percent-pill success">+26.5%</span></div></div>
    <div class="donut"></div>
    <p class="center-text muted"><strong>$18k</strong> Profit more than last month</p>
  </section>`;
}

function dealCard() {
  return `<section class="card padded">
    <div class="card-title"><div><h3>Latest Deal</h3><p>Last 7 days</p></div><span class="percent-pill success">86.5%</span></div>
    <div style="display:flex;justify-content:space-between;margin:44px 0 7px;color:var(--ink);font-weight:800"><span>$98,500</span><span>$1,22,900</span></div>
    <div class="progress" style="--bar:var(--primary);--value:78%"><span></span></div>
    <p class="muted" style="margin-top:10px">Coupons used: 18/22</p>
    <h4 style="margin:34px 0 12px;color:var(--ink)">Recent Purchasers</h4>
    <div class="deal-avatars">${[1,2,3,4].map((n) => avatar(n)).join("")}<span class="more-avatar">+8</span></div>
  </section>`;
}

function customerCard() {
  return `<section class="card padded">
    <div class="card-title"><div><h3>Customers</h3><p>Last 7 days</p></div><div><h3>6,380</h3><span class="percent-pill success">+26.5%</span></div></div>
    ${miniLine([35, 78, 42, 60, 30, 45])}
    <div style="display:grid;grid-template-columns:1fr auto;gap:14px;margin-top:24px;color:var(--muted)">
      <span>April 07 - April 14</span><span>6,380</span>
      <span>Last Week</span><span>4,298</span>
    </div>
  </section>`;
}

function miniLine(points = [30, 55, 43, 70, 62, 84, 68]) {
  const width = 310;
  const height = 150;
  const step = width / (points.length - 1);
  const path = points.map((y, i) => `${i === 0 ? "M" : "L"} ${i * step} ${height - y}`).join(" ");
  return `<svg class="mini-line" viewBox="0 0 ${width} ${height}" aria-hidden="true">
    <path d="${path}" fill="none" stroke="var(--primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="draw"/>
  </svg>`;
}

function lineChart() {
  return `<svg class="chart-svg" viewBox="0 0 620 250" aria-hidden="true">
    ${[40, 88, 136, 184, 232].map((y) => `<line class="grid-line" x1="45" y1="${y}" x2="600" y2="${y}"/>`).join("")}
    ${[45, 138, 231, 324, 417, 510, 600].map((x) => `<line class="grid-line" x1="${x}" y1="40" x2="${x}" y2="232"/>`).join("")}
    <path class="draw" d="M45 230 C78 205 88 110 125 100 S200 160 235 150 300 100 345 118 402 168 445 93 505 150 545 96 575 57 600 52" fill="none" stroke="#0085db" stroke-width="4" stroke-linecap="round"/>
    <path class="draw delay" d="M45 230 C88 185 100 155 145 150 S204 95 250 130 310 170 348 100 405 160 445 150 500 93 540 130 572 98 600 92" fill="none" stroke="#73cdfc" stroke-width="4" stroke-linecap="round"/>
    ${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => `<text class="label" x="${40 + i * 93}" y="248">${d}</text>`).join("")}
    ${["0","8","16","24","32"].map((d, i) => `<text class="label" x="5" y="${236 - i * 48}">${d}</text>`).join("")}
  </svg>`;
}

function fullLineChart() {
  return `<svg class="chart-svg" viewBox="0 0 1000 260" aria-hidden="true">
    ${[50, 95, 140, 185, 230].map((y) => `<line class="grid-line" x1="70" y1="${y}" x2="955" y2="${y}"/>`).join("")}
    <path class="draw" d="M75 133 L220 126 L365 102 L510 84 L655 106 L810 106 L950 99" fill="none" stroke="#299cff" stroke-width="3" stroke-linecap="round"/>
    <path class="draw delay" d="M75 204 L220 209 L365 192 L510 166 L655 172 L810 194 L950 194" fill="none" stroke="#9aa5b2" stroke-width="3" stroke-linecap="round"/>
    ${["Jan","Feb","Mar","Apr","May","Jun","Jul"].map((m, i) => `<text class="label" x="${72 + i * 146}" y="252">${m}</text>`).join("")}
    ${["7","14","21","28","35","42"].map((m, i) => `<text class="label" x="24" y="${232 - i * 36}">${m}</text>`).join("")}
  </svg>`;
}

function gradientChart() {
  return `<svg class="chart-svg" viewBox="0 0 1000 260" aria-hidden="true">
    <defs><filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="7" stdDeviation="4" flood-color="#0085db" flood-opacity=".18"/></filter></defs>
    ${[50, 95, 140, 185, 230].map((y) => `<line class="grid-line" x1="70" y1="${y}" x2="955" y2="${y}"/>`).join("")}
    <path class="draw" filter="url(#softShadow)" d="M75 205 C110 205 118 216 145 204 175 190 178 170 210 173 240 176 270 179 285 150 305 109 316 55 350 72 376 84 382 148 420 149 456 150 462 128 500 124 538 120 542 183 575 184 605 185 622 158 650 161 685 166 690 193 718 190 755 186 755 125 790 139 824 154 813 212 852 201 883 193 882 167 915 169 944 172 943 200 972 203" fill="none" stroke="#278fff" stroke-width="6" stroke-linecap="round"/>
    ${["Feb 10","Mar 00","Apr 00","May 00","Jun 00","Jul 00","Aug 00","Sep 00","Oct 00","Nov 00","Dec 00","2001","Feb 01","Mar 01","Apr 01","May 01","Jun 01"].map((m, i) => `<text class="label" x="${70 + i * 55}" y="252">${m}</text>`).join("")}
  </svg>`;
}

function productTable() {
  const rows = [
    ["phone", "iPhone 13 pro ...", "$180/ 499", "Partially paid", "Confirmed", "violet", "#ffbd6f", "45%"],
    ["laptop", "Apple MacBoo...", "$120/ 499", "Full paid", "Confirmed", "success", "#49d68d", "100%"],
    ["game", "PlayStation 5 ...", "$120/ 499", "Cancelled", "Cancelled", "error", "#ff917d", "100%"],
    ["chair", "Amazon Basic...", "$120/ 499", "Partially paid", "Confirmed", "violet", "#ffbd6f", "45%"],
    ["tv", "Sony X85J 75 I...", "$120/ 499", "Full paid", "Confirmed", "success", "#49d68d", "100%"]
  ];
  return `<section class="card padded span-7">
    <table class="table">
      <thead><tr><th>Products</th><th>Payment</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows.map((r) => `<tr>
        <td><div class="product"><span class="product-thumb ${r[0]}"></span><span>${r[1]}</span></div></td>
        <td><strong>${r[2]}</strong><br><span class="muted">${r[3]}</span><div class="progress" style="--bar:${r[6]};--value:${r[7]};width:150px;margin-top:6px"><span></span></div></td>
        <td><span class="status ${r[5]}">${r[4]}</span></td>
        <td><span class="action-dots">⋮</span></td>
      </tr>`).join("")}</tbody>
    </table>
  </section>`;
}

function mapCard() {
  const rows = [["LA", "28%", "#49c8e6", "28%"], ["NY", "21%", "#0085db", "21%"], ["KA", "18%", "#ff927d", "18%"], ["AZ", "12%", "#9b78ff", "12%"]];
  return `<section class="card padded span-5 map-card">
    <div class="card-title"><h3>Visit From USA</h3></div>
    <svg viewBox="0 0 420 190" aria-hidden="true">
      <path d="M35 70 C75 45 115 48 146 58 177 67 195 42 226 52 262 65 287 64 322 50 365 32 394 59 386 91 377 128 329 131 299 118 260 102 245 140 205 134 164 128 146 106 116 118 86 130 49 111 35 70z" fill="#dedede"/>
      <path d="M60 73 C82 62 116 63 136 72 124 88 98 96 71 91z" fill="#0085db"/>
      <path d="M277 86 C290 79 306 82 312 96 297 105 284 101 277 86z" fill="#49d68d"/>
      <path d="M246 96 C260 93 274 101 280 117 262 121 250 113 246 96z" fill="#49c8e6"/>
    </svg>
    <div class="map-lines">${rows.map(([city, pct, color, val]) => `<div class="map-row"><span>${city}</span><div class="progress" style="--bar:${color};--value:${val}"><span></span></div><span>${pct}</span></div>`).join("")}</div>
  </section>`;
}

function latestReviews() {
  const rows = [
    ["phone", "iPhone 13 pro ...", 2, "Arlene McCoy", "macoy@arlene.com", "This theme is great. Clean and easy to understand....", "Confirmed", "success"],
    ["laptop", "Apple MacBoo...", 5, "Jerome Bell", "belljerome@yahoo.com", "It is a Mac, after all. Once you have gone Mac, there s no...", "Pending", "warning"],
    ["game", "PlayStation 5 ...", 3, "Jacob Jones", "jones009@hotmail.com", "The best experience we could hope for. Customer...", "Pending", "warning"],
    ["chair", "Amazon Basic...", 4, "Annette Black", "blackanne@yahoo.com", "The controller is quite comfy for me. Despiteits increase...", "Confirmed", "success"],
    ["tv", "Sony X85J 75 I...", 1, "Albert Flores", "albertflo9@gmail.com", "This theme is great. Perfect for those whodon want hav...", "Pending", "warning"]
  ];
  return `<section class="card padded span-12">
    <div class="reviews-head">
      <div><h2 style="margin:0;color:var(--ink)">Latest Reviews</h2><p class="subtle">Reviewd received across all channels</p></div>
      <label class="search" style="border-radius:7px;width:220px">${icon("search")}<input placeholder="Search"/></label>
    </div>
    <table class="table">
      <thead><tr><th style="width:44px"><span class="check"></span></th><th>Products</th><th>Customer</th><th>Reviews</th><th>Status</th><th>Time</th><th></th></tr></thead>
      <tbody>${rows.map((r) => `<tr>
        <td><span class="check"></span></td>
        <td><div class="product"><span class="product-thumb ${r[0]}"></span><span>${r[1]}</span></div></td>
        <td><div style="display:grid;grid-template-columns:34px 1fr;gap:12px;align-items:center">${avatar(r[2])}<div><strong>${r[3]}</strong><br><span class="muted">${r[4]}</span></div></div></td>
        <td><div class="stars">★★★★☆</div><div>${r[5]}</div></td>
        <td><span class="status ${r[7]}">${r[6]}</span></td>
        <td><strong>Nov 8</strong></td><td>⋮</td>
      </tr>`).join("")}</tbody>
    </table>
    <div class="pagination"><span>1-6 of 32</span><div class="pager"><span>‹</span><span class="active">1</span><span>2</span><span>...</span><span>4</span><span>›</span></div></div>
  </section>`;
}

function dashboard1() {
  return `<div class="grid grid-12">
    <section class="span-6 card" style="overflow:hidden">
      ${welcomeCard(false).replace('class="card welcome-card', 'class="welcome-card')}
      <div style="padding:30px 34px 22px;border-top:1px solid var(--line)">
        <div class="card-title"><div><h3>Total Orders</h3><p>Weekly order updates</p></div><button class="btn secondary" style="min-height:40px">This Week <span>⌄</span></button></div>
        ${lineChart()}
      </div>
    </section>
    <div class="span-6 grid grid-12">
      <div class="span-6">${paymentCard()}</div>
      <div class="span-6">${productCard()}</div>
      <div class="span-6">${dealCard()}</div>
      <div class="span-6">${customerCard()}</div>
    </div>
    ${productTable()}
    ${mapCard()}
    ${latestReviews()}
  </div>`;
}

function dashboard2() {
  return `<div class="grid grid-12">
    <div class="span-5">${welcomeCard(true)}</div>
    <div class="span-7 grid grid-12">
      <div class="span-4">${metricTile("tag", "2358", "+23%", "Sales")}</div>
      <div class="span-4">${metricTile("upload", "356", "+8%", "Refunds", "coral")}</div>
      <div class="span-4">${metricTile("invoice", "$23.8K", "-3%", "Earnings", "cyan")}</div>
    </div>
    <section class="card padded span-8">
      <div class="card-title"><h2>Profit & Expenses</h2><span class="action-dots">⋮</span></div>
      <div class="grid grid-12">
        <div class="span-7">
          <div class="bar-chart">
            <div class="bar-axis"><span>80</span><span>60</span><span>40</span><span>20</span><span>0</span></div>
            <div class="bars">${["92px","126px","88px","118px","102px","76px","96px"].map((h) => `<div class="stack-bar" style="--h:${h}"><i></i><i></i></div>`).join("")}</div>
            <div class="bar-labels"><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span></div>
          </div>
        </div>
        <div class="span-5 report-side">
          ${moneyRow("error", "tag", "$63,489.50", "Total Earnings")}
          ${moneyRow("info", "edit", "$48,820.00", "Profit this year", "23%")}
          ${moneyRow("", "settings", "$103,582.50", "Overall earnings")}
          <a class="btn" href="${pageHref("widgets-charts")}">View Full Report</a>
        </div>
      </div>
    </section>
    <section class="card padded span-4">
      <div class="card-title"><h2>Product Sales</h2><span class="action-dots">⋮</span></div>
      ${miniLine([34,60,48,88,75,120,95])}
      <div class="money-row" style="margin-top:24px">${iconCircle("primary", "user")}<div><strong>36,436 <span class="percent-pill success">+12%</span></strong><span class="muted">New Customer</span></div></div>
    </section>
    <section class="card padded span-6">
      <div class="card-title"><h2>Traffic Distribution</h2><span class="action-dots">⋮</span></div>
      <div style="display:grid;grid-template-columns:260px 1fr;gap:40px;align-items:center">
        <div class="donut big"></div>
        <div style="display:grid;gap:28px">${legendLine("primary", "4,106", "Organic Traffic", "+23%")}${legendLine("error", "3,500", "Referral Traffic")}${legendLine("warning", "3,319", "Direct Traffic")}</div>
      </div>
    </section>
    <div class="span-6 grid grid-12">
      <section class="card padded span-6" style="background:#e5f6ff;overflow:hidden">
        <span class="round-icon info">${icon("info")}</span>
        <div style="margin-top:50px;display:flex;justify-content:space-between;font-weight:800;color:var(--ink)"><span>New Goals</span><span>83%</span></div>
        <div class="progress" style="--value:83%;margin-top:16px"><span></span></div>
      </section>
      <section class="card gift-card span-6">
        <div class="gift-art"><span class="gift-box"></span></div>
        <div style="padding:26px"><h3 style="margin:0;color:var(--ink)">Figma Tips and Tricks with Stephan</h3><p class="muted">Checkout latest events going to happen in USA.</p><div class="deal-avatars">${[4,3,1,5].map((n) => avatar(n)).join("")}<span class="more-avatar">+18</span></div></div>
      </section>
      <section class="card padded span-6" style="background:#fff8eb">
        ${avatar(4, "avatar-lg")}
        <div style="float:right;color:#ffb767;font-weight:800">#1 in DevOps</div>
        <h3 style="margin:36px 0 0;color:var(--ink)">Adam Johnson</h3><p class="muted">Top Developer</p>
      </section>
    </div>
    ${employeesTable()}
    ${scheduleCard()}
  </div>`;
}

function moneyRow(color, ic, amount, label, tag = "") {
  return `<div class="money-row">${iconCircle(color || "default", ic)}<div><strong>${amount} ${tag ? `<span style="color:var(--success);font-size:13px">${tag}</span>` : ""}</strong><span class="muted">${label}</span></div></div>`;
}

function iconCircle(color, ic) {
  return `<span class="round-icon ${color}">${icon(ic)}</span>`;
}

function legendLine(color, amount, label, tag = "") {
  const stroke = color === "primary" ? "var(--primary)" : color === "error" ? "var(--error)" : "var(--warning)";
  return `<div style="display:grid;grid-template-columns:16px 1fr;gap:14px;align-items:start"><span style="width:14px;height:14px;border-radius:50%;border:2px solid ${stroke};margin-top:6px"></span><div><strong style="font-size:20px;color:var(--ink)">${amount} ${tag ? `<span style="color:var(--success);font-size:12px">${tag}</span>` : ""}</strong><br><span class="muted">${label}</span></div></div>`;
}

function employeesTable() {
  const rows = [["Mark J. Freeman", "Developer", "$80/hour", "HTML", "Available", "success", 4], ["Nina R. Oldman", "Designer", "$70/hour", "JavaScript", "On Holiday", "info", 2], ["Arya H. Shah", "Developer", "$40/hour", "React", "Absent", "error", 3], ["June R. Smith", "Designer", "$20/hour", "Vuejs", "On Leave", "warning", 1], ["Mark J. Freeman", "Developer", "$65/hour", "Angular", "Available", "violet", 5]];
  return `<section class="card padded span-8">
    <div class="card-title"><h2>Top Employees</h2><span class="action-dots">⋮</span></div>
    <table class="table"><thead><tr><th>Profile</th><th>Hour Rate</th><th>Skills</th><th>Status</th></tr></thead><tbody>
      ${rows.map((r) => `<tr><td><div style="display:grid;grid-template-columns:44px 1fr;gap:14px;align-items:center">${avatar(r[6])}<div><strong>${r[0]}</strong><br><span>${r[1]}</span></div></div></td><td><strong>${r[2]}</strong></td><td>${r[3]}</td><td><span class="status ${r[5]}">${r[4]}</span></td></tr>`).join("")}
    </tbody></table>
  </section>`;
}

function scheduleCard() {
  return `<section class="card padded span-4 schedule-card">
    <div class="card-title"><h2>Upcoming Scheduls</h2><span class="action-dots">⋮</span></div>
    <div class="tab-demo-bar" style="background:transparent;color:var(--ink);gap:38px;margin-bottom:28px"><span class="btn">1 to 3</span><b>4 to 7</b><b>8 to 10</b></div>
    <div class="schedule-times"><span>8:00</span><span>8:30</span><span>9:00</span><span>9:30</span><span>10:00</span><span>10:30</span><span>11:00</span></div>
    <div class="event-card"><h3 style="margin:0;color:var(--ink)">Marketing Meeting</h3><p class="muted">08:30 - 10:00</p><div class="deal-avatars">${[2,3,1,5].map((n) => avatar(n)).join("")}<span class="more-avatar">+18</span></div></div>
    <div class="event-card green"><h3 style="margin:0;color:var(--ink)">Applied mathematics</h3><p class="muted">10:15 - 11:45</p><div class="deal-avatars">${[4,3,1,5].map((n) => avatar(n)).join("")}<span class="more-avatar">+18</span></div></div>
  </section>`;
}

function invoiceList() {
  const rows = [["101","PineappleInc.","Redq Inc.","165","Shipped","success"], ["102","Pineapple.","ME Inc.","99","Delivered","info"], ["103","Incorporation.","Redirwed.","99","Pending","warning"], ["104","PineappleTimes.","RFc.","99","Shipped","success"], ["105","FortuneCreation","Soft solution.","99","Delivered","info"], ["106","PineappleTimes.","RFc.","99","Shipped","success"], ["107","FortuneCreation","Soft solution.","99","Delivered","info"]];
  return `<section class="card padded">
    <div class="summary-strip" style="padding:0;margin-bottom:36px">${summaryItem("primary","invoice","Total","7 invoices","$46,218.04", true)}${summaryItem("success","home","Shipped","3 invoices","$23,110.23")}${summaryItem("info","user","Delivered","3 invoices","$13,825.05")}${summaryItem("warning","bag","Pending","1 invoices","$4,655.63")}</div>
    <div class="toolbar-row"><label class="search" style="border-radius:7px;width:310px">${icon("search")}<input placeholder="Search Invoice"/></label><a class="btn" href="${pageHref("invoice-create")}">New Invoice</a></div>
    <table class="table"><thead><tr><th><span class="check"></span></th><th>ID</th><th>BILL FROM</th><th>BILL TO</th><th>TOTAL COST</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>
      ${rows.map((r) => `<tr><td><span class="check"></span></td><td>${r[0]}</td><td><strong>${r[1]}</strong></td><td>${r[2]}</td><td>${r[3]}</td><td><span class="status ${r[5]}">${r[4]}</span></td><td><div class="action-circles"><a class="circle-action" style="color:var(--success);background:var(--success-soft)" href="${pageHref("invoice-create")}">${icon("edit")}</a><a class="circle-action" style="color:var(--primary);background:var(--primary-soft)" href="${pageHref("invoice-details")}">${icon("eye")}</a><span class="circle-action" style="color:var(--error);background:var(--error-soft)">${icon("trash")}</span></div></td></tr>`).join("")}
    </tbody></table>
  </section>`;
}

function summaryItem(color, ic, title, count, amount, active = false) {
  return `<div class="summary-item ${active ? "active" : ""}"><span class="round-icon ${color}">${icon(ic)}</span><div><h3>${title}</h3><p>${count}</p><strong>${amount}</strong></div></div>`;
}

function invoiceCreate() {
  return `<section class="card padded">
    <h2 style="margin:0 0 34px;color:var(--ink)">Add New Invoice Details</h2>
    <p style="font-size:18px;color:#4e596b">ID: 108<br>Date: Fri, Jun 19, 2026</p>
    <div class="form-section" style="margin:30px 0 42px">
      <div class="form-grid">
        ${formGroup("Bill From", "", 4)}${formGroup("Bill To", "", 4)}${formGroup("Status", "Pending", 4, "select")}
        ${formGroup("From Address", "", 6)}${formGroup("Bill To Address", "", 6)}
      </div>
    </div>
    <table class="table"><thead><tr><th></th><th>Item Name</th><th>Unit Price</th><th>Units</th><th>Total Cost</th><th>Actions</th></tr></thead><tbody><tr>
      <td><span class="round-icon primary" style="width:40px;height:40px">${icon("plus")}</span></td>
      <td><input class="input" placeholder="Item Name"/></td>
      <td><input class="input" value="0"/></td>
      <td><input class="input" value="0"/></td>
      <td>0</td>
      <td><span class="circle-action" style="color:var(--error);background:var(--error-soft)">${icon("trash")}</span></td>
    </tr></tbody></table>
    <div class="invoice-total"><div><span>Sub Total:</span><span>0</span></div><div><span>Vat:</span><span>0</span></div><div><span>Grand Total:</span><span>0</span></div></div>
    <div style="display:flex;justify-content:flex-end;gap:16px;margin-top:32px"><button class="btn">Create Invoice</button><button class="btn error">Cancel</button></div>
  </section>`;
}

function formGroup(label, value = "", span = 6, type = "input") {
  const tag = type === "select" ? `<select class="select"><option>${value || "select"}</option></select>` : `<input class="input" value="${value}" placeholder="${value || label}"/>`;
  return `<div class="form-group span-${span}"><label>${label}</label>${tag}</div>`;
}

function invoiceDetails() {
  return `<section class="card invoice-detail">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      ${brand()}
      <div style="text-align:right"><span class="status info">Delivered</span><h3 style="margin:6px 0 0;color:var(--ink)"># 102</h3></div>
    </div>
    <div class="invoice-info">
      <div><h4>Bill From</h4><p>Pineapple.<br>first@spike.com<br>Ganesh Glory, Godrej garden city, Ahmedabad.<br>979796786</p></div>
      <div style="text-align:right"><h4>Bill To</h4><p>ME Inc.<br>toFirst@gmail.com<br>Godrej garden city, Ahmedabad.<br>775752533</p></div>
    </div>
    <table class="table" style="margin-top:40px"><thead><tr><th>Item Name</th><th>Unit Price</th><th>Unit</th><th style="text-align:right">Total Cost</th></tr></thead><tbody><tr><td>Course</td><td>10</td><td>9</td><td style="text-align:right">90</td></tr></tbody></table>
    <div class="invoice-total"><div><span>Sub Total:</span><span>90</span></div><div><span>Vat:</span><span>9</span></div><div><span>Grand Total:</span><span>99</span></div></div>
    <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px"><a class="btn warning" href="${pageHref("invoice-create")}">Edit Invoice</a><a class="btn" href="${pageHref("invoice")}">Back To Invoice List</a></div>
  </section><div class="empty-space"></div>`;
}

function notesPage() {
  const notes = [["Lorem ipsum dolor sit amet...","6/4/2023","primary"],["Sed ut perspiciatis unde o...","6/3/2023","error"],["consectetur, adipisci velit,...","6/2/2023","warning"],["Lorem ipsum dolor sit amet","6/4/2023","success"]];
  return `<section class="card padded notes-layout">
    <aside><h3 style="margin:0 0 12px;color:var(--ink)">All Notes</h3><label class="search" style="width:100%;border-radius:4px"><input placeholder="Search Notes"/>${icon("search")}</label><div class="notes-list" style="margin-top:16px">${notes.map((n) => `<div class="note-item ${n[2]}"><strong>${n[0]}</strong><small>${n[1]}</small></div>`).join("")}</div></aside>
    <main><div class="card-title"><h3>Edit Notes</h3><a class="btn" href="${pageHref("notes")}">Add Notes</a></div><div class="form-group"><label>Change Title</label><textarea class="textarea">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</textarea></div><h4 style="margin:32px 0 16px;color:var(--ink)">Change Notes Color</h4><div class="swatches"><span class="swatch" style="background:var(--warning)"></span><span class="swatch" style="background:#8b96a5"></span><span class="swatch" style="background:var(--error)"></span><span class="swatch" style="background:var(--success)"></span><span class="swatch active" style="background:var(--primary)"></span></div></main>
  </section><div class="empty-space"></div>`;
}

function accountPage() {
  return `<section class="card section-card">
    <div class="tabs-line"><span class="tab-item active">${icon("user")}Account</span><span class="tab-item">${icon("bell")}Notification</span><span class="tab-item">${icon("invoice")}Bills</span><span class="tab-item">${icon("lock")}Security</span></div>
    <div class="settings-grid">
      <div class="inner-card profile-change"><div style="width:100%"><h3>Change Profile</h3><p class="muted">Change your profile picture from here</p></div>${avatar(4, "avatar-lg")}<div style="display:flex;gap:16px"><button class="btn">Upload</button><button class="btn secondary" style="color:var(--error);border-color:var(--error)">Reset</button></div><p class="muted">Allowed JPG, GIF or PNG. Max size of 800K</p></div>
      <div class="inner-card"><h3>Change Password</h3><p class="muted">To change your password please confirm here</p><div class="form-grid" style="margin-top:26px">${formGroup("Current Password", "••••••••••••", 12)}${formGroup("New Password", "••••••••••••", 12)}${formGroup("Confirm Password", "••••••••••••", 12)}</div></div>
      <div class="inner-card" style="grid-column:1 / -1"><h3>Personal Details</h3><p class="muted">To change your personal detail , edit and save from here</p><div class="form-grid" style="margin-top:24px">${formGroup("Your Name","Mike Nielsen",6)}${formGroup("Store Name","Maxima Studio",6)}${formGroup("Location","United States",6,"select")}${formGroup("Currency","US Dollar ($)",6,"select")}${formGroup("Email","info@Spike.com",6)}${formGroup("Phone","+9112345 65478",6)}${formGroup("Address","814 Howard Street, 120065, India",12)}</div></div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:18px;padding:0 30px 30px"><button class="btn">Save</button><button class="btn error" style="background:var(--error-soft);color:var(--error);box-shadow:none">Cancel</button></div>
  </section>`;
}

function pricingAdmin() {
  const cards = [["SILVER", "Free", "", ["3 Members","Single Device","50GB Storage","Monthly Backups","Permissions & workflows"], [0,1]], ["BRONZE", "4.99", "/mo", ["5 Members","Multiple Device","80GB Storage","Monthly Backups","Permissions & workflows"], [0,1,2]], ["GOLD", "9.99", "/mo", ["5 Members","Single Device","120GB Storage","Monthly Backups","Permissions & workflows"], [0,1,2,3,4]]];
  return `<div class="admin-pricing">
    <h2 class="front-title">Flexible Plans Tailored to Fit Your<br>Community's Unique Needs!</h2>
    <div style="display:flex;align-items:center;justify-content:center;gap:20px;margin:34px 0 90px;font-size:18px"><span>Monthly</span><span class="toggle"><span></span></span><span>Yearly</span></div>
    <div class="grid grid-12">${cards.map((c, idx) => `<section class="card plan-card span-4"><div style="display:flex;justify-content:space-between"><strong class="muted">${c[0]}</strong>${idx === 1 ? '<span class="status warning">POPULAR</span>' : ""}</div><span class="plant-icon"><i></i><i></i><i></i></span><div class="price">${c[1] === "Free" ? "Free" : `<small>$</small>${c[1]}<small>${c[2]}</small>`}</div><ul class="feature-list">${c[3].map((f, i) => `<li class="${c[4].includes(i) ? "" : "off"}">${f}</li>`).join("")}</ul><a class="btn" style="width:100%" href="${pageHref("pricing-admin")}">Choose ${c[0][0] + c[0].slice(1).toLowerCase()}</a></section>`).join("")}</div>
  </div>`;
}

function cardsPage() {
  return `<div class="grid grid-12">
    <div class="span-3">${metricTile("tag", "2358", "+23%", "Sales")}</div>
    <div class="span-3">${metricTile("upload", "356", "+8%", "Refunds", "coral")}</div>
    <div class="span-3">${metricTile("invoice", "$23.8K", "-3%", "Earnings", "cyan")}</div>
    <div class="span-3">${metricTile("tag", "2358", "+23%", "Sales")}</div>
    <div class="span-6">${welcomeCard(false)}</div>
    <section class="card padded span-3" style="background:#e5f6ff"><span class="round-icon info">${icon("info")}</span><div style="margin-top:50px;display:flex;justify-content:space-between;font-weight:800;color:var(--ink)"><span>New Goals</span><span>83%</span></div><div class="progress" style="--value:83%;margin-top:16px"><span></span></div></section>
    <section class="card padded span-3" style="background:#fff8eb">${avatar(4, "avatar-lg")}<div style="float:right;color:#ffb767;font-weight:800">#1 in DevOps</div><h3 style="margin:36px 0 0;color:var(--ink)">Adam Johnson</h3><p class="muted">Top Developer</p></section>
    <section class="card gift-card span-3"><div class="gift-art"><span class="gift-box"></span></div><div style="padding:26px"><h3 style="margin:0;color:var(--ink)">Figma Tips and Tricks with Stephan</h3><p class="muted">Checkout latest events going to happen in USA.</p><div class="deal-avatars">${[4,3,1,5].map((n) => avatar(n)).join("")}<span class="more-avatar">+18</span></div></div></section>
    ${scheduleCard().replace("span-4", "span-4")}
    ${paymentGateways()}
    ${recentTransactions()}
  </div>`;
}

function paymentGateways() {
  const rows = [["Paypal","Big Brands","+$6,235","primary"],["Wallet","Bill payment","+$345","error"],["Credit Card","Money reversed","+$2,235","violet"],["Bank Transfer","Money added","-$320","success"],["Refund","Bill Payment","-$32","warning"]];
  return `<section class="card padded span-4"><div class="card-title"><div><h2>Payment Gateways</h2><p>Platform For Income</p></div></div><div style="display:grid;gap:26px">${rows.map((r) => `<div class="money-row">${iconCircle(r[3], "tag")}<div><strong>${r[0]}</strong><br><span class="muted">${r[1]}</span></div><strong style="margin-left:auto">${r[2]}</strong></div>`).join("")}</div><a class="btn secondary" style="width:100%;margin-top:34px" href="${pageHref("cards")}">View All Transactions</a></section>`;
}

function recentTransactions() {
  const rows = [["09:30","Payment received from John Doe of $385.90","primary"],["10:00 am","New sale recorded #ML-3467","info"],["12:00 am","Payment was made of $64.95 to Michael","success"],["09:30 am","New sale recorded #ML-3467","warning"],["09:30 am","New arrival recorded #ML-3467","error"],["12:00 am","Payment Done","success"]];
  return `<section class="card padded span-4"><div class="card-title"><h2>Recent Transactions</h2></div><div class="timeline-list">${rows.map((r) => `<div class="timeline-row"><strong>${r[0]}</strong><span class="timeline-dot" style="border-color:var(--${r[2]})"></span><div>${r[1]}</div></div>`).join("")}</div></section>`;
}

function widgetsCharts() {
  return `<div class="grid grid-12">
    <section class="card padded span-8"><div class="card-title"><h2>Profit & Expenses</h2><span class="action-dots">⋮</span></div><div class="grid grid-12"><div class="span-7"><div class="bar-chart"><div class="bar-axis"><span>80</span><span>60</span><span>40</span><span>20</span><span>0</span></div><div class="bars">${["138px","120px","96px","130px","110px","90px","112px"].map((h) => `<div class="stack-bar" style="--h:${h}"><i></i><i></i></div>`).join("")}</div><div class="bar-labels"><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span></div></div></div><div class="span-5 report-side">${moneyRow("error","tag","$63,489.50","Total Earnings")}${moneyRow("info","edit","$48,820.00","Profit this year","23%")}${moneyRow("","settings","$103,582.50","Overall earnings")}<a class="btn" href="${pageHref("widgets-charts")}">View Full Report</a></div></div></section>
    <section class="card padded span-4"><div class="card-title"><h2>Product Sales</h2><span class="action-dots">⋮</span></div>${miniLine([34,60,48,88,75,120,95])}<div class="money-row" style="margin-top:24px">${iconCircle("primary", "user")}<div><strong>36,436 <span class="percent-pill success">+12%</span></strong><span class="muted">New Customer</span></div></div></section>
    <section class="card padded span-6"><div class="card-title"><div><h2>Net Sells</h2><p>Payment received across all channels</p></div><button class="btn secondary">March 2023 ⌄</button></div>${lineChart()}</section>
    <div class="span-3">${paymentCard()}</div><div class="span-3">${productCard()}</div>
    <section class="card padded span-6"><div class="card-title"><h2>Traffic Distribution</h2><span class="action-dots">⋮</span></div><div style="display:grid;grid-template-columns:260px 1fr;gap:40px;align-items:center"><div class="donut big"></div><div style="display:grid;gap:28px">${legendLine("primary", "4,106", "Organic Traffic", "+23%")}${legendLine("error", "3,500", "Referral Traffic")}${legendLine("warning", "3,319", "Direct Traffic")}</div></div></section>
    <section class="card padded span-3"><div class="card-title"><h2>Paying vs non paying</h2><p>Last 7 days</p></div><div class="half-meter"></div><div style="display:grid;gap:12px">${legendLine("info","Paying customers","26%")}${legendLine("","Non-paying customers","74%")}</div></section>
    <div class="span-3">${customerCard()}</div>
  </div>`;
}

function alertPage() {
  const colors = ["error", "warning", "info", "success"];
  const labels = ["This is an error alert - check it out!", "This is a warning alert - check it out!", "This is an info alert - check it out!", "This is a success alert - check it out!"];
  return componentPage("Alert", `
    ${section("Basic", `<div class="alert-stack">${colors.map((c, i) => `<div class="alert soft ${c}">${labels[i]}</div>`).join("")}</div>`)}
    ${section("Filled", `<div class="alert-stack">${colors.map((c, i) => `<div class="alert filled ${c}">${icon(i === 0 ? "x" : i === 1 ? "info" : "check")}${labels[i]}</div>`).join("")}</div>`)}
    ${section("Outlined", `<div class="alert-stack">${colors.map((c, i) => `<div class="alert outlined ${c}">${icon(i === 0 ? "info" : i === 1 ? "info" : "check")}${labels[i]}</div>`).join("")}</div>`)}
    ${section("Description", `<div class="alert-stack">${colors.map((c, i) => `<div class="alert soft ${c}" style="min-height:74px">${icon(i === 0 ? "x" : i === 1 ? "info" : "check")}<div><strong>${c[0].toUpperCase() + c.slice(1)}</strong><br>${labels[i]}</div></div>`).join("")}</div>`)}
    ${section("Closable", `<div class="alert soft info" style="min-height:86px;border-left:6px solid var(--primary)"><div><strong style="font-size:20px">Closable Alert</strong><br>Aenean imperdiet. Quisque id odio. Cras dapibus. Pellentesque ut neque.</div><span style="margin-left:auto">×</span></div>`)}
  `);
}

function componentPage(title, body) {
  return `<section class="card section-card"><div class="section-head"><h2>${title}</h2></div><div class="section-body" style="display:grid;gap:28px">${body}</div></section>`;
}

function section(title, body, cls = "") {
  return `<section class="card section-card ${cls}"><div class="section-head"><h3>${title}</h3></div><div class="section-body">${body}</div></section>`;
}

function chipPage() {
  const base = ["Default Filled", "Default Deletable", "Primary Filled", "Primary Deletable", "Secondary Filled", "Secondary Deletable"];
  return componentPage("Chip", `
    ${section("Filled", `<div class="chip-row">${base.map((b, i) => `<span class="chip ${i > 1 && i < 4 ? "primary" : i > 3 ? "" : ""}">${i % 2 ? avatar((i % 5) + 1) : icon("user")}${b}${i % 2 ? icon("x") : ""}</span>`).join("")}<span class="chip success">${avatar(3)}Default Filled</span><span class="chip warning">${icon("user")}Default Filled</span><span class="chip error">${avatar(2)}Default Deletable ${icon("x")}</span></div>`)}
    ${section("Outlined", `<div class="chip-row">${["Default Filled","Default Deletable","Primary Filled","Primary Deletable","Secondary Filled","Secondary Deletable","Success Filled","Warning Filled","Error Filled"].map((b, i) => `<span class="chip outline ${["","","primary","primary","","","success","warning","error"][i]}">${i > 1 && i < 4 ? avatar(i) : icon("user")}${b}${i % 2 ? icon("x") : ""}</span>`).join("")}</div>`)}
    <div class="grid grid-12">${section("Custom Icon", `<div class="chip-row"><span class="chip primary">${icon("user")}Custom Icon ${icon("check")}</span><span class="chip">${icon("user")}Custom Icon ${icon("check")}</span></div>`, "span-6")}${section("Custom Outlined Icon", `<div class="chip-row"><span class="chip outline primary">${icon("user")}Custom Icon ${icon("check")}</span><span class="chip outline">${icon("user")}Custom Icon ${icon("check")}</span></div>`, "span-6")}${section("Disabled", `<div class="chip-row"><span class="chip" style="opacity:.35">${icon("user")}Custom Icon ${icon("check")}</span><span class="chip" style="opacity:.35">${icon("user")}Custom Icon ${icon("check")}</span></div>`, "span-6")}${section("Sizes", `<div class="chip-row"><span class="chip small primary">x-small</span><span class="chip small primary">small</span><span class="chip primary">Default</span><span class="chip large primary">large</span><span class="chip xlarge primary">x-large</span></div>`, "span-6")}</div>
    ${section("Closable", `<div class="chip-row">${["primary","", "warning","success","error","info"].map((c) => `<span class="chip ${c}">${c || "Secondary"} Deletable ${icon("x")}</span>`).join("")}</div>`)}
  `);
}

function dialogsPage() {
  return `<section class="card section-card">
    <div class="section-head"><h2>Dialog</h2></div>
    <div class="section-body dialog-grid">
      ${["Simple Dialog", "Form Dialog", "Scrollable Dialog", "Transition", "Persistent"].map((title, i) => `<div class="dialog-demo"><h3>${title}</h3><button class="btn ${i === 1 ? "warning" : i === 2 ? "success" : ""}" data-open-modal>Open ${title}</button></div>`).join("")}
    </div>
  </section><div class="empty-space"></div>`;
}

function dialogModal(open = false) {
  return `<div class="modal-backdrop ${open ? "open" : ""}" data-modal>
    <div class="modal">
      <h3 style="margin:0 0 26px;color:var(--ink)">User Profile</h3>
      <div class="form-grid">
        ${formGroup("Legal first name*", "", 4)}
        ${formGroup("Legal middle name", "", 4)}
        ${formGroup("Legal last name*", "example of persistent helper text", 4)}
        ${formGroup("Email*", "", 12)}
        ${formGroup("Password*", "", 12)}
        ${formGroup("Age*", "", 6, "select")}
        ${formGroup("Interests", "", 6, "select")}
      </div>
      <p class="muted" style="font-size:12px">*indicates required field</p>
      <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:26px"><button class="btn error" style="background:var(--error-soft);color:var(--error);box-shadow:none" data-close-modal>Close</button><button class="btn" style="background:var(--success);box-shadow:none" data-close-modal>Save</button></div>
    </div>
  </div>`;
}

function tabsPage() {
  return componentPage("Tabs", `
    ${section("Basic", `<div class="tab-demo-bar"><span class="tab-demo active">Item One</span><span class="tab-demo">Item Two</span><span class="tab-demo">Item Three</span></div><div class="tab-panel">Item Two</div>`)}
    ${section("Stacked", `<div class="tab-demo-bar round"><span class="tab-demo active">${icon("phone")}Recents</span><span class="tab-demo">${icon("heart")}Favorites</span><span class="tab-demo">${icon("user")}Nearby</span></div><div class="tab-panel">Item three</div>`)}
    ${section("Center Active", `<div class="tab-demo-bar round" style="border-radius:999px;justify-content:space-between;padding:0 14px"><span>‹</span>${["One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve"].map((t, i) => `<span class="tab-demo ${i === 1 ? "active" : ""}" style="min-width:auto">${t}</span>`).join("")}<span>›</span></div>`)}
    ${section("Align Center", `<div style="display:flex;justify-content:center;gap:34px;margin-bottom:24px;color:var(--ink);font-weight:700"><span style="color:var(--primary);border-bottom:2px solid var(--primary)">Landscape</span><span>Products</span><span>Abstract</span></div><div class="gallery-grid">${Array.from({length:6}).map(() => `<span class="gallery-img"></span>`).join("")}</div>`)}
    ${section("Icon", `<div class="tabs-line"><span class="tab-item">${icon("phone")}</span><span class="tab-item active">${icon("heart")}</span><span class="tab-item">${icon("user")}</span></div><div class="tab-panel">Item two</div>`)}
  `);
}

function formLayoutPage() {
  return `<div style="display:grid;gap:26px">
    ${section("Ordinary Form", `<div class="form-grid">${formGroup("Email","",12)}<p class="muted span-12" style="margin-top:-14px">We'll never share your email with anyone else.</p>${formGroup("Password","",12)}<label class="span-12" style="display:flex;gap:10px;align-items:center"><span class="check checked"></span>Check Me Out!</label><button class="btn">Submit</button></div>`)}
    ${section("Input Variants", `<div class="form-grid">${formGroup("Success Input","Success value",12)}${formGroup("Error Input","",12)}${formGroup("Input with Error text","",12)}<p class="muted span-12" style="margin-top:-14px">Incorrect entry.</p></div>`)}
    ${section("Default Form", `<div class="form-grid">${formGroup("Default Text","George deo",12)}${formGroup("Email","",12)}${formGroup("Password","",12)}${formGroup("Read Only","Hello World",12)}<div class="span-6" style="display:grid;gap:12px">${["Check this custom checkbox","Check this custom checkbox","Check this custom checkbox"].map((x) => `<label style="display:flex;gap:10px;align-items:center"><span class="check"></span>${x}</label>`).join("")}</div><div class="span-6" style="display:grid;gap:12px">${["Check this custom checkbox","Check this custom checkbox"].map((x) => `<label style="display:flex;gap:10px;align-items:center"><span class="check"></span>${x}</label>`).join("")}</div>${formGroup("Select","select",12,"select")}<button class="btn">Submit</button></div>`)}
    ${section("Basic Header Form", `<div class="alert soft info">${icon("info")}Person Info</div><div class="form-grid" style="margin-top:22px">${formGroup("First Name","",6)}${formGroup("Last Name","",6)}${formGroup("Select Gender","",6,"select")}${formGroup("Date of Birth","dd/mm/yyyy",6)}<div class="span-12"><label>Membership</label><div style="display:flex;gap:20px;margin-top:8px"><span>○ Free</span><span>○ Paid</span></div></div></div><div class="alert soft info" style="margin-top:22px">${icon("info")}Address</div><div class="form-grid" style="margin-top:22px">${formGroup("Street","",12)}${formGroup("City","",6)}${formGroup("State","",6)}${formGroup("Post Code","",6)}${formGroup("Country","",6,"select")}<div class="span-12" style="display:flex;gap:12px"><button class="btn error">Cancel</button><button class="btn">Submit</button></div></div>`)}
    <div class="grid grid-12">${section("Form with Left Icon", `<div class="form-grid">${formGroup("Username","Username",12)}${formGroup("Email","Email",12)}${formGroup("Password","Password",12)}${formGroup("Confirm Password","Confirm Password",12)}<label class="span-12" style="display:flex;gap:10px"><span class="check"></span>Check Me Out!</label><div class="span-12" style="display:flex;gap:12px"><button class="btn">Submit</button><button class="btn error">Cancel</button></div></div>`, "span-6")}${section("Form with Right Icon", `<div class="form-grid">${formGroup("Username","Username",12)}${formGroup("Email","Email",12)}${formGroup("Password","Password",12)}${formGroup("Confirm Password","Confirm Password",12)}<label class="span-12" style="display:flex;gap:10px"><span class="check"></span>Check Me Out!</label><div class="span-12" style="display:flex;gap:12px"><button class="btn">Submit</button><button class="btn error">Cancel</button></div></div>`, "span-6")}</div>
  </div>`;
}

function editableTablePage() {
  const rows = [["#123","Hanna Gover","hgover@gmail.com","+123 456 789","12-10-2014","Designer","primary",4],["#452","Daniel Kristeen","hgover@gmail.com","+234 456789","10-09-2014","Developer","",5],["#565","Julian Josephs","hgover@gmail.com","+345 456789","01-10-2013","Accountant","error",3],["#785","Jan Petrovic","hgover@gmail.com","+456 456789","02-10-2017","Designer","success",2],["#564","Leanne Graham","hgover@gmail.com","+567 456789","10-9-2015","HR","info",3],["#980","Mrs. Dennis Schulist","hgover@gmail.com","+678 456789","10-5-2013","Designer","warning",1],["#521","Kurtis Weissnat","hgover@gmail.com","+123 456 789","05-10-2012","Manager","primary",4]];
  return `<section class="card section-card"><div class="section-head"><h2>Editable Table</h2></div><div class="section-body">
    <div class="toolbar-row"><input class="input" style="max-width:470px" placeholder="Search Contacts"/><button class="btn">${icon("plus")}Add Contact</button></div>
    <table class="table"><thead><tr><th>Id</th><th>UserInfo</th><th>Phone</th><th>Joining Date</th><th>Role</th><th>Actions</th></tr></thead><tbody>
      ${rows.map((r) => `<tr><td>${r[0]}</td><td><div style="display:grid;grid-template-columns:52px 1fr;gap:18px;align-items:center">${avatar(r[7])}<div><strong>${r[1]}</strong><br><span>${r[2]}</span></div></div></td><td>${r[3]}</td><td>${r[4]}</td><td><span class="status ${r[6]}">${r[5]}</span></td><td><div class="action-circles"><span style="color:var(--primary)">${icon("edit")}</span><span style="color:var(--error)">${icon("trash")}</span></div></td></tr>`).join("")}
    </tbody></table>
  </div></section>`;
}

function chartPage(kind) {
  const title = kind === "line" ? "Line Chart" : "Gredient Chart";
  return `<section class="card section-card"><div class="section-head"><h2>${title}</h2></div><div class="section-body">${kind === "line" ? fullLineChart() : gradientChart()}</div></section><div class="empty-space"></div>`;
}

function frontShell(content, active) {
  document.body.className = "front-page";
  return `<div class="announcement"><span class="pill">New</span><span>Frontend Pages Added</span><span style="position:absolute;right:30px">×</span></div>
    <header class="front-header"><nav class="front-nav">${brand()}<div class="front-menu"><a class="${active === "about" ? "active" : ""}" href="${pageHref("about")}">About Us</a><a>Blog</a><a>Portfolio <span class="chip small primary">New</span></a><a href="${pageHref("dashboard1")}">Dashboard</a><a class="${active === "pricing" ? "active" : ""}" href="${pageHref("front-pricing")}">Pricing</a><a>Contact</a></div><a class="btn" href="${pageHref("login")}">Log In</a></nav></header>${content}`;
}

function publicPricing() {
  return frontShell(`<section class="hero-slim"><div class="hero-inner"><h1>Choose Your Plan</h1><div class="breadcrumb"><strong>SPIKE</strong><span>›</span><span style="color:var(--primary)">PRICING PAGE</span></div></div></section>
    <section class="front-section"><div class="front-wrap"><h2 class="front-title">Fair pricing for everyone.</h2><p class="front-subtitle">Our robust analytics offer rich insights into the information buyers want, informing where teams.</p>${frontPriceGrid()}${paymentsBlock()}</div></section>${ctaFooter()}`, "pricing");
}

function frontPriceGrid() {
  const cards = [["Single Use","$49","Use for single end product which end users can't be charged for."],["Multiple Use","$89","Use for unlimited end products end users can't be charged for."],["Extended Use","$299","Use for single end product which end users can be charged for."],["Unlimited Use","$499","Use in unlimited end products end users can be charged for."]];
  return `<div class="front-prices">${cards.map((c, i) => `<section class="front-price-card"><h3>${c[0]} ${i === 2 ? '<span class="chip small primary">Popular</span>' : ""}</h3><p>${c[2]}</p><div class="front-price">${c[1]}<span>/one time pay</span></div><ul class="mini-feature"><li>Full source code</li><li>Documentation</li><li class="${i < 2 ? "off" : ""}">Use in SaaS app</li><li>${i === 1 || i === 3 ? "Unlimited" : "One"} Project</li><li>One Year Technical Support</li></ul><a class="btn" style="width:100%" href="${pageHref("front-pricing")}">Purchase Now</a></section>`).join("")}</div>`;
}

function paymentsBlock() {
  return `<div class="payments"><strong>Secured payment with PayPal & Razorpay</strong><div class="payment-logos"><span>VISA</span><span>MasterCard</span><span>AMERICAN<br>EXPRESS</span><span>DISCOVER</span><span>PayPal</span><span>Maestro</span><span>JCB</span></div></div>`;
}

function ctaFooter() {
  return `<section class="cta-blue"><span class="cta-mark">${logo()}</span><h2>Focus on what truly matters-creating stunning, functional designs.</h2><p>Designed for ease of use and customization, this template help you build professional dashboards faster.</p><a class="btn secondary" style="color:#fff;border-color:rgba(255,255,255,.8);background:transparent" href="${pageHref("login")}">Register</a></section>${frontFooter()}`;
}

function frontFooter() {
  return `<footer class="front-footer"><div class="front-wrap"><div class="footer-grid"><div>${brand()}<p style="margin-top:34px">Cards</p><p>Pricing</p><p>Account Settings</p><p>FAQ</p><p>Search Results</p></div><div><h4>Features</h4><a>Treeview</a><a>Banners</a><a>Charts</a><a>Gallery Lightbox</a><a>Social Contacts</a></div><div><h4>Resources</h4><a>Form Layout</a><a>Tables</a><a>Stepper</a><a>Datatables</a><a>Validation</a></div><div><h4>Follow us</h4><div style="display:flex;gap:18px">${icon("home")}${icon("phone")}${icon("image")}</div></div></div><div class="footer-bottom"><span>${logo()} All rights reserved by Spike.</span><span>Produced by <strong>Wrappixel.</strong></span></div></div></footer>`;
}

function aboutPage() {
  return frontShell(`<section class="hero-slim"><div class="hero-inner"><div><h1>Get to know Spike<br><span style="font-weight:400">Dashboard Template</span></h1><div style="display:flex;gap:14px;margin-top:24px"><a class="btn" href="${pageHref("login")}">Create An Account</a><a class="btn secondary" href="${pageHref("about")}">View Open Positions</a></div></div><p>Do you need a highly customizable and developer friendly premium Nuxtjs admin template packed with numerous features? Spike Nuxtjs Admin Template has everything you need.</p></div></section>
    <section class="front-section"><div class="front-wrap"><h2 class="front-title" style="font-size:34px">The hassle-free setup process</h2><div class="process-grid">${["Effective Support","Expert Advisor","Low Fees","Loan Facility"].map((x, i) => `<div class="process-card" style="background:${["#e5f3ff","#fff0ed","#dcfaee","#f6f9fc"][i]}"><span class="round-icon ${["primary","error","success","default"][i]}">${icon(["invoice","edit","home","login"][i])}</span><h3>${x}</h3><p class="muted">Suspendisse vestibulum eu erat ac scelerisque.</p></div>`).join("")}</div></div></section>
    <section class="front-section" style="padding-top:0"><div class="front-wrap"><h2 class="front-title" style="font-size:34px;text-align:left">A unique story in every number</h2><div class="numbers"><div>2019<span>When we founded Spike</span></div><div>300k+<span>Customers on Spike</span></div><div>25k+<span>Dashboards built using Spike</span></div></div></div></section>
    <section class="dark-band"><div class="front-wrap"><div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:34px"><h2 style="margin:0;font-size:28px">Meet our team</h2><p style="max-width:360px;color:rgba(255,255,255,.5)">Our robust analytics offer rich insights into the information buyers want.</p></div><div class="team-grid">${Array.from({length:4}).map(() => `<span class="team-card"></span>`).join("")}</div></div></section>
    <section class="front-section"><div class="front-wrap"><div style="display:grid;grid-template-columns:1fr 1.4fr;gap:80px"><div><h2 style="font-size:32px;margin:0;color:var(--ink)">Words from<br>customers.</h2><p class="muted">Pellentesque varius semper odio non pretium.</p></div><div><p style="font-size:16px;color:#66758a">This template is great, UI-rich and up-to-date. Although it is pretty much complete, I suggest to improve a bit of documentation. Thanks & Highly recommended!</p><div style="display:flex;gap:14px;align-items:center">${avatar(3)}<strong>Jenny Wilson<br><span class="muted">CEO & Head of Comp Inc.</span></strong></div></div></div></div></section>
    <section class="front-section" style="padding-top:0"><div class="front-wrap"><h2 class="front-title">Fair pricing for everyone.</h2><p class="front-subtitle">Our robust analytics offer rich insights into the information buyers want, informing where teams.</p>${frontPriceGrid()}${paymentsBlock()}</div></section>
    <section class="front-section" style="padding-top:20px"><h2 class="front-title" style="font-size:32px">Frequently asked questions</h2><div class="faq-list">${["What is included with my purchase?","Are there any recurring fees?","Can I use the template on multiple projects?","Can I customize the admin dashboard template to match my brand?","Are there any restrictions on using the template?","How can I get support after purchase?"].map((q) => `<div class="faq-row"><span>${q}</span><span>+</span></div>`).join("")}</div></section>${ctaFooter()}`, "about");
}

function loginPage() {
  document.body.className = "";
  return `<main class="login-page"><section class="login-box">
    ${brand()}
    <div class="security-art"><span class="safe"></span><span class="shield left"></span><span class="shield right"></span><span class="login-person woman"></span><span class="login-person man"></span></div>
    <form class="login-form"><h1>Welcome to Spike Admin</h1><p style="font-size:20px;margin:0;color:var(--ink)">Your Admin Dashboard</p><div class="social-row"><button class="social-btn" type="button"><b style="color:#4285f4;font-size:24px">G</b>Sign in with Google</button><button class="social-btn" type="button"><b style="color:#5279e9;font-size:24px">f</b>Sign in with FB</button></div><div class="divider">or sign in with</div><div class="form-grid">${formGroup("Username","info@wrappixel.com",12)}${formGroup("Password","••••••••",12)}</div><div class="login-options"><label><span class="check"></span>Remeber this Device</label><a style="color:var(--primary);font-weight:700">Forgot Password ?</a></div><button class="btn" type="button">Sign In</button><p class="center-text muted" style="margin-top:28px">New to Spike? <a style="color:var(--primary);font-weight:800">Create an account</a></p></form>
  </section></main>`;
}

function render() {
  const route = currentRoute();
  const meta = routes[route] || routes.dashboard1;
  document.body.className = "";
  const contentMap = {
    dashboard1: () => adminShell(dashboard1(), "Dashboard", { noTitle: true, toast: true }),
    dashboard2: () => adminShell(dashboard2(), "Dashboard 2", { noTitle: true }),
    invoice: () => adminShell(invoiceList(), "Invoice List", { breadcrumb: "Dashboard" }),
    "invoice-create": () => adminShell(invoiceCreate(), "Create Invoice", { breadcrumb: "Dashboard" }),
    "invoice-details": () => adminShell(invoiceDetails(), "Invoice Details", { breadcrumb: "Dashboard" }),
    notes: () => adminShell(notesPage(), "Notes", { noTitle: true }),
    "pricing-admin": () => adminShell(pricingAdmin(), "Pricing"),
    account: () => adminShell(accountPage(), "Account Setting"),
    cards: () => adminShell(cardsPage(), "Cards"),
    "widgets-charts": () => adminShell(widgetsCharts(), "Charts"),
    alert: () => adminShell(alertPage(), "Alert", { breadcrumb: "Dashboard" }),
    chip: () => adminShell(chipPage(), "Chip", { breadcrumb: "Dashboard" }),
    dialogs: () => adminShell(dialogsPage(), "Dialog", { breadcrumb: "Dashboard", modal: true }),
    tabs: () => adminShell(tabsPage(), "Tabs", { breadcrumb: "Dashboard" }),
    "form-layout": () => adminShell(formLayoutPage(), "Form Layout"),
    "editable-table": () => adminShell(editableTablePage(), "Editable Table"),
    "line-chart": () => adminShell(chartPage("line"), "Line Chart", { breadcrumb: "Dashboard" }),
    "gradient-chart": () => adminShell(chartPage("gradient"), "Gredient Chart", { breadcrumb: "Dashboard" }),
    login: () => loginPage(),
    "front-pricing": () => publicPricing(),
    about: () => aboutPage()
  };
  app.innerHTML = (contentMap[route] || contentMap.dashboard1)();
  bindUi();
}

function currentRoute() {
  const declaredPage = document.body?.dataset?.page;
  if (declaredPage && routes[declaredPage]) return declaredPage;

  const file = location.pathname.split("/").pop().replace(/\.html$/, "");
  if (file && routes[file]) return file;

  const hashRoute = location.hash.replace("#", "");
  if (hashRoute && routes[hashRoute]) return hashRoute;

  return "dashboard1";
}

function bindUi() {
  document.querySelectorAll("[data-open-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      let modal = document.querySelector("[data-modal]");
      if (!modal) {
        document.body.insertAdjacentHTML("beforeend", dialogModal(true));
        modal = document.querySelector("[data-modal]");
      }
      modal.classList.add("open");
      bindUi();
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => button.closest("[data-modal]").classList.remove("open"));
  });

  document.querySelectorAll("[data-modal]").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.classList.remove("open");
    });
  });
}

window.addEventListener("hashchange", render);
render();
