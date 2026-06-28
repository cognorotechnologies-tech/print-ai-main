# Product API Endpoints

This document describes the product configuration and pricing API endpoints for the PrintAI platform.

## Base URL

All endpoints are prefixed with `/api/products`

## Note on API Versioning

These endpoints (`/api/products/*`) are aliases for the catalog endpoints (`/api/v1/catalog/*`) to match the design document specification. Both endpoint paths are supported and provide identical functionality.

## Authentication

All product endpoints are **public** and do not require authentication. This allows customers to browse product options and calculate prices before creating an account.

## Caching

Product catalog data is cached in Redis with a 1-hour TTL to improve performance. Cache is automatically invalidated when catalog data is updated by admins.

## Endpoints

### 1. Get Product Catalog

Retrieve all product configuration options in a single request.

**Endpoint:** `GET /api/products/catalog`

**Response:** `200 OK`
```json
{
  "catalog": {
    "fabrics": [...],
    "gsms": [...],
    "sizes": [...],
    "colors": [...],
    "basePrice": 299
  }
}
```

See [Catalog API Documentation](./API_CATALOG_ENDPOINTS.md) for complete response structure.

**Example:**
```bash
curl https://api.printai.com/api/products/catalog
```


---

### 2. Get Configuration Options

Retrieve all available product configuration options (alias for catalog).

**Endpoint:** `GET /api/products/options`

**Response:** `200 OK`
```json
{
  "options": {
    "fabrics": [...],
    "gsms": [...],
    "sizes": [...],
    "colors": [...],
    "basePrice": 299
  }
}
```

**Notes:**
- Returns the same data as `/api/products/catalog` but wrapped in an `options` key
- Provided for semantic clarity when requesting configuration options

**Example:**
```bash
curl https://api.printai.com/api/products/options
```

---

### 3. Calculate Price

Calculate the total price for a product configuration.

**Endpoint:** `POST /api/products/price`

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

**Price Calculation Formula:**
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

- `400 Bad Request`: Invalid field types
  ```json
  {
    "error": "All configuration IDs must be strings"
  }
  ```

- `400 Bad Request`: Invalid quantity
  ```json
  {
    "error": "Quantity must be an integer between 1 and 100"
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
curl -X POST https://api.printai.com/api/products/price \
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

## Configuration Validation

The price calculation endpoint validates all configuration options:

1. **Required Fields**: All four configuration IDs must be provided
2. **Field Types**: All IDs must be strings
3. **Quantity Validation**: Must be an integer between 1 and 100
4. **Option Validation**: Each option must exist in the database and be active
5. **Combination Validation**: The system validates that the selected combination is available

## Usage Flow

### Product Configuration Flow

1. **Fetch product options** → `GET /api/products/catalog` or `GET /api/products/options`
2. **Display configuration UI** → Show dropdowns/selectors for each option
3. **User selects options** → Store selected IDs
4. **Calculate price in real-time** → `POST /api/products/price` on each change
5. **Display updated price** → Show total and per-item price
6. **Add to cart** → Use selected IDs and calculated price

### Example Implementation (JavaScript)

```javascript
// Fetch product options on page load
const response = await fetch('/api/products/catalog');
const { catalog } = await response.json();

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

  const response = await fetch('/api/products/price', {
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
- **Cache Keys:** Same as catalog endpoints
- **Cache Invalidation:** Automatic when catalog data is updated by admins

### Best Practices

1. **Fetch complete catalog once** on page load instead of individual requests
2. **Cache catalog data** on the client side
3. **Debounce price calculations** when user is typing quantity
4. **Validate selections** before calling price endpoint
5. **Handle errors gracefully** with user-friendly messages

---

## Relationship to Catalog API

The product endpoints (`/api/products/*`) are aliases for the catalog endpoints (`/api/v1/catalog/*`):

| Product Endpoint | Catalog Endpoint | Purpose |
|------------------|------------------|---------|
| `GET /api/products/catalog` | `GET /api/v1/catalog` | Get complete catalog |
| `GET /api/products/options` | `GET /api/v1/catalog` | Get configuration options |
| `POST /api/products/price` | `POST /api/v1/catalog/price` | Calculate price |

Both endpoint paths are supported and provide identical functionality. Use whichever path best fits your application's naming conventions.

---

## Related Documentation

- [Catalog API Endpoints](./API_CATALOG_ENDPOINTS.md) - Detailed catalog endpoint documentation
- [Design API Endpoints](./API_DESIGN_ENDPOINTS.md) - AI design generation endpoints
- [Authentication](./AUTHENTICATION.md) - User authentication and authorization

---

## Support

For API support or to report issues:
- Email: api-support@printai.com
- Documentation: https://docs.printai.com


---

### 4. Generate Product Mockup

Generate a realistic product mockup preview by overlaying a design on a T-shirt template with the selected color.

**Endpoint:** `POST /api/products/mockup`

**Request Body:**
```json
{
  "designUrl": "https://res.cloudinary.com/cloud/image/upload/designs/user123/design456.jpg",
  "colorId": "color-uuid-1",
  "placement": "front"
}
```

**Parameters:**
- `designUrl` (string, required): Full Cloudinary URL of the design image
- `colorId` (string, required): ID of the T-shirt color from catalog
- `placement` (string, optional): Design placement - "front" or "back" (default: "front")

**Response:** `200 OK`
```json
{
  "mockup": {
    "mockupUrl": "https://res.cloudinary.com/cloud/image/upload/t_mockup/designs/user123/design456.jpg",
    "colorName": "White",
    "placement": "front"
  }
}
```

**Response Fields:**
- `mockupUrl` (string): Signed URL of the generated mockup (expires in 1 hour)
- `colorName` (string): Name of the T-shirt color
- `placement` (string): Design placement location

**Error Responses:**

- `400 Bad Request`: Missing or invalid designUrl
  ```json
  {
    "error": "designUrl is required and must be a string"
  }
  ```

- `400 Bad Request`: Missing or invalid colorId
  ```json
  {
    "error": "colorId is required and must be a string"
  }
  ```

- `400 Bad Request`: Invalid placement value
  ```json
  {
    "error": "placement must be either \"front\" or \"back\""
  }
  ```

- `400 Bad Request`: Inactive color
  ```json
  {
    "error": "Color is not active"
  }
  ```

- `404 Not Found`: Color not found
  ```json
  {
    "error": "Color not found"
  }
  ```

- `500 Internal Server Error`: Mockup generation failed
  ```json
  {
    "error": "Failed to generate mockup"
  }
  ```

**Example:**
```bash
curl -X POST https://api.printai.com/api/products/mockup \
  -H "Content-Type: application/json" \
  -d '{
    "designUrl": "https://res.cloudinary.com/cloud/image/upload/designs/user123/design456.jpg",
    "colorId": "color-uuid-1",
    "placement": "front"
  }'
```

**Performance:**
- Mockup generation typically completes in < 3 seconds
- Generated mockup URLs are signed and expire after 1 hour
- Uses Cloudinary's transformation API for efficient image processing
- Mockup dimensions: 800x800 pixels
- Image quality: auto-optimized by Cloudinary

**Implementation Details:**

The mockup generation service:
1. Validates the request parameters
2. Fetches the color details from the catalog
3. Extracts the Cloudinary public ID from the design URL
4. Applies image transformations to create the mockup effect:
   - Resizes to 800x800 pixels
   - Applies color overlay to simulate T-shirt color
   - Optimizes quality and format automatically
5. Generates a signed URL with 1-hour expiration
6. Returns the mockup URL with color and placement information

**Usage Example (JavaScript):**

```javascript
// Generate mockup preview when user selects a color
async function generateMockup(designUrl, colorId, placement = 'front') {
  try {
    const response = await fetch('/api/products/mockup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designUrl, colorId, placement })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const { mockup } = await response.json();
    
    // Display mockup in UI
    document.getElementById('mockup-preview').src = mockup.mockupUrl;
    document.getElementById('color-name').textContent = mockup.colorName;
    
    return mockup;
  } catch (error) {
    console.error('Failed to generate mockup:', error);
    // Show error message to user
  }
}

// Update mockup when color changes
document.getElementById('color-selector').addEventListener('change', (e) => {
  const designUrl = getCurrentDesignUrl();
  const colorId = e.target.value;
  generateMockup(designUrl, colorId);
});
```

---

## Mockup Generation

### Color Variations

The mockup service supports generating previews for multiple color variations:

```javascript
// Generate mockups for all available colors
async function generateColorVariations(designUrl, colors) {
  const mockups = await Promise.all(
    colors.map(color => 
      fetch('/api/products/mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designUrl,
          colorId: color.id,
          placement: 'front'
        })
      }).then(res => res.json())
    )
  );
  
  return mockups.map(m => m.mockup);
}
```

### Placement Views

Generate both front and back placement views:

```javascript
// Generate both front and back mockups
async function generateBothPlacements(designUrl, colorId) {
  const [frontMockup, backMockup] = await Promise.all([
    generateMockup(designUrl, colorId, 'front'),
    generateMockup(designUrl, colorId, 'back')
  ]);
  
  return { front: frontMockup, back: backMockup };
}
```

### Caching Mockup URLs

Since mockup URLs expire after 1 hour, implement client-side caching:

```javascript
const mockupCache = new Map();
const CACHE_DURATION = 50 * 60 * 1000; // 50 minutes (before 1-hour expiration)

async function getCachedMockup(designUrl, colorId, placement) {
  const cacheKey = `${designUrl}-${colorId}-${placement}`;
  const cached = mockupCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.mockup;
  }
  
  const mockup = await generateMockup(designUrl, colorId, placement);
  mockupCache.set(cacheKey, { mockup, timestamp: Date.now() });
  
  return mockup;
}
```

---

## Requirements Validation

This implementation satisfies the following requirements:

### Product Configuration
- **Requirement 4.1**: Fabric type selection ✓
- **Requirement 4.2**: GSM options ✓
- **Requirement 4.3**: Size options ✓
- **Requirement 4.4**: Color options ✓
- **Requirement 4.5**: Price updates on configuration change ✓
- **Requirement 4.6**: Configuration validation ✓

### Mockup Preview
- **Requirement 5.1**: Realistic mockup preview ✓
- **Requirement 5.2**: T-shirt color reflection in preview ✓
- **Requirement 5.3**: Mockup update within 3 seconds ✓
- **Requirement 5.4**: Correct design proportions and placement ✓
- **Requirement 5.5**: Front and back placement views ✓

### Performance
- **Requirement 23.3**: Caching for frequently accessed data ✓
- **Requirement 23.5**: Optimized image processing ✓

