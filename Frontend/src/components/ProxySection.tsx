import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { MdContentCopy, MdCloudUpload, MdFileDownload } from "react-icons/md";
import "../styles/ProxySection.scss";

interface EndpointItemProps {
    label: string;
    value: string;
    showCopyButton?: boolean;
    onCopy?: (value: string) => void;
}

function EndpointItem({ label, value, showCopyButton = false, onCopy }: EndpointItemProps) {
    return (
        <div className="endpoint-item">
            <label>{label}</label>
            <div className="endpoint-row">
                <code>{value}</code>
                {showCopyButton && onCopy && (
                    <button
                        className="copy-btn"
                        onClick={() => onCopy(value)}
                        title="Copy to clipboard"
                    >
                        <MdContentCopy size={18} />
                    </button>
                )}
            </div>
        </div>
    );
}

export default function ProxySection() {
    const [file, setFile] = useState<File | null>(null);
    const [endpoints, setEndpoints] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const downloadExample = () => {
        window.location.href = "/api/sample.csv";
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            setEndpoints(data);
        } catch (error: any) {
            setEndpoints({ error: error.message });
        }
        setLoading(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success("Copied to clipboard", {
                duration: 2000,
                style: {
                    background: "#111827",
                    color: "white",
                    borderRadius: "10px",
                },
            });
        });
    };

    return (
        <div className="proxy-page">
            <Toaster position="bottom-center" />
            <header className="page-header">
                <h2>Proxy API</h2>
                <p>Generate secure API endpoints for your devices by uploading a configuration file.</p>
            </header>

            <div className="proxy-container">
                <div className="proxy-card">
                    <div className="card-body">
                        <div className="instructions">
                            <h3>How it works</h3>
                            <p>1. Download the sample CSV template.</p>
                            <p>2. Fill in your device details.</p>
                            <p>3. Upload the file to generate your proxy endpoints.</p>
                        </div>

                        <div className="action-grid">
                            <button onClick={downloadExample} className="btn-secondary">
                                <MdFileDownload size={20} />
                                Download Sample CSV
                            </button>
                        </div>

                        <div className="upload-zone">
                            <label className="file-input-label">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                                <div className="upload-content">
                                    <MdCloudUpload size={32} className="upload-icon" />
                                    <span>{file ? file.name : "Click to upload or drag and drop"}</span>
                                    <p>CSV files only (max. 10MB)</p>
                                </div>
                            </label>
                        </div>

                        <button 
                            onClick={handleUpload} 
                            disabled={!file || loading} 
                            className="btn-primary full-width"
                        >
                            {loading ? "Generating..." : "Generate Endpoints"}
                        </button>
                    </div>
                </div>

                <div className="result-section">
                    <div className="result-card">
                        <div className="card-header">
                            <h3>Generated Endpoints</h3>
                        </div>
                        <div className="card-body">
                            {endpoints ? (
                                endpoints.error ? (
                                    <div className="error-state">
                                        <p>{endpoints.error}</p>
                                    </div>
                                ) : (
                                    <div className="endpoint-list">
                                        <EndpointItem label="Device ID" value={endpoints.device_id} />
                                        <EndpointItem
                                            label="Snapshot API"
                                            value={endpoints.endpoints.snapshot}
                                            showCopyButton
                                            onCopy={copyToClipboard}
                                        />
                                        <EndpointItem
                                            label="Raw API"
                                            value={endpoints.endpoints.raw}
                                            showCopyButton
                                            onCopy={copyToClipboard}
                                        />
                                        <EndpointItem
                                            label="Points API"
                                            value={endpoints.endpoints.points}
                                            showCopyButton
                                            onCopy={copyToClipboard}
                                        />
                                    </div>
                                )
                            ) : (
                                <div className="empty-state">
                                    <p>Your generated endpoints will appear here after upload.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

