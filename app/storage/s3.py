import boto3
import os

"""
S3 CLIENT for Stackhero / MinIO
IMPORTANT: Must be a CLIENT (not resource)
"""

s3 = boto3.client(
    "s3",
    endpoint_url=os.getenv("S3_ENDPOINT_URL"),
    aws_access_key_id=os.getenv("S3_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("S3_SECRET_ACCESS_KEY"),
    region_name="us-east-1",  # required by boto3
)
