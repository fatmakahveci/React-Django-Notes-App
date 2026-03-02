# 📝 React + Django Notes Application

A full-stack note management application consisting of a React frontend and a Django REST backend.

## Features

* User authentication
* Create, edit, and delete notes
* REST API integration
* Persistent storage

## Tech Stack

### Frontend

* React
* TypeScript
* Axios

### Backend

* Django
* Django REST Framework
* SQLite / PostgreSQL

## System Design

The frontend communicates with the backend via HTTP API requests.

React UI → Axios → Django REST API → Database

## Running the Project

### Backend

```
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```
cd frontend
npm install
npm start
```

Frontend:

```
http://localhost:3000
```

Backend:

```
http://localhost:8000
```

## What I Learned

* API integration
* Authentication handling
* Managing frontend and backend together
* Structuring a full-stack project
