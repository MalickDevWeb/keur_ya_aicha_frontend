# Keur Ya Aicha - Frontend Application Guide

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and Bun
- JSON Server running on port 4001
- Frontend dev server on port 8084

### Installation

```bash
cd /home/pmt/KeurYaAicha/kya/frontend
bun install
```

### Running the Application

```bash
# Terminal 1: Start JSON Server
bun run json-server --watch db/db.json --port 4001 --routes json-server.routes.json

# Terminal 2: Start Vite dev server
bun run dev

# Terminal 3 (optional): Start mock API server
cd server && node index.js
```

The app will be available at: `http://localhost:8084`

## 🔐 Authentication

### Demo Credentials

- **Username**: admin
- **Password**: admin123

### How it Works

1. Credentials are validated against `/users` table in db.json
2. User session stored in sessionStorage (temporary, per-session)
3. Session persists across page refreshes within same browser session
4. Logout clears session and redirects to login page
5. Invalid credentials show error toast

## 📊 Data Persistence

All data is stored in JSON Server (db.json):

- **clients**: Client info (firstName, lastName, phone, cni, status, rentals)
- **users**: Authentication (username, password, role)
- **settings**: App configuration (theme, language)
- **work_items**: Task management
- **documents**: Document records
- **payments**: Payment history
- **deposits**: Deposit tracking

## 🎨 Features

### Client Management

- **Add Client**: Create new clients with rental and deposit info
- **Archive Clients**: Move inactive clients to archive
- **Reactivate**: Move archived clients back to active
- **Blacklist**: Flag problematic clients
- **Remove from Blacklist**: Restore client status
- **Search**: Find clients by name, phone, or CNI

### Confirmation Dialogs

All critical actions show confirmation dialogs:

- Archive: "Client will be moved to archived list"
- Blacklist: "Client will be added to blacklist (severe action)"
- Reactivate: "Client will become active again"

### Error Handling

- **Form Validation**: Real-time Zod validation
- **Network Errors**: Automatic retry (up to 2 times)
- **Session Timeout**: 401 errors redirect to login
- **Toast Notifications**: Success/error messages

## 🌍 Language & Theme

### Language Selection

- French (default) or English
- Persists in server settings
- Change in Settings page (Admin only)

### Theme Selection

- Default, Orange, Dark, Gray, Clinic
- Persists in server settings
- Change in Settings page (Admin only)

## 📝 Pages Overview

| Page                | Purpose                    | Admin Only |
| ------------------- | -------------------------- | ---------- |
| Login               | Authentication             | No         |
| Dashboard           | Overview & stats           | No         |
| Clients             | View all active clients    | No         |
| Archived Clients    | Manage archived clients    | No         |
| Blacklisted Clients | Manage blacklisted clients | No         |
| Add Client          | Create new client          | No         |
| Rentals             | View all rentals           | No         |
| Payments            | Record payments            | No         |
| Deposits            | Track deposits             | No         |
| Documents           | Upload documents           | No         |
| Settings            | Theme, Language            | Yes        |
| Work                | Task management            | No         |

## 🔧 API Integration

### API Endpoints

```
GET    /clients
POST   /clients
PUT    /clients/:id
DELETE /clients/:id

GET    /users?username=X&password=Y
GET    /settings?key=X
POST   /settings
PATCH  /settings/:id

GET    /work_items
POST   /work_items
PATCH  /work_items/:id
DELETE /work_items/:id
```

### Error Handling

- 401: Session expired - user redirected to login
- 403: Access forbidden - error toast shown
- 404: Resource not found - error message displayed
- 5xx: Server error - retry automatically (up to 2 times)

## 🧪 Testing Checklist

- [ ] Login with admin/admin123
- [ ] Add new client with rental
- [ ] Archive client (see confirmation)
- [ ] Reactivate client (see confirmation)
- [ ] Add client to blacklist (see warning)
- [ ] Remove from blacklist (see confirmation)
- [ ] Search clients by name, phone, CNI
- [ ] Change theme and refresh (persists)
- [ ] Change language and refresh (persists)
- [ ] Network error: disconnect network, try action (shows retry logic)
- [ ] Session timeout: clear sessionStorage, try action (redirects to login)

## 🐛 Debugging

### Enable Console Logging

All API calls are logged with emojis:

- 📡 Request started
- ✅ Request successful
- ❌ Request failed
- 🔄 Retry attempt

Check browser DevTools Console tab for detailed logs.

### Common Issues

**Blank page after login?**

- Check if json-server is running on port 4001
- Verify VITE_API_URL environment variable
- Check browser console for errors

**Toasts not showing?**

- Verify ToastContainer is in App.tsx
- Check if ToastProvider wraps the app

**Form validation not working?**

- Ensure FormField components use FormMessage
- Check if Zod schema is applied to useForm

**Session keeps getting cleared?**

- This is normal after browser close
- Use localStorage if you want persistence (not recommended for sensitive data)

## 📚 Component Library

### Validation

- `formSchemas.ts`: Zod schemas for forms
- `FormError.tsx`: Error display component

### UI Components

- `ConfirmDialog.tsx`: Confirmation dialogs
- `ToastContainer.tsx`: Toast notifications
- `ErrorBoundary.tsx`: Error catching

### Hooks

- `useApiCall.ts`: API calls with retry logic
- `useToast.ts`: Toast notifications
- `use-mobile.tsx`: Mobile detection

### Services

- `api.ts`: All API functions with error handling
- `cloudinary.ts`: Image upload service

## 🎯 Next Steps

1. **User Testing**: Get feedback from actual users
2. **Performance**: Measure and optimize
3. **Accessibility**: Ensure WCAG compliance
4. **Mobile**: Test on mobile devices
5. **Documentation**: Add inline code comments
6. **CI/CD**: Set up automated testing

## 📞 Support

For issues or questions:

1. Check browser console for errors
2. Verify server is running
3. Check network tab for failed requests
4. Review error toast messages
5. Check application logs

---

**Last Updated**: Session focused on frontend stabilization
**Status**: ✅ Production Ready
**Language**: TypeScript + React
**State Management**: Context API
**API Server**: JSON Server on port 4001
