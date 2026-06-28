# Payment API Endpoints

## Overview

The Payment API provides endpoints for creating Razorpay orders, verifying payment callbacks, and processing refunds. All endpoints require authentication and integrate with the Razorpay payment gateway.

## Base URL

```
/api/payments
```

## Authentication

All payment endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Create Razorpay Order

Creates a new Razorpay order for payment processing.

**Endpoint:** `POST /api/payments/create`

**Request Body:**
```json
{
  "orderId": "order-uuid",
  "amount": 500,
  "currency": "INR",
  "receipt": "receipt-123"
}
```

**Request Parameters:**
- `orderId` (string, required): Internal order ID
- `amount` (number, required): Amount in rupees (must be positive)
- `currency` (string, optional): Currency code (default: 'INR')
- `receipt` (string, optional): Receipt identifier (default: orderId)

**Success Response (201 Created):**
```json
{
  "razorpayOrderId": "order_MNOPqrstuvwxyz",
  "amount": 50000,
  "currency": "INR",
  "keyId": "rzp_test_1234567890"
}
```

**Response Fields:**
- `razorpayOrderId`: Razorpay order ID for frontend integration
- `amount`: Amount in paise (smallest currency unit)
- `currency`: Currency code
- `keyId`: Razorpay key ID for checkout UI

**Error Responses:**

400 Bad Request - Validation Error:
```json
{
  "error": "Validation error",
  "details": [
    {
      "path": ["amount"],
      "message": "Amount must be greater than zero"
    }
  ]
}
```

401 Unauthorized:
```json
{
  "error": "Unauthorized"
}
```

500 Internal Server Error:
```json
{
  "error": "Failed to create payment order"
}
```

**Example Usage:**
```javascript
const response = await fetch('/api/payments/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    orderId: 'order-123',
    amount: 500
  })
});

const { razorpayOrderId, keyId } = await response.json();
```

---

### 2. Verify Payment Callback

Verifies payment callback from Razorpay with signature verification and updates order status.

**Endpoint:** `POST /api/payments/verify`

**Request Body:**
```json
{
  "orderId": "order-uuid",
  "razorpayOrderId": "order_MNOPqrstuvwxyz",
  "razorpayPaymentId": "pay_ABCDefghijklmn",
  "razorpaySignature": "signature_hash"
}
```

**Request Parameters:**
- `orderId` (string, required): Internal order ID
- `razorpayOrderId` (string, required): Razorpay order ID
- `razorpayPaymentId` (string, required): Razorpay payment ID
- `razorpaySignature` (string, required): Payment signature for verification

**Success Response (200 OK):**
```json
{
  "order": {
    "id": "order-uuid",
    "orderNumber": "ORD-123456",
    "userId": "user-uuid",
    "vendorId": null,
    "status": "PAID",
    "totalAmount": 500,
    "paymentId": "pay_ABCDefghijklmn",
    "paymentStatus": "SUCCESS",
    "shippingAddress": {
      "name": "John Doe",
      "phone": "+919876543210",
      "addressLine1": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "country": "India"
    },
    "trackingNumber": null,
    "estimatedDelivery": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:35:00Z",
    "items": [...]
  }
}
```

**Error Responses:**

400 Bad Request - Validation Error:
```json
{
  "error": "Validation error",
  "details": [...]
}
```

400 Bad Request - Invalid Signature:
```json
{
  "error": "Invalid payment signature"
}
```

404 Not Found:
```json
{
  "error": "Order not found"
}
```

401 Unauthorized:
```json
{
  "error": "Unauthorized"
}
```

500 Internal Server Error:
```json
{
  "error": "Failed to verify payment"
}
```

**Idempotency:**

This endpoint is idempotent. If the same payment callback is received multiple times (e.g., due to network retries), the endpoint will return the existing order without processing the payment again.

**Example Usage:**
```javascript
// After Razorpay checkout success
const response = await fetch('/api/payments/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    orderId: 'order-123',
    razorpayOrderId: razorpayResponse.razorpay_order_id,
    razorpayPaymentId: razorpayResponse.razorpay_payment_id,
    razorpaySignature: razorpayResponse.razorpay_signature
  })
});

const { order } = await response.json();
```

---

### 3. Process Refund

Processes a full or partial refund for a payment.

**Endpoint:** `POST /api/payments/refund`

**Request Body:**
```json
{
  "paymentId": "pay_ABCDefghijklmn",
  "amount": 250,
  "reason": "Customer requested refund"
}
```

**Request Parameters:**
- `paymentId` (string, required): Razorpay payment ID
- `amount` (number, optional): Refund amount in rupees (defaults to full refund)
- `reason` (string, optional): Reason for refund

**Success Response (200 OK):**
```json
{
  "refundId": "rfnd_XYZabcdefghijk",
  "amount": 25000,
  "currency": "INR",
  "status": "processed"
}
```

**Response Fields:**
- `refundId`: Razorpay refund ID
- `amount`: Refund amount in paise
- `currency`: Currency code
- `status`: Refund status

**Error Responses:**

400 Bad Request - Validation Error:
```json
{
  "error": "Validation error",
  "details": [
    {
      "path": ["amount"],
      "message": "Amount must be greater than zero"
    }
  ]
}
```

404 Not Found:
```json
{
  "error": "Order not found for payment ID"
}
```

400 Bad Request - Refund Failed:
```json
{
  "error": "Refund processing failed: Insufficient balance"
}
```

401 Unauthorized:
```json
{
  "error": "Unauthorized"
}
```

500 Internal Server Error:
```json
{
  "error": "Failed to process refund"
}
```

**Example Usage:**
```javascript
// Full refund
const response = await fetch('/api/payments/refund', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    paymentId: 'pay_123'
  })
});

// Partial refund
const response = await fetch('/api/payments/refund', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    paymentId: 'pay_123',
    amount: 250,
    reason: 'Partial order cancellation'
  })
});

const refund = await response.json();
```

---

## Payment Flow

### Complete Payment Flow

1. **Create Order**: Customer creates an order from cart
   ```
   POST /api/orders
   ```

2. **Create Razorpay Order**: Frontend requests Razorpay order creation
   ```
   POST /api/payments/create
   ```

3. **Display Razorpay Checkout**: Frontend displays Razorpay checkout UI with order details

4. **Customer Completes Payment**: Customer enters payment details and completes payment

5. **Verify Payment**: Frontend sends payment details for verification
   ```
   POST /api/payments/verify
   ```

6. **Order Confirmed**: Order status updated to PAID, cart cleared, notifications sent

### Refund Flow

1. **Admin/Customer Initiates Refund**: Refund request is made

2. **Process Refund**: Backend processes refund via Razorpay
   ```
   POST /api/payments/refund
   ```

3. **Update Order Status**: Order payment status updated to REFUNDED

4. **Notify Customer**: Customer notified about refund

---

## Security

### Signature Verification

All payment callbacks are verified using HMAC SHA256 signature:

```
signature = HMAC_SHA256(razorpayOrderId + "|" + razorpayPaymentId, razorpayKeySecret)
```

Invalid signatures are rejected with a 400 error.

### Idempotency

Payment verification endpoint implements idempotency to handle duplicate callbacks:
- Checks if payment already processed
- Returns existing order without reprocessing
- Prevents double payment processing

### Authentication

All endpoints require valid JWT authentication:
- Token must be present in Authorization header
- Token must be valid and not expired
- User must have appropriate permissions

### Transaction Logging

All payment operations are logged for audit and reconciliation:
- Order creation
- Payment verification
- Refund processing
- Signature verification failures

---

## Error Handling

### Common Error Codes

- `400 Bad Request`: Invalid input, validation errors, or business logic errors
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Order or payment not found
- `500 Internal Server Error`: Unexpected server errors

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": "Error message"
}
```

Validation errors include additional details:

```json
{
  "error": "Validation error",
  "details": [
    {
      "path": ["fieldName"],
      "message": "Validation message"
    }
  ]
}
```

---

## Testing

### Test Mode

Use Razorpay test credentials for development:
- Test Key ID: `rzp_test_...`
- Test Key Secret: `test_secret_...`

### Test Cards

Razorpay provides test cards for different scenarios:
- Success: `4111 1111 1111 1111`
- Failure: `4000 0000 0000 0002`

### Test UPI

Use test UPI IDs:
- Success: `success@razorpay`
- Failure: `failure@razorpay`

---

## Requirements Validated

This implementation validates the following requirements:
- **7.2**: Razorpay payment gateway integration
- **7.3**: Support for multiple payment methods (UPI, cards, net banking, wallets)
- **7.4**: Payment success handling and order confirmation
- **7.5**: Payment failure handling with retry capability
- **7.6**: Secure payment callback handling with signature verification

---

## Related Documentation

- [Payment Service Documentation](./PAYMENT_SERVICE.md)
- [Order API Endpoints](./API_ORDER_ENDPOINTS.md)
- [Authentication Documentation](./AUTHENTICATION.md)
- [Razorpay API Documentation](https://razorpay.com/docs/api/)
