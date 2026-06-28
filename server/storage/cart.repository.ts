import { db } from "../db";
import { cart, cartItems, products } from "@shared/schema";
import { eq, and } from "drizzle-orm";

type Cart = typeof cart.$inferSelect;
type CartItem = typeof cartItems.$inferSelect;

export class CartRepository {
  async getUserCarts(userId: string): Promise<Cart[]> {
    return db.select().from(cart).where(eq(cart.userId, userId));
  }

  async getOrCreateCart(userId: string): Promise<Cart> {
    const [existing] = await this.getUserCarts(userId);

    if (existing) {
      return existing;
    }

    const [newCart] = await db.insert(cart).values({ userId }).returning();
    return newCart;
  }

  async getCartWithItems(userId: string) {
    let userCarts = await this.getUserCarts(userId);
    if (userCarts.length === 0) {
      userCarts = [await this.getOrCreateCart(userId)];
    }
    
    const cartItemsByCart = await Promise.all(
      userCarts.map((userCart) =>
        db.query.cartItems.findMany({
          where: eq(cartItems.cartId, userCart.id),
          with: {
            product: true,
          },
        })
      )
    );

    return {
      cart: userCarts[0],
      items: cartItemsByCart.flat(),
    };
  }

  async addOrUpdateItem(
    userId: string,
    productId: number,
    quantity: number
  ): Promise<CartItem> {
    const userCart = await this.getOrCreateCart(userId);

    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product) {
      throw new Error("Product not found");
    }

    const existingItem = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.cartId, userCart.id),
        eq(cartItems.productId, productId)
      ),
    });

    if (existingItem) {
      const [updated] = await db
        .update(cartItems)
        .set({ quantity: Number(existingItem.quantity || 0) + quantity })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updated;
    }

    const [newItem] = await db
      .insert(cartItems)
      .values({
        cartId: userCart.id,
        productId,
        quantity,
        price: product.price,
      })
      .returning();

    return newItem;
  }

  async updateItemQuantity(
    userId: string,
    cartItemId: number,
    quantity: number
  ): Promise<CartItem | null> {
    const userCarts = await this.getUserCarts(userId);

    if (quantity <= 0) {
      await this.removeItem(userId, cartItemId);
      return null;
    }

    for (const userCart of userCarts) {
      const [updated] = await db
        .update(cartItems)
        .set({ quantity })
        .where(
          and(eq(cartItems.id, cartItemId), eq(cartItems.cartId, userCart.id))
        )
        .returning();

      if (updated) return updated;
    }

    return null;
  }

  async removeItem(userId: string, cartItemId: number): Promise<void> {
    const userCarts = await this.getUserCarts(userId);

    await Promise.all(
      userCarts.map((userCart) =>
        db
          .delete(cartItems)
          .where(
            and(eq(cartItems.id, cartItemId), eq(cartItems.cartId, userCart.id))
          )
      )
    );
  }

  async clearCart(userId: string): Promise<void> {
    const userCarts = await this.getUserCarts(userId);
    await Promise.all(
      userCarts.map((userCart) => db.delete(cartItems).where(eq(cartItems.cartId, userCart.id)))
    );
  }

  async getCartSummary(userId: string) {
    const { items } = await this.getCartWithItems(userId);

    const subtotal = items.reduce((sum, item) => {
      const itemTotal = Number(item.price || 0) * Number(item.quantity || 0);
      return sum + itemTotal;
    }, 0);

    const deliveryFee = subtotal >= 500 ? 0 : 40;
    const total = subtotal + deliveryFee;

    return {
      subtotal,
      deliveryFee,
      discount: 0,
      total,
      itemCount: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    };
  }
}

export const cartRepository = new CartRepository();
