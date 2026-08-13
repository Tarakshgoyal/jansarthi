#!/usr/bin/env python3
"""Exercise the complete Jansarthi workflow against a running local API."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import httpx


ROOT = Path(__file__).resolve().parents[1]
PHOTO = ROOT / "jansarthi-app" / "assets" / "images" / "icon.png"
BASE_URL = os.getenv("E2E_API_URL", "http://127.0.0.1:8002")
OTP = "999999"


def expect(response: httpx.Response, status: int, context: str) -> dict[str, Any]:
    if response.status_code != status:
        raise AssertionError(
            f"{context}: expected HTTP {status}, got {response.status_code}: {response.text}"
        )
    if not response.content:
        return {}
    return response.json()


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def login(client: httpx.Client, mobile: str) -> dict[str, Any]:
    expect(client.post("/api/auth/login", json={"mobile_number": mobile}), 200, f"login {mobile}")
    return expect(
        client.post(
            "/api/auth/verify-otp",
            json={"mobile_number": mobile, "otp_code": OTP},
        ),
        200,
        f"verify OTP {mobile}",
    )


def run() -> None:
    with httpx.Client(base_url=BASE_URL, timeout=20) as client:
        health = expect(client.get("/health"), 200, "health check")
        assert health.get("status") == "healthy", health

        signup = expect(
            client.post(
                "/api/auth/signup",
                json={"name": "E2E Citizen", "mobile_number": "+919000000001"},
            ),
            201,
            "citizen signup",
        )
        assert signup["mobile_number"] == "+919000000001"
        citizen_auth = expect(
            client.post(
                "/api/auth/verify-otp",
                json={"mobile_number": "+919000000001", "otp_code": OTP},
            ),
            200,
            "citizen OTP verification",
        )
        citizen_headers = auth_headers(citizen_auth["access_token"])
        assert citizen_auth["user"]["role"] == "user"

        refreshed = expect(
            client.post(
                "/api/auth/refresh",
                json={"refresh_token": citizen_auth["refresh_token"]},
            ),
            200,
            "token refresh",
        )
        citizen_headers = auth_headers(refreshed["access_token"])
        me = expect(client.get("/api/auth/me", headers=citizen_headers), 200, "current user")
        assert me["mobile_number"] == "+919000000001"

        localities = expect(
            client.get("/api/reports/localities/all?type=ward"),
            200,
            "locality list",
        )
        primary = next(item for item in localities["items"] if item["name"] == "E2E Ward")
        assert primary["representatives"][0]["name"] == "E2E Representative"

        invalid = client.post(
            "/api/reports",
            headers=citizen_headers,
            data={
                "issue_type": "water",
                "description": "short",
                "latitude": "30.3165",
                "longitude": "78.0322",
                "locality_id": str(primary["id"]),
            },
        )
        expect(invalid, 422, "short description validation")

        with PHOTO.open("rb") as photo:
            issue = expect(
                client.post(
                    "/api/reports",
                    headers=citizen_headers,
                    data={
                        "issue_type": "water",
                        "description": "E2E water pipe leak near the public road",
                        "latitude": "30.3165",
                        "longitude": "78.0322",
                        "locality_id": str(primary["id"]),
                    },
                    files={"photos": ("reported.png", photo, "image/png")},
                ),
                201,
                "issue creation",
            )
        issue_id = issue["id"]
        assert issue["status"] == "assigned"
        assert issue["assigned_parshad_id"] is not None
        assert issue["locality_name"] == "E2E Ward"
        assert issue["locality_type"] == "ward"
        assert len(issue["photos"]) == 1
        assert "issue_id" not in issue["photos"][0]
        expect(client.get(f"/api/reports/{issue_id}"), 403, "anonymous issue detail")
        citizen_detail = expect(
            client.get(f"/api/reports/{issue_id}", headers=citizen_headers),
            200,
            "citizen issue detail",
        )
        assert citizen_detail["id"] == issue_id

        other_auth = login(client, "+919000000004")
        expect(
            client.get(
                f"/api/parshad/issues/{issue_id}",
                headers=auth_headers(other_auth["access_token"]),
            ),
            403,
            "cross-locality representative access",
        )

        representative_auth = login(client, "+919000000002")
        representative_headers = auth_headers(representative_auth["access_token"])
        dashboard = expect(
            client.get("/api/parshad/dashboard", headers=representative_headers),
            200,
            "representative dashboard",
        )
        assert dashboard["pending_acknowledgement"] == 1
        representative_detail = expect(
            client.get(
                f"/api/parshad/issues/{issue_id}",
                headers=representative_headers,
            ),
            200,
            "representative issue detail",
        )
        assert len(representative_detail["photos"]) == 1
        assert representative_detail["photos"][0].startswith("http")
        acknowledged = expect(
            client.post(
                f"/api/parshad/issues/{issue_id}/acknowledge",
                headers=representative_headers,
            ),
            200,
            "representative acknowledgement",
        )
        assert acknowledged["status"] == "representative_acknowledged"

        pwd_auth = login(client, "+919000000003")
        pwd_headers = auth_headers(pwd_auth["access_token"])
        pending = expect(
            client.get("/api/pwd/my-issues?filter_type=pending", headers=pwd_headers),
            200,
            "PWD pending list",
        )
        assert [item["id"] for item in pending["items"]] == [issue_id]
        assert len(pending["items"][0]["photos"]) == 1
        started = expect(
            client.post(
                f"/api/pwd/issues/{issue_id}/start-work?notes=E2E%20repair%20started",
                headers=pwd_headers,
            ),
            200,
            "PWD start work",
        )
        assert started["status"] == "pwd_working"
        expect(
            client.post(f"/api/pwd/issues/{issue_id}/start-work", headers=pwd_headers),
            400,
            "duplicate PWD start",
        )

        with PHOTO.open("rb") as photo:
            completed = expect(
                client.post(
                    f"/api/pwd/issues/{issue_id}/complete-work",
                    headers=pwd_headers,
                    data={"description": "Replaced the leaking pipe and tested the repair"},
                    files={"photo": ("completed.png", photo, "image/png")},
                ),
                200,
                "PWD completion",
            )
        assert completed["status"] == "pwd_completed"
        assert completed["completion_photo_url"].startswith("http")
        assert completed["completed_by_name"] == "E2E PWD Worker"

        pending_review = expect(
            client.get(
                "/api/parshad/issues/pending-review",
                headers=representative_headers,
            ),
            200,
            "representative pending review",
        )
        assert [item["id"] for item in pending_review["items"]] == [issue_id]
        reviewed = expect(
            client.post(
                f"/api/parshad/issues/{issue_id}/review?notes=E2E%20repair%20verified",
                headers=representative_headers,
            ),
            200,
            "representative review",
        )
        assert reviewed["status"] == "representative_reviewed"

        reports = expect(
            client.get("/api/reports", headers=citizen_headers),
            200,
            "citizen report list",
        )
        assert reports["total"] == 1
        assert reports["items"][0]["status"] == "representative_reviewed"
        assert reports["items"][0]["completion_description"]
        print(f"Full API flow passed for issue {issue_id}.")


if __name__ == "__main__":
    run()
