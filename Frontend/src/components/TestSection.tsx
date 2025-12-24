import { useState } from "react";
import "../styles/TestSection.scss";

export default function TestSection() {
    const [protocol, setProtocol] = useState("modbus-tcp");
    const [formData, setFormData] = useState({
        host: "192.168.1.100",
        port: "502",
        device_id: "1",
        point_type: "analogInput",
        address: "0",
        length: "1",
        format: "WORD",
    });
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleTest = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ protocol, ...formData }),
            });
            const data = await res.json();
            setResult(data);
        } catch (error: any) {
            setResult({ error: error.message });
        }
        setLoading(false);
    };

    return (
        <div className="test-section">
            <h2>Protocol Playground</h2>

            <div className="form-group">
                <label>Protocol</label>
                <select value={protocol} onChange={(e) => setProtocol(e.target.value)}>
                    <option value="modbus-tcp">Modbus TCP</option>
                    <option value="bacnet">BACnet</option>
                </select>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Host</label>
                    <input
                        value={formData.host}
                        onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Port</label>
                    <input
                        value={formData.port}
                        onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>{protocol === "bacnet" ? "Device ID" : "Unit ID"}</label>
                    <input
                        value={formData.device_id}
                        onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                    />
                </div>
            </div>

            {protocol === "bacnet" && (
                <div className="form-group">
                    <label>Object Type</label>
                    <select
                        value={formData.point_type}
                        onChange={(e) => setFormData({ ...formData, point_type: e.target.value })}
                    >
                        <option value="analogInput">Analog Input</option>
                        <option value="analogOutput">Analog Output</option>
                        <option value="binaryInput">Binary Input</option>
                        <option value="binaryOutput">Binary Output</option>
                    </select>
                </div>
            )}

            <div className="form-row">
                <div className="form-group">
                    <label>{protocol === "bacnet" ? "Instance" : "Address"}</label>
                    <input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                </div>
                {protocol === "modbus-tcp" && (
                    <>
                        <div className="form-group">
                            <label>Length</label>
                            <input
                                value={formData.length}
                                onChange={(e) =>
                                    setFormData({ ...formData, length: e.target.value })
                                }
                            />
                        </div>
                        <div className="form-group">
                            <label>Format</label>
                            <select
                                value={formData.format}
                                onChange={(e) =>
                                    setFormData({ ...formData, format: e.target.value })
                                }
                            >
                                <option value="WORD">WORD</option>
                                <option value="DWORD">DWORD</option>
                                <option value="FLOAT">FLOAT</option>
                            </select>
                        </div>
                    </>
                )}
            </div>

            <button onClick={handleTest} disabled={loading} className="test-btn">
                {loading ? "Sending..." : "Send"}
            </button>

            {result && (
                <div className="result">
                    <h3>Result</h3>
                    <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
