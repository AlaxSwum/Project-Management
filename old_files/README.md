# Project Management Web App

A full-stack project management application built with modern technologies for seamless collaboration and project organization.

## 🚀 Tech Stack

### Backend
- **Django 5.2.3** - Python web framework
- **Django Rest Framework (DRF)** - API development
- **PostgreSQL** - Database (Supabase)
- **JWT Authentication** - Secure token-based auth
- **django-cors-headers** - Cross-origin resource sharing

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls
- **Heroicons** - Beautiful SVG icons

### Database & Storage
- **Supabase PostgreSQL** - Hosted PostgreSQL database
- **Google Drive Integration** - File storage (links stored in DB)

## 📁 Project Structure

```
project_management/
├── backend/                    # Django backend
│   ├── project_management/     # Main Django project
│   ├── authentication/         # User authentication app
│   ├── projects/              # Projects management app
│   ├── venv/                  # Python virtual environment
│   ├── requirements.txt       # Python dependencies
│   └── config.py             # Environment variables example
├── frontend/                  # Next.js frontend
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── contexts/         # React contexts
│   │   └── lib/              # Utility functions
│   ├── env.example           # Environment variables example
│   └── package.json          # Node.js dependencies
├── start-backend.sh          # Backend startup script
├── start-frontend.sh         # Frontend startup script
└── README.md                 # This file
```

## 🛠️ Setup Instructions

### Prerequisites
- **Python 3.8+**
- **Node.js 18+**
- **npm or yarn**
- **Supabase account** (for PostgreSQL database)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd project_management
```

### 2. Backend Setup

#### Step 1: Create Virtual Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

#### Step 3: Environment Configuration
Create a `.env` file in the `backend/` directory based on `config.py`:

```env
# Database Configuration (Replace with your Supabase credentials)
DB_NAME=your_supabase_db_name
DB_USER=your_supabase_username
DB_PASSWORD=your_supabase_password
DB_HOST=your_supabase_host
DB_PORT=5432

# Django Secret Key
SECRET_KEY=your-super-secret-key-here-change-this-in-production

# Debug Mode
DEBUG=True

# CORS Origins
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-change-this
```

#### Step 4: Database Setup
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser  # Optional: create admin user
```

#### Step 5: Start Backend Server
```bash
python manage.py runserver
```
Backend will be available at `http://localhost:8000`

### 3. Frontend Setup

#### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

#### Step 2: Environment Configuration
Create a `.env.local` file in the `frontend/` directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_AUTH_URL=http://localhost:8000/api/auth

# Google Drive API (for future file uploads)
NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY=your_google_drive_api_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

#### Step 3: Start Frontend Server
```bash
npm run dev
```
Frontend will be available at `http://localhost:3000`

## 🚦 Quick Start with Scripts

Use the provided startup scripts for easier development:

### Start Backend
```bash
./start-backend.sh
```

### Start Frontend
```bash
./start-frontend.sh
```

## 📊 Database Schema

### User Model (Django Built-in)
- `id` - Primary key
- `username` - Unique username
- `email` - Email address
- `first_name` - First name
- `last_name` - Last name
- `password` - Hashed password

### Project Model
- `id` - Primary key
- `name` - Project name (max 200 chars)
- `description` - Project description (optional)
- `members` - Many-to-many relationship with Users
- `created_by` - Foreign key to User (project creator)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## 🔌 API Endpoints

### Authentication Endpoints
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `GET /api/auth/profile/` - Get user profile
- `PUT /api/auth/profile/update/` - Update user profile
- `POST /api/auth/token/refresh/` - Refresh JWT token

### Project Endpoints
- `GET /api/projects/` - List user's projects
- `POST /api/projects/` - Create new project
- `GET /api/projects/{id}/` - Get project details
- `PUT /api/projects/{id}/` - Update project
- `DELETE /api/projects/{id}/` - Delete project
- `GET /api/users/` - List all users (for adding members)
- `GET /api/my-projects/` - Get current user's projects

## 🎨 Frontend Pages

- `/` - Landing page with feature overview
- `/login` - User login page
- `/register` - User registration page
- `/dashboard` - Main dashboard with projects overview

## 🔐 Authentication Flow

1. **Registration/Login**: User provides credentials
2. **JWT Tokens**: Server returns access and refresh tokens
3. **Token Storage**: Tokens stored in localStorage
4. **API Requests**: Access token sent in Authorization header
5. **Token Refresh**: Automatic refresh when access token expires
6. **Logout**: Tokens removed from localStorage

## 🌟 Features

### Current Features
- ✅ User registration and authentication
- ✅ JWT-based secure authentication
- ✅ Project creation and management
- ✅ Project member management
- ✅ Responsive design with Tailwind CSS
- ✅ Modern React with TypeScript
- ✅ RESTful API with Django REST Framework

### Planned Features
- 🔄 Google Drive file integration
- 🔄 Real-time updates with WebSockets
- 🔄 Task management within projects
- 🔄 Project templates
- 🔄 Advanced user permissions
- 🔄 Project analytics and reporting

## 🔧 Development

### Backend Development
```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Database Migrations
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### Add New Dependencies

#### Backend
```bash
cd backend
source venv/bin/activate
pip install package_name
pip freeze > requirements.txt
```

#### Frontend
```bash
cd frontend
npm install package_name
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 📱 Production Deployment

### Environment Variables for Production
Ensure all environment variables are properly set:
- Set `DEBUG=False` in backend
- Use secure secret keys
- Configure proper CORS origins
- Set up proper database credentials

### Backend Deployment
- Configure static files serving
- Set up proper database (PostgreSQL)
- Configure environment variables
- Use a production WSGI server (gunicorn)

### Frontend Deployment
- Run `npm run build`
- Deploy static files to CDN/hosting service
- Configure environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

#### Backend Issues
- **Database connection error**: Check Supabase credentials in `.env`
- **Import errors**: Ensure virtual environment is activated
- **CORS errors**: Verify CORS settings in Django settings

#### Frontend Issues
- **API connection error**: Check if backend is running on port 8000
- **Build errors**: Ensure all dependencies are installed
- **Auth issues**: Verify API endpoints are correct

### Getting Help
- Check the Django and Next.js documentation
- Review error logs in browser console and terminal
- Ensure all dependencies are properly installed

## 📞 Support

For support and questions, please open an issue in the repository or contact the development team.

---

**Happy coding! 🚀** 