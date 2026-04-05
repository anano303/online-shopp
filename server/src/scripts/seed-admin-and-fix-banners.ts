import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { hash } from 'argon2';

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

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' },
    avatar: { type: String, default: '' },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Banner = mongoose.model('Banner', BannerSchema);
const User = mongoose.model('User', UserSchema);

// Placeholder banner images from picsum (high quality, free, no auth needed)
const bannerImages = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=800&fit=crop&q=80', // man in suit
  'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=1920&h=800&fit=crop&q=80', // shirts/fashion
  'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1920&h=800&fit=crop&q=80', // men's clothing store
  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1920&h=800&fit=crop&q=80', // accessories
  'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=1920&h=800&fit=crop&q=80', // summer fashion
  'https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=1920&h=800&fit=crop&q=80', // business style
  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1920&h=800&fit=crop&q=80', // casual elegance
];

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // === 1. Fix banners: add images and ensure 3 main banners ===
    console.log('\n--- Updating banners ---');

    // Delete all existing banners and recreate with images
    await Banner.deleteMany({});
    console.log('Cleared old banners');

    const bannersToCreate = [
      {
        title: 'ახალი კოლექცია 2026 - კლასიკური კოსტიუმები',
        titleEn: 'New Collection 2026 - Classic Suits',
        buttonText: 'ნახე კოლექცია',
        buttonTextEn: 'View Collection',
        buttonLink: '/shop',
        imageUrl: bannerImages[0],
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
        imageUrl: bannerImages[1],
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
        imageUrl: bannerImages[2],
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
        imageUrl: bannerImages[3],
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
        imageUrl: bannerImages[4],
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
        imageUrl: bannerImages[5],
        isActive: true,
        sortOrder: 2,
        type: 'hunting',
      },
      {
        title: 'კლასიკური ელეგანტურობა - ყოველდღიური სტილი',
        titleEn: 'Classic Elegance - Everyday Style',
        buttonText: 'ნახე მეტი',
        buttonTextEn: 'See More',
        buttonLink: '/shop',
        imageUrl: bannerImages[6],
        isActive: true,
        sortOrder: 3,
        type: 'hunting',
      },
    ];

    const result = await Banner.insertMany(bannersToCreate);
    const mainCount = bannersToCreate.filter((b) => b.type === 'main').length;
    const huntingCount = bannersToCreate.filter(
      (b) => b.type === 'hunting',
    ).length;
    console.log(
      `Created ${result.length} banners (${mainCount} main, ${huntingCount} hunting) with images`,
    );

    // === 2. Create admin user ===
    console.log('\n--- Creating admin user ---');

    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
    if (existingAdmin) {
      console.log('Admin user already exists, skipping');
    } else {
      const hashedPassword = await hash('admin123');
      const admin = new User({
        name: 'Admin',
        email: 'admin@gmail.com',
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
      });
      await admin.save();
      console.log('Admin user created: admin@gmail.com / admin123');
    }

    await mongoose.disconnect();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

run();
