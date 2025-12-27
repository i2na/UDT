import { useState } from "react";
import TestSection from "./components/TestSection";
import ProxySection from "./components/ProxySection";
import HeroSection from "./components/HeroSection";
import "./styles/App.scss";

export default function App() {
    const [page, setPage] = useState<"hero" | "test" | "proxy">("hero");

    const renderPage = () => {
        switch (page) {
            case "hero":
                return <HeroSection onGetStarted={() => setPage("test")} />;
            case "test":
                return <TestSection />;
            case "proxy":
                return <ProxySection />;
            default:
                return <HeroSection onGetStarted={() => setPage("test")} />;
        }
    };

    return (
        <div className="app">
            <nav className="navbar">
                <div className="navbar-container">
                    <div className="logo" onClick={() => setPage("hero")}>
                        UDT
                    </div>
                    <div className="nav-links">
                        <button
                            className={page === "hero" ? "active" : ""}
                            onClick={() => setPage("hero")}
                        >
                            Home
                        </button>
                        <button
                            className={page === "test" ? "active" : ""}
                            onClick={() => setPage("test")}
                        >
                            Playground
                        </button>
                        <button
                            className={page === "proxy" ? "active" : ""}
                            onClick={() => setPage("proxy")}
                        >
                            Proxy API
                        </button>
                    </div>
                    <div className="nav-actions">
                        <button className="btn-signin">Sign in</button>
                    </div>
                </div>
            </nav>

            <main className="main-content">
                {renderPage()}
            </main>

            <footer className="footer">
                <div className="footer-content">
                    <p>© 2025 UDT. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
