from abc import ABC, abstractmethod
from typing import List, Optional
from app.schemas.hazard import HazardCreate


class BaseHazardConnector(ABC):
    """Abstract Base Class for all external hazard data connectors."""

    name: str

    @abstractmethod
    def fetch_hazards(self, bbox: Optional[str] = None) -> List[HazardCreate]:
        """
        Fetch and normalize hazards from the external source.
        
        :param bbox: Bounding box string "min_lon,min_lat,max_lon,max_lat"
        :return: List of validated HazardCreate objects
        """
        pass
