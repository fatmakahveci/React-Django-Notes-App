# React + Django Notes App

A full-stack notes application built with **Django REST Framework** and **React** featuring authentication, autosaving notes, and JWT authorization.

Users can register, sign in securely, and create notes that automatically save while typing — similar to modern note apps (Notion/Keep style).

---

## ✨ Features

- JWT auth (access + refresh)
- Register / login / logout
- Protected routes
- Notes CRUD
- Autosave while typing
- Search notes
- Responsive UI

---

## 🧱 Tech Stack

**Backend:** Django, DRF, SimpleJWT  
**Frontend:** React 18, React Router v6, Axios  
**Dev DB:** SQLite (prod-ready for Postgres)

---

## 📁 Project Structure

```
React-Django-Notes-App
│
├── backend/
│   ├── accounts/
│   ├── notes/
│   ├── config/
│   └── manage.py
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── App.js
│   └── package.json
│
└── README.md
```

---

# 🚀 Local Development Setup

## 1. Clone

```
git clone https://github.com/YOUR_USERNAME/React-Django-Notes-App.git
cd React-Django-Notes-App
```

---

## 2. Backend Setup (Django)

```
cd backend
python -m venv .venv
source .venv/bin/activate   # Mac/Linux
# .venv\Scripts\activate    # Windows
pip install -r requirements.txt
python manage.py migrate
```

Create superuser (optional):

```
python manage.py createsuperuser
```

Start server:

```
python manage.py runserver
```

Backend runs at:

```
http://127.0.0.1:8000
```

---

## 3. Frontend Setup (React)

Open new terminal:

```
cd frontend
npm install
npm start
```

Frontend runs at:

```
http://localhost:3000
```

---

# 🔐 Authentication Flow

The app uses **JWT tokens**.

1. User logs in
2. Backend returns:
    - access token (short lived)
    - refresh token (long lived)

3. React automatically refreshes tokens
4. User stays logged in

No cookies are used — only Authorization headers.

---

# 📡 API Endpoints

## Auth

| Method | Endpoint                       | Description          |
| ------ | ------------------------------ | -------------------- |
| POST   | `/api/accounts/register/`      | Create user          |
| POST   | `/api/accounts/token/`         | Login                |
| POST   | `/api/accounts/token/refresh/` | Refresh access token |

---

## Notes

| Method | Endpoint           | Description |
| ------ | ------------------ | ----------- |
| GET    | `/api/notes/`      | List notes  |
| POST   | `/api/notes/`      | Create note |
| GET    | `/api/notes/<id>/` | Get note    |
| POST   | `/api/notes/<id>/` | Update note |
| DELETE | `/api/notes/<id>/` | Delete note |

All note endpoints require:

```
Authorization: Bearer <access_token>
```

---

# ⚙️ Environment Variables

Create:

```
backend/.env
```

Example:

```
SECRET_KEY=django-secret
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
```

---

# 🧠 Autosave Logic

The editor works like this:

- Typing triggers a delayed save (700ms)
- First save creates the note
- Future saves update the same note
- No page reload
- Enter/new lines preserved

---

# 🧪 Running Tests

Backend:

```
cd backend
python manage.py test
```

Frontend:

```
cd frontend
npm test
```

---

# 🏗 Deployment (Production Idea)

Recommended:

- Backend → Render / Railway / Fly.io
- Frontend → Vercel / Netlify
- Database → PostgreSQL

Remember to change:

```
DEBUG=False
ALLOWED_HOSTS=<domain>
```

---

# 📄 License

MIT License

---

# 👤 Author

Fatma Kahveci
