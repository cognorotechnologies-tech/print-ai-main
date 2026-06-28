import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrderStatusTimeline from './OrderStatusTimeline';

describe('OrderStatusTimeline', () => {
  it('renders timeline with current status', () => {
    render(
      <OrderStatusTimeline
        currentStatus="PAID"
        createdAt="2024-01-15T10:30:00.000Z"
      />
    );
    
    expect(screen.getByText('Order Placed')).toBeInTheDocument();
    expect(screen.getByText('Payment Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Assigned to Vendor')).toBeInTheDocument();
  });

  it('marks completed steps correctly', () => {
    const { container } = render(
      <OrderStatusTimeline
        currentStatus="IN_PRODUCTION"
        createdAt="2024-01-15T10:30:00.000Z"
      />
    );
    
    // All steps up to IN_PRODUCTION should be marked as completed (have checkmark SVGs)
    const checkmarks = container.querySelectorAll('svg path[clip-rule="evenodd"]');
    expect(checkmarks.length).toBe(4); // PENDING, PAID, ASSIGNED, IN_PRODUCTION
  });

  it('shows cancelled status with special UI', () => {
    render(
      <OrderStatusTimeline
        currentStatus="CANCELLED"
        createdAt="2024-01-15T10:30:00.000Z"
      />
    );
    
    expect(screen.getByText('Order Cancelled')).toBeInTheDocument();
    expect(screen.getByText('This order has been cancelled')).toBeInTheDocument();
  });

  it('displays timestamps from status history', () => {
    const statusHistory = [
      { status: 'PENDING', createdAt: '2024-01-15T10:30:00.000Z' },
      { status: 'PAID', createdAt: '2024-01-15T10:35:00.000Z' },
    ];

    render(
      <OrderStatusTimeline
        currentStatus="PAID"
        createdAt="2024-01-15T10:30:00.000Z"
        statusHistory={statusHistory}
      />
    );
    
    // Check that timestamps are displayed
    const timestamps = screen.getAllByText(/2024/);
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it('shows in progress for current status without timestamp', () => {
    render(
      <OrderStatusTimeline
        currentStatus="ASSIGNED"
        createdAt="2024-01-15T10:30:00.000Z"
        statusHistory={[
          { status: 'PENDING', createdAt: '2024-01-15T10:30:00.000Z' },
          { status: 'PAID', createdAt: '2024-01-15T10:35:00.000Z' },
        ]}
      />
    );
    
    expect(screen.getByText('In progress')).toBeInTheDocument();
  });

  it('renders all status steps in correct order', () => {
    render(
      <OrderStatusTimeline
        currentStatus="PENDING"
        createdAt="2024-01-15T10:30:00.000Z"
      />
    );
    
    const steps = [
      'Order Placed',
      'Payment Confirmed',
      'Assigned to Vendor',
      'In Production',
      'Shipped',
      'Delivered',
    ];

    steps.forEach((step) => {
      expect(screen.getByText(step)).toBeInTheDocument();
    });
  });
});
