# Authentication System Documentation

## Overview

The PrintAI Platform implements a comprehensive authentication system supporting multiple authentication methods:
- Email/Password authentication with bcrypt hashing
- Google OAuth 2.0 authentication
- Mobile OTP authentication via MSG91
- JWT-based session management
- Role-Based Access Control (RBAC)
- Audit logging for admin actions

## Architecture

### Components

1. **NextAuth.js** - Frontend authentication framework
2. **JWT Tokens** - Stateless session management
3. **Prisma** - Database ORM for user and session management
4. **bcrypt** - Password hashing
5. **Redis** - Rate limiting and caching

### Authentication Flow

```
Client → NextAuth.js → API Routes → Auth Service → Database
                                   ↓
                              JWT Token Generation
                                   ↓
                              Session Creation
```

## API Endpoints

### Registration

**POST** `/api/v1/auth/register`

Register a new user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "mobile": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CUSTOMER"
    },
    "token": "jwt-token"
  },
  "message": "Registration successful. Please verify your email."
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Login

**POST** `/api/v1/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CUSTOMER"
    },
    "token": "jwt-token"
  },
  "message": "Login successful"
}
```

### Mobile OTP Authentication

#### Send OTP

**POST** `/api/v1/auth/otp/send`

Send OTP to mobile number.

**Request Body:**
```json
{
  "mobile": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "OTP sent successfully"
  },
  "message": "OTP sent successfully"
}
```

**Rate Limits:**
- 3 requests per minute per mobile number
- OTP expires in 10 minutes
- Maximum 3 verification attempts

#### Verify OTP

**POST** `/api/v1/auth/otp/verify`

Verify OTP and authenticate user.

**Request Body:**
```json
{
  "mobile": "9876543210",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "mobile": "9876543210",
      "name": null,
      "role": "CUSTOMER"
    },
    "token": "jwt-token",
    "isNewUser": true
  },
  "message": "OTP verified successfully"
}
```

#### Resend OTP

**POST** `/api/v1/auth/otp/resend`

Resend OTP to mobile number.

**Request Body:**
```json
{
  "mobile": "9876543210"
}
```

### Google OAuth

Google OAuth is handled through NextAuth.js on the frontend.

**Configuration:**
- Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in environment variables
- Callback URL: `http://localhost:3000/api/auth/callback/google`

### Session Management

#### Get Current Session

**GET** `/api/v1/auth/session`

Get current authenticated user session.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "CUSTOMER"
    }
  }
}
```

#### Logout

**POST** `/api/v1/auth/logout`

Logout and invalidate current session.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### Logout from All Devices

**POST** `/api/v1/auth/logout-all`

Logout from all devices and invalidate all sessions.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out from all devices"
}
```

### Email Verification

**POST** `/api/v1/auth/verify-email`

Verify email with token.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "token": "verification-token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

## Role-Based Access Control (RBAC)

### Roles

1. **CUSTOMER** - End users who create designs and place orders
2. **VENDOR** - Print service providers who fulfill orders
3. **ADMIN** - Platform administrators
4. **SUPER_ADMIN** - Super administrators with all permissions

### Permissions

#### Customer Permissions
- `designs:create` - Create new designs
- `designs:read:own` - Read own designs
- `designs:delete:own` - Delete own designs
- `cart:manage:own` - Manage own cart
- `orders:create` - Create orders
- `orders:read:own` - Read own orders
- `orders:cancel:own` - Cancel own orders

#### Vendor Permissions
- `orders:read:assigned` - Read assigned orders
- `orders:accept` - Accept orders
- `orders:reject` - Reject orders
- `orders:update:assigned` - Update assigned orders
- `printfiles:download:assigned` - Download print files for assigned orders

#### Admin Permissions
- `orders:read:all` - Read all orders
- `orders:update:all` - Update all orders
- `orders:reassign` - Reassign orders
- `vendors:create` - Create vendors
- `vendors:read:all` - Read all vendors
- `vendors:update:all` - Update all vendors
- `vendors:activate` - Activate vendors
- `vendors:deactivate` - Deactivate vendors
- `catalog:manage` - Manage product catalog
- `analytics:view` - View analytics
- `notifications:view:all` - View all notifications
- `audit:view` - View audit logs

#### Super Admin Permissions
- `*` - All permissions

### Using RBAC in Code

```typescript
import { hasPermission, canAccessResource } from '@/server/utils/rbac';

// Check if user has permission
if (hasPermission(user.role, 'orders:create')) {
  // Allow order creation
}

// Check if user can access resource
if (canAccessResource(user.role, user.id, resource.ownerId, 'designs:read:own')) {
  // Allow access
}
```

### Middleware Usage

```typescript
import { authenticate, authorize } from '@/server/middleware/auth';

// Require authentication
router.get('/protected', authenticate, (req, res) => {
  // req.user is available
});

// Require specific role
router.get('/admin', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), (req, res) => {
  // Only admins can access
});
```

## Audit Logging

All admin actions are automatically logged for audit purposes.

### Audit Log Structure

```typescript
{
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
```

### Audit Actions

- `user.register` - User registration
- `user.login` - User login
- `user.logout` - User logout
- `user.update` - User profile update
- `user.delete` - User deletion
- `order.create` - Order creation
- `order.update` - Order update
- `order.cancel` - Order cancellation
- `order.reassign` - Order reassignment
- `order.status_change` - Order status change
- `vendor.create` - Vendor creation
- `vendor.update` - Vendor update
- `vendor.activate` - Vendor activation
- `vendor.deactivate` - Vendor deactivation
- `catalog.create` - Catalog item creation
- `catalog.update` - Catalog item update
- `catalog.delete` - Catalog item deletion
- `admin.access` - Admin panel access

### Using Audit Logging

```typescript
import { createAuditLog, AuditAction, AuditResource } from '@/server/services/audit';

await createAuditLog({
  userId: req.user.id,
  action: AuditAction.ORDER_UPDATE,
  resource: AuditResource.ORDER,
  resourceId: orderId,
  changes: { status: 'SHIPPED' },
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
});
```

## Rate Limiting

Rate limiting is implemented using Redis to prevent abuse.

### Rate Limit Configurations

1. **Authentication Endpoints** - 5 requests per 15 minutes
2. **OTP Endpoints** - 3 requests per minute
3. **General API** - 60 requests per minute

### Rate Limit Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 2024-01-01T00:01:00.000Z
```

### Rate Limit Response

```json
{
  "success": false,
  "error": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

## Security Features

### Password Security
- Passwords hashed using bcrypt with 10 salt rounds
- Strong password requirements enforced
- Plaintext passwords never stored

### JWT Security
- Tokens signed with secret key
- 7-day expiration
- Token validation on every request
- Expired tokens automatically rejected

### Session Security
- Sessions stored in database
- Automatic cleanup of expired sessions
- Logout invalidates session
- Support for multi-device logout

### Input Validation
- All inputs validated using Zod schemas
- Email format validation
- Mobile number format validation (Indian format)
- Password strength validation

### CSRF Protection
- Implemented at API level
- Required for all state-changing operations

### Rate Limiting
- Prevents brute force attacks
- Protects against DDoS
- Per-endpoint and per-user limits

## Frontend Integration

### Using NextAuth.js

```typescript
import { useSession, signIn, signOut } from 'next-auth/react';

function Component() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return <button onClick={() => signIn()}>Sign In</button>;
  }

  return (
    <div>
      <p>Welcome, {session.user.name}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

### Using Custom Hooks

```typescript
import { useAuth, useRequireAuth } from '@/hooks/useAuth';

function Component() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in</div>;

  return <div>Welcome, {user.name}</div>;
}

// Require specific role
function AdminComponent() {
  const { user, hasAccess } = useRequireAuth('ADMIN');

  if (!hasAccess) return <div>Access denied</div>;

  return <div>Admin Panel</div>;
}
```

### API Client with Authentication

```typescript
const apiClient = {
  async request(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return response.json();
  },
};
```

## Environment Variables

```env
# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/printai"

# Redis
REDIS_URL="redis://localhost:6379"

# MSG91 (for OTP)
MSG91_AUTH_KEY="your-msg91-auth-key"
```

## Testing

### Unit Tests

```typescript
import { validatePassword, registerUser, loginUser } from '@/server/services/auth';

describe('Auth Service', () => {
  test('validates password strength', () => {
    const result = validatePassword('weak');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('registers user successfully', async () => {
    const result = await registerUser({
      email: 'test@example.com',
      password: 'SecurePass123!',
      name: 'Test User',
    });

    expect(result.user.email).toBe('test@example.com');
    expect(result.token).toBeDefined();
  });
});
```

### Integration Tests

```typescript
import request from 'supertest';
import app from '@/server';

describe('Auth API', () => {
  test('POST /api/v1/auth/register', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });

  test('POST /api/v1/auth/login', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });
});
```

## Troubleshooting

### Common Issues

1. **"Invalid or expired token"**
   - Token has expired (7 days)
   - Token was invalidated by logout
   - Solution: Re-authenticate

2. **"Too many requests"**
   - Rate limit exceeded
   - Solution: Wait for rate limit window to reset

3. **"Email already registered"**
   - User with email already exists
   - Solution: Use different email or login

4. **"Invalid OTP"**
   - OTP is incorrect
   - OTP has expired (10 minutes)
   - Maximum attempts exceeded (3)
   - Solution: Request new OTP

5. **"Account has been deleted"**
   - User account was soft-deleted
   - Solution: Contact admin for account recovery

## Best Practices

1. **Always use HTTPS in production**
2. **Store JWT tokens securely** (httpOnly cookies or secure storage)
3. **Implement CSRF protection** for all state-changing operations
4. **Rotate JWT secrets regularly**
5. **Monitor failed login attempts**
6. **Implement account lockout** after multiple failed attempts
7. **Use strong password requirements**
8. **Enable email verification** for new accounts
9. **Implement 2FA** for sensitive operations
10. **Log all authentication events** for security monitoring

## Future Enhancements

1. Two-Factor Authentication (2FA)
2. Social login (Facebook, Apple)
3. Passwordless authentication
4. Biometric authentication
5. Account recovery flow
6. Email change verification
7. Password change with old password verification
8. Session management dashboard
9. Login history and device management
10. Suspicious activity detection
