#!/usr/bin/env python3
"""Remove one explicitly marked deployment test issue and its stored photos."""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlmodel import Session

from app.database import engine
from app.models.issue import Issue
from app.services.storage import get_storage_service
from app.settings.config import get_settings


MARKER = "[DEPLOYMENT TEST]"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--issue-id", type=int, required=True)
    parser.add_argument("--confirm", required=True)
    args = parser.parse_args()

    settings = get_settings()
    if settings.environment != "production" or args.confirm != "delete-deployment-test":
        raise SystemExit("Refusing cleanup without production confirmation")

    storage = get_storage_service()
    with Session(engine) as session:
        issue = session.get(Issue, args.issue_id)
        if issue is None or not issue.description.startswith(MARKER):
            raise SystemExit("Refusing to delete an unmarked issue")

        object_names = [photo.photo_url for photo in issue.photos]
        if issue.completion_photo_url:
            object_names.append(issue.completion_photo_url)
        for object_name in object_names:
            if not storage.delete_file(object_name):
                raise RuntimeError(f"Failed to delete stored object {object_name}")

        session.delete(issue)
        session.commit()

    print(f"Deleted deployment test issue {args.issue_id} and {len(object_names)} objects.")


if __name__ == "__main__":
    main()
