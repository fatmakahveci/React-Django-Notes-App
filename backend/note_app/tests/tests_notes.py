from django.test import TestCase
from django.contrib.auth.models import User
import json

test_user = {"username": "user", "password": "password"}

class NotesTest(TestCase):

    def setUp(self):
        new_user = User.objects.create(username=test_user["username"])
        new_user.set_password(test_user["password"])
        new_user.save()

    def get_token(self):
        res = self.client.post('/token/',
                data=json.dumps({
                    'username': test_user["username"],
                    'password': test_user["password"],
                }),
                content_type='application/json',
            )
        result = json.loads(res.content)
        self.assertTrue("access" in result)
        return result["access"]

    def test_add_notes_forbidden(self): # unauthorized users will not be allowed to POST new data
        res = self.client.post(f'/note/new/',
                data=json.dumps({
                    'user': 1,
                    'body': "body",
                    'updated': "2023-01-01",
                    'created': "2023-01-01",
                }),
                content_type='application/json',
            )
        self.assertEquals(res.status_code, 401)

        res = self.client.post('/note/new/',
                data = json.dumps({
                    'user': 1,
                    'body': "body",
                    'updated': "2023-01-01",
                    'created': "2023-01-01",
                }),
                content_type='application/json',
                HTTP_AUTHORIZATION=f'Bearer WRONG TOKEN'
            )
        self.assertEquals(res.status_code, 401)

    def test_add_notes_ok(self): # authorized users will be allowed to POST new data
        token = self.get_token()
        res = self.client.post('/note/new/',
                data = json.dumps({
                    'user': 1,
                    'body': "body",
                    'updated': "2023-01-01",
                    'created': "2023-01-01",
                }),
                content_type='application/json',
                HTTP_AUTHORIZATION=f'Bearer {token}'
            )
        self.assertEquals(res.status_code, 201)
        result = json.loads(res.content)
