import React, { useState, useMemo, useEffect, useContext, createContext } from "react";
import Papa from "papaparse";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Home, PlusCircle, List as ListIcon, TrendingUp, AlertTriangle, BookOpen,
  Upload, Repeat, Menu, X, ArrowRight, Sparkles, ShieldAlert, Wallet,
  Pencil, Trash2, RotateCcw, Download, Sun, Moon, Check, Eraser,
  Bell, Target, Users, FileText, Camera, Printer, Plus, UserPlus,
} from "lucide-react";

/* ---------------------------------- constants ---------------------------------- */

const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Subscriptions", "Other"];

const CATEGORY_COLORS = {
  Food: "#2F6F5E", Transport: "#5B4B66", Shopping: "#C97A2B", Bills: "#3E5C76",
  Entertainment: "#8A6D3B", Health: "#7A4B4B", Subscriptions: "#4B6B58",
  Other: "#8A8578", Income: "#3E7CB1",
};

const DEFAULT_BUDGETS = {
  Food: 9000, Transport: 4000, Shopping: 6000, Bills: 22000,
  Entertainment: 2500, Health: 3000, Subscriptions: 2500, Other: 2000,
};

const KEYWORD_RULES = {
  Food: ["swiggy", "zomato", "restaurant", "cafe", "starbucks", "dominos", "mcdonald", "pizza", "biryani", "chai"],
  Transport: ["uber", "ola", "petrol", "fuel", "metro", "parking", "rapido", "irctc"],
  Shopping: ["amazon", "myntra", "flipkart", "mall", "ajio", "nykaa"],
  Bills: ["electricity", "wifi", "broadband", "rent", "water bill", "gas bill", "recharge"],
  Entertainment: ["movie", "bookmyshow", "pvr", "inox", "concert"],
  Health: ["pharmacy", "hospital", "gym", "apollo", "clinic", "medplus"],
  Subscriptions: ["netflix", "spotify", "prime", "hotstar", "youtube premium", "icloud"],
};

const MERCHANTS = {
  Food: ["Swiggy", "Zomato", "Cafe Coffee Day", "Starbucks", "Dominos", "Local Dhaba"],
  Transport: ["Uber", "Ola", "Petrol Pump", "Delhi Metro", "Rapido"],
  Shopping: ["Amazon", "Myntra", "Flipkart", "Select Citywalk Mall", "Ajio"],
  Bills: ["BSES Electricity", "Airtel Broadband", "House Rent", "Piped Gas"],
  Entertainment: ["BookMyShow", "PVR Cinemas", "INOX"],
  Health: ["Apollo Pharmacy", "Cult Gym", "Max Hospital"],
  Subscriptions: ["Netflix", "Spotify", "Amazon Prime", "Hotstar"],
  Other: ["ATM Withdrawal", "Misc Purchase", "Gift"],
};

const AMOUNT_RANGES = {
  Food: [120, 650], Transport: [40, 400], Shopping: [300, 4500], Bills: [400, 3200],
  Entertainment: [200, 900], Health: [150, 2500], Subscriptions: [119, 649], Other: [100, 1500],
};

const CURRENCIES = {
  INR: { symbol: "₹", rate: 1 },
  USD: { symbol: "$", rate: 0.012 },
  EUR: { symbol: "€", rate: 0.011 },
  GBP: { symbol: "£", rate: 0.0095 },
};

function fmtCur(amountINR, currency) {
  const c = CURRENCIES[currency] || CURRENCIES.INR;
  const val = amountINR * c.rate;
  if (currency === "INR") return "₹" + Math.round(val).toLocaleString("en-IN");
  return c.symbol + val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const dkey = (d) => d.toISOString().slice(0, 10);
const mkey = (d) => d.toISOString().slice(0, 7);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }

const CurrencyContext = createContext({ currency: "INR" });
function useCurrencyFormat() {
  const { currency } = useContext(CurrencyContext);
  return (v) => fmtCur(v, currency);
}

/* ------------------------------- categorization engine ------------------------------- */

function categorize(note) {
  const n = note.toLowerCase();
  for (const cat of Object.keys(KEYWORD_RULES)) {
    if (KEYWORD_RULES[cat].some((kw) => n.includes(kw))) return cat;
  }
  return "Other";
}

/* ---------------------------------- demo data ---------------------------------- */

function generateDemoData() {
  const txns = [];
  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - 4);
  start.setDate(1);

  let id = 1;
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const day = new Date(d);
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    const count = isWeekend ? Math.floor(rand(1, 4)) : Math.floor(rand(0, 3));
    for (let i = 0; i < count; i++) {
      const weights = isWeekend
        ? ["Food", "Food", "Entertainment", "Shopping", "Transport"]
        : ["Food", "Food", "Transport", "Transport", "Shopping", "Other"];
      const cat = pick(weights);
      const [lo, hi] = AMOUNT_RANGES[cat];
      txns.push({
        id: id++, date: dkey(day), amount: Math.round(rand(lo, hi)),
        note: pick(MERCHANTS[cat]), category: cat, type: "expense",
        paidBy: "You", receipt: null,
      });
    }
  }

  for (let m = 0; m < 5; m++) {
    const d = new Date(start); d.setMonth(d.getMonth() + m); d.setDate(3);
    if (d > today) continue;
    txns.push({ id: id++, date: dkey(d), amount: 649, note: "Netflix", category: "Subscriptions", type: "expense", paidBy: "You", receipt: null });
    const d2 = new Date(d); d2.setDate(5);
    if (d2 <= today) txns.push({ id: id++, date: dkey(d2), amount: 119, note: "Spotify", category: "Subscriptions", type: "expense", paidBy: "You", receipt: null });
    const d3 = new Date(d); d3.setDate(1);
    if (d3 <= today) txns.push({ id: id++, date: dkey(d3), amount: 1499, note: "Amazon Prime", category: "Subscriptions", type: "expense", paidBy: "You", receipt: null });
  }

  for (let m = 0; m < 5; m++) {
    const d = new Date(start); d.setMonth(d.getMonth() + m); d.setDate(10);
    if (d > today) continue;
    txns.push({ id: id++, date: dkey(d), amount: Math.round(rand(1400, 1700)), note: "BSES Electricity", category: "Bills", type: "expense", paidBy: "You", receipt: null });
    const d2 = new Date(d); d2.setDate(1);
    if (d2 <= today) txns.push({ id: id++, date: dkey(d2), amount: 18000, note: "House Rent", category: "Bills", type: "expense", paidBy: "You", receipt: null });
  }

  const outlierDate1 = new Date(today); outlierDate1.setDate(outlierDate1.getDate() - 12);
  txns.push({ id: id++, date: dkey(outlierDate1), amount: 32000, note: "Amazon (Laptop stand + monitor)", category: "Shopping", type: "expense", paidBy: "You", receipt: null });
  const outlierDate2 = new Date(today); outlierDate2.setDate(outlierDate2.getDate() - 25);
  txns.push({ id: id++, date: dkey(outlierDate2), amount: 9800, note: "Max Hospital", category: "Health", type: "expense", paidBy: "You", receipt: null });

  for (let m = 0; m < 5; m++) {
    const d = new Date(start); d.setMonth(d.getMonth() + m); d.setDate(1);
    if (d > today) continue;
    txns.push({ id: id++, date: dkey(d), amount: 65000, note: "Salary", category: "Income", type: "income", paidBy: "You", receipt: null });
    if (Math.random() > 0.5) {
      const fd = new Date(d); fd.setDate(Math.floor(rand(10, 24)));
      if (fd <= today) txns.push({ id: id++, date: dkey(fd), amount: Math.round(rand(5000, 15000)), note: "Freelance project", category: "Income", type: "income", paidBy: "You", receipt: null });
    }
  }

  return txns.sort((a, b) => (a.date < b.date ? 1 : -1));
}

const DEFAULT_TEMPLATES = [
  { id: 1, note: "Netflix", amount: 649, category: "Subscriptions", type: "expense", dayOfMonth: 3 },
  { id: 2, note: "Spotify", amount: 119, category: "Subscriptions", type: "expense", dayOfMonth: 5 },
  { id: 3, note: "House Rent", amount: 18000, category: "Bills", type: "expense", dayOfMonth: 1 },
  { id: 4, note: "Salary", amount: 65000, category: "Income", type: "income", dayOfMonth: 1 },
];

function defaultGoalDate(monthsAhead) {
  const d = new Date(); d.setMonth(d.getMonth() + monthsAhead); return dkey(d);
}
const DEFAULT_GOALS = [
  { id: 1, name: "Emergency fund", target: 100000, saved: 32000, targetDate: defaultGoalDate(6) },
];

/* ---------------------------------- stats helpers ---------------------------------- */

function linearRegression(points) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y || 0 };
  const sx = points.reduce((s, p) => s + p.x, 0);
  const sy = points.reduce((s, p) => s + p.y, 0);
  const sxy = points.reduce((s, p) => s + p.x * p.y, 0);
  const sxx = points.reduce((s, p) => s + p.x * p.x, 0);
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1);
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept };
}

function stdDev(arr) {
  const m = arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
  const v = arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length || 1);
  return { mean: m, sd: Math.sqrt(v) };
}

/* ---------------------------------- shared UI bits ---------------------------------- */

function Rule() { return <div className="rule" />; }

function Money({ value, tone }) {
  const { currency } = useContext(CurrencyContext);
  return <span className={"mono money" + (tone ? " tone-" + tone : "")}>{fmtCur(value, currency)}</span>;
}

function CategoryBadge({ cat }) {
  return (
    <span className="cat-badge" style={{ borderColor: CATEGORY_COLORS[cat] || "#999", color: CATEGORY_COLORS[cat] || "#999" }}>
      {cat}
    </span>
  );
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button className="theme-btn" onClick={onToggle} aria-label="Toggle dark mode" title="Toggle dark mode">
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

function CurrencySelect() {
  const { currency, setCurrency } = useContext(CurrencyContext);
  return (
    <select className="currency-select" value={currency} onChange={(e) => setCurrency(e.target.value)} title="Display currency">
      {Object.keys(CURRENCIES).map((c) => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}

/* ---------------------------------- Notifications ---------------------------------- */

function useNotifications(txns, budgets, analysis, templates, goals, overallBudget, projected) {
  return useMemo(() => {
    const list = [];
    const currentMonth = mkey(new Date());
    CATEGORIES.forEach((c) => {
      const spent = analysis.nowByCat[c] || 0;
      if (budgets[c] && spent > budgets[c]) {
        list.push({ id: "b" + c, tone: "amber", text: `${c} is over budget: spent so far exceeds the ₹${budgets[c].toLocaleString("en-IN")} limit.` });
      }
    });
    if (overallBudget && projected > overallBudget) {
      list.push({ id: "overall", tone: "amber", text: `Projected to exceed your overall monthly budget by month-end.` });
    }
    if (analysis.outliers.length > 0) {
      list.push({ id: "outliers", tone: "plum", text: `${analysis.outliers.length} unusual transaction${analysis.outliers.length > 1 ? "s" : ""} flagged this period.` });
    }
    templates.forEach((t) => {
      const logged = txns.some((tx) => tx.note === t.note && tx.date.slice(0, 7) === currentMonth);
      if (!logged) list.push({ id: "tpl" + t.id, tone: "green", text: `${t.note} (recurring, ₹${t.amount.toLocaleString("en-IN")}) hasn't been logged this month yet.` });
    });
    goals.forEach((g) => {
      const daysLeft = Math.ceil((new Date(g.targetDate) - new Date()) / 86400000);
      const pct = g.target ? (g.saved / g.target) * 100 : 0;
      if (daysLeft > 0 && daysLeft <= 30 && pct < 80) {
        list.push({ id: "goal" + g.id, tone: "amber", text: `"${g.name}" is due in ${daysLeft} days and only ${pct.toFixed(0)}% funded.` });
      }
    });
    return list;
  }, [txns, budgets, analysis, templates, goals, overallBudget, projected]);
}

function NotificationBell({ notifications }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bell-wrap">
      <button className="icon-btn" onClick={() => setOpen((o) => !o)} title="Notifications">
        <Bell size={15} />
        {notifications.length > 0 && <span className="bell-badge">{notifications.length}</span>}
      </button>
      {open && (
        <div className="bell-dropdown">
          {notifications.length === 0 ? (
            <p className="muted small" style={{ padding: 10 }}>No alerts right now.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={"bell-item tone-dot-" + n.tone}>
                <span className="dot" /> <span>{n.text}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Landing Page ---------------------------------- */

function LedgerTape({ txns }) {
  const format = useCurrencyFormat();
  const sample = txns.filter((t) => t.type === "expense").slice(0, 24);
  const total = txns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1400;
    const steps = 40;
    const inc = total / steps;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setCount(Math.min(total, inc * i));
      if (i >= steps) clearInterval(t);
    }, duration / steps);
    return () => clearInterval(t);
  }, [total]);

  return (
    <div className="tape-wrap">
      <div className="tape-track">
        {[...sample, ...sample].map((t, i) => (
          <span key={i} className="mono tape-item">
            {t.date.slice(5)} &nbsp;{t.note.toUpperCase().padEnd(20, " ").slice(0, 20)} &nbsp;-{format(t.amount)}
          </span>
        ))}
      </div>
      <div className="tape-total mono">
        TRACKED SO FAR &nbsp; <span className="tape-total-num">{format(count)}</span>
      </div>
    </div>
  );
}

function Landing({ onEnter, onStartBlank, txns, theme, onToggleTheme }) {
  return (
    <div className="page landing">
      <header className="topbar">
        <div className="brand">Ledgerline</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <CurrencySelect />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button className="btn btn-primary" onClick={onEnter}>
            Try the demo <ArrowRight size={16} />
          </button>
        </div>
      </header>

      <section className="hero">
        <p className="eyebrow mono">EXPENSE TRACKING, READ LIKE A LEDGER</p>
        <h1>Every rupee, accounted for — and explained.</h1>
        <p className="hero-sub">
          Most trackers just show you a pie chart. Ledgerline forecasts where you're headed, flags spending
          that doesn't fit your pattern, and tells you exactly why — using the same statistical methods an
          analyst would.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={onEnter}>Explore with demo data</button>
          <button className="btn btn-lg" onClick={onStartBlank} style={{ marginLeft: 10 }}>Start with a blank ledger</button>
        </div>
        <p className="muted small">Demo data is fake and only exists to show what the app can do — your own data replaces it instantly.</p>
        <LedgerTape txns={txns} />
      </section>

      <Rule />

      <section className="features">
        <div className="feature">
          <TrendingUp size={22} />
          <h3>Insights &amp; trends</h3>
          <p>Category breakdowns, month-over-month change, and weekday spending patterns — not just totals.</p>
        </div>
        <div className="feature">
          <Sparkles size={22} />
          <h3>Forecasting</h3>
          <p>A linear regression on this month's spend projects your end-of-month total before it happens.</p>
        </div>
        <div className="feature">
          <ShieldAlert size={22} />
          <h3>Smart suggestions</h3>
          <p>Auto-categorization, outlier detection, and recurring-subscription tracking, explained in plain English.</p>
        </div>
      </section>

      <Rule />
      <footer className="foot mono">LEDGERLINE — A DEMO PORTFOLIO PROJECT · DATA IS IN-MEMORY, NOT SAVED</footer>
    </div>
  );
}

/* ---------------------------------- App Nav ---------------------------------- */

const NAV = [
  { key: "add", label: "Add", icon: PlusCircle },
  { key: "list", label: "Transactions", icon: ListIcon },
  { key: "insights", label: "Insights", icon: TrendingUp },
  { key: "forecast", label: "Forecast", icon: Wallet },
  { key: "suggestions", label: "Suggestions", icon: AlertTriangle },
  { key: "recurring", label: "Recurring", icon: Repeat },
  { key: "goals", label: "Goals", icon: Target },
  { key: "shared", label: "Shared", icon: Users },
  { key: "report", label: "Report", icon: FileText },
  { key: "methodology", label: "Methodology", icon: BookOpen },
];

function AppNav({ active, onChange, onHome, theme, onToggleTheme, onReset, onClear, notifications }) {
  const [open, setOpen] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);

  function handleReset() {
    if (confirmingReset) { onReset(); setConfirmingReset(false); }
    else { setConfirmingReset(true); setTimeout(() => setConfirmingReset(false), 3000); }
  }
  function handleClear() {
    if (confirmingClear) { onClear(); setConfirmingClear(false); }
    else { setConfirmingClear(true); setTimeout(() => setConfirmingClear(false), 3000); }
  }

  return (
    <header className="app-topbar no-print">
      <div className="brand small" onClick={onHome} role="button">Ledgerline</div>
      <nav className="nav-desktop">
        {NAV.map((n) => (
          <button key={n.key} className={"nav-btn" + (active === n.key ? " active" : "")} onClick={() => onChange(n.key)}>
            <n.icon size={15} /> {n.label}
          </button>
        ))}
      </nav>
      <div className="nav-right">
        <NotificationBell notifications={notifications} />
        <CurrencySelect />
        <button className={"icon-btn" + (confirmingReset ? " confirming" : "")} onClick={handleReset} title="Reload demo data">
          <RotateCcw size={15} /> {confirmingReset ? "Click to confirm" : ""}
        </button>
        <button className={"icon-btn" + (confirmingClear ? " confirming" : "")} onClick={handleClear} title="Clear all data">
          <Eraser size={15} /> {confirmingClear ? "Click to confirm" : ""}
        </button>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <button className="nav-hamburger" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="nav-mobile">
          {NAV.map((n) => (
            <button key={n.key} className={"nav-btn" + (active === n.key ? " active" : "")} onClick={() => { onChange(n.key); setOpen(false); }}>
              <n.icon size={15} /> {n.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

/* ---------------------------------- Add Transaction ---------------------------------- */

function AddTransaction({ onAdd, people, onAddPerson }) {
  const [txType, setTxType] = useState("expense");
  const [date, setDate] = useState(dkey(new Date()));
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");
  const [paidBy, setPaidBy] = useState("You");
  const [newPerson, setNewPerson] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [preview, setPreview] = useState([]);
  const [fileName, setFileName] = useState("");

  const suggested = note ? categorize(note) : null;

  function submit(e) {
    e.preventDefault();
    if (!amount || !note) return;
    onAdd([{
      id: Date.now(), date, amount: Number(amount), note,
      category: txType === "income" ? "Income" : (category || categorize(note)),
      type: txType, paidBy, receipt,
    }]);
    setAmount(""); setNote(""); setCategory(""); setReceipt(null);
  }

  function handleReceipt(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setReceipt(reader.result);
    reader.readAsDataURL(file);
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data.map((r, i) => ({
          id: Date.now() + i, date: r.date || dkey(new Date()), amount: Number(r.amount) || 0,
          note: r.note || "Imported",
          category: r.category && (CATEGORIES.includes(r.category) || r.category === "Income") ? r.category : categorize(r.note || ""),
          type: r.type === "income" ? "income" : "expense", paidBy: r.paidBy || "You", receipt: null,
        }));
        setPreview(rows);
      },
    });
  }

  function confirmImport() { onAdd(preview); setPreview([]); setFileName(""); }

  function addPerson() {
    if (newPerson.trim()) { onAddPerson(newPerson.trim()); setPaidBy(newPerson.trim()); setNewPerson(""); }
  }

  return (
    <div className="page-inner">
      <h2>Add a transaction</h2>
      <p className="muted">Enter manually, or import a batch from CSV (columns: date, amount, note, category, type, paidBy).</p>

      <div className="segmented">
        <button className={txType === "expense" ? "seg-active" : ""} onClick={() => setTxType("expense")}>Expense</button>
        <button className={txType === "income" ? "seg-active" : ""} onClick={() => setTxType("income")}>Income</button>
      </div>

      <form className="card form-grid" onSubmit={submit}>
        <label>Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>Amount (base currency: INR)
          <input type="number" min="0" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="450" required />
        </label>
        <label className="span2">Note {txType === "expense" ? "/ merchant" : "/ source"}
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder={txType === "expense" ? "e.g. Swiggy, Uber, Netflix" : "e.g. Salary, Freelance project"} required />
        </label>
        {txType === "expense" && (
          <label>Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Auto-detect{suggested ? ` (${suggested})` : ""}</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        )}
        <label>Paid by
          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {people.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <div className="span2" style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <label style={{ flex: 1 }}>Add a new person to split with
            <input type="text" value={newPerson} onChange={(e) => setNewPerson(e.target.value)} placeholder="e.g. Roommate" />
          </label>
          <button type="button" className="btn" onClick={addPerson}><UserPlus size={14} /> Add</button>
        </div>
        <label className="span2">Attach receipt photo (optional)
          <input type="file" accept="image/*" onChange={handleReceipt} />
        </label>
        {receipt && <img src={receipt} alt="Receipt preview" className="receipt-preview span2" />}
        <div className="span2 form-actions">
          <button className="btn btn-primary" type="submit">Add {txType === "income" ? "income" : "transaction"}</button>
        </div>
      </form>

      <Rule />

      <h3>Import from CSV</h3>
      <div className="card upload-box">
        <label className="upload-label">
          <Upload size={18} />
          <span>{fileName || "Click to choose a .csv file"}</span>
          <input type="file" accept=".csv" onChange={handleFile} hidden />
        </label>
        <p className="muted small">Missing a category column? Ledgerline auto-categorizes each row from the note text.</p>
      </div>

      {preview.length > 0 && (
        <div className="card">
          <p className="muted small">Previewing {preview.length} rows — confirm to add them.</p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Note</th><th>Category</th><th className="right">Amount</th></tr></thead>
              <tbody>
                {preview.slice(0, 8).map((r) => (
                  <tr key={r.id}>
                    <td className="mono">{r.date}</td>
                    <td>{r.note}</td>
                    <td><CategoryBadge cat={r.category} /></td>
                    <td className="right"><Money value={r.amount} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.length > 8 && <p className="muted small">…and {preview.length - 8} more rows.</p>}
          <button className="btn btn-primary" onClick={confirmImport}>Confirm import</button>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Transactions List ---------------------------------- */

function EditRow({ t, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...t });
  return (
    <tr className="edit-row">
      <td><input type="date" className="mini-input" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></td>
      <td><input type="text" className="mini-input" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} /></td>
      <td>
        <select className="mini-input" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
          {(draft.type === "income" ? ["Income"] : CATEGORIES).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </td>
      <td className="right"><input type="number" className="mini-input right" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} /></td>
      <td>
        <button className="icon-btn" onClick={() => onSave(draft)} title="Save"><Check size={14} /></button>
        <button className="icon-btn" onClick={onCancel} title="Cancel"><X size={14} /></button>
      </td>
    </tr>
  );
}

function TransactionsList({ txns, outlierIds, recurringNotes, onUpdate, onDelete }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  const allCats = ["All", ...CATEGORIES, "Income"];
  const rows = txns.filter((t) => (filter === "All" || t.category === filter) &&
    (t.note.toLowerCase().includes(search.toLowerCase())));

  function exportCSV() {
    const csv = Papa.unparse(txns.map((t) => ({ date: t.date, type: t.type, category: t.category, note: t.note, amount: t.amount, paidBy: t.paidBy || "You" })));
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "ledgerline-transactions.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function handleDeleteClick(id) {
    if (confirmingDeleteId === id) { onDelete(id); setConfirmingDeleteId(null); }
    else { setConfirmingDeleteId(id); setTimeout(() => setConfirmingDeleteId((cur) => (cur === id ? null : cur)), 3000); }
  }

  return (
    <div className="page-inner">
      <div className="row-between">
        <h2>Transactions</h2>
        <button className="btn" onClick={exportCSV}><Download size={14} /> Export CSV</button>
      </div>
      <div className="filter-row">
        <input className="search" placeholder="Search notes…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          {allCats.map((c) => <option key={c}>{c}</option>)}
        </select>
        <span className="muted small">{rows.length} transactions</span>
      </div>

      {txns.length === 0 && (
        <div className="card">
          <p className="muted">No transactions yet. Head to <strong>Add</strong> to log your first one, or import a CSV.</p>
        </div>
      )}

      <div className="card table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Note</th><th>Category</th><th>Paid by</th><th className="right">Amount</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((t) => editingId === t.id ? (
              <EditRow key={t.id} t={t} onSave={(draft) => { onUpdate(draft); setEditingId(null); }} onCancel={() => setEditingId(null)} />
            ) : (
              <tr key={t.id}>
                <td className="mono">{t.date}</td>
                <td>{t.note}</td>
                <td><CategoryBadge cat={t.category} /></td>
                <td className="muted small">{t.paidBy || "You"}</td>
                <td className="right"><Money value={t.amount} tone={t.type === "income" ? "green" : undefined} /></td>
                <td className="actions-cell">
                  {outlierIds.has(t.id) && <span className="flag flag-amber"><AlertTriangle size={12}/> unusual</span>}
                  {recurringNotes.has(t.note) && <span className="flag flag-plum"><Repeat size={12}/> recurring</span>}
                  {t.receipt && <button className="icon-btn" onClick={() => setViewingReceipt(t.receipt)} title="View receipt"><Camera size={13} /></button>}
                  <button className="icon-btn" onClick={() => setEditingId(t.id)} title="Edit"><Pencil size={13} /></button>
                  <button className={"icon-btn" + (confirmingDeleteId === t.id ? " confirming" : "")} onClick={() => handleDeleteClick(t.id)} title="Delete">
                    <Trash2 size={13} /> {confirmingDeleteId === t.id ? "Confirm?" : ""}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewingReceipt && (
        <div className="modal-backdrop" onClick={() => setViewingReceipt(null)}>
          <img src={viewingReceipt} alt="Receipt" className="modal-img" />
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Insights ---------------------------------- */

const RANGE_OPTIONS = [
  { key: "30", label: "Last 30 days" },
  { key: "90", label: "Last 90 days" },
  { key: "all", label: "All time" },
];

function Insights({ txns }) {
  const [range, setRange] = useState("90");
  const filtered = useMemo(() => {
    if (range === "all") return txns;
    const cutoff = dkey(daysAgo(Number(range)));
    return txns.filter((t) => t.date >= cutoff);
  }, [txns, range]);

  const expenses = filtered.filter((t) => t.type === "expense");
  const income = filtered.filter((t) => t.type === "income");

  const monthly = useMemo(() => {
    const map = {};
    expenses.forEach((t) => { const k = t.date.slice(0, 7); map[k] = (map[k] || 0) + t.amount; });
    return Object.entries(map).sort().map(([m, total]) => ({ month: m.slice(5), total }));
  }, [expenses]);

  const currentMonth = mkey(new Date());
  const catTotals = useMemo(() => {
    const map = {};
    expenses.filter((t) => t.date.slice(0, 7) === currentMonth).forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).map(([category, total]) => ({ category, total }));
  }, [expenses]);

  const weekday = useMemo(() => {
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const map = new Array(7).fill(0);
    expenses.forEach((t) => { map[new Date(t.date).getDay()] += t.amount; });
    return names.map((day, i) => ({ day, total: map[i] }));
  }, [expenses]);

  const prevMonthKey = useMemo(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return mkey(d); }, []);
  const thisTotal = expenses.filter((t) => t.date.slice(0, 7) === currentMonth).reduce((s, t) => s + t.amount, 0);
  const prevTotal = txns.filter((t) => t.type === "expense" && t.date.slice(0, 7) === prevMonthKey).reduce((s, t) => s + t.amount, 0);
  const change = prevTotal ? ((thisTotal - prevTotal) / prevTotal) * 100 : 0;

  const incomeThisMonth = income.filter((t) => t.date.slice(0, 7) === currentMonth).reduce((s, t) => s + t.amount, 0);
  const savingsRate = incomeThisMonth ? ((incomeThisMonth - thisTotal) / incomeThisMonth) * 100 : null;

  return (
    <div className="page-inner">
      <div className="row-between">
        <h2>Insights</h2>
        <div className="segmented">
          {RANGE_OPTIONS.map((r) => (
            <button key={r.key} className={range === r.key ? "seg-active" : ""} onClick={() => setRange(r.key)}>{r.label}</button>
          ))}
        </div>
      </div>

      <div className="stat-row">
        <div className="card stat"><p className="muted small">This month's spend</p><Money value={thisTotal} /></div>
        <div className="card stat">
          <p className="muted small">Vs. last month</p>
          <span className={"mono money " + (change >= 0 ? "tone-amber" : "tone-green")}>{change >= 0 ? "+" : ""}{change.toFixed(1)}%</span>
        </div>
        <div className="card stat"><p className="muted small">Income this month</p><Money value={incomeThisMonth} tone="blue" /></div>
        <div className="card stat">
          <p className="muted small">Savings rate</p>
          {savingsRate === null ? <span className="muted small">Add income to see this</span> :
            <span className={"mono money " + (savingsRate >= 0 ? "tone-green" : "tone-amber")}>{savingsRate.toFixed(0)}%</span>}
        </div>
      </div>

      <h3>Monthly trend</h3>
      <div className="card chart-card">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthly}>
            <CartesianGrid stroke="var(--rule)" strokeDasharray="2 4" />
            <XAxis dataKey="month" stroke="var(--ink)" fontSize={12} />
            <YAxis stroke="var(--ink)" fontSize={12} tickFormatter={(v) => `${v/1000}k`} />
            <Tooltip formatter={(v) => fmtCur(v, "INR")} contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 12 }} />
            <Line type="monotone" dataKey="total" stroke="#2F6F5E" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="two-col">
        <div>
          <h3>Category breakdown (this month)</h3>
          <div className="card chart-card">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={catTotals} dataKey="total" nameKey="category" innerRadius={45} outerRadius={80}>
                  {catTotals.map((c) => <Cell key={c.category} fill={CATEGORY_COLORS[c.category]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtCur(v, "INR")} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h3>Spending by weekday</h3>
          <div className="card chart-card">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weekday}>
                <CartesianGrid stroke="var(--rule)" strokeDasharray="2 4" />
                <XAxis dataKey="day" stroke="var(--ink)" fontSize={12} />
                <YAxis stroke="var(--ink)" fontSize={12} tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip formatter={(v) => fmtCur(v, "INR")} />
                <Bar dataKey="total" fill="#5B4B66" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Forecast ---------------------------------- */

function Forecast({ txns, budgets, onBudgetChange, overallBudget, onOverallBudgetChange, onProjectedChange }) {
  const format = useCurrencyFormat();
  const currentMonth = mkey(new Date());
  const today = new Date();
  const daysSoFar = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const thisMonthTxns = txns.filter((t) => t.type === "expense" && t.date.slice(0, 7) === currentMonth);
  const spentSoFar = thisMonthTxns.reduce((s, t) => s + t.amount, 0);

  const daily = useMemo(() => {
    const map = {};
    thisMonthTxns.forEach((t) => { const d = Number(t.date.slice(8, 10)); map[d] = (map[d] || 0) + t.amount; });
    let cum = 0;
    const points = [];
    for (let d = 1; d <= daysSoFar; d++) { cum += map[d] || 0; points.push({ x: d, y: cum, day: d }); }
    return points;
  }, [txns]);

  const { slope, intercept } = linearRegression(daily);
  const projected = Math.max(spentSoFar, slope * daysInMonth + intercept);

  useEffect(() => { onProjectedChange(projected); }, [projected]);

  const forecastChart = useMemo(() => {
    const arr = daily.map((p) => ({ day: p.day, actual: p.y }));
    for (let d = daysSoFar + 1; d <= daysInMonth; d++) arr.push({ day: d, projected: Math.round(slope * d + intercept) });
    if (arr.length) arr[daysSoFar - 1].projected = arr[daysSoFar - 1].actual;
    return arr;
  }, [daily]);

  const burnRate = (spentSoFar / overallBudget) * 100;
  const overshoot = projected > overallBudget;

  const categorySpend = useMemo(() => {
    const map = {};
    thisMonthTxns.forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return map;
  }, [thisMonthTxns]);

  return (
    <div className="page-inner">
      <h2>Forecast</h2>
      <p className="muted">Projected using a linear regression on this month's cumulative daily spend.</p>

      <div className="card form-grid" style={{ maxWidth: 320, marginBottom: 20 }}>
        <label>Overall monthly budget (base currency: INR)
          <input type="number" value={overallBudget} onChange={(e) => onOverallBudgetChange(Number(e.target.value) || 0)} />
        </label>
      </div>

      <div className="stat-row">
        <div className="card stat"><p className="muted small">Spent so far ({daysSoFar}/{daysInMonth} days)</p><Money value={spentSoFar} /></div>
        <div className="card stat"><p className="muted small">Projected month-end</p><Money value={projected} tone={overshoot ? "amber" : "green"} /></div>
        <div className="card stat"><p className="muted small">Budget burn rate</p><span className="mono money">{burnRate.toFixed(0)}%</span></div>
      </div>

      {overshoot && (
        <div className="banner banner-amber">
          <AlertTriangle size={16} />
          At this pace you're projected to exceed your {format(overallBudget)} budget by <strong>{format(projected - overallBudget)}</strong> before the month ends.
        </div>
      )}

      <div className="card chart-card">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={forecastChart}>
            <CartesianGrid stroke="var(--rule)" strokeDasharray="2 4" />
            <XAxis dataKey="day" stroke="var(--ink)" fontSize={12} />
            <YAxis stroke="var(--ink)" fontSize={12} tickFormatter={(v) => `${v/1000}k`} />
            <Tooltip formatter={(v) => fmtCur(v, "INR")} />
            <Area type="monotone" dataKey="actual" stroke="#2F6F5E" fill="#2F6F5E33" strokeWidth={2} />
            <Area type="monotone" dataKey="projected" stroke="#C97A2B" fill="#C97A2B22" strokeWidth={2} strokeDasharray="4 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <h3>Category budgets</h3>
      <p className="muted small">Set a monthly limit per category and see how this month is pacing.</p>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Category</th><th className="right">Budget (INR)</th><th className="right">Spent</th><th>Pace</th></tr></thead>
          <tbody>
            {CATEGORIES.map((c) => {
              const spent = categorySpend[c] || 0;
              const b = budgets[c] || 0;
              const pct = b ? Math.min(100, (spent / b) * 100) : 0;
              const over = b && spent > b;
              return (
                <tr key={c}>
                  <td><CategoryBadge cat={c} /></td>
                  <td className="right"><input type="number" className="mini-input right" value={b} onChange={(e) => onBudgetChange(c, Number(e.target.value) || 0)} /></td>
                  <td className="right"><Money value={spent} tone={over ? "amber" : undefined} /></td>
                  <td><div className="bar-track"><div className="bar-fill" style={{ width: pct + "%", background: over ? "var(--amber)" : CATEGORY_COLORS[c] }} /></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------- Suggestions ---------------------------------- */

function useAnalysis(txns) {
  return useMemo(() => {
    const expenses = txns.filter((t) => t.type === "expense");
    const byCat = {};
    expenses.forEach((t) => { (byCat[t.category] = byCat[t.category] || []).push(t); });
    const outliers = [];
    Object.entries(byCat).forEach(([cat, list]) => {
      const { mean, sd } = stdDev(list.map((t) => t.amount));
      list.forEach((t) => { if (sd > 0 && t.amount > mean + 2 * sd) outliers.push({ ...t, mean, sd }); });
    });

    const byNote = {};
    expenses.forEach((t) => { (byNote[t.note] = byNote[t.note] || []).push(t); });
    const recurring = [];
    Object.entries(byNote).forEach(([note, list]) => {
      const months = new Set(list.map((t) => t.date.slice(0, 7)));
      const amounts = list.map((t) => t.amount);
      const { mean, sd } = stdDev(amounts);
      const consistent = sd / (mean || 1) < 0.15;
      if (months.size >= 2 && consistent) recurring.push({ note, months: months.size, avg: mean, category: list[0].category });
    });

    const now = mkey(new Date());
    const prevD = new Date(); prevD.setMonth(prevD.getMonth() - 1);
    const prev = mkey(prevD);
    const nowByCat = {}, prevByCat = {};
    expenses.forEach((t) => {
      if (t.date.slice(0, 7) === now) nowByCat[t.category] = (nowByCat[t.category] || 0) + t.amount;
      if (t.date.slice(0, 7) === prev) prevByCat[t.category] = (prevByCat[t.category] || 0) + t.amount;
    });
    let topGrowth = null;
    Object.keys(nowByCat).forEach((cat) => {
      const p = prevByCat[cat] || 0;
      const growth = p ? ((nowByCat[cat] - p) / p) * 100 : 100;
      if (!topGrowth || growth > topGrowth.growth) topGrowth = { cat, growth, now: nowByCat[cat], prev: p };
    });

    return {
      outliers, recurring, topGrowth, nowByCat,
      outlierIds: new Set(outliers.map((o) => o.id)),
      recurringNotes: new Set(recurring.map((r) => r.note)),
    };
  }, [txns]);
}

function Suggestions({ analysis, budgets }) {
  const format = useCurrencyFormat();
  const [testNote, setTestNote] = useState("");
  const { outliers, recurring, topGrowth, nowByCat } = analysis;
  const recurringAnnual = recurring.reduce((s, r) => s + r.avg * 12, 0);
  const overBudget = CATEGORIES.filter((c) => budgets[c] && (nowByCat[c] || 0) > budgets[c]);

  return (
    <div className="page-inner">
      <h2>Smart suggestions</h2>

      {overBudget.length > 0 && (
        <div className="banner banner-amber">
          <AlertTriangle size={16} />
          Over budget this month: {overBudget.map((c) => `${c} (${format(nowByCat[c])} of ${format(budgets[c])})`).join(", ")}
        </div>
      )}

      {topGrowth && topGrowth.growth > 15 && (
        <div className="banner banner-plum">
          <TrendingUp size={16} />
          <strong>{topGrowth.cat}</strong> spend is up {topGrowth.growth.toFixed(0)}% vs last month ({format(topGrowth.prev)} → {format(topGrowth.now)}). Consider setting a cap for this category.
        </div>
      )}

      <h3>Try the categorization engine</h3>
      <div className="card">
        <input className="search" placeholder="Type a transaction note, e.g. 'Zomato dinner'" value={testNote} onChange={(e) => setTestNote(e.target.value)} />
        {testNote && <p className="muted small" style={{ marginTop: 10 }}>Predicted category: <CategoryBadge cat={categorize(testNote)} /></p>}
      </div>

      <h3>Unusual transactions</h3>
      <div className="card table-wrap">
        {outliers.length === 0 ? <p className="muted small">No outliers detected.</p> : (
          <table>
            <thead><tr><th>Date</th><th>Note</th><th>Category</th><th className="right">Amount</th><th>Why flagged</th></tr></thead>
            <tbody>
              {outliers.map((o) => (
                <tr key={o.id}>
                  <td className="mono">{o.date}</td><td>{o.note}</td><td><CategoryBadge cat={o.category} /></td>
                  <td className="right"><Money value={o.amount} tone="amber" /></td>
                  <td className="muted small">{format(o.mean)} avg for {o.category}, this is {(o.amount / o.mean).toFixed(1)}× higher</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h3>Recurring &amp; subscriptions</h3>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Note</th><th>Category</th><th className="right">Avg / month</th><th>Months seen</th></tr></thead>
          <tbody>
            {recurring.map((r) => (
              <tr key={r.note}><td>{r.note}</td><td><CategoryBadge cat={r.category} /></td><td className="right"><Money value={r.avg} /></td><td className="mono">{r.months}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="muted small" style={{ marginTop: 10 }}>Estimated annual recurring cost: <Money value={recurringAnnual} /></p>
      </div>
    </div>
  );
}

/* ---------------------------------- Recurring Templates ---------------------------------- */

function RecurringTemplates({ templates, onAdd, onDelete, txns, onLog }) {
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [type, setType] = useState("expense");
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const currentMonth = mkey(new Date());

  function submit(e) {
    e.preventDefault();
    if (!note || !amount) return;
    onAdd({ id: Date.now(), note, amount: Number(amount), category: type === "income" ? "Income" : category, type, dayOfMonth: Number(dayOfMonth) });
    setNote(""); setAmount("");
  }

  return (
    <div className="page-inner">
      <h2>Recurring templates</h2>
      <p className="muted">Set up a subscription, rent, or salary once — then log this month's occurrence with one click.</p>

      <form className="card form-grid" onSubmit={submit}>
        <label className="span2">Note<input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Netflix, Salary" required /></label>
        <label>Amount (INR)<input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>
        <label>Day of month<input type="number" min="1" max="28" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} /></label>
        <label>Type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="expense">Expense</option><option value="income">Income</option>
          </select>
        </label>
        {type === "expense" && (
          <label>Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        )}
        <div className="span2 form-actions"><button className="btn btn-primary" type="submit"><Plus size={14}/> Add template</button></div>
      </form>

      <div className="card table-wrap">
        <table>
          <thead><tr><th>Note</th><th>Category</th><th className="right">Amount</th><th>Day</th><th>This month</th><th></th></tr></thead>
          <tbody>
            {templates.map((t) => {
              const logged = txns.some((tx) => tx.note === t.note && tx.date.slice(0, 7) === currentMonth);
              return (
                <tr key={t.id}>
                  <td>{t.note}</td><td><CategoryBadge cat={t.category} /></td>
                  <td className="right"><Money value={t.amount} /></td>
                  <td className="mono">{t.dayOfMonth}</td>
                  <td>{logged ? <span className="flag flag-plum">logged</span> : <span className="flag flag-amber">due</span>}</td>
                  <td className="actions-cell">
                    {!logged && <button className="btn" onClick={() => onLog(t)}>Log now</button>}
                    <button className="icon-btn" onClick={() => onDelete(t.id)} title="Delete"><Trash2 size={13} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------- Goals ---------------------------------- */

function Goals({ goals, onAdd, onDelete, onContribute }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [targetDate, setTargetDate] = useState(defaultGoalDate(6));
  const [contributions, setContributions] = useState({});

  function submit(e) {
    e.preventDefault();
    if (!name || !target) return;
    onAdd({ id: Date.now(), name, target: Number(target), saved: 0, targetDate });
    setName(""); setTarget("");
  }

  return (
    <div className="page-inner">
      <h2>Goals</h2>
      <p className="muted">Set a savings target and track progress. Contributions here are tracked separately from your transaction ledger.</p>

      <form className="card form-grid" onSubmit={submit}>
        <label className="span2">Goal name<input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency fund, Trip to Goa" required /></label>
        <label>Target amount (INR)<input type="number" value={target} onChange={(e) => setTarget(e.target.value)} required /></label>
        <label>Target date<input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></label>
        <div className="span2 form-actions"><button className="btn btn-primary" type="submit"><Plus size={14}/> Add goal</button></div>
      </form>

      {goals.map((g) => {
        const pct = g.target ? Math.min(100, (g.saved / g.target) * 100) : 0;
        const monthsLeft = Math.max(1, Math.round((new Date(g.targetDate) - new Date()) / (30 * 86400000)));
        const monthlyNeeded = Math.max(0, (g.target - g.saved) / monthsLeft);
        return (
          <div key={g.id} className="card">
            <div className="row-between">
              <h3 style={{ marginTop: 0 }}>{g.name}</h3>
              <button className="icon-btn" onClick={() => onDelete(g.id)} title="Delete goal"><Trash2 size={13} /></button>
            </div>
            <p className="muted small">Target: <Money value={g.target} /> by {g.targetDate}</p>
            <div className="bar-track" style={{ height: 10 }}><div className="bar-fill" style={{ width: pct + "%", background: "var(--green)" }} /></div>
            <p className="muted small" style={{ marginTop: 8 }}><Money value={g.saved} /> saved ({pct.toFixed(0)}%) · suggested <Money value={monthlyNeeded} />/month to stay on pace</p>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input type="number" className="mini-input" placeholder="Add contribution" style={{ maxWidth: 160 }}
                value={contributions[g.id] || ""} onChange={(e) => setContributions({ ...contributions, [g.id]: e.target.value })} />
              <button className="btn" onClick={() => { onContribute(g.id, Number(contributions[g.id]) || 0); setContributions({ ...contributions, [g.id]: "" }); }}>Add</button>
            </div>
          </div>
        );
      })}
      {goals.length === 0 && <p className="muted small">No goals yet — add one above.</p>}
    </div>
  );
}

/* ---------------------------------- Shared Ledger ---------------------------------- */

function SharedLedger({ txns, people, onAddPerson, onRemovePerson }) {
  const format = useCurrencyFormat();
  const [newPerson, setNewPerson] = useState("");
  const expenses = txns.filter((t) => t.type === "expense");
  const total = expenses.reduce((s, t) => s + t.amount, 0);
  const fairShare = people.length ? total / people.length : 0;

  const paidByPerson = useMemo(() => {
    const map = {};
    people.forEach((p) => { map[p] = 0; });
    expenses.forEach((t) => { const p = t.paidBy || "You"; map[p] = (map[p] || 0) + t.amount; });
    return map;
  }, [expenses, people]);

  return (
    <div className="page-inner">
      <h2>Shared ledger</h2>
      <p className="muted">A simple equal-split view across everyone tagged on a transaction's "Paid by" field. Real multi-user sync (separate logins seeing the same live ledger) needs a backend — this view works from the shared in-memory session.</p>

      <div className="card" style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <label style={{ flex: 1 }}>Add a person<input type="text" value={newPerson} onChange={(e) => setNewPerson(e.target.value)} placeholder="e.g. Roommate" /></label>
        <button className="btn" onClick={() => { if (newPerson.trim()) { onAddPerson(newPerson.trim()); setNewPerson(""); } }}><UserPlus size={14}/> Add</button>
      </div>

      <div className="card table-wrap">
        <table>
          <thead><tr><th>Person</th><th className="right">Paid</th><th className="right">Fair share</th><th className="right">Balance</th><th></th></tr></thead>
          <tbody>
            {people.map((p) => {
              const paid = paidByPerson[p] || 0;
              const balance = paid - fairShare;
              return (
                <tr key={p}>
                  <td>{p}</td>
                  <td className="right"><Money value={paid} /></td>
                  <td className="right"><Money value={fairShare} /></td>
                  <td className="right"><span className={"mono money " + (balance >= 0 ? "tone-green" : "tone-amber")}>{balance >= 0 ? "+" : ""}{format(balance)}</span></td>
                  <td>{p !== "You" && <button className="icon-btn" onClick={() => onRemovePerson(p)} title="Remove"><Trash2 size={13} /></button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="muted small" style={{ marginTop: 10 }}>Positive balance = owed money by the group. Negative = owes the group.</p>
      </div>
    </div>
  );
}

/* ---------------------------------- Report ---------------------------------- */

function Report({ txns, analysis, overallBudget, projected }) {
  const format = useCurrencyFormat();
  const currentMonth = mkey(new Date());
  const expenses = txns.filter((t) => t.type === "expense" && t.date.slice(0, 7) === currentMonth);
  const income = txns.filter((t) => t.type === "income" && t.date.slice(0, 7) === currentMonth);
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);
  const savingsRate = totalIncome ? ((totalIncome - totalExpense) / totalIncome) * 100 : null;

  const byCat = {};
  expenses.forEach((t) => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
  const catRows = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const topCat = catRows[0];

  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="page-inner">
      <div className="row-between no-print">
        <h2>Monthly report</h2>
        <button className="btn btn-primary" onClick={() => window.print()}><Printer size={14}/> Print / Save as PDF</button>
      </div>

      <div className="card report-sheet">
        <h2 style={{ marginBottom: 2 }}>Ledgerline — Monthly Report</h2>
        <p className="muted small">{monthLabel}</p>
        <Rule />
        <div className="stat-row">
          <div className="stat"><p className="muted small">Income</p><Money value={totalIncome} tone="blue" /></div>
          <div className="stat"><p className="muted small">Expenses</p><Money value={totalExpense} /></div>
          <div className="stat"><p className="muted small">Savings rate</p><span className="mono money">{savingsRate === null ? "—" : savingsRate.toFixed(0) + "%"}</span></div>
          <div className="stat"><p className="muted small">Projected month-end</p><Money value={projected} tone={projected > overallBudget ? "amber" : "green"} /></div>
        </div>

        <h3>Category breakdown</h3>
        <table>
          <thead><tr><th>Category</th><th className="right">Spent</th></tr></thead>
          <tbody>{catRows.map(([c, v]) => <tr key={c}><td><CategoryBadge cat={c} /></td><td className="right">{format(v)}</td></tr>)}</tbody>
        </table>

        <h3>Key observations</h3>
        <ul>
          {topCat && <li>{topCat[0]} was the largest category this month at {format(topCat[1])}.</li>}
          <li>{analysis.outliers.length} unusual transaction{analysis.outliers.length === 1 ? "" : "s"} flagged this period.</li>
          <li>{analysis.recurring.length} recurring charge{analysis.recurring.length === 1 ? "" : "s"} detected, costing roughly {format(analysis.recurring.reduce((s, r) => s + r.avg * 12, 0))} per year.</li>
          <li>Month-end spend is projected at {format(projected)} against a budget of {format(overallBudget)}.</li>
        </ul>

        <Rule />
        <p className="muted small">Generated by Ledgerline · figures are calculated from in-memory demo/session data · not audited financial advice.</p>
      </div>
    </div>
  );
}

/* ---------------------------------- Methodology ---------------------------------- */

function Methodology() {
  const items = [
    { t: "Auto-categorization", d: "A keyword rule-engine matches transaction notes against category dictionaries (e.g. 'swiggy', 'zomato' → Food). This is intentionally simple and explainable; it's a natural extension point for an NLP/ML classifier trained on labeled transaction history." },
    { t: "Outlier detection", d: "For each category, Ledgerline computes the mean and standard deviation of transaction amounts. Any transaction more than 2 standard deviations above the category mean is flagged as unusual — a standard z-score approach to anomaly detection." },
    { t: "Recurring detection", d: "Transactions are grouped by merchant note. If the same merchant appears in 2+ distinct months with a coefficient of variation under 15% (i.e. the amount barely changes), it's treated as a recurring charge." },
    { t: "Forecasting", d: "This month's cumulative daily spend is fit with a simple linear regression (least squares). The line is extrapolated to the last day of the month to project a month-end total." },
    { t: "Budget burn rate", d: "Spent-so-far divided by the monthly budget, compared against days elapsed, to show whether spending is pacing ahead of or behind the calendar." },
    { t: "Savings rate", d: "Calculated as (income − expenses) ÷ income for the current month." },
    { t: "Multi-currency", d: "Amounts are entered and stored in INR (base currency). The currency selector converts figures for display only, using fixed approximate exchange rates — not live market rates." },
    { t: "Recurring templates", d: "A template stores note, amount, category, and day-of-month. Ledgerline checks whether a matching transaction already exists this month and flags it as 'due' if not, so you can log it in one click." },
    { t: "Goals", d: "Savings goals track a manually-updated 'saved so far' amount against a target and date, and suggest the monthly contribution needed to stay on pace — a simple linear pacing calculation." },
    { t: "Shared ledger", d: "Each transaction can be tagged with who paid. The split view assumes an equal share of total expenses among all listed people and shows each person's balance (paid minus fair share)." },
    { t: "Notifications", d: "The in-app notification center recomputes alerts (budget overruns, outliers, due recurring charges, goals falling behind) live from current data. A production version sending real push or email alerts would need a backend service to trigger them outside the browser." },
    { t: "Data storage in this demo", d: "All data lives in browser memory for this preview and is not saved anywhere — refreshing resets it. A production version would use a real database with per-user access controls." },
  ];
  return (
    <div className="page-inner">
      <h2>Methodology</h2>
      <p className="muted">How every number on this site is actually calculated — no black boxes.</p>
      {items.map((it) => <div key={it.t} className="method-item"><h3>{it.t}</h3><p>{it.d}</p></div>)}
    </div>
  );
}

/* ---------------------------------- Root App ---------------------------------- */

export default function ExpenseTracker() {
  const [entered, setEntered] = useState(false);
  const [page, setPage] = useState("insights");
  const [txns, setTxns] = useState(() => generateDemoData());
  const [budgets, setBudgets] = useState(DEFAULT_BUDGETS);
  const [overallBudget, setOverallBudget] = useState(40000);
  const [projected, setProjected] = useState(0);
  const [theme, setTheme] = useState("light");
  const [currency, setCurrency] = useState("INR");
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [people, setPeople] = useState(["You"]);

  const analysis = useAnalysis(txns);
  const notifications = useNotifications(txns, budgets, analysis, templates, goals, overallBudget, projected);

  function addTxns(newOnes) { setTxns((prev) => [...newOnes, ...prev].sort((a, b) => (a.date < b.date ? 1 : -1))); }
  function updateTxn(draft) { setTxns((prev) => prev.map((t) => (t.id === draft.id ? draft : t))); }
  function deleteTxn(id) { setTxns((prev) => prev.filter((t) => t.id !== id)); }
  function resetDemo() { setTxns(generateDemoData()); setBudgets(DEFAULT_BUDGETS); }
  function clearAll() { setTxns([]); setBudgets(DEFAULT_BUDGETS); }
  function startBlank() { setTxns([]); setEntered(true); }
  function updateBudget(cat, val) { setBudgets((prev) => ({ ...prev, [cat]: val })); }
  function addPerson(p) { setPeople((prev) => prev.includes(p) ? prev : [...prev, p]); }
  function removePerson(p) { setPeople((prev) => prev.filter((x) => x !== p)); }
  function addTemplate(t) { setTemplates((prev) => [...prev, t]); }
  function deleteTemplate(id) { setTemplates((prev) => prev.filter((t) => t.id !== id)); }
  function logTemplate(t) {
    const d = new Date();
    const day = Math.min(t.dayOfMonth, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate());
    d.setDate(day);
    addTxns([{ id: Date.now(), date: dkey(d), amount: t.amount, note: t.note, category: t.category, type: t.type, paidBy: "You", receipt: null }]);
  }
  function addGoal(g) { setGoals((prev) => [...prev, g]); }
  function deleteGoal(id) { setGoals((prev) => prev.filter((g) => g.id !== id)); }
  function contributeGoal(id, amt) { setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, saved: g.saved + amt } : g))); }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      <div className={"lg-root theme-" + theme}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

          .lg-root {
            --paper: #F1F0EC; --paper-raised: #FBFAF7; --ink: #202A24; --green: #2F6F5E;
            --amber: #C97A2B; --plum: #5B4B66; --blue: #3E7CB1; --rule: #C9C4B8;
            background: var(--paper); color: var(--ink); font-family: 'Inter', sans-serif;
            min-height: 100vh; line-height: 1.5; transition: background .2s ease, color .2s ease;
          }
          .lg-root.theme-dark {
            --paper: #1B211D; --paper-raised: #232B25; --ink: #EDEBE3; --green: #4FA98A;
            --amber: #E0A050; --plum: #B79BC4; --blue: #7FB3DE; --rule: #3A423B;
          }
          .lg-root :focus-visible { outline: 2px solid var(--green); outline-offset: 2px; }
          .mono { font-family: 'IBM Plex Mono', monospace; }
          .money { font-weight: 500; font-size: 1.15rem; }
          .tone-green { color: var(--green); } .tone-amber { color: var(--amber); } .tone-blue { color: var(--blue); }
          h1, h2, h3 { font-family: 'Fraunces', serif; font-weight: 600; margin: 0 0 8px; }
          h1 { font-size: 2.6rem; line-height: 1.1; max-width: 720px; }
          h2 { font-size: 1.7rem; margin-bottom: 4px; }
          h3 { font-size: 1.05rem; margin-top: 26px; }
          p { margin: 0 0 10px; }
          .muted { color: #5c6259; } .theme-dark .muted { color: #a3ab9d; }
          .small { font-size: 0.82rem; }
          .rule { height: 1px; background: var(--rule); margin: 30px 0; }
          .page { max-width: 1080px; margin: 0 auto; padding: 0 24px 60px; }
          .page-inner { max-width: 980px; margin: 0 auto; padding: 28px 24px 70px; }
          .row-between { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }

          .topbar { display: flex; justify-content: space-between; align-items: center; padding: 26px 0; }
          .brand { font-family: 'Fraunces', serif; font-size: 1.3rem; font-weight: 600; }
          .brand.small { font-size: 1.05rem; cursor: pointer; }

          .hero { padding: 40px 0 10px; }
          .eyebrow { font-size: 0.72rem; letter-spacing: 0.08em; color: var(--green); margin-bottom: 14px; }
          .hero-sub { max-width: 560px; color: #4b5147; font-size: 1.02rem; }
          .theme-dark .hero-sub { color: #c3cabc; }
          .hero-actions { margin: 22px 0 10px; }

          .btn { font-family: 'Inter', sans-serif; border: 1px solid var(--ink); background: transparent; color: var(--ink);
            padding: 9px 16px; border-radius: 3px; font-size: 0.9rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all .15s ease; }
          .btn:hover { background: var(--ink); color: var(--paper); }
          .btn-primary { background: var(--green); border-color: var(--green); color: #fff; }
          .btn-primary:hover { opacity: 0.9; }
          .btn-lg { padding: 12px 22px; font-size: 0.98rem; }

          .theme-btn, .icon-btn { font-family: 'Inter', sans-serif; border: 1px solid var(--rule); background: var(--paper-raised);
            color: var(--ink); border-radius: 3px; padding: 6px 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; font-size: 0.75rem; }
          .theme-btn:hover, .icon-btn:hover { background: var(--rule); }
          .icon-btn.confirming { background: var(--amber); color: #fff; border-color: var(--amber); }
          .currency-select { font-family: 'Inter', sans-serif; border: 1px solid var(--rule); background: var(--paper-raised); color: var(--ink);
            border-radius: 3px; padding: 6px 6px; font-size: 0.75rem; }

          .bell-wrap { position: relative; }
          .bell-badge { position: absolute; top: -5px; right: -5px; background: var(--amber); color: #fff; border-radius: 10px;
            font-size: 0.62rem; padding: 1px 5px; }
          .bell-dropdown { position: absolute; right: 0; top: 100%; margin-top: 8px; width: 280px; background: var(--paper-raised);
            border: 1px solid var(--rule); border-radius: 6px; padding: 8px; z-index: 20; max-height: 320px; overflow-y: auto; }
          .bell-item { display: flex; gap: 8px; align-items: flex-start; padding: 8px; font-size: 0.8rem; border-bottom: 1px solid var(--rule); }
          .bell-item:last-child { border-bottom: none; }
          .bell-item .dot { width: 7px; height: 7px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
          .tone-dot-amber .dot { background: var(--amber); }
          .tone-dot-plum .dot { background: var(--plum); }
          .tone-dot-green .dot { background: var(--green); }

          .tape-wrap { border: 1px solid var(--rule); background: var(--paper-raised); border-radius: 4px; overflow: hidden; margin-top: 14px; }
          .tape-track { display: flex; gap: 28px; white-space: nowrap; padding: 12px 0; animation: scroll-tape 30s linear infinite; }
          .tape-item { font-size: 0.78rem; color: #6b7166; } .theme-dark .tape-item { color: #9aa294; }
          @keyframes scroll-tape { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          .tape-total { border-top: 1px solid var(--rule); padding: 10px 16px; font-size: 0.78rem; letter-spacing: 0.04em; color: #4b5147; }
          .theme-dark .tape-total { color: #c3cabc; }
          .tape-total-num { color: var(--green); font-weight: 600; font-size: 0.95rem; }

          .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; padding: 10px 0 20px; }
          .feature svg { color: var(--green); margin-bottom: 10px; }
          .feature h3 { margin-top: 0; }
          .feature p { color: #5c6259; font-size: 0.9rem; } .theme-dark .feature p { color: #a3ab9d; }
          .foot { text-align: center; font-size: 0.68rem; color: #8a8578; letter-spacing: 0.04em; padding-bottom: 20px; }

          @media (max-width: 720px) { h1 { font-size: 1.9rem; } .features { grid-template-columns: 1fr; } }

          .app-topbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px;
            border-bottom: 1px solid var(--rule); position: sticky; top: 0; background: var(--paper); z-index: 10; gap: 10px; flex-wrap: wrap; }
          .nav-desktop { display: flex; gap: 2px; flex-wrap: wrap; }
          .nav-right { display: flex; align-items: center; gap: 6px; }
          .nav-btn { display: flex; align-items: center; gap: 5px; background: none; border: none; color: #5c6259;
            font-size: 0.8rem; padding: 7px 9px; border-radius: 3px; cursor: pointer; font-family: 'Inter', sans-serif; white-space: nowrap; }
          .theme-dark .nav-btn { color: #a3ab9d; }
          .nav-btn:hover { background: var(--rule); }
          .nav-btn.active { color: var(--green); font-weight: 600; background: rgba(47,111,94,0.12); }
          .nav-hamburger { display: none; background: none; border: none; cursor: pointer; color: var(--ink); }
          .nav-mobile { position: absolute; top: 100%; left: 0; right: 0; background: var(--paper); border-bottom: 1px solid var(--rule);
            display: flex; flex-direction: column; padding: 8px; z-index: 30; }
          @media (max-width: 1100px) { .nav-desktop { display: none; } .nav-hamburger { display: block; } }

          .card { background: var(--paper-raised); border: 1px solid var(--rule); border-radius: 6px; padding: 18px; margin-bottom: 18px; }
          .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
          .form-grid label { display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; color: #4b5147; }
          .theme-dark .form-grid label { color: #c3cabc; }
          .form-grid input, .form-grid select, .search { font-family: 'Inter', sans-serif; padding: 9px 10px; border: 1px solid var(--rule);
            border-radius: 3px; background: var(--paper); color: var(--ink); font-size: 0.9rem; }
          .span2 { grid-column: span 2; }
          .form-actions { display: flex; }
          @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } .span2 { grid-column: span 1; } }

          .segmented { display: inline-flex; border: 1px solid var(--rule); border-radius: 4px; overflow: hidden; margin-bottom: 16px; flex-wrap: wrap; }
          .segmented button { font-family: 'Inter', sans-serif; background: var(--paper-raised); border: none; color: var(--ink);
            padding: 7px 14px; font-size: 0.82rem; cursor: pointer; border-right: 1px solid var(--rule); }
          .segmented button:last-child { border-right: none; }
          .segmented .seg-active { background: var(--green); color: #fff; }

          .upload-box { display: flex; flex-direction: column; gap: 6px; }
          .upload-label { display: flex; align-items: center; gap: 10px; border: 1px dashed var(--rule); border-radius: 4px;
            padding: 20px; cursor: pointer; color: #4b5147; }
          .theme-dark .upload-label { color: #c3cabc; }
          .upload-label:hover { background: var(--rule); }

          .filter-row { display: flex; gap: 10px; align-items: center; margin: 14px 0 18px; flex-wrap: wrap; }
          .filter-row .search { flex: 1; min-width: 160px; }
          .filter-row select { font-family: 'Inter', sans-serif; padding: 9px 10px; border: 1px solid var(--rule); border-radius: 3px; background: var(--paper); color: var(--ink); }

          table { width: 100%; border-collapse: collapse; font-size: 0.86rem; }
          th, td { text-align: left; padding: 9px 10px; border-bottom: 1px solid var(--rule); }
          th { color: #6b7166; font-weight: 500; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.03em; }
          .theme-dark th { color: #9aa294; }
          td.right, th.right { text-align: right; }
          .table-wrap { overflow-x: auto; }
          .actions-cell { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
          .mini-input { font-family: 'Inter', sans-serif; padding: 5px 7px; border: 1px solid var(--rule); border-radius: 3px;
            background: var(--paper); color: var(--ink); font-size: 0.82rem; width: 100%; }
          .mini-input.right { text-align: right; }
          .edit-row td { background: rgba(47,111,94,0.06); }

          .cat-badge { border: 1px solid; border-radius: 20px; padding: 2px 9px; font-size: 0.72rem; }
          .flag { display: inline-flex; align-items: center; gap: 4px; font-size: 0.7rem; border-radius: 3px; padding: 2px 6px; }
          .flag-amber { background: #f3e2cd; color: #8a5719; }
          .flag-plum { background: #ece5ec; color: var(--plum); }
          .theme-dark .flag-amber { background: #4a3a20; color: #e0a050; }
          .theme-dark .flag-plum { background: #3a2f40; color: #d4b8e0; }

          .stat-row { display: flex; gap: 16px; flex-wrap: wrap; margin: 16px 0 6px; }
          .stat { flex: 1; min-width: 160px; }

          .chart-card { padding: 14px 10px 6px; }
          .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          @media (max-width: 800px) { .two-col { grid-template-columns: 1fr; } }

          .banner { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 5px; font-size: 0.88rem; margin-bottom: 16px; flex-wrap: wrap; }
          .banner-amber { background: #f3e2cd; color: #7a4e15; }
          .banner-plum { background: #ece5ec; color: var(--plum); }
          .theme-dark .banner-amber { background: #4a3a20; color: #e0a050; }
          .theme-dark .banner-plum { background: #3a2f40; color: #d4b8e0; }

          .bar-track { width: 100%; min-width: 80px; height: 6px; background: var(--rule); border-radius: 4px; overflow: hidden; }
          .bar-fill { height: 100%; border-radius: 4px; transition: width .2s ease; }

          .method-item { padding: 16px 0; border-bottom: 1px solid var(--rule); }
          .method-item:last-child { border-bottom: none; }
          .method-item p { color: #4b5147; font-size: 0.92rem; } .theme-dark .method-item p { color: #c3cabc; }

          .receipt-preview { max-width: 200px; border-radius: 4px; border: 1px solid var(--rule); margin-top: 6px; }
          .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 50; }
          .modal-img { max-width: 90vw; max-height: 90vh; border-radius: 6px; }

          .report-sheet ul { padding-left: 20px; } .report-sheet li { margin-bottom: 6px; font-size: 0.9rem; }
          @media print {
            .no-print, .app-topbar { display: none !important; }
            .page-inner { padding: 0; max-width: 100%; }
            .lg-root { background: #fff; color: #000; }
          }
        `}</style>

        {!entered ? (
          <Landing onEnter={() => setEntered(true)} onStartBlank={startBlank} txns={txns} theme={theme} onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")} />
        ) : (
          <>
            <AppNav
              active={page} onChange={setPage} onHome={() => setEntered(false)}
              theme={theme} onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
              onReset={resetDemo} onClear={clearAll} notifications={notifications}
            />
            {page === "add" && <AddTransaction onAdd={addTxns} people={people} onAddPerson={addPerson} />}
            {page === "list" && (
              <TransactionsList txns={txns} outlierIds={analysis.outlierIds} recurringNotes={analysis.recurringNotes} onUpdate={updateTxn} onDelete={deleteTxn} />
            )}
            {page === "insights" && <Insights txns={txns} />}
            {page === "forecast" && (
              <Forecast
                txns={txns} budgets={budgets} onBudgetChange={updateBudget}
                overallBudget={overallBudget} onOverallBudgetChange={setOverallBudget}
                onProjectedChange={setProjected}
              />
            )}
            {page === "suggestions" && <Suggestions analysis={analysis} budgets={budgets} />}
            {page === "recurring" && <RecurringTemplates templates={templates} onAdd={addTemplate} onDelete={deleteTemplate} txns={txns} onLog={logTemplate} />}
            {page === "goals" && <Goals goals={goals} onAdd={addGoal} onDelete={deleteGoal} onContribute={contributeGoal} />}
            {page === "shared" && <SharedLedger txns={txns} people={people} onAddPerson={addPerson} onRemovePerson={removePerson} />}
            {page === "report" && <Report txns={txns} analysis={analysis} overallBudget={overallBudget} projected={projected} />}
            {page === "methodology" && <Methodology />}
          </>
        )}
      </div>
    </CurrencyContext.Provider>
  );
}
