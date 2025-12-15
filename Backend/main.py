import uvicorn
import yaml
import uuid
import importlib
import os
from fastapi import FastAPI, HTTPException, Body

app = FastAPI(title="UDT Lite", description="Universal Data Translator")

# In-Memory Storage
config_store = {}

# 지원하는 프로토콜 목록 조회
@app.get("/protocols", summary="지원 프로토콜 목록 확인")
def get_protocols():
    """
    connectors 폴더에 있는 파일들을 스캔하여
    현재 지원하는 프로토콜 목록을 반환합니다.
    """
    protocol_list = []
    connector_dir = "connectors"
    
    # connectors 폴더 스캔
    if os.path.exists(connector_dir):
        for filename in os.listdir(connector_dir):
            if filename.endswith(".py") and filename not in ["__init__.py", "base.py"]:
                # .py 제거하여 프로토콜 이름만 추출
                protocol_list.append(filename[:-3])
    
    return {
        "count": len(protocol_list),
        "protocols": protocol_list
    }

@app.post("/create-link", summary="YAML 설정 등록 및 URL 생성")
def create_link(yaml_text: str = Body(..., media_type="text/plain")):
    try:
        config = yaml.safe_load(yaml_text)
        if not config or "protocol" not in config:
            raise HTTPException(status_code=400, detail="'protocol' field is required")
        
        # 지원하지 않는 프로토콜인지 미리 체크
        protocol_name = config["protocol"]
        if not os.path.exists(f"connectors/{protocol_name}.py"):
             raise HTTPException(status_code=400, detail=f"Unsupported protocol: {protocol_name}")

        link_id = str(uuid.uuid4())
        config_store[link_id] = config
        
        return {
            "link_id": link_id,
            "access_url": f"/fetch/{link_id}",
            "protocol": protocol_name
        }
    except yaml.YAMLError:
        raise HTTPException(status_code=400, detail="Invalid YAML format")

@app.get("/fetch/{link_id}", summary="데이터 즉시 조회")
def fetch_data(link_id: str):
    config = config_store.get(link_id)
    if not config:
        raise HTTPException(status_code=404, detail="Link not found")

    protocol_name = config.get("protocol")

    try:
        module = importlib.import_module(f"connectors.{protocol_name}")
        connector = module.Connector()
        result = connector.execute(config)
        
        return {
            "link_id": link_id,
            "protocol": protocol_name,
            "result": result
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)