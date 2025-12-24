# PITCH DECK

> 산업용 프로토콜(Modbus, BACnet 등)을 HTTP REST API로 변환 및 배포해주는 프록시 호스팅 서비스

**핵심 가치**: "Postman처럼 테스트하고, CSV 하나로 프록시 서버 생성 및 배포 완료"

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution](#2-solution)
3. [API Endpoints](#3-api-endpoints)
4. [Use Case](#4-use-case)
5. [Competitive Advantage](#5-competitive-advantage)
6. [Business Model](#6-business-model)
7. [Architecture](#7-architecture)
8. [Security](#8-security)
9. [Technical Stack](#9-technical-stack)

## 1. Problem Statement

### 디지털 트윈 프로젝트의 반복되는 고통

**매번 프록시 서버를 직접 개발**

```python
# 프로젝트마다 반복되는 보일러플레이트 코드
from pymodbus.client import ModbusTcpClient
from flask import Flask, jsonify

app = Flask(__name__)
@app.route('/sensor/temp')
def get_temp():
    client = ModbusTcpClient('192.168.1.100')
    result = client.read_holding_registers(0, 2)
    # 에러 처리, 데이터 파싱, 스케일 변환...
    return jsonify({'temp': value})
```

**기존 방식의 한계**

-   🚫 Postman으로 테스트 불가 (Modbus/BACnet ≠ HTTP)
-   🚫 빠른 검증 불가능 (테스트용 코드 별도 작성 필요)
-   🚫 프로젝트마다 서버 배포, 유지보수, 장애 대응 반복
-   🚫 코드 파편화로 재사용 불가

## 2. Solution

### Core Features

#### 2.1 Protocol Playground

Postman처럼 GUI로 산업용 프로토콜을 즉시 테스트

```
┌─ Protocol Playground ────────────────────┐
│ Protocol: [Modbus TCP ▼]                 │
│ Host: 192.168.1.100    Port: 502         │
│ Register: 0            Length: 2         │
│                                          │
│              [ Send ]                    │
│                                          │
│ ✓ Success (127ms)                        │
│ Value: 24.5°C                            │
└──────────────────────────────────────────┘
```

#### 2.2 Proxy API

CSV 파일 업로드 → 즉시 REST API 서버 생성

**CSV Format**

| protocol   | host          | port | device_id | point_type  | address | length | format | scale | signed | alias         | description |
| ---------- | ------------- | ---- | --------- | ----------- | ------- | ------ | ------ | ----- | ------ | ------------- | ----------- |
| modbus-tcp | 192.168.1.100 | 502  | 1         | holding     | 0       | 2      | DWORD  | 10    | true   | boiler_temp   | 보일러온도  |
| modbus-tcp | 192.168.1.100 | 502  | 1         | holding     | 10      | 1      | WORD   | 1     | false  | boiler_status | 보일러상태  |
| bacnet     | 192.168.1.101 |      | 5001      | analogInput | 1       |        |        | 1     | true   | room_temp     | 실내온도    |
| bacnet     | 192.168.1.101 |      | 5001      | analogInput | 2       |        |        | 1     | true   | room_humidity | 실내습도    |

**특징**: 한 CSV에 여러 프로토콜(Modbus + BACnet + HTTP + MQTT) 혼용 가능

**CSV Column Specification**

| Column        | Required | Description                      | Example                                |
| ------------- | -------- | -------------------------------- | -------------------------------------- |
| `protocol`    | ✅       | 프로토콜 종류                    | `modbus-tcp`, `bacnet`, `http`, `mqtt` |
| `host`        | ✅       | 장비 IP 주소                     | `192.168.1.100`                        |
| `port`        | ⚪       | 포트 (빈칸=기본값)               | `502`, `47808`                         |
| `device_id`   | ⚪       | Modbus unitId / BACnet device ID | `1`, `5001`                            |
| `point_type`  | ⚪       | 레지스터/객체 타입               | `holding`, `analogInput`               |
| `address`     | ✅       | 주소/인스턴스/경로               | `0`, `1`, `/api/power`                 |
| `length`      | ⚪       | 읽을 길이 (Modbus)               | `1`, `2`                               |
| `format`      | ⚪       | 데이터 포맷                      | `WORD`, `DWORD`, `FLOAT`               |
| `scale`       | ⚪       | 스케일 팩터 (빈칸=1)             | `10`, `100`                            |
| `signed`      | ⚪       | 부호 여부                        | `true`, `false`                        |
| `alias`       | ✅       | API에서 사용할 키 이름           | `boiler_temp`                          |
| `description` | ⚪       | 설명                             | `보일러온도`                           |

## 3. API Endpoints

CSV 업로드 시 자동으로 3가지 API 엔드포인트 생성

### 3.1 Snapshot API

모든 포인트 한 번에 조회

```bash
GET /device/{device_id}/snapshot
```

```json
{
    "boiler_temp": 65.5,
    "room_temp": 23.2,
    "total_power": 1250
}
```

### 3.2 Raw API

개별 포인트 조회

```bash
GET /device/{device_id}/raw?alias=boiler_temp
```

```json
{
    "alias": "boiler_temp",
    "value": 65.5,
    "protocol": "modbus-tcp"
}
```

### 3.3 Points API

포인트 목록 조회

```bash
GET /device/{device_id}/points
```

```json
[
    {
        "alias": "boiler_temp",
        "protocol": "modbus-tcp",
        "host": "192.168.1.100",
        "description": "보일러온도"
    }
]
```

## 4. Use Case

### Before

```
1. Python/Node.js로 프록시 서버 코드 작성
2. 서버 배포 및 설정
3. 테스트용 코드 별도 작성
4. 유지보수 및 장애 대응
```

### After

```
1. Protocol Playground에서 GUI 테스트
2. CSV 업로드
3. 즉시 사용 가능
```

### Implementation Example

```javascript
// 단 3줄로 완성
const response = await fetch("https://api.udt.io/device/abc123/snapshot", {
    headers: { Authorization: `Bearer ${API_KEY}` },
});
const data = await response.json();
console.log(data.boiler_temp, data.room_temp, data.total_power);
```

## 5. Competitive Advantage

### Market Comparison

| Feature          | UDT            | Kepware         | Node-RED      | Custom Dev |
| ---------------- | -------------- | --------------- | ------------- | ---------- |
| **Test Tool**    | GUI Playground | Dedicated App   | Flow Editor   | Write Code |
| **Deploy Time**  | Fast           | Slow            | Medium        | Slow       |
| **Access**       | HTTP REST API  | OPC UA/DA       | Web Dashboard | Custom     |
| **Cost**         | $29~499/mo     | $2,000~5,000    | Free          | High Labor |
| **Maintenance**  | Managed by UDT | Self            | Self          | Self       |
| **Version Ctrl** | CSV/Git        | Binary Settings | JSON          | Code       |

### Key Differentiators

**1. Postman for Industrial Protocols**

-   업계 최초 GUI 기반 Modbus/BACnet 테스트 도구
-   코드 없이 즉시 검증 가능

**2. Multi-Protocol Integration**

-   한 CSV에 여러 프로토콜 혼용
-   한 번의 API 호출로 모든 데이터 조회

**3. Rapid Development**

-   기존: 개발 + 배포 + 관리
-   UDT: CSV 업로드

## 6. Business Model

**무료 테스트** - Protocol Playground는 누구나 무제한 사용 가능

### Pricing Plans

| Plan              | Target         | Price       | Deployments | API Requests   | Features              |
| ----------------- | -------------- | ----------- | ----------- | -------------- | --------------------- |
| **Free**          | Personal/Learn | $0          | 3           | 10K/mo         | -                     |
| **Starter**       | Small Projects | $29/mo      | 10          | 50K/mo         | -                     |
| **Pro**           | Startups/SI    | $99/mo      | 50          | 500K/mo        | Tech Support          |
| **Enterprise**    | Large Corp     | $499/mo     | Unlimited   | Unlimited      | On-premise, SLA 99.9% |
| **Pay-as-you-go** | Variable Load  | Usage-based | Unlimited   | $0.001/request | Min $10/mo            |

**Billing Metrics**

-   Deployments: Number of uploaded CSV configurations
-   API Requests: Total calls to snapshot, raw, and points APIs
-   Overage: Auto-suggest upgrade or switch to pay-as-you-go

### Target Customers

1. **SI Companies** - 프로젝트당 프록시 개발 비용 절감
2. **IoT Startups** - 빠른 MVP 개발
3. **Digital Twin Developers** - 다중 프로토콜 통합
4. **Maintenance Providers** - 레거시 장비 통합

## 7. Architecture

### On-Demand Proxy

실시간 조회 방식 (데이터 저장 없음)

```
User Request → UDT Proxy → Device Query → JSON Response
```

### Scalable Design

```
┌─────────────────────────────────────────┐
│         UDT Core Engine                 │
│  (CSV Parser + Router + API Server)     │
└─────────────────┬───────────────────────┘
                  │
      ┌───────────┼───────────┬───────────┐
      │           │           │           │
┌─────▼────┐ ┌───▼─────┐ ┌──▼──────┐ ┌──▼──────┐
│ Modbus   │ │ BACnet  │ │  HTTP   │ │  MQTT   │
│ Adapter  │ │ Adapter │ │ Adapter │ │ Adapter │
└──────────┘ └─────────┘ └─────────┘ └─────────┘
```

**프로토콜 확장**: Adapter만 추가 (코어 엔진 수정 불필요)

## 8. Security

### API Key Authentication

```bash
curl https://api.udt.io/device/abc123/snapshot \
  -H "Authorization: Bearer {api_key}"
```

### Token Expiration

사용자가 직접 만료일 설정

-   `30d`, `60d`, `90d` - 30일, 60일, 90일
-   `1y` - 1년
-   `never` - 영구 (기본값)

### IP Whitelist

특정 IP 주소에서만 API 접근 허용 (선택적)

## 9. Technical Stack

### Proven Libraries

| Protocol       | Library                     | Language        | Maturity   |
| -------------- | --------------------------- | --------------- | ---------- |
| Modbus TCP/RTU | `pymodbus`, `modbus-serial` | Python, Node.js | ⭐⭐⭐⭐⭐ |
| BACnet         | `BAC0`, `bacpypes`          | Python          | ⭐⭐⭐⭐⭐ |
| Siemens S7     | `python-snap7`              | Python          | ⭐⭐⭐⭐   |
| MQTT           | `paho-mqtt`                 | Python, Node.js | ⭐⭐⭐⭐⭐ |
| OPC UA         | `opcua`                     | Python, Node.js | ⭐⭐⭐⭐   |

### Protocol Adapter Pattern

```python
# 프로토콜별 격리된 어댑터
class ModbusAdapter:
    async def read(config):
        client = ModbusTcpClient(config.host, config.port)
        data = client.read_holding_registers(config.address, config.length)
        return decode(data, config.format, config.scale)

class BACnetAdapter:
    async def read(config):
        bacnet = BAC0.connect()
        value = bacnet.read(f"{config.host} {config.point_type} {config.address}")
        return value

# 통합 라우터
async def handle_request(device_id, alias):
    config = load_csv(device_id)
    point = config.find(alias)
    adapter = get_adapter(point.protocol)
    value = await adapter.read(point)
    return {"alias": alias, "value": value, "timestamp": now()}
```
