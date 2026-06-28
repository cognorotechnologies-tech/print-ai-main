import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShoppingCart from './ShoppingCart';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window.confirm
const mockConfirm = vi.fn();
window.confirm = mockConfirm;

// Mock window.alert
const mockAlert = vi.fn();
window.alert = mockAlert;

const mockCartData = {
  cart: {
    items: [
      {
        id: 'item-1',
        userId: 'user-1',
        designId: 'design-1',
        fabricId: 'fabric-1',
        gsmId: 'gsm-1',
        sizeId: 'size-1',
        colorId: 'color-1',
        quantity: 2,
        price: 738,
        createdAt: '2024-03-17T00:00:00.000Z',
        updatedAt: '2024-03-17T00:00:00.000Z',
        design: {
          id: 'design-1',
          imageUrl: 'https://example.com/design1.jpg',
          prompt: 'Cool T-shirt design',
        },
        fabric: {
          id: 'fabric-1',
          name: 'Cotton',
        },
        gsm: {
          id: 'gsm-1',
          value: 180,
        },
        size: {
          id: 'size-1',
          name: 'M',
        },
        color: {
          id: 'color-1',
          name: 'White',
          hexCode: '#FFFFFF',
        },
      },
      {
        id: 'item-2',
        userId: 'user-1',
        designId: 'design-2',
        fabricId: 'fabric-2',
        gsmId: 'gsm-2',
        sizeId: 'size-2',
        colorId: 'color-2',
        quantity: 1,
        price: 450,
        createdAt: '2024-03-17T00:00:00.000Z',
        updatedAt: '2024-03-17T00:00:00.000Z',
        design: {
          id: 'design-2',
          imageUrl: 'https://example.com/design2.jpg',
          prompt: 'Awesome graphic',
        },
        fabric: {
          id: 'fabric-2',
          name: 'Polyester',
        },
        gsm: {
          id: 'gsm-2',
          value: 200,
        },
        size: {
          id: 'size-2',
          name: 'L',
        },
        color: {
          id: 'color-2',
          name: 'Black',
          hexCode: '#000000',
        },
      },
    ],
    totalItems: 3,
    totalPrice: 1188,
  },
};

const emptyCartData = {
  cart: {
    items: [],
    totalItems: 0,
    totalPrice: 0,
  },
};

describe('ShoppingCart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading state initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<ShoppingCart />);

      expect(screen.getByText('Loading your cart...')).toBeInTheDocument();
      // Check for the spinner element
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Empty Cart State', () => {
    it('should display empty cart message when cart has no items', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => emptyCartData,
      });

      render(<ShoppingCart />);

      await waitFor(() => {
        expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
      });

      expect(screen.getByText('Add some awesome designs to get started!')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /create a design/i })).toHaveAttribute('href', '/design');
    });
  });

  describe('Cart Display', () => {
    it('should display cart items with correct details', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCartData,
      });

      render(<ShoppingCart />);

      await waitFor(() => {
        expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
      });

      // Check first item
      expect(screen.getByText('Cool T-shirt design')).toBeInTheDocument();
      expect(screen.getByText('Cotton')).toBeInTheDocument();
      expect(screen.getByText('180')).toBeInTheDocument();
      expect(screen.getByText('M')).toBeInTheDocument();
      expect(screen.getByText('White')).toBeInTheDocument();

      // Check second item
      expect(screen.getByText('Awesome graphic')).toBeInTheDocument();
      expect(screen.getByText('Polyester')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
      expect(screen.getByText('L')).toBeInTheDocument();
      expect(screen.getByText('Black')).toBeInTheDocument();
    });

    it('should display correct quantities and prices', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCartData,
      });

      render(<ShoppingCart />);

      await waitFor(() => {
        expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
      });

      // Check quantities
      const quantities = screen.getAllByText(/\d+/);
      expect(quantities.some(el => el.textContent === '2')).toBe(true);
      expect(quantities.some(el => el.textContent === '1')).toBe(true);

      // Check prices
      expect(screen.getByText('₹738.00')).toBeInTheDocument();
      expect(screen.getByText('₹450.00')).toBeInTheDocument();
    });

    it('should display order summary with correct totals', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCartData,
      });

      render(<ShoppingCart />);

      await waitFor(() => {
        expect(screen.getByText('Order Summary')).toBeInTheDocument();
      });

      expect(screen.getByText('Items (3):')).toBeInTheDocument();
      // Use getAllByText since the price appears twice (in items and total)
      const priceElements = screen.getAllByText('₹1188.00');
      expect(priceElements.length).toBeGreaterThan(0);
      expect(screen.getByText('FREE')).toBeInTheDocument();
    });

    it('should display design preview images', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCartData,
      });

      render(<ShoppingCart />);

      await waitFor(() => {
        expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
      });

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(2);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/design1.jpg');
      expect(images[1]).toHaveAttribute('src', 'https://example.com/design2.jpg');
    });
  });

  describe('Quantity Updates', () => {
    it('should update quantity when increment button is clicked', async () => {
      const user = userEvent.setup();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCartData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ item: { ...mockCartData.cart.items[0], quantity: 3 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            cart: {
              ...mockCartData.cart,
              items: [{ ...mockCartData.cart.items[0], quantity: 3 }, mockCartData.cart.items[1]],
              totalItems: 4,
              totalPrice: 1557,
            },
          }),
        });

      render(<ShoppingCart />);

      await waitFor(() => {
        expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
      });

      const incrementButtons = screen.getAllByRole('button', { name: '+' });
      await user.click(incrementButtons[0]);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/cart/items/item-1',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ quantity: 3 }),
          })
        );
      });
    });

    it('should update quantity when decrement button is clicked', async () => {
      const user = userEvent.setup();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCartData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ item: { ...mockCartData.cart.items[0], quantity: 1 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            cart: {
              ...mockCartData.cart,
              items: [{ ...mockCartData.cart.items[0], quantity: 1 }, mockCartData.cart.items[1]],
              totalItems: 2,
              totalPrice: 819,
            },
          }),
        });

      render(<ShoppingCart />);

      await waitFor(() => {
        expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
      });

      const decrementButtons = screen.getAllByRole('button', { name: '−' });
      await user.click(decrementButtons[0]);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/cart/items/item-1',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ quantity: 1 }),
          })
        );
      });
    });

    it('should disable decrement button when quantity is 1', async () => {
      const singleItemCart = {
        cart: {
          items: [{ ...mockCartData.cart.items[0], quantity: 1 }],
          totalItems: 1,
          totalPrice: 369,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => singleItemCart,
      });

      render(<ShoppingCart />);

      await waitFor(() => {
        expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
      });

      const decrementButton = screen.getByRole('button', { name: '−' });
      expect(decrementButton).toBeDisabled();
    });

    it('should show loading state while updating quantity', async () => {
      const user = userEvent.setup();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCartData,
        })
        .mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      render(<ShoppingCart />);

      await waitFor(() => {
        expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
      });

      const incrementButtons = screen.getAllByRole('button', { name: '+' });
      await user.click(incrementButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('...')).toBeInTheDocument();
      });
    });

    it('should handle update quantity error', async () => {
      const user = userEvent.setup();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCartData,
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Failed to update quantity' }),
        });

      render(<ShoppingCart />);

      await waitFor(() => {
        expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
      });

      const incrementButtons = screen.getAllByRole('button', { name: '+' });
      await user.click(incrementButtons[0]);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Failed to update quantity');
      });
    });
  });

  describe('Remove Item', () => {
    it('should remove item when remove button is clicked and confirmed', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCartData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Item removed from cart successfully' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            cart: {
              items: [mockCartData.cart.items[1]],
              totalItems: 1,
              totalPrice: 450,
            },
          }),
        });

      render(<ShoppingCart />);

      await waitFor(() => {
        expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByTitle('Remove item');
      await user.click(removeButtons[0]);

      expect(mockConfirm).toHaveBeenCalledWith('Remove this item from your cart?');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/cart/items/item-1',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });

    it('should not remove item when user cancels confirmation', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(false);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCartData,
      });

      render(<ShoppingCart />);

      await waitFor(() => {
        expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByTitle('Remove item');
      await user.click(removeButtons[0]);

      expect(mockConfirm).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only initial fetch
    });

    it('should handle remove item error', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCartData,
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Failed to remove item' }),
        });

      render(<ShoppingCart />);

      await waitFor(() => {
        expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByTitle('Remove item');
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Failed to remove item');
      });
    });
  });

  describe('Clear Cart', () => {
    it('should clear cart when clear button is clicked and confirmed', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCartData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Cart cleared successfully' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => emptyCartData,
        });

      render(<ShoppingCart />);

      await waitFor(() => {
        expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /clear cart/i });
      await user.click(clearButton);

      expect(mockConfirm).toHaveBeenCalledWith('Remove all items from your cart?');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/cart',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
      });
    });

    it('should not clear cart when user cancels confirmation', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(false);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCartData,
      });

      render(<ShoppingCart />);

      await waitFor(() => {
        expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /clear cart/i });
      await user.click(clearButton);

      expect(mockConfirm).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only initial fetch
    });
  });

  describe('Checkout', () => {
    it('should call onCheckout callback when checkout button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnCheckout = vi.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCartData,
      });

      render(<ShoppingCart onCheckout={mockOnCheckout} />);

      await waitFor(() => {
        expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
      });

      const checkoutButton = screen.getByRole('button', { name: /proceed to checkout/i });
      await user.click(checkoutButton);

      expect(mockOnCheckout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when cart fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(<ShoppingCart />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load cart')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should display authentication error when user is not logged in', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      render(<ShoppingCart />);

      await waitFor(() => {
        expect(screen.getByText('Please log in to view your cart')).toBeInTheDocument();
      });
    });

    it('should retry fetching cart when try again button is clicked', async () => {
      const user = userEvent.setup();

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCartData,
        });

      render(<ShoppingCart />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load cart')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
      });
    });
  });

  describe('Authentication', () => {
    it('should include authorization token in all requests', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token-123');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCartData,
      });

      render(<ShoppingCart />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/cart',
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer test-token-123',
            }),
          })
        );
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render all responsive elements', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCartData,
      });

      render(<ShoppingCart />);

      await waitFor(() => {
        expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
      });

      // Check that responsive classes are present
      const container = screen.getByText('Shopping Cart').closest('div');
      expect(container?.className).toContain('flex');
    });
  });

  describe('Trust Badges', () => {
    it('should display trust badges in order summary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCartData,
      });

      render(<ShoppingCart />);

      await waitFor(() => {
        expect(screen.getByText('Order Summary')).toBeInTheDocument();
      });

      expect(screen.getByText('Secure checkout')).toBeInTheDocument();
      expect(screen.getByText('Free shipping on all orders')).toBeInTheDocument();
      expect(screen.getByText('High-quality printing guaranteed')).toBeInTheDocument();
    });
  });
});
