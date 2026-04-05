"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import "./product-filters.css";
import { useLanguage } from "@/hooks/LanguageContext";
import { Category, SubCategory, Color, AgeGroupItem } from "@/types";
import HeartLoading from "@/components/HeartLoading/HeartLoading";
import Image from "next/image";
import { devLog } from "@/utils/logger";

// Function to get category-specific icon - now uses icon from category if available
const getCategoryIcon = (category: Category) => {
  devLog(
    "[FILTER] getCategoryIcon called with:",
    category.name,
    "Icon:",
    category.icon
  );

  // Use category icon if available
  if (category.icon) {
    devLog("[FILTER] Using API icon:", category.icon);
    return category.icon;
  }

  // Fallback to name-based icons for backwards compatibility
  devLog("[FILTER] Using fallback icon");
  const name = category.name.toLowerCase();

  if (
    name.includes("ნადირობა") ||
    name.includes("hunting") ||
    name.includes("rifle")
  ) {
    return "/gun.png";
  } else if (
    name.includes("საბრძოლო") ||
    name.includes("ammunition") ||
    name.includes("ammo")
  ) {
    return "/gun.png";
  } else if (
    name.includes("დასვენება") ||
    name.includes("camping") ||
    name.includes("camp")
  ) {
    return "/camping.png";
  } else if (
    name.includes("თევზაობა") ||
    name.includes("fishing") ||
    name.includes("fish")
  ) {
    return "/fish.png";
  } else if (
    name.includes("ტანსაცმელი") ||
    name.includes("clothing") ||
    name.includes("clothes")
  ) {
    return "/clothes.png";
  } else if (
    name.includes("აქსესუარები") ||
    name.includes("accessories") ||
    name.includes("gear")
  ) {
    return "/clothes.png";
  } else {
    return "/clothes.png"; // Default icon
  }
};

interface FilterProps {
  onCategoryChange: (categoryId: string) => void;
  onSubCategoryChange: (subcategoryId: string) => void;
  onAgeGroupChange: (ageGroup: string) => void;
  onSizeChange: (size: string) => void;
  onColorChange: (color: string) => void;
  onSortChange: (sortOption: {
    field: string;
    direction: "asc" | "desc";
  }) => void;
  onBrandChange: (brand: string) => void;
  onDiscountFilterChange: (showDiscountedOnly: boolean) => void;
  selectedCategoryId?: string;
  selectedSubCategoryId?: string;
  selectedAgeGroup?: string;
  selectedSize?: string;
  selectedColor?: string;
  selectedBrand?: string;
  showDiscountedOnly?: boolean;
  priceRange?: [number, number]; // min, max
  onPriceRangeChange: (range: [number, number]) => void;
}

export function ProductFilters({
  onCategoryChange,
  onSubCategoryChange,
  onAgeGroupChange,
  onSizeChange,
  onColorChange,
  onSortChange,
  onBrandChange,
  onDiscountFilterChange,
  onPriceRangeChange,
  selectedCategoryId,
  selectedSubCategoryId,
  selectedAgeGroup,
  selectedSize,
  selectedColor,
  selectedBrand,
  showDiscountedOnly = false,
  priceRange = [0, 1000],
}: FilterProps) {
  const { language, t } = useLanguage();
  const [minPrice, setMinPrice] = useState(priceRange[0]);
  const [maxPrice, setMaxPrice] = useState(priceRange[1]);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [brandSearchTerm, setBrandSearchTerm] = useState<string>("");
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showFloatingPopup, setShowFloatingPopup] = useState(false);

  // Update local state when props change
  useEffect(() => {
    setMinPrice(priceRange[0]);
    setMaxPrice(priceRange[1]);
  }, [priceRange]);

  // Auto-show subcategories when category is selected
  useEffect(() => {
    if (selectedCategoryId) {
      setShowSubcategories(true);
    } else {
      setShowSubcategories(false);
    }
  }, [selectedCategoryId]);

  // Fetch all categories with error handling
  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    // Removing unused error variable
  } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const response = await fetchWithAuth(
          "/categories?includeInactive=false"
        );
        if (!response.ok) {
          throw new Error(`Error fetching categories: ${response.status}`);
        }
        return response.json();
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setError(t("shop.errorLoadingCategories"));
        return [];
      }
    },
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Fetch subcategories based on selected category with error handling
  const {
    data: subcategories = [],
    isLoading: isSubcategoriesLoading,
    // Removing unused error variable
  } = useQuery<SubCategory[]>({
    queryKey: ["subcategories", selectedCategoryId],
    queryFn: async () => {
      try {
        if (!selectedCategoryId) return [];
        const response = await fetchWithAuth(
          `/subcategories?categoryId=${selectedCategoryId}&includeInactive=false`
        );
        if (!response.ok) {
          throw new Error(`Error fetching subcategories: ${response.status}`);
        }
        return response.json();
      } catch (err) {
        console.error("Failed to fetch subcategories:", err);
        setError(t("shop.errorLoadingSubcategories"));
        return [];
      }
    },
    enabled: !!selectedCategoryId,
    retry: 2,
    refetchOnWindowFocus: false,
  });
  // Fetch all available brands for filtering with error handling
  const {
    data: availableBrands = [],
    isLoading: isBrandsLoading,
    // Removing unused error variable
  } = useQuery<string[]>({
    queryKey: ["brands"],
    queryFn: async () => {
      try {
        const response = await fetchWithAuth("/products/brands");
        if (!response.ok) {
          // Try alternative endpoint
          const altResponse = await fetchWithAuth(
            "/products?page=1&limit=1000"
          );
          if (!altResponse.ok) {
            return []; // Silently fail if brands endpoint doesn't exist
          }
          const productsData = await altResponse.json();
          const products = productsData.items || productsData;
          // Extract unique brands from products
          const brands = [
            ...new Set(
              products
                .map((product: { brand?: string }) => product.brand)
                .filter(Boolean)
            ),
          ];
          return brands;
        }
        return response.json();
      } catch (err) {
        console.error("Failed to fetch brands:", err);
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });
  // Fetch all colors for filtering with proper nameEn support
  const { data: availableColors = [] } = useQuery<Color[]>({
    queryKey: ["colors"],
    queryFn: async () => {
      try {
        const response = await fetchWithAuth("/categories/attributes/colors");
        if (!response.ok) {
          console.error("Failed to fetch colors:", response.status);
          return [];
        }
        return response.json();
      } catch (err) {
        console.error("Failed to fetch colors:", err);
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });
  // Fetch all age groups for filtering with proper nameEn support
  const { data: availableAgeGroups = [] } = useQuery<AgeGroupItem[]>({
    queryKey: ["ageGroups"],
    queryFn: async () => {
      try {
        const response = await fetchWithAuth(
          "/categories/attributes/age-groups"
        );
        if (!response.ok) {
          console.error("Failed to fetch age groups:", response.status);
          return [];
        }
        return response.json();
      } catch (err) {
        console.error("Failed to fetch age groups:", err);
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Get available attributes based on selected subcategory
  const getAvailableAttributes = (
    attributeType: "ageGroups" | "sizes" | "colors"
  ): string[] => {
    if (!selectedSubCategoryId || !subcategories || subcategories.length === 0)
      return [];

    const selectedSubCategory = subcategories.find(
      (sub) =>
        sub.id === selectedSubCategoryId || sub._id === selectedSubCategoryId
    );

    if (!selectedSubCategory) return [];

    return selectedSubCategory[attributeType] || [];
  }; // Get localized color name based on current language
  const getLocalizedColorName = (colorName: string): string => {
    if (language === "en") {
      // Find the color in availableColors to get its English name
      const colorObj = availableColors.find(
        (color) => color.name === colorName
      );
      return colorObj?.nameEn || colorName;
    }
    return colorName;
  };

  // Get localized age group name based on current language
  const getLocalizedAgeGroupName = (ageGroupName: string): string => {
    if (language === "en") {
      // Find the age group in availableAgeGroups to get its English name
      const ageGroupObj = availableAgeGroups.find(
        (ageGroup) => ageGroup.name === ageGroupName
      );
      return ageGroupObj?.nameEn || ageGroupName;
    }
    return ageGroupName;
  };

  // Filter brands based on search term
  const getFilteredBrands = (): string[] => {
    if (!brandSearchTerm.trim()) {
      return availableBrands;
    }
    const searchTerm = brandSearchTerm.toLowerCase().trim();
    return availableBrands.filter(
      (brand) =>
        brand.toLowerCase().includes(searchTerm) ||
        brand.toLowerCase().startsWith(searchTerm)
    );
  };

  // Handle price range changes with validation
  const handlePriceChange = () => {
    // Validation
    if (minPrice < 0) {
      setMinPrice(0);
      return;
    }

    if (maxPrice < minPrice) {
      setMaxPrice(minPrice);
      return;
    }

    onPriceRangeChange([minPrice, maxPrice]);
  };

  // Translate category/subcategory names based on language
  const getLocalizedName = (
    name: string,
    originalItem?: { nameEn?: string }
  ): string => {
    if (language === "en") {
      // First check if the item has an English name field
      if (originalItem && originalItem.nameEn) {
        return originalItem.nameEn;
      }
      return name;
    }
    return name;
  };

  // Handle clearing specific filters
  const clearCategoryFilter = () => {
    onCategoryChange("");
    onSubCategoryChange("");
    onAgeGroupChange("");
    onSizeChange("");
    onColorChange("");
  };

  // const clearSubcategoryFilter = () => {
  //   onSubCategoryChange("");
  //   onAgeGroupChange("");
  //   onSizeChange("");
  //   onColorChange("");
  // };

  // Reset all filters to default values
  const resetAllFilters = () => {
    onCategoryChange("");
    onSubCategoryChange("");
    onAgeGroupChange("");
    onSizeChange("");
    onColorChange("");
    onBrandChange("");
    onDiscountFilterChange(false);
    setBrandSearchTerm("");
    setMinPrice(0);
    setMaxPrice(1000);
    onPriceRangeChange([0, 1000]);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowFilters(false);
      setIsClosing(false);
    }, 500); // matches animation duration
  };

  // Check for horizontal scroll on categories grid
  useEffect(() => {
    const checkScroll = () => {
      const gridElement = document.querySelector(
        ".main-categories-grid"
      ) as HTMLElement;
      if (gridElement) {
        const hasScroll = gridElement.scrollWidth > gridElement.clientWidth;
        setHasHorizontalScroll(hasScroll);
      }
    };

    // Run check after categories are loaded
    if (categories.length > 0) {
      setTimeout(checkScroll, 100); // Small delay to ensure DOM is updated
    }

    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [categories]);

  // Scroll detection for floating button
  useEffect(() => {
    const handleScroll = () => {
      const filtersElement = document.querySelector(".product-filters");

      if (filtersElement) {
        const filtersBottom = filtersElement.getBoundingClientRect().bottom;
        setIsScrolled(filtersBottom < 0); // Show floating button when filters are scrolled out of view
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  // Adjust subcategory positioning on mobile - use fixed positioning
  useEffect(() => {
    const adjustSubcategoryPositioning = () => {
      if (window.innerWidth <= 768 && showSubcategories && selectedCategoryId) {
        const selectedCategory = document.querySelector(
          ".main-category-option.selected"
        );
        const subcategoryOverlay = document.querySelector(
          ".subcategories-overlay"
        ) as HTMLElement;

        if (selectedCategory && subcategoryOverlay) {
          const categoryRect = selectedCategory.getBoundingClientRect();
          const viewportHeight = window.innerHeight;

          // Position dropdown below the selected category
          const topPosition = categoryRect.bottom + 10;

          // Ensure dropdown doesn't go off screen
          const dropdownHeight = 200; // Approximate height
          const finalTop =
            topPosition + dropdownHeight > viewportHeight
              ? Math.max(10, categoryRect.top - dropdownHeight - 10)
              : topPosition;

          subcategoryOverlay.style.position = "fixed";
          subcategoryOverlay.style.top = `${finalTop}px`;
          subcategoryOverlay.style.left = "50%";
          subcategoryOverlay.style.transform = "translateX(-50%)";
          subcategoryOverlay.style.zIndex = "999999";
        }
      }
    };

    if (showSubcategories && selectedCategoryId) {
      // Small delay to ensure DOM is ready
      setTimeout(adjustSubcategoryPositioning, 100);
    }

    window.addEventListener("resize", adjustSubcategoryPositioning);
    window.addEventListener("scroll", adjustSubcategoryPositioning);
    return () => {
      window.removeEventListener("resize", adjustSubcategoryPositioning);
      window.removeEventListener("scroll", adjustSubcategoryPositioning);
    };
  }, [showSubcategories, selectedCategoryId]);

  // Scroll selected category into view on mobile
  useEffect(() => {
    if (selectedCategoryId && window.innerWidth <= 768) {
      setTimeout(() => {
        const selectedCategory = document.querySelector(
          ".main-category-option.selected"
        );
        if (selectedCategory) {
          selectedCategory.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
          });
        }
      }, 200);
    }
  }, [selectedCategoryId]);

  // Click outside handler to close subcategories dropdown on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSubcategories && window.innerWidth <= 768) {
        const target = event.target as HTMLElement;
        const categoriesGrid = document.querySelector(".main-categories-grid");
        const subcategoriesOverlay = document.querySelector(
          ".subcategories-overlay"
        );

        // Check if click is outside both the categories grid and subcategories overlay
        if (
          categoriesGrid &&
          subcategoriesOverlay &&
          !categoriesGrid.contains(target) &&
          !subcategoriesOverlay.contains(target)
        ) {
          setShowSubcategories(false);
        }
      }
    };

    if (showSubcategories) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSubcategories]);

  return (
    <>
      {/* Floating Filter Button - Shows when scrolled */}
      {isScrolled && (
        <div className="floating-filter-container">
          <button
            className="floating-filter-btn"
            onClick={() => setShowFloatingPopup(true)}
            aria-label="Open filters"
          >
            <Image
              src="/filter.png"
              alt="Filter"
              className="filter-icon"
              width={20}
              height={20}
            />
            <span>{t("shop.filters")}</span>
          </button>
        </div>
      )}

      {/* Floating Popup Modal */}
      {showFloatingPopup && (
        <div
          className="floating-popup-overlay"
          onClick={() => setShowFloatingPopup(false)}
        >
          <div
            className="floating-popup-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="floating-popup-header">
              <h3>{t("shop.filters")}</h3>
              <button
                className="floating-popup-close"
                onClick={() => setShowFloatingPopup(false)}
              >
                ✕
              </button>
            </div>
            <div className="floating-popup-body">
              {/* Categories */}
              <div className="popup-section">
                <h4>{t("shop.categories")}</h4>
                <div className="popup-options-grid">
                  {categories.map((category) => (
                    <button
                      key={category.id || category._id}
                      className={`popup-option-btn ${
                        selectedCategoryId === (category.id || category._id)
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => {
                        const categoryId = category.id || category._id || "";
                        onCategoryChange(
                          categoryId === selectedCategoryId ? "" : categoryId
                        );
                      }}
                    >
                      {getLocalizedName(category.name, category)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategories */}
              {selectedCategoryId && subcategories.length > 0 && (
                <div className="popup-section">
                  <h4>{t("shop.subcategories")}</h4>
                  <div className="popup-options-grid">
                    {subcategories.map((sub) => (
                      <button
                        key={sub.id || sub._id}
                        className={`popup-option-btn ${
                          selectedSubCategoryId === (sub.id || sub._id)
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => {
                          const subId = sub.id || sub._id || "";
                          onSubCategoryChange(
                            subId === selectedSubCategoryId ? "" : subId
                          );
                        }}
                      >
                        {getLocalizedName(sub.name, sub)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Age Groups */}
              {selectedSubCategoryId &&
                getAvailableAttributes("ageGroups").length > 0 && (
                  <div className="popup-section">
                    <h4>{t("shop.ageGroupFilter")}</h4>
                    <div className="popup-options-grid">
                      {getAvailableAttributes("ageGroups").map((ageGroup) => (
                        <button
                          key={ageGroup}
                          className={`popup-option-btn ${
                            selectedAgeGroup === ageGroup ? "selected" : ""
                          }`}
                          onClick={() => {
                            onAgeGroupChange(
                              ageGroup === selectedAgeGroup ? "" : ageGroup
                            );
                          }}
                        >
                          {getLocalizedAgeGroupName(ageGroup)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Sizes */}
              {selectedSubCategoryId &&
                getAvailableAttributes("sizes").length > 0 && (
                  <div className="popup-section">
                    <h4>{t("shop.sizes")}</h4>
                    <div className="popup-options-grid">
                      {getAvailableAttributes("sizes").map((size) => (
                        <button
                          key={size}
                          className={`popup-option-btn ${
                            selectedSize === size ? "selected" : ""
                          }`}
                          onClick={() => {
                            onSizeChange(size === selectedSize ? "" : size);
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Colors */}
              {selectedSubCategoryId &&
                getAvailableAttributes("colors").length > 0 && (
                  <div className="popup-section">
                    <h4>{t("shop.colors")}</h4>
                    <div className="popup-options-grid">
                      {getAvailableAttributes("colors").map((color) => (
                        <button
                          key={color}
                          className={`popup-option-btn ${
                            selectedColor === color ? "selected" : ""
                          }`}
                          onClick={() => {
                            onColorChange(color === selectedColor ? "" : color);
                          }}
                        >
                          {getLocalizedColorName(color)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Brands */}
              {selectedSubCategoryId && availableBrands.length > 0 && (
                <div className="popup-section">
                  <h4>{t("shop.brands")}</h4>
                  <div className="popup-options-grid">
                    {getFilteredBrands()
                      .slice(0, 10)
                      .map((brand) => (
                        <button
                          key={brand}
                          className={`popup-option-btn ${
                            selectedBrand === brand ? "selected" : ""
                          }`}
                          onClick={() => {
                            onBrandChange(brand === selectedBrand ? "" : brand);
                          }}
                        >
                          {brand}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div className="popup-section">
                <h4>{t("shop.priceRange")}</h4>
                <div className="popup-price-inputs">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    placeholder={t("shop.min")}
                    className="popup-price-input"
                  />
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    placeholder={t("shop.max")}
                    className="popup-price-input"
                  />
                  <button
                    className="popup-price-apply"
                    onClick={handlePriceChange}
                  >
                    {t("shop.apply")}
                  </button>
                </div>
              </div>

              {/* Clear All Filters */}
              <div className="popup-section">
                <button className="popup-clear-all" onClick={resetAllFilters}>
                  {t("shop.clearAllFilters")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="product-filters">
        {/* Categories section */}
        <div className="categories-section">
          {error && (
            <div className="filter-error">
              <p>{error}</p>
              <button onClick={() => setError(null)}>{t("shop.close")}</button>
            </div>
          )}

          <div className="filter-section">
            <div className="filter-header">
              {/* <h3 className="filter-title">კატეგორიები</h3> */}{" "}
              {selectedCategoryId && (
                <button
                  className="filter-clear-btn"
                  onClick={clearCategoryFilter}
                  aria-label="Clear category filter"
                >
                  {t("shop.clear")}
                </button>
              )}
            </div>
            <div className="filter-options">
              <div
                className={`main-categories-grid ${
                  hasHorizontalScroll ? "has-scroll" : ""
                }`}
              >
                {isCategoriesLoading ? (
                  <div className="loading">
                    <HeartLoading size="medium" />
                  </div>
                ) : categories.length > 0 ? (
                  categories.map((category) => (
                    <div
                      key={category.id || category._id}
                      className={`main-category-option ${
                        selectedCategoryId === category.id ||
                        selectedCategoryId === category._id
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => {
                        const categoryId = category.id || category._id || "";
                        if (selectedCategoryId === categoryId) {
                          // If same category is clicked, just toggle subcategories visibility
                          setShowSubcategories(!showSubcategories);
                        } else {
                          // Select new category and show subcategories
                          onCategoryChange(categoryId);
                          onSubCategoryChange(""); // Clear subcategory when changing main category
                          setShowSubcategories(true);
                        }
                      }}
                    >
                      <div
                        className={`category-content ${
                          selectedCategoryId ===
                            (category.id || category._id) && showSubcategories
                            ? "subcategories-open"
                            : ""
                        }`}
                      >
                        <Image
                          src={getCategoryIcon(category)}
                          alt={category.name}
                          width={24}
                          height={24}
                          className="category-icon"
                        />
                        <span className="filter-category-name">
                          {getLocalizedName(category.name, category)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">{t("shop.noCategories")}</div>
                )}
              </div>
            </div>
          </div>

          {/* Subcategories Section - Below Categories */}
          {selectedCategoryId &&
            subcategories.length > 0 &&
            showSubcategories && (
              <div className="subcategories-section">
                <div className="subcategories-grid">
                  {isSubcategoriesLoading ? (
                    <div className="loading">
                      <HeartLoading size="medium" />
                    </div>
                  ) : (
                    subcategories.map((sub) => (
                      <div
                        key={sub.id || sub._id}
                        className={`subcategory-option ${
                          selectedSubCategoryId === (sub.id || sub._id)
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => {
                          onSubCategoryChange(sub.id || sub._id || "");
                        }}
                      >
                        <span className="filter-subcategory-name">
                          {getLocalizedName(sub.name, sub)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Filter toggle button */}
        {!showFilters && (
          <button
            className="filter-toggle-btn"
            onClick={() => setShowFilters(true)}
          >
            <Image
              src="/filter.png"
              alt="Filter"
              className="filter-icon"
              width={20}
              height={20}
            />
            {t("shop.filterToggle")}
          </button>
        )}

        {/* Additional filters section */}
        {showFilters && (
          <div className={`additional-filters ${isClosing ? "closing" : ""}`}>
            <div className="filters-header">
              <button
                className="filters-close-btn"
                onClick={handleClose}
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>
            {/* Age Group Filter */}
            {selectedSubCategoryId &&
              getAvailableAttributes("ageGroups").length > 0 && (
                <div className="filter-section">
                  <div className="filter-header">
                    {" "}
                    <h3 className="filter-title">{t("shop.ageGroupFilter")}</h3>
                    {selectedAgeGroup && (
                      <button
                        className="filter-clear-btn"
                        onClick={() => onAgeGroupChange("")}
                        aria-label="Clear age group filter"
                      >
                        {t("shop.clear")}
                      </button>
                    )}
                  </div>
                  <div className="filter-options">
                    <div className="filter-group">
                      {getAvailableAttributes("ageGroups").map((ageGroup) => (
                        <div
                          key={ageGroup}
                          className={`filter-option ${
                            selectedAgeGroup === ageGroup ? "selected" : ""
                          }`}
                          onClick={() =>
                            onAgeGroupChange(
                              ageGroup === selectedAgeGroup ? "" : ageGroup
                            )
                          }
                        >
                          {" "}
                          {getLocalizedAgeGroupName(ageGroup)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            {/* Size Filter */}
            {selectedSubCategoryId &&
              getAvailableAttributes("sizes").length > 0 && (
                <div className="filter-section">
                  <div className="filter-header">
                    {" "}
                    <h3 className="filter-title">{t("shop.sizes")}</h3>
                    {selectedSize && (
                      <button
                        className="filter-clear-btn"
                        onClick={() => onSizeChange("")}
                        aria-label="Clear size filter"
                      >
                        {t("shop.clear")}
                      </button>
                    )}
                  </div>
                  <div className="filter-options">
                    <div className="filter-group size-group">
                      {getAvailableAttributes("sizes").map((size) => (
                        <div
                          key={size}
                          className={`filter-option size ${
                            selectedSize === size ? "selected" : ""
                          }`}
                          onClick={() =>
                            onSizeChange(size === selectedSize ? "" : size)
                          }
                        >
                          {size}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}{" "}
            {/* Color Filter */}
            {selectedSubCategoryId &&
              getAvailableAttributes("colors").length > 0 && (
                <div className="filter-section">
                  <div className="filter-header">
                    {" "}
                    <h3 className="filter-title">{t("shop.colors")}</h3>
                    {selectedColor && (
                      <button
                        className="filter-clear-btn"
                        onClick={() => onColorChange("")}
                        aria-label="Clear color filter"
                      >
                        {t("shop.clear")}
                      </button>
                    )}
                  </div>
                  <div className="filter-options">
                    <div className="filter-group color-group">
                      {getAvailableAttributes("colors").map((color) => (
                        <div
                          key={color}
                          className={`filter-option color ${
                            selectedColor === color ? "selected" : ""
                          }`}
                          onClick={() =>
                            onColorChange(color === selectedColor ? "" : color)
                          }
                        >
                          {getLocalizedColorName(color)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            {/* Brand Filter */}
            {!isBrandsLoading &&
              availableBrands &&
              availableBrands.length > 0 && (
                <div className="filter-section">
                  <div className="filter-header">
                    {" "}
                    <h3 className="filter-title">{t("shop.brands")}</h3>
                    {(selectedBrand || brandSearchTerm) && (
                      <button
                        className="filter-clear-btn"
                        onClick={() => {
                          onBrandChange("");
                          setBrandSearchTerm("");
                        }}
                        aria-label="Clear brand filter"
                      >
                        {t("shop.clear")}
                      </button>
                    )}
                  </div>

                  {/* Brand Search Input */}
                  <div className="brand-search-container">
                    <input
                      type="text"
                      placeholder={t("shop.searchBrands")}
                      value={brandSearchTerm}
                      onChange={(e) => setBrandSearchTerm(e.target.value)}
                      className="brand-search-input"
                    />
                  </div>

                  <div className="filter-options">
                    <div className="filter-group brands-scrollable">
                      {getFilteredBrands().map((brand) => (
                        <div
                          key={brand}
                          className={`filter-option ${
                            selectedBrand === brand ? "selected" : ""
                          }`}
                          onClick={() =>
                            onBrandChange(brand === selectedBrand ? "" : brand)
                          }
                        >
                          {brand}
                        </div>
                      ))}

                      {/* Show message if no brands found */}
                      {getFilteredBrands().length === 0 && brandSearchTerm && (
                        <div className="no-brands-message">
                          {t("shop.noBrandsFound")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}{" "}
            {/* Discount Filter */}
            <div className="filter-section">
              <div className="filter-header">
                <h3 className="filter-title">
                  {language === "en"
                    ? "Show Discounted Products"
                    : "ფასდაკლებული პროდუქტები"}
                </h3>
                {showDiscountedOnly && (
                  <button
                    className="filter-clear-btn"
                    onClick={() => onDiscountFilterChange(false)}
                    aria-label="Clear discount filter"
                  >
                    {t("shop.clear")}
                  </button>
                )}
              </div>
              <div className="filter-options">
                <div className="filter-group">
                  <div
                    className={`filter-option discount-filter ${
                      showDiscountedOnly ? "selected" : ""
                    }`}
                    onClick={() => onDiscountFilterChange(!showDiscountedOnly)}
                    style={{
                      padding: "12px 16px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      border: "2px solid",
                      borderColor: showDiscountedOnly ? "#e74c3c" : "#ddd",
                      backgroundColor: showDiscountedOnly
                        ? "#e74c3c"
                        : "transparent",

                      fontWeight: showDiscountedOnly ? "bold" : "normal",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>
                      {showDiscountedOnly ? "✓" : "○"}
                    </span>
                    <span>{t("shop.showDiscountedProducts")}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Price Range Filter */}
            <div className="filter-section">
              {" "}
              <h3 className="filter-title">{t("shop.priceRange")}</h3>
              <div className="price-range">
                <div className="price-inputs">
                  <input
                    type="number"
                    value={minPrice}
                    min={0}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setMinPrice(value >= 0 ? value : 0);
                    }}
                    placeholder={t("shop.min")}
                    className="price-input"
                  />
                  <span className="price-separator">-</span>
                  <input
                    type="number"
                    value={maxPrice}
                    min={minPrice}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setMaxPrice(value >= minPrice ? value : minPrice);
                    }}
                    placeholder={t("shop.max")}
                    className="price-input"
                  />
                  <button
                    className="price-apply-btn"
                    onClick={handlePriceChange}
                    aria-label="Apply price filter"
                  >
                    {t("shop.applyPrice")}
                  </button>
                </div>
              </div>
            </div>{" "}
            {/* Sort Options */}
            <div className="filter-section">
              {" "}
              <h3 className="filter-title">{t("shop.sortBy")}</h3>
              <div className="sort-options">
                <select
                  className="sort-select"
                  onChange={(e) => {
                    const value = e.target.value;
                    const [field, direction] = value.split("-");
                    onSortChange({
                      field,
                      direction: direction as "asc" | "desc",
                    });
                  }}
                >
                  {" "}
                  <option value="createdAt-desc">
                    {t("shop.newest")}
                  </option>{" "}
                  <option value="price-asc">{t("shop.priceLowHigh")}</option>{" "}
                  <option value="price-desc">{t("shop.priceHighLow")}</option>{" "}
                  <option value="name-asc">{t("shop.nameAZ")}</option>{" "}
                  <option value="name-desc">{t("shop.nameZA")}</option>{" "}
                  <option value="rating-desc">{t("shop.ratingHigh")}</option>
                </select>
              </div>
            </div>
            {/* Clear All Filters Button */}
            {(selectedCategoryId ||
              selectedSubCategoryId ||
              selectedAgeGroup ||
              selectedSize ||
              selectedColor ||
              selectedBrand ||
              showDiscountedOnly ||
              minPrice > 0 ||
              maxPrice < 1000) && (
              <div className="filter-section">
                <button
                  className="clear-filters-btn"
                  onClick={resetAllFilters}
                  aria-label="Clear all filters"
                >
                  {t("shop.clearAllFilters")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
