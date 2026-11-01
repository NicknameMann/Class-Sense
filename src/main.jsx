import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ClassSense Uncaught Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 24,
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
          color: "#1e293b",
          backgroundColor: "#f8fafc",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            marginBottom: 16
          }}>⚠️</div>
          <h2 style={{ fontSize: 18, fontWeight: "bold", margin: "0 0 8px 0" }}>
            Terjadi Kendala Memuat Aplikasi
          </h2>
          <p style={{ fontSize: 12, color: "#64748b", maxWidth: 320, margin: "0 0 16px 0", lineHeight: 1.5 }}>
            {this.state.error?.message || "Kesalahan inisialisasi antarmuka."}
          </p>
          <button
            onClick={() => {
              try {
                localStorage.clear();
                sessionStorage.clear();
              } catch (e) {
                console.error(e);
              }
              window.location.reload();
            }}
            style={{
              padding: "10px 20px",
              backgroundColor: "#0f766e",
              color: "white",
              border: "none",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            Muat Ulang Aplikasi
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
