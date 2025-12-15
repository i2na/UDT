import requests
from connectors.base import BaseConnector

class Connector(BaseConnector):
    def execute(self, config: dict) -> dict:
        target = config.get("target", {})
        url = target.get("url")
        method = target.get("method", "GET").upper()
        
        if not url:
            return {"error": "URL is required"}

        try:
            if method == "GET":
                response = requests.get(url, timeout=5)
            elif method == "POST":
                response = requests.post(url, json=target.get("body"), timeout=5)
            else:
                return {"error": f"Unsupported method: {method}"}

            # 응답 처리
            try:
                data = response.json()
            except ValueError:
                data = {"text": response.text}

            return {
                "status_code": response.status_code,
                "data": data
            }
        except Exception as e:
            return {"error": str(e)}