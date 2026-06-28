export interface GuestCartItem {
  id: number;
  productId: number;
  quantity: number;
  price: string;
  product?: {
    id: number;
    name: string;
    price: number;
    description?: string;
    imageUrl?: string;
    unit?: string;
  };
}

export function getGuestCart(): GuestCartItem[] {
  try {
    return JSON.parse(localStorage.getItem("gauranitai_guest_cart") || "[]");
  } catch (error) {
    console.error("Failed to parse guest cart from localStorage:", error);
    return [];
  }
}

export function addToGuestCart(product: any, quantity: number = 1): GuestCartItem[] {
  const cart = getGuestCart();
  const existingIndex = cart.findIndex((item) => item.productId === product.id);

  if (existingIndex > -1) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({
      id: product.id, // Using product ID as the item ID for simplicity in guest checkout
      productId: product.id,
      quantity,
      price: product.price ? product.price.toString() : "0",
      product: {
        id: product.id,
        name: product.name,
        price: Number(product.price || 0),
        description: product.description || "",
        imageUrl: product.imageUrl || "",
        unit: product.unit || "",
      },
    });
  }

  localStorage.setItem("gauranitai_guest_cart", JSON.stringify(cart));
  return cart;
}

export function updateGuestCartQuantity(productId: number, quantity: number): GuestCartItem[] {
  let cart = getGuestCart();
  
  if (quantity <= 0) {
    cart = cart.filter((item) => item.productId !== productId);
  } else {
    const item = cart.find((item) => item.productId === productId);
    if (item) {
      item.quantity = quantity;
    }
  }

  localStorage.setItem("gauranitai_guest_cart", JSON.stringify(cart));
  return cart;
}

export function removeFromGuestCart(productId: number): GuestCartItem[] {
  const cart = getGuestCart().filter((item) => item.productId !== productId);
  localStorage.setItem("gauranitai_guest_cart", JSON.stringify(cart));
  return cart;
}

export function clearGuestCart(): void {
  localStorage.removeItem("gauranitai_guest_cart");
}
