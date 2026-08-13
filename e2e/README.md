# Jansarthi end-to-end tests

The scripts require local PostgreSQL on port `5432` and MinIO on port `9000`,
using the credentials from `jansarthi-core/.env`. They only reset the database
`jansarthi_e2e` and bucket `jansarthi-e2e`; the preparation script refuses any
other names.

Run the complete backend contract flow:

```bash
./e2e/run_backend_e2e.sh
```

Run the iOS simulator flow with the Jansarthi development client installed and
an iOS simulator booted:

```bash
./e2e/run_mobile_e2e.sh
```

The mobile suite covers citizen signup/reporting, representative acknowledgement,
PWD start and validation, representative review, logout/login between roles, and
final citizen verification. Because iOS Simulator has no camera hardware, the
suite verifies the camera UI and required-photo validation in the app, then uses
`complete_mobile_issue.py` for the real multipart completion upload.
