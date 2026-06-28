import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrderList from './OrderList';

describe('OrderList', () => {
  it('renders empty state when no orders', () => {
    render(<OrderList orders={[]} />);
    
    expect(screen.getByText('No orders yet')).toBeInTheDocument();
    expect(screen.getByText('Start creating your custom designs!')).toBeInTheDocument();
  });

  it('renders order list with orders', () => {
    const mockOrders = [
      {
        id: 'order-1',
        orderNumber: 'ORD-123',
        status: 'SHIPPED',
        totalAmount: 1500,
        createdAt: '2024-01-15T10:30:00.000Z',
        estimatedDelivery: '2024-01-20T00:00:00.000Z',
        items: [
          {
            id: 'item-1',
            quantity: 2,
            price: 1500,
            design: {
              id: 'design-1',
              imageUrl: 'https://example.com/design.jpg',
              prompt: 'Cool design',
            },
          },
        ],
      },
    ];

    render(<OrderList orders={mockOrders} />);
    
    expect(screen.getByText('Order ORD-123')).toBeInTheDocument();
    expect(screen.getByText('Shipped')).toBeInTheDocument();
    expect(screen.getByText('₹1500.00')).toBeInTheDocument();
  });

  it('displays correct status badge colors', () => {
    const mockOrders = [
      {
        id: 'order-1',
        orderNumber: 'ORD-123',
        status: 'DELIVERED',
        totalAmount: 1500,
        createdAt: '2024-01-15T10:30:00.000Z',
        estimatedDelivery: null,
        items: [
          {
            id: 'item-1',
            quantity: 1,
            price: 1500,
            design: {
              id: 'design-1',
              imageUrl: 'https://example.com/design.jpg',
              prompt: 'Test design',
            },
          },
        ],
      },
    ];

    render(<OrderList orders={mockOrders} />);
    
    const statusBadge = screen.getByText('Delivered');
    expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('shows item count correctly', () => {
    const mockOrders = [
      {
        id: 'order-1',
        orderNumber: 'ORD-123',
        status: 'PAID',
        totalAmount: 3000,
        createdAt: '2024-01-15T10:30:00.000Z',
        estimatedDelivery: '2024-01-20T00:00:00.000Z',
        items: [
          {
            id: 'item-1',
            quantity: 2,
            price: 1500,
            design: {
              id: 'design-1',
              imageUrl: 'https://example.com/design1.jpg',
              prompt: 'Design 1',
            },
          },
          {
            id: 'item-2',
            quantity: 3,
            price: 1500,
            design: {
              id: 'design-2',
              imageUrl: 'https://example.com/design2.jpg',
              prompt: 'Design 2',
            },
          },
        ],
      },
    ];

    render(<OrderList orders={mockOrders} />);
    
    expect(screen.getByText('5 items')).toBeInTheDocument();
  });

  it('displays estimated delivery for non-delivered orders', () => {
    const mockOrders = [
      {
        id: 'order-1',
        orderNumber: 'ORD-123',
        status: 'SHIPPED',
        totalAmount: 1500,
        createdAt: '2024-01-15T10:30:00.000Z',
        estimatedDelivery: '2024-01-25T00:00:00.000Z',
        items: [
          {
            id: 'item-1',
            quantity: 1,
            price: 1500,
            design: {
              id: 'design-1',
              imageUrl: 'https://example.com/design.jpg',
              prompt: 'Test design',
            },
          },
        ],
      },
    ];

    render(<OrderList orders={mockOrders} />);
    
    expect(screen.getByText(/Est\. delivery:/)).toBeInTheDocument();
  });
});
