import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CheckoutForm from './CheckoutForm';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock PaymentHandler
vi.mock('./PaymentHandler', () => ({
  default: ({ onSuccess }: any) => (
    <div data-testid="payment-handler">
      <button onClick={() => onSuccess('test-order-id')}>Complete Payment</button>
    </div>
  ),
}));

describe('CheckoutForm', () => {
  const mockCart = {
    items: [
      {
        id: '1',
        quantity: 1,
        price: 500,
        design: { imageUrl: 'test.jpg', prompt: 'Test Design' },
        fabric: { name: 'Cotton' },
        gsm: { value: 180 },
        size: { name: 'M' },
        color: { name: 'Black', hexCode: '#000000' },
      },
    ],
    totalItems: 1,
    totalPrice: 500,
  };

  it('renders shipping address form', () => {
    render(<CheckoutForm cart={mockCart} />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pincode/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<CheckoutForm cart={mockCart} />);

    const submitButton = screen.getByRole('button', { name: /proceed to payment/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/phone number is required/i)).toBeInTheDocument();
      expect(screen.getByText(/address is required/i)).toBeInTheDocument();
    });
  });

  it('validates phone number format', async () => {
    render(<CheckoutForm cart={mockCart} />);

    const phoneInput = screen.getByLabelText(/phone number/i);
    fireEvent.change(phoneInput, { target: { value: '123' } });

    const submitButton = screen.getByRole('button', { name: /proceed to payment/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/valid 10-digit mobile number/i)).toBeInTheDocument();
    });
  });

  it('validates pincode format', async () => {
    render(<CheckoutForm cart={mockCart} />);

    const pincodeInput = screen.getByLabelText(/pincode/i);
    fireEvent.change(pincodeInput, { target: { value: '123' } });

    const submitButton = screen.getByRole('button', { name: /proceed to payment/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/valid 6-digit pincode/i)).toBeInTheDocument();
    });
  });

  it('accepts valid form data', async () => {
    render(<CheckoutForm cart={mockCart} />);

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: '9876543210' },
    });
    fireEvent.change(screen.getByLabelText(/address line 1/i), {
      target: { value: '123 Main St' },
    });
    fireEvent.change(screen.getByLabelText(/city/i), {
      target: { value: 'Mumbai' },
    });
    fireEvent.change(screen.getByLabelText(/state/i), {
      target: { value: 'Maharashtra' },
    });
    fireEvent.change(screen.getByLabelText(/pincode/i), {
      target: { value: '400001' },
    });

    const submitButton = screen.getByRole('button', { name: /proceed to payment/i });
    fireEvent.click(submitButton);

    // Should not show validation errors
    await waitFor(() => {
      expect(screen.queryByText(/is required/i)).not.toBeInTheDocument();
    });
  });
});
