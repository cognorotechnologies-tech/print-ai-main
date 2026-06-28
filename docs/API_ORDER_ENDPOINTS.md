# Order API Endpoints

This document describes the Order API endpoints for the PrintAI platform.

## Base URL

All endpoints are prefixed with `/api/v1/orders`

## Authentication

All order endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### 1. Create Order from Cart

Creates a new order from the user's cart items.

**Endpoint:** `POST /api/v1/orders`

**Authentication:** Required

**Request Body:**

```json
{
  "shippingAddress": {
    "name": "John Doe",
    "phone": "+919876543210",
    "addressLine1": "123 Main Street",
    "addressLine2": "Apt 4B",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India"
  }
}
```

**Field Descriptions:**

- `shippingAddress` (object, required): Shipping address details
  - `name` (string, required): Recipient name
  - `phone` (string, required): Contact phone number
  - `addressLine1` (string, required): Primary address line
  - `addressLine2` (string, optional): Secondary address line (apartment, suite, etc.)
  - `city` (string, required): City name
  - `state` (string, required): State/province name
  - `pincode` (string, required): Postal/ZIP code
  - `country` (string, required): Country name

**Success Response (201 Created):**

```json
{
  "order": {
    "id": "order-123",
    "orderNumber": "ORD-ABC123",
    "userId": "user-123",
    "vendorId": null,
    "status": "PENDING",
    "totalAmount": 1500,
    "paymentId": null,
    "paymentStatus": "PENDING",
    "shippingAddress": {
      "name": "John Doe",
      "phone": "+919876543210",
      "addressLine1": "123 Main Street",
      "addressLine2": "Apt 4B",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "country": "India"
    },
    "trackingNumber": null,
    "estimatedDelivery": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "items": [
      {
        "id": "item-1",
        "designId": "design-1",
        "fabricId": "fabric-1",
        "gsmId": "gsm-1",
        "sizeId": "size-1",
        "colorId": "color-1",
        "quantity": 2,
        "price": 750,
        "design": {
          "id": "design-1",
          "imageUrl": "https://example.com/design.jpg",
          "prompt": "Cool design"
        },
        "fabric": {
          "id": "fabric-1",
          "name": "Cotton"
        },
        "gsm": {
          "id": "gsm-1",
          "value": 180
        },
        "size": {
          "id": "size-1",
          "name": "M"
        },
        "color": {
          "id": "color-1",
          "name": "White",
          "hexCode": "#FFFFFF"
        }
      }
    ]
  }
}
```

**Error Responses:**

- `400 Bad Request`: Missing or invalid shipping address fields, or cart is empty
- `401 Unauthorized`: Authentication required
- `500 Internal Server Error`: Server error

**Example Usage:**

```bash
curl -X POST https://api.printai.com/api/v1/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {
      "name": "John Doe",
      "phone": "+919876543210",
      "addressLine1": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "country": "India"
    }
  }'
```

---

### 2. Get Order History

Retrieves all orders for the authenticated user.

**Endpoint:** `GET /api/v1/orders`

**Authentication:** Required

**Success Response (200 OK):**

```json
{
  "orders": [
    {
      "id": "order-1",
      "orderNumber": "ORD-ABC123",
      "userId": "user-123",
      "vendorId": "vendor-1",
      "status": "SHIPPED",
      "totalAmount": 1500,
      "paymentId": "pay-123",
      "paymentStatus": "SUCCESS",
      "shippingAddress": { ... },
      "trackingNumber": "TRACK123",
      "estimatedDelivery": "2024-01-20T00:00:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-18T14:20:00.000Z",
      "items": [ ... ]
    },
    {
      "id": "order-2",
      "orderNumber": "ORD-DEF456",
      "userId": "user-123",
      "vendorId": null,
      "status": "PENDING",
      "totalAmount": 2000,
      "paymentId": null,
      "paymentStatus": "PENDING",
      "shippingAddress": { ... },
      "trackingNumber": null,
      "estimatedDelivery": null,
      "createdAt": "2024-01-16T09:15:00.000Z",
      "updatedAt": "2024-01-16T09:15:00.000Z",
      "items": [ ... ]
    }
  ]
}
```

**Order Status Values:**

- `PENDING`: Order created, awaiting payment
- `PAID`: Payment successful, awaiting vendor assignment
- `ASSIGNED`: Assigned to vendor
- `IN_PRODUCTION`: Vendor is producing the order
- `SHIPPED`: Order shipped to customer
- `DELIVERED`: Order delivered
- `CANCELLED`: Order cancelled

**Payment Status Values:**

- `PENDING`: Payment not yet completed
- `SUCCESS`: Payment successful
- `FAILED`: Payment failed
- `REFUNDED`: Payment refunded

**Error Responses:**

- `401 Unauthorized`: Authentication required
- `500 Internal Server Error`: Server error

**Example Usage:**

```bash
curl -X GET https://api.printai.com/api/v1/orders \
  -H "Authorization: Bearer <token>"
```

---

### 3. Get Order Details

Retrieves detailed information about a specific order.

**Endpoint:** `GET /api/v1/orders/:id`

**Authentication:** Required

**URL Parameters:**

- `id` (string, required): Order ID

**Success Response (200 OK):**

```json
{
  "order": {
    "id": "order-123",
    "orderNumber": "ORD-ABC123",
    "userId": "user-123",
    "vendorId": "vendor-1",
    "status": "SHIPPED",
    "totalAmount": 1500,
    "paymentId": "pay-123",
    "paymentStatus": "SUCCESS",
    "shippingAddress": {
      "name": "John Doe",
      "phone": "+919876543210",
      "addressLine1": "123 Main Street",
      "addressLine2": "Apt 4B",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "country": "India"
    },
    "trackingNumber": "TRACK123",
    "estimatedDelivery": "2024-01-20T00:00:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-18T14:20:00.000Z",
    "items": [
      {
        "id": "item-1",
        "designId": "design-1",
        "fabricId": "fabric-1",
        "gsmId": "gsm-1",
        "sizeId": "size-1",
        "colorId": "color-1",
        "quantity": 2,
        "price": 750,
        "design": {
          "id": "design-1",
          "imageUrl": "https://example.com/design.jpg",
          "prompt": "Cool design"
        },
        "fabric": {
          "id": "fabric-1",
          "name": "Cotton"
        },
        "gsm": {
          "id": "gsm-1",
          "value": 180
        },
        "size": {
          "id": "size-1",
          "name": "M"
        },
        "color": {
          "id": "color-1",
          "name": "White",
          "hexCode": "#FFFFFF"
        }
      }
    ]
  }
}
```

**Error Responses:**

- `401 Unauthorized`: Authentication required
- `403 Forbidden`: User not authorized to view this order
- `404 Not Found`: Order not found
- `500 Internal Server Error`: Server error

**Example Usage:**

```bash
curl -X GET https://api.printai.com/api/v1/orders/order-123 \
  -H "Authorization: Bearer <token>"
```

---

### 4. Cancel Order

Cancels an order. Only orders that are not yet delivered or already cancelled can be cancelled.

**Endpoint:** `PUT /api/v1/orders/:id/cancel`

**Authentication:** Required

**URL Parameters:**

- `id` (string, required): Order ID

**Request Body (Optional):**

```json
{
  "reason": "Changed my mind"
}
```

**Field Descriptions:**

- `reason` (string, optional): Reason for cancellation

**Success Response (200 OK):**

```json
{
  "order": {
    "id": "order-123",
    "orderNumber": "ORD-ABC123",
    "userId": "user-123",
    "vendorId": null,
    "status": "CANCELLED",
    "totalAmount": 1500,
    "paymentId": null,
    "paymentStatus": "PENDING",
    "shippingAddress": { ... },
    "trackingNumber": null,
    "estimatedDelivery": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-16T11:45:00.000Z",
    "items": [ ... ]
  }
}
```

**Error Responses:**

- `400 Bad Request`: Cannot cancel order (already delivered or cancelled), or invalid reason type
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: User not authorized to cancel this order
- `404 Not Found`: Order not found
- `500 Internal Server Error`: Server error

**Example Usage:**

```bash
curl -X PUT https://api.printai.com/api/v1/orders/order-123/cancel \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Changed my mind"
  }'
```

---

## Order Workflow

1. **Create Order**: Customer creates order from cart with shipping address
2. **Payment**: Customer completes payment (handled by payment endpoints)
3. **Vendor Assignment**: System assigns order to available vendor
4. **Production**: Vendor accepts and produces the order
5. **Shipping**: Vendor ships the order with tracking number
6. **Delivery**: Order is delivered to customer

At any point before delivery, the customer can cancel the order.

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: User not authorized for this action
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Order numbers are automatically generated in format `ORD-{timestamp}-{random}`
- Cart is automatically cleared after successful order creation
- Orders can only be cancelled if status is not `DELIVERED` or `CANCELLED`
- Estimated delivery is calculated when order is assigned to vendor (typically 7 days)
