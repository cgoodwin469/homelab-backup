import time
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from app.s3 import upload_file

WATCH_FOLDER = os.environ.get('WATCH_FOLDER', '/home/chaz/backups')

class BackupHandler(FileSystemEventHandler):
    def on_created(self, event):
        if not event.is_directory:
            print(f"New file detected: {event.src_path}")
            result = upload_file(event.src_path)
            if result['success']:
                print(f"Uploaded: {result['key']}")
            else:
                print(f"Upload failed: {result['error']}")

    def on_modified(self, event):
        if not event.is_directory:
            print(f"File modified: {event.src_path}")
            result = upload_file(event.src_path)
            if result['success']:
                print(f"Re-uploaded: {result['key']}")
            else:
                print(f"Upload failed: {result['error']}")

def start_watcher():
    os.makedirs(WATCH_FOLDER, exist_ok=True)
    event_handler = BackupHandler()
    observer = Observer()
    observer.schedule(event_handler, WATCH_FOLDER, recursive=True)
    observer.start()
    print(f"Watching folder: {WATCH_FOLDER}")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()