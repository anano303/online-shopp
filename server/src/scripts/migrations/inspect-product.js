const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function inspectProduct() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const productsCollection = db.collection('products');

    // Get the specific product
    const productId = new ObjectId('68c14ec94efa771a67efd699');
    const product = await productsCollection.findOne({ _id: productId });

    console.log('\nProduct details:');
    console.log('Name:', product.name);
    console.log('CountInStock:', product.countInStock);
    console.log('\nVariants:');

    product.variants?.forEach((variant, index) => {
      console.log(`Variant ${index + 1}:`);
      console.log(
        `  size: "${variant.size}" (length: ${variant.size?.length || 0})`,
      );
      console.log(
        `  color: "${variant.color}" (length: ${variant.color?.length || 0})`,
      );
      console.log(
        `  ageGroup: "${variant.ageGroup}" (length: ${variant.ageGroup?.length || 0})`,
      );
      console.log(`  stock: ${variant.stock}`);

      // Check if this variant should be kept
      const hasSize = variant.size && variant.size.trim() !== '';
      const hasColor = variant.color && variant.color.trim() !== '';
      const hasAgeGroup = variant.ageGroup && variant.ageGroup.trim() !== '';

      console.log(
        `  hasSize: ${hasSize}, hasColor: ${hasColor}, hasAgeGroup: ${hasAgeGroup}`,
      );
      console.log(`  Should keep: ${hasSize || hasColor || hasAgeGroup}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

inspectProduct();
