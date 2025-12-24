import { useState } from "react";
import TestSection from "./components/TestSection";
import ProxySection from "./components/ProxySection";
import "./styles/App.scss";

export default function App() {
    const [activeTab, setActiveTab] = useState<"test" | "proxy">("test");

    return (
        <div className="app">
            <header className="header">
                <h1>UDT</h1>
                <p>Universal Data Translator</p>
            </header>

            <nav className="tabs">
                <button
                    className={activeTab === "test" ? "active" : ""}
                    onClick={() => setActiveTab("test")}
                >
                    Protocol Playground
                </button>
                <button
                    className={activeTab === "proxy" ? "active" : ""}
                    onClick={() => setActiveTab("proxy")}
                >
                    Proxy API
                </button>
            </nav>

            <main className="main">
                {activeTab === "test" ? <TestSection /> : <ProxySection />}
            </main>
        </div>
    );
}
