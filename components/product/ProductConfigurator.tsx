'use client';

import { useState, useEffect } from 'react';

interface CatalogOption {
  id: string;
  name?: string;
  value?: number;
  hexCode?: string;
  priceModifier: number;
  isActive: boolean;
}

interface CatalogData {
  fabrics: CatalogOption[];
  gsms: CatalogOption[];
  sizes: CatalogOption[];
  colors: CatalogOption[];
  basePrice: number;
}

interface ProductConfiguration {
  fabricId: string;
  gsmId: string;
  sizeId: string;
  colorId: string;
  quantity: number;
}

interface PriceData {
  price: number;
  quantity: number;
  pricePerItem: number;
}

interface MockupData {
  mockupUrl: string;
  colorName: string;
  placement: string;
}

interface ProductConfiguratorProps {
  designUrl: string;
  onAddToCart?: (config: ProductConfiguration, price: number) => void;
}

export default function ProductConfigurator({ designUrl, onAddToCart }: ProductConfiguratorProps) {
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [configuration, setConfiguration] = useState<ProductConfiguration>({
    fabricId: '',
    gsmId: '',
    sizeId: '',
    colorId: '',
    quantity: 1,
  });
  
  const [price, setPrice] = useState<PriceData | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  
  const [mockup, setMockup] = useState<MockupData | null>(null);
  const [mockupLoading, setMockupLoading] = useState(false);
  const [mockupError, setMockupError] = useState<string | null>(null);

  // Fetch catalog on mount
  useEffect(() => {
    fetchCatalog();
  }, []);

  // Update price when configuration changes
  useEffect(() => {
    if (isConfigurationComplete()) {
      calculatePrice();
    }
  }, [configuration]);

  // Update mockup when design or color changes
  useEffect(() => {
    if (configuration.colorId && designUrl) {
      generateMockup();
    }
  }, [configuration.colorId, designUrl]);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/products/catalog');
      if (!response.ok) {
        throw new Error('Failed to fetch catalog');
      }
      
      const data = await response.json();
      setCatalog(data.catalog);
      
      // Set default selections
      if (data.catalog.fabrics.length > 0) {
        setConfiguration(prev => ({ ...prev, fabricId: data.catalog.fabrics[0].id }));
      }
      if (data.catalog.gsms.length > 0) {
        setConfiguration(prev => ({ ...prev, gsmId: data.catalog.gsms[0].id }));
      }
      if (data.catalog.sizes.length > 0) {
        setConfiguration(prev => ({ ...prev, sizeId: data.catalog.sizes[0].id }));
      }
      if (data.catalog.colors.length > 0) {
        setConfiguration(prev => ({ ...prev, colorId: data.catalog.colors[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  };

  const isConfigurationComplete = () => {
    return configuration.fabricId && configuration.gsmId && 
           configuration.sizeId && configuration.colorId && 
           configuration.quantity > 0;
  };

  const calculatePrice = async () => {
    try {
      setPriceLoading(true);
      setPriceError(null);
      
      const response = await fetch('/api/products/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configuration),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate price');
      }
      
      const data = await response.json();
      setPrice(data);
    } catch (err) {
      setPriceError(err instanceof Error ? err.message : 'Failed to calculate price');
    } finally {
      setPriceLoading(false);
    }
  };

  const generateMockup = async () => {
    try {
      setMockupLoading(true);
      setMockupError(null);
      
      const response = await fetch('/api/products/mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designUrl,
          colorId: configuration.colorId,
          placement: 'front',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate mockup');
      }
      
      const data = await response.json();
      setMockup(data.mockup);
    } catch (err) {
      setMockupError(err instanceof Error ? err.message : 'Failed to generate mockup');
    } finally {
      setMockupLoading(false);
    }
  };

  const handleConfigChange = (field: keyof ProductConfiguration, value: string | number) => {
    setConfiguration(prev => ({ ...prev, [field]: value }));
  };

  const handleAddToCart = () => {
    if (onAddToCart && price) {
      onAddToCart(configuration, price.price);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product options...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={fetchCatalog}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!catalog) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Mockup Preview */}
      <div className="order-1 lg:order-2">
        <div className="sticky top-4">
          <h2 className="text-2xl font-bold mb-4">Preview</h2>
          <div className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center overflow-hidden">
            {mockupLoading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating preview...</p>
              </div>
            ) : mockupError ? (
              <div className="text-center p-4">
                <p className="text-red-600 mb-2">{mockupError}</p>
                <button 
                  onClick={generateMockup}
                  className="text-primary-600 hover:text-primary-800 underline"
                >
                  Retry
                </button>
              </div>
            ) : mockup ? (
              <img 
                src={mockup.mockupUrl} 
                alt={`T-shirt mockup in ${mockup.colorName}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-4">
                <p className="text-gray-500">Select options to see preview</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Options */}
      <div className="order-2 lg:order-1">
        <h2 className="text-2xl font-bold mb-6">Configure Your T-Shirt</h2>
        
        <div className="space-y-6">
          {/* Fabric Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fabric Type
            </label>
            <select
              value={configuration.fabricId}
              onChange={(e) => handleConfigChange('fabricId', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {catalog.fabrics.map((fabric) => (
                <option key={fabric.id} value={fabric.id}>
                  {fabric.name} {fabric.priceModifier > 0 && `(+₹${fabric.priceModifier})`}
                </option>
              ))}
            </select>
          </div>

          {/* GSM Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GSM (Fabric Weight)
            </label>
            <select
              value={configuration.gsmId}
              onChange={(e) => handleConfigChange('gsmId', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {catalog.gsms.map((gsm) => (
                <option key={gsm.id} value={gsm.id}>
                  {gsm.value} GSM {gsm.priceModifier > 0 && `(+₹${gsm.priceModifier})`}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Higher GSM = thicker, heavier fabric</p>
          </div>

          {/* Size Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Size
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {catalog.sizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => handleConfigChange('sizeId', size.id)}
                  className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
                    configuration.sizeId === size.id
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                  }`}
                >
                  {size.name}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              T-Shirt Color
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-3">
              {catalog.colors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handleConfigChange('colorId', color.id)}
                  className={`relative aspect-square rounded-lg border-2 transition-all ${
                    configuration.colorId === color.id
                      ? 'border-primary-600 ring-2 ring-primary-200'
                      : 'border-gray-300 hover:border-primary-400'
                  }`}
                  title={color.name}
                  style={{ backgroundColor: color.hexCode }}
                >
                  {configuration.colorId === color.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Selected: {catalog.colors.find(c => c.id === configuration.colorId)?.name}
            </p>
          </div>

          {/* Quantity Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={configuration.quantity}
              onChange={(e) => handleConfigChange('quantity', parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Price Display */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            {priceLoading ? (
              <div className="flex items-center justify-center py-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            ) : priceError ? (
              <div className="text-red-600 text-sm">{priceError}</div>
            ) : price ? (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Price per item:</span>
                  <span className="font-semibold">₹{(price.pricePerItem || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                  <span className="text-lg font-medium">Total:</span>
                  <span className="text-2xl font-bold text-primary-600">₹{(price.price || 0).toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-2">
                Complete configuration to see price
              </div>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!isConfigurationComplete() || !price || priceLoading}
            className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
