# UDT (Universal Data Translator)

CSV 파일 업로드만으로 산업용 프로토콜을 HTTP REST API로 변환하는 프록시 서비스

## Demo

🎥 [Watch Demo Video](https://pub-80a42cc7d41749078071917a4265d3ca.r2.dev/udt.mp4)

📖 [Pitch Deck](https://github.com/i2na/UDT/blob/main/Docs/PITCH_DECK.md)

## Quick Start

### Installation

```bash
# Backend
cd Backend
./install.sh

# Frontend
cd Frontend
yarn install
```

### Run

```bash
# Start backend services
cd Backend
pm2 start ecosystem.config.cjs

# Start frontend
cd Frontend
yarn dev
```

Open http://localhost:5173

### Stop

```bash
pm2 stop all
pm2 delete all
```

## Usage

### Protocol Playground

프로토콜을 즉시 테스트할 수 있는 인터랙티브 환경

1. 프로토콜 선택 (Modbus TCP / BACnet)
2. 연결 정보 입력 (Host, Port, Device ID)
3. 레지스터 설정 (Address, Length, Format)
4. **Send** 버튼 클릭
5. 결과 확인

### Hosting API

CSV 파일로 REST API를 즉시 배포

1. **Download Sample CSV** - 템플릿 다운로드
2. CSV 파일에 장비 정보 입력
3. 파일 업로드
4. 생성된 API 엔드포인트 사용:

```
GET /device/{device_id}/snapshot       # 전체 포인트 조회
GET /device/{device_id}/raw?alias=...  # 개별 포인트 조회
GET /device/{device_id}/points         # 포인트 목록
```

## Architecture

| Service        | Port | Description       |
| -------------- | ---- | ----------------- |
| Frontend       | 5173 | React UI          |
| Core API       | 3000 | Main API Server   |
| Modbus Adapter | 5001 | Modbus TCP Reader |
| BACnet Adapter | 5002 | BACnet Reader     |

## Commands

```bash
# View logs
pm2 logs              # All services
pm2 logs udt-core     # Core only
pm2 logs modbus-adapter
pm2 logs bacnet-adapter

# Restart services
pm2 restart all

# Monitor
pm2 monit
```
