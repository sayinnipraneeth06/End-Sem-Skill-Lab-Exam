import React, { useEffect, useMemo, useState } from "react";

const starterContent = [
  { id: 1, title: "The Swiss Alps", description: "Mountain information", type: "Content page", author: "Admin", status: "Published", updated: "Today", image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=180&h=120&fit=crop" },
  { id: 2, title: "The Swiss Cheese", description: "About Swiss cheese", type: "Blog post", author: "Admin", status: "Published", updated: "Yesterday", image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=180&h=120&fit=crop" },
  { id: 3, title: "The Swiss Chocolate", description: "About Swiss chocolate", type: "Content page", author: "Admin", status: "Published", updated: "Today", image: "https://images.unsplash.com/photo-1548907040-4d42c7e7c3a3?w=180&h=120&fit=crop" },
  { id: 4, title: "The Swiss Mountains", description: "Mountain details", type: "Content page", author: "Admin", status: "In Review", updated: "Today", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=180&h=120&fit=crop" },
  { id: 5, title: "The Swiss Cities", description: "City information", type: "Portfolio page", author: "Admin", status: "Draft", updated: "Today", image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=180&h=120&fit=crop" }
];
const read = (key, fallback) => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
  catch { return fallback; }
};

export default function App() {
  const [users, setUsers] = useState(() => read("cmsUsers", []));
  const [user, setUser] = useState(() => read("cmsCurrentUser", null));
  const [contents, setContents] = useState(() => read("contentFlowData", starterContent));
  const [page, setPage] = useState("dashboard");
  const [authMode, setAuthMode] = useState("login");
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({ title: "", description: "", status: "Draft", type: "Content page" });
  const [siteName, setSiteName] = useState(() => localStorage.getItem("cmsSiteName") || "ContentFlow CMS");
  const [language, setLanguage] = useState(() => localStorage.getItem("cmsLanguage") || "English");
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });

  useEffect(() => localStorage.setItem("cmsUsers", JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem("contentFlowData", JSON.stringify(contents)), [contents]);
  useEffect(() => {
    if (user) localStorage.setItem("cmsCurrentUser", JSON.stringify(user));
    else localStorage.removeItem("cmsCurrentUser");
    setProfileName(user?.name || ""); setProfileEmail(user?.email || "");
  }, [user]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 2600); return () => clearTimeout(timer); }, [toast]);

  const stats = useMemo(() => ({
    total: contents.length,
    published: contents.filter(x => x.status === "Published").length,
    pending: contents.filter(x => x.status === "In Review").length,
    drafts: contents.filter(x => x.status === "Draft").length
  }), [contents]);
  const filtered = useMemo(() => contents.filter(item =>
    `${item.title} ${item.description}`.toLowerCase().includes(search.toLowerCase()) &&
    (!typeFilter || item.type === typeFilter) && (!filterStatus || item.status === filterStatus)
  ), [contents, search, typeFilter, filterStatus]);

  function notify(message) { setToast(message); }
  function navigate(next) { setPage(next); }
  function signUp(e) {
    e.preventDefault(); const data = new FormData(e.currentTarget);
    const name = data.get("name").trim(), email = data.get("email").trim().toLowerCase(), password = data.get("password");
    if (users.some(x => x.email === email)) return notify("Email already registered!");
    setUsers(prev => [...prev, { name, email, password }]); setAuthMode("login"); notify("Account created successfully. Please log in.");
  }
  function login(e) {
    e.preventDefault(); const data = new FormData(e.currentTarget);
    const email = data.get("email").trim().toLowerCase();
    const found = users.find(x => x.email === email && x.password === data.get("password"));
    if (!found) return notify("Invalid email or password. Create an account first if needed.");
    setUser({ name: found.name, email: found.email }); setPage("content"); notify("Welcome to ContentFlow!");
  }
  function logout() { if (window.confirm("Are you sure you want to logout?")) { setUser(null); setPage("dashboard"); setAuthMode("login"); } }
  function openAdd() { setEditId(null); setForm({ title: "", description: "", status: "Draft", type: "Content page" }); setModal(true); }
  function openEdit(item) { setEditId(item.id); setForm({ title: item.title, description: item.description, status: item.status, type: item.type }); setModal(true); }
  function saveContent(e) {
    e.preventDefault(); if (!form.title.trim() || !form.description.trim()) return notify("Please enter title and description!");
    const old = contents.find(x => x.id === editId);
    const item = { ...form, title: form.title.trim(), description: form.description.trim(), author: user?.name || "Admin", updated: "Today", image: old?.image || starterContent.find(x => x.type === form.type)?.image || starterContent[0].image };
    if (editId !== null) setContents(prev => prev.map(x => x.id === editId ? { ...item, id: editId } : x));
    else setContents(prev => [...prev, { ...item, id: Date.now() }]);
    setModal(false); notify(editId !== null ? "Content updated successfully!" : "Content saved successfully!");
  }
  function deleteContent(id) { if (window.confirm("Are you sure you want to delete this content?")) { setContents(prev => prev.filter(x => x.id !== id)); notify("Content deleted successfully!"); } }
  function useTemplate(name) {
    setForm({ title: name, description: `Enter your ${name.toLowerCase()} details here.`, status: "Draft", type: name === "Portfolio Page" ? "Portfolio page" : name === "Blog Article" ? "Blog post" : "Content page" });
    setEditId(null); setModal(true); setPage("content");
  }
  function saveProfile(e) {
    e.preventDefault(); const name = profileName.trim(), email = profileEmail.trim().toLowerCase();
    if (!name || !email) return notify("Please fill in all profile fields.");
    if (users.some(x => x.email === email && x.email !== user.email)) return notify("This email is already registered!");
    setUsers(prev => prev.map(x => x.email === user.email ? { ...x, name, email } : x)); setUser({ name, email }); notify("Profile updated successfully!");
  }
  function changePassword(e) {
    e.preventDefault(); const existing = users.find(x => x.email === user.email);
    if (!existing || existing.password !== passwords.current) return notify("Current password is incorrect!");
    if (passwords.next.length < 6) return notify("Password must have at least 6 characters!");
    if (passwords.next !== passwords.confirm) return notify("New passwords do not match!");
    setUsers(prev => prev.map(x => x.email === user.email ? { ...x, password: passwords.next } : x)); setPasswords({ current: "", next: "", confirm: "" }); notify("Password changed successfully!");
  }
  function saveSettings(e) { e.preventDefault(); localStorage.setItem("cmsSiteName", siteName); localStorage.setItem("cmsLanguage", language); notify("Settings saved successfully!"); }

  const navItems = [
    ["dashboard", "⌂", "Dashboard"], ["content", "▤", "Content"], ["templates", "▦", "Templates"], ["analytics", "◔", "Analytics"], ["settings", "⚙", "Settings"], ["profile", "♙", "Profile"]
  ];

  if (!user) return <div className="auth-page"><div className="auth-card"><div className="auth-logo">C</div><h1>ContentFlow</h1><p>Content Management System</p><div className="auth-tabs"><button className={authMode === "login" ? "auth-tab active" : "auth-tab"} onClick={() => setAuthMode("login")}>Login</button><button className={authMode === "signup" ? "auth-tab active" : "auth-tab"} onClick={() => setAuthMode("signup")}>Sign Up</button></div>{authMode === "login" ? <form onSubmit={login}><h2>Welcome Back!</h2><label>Email Address</label><input name="email" type="email" placeholder="Enter your email" required /><label>Password</label><input name="password" type="password" placeholder="Enter your password" required /><button className="primary-btn full" type="submit">Login</button></form> : <form onSubmit={signUp}><h2>Create Account</h2><label>Full Name</label><input name="name" placeholder="Enter your name" required /><label>Email Address</label><input name="email" type="email" placeholder="Enter your email" required /><label>Password</label><input name="password" type="password" minLength="6" placeholder="Create password" required /><button className="primary-btn full" type="submit">Create Account</button></form>}<p className="auth-note">Manage your digital content easily.</p></div>{toast && <div className="toast show">{toast}</div>}</div>;

  return <div className="layout">
    <aside className="sidebar"><div className="brand"><span className="brand-icon">A</span><span>ContentFlow</span></div><p className="side-label">WORKSPACE</p>
      {navItems.slice(0, 4).map(([id, icon, label]) => <button key={id} className={`nav-link ${page === id ? "active" : ""}`} onClick={() => navigate(id)}><span>{icon}</span>{label}</button>)}
      <p className="side-label preference-label">PREFERENCES</p>{navItems.slice(4).map(([id, icon, label]) => <button key={id} className={`nav-link ${page === id ? "active" : ""}`} onClick={() => navigate(id)}><span>{icon}</span>{label}</button>)}
      <div className="sidebar-bottom"><div className="help-box"><b>☏ &nbsp; Need help?</b><small>ContentFlow Support</small></div><div className="sidebar-user"><div className="avatar">{user.name.charAt(0).toUpperCase()}</div><div className="user-info"><b>{user.name}</b><small>{user.email}</small></div><button className="logout-btn" onClick={logout} title="Logout">↪</button></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><span>Workspace&nbsp; / &nbsp;<b>{navItems.find(x => x[0] === page)?.[2]}</b></span><span><i className="online-dot" />{user.name} &nbsp;⌄</span></header>
      {page === "dashboard" && <><div className="page-heading"><div><small className="eyebrow">WORKSPACE OVERVIEW</small><h1>Dashboard</h1><p>Welcome to ContentFlow CMS!</p></div><button className="primary-btn" onClick={() => { navigate("content"); openAdd(); }}>＋ New Content</button></div><StatsCards stats={stats} /><section className="content-panel"><div className="panel-heading"><h2>Recent Content</h2><button className="outline-btn" onClick={() => navigate("content")}>View All</button></div>{contents.slice().reverse().slice(0, 5).map(item => <RecentItem key={item.id} item={item} />)}{!contents.length && <p className="muted">No content available.</p>}</section></>}
      {page === "content" && <>
        <div className="page-heading"><div><small className="eyebrow">CONTENT MANAGEMENT</small><h1>Manage Your Content</h1><p>Create, edit and organize your website content</p></div><button className="primary-btn" onClick={openAdd}>＋ Add Content</button></div>
        <StatsCards stats={stats} />
        <section className="content-panel">
          <div className="panel-heading" style={{ gap: 14, flexWrap: "wrap" }}><h2 style={{ margin: 0 }}>▤ &nbsp;Content List</h2><div className="filter-box" style={{ margin: 0, flex: 1, justifyContent: "flex-end" }}><input style={{ flex: "0 1 240px", minWidth: 160, margin: 0 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="⌕  Search content..." /><div className="filter-tabs" style={{ margin: 0 }}>{["", "Published", "Draft", "In Review"].map(status => <button key={status || "All"} className={`filter-tab ${filterStatus === status ? "active" : ""}`} onClick={() => setFilterStatus(status)}>{status || "All"}</button>)}</div></div></div>
          <div className="table-scroll"><table style={{ minWidth: 900 }}><thead><tr><th>Title</th><th>Description</th><th>Type</th><th>Author</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>
            {filtered.map(item => <tr key={item.id}><td><div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 165 }}><img src={contentImage(item)} alt="" onError={e => { e.currentTarget.src = starterContent[0].image; }} style={{ width: 64, height: 42, objectFit: "cover", borderRadius: 7, flexShrink: 0 }} /><b>{item.title}</b></div></td><td>{item.description}</td><td><TypeBadge type={item.type} /></td><td>{item.author}</td><td><Status status={item.status} /></td><td>{item.updated}</td><td><button className="small-btn" onClick={() => openEdit(item)}>Edit</button><button className="small-btn danger" onClick={() => deleteContent(item.id)}>Delete</button></td></tr>)}
            {!filtered.length && <tr><td colSpan="7" className="empty">No content found.</td></tr>}
          </tbody></table></div><p className="muted">Showing {filtered.length ? 1 : 0}–{filtered.length} of {contents.length} items</p>
        </section>
      </>}
      {page === "templates" && <><small className="eyebrow">CONTENT TOOLS</small><h1>Content Templates</h1><p>Choose a template to create content.</p><div className="cards">{[["Blog Article", "Create blog posts and articles."], ["Portfolio Page", "Showcase projects and achievements."], ["News Update", "Publish news and announcements."]].map(([name, desc]) => <div className="card template-card" key={name}><div className="template-icon">▤</div><h2>{name}</h2><p>{desc}</p><button className="primary-btn" onClick={() => useTemplate(name)}>Use Template</button></div>)}</div></>}
      {page === "analytics" && <><small className="eyebrow">PERFORMANCE</small><h1>Analytics</h1><p>Website content performance overview.</p><StatsCards stats={stats} /><section className="content-panel"><h2>Content Status Breakdown</h2><div className="donut-area"><div className="donut" style={{ background: `conic-gradient(#20a879 0% ${stats.total ? stats.published / stats.total * 100 : 0}%, #e8a23b ${stats.total ? stats.published / stats.total * 100 : 0}% ${stats.total ? (stats.published + stats.pending) / stats.total * 100 : 0}%, #c9c4d9 ${stats.total ? (stats.published + stats.pending) / stats.total * 100 : 0}% 100%)` }}><div className="donut-inner"><b>{stats.total}</b><small>Total</small></div></div><div className="legend"><p>🟢 Published: <b>{stats.published}</b></p><p>🟠 In Review: <b>{stats.pending}</b></p><p>⚪ Draft: <b>{stats.drafts}</b></p></div></div></section></>}
      {page === "settings" && <><small className="eyebrow">PREFERENCES</small><h1>Settings</h1><form className="content-panel settings-panel" onSubmit={saveSettings}><h2>Website Settings</h2><label>Website Name</label><input value={siteName} onChange={e => setSiteName(e.target.value)} /><label>Language</label><select value={language} onChange={e => setLanguage(e.target.value)}><option>English</option><option>Telugu</option><option>Hindi</option></select><button className="primary-btn">Save Settings</button></form></>}
      {page === "profile" && <><small className="eyebrow">YOUR ACCOUNT</small><h1>Admin Profile</h1><p>Manage your administrator account information.</p><div className="profile-layout"><div className="profile-card"><div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div><h2>{user.name}</h2><p>{user.email}</p><span className="role-badge">Content Manager</span></div><div className="content-panel profile-edit"><form onSubmit={saveProfile}><h2>Change Profile</h2><label>Full Name</label><input value={profileName} onChange={e => setProfileName(e.target.value)} required /><label>Email Address</label><input type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} required /><button className="primary-btn">Save Changes</button></form><hr /><form onSubmit={changePassword}><h2>Change Password</h2><label>Current Password</label><input type="password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} required /><label>New Password</label><input type="password" minLength="6" value={passwords.next} onChange={e => setPasswords(p => ({ ...p, next: e.target.value }))} required /><label>Confirm New Password</label><input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} required /><button className="primary-btn">Update Password</button></form></div></div></>}
    </main>
    {modal && <div className="modal show" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false); }}><form className="modal-card" onSubmit={saveContent}><button type="button" className="modal-close" onClick={() => setModal(false)}>×</button><h2>{editId !== null ? "Edit Content" : "Add New Content"}</h2><label>Content Title</label><input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Enter content title" required /><label>Description</label><textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Enter content description" required /><label>Content Status</label><select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}><option>Draft</option><option>In Review</option><option>Published</option></select><label>Content Type</label><select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}><option>Content page</option><option>Blog post</option><option>Portfolio page</option></select><button className="primary-btn full">Save Content</button><button type="button" className="cancel-btn full" onClick={() => setModal(false)}>Cancel</button></form></div>}
    {toast && <div className="toast show">{toast}</div>}
  </div>;
}

function StatsCards({ stats }) {
  const cards = [
    ["▤", "Total Content", stats.total, "All content items", "#eee8ff", "#633cff"],
    ["✓", "Published", stats.published, "Live on website", "#e1f8ed", "#15915d"],
    ["◷", "Pending Review", stats.pending, "Requires approval", "#fff2df", "#e58a16"],
    ["▣", "Drafts", stats.drafts, "Saved drafts", "#eeeef2", "#77778c"]
  ];
  return <div className="cards">{cards.map(([icon, label, value, note, bg, color]) => <div className="card" key={label} style={{ display: "flex", alignItems: "center", gap: 16, background: `linear-gradient(110deg, ${bg}88, #fff)` }}><div style={{ width: 52, height: 52, borderRadius: 15, display: "grid", placeItems: "center", background: bg, color, fontSize: 28, fontWeight: 700, flexShrink: 0 }}>{icon}</div><div><p>{label}</p><h2 style={{ color, margin: "7px 0" }}>{value}</h2><small>{note}</small></div></div>)}</div>;
}
function Status({ status }) { return <span className={`status-badge ${status === "Published" ? "published" : status === "In Review" ? "review" : "draft"}`}>{status}</span>; }
function contentImage(item) { return item.image || starterContent.find(x => x.title === item.title)?.image || starterContent.find(x => x.type === item.type)?.image || starterContent[0].image; }
function TypeBadge({ type }) {
  const style = type === "Blog post" ? { background: "#eee8ff", color: "#633cff" } : type === "Portfolio page" ? { background: "#e1f8ed", color: "#15915d" } : { background: "#e2f1ff", color: "#1763bb" };
  return <span style={{ ...style, display: "inline-block", padding: "6px 11px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{type}</span>;
}
function RecentItem({ item }) { return <div className="recent-item"><div className="recent-icon">▤</div><div className="recent-text"><b>{item.title}</b><small>{item.type}</small></div><Status status={item.status} /></div>; }
