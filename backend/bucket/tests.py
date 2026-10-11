from unittest import mock

from django.test import SimpleTestCase, override_settings

from . import views


@override_settings(ASSET_S3_BUCKET='bucket', ASSET_PREFIX='shaneandzessa/')
class MediaRedirectTests(SimpleTestCase):
    def setUp(self):
        views._links.clear()
        client = mock.Mock()
        client.generate_presigned_url.side_effect = lambda op, Params, ExpiresIn: f"https://s3.test/{Params['Key']}?sig=1"
        patcher = mock.patch.object(views, '_client', return_value=client)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.client_mock = client

    def test_redirects_to_signed_link_under_prefix(self):
        response = self.client.get('/media/photos/picnic.jpg')
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response['Location'], 'https://s3.test/shaneandzessa/photos/picnic.jpg?sig=1')
        self.assertIn('max-age=3600', response['Cache-Control'])

    def test_reuses_signed_link(self):
        self.client.get('/media/audio/air-on-the-g-string.mp3')
        self.client.get('/media/audio/air-on-the-g-string.mp3')
        self.assertEqual(self.client_mock.generate_presigned_url.call_count, 1)

    def test_rejects_path_tricks(self):
        for path in ('/media/../secret', '/media/photos/../../backups/db', '/media/.env'):
            self.assertEqual(self.client.get(path).status_code, 404, path)

    def test_rejects_writes(self):
        self.assertEqual(self.client.post('/media/photos/picnic.jpg').status_code, 405)

    @override_settings(ASSET_S3_BUCKET='')
    def test_404_when_bucket_not_configured(self):
        self.assertEqual(self.client.get('/media/photos/picnic.jpg').status_code, 404)
