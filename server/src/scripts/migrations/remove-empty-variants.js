const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function removeEmptyVariants() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const productsCollection = db.collection('products');

    // Find the specific product
    const productId = new ObjectId('68c14ec94efa771a67efd699');
    const product = await productsCollection.findOne({ _id: productId });

    console.log('\nOriginal variants:');
    product.variants?.forEach((variant, index) => {
      console.log(`Variant ${index + 1}:`, variant);
    });

    // Filter out variants with empty size fields
    const validVariants = product.variants.filter((variant) => {
      // Remove variants that have empty size field
      const hasEmptySize =
        variant.size === '' ||
        variant.size === 'undefined' ||
        variant.size === null;
      const hasZeroStock = variant.stock === 0;

      // Keep variant only if it doesn't have empty size or zero stock
      return !hasEmptySize && !hasZeroStock;
    });

    console.log('\nFiltered variants:');
    validVariants.forEach((variant, index) => {
      console.log(`Variant ${index + 1}:`, variant);
    });

    // Update the product
    await productsCollection.updateOne(
      { _id: productId },
      { $set: { variants: validVariants } },
    );

    console.log('\n✅ Empty variants removed successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

removeEmptyVariants();
