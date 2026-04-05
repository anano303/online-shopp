const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixBrokenVariants() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const productsCollection = db.collection('products');

    // Find products that have variants but empty or invalid attribute arrays
    const brokenProducts = await productsCollection
      .find({
        variants: { $exists: true, $ne: [] },
        $or: [
          { sizes: { $exists: false } },
          { sizes: { $eq: [] } },
          { colors: { $exists: false } },
          { colors: { $eq: [] } },
          { ageGroups: { $exists: false } },
          { ageGroups: { $eq: [] } },
        ],
      })
      .toArray();

    console.log(`Found ${brokenProducts.length} products with broken variants`);

    for (const product of brokenProducts) {
      console.log(`\nFixing product: ${product.name} (ID: ${product._id})`);
      console.log(`Current variants:`, product.variants?.length || 0);
      console.log(`Current sizes:`, product.sizes?.length || 0);
      console.log(`Current colors:`, product.colors?.length || 0);
      console.log(`Current ageGroups:`, product.ageGroups?.length || 0);

      // Check if variants have meaningful data - filter out empty strings too
      const validVariants =
        product.variants?.filter((variant) => {
          const hasSize = variant.size && variant.size.trim() !== '';
          const hasColor = variant.color && variant.color.trim() !== '';
          const hasAgeGroup =
            variant.ageGroup && variant.ageGroup.trim() !== '';
          const hasStock = variant.stock && variant.stock > 0;

          // A variant is valid if it has at least one meaningful attribute
          return hasSize || hasColor || hasAgeGroup || hasStock;
        }) || [];

      if (validVariants.length === 0) {
        // No valid variants - remove variants array and use general stock
        console.log('  → Removing empty variants, using general stock');

        // Calculate total stock from variants if they have stock info
        const totalStock =
          product.variants?.reduce(
            (sum, variant) => sum + (variant.stock || 0),
            0,
          ) ||
          product.countInStock ||
          0;

        await productsCollection.updateOne(
          { _id: product._id },
          {
            $unset: { variants: '' },
            $set: {
              countInStock: Math.max(totalStock, product.countInStock || 0),
            },
          },
        );

        console.log(
          `  ✓ Removed variants, set countInStock to ${Math.max(totalStock, product.countInStock || 0)}`,
        );
      } else {
        // Has valid variants - clean up the variants array
        console.log(`  → Keeping ${validVariants.length} valid variants`);

        // Also ensure attribute arrays are populated based on variants
        const uniqueSizes = [
          ...new Set(validVariants.map((v) => v.size).filter(Boolean)),
        ];
        const uniqueColors = [
          ...new Set(validVariants.map((v) => v.color).filter(Boolean)),
        ];
        const uniqueAgeGroups = [
          ...new Set(validVariants.map((v) => v.ageGroup).filter(Boolean)),
        ];

        const updateFields = {
          variants: validVariants,
        };

        if (uniqueSizes.length > 0) updateFields.sizes = uniqueSizes;
        if (uniqueColors.length > 0) updateFields.colors = uniqueColors;
        if (uniqueAgeGroups.length > 0)
          updateFields.ageGroups = uniqueAgeGroups;

        await productsCollection.updateOne(
          { _id: product._id },
          { $set: updateFields },
        );

        console.log(`  ✓ Updated variants and attributes:`, {
          variants: validVariants.length,
          sizes: uniqueSizes.length,
          colors: uniqueColors.length,
          ageGroups: uniqueAgeGroups.length,
        });
      }
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  fixBrokenVariants();
}

module.exports = { fixBrokenVariants };
