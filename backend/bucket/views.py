import re
import time
from functools import lru_cache

import boto3
from botocore.config import Config
from django.conf import settings
from django.http import Http404, HttpResponseRedirect
from django.views.decorators.http import require_safe

# Site images and music live in a private S3 bucket. /media/<key> redirects to a
# short-lived signed link for <ASSET_PREFIX><key>, so the keys never reach the browser.

LINK_SECONDS = 6 * 3600
# Reuse a signed link for most of its life so browsers keep hitting their cache.
REUSE_SECONDS = 5 * 3600
SAFE_KEY = re.compile(r'^[A-Za-z0-9][A-Za-z0-9._/-]*$')

_links = {}


@lru_cache(maxsize=1)
def _client():
    return boto3.client(
        's3',
        endpoint_url=settings.ASSET_S3_ENDPOINT_URL or None,
        region_name=settings.ASSET_S3_REGION_NAME or None,
        aws_access_key_id=settings.ASSET_S3_ACCESS_KEY_ID,
        aws_secret_access_key=settings.ASSET_S3_SECRET_ACCESS_KEY,
        config=Config(signature_version='s3v4', s3={'addressing_style': 'virtual'}),
    )


def _signed_link(key):
    now = time.time()
    cached = _links.get(key)
    if cached and cached[1] > now:
        return cached[0]
    url = _client().generate_presigned_url(
        'get_object',
        Params={'Bucket': settings.ASSET_S3_BUCKET, 'Key': settings.ASSET_PREFIX + key},
        ExpiresIn=LINK_SECONDS,
    )
    _links[key] = (url, now + REUSE_SECONDS)
    return url


@require_safe
def media(request, key):
    if not settings.ASSET_S3_BUCKET or not SAFE_KEY.match(key) or '..' in key:
        raise Http404
    response = HttpResponseRedirect(_signed_link(key))
    # Shorter than the link's remaining life, so a cached redirect never points at an expired link.
    response['Cache-Control'] = 'public, max-age=3600'
    return response
