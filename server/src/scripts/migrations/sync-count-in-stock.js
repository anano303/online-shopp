const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function syncCountInStock() {
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
      const currentCountInStock = product.countInStock || 0;
      const totalVariantStock = product.variants.reduce(
        (total, variant) => total + (variant.stock || 0),
        0,
      );

      if (currentCountInStock !== totalVariantStock) {
        console.log(`\nSyncing product: ${product.name} (ID: ${product._id})`);
        console.log(`  Current countInStock: ${currentCountInStock}`);
        console.log(`  Total variant stock: ${totalVariantStock}`);

        await productsCollection.updateOne(
          { _id: product._id },
          { $set: { countInStock: totalVariantStock } },
        );

        console.log(`  ✓ Updated countInStock to ${totalVariantStock}`);
      } else {
        console.log(
          `✓ ${product.name}: countInStock already synced (${currentCountInStock})`,
        );
      }
    }

    console.log('\n✅ Count sync completed!');
  } catch (error) {
    console.error('❌ Sync failed:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

syncCountInStock();
