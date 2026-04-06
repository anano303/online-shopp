import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserDocument } from 'src/users/schemas/user.schema';
import {
  Product,
  ProductDocument,
  ProductStatus,
  MainCategory,
  AgeGroup,
  CategoryStructure,
} from '../schemas/product.schema';
import { PaginatedResponse } from '@/types';
import { Order } from '../../orders/schemas/order.schema';
import { sampleProduct } from '@/utils/data/product';
import { Role } from '@/types/role.enum';
import {
  HANDMADE_CATEGORIES,
  PAINTING_CATEGORIES,
  CLOTHING_CATEGORIES,
  ACCESSORIES_CATEGORIES,
  FOOTWEAR_CATEGORIES,
  SWIMWEAR_CATEGORIES,
  CATEGORY_MAPPING,
} from '@/utils/subcategories';
import { ProductDto, FindAllProductsDto } from '../dtos/product.dto';

interface FindManyParams {
  keyword?: string;
  page?: string;
  limit?: string;
  user?: UserDocument;
  status?: ProductStatus;
  brand?: string;
  mainCategory?: string;
  subCategory?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  ageGroup?: string;
  size?: string;
  color?: string;
  discounted?: boolean;
  includeVariants?: boolean;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
  ) {}

  async findTopRated(): Promise<ProductDocument[]> {
    const products = await this.productModel
      .find({})
      .sort({ rating: -1 })
      .limit(3);

    return products;
  }

  async findMany(params: FindManyParams): Promise<PaginatedResponse<Product>> {
    const {
      keyword,
      page = '1',
      limit = '10',
      user,
      status,
      brand,
      mainCategory,
      subCategory,
      sortBy = 'createdAt',
      sortDirection = 'desc',
      ageGroup,
      size,
      color,
      discounted,
      includeVariants = false,
    } = params;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const filter: any = {};

    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { nameEn: { $regex: keyword, $options: 'i' } },
        // { description: { $regex: keyword, $options: 'i' } },
        // { descriptionEn: { $regex: keyword, $options: 'i' } },
        // { brand: { $regex: keyword, $options: 'i' } },
        // { hashtags: { $in: [new RegExp(keyword, 'i')] } },
      ];
    }

    if (user) {
      filter.user = user._id;
    }

    if (status) {
      filter.status = status;
    }

    if (brand) {
      // Use case-insensitive exact match for brand and trim whitespace
      const escaped = brand.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.brand = { $regex: `^${escaped}$`, $options: 'i' };
    }

    // Handle category filtering with the new structure
    if (mainCategory) {
      // Try to convert to ObjectId if it's a valid ID
      try {
        filter.mainCategory = new Types.ObjectId(mainCategory);
      } catch (error) {
        // If it's not a valid ObjectId, use as is
        filter.mainCategory = mainCategory;
      }
    }

    if (subCategory) {
      try {
        filter.subCategory = new Types.ObjectId(subCategory);
      } catch (error) {
        filter.subCategory = subCategory;
      }
    }

    // Filter by attributes
    if (ageGroup) {
      filter.ageGroups = ageGroup;
    }

    if (size) {
      filter.sizes = size;
    }

    if (color) {
      filter.colors = color;
    }

    // Filter by discount status
    if (discounted === true) {
      const now = new Date();
      filter.$and = [
        { discountPercentage: { $exists: true, $gt: 0 } },
        {
          $or: [
            { discountStartDate: { $exists: false } },
            { discountStartDate: null },
            { discountStartDate: { $lte: now } },
          ],
        },
        {
          $or: [
            { discountEndDate: { $exists: false } },
            { discountEndDate: null },
            { discountEndDate: { $gte: now } },
          ],
        },
      ];
    }

    const sort: any = {};
    sort[sortBy] = sortDirection === 'asc' ? 1 : -1;

    const count = await this.productModel.countDocuments(filter);
    const productQuery = this.productModel
      .find(filter)
      .sort(sort)
      .populate('user', 'name')
      // Ensure we populate all fields from category objects
      .populate('mainCategory')
      .populate('subCategory')
      .skip(skip)
      .limit(limitNumber);

    // Only include variants if explicitly requested to keep response size down
    if (!includeVariants) {
      productQuery.select('-variants');
    }

    const products = await productQuery.exec();

    // Return in consistent format that matches PaginatedResponse
    return {
      items: products,
      total: count,
      page: pageNumber,
      pages: Math.ceil(count / limitNumber),
    };
  }

  async findAllBrands(): Promise<string[]> {
    try {
      const brands = await this.productModel.distinct('brand', {
        status: ProductStatus.APPROVED,
        brand: { $exists: true, $ne: null, $nin: ['', undefined] },
      });
      return brands.sort();
    } catch (error) {
      console.error('Error fetching brands:', error);
      return [];
    }
  }

  async findById(id: string): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid product ID.');

    const product = await this.productModel
      .findById(id)
      .populate('mainCategory')
      .populate('subCategory');

    if (!product) throw new NotFoundException('No product with given ID.');

    // Check if categoryStructure exists
    if (!product.categoryStructure) {
      let mainCat = MainCategory.CLOTHING; // Default to CLOTHING

      if (CLOTHING_CATEGORIES.includes(product.category)) {
        mainCat = MainCategory.CLOTHING;
      } else if (ACCESSORIES_CATEGORIES.includes(product.category)) {
        mainCat = MainCategory.ACCESSORIES;
      } else if (FOOTWEAR_CATEGORIES.includes(product.category)) {
        mainCat = MainCategory.FOOTWEAR;
      } else if (SWIMWEAR_CATEGORIES.includes(product.category)) {
        mainCat = MainCategory.SWIMWEAR;
      } else {
        // Handle legacy categories
        const mappedCategory = CATEGORY_MAPPING[product.category];
        if (mappedCategory) {
          if (CLOTHING_CATEGORIES.includes(mappedCategory)) {
            mainCat = MainCategory.CLOTHING;
          } else if (ACCESSORIES_CATEGORIES.includes(mappedCategory)) {
            mainCat = MainCategory.ACCESSORIES;
          } else if (FOOTWEAR_CATEGORIES.includes(mappedCategory)) {
            mainCat = MainCategory.FOOTWEAR;
          } else if (SWIMWEAR_CATEGORIES.includes(mappedCategory)) {
            mainCat = MainCategory.SWIMWEAR;
          }
          product.category = mappedCategory;
        }
      }

      // Create a categoryStructure object
      product.categoryStructure = {
        main: mainCat,
        sub: product.category,
      };
    }

    return product;
  }

  findByIds(productIds: string[]): Promise<ProductDocument[]> {
    if (!productIds || productIds.length === 0) {
      return Promise.resolve([]);
    }

    return this.productModel
      .find({ _id: { $in: productIds } })
      .populate('mainCategory')
      .populate('subCategory')
      .exec();
  }

  async createMany(products: Partial<Product>[]): Promise<ProductDocument[]> {
    const createdProducts = await this.productModel.insertMany(products);

    return createdProducts as unknown as ProductDocument[];
  }

  async createSample(): Promise<ProductDocument> {
    const createdProduct = await this.productModel.create(sampleProduct);

    return createdProduct;
  }

  async update(id: string, attrs: Partial<Product>): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid product ID.');

    const product = await this.productModel.findById(id);
    if (!product) throw new NotFoundException('No product with given ID.');

    // Convert string IDs to ObjectIds for category references
    const data = { ...attrs };

    // Handle mainCategory properly - ensure it's converted to ObjectId if it's a valid ID
    if (data.mainCategory !== undefined) {
      if (
        typeof data.mainCategory === 'string' &&
        data.mainCategory &&
        Types.ObjectId.isValid(data.mainCategory)
      ) {
        try {
          data.mainCategory = new Types.ObjectId(data.mainCategory);
        } catch (error) {
          console.warn('Invalid mainCategory ID format', data.mainCategory);
        }
      } else if (data.mainCategory === null) {
        // If explicitly set to null, keep it null
        data.mainCategory = null;
      } else if (
        typeof data.mainCategory === 'object' &&
        data.mainCategory !== null
      ) {
        // If it's already an object (like from MongoDB), keep it
      }
    }

    // Handle subCategory properly - ensure it's converted to ObjectId if it's a valid ID
    if (data.subCategory !== undefined) {
      if (
        typeof data.subCategory === 'string' &&
        data.subCategory &&
        Types.ObjectId.isValid(data.subCategory)
      ) {
        try {
          data.subCategory = new Types.ObjectId(data.subCategory);
        } catch (error) {
          console.warn('Invalid subCategory ID format', data.subCategory);
        }
      } else if (data.subCategory === null) {
        // If explicitly set to null, keep it null
        data.subCategory = null;
      } else if (
        typeof data.subCategory === 'object' &&
        data.subCategory !== null
      ) {
        // If it's already an object (like from MongoDB), keep it
      }
    }

    // Create updateFields object with the processed data
    const updateFields: any = {};

    // Copy all the fields that need to be updated
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.nameEn !== undefined) updateFields.nameEn = data.nameEn;
    if (data.price !== undefined) updateFields.price = data.price;
    if (data.description !== undefined)
      updateFields.description = data.description;
    if (data.descriptionEn !== undefined)
      updateFields.descriptionEn = data.descriptionEn;
    if (data.deliveryTerms !== undefined)
      updateFields.deliveryTerms = data.deliveryTerms;
    if (data.deliveryTermsEn !== undefined)
      updateFields.deliveryTermsEn = data.deliveryTermsEn;
    if (data.videoDescription !== undefined)
      updateFields.videoDescription = data.videoDescription;
    if (data.images) updateFields.images = data.images;
    if (data.brandLogo) updateFields.brandLogo = data.brandLogo;
    if (data.brand) updateFields.brand = data.brand;
    if (data.countInStock !== undefined)
      updateFields.countInStock = data.countInStock;
    if (data.status) updateFields.status = data.status;
    if (data.deliveryType) updateFields.deliveryType = data.deliveryType;
    if (data.minDeliveryDays !== undefined)
      updateFields.minDeliveryDays = data.minDeliveryDays;
    if (data.maxDeliveryDays !== undefined)
      updateFields.maxDeliveryDays = data.maxDeliveryDays;
    if (data.dimensions) updateFields.dimensions = data.dimensions;
    if (data.categoryStructure)
      updateFields.categoryStructure = data.categoryStructure;

    // Add discount fields
    if (data.discountPercentage !== undefined)
      updateFields.discountPercentage = data.discountPercentage;
    if (data.discountStartDate !== undefined)
      updateFields.discountStartDate = data.discountStartDate;
    if (data.discountEndDate !== undefined)
      updateFields.discountEndDate = data.discountEndDate;

    // Always update category fields separately to ensure they're set correctly
    if (data.category) updateFields.category = data.category;
    if (data.mainCategory !== undefined) {
      updateFields.mainCategory = data.mainCategory;
    }
    if (data.subCategory !== undefined) {
      updateFields.subCategory = data.subCategory;
    }

    // Handle arrays properly
    if (data.ageGroups)
      updateFields.ageGroups = Array.isArray(data.ageGroups)
        ? data.ageGroups
        : [];
    if (data.sizes)
      updateFields.sizes = Array.isArray(data.sizes) ? data.sizes : [];
    if (data.colors)
      updateFields.colors = Array.isArray(data.colors) ? data.colors : [];
    if (data.hashtags !== undefined)
      updateFields.hashtags = Array.isArray(data.hashtags) ? data.hashtags : [];

    console.log('Updating product with hashtags:', updateFields.hashtags);

    if (data.variants) {
      // Ensure variants is an array
      if (Array.isArray(data.variants)) {
        // Clean up variant attributes (remove empty strings) and merge duplicates
        const cleaned = data.variants
          .map((variant: any) => {
            const v: any = { stock: variant.stock || 0 };
            if (variant.size && String(variant.size).trim() !== '' && variant.size !== 'undefined' && variant.size !== 'null') {
              v.size = String(variant.size).trim();
            }
            if (variant.color && String(variant.color).trim() !== '' && variant.color !== 'undefined' && variant.color !== 'null') {
              v.color = String(variant.color).trim();
            }
            if (variant.ageGroup && String(variant.ageGroup).trim() !== '' && variant.ageGroup !== 'undefined' && variant.ageGroup !== 'null') {
              v.ageGroup = String(variant.ageGroup).trim();
            }
            if (variant._id) v._id = variant._id;
            return v;
          })
          .filter((v: any) => v.size || v.color || v.ageGroup || v.stock > 0);

        // Merge duplicates
        const merged: Record<string, any> = {};
        for (const v of cleaned) {
          const key = `${v.size || ''}|${v.color || ''}|${v.ageGroup || ''}`;
          if (!merged[key]) {
            merged[key] = { ...v };
          } else {
            merged[key].stock += v.stock;
          }
        }
        updateFields.variants = Object.values(merged);
      } else {
        throw new BadRequestException('Variants must be an array');
      }
    }

    // Make sure we have proper population options
    const populateOptions = [{ path: 'mainCategory' }, { path: 'subCategory' }];

    // Use findByIdAndUpdate to completely replace the document with our new values
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true, runValidators: true },
      )
      .populate(populateOptions);

    return updatedProduct;
  }

  async updateStatus(
    id: string,
    status: ProductStatus,
    rejectionReason?: string,
  ): Promise<ProductDocument> {
    const product = await this.findById(id);

    product.status = status;
    if (rejectionReason) {
      product.rejectionReason = rejectionReason;
    }

    return product.save();
  }

  async findByStatus(status: ProductStatus): Promise<Product[]> {
    return this.productModel
      .find({ status })
      .populate('user', 'name')
      .populate('mainCategory', 'name')
      .populate('subCategory', 'name ageGroups sizes colors')
      .sort({ createdAt: -1 })
      .exec();
  }

  async createReview(
    id: string,
    user: UserDocument,
    rating: number,
    comment: string,
  ): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid product ID.');

    const product = await this.productModel.findById(id);

    if (!product) throw new NotFoundException('No product with given ID.');

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === user._id.toString(),
    );

    if (alreadyReviewed)
      throw new BadRequestException('Product already reviewed!');

    const hasPurchased = await this.orderModel.findOne({
      user: user._id,
      'orderItems.productId': id,
      status: 'delivered',
    });

    if (!hasPurchased)
      throw new BadRequestException({
        message: 'You can only review products you have purchased',
        code: 'PRODUCT_NOT_PURCHASED',
        statusCode: 400,
      });

    const review = {
      name: user.name,
      rating,
      comment,
      user,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    product.reviews.push(review);

    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    product.numReviews = product.reviews.length;

    const updatedProduct = await product.save();

    return updatedProduct;
  }

  async deleteOne(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid product ID.');

    const product = await this.productModel.findById(id);

    if (!product) throw new NotFoundException('No product with given ID.');

    await product.deleteOne();
  }

  async deleteMany(): Promise<void> {
    await this.productModel.deleteMany({});
  }

  async create(productData: Partial<Product>): Promise<ProductDocument> {
    try {
      // Convert string IDs to ObjectIds for category references
      const data = { ...productData };

      // Handle category references properly
      if (typeof data.mainCategory === 'string' && data.mainCategory) {
        try {
          data.mainCategory = new Types.ObjectId(data.mainCategory);
        } catch (error) {
          console.warn('Invalid mainCategory ID format', data.mainCategory);
        }
      }

      if (typeof data.subCategory === 'string' && data.subCategory) {
        try {
          data.subCategory = new Types.ObjectId(data.subCategory);
        } catch (error) {
          console.warn('Invalid subCategory ID format', data.subCategory);
        }
      }

      // Ensure arrays are properly initialized
      data.ageGroups = Array.isArray(data.ageGroups) ? data.ageGroups : [];
      data.sizes = Array.isArray(data.sizes) ? data.sizes : [];
      data.colors = Array.isArray(data.colors) ? data.colors : [];
      data.hashtags = Array.isArray(data.hashtags) ? data.hashtags : [];

      console.log('Creating product with hashtags:', data.hashtags);

      // Parse variants if it's a string
      if (data.variants && typeof data.variants === 'string') {
        try {
          data.variants = JSON.parse(data.variants);
        } catch (error) {
          console.error('Error parsing variants string to JSON:', error);
          throw new BadRequestException(
            'Invalid variants format. Expected a valid JSON array.',
          );
        }
      }

      // Ensure variants is an array
      if (data.variants && !Array.isArray(data.variants)) {
        throw new BadRequestException('Variants must be an array');
      }

      // Filter out empty/invalid variants but keep attribute-less variants with stock
      if (data.variants && Array.isArray(data.variants)) {
        data.variants = data.variants
          .map((variant: any) => {
            // Clean up empty string attributes
            const cleaned: any = { stock: variant.stock || 0 };
            if (
              variant.size &&
              typeof variant.size === 'string' &&
              variant.size.trim() !== '' &&
              variant.size !== 'undefined' &&
              variant.size !== 'null'
            ) {
              cleaned.size = variant.size.trim();
            }
            if (
              variant.color &&
              typeof variant.color === 'string' &&
              variant.color.trim() !== '' &&
              variant.color !== 'undefined' &&
              variant.color !== 'null'
            ) {
              cleaned.color = variant.color.trim();
            }
            if (
              variant.ageGroup &&
              typeof variant.ageGroup === 'string' &&
              variant.ageGroup.trim() !== '' &&
              variant.ageGroup !== 'undefined' &&
              variant.ageGroup !== 'null'
            ) {
              cleaned.ageGroup = variant.ageGroup.trim();
            }
            return cleaned;
          })
          .filter((variant: any) => {
            // Keep variant if it has any valid attribute OR has stock > 0
            const hasAttribute = variant.size || variant.color || variant.ageGroup;
            return hasAttribute || variant.stock > 0;
          });

        // Merge duplicate variants (same attributes)
        const merged: Record<string, any> = {};
        for (const v of data.variants) {
          const key = `${v.size || ''}|${v.color || ''}|${v.ageGroup || ''}`;
          if (!merged[key]) {
            merged[key] = { ...v };
          } else {
            merged[key].stock += v.stock;
          }
        }
        data.variants = Object.values(merged);

        // If no valid variants remain, set empty array
        if (data.variants.length === 0) {
          data.variants = [];
        }
      }

      const status =
        productData.user.role === Role.Admin
          ? ProductStatus.APPROVED
          : ProductStatus.PENDING;

      // Create the product without any indexes that could cause the parallel array issue
      const product = new this.productModel({
        ...data,
        status,
        rating: 0,
        numReviews: 0,
        reviews: [],
      });

      // Save the product
      await product.save();
      return product;
    } catch (error) {
      console.error('Error creating product:', error);

      // Check for MongoDB error code 171 (cannot index parallel arrays)
      if (
        error.code === 171 ||
        error.message?.includes('cannot index parallel arrays')
      ) {
        throw new BadRequestException(
          'Database error: Cannot create product with multiple array attributes. This is a MongoDB limitation. Please contact the administrator.',
        );
      }

      // Rethrow any other errors
      throw error;
    }
  }

  async duplicate(id: string, user: UserDocument): Promise<ProductDocument> {
    const original = await this.productModel.findById(id).exec();
    if (!original) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const productObj = original.toObject() as any;
    delete productObj._id;
    delete productObj.__v;
    delete productObj.createdAt;
    delete productObj.updatedAt;

    const duplicated = new this.productModel({
      ...productObj,
      name: `${productObj.name} (ასლი)`,
      nameEn: productObj.nameEn
        ? `${productObj.nameEn} (Copy)`
        : undefined,
      status: ProductStatus.APPROVED,
      rating: 0,
      numReviews: 0,
      reviews: [],
      user: user,
    });

    return duplicated.save();
  }

  async findAll(options: FindAllProductsDto): Promise<any> {
    let query = {};
    if (options.mainCategory) {
      query = { ...query, 'categoryStructure.main': options.mainCategory };
    }
    if (options.ageGroup) {
      query = { ...query, 'categoryStructure.ageGroup': options.ageGroup };
    }

    // Additional logic for fetching products based on the query
    return this.productModel.find(query).exec();
  }

  // Add a method to check stock availability by size and color
  async checkStockAvailability(
    productId: string,
    quantity: number = 1,
    size?: string,
    color?: string,
    ageGroup?: string,
  ): Promise<boolean> {
    const product = await this.productModel.findById(productId).exec();

    if (!product) {
      return false;
    }

    // If the product has variants
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find((v) => {
        // Match size: if no size specified, variant shouldn't have size either
        const sizeMatch = !size ? !v.size : v.size === size;
        // Match color: if no color specified, variant shouldn't have color either
        const colorMatch = !color ? !v.color : v.color === color;
        // Match ageGroup: if no ageGroup specified, variant shouldn't have ageGroup either
        const ageGroupMatch = !ageGroup ? !v.ageGroup : v.ageGroup === ageGroup;

        return sizeMatch && colorMatch && ageGroupMatch;
      });
      if (!variant) {
        return false;
      }
      return variant.stock >= quantity;
    }

    // Fall back to legacy countInStock if no variants
    return product.countInStock >= quantity;
  }

  // Update inventory after a purchase
  async updateInventory(
    productId: string,
    size?: string,
    color?: string,
    selectedAgeGroup?: string,
    quantity: number = 1,
  ): Promise<void> {
    const product = await this.productModel.findById(productId).exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // If the product has variants
    if (product.variants && product.variants.length > 0) {
      const variantIndex = product.variants.findIndex((v) => {
        // Match size: if no size specified, variant shouldn't have size either
        const sizeMatch = !size ? !v.size : v.size === size;
        // Match color: if no color specified, variant shouldn't have color either
        const colorMatch = !color ? !v.color : v.color === color;
        // Match ageGroup: if no ageGroup specified, variant shouldn't have ageGroup either
        const ageGroupMatch = !selectedAgeGroup
          ? !v.ageGroup
          : v.ageGroup === selectedAgeGroup;

        return sizeMatch && colorMatch && ageGroupMatch;
      });
      if (variantIndex === -1) {
        // If variant not found but attributes specified, fall back to general stock
        console.warn(
          `Variant not found for product ${product.name} with size ${size}, color ${color}, ageGroup ${selectedAgeGroup}, using general stock`,
        );
        if (product.countInStock < quantity) {
          throw new BadRequestException('Not enough stock');
        }
        product.countInStock -= quantity;
        await product.save();
        return;
      }

      if (product.variants[variantIndex].stock < quantity) {
        throw new BadRequestException(
          `Not enough stock for size ${size} and color ${color}`,
        );
      }

      // Update the specific variant's stock
      product.variants[variantIndex].stock -= quantity;

      // Also update countInStock to reflect total available stock from all variants
      product.countInStock = product.variants.reduce(
        (total, variant) => total + variant.stock,
        0,
      );

      await product.save();
    } else {
      // Fall back to legacy countInStock if no variants
      if (product.countInStock < quantity) {
        throw new BadRequestException('Not enough stock');
      }

      product.countInStock -= quantity;
      await product.save();
    }
  }

  /**
   * Get available variants (sizes and colors) for a product
   */
  async getProductVariants(productId: string) {
    const product = await this.productModel.findById(productId).exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // If the product has variants defined
    if (product.variants && product.variants.length > 0) {
      // Extract unique sizes and colors
      const sizes = [...new Set(product.variants.map((v) => v.size))];
      const colors = [...new Set(product.variants.map((v) => v.color))];

      // Map variants to include stock information
      const variantsWithStock = product.variants.map((v) => ({
        size: v.size,
        color: v.color,
        stock: v.stock,
        sku: v.sku,
      }));

      return {
        sizes,
        colors,
        variants: variantsWithStock,
        hasVariants: true,
      };
    }

    // For products without explicit variants, use the general attributes
    return {
      sizes: product.sizes || [],
      colors: product.colors || [],
      variants: [],
      hasVariants: false,
      countInStock: product.countInStock,
    };
  }

  /**
   * Get all unique colors used in products
   */
  async getAllColors(): Promise<string[]> {
    // Find colors from both direct fields and variants
    const productsWithColors = await this.productModel
      .find({
        $or: [
          { colors: { $exists: true, $ne: [] } },
          { 'variants.color': { $exists: true } },
        ],
      })
      .exec();

    const colors = new Set<string>();

    // Add colors from direct fields
    productsWithColors.forEach((product) => {
      if (product.colors && product.colors.length > 0) {
        product.colors.forEach((color) => colors.add(color));
      }

      // Add colors from variants
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant) => {
          if (variant.color) {
            colors.add(variant.color);
          }
        });
      }
    });

    return Array.from(colors).sort();
  }

  /**
   * Get all unique sizes used in products
   */
  async getAllSizes(): Promise<string[]> {
    // Find sizes from both direct fields and variants
    const productsWithSizes = await this.productModel
      .find({
        $or: [
          { sizes: { $exists: true, $ne: [] } },
          { 'variants.size': { $exists: true } },
        ],
      })
      .exec();

    const sizes = new Set<string>();

    // Add sizes from direct fields
    productsWithSizes.forEach((product) => {
      if (product.sizes && product.sizes.length > 0) {
        product.sizes.forEach((size) => sizes.add(size));
      }

      // Add sizes from variants
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant) => {
          if (variant.size) {
            sizes.add(variant.size);
          }
        });
      }
    });

    return Array.from(sizes).sort();
  }

  /**
   * Get all unique age groups used in products
   */
  async getAllAgeGroups(): Promise<string[]> {
    // Find all products with age groups
    const productsWithAgeGroups = await this.productModel
      .find({
        ageGroups: { $exists: true, $ne: [] },
      })
      .exec();

    const ageGroups = new Set<string>();

    productsWithAgeGroups.forEach((product) => {
      if (product.ageGroups && product.ageGroups.length > 0) {
        product.ageGroups.forEach((ageGroup) => ageGroups.add(ageGroup));
      }
    });

    return Array.from(ageGroups).sort();
  }

  /**
   * Update product stock when an order is paid
   * @param productId - The ID of the product
   * @param qty - The quantity to subtract from stock
   * @param size - Optional size for variant
   * @param color - Optional color for variant
   * @param ageGroup - Optional age group for variant
   */
  async updateStockAfterPayment(
    productId: string,
    qty: number,
    size?: string,
    color?: string,
    ageGroup?: string,
  ): Promise<void> {
    const product = await this.productModel.findById(productId);

    if (!product) {
      console.warn(
        `Product with ID ${productId} not found when updating stock after payment`,
      );
      return;
    }

    // Check if the product has variants (including variants without attributes)
    if (product.variants && product.variants.length > 0) {
      // Find the specific variant with flexible matching
      const variantIndex = product.variants.findIndex((v) => {
        // Match size: if no size specified, variant shouldn't have size either
        const sizeMatch = !size ? !v.size : v.size === size;
        // Match color: if no color specified, variant shouldn't have color either
        const colorMatch = !color ? !v.color : v.color === color;
        // Match ageGroup: if no ageGroup specified, variant shouldn't have ageGroup either
        const ageGroupMatch = !ageGroup ? !v.ageGroup : v.ageGroup === ageGroup;

        return sizeMatch && colorMatch && ageGroupMatch;
      });

      if (variantIndex >= 0) {
        // Update the variant stock
        product.variants[variantIndex].stock = Math.max(
          0,
          product.variants[variantIndex].stock - qty,
        );
        console.log(
          `Updated variant stock for product ${product.name}, variant: ${size}/${color}/${ageGroup}, new stock: ${product.variants[variantIndex].stock}`,
        );

        // Also update countInStock to reflect total available stock from all variants
        product.countInStock = product.variants.reduce(
          (total, variant) => total + variant.stock,
          0,
        );
      } else {
        // If variant not found but attributes were specified, log a warning
        console.warn(
          `Variant not found for product ${product.name} with attributes: size=${size}, color=${color}, ageGroup=${ageGroup}`,
        );
        // Fall back to updating general stock
        product.countInStock = Math.max(0, product.countInStock - qty);
      }
    } else {
      // Update general product stock if no variants or no variant specifications
      product.countInStock = Math.max(0, product.countInStock - qty);
      console.log(
        `Updated general stock for product ${product.name}, new stock: ${product.countInStock}`,
      );
    }

    await product.save();
  }
}
