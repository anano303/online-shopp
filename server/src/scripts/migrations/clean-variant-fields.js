const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function cleanVariantFields() {
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

    // Clean up variant fields
    const cleanedVariants = product.variants.map((variant) => {
      const cleaned = { ...variant };

      // Remove invalid size fields
      if (
        !cleaned.size ||
        cleaned.size === 'undefined' ||
        cleaned.size === 'null' ||
        cleaned.size === ''
      ) {
        delete cleaned.size;
      }

      // Remove invalid color fields
      if (
        !cleaned.color ||
        cleaned.color === 'undefined' ||
        cleaned.color === 'null' ||
        cleaned.color === ''
      ) {
        delete cleaned.color;
      }

      // Remove invalid ageGroup fields
      if (
        !cleaned.ageGroup ||
        cleaned.ageGroup === 'undefined' ||
        cleaned.ageGroup === 'null' ||
        cleaned.ageGroup === ''
      ) {
        delete cleaned.ageGroup;
      }

      return cleaned;
    });

    console.log('\nCleaned variants:');
    cleanedVariants.forEach((variant, index) => {
      console.log(`Variant ${index + 1}:`, variant);
    });

    // Update the product
    await productsCollection.updateOne(
      { _id: productId },
      { $set: { variants: cleanedVariants } },
    );

    console.log('\n✅ Variant fields cleaned successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

cleanVariantFields();
