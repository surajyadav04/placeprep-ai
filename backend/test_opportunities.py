import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_opportunity_access_control():
    # 1. Register a student
    student_res = client.post("/api/auth/register", json={
        "email": "student_opp_test@univ.edu",
        "password": "password123",
        "role": "student"
    })
    student_token = student_res.json()["access_token"]
    
    # 2. Register a mentor
    mentor_res = client.post("/api/auth/register", json={
        "email": "mentor_opp_test@univ.edu",
        "password": "password123",
        "role": "mentor"
    })
    mentor_token = mentor_res.json()["access_token"]

    # 3. Student tries to post an opportunity (Should Fail - 403)
    post_res = client.post("/api/opportunities", json={
        "source_url": "https://example.com/job",
        "opportunity_type": "Full-Time",
        "title": "Software Engineer",
        "company_name": "Tech Corp",
        "ai_summary": "Great job.",
        "eligibility": "B.Tech",
        "skills": ["Python", "React"],
        "location": "Remote",
        "deadline": "2026-12-31"
    }, headers={"Authorization": f"Bearer {student_token}"})
    assert post_res.status_code == 403

    # 4. Mentor posts an opportunity (Should Succeed - 200)
    post_res = client.post("/api/opportunities", json={
        "source_url": "https://example.com/job",
        "opportunity_type": "Full-Time",
        "title": "Software Engineer",
        "company_name": "Tech Corp",
        "ai_summary": "Great job.",
        "eligibility": "B.Tech",
        "skills": ["Python", "React"],
        "location": "Remote",
        "deadline": "2026-12-31"
    }, headers={"Authorization": f"Bearer {mentor_token}"})
    assert post_res.status_code == 200
    opp_id = post_res.json()["id"]

    # 5. Both can read the opportunities
    get_res_student = client.get("/api/opportunities", headers={"Authorization": f"Bearer {student_token}"})
    assert get_res_student.status_code == 200
    assert len(get_res_student.json()) >= 1
    
    get_res_mentor = client.get("/api/opportunities", headers={"Authorization": f"Bearer {mentor_token}"})
    assert get_res_mentor.status_code == 200

    # 6. Student tries to delete (Should Fail - 403)
    del_res = client.delete(f"/api/opportunities/{opp_id}", headers={"Authorization": f"Bearer {student_token}"})
    assert del_res.status_code == 403

    # 7. Mentor deletes (Should Succeed - 200)
    del_res = client.delete(f"/api/opportunities/{opp_id}", headers={"Authorization": f"Bearer {mentor_token}"})
    assert del_res.status_code == 200

    print("All opportunity access control tests passed!")

if __name__ == "__main__":
    test_opportunity_access_control()
