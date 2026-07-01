import base64
import json
import os
import uuid
import boto3

def handler(event: dict, context) -> dict:
    """Загружает фото (base64) в S3 и возвращает публичную CDN-ссылку."""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    data_url = body.get('photo', '')

    if not data_url:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'no photo'})}

    # Разбираем data URL: data:image/jpeg;base64,....
    if ',' in data_url:
        header, b64 = data_url.split(',', 1)
        ext = 'jpg'
        if 'png' in header:
            ext = 'png'
        elif 'webp' in header:
            ext = 'webp'
    else:
        b64 = data_url
        ext = 'jpg'

    image_data = base64.b64decode(b64)
    key = f'checklist-photos/{uuid.uuid4()}.{ext}'

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    s3.put_object(
        Bucket='files',
        Key=key,
        Body=image_data,
        ContentType=f'image/{ext}',
        ACL='public-read',
    )

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'url': cdn_url})}
