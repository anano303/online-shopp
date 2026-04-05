"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { CartItem } from "@/types/cart";
import { apiClient } from "@/lib/api-client";
import { useUser } from "@/modules/auth/hooks/use-user";
import { useToast } from "@/hooks/use-toast";

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addItem: (productId: string, qty: number, price?: number) => Promise<void>;
  removeItem: (
    productId: string,
    size?: string,
    color?: string,
    ageGroup?: string,
  ) => Promise<void>;
  updateQuantity: (
    productId: string,
    qty: number,
    size?: string,
    color?: string,
    ageGroup?: string,
  ) => Promise<void>;
  clearCart: () => Promise<void>;
  addToCart: (
    productId: string,
    quantity?: number,
    size?: string,
    color?: string,
    ageGroup?: string,
    price?: number,
  ) => Promise<void>;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();

  const totalItems = items.reduce((total, item) => total + item.qty, 0);

  // Save cart to localStorage (only minimal info)
  const saveToLocalStorage = (
    cartItems: Array<{
      productId: string;
      qty: number;
      size?: string;
      color?: string;
      ageGroup?: string;
    }>,
  ) => {
    try {
      localStorage.setItem("guestCart", JSON.stringify(cartItems));
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
    }
  };

  // Load cart from localStorage (minimal info)
  const loadFromLocalStorage = (): Array<{
    productId: string;
    qty: number;
    size?: string;
    color?: string;
    ageGroup?: string;
  }> => {
    try {
      const stored = localStorage.getItem("guestCart");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
      return [];
    }
  };

  // Fetch full product details for guest cart items
  const enrichGuestCartItems = async (
    guestItems: Array<{
      productId: string;
      qty: number;
      size?: string;
      color?: string;
      ageGroup?: string;
    }>,
  ): Promise<CartItem[]> => {
    try {
      const enrichedItems: CartItem[] = [];

      for (const item of guestItems) {
        try {
          const { data } = await apiClient.get(`/products/${item.productId}`);
          enrichedItems.push({
            productId: item.productId,
            qty: item.qty,
            price: data.price || 0,
            name: data.name || "",
            nameEn: data.nameEn || "",
            image: data.images?.[0] || "",
            size: item.size,
            color: item.color,
            ageGroup: item.ageGroup,
          } as CartItem);
        } catch (error) {
          console.error(`Error fetching product ${item.productId}:`, error);
          // Add minimal item if fetch fails
          enrichedItems.push({
            productId: item.productId,
            qty: item.qty,
            price: 0,
            name: "Unknown Product",
            nameEn: "Unknown Product",
            image: "",
            size: item.size,
            color: item.color,
            ageGroup: item.ageGroup,
          } as CartItem);
        }
      }

      return enrichedItems;
    } catch (error) {
      console.error("Error enriching guest cart items:", error);
      return [];
    }
  };

  const addItem = useCallback(
    async (productId: string, qty: number, price?: number) => {
      console.log("addItem called", { productId, qty, price, hasUser: !!user });
      setLoading(true);

      // თუ მომხმარებელი არაა ავტორიზებული, localStorage-ში ვინახავთ
      if (!user) {
        console.log("Guest user - checking stock for addItem");
        try {
          // Fetch product to check stock
          const { data: product } = await apiClient.get(
            `/products/${productId}`,
          );
          console.log("Product fetched", {
            countInStock: product.countInStock,
          });

          // Save minimal info to localStorage
          const currentMinimalItems = loadFromLocalStorage();
          const existingItem = currentMinimalItems.find(
            (item) => item.productId === productId,
          );

          const currentQty = existingItem ? existingItem.qty : 0;
          const newTotalQty = currentQty + qty;

          // Check stock - with variant support
          let availableStock = product.countInStock;
          if (product.variants && product.variants.length > 0) {
            const totalVariantStock = product.variants.reduce(
              (sum: number, v: { stock: number }) => sum + (v.stock || 0),
              0,
            );
            availableStock = totalVariantStock;
          }

          console.log("Stock check for addItem", {
            currentQty,
            addingQty: qty,
            newTotalQty,
            availableStock,
          });

          // Check stock availability
          if (newTotalQty > availableStock) {
            console.log("Stock exceeded in addItem");
            toast({
              title: "არასაკმარისი მარაგი",
              description: `მარაგში არის მხოლოდ ${availableStock} ცალი`,
              variant: "destructive",
            });
            setLoading(false);
            return;
          }

          let updatedMinimalItems;
          if (existingItem) {
            updatedMinimalItems = currentMinimalItems.map((item) =>
              item.productId === productId
                ? { ...item, qty: item.qty + qty }
                : item,
            );
          } else {
            updatedMinimalItems = [
              ...currentMinimalItems,
              { productId, qty } as CartItem,
            ];
          }

          saveToLocalStorage(updatedMinimalItems);

          // Enrich and update state with full product details
          const enrichedItems = await enrichGuestCartItems(updatedMinimalItems);
          setItems(enrichedItems);

          toast({
            title: "პროდუქტი დაემატა",
            description:
              "პროდუქტი დაემატა კალათაში. დარეგისტრირდით რომ შეინახოთ.",
          });
        } catch {
          toast({
            title: "შეცდომა",
            description: "პროდუქტის დამატება ვერ მოხერხდა",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        const requestData: { productId: string; qty: number; price?: number } =
          {
            productId,
            qty,
          };
        if (price !== undefined) {
          requestData.price = price;
        }
        const { data } = await apiClient.post("/cart/items", requestData);
        setItems(data.items);

        toast({
          title: "პროდუქტი დაემატა",
          description: "პროდუქტი წარმატებით დაემატა კალათაში",
        });
      } catch (error) {
        if (
          (error as { response?: { status?: number } })?.response?.status ===
          401
        ) {
          console.log("Authentication error (401), redirecting to login");
          window.location.href =
            "/login?redirect=" + encodeURIComponent(window.location.pathname);
          return;
        }

        toast({
          title: "Error adding item",
          description: "There was a problem adding your item.",
          variant: "destructive",
        });
        console.error("Error adding item to cart:", error);
      } finally {
        setLoading(false);
      }
    },
    [user, toast],
  );

  const addToCart = useCallback(
    async (
      productId: string,
      quantity = 1,
      size = "",
      color = "",
      ageGroup = "",
      price?: number,
    ) => {
      console.log("addToCart called", {
        productId,
        quantity,
        size,
        color,
        ageGroup,
        hasUser: !!user,
      });

      // არაავტორიზებული მომხმარებლებისთვის localStorage-ში შენახვა
      if (!user) {
        console.log("Guest user - checking stock for addToCart");
        setLoading(true);
        try {
          // Fetch product to check stock
          const { data: product } = await apiClient.get(
            `/products/${productId}`,
          );
          console.log("Product fetched for addToCart", {
            countInStock: product.countInStock,
            variants: product.variants?.length,
          });

          // Normalize empty strings to undefined
          const normalizedSize = size || undefined;
          const normalizedColor = color || undefined;
          const normalizedAgeGroup = ageGroup || undefined;

          // Save minimal info to localStorage
          const currentMinimalItems = loadFromLocalStorage();
          // Find exact match including size, color, ageGroup
          const existingItem = currentMinimalItems.find(
            (item) =>
              item.productId === productId &&
              (item.size || undefined) === normalizedSize &&
              (item.color || undefined) === normalizedColor &&
              (item.ageGroup || undefined) === normalizedAgeGroup,
          );

          const currentQty = existingItem ? existingItem.qty : 0;
          const newTotalQty = currentQty + quantity;
          console.log("Current cart state", {
            currentQty,
            addingQty: quantity,
            newTotalQty,
          });

          // Check stock - with variant support
          let availableStock = product.countInStock;

          if (product.variants && product.variants.length > 0) {
            // Find matching variant
            const variant = product.variants.find(
              (v: {
                size?: string;
                color?: string;
                ageGroup?: string;
                stock: number;
              }) => {
                const sizeMatch = !normalizedSize
                  ? !v.size
                  : v.size === normalizedSize;
                const colorMatch = !normalizedColor
                  ? !v.color
                  : v.color === normalizedColor;
                const ageGroupMatch = !normalizedAgeGroup
                  ? !v.ageGroup
                  : v.ageGroup === normalizedAgeGroup;
                return sizeMatch && colorMatch && ageGroupMatch;
              },
            );

            if (variant) {
              availableStock = variant.stock;
            }
          }

          // Check if new total exceeds available stock
          if (newTotalQty > availableStock) {
            toast({
              title: "არასაკმარისი მარაგი",
              description: `მარაგში არის მხოლოდ ${availableStock} ცალი`,
              variant: "destructive",
            });
            setLoading(false);
            return;
          }

          let updatedMinimalItems;
          if (existingItem) {
            updatedMinimalItems = currentMinimalItems.map((item) =>
              item.productId === productId &&
              (item.size || undefined) === normalizedSize &&
              (item.color || undefined) === normalizedColor &&
              (item.ageGroup || undefined) === normalizedAgeGroup
                ? { ...item, qty: item.qty + quantity }
                : item,
            );
          } else {
            updatedMinimalItems = [
              ...currentMinimalItems,
              {
                productId,
                qty: quantity,
                size: normalizedSize,
                color: normalizedColor,
                ageGroup: normalizedAgeGroup,
              },
            ];
          }

          saveToLocalStorage(updatedMinimalItems);

          // Enrich and update state with full product details
          const enrichedItems = await enrichGuestCartItems(updatedMinimalItems);
          setItems(enrichedItems);

          toast({
            title: "პროდუქტი დაემატა კალათაში",
            description: "დარეგისტრირდით რომ შეინახოთ კალათა.",
          });
        } catch {
          toast({
            title: "შეცდომა",
            description: "პროდუქტის დამატება ვერ მოხერხდა",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const requestData: {
          productId: string;
          qty: number;
          size: string;
          color: string;
          ageGroup: string;
          price?: number;
        } = {
          productId,
          qty: quantity,
          size,
          color,
          ageGroup,
        };

        // Add price if provided (discounted price)
        if (price !== undefined) {
          requestData.price = price;
        }

        const { data } = await apiClient.post("/cart/items", requestData);
        setItems(data.items);

        // მხოლოდ წარმატებული ოპერაციის შემდეგ ვაჩვენოთ toast
        toast({
          title: "პროდუქტი დაემატა",
          description: "პროდუქტი წარმატებით დაემატა კალათაში",
        });
      } catch (error) {
        // თუ 401 შეცდომაა (არაავტორიზებული), გადავიყვანოთ ლოგინზე
        if (
          (error as { response?: { status?: number } })?.response?.status ===
          401
        ) {
          console.log("Authentication error (401), redirecting to login");
          window.location.href =
            "/login?redirect=" + encodeURIComponent(window.location.pathname);
          return;
        }

        // Handle stock-related errors from backend (400 Bad Request)
        const errorResponse = (
          error as {
            response?: { data?: { message?: string }; status?: number };
          }
        )?.response;
        if (errorResponse?.status === 400 && errorResponse?.data?.message) {
          toast({
            title: "არასაკმარისი მარაგი",
            description: errorResponse.data.message,
            variant: "destructive",
          });
          throw error;
        }

        toast({
          title: "Error",
          description: "პროდუქტის დამატება ვერ მოხერხდა",
          variant: "destructive",
        });
        console.error("Error adding item to cart:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user, toast],
  );

  const updateQuantity = useCallback(
    async (
      productId: string,
      qty: number,
      size?: string,
      color?: string,
      ageGroup?: string,
    ) => {
      console.log("updateQuantity called", {
        productId,
        qty,
        size,
        color,
        ageGroup,
        hasUser: !!user,
      });

      // არაავტორიზებული მომხმარებლებისთვის localStorage-ში განახლება
      if (!user) {
        console.log("Guest user - checking stock via API");
        setLoading(true);
        try {
          // Fetch product to check stock
          const { data: product } = await apiClient.get(
            `/products/${productId}`,
          );
          console.log("Product fetched for stock check", {
            countInStock: product.countInStock,
            variants: product.variants?.length,
          });

          // Normalize empty strings to undefined for comparison
          const normalizedSize = size || undefined;
          const normalizedColor = color || undefined;
          const normalizedAgeGroup = ageGroup || undefined;

          // Check stock - with variant support
          let availableStock = product.countInStock;

          if (product.variants && product.variants.length > 0) {
            // Find matching variant
            const variant = product.variants.find(
              (v: {
                size?: string;
                color?: string;
                ageGroup?: string;
                stock: number;
              }) => {
                const sizeMatch = !normalizedSize
                  ? !v.size
                  : v.size === normalizedSize;
                const colorMatch = !normalizedColor
                  ? !v.color
                  : v.color === normalizedColor;
                const ageGroupMatch = !normalizedAgeGroup
                  ? !v.ageGroup
                  : v.ageGroup === normalizedAgeGroup;
                return sizeMatch && colorMatch && ageGroupMatch;
              },
            );

            if (variant) {
              availableStock = variant.stock;
              console.log("Found matching variant", {
                variant,
                stock: variant.stock,
              });
            }
          }

          console.log("Stock check", { requestedQty: qty, availableStock });

          // Check if new quantity exceeds available stock
          if (qty > availableStock) {
            console.log("Stock exceeded - showing error");
            toast({
              title: "არასაკმარისი მარაგი",
              description: `მარაგში არის მხოლოდ ${availableStock} ცალი`,
              variant: "destructive",
            });
            setLoading(false);
            return;
          }

          console.log("Stock OK - updating quantity");
          // Update state with full item info (match by all attributes)
          const updatedStateItems = items.map((item) =>
            item.productId === productId &&
            (item.size || undefined) === normalizedSize &&
            (item.color || undefined) === normalizedColor &&
            (item.ageGroup || undefined) === normalizedAgeGroup
              ? { ...item, qty }
              : item,
          );
          setItems(updatedStateItems);

          // Save minimal info to localStorage
          const minimalItems = updatedStateItems.map((item) => ({
            productId: item.productId,
            qty: item.qty,
            size: item.size || undefined,
            color: item.color || undefined,
            ageGroup: item.ageGroup || undefined,
          }));
          saveToLocalStorage(minimalItems);
          console.log("Guest cart updated successfully");
        } catch (error) {
          console.error("Error updating guest cart:", error);
          toast({
            title: "შეცდომა",
            description: "რაოდენობის განახლება ვერ მოხერხდა",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
        return;
      }

      console.log("Authorized user - updating via API");

      setLoading(true);
      try {
        const { data } = await apiClient.put(`/cart/items/${productId}`, {
          qty,
          size,
          color,
          ageGroup,
        });
        setItems(data.items);
      } catch (error) {
        // თუ 401 შეცდომაა (არაავტორიზებული), გადავიყვანოთ ლოგინზე
        if (
          (error as { response?: { status?: number } })?.response?.status ===
          401
        ) {
          console.log("Authentication error (401), redirecting to login");
          window.location.href =
            "/login?redirect=" + encodeURIComponent(window.location.pathname);
          return;
        }

        console.error("Error updating item quantity:", error);
        toast({
          title: "Error",
          description: "There was a problem updating your item quantity.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [user, toast, items],
  );

  const removeItem = useCallback(
    async (
      productId: string,
      size?: string,
      color?: string,
      ageGroup?: string,
    ) => {
      // არაავტორიზებული მომხმარებლებისთვის localStorage-დან წაშლა
      if (!user) {
        // Normalize empty strings to undefined for comparison
        const normalizedSize = size || undefined;
        const normalizedColor = color || undefined;
        const normalizedAgeGroup = ageGroup || undefined;

        // Update state (remove from enriched items - match by all attributes)
        const updatedStateItems = items.filter(
          (item) =>
            !(
              item.productId === productId &&
              (item.size || undefined) === normalizedSize &&
              (item.color || undefined) === normalizedColor &&
              (item.ageGroup || undefined) === normalizedAgeGroup
            ),
        );
        setItems(updatedStateItems);

        // Save minimal info to localStorage
        const minimalItems = updatedStateItems.map((item) => ({
          productId: item.productId,
          qty: item.qty,
          size: item.size || undefined,
          color: item.color || undefined,
          ageGroup: item.ageGroup || undefined,
        }));
        saveToLocalStorage(minimalItems);

        toast({
          title: "პროდუქტი წაიშალა",
          description: "პროდუქტი წაიშალა კალათიდან",
        });
        return;
      }

      setLoading(true);
      try {
        const { data } = await apiClient.delete(`/cart/items/${productId}`, {
          data: { size, color, ageGroup },
        });
        setItems(data.items);
      } catch (error) {
        // თუ 401 შეცდომაა (არაავტორიზებული), გადავიყვანოთ ლოგინზე
        if (
          (error as { response?: { status?: number } })?.response?.status ===
          401
        ) {
          console.log("Authentication error (401), redirecting to login");
          window.location.href =
            "/login?redirect=" + encodeURIComponent(window.location.pathname);
          return;
        }

        console.error("Error removing item from cart:", error);
        toast({
          title: "Error",
          description: "There was a problem removing your item from the cart.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [user, toast, items],
  );

  const clearCart = useCallback(async () => {
    // არაავტორიზებული მომხმარებლებისთვის localStorage-ს გასუფთავება
    if (!user) {
      localStorage.removeItem("guestCart");
      setItems([]);
      toast({
        title: "კალათა გასუფთავებულია",
        description: "ყველა პროდუქტი წაიშალა კალათიდან",
      });
      return;
    }

    setLoading(true);
    try {
      await apiClient.delete("/cart");
      setItems([]);
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart.",
      });
    } catch (error) {
      // თუ 401 შეცდომაა (არაავტორიზებული), გადავიყვანოთ ლოგინზე
      if (
        (error as { response?: { status?: number } })?.response?.status === 401
      ) {
        console.log("Authentication error (401), redirecting to login");
        window.location.href =
          "/login?redirect=" + encodeURIComponent(window.location.pathname);
        return;
      }

      console.error("Error clearing cart:", error);
      toast({
        title: "Error clearing cart",
        description: "There was a problem clearing your cart.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    const loadCart = async () => {
      setLoading(true);
      try {
        if (user) {
          // როცა მომხმარებელი ლოგინდება, localStorage-დან ბექენდში გადავიტანოთ
          const guestItems = loadFromLocalStorage();

          // ჯერ ბექენდიდან ვტვირთავთ არსებულ კალათას
          const { data } = await apiClient.get("/cart");
          let serverItems = data.items || [];

          // თუ localStorage-ში იყო რაღაც, ბექენდში დავამატოთ
          if (guestItems.length > 0) {
            for (const item of guestItems) {
              try {
                await apiClient.post("/cart/items", {
                  productId: item.productId,
                  qty: item.qty,
                });
              } catch (error) {
                console.error("Error syncing guest cart item:", error);
              }
            }

            // განახლებული კალათა ვტვირთავთ
            const { data: updatedData } = await apiClient.get("/cart");
            serverItems = updatedData.items || [];

            // localStorage-ს ვასუფთავებთ
            localStorage.removeItem("guestCart");

            toast({
              title: "კალათა სინქრონიზებულია",
              description: "თქვენი პროდუქტები დაემატა კალათაში",
            });
          }

          setItems(serverItems);
        } else {
          // არაავტორიზებული მომხმარებლებისთვის localStorage-დან ვტვირთავთ
          const guestItems = loadFromLocalStorage();
          // Enrich guest cart items with full product details
          const enrichedItems = await enrichGuestCartItems(guestItems);
          setItems(enrichedItems);
        }
      } catch (error) {
        console.error("Error loading cart:", error);
        if (
          (error as { response?: { status?: number } })?.response?.status ===
          401
        ) {
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [user, toast]);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        addToCart,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
