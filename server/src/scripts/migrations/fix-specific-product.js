const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixSpecificProduct() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const productsCollection = db.collection('products');

    // Get the specific product
    const productId = new ObjectId('68c14ec94efa771a67efd699');
    const product = await productsCollection.findOne({ _id: productId });

    console.log('\nOriginal variants:');
    product.variants?.forEach((variant, index) => {
      console.log(
        `Variant ${index + 1}: size="${variant.size}", color="${variant.color}", ageGroup="${variant.ageGroup}", stock=${variant.stock}`,
      );
    });

    // Keep only variants that have meaningful, complete attributes
    const completeVariants = product.variants.filter((variant) => {
      const hasValidSize =
        variant.size &&
        variant.size.trim() !== '' &&
        variant.size !== 'undefined' &&
        variant.size !== 'null';
      const hasValidColor =
        variant.color &&
        variant.color.trim() !== '' &&
        variant.color !== 'undefined' &&
        variant.color !== 'null';
      const hasValidAgeGroup =
        variant.ageGroup &&
        variant.ageGroup.trim() !== '' &&
        variant.ageGroup !== 'undefined' &&
        variant.ageGroup !== 'null';

      // For this product structure, we expect either:
      // 1. All three attributes (size, color, ageGroup)
      // 2. Or at least color + ageGroup (since this product has no sizes in main array)
      return (
        hasValidColor &&
        hasValidAgeGroup &&
        (hasValidSize || !variant.size || variant.size === 'undefined')
      );
    });

    console.log('\nFiltered variants:');
    completeVariants.forEach((variant, index) => {
      console.log(
        `Variant ${index + 1}: size="${variant.size}", color="${variant.color}", ageGroup="${variant.ageGroup}", stock=${variant.stock}`,
      );
    });

    if (completeVariants.length === 0) {
      // No complete variants - remove variants and use general stock
      const totalStock = product.variants.reduce(
        (sum, v) => sum + (v.stock || 0),
        0,
      );

      console.log(
        `\nRemoving all variants, setting countInStock to ${totalStock}`,
      );

      await productsCollection.updateOne(
        { _id: productId },
        {
          $unset: { variants: '' },
          $set: { countInStock: totalStock },
        },
      );
    } else {
      // Update with complete variants only
      console.log(
        `\nUpdating with ${completeVariants.length} complete variants`,
      );

      await productsCollection.updateOne(
        { _id: productId },
        { $set: { variants: completeVariants } },
      );
    }

    console.log('\n✅ Product fixed successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

fixSpecificProduct();
