import express from "express";
import cors from "cors";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

interface PointConfig {
  protocol: string;
  host: string;
  port?: string;
  device_id?: string;
  point_type?: string;
  address: string;
  length?: string;
  format?: string;
  scale?: string;
  signed?: string;
  alias: string;
  description?: string;
}

const devices: Map<string, PointConfig[]> = new Map();

app.get("/example.csv", (req, res) => {
  const csvPath = path.join(process.cwd(), "..", "example.csv");
  res.download(csvPath, "example.csv");
});

app.post("/test", async (req, res) => {
  const {
    protocol,
    host,
    port,
    device_id,
    point_type,
    address,
    length,
    format,
  } = req.body;

  try {
    let result;

    if (protocol === "modbus-tcp") {
      const response = await fetch("http://localhost:5001/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host,
          port: parseInt(port || "502"),
          device_id: parseInt(device_id || "1"),
          address: parseInt(address),
          length: parseInt(length || "1"),
          format,
        }),
      });
      result = await response.json();
    } else if (protocol === "bacnet") {
      const response = await fetch("http://localhost:5002/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host,
          device_id: parseInt(device_id || "0"),
          object_type: point_type,
          instance: parseInt(address),
        }),
      });
      result = await response.json();
    } else {
      return res.status(400).json({ error: "Unsupported protocol" });
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const csvContent = fs.readFileSync(req.file.path, "utf-8");
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    });

    const deviceId = uuidv4().substring(0, 8);
    devices.set(deviceId, records);

    fs.unlinkSync(req.file.path);

    const baseUrl = `http://localhost:3000/device/${deviceId}`;
    res.json({
      device_id: deviceId,
      endpoints: {
        snapshot: `${baseUrl}/snapshot`,
        raw: `${baseUrl}/raw?alias={alias}`,
        points: `${baseUrl}/points`,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/device/:deviceId/snapshot", async (req, res) => {
  const config = devices.get(req.params.deviceId);
  if (!config) return res.status(404).json({ error: "Device not found" });

  const results: Record<string, any> = {};

  for (const point of config) {
    try {
      let value;

      if (point.protocol === "modbus-tcp") {
        const response = await fetch("http://localhost:5001/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            host: point.host,
            port: parseInt(point.port || "502"),
            device_id: parseInt(point.device_id || "1"),
            address: parseInt(point.address),
            length: parseInt(point.length || "1"),
            format: point.format,
          }),
        });
        const data = await response.json();
        value = data.value;
      } else if (point.protocol === "bacnet") {
        const response = await fetch("http://localhost:5002/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            host: point.host,
            device_id: parseInt(point.device_id || "0"),
            object_type: point.point_type,
            instance: parseInt(point.address),
          }),
        });
        const data = await response.json();
        value = data.value;
      }

      results[point.alias] = value;
    } catch (error) {
      results[point.alias] = { error: "read_failed" };
    }
  }

  res.json(results);
});

app.get("/device/:deviceId/raw", async (req, res) => {
  const config = devices.get(req.params.deviceId);
  const alias = req.query.alias as string;

  if (!config) return res.status(404).json({ error: "Device not found" });

  const point = config.find((p) => p.alias === alias);
  if (!point) return res.status(404).json({ error: "Point not found" });

  try {
    let result;

    if (point.protocol === "modbus-tcp") {
      const response = await fetch("http://localhost:5001/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: point.host,
          port: parseInt(point.port || "502"),
          device_id: parseInt(point.device_id || "1"),
          address: parseInt(point.address),
          length: parseInt(point.length || "1"),
          format: point.format,
        }),
      });
      result = await response.json();
    } else if (point.protocol === "bacnet") {
      const response = await fetch("http://localhost:5002/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: point.host,
          device_id: parseInt(point.device_id || "0"),
          object_type: point.point_type,
          instance: parseInt(point.address),
        }),
      });
      result = await response.json();
    }

    res.json({ alias, protocol: point.protocol, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/device/:deviceId/points", (req, res) => {
  const config = devices.get(req.params.deviceId);
  if (!config) return res.status(404).json({ error: "Device not found" });

  res.json(
    config.map((p) => ({
      alias: p.alias,
      protocol: p.protocol,
      host: p.host,
      description: p.description,
    }))
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`UDT Core running on port ${PORT}`);
});
