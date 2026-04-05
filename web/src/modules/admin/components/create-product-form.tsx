"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { ProductFormData as BaseProductFormData } from "@/modules/products/validation/product";
import { useLanguage } from "@/hooks/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { Color, AgeGroupItem } from "@/types";
import "./CreateProductForm.css";
import Image from "next/image";
import { getAccessToken } from "@/lib/auth";
import { useUser } from "@/modules/auth/hooks/use-user";
import { Category, SubCategory } from "@/types";
import { useStocks } from "@/hooks/useStocks";

// Helper function to check if image is from Cloudinary
const isCloudinaryImage = (src: string) =>
  src.includes("cloudinary") || src.includes("res.cloudinary.com");

// Extended ProductFormData to include all needed properties
interface ProductFormData extends BaseProductFormData {
  _id?: string;
  nameEn?: string;
  descriptionEn?: string;
  deliveryTerms?: string;
  deliveryTermsEn?: string;
  mainCategory?: string | { name: string; id?: string; _id?: string };
  subCategory?: string | { name: string; id?: string; _id?: string };
  ageGroups?: string[];
  sizes?: string[];
  colors?: string[];
  hashtags?: string[];
  categoryId?: string;
  categoryStructure?: {
    main: string;
    sub: string;
    ageGroup?: string;
  };
  videoDescription?: string; // YouTube embed code or URL
  // Discount functionality
  discountPercentage?: number;
  discountStartDate?: string;
  discountEndDate?: string;
}

interface CreateProductFormProps {
  initialData?: ProductFormData;
  onSuccess?: (data: {
    id: string;
    name: string;
    [key: string]: string | number | boolean | null | undefined;
  }) => void;
  isEdit?: boolean;
}

export function CreateProductForm({
  initialData,
  onSuccess,
  isEdit = !!initialData?._id,
}: CreateProductFormProps) {
  const { language, t } = useLanguage();
  const router = useRouter();
  const { user } = useUser();
  const isSeller = user?.role?.toLowerCase() === "seller";

  const [errors, setErrors] = useState<
    Partial<Record<keyof ProductFormData, string>>
  >({});
  const [formData, setFormData] = useState<ProductFormData & { _id?: string }>(
    initialData || {
      name: "",
      nameEn: "",
      price: 0,
      description: "",
      descriptionEn: "",
      deliveryTerms: "",
      deliveryTermsEn: "",
      images: [],
      brand: "??????", // Set default brand here
      category: "",
      subcategory: "",
      countInStock: 0,
      hashtags: [],
      brandLogo: undefined,
      videoDescription: "",
    }
  );

  // State for new category structure
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const [availableAgeGroups, setAvailableAgeGroups] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);

  const [deliveryType, setDeliveryType] = useState<"SELLER" | "??????">(
    "??????"
  );
  const [minDeliveryDays, setMinDeliveryDays] = useState("");
  const [maxDeliveryDays, setMaxDeliveryDays] = useState("");

  // Discount functionality states
  const [discountPercentage, setDiscountPercentage] = useState<string>("");
  const [discountStartDate, setDiscountStartDate] = useState<string>("");
  const [discountEndDate, setDiscountEndDate] = useState<string>("");

  const [pending, setPending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add state for hashtags input text
  const [hashtagsInput, setHashtagsInput] = useState<string>("");

  // State for effective initial data (used for stocks restoration)
  const [effectiveInitialData, setEffectiveInitialData] = useState<
    ProductFormData | undefined
  >(initialData);

  // Update effectiveInitialData when initialData changes (for editing existing products)
  useEffect(() => {
    setEffectiveInitialData(initialData);
  }, [initialData]);

  // Form data auto-save key for localStorage
  const AUTO_SAVE_KEY = `product-form-data-${
    isEdit ? formData._id || "edit" : "new"
  }`;

  // Fetch categories
  const { data: categories, isLoading: isCategoriesLoading } = useQuery<
    Category[]
  >({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/categories?includeInactive=false`
      );
      return response.json();
    },
  });

  // Fetch subcategories based on selected category
  const { data: subcategories, isLoading: isSubcategoriesLoading } = useQuery<
    SubCategory[]
  >({
    queryKey: ["subcategories", selectedCategory],
    queryFn: async () => {
      if (!selectedCategory) return [];
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/subcategories?categoryId=${selectedCategory}&includeInactive=false`
      );
      return response.json();
    },
    enabled: !!selectedCategory,
  });

  // Fetch all colors for proper nameEn support
  const { data: availableColorsData = [] } = useQuery<Color[]>({
    queryKey: ["colors"],
    queryFn: async () => {
      try {
        const response = await fetchWithAuth("/categories/attributes/colors");
        if (!response.ok) {
          return [];
        }
        return response.json();
      } catch {
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch all age groups for proper nameEn support
  const { data: availableAgeGroupsData = [] } = useQuery<AgeGroupItem[]>({
    queryKey: ["ageGroups"],
    queryFn: async () => {
      try {
        const response = await fetchWithAuth(
          "/categories/attributes/age-groups"
        );
        if (!response.ok) {
          return [];
        }
        return response.json();
      } catch {
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Get localized color name based on current language
  const getLocalizedColorName = (colorName: string): string => {
    if (language === "en") {
      // Find the color in availableColorsData to get its English name
      const colorObj = availableColorsData.find(
        (color) => color.name === colorName
      );
      return colorObj?.nameEn || colorName;
    }
    return colorName;
  };

  // Get localized age group name based on current language
  const getLocalizedAgeGroupName = (ageGroupName: string): string => {
    if (language === "en") {
      // Find the age group in availableAgeGroupsData to get its English name
      const ageGroupObj = availableAgeGroupsData.find(
        (ageGroup) => ageGroup.name === ageGroupName
      );
      return ageGroupObj?.nameEn || ageGroupName;
    }
    return ageGroupName;
  };

  const { stocks, totalCount, setStockCount } = useStocks({
    initialData: effectiveInitialData,
    attributes: [selectedAgeGroups, selectedSizes, selectedColors],
  });

  // Update available attributes when subcategory changes
  useEffect(() => {
    if (subcategories && selectedSubcategory) {
      const subcategory = subcategories.find(
        (sub) => sub.id === selectedSubcategory
      );
      if (subcategory) {
        setAvailableAgeGroups(subcategory.ageGroups || []);
        setAvailableSizes(subcategory.sizes || []);
        setAvailableColors(subcategory.colors || []);
      }
    }
  }, [subcategories, selectedSubcategory]);

  // Enhanced auto-save form data to localStorage whenever form data changes
  useEffect(() => {
    const saveFormData = () => {
      // Create comprehensive data to save including all form state
      const dataToSave = {
        formData: {
          ...formData,
          // Don't save File objects, but keep track of their names and count
          images: formData.images.map((img, index) =>
            typeof img === "string"
              ? img
              : {
                  type: "file",
                  name: img.name,
                  size: img.size,
                  index: index,
                  savedAt: Date.now(),
                }
          ),
          // Don't save brandLogo File objects but keep metadata
          brandLogo:
            typeof formData.brandLogo === "string"
              ? formData.brandLogo
              : formData.brandLogo
              ? {
                  type: "file",
                  name: formData.brandLogo.name,
                  size: formData.brandLogo.size,
                  savedAt: Date.now(),
                }
              : undefined,
        },
        selectedCategory,
        selectedSubcategory,
        selectedAgeGroups,
        selectedSizes,
        selectedColors,
        deliveryType,
        minDeliveryDays,
        maxDeliveryDays,
        discountPercentage,
        discountStartDate,
        discountEndDate,
        hashtagsInput,
        stocks, // Save current stocks data for restoration
        timestamp: Date.now(),
        version: "2.0", // Version to handle future migration
        sessionId: sessionStorage.getItem("current-session") || "default", // Track session
      };

      try {
        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(dataToSave));

        // Show subtle indication that data was saved
        console.log(
          "✅ Form data auto-saved at",
          new Date().toLocaleTimeString()
        );
      } catch (error) {
        console.warn("⚠️ Failed to auto-save form data:", error);

        // If localStorage is full, try to clear old data
        try {
          const keys = Object.keys(localStorage).filter(
            (key) => key.startsWith("product-form-") && key !== AUTO_SAVE_KEY
          );
          keys.forEach((key) => localStorage.removeItem(key));

          // Try saving again
          localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(dataToSave));
          console.log("✅ Auto-save successful after cleanup");
        } catch (retryError) {
          console.error("❌ Auto-save failed even after cleanup:", retryError);
        }
      }
    };

    // Auto-save if form has any meaningful data or user started filling it
    const hasData =
      formData.name ||
      formData.nameEn ||
      formData.description ||
      formData.descriptionEn ||
      selectedCategory ||
      selectedSubcategory ||
      formData.price > 0 ||
      formData.images.length > 0 ||
      hashtagsInput ||
      discountPercentage ||
      selectedAgeGroups.length > 0 ||
      selectedSizes.length > 0 ||
      selectedColors.length > 0;

    if (hasData && !isEdit) {
      // Only auto-save for new products, not edits
      const timeoutId = setTimeout(saveFormData, 500); // Faster debounce for better UX
      return () => clearTimeout(timeoutId);
    }
  }, [
    formData,
    selectedCategory,
    selectedSubcategory,
    selectedAgeGroups,
    selectedSizes,
    selectedColors,
    deliveryType,
    minDeliveryDays,
    maxDeliveryDays,
    discountPercentage,
    discountStartDate,
    discountEndDate,
    hashtagsInput,
    stocks,
    AUTO_SAVE_KEY,
  ]);

  // Load saved form data on component mount
  useEffect(() => {
    if (!isEdit && !initialData) {
      try {
        const savedData = localStorage.getItem(AUTO_SAVE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData);

          // Check if data is not too old (24 hours)
          const isDataFresh =
            parsedData.timestamp &&
            Date.now() - parsedData.timestamp < 24 * 60 * 60 * 1000;

          if (isDataFresh && parsedData.formData) {
            console.log("Restoring auto-saved form data");

            // Restore form data
            setFormData((prev) => ({
              ...prev,
              ...parsedData.formData,
              // Reset images array since we can't restore File objects
              images: [],
            }));

            // Restore selections
            if (parsedData.selectedCategory)
              setSelectedCategory(parsedData.selectedCategory);
            if (parsedData.selectedSubcategory)
              setSelectedSubcategory(parsedData.selectedSubcategory);
            if (parsedData.selectedAgeGroups)
              setSelectedAgeGroups(parsedData.selectedAgeGroups);
            if (parsedData.selectedSizes)
              setSelectedSizes(parsedData.selectedSizes);
            if (parsedData.selectedColors)
              setSelectedColors(parsedData.selectedColors);
            if (parsedData.deliveryType)
              setDeliveryType(parsedData.deliveryType);
            if (parsedData.minDeliveryDays)
              setMinDeliveryDays(parsedData.minDeliveryDays);
            if (parsedData.maxDeliveryDays)
              setMaxDeliveryDays(parsedData.maxDeliveryDays);
            if (parsedData.discountPercentage)
              setDiscountPercentage(parsedData.discountPercentage);
            if (parsedData.discountStartDate)
              setDiscountStartDate(parsedData.discountStartDate);
            if (parsedData.discountEndDate)
              setDiscountEndDate(parsedData.discountEndDate);
            if (parsedData.hashtagsInput)
              setHashtagsInput(parsedData.hashtagsInput);

            // Restore stocks data by setting effectiveInitialData with variants
            if (parsedData.stocks && parsedData.stocks.length > 0) {
              setEffectiveInitialData({
                ...parsedData.formData,
                variants: parsedData.stocks,
              });
            }

            // Show notification that data was restored
            const imageCount = parsedData.formData.images?.length || 0;
            const stockCount = parsedData.stocks?.length || 0;
            const imageInfo =
              imageCount > 0
                ? ` (${imageCount} სურათი ახლიდან უნდა აირჩეს)`
                : "";
            const stockInfo =
              stockCount > 0 ? ` (${stockCount} მარაგი აღდგა)` : "";

            const { dismiss } = toast({
              title: "📝 მონაცემები აღდგა",
              description: `თქვენი ძველი ფორმის მონაცემები წარმატებით აღდგა${imageInfo}${stockInfo}`,
              action: (
                <button
                  onClick={() => dismiss()}
                  className="toast-dismiss-button"
                >
                  ✕
                </button>
              ),
            });
          } else if (!isDataFresh) {
            // Remove old data
            localStorage.removeItem(AUTO_SAVE_KEY);
          }
        }
      } catch (error) {
        console.warn("Failed to restore auto-saved form data:", error);
        localStorage.removeItem(AUTO_SAVE_KEY);
      }
    }
  }, [AUTO_SAVE_KEY, isEdit, initialData]);

  // Auto-fill seller info when user data loads
  useEffect(() => {
    if (user && isSeller && !isEdit) {
      setFormData((prevData) => ({
        ...prevData,
        brand: user.name || user.storeName || "??????",
        brandLogo: user.storeLogo || undefined,
      }));
    }
  }, [user, isSeller, isEdit]);

  useEffect(() => {
    if (initialData) {
      console.log("InitialData received:", initialData);
      console.log("InitialData hashtags:", initialData.hashtags);
      console.log("InitialData variants:", initialData.variants);

      // Basic form data setup
      setFormData((prev) => ({
        ...prev,
        _id: initialData._id,
        name: initialData.name || "",
        nameEn: initialData.nameEn || "",
        brand: initialData.brand || "??????",
        brandLogo:
          typeof initialData.brandLogo === "string"
            ? initialData.brandLogo
            : undefined,
        category: initialData.category || "",
        images: initialData.images || [],
        description: initialData.description || "",
        descriptionEn: initialData.descriptionEn || "",
        deliveryTerms: initialData.deliveryTerms || "",
        deliveryTermsEn: initialData.deliveryTermsEn || "",
        price: initialData.price || 0,
        countInStock: initialData.countInStock || 0,
        ageGroups: initialData.ageGroups || [],
        sizes: initialData.sizes || [],
        colors: initialData.colors || [],
        hashtags: initialData.hashtags || [],
        videoDescription: initialData.videoDescription || "",
      }));

      // Set hashtags input text
      const hashtagsText =
        initialData.hashtags && initialData.hashtags.length > 0
          ? initialData.hashtags.join(", ")
          : "";
      setHashtagsInput(hashtagsText);

      if (initialData.deliveryType) {
        setDeliveryType(initialData.deliveryType as "SELLER" | "??????");
      }
      if (initialData.minDeliveryDays) {
        setMinDeliveryDays(initialData.minDeliveryDays.toString());
      }
      if (initialData.maxDeliveryDays) {
        setMaxDeliveryDays(initialData.maxDeliveryDays.toString());
      }

      // Set discount fields
      if (initialData.discountPercentage) {
        setDiscountPercentage(initialData.discountPercentage.toString());
      }
      if (initialData.discountStartDate) {
        // Convert date to YYYY-MM-DD format for HTML date input
        const startDate = new Date(initialData.discountStartDate);
        if (!isNaN(startDate.getTime())) {
          setDiscountStartDate(startDate.toISOString().split("T")[0]);
        }
      }
      if (initialData.discountEndDate) {
        // Convert date to YYYY-MM-DD format for HTML date input
        const endDate = new Date(initialData.discountEndDate);
        if (!isNaN(endDate.getTime())) {
          setDiscountEndDate(endDate.toISOString().split("T")[0]);
        }
      }

      // Extract category ID correctly, handling both object and string formats
      if (initialData.mainCategory) {
        const categoryId =
          typeof initialData.mainCategory === "object"
            ? initialData.mainCategory._id || initialData.mainCategory.id
            : initialData.mainCategory;

        setSelectedCategory(String(categoryId || ""));
      } else if (initialData.categoryId) {
        setSelectedCategory(String(initialData.categoryId || ""));
      }
    }
  }, [initialData]);

  // Add a separate effect for handling subcategory after category is set and subcategories are loaded
  useEffect(() => {
    // Only run this effect when editing and we have both initialData and subcategories loaded
    if (
      initialData &&
      selectedCategory &&
      subcategories &&
      subcategories.length > 0
    ) {
      // Extract subcategory ID correctly, handling both object and string formats
      if (initialData.subCategory) {
        const subcategoryId =
          typeof initialData.subCategory === "object"
            ? initialData.subCategory._id || initialData.subCategory.id
            : initialData.subCategory;

        setSelectedSubcategory(String(subcategoryId || ""));
      } else if (initialData.subcategory) {
        setSelectedSubcategory(String(initialData.subcategory || ""));
      }
    }
  }, [initialData, selectedCategory, subcategories]);

  // Clear auto-saved data from localStorage
  const clearAutoSavedData = () => {
    try {
      localStorage.removeItem(AUTO_SAVE_KEY);
      console.log("Auto-saved data cleared");
    } catch (error) {
      console.warn("Failed to clear auto-saved data:", error);
    }
  };

  // Check if there's auto-saved data and show option to clear it
  const hasAutoSavedData = () => {
    try {
      const savedData = localStorage.getItem(AUTO_SAVE_KEY);
      if (!savedData) return false;

      const parsedData = JSON.parse(savedData);
      const isDataFresh =
        parsedData.timestamp &&
        Date.now() - parsedData.timestamp < 24 * 60 * 60 * 1000;

      return (
        isDataFresh &&
        parsedData.formData &&
        (parsedData.formData.name ||
          parsedData.formData.description ||
          parsedData.selectedCategory)
      );
    } catch {
      return false;
    }
  };

  // Manual clear function for user action
  const handleClearAutoSavedData = () => {
    if (
      window.confirm(
        language === "en"
          ? "Are you sure you want to clear saved form data? This cannot be undone."
          : "დარწმუნებული ხართ, რომ გსურთ შენახული ფორმის მონაცემების წაშლა? ეს ქმედება შეუქცევადია."
      )
    ) {
      clearAutoSavedData();
      const { dismiss } = toast({
        title: "🗑️ მონაცემები წაიშალა",
        description: "შენახული ფორმის მონაცემები წარმატებით წაიშალა",
        action: (
          <button onClick={() => dismiss()} className="toast-dismiss-button">
            ✕
          </button>
        ),
      });
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      name: "",
      nameEn: "",
      price: 0,
      description: "",
      descriptionEn: "",
      deliveryTerms: "",
      deliveryTermsEn: "",
      images: [],
      brand: "??????", // Set default brand here too
      category: "",
      subcategory: "",
      countInStock: 0,
      hashtags: [],
      ageGroups: [],
      sizes: [],
      colors: [],
      brandLogo: undefined,
    });
    setHashtagsInput("");
    setErrors({});
    setServerError(null);
    setSuccess(null);

    setSelectedCategory("");
    setSelectedSubcategory("");
    setSelectedAgeGroups([]);
    setSelectedSizes([]);
    setSelectedColors([]);

    setDeliveryType("??????");
    setMinDeliveryDays("");
    setMaxDeliveryDays("");
    setDiscountPercentage("");
    setDiscountStartDate("");
    setDiscountEndDate("");

    // Clear auto-saved data when form is reset
    clearAutoSavedData();
  };
  const validateField = (field: keyof ProductFormData, value: unknown) => {
    // All validation is handled with translation keys for consistent language support
    let translatedError: string | null = null;

    switch (field) {
      case "name":
        if (!value || String(value).trim() === "") {
          translatedError = t("adminProducts.productNameRequired");
        } else if (String(value).length < 2) {
          translatedError = t("adminProducts.productNameInvalid");
        }
        break;
      case "price":
        if (!value || value === "" || value === 0) {
          translatedError = t("adminProducts.priceRequired");
        } else if (Number(value) <= 0 || isNaN(Number(value))) {
          translatedError = t("adminProducts.priceInvalid");
        }
        break;
      case "description":
        if (!value || String(value).trim() === "") {
          translatedError = t("adminProducts.descriptionRequired");
        } else if (String(value).length < 10) {
          translatedError = t("adminProducts.descriptionInvalid");
        }
        break;
      case "brand":
        if (!value || String(value).trim() === "") {
          translatedError = t("adminProducts.brandRequired");
        } else if (String(value).length < 2) {
          translatedError = t("adminProducts.brandInvalid");
        }
        break;
      case "countInStock":
        if (value !== undefined && value !== null && value !== "") {
          const numValue = Number(value);
          if (isNaN(numValue) || numValue < 0) {
            translatedError = t("adminProducts.priceInvalid"); // Reuse price validation message for now
          }
        }
        break;
      // Note: Other fields don't need explicit validation here as they're handled elsewhere
      // or don't require complex validation
    }
    if (translatedError) {
      setErrors((prev) => ({ ...prev, [field]: translatedError }));
      return false;
    } else {
      // Remove the error from the errors object completely
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      return true;
    }
  };
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const processedValue =
      name === "price" || name === "countInStock" ? Number(value) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    // Validate the field in real-time to clear errors as user types
    if (
      name in { name: 1, price: 1, description: 1, brand: 1, countInStock: 1 }
    ) {
      validateField(name as keyof ProductFormData, processedValue);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    setSelectedSubcategory("");
    setSelectedAgeGroups([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setAvailableAgeGroups([]);
    setAvailableSizes([]);
    setAvailableColors([]);
  };

  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subcategoryId = e.target.value;
    setSelectedSubcategory(subcategoryId);
    setSelectedAgeGroups([]);
    setSelectedSizes([]);
    setSelectedColors([]);
  };

  const handleAttributeChange = (
    type: "ageGroups" | "sizes" | "colors",
    value: string
  ) => {
    if (type === "ageGroups") {
      setSelectedAgeGroups((prev) =>
        prev.includes(value)
          ? prev.filter((item) => item !== value)
          : [...prev, value]
      );
    } else if (type === "sizes") {
      setSelectedSizes((prev) =>
        prev.includes(value)
          ? prev.filter((item) => item !== value)
          : [...prev, value]
      );
    } else if (type === "colors") {
      setSelectedColors((prev) =>
        prev.includes(value)
          ? prev.filter((item) => item !== value)
          : [...prev, value]
      );
    }
  };

  // Hashtags handling functions
  const handleHashtagsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setHashtagsInput(value);

    // Update hashtags array in real-time
    const hashtagsArray = value
      ? value
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      : [];

    setFormData((prev) => ({
      ...prev,
      hashtags: hashtagsArray,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files) {
      const newImages = Array.from(files);
      const totalImages = formData.images.length + newImages.length;

      // Check if total images exceed maximum limit of 15
      if (totalImages > 15) {
        const errorMessage =
          language === "en"
            ? `Maximum 15 images allowed. You selected ${totalImages} images.`
            : `მაქსიმუმ 15 სურათი შეიძლება. თქვენ აირჩიეთ ${totalImages} სურათი.`;

        toast({
          variant: "destructive",
          title: language === "en" ? "Too many images" : "ძალიან ბევრი სურათი",
          description: errorMessage,
        });

        // Reset the input value
        e.target.value = "";
        return;
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }));
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Drag and drop functionality for reordering images
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.currentTarget.outerHTML);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    setFormData((prev) => {
      const newImages = [...prev.images];
      const draggedImage = newImages[draggedIndex];

      // Remove the dragged item
      newImages.splice(draggedIndex, 1);

      // Insert it at the new position
      newImages.splice(dropIndex, 0, draggedImage);

      return {
        ...prev,
        images: newImages,
      };
    });

    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setPending(true);
    setServerError(null);
    setSuccess(null);

    try {
      // Use validateField for validating form fields
      const isNameValid = validateField("name", formData.name);
      const isPriceValid = validateField("price", formData.price);
      const isDescriptionValid = validateField(
        "description",
        formData.description
      );

      if (!isNameValid || !isPriceValid || !isDescriptionValid) {
        setPending(false);
        return;
      }

      // Validate required fields
      if (!selectedCategory) {
        setServerError(t("adminProducts.selectCategoryError"));
        setPending(false);
        return;
      }

      if (!selectedSubcategory) {
        setServerError(t("adminProducts.selectSubcategoryError"));
        setPending(false);
        return;
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (
        formData.images.some(
          (image) => image instanceof File && !allowedTypes.includes(image.type)
        )
      ) {
        setErrors((prev) => ({
          ...prev,
          images: t("adminProducts.invalidImageFormat"),
        }));
        setPending(false);
        return;
      }

      // Verify we have at least one image
      if (formData.images.length === 0) {
        setErrors((prev) => ({
          ...prev,
          images: t("adminProducts.noImageSelected"),
        }));
        setPending(false);
        return;
      }

      // Verify we don't exceed maximum 15 images
      if (formData.images.length > 15) {
        const errorMessage =
          language === "en"
            ? `Maximum 15 images allowed. You have ${formData.images.length} images.`
            : `მაქსიმუმ 15 სურათი შეიძლება. თქვენ გაქვთ ${formData.images.length} სურათი.`;

        setErrors((prev) => ({
          ...prev,
          images: errorMessage,
        }));
        setPending(false);
        return;
      }

      if (deliveryType === "SELLER" && (!minDeliveryDays || !maxDeliveryDays)) {
        setServerError(t("adminProducts.deliveryDaysRequired"));
        setPending(false);
        return;
      }

      // Validate discount fields
      if (discountPercentage && parseFloat(discountPercentage) > 0) {
        const discountValue = parseFloat(discountPercentage);
        if (discountValue < 0 || discountValue > 100) {
          setServerError(
            language === "en"
              ? "Discount percentage must be between 0 and 100"
              : "ფასდაკლების პროცენტი უნდა იყოს 0-სა და 100-ს შორის"
          );
          setPending(false);
          return;
        }

        // If discount is set, validate dates
        if (discountStartDate && discountEndDate) {
          const startDate = new Date(discountStartDate);
          const endDate = new Date(discountEndDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (endDate <= startDate) {
            setServerError(
              language === "en"
                ? "Discount end date must be after start date"
                : "ფასდაკლების დასრულების თარიღი უნდა იყოს დაწყების თარიღის შემდეგ"
            );
            setPending(false);
            return;
          }
        }
      }

      const token = getAccessToken();
      if (!token) {
        setServerError(t("adminProducts.authError"));
        setPending(false);

        // Show toast that data is saved and will redirect
        const { dismiss } = toast({
          title: "🔒 სესია ამოიწურა",
          description:
            "თქვენი მონაცემები შენახულია. შესვლის შემდეგ ავტომატურად აღდგება.",
          action: (
            <button onClick={() => dismiss()} className="toast-dismiss-button">
              ✕
            </button>
          ),
        });

        setTimeout(() => {
          window.location.href = "/login?redirect=/admin/products/create";
        }, 2000);
        return;
      }

      const formDataToSend = new FormData();

      // Add basic form fields
      formDataToSend.append("name", formData.name);
      formDataToSend.append("nameEn", formData.nameEn || "");
      formDataToSend.append("price", String(formData.price));
      formDataToSend.append("description", formData.description);
      formDataToSend.append("descriptionEn", formData.descriptionEn || "");
      formDataToSend.append("deliveryTerms", formData.deliveryTerms || "");
      formDataToSend.append("deliveryTermsEn", formData.deliveryTermsEn || "");

      // Add video description if present
      if (formData.videoDescription) {
        formDataToSend.append("videoDescription", formData.videoDescription);
      }

      formDataToSend.append("countInStock", String(totalCount));

      // Add new category structure - ensure we're sending strings, not objects
      formDataToSend.append("mainCategory", selectedCategory);
      formDataToSend.append("subCategory", selectedSubcategory);

      // Add selected attributes
      if (selectedAgeGroups.length > 0) {
        formDataToSend.append("ageGroups", JSON.stringify(selectedAgeGroups));
      }

      if (selectedSizes.length > 0) {
        formDataToSend.append("sizes", JSON.stringify(selectedSizes));
      }

      if (selectedColors.length > 0) {
        formDataToSend.append("colors", JSON.stringify(selectedColors));
      }

      // Add hashtags if they exist
      if (formData.hashtags && formData.hashtags.length > 0) {
        formDataToSend.append("hashtags", JSON.stringify(formData.hashtags));
      }

      if (stocks.length > 0) {
        console.log("Sending stocks:", stocks);
        formDataToSend.append("variants", JSON.stringify(stocks));
      }

      // Handle brand name - ensure it's always set to ?????? if empty
      if (isSeller) {
        formDataToSend.append(
          "brand",
          user?.name || user?.storeName || formData.brand || "??????"
        );
      } else {
        formDataToSend.append("brand", formData.brand || "??????");
      }

      // SIMPLIFIED logo handling - THIS IS THE FIX
      // For new uploads (File objects)
      if (formData.brandLogo instanceof File) {
        formDataToSend.append("brandLogo", formData.brandLogo);
      }
      // For existing logo URLs - just pass the URL as a string
      else if (typeof formData.brandLogo === "string" && formData.brandLogo) {
        formDataToSend.append("brandLogoUrl", formData.brandLogo);
      }
      // For sellers with profiles - use their store logo
      else if (isSeller && user?.storeLogo) {
        formDataToSend.append("brandLogoUrl", user.storeLogo);
      }

      // Add delivery type
      formDataToSend.append("deliveryType", deliveryType);

      // Add delivery days if SELLER type
      if (deliveryType === "SELLER") {
        formDataToSend.append("minDeliveryDays", minDeliveryDays);
        formDataToSend.append("maxDeliveryDays", maxDeliveryDays);
      }

      // Add discount fields
      if (discountPercentage && parseFloat(discountPercentage) > 0) {
        formDataToSend.append("discountPercentage", discountPercentage);
      }
      if (discountStartDate) {
        formDataToSend.append("discountStartDate", discountStartDate);
      }
      if (discountEndDate) {
        formDataToSend.append("discountEndDate", discountEndDate);
      }

      // Handle images - separate existing images from new ones
      const existingImages: string[] = [];
      const newFiles: File[] = [];

      formData.images.forEach((image) => {
        if (typeof image === "string") {
          existingImages.push(image);
        } else if (image instanceof File) {
          newFiles.push(image);
        }
      });

      // Add existing images as JSON array
      if (existingImages.length > 0) {
        formDataToSend.append("existingImages", JSON.stringify(existingImages));
      }

      // Add new image files
      if (newFiles.length > 0) {
        newFiles.forEach((file) => {
          formDataToSend.append("images", file);
        });
      } else if (existingImages.length === 0) {
        // If no images are provided at all, throw an error
        setErrors((prev) => ({
          ...prev,
          images: t("adminProducts.noImageSelected"),
        }));
        setPending(false);
        return;
      }

      // Double check that we're sending either existingImages or new images
      const hasImages =
        (formDataToSend.has("existingImages") &&
          JSON.parse(formDataToSend.get("existingImages") as string).length >
            0) ||
        formDataToSend.getAll("images").length > 0;
      if (!hasImages) {
        setErrors((prev) => ({
          ...prev,
          images: t("adminProducts.noImageSelected"),
        }));
        setPending(false);
        return;
      }

      const method = isEdit ? "PUT" : "POST";
      const endpoint = isEdit ? `/products/${formData._id}` : "/products";

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        {
          method,
          body: formDataToSend,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        let errorMessage = t("adminProducts.createUpdateError");
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = `Error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const successMessage = isEdit
        ? t("adminProducts.productUpdatedSuccess")
        : t("adminProducts.productAddedSuccess");
      setSuccess(successMessage);

      const { dismiss } = toast({
        title: isEdit
          ? t("adminProducts.productUpdatedToast")
          : t("adminProducts.productCreatedToast"),
        description: t("adminProducts.successTitle"),
        action: (
          <button onClick={() => dismiss()} className="toast-dismiss-button">
            ✕
          </button>
        ),
      });

      if (!isEdit) {
        resetForm();
      }

      if (onSuccess) {
        // Set a flag to force refresh when we return to the products list
        sessionStorage.setItem("returnFromEdit", "true");
        onSuccess(data);
      } else {
        // Also set the flag for direct navigation
        sessionStorage.setItem("returnFromEdit", "true");
        setTimeout(() => {
          router.push("/admin/products");
        }, 1500);
      }
    } catch (error) {
      console.error("Error:", error);

      let errorMessage =
        error instanceof Error
          ? error.message
          : t("adminProducts.generalError");

      // Check if it's an authentication error
      if (
        error instanceof Error &&
        (error.message.includes("401") ||
          error.message.includes("Unauthorized"))
      ) {
        errorMessage =
          "სესია ამოიწურა. თქვენი მონაცემები შენახულია - შესვლის შემდეგ ავტომატურად აღდგება.";

        const { dismiss } = toast({
          title: "🔒 Authentication Error",
          description:
            "თქვენი მონაცემები დაცულია. შესვლის შემდეგ კვლავ შეგიძლიათ განაგრძოთ.",
          action: (
            <button onClick={() => dismiss()} className="toast-dismiss-button">
              ✕
            </button>
          ),
        });

        setTimeout(() => {
          window.location.href =
            "/login?redirect=" + encodeURIComponent(window.location.pathname);
        }, 3000);
      } else {
        // For other errors, show that data is saved
        const { dismiss } = toast({
          title: "❌ Upload Error",
          description:
            "ატვირთვა ვერ მოხერხდა, მაგრამ თქვენი მონაცემები შენახულია. კვლავ სცადეთ.",
          action: (
            <button onClick={() => dismiss()} className="toast-dismiss-button">
              ✕
            </button>
          ),
        });
      }

      setServerError(errorMessage);
    } finally {
      setPending(false);
    }
  };

  // Also add a useEffect to fetch subcategory details when selectedSubcategory changes
  useEffect(() => {
    if (selectedSubcategory && subcategories) {
      const subcategory = subcategories.find(
        (sub) => String(sub.id) === String(selectedSubcategory)
      );

      if (subcategory) {
        // Set available options based on subcategory
        setAvailableAgeGroups(subcategory.ageGroups || []);
        setAvailableSizes(subcategory.sizes || []);
        setAvailableColors(subcategory.colors || []);

        // If we have initial data with attribute selections, make sure they're valid
        // for this subcategory before applying them
        if (initialData) {
          if (initialData.ageGroups && Array.isArray(initialData.ageGroups)) {
            const validAgeGroups = initialData.ageGroups.filter((ag) =>
              subcategory.ageGroups.includes(ag)
            );
            setSelectedAgeGroups(validAgeGroups);
          }

          if (initialData.sizes && Array.isArray(initialData.sizes)) {
            const validSizes = initialData.sizes.filter((size) =>
              subcategory.sizes.includes(size)
            );
            setSelectedSizes(validSizes);
          }

          if (initialData.colors && Array.isArray(initialData.colors)) {
            const validColors = initialData.colors.filter((color) =>
              subcategory.colors.includes(color)
            );
            setSelectedColors(validColors);
          }
        }
      }
    }
  }, [selectedSubcategory, subcategories, initialData]);

  // Add a cleanup effect when the form unmounts
  useEffect(() => {
    return () => {
      // Clean up any lingering edit flags
      const returnFromEdit = sessionStorage.getItem("returnFromEdit");
      if (returnFromEdit) {
        sessionStorage.removeItem("returnFromEdit");
      }
    };
  }, []);

  return (
    <div className="create-product-form">
      {success && (
        <div className="success-message">
          <p className="text-center">{success}</p>
        </div>
      )}

      {/* Auto-save info banner */}
      {!isEdit && (
        <div className="autosave-banner">
          <span className="autosave-banner-icon">💾</span>
          <span>
            {language === "en"
              ? "Your form data is automatically saved. If upload fails or you get logged out, your data will be restored when you return."
              : "თქვენი ფორმის მონაცემები ავტომატურად ინახება. ატვირთვის შეფერხების ან სისტემიდან გამოსვლის შემთხვევაში, მონაცემები აღდგება დაბრუნებისას."}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <div className="server-error">
            <p className="create-product-error text-center">{serverError}</p>
          </div>
        )}{" "}
        <div>
          <label htmlFor="videoDescription">
            YouTube Embed Code (optional)
          </label>
          <textarea
            id="videoDescription"
            name="videoDescription"
            value={formData.videoDescription || ""}
            onChange={handleChange}
            className="create-product-textarea"
            placeholder="Paste YouTube embed code or iframe here"
            rows={3}
          />
        </div>
        {/* Discount Section */}
        <div className="discount-section">
          <h3>
            {language === "en"
              ? "Discount Settings"
              : "ფასდაკლების პარამეტრები"}
          </h3>

          <div>
            <label htmlFor="discountPercentage">
              {language === "en"
                ? "Discount Percentage (%)"
                : "ფასდაკლების პროცენტი (%)"}
            </label>
            <input
              id="discountPercentage"
              type="number"
              value={discountPercentage}
              onChange={(e) => setDiscountPercentage(e.target.value)}
              className="create-product-input"
              placeholder={
                language === "en"
                  ? "Enter discount percentage (0-100)"
                  : "შეიყვანეთ ფასდაკლების პროცენტი (0-100)"
              }
              min={0}
              max={100}
              step={0.01}
            />
            <small
              style={{
                color: "#666",
                fontSize: "0.9rem",
                display: "block",
                marginTop: "4px",
              }}
            >
              {language === "en"
                ? "Leave empty or set to 0 for no discount"
                : "დატოვეთ ცარიელი ან დააყენეთ 0 ფასდაკლების გარეშე"}
            </small>
          </div>

          {discountPercentage && parseFloat(discountPercentage) > 0 && (
            <>
              <div>
                <label htmlFor="discountStartDate">
                  {language === "en"
                    ? "Discount Start Date"
                    : "ფასდაკლების დაწყების თარიღი"}
                </label>
                <input
                  id="discountStartDate"
                  type="date"
                  value={discountStartDate}
                  onChange={(e) => setDiscountStartDate(e.target.value)}
                  className="create-product-input"
                />
              </div>

              <div>
                <label htmlFor="discountEndDate">
                  {language === "en"
                    ? "Discount End Date"
                    : "ფასდაკლების დასრულების თარიღი"}
                </label>
                <input
                  id="discountEndDate"
                  type="date"
                  value={discountEndDate}
                  onChange={(e) => setDiscountEndDate(e.target.value)}
                  className="create-product-input"
                />
              </div>
            </>
          )}
        </div>
        <div>
          <label htmlFor="name">{t("adminProducts.productNameGe")}</label>
          <input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="create-product-input"
            required
          />
          {errors.name && <p className="create-product-error">{errors.name}</p>}
        </div>{" "}
        <div>
          <label htmlFor="nameEn">{t("adminProducts.productNameEn")}</label>
          <input
            id="nameEn"
            name="nameEn"
            value={formData.nameEn}
            onChange={handleChange}
            className="create-product-input"
            placeholder={t("adminProducts.productNameEnPlaceholder")}
          />
          {errors.nameEn && (
            <p className="create-product-error">{errors.nameEn}</p>
          )}
        </div>{" "}
        <div>
          <label htmlFor="description">
            {t("adminProducts.descriptionGe")}
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="create-product-textarea"
            required
          />
          {errors.description && (
            <p className="create-product-error">{errors.description}</p>
          )}
        </div>{" "}
        <div>
          <label htmlFor="descriptionEn">
            {t("adminProducts.descriptionEn")}
          </label>
          <textarea
            id="descriptionEn"
            name="descriptionEn"
            value={formData.descriptionEn}
            onChange={handleChange}
            className="create-product-textarea"
            placeholder={t("adminProducts.descriptionEnPlaceholder")}
          />
          {errors.descriptionEn && (
            <p className="create-product-error">{errors.descriptionEn}</p>
          )}
        </div>{" "}
        <div>
          <label htmlFor="deliveryTerms">
            {language === "ge" ? "მიწოდების პირობები" : "Delivery Terms"}
          </label>
          <textarea
            id="deliveryTerms"
            name="deliveryTerms"
            value={formData.deliveryTerms}
            onChange={handleChange}
            className="create-product-textarea"
            placeholder={
              language === "ge"
                ? "მიწოდების პირობების აღწერა ქართულად"
                : "Delivery terms description in Georgian"
            }
          />
          {errors.deliveryTerms && (
            <p className="create-product-error">{errors.deliveryTerms}</p>
          )}
        </div>{" "}
        <div>
          <label htmlFor="deliveryTermsEn">
            {language === "ge"
              ? "მიწოდების პირობები (ინგლისურად)"
              : "Delivery Terms (English)"}
          </label>
          <textarea
            id="deliveryTermsEn"
            name="deliveryTermsEn"
            value={formData.deliveryTermsEn}
            onChange={handleChange}
            className="create-product-textarea"
            placeholder={
              language === "ge"
                ? "მიწოდების პირობების აღწერა ინგლისურად"
                : "Delivery terms description in English"
            }
          />
          {errors.deliveryTermsEn && (
            <p className="create-product-error">{errors.deliveryTermsEn}</p>
          )}
        </div>{" "}
        <div>
          <label htmlFor="price">{t("adminProducts.price")}</label>
          <input
            id="price"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            className="create-product-input"
            required
          />
          {errors.price && (
            <p className="create-product-error">{errors.price}</p>
          )}
        </div>
        {/* New Category Structure */}{" "}
        <div>
          <label htmlFor="category">{t("adminProducts.category")}</label>
          <select
            id="category"
            name="category"
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="create-product-select"
            required
            disabled={isCategoriesLoading}
          >
            {" "}
            <option value="">
              {isCategoriesLoading
                ? t("adminProducts.loading")
                : t("adminProducts.selectCategory")}
            </option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {language === "en" && category.nameEn
                  ? category.nameEn
                  : category.name}
              </option>
            ))}
          </select>
        </div>{" "}
        <div>
          <label htmlFor="subcategory">{t("adminProducts.subcategory")}</label>
          <select
            id="subcategory"
            name="subcategory"
            value={selectedSubcategory}
            onChange={handleSubcategoryChange}
            className="create-product-select"
            required
            disabled={!selectedCategory || isSubcategoriesLoading}
          >
            <option value="">{t("adminProducts.selectSubcategory")}</option>
            {subcategories?.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {language === "en" && subcategory.nameEn
                  ? subcategory.nameEn
                  : subcategory.name}
              </option>
            ))}
          </select>
        </div>
        {/* Attributes Section */}
        {selectedSubcategory && (
          <div className="attributes-section">
            {availableAgeGroups.length > 0 && (
              <div className="attribute-group">
                <h3>{t("adminProducts.ageGroups")}</h3>
                <div className="attribute-options">
                  {availableAgeGroups.map((ageGroup) => (
                    <label key={ageGroup} className="attribute-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedAgeGroups.includes(ageGroup)}
                        onChange={() =>
                          handleAttributeChange("ageGroups", ageGroup)
                        }
                      />{" "}
                      <span>{getLocalizedAgeGroupName(ageGroup)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {availableSizes.length > 0 && (
              <div className="attribute-group">
                <h3>{t("adminProducts.sizes")}</h3>
                <div className="attribute-options">
                  {availableSizes.map((size) => (
                    <label key={size} className="attribute-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedSizes.includes(size)}
                        onChange={() => handleAttributeChange("sizes", size)}
                      />
                      <span>{size}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {availableColors.length > 0 && (
              <div className="attribute-group">
                <h3>{t("adminProducts.colors")}</h3>
                <div className="attribute-options">
                  {availableColors.map((color) => (
                    <label key={color} className="attribute-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedColors.includes(color)}
                        onChange={() => handleAttributeChange("colors", color)}
                      />
                      <span>{getLocalizedColorName(color)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {stocks &&
          stocks.map((stock) => (
            <div
              key={`${stock.ageGroup} - ${stock.size} - ${stock.color}`}
              className="stock-info"
            >
              {" "}
              <label>
                {stock.ageGroup ? getLocalizedAgeGroupName(stock.ageGroup) : ""}{" "}
                - {stock.size || ""} -{" "}
                {stock.color ? getLocalizedColorName(stock.color) : ""}
              </label>
              <input
                id="countInStock"
                name="countInStock"
                type="number"
                value={stock.stock}
                onChange={(elem) => setStockCount(stock, +elem.target.value)}
                min={0}
                required
              />
            </div>
          ))}{" "}
        <div>
          <label htmlFor="countInStock">{t("adminProducts.stock")}</label>
          <input
            id="countInStock"
            name="countInStock"
            type="number"
            disabled
            value={totalCount}
            onChange={handleChange}
            min={0}
            required
          />
          <small
            style={{
              color: "#666",
              fontSize: "0.9rem",
              display: "block",
              marginTop: "4px",
            }}
          >
            {language === "en"
              ? "Total stock calculated automatically from variants above."
              : "მთლიანი მარაგი ავტომატურად ითვლება ზემოთ მითითებული ვარიანტებიდან."}
          </small>
          {errors.countInStock && (
            <p className="create-product-error">{errors.countInStock}</p>
          )}
        </div>
        {/* Delivery Section
        <div className="delivery-section">
          <h3>მიწოდების ტიპი</h3>
          <div className="delivery-type-options">
            <label>
              <input
                type="radio"
                name="deliveryType"
                value="??????"
                checked={deliveryType === "??????"}
                onChange={() => setDeliveryType("??????")}
              />
              <span>?????? მიწოდება</span>
            </label>
            <label>
              <input
                type="radio"
                name="deliveryType"
                value="SELLER"
                checked={deliveryType === "SELLER"}
                onChange={() => setDeliveryType("SELLER")}
              />
              <span>გამყიდველის მიწოდება</span>
            </label>
          </div>

          {deliveryType === "SELLER" && (
            <div className="delivery-days">
              <div>
                <label htmlFor="minDeliveryDays">მინიმუმ დღეები</label>
                <input
                  id="minDeliveryDays"
                  type="number"
                  value={minDeliveryDays}
                  onChange={(e) => setMinDeliveryDays(e.target.value)}
                  min={1}
                  required
                />
              </div>
              <div>
                <label htmlFor="maxDeliveryDays">მაქსიმუმ დღეები</label>
                <input
                  id="maxDeliveryDays"
                  type="number"
                  value={maxDeliveryDays}
                  onChange={(e) => setMaxDeliveryDays(e.target.value)}
                  min={1}
                  required
                />
              </div>
            </div>
          )}
        </div> */}
        <div>
          <label htmlFor="brand">{t("adminProducts.brand")}</label>
          <input
            id="brand"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            placeholder={t("adminProducts.enterBrandName")}
            className={"create-product-input"}
          />
          {errors.brand && (
            <p className="create-product-error">{errors.brand}</p>
          )}
        </div>
        {/* Hashtags Field for SEO */}
        <div>
          <label htmlFor="hashtags">
            {language === "en"
              ? "Hashtags for SEO (English)"
              : "ჰეშთეგები SEO-სთვის"}
          </label>
          <textarea
            id="hashtags"
            name="hashtags"
            value={hashtagsInput}
            onChange={handleHashtagsChange}
            className="create-product-textarea"
            placeholder={
              language === "en"
                ? "Enter hashtags separated by commas (e.g., handmade, art, unique)"
                : "შეიყვანეთ ჰეშთეგები მძიმეებით გამოყოფილი (მაგ. ხელნაკეთი, ხელოვნება, უნიკალური)"
            }
            rows={3}
          />
          <small style={{ color: "#666", fontSize: "0.9rem" }}>
            {language === "en"
              ? "Add relevant hashtags to improve search visibility. Separate with commas."
              : "დაამატეთ შესაბამისი ჰეშთეგები ძიების გაუმჯობესებისთვის. გამოყავით მძიმეებით."}
          </small>
          {/* Hashtags preview */}
          {formData.hashtags && formData.hashtags.length > 0 && (
            <div
              style={{
                marginTop: "8px",
                padding: "8px",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px",
                border: "1px solid #e9ecef",
              }}
            >
              <small style={{ color: "#495057", fontWeight: "bold" }}>
                {language === "en" ? "Preview:" : "პრევიუ:"}
              </small>
              <div style={{ marginTop: "4px" }}>
                {formData.hashtags.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      display: "inline-block",
                      backgroundColor: "#007bff",
                      color: "white",
                      padding: "2px 6px",
                      margin: "2px",
                      borderRadius: "3px",
                      fontSize: "0.8rem",
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>{" "}
        <div>
          <label htmlFor="images">
            {t("adminProducts.images")}
            <span
              style={{
                fontSize: "0.9em",
                color: formData.images.length > 15 ? "#ef4444" : "#6b7280",
                marginLeft: "8px",
              }}
            >
              ({formData.images.length}/15)
            </span>
          </label>
          <input
            id="images"
            name="images"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="create-product-file"
            multiple
          />
          {formData.images.length === 0 && (
            <p className="upload-reminder">
              {t("adminProducts.uploadReminder")}
            </p>
          )}
          {formData.images.length >= 12 && formData.images.length <= 15 && (
            <p
              style={{
                color: formData.images.length === 15 ? "#ef4444" : "#f59e0b",
                fontSize: "0.9em",
                marginTop: "4px",
              }}
            >
              {language === "en"
                ? `${
                    formData.images.length === 15
                      ? "Maximum limit reached"
                      : `${15 - formData.images.length} more images allowed`
                  }`
                : `${
                    formData.images.length === 15
                      ? "მაქსიმალური ლიმიტი მიღწეულია"
                      : `კიდევ ${15 - formData.images.length} სურათი შეიძლება`
                  }`}
            </p>
          )}
          {formData.images.length > 1 && (
            <p
              style={{
                color: "#a5bda5",
                fontSize: "0.85em",
                marginTop: "8px",
                fontStyle: "italic",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>🔄</span>
              {language === "en"
                ? "Drag and drop images to reorder them"
                : "სურათების გადაადგილება რიგითობის შესაცვლელად"}
            </p>
          )}
          <div className="image-preview-container">
            {formData.images.map((image, index) => {
              const imageUrl =
                image instanceof File ? URL.createObjectURL(image) : image;
              return (
                <div
                  key={index}
                  className={`image-preview ${
                    draggedIndex === index ? "dragging" : ""
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  title={
                    language === "en"
                      ? "Drag to reorder"
                      : "გადაიტანეთ რიგითობის შეცვლისთვის"
                  }
                >
                  <div className="image-order-number">{index + 1}</div>
                  {isCloudinaryImage(imageUrl) ? (
                    <img
                      src={imageUrl}
                      alt="Product preview"
                      className="preview-image"
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <Image
                      loader={({ src }) => src}
                      src={imageUrl}
                      alt="Product preview"
                      width={100}
                      height={100}
                      unoptimized
                      className="preview-image"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="remove-image-button"
                    title={language === "en" ? "Remove image" : "სურათის წაშლა"}
                  >
                    ✕
                  </button>
                  <div
                    className="drag-handle"
                    title={
                      language === "en"
                        ? "Drag to reorder"
                        : "გადაიტანეთ რიგითობის შეცვლისთვის"
                    }
                  >
                    ⋮⋮
                  </div>
                </div>
              );
            })}
          </div>
          {errors.images && (
            <p className="create-product-error">{errors.images}</p>
          )}
        </div>
        <div>
          <label htmlFor="brandLogo">{t("adminProducts.brandLogo")}</label>
          <div className="brand-logo-container">
            {(user?.storeLogo || typeof formData.brandLogo === "string") && (
              <div className="image-preview">
                {isCloudinaryImage(
                  user?.storeLogo ||
                    (typeof formData.brandLogo === "string"
                      ? formData.brandLogo
                      : "")
                ) ? (
                  <img
                    alt="Brand logo"
                    src={
                      user?.storeLogo ||
                      (typeof formData.brandLogo === "string"
                        ? formData.brandLogo
                        : "")
                    }
                    className="preview-image"
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Image
                    loader={({ src }) => src}
                    alt="Brand logo"
                    src={
                      user?.storeLogo ||
                      (typeof formData.brandLogo === "string"
                        ? formData.brandLogo
                        : "")
                    }
                    width={100}
                    height={100}
                    unoptimized
                    className="preview-image"
                  />
                )}
              </div>
            )}
            <input
              id="brandLogo"
              name="brandLogo"
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setFormData((prev) => ({
                    ...prev,
                    brandLogo: e.target.files?.[0],
                  }));
                }
              }}
              className="create-product-file"
            />
          </div>
          {errors.brandLogo && (
            <p className="create-product-error">{errors.brandLogo}</p>
          )}{" "}
        </div>{" "}
        {/* General Error Display */}
        {Object.keys(errors).length > 0 && (
          <div
            className="general-errors-display"
            style={{
              backgroundColor: "#fef2f2",
              border: "2px solid #ef4444",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <h4
              className="text-red-600 font-semibold mb-2"
              style={{
                color: "#dc2626",
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              {t("adminProducts.fixErrorsBeforeSubmit")}:
            </h4>
            <ul className="text-red-600 text-sm space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li
                  key={field}
                  style={{
                    color: "#dc2626",
                    fontSize: "14px",
                    marginBottom: "4px",
                  }}
                >
                  • {error}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Validation Errors Display */}
        {(!selectedCategory ||
          !selectedSubcategory ||
          formData.images.length === 0) && (
          <div
            className="validation-errors-display"
            style={{
              backgroundColor: "#fefce8",
              border: "2px solid #eab308",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <h4
              className="text-yellow-600 font-semibold mb-2"
              style={{
                color: "#ca8a04",
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              {t("adminProducts.requiredFields")}:
            </h4>
            <ul className="text-yellow-600 text-sm space-y-1">
              {!selectedCategory && (
                <li
                  style={{
                    color: "#ca8a04",
                    fontSize: "14px",
                    marginBottom: "4px",
                  }}
                >
                  • {t("adminProducts.selectCategoryError")}
                </li>
              )}
              {!selectedSubcategory && (
                <li
                  style={{
                    color: "#ca8a04",
                    fontSize: "14px",
                    marginBottom: "4px",
                  }}
                >
                  • {t("adminProducts.selectSubcategoryError")}
                </li>
              )}
              {formData.images.length === 0 && (
                <li
                  style={{
                    color: "#ca8a04",
                    fontSize: "14px",
                    marginBottom: "4px",
                  }}
                >
                  • {t("adminProducts.noImageSelected")}
                </li>
              )}
            </ul>
          </div>
        )}{" "}
        <div className="button-container">
          <button
            type="submit"
            className="create-product-button"
            disabled={
              pending ||
              !formData.name ||
              !selectedCategory ||
              !selectedSubcategory ||
              formData.images.length === 0 ||
              Object.values(errors).some(
                (error) => error !== undefined && error !== null && error !== ""
              )
            }
            style={{
              flex: 1,
              opacity:
                pending ||
                !formData.name ||
                !selectedCategory ||
                !selectedSubcategory ||
                formData.images.length === 0 ||
                Object.keys(errors).length > 0
                  ? 0.5
                  : 1,
              cursor:
                pending ||
                !formData.name ||
                !selectedCategory ||
                !selectedSubcategory ||
                formData.images.length === 0 ||
                Object.keys(errors).length > 0
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {pending && <Loader2 className="loader" />}
            {isEdit
              ? t("adminProducts.updateProduct")
              : t("adminProducts.createProduct")}
          </button>

          {/* Clear auto-saved data button - only show if there's saved data and not editing */}
          {!isEdit && hasAutoSavedData() && (
            <button
              type="button"
              onClick={handleClearAutoSavedData}
              className="clear-autosave-button"
              title={
                language === "en"
                  ? "Clear saved form data"
                  : "შენახული მონაცემების წაშლა"
              }
            >
              🗑️
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
