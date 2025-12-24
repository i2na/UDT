import express from "express";
import ModbusRTU from "modbus-serial";

const app = express();
app.use(express.json());

const clientPool = new Map<string, ModbusRTU>();

async function getClient(host: string, port: number, deviceId: number) {
    const key = `${host}:${port}:${deviceId}`;

    if (!clientPool.has(key)) {
        const client = new ModbusRTU();
        await client.connectTCP(host, { port });
        client.setID(deviceId);
        client.setTimeout(2000);
        clientPool.set(key, client);
    }

    return clientPool.get(key)!;
}

function decodeValue(data: number[], format?: string, scale?: number) {
    scale = scale || 1;

    if (format === "DWORD" && data.length >= 2) {
        const value = (data[0] << 16) | data[1];
        return value / scale;
    }

    return data[0] / scale;
}

app.post("/read", async (req, res) => {
    const { host, port, device_id, address, length, format, scale } = req.body;

    try {
        const client = await getClient(host, port || 502, device_id || 1);
        const result = await client.readHoldingRegisters(address, length || 1);
        const value = decodeValue(result.data, format, scale ? parseInt(scale) : 1);

        res.json({ value });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Modbus Adapter running on port ${PORT}`);
});
