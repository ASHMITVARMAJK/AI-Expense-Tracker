import React, { useState } from "react";
import api from "../services/api";
import { Sparkles, Send, CheckCircle, Trash2, ArrowRight } from "lucide-react";

interface ParsedExpense {
  title: string;
  amount: number;
  category: string;
  date: string;
  description: string;
}

export const AIEntry: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [parseSteps, setParseSteps] = useState<string[]>([]);
  const [expensesList, setExpensesList] = useState<ParsedExpense[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const categories = ["Food", "Transport", "Utilities", "Entertainment", "Shopping", "Healthcare", "Education", "Others"];

  const suggestions = [
    "Bought groceries for ₹850 today",
    "Spent 1200 on petrol yesterday morning",
    "Paid electricity bill of 3200 rupees",
    "Movie ticket for ₹250 and dinner for 800 last night"
  ];

  const handleSuggestionClick = (text: string) => {
    setInputText(text);
    setError("");
  };

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setError("");
    setExpensesList([]);
    setSuccess(false);
    setLoading(true);
    setParseSteps([]);

    // Run a pseudo-terminal parser animation for high-end aesthetic
    const steps = [
      "Contacting SpendAI Agent...",
      "Analyzing natural language grammar...",
      "Extracting amounts and currency...",
      "Matching category contexts...",
      "Synchronizing relative dates..."
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setParseSteps((prev) => [...prev, steps[i]]);
    }

    try {
      const response = await api.post<ParsedExpense[]>("/api/ai/parse", { text: inputText });
      setExpensesList(response.data);
    } catch (err: any) {
      console.error("AI parse failed:", err);
      setError("AI Parsing failed. Ensure your backend connection is online.");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (index: number, field: keyof ParsedExpense, value: any) => {
    setExpensesList((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleDeleteCard = (index: number) => {
    setExpensesList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleConfirmAddAll = async () => {
    setError("");
    
    // Validate all items
    for (const item of expensesList) {
      const amt = typeof item.amount === "string" ? parseFloat(item.amount) : item.amount;
      if (isNaN(amt) || amt <= 0) {
        setError(`Invalid amount for "${item.title}". Amount must be a positive number.`);
        return;
      }
    }

    setLoading(true);
    try {
      for (const item of expensesList) {
        const amt = typeof item.amount === "string" ? parseFloat(item.amount) : item.amount;
        const payload = {
          title: item.title,
          amount: amt,
          category: item.category,
          date: item.date,
          description: item.description
        };
        await api.post("/api/expenses", payload);
      }
      setSuccess(true);
      setExpensesList([]);
      setInputText("");
    } catch (err: any) {
      console.error("Failed to commit AI expenses:", err);
      setError("Could not save all expenses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">AI Natural Language Entry</h2>
          <p className="page-subtitle">Type one or multiple transactions to record them instantly.</p>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Input Box Card */}
        <div className="glass-card" style={styles.card}>
          <div style={styles.cardHeader}>
            <Sparkles size={20} color="var(--primary-color)" />
            <h3 style={styles.cardTitle}>Ask SpendAI</h3>
          </div>

          <form onSubmit={handleParse} style={styles.form}>
            <div style={styles.textareaWrapper}>
              <textarea
                className="form-input"
                style={styles.textarea}
                placeholder="What did you buy? Try typing: 'bought shoes for 2000 and pizza for 500 yesterday'"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={loading || success}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ alignSelf: "flex-end", gap: "0.5rem" }}
              disabled={loading || !inputText.trim() || success}
            >
              <span>Analyze Input</span>
              <Send size={16} />
            </button>
          </form>

          {/* Quick Suggestions */}
          {!loading && expensesList.length === 0 && !success && (
            <div style={styles.suggestionsSection}>
              <p style={styles.suggestionLabel}>Or click a sample suggestion:</p>
              <div style={styles.suggestionGrid}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(s)}
                    style={styles.suggestionBtn}
                    className="btn btn-secondary"
                  >
                    <span>{s}</span>
                    <ArrowRight size={14} style={styles.arrow} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Staggered Terminal Loading Steps */}
          {loading && parseSteps.length > 0 && (
            <div style={styles.consoleLoader}>
              {parseSteps.map((step, idx) => (
                <div key={idx} style={styles.consoleLine}>
                  <span style={styles.chevron}>&gt;</span>
                  <span>{step}</span>
                  {idx === parseSteps.length - 1 && <span style={styles.blinker}>|</span>}
                </div>
              ))}
            </div>
          )}

          {success && (
            <div style={styles.successPanel}>
              <CheckCircle size={54} color="var(--success)" style={{ marginBottom: "1rem" }} />
              <h4>Expenses Added Successfully!</h4>
              <p>Your transactions have been committed directly to the secure ledger.</p>
              <button onClick={() => setSuccess(false)} className="btn btn-primary" style={{ marginTop: "1.25rem" }}>
                <span>Record More Expenses</span>
              </button>
            </div>
          )}

          {error && <div style={styles.errorAlert}>{error}</div>}
        </div>

        {/* Results / Editing Preview List */}
        <div style={styles.previewPanel}>
          {expensesList.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Extracted Expenses ({expensesList.length})
                </h4>
                <button onClick={() => setExpensesList([])} className="btn btn-secondary" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}>
                  Discard All
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {expensesList.map((item, idx) => (
                  <div key={idx} className="glass-card" style={styles.previewCard}>
                    <div style={styles.previewHeader}>
                      <span style={{ ...styles.previewTitle, color: "var(--primary-color)" }}>Item #{idx + 1}</span>
                      <button
                        onClick={() => handleDeleteCard(idx)}
                        style={styles.deleteBtn}
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div style={styles.editForm}>
                      <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                        <label className="form-label">Title</label>
                        <input
                          type="text"
                          className="form-input"
                          value={item.title}
                          onChange={(e) => handleFieldChange(idx, "title", e.target.value)}
                        />
                      </div>

                      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
                        <div style={{ flex: 1 }}>
                          <label className="form-label">Amount (₹)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={item.amount}
                            onChange={(e) => handleFieldChange(idx, "amount", e.target.value)}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label className="form-label">Category</label>
                          <select
                            className="form-input"
                            value={item.category}
                            onChange={(e) => handleFieldChange(idx, "category", e.target.value)}
                          >
                            {categories.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
                        <div style={{ flex: 1 }}>
                          <label className="form-label">Date</label>
                          <input
                            type="date"
                            className="form-input"
                            value={item.date}
                            onChange={(e) => handleFieldChange(idx, "date", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Description / Notes</label>
                        <input
                          type="text"
                          className="form-input"
                          value={item.description || ""}
                          placeholder="No notes"
                          onChange={(e) => handleFieldChange(idx, "description", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleConfirmAddAll}
                className="btn btn-primary"
                style={{ width: "100%", padding: "0.9rem", marginTop: "0.5rem" }}
              >
                <span>Confirm & Save All ({expensesList.length})</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "0"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr",
    gap: "2rem"
  },
  card: {
    padding: "2rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem"
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  },
  cardTitle: {
    fontSize: "1.1rem",
    fontWeight: 700
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem"
  },
  textareaWrapper: {
    position: "relative"
  },
  textarea: {
    width: "100%",
    minHeight: "110px",
    resize: "none",
    padding: "1rem 1.2rem"
  },
  suggestionsSection: {
    marginTop: "1.5rem"
  },
  suggestionLabel: {
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    fontWeight: 600,
    marginBottom: "0.8rem"
  },
  suggestionGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem"
  },
  suggestionBtn: {
    justifyContent: "space-between",
    textAlign: "left",
    padding: "0.75rem 1.2rem"
  },
  arrow: {
    color: "var(--primary-color)",
    transition: "transform 0.2s"
  },
  consoleLoader: {
    backgroundColor: "#0f172a",
    fontFamily: "monospace",
    padding: "1.2rem",
    borderRadius: "var(--border-radius-md)",
    border: "1px solid #1e293b",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    minHeight: "150px"
  },
  consoleLine: {
    color: "var(--success)",
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  },
  chevron: {
    color: "var(--primary-color)"
  },
  blinker: {
    animation: "blink 1s steps(2, start) infinite",
    color: "#ffffff"
  },
  previewPanel: {
    display: "flex",
    flexDirection: "column"
  },
  previewCard: {
    padding: "1.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    boxShadow: "var(--shadow-premium)"
  },
  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "0.75rem",
    marginBottom: "0.5rem"
  },
  previewTitle: {
    fontSize: "1rem",
    fontWeight: 700
  },
  deleteBtn: {
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    padding: 0,
    transition: "color 0.2s"
  },
  editForm: {
    display: "flex",
    flexDirection: "column"
  },
  successPanel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "2rem"
  },
  errorAlert: {
    color: "var(--error)",
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    border: "1px solid rgba(239, 68, 68, 0.15)",
    padding: "0.8rem 1.2rem",
    borderRadius: "var(--border-radius-md)",
    fontSize: "0.9rem",
    marginTop: "1rem"
  }
};

export default AIEntry;
