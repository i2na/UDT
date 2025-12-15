from pymodbus.client import ModbusTcpClient
from connectors.base import BaseConnector

class Connector(BaseConnector):
    def execute(self, config: dict) -> dict:
        target = config.get("target", {})
        point = config.get("data_point", {})

        ip = target.get("ip", "localhost")
        port = target.get("port", 502)
        address = point.get("address", 0)
        count = point.get("count", 1)

        client = ModbusTcpClient(ip, port=port)
        
        try:
            is_connected = client.connect()
            if not is_connected:
                return {"status": "offline", "error": "Connection failed"}

            # Holding Register 읽기 예시
            rr = client.read_holding_registers(address, count)
            
            if rr.isError():
                return {"status": "error", "error": f"Modbus Exception: {rr}"}

            return {
                "status": "online",
                "registers": rr.registers,
                "value": rr.registers[0] if rr.registers else None
            }
        except Exception as e:
            return {"status": "exception", "error": str(e)}
        finally:
            client.close()