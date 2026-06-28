# Payment Service Documentation

## Overview

The Payment Service handles all payment-related operations for the PrintAI platform using Razorpay as the payment gateway. It provides secure payment processing, signature verification, callback handling with idempotency, refund processing, and comprehensive transaction logging.

## Features

### 1. Razorpay Order Creation
- Creates Razorpay orders for payment processing
- Converts amounts to paise (smallest currency unit)
- Stores order metadata for tracking
- Returns order details including Razorpay key ID for frontend integration

### 2. Payment Signature Verification
- Verifies Razorpay webhook signatures using HMAC SHA256
- Ensures payment callbacks are authentic and not tampered with
- Protects against fraudulent payment confirmations

### 3. Payment Callback Handling
- Processes payment callbacks with idempotency support
- Prevents duplicate payment processing
- Updates order status on successful payment
- Clears customer cart after successful payment
- Comprehensive error handling and logging

### 4. Refund Processing
- Supports full and partial refunds
- Integrates with Razorpay refund API
- Updates order payment status
- Logs all refund transactions

### 5. Transaction Logging
- Logs all payment transactions for reconciliation
- Includes order ID, Razorpay IDs, amounts, and status
- Structured logging for easy searching and filtering
- Audit trail for compliance

## API Functions

### `createRazorpayOrder(input: CreateOrderInput): Promise<CreateOrderResponse>`

Creates a new Razorpay order for payment.

**Input:**
```typescript
{
  orderId: string;      // Internal order ID
  amount: number;       // Amount in rupees
  currency?: string;    // Currency code (default: 'INR')
  receipt?: string;     // Receipt identifier (default: orderId)
}
```

**Output:**
```typescript
{
  razorpayOrderId: string;  // Razorpay order ID
  amount: number;           // Amount in paise
  currency: string;         // Currency code
  keyId: string;            // Razorpay key ID for frontend
}
```

### `verifyPaymentSignature(input: VerifyPaymentInput): boolean`

Verifies the authenticity of a Razorpay payment callback.

**Input:**
```typescript
{
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}
```

**Returns:** `true` if signature is valid, `false` otherwise

### `handlePaymentCallback(input: PaymentCallbackInput): Promise<Order>`

Processes payment callback with idempotency.

**Input:**
```typescript
{
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}
```

**Returns:** Updated order with payment status

### `processRefund(input: RefundInput): Promise<RefundResponse>`

Processes a refund for a payment.

**Input:**
```typescript
{
  paymentId: string;    // Razorpay payment ID
  amount?: number;      // Refund amount (optional, defaults to full refund)
  reason?: string;      // Refund reason
}
```

**Output:**
```typescript
{
  refundId: string;
  amount: number;
  currency: string;
  status: string;
}
```

### `logPaymentTransaction(transaction): Promise<void>`

Logs payment transaction for reconciliation and audit.

### `fetchPaymentDetails(paymentId: string): Promise<PaymentDetails>`

Fetches payment details from Razorpay.

## Security Best Practices

1. **Never expose Razorpay secret to frontend**
   - Only key ID is sent to frontend
   - Secret is used only on backend for signature verification

2. **Always verify webhook signatures**
   - All payment callbacks must pass signature verification
   - Invalid signatures are rejected and logged

3. **Implement idempotency**
   - Duplicate callbacks are handled gracefully
   - Payment status is checked before processing

4. **Comprehensive logging**
   - All payment operations are logged
   - Failed transactions are logged with error details
   - Logs include timestamps and context for debugging

5. **Error handling**
   - User-friendly error messages
   - Detailed error logging for debugging
   - Graceful degradation on failures

## Environment Variables

```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

## Integration with Order Service

The payment service integrates with the order service to:
- Update order payment status
- Transition order status from PENDING to PAID
- Clear customer cart after successful payment
- Create order status history entries

## Testing

The payment service includes comprehensive unit tests covering:
- Order creation with valid and invalid inputs
- Signature verification with valid and invalid signatures
- Payment callback processing with idempotency
- Refund processing for full and partial amounts
- Transaction logging
- Error handling scenarios

Run tests:
```bash
npm test -- server/services/payment.test.ts
```

## Error Handling

The service handles various error scenarios:
- Invalid amount (zero or negative)
- Razorpay API failures
- Invalid payment signatures
- Order not found
- Duplicate payment callbacks
- Refund failures

All errors are logged with context and appropriate error messages are returned.

## Requirements Validated

This implementation validates the following requirements:
- **7.2**: Razorpay payment gateway integration
- **7.6**: Payment callback handling with signature verification
- **22.5**: Payment transaction logging
- **24.2**: PCI DSS compliance (no card data storage)
