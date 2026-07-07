import React, { useEffect, useState } from "react";
import api from "../services/api";
import { 
  Search, 
  Filter, 
  Calendar, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  description: string;
}

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Pagination & Filtering State
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("Food");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formDescription, setFormDescription] = useState("");
  const [submittingForm, setSubmittingForm] = useState(false);

  const categories = ["Food", "Transport", "Utilities", "Entertainment", "Shopping", "Healthcare", "Education", "Others"];

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError("");
      
      let url = `/api/expenses?page=${page}&size=10&sortBy=date&direction=desc`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const response = await api.get<any>(url);
      setExpenses(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalItems(response.data.totalElements);
    } catch (err: any) {
      console.error("Error fetching expenses:", err);
      setError("Failed to fetch expenses. Please make sure the server database is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [page, category, startDate, endDate]); // Trigger fetch on pagination or quick filters

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchExpenses();
  };

  const handleClearFilters = () => {
    setSearch("");
    setCategory("");
    setStartDate("");
    setEndDate("");
    setPage(0);
  };

  const openAddModal = () => {
    setEditExpenseId(null);
    setFormTitle("");
    setFormAmount("");
    setFormCategory("Food");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormDescription("");
    setIsModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditExpenseId(expense.id);
    setFormTitle(expense.title);
    setFormAmount(expense.amount.toString());
    setFormCategory(expense.category);
    setFormDate(expense.date);
    setFormDescription(expense.description || "");
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmittingForm(true);

    const amountNum = parseFloat(formAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Amount must be a positive number.");
      setSubmittingForm(false);
      return;
    }

    const payload = {
      title: formTitle,
      amount: amountNum,
      category: formCategory,
      date: formDate,
      description: formDescription
    };

    try {
      if (editExpenseId !== null) {
        await api.put(`/api/expenses/${editExpenseId}`, payload);
      } else {
        await api.post("/api/expenses", payload);
      }
      setIsModalOpen(false);
      fetchExpenses();
    } catch (err: any) {
      console.error("Error saving expense:", err);
      setError("Failed to save expense details. Please check connection.");
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await api.delete(`/api/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      console.error("Error deleting expense:", err);
      setError("Failed to delete transaction. Please try again.");
    }
  };

  // Color mapping tags
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

  return (
    <div style={styles.container} className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Manage Expenses</h2>
          <p className="page-subtitle">Add, edit, filter, and view all your recorded transactions.</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={18} />
          <span>Add Expense</span>
        </button>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}

      {/* Search and Filters Drawer Bar */}
      <div className="glass-card" style={styles.filtersBar}>
        <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
          <div style={styles.searchWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by title or description..."
              className="form-input"
              style={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            <span>Search</span>
          </button>
        </form>

        <div style={styles.filterInputs}>
          <div style={styles.filterSelectWrapper}>
            <Filter size={14} style={styles.selectIcon} />
            <select
              className="form-input"
              style={styles.filterSelect}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.dateInputs}>
            <div style={styles.dateWrapper}>
              <Calendar size={14} style={styles.dateIcon} />
              <input
                type="date"
                className="form-input"
                style={styles.dateInput}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <span style={{ color: "var(--text-muted)", alignSelf: "center" }}>to</span>
            <div style={styles.dateWrapper}>
              <Calendar size={14} style={styles.dateIcon} />
              <input
                type="date"
                className="form-input"
                style={styles.dateInput}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          </div>

          <button onClick={handleClearFilters} className="btn btn-secondary" style={styles.clearBtn}>
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="glass-card" style={styles.tableCard}>
        {loading ? (
          <div style={styles.tableCenter}>
            <div style={styles.spinner}></div>
            <span style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>Refreshing list...</span>
          </div>
        ) : expenses.length === 0 ? (
          <div style={styles.emptyContainer}>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>No matching expenses found.</p>
            <button onClick={handleClearFilters} className="btn btn-secondary">
              <span>Reset Filters</span>
            </button>
          </div>
        ) : (
          <>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Title</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Amount</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => {
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
                        <td style={{ ...styles.td, textAlign: "right" }}>
                          <div style={styles.actionsCell}>
                            <button
                              onClick={() => openEditModal(expense)}
                              style={styles.actionBtn}
                              className="btn btn-secondary"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              style={{ ...styles.actionBtn, color: "var(--error)" }}
                              className="btn btn-secondary"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={styles.pagination}>
                <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  Showing page {page + 1} of {totalPages} ({totalItems} items)
                </span>
                <div style={styles.pageButtons}>
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="btn btn-secondary"
                    style={styles.pageBtn}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page === totalPages - 1}
                    className="btn btn-secondary"
                    style={styles.pageBtn}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add / Edit Glassmorphic Modal overlay */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div className="glass-container" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editExpenseId ? "Edit Expense" : "Add New Expense"}</h3>
              <button onClick={() => setIsModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={styles.modalForm}>
              <div className="form-group">
                <label className="form-label" htmlFor="title">Title / Name</label>
                <input
                  id="title"
                  type="text"
                  placeholder="e.g. Weekly Groceries"
                  className="form-input"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div style={styles.modalFormRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="amount">Amount (₹)</label>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="850.00"
                    className="form-input"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="category">Category</label>
                  <select
                    id="category"
                    className="form-input"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="date">Transaction Date</label>
                <input
                  id="date"
                  type="date"
                  className="form-input"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">Description (Optional)</label>
                <textarea
                  id="description"
                  placeholder="Additional transaction details..."
                  className="form-input"
                  style={styles.textarea}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div style={styles.modalFormActions}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={submittingForm}
                >
                  {submittingForm ? "Saving..." : editExpenseId ? "Save Changes" : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "0"
  },
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    border: "1px solid rgba(239, 68, 68, 0.15)",
    padding: "1rem",
    borderRadius: "var(--border-radius-md)",
    marginBottom: "2rem",
    color: "var(--error)"
  },
  filtersBar: {
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.2rem",
    marginBottom: "2rem"
  },
  searchForm: {
    display: "flex",
    gap: "1rem"
  },
  searchWrapper: {
    position: "relative",
    flex: 1,
    display: "flex",
    alignItems: "center"
  },
  searchIcon: {
    position: "absolute",
    left: "1rem",
    color: "var(--text-muted)"
  },
  searchInput: {
    paddingLeft: "2.8rem"
  },
  filterInputs: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem"
  },
  filterSelectWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    flex: "1 1 200px"
  },
  selectIcon: {
    position: "absolute",
    left: "1rem",
    color: "var(--text-muted)",
    pointerEvents: "none"
  },
  filterSelect: {
    paddingLeft: "2.5rem"
  },
  dateInputs: {
    display: "flex",
    gap: "0.5rem",
    flex: "1 1 auto"
  },
  dateWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  dateIcon: {
    position: "absolute",
    left: "1rem",
    color: "var(--text-muted)",
    pointerEvents: "none"
  },
  dateInput: {
    paddingLeft: "2.5rem",
    width: "160px"
  },
  clearBtn: {
    marginLeft: "auto"
  },
  tableCard: {
    padding: "0",
    overflow: "hidden"
  },
  tableCenter: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "4rem 0"
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid rgba(99, 102, 241, 0.1)",
    borderTopColor: "var(--primary-color)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  emptyContainer: {
    padding: "4rem 0",
    textAlign: "center"
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
    padding: "1rem 1.5rem",
    color: "var(--text-muted)",
    fontSize: "0.85rem",
    textTransform: "uppercase",
    borderBottom: "1px solid var(--border-color)",
    fontWeight: 600
  },
  tr: {
    borderBottom: "1px solid var(--border-color)",
    transition: "background 0.2s"
  },
  td: {
    padding: "1.2rem 1.5rem",
    fontSize: "0.95rem"
  },
  categoryBadge: {
    padding: "0.3rem 0.75rem",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: 600,
    display: "inline-block"
  },
  actionsCell: {
    display: "flex",
    gap: "0.5rem",
    justifyContent: "flex-end"
  },
  actionBtn: {
    padding: "0.5rem",
    background: "var(--bg-color)"
  },
  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.2rem 1.5rem",
    borderTop: "1px solid var(--border-color)"
  },
  pageButtons: {
    display: "flex",
    gap: "0.5rem"
  },
  pageBtn: {
    padding: "0.5rem 0.8rem"
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(11, 13, 25, 0.65)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    animation: "fadeIn 0.2s"
  },
  modalContent: {
    width: "100%",
    maxWidth: "520px",
    padding: "2rem",
    background: "var(--surface-color)",
    border: "1px solid var(--border-color)",
    boxShadow: "var(--shadow-card)"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem"
  },
  modalTitle: {
    fontSize: "1.3rem",
    fontWeight: 600,
    color: "var(--text-primary)"
  },
  modalCloseBtn: {
    background: "none",
    border: "none",
    color: "var(--text-secondary)",
    cursor: "pointer",
    padding: 0
  },
  modalForm: {
    display: "flex",
    flexDirection: "column",
    gap: "1.2rem"
  },
  modalFormRow: {
    display: "flex",
    gap: "1rem"
  },
  textarea: {
    minHeight: "80px",
    resize: "vertical"
  },
  modalFormActions: {
    display: "flex",
    gap: "1rem",
    marginTop: "1rem"
  }
};

export default Expenses;
