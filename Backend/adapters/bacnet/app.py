from flask import Flask, request, jsonify
import BAC0
import os
import asyncio
import threading
import time

app = Flask(__name__)
bacnet = None
loop = None
bacnet_thread = None

def run_in_loop(coro):
    global loop
    if loop is None or not loop.is_running():
        return None
    future = asyncio.run_coroutine_threadsafe(coro, loop)
    return future.result(timeout=10)

def init_bacnet_in_thread():
    global bacnet, loop
    try:
        import socket
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        ip_with_mask = f"{local_ip}/24"
        print(f"Initializing BACnet with {ip_with_mask}")
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        async def init_and_run():
            global bacnet
            bacnet = BAC0.lite(ip=ip_with_mask)
            print(f"BACnet initialized: {bacnet.localIPAddr}")
        
        loop.run_until_complete(init_and_run())
        loop.run_forever()
    except Exception as e:
        print(f"BACnet init error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if loop:
            loop.close()

def start_bacnet():
    global bacnet_thread
    if bacnet_thread is None or not bacnet_thread.is_alive():
        bacnet_thread = threading.Thread(target=init_bacnet_in_thread, daemon=True)
        bacnet_thread.start()
        time.sleep(3)

start_bacnet()

@app.route('/read', methods=['POST'])
def read():
    data = request.json
    host = data.get('host')
    device_id = data.get('device_id', 0)
    object_type = data.get('object_type', 'analogInput')
    instance = data.get('instance', 0)

    try:
        if not bacnet:
            return jsonify({'error': 'BACnet not initialized'}), 500

        address = f"{host} {object_type} {instance} presentValue"
        
        async def read_value():
            return await bacnet.read(address)
        
        value = run_in_loop(read_value())

        return jsonify({'value': value, 'address': address})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5002))
    print(f"BACnet Adapter running on port {port}")
    app.run(host='0.0.0.0', port=port)

