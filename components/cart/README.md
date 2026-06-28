# Shopping Cart Component

A fully-featured shopping cart component for the PrintAI platform that displays cart items, allows quantity updates, item removal, and checkout.

## Features

- **Cart Display**: Shows all items with design previews, configuration details, and prices
- **Quantity Management**: Increment/decrement quantity with real-time price updates
- **Item Removal**: Remove individual items or clear entire cart
- **Order Summary**: Displays total items, prices, and shipping information
- **Empty State**: User-friendly message when cart is empty
- **Responsive Design**: Optimized for mobile, tablet, and desktop viewports
- **Loading States**: Visual feedback during API operations
- **Error Handling**: Graceful error messages with retry options
- **Trust Badges**: Security and quality assurance indicators

## Usage

### Basic Usage

```tsx
import ShoppingCart from '@/components/cart/ShoppingCart';

export default function CartPage() {
  return <ShoppingCart />;
}
```

### With Checkout Callback

```tsx
import ShoppingCart from '@/components/cart/ShoppingCart';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();

  const handleCheckout = () => {
    router.push('/checkout');
  };

  return <ShoppingCart onCheckout={handleCheckout} />;
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onCheckout` | `() => void` | No | Callback function called when user clicks "Proceed to Checkout" |

## API Integration

The component integrates with the following cart API endpoints:

- `GET /api/cart` - Fetch cart items
- `PUT /api/cart/items/:id` - Update item quantity
- `DELETE /api/cart/items/:id` - Remove item
- `DELETE /api/cart` - Clear cart

All requests include the JWT token from localStorage for authentication.

## Component Structure

### Cart Items Section
- Design preview image
- Design prompt/title
- Configuration details (fabric, GSM, size, color)
- Quantity controls (increment/decrement)
- Price per item and total price
- Remove item button

### Order Summary Section
- Total items count
- Subtotal price
- Shipping information (FREE)
- Total price
- Checkout button
- Continue shopping link
- Trust badges

## Responsive Behavior

### Mobile (< 640px)
- Single column layout
- Full-width cart items
- Stacked item details
- Touch-optimized buttons

### Tablet (640px - 1024px)
- Two-column layout for item details
- Improved spacing
- Larger touch targets

### Desktop (> 1024px)
- Side-by-side cart items and order summary
- Sticky order summary
- Optimized for mouse interactions

## State Management

The component manages the following states:

- `cart`: Cart data with items and totals
- `loading`: Initial cart loading state
- `error`: Error messages
- `updatingItems`: Set of item IDs being updated
- `removingItems`: Set of item IDs being removed

## Error Handling

The component handles various error scenarios:

- **Authentication Error (401)**: "Please log in to view your cart"
- **Network Error**: "Failed to load cart" with retry button
- **Update Error**: Alert with specific error message
- **Remove Error**: Alert with specific error message

## Accessibility

- Semantic HTML elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus indicators
- Alt text for images
- Color contrast compliance

## Testing

Comprehensive test suite covering:

- Loading states
- Empty cart state
- Cart display with items
- Quantity updates
- Item removal
- Cart clearing
- Checkout callback
- Error handling
- Authentication
- Responsive design

Run tests:
```bash
npm test -- components/cart/ShoppingCart.test.tsx
```

## Dependencies

- React 18+
- Next.js 14+
- Tailwind CSS
- localStorage (for JWT token)

## Related Components

- `ProductConfigurator` - Add items to cart
- `DesignStudio` - Create designs for products
- Checkout flow (to be implemented)

## Future Enhancements

- [ ] Optimistic UI updates
- [ ] Undo item removal
- [ ] Save for later functionality
- [ ] Promo code support
- [ ] Estimated delivery dates
- [ ] Gift options
- [ ] Bulk actions (select multiple items)
- [ ] Cart persistence across devices
- [ ] Real-time cart sync with WebSocket

## Notes

- Cart data is fetched on component mount
- All cart operations require authentication
- Prices are calculated server-side
- Cart persists across sessions for authenticated users
- Free shipping is applied to all orders
