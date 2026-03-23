from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from app.s3 import upload_file, list_files, delete_file, get_download_url
import tempfile
import os
import threading
from app.watcher import start_watcher

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    thread = threading.Thread(target=start_watcher, daemon=True)
    thread.start()

@app.get("/")
def root():
    return {"message": "Homelab Backup API is running"}

@app.get("/files")
def get_files():
    return list_files()

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    result = upload_file(tmp_path, s3_key=file.filename)
    os.unlink(tmp_path)
    return result

@app.delete("/files/{s3_key}")
def delete(s3_key: str):
    return delete_file(s3_key)

@app.get("/download/{s3_key}")
def download(s3_key: str):
    return get_download_url(s3_key)
