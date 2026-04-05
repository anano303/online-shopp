const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function removeIncompleteVariants() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const productsCollection = db.collection('products');

    // Find all products with variants
    const productsWithVariants = await productsCollection
      .find({
        variants: { $exists: true, $ne: [] },
      })
      .toArray();

    console.log(`Found ${productsWithVariants.length} products with variants`);

    for (const product of productsWithVariants) {
      console.log(`\nChecking product: ${product.name} (ID: ${product._id})`);

      // Check if this product has meaningful variants
      const hasValidVariants = product.variants.some((variant) => {
        const hasValidSize =
          variant.size &&
          variant.size !== 'undefined' &&
          variant.size !== 'null' &&
          variant.size.trim() !== '';

        const hasValidColor =
          variant.color &&
          variant.color !== 'undefined' &&
          variant.color !== 'null' &&
          variant.color.trim() !== '';

        const hasValidAgeGroup =
          variant.ageGroup &&
          variant.ageGroup !== 'undefined' &&
          variant.ageGroup !== 'null' &&
          variant.ageGroup.trim() !== '';

        // Check if product actually has these attributes defined
        const productHasSizes = product.sizes && product.sizes.length > 0;
        const productHasColors = product.colors && product.colors.length > 0;
        const productHasAgeGroups =
          product.ageGroups && product.ageGroups.length > 0;

        // Variant is valid only if:
        // 1. It has valid attributes AND
        // 2. The product actually supports those attributes
        return (
          (hasValidSize && productHasSizes) ||
          (hasValidColor && productHasColors) ||
          (hasValidAgeGroup && productHasAgeGroups)
        );
      });

      if (!hasValidVariants) {
        // Calculate total stock from all variants
        const totalStock = product.variants.reduce(
          (sum, v) => sum + (v.stock || 0),
          0,
        );
        const finalStock = Math.max(totalStock, product.countInStock || 0);

        console.log(
          `  → Removing variants, setting countInStock to ${finalStock}`,
        );

        await productsCollection.updateOne(
          { _id: product._id },
          {
            $unset: { variants: '' },
            $set: { countInStock: finalStock },
          },
        );
      } else {
        console.log(`  ✓ Has valid variants, keeping as is`);
      }
    }

    console.log('\n✅ Cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

removeIncompleteVariants();
