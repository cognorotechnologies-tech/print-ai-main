# Checkout Components

This directory contains reusable components for the checkout flow, including address collection, payment integration, and order summary display.

## Components

### CheckoutForm

The main checkout form component that handles shipping address collection and order creation.

**Features:**
- Shipping address form with validation
- Indian phone number and pincode validation
- Real-time error display
- Order creation via API
- Seamless handoff to payment flow

**Props:**
- `cart: CartData` - Cart data containing items and totals

**Usage:**
```tsx
import CheckoutForm from '@/components/checkout/CheckoutForm';

<CheckoutForm cart={cartData} />
```

### OrderSummary

Displays a summary of cart items and pricing for the checkout page.

**Features:**
- Scrollable item list with thumbnails
- Item details (fabric, GSM, size, color)
- Price breakdown (subtotal, shipping, total)
- Trust badges for security and quality

**Props:**
- `cart: CartData` - Cart data containing items and totals

**Usage:**
```tsx
import OrderSummary from '@/components/checkout/OrderSummary';

<OrderSummary cart={cartData} />
```

### PaymentHandler

Handles Razorpay payment integration and payment flow management.

**Features:**
- Razorpay script loading
- Payment order creation
- Razorpay checkout UI integration
- Payment verification
- Success/failure handling
- Payment retry functionality

**Props:**
- `orderId: string` - Order ID for payment
- `amount: number` - Payment amount in rupees
- `onSuccess: (orderId: string) => void` - Success callback
- `onFailure: (error: string) => void` - Failure callback

**Usage:**
```tsx
import PaymentHandler from '@/components/checkout/PaymentHandler';

<PaymentHandler
  orderId="order-123"
  amount={500}
  onSuccess={(orderId) => router.push(`/orders/confirmation/${orderId}`)}
  onFailure={(error) => setError(error)}
/>
```

## Checkout Flow

1. **Cart Review**: User reviews cart at `/cart` and clicks "Proceed to Checkout"
2. **Checkout Page**: User lands on `/checkout` with cart summary and address form
3. **Address Entry**: User fills shipping address with validation
4. **Order Creation**: On form submit, order is created via `POST /api/orders`
5. **Payment Initiation**: PaymentHandler creates Razorpay order via `POST /api/payments/create`
6. **Razorpay Checkout**: Razorpay modal opens for payment
7. **Payment Verification**: On success, payment is verified via `POST /api/payments/verify`
8. **Order Confirmation**: User is redirected to `/orders/confirmation/[id]`

## Payment Integration

The checkout flow integrates with Razorpay for payment processing:

1. **Script Loading**: Razorpay checkout script is loaded dynamically
2. **Order Creation**: Backend creates Razorpay order with amount
3. **Checkout UI**: Razorpay modal handles payment collection
4. **Signature Verification**: Backend verifies payment signature for security
5. **Order Update**: Order status is updated to PAID on successful verification

## Error Handling

### Form Validation Errors
- Missing required fields
- Invalid phone number format (must be 10 digits starting with 6-9)
- Invalid pincode format (must be 6 digits)
- Displayed inline below each field

### API Errors
- Order creation failure: Displayed at top of form, allows retry
- Payment creation failure: Displayed with retry button
- Payment verification failure: Displayed with retry button
- Network errors: User-friendly messages with retry options

### Payment Cancellation
- User can close Razorpay modal to cancel
- Order remains in PENDING status
- User can retry payment from orders page

## Responsive Design

All checkout components are fully responsive:
- Mobile: Single column layout, full-width forms
- Tablet: Optimized spacing and touch targets
- Desktop: Two-column layout (form + summary)

## Security

- JWT authentication required for all API calls
- Razorpay signature verification on backend
- HTTPS for all payment communication
- No card details stored locally or in database
- CSRF protection on state-changing operations

## Testing

Test the checkout flow:
1. Add items to cart
2. Navigate to checkout
3. Fill address form with valid data
4. Use Razorpay test cards for payment
5. Verify order confirmation page displays correctly

Test error scenarios:
1. Invalid address data (validation errors)
2. Payment cancellation (modal dismiss)
3. Payment failure (test card)
4. Network errors (offline mode)

## Requirements Validated

This implementation validates:
- **Requirement 7.1**: Order creation from cart with shipping address
- **Requirement 7.3**: Razorpay integration with multiple payment methods
- **Requirement 7.4**: Payment success handling and order confirmation
- **Requirement 7.5**: Payment failure handling with retry capability
- **Requirement 26.1**: Responsive design for all devices
