# Universal Data Translator (UDT)

## 1. 서비스 개요

**한줄 소개**: CSV 파일 업로드만으로 산업용 프로토콜(Modbus, BACnet 등)을 HTTP REST API로 변환하는 프록시 호스팅 서비스

**핵심 가치**: "Postman처럼 테스트하고, CSV 하나로 프록시 서버 배포 완료"

## 2. 문제 정의 (Pain Point)

### 디지털 트윈 프로젝트의 반복되는 고통

**문제 1: 매번 프록시 서버를 직접 개발해야 함**

```python
# 프로젝트마다 이런 코드를 반복 작성...
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

**문제 2: Postman으로 테스트 불가**

- Modbus/BACnet은 HTTP가 아니라서 Postman 사용 불가
- 테스트하려면 매번 코드를 작성해야 함
- 빠른 검증이 불가능

**문제 3: 프로젝트마다 다른 서버 관리**

- 서버 배포, 유지보수, 장애 대응 반복
- 코드 파편화로 재사용 불가

## 3. UDT 솔루션

### 핵심 기능 1: Protocol Playground (산업용 Postman)

Postman처럼 GUI로 산업용 프로토콜을 즉시 테스트

```
┌─ Protocol Playground ────────────────────┐
│ Protocol: [Modbus TCP ▼]                 │
│ Host: 192.168.1.100    Port: 502         │
│ Register: 0            Length: 2         │
│                                           │
│           [ Test Read ]                   │
│                                           │
│ ✓ Success (127ms)                        │
│ Raw: [0, 245] → Value: 24.5°C           │
│                                           │
│ [ Save to CSV ] [ Add More Points ]      │
└───────────────────────────────────────────┘
```

### 핵심 기능 2: CSV 기반 프록시 호스팅

**CSV 파일 업로드 → 즉시 REST API 서버 생성**

#### CSV 형식

사용자는 CSV 파일로 설정을 업로드합니다. 예시:

| protocol   | host          | port | device_id | point_type  | address    | length | format | scale | signed | alias         | description |
| ---------- | ------------- | ---- | --------- | ----------- | ---------- | ------ | ------ | ----- | ------ | ------------- | ----------- |
| modbus-tcp | 192.168.1.100 | 502  | 1         | holding     | 0          | 2      | DWORD  | 10    | true   | boiler_temp   | 보일러온도  |
| modbus-tcp | 192.168.1.100 | 502  | 1         | holding     | 10         | 1      | WORD   | 1     | false  | boiler_status | 보일러상태  |
| bacnet     | 192.168.1.101 |      | 5001      | analogInput | 1          |        |        | 1     | true   | room_temp     | 실내온도    |
| bacnet     | 192.168.1.101 |      | 5001      | analogInput | 2          |        |        | 1     | true   | room_humidity | 실내습도    |
| http       | 192.168.1.102 | 8080 |           |             | /api/power |        |        | 1     |        | total_power   | 총전력      |

#### CSV 컬럼 설명

| 컬럼          | 필수 | 설명                             | 예시                                   |
| ------------- | ---- | -------------------------------- | -------------------------------------- |
| `protocol`    | ✅   | 프로토콜 종류                    | `modbus-tcp`, `bacnet`, `http`, `mqtt` |
| `host`        | ✅   | 장비 IP 주소                     | `192.168.1.100`                        |
| `port`        | ⚪   | 포트 (빈칸=기본값)               | `502`, `47808`                         |
| `device_id`   | ⚪   | Modbus unitId / BACnet device ID | `1`, `5001`                            |
| `point_type`  | ⚪   | 레지스터/객체 타입               | `holding`, `analogInput`               |
| `address`     | ✅   | 주소/인스턴스/경로               | `0`, `1`, `/api/power`                 |
| `length`      | ⚪   | 읽을 길이 (Modbus)               | `1`, `2`                               |
| `format`      | ⚪   | 데이터 포맷                      | `WORD`, `DWORD`, `FLOAT`               |
| `scale`       | ⚪   | 스케일 팩터 (빈칸=1)             | `10`, `100`                            |
| `signed`      | ⚪   | 부호 여부                        | `true`, `false`                        |
| `alias`       | ✅   | API에서 사용할 키 이름           | `boiler_temp`                          |
| `description` | ⚪   | 설명                             | `보일러온도`                           |

**특징**: 한 CSV에 여러 프로토콜(Modbus + BACnet + HTTP + MQTT) 혼용 가능!

#### 발급되는 3가지 API 엔드포인트

```bash
# 1. Snapshot API - 모든 포인트 한 번에 조회
GET https://api.udt.io/device/{device_id}/snapshot

# 응답 예시
{
  "boiler_temp": 65.5,
  "room_temp": 23.2,
  "total_power": 1250
}

# 2. Raw API - 개별 포인트 조회
GET https://api.udt.io/device/{device_id}/raw?alias=boiler_temp

# 응답 예시
{
  "alias": "boiler_temp",
  "value": 65.5,
  "protocol": "modbus-tcp"
}

# 3. Points API - 포인트 목록 조회
GET https://api.udt.io/device/{device_id}/points

# 응답 예시
[
  {
    "alias": "boiler_temp",
    "protocol": "modbus-tcp",
    "host": "192.168.1.100"
  }
]
```

## 4. 사용 시나리오

### Before

```bash
# 개발자가 직접 해야 하는 일:
1. Python/Node.js로 프록시 서버 코드 작성
2. 서버 배포 및 설정
3. 테스트용 코드 별도 작성
4. 유지보수 및 장애 대응
```

### After

```bash
# 1단계: Playground에서 테스트
- GUI로 Modbus 연결 테스트
- 값 정상 조회 확인
- "Save to CSV" 클릭

# 2단계: CSV 업로드
curl -X POST https://api.udt.io/config/upload \
  -F "file=@sensors.csv"

# 응답
{
  "device_id": "abc123",
  "endpoints": {
    "snapshot": "https://api.udt.io/device/abc123/snapshot"
  }
}

# 3단계: 즉시 사용
curl https://api.udt.io/device/abc123/snapshot
{
  "boiler_temp": 65.5,
  "room_temp": 23.2,
  "total_power": 1250
}
```

### 실제 사용 예시

```javascript
fetch("https://api.udt.io/device/abc123/snapshot", {
  headers: { Authorization: `Bearer ${API_KEY}` },
})
  .then((res) => res.json())
  .then((data) => console.log(data.boiler_temp, data.room_temp));
```

## 5. 경쟁 우위 및 사업성

### 경쟁사 비교

| 구분            | UDT            | Kepware         | Node-RED    | 직접 개발   |
| --------------- | -------------- | --------------- | ----------- | ----------- |
| **테스트 방법** | GUI Playground | 전용 클라이언트 | 플로우 작성 | 코드 작성   |
| **배포 시간**   | 5분            | 수 시간         | 30분        | 2~3일       |
| **접근성**      | HTTP REST API  | OPC UA/DA       | 웹 대시보드 | 직접 구현   |
| **비용**        | $29~499/월     | $2,000~5,000    | 무료        | 인건비 높음 |
| **유지보수**    | UDT가 관리     | 자체 관리       | 자체 관리   | 자체 관리   |
| **버전 관리**   | CSV/Git        | 바이너리 설정   | JSON        | 코드        |

### 핵심 차별점

**1. Postman for Industrial Protocols**

- 업계 최초로 GUI로 Modbus/BACnet을 테스트할 수 있는 도구
- 코드 없이 즉시 검증 가능

**2. 다중 프로토콜 통합**

- 한 CSV에 Modbus + BACnet + HTTP + MQTT 혼용
- 한 번의 API 호출로 모든 데이터 조회

**3. 개발 시간 단축**

- 기존: 프록시 개발 + 서버 관리 + 유지보수
- UDT: CSV 업로드만으로 즉시 사용

### 수익 모델

**테스트는 모두 무료** - Protocol Playground는 누구나 무제한 사용 가능

| 플랜              | 대상            | 월 요금     | 호스팅 개수 | 호스팅당 요청 제한 | 추가 사항             |
| ----------------- | --------------- | ----------- | ----------- | ------------------ | --------------------- |
| **Free**          | 개인/학습       | $0          | 3개         | 10,000 req/월      | -                     |
| **Starter**       | 소규모 프로젝트 | $29         | 10개        | 50,000 req/월      | -                     |
| **Pro**           | 스타트업/SI     | $99/월      | 50개        | 500,000 req/월     | 기술 지원             |
| **Enterprise**    | 대기업/제조사   | $499/월     | 무제한      | 무제한             | On-premise, SLA 99.9% |
| **Pay-as-you-go** | 변동 수요       | 사용량 기반 | 무제한      | $0.001/req         | 최소 $10/월           |

**과금 기준**:

- 호스팅 개수: 업로드한 CSV 파일(설정) 개수
- 요청 제한: 각 호스팅의 API 호출 횟수 (snapshot, raw, points 합산)
- 초과 시: 자동으로 상위 플랜 제안 또는 Pay-as-you-go로 전환

### 타겟 고객

1. **SI 업체**: 프로젝트마다 프록시 개발 비용 절감 (인건비 수백만원)
2. **IoT 스타트업**: MVP를 빠르게 만들어야 하는 팀
3. **디지털 트윈 개발자**: 다양한 프로토콜 통합 필요
4. **유지보수 업체**: 레거시 장비 통합 프로젝트

## 6. 핵심 아키텍처

### On-Demand Proxy

사용자가 API를 호출할 때만 실시간으로 장비에 접속합니다.

```
사용자 요청 → UDT 프록시 → 실제 장비 조회 → JSON 변환 → 즉시 반환
(데이터 저장 없음)
```

## 7. 보안 및 접근 제어

### API Key 인증

사용자가 대시보드에서 토큰을 발급받아 모든 API 요청에 사용합니다.

```bash
curl https://api.udt.io/device/dev_abc123/snapshot \
  -H "Authorization: Bearer {api_key}"
```

### 토큰 만료일 설정

토큰 생성 시 사용자가 직접 만료일을 선택할 수 있습니다.

**만료 옵션**:

- `30d` - 30일
- `60d` - 60일
- `90d` - 90일
- `1y` - 1년
- `never` - 영구 (기본값)

### IP 화이트리스트

특정 IP 주소에서만 API 접근을 허용하도록 설정할 수 있습니다. 여러 IP를 등록 가능하며, 설정하지 않으면 모든 IP에서 접근 가능합니다.

## 8. 기술적 실현 가능성

### 검증된 오픈소스 라이브러리

이미 성숙한 라이브러리가 존재하여 즉시 구현 가능:

| 프로토콜       | 라이브러리                  | 언어            | 성숙도     |
| -------------- | --------------------------- | --------------- | ---------- |
| Modbus TCP/RTU | `pymodbus`, `modbus-serial` | Python, Node.js | ⭐⭐⭐⭐⭐ |
| BACnet         | `BAC0`, `bacpypes`          | Python          | ⭐⭐⭐⭐⭐ |
| Siemens S7     | `python-snap7`              | Python          | ⭐⭐⭐⭐   |
| MQTT           | `paho-mqtt`                 | Python, Node.js | ⭐⭐⭐⭐⭐ |
| OPC UA         | `opcua`                     | Python, Node.js | ⭐⭐⭐⭐   |

### 프로토콜 어댑터 구조

```python
# 의사코드: 프로토콜별 격리된 어댑터
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

    adapter = get_adapter(point.protocol)  # modbus, bacnet, http, mqtt
    value = await adapter.read(point)

    return {"alias": alias, "value": value, "timestamp": now()}
```

### 확장 가능한 아키텍처

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

새 프로토콜 추가: Adapter만 추가하면 됨 (코어 엔진 수정 불필요)
```
