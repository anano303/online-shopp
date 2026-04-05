const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function cleanEmptyVariants() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const productsCollection = db.collection('products');

    // Find products that have variants with empty strings
    const productsWithEmptyVariants = await productsCollection
      .find({
        variants: {
          $elemMatch: {
            $or: [
              { size: '' },
              { color: '' },
              { ageGroup: '' },
              { size: { $exists: false } },
              { color: { $exists: false } },
              { ageGroup: { $exists: false } },
            ],
          },
        },
      })
      .toArray();

    console.log(
      `Found ${productsWithEmptyVariants.length} products with empty variant fields`,
    );

    for (const product of productsWithEmptyVariants) {
      console.log(`\nCleaning product: ${product.name} (ID: ${product._id})`);

      const cleanedVariants = product.variants.filter((variant) => {
        // Keep variants that have at least one meaningful non-empty attribute
        const hasSize = variant.size && variant.size.trim() !== '';
        const hasColor = variant.color && variant.color.trim() !== '';
        const hasAgeGroup = variant.ageGroup && variant.ageGroup.trim() !== '';

        // Must have at least one real attribute (not just stock)
        return hasSize || hasColor || hasAgeGroup;
      });

      console.log(`  Original variants: ${product.variants.length}`);
      console.log(`  Cleaned variants: ${cleanedVariants.length}`);

      if (cleanedVariants.length === 0) {
        // No valid variants left - remove variants and calculate total stock
        const totalStock = product.variants.reduce(
          (sum, v) => sum + (v.stock || 0),
          0,
        );
        const finalStock = Math.max(totalStock, product.countInStock || 0);

        console.log(
          `  → Removing all variants, setting countInStock to ${finalStock}`,
        );

        await productsCollection.updateOne(
          { _id: product._id },
          {
            $unset: { variants: '' },
            $set: { countInStock: finalStock },
          },
        );
      } else {
        // Update with cleaned variants
        console.log(
          `  → Updating with ${cleanedVariants.length} clean variants`,
        );

        await productsCollection.updateOne(
          { _id: product._id },
          { $set: { variants: cleanedVariants } },
        );
      }
    }

    console.log('\n✅ Cleaning completed successfully!');
  } catch (error) {
    console.error('❌ Cleaning failed:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the cleaning
if (require.main === module) {
  cleanEmptyVariants();
}

module.exports = { cleanEmptyVariants };
