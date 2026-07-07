import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, 
  Receipt, 
  Sparkles, 
  LogOut 
} from "lucide-react";

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const menuItems = [
    { path: "/", name: "Dashboard", icon: LayoutDashboard },
    { path: "/expenses", name: "Expenses", icon: Receipt },
    { path: "/ai-entry", name: "AI Quick Add", icon: Sparkles },
  ];

  // Get user avatar initials
  const getInitials = () => {
    if (!profile || !profile.name) return "?";
    return profile.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          {/* Logo / Brand */}
          <div className="logo-container">
            <span className="logo-icon">🔮</span>
            <span className="logo-text">
              Spend<span className="accent-gradient">AI</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="nav-menu">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer with User info & Logout */}
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">{getInitials()}</div>
            <div className="user-details">
              <div className="user-name">{profile?.name || "Loading..."}</div>
              <div className="user-email">{profile?.email || "..."}</div>
            </div>
          </div>
          
          <button onClick={handleLogout} className="btn btn-secondary" style={{ width: "100%", justifyContent: "flex-start" }}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
