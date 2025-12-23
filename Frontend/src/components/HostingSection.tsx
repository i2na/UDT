import { useState } from 'react';
import '../styles/HostingSection.scss';

export default function HostingSection() {
  const [file, setFile] = useState<File | null>(null);
  const [endpoints, setEndpoints] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const downloadExample = () => {
    window.location.href = '/api/example.csv';
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setEndpoints(data);
    } catch (error: any) {
      setEndpoints({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="hosting-section">
      <h2>CSV Hosting</h2>

      <div className="download-section">
        <p>Download example CSV template and fill it with your device configuration</p>
        <button onClick={downloadExample} className="download-btn">
          Download Example CSV
        </button>
      </div>

      <div className="upload-section">
        <label className="file-input">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <span>{file ? file.name : 'Choose CSV file'}</span>
        </label>

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="upload-btn"
        >
          {loading ? 'Uploading...' : 'Upload & Generate Endpoints'}
        </button>
      </div>

      {endpoints && (
        <div className="endpoints">
          <h3>Generated Endpoints</h3>
          {endpoints.error ? (
            <div className="error">{endpoints.error}</div>
          ) : (
            <>
              <div className="endpoint-item">
                <label>Device ID:</label>
                <code>{endpoints.device_id}</code>
              </div>
              <div className="endpoint-item">
                <label>Snapshot API:</label>
                <code>{endpoints.endpoints.snapshot}</code>
              </div>
              <div className="endpoint-item">
                <label>Raw API:</label>
                <code>{endpoints.endpoints.raw}</code>
              </div>
              <div className="endpoint-item">
                <label>Points API:</label>
                <code>{endpoints.endpoints.points}</code>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

