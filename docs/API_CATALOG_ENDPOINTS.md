# Catalog API Endpoints

This document describes the product catalog API endpoints for the PrintAI platform.

## Base URL

All endpoints are prefixed with `/api/v1/catalog`

## Authentication

All catalog endpoints are **public** and do not require authentication. This allows customers to browse product options before creating an account.

## Caching

Catalog data is cached in Redis with a 1-hour TTL to improve performance. Cache is automatically invalidated when catalog data is updated by admins.

## Endpoints

### 1. Get Complete Catalog

Retrieve all product configuration options in a single request.

**Endpoint:** `GET /api/v1/catalog`

**Response:** `200 OK`
```json
{
  "catalog": {
    "fabrics": [
      {
        "id": "fabric-uuid-1",
        "name": "Cotton",
        "priceModifier": 0,
        "isActive": true
      },
      {
        "id": "fabric-uuid-2",
        "name": "Polyester",
        "priceModifier": 50,
        "isActive": true
      },
      {
        "id": "fabric-uuid-3",
        "name": "Cotton-Polyester Blend",
        "priceModifier": 30,
        "isActive": true
      }
    ],
    "gsms": [
      {
        "id": "gsm-uuid-1",
        "value": 160,
        "priceModifier": 0,
        "isActive": true
      },
      {
        "id": "gsm-uuid-2",
        "value": 180,
        "priceModifier": 20,
        "isActive": true
      }

      {
        "id": "gsm-uuid-3",
        "value": 200,
        "priceModifier": 40,
        "isActive": true
      },
      {
        "id": "gsm-uuid-4",
        "value": 220,
        "priceModifier": 60,
        "isActive": true
      }
    ],
    "sizes": [
      {
        "id": "size-uuid-1",
        "name": "XS",
        "priceModifier": 0,
        "isActive": true
      },
      {
        "id": "size-uuid-2",
        "name": "S",
        "priceModifier": 0,
        "isActive": true
      },
      {
        "id": "size-uuid-3",
        "name": "M",
        "priceModifier": 0,
        "isActive": true
      },
      {
        "id": "size-uuid-4",
        "name": "L",
        "priceModifier": 0,
        "isActive": true
      },
      {
        "id": "size-uuid-5",
        "name": "XL",
        "priceModifier": 50,
        "isActive": true
      },
      {
        "id": "size-uuid-6",
        "name": "XXL",
        "priceModifier": 100,
        "isActive": true
      },
      {
        "id": "size-uuid-7",
        "name": "XXXL",
        "priceModifier": 150,
        "isActive": true
      }
    ],
    "colors": [
      {
        "id": "color-uuid-1",
        "name": "White",
        "hexCode": "#FFFFFF",
        "priceModifier": 0,
        "isActive": true
      },
      {
        "id": "color-uuid-2",
        "name": "Black",
        "hexCode": "#000000",
        "priceModifier": 0,
        "isActive": true
      },
      {
        "id": "color-uuid-3",
        "name": "Navy Blue",
        "hexCode": "#000080",
        "priceModifier": 0,
        "isActive": true
      },
      {
        "id": "color-uuid-4",
        "name": "Red",
        "hexCode": "#FF0000",
        "priceModifier": 0,
        "isActive": true
      },
      {
        "id": "color-uuid-5",
        "name": "Green",
        "hexCode": "#008000",
        "priceModifier": 0,
        "isActive": true
      }
    ],
    "basePrice": 299
  }
}
```

**Notes:**
- Returns only active options (`isActive: true`)
- Fabrics are sorted alphabetically by name
- GSMs are sorted by value (ascending)
- Colors are sorted alphabetically by name
- Base price is the current active pricing

**Error Responses:**
- `500 Internal Server Error`: Failed to fetch catalog

**Example:**
```bash
curl https://api.printai.com/api/v1/catalog
```

---

### 2. Get Fabrics

Retrieve all available fabric types.

**Endpoint:** `GET /api/v1/catalog/fabrics`

**Response:** `200 OK`
```json
{
  "fabrics": [
    {
      "id": "fabric-uuid-1",
      "name": "Cotton",
      "priceModifier": 0,
      "isActive": true
    },
    {
      "id": "fabric-uuid-2",
      "name": "Polyester",
      "priceModifier": 50,
      "isActive": true
    }
  ]
}
```

**Example:**
```bash
curl https://api.printai.com/api/v1/catalog/fabrics
```

---

### 3. Get GSM Options

Retrieve all available GSM (fabric weight) options.

**Endpoint:** `GET /api/v1/catalog/gsms`

**Response:** `200 OK`
```json
{
  "gsms": [
    {
      "id": "gsm-uuid-1",
      "value": 160,
      "priceModifier": 0,
      "isActive": true
    },
    {
      "id": "gsm-uuid-2",
      "value": 180,
      "priceModifier": 20,
      "isActive": true
    }
  ]
}
```

**Notes:**
- GSM (Grams per Square Meter) indicates fabric thickness/weight
- Higher GSM = thicker, heavier fabric
- Results are sorted by value (ascending)

**Example:**
```bash
curl https://api.printai.com/api/v1/catalog/gsms
```

---

### 4. Get Sizes

Retrieve all available T-shirt sizes.

**Endpoint:** `GET /api/v1/catalog/sizes`

**Response:** `200 OK`
```json
{
  "sizes": [
    {
      "id": "size-uuid-1",
      "name": "XS",
      "priceModifier": 0,
      "isActive": true
    },
    {
      "id": "size-uuid-2",
      "name": "S",
      "priceModifier": 0,
      "isActive": true
    },
    {
      "id": "size-uuid-3",
      "name": "M",
      "priceModifier": 0,
      "isActive": true
    }
  ]
}
```

**Example:**
```bash
curl https://api.printai.com/api/v1/catalog/sizes
```

---

### 5. Get Colors

Retrieve all available T-shirt base colors.

**Endpoint:** `GET /api/v1/catalog/colors`

**Response:** `200 OK`
```json
{
  "colors": [
    {
      "id": "color-uuid-1",
      "name": "White",
      "hexCode": "#FFFFFF",
      "priceModifier": 0,
      "isActive": true
    },
    {
      "id": "color-uuid-2",
      "name": "Black",
      "hexCode": "#000000",
      "priceModifier": 0,
      "isActive": true
    }
  ]
}
```

**Notes:**
- `hexCode` is provided for UI color preview
- Results are sorted alphabetically by name

**Example:**
```bash
curl https://api.printai.com/api/v1/catalog/colors
```

---

### 6. Calculate Price

Calculate the total price for a product configuration.

**Endpoint:** `POST /api/v1/catalog/price`

**Request Body:**
```json
{
  "fabricId": "fabric-uuid-1",
  "gsmId": "gsm-uuid-2",
  "sizeId": "size-uuid-5",
  "colorId": "color-uuid-1",
  "quantity": 2
}
```

**Parameters:**
- `fabricId` (string, required): ID of the selected fabric
- `gsmId` (string, required): ID of the selected GSM option
- `sizeId` (string, required): ID of the selected size
- `colorId` (string, required): ID of the selected color
- `quantity` (number, optional): Number of items (default: 1, min: 1, max: 100)

**Response:** `200 OK`
```json
{
  "price": 738,
  "quantity": 2,
  "pricePerItem": 369
}
```

**Price Calculation:**
```
pricePerItem = basePrice + fabricModifier + gsmModifier + sizeModifier + colorModifier
totalPrice = pricePerItem × quantity
```

**Example Calculation:**
- Base Price: ₹299
- Cotton Fabric: +₹0
- 180 GSM: +₹20
- XL Size: +₹50
- White Color: +₹0
- **Price per item:** ₹369
- **Quantity:** 2
- **Total Price:** ₹738

**Error Responses:**
- `400 Bad Request`: Missing required fields
  ```json
  {
    "error": "Missing required fields: fabricId, gsmId, sizeId, colorId"
  }
  ```

- `400 Bad Request`: Invalid quantity
  ```json
  {
    "error": "Quantity must be between 1 and 100"
  }
  ```

- `400 Bad Request`: Invalid or inactive option
  ```json
  {
    "error": "Invalid or inactive fabric"
  }
  ```

- `500 Internal Server Error`: Server error
  ```json
  {
    "error": "Failed to calculate price"
  }
  ```

**Example:**
```bash
curl -X POST https://api.printai.com/api/v1/catalog/price \
  -H "Content-Type: application/json" \
  -d '{
    "fabricId": "fabric-uuid-1",
    "gsmId": "gsm-uuid-2",
    "sizeId": "size-uuid-5",
    "colorId": "color-uuid-1",
    "quantity": 2
  }'
```

---

## Usage Flow

### Product Configuration Flow

1. **Fetch catalog options** → `GET /api/v1/catalog`
2. **Display configuration UI** → Show dropdowns/selectors for each option
3. **User selects options** → Store selected IDs
4. **Calculate price in real-time** → `POST /api/v1/catalog/price` on each change
5. **Display updated price** → Show total and per-item price
6. **Add to cart** → Use selected IDs and calculated price

### Example Implementation (JavaScript)

```javascript
// Fetch catalog on page load
const catalogResponse = await fetch('/api/v1/catalog');
const { catalog } = await catalogResponse.json();

// Populate UI with options
populateFabricSelector(catalog.fabrics);
populateGSMSelector(catalog.gsms);
populateSizeSelector(catalog.sizes);
populateColorSelector(catalog.colors);

// Calculate price when user changes any option
async function updatePrice() {
  const config = {
    fabricId: document.getElementById('fabric').value,
    gsmId: document.getElementById('gsm').value,
    sizeId: document.getElementById('size').value,
    colorId: document.getElementById('color').value,
    quantity: parseInt(document.getElementById('quantity').value)
  };

  const response = await fetch('/api/v1/catalog/price', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });

  const { price, pricePerItem } = await response.json();
  
  document.getElementById('total-price').textContent = `₹${price}`;
  document.getElementById('per-item-price').textContent = `₹${pricePerItem} per item`;
}

// Attach event listeners
document.querySelectorAll('select, input').forEach(element => {
  element.addEventListener('change', updatePrice);
});
```

---

## Performance Considerations

### Caching Strategy

- **Cache Duration:** 1 hour (3600 seconds)
- **Cache Keys:**
  - `catalog:fabrics` - All fabrics
  - `catalog:gsms` - All GSM options
  - `catalog:sizes` - All sizes
  - `catalog:colors` - All colors
  - `catalog:pricing` - Base price
  - `catalog:all` - Complete catalog

### Cache Invalidation

Cache is automatically invalidated when:
- Admin updates any catalog option
- Admin changes pricing
- Admin activates/deactivates options

### Best Practices

1. **Fetch complete catalog once** on page load instead of individual endpoints
2. **Cache catalog data** on the client side
3. **Debounce price calculations** when user is typing quantity
4. **Validate selections** before calling price endpoint
5. **Handle errors gracefully** with user-friendly messages

---

## Related Documentation

- [Design API Endpoints](./API_DESIGN_ENDPOINTS.md) - AI design generation endpoints
- [Authentication](./AUTHENTICATION.md) - User authentication and authorization
- [Admin Catalog Management](./ADMIN_CATALOG_MANAGEMENT.md) - Admin endpoints for managing catalog (coming soon)

---

## Support

For API support or to report issues:
- Email: api-support@printai.com
- Documentation: https://docs.printai.com
