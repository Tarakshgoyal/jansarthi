
# Jansarthi Setup

## Docker Services Setup

### Postgres

```bash
docker run --name jansarthi-postgres -p 5432:5432 -e POSTGRES_PASSWORD=mysecretpassword -d postgres
```

### S3

```bash
docker run \
  -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=admin" \
  -e "MINIO_ROOT_PASSWORD=YourPassword123" \
  -v ./data:/data \
  --restart=always \
  quay.io/minio/minio server /data --console-address ":9001"
  ```

## Backend Setup

You will need to install https://docs.astral.sh/uv/getting-started/installation/

```bash
cd jansathi-core
```

```bash
uv sync
```

```bash
source .venv/bin/activate
```

```bash
alembic upgrade head
```

```bash
fastapi dev app/main.py
```

## App Setup

You will need bun https://bun.com/

```bash
cd jansarthi-app
```

```bash
bun install
```

```bash
bunx expo run
```

## Admin Portal Setup

```bash
cd jansarthi-admin-website
```

```bash
bun install
```

```bash
bun dev
```

----