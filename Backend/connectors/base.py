from abc import ABC, abstractmethod

class BaseConnector(ABC):
    @abstractmethod
    def execute(self, config: dict) -> dict:
        """
        모든 커넥터는 execute 메서드를 구현해야 하며,
        결과는 반드시 dict(JSON) 형태로 반환해야 함.
        """
        pass