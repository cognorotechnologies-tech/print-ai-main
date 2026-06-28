import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';
import { calculatePrice } from './catalog';

export interface CartItemInput {
  userId: string;
  designId: string;
  fabricId: string;
  gsmId: string;
  sizeId: string;
  colorId: string;
  quantity: number;
}

export interface CartItemResponse {
  id: string;
  userId: string;
  designId: string;
  fabricId: string;
  gsmId: string;
  sizeId: string;
  colorId: string;
  quantity: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
  design: {
    id: string;
    imageUrl: string;
    prompt: string;
  };
  fabric: {
    id: string;
    name: string;
  };
  gsm: {
    id: string;
    value: number;
  };
  size: {
    id: string;
    name: string;
  };
  color: {
    id: string;
    name: string;
    hexCode: string;
  };
}

export interface CartSummary {
  items: CartItemResponse[];
  totalItems: number;
  totalPrice: number;
}

/**
 * Add item to cart or update quantity if item already exists
 */
export const addToCart = async (input: CartItemInput): Promise<CartItemResponse> => {
  try {
    const { userId, designId, fabricId, gsmId, sizeId, colorId, quantity } = input;

    // Validate quantity
    if (quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    // Validate that all referenced entities exist and are active
    const [design, fabric, gsm, size, color] = await Promise.all([
      prisma.design.findUnique({ where: { id: designId } }),
      prisma.fabric.findUnique({ where: { id: fabricId, isActive: true } }),
      prisma.gSM.findUnique({ where: { id: gsmId, isActive: true } }),
      prisma.size.findUnique({ where: { id: sizeId, isActive: true } }),
      prisma.color.findUnique({ where: { id: colorId, isActive: true } }),
    ]);

    if (!design) {
      throw new Error('Design not found');
    }
    if (!fabric) {
      throw new Error('Invalid or inactive fabric');
    }
    if (!gsm) {
      throw new Error('Invalid or inactive GSM');
    }
    if (!size) {
      throw new Error('Invalid or inactive size');
    }
    if (!color) {
      throw new Error('Invalid or inactive color');
    }

    // Calculate price for the item
    const itemPrice = await calculatePrice(fabricId, gsmId, sizeId, colorId, 1);
    const totalPrice = itemPrice * quantity;

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_designId_fabricId_gsmId_sizeId_colorId: {
          userId,
          designId,
          fabricId,
          gsmId,
          sizeId,
          colorId,
        },
      },
    });

    let cartItem;

    if (existingItem) {
      // Update existing item quantity
      const newQuantity = existingItem.quantity + quantity;
      const newTotalPrice = itemPrice * newQuantity;

      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          price: newTotalPrice,
        },
        include: {
          design: {
            select: {
              id: true,
              imageUrl: true,
              prompt: true,
            },
          },
          fabric: {
            select: {
              id: true,
              name: true,
            },
          },
          gsm: {
            select: {
              id: true,
              value: true,
            },
          },
          size: {
            select: {
              id: true,
              name: true,
            },
          },
          color: {
            select: {
              id: true,
              name: true,
              hexCode: true,
            },
          },
        },
      });

      logger.info('Cart item quantity updated', { 
        userId, 
        cartItemId: cartItem.id, 
        newQuantity 
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          userId,
          designId,
          fabricId,
          gsmId,
          sizeId,
          colorId,
          quantity,
          price: totalPrice,
        },
        include: {
          design: {
            select: {
              id: true,
              imageUrl: true,
              prompt: true,
            },
          },
          fabric: {
            select: {
              id: true,
              name: true,
            },
          },
          gsm: {
            select: {
              id: true,
              value: true,
            },
          },
          size: {
            select: {
              id: true,
              name: true,
            },
          },
          color: {
            select: {
              id: true,
              name: true,
              hexCode: true,
            },
          },
        },
      });

      logger.info('Item added to cart', { userId, cartItemId: cartItem.id });
    }

    return cartItem;
  } catch (error) {
    logger.error('Error adding item to cart', { error, input });
    throw error;
  }
};

/**
 * Get user's cart with all items
 */
export const getCart = async (userId: string): Promise<CartSummary> => {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        design: {
          select: {
            id: true,
            imageUrl: true,
            prompt: true,
          },
        },
        fabric: {
          select: {
            id: true,
            name: true,
          },
        },
        gsm: {
          select: {
            id: true,
            value: true,
          },
        },
        size: {
          select: {
            id: true,
            name: true,
          },
        },
        color: {
          select: {
            id: true,
            name: true,
            hexCode: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

    logger.debug('Cart retrieved', { userId, itemCount: items.length, totalItems });

    return {
      items,
      totalItems,
      totalPrice,
    };
  } catch (error) {
    logger.error('Error retrieving cart', { error, userId });
    throw new Error('Failed to retrieve cart');
  }
};

/**
 * Update cart item quantity
 */
export const updateCartItem = async (
  cartItemId: string,
  userId: string,
  quantity: number
): Promise<CartItemResponse> => {
  try {
    // Validate quantity
    if (quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    // Find the cart item
    const existingItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        fabric: true,
        gsm: true,
        size: true,
        color: true,
      },
    });

    if (!existingItem) {
      throw new Error('Cart item not found');
    }

    // Verify ownership
    if (existingItem.userId !== userId) {
      throw new Error('Unauthorized to update this cart item');
    }

    // Recalculate price based on new quantity
    const itemPrice = await calculatePrice(
      existingItem.fabricId,
      existingItem.gsmId,
      existingItem.sizeId,
      existingItem.colorId,
      1
    );
    const totalPrice = itemPrice * quantity;

    // Update the cart item
    const updatedItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: {
        quantity,
        price: totalPrice,
      },
      include: {
        design: {
          select: {
            id: true,
            imageUrl: true,
            prompt: true,
          },
        },
        fabric: {
          select: {
            id: true,
            name: true,
          },
        },
        gsm: {
          select: {
            id: true,
            value: true,
          },
        },
        size: {
          select: {
            id: true,
            name: true,
          },
        },
        color: {
          select: {
            id: true,
            name: true,
            hexCode: true,
          },
        },
      },
    });

    logger.info('Cart item updated', { cartItemId, userId, quantity });

    return updatedItem;
  } catch (error) {
    logger.error('Error updating cart item', { error, cartItemId, userId, quantity });
    throw error;
  }
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (
  cartItemId: string,
  userId: string
): Promise<void> => {
  try {
    // Find the cart item
    const existingItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
    });

    if (!existingItem) {
      throw new Error('Cart item not found');
    }

    // Verify ownership
    if (existingItem.userId !== userId) {
      throw new Error('Unauthorized to remove this cart item');
    }

    // Delete the cart item
    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    logger.info('Item removed from cart', { cartItemId, userId });
  } catch (error) {
    logger.error('Error removing item from cart', { error, cartItemId, userId });
    throw error;
  }
};

/**
 * Clear all items from user's cart
 */
export const clearCart = async (userId: string): Promise<void> => {
  try {
    const result = await prisma.cartItem.deleteMany({
      where: { userId },
    });

    logger.info('Cart cleared', { userId, itemsDeleted: result.count });
  } catch (error) {
    logger.error('Error clearing cart', { error, userId });
    throw new Error('Failed to clear cart');
  }
};

/**
 * Validate cart before checkout
 * Ensures all items are still available and prices are current
 */
export const validateCart = async (userId: string): Promise<{
  valid: boolean;
  errors: string[];
}> => {
  try {
    const cart = await getCart(userId);
    const errors: string[] = [];

    if (cart.items.length === 0) {
      errors.push('Cart is empty');
      return { valid: false, errors };
    }

    // Validate each item
    for (const item of cart.items) {
      // Check if all options are still active
      const [fabric, gsm, size, color] = await Promise.all([
        prisma.fabric.findUnique({ where: { id: item.fabricId } }),
        prisma.gSM.findUnique({ where: { id: item.gsmId } }),
        prisma.size.findUnique({ where: { id: item.sizeId } }),
        prisma.color.findUnique({ where: { id: item.colorId } }),
      ]);

      if (!fabric || !fabric.isActive) {
        errors.push(`Fabric "${item.fabric.name}" is no longer available`);
      }
      if (!gsm || !gsm.isActive) {
        errors.push(`GSM ${item.gsm.value} is no longer available`);
      }
      if (!size || !size.isActive) {
        errors.push(`Size "${item.size.name}" is no longer available`);
      }
      if (!color || !color.isActive) {
        errors.push(`Color "${item.color.name}" is no longer available`);
      }

      // Verify price is still correct
      if (fabric?.isActive && gsm?.isActive && size?.isActive && color?.isActive) {
        const currentPrice = await calculatePrice(
          item.fabricId,
          item.gsmId,
          item.sizeId,
          item.colorId,
          item.quantity
        );

        if (Math.abs(currentPrice - item.price) > 0.01) {
          errors.push(
            `Price for item has changed. Please review your cart.`
          );
        }
      }
    }

    const valid = errors.length === 0;
    
    if (!valid) {
      logger.warn('Cart validation failed', { userId, errors });
    }

    return { valid, errors };
  } catch (error) {
    logger.error('Error validating cart', { error, userId });
    throw new Error('Failed to validate cart');
  }
};
