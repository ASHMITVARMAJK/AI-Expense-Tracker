import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Clock, 
  BrainCircuit, 
  ArrowRight
} from "lucide-react";

interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  description: string;
}

interface DashboardData {
  totalExpenses: number;
  monthlyExpenses: number;
  previousMonthlyExpenses: number;
  recentTransactions: Expense[];
  categorySummary: Record<string, number>;
}

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [insights, setInsights] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get<DashboardData>("/api/expenses/dashboard");
      setData(response.data);
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError("Could not load dashboard statistics. Ensure the backend database is running.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAIInsights = async () => {
    setLoadingInsights(true);
    setInsights("");
    try {
      const response = await api.get<{ insights: string }>("/api/ai/insights");
      setInsights(response.data.insights);
    } catch (err) {
      console.error("Error fetching AI insights:", err);
      setInsights("### System Warning\n\nCould not fetch insights. Please check if your Gemini API key is configured.");
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Calculate MoM trend
  const getMoMTrend = () => {
    if (!data) return { percentage: 0, isIncrease: false };
    const cur = data.monthlyExpenses;
    const prev = data.previousMonthlyExpenses;
    if (prev === 0) return { percentage: cur > 0 ? 100 : 0, isIncrease: true };
    const diff = ((cur - prev) / prev) * 100;
    return {
      percentage: Math.abs(Math.round(diff)),
      isIncrease: diff > 0
    };
  };

  const trend = getMoMTrend();

  // Simple Markdown parser for rendering AI insights in a beautiful styled way
  const renderMarkdown = (md: string) => {
    if (!md) return null;
    return md.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("###")) {
        return <h4 key={idx} style={styles.insightH4}>{trimmed.replace("###", "").trim()}</h4>;
      }
      if (trimmed.startsWith("##")) {
        return <h3 key={idx} style={styles.insightH3}>{trimmed.replace("##", "").trim()}</h3>;
      }
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        // Parse bold markdown **text**
        return (
          <li key={idx} style={styles.insightLi}>
            {parseBoldText(trimmed.substring(1).trim())}
          </li>
        );
      }
      if (trimmed.startsWith("> [!NOTE]")) {
        return null; // Skip markdown alerts header, styling container handles it
      }
      if (trimmed.startsWith(">")) {
        return <blockquote key={idx} style={styles.blockquote}>{trimmed.substring(1).trim()}</blockquote>;
      }
      if (trimmed === "") {
        return <div key={idx} style={{ height: "0.5rem" }} />;
      }
      return <p key={idx} style={styles.insightP}>{parseBoldText(trimmed)}</p>;
    });
  };

  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => (i % 2 === 1 ? <strong key={i} style={{ color: "var(--text-primary)" }}>{part}</strong> : part));
  };

  // Color mapping for tags
  const getCategoryColor = (cat: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      Food: { bg: "rgba(245, 158, 11, 0.15)", text: "#d97706" },
      Transport: { bg: "rgba(2, 132, 199, 0.15)", text: "#0284c7" },
      Utilities: { bg: "rgba(13, 148, 136, 0.15)", text: "#0d9488" },
      Entertainment: { bg: "rgba(236, 72, 153, 0.15)", text: "#ec4899" },
      Shopping: { bg: "rgba(37, 99, 235, 0.15)", text: "#2563eb" },
      Healthcare: { bg: "rgba(239, 68, 68, 0.15)", text: "#ef4444" },
      Education: { bg: "rgba(168, 85, 247, 0.15)", text: "#a855f7" },
      Others: { bg: "rgba(148, 163, 184, 0.15)", text: "#64748b" }
    };
    return colors[cat] || colors.Others;
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner}></div>
        <span style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>Loading your financial data...</span>
      </div>
    );
  }

  // Calculate coordinates for category donut SVG chart
  const categories = data ? Object.entries(data.categorySummary) : [];
  const totalCatAmount = categories.reduce((sum, [_, val]) => sum + val, 0);

  let cumulativePercent = 0;
  const donutSlices = categories.map(([name, value], i) => {
    const percent = totalCatAmount > 0 ? value / totalCatAmount : 0;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;

    // SVG arc details
    const getCoordinatesForPercent = (percent: number) => {
      const x = Math.cos(2 * Math.PI * percent);
      const y = Math.sin(2 * Math.PI * percent);
      return [x, y];
    };

    const [startX, startY] = getCoordinatesForPercent(startPercent);
    const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
    const largeArcFlag = percent > 0.5 ? 1 : 0;

    const pathData = [
      `M ${startX} ${startY}`, // Move to starting point on edge
      `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Draw arc to end point
      `L 0 0` // Line to center
    ].join(" ");

    const colors = ["#2563eb", "#0284c7", "#475569", "#0d9488", "#6366f1", "#d97706", "#94a3b8"];
    const color = colors[i % colors.length];

    return { name, value, pathData, color, percent: Math.round(percent * 100) };
  });

  return (
    <div style={styles.container} className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard Overview</h2>
          <p className="page-subtitle">Your synchronized financial activities and AI analytics.</p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button onClick={fetchAIInsights} className="btn btn-accent" disabled={loadingInsights}>
            <BrainCircuit size={18} />
            <span>{loadingInsights ? "Analyzing..." : "Get AI Insights"}</span>
          </button>
          <Link to="/ai-entry" className="btn btn-primary">
            <span>AI Quick Add</span>
          </Link>
        </div>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}

      {/* Statistics Cards */}
      <div style={styles.statsGrid}>
        <div className="glass-card" style={styles.statCard}>
          <div style={styles.statIconContainer}>
            <DollarSign size={22} color="var(--primary-color)" />
          </div>
          <div>
            <p style={styles.statLabel}>Total Spend</p>
            <h3 style={styles.statValue}>₹{data?.totalExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</h3>
            <p style={styles.statFooter}>Accumulated total</p>
          </div>
        </div>

        <div className="glass-card" style={styles.statCard}>
          <div style={styles.statIconContainer}>
            <Calendar size={22} color="var(--secondary-color)" />
          </div>
          <div>
            <p style={styles.statLabel}>Monthly Spend</p>
            <h3 style={styles.statValue}>₹{data?.monthlyExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</h3>
            <div style={styles.trendRow}>
              {trend.isIncrease ? (
                <span style={{ ...styles.trendIndicator, color: "var(--error)" }}>
                  <TrendingUp size={14} /> {trend.percentage}%
                </span>
              ) : (
                <span style={{ ...styles.trendIndicator, color: "var(--success)" }}>
                  <TrendingDown size={14} /> {trend.percentage}%
                </span>
              )}
              <span style={styles.statFooter}>vs. last month</span>
            </div>
          </div>
        </div>

        <div className="glass-card" style={styles.statCard}>
          <div style={styles.statIconContainer}>
            <Clock size={22} color="var(--success)" />
          </div>
          <div>
            <p style={styles.statLabel}>Recent Action</p>
            <h3 style={styles.statValue}>
              {data?.recentTransactions.length ? data.recentTransactions[0].title : "None"}
            </h3>
            <p style={styles.statFooter}>
              {data?.recentTransactions.length 
                ? `₹${data.recentTransactions[0].amount} on ${data.recentTransactions[0].date}`
                : "No transactions logged yet"
              }
            </p>
          </div>
        </div>
      </div>

      <div style={styles.dashboardGrid}>
        {/* Left Side: Recent Transactions & Category Breakdown */}
        <div style={styles.mainPanel}>
          {/* Category Summary */}
          <div className="glass-card" style={styles.cardSection}>
            <h3 style={styles.sectionTitle}>Category Allocation</h3>
            {categories.length === 0 ? (
              <p style={styles.emptyText}>No expenses logged yet. Create some to view breakdowns.</p>
            ) : (
              <div style={styles.donutGrid}>
                {/* SVG Donut */}
                <div style={styles.donutSvgWrapper}>
                  <svg viewBox="-1.2 -1.2 2.4 2.4" style={styles.donutSvg}>
                    {donutSlices.map((slice, i) => (
                      <path
                        key={i}
                        d={slice.pathData}
                        fill={slice.color}
                        style={{ transform: "rotate(-90deg)", transformOrigin: "0px 0px" }}
                      />
                    ))}
                    {/* Inner hole for donut look */}
                    <circle r="0.65" fill="var(--surface-color)" />
                  </svg>
                  <div style={styles.donutText}>
                    <span style={styles.donutNum}>{categories.length}</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Categories</span>
                  </div>
                </div>

                {/* Categories Legend List */}
                <div style={styles.donutLegend}>
                  {donutSlices.map((slice, i) => (
                    <div key={i} style={styles.legendItem}>
                      <span style={{ ...styles.legendDot, backgroundColor: slice.color }}></span>
                      <span style={styles.legendName}>{slice.name}</span>
                      <span style={styles.legendValue}>₹{slice.value.toLocaleString("en-IN")}</span>
                      <span style={styles.legendPct}>{slice.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent Transactions Table */}
          <div className="glass-card" style={styles.cardSection}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Recent Transactions</h3>
              <Link to="/expenses" style={styles.viewAllLink}>
                <span>View All</span> <ArrowRight size={14} />
              </Link>
            </div>

            {data?.recentTransactions.length === 0 ? (
              <p style={styles.emptyText}>No expenses logged. Add your first expense to begin!</p>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Title</th>
                      <th style={styles.th}>Category</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentTransactions.map((expense) => {
                      const colors = getCategoryColor(expense.category);
                      return (
                        <tr key={expense.id} style={styles.tr}>
                          <td style={styles.td}>
                            <div style={{ fontWeight: 600 }}>{expense.title}</div>
                            {expense.description && (
                              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                                {expense.description}
                              </div>
                            )}
                          </td>
                          <td style={styles.td}>
                            <span style={{ ...styles.categoryBadge, backgroundColor: colors.bg, color: colors.text }}>
                              {expense.category}
                            </span>
                          </td>
                          <td style={styles.td}>{expense.date}</td>
                          <td style={{ ...styles.td, fontWeight: 700, color: "var(--text-primary)" }}>
                            ₹{expense.amount.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: AI Spending Insights */}
        <div style={styles.sidePanel}>
          <div className="glass-card" style={{ ...styles.cardSection, height: "100%", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <BrainCircuit size={22} color="var(--secondary-color)" />
              <h3 style={styles.sectionTitle}>AI Financial Insights</h3>
            </div>

            {loadingInsights && (
              <div style={styles.insightLoadingContainer}>
                <div className="skeleton-pulse" style={styles.skeletonTitle}></div>
                <div className="skeleton-pulse" style={styles.skeletonLine}></div>
                <div className="skeleton-pulse" style={styles.skeletonLine}></div>
                <div className="skeleton-pulse" style={styles.skeletonLineShort}></div>
                <div className="skeleton-pulse" style={styles.skeletonLine}></div>
                <div className="skeleton-pulse" style={styles.skeletonLineShort}></div>
                <style>{`
                  .skeleton-pulse {
                    background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%);
                    background-size: 200% 100%;
                    animation: loading-pulse 1.5s infinite;
                    border-radius: 4px;
                    margin-bottom: 0.8rem;
                  }
                  @keyframes loading-pulse {
                    to { background-position: -200% 0; }
                  }
                `}</style>
              </div>
            )}

            {!loadingInsights && !insights && (
              <div style={styles.insightsPlaceholder}>
                <BrainCircuit size={48} style={{ color: "var(--text-muted)", marginBottom: "1rem", opacity: 0.5 }} />
                <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                  Let Gemini analyze your transaction categories and provide personalized insights.
                </p>
                <button onClick={fetchAIInsights} className="btn btn-secondary">
                  <span>Generate Report</span>
                </button>
              </div>
            )}

            {!loadingInsights && insights && (
              <div style={styles.insightsContent}>
                {renderMarkdown(insights)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "0"
  },
  center: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "calc(100vh - 100px)"
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid rgba(99, 102, 241, 0.1)",
    borderTopColor: "var(--primary-color)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    border: "1px solid rgba(239, 68, 68, 0.15)",
    padding: "1rem",
    borderRadius: "var(--border-radius-md)",
    marginBottom: "2rem",
    color: "var(--error)"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem"
  },
  statCard: {
    display: "flex",
    alignItems: "center",
    gap: "1.25rem",
    padding: "1.5rem 2rem",
    background: "var(--surface-color)"
  },
  statIconContainer: {
    width: "50px",
    height: "50px",
    borderRadius: "var(--border-radius-md)",
    backgroundColor: "var(--bg-color)",
    border: "1px solid var(--border-color)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  statLabel: {
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  statValue: {
    fontSize: "1.8rem",
    fontWeight: 700,
    margin: "0.2rem 0"
  },
  statFooter: {
    fontSize: "0.8rem",
    color: "var(--text-muted)"
  },
  trendRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  },
  trendIndicator: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.2rem",
    fontSize: "0.85rem",
    fontWeight: 600
  },
  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "2rem"
  },
  mainPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem"
  },
  sidePanel: {
    minHeight: "450px"
  },
  cardSection: {
    padding: "2rem"
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem"
  },
  sectionTitle: {
    fontSize: "1.2rem",
    fontWeight: 600,
    color: "var(--text-primary)"
  },
  viewAllLink: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    color: "var(--primary-color)",
    textDecoration: "none",
    fontSize: "0.9rem",
    fontWeight: 600
  },
  emptyText: {
    color: "var(--text-secondary)",
    textAlign: "center",
    padding: "2rem 0"
  },
  tableWrapper: {
    overflowX: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  th: {
    textAlign: "left",
    padding: "0.75rem 1rem",
    color: "var(--text-muted)",
    fontSize: "0.8rem",
    textTransform: "uppercase",
    borderBottom: "1px solid var(--border-color)"
  },
  tr: {
    borderBottom: "1px solid var(--border-color)",
    transition: "background 0.2s"
  },
  td: {
    padding: "1rem",
    fontSize: "0.95rem"
  },
  categoryBadge: {
    padding: "0.25rem 0.6rem",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: 600,
    display: "inline-block"
  },
  donutGrid: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-around",
    gap: "2rem"
  },
  donutSvgWrapper: {
    position: "relative",
    width: "180px",
    height: "180px"
  },
  donutSvg: {
    width: "100%",
    height: "100%",
    transform: "rotate(-90deg)"
  },
  donutText: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center"
  },
  donutNum: {
    fontSize: "1.8rem",
    fontWeight: 700,
    display: "block"
  },
  donutLegend: {
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
    flex: 1,
    minWidth: "200px"
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    fontSize: "0.9rem"
  },
  legendDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    marginRight: "0.75rem",
    display: "inline-block"
  },
  legendName: {
    color: "var(--text-secondary)",
    flex: 1
  },
  legendValue: {
    fontWeight: 600,
    marginRight: "1rem"
  },
  legendPct: {
    color: "var(--text-muted)",
    width: "40px",
    textAlign: "right"
  },
  insightsPlaceholder: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "300px",
    textAlign: "center"
  },
  insightsContent: {
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
    lineHeight: "1.6",
    overflowY: "auto",
    maxHeight: "450px",
    paddingRight: "0.5rem"
  },
  insightH3: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    marginTop: "1.2rem",
    marginBottom: "0.5rem"
  },
  insightH4: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "var(--secondary-color)",
    marginTop: "1rem",
    marginBottom: "0.4rem",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    paddingBottom: "0.2rem"
  },
  insightLi: {
    marginLeft: "1.2rem",
    marginBottom: "0.4rem",
    listStyleType: "square"
  },
  insightP: {
    marginBottom: "0.8rem"
  },
  blockquote: {
    borderLeft: "3px solid var(--primary-color)",
    paddingLeft: "1rem",
    background: "var(--bg-color)",
    padding: "0.8rem 1rem",
    borderRadius: "0 8px 8px 0",
    marginBottom: "1rem",
    fontStyle: "italic"
  },
  insightLoadingContainer: {
    display: "flex",
    flexDirection: "column",
    padding: "1rem 0"
  },
  skeletonTitle: {
    width: "40%",
    height: "20px"
  },
  skeletonLine: {
    width: "100%",
    height: "14px"
  },
  skeletonLineShort: {
    width: "70%",
    height: "14px"
  }
};

export default Dashboard;
