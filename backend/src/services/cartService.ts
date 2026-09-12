import { Cart, CartItem, Product } from '../models/index.js';
import { sequelize } from '../config/database.js';
import { AppError } from './authService.js';

export interface FormattedCartProduct {
  id: string;
  name: string;
  slug: string;
  brand: string;
  model: string;
  image: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  stock: number;
  isActive: boolean;
}

export interface FormattedCartItem {
  id: string;
  product: FormattedCartProduct;
  quantity: number;
  unitPrice: number;
  itemTotal: number;
}

export interface FormattedCart {
  id: string;
  items: FormattedCartItem[];
  itemCount: number;
  subtotal: number;
}

/**
 * Normalizes Cart model into a safe, precision-guaranteed JSON format.
 */
export const formatCart = (cart: Cart): FormattedCart => {
  const rawItems = cart.items || [];

  const items: FormattedCartItem[] = rawItems
    .filter((item) => item.product !== undefined && item.product !== null)
    .map((item) => {
      const p = item.product!;
      const unitPrice = typeof p.price === 'number' ? p.price : parseFloat(String(p.price || 0));
      const originalPrice = typeof p.originalPrice === 'number' ? p.originalPrice : parseFloat(String(p.originalPrice || 0));
      const discountPercentage = typeof p.discountPercentage === 'number' ? p.discountPercentage : parseFloat(String(p.discountPercentage || 0));

      const itemTotal = Math.round(unitPrice * item.quantity * 100) / 100;

      return {
        id: item.id,
        product: {
          id: p.id,
          name: p.name,
          slug: p.slug,
          brand: p.brand,
          model: p.model,
          image: p.image,
          price: unitPrice,
          originalPrice,
          discountPercentage,
          stock: p.stock,
          isActive: p.isActive,
        },
        quantity: item.quantity,
        unitPrice,
        itemTotal,
      };
    });

  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);
  const subtotal = Math.round(items.reduce((sum, it) => sum + it.itemTotal, 0) * 100) / 100;

  return {
    id: cart.id,
    items,
    itemCount,
    subtotal,
  };
};

/**
 * Retrieves or creates a shopping cart for the specified user.
 */
export const getCart = async (userId: string): Promise<FormattedCart> => {
  let cart = await Cart.findOne({
    where: { userId },
    include: [
      {
        model: CartItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
          },
        ],
      },
    ],
    order: [[{ model: CartItem, as: 'items' }, 'createdAt', 'ASC']],
  });

  if (!cart) {
    cart = await Cart.create({ userId });
    cart.items = [];
  }

  return formatCart(cart);
};

/**
 * Adds a product to the user's cart or increments its quantity with stock validation and transaction safety.
 */
export const addToCart = async (
  userId: string,
  productId: string,
  quantity?: number
): Promise<FormattedCart> => {
  const rawQty = quantity === undefined || quantity === null ? 1 : quantity;
  const parsedQty = parseInt(String(rawQty), 10);
  if (isNaN(parsedQty) || parsedQty < 1) {
    throw new AppError('Quantity must be an integer greater than 0', 400);
  }

  if (!productId || typeof productId !== 'string' || productId.trim().length === 0) {
    throw new AppError('Product ID is required', 400);
  }

  const cleanProductId = productId.trim();
  const product = await Product.findByPk(cleanProductId);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (!product.isActive) {
    throw new AppError('Product is not available', 400);
  }

  if (product.stock <= 0) {
    throw new AppError('Product is out of stock', 400);
  }

  return await sequelize.transaction(async (t) => {
    let [cart] = await Cart.findOrCreate({
      where: { userId },
      transaction: t,
    });

    const existingItem = await CartItem.findOne({
      where: {
        cartId: cart.id,
        productId: product.id,
      },
      transaction: t,
    });

    const targetQuantity = existingItem ? existingItem.quantity + parsedQty : parsedQty;

    if (targetQuantity > product.stock) {
      throw new AppError('Requested quantity exceeds available stock', 400);
    }

    if (existingItem) {
      existingItem.quantity = targetQuantity;
      await existingItem.save({ transaction: t });
    } else {
      await CartItem.create(
        {
          cartId: cart.id,
          productId: product.id,
          quantity: targetQuantity,
        },
        { transaction: t }
      );
    }

    const freshCart = await Cart.findByPk(cart.id, {
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
            },
          ],
        },
      ],
      order: [[{ model: CartItem, as: 'items' }, 'createdAt', 'ASC']],
      transaction: t,
    });

    return formatCart(freshCart!);
  });
};

/**
 * Updates quantity for an existing cart item with stock and ownership validation.
 */
export const updateCartItem = async (
  userId: string,
  cartItemId: string,
  quantity: number
): Promise<FormattedCart> => {
  const parsedQty = parseInt(String(quantity), 10);
  if (isNaN(parsedQty) || parsedQty < 1) {
    throw new AppError('Quantity must be an integer of at least 1', 400);
  }

  const cartItem = await CartItem.findByPk(cartItemId, {
    include: [
      {
        model: Cart,
        as: 'cart',
      },
      {
        model: Product,
        as: 'product',
      },
    ],
  });

  if (!cartItem || !cartItem.cart || cartItem.cart.userId !== userId) {
    throw new AppError('Cart item not found', 404);
  }

  const product = cartItem.product;
  if (!product) {
    throw new AppError('Associated product not found', 404);
  }

  if (parsedQty > product.stock) {
    throw new AppError('Requested quantity exceeds available stock', 400);
  }

  cartItem.quantity = parsedQty;
  await cartItem.save();

  return await getCart(userId);
};

/**
 * Removes a cart item from the user's cart with ownership validation.
 */
export const removeCartItem = async (
  userId: string,
  cartItemId: string
): Promise<FormattedCart> => {
  const cartItem = await CartItem.findByPk(cartItemId, {
    include: [
      {
        model: Cart,
        as: 'cart',
      },
    ],
  });

  if (!cartItem || !cartItem.cart || cartItem.cart.userId !== userId) {
    throw new AppError('Cart item not found', 404);
  }

  await cartItem.destroy();

  return await getCart(userId);
};
