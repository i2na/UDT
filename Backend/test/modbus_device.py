import asyncio
from pymodbus.server.async_io import StartTcpServer
from pymodbus.datastore import ModbusSequentialDataBlock, ModbusSlaveContext, ModbusServerContext

async def run():
    # 0번지부터 100번지까지 값 [0, 1, 2, ..., 99]로 세팅
    store = ModbusSlaveContext(hr=ModbusSequentialDataBlock(0, [i for i in range(100)]))
    context = ModbusServerContext(slaves=store, single=True)
    print("--- 가상 Modbus 장비가 5020 포트에서 실행 중입니다 ---")
    await StartTcpServer(context, address=("localhost", 5020))

if __name__ == "__main__":
    asyncio.run(run())