import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrderSummary from './OrderSummary';

describe('OrderSummary', () => {
  const mockCart = {
    items: [
      {
        id: '1',
        quantity: 2,
        price: 1000,
        design: {
          imageUrl: 'https://example.com/design1.jpg',
          prompt: 'Cool T-shirt Design',
        },
        fabric: { name: 'Cotton' },
        gsm: { value: 180 },
        size: { name: 'M' },
        color: { name: 'Black', hexCode: '#000000' },
      },
      {
        id: '2',
        quantity: 1,
        price: 600,
        design: {
          imageUrl: 'https://example.com/design2.jpg',
          prompt: 'Another Design',
        },
        fabric: { name: 'Polyester' },
        gsm: { value: 200 },
        size: { name: 'L' },
        color: { name: 'White', hexCode: '#FFFFFF' },
      },
    ],
    totalItems: 3,
    totalPrice: 1600,
  };

  it('renders order summary heading', () => {
    render(<OrderSummary cart={mockCart} />);
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
  });

  it('displays all cart items', () => {
    render(<OrderSummary cart={mockCart} />);

    expect(screen.getByText('Cool T-shirt Design')).toBeInTheDocument();
    expect(screen.getByText('Another Design')).toBeInTheDocument();
  });

  it('displays item details correctly', () => {
    render(<OrderSummary cart={mockCart} />);

    // Check first item details
    expect(screen.getByText(/Cotton/)).toBeInTheDocument();
    expect(screen.getByText(/180GSM/)).toBeInTheDocument();

    // Check second item details
    expect(screen.getByText(/Polyester/)).toBeInTheDocument();
    expect(screen.getByText(/200GSM/)).toBeInTheDocument();
  });

  it('displays correct quantities', () => {
    render(<OrderSummary cart={mockCart} />);

    const quantities = screen.getAllByText(/Qty:/);
    expect(quantities).toHaveLength(2);
  });

  it('displays correct prices', () => {
    render(<OrderSummary cart={mockCart} />);

    expect(screen.getByText('₹1000.00')).toBeInTheDocument();
    expect(screen.getByText('₹600.00')).toBeInTheDocument();
  });

  it('displays subtotal with item count', () => {
    render(<OrderSummary cart={mockCart} />);

    expect(screen.getByText(/Subtotal \(3 items\):/)).toBeInTheDocument();
    const prices = screen.getAllByText('₹1600.00');
    expect(prices.length).toBeGreaterThan(0);
  });

  it('displays free shipping', () => {
    render(<OrderSummary cart={mockCart} />);

    expect(screen.getByText('Shipping:')).toBeInTheDocument();
    expect(screen.getByText('FREE')).toBeInTheDocument();
  });

  it('displays total price', () => {
    render(<OrderSummary cart={mockCart} />);

    const totalLabels = screen.getAllByText('Total:');
    expect(totalLabels.length).toBeGreaterThan(0);
  });

  it('displays trust badges', () => {
    render(<OrderSummary cart={mockCart} />);

    expect(screen.getByText('Secure payment')).toBeInTheDocument();
    expect(screen.getByText('Free shipping')).toBeInTheDocument();
    expect(screen.getByText('Quality guaranteed')).toBeInTheDocument();
  });

  it('renders item images', () => {
    render(<OrderSummary cart={mockCart} />);

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'https://example.com/design1.jpg');
    expect(images[1]).toHaveAttribute('src', 'https://example.com/design2.jpg');
  });
});
