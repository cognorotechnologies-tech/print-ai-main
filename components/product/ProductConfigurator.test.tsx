import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductConfigurator from './ProductConfigurator';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockCatalog = {
  catalog: {
    fabrics: [
      { id: 'fabric-1', name: 'Cotton', priceModifier: 0, isActive: true },
      { id: 'fabric-2', name: 'Polyester', priceModifier: 50, isActive: true },
    ],
    gsms: [
      { id: 'gsm-1', value: 160, priceModifier: 0, isActive: true },
      { id: 'gsm-2', value: 180, priceModifier: 20, isActive: true },
    ],
    sizes: [
      { id: 'size-1', name: 'S', priceModifier: 0, isActive: true },
      { id: 'size-2', name: 'M', priceModifier: 0, isActive: true },
      { id: 'size-3', name: 'L', priceModifier: 0, isActive: true },
    ],
    colors: [
      { id: 'color-1', name: 'White', hexCode: '#FFFFFF', priceModifier: 0, isActive: true },
      { id: 'color-2', name: 'Black', hexCode: '#000000', priceModifier: 0, isActive: true },
    ],
    basePrice: 299,
  },
};

const mockPrice = {
  price: 319,
  quantity: 1,
  pricePerItem: 319,
};

const mockMockup = {
  mockup: {
    mockupUrl: 'https://example.com/mockup.jpg',
    colorName: 'White',
    placement: 'front',
  },
};

describe('ProductConfigurator', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<ProductConfigurator designUrl="https://example.com/design.jpg" />);
    
    expect(screen.getByText('Loading product options...')).toBeInTheDocument();
  });

  it('should fetch and display catalog options', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCatalog,
    });

    render(<ProductConfigurator designUrl="https://example.com/design.jpg" />);

    await waitFor(() => {
      expect(screen.getByText('Configure Your T-Shirt')).toBeInTheDocument();
    });

    // Check fabric options
    expect(screen.getByText('Cotton')).toBeInTheDocument();
    expect(screen.getByText(/Polyester.*\+₹50/)).toBeInTheDocument();

    // Check GSM options
    expect(screen.getByText('160 GSM')).toBeInTheDocument();
    expect(screen.getByText(/180 GSM.*\+₹20/)).toBeInTheDocument();

    // Check size options
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('L')).toBeInTheDocument();
  });

  it('should display error when catalog fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<ProductConfigurator designUrl="https://example.com/design.jpg" />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('should calculate price when configuration is complete', async () => {
    mockFetch.mockImplementation((url) => {
      if (url === '/api/products/catalog') {
        return Promise.resolve({ ok: true, json: async () => mockCatalog });
      }
      if (url === '/api/products/mockup') {
        return Promise.resolve({ ok: true, json: async () => mockMockup });
      }
      if (url === '/api/products/price') {
        return Promise.resolve({ ok: true, json: async () => mockPrice });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<ProductConfigurator designUrl="https://example.com/design.jpg" />);

    await waitFor(() => {
      expect(screen.getByText('Configure Your T-Shirt')).toBeInTheDocument();
    });

    // Wait for price calculation - check for the total price specifically
    await waitFor(() => {
      const priceElements = screen.getAllByText(/₹319\.00/);
      expect(priceElements.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // Verify price endpoint was called
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/products/price',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('should update price when configuration changes', async () => {
    const user = userEvent.setup();
    
    mockFetch.mockImplementation((url) => {
      if (url === '/api/products/catalog') {
        return Promise.resolve({ ok: true, json: async () => mockCatalog });
      }
      if (url === '/api/products/mockup') {
        return Promise.resolve({ ok: true, json: async () => mockMockup });
      }
      if (url === '/api/products/price') {
        // Return different prices based on call count
        const callCount = mockFetch.mock.calls.filter(call => call[0] === '/api/products/price').length;
        if (callCount === 1) {
          return Promise.resolve({ ok: true, json: async () => mockPrice });
        } else {
          return Promise.resolve({ ok: true, json: async () => ({ ...mockPrice, price: 369, pricePerItem: 369 }) });
        }
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<ProductConfigurator designUrl="https://example.com/design.jpg" />);

    await waitFor(() => {
      const priceElements = screen.getAllByText(/₹319\.00/);
      expect(priceElements.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // Change fabric to Polyester - get first combobox (Fabric Type)
    const comboboxes = screen.getAllByRole('combobox');
    await user.selectOptions(comboboxes[0], 'fabric-2');

    // Wait for new price
    await waitFor(() => {
      const priceElements = screen.getAllByText(/₹369\.00/);
      expect(priceElements.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('should generate mockup when color is selected', async () => {
    mockFetch.mockImplementation((url) => {
      if (url === '/api/products/catalog') {
        return Promise.resolve({ ok: true, json: async () => mockCatalog });
      }
      if (url === '/api/products/mockup') {
        return Promise.resolve({ ok: true, json: async () => mockMockup });
      }
      if (url === '/api/products/price') {
        return Promise.resolve({ ok: true, json: async () => mockPrice });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<ProductConfigurator designUrl="https://example.com/design.jpg" />);

    await waitFor(() => {
      expect(screen.getByAltText(/T-shirt mockup in White/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify mockup endpoint was called
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/products/mockup',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('color-1'),
      })
    );
  });

  it('should update mockup when color changes', async () => {
    const user = userEvent.setup();
    
    let mockupCallCount = 0;
    mockFetch.mockImplementation((url) => {
      if (url === '/api/products/catalog') {
        return Promise.resolve({ ok: true, json: async () => mockCatalog });
      }
      if (url === '/api/products/mockup') {
        mockupCallCount++;
        if (mockupCallCount === 1) {
          return Promise.resolve({ ok: true, json: async () => mockMockup });
        } else {
          return Promise.resolve({ ok: true, json: async () => ({ mockup: { ...mockMockup.mockup, colorName: 'Black' } }) });
        }
      }
      if (url === '/api/products/price') {
        return Promise.resolve({ ok: true, json: async () => mockPrice });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<ProductConfigurator designUrl="https://example.com/design.jpg" />);

    await waitFor(() => {
      expect(screen.getByAltText(/T-shirt mockup in White/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click on Black color
    const colorButtons = screen.getAllByRole('button');
    const blackColorButton = colorButtons.find(btn => btn.getAttribute('title') === 'Black');
    
    if (blackColorButton) {
      await user.click(blackColorButton);

      await waitFor(() => {
        expect(screen.getByText('Selected: Black')).toBeInTheDocument();
      }, { timeout: 3000 });
    }
  });

  it('should update quantity and recalculate price', async () => {
    const user = userEvent.setup();
    
    let priceCallCount = 0;
    mockFetch.mockImplementation((url) => {
      if (url === '/api/products/catalog') {
        return Promise.resolve({ ok: true, json: async () => mockCatalog });
      }
      if (url === '/api/products/mockup') {
        return Promise.resolve({ ok: true, json: async () => mockMockup });
      }
      if (url === '/api/products/price') {
        priceCallCount++;
        if (priceCallCount === 1) {
          return Promise.resolve({ ok: true, json: async () => mockPrice });
        } else {
          return Promise.resolve({ ok: true, json: async () => ({ price: 638, quantity: 2, pricePerItem: 319 }) });
        }
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<ProductConfigurator designUrl="https://example.com/design.jpg" />);

    await waitFor(() => {
      const priceElements = screen.getAllByText(/₹319\.00/);
      expect(priceElements.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // Change quantity to 2 - get the spinbutton (number input)
    const quantityInput = screen.getByRole('spinbutton');
    await user.clear(quantityInput);
    await user.type(quantityInput, '2');

    // Wait for new price
    await waitFor(() => {
      const priceElements = screen.getAllByText(/₹638\.00/);
      expect(priceElements.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('should call onAddToCart when Add to Cart is clicked', async () => {
    const user = userEvent.setup();
    const onAddToCart = vi.fn();
    
    mockFetch.mockImplementation((url) => {
      if (url === '/api/products/catalog') {
        return Promise.resolve({ ok: true, json: async () => mockCatalog });
      }
      if (url === '/api/products/mockup') {
        return Promise.resolve({ ok: true, json: async () => mockMockup });
      }
      if (url === '/api/products/price') {
        return Promise.resolve({ ok: true, json: async () => mockPrice });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(
      <ProductConfigurator 
        designUrl="https://example.com/design.jpg" 
        onAddToCart={onAddToCart}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Add to Cart')).toBeInTheDocument();
    });

    // Wait for price to be calculated
    await waitFor(() => {
      const priceElements = screen.getAllByText(/₹319\.00/);
      expect(priceElements.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    const addToCartButton = screen.getByText('Add to Cart');
    await user.click(addToCartButton);

    expect(onAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({
        fabricId: 'fabric-1',
        gsmId: 'gsm-1',
        sizeId: 'size-1',
        colorId: 'color-1',
        quantity: 1,
      }),
      319
    );
  });

  it('should select size by clicking size button', async () => {
    const user = userEvent.setup();
    
    mockFetch.mockImplementation((url) => {
      if (url === '/api/products/catalog') {
        return Promise.resolve({ ok: true, json: async () => mockCatalog });
      }
      if (url === '/api/products/mockup') {
        return Promise.resolve({ ok: true, json: async () => mockMockup });
      }
      if (url === '/api/products/price') {
        return Promise.resolve({ ok: true, json: async () => mockPrice });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<ProductConfigurator designUrl="https://example.com/design.jpg" />);

    await waitFor(() => {
      expect(screen.getByText('M')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click on M size
    const mButton = screen.getByText('M');
    await user.click(mButton);

    // Check if M button is selected (has primary background)
    expect(mButton).toHaveClass('bg-primary-600');
  });
});
