# Cart API Endpoints

This document describes the cart management API endpoints for the PrintAI platform.

## Base URL

All cart endpoints are prefixed with `/api/v1/cart`

## Authentication

All cart endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Get Cart

Retrieve the current user's shopping cart with all items.

**Endpoint:** `GET /api/v1/cart`

**Authentication:** Required

**Response:**

```json
{
  "cart": {
    "items": [
      {
        "id": "cart-item-uuid",
        "userId": "user-uuid",
        "designId": "design-uuid",
        "fabricId": "fabric-uuid",
        "gsmId": "gsm-uuid",
        "sizeId": "size-uuid",
        "colorId": "color-uuid",
        "quantity": 2,
        "price": 738,
        "createdAt": "2024-03-17T00:00:00.000Z",
        "updatedAt": "2024-03-17T00:00:00.000Z",
        "design": {
          "id": "design-uuid",
          "imageUrl": "https://cloudinary.com/design.jpg",
          "prompt": "Cool T-shirt design"
        },
        "fabric": {
          "id": "fabric-uuid",
          "name": "Cotton"
        },
        "gsm": {
          "id": "gsm-uuid",
          "value": 180
        },
        "size": {
          "id": "size-uuid",
          "name": "M"
        },
        "color": {
          "id": "color-uuid",
          "name": "White",
          "hexCode": "#FFFFFF"
        }
      }
    ],
    "totalItems": 2,
    "totalPrice": 738
  }
}
```

**Status Codes:**
- `200 OK` - Cart retrieved successfully
- `401 Unauthorized` - Authentication required
- `500 Internal Server Error` - Server error

---

### 2. Add Item to Cart

Add a new item to the cart or update quantity if the item already exists.

**Endpoint:** `POST /api/v1/cart/items`

**Authentication:** Required

**Request Body:**

```json
{
  "designId": "design-uuid",
  "fabricId": "fabric-uuid",
  "gsmId": "gsm-uuid",
  "sizeId": "size-uuid",
  "colorId": "color-uuid",
  "quantity": 2
}
```

**Field Descriptions:**
- `designId` (string, required) - ID of the design to add
- `fabricId` (string, required) - ID of the fabric type
- `gsmId` (string, required) - ID of the GSM option
- `sizeId` (string, required) - ID of the size
- `colorId` (string, required) - ID of the color
- `quantity` (number, optional) - Quantity to add (default: 1, min: 1)

**Response:**

```json
{
  "item": {
    "id": "cart-item-uuid",
    "userId": "user-uuid",
    "designId": "design-uuid",
    "fabricId": "fabric-uuid",
    "gsmId": "gsm-uuid",
    "sizeId": "size-uuid",
    "colorId": "color-uuid",
    "quantity": 2,
    "price": 738,
    "createdAt": "2024-03-17T00:00:00.000Z",
    "updatedAt": "2024-03-17T00:00:00.000Z",
    "design": {
      "id": "design-uuid",
      "imageUrl": "https://cloudinary.com/design.jpg",
      "prompt": "Cool T-shirt design"
    },
    "fabric": {
      "id": "fabric-uuid",
      "name": "Cotton"
    },
    "gsm": {
      "id": "gsm-uuid",
      "value": 180
    },
    "size": {
      "id": "size-uuid",
      "name": "M"
    },
    "color": {
      "id": "color-uuid",
      "name": "White",
      "hexCode": "#FFFFFF"
    }
  }
}
```

**Status Codes:**
- `201 Created` - Item added successfully
- `400 Bad Request` - Invalid request (missing fields, invalid IDs, inactive options)
- `401 Unauthorized` - Authentication required
- `500 Internal Server Error` - Server error

**Error Examples:**

```json
{
  "error": "Missing required fields: designId, fabricId, gsmId, sizeId, colorId"
}
```

```json
{
  "error": "Design not found"
}
```

```json
{
  "error": "Invalid or inactive fabric"
}
```

---

### 3. Update Cart Item Quantity

Update the quantity of an existing cart item.

**Endpoint:** `PUT /api/v1/cart/items/:id`

**Authentication:** Required

**URL Parameters:**
- `id` (string, required) - Cart item ID

**Request Body:**

```json
{
  "quantity": 5
}
```

**Field Descriptions:**
- `quantity` (number, required) - New quantity (min: 1)

**Response:**

```json
{
  "item": {
    "id": "cart-item-uuid",
    "userId": "user-uuid",
    "designId": "design-uuid",
    "fabricId": "fabric-uuid",
    "gsmId": "gsm-uuid",
    "sizeId": "size-uuid",
    "colorId": "color-uuid",
    "quantity": 5,
    "price": 1845,
    "createdAt": "2024-03-17T00:00:00.000Z",
    "updatedAt": "2024-03-17T00:00:00.000Z",
    "design": { ... },
    "fabric": { ... },
    "gsm": { ... },
    "size": { ... },
    "color": { ... }
  }
}
```

**Status Codes:**
- `200 OK` - Item updated successfully
- `400 Bad Request` - Invalid quantity
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Unauthorized to update this cart item
- `404 Not Found` - Cart item not found
- `500 Internal Server Error` - Server error

**Error Examples:**

```json
{
  "error": "Quantity is required"
}
```

```json
{
  "error": "Quantity must be a positive integer"
}
```

```json
{
  "error": "Cart item not found"
}
```

```json
{
  "error": "Unauthorized to update this cart item"
}
```

---

### 4. Remove Cart Item

Remove a specific item from the cart.

**Endpoint:** `DELETE /api/v1/cart/items/:id`

**Authentication:** Required

**URL Parameters:**
- `id` (string, required) - Cart item ID

**Response:**

```json
{
  "message": "Item removed from cart successfully"
}
```

**Status Codes:**
- `200 OK` - Item removed successfully
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Unauthorized to remove this cart item
- `404 Not Found` - Cart item not found
- `500 Internal Server Error` - Server error

**Error Examples:**

```json
{
  "error": "Cart item not found"
}
```

```json
{
  "error": "Unauthorized to remove this cart item"
}
```

---

### 5. Clear Cart

Remove all items from the cart.

**Endpoint:** `DELETE /api/v1/cart`

**Authentication:** Required

**Response:**

```json
{
  "message": "Cart cleared successfully"
}
```

**Status Codes:**
- `200 OK` - Cart cleared successfully
- `401 Unauthorized` - Authentication required
- `500 Internal Server Error` - Server error

---

## Usage Examples

### Example 1: Add Item to Cart

```bash
curl -X POST https://api.printai.com/api/v1/cart/items \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "designId": "design-123",
    "fabricId": "fabric-456",
    "gsmId": "gsm-789",
    "sizeId": "size-012",
    "colorId": "color-345",
    "quantity": 2
  }'
```

### Example 2: Get Cart

```bash
curl -X GET https://api.printai.com/api/v1/cart \
  -H "Authorization: Bearer <jwt_token>"
```

### Example 3: Update Cart Item Quantity

```bash
curl -X PUT https://api.printai.com/api/v1/cart/items/cart-item-123 \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 5
  }'
```

### Example 4: Remove Cart Item

```bash
curl -X DELETE https://api.printai.com/api/v1/cart/items/cart-item-123 \
  -H "Authorization: Bearer <jwt_token>"
```

### Example 5: Clear Cart

```bash
curl -X DELETE https://api.printai.com/api/v1/cart \
  -H "Authorization: Bearer <jwt_token>"
```

---

## Business Logic

### Price Calculation

When adding or updating cart items, the price is automatically calculated based on:
- Base price from the pricing configuration
- Fabric price modifier
- GSM price modifier
- Size price modifier
- Color price modifier
- Quantity

Formula: `price = (basePrice + fabricModifier + gsmModifier + sizeModifier + colorModifier) × quantity`

### Duplicate Item Handling

If you add an item with the same configuration (design, fabric, GSM, size, color) that already exists in the cart:
- The quantities are combined
- The price is recalculated for the new total quantity
- Only one cart item record is maintained

### Validation

The cart service validates:
- All referenced entities (design, fabric, GSM, size, color) exist
- All catalog options are active
- Quantity is a positive integer
- User owns the cart item (for update/delete operations)

### Cart Persistence

Cart items are persisted in the database for authenticated users and remain available across sessions until:
- The user removes them
- The user clears the cart
- The user completes checkout (handled by order service)

---

## Related Endpoints

- [Catalog API](./API_CATALOG_ENDPOINTS.md) - Get product configuration options
- [Product API](./API_PRODUCT_ENDPOINTS.md) - Calculate prices and generate mockups
- [Design API](./API_DESIGN_ENDPOINTS.md) - Generate and manage designs

---

## Notes

- Cart operations are user-specific and require authentication
- Cart items include full details of the design and configuration for display
- Prices are calculated server-side and cannot be manipulated by the client
- Cart validation ensures all options are still active before checkout
- The cart service integrates with the catalog service for price calculation
