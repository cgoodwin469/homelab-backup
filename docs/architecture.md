# Architecture Overview

## System Design

Homelab Backup is an automated file backup system built on a self-hosted Ubuntu server. It monitors a local folder for changes and automatically syncs files to AWS S3, with a React dashboard for managing backed up files.

---

## Network Topology
```
M4 MacBook Air (Dev Machine)
        |
        | Git push
        v
    GitHub (Source of Truth)
        |
        | Git pull
        v
2011 MacBook Pro (midnight-coast-media)
Ubuntu Server
        |
        |── watchdog monitors ~/backups
        |── FastAPI serves REST API on port 8003
        |── boto3 syncs files to AWS S3
        |
        | Tailscale VPN
        v
  React Dashboard (Vercel)
        |
        | boto3 presigned URLs
        v
    AWS S3 Bucket (us-east-1)
```

---

## Component Breakdown

### watcher.py
Uses Python `watchdog` to monitor a local folder for new or modified files. On detection, calls the S3 upload function automatically. Runs as a background thread inside the FastAPI app.

### s3.py
Handles all AWS S3 operations via `boto3`:
- Upload files
- List objects
- Delete objects
- Generate pre-signed download URLs

### main.py
FastAPI application that:
- Starts the file watcher on startup
- Exposes REST endpoints for the dashboard
- Handles manual file uploads via multipart form data

---

## IAM Security Model

A dedicated IAM user `homelab-backup-user` was created with:
- `AmazonS3FullAccess` policy scoped to the backup bucket
- Programmatic access only (no console login)
- Access keys stored in `.env` file, never committed to GitHub

This follows the **principle of least privilege** — the user can only interact with S3 and nothing else in the AWS account.

---

## Systemd Service

The FastAPI app (including the watcher thread) runs as a systemd service:
```ini
[Unit]
Description=Homelab Backup API
After=network.target

[Service]
User=chaz
WorkingDirectory=/home/chaz/homelab-backup/backend
Environment="PATH=/home/chaz/homelab-backup/venv/bin"
EnvironmentFile=/home/chaz/homelab-backup/backend/.env
ExecStart=/home/chaz/homelab-backup/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8003
Restart=always
RestartSec=3
```

This ensures the backup service survives reboots and crashes automatically.

---

## Data Flow

1. File lands in `~/backups` on the Ubuntu server
2. `watchdog` detects the change within 1 second
3. `boto3` uploads the file to S3 with the filename as the key
4. Dashboard polls `/files` every 10 seconds and updates the UI
5. User can download via pre-signed URL (expires in 1 hour)
6. User can delete directly from the dashboard

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `S3_BUCKET_NAME` | Name of the S3 bucket |
| `WATCH_FOLDER` | Local folder path to monitor |

AWS credentials (`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`) are configured via `aws configure` and stored in `~/.aws/credentials` on the server.