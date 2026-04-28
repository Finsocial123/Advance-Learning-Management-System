# Advanced Learning Management System

A full-stack Learning Management System for students, teachers, and admins.

The platform helps students learn online, teachers manage courses and assignments, and admins control users, roles, and platform data.

## Features

### Student

- Register and login
- Browse available courses
- Enroll in courses
- Watch video lessons
- View PDF lessons
- Submit assignments
- Track learning progress

### Teacher

- Create, edit, and delete courses
- Add lessons with videos, PDFs, or links
- Create assignments
- View student submissions
- Give grades and feedback
- Track student progress

### Admin

- View all users
- Manage user roles
- Activate or deactivate users
- Delete users
- View dashboard statistics

### Authentication

- Email and password login
- OTP-based signup and login
- Google login
- JWT authentication
- Role-based access control

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Zustand
- Axios

### Backend

- FastAPI
- PostgreSQL
- SQLAlchemy ORM
- JWT Authentication
- Cloudinary
- SMTP Email OTP
- Google Auth

## Project Structure

```txt
Advance-Learning-Management-System/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── store/
│   ├── types/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   └── utils/
│   └── requirements.txt
│
├── .gitignore
└── README.md
```

## Setup Instructions

## 1. Clone the Repository

```bash
git clone https://github.com/Finsocial123/Advance-Learning-Management-System.git
cd Advance-Learning-Management-System
```

## 2. Backend Setup

Go to the backend folder:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate the virtual environment:

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` folder:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GOOGLE_CLIENT_ID=your_google_client_id

OTP_EXPIRE_MINUTES=10
OTP_MAX_ATTEMPTS=5
EMAIL_OTP_DEBUG=false

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=your_email@gmail.com
SMTP_FROM_NAME=LMS
SMTP_USE_TLS=true
```

Run the backend server:

```bash
uvicorn app.main:app --reload
```

Backend will run on:

```txt
http://localhost:8000
```

API docs:

```txt
http://localhost:8000/docs
```

## 3. Frontend Setup

Open a new terminal and go to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file inside the `frontend` folder:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

Run the frontend server:

```bash
npm run dev
```

Frontend will run on:

```txt
http://localhost:3000
```

## Useful Commands

### Backend

```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm run dev
```

### Git

```bash
git status
git add .
git commit -m "Add LMS project"
git push origin main
```

## API Modules

The backend includes APIs for:

- Authentication
- Users
- Admin
- Courses
- Lessons
- Assignments
- Enrollments
- Progress tracking
- Dashboard

## Database Tables

Main tables include:

- Users
- OTPs
- Courses
- Lessons
- Assignments
- Submissions
- Enrollments
- Lesson Progress

## File Uploads

Cloudinary is used for uploading:

- Course thumbnails
- Lesson videos
- PDFs
- Profile images
- Assignment files

## Security

- Passwords are hashed
- JWT tokens are used for protected routes
- OTPs are stored safely
- Role-based access is used for student, teacher, and admin
- Secret keys and passwords must stay inside `.env` files

## Important Notes

Do not push these files or folders to GitHub:

```txt
.env
.env.local
node_modules/
.venv/
venv/
.next/
__pycache__/
```

Use `.env.example` files when sharing environment variable names with the team.

## Future Improvements

- Payment gateway
- Live classes
- Quiz and test system
- Certificate generation
- Notifications
- Teacher-student chat
- Course reviews and ratings
- Mobile app
- Advanced analytics
- CI/CD deployment

## Project Status

The project has a working LMS base with authentication, course management, lesson management, assignments, grading, progress tracking, and admin controls.
