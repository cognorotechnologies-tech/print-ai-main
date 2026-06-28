# Order Tracking Components

This directory contains reusable components for order tracking and management functionality.

## Components

### OrderList

Displays a list of orders with preview images, status badges, and basic order information.

**Props:**
- `orders`: Array of order objects

**Features:**
- Empty state with call-to-action
- Order preview with design thumbnails
- Status badges with color coding
- Responsive grid layout
- Click to view order details

**Usage:**
```tsx
import OrderList from '@/components/orders/OrderList';

<OrderList orders={orders} />
```

### OrderDetails

Shows comprehensive order information including items, shipping address, and payment details.

**Props:**
- `order`: Complete order object with items and shipping information

**Features:**
- Order items with design previews
- Product configuration details (fabric, GSM, size, color)
- Shipping address display
- Tracking number (when available)
- Estimated delivery date
- Payment status
- Responsive layout

**Usage:**
```tsx
import OrderDetails from '@/components/orders/OrderDetails';

<OrderDetails order={order} />
```

### OrderStatusTimeline

Visual timeline showing order status progression from placement to delivery.

**Props:**
- `currentStatus`: Current order status
- `createdAt`: Order creation timestamp
- `statusHistory`: Optional array of status change records

**Features:**
- Visual progress indicator
- Completed/current/pending status states
- Timestamps for each status change
- Special handling for cancelled orders
- Responsive design

**Status Flow:**
1. PENDING - Order Placed
2. PAID - Payment Confirmed
3. ASSIGNED - Assigned to Vendor
4. IN_PRODUCTION - In Production
5. SHIPPED - Shipped
6. DELIVERED - Delivered

**Usage:**
```tsx
import OrderStatusTimeline from '@/components/orders/OrderStatusTimeline';

<OrderStatusTimeline
  currentStatus={order.status}
  createdAt={order.createdAt}
  statusHistory={order.statusHistory}
/>
```

### OrderCancellation

Provides UI for cancelling orders with confirmation dialog and optional reason input.

**Props:**
- `orderId`: Order ID
- `orderNumber`: Order number for display
- `status`: Current order status
- `onCancel`: Callback function called after successful cancellation

**Features:**
- Only shows for cancellable orders (not DELIVERED or CANCELLED)
- Confirmation dialog with reason input
- Refund information display
- Loading states
- Error handling
- API integration

**Usage:**
```tsx
import OrderCancellation from '@/components/orders/OrderCancellation';

<OrderCancellation
  orderId={order.id}
  orderNumber={order.orderNumber}
  status={order.status}
  onCancel={handleOrderCancelled}
/>
```

## Pages

### /app/orders/page.tsx

Order history page displaying all orders for the authenticated user.

**Features:**
- Fetches orders from `/api/orders`
- Authentication check
- Loading and error states
- Uses OrderList component

### /app/orders/[id]/page.tsx

Order details page with dynamic routing for individual orders.

**Features:**
- Fetches order details from `/api/orders/:id`
- Authentication and authorization checks
- Back navigation to order list
- Order cancellation functionality
- Uses OrderDetails, OrderStatusTimeline, and OrderCancellation components
- Responsive two-column layout (details + timeline)

## API Integration

All components expect data from the following API endpoints:

- `GET /api/orders` - List all orders for authenticated user
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/cancel` - Cancel order

## Styling

Components use Tailwind CSS with the following design patterns:
- Primary color scheme (blue)
- Status-based color coding
- Responsive breakpoints (sm, lg)
- Consistent spacing and typography
- Card-based layouts with borders and shadows

## Status Colors

```typescript
const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-blue-100 text-blue-800',
  ASSIGNED: 'bg-purple-100 text-purple-800',
  IN_PRODUCTION: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-green-100 text-green-800',
  DELIVERED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};
```

## Mobile Responsiveness

All components are fully responsive:
- Mobile-first design approach
- Flexible layouts that adapt to screen size
- Touch-friendly interactive elements
- Optimized image loading
- Readable typography on all devices

## Error Handling

Components include comprehensive error handling:
- Network error messages
- Authentication redirects
- Permission checks
- User-friendly error displays
- Retry functionality

## Future Enhancements

Potential improvements:
- Real-time status updates via WebSocket
- Order filtering and search
- Bulk order actions
- Export order history
- Order rating and feedback
- Reorder functionality
