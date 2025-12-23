#!/bin/bash

echo "🚀 Installing UDT Backend..."

echo "\n📦 Installing Core..."
cd core && yarn install && cd ..

echo "\n📦 Installing Modbus Adapter..."
cd adapters/modbus && yarn install && cd ../..

echo "\n📦 Installing BACnet Adapter..."
cd adapters/bacnet && pip3 install -r requirements.txt && cd ../..

echo "\n✅ Backend installation complete!"

