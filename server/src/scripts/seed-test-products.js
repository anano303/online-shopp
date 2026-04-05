/* eslint-disable no-console */
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '../../.env') });

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is missing in server/.env');
  process.exit(1);
}

const CATEGORY_BLUEPRINT = [
  {
    name: 'ტანსაცმელი',
    nameEn: 'Clothing',
    subcategories: [
      { name: 'მაისურები', nameEn: 'T-Shirts' },
      { name: 'კაპიუშონები', nameEn: 'Hoodies' },
    ],
  },
  {
    name: 'აქსესუარები',
    nameEn: 'Accessories',
    subcategories: [
      { name: 'ქუდები', nameEn: 'Caps' },
      { name: 'ჩანთები', nameEn: 'Bags' },
    ],
  },
  {
    name: 'ფეხსაცმელი',
    nameEn: 'Footwear',
    subcategories: [
      { name: 'სნიკერები', nameEn: 'Sneakers' },
      { name: 'ბოტები', nameEn: 'Boots' },
    ],
  },
];

const ADJECTIVES = [
  'მთის',
  'ტაქტიკური',
  'ველური',
  'მოხდენილი',
  'ტყის',
  'კლასიკური',
  'მინიმალური',
  'სეზონური',
  'დახვეწილი',
  'მძლავრი',
];

const NOUNS = [
  'სტილი',
  'კოლექცია',
  'ვარიანტი',
  'ხაზი',
  'სერია',
  'მოდელი',
  'გადაწყვეტა',
  'ნიმუში',
  'პროდუქტი',
  'არჩევანი',
];

const COLORS = ['შავი', 'თეთრი', 'მწვანე', 'ხაკი', 'ყავისფერი', 'ნაცრისფერი'];
const SIZES = ['S', 'M', 'L', 'XL'];
const AGE_GROUPS = ['ADULTS', 'KIDS'];

function pick(arr, idx) {
  return arr[idx % arr.length];
}

async function ensureCategories(db) {
  const categories = db.collection('categories');
  const subcategories = db.collection('subcategories');
  const created = [];

  for (const blueprint of CATEGORY_BLUEPRINT) {
    await categories.updateOne(
      { name: blueprint.name },
      {
        $set: {
          name: blueprint.name,
          nameEn: blueprint.nameEn,
          isActive: true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      {
        upsert: true,
      },
    );

    const categoryDoc = await categories.findOne({ name: blueprint.name });
    if (!categoryDoc) {
      throw new Error(`Failed to ensure category: ${blueprint.name}`);
    }
    const subDocs = [];

    for (const sub of blueprint.subcategories) {
      await subcategories.updateOne(
        { name: sub.name, categoryId: categoryDoc._id },
        {
          $set: {
            name: sub.name,
            nameEn: sub.nameEn,
            categoryId: categoryDoc._id,
            isActive: true,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
            ageGroups: AGE_GROUPS,
            sizes: SIZES,
            colors: COLORS,
          },
        },
        {
          upsert: true,
        },
      );

      const subDoc = await subcategories.findOne({
        name: sub.name,
        categoryId: categoryDoc._id,
      });

      if (!subDoc) {
        throw new Error(`Failed to ensure subcategory: ${sub.name}`);
      }

      subDocs.push(subDoc);
    }

    created.push({ category: categoryDoc, subcategories: subDocs });
  }

  return created;
}

function buildTestProduct(i, ownerId, categoryDoc, subcategoryDoc) {
  const color = pick(COLORS, i);
  const size = pick(SIZES, i);
  const ageGroup = pick(AGE_GROUPS, i);
  const price = 35 + i * 7;
  const stock = 4 + (i % 9);
  const seed = `${Date.now()}-${i}`;

  return {
    user: ownerId,
    name: `ტესტ პროდუქტი ${i + 1} - ${pick(ADJECTIVES, i)} ${pick(NOUNS, i)}`,
    nameEn: `Test Product ${i + 1}`,
    brand: 'TestBrand',
    category: categoryDoc.name,
    mainCategory: categoryDoc._id,
    mainCategoryEn: categoryDoc.nameEn,
    subCategory: subcategoryDoc._id,
    subCategoryEn: subcategoryDoc.nameEn,
    ageGroups: [ageGroup],
    sizes: [size],
    colors: [color],
    colorsEn: [color],
    images: [
      `https://picsum.photos/seed/${seed}-a/900/1200`,
      `https://picsum.photos/seed/${seed}-b/900/1200`,
    ],
    description:
      'სატესტო პროდუქტი UI/ფილტრების შესამოწმებლად. აღწერა გენერირებულია ავტომატურად.',
    descriptionEn: 'Auto-generated test product for UI and filter testing.',
    hashtags: ['test', 'demo', 'sample'],
    reviews: [],
    rating: 0,
    numReviews: 0,
    price,
    countInStock: stock,
    variants: [
      {
        size,
        color,
        colorEn: color,
        ageGroup,
        stock,
      },
    ],
    status: 'APPROVED',
    deliveryType: 'store',
    minDeliveryDays: 1,
    maxDeliveryDays: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const users = db.collection('users');
  const products = db.collection('products');

  const owner =
    (await users.findOne({ role: 'Admin' })) ||
    (await users.findOne({ role: 'Seller' })) ||
    (await users.findOne({}));

  if (!owner) {
    throw new Error(
      'No users found. Create at least one user before seeding products.',
    );
  }

  const categoryData = await ensureCategories(db);

  const docs = [];
  for (let i = 0; i < 10; i += 1) {
    const pack = categoryData[i % categoryData.length];
    const sub = pack.subcategories[i % pack.subcategories.length];
    docs.push(buildTestProduct(i, owner._id, pack.category, sub));
  }

  const insertRes = await products.insertMany(docs, { ordered: true });

  console.log(`Categories ensured: ${categoryData.length}`);
  console.log(`Products inserted: ${insertRes.insertedCount}`);

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Failed to seed test products:', err.message);
  try {
    await mongoose.disconnect();
  } catch (_) {
    // noop
  }
  process.exit(1);
});
