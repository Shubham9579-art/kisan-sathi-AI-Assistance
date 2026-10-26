import json
import os
from typing import List, Dict, Any, Optional

class KnowledgeService:
    def __init__(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        data_path = os.path.join(current_dir, "..", "..", "data", "knowledge", "crops.json")
        try:
            with open(data_path, "r", encoding="utf-8") as f:
                self.records: List[Dict[str, Any]] = json.load(f)
        except Exception as e:
            self.records = []
            print(f"Warning: could not load crops.json: {e}")

    def search(self, query: str, crop: Optional[str] = None) -> List[Dict[str, Any]]:
        query_lower = query.lower()
        results = []

        for record in self.records:
            query_relevance = 0
            record_crops = (
                record.get("crop", ""),
                record.get("crop_mr", ""),
                record.get("crop_hi", ""),
            )
            for keyword in record.get("keywords", []):
                keyword_lower = keyword.lower()
                is_crop_name = any(
                    crop_name and crop_name.lower() == keyword_lower
                    for crop_name in record_crops
                )
                if not is_crop_name and keyword_lower in query_lower:
                    query_relevance += 3

            issue_name = record.get("issue_name", "").lower()
            if issue_name and issue_name in query_lower:
                query_relevance += 4

            # Crop selection narrows relevant symptom matches; it must not match by itself.
            if query_relevance >= 3:
                score = query_relevance
                if crop:
                    selected_crop = crop.strip().lower()
                    if not any(
                        value
                        and (
                            value.strip().lower() in selected_crop
                            or selected_crop in value.strip().lower()
                        )
                        for value in record_crops
                    ):
                        continue
                    score += 5
                results.append((score, record))

        results.sort(key=lambda x: x[0], reverse=True)
        return [r[1] for r in results]

    def get_by_id(self, record_id: str) -> Optional[Dict[str, Any]]:
        for record in self.records:
            if record.get("id") == record_id:
                return record
        return None

knowledge_service = KnowledgeService()
