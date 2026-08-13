#!/usr/bin/env python3
"""Idempotently create the first production locality and staff accounts."""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlmodel import Session, select

from app.database import engine
from app.models.issue import Locality, LocalityType, User, UserRole
from app.services.twilio import normalize_phone_number
from app.settings.config import get_settings


CONFIRMATION = "jansarthi-production"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--confirm", required=True)
    parser.add_argument("--locality-name", required=True)
    parser.add_argument(
        "--locality-type", required=True, choices=[item.value for item in LocalityType]
    )
    parser.add_argument("--admin-name", required=True)
    parser.add_argument("--admin-mobile", required=True)
    parser.add_argument("--representative-name", required=True)
    parser.add_argument("--representative-mobile", required=True)
    parser.add_argument("--pwd-name", required=True)
    parser.add_argument("--pwd-mobile", required=True)
    return parser.parse_args()


def upsert_user(
    session: Session,
    *,
    name: str,
    mobile: str,
    role: UserRole,
    locality_id: int | None,
) -> User:
    normalized_mobile = normalize_phone_number(mobile)
    user = session.exec(
        select(User).where(User.mobile_number == normalized_mobile)
    ).first()
    if user is None:
        user = User(name=name, mobile_number=normalized_mobile)

    user.name = name
    user.role = role
    user.locality_id = locality_id
    user.is_active = True
    user.is_verified = True
    session.add(user)
    return user


def main() -> None:
    args = parse_args()
    settings = get_settings()
    if settings.environment != "production" or args.confirm != CONFIRMATION:
        raise SystemExit("Refusing to bootstrap without production confirmation")

    locality_type = LocalityType(args.locality_type)
    with Session(engine) as session:
        locality = session.exec(
            select(Locality).where(
                Locality.name == args.locality_name,
                Locality.type == locality_type,
            )
        ).first()
        if locality is None:
            locality = Locality(name=args.locality_name, type=locality_type)
        locality.is_active = True
        session.add(locality)
        session.flush()
        if locality.id is None:
            raise RuntimeError("Database did not assign a locality ID")

        upsert_user(
            session,
            name=args.admin_name,
            mobile=args.admin_mobile,
            role=UserRole.ADMIN,
            locality_id=None,
        )
        upsert_user(
            session,
            name=args.representative_name,
            mobile=args.representative_mobile,
            role=UserRole.REPRESENTATIVE,
            locality_id=locality.id,
        )
        upsert_user(
            session,
            name=args.pwd_name,
            mobile=args.pwd_mobile,
            role=UserRole.PWD_WORKER,
            locality_id=None,
        )
        session.commit()

    print(f"Production bootstrap complete for {args.locality_name} ({locality_type.value}).")


if __name__ == "__main__":
    main()
