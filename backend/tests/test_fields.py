from fastapi.testclient import TestClient
import uuid
from app.main import app

client = TestClient(app)

def test_fields_crud_and_observation():
    client.cookies.clear()
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Field Test Farmer",
            "email": f"field-test-{uuid.uuid4().hex}@example.test",
            "password": "field-test-password-123",
        },
    )
    assert register_response.status_code == 201

    # 1. Create a field
    new_field = {
        "name": "Test Cotton Plot",
        "location": "Akola, Maharashtra",
        "crop": "Cotton",
        "planting_date": "2026-06-15",
        "area": 2.5,
        "area_unit": "Acres",
        "growth_stage": "Boll Formation",
        "notes": "Testing field persistence"
    }
    create_resp = client.post("/api/v1/fields", json=new_field)
    assert create_resp.status_code == 201
    field_data = create_resp.json()
    field_id = field_data["id"]
    assert field_data["name"] == "Test Cotton Plot"

    # 2. Get the field
    get_resp = client.get(f"/api/v1/fields/{field_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == field_id

    # 3. Add an observation
    obs_payload = {
        "date": "2026-07-20",
        "growth_stage": "Boll Formation",
        "notes": "Trap counts normal. No bollworm damage observed."
    }
    obs_resp = client.post(f"/api/v1/fields/{field_id}/observations", json=obs_payload)
    assert obs_resp.status_code == 201
    assert obs_resp.json()["notes"] == "Trap counts normal. No bollworm damage observed."

    # 4. Verify observation retrieved
    obs_list_resp = client.get(f"/api/v1/fields/{field_id}/observations")
    assert obs_list_resp.status_code == 200
    assert len(obs_list_resp.json()) >= 1

    # 5. Patch field
    patch_resp = client.patch(f"/api/v1/fields/{field_id}", json={"growth_stage": "Maturity"})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["growth_stage"] == "Maturity"

    # 6. Delete field
    del_resp = client.delete(f"/api/v1/fields/{field_id}")
    assert del_resp.status_code == 204

    # 7. Verify deletion
    verify_resp = client.get(f"/api/v1/fields/{field_id}")
    assert verify_resp.status_code == 404
