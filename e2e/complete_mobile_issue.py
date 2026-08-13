#!/usr/bin/env python3
"""Complete the issue created by the simulator when camera hardware is unavailable."""

from __future__ import annotations

import os
from pathlib import Path

import httpx


ROOT = Path(__file__).resolve().parents[1]
PHOTO = ROOT / "jansarthi-app" / "assets" / "images" / "icon.png"
BASE_URL = os.getenv("E2E_API_URL", "http://127.0.0.1:8002")


def checked(response: httpx.Response, context: str) -> dict:
    if not response.is_success:
        raise RuntimeError(f"{context}: HTTP {response.status_code}: {response.text}")
    return response.json()


def main() -> None:
    with httpx.Client(base_url=BASE_URL, timeout=20) as client:
        checked(
            client.post("/api/auth/login", json={"mobile_number": "+919000000003"}),
            "PWD login",
        )
        auth = checked(
            client.post(
                "/api/auth/verify-otp",
                json={"mobile_number": "+919000000003", "otp_code": "999999"},
            ),
            "PWD OTP",
        )
        headers = {"Authorization": f"Bearer {auth['access_token']}"}
        issues = checked(
            client.get("/api/pwd/my-issues?filter_type=in_progress", headers=headers),
            "PWD in-progress list",
        )
        matches = [
            issue for issue in issues["items"]
            if issue["description"] == "E2E mobile water leak near the public road"
        ]
        if len(matches) != 1:
            raise RuntimeError(f"Expected one mobile E2E issue, found {len(matches)}")

        issue_id = matches[0]["id"]
        with PHOTO.open("rb") as photo:
            completed = checked(
                client.post(
                    f"/api/pwd/issues/{issue_id}/complete-work",
                    headers=headers,
                    data={"description": "Replaced the leaking pipe and verified water pressure"},
                    files={"photo": ("completion.png", photo, "image/png")},
                ),
                "PWD completion fallback",
            )
        if completed["status"] != "pwd_completed":
            raise RuntimeError(f"Unexpected completion status: {completed['status']}")
        print(f"Completed mobile E2E issue {issue_id} through the camera fallback.")


if __name__ == "__main__":
    main()
