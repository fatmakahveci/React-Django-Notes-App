# Todo App

![header.png](header.png)

---

🎯 A project for learning purposes.

🦦 You can check my [Django](https://fatmakahveci.com/django-note/django/), [React](https://fatmakahveci.com/react-note/react/), [JavaScript](https://fatmakahveci.com/javascript-note/javascript/), and [python](https://fatmakahveci.com/python-note/) notes in my blog.

## 1. Installation

```bash
# Clone the repository
git clone https://github.com/fatmakahveci/React-Django-Notes-App.git
```

```bash
# Go to the directory
cd React-Django-Notes-App
```

```bash
# Create a virtual environment
python3.11 -m venv env
```

```bash
# activate the virtual env
source env/bin/activate
```

```bash
# install packages
pip install -r requirements.txt
```

## 2. Backend development workflow

```bash
cd backend
```

```bash
python manage.py migrate
```

```bash
python manage.py runserver
```

### 3. Tests

```bash
python manage.py test note_app.tests.tests_jwt
python manage.py test note_app.tests.tests_notes
```

## 4. Frontend development workflow

```bash
cd frontend
```

```bash
npm install
```

```bash
# You must be in the root folder where `package.json` is.
npm start
```

```bash
# For deployment
npm run build
```
