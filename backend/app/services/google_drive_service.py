import os
import logging
import tempfile

logger = logging.getLogger(__name__)


def _get_drive_service():
    try:
        from googleapiclient.discovery import build
        from google.oauth2 import service_account
    except ImportError:
        raise RuntimeError("google-api-python-client not installed")

    sa_file = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE")
    if not sa_file or not os.path.exists(sa_file):
        raise RuntimeError("GOOGLE_SERVICE_ACCOUNT_FILE not found")

    SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
    creds = service_account.Credentials.from_service_account_file(sa_file, scopes=SCOPES)
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def download_from_drive(file_id: str, dest_filename: str) -> str:
    from googleapiclient.http import MediaIoBaseDownload
    import io

    service = _get_drive_service()
    request = service.files().get_media(fileId=file_id)
    dest_path = os.path.join(tempfile.gettempdir(), dest_filename)
    with open(dest_path, "wb") as f:
        downloader = MediaIoBaseDownload(f, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()
    return dest_path