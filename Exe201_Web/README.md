# Smart Child Monitoring System

A comprehensive web application for monitoring child safety in educational environments with AI-powered behavior detection and real-time alerts.

## Features

### 🔐 Authentication System

- Role-based login (Parent/School Administrator)
- Secure authentication with password recovery
- Role-specific dashboard access

### 👨‍👩‍👧‍👦 Parent Portal

1. **Dashboard Overview**

   - Real-time child status and location
   - Latest safety alerts and notifications
   - Camera and AI system status monitoring

2. **Live View**

   - Real-time classroom monitoring
   - Single child or full-class view options
   - AI overlay with danger zone highlights

3. **Alerts Center**

   - Comprehensive alert management
   - Alert confirmation and note-taking
   - Advanced filtering by type, date, and severity

4. **Behavior Reports**

   - Detailed activity charts (daily, weekly, monthly)
   - Behavior pattern analysis
   - Risk trend visualization

5. **Danger Zone Map**

   - Interactive classroom layout
   - AI-identified danger zones
   - Auto-updating safety areas

6. **Child Profile & Facial Recognition**

   - Complete child information management
   - Alert history and behavior summary
   - Facial recognition data updates

7. **Account Settings**

   - Notification preferences
   - Alert type customization
   - Privacy settings

8. **Communication Center**
   - Direct messaging with teachers
   - Alert responses and clarifications
   - Multi-channel notifications (app/email/SMS)

### 🏫 Admin Portal

1. **System Dashboard**

   - System-wide statistics and metrics
   - Real-time alert monitoring
   - Camera and AI system health

2. **Class & Student Management**

   - Complete student database
   - Class organization and management
   - Facial recognition data management

3. **Account Management**

   - User account administration
   - Role-based permission management
   - Bulk communication tools

4. **System Reports & Analysis**

   - Comprehensive reporting system
   - Cross-class behavior analysis
   - Exportable reports (PDF, Excel, CSV)

5. **Camera Playback & Event Extraction**

   - Historical footage review
   - Event-specific clip extraction
   - AI overlay analysis

6. **Alerts Center**

   - System-wide alert management
   - Alert categorization and handling
   - Bulk action capabilities

7. **Danger Zone Manager**

   - Interactive school layout editor
   - Zone configuration and management
   - AI learning integration

8. **Communication Center**
   - Mass communication tools
   - Emergency alert system
   - Message templates and scheduling

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Build Tool**: Vite
- **Development**: Hot Module Replacement (HMR)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.tsx      # Application header
│   ├── Layout.tsx      # Main layout wrapper
│   ├── ProtectedRoute.tsx # Route protection
│   └── Sidebar.tsx     # Navigation sidebar
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── pages/             # Page components
│   ├── admin/         # Admin portal pages
│   ├── parent/        # Parent portal pages
│   └── LoginPage.tsx  # Authentication page
├── styles/            # Global styles
│   └── index.css      # Tailwind CSS imports
└── App.tsx            # Main application component
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd smart-child-monitoring
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## Usage

### Login Credentials

The system supports role-based authentication:

- **Parent Role**: Access to child-specific monitoring and communication
- **Admin Role**: Full system access and management capabilities

### Navigation

- Use the sidebar navigation to access different modules
- Role-specific menus ensure users only see relevant features
- Responsive design works on desktop and mobile devices

## Key Features

### AI-Powered Monitoring

- Real-time behavior detection
- Automatic danger zone identification
- Predictive risk assessment
- Continuous learning algorithms

### Safety Alerts

- Climbing detection
- Out-of-zone monitoring
- Collision risk assessment
- Wandering behavior tracking

### Communication Tools

- Multi-channel notifications
- Direct messaging system
- Emergency alert capabilities
- Automated reporting

### Data Analytics

- Comprehensive behavior analysis
- Trend identification
- Risk assessment
- Performance metrics

## Security Features

- Role-based access control
- Secure authentication system
- Data privacy protection
- Audit trail logging

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For technical support or questions, please contact the development team.

---

**Smart Child Monitoring System** - Ensuring child safety through intelligent monitoring and real-time communication.
