from typing import List, Tuple
from ..schemas.detection import BoundingBox

class HazardAssessmentService:
    @staticmethod
    def evaluate_hazard(boxes: List[BoundingBox]) -> Tuple[str, str]:
        """
        Evaluates road hazard for blind-turn / ghat road sections:
        Returns: (hazard_status, reason)
        hazard_status is one of: "NORMAL", "CAUTION", "ALERT"
        """
        if not boxes:
            return "NORMAL", "No immediate hazard detected."
            
        vehicle_classes = {"car", "truck", "bus", "motorcycle"}
        vehicles = [b for b in boxes if b.class_.lower() in vehicle_classes]
        pedestrians = [b for b in boxes if b.class_.lower() == "person"]
        
        # Rule 1: High severity if pedestrian on ghat road curve or heavy vehicle stopped in curve center
        if len(pedestrians) > 0:
            return "ALERT", f"Pedestrian detected on roadway ({len(pedestrians)} person(s)) - High accident risk."

        # Rule 2: Heavy vehicle / truck / bus on narrow blind section
        heavy_vehicles = [b for b in vehicles if b.class_.lower() in {"truck", "bus"}]
        if len(heavy_vehicles) >= 2:
            return "ALERT", "Potential obstruction: Multiple heavy commercial vehicles in narrow curve."
            
        # Rule 3: Multiple vehicles meeting on sharp blind curve
        if len(vehicles) >= 3:
            return "ALERT", f"High congestion alert: {len(vehicles)} vehicles queued on blind turn."

        # Rule 4: Single heavy vehicle on sharp turn
        if len(heavy_vehicles) == 1 and len(vehicles) > 1:
            return "CAUTION", "Heavy vehicle negotiating sharp blind turn with oncoming traffic."

        # Rule 5: Vehicles present near monitored curve
        if len(vehicles) > 0:
            return "CAUTION", "Vehicle detected near monitored blind-turn section."

        return "NORMAL", "No immediate hazard detected."

hazard_service = HazardAssessmentService()
