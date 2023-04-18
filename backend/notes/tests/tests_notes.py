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

    # Test for POST, unauthorized users will not be allowed to POST new data
    def test_add_notes_forbidden(self):
        res = self.client.post(f'/notes/',
                               data=json.dumps({
                                   'user': 1,
                                   'body': 'body',
                                   'updated': '2023-01-01',
                                   'created': '2023-01-01',
                               }),
                               content_type='application/json',
                               )
        self.assertEquals(res.status_code, 401)

        res = self.client.post('/notes/',
                               data=json.dumps({
                                   'user': 1,
                                   'body': 'body',
                                   'updated': '2023-01-01',
                                   'created': '2023-01-01',
                               }),
                               content_type='application/json',
                               HTTP_AUTHORIZATION=f'Bearer WRONG TOKEN'
                               )
        self.assertEquals(res.status_code, 401)

    # Test for POST, authorized users will be allowed to post new data
    def test_add_notes_ok(self):
        token = self.get_token()
        res = self.client.post('/notes/',
                               data=json.dumps({
                                   'user': 1,
                                   'body': 'body',
                                   'updated': '2023-01-01',
                                   'created': '2023-01-01',
                               }),
                               content_type='application/json',
                               HTTP_AUTHORIZATION=f'Bearer {token}'
                               )
        self.assertEquals(res.status_code, 200)
        result = json.loads(res.content)

        self.assertEquals(result['user'], 1)
        self.assertEquals(result['body'], 'body')
        self.assertIn('updated', result)  # current time
        self.assertIn('created', result)  # current time

    def test_get_notes(self):  # Test for GET method
        token = self.get_token()

        res = self.client.post('/notes/',
                               data=json.dumps({
                                   'user': 1,
                                   'body': 'body1',
                                   'updated': '2023-01-01',
                                   'created': '2023-01-02',
                               }),
                               content_type='application/json',
                               HTTP_AUTHORIZATION=f'Bearer {token}'
                               )
        self.assertEquals(res.status_code, 200)
        user1 = json.loads(res.content)

        res = self.client.post('/notes/',
                               data=json.dumps({
                                   'user': 2,
                                   'body': "body2",
                                   'updated': "2023-01-03",
                                   'created': "2023-01-04",
                               }),
                               content_type='application/json',
                               HTTP_AUTHORIZATION=f'Bearer {token}'
                               )
        self.assertEquals(res.status_code, 200)
        user2 = json.loads(res.content)

        res = self.client.get('/notes/',
                              content_type='application/json',
                              HTTP_AUTHORIZATION=f'Bearer {token}'
                              )

        self.assertEquals(res.status_code, 200)
        result = json.loads(res.content)

        self.assertEquals(len(result), 2)  # 2 records
        self.assertTrue(result[0]["id"] == user1["id"]
                        or result[1]["id"] == user1["id"])
        self.assertTrue(result[0]["id"] == user2["id"]
                        or result[1]["id"] == user2["id"])

        res = self.client.get(f'/notes/1/',
                              content_type='application/json',
                              HTTP_AUTHORIZATION=f'Bearer {token}'
                              )
        self.assertEquals(res.status_code, 200)
        result = json.loads(res.content)
        self.assertEquals(result["id"], 1)
        self.assertEquals(result["body"], 'body1')
        self.assertIn('updated', result)  # current time
        self.assertIn('created', result)  # current time

    # def test_put_delete_records(self):
    #     token = self.get_token()
    #     res = self.client.post('/notes/',
    #             data = json.dumps({
    #                 'id': 1,
    #                 'body': 'body',
    #                 'updated': '2023-01-03',
    #                 'created': '2023-01-04',
    #             }),
    #             content_type='application/json',
    #             HTTP_AUTHORIZATION=f'Bearer {token}'
    #         )
    #     self.assertEquals(res.status_code, 200)
    #     user_id = json.loads(res.content)["id"]
    #     res = self.client.get(f'/notes/1/',
    #                         content_type='application/json',
    #                         HTTP_AUTHORIZATION=f'Bearer {token}'
    #                         )
    #     print(res)
    #     res = self.client.post(f'/notes/{user_id}',
    #             data = json.dumps({
    #                 'user': 1,
    #                 'body': 'updated body',
    #                 'updated': '2023-01-03',
    #                 'created': '2023-01-04',
    #             }),
    #             content_type='application/json',
    #             HTTP_AUTHORIZATION=f'Bearer {token}'
    #         )
        # self.assertEquals(res.status_code, 301)
        # result = json.loads(res.content)
        # print(result)
        # self.assertEquals(result["body"], "updated body")

        # res = self.client.get(f'/api/orders/{id}/',
        #                     content_type='application/json',
        #                     HTTP_AUTHORIZATION=f'Bearer {token}'
        #                     )
        # self.assertEquals(res.status_code, 200)
        # result = json.loads(res.content)["data"]
        # self.assertEquals(result["date"], '2020-02-02')
        # self.assertEquals(result["item"], 'Monitor')
        # self.assertEquals(result["price"], 50)
        # self.assertEquals(result["quantity"], 70)
        # self.assertEquals(result["amount"], 3500)

        # res = self.client.delete(f'/api/orders/{id}/',
        #                     content_type='application/json',
        #                     HTTP_AUTHORIZATION=f'Bearer {token}'
        #                     )
        # self.assertEquals(res.status_code, 410)  # Gone

        # res = self.client.get(f'/api/orders/{id}/',
        #                     content_type='application/json',
        #                     HTTP_AUTHORIZATION=f'Bearer {token}'
        #                     )
        # self.assertEquals(res.status_code, 404)  # Not found
