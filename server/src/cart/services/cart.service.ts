import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument } from '../schemas/cart.schema';
import { ProductsService } from '@/products/services/products.service';
// import { CartItem, ShippingDetails } from '../../interfaces';
import { UserDocument } from '@/users/schemas/user.schema';
import { CartItem } from '@/types/cart';
import { ShippingDetails } from '@/types/shipping';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    private productsService: ProductsService,
  ) {}

  async getCart(user: UserDocument): Promise<CartDocument> {
    let cart = await this.cartModel.findOne({ userId: user._id });

    if (!cart) {
      cart = await this.cartModel.create({
        userId: user._id,
        items: [],
      });
    }
    const productIds = cart.items.map((item) => item.productId);
    const products = await this.productsService.findByIds(productIds);
    cart.items = cart.items.map((item) => {
      const product = products.find(
        (p) => p._id.toString() === item.productId.toString(),
      );
      if (product) {
        item.qty = Math.min(item.qty, product.countInStock);
        const variant = product.variants.find((v) => {
          // Match size: if no size specified, variant shouldn't have size either
          const sizeMatch = !item.size ? !v.size : v.size === item.size;
          // Match color: if no color specified, variant shouldn't have color either
          const colorMatch = !item.color ? !v.color : v.color === item.color;
          // Match ageGroup: if no ageGroup specified, variant shouldn't have ageGroup either
          const ageGroupMatch = !item.ageGroup
            ? !v.ageGroup
            : v.ageGroup === item.ageGroup;

          return sizeMatch && colorMatch && ageGroupMatch;
        });

        item.countInStock = variant?.stock || product.countInStock;
      }
      return item;
    });

    return cart;
  }

  private calculatePrices(cart: CartDocument) {
    cart.itemsPrice = cart.items.reduce(
      (acc, item) => acc + item.price * item.qty,
      0,
    );
    cart.taxPrice = Number((0 * cart.itemsPrice).toFixed(2)); // საკომისიო 0%
    cart.shippingPrice = cart.itemsPrice > 100 ? 0 : 0;
    cart.totalPrice = cart.itemsPrice + cart.taxPrice + cart.shippingPrice;
    return cart;
  }

  async addItemToCart(
    userId: string,
    productId: string,
    qty: number,
  ): Promise<CartDocument> {
    const product = await this.productsService.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    let cart = await this.cartModel.findOne({ user: userId });

    if (!cart) {
      cart = await this.cartModel.create({
        user: userId,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId,
    );

    if (existingItem) {
      existingItem.qty = qty;
    } else {
      cart.items.push({
        productId,
        name: product.name,
        nameEn: product.nameEn, // Include nameEn
        image: product.images[0],
        price: product.price,
        countInStock: product.countInStock,
        qty,
      });
    }

    this.calculatePrices(cart);
    return await cart.save();
  }

  async addCartItem(
    productId: string,
    qty: number,
    user: UserDocument,
    size?: string,
    color?: string,
    ageGroup?: string,
    price?: number,
  ): Promise<CartDocument> {
    const product = await this.productsService.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    // Check stock availability before adding to cart
    let availableStock = product.countInStock;
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find((v) => {
        const sizeMatch = !size ? !v.size : v.size === size;
        const colorMatch = !color ? !v.color : v.color === color;
        const ageGroupMatch = !ageGroup ? !v.ageGroup : v.ageGroup === ageGroup;
        return sizeMatch && colorMatch && ageGroupMatch;
      });
      if (variant) {
        availableStock = variant.stock;
      }
    }

    if (availableStock <= 0) {
      throw new BadRequestException('პროდუქტი არ არის მარაგში');
    }

    const cart = await this.getCart(user);

    // Check if we have this exact variant in the cart
    const existingItem = cart.items.find(
      (item) =>
        item.productId.toString() === productId &&
        item.size === size &&
        item.color === color &&
        item.ageGroup === ageGroup,
    );

    const currentQty = existingItem ? existingItem.qty : 0;
    if (currentQty + qty > availableStock) {
      throw new BadRequestException(
        `მარაგში არის მხოლოდ ${availableStock} ცალი`,
      );
    }

    if (existingItem) {
      existingItem.qty = currentQty + qty;
      // Update price if provided (to handle discount changes)
      if (price !== undefined) {
        existingItem.price = price;
      }
    } else {
      const cartItem: CartItem = {
        productId: product._id.toString(),
        name: product.name,
        nameEn: product.nameEn,
        image: product.images[0],
        price: price ?? product.price, // Use provided price (discounted) or fallback to product price
        countInStock:
          product.variants?.find((v) => {
            const sizeMatch = !size ? !v.size : v.size === size;
            const colorMatch = !color ? !v.color : v.color === color;
            const ageGroupMatch = !ageGroup
              ? !v.ageGroup
              : v.ageGroup === ageGroup;
            return sizeMatch && colorMatch && ageGroupMatch;
          })?.stock ?? product.countInStock,
        qty,
        size,
        color,
        ageGroup,
      };
      cart.items.push(cartItem);
    }

    this.calculatePrices(cart);
    return cart.save();
  }

  async removeCartItem(
    productId: string,
    user: UserDocument,
    size?: string,
    color?: string,
    ageGroup?: string,
  ): Promise<CartDocument> {
    const cart = await this.getCart(user);

    // Filter items to remove the specific variant
    cart.items = cart.items.filter(
      (item) =>
        !(
          item.productId.toString() === productId &&
          (!size || item.size === size) &&
          (!color || item.color === color) &&
          (!ageGroup || item.ageGroup === ageGroup)
        ),
    );

    this.calculatePrices(cart);
    return cart.save();
  }

  async updateCartItemQty(
    productId: string,
    qty: number,
    user: UserDocument,
    size?: string,
    color?: string,
  ): Promise<CartDocument> {
    const cart = await this.getCart(user);
    const item = cart.items.find(
      (item) =>
        item.productId.toString() === productId &&
        item.size === size &&
        item.color === color,
    );

    if (!item) throw new NotFoundException('Item not found in cart');

    // For products with variants, we need to check stock differently
    const product = await this.productsService.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    // Check stock for variant
    if ((size || color) && product.variants && product.variants.length > 0) {
      const variant = product.variants.find((v) => {
        // Match size: if no size specified, variant shouldn't have size either
        const sizeMatch = !size ? !v.size : v.size === size;
        // Match color: if no color specified, variant shouldn't have color either
        const colorMatch = !color ? !v.color : v.color === color;

        return sizeMatch && colorMatch;
      });
      if (!variant) {
        // If variant not found but attributes specified, fall back to general stock
        console.warn(
          `Variant not found for product ${product.name} with size ${size}, color ${color}, using general stock`,
        );
        if (qty > item.countInStock)
          throw new BadRequestException('Not enough stock');
      } else {
        if (qty > variant.stock)
          throw new BadRequestException('Not enough stock for this variant');
      }
    } else {
      // Fall back to general stock check
      if (qty > item.countInStock)
        throw new BadRequestException('Not enough stock');
    }

    item.qty = qty;
    this.calculatePrices(cart);
    return cart.save();
  }

  async clearCart(user: UserDocument): Promise<CartDocument> {
    const cart = await this.getCart(user);
    cart.items = [];
    this.calculatePrices(cart);
    return cart.save();
  }

  validateShippingDetails(shippingDetails: ShippingDetails): ShippingDetails {
    const { address, city, country, phoneNumber } = shippingDetails;

    if (!address || !city || !country || !phoneNumber) {
      throw new BadRequestException(
        'All required shipping fields must be provided',
      );
    }
    return shippingDetails;
  }

  validatePaymentMethod(paymentMethod: string): string {
    console.log('Received payment method:', paymentMethod);
    console.log('Type of payment method:', typeof paymentMethod);

    const validMethods = ['PayPal', 'Stripe', 'BOG'];
    console.log('Valid methods:', validMethods);
    console.log(
      'Is payment method in valid methods?',
      validMethods.includes(paymentMethod),
    );

    if (!validMethods.includes(paymentMethod)) {
      console.log('Payment method validation failed!');
      throw new BadRequestException('Invalid payment method');
    }

    console.log('Payment method validation passed!');
    return paymentMethod;
  }
}
