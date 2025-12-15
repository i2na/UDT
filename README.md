# UDT (Universal Data Translator)

설정 파일(YAML) 하나로 다양한 프로토콜(HTTP, Modbus 등)을 연결하고, 표준 JSON으로 변환해주는 초경량 미들웨어입니다.

## 1\. 설치 및 실행

### 1-1. 환경 설정 및 설치

```bash
cd Backend

python -m venv venv
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate   # Windows

pip install -r requirements.txt
```

### 1-2. 메인 서버 실행

```bash
python main.py
```

---

## 2\. 테스트 가이드 (Swagger UI)

서버 실행 후 브라우저에서 **[http://localhost:8000/docs](https://www.google.com/search?q=http://localhost:8000/docs)** 에 접속합니다.

### ✅ Case A: HTTP 프로토콜 테스트

외부의 공개된 API(JSONPlaceholder)를 연동하는 예제입니다.

1.  **링크 생성 (`POST /create-link`)**
    -   아래 YAML을 복사하여 `Try it out` -\> `Request body`에 입력하고 실행(Execute)합니다.
    <!-- end list -->
    ```yaml
    protocol: http
    target:
        url: "https://jsonplaceholder.typicode.com/todos/1"
        method: "GET"
    ```
2.  **데이터 조회 (`GET /fetch/{link_id}`)**
    -   응답받은 `link_id`를 복사하여 `fetch` API에 넣고 실행하면, 외부 API의 응답 값이 JSON으로 반환됩니다.

---

### ✅ Case B: Modbus 프로토콜 테스트 (가상 장비)

실제 장비가 없으므로, 포함된 **Mock Server**를 실행하여 테스트합니다.

#### 1\. 가상 장비(Mock Server) 가동

```bash
python Backend/test/modbus_device.py
```

#### 2\. 링크 생성 (`POST /create-link`)

Swagger UI에서 아래 YAML을 입력하여 가상 장비와 연결합니다.

```yaml
protocol: modbus
target:
    ip: "localhost"
    port: 5020
data_point:
    address: 10 # 가상 장비의 10번지 값을 조회
    count: 1
```

#### 3\. 데이터 조회 (`GET /fetch/{link_id}`)

발급받은 `link_id`로 요청을 보내면, 가상 장비(`mock_device.py`)에서 설정된 데이터 값이 JSON으로 반환됩니다.
