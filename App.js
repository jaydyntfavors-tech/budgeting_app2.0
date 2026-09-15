import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./styles.css";

const STORAGE_KEY = "budget-planner-2-0";

const CATEGORY_CONFIG = [
  {
    key: "needs",
    label: "Needs",
    target: 0.5,
    tone: "needs",
    blurb: "The essentials that keep your life running.",
  },
  {
    key: "wants",
    label: "Wants",
    target: 0.3,
    tone: "wants",
    blurb: "Flexible spending that makes life more enjoyable.",
  },
  {
    key: "savings",
    label: "Savings",
    target: 0.1,
    tone: "savings",
    blurb: "Money you are setting aside for future priorities.",
  },
  {
    key: "debt",
    label: "Debt",
    target: 0.1,
    tone: "debt",
    blurb: "Extra payments that help reduce what you owe faster.",
  },
];

const DEFAULT_ITEMS = {
  needs: [
    ["Housing", 1200],
    ["Utilities", 150],
    ["Groceries", 400],
    ["Transportation", 180],
    ["Car payment", 220],
    ["Car insurance", 130],
    ["Gas", 100],
    ["Health / medical", 80],
    ["Phone", 60],
  ],
  wants: [
    ["Eating out", 200],
    ["Entertainment", 80],
    ["Shopping", 100],
    ["Personal spending", 150],
    ["Subscriptions", 35],
    ["Hobbies", 50],
    ["Travel / fun fund", 50],
  ],
  savings: [
    ["401k / retirement", 250],
    ["Emergency fund", 100],
    ["Short-term savings", 75],
    ["Sinking funds", 50],
    ["Goal savings", 50],
  ],
  debt: [
    ["Credit cards", 150],
    ["Student loans", 50],
    ["Auto loan extra", 25],
    ["Personal loan", 25],
  ],
};

const INITIAL_GOALS = [
  { id: "goal-1", name: "Emergency fund", target: 3000, saved: 600 },
  { id: "goal-2", name: "Next big purchase", target: 1500, saved: 340 },
];

const currency = (value) =>
  (Number(value) || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

const percent = (value) => `${Math.round((Number(value) || 0) * 100)}%`;

const makeItems = (source = DEFAULT_ITEMS) =>
  Object.fromEntries(
    Object.entries(source).map(([key, entries]) => [
      key,
      entries.map((item) =>
        Array.isArray(item)
          ? { id: crypto.randomUUID(), name: item[0], amount: item[1] }
          : { ...item, id: item.id || crypto.randomUUID() }
      ),
    ])
  );

function SummaryStat({ label, value, subtext, icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon size={18} />
      </div>
      <div>
        <p className="eyebrow">{label}</p>
        <p className="stat-value">{value}</p>
        {subtext && <p className="stat-subtext">{subtext}</p>}
      </div>
    </div>
  );
}

function CategoryPill({ tone, children }) {
  return <span className={`category-pill ${tone}`}>{children}</span>;
}

function LineItem({ item, tone, onChange, onRemove }) {
  return (
    <div className="line-item">
      <span className={`item-dot ${tone}`} />
      <input
        aria-label="Line item name"
        value={item.name}
        onChange={(e) => onChange({ ...item, name: e.target.value })}
      />
      <div className="money-input">
        <span>$</span>
        <input
          aria-label="Line item amount"
          type="number"
          min="0"
          step="1"
          value={item.amount}
          onChange={(e) =>
            onChange({ ...item, amount: Number(e.target.value) || 0 })
          }
        />
      </div>
      <button className="icon-button" onClick={onRemove} title="Remove line item">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function CategoryCard({ config, items, income, onUpdate }) {
  const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const target = income * config.target;
  const actual = income ? total / income : 0;
  const variance = total - target;
  const fill = Math.min((actual / Math.max(config.target, 0.001)) * 100, 100);

  const addItem = () => {
    onUpdate([
      ...items,
      { id: crypto.randomUUID(), name: "New line item", amount: 0 },
    ]);
  };

  return (
    <section className={`category-card ${config.tone}`}>
      <div className="category-header">
        <div>
          <div className="category-title-row">
            <h2>{config.label}</h2>
            <CategoryPill tone={config.tone}>{percent(config.target)} target</CategoryPill>
          </div>
          <p>{config.blurb}</p>
        </div>
        <div className="category-total">
          <strong>{currency(total)}</strong>
          <span className={variance > 0 ? "negative" : "positive"}>
            {percent(actual)} of income
          </span>
        </div>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${fill}%` }} />
      </div>

      <div className="line-items">
        {items.map((item) => (
          <LineItem
            key={item.id}
            item={item}
            tone={config.tone}
            onChange={(next) =>
              onUpdate(items.map((current) => (current.id === item.id ? next : current)))
            }
            onRemove={() =>
              onUpdate(items.filter((current) => current.id !== item.id))
            }
          />
        ))}
      </div>

      <button className="add-item" onClick={addItem}>
        <Plus size={15} />
        Add line item
      </button>
    </section>
  );
}

function Dashboard({ income, totals, goals }) {
  const allocated = Object.values(totals).reduce((sum, value) => sum + value, 0);
  const leftover = income - allocated;
  const savingsRate = income ? (totals.savings + totals.debt) / income : 0;
  const topCategory = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];

  const pieData = CATEGORY_CONFIG.map((config) => ({
    name: config.label,
    value: totals[config.key],
    tone: config.tone,
  }));

  return (
    <div className="stack">
      <div className="hero-card">
        <div>
          <span className="hero-kicker">Your monthly plan</span>
          <h1>Give every dollar a job.</h1>
          <p>
            2.0 keeps the familiar 50/30/20 framework, but turns it into a
            more flexible dashboard with richer categories and goal tracking.
          </p>
        </div>
        <div className="hero-badge">
          <WalletCards size={18} />
          <span>{percent(savingsRate)} toward savings + debt</span>
        </div>
      </div>

      <div className="stat-grid">
        <SummaryStat
          label="Income"
          value={currency(income)}
          subtext="monthly take-home"
          icon={WalletCards}
        />
        <SummaryStat
          label="Allocated"
          value={currency(allocated)}
          subtext={`${percent(income ? allocated / income : 0)} of income`}
          icon={TrendingUp}
        />
        <SummaryStat
          label={leftover >= 0 ? "Unallocated" : "Over budget"}
          value={currency(Math.abs(leftover))}
          subtext={leftover >= 0 ? "still available" : "needs attention"}
          icon={leftover >= 0 ? Check : ArrowUpRight}
        />
        <SummaryStat
          label="Largest category"
          value={topCategory ? currency(topCategory[1]) : "$0"}
          subtext={topCategory ? topCategory[0] : "none yet"}
          icon={Target}
        />
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Category mix</p>
              <h3>Where the money is going</h3>
            </div>
            <span className="muted">{currency(allocated)} total</span>
          </div>
          <div className="chart-shell">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={68}
                  outerRadius={104}
                  paddingAngle={3}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} className={`pie-${entry.tone}`} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [currency(value), name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="legend-grid">
            {pieData.map((entry) => (
              <div className="legend-item" key={entry.name}>
                <span className={`legend-dot ${entry.tone}`} />
                <span>{entry.name}</span>
                <strong>{currency(entry.value)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Goals</p>
              <h3>Keep progress visible</h3>
            </div>
            <Target size={18} />
          </div>
          <div className="goal-list">
            {goals.map((goal) => {
              const progress = goal.target ? goal.saved / goal.target : 0;
              return (
                <div className="goal-card" key={goal.id}>
                  <div className="goal-card-top">
                    <div>
                      <strong>{goal.name}</strong>
                      <span>
                        {currency(goal.saved)} of {currency(goal.target)}
                      </span>
                    </div>
                    <b>{percent(progress)}</b>
                  </div>
                  <div className="progress-track neutral">
                    <div
                      className="progress-fill goal"
                      style={{ width: `${Math.min(progress * 100, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function BudgetTab({ income, categories, setCategories }) {
  return (
    <div className="stack">
      <div className="section-intro">
        <div>
          <span className="hero-kicker">Budget builder</span>
          <h1>Plan the month in detail.</h1>
          <p>
            More line items let the four major buckets reflect how you actually
            spend, save, and pay down debt.
          </p>
        </div>
      </div>

      {CATEGORY_CONFIG.map((config) => (
        <CategoryCard
          key={config.key}
          config={config}
          items={categories[config.key]}
          income={income}
          onUpdate={(items) =>
            setCategories((previous) => ({
              ...previous,
              [config.key]: items,
            }))
          }
        />
      ))}
    </div>
  );
}

function GoalsTab({ goals, setGoals }) {
  const addGoal = () => {
    setGoals([
      ...goals,
      {
        id: crypto.randomUUID(),
        name: "New goal",
        target: 1000,
        saved: 0,
      },
    ]);
  };

  return (
    <div className="stack">
      <div className="section-intro goals-intro">
        <div>
          <span className="hero-kicker">Goal planner</span>
          <h1>Turn saving into milestones.</h1>
          <p>
            Give savings a purpose instead of leaving it as one anonymous
            number.
          </p>
        </div>
        <button className="primary-button" onClick={addGoal}>
          <Plus size={16} />
          Add goal
        </button>
      </div>

      <div className="goal-grid">
        {goals.map((goal) => {
          const progress = goal.target ? goal.saved / goal.target : 0;
          return (
            <div className="panel goal-panel" key={goal.id}>
              <div className="goal-panel-icon">
                <Target size={20} />
              </div>
              <input
                className="goal-name"
                value={goal.name}
                onChange={(e) =>
                  setGoals(
                    goals.map((current) =>
                      current.id === goal.id
                        ? { ...current, name: e.target.value }
                        : current
                    )
                  )
                }
              />
              <div className="goal-fields">
                <label>
                  Target
                  <div className="money-input boxed">
                    <span>$</span>
                    <input
                      type="number"
                      value={goal.target}
                      onChange={(e) =>
                        setGoals(
                          goals.map((current) =>
                            current.id === goal.id
                              ? { ...current, target: Number(e.target.value) || 0 }
                              : current
                          )
                        )
                      }
                    />
                  </div>
                </label>
                <label>
                  Saved
                  <div className="money-input boxed">
                    <span>$</span>
                    <input
                      type="number"
                      value={goal.saved}
                      onChange={(e) =>
                        setGoals(
                          goals.map((current) =>
                            current.id === goal.id
                              ? { ...current, saved: Number(e.target.value) || 0 }
                              : current
                          )
                        )
                      }
                    />
                  </div>
                </label>
              </div>
              <div className="goal-progress-label">
                <span>{percent(progress)} complete</span>
                <span>{currency(Math.max(goal.target - goal.saved, 0))} left</span>
              </div>
              <div className="progress-track neutral">
                <div
                  className="progress-fill goal"
                  style={{ width: `${Math.min(progress * 100, 100)}%` }}
                />
              </div>
              <button
                className="danger-button"
                onClick={() =>
                  setGoals(goals.filter((current) => current.id !== goal.id))
                }
              >
                <Trash2 size={15} />
                Remove goal
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectionTab({ savingsItems }) {
  const retirementContribution = useMemo(() => {
    const match = savingsItems.find((item) => /401k|retire/i.test(item.name));
    return Number(match?.amount) || 0;
  }, [savingsItems]);

  const [monthlyContribution, setMonthlyContribution] = useState(
    retirementContribution
  );
  const [employerMatch, setEmployerMatch] = useState(0);
  const [years, setYears] = useState(30);
  const [rate, setRate] = useState(7);

  useEffect(() => {
    setMonthlyContribution(retirementContribution);
  }, [retirementContribution]);

  const data = useMemo(() => {
    const monthlyTotal =
      (Number(monthlyContribution) || 0) + (Number(employerMatch) || 0);
    const r = (Number(rate) || 0) / 100 / 12;

    return Array.from({ length: years + 1 }, (_, year) => {
      const months = year * 12;
      const balance =
        r === 0
          ? monthlyTotal * months
          : monthlyTotal * ((Math.pow(1 + r, months) - 1) / r);
      const contributions = monthlyTotal * months;

      return {
        year,
        balance: Math.round(balance),
        contributions: Math.round(contributions),
      };
    });
  }, [monthlyContribution, employerMatch, years, rate]);

  const final = data[data.length - 1] || { balance: 0, contributions: 0 };

  return (
    <div className="stack">
      <div className="section-intro">
        <div>
          <span className="hero-kicker">Projection</span>
          <h1>See what consistency could become.</h1>
          <p>
            A planning estimate for retirement contributions and compound growth.
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="field-stack">
            <label>
              Monthly retirement contribution
              <div className="money-input boxed">
                <span>$</span>
                <input
                  type="number"
                  value={monthlyContribution}
                  onChange={(e) =>
                    setMonthlyContribution(Number(e.target.value) || 0)
                  }
                />
              </div>
            </label>

            <label>
              Employer match per month
              <div className="money-input boxed">
                <span>$</span>
                <input
                  type="number"
                  value={employerMatch}
                  onChange={(e) => setEmployerMatch(Number(e.target.value) || 0)}
                />
              </div>
            </label>

            <label>
              Years contributing <strong>{years}</strong>
              <input
                className="range"
                type="range"
                min="1"
                max="45"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
              />
            </label>

            <label>
              Average annual return
              <div className="rate-grid">
                {[5, 7, 9].map((option) => (
                  <button
                    key={option}
                    className={rate === option ? "rate-button active" : "rate-button"}
                    onClick={() => setRate(option)}
                  >
                    {option}%
                  </button>
                ))}
              </div>
            </label>
          </div>
        </div>

        <div className="panel">
          <div className="projection-stats">
            <div>
              <p className="eyebrow">Projected balance</p>
              <strong>{currency(final.balance)}</strong>
            </div>
            <div>
              <p className="eyebrow">Contributed</p>
              <strong>{currency(final.contributions)}</strong>
            </div>
            <div>
              <p className="eyebrow">Estimated growth</p>
              <strong className="green">
                {currency(final.balance - final.contributions)}
              </strong>
            </div>
          </div>

          <div className="large-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="projectionFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#47775d" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#47775d" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e8e4da" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
                  width={48}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value, name) => [
                    currency(value),
                    name === "balance" ? "Balance" : "Contributed",
                  ]}
                  labelFormatter={(year) => `Year ${year}`}
                />
                <Area
                  type="monotone"
                  dataKey="contributions"
                  stroke="#aaa08c"
                  fill="transparent"
                  strokeDasharray="4 3"
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#47775d"
                  fill="url(#projectionFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightsTab({ income, categories }) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const summary = useMemo(
    () =>
      CATEGORY_CONFIG.map((config) => {
        const total = categories[config.key].reduce(
          (sum, item) => sum + (Number(item.amount) || 0),
          0
        );
        return {
          category: config.label,
          target_pct: config.target,
          actual_amount: total,
          actual_pct: income ? total / income : 0,
          line_items: categories[config.key].map((item) => ({
            name: item.name,
            amount: item.amount,
          })),
        };
      }),
    [categories, income]
  );

  const getInsights = async () => {
    setLoading(true);
    setError("");
    setText("");

    try {
      // Keep the model/API key on the server. Point this route at your Gemini
      // backend or serverless function instead of calling a model directly
      // from the browser.
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          income,
          budget: summary,
          instruction:
            "Give 3-5 brief, plain-English budgeting observations based on the 50/30/20 framework. Mention specific categories when useful.",
        }),
      });

      if (!response.ok) throw new Error("Insights request failed");
      const data = await response.json();
      if (!data.text) throw new Error("No insight text returned");
      setText(data.text);
    } catch {
      setError(
        "Couldn't load AI insights. Make sure your /api/insights route is connected."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack">
      <div className="section-intro insight-intro">
        <div>
          <span className="hero-kicker">AI coach</span>
          <h1>Turn the numbers into next steps.</h1>
          <p>
            The 2.0 frontend sends the budget summary to a server-side AI route,
            keeping provider credentials out of the browser.
          </p>
        </div>
        <button className="primary-button" onClick={getInsights} disabled={loading}>
          <Sparkles size={16} />
          {loading ? "Reading budget…" : "Get insights"}
        </button>
      </div>

      {error && <div className="notice error">{error}</div>}
      {text ? (
        <div className="insight-card">
          {text
            .split("\n")
            .filter(Boolean)
            .map((line, index) => (
              <p key={index}>{line}</p>
            ))}
        </div>
      ) : (
        !loading && (
          <div className="empty-state">
            Press <strong>Get insights</strong> to generate a personalized budget
            readout.
          </div>
        )
      )}
    </div>
  );
}

function App() {
  const [income, setIncome] = useState(4200);
  const [categories, setCategories] = useState(makeItems());
  const [goals, setGoals] = useState(INITIAL_GOALS);
  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed.income != null) setIncome(parsed.income);
      if (parsed.categories) setCategories(parsed.categories);
      if (parsed.goals) setGoals(parsed.goals);
      if (parsed.tab) setTab(parsed.tab);
    } catch {
      // Keep defaults if saved data is unavailable.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ income, categories, goals, tab })
    );
  }, [income, categories, goals, tab]);

  const totals = useMemo(
    () =>
      Object.fromEntries(
        CATEGORY_CONFIG.map((config) => [
          config.key,
          categories[config.key].reduce(
            (sum, item) => sum + (Number(item.amount) || 0),
            0
          ),
        ])
      ),
    [categories]
  );

  const resetAll = () => {
    setIncome(4200);
    setCategories(makeItems());
    setGoals(INITIAL_GOALS);
    setTab("dashboard");
    localStorage.removeItem(STORAGE_KEY);
  };

  const tabs = [
    ["dashboard", "Dashboard"],
    ["budget", "Budget"],
    ["goals", "Goals"],
    ["projection", "401k projection"],
    ["insights", "AI insights"],
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">2</div>
          <div>
            <strong>The Ledger</strong>
            <span>Budget & Goal Planner · 2.0</span>
          </div>
        </div>

        <div className="header-actions">
          <label className="income-field">
            <span>Monthly income</span>
            <div className="income-control">
              <span>$</span>
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(Number(e.target.value) || 0)}
              />
            </div>
          </label>
          <button className="ghost-button" onClick={resetAll} title="Reset all data">
            <RotateCcw size={15} />
            Reset
          </button>
        </div>
      </header>

      <nav className="tab-bar" aria-label="Primary">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? "tab active" : "tab"}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="page">
        {tab === "dashboard" && (
          <Dashboard income={income} totals={totals} goals={goals} />
        )}
        {tab === "budget" && (
          <BudgetTab
            income={income}
            categories={categories}
            setCategories={setCategories}
          />
        )}
        {tab === "goals" && <GoalsTab goals={goals} setGoals={setGoals} />}
        {tab === "projection" && (
          <ProjectionTab savingsItems={categories.savings} />
        )}
        {tab === "insights" && (
          <InsightsTab income={income} categories={categories} />
        )}
      </main>

      <footer className="footer">
        <span>Planning tool only — not financial or investment advice.</span>
        <span>
          <ChevronDown size={13} /> 50 / 30 / 20 framework
        </span>
      </footer>
    </div>
  );
}

export default App;
