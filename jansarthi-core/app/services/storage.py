import io
import uuid
from datetime import timedelta
from typing import BinaryIO
from urllib.parse import urlparse

from minio import Minio
from minio.error import S3Error

from app.settings.config import get_settings

settings = get_settings()


class StorageService:
    """Service for handling file uploads to MinIO/S3"""

    def __init__(self):
        endpoint = settings.s3_endpoint
        secure = settings.s3_secure
        if "://" in endpoint:
            parsed_endpoint = urlparse(endpoint)
            endpoint = parsed_endpoint.netloc
            secure = parsed_endpoint.scheme == "https"

        self.client = Minio(
            endpoint,
            access_key=settings.s3_access_key,
            secret_key=settings.s3_secret_key,
            secure=secure,
            region=settings.s3_region,
        )
        self.bucket_name = settings.s3_bucket
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """Ensure the bucket exists, create if it doesn't"""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                print(f"Created bucket: {self.bucket_name}")
        except S3Error as e:
            print(f"Error checking/creating bucket: {e}")
            raise

    def upload_file(
        self,
        file_data: bytes | BinaryIO,
        filename: str,
        content_type: str = "image/jpeg",
    ) -> str:
        """
        Upload a file to MinIO and return the URL

        Args:
            file_data: File content as bytes or file-like object
            filename: Original filename
            content_type: MIME type of the file

        Returns:
            str: The object name/path in MinIO
        """
        try:
            # Generate unique filename
            file_extension = filename.rsplit(".", 1)[-1] if "." in filename else "jpg"
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            object_name = f"issues/{unique_filename}"

            # Convert bytes to file-like object if needed
            if isinstance(file_data, bytes):
                file_data = io.BytesIO(file_data)
                file_size = len(file_data.getvalue())
            else:
                # Get file size
                file_data.seek(0, 2)  # Seek to end
                file_size = file_data.tell()
                file_data.seek(0)  # Reset to beginning

            # Upload to MinIO
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                data=file_data,
                length=file_size,
                content_type=content_type,
            )

            return object_name

        except S3Error as e:
            print(f"Error uploading file to MinIO: {e}")
            raise
        except Exception as e:
            print(f"Unexpected error during file upload: {e}")
            raise

    def get_file_url(
        self, object_name: str, expires: timedelta | None = None
    ) -> str:
        """
        Get a presigned URL for accessing a file

        Args:
            object_name: The object name/path in MinIO
            expires: How long the URL should be valid

        Returns:
            str: Presigned URL
        """
        try:
            if expires is None:
                expires = timedelta(seconds=settings.presigned_url_expiry_seconds)
            url = self.client.presigned_get_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                expires=expires,
            )
            return url
        except S3Error as e:
            print(f"Error generating presigned URL: {e}")
            raise

    def check_connection(self) -> None:
        """Raise when the configured bucket cannot be reached."""
        if not self.client.bucket_exists(self.bucket_name):
            raise RuntimeError(f"Storage bucket {self.bucket_name!r} does not exist")

    def delete_file(self, object_name: str) -> bool:
        """
        Delete a file from MinIO

        Args:
            object_name: The object name/path in MinIO

        Returns:
            bool: True if successful
        """
        try:
            self.client.remove_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
            )
            return True
        except S3Error as e:
            print(f"Error deleting file from MinIO: {e}")
            return False

    def get_public_url(self, object_name: str) -> str:
        """
        Get the public URL for a file (if bucket is public)

        Args:
            object_name: The object name/path in MinIO

        Returns:
            str: Public URL
        """
        endpoint = settings.s3_endpoint
        if "://" in endpoint:
            return f"{endpoint.rstrip('/')}/{self.bucket_name}/{object_name}"
        protocol = "https" if settings.s3_secure else "http"
        return f"{protocol}://{endpoint}/{self.bucket_name}/{object_name}"


# Singleton instance
_storage_service: StorageService | None = None


def get_storage_service() -> StorageService:
    """Get or create the storage service instance"""
    global _storage_service
    if _storage_service is None:
        _storage_service = StorageService()
    return _storage_service
