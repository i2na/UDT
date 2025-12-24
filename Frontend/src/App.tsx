import { useState } from "react";
import TestSection from "./components/TestSection";
import HostingSection from "./components/HostingSection";
import "./styles/App.scss";

export default function App() {
    const [activeTab, setActiveTab] = useState<"test" | "hosting">("test");

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
                    className={activeTab === "hosting" ? "active" : ""}
                    onClick={() => setActiveTab("hosting")}
                >
                    Hosting API
                </button>
            </nav>

            <main className="main">
                {activeTab === "test" ? <TestSection /> : <HostingSection />}
            </main>
        </div>
    );
}
