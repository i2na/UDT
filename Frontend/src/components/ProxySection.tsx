import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { MdContentCopy } from "react-icons/md";
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
            {showCopyButton && onCopy ? (
                <div className="endpoint-row">
                    <code>{value}</code>
                    <button
                        className="copy-btn"
                        onClick={() => onCopy(value)}
                        title="Copy to clipboard"
                    >
                        <MdContentCopy size={16} />
                    </button>
                </div>
            ) : (
                <code>{value}</code>
            )}
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
            toast.success("Copied!", {
                duration: 2000,
                style: {
                    background: "#27ae60",
                    color: "white",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    padding: "0.75rem 1.5rem",
                },
            });
        });
    };

    return (
        <div className="proxy-section">
            <Toaster position="bottom-right" />
            <h2>Proxy API</h2>

            <div className="download-section">
                <p>Download sample CSV template and fill it with your device configuration</p>
                <button onClick={downloadExample} className="download-btn">
                    Download Sample CSV
                </button>
            </div>

            <div className="upload-section">
                <label className="file-input">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    <span>{file ? file.name : "Choose CSV file"}</span>
                </label>

                <button onClick={handleUpload} disabled={!file || loading} className="upload-btn">
                    {loading ? "Uploading..." : "Upload & Generate Endpoints"}
                </button>
            </div>

            {endpoints && (
                <div className="endpoints">
                    <h3>Generated Endpoints</h3>
                    {endpoints.error ? (
                        <div className="error">{endpoints.error}</div>
                    ) : (
                        <>
                            <EndpointItem label="Device ID:" value={endpoints.device_id} />
                            <EndpointItem
                                label="Snapshot API:"
                                value={endpoints.endpoints.snapshot}
                                showCopyButton
                                onCopy={copyToClipboard}
                            />
                            <EndpointItem
                                label="Raw API:"
                                value={endpoints.endpoints.raw}
                                showCopyButton
                                onCopy={copyToClipboard}
                            />
                            <EndpointItem
                                label="Points API:"
                                value={endpoints.endpoints.points}
                                showCopyButton
                                onCopy={copyToClipboard}
                            />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

