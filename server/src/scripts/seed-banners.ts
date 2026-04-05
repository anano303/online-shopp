import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const BannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    titleEn: { type: String, required: true },
    buttonText: { type: String, required: true },
    buttonTextEn: { type: String, required: true },
    buttonLink: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    type: { type: String, enum: ['main', 'hunting'], default: 'main' },
  },
  { timestamps: true },
);

const Banner = mongoose.model('Banner', BannerSchema);

const testBanners = [
  {
    title: 'ახალი კოლექცია 2026 - კლასიკური კოსტიუმები',
    titleEn: 'New Collection 2026 - Classic Suits',
    buttonText: 'ნახე კოლექცია',
    buttonTextEn: 'View Collection',
    buttonLink: '/shop',
    imageUrl: '',
    isActive: true,
    sortOrder: 1,
    type: 'main',
  },
  {
    title: 'პრემიუმ პერანგები - 20% ფასდაკლება',
    titleEn: 'Premium Shirts - 20% Off',
    buttonText: 'იყიდე ახლა',
    buttonTextEn: 'Shop Now',
    buttonLink: '/shop',
    imageUrl: '',
    isActive: true,
    sortOrder: 2,
    type: 'main',
  },
  {
    title: 'ელეგანტური ქურთუკები - ახალი სეზონი',
    titleEn: 'Elegant Jackets - New Season',
    buttonText: 'დაათვალიერე',
    buttonTextEn: 'Browse',
    buttonLink: '/shop',
    imageUrl: '',
    isActive: true,
    sortOrder: 3,
    type: 'main',
  },
  {
    title: 'აქსესუარები - ჰალსტუხები და საათები',
    titleEn: 'Accessories - Ties & Watches',
    buttonText: 'აქსესუარები',
    buttonTextEn: 'Accessories',
    buttonLink: '/shop',
    imageUrl: '',
    isActive: true,
    sortOrder: 4,
    type: 'main',
  },
  {
    title: 'საზაფხულო კოლექცია - მსუბუქი ქსოვილები',
    titleEn: 'Summer Collection - Light Fabrics',
    buttonText: 'ნახე მეტი',
    buttonTextEn: 'See More',
    buttonLink: '/shop',
    imageUrl: '',
    isActive: true,
    sortOrder: 1,
    type: 'hunting',
  },
  {
    title: 'ბიზნეს სტილი - ოფისის ტანსაცმელი',
    titleEn: 'Business Style - Office Wear',
    buttonText: 'ბიზნეს კოლექცია',
    buttonTextEn: 'Business Collection',
    buttonLink: '/shop',
    imageUrl: '',
    isActive: true,
    sortOrder: 2,
    type: 'hunting',
  },
];

async function seedBanners() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const existing = await Banner.countDocuments();
    console.log(`Existing banners: ${existing}`);

    const result = await Banner.insertMany(testBanners);
    console.log(`Successfully inserted ${result.length} test banners`);

    await mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error seeding banners:', error);
    process.exit(1);
  }
}

seedBanners();
