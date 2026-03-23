import boto3
import os
from datetime import datetime

s3_client = boto3.client('s3')
BUCKET_NAME = os.environ.get('S3_BUCKET_NAME')

def upload_file(file_path, s3_key=None):
    if s3_key is None:
        s3_key = os.path.basename(file_path)
    try:
        s3_client.upload_file(file_path, BUCKET_NAME, s3_key)
        return {"success": True, "key": s3_key}
    except Exception as e:
        return {"success": False, "error": str(e)}

def list_files():
    try:
        response = s3_client.list_objects_v2(Bucket=BUCKET_NAME)
        files = []
        for obj in response.get('Contents', []):
            files.append({
                "key": obj['Key'],
                "size": obj['Size'],
                "last_modified": obj['LastModified'].isoformat()
            })
        return files
    except Exception as e:
        return []

def delete_file(s3_key):
    try:
        s3_client.delete_object(Bucket=BUCKET_NAME, Key=s3_key)
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_download_url(s3_key, expiry=3600):
    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': BUCKET_NAME, 'Key': s3_key},
            ExpiresIn=expiry
        )
        return {"success": True, "url": url}
    except Exception as e:
        return {"success": False, "error": str(e)}