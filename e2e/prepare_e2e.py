#!/usr/bin/env python3
"""Recreate and seed the isolated Jansarthi E2E database and object bucket."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import psycopg2
from minio import Minio
from psycopg2 import sql


ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / "jansarthi-core"
DATABASE = os.getenv("POSTGRES_DATABASE", "jansarthi_e2e")

if DATABASE != "jansarthi_e2e":
    raise SystemExit(
        f"Refusing to reset database {DATABASE!r}; POSTGRES_DATABASE must be 'jansarthi_e2e'."
    )


def connection(database: str):
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", "mysecretpassword"),
        dbname=database,
    )


def reset_database() -> None:
    maintenance = connection("postgres")
    try:
        maintenance.autocommit = True
        with maintenance.cursor() as cursor:
            cursor.execute(
                "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                "WHERE datname = %s AND pid <> pg_backend_pid()",
                (DATABASE,),
            )
            cursor.execute(sql.SQL("DROP DATABASE IF EXISTS {}").format(sql.Identifier(DATABASE)))
            cursor.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(DATABASE)))
    finally:
        maintenance.close()

    env = os.environ.copy()
    env["POSTGRES_DATABASE"] = DATABASE
    subprocess.run(
        [str(CORE / ".venv" / "bin" / "alembic"), "upgrade", "head"],
        cwd=CORE,
        env=env,
        check=True,
    )


def seed_database() -> None:
    with connection(DATABASE) as database:
        with database.cursor() as cursor:
            cursor.execute(
                "INSERT INTO localities (name, type, is_active) "
                "VALUES (%s, 'ward', true) RETURNING id",
                ("E2E Ward",),
            )
            primary_locality_id = cursor.fetchone()[0]
            cursor.execute(
                "INSERT INTO localities (name, type, is_active) "
                "VALUES (%s, 'ward', true) RETURNING id",
                ("Other E2E Ward",),
            )
            other_locality_id = cursor.fetchone()[0]

            users = (
                ("E2E Representative", "+919000000002", "representative", primary_locality_id),
                ("Other Representative", "+919000000004", "representative", other_locality_id),
                ("E2E PWD Worker", "+919000000003", "pwd_worker", None),
            )
            cursor.executemany(
                "INSERT INTO users "
                "(name, mobile_number, role, is_active, is_verified, locality_id) "
                "VALUES (%s, %s, %s, true, true, %s)",
                users,
            )


def reset_bucket() -> None:
    bucket = os.getenv("MINIO_BUCKET", "jansarthi-e2e")
    if bucket != "jansarthi-e2e":
        raise SystemExit(
            f"Refusing to clear bucket {bucket!r}; MINIO_BUCKET must be 'jansarthi-e2e'."
        )

    client = Minio(
        os.getenv("MINIO_ENDPOINT", "localhost:9000"),
        access_key=os.getenv("MINIO_USER", "admin"),
        secret_key=os.getenv("MINIO_PASSWORD", "YourPassword123"),
        secure=os.getenv("MINIO_SECURE", "false").lower() == "true",
    )
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)
        return

    for item in client.list_objects(bucket, recursive=True):
        client.remove_object(bucket, item.object_name)


def main() -> None:
    reset_database()
    seed_database()
    reset_bucket()
    print("Prepared jansarthi_e2e with deterministic users and localities.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"E2E preparation failed: {exc}", file=sys.stderr)
        raise
