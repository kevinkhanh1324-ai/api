# SafeNest API 🎯

FastAPI backend cho ứng dụng SafeNest - Hệ thống giám sát an toàn trẻ em với AI.

## 📋 Yêu Cầu

- Python 3.11+
- SQL Server (local hoặc Azure SQL)
- Git

## 🚀 Quick Start (Local Development)

### 1. Clone Repository
```bash
git clone https://github.com/your-username/safenest-api.git
cd safenest-api
```

### 2. Tạo Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Cấu Hình Database
Update connection string trong `apiSQL.py`:
```python
DB_SERVER = "localhost"      # hoặc your-server.database.windows.net
DB_USER = "sa"               # hoặc your-username
DB_PASSWORD = "your-password"
DB_NAME = "apidb"
```

### 5. Run API Server
```bash
python -m uvicorn apiSQL:app --reload
```

Server sẽ chạy tại: `http://localhost:8000`

### 6. Kiểm Tra API
- Health check: `http://localhost:8000/`
- API Docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 📚 Project Structure

```
api/
├── apiSQL.py                 # Entry point (main app)
├── models.py                 # Database models
├── api_admin.py              # Admin APIs
├── api_parent.py             # Parent APIs
├── api_school.py             # School/Teacher APIs
├── api_package.py            # Package management
├── api_package_service.py    # Package service
├── api_payment.py            # Payment APIs
├── api_payment_paypos.py     # PayPOS integration
├── paypos_client.py          # PayPOS client
├── paypos_config.py          # PayPOS config
├── requirements.txt          # Dependencies
├── .gitignore                # Git ignore rules
├── .env.example              # Environment template
└── README.md                 # This file
```

## 🔐 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Parent | parent@example.com | parent123 |
| School | school@example.com | school123 |
| Teacher | teacher@example.com | teacher123 |

**⚠️ Change these in production!**

## 🔧 Configuration

### Environment Variables (Optional)
Create `.env` file:
```env
SAFENEST_SECRET=your-secret-key-here
DB_SERVER=localhost
DB_USER=sa
DB_PASSWORD=password
DB_NAME=apidb
DB_TYPE=local
```

### Available APIs

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password` - Reset password

#### Admin Panel
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `GET /api/admin/user-packages` - List user packages

#### Parent APIs
- `GET /api/parent/dashboard` - Parent dashboard
- `GET /api/parent/children` - List children
- `GET /api/parent/alerts` - List alerts
- `GET /api/parent/profile` - Get profile

#### School/Teacher APIs
- `GET /api/school/dashboard` - School dashboard
- `GET /api/school/classes` - List classes
- `GET /api/school/children` - List students
- `GET /api/school/cameras` - List cameras

#### Packages & Payments
- `GET /api/package-service/` - List packages
- `POST /api/package-service/{id}/purchase` - Buy package
- `GET /api/payments/` - Payment history

## 📦 Database Schema

Main tables:
- `User` - Users (admin, parent, school)
- `Teacher` - Teachers
- `Child` - Students
- `ClassRoom` - Classes
- `Camera` - CCTV cameras
- `Alert` - Alerts & notifications
- `Package` - Subscription packages
- `Payment` - Payment transactions

See `models.py` for full schema.

## 🔄 WebSocket Endpoints

- `/api/streaming/alerts` - Alert streaming
- `/api/streaming/camera/{camera_id}` - Camera stream

## 🌐 Deployment

### Deploy to Render

See `DEPLOY_RENDER_EXPLAINED.md` for detailed instructions.

Quick steps:
1. Push code to GitHub
2. Create Web Service on Render.com
3. Set environment variables
4. Deploy

### Deploy to Other Platforms

- **Heroku**: Use `Procfile` (included)
- **AWS**: EC2 + RDS
- **Azure**: App Service + SQL Server
- **DigitalOcean**: App Platform

## 🐛 Troubleshooting

### Issue: `ModuleNotFoundError: No module named 'xxx'`
**Solution**: Install missing package
```bash
pip install <package-name>
pip freeze > requirements.txt
```

### Issue: `SQL Server connection failed`
**Solution**: 
- Check connection string format
- Verify SQL Server is running
- Check firewall rules
- Verify credentials

### Issue: `Port 8000 already in use`
**Solution**: Use different port
```bash
python -m uvicorn apiSQL:app --port 8001 --reload
```

## 📝 API Documentation

Auto-generated docs available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🔐 Security

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Role-based access control (RBAC)
- ✅ CORS middleware enabled
- ✅ SQL injection protection (SQLAlchemy ORM)

⚠️ **Important**: 
- Change `SECRET_KEY` in production
- Use HTTPS in production
- Implement rate limiting
- Keep dependencies updated

## 📞 Support

For issues:
1. Check Render logs: Dashboard → Logs
2. Check local logs: `python -m uvicorn apiSQL:app --log-level debug`
3. Review error traceback
4. Check database connection

## 📄 License

This project is part of SafeNest system.

---

**Last Updated**: 2025-11-14
**Version**: 1.0.0
