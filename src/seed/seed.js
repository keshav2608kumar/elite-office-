require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const argon2 = require('argon2');

const Admin = require('../models/Admin');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const Testimonial = require('../models/Testimonial');
const Config = require('../models/SiteConfig');
const Banner = require('../models/Banner');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/elite_office');
    console.log('MongoDB Connected for Seeding');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

const seedData = async () => {
  await connectDB();

  const isReset = process.argv.includes('--reset') || process.argv.includes('--force');

  if (isReset) {
    let answer = 'y';
    if (!process.argv.includes('--force')) {
      answer = await askQuestion('Are you sure you want to drop all collections? (y/n) ');
    }
    if (answer.toLowerCase() === 'y') {
      console.log('Dropping collections...');
      await Admin.deleteMany({});
      await Category.deleteMany({});
      await Brand.deleteMany({});
      await Product.deleteMany({});
      await Banner.deleteMany({});
      await Testimonial.deleteMany({});
      await Config.deleteMany({});
    } else {
      console.log('Aborting reset.');
      process.exit(0);
    }
  }

  try {
    console.log('Seeding data...');

    // 1. Admin
    await Admin.create({
      username: 'admin',
      email: 'admin@eliteoffice.com',
      passwordHash: 'Admin@2026!',
      role: 'superadmin'
    });

    // 2. Categories
    const categories = await Category.insertMany([
      { name: 'IT & Office Equipment', slug: 'it-office-equipment', displayOrder: 1 },
      { name: 'Printing', slug: 'printing', displayOrder: 2 },
      { name: 'Stationery', slug: 'stationery', displayOrder: 3 }
    ]);

    // 3. Brands
    const brands = await Brand.insertMany([
      { name: 'HP', slug: 'hp', displayOrder: 1 },
      { name: 'Dell', slug: 'dell', displayOrder: 2 },
      { name: 'Lenovo', slug: 'lenovo', displayOrder: 3 },
      { name: 'Canon', slug: 'canon', displayOrder: 4 },
      { name: 'Epson', slug: 'epson', displayOrder: 5 },
      { name: 'Logitech', slug: 'logitech', displayOrder: 6 },
      { name: 'Asus', slug: 'asus', displayOrder: 7 },
      { name: 'Acer', slug: 'acer', displayOrder: 8 }
    ]);

    // 4. Products
    const products = [
      // IT
      { name: 'HP Laptop 15s', slug: 'hp-laptop-15s', category: 'IT & Office Equipment', price: 4500000, stock: 20, sku: 'IT-HP-001', brand: 'HP', description: 'Core i5, 8GB RAM, 512GB SSD', thumbnail: '/images/demo/it1.jpg', images: ['/images/demo/it1.jpg', '/images/demo/it2.jpg'] },
      { name: 'Dell Monitor 24"', slug: 'dell-monitor-24', category: 'IT & Office Equipment', price: 1200000, stock: 15, sku: 'IT-DELL-001', brand: 'Dell', description: '1080p IPS Panel', thumbnail: '/images/demo/it3.jpg', images: ['/images/demo/it3.jpg'] },
      { name: 'Logitech MK270 Keyboard Mouse Combo', slug: 'logitech-mk270', category: 'IT & Office Equipment', price: 150000, stock: 50, sku: 'IT-LOGI-001', brand: 'Logitech', description: 'Wireless combo', thumbnail: '/images/demo/it4.jpg', images: ['/images/demo/it4.jpg'] },
      { name: 'Asus WiFi Router', slug: 'asus-wifi-router', category: 'IT & Office Equipment', price: 300000, stock: 30, sku: 'IT-ASUS-001', brand: 'Asus', description: 'Dual band router', thumbnail: '/images/demo/it5.jpg', images: ['/images/demo/it5.jpg', '/images/demo/it6.jpg'] },
      // Printing
      { name: 'Canon PIXMA Printer', slug: 'canon-pixma-printer', category: 'Printing', price: 850000, stock: 25, sku: 'PR-CANON-001', brand: 'Canon', description: 'All-in-one printer', thumbnail: '/images/demo/pr1.jpg', images: ['/images/demo/pr1.jpg'] },
      { name: 'Epson EcoTank L3250', slug: 'epson-ecotank-l3250', category: 'Printing', price: 1400000, stock: 15, sku: 'PR-EPSON-001', brand: 'Epson', description: 'Ink tank printer', thumbnail: '/images/demo/pr2.jpg', images: ['/images/demo/pr2.jpg'] },
      { name: 'HP LaserJet Pro M404', slug: 'hp-laserjet-pro-m404', category: 'Printing', price: 2100000, stock: 10, sku: 'PR-HP-002', brand: 'HP', description: 'Laser printer', thumbnail: '/images/demo/pr3.jpg', images: ['/images/demo/pr3.jpg'] },
      { name: 'Canon Scanner LiDE 400', slug: 'canon-scanner-lide-400', category: 'Printing', price: 600000, stock: 20, sku: 'PR-CANON-002', brand: 'Canon', description: 'Flatbed scanner', thumbnail: '/images/demo/pr4.jpg', images: ['/images/demo/pr4.jpg'] },
      // Stationery
      { name: 'Classmate Notebook Pack (10 pcs)', slug: 'classmate-notebook-pack', category: 'Stationery', price: 45000, stock: 100, sku: 'ST-CLASS-001', description: 'A4 notebooks', thumbnail: '/images/demo/st1.jpg', images: ['/images/demo/st1.jpg'] },
      { name: 'Parker Jotter Ballpoint Pen', slug: 'parker-jotter-pen', category: 'Stationery', price: 35000, stock: 80, sku: 'ST-PARKER-001', description: 'Classic design', thumbnail: '/images/demo/st2.jpg', images: ['/images/demo/st2.jpg'] },
      { name: 'Camlin Marker Set (12 colors)', slug: 'camlin-marker-set', category: 'Stationery', price: 25000, stock: 60, sku: 'ST-CAMLIN-001', description: 'Whiteboard markers', thumbnail: '/images/demo/st3.jpg', images: ['/images/demo/st3.jpg'] },
      { name: 'Scotch Tape Dispenser', slug: 'scotch-tape-dispenser', category: 'Stationery', price: 15000, stock: 40, sku: 'ST-SCOTCH-001', description: 'Heavy duty dispenser', thumbnail: '/images/demo/st4.jpg', images: ['/images/demo/st4.jpg'] }
    ];

    await Product.insertMany(products);

    // 5. Testimonials
    await Testimonial.insertMany([
      { name: 'Corporate Client', company: '', content: 'Great service and professional support.', rating: 5, displayOrder: 1 },
      { name: 'Business Owner', company: '', content: 'Good product quality and quick response.', rating: 5, displayOrder: 2 },
      { name: 'IT Manager', company: '', content: 'Very helpful team for office technology requirements.', rating: 5, displayOrder: 3 }
    ]);

    // 6. Banners
    await Banner.insertMany([
      { title: 'Premium Office Equipment', subtitle: 'Power your business with top-tier technology.', image: '/images/demo/banner1.jpg', ctaText: 'Shop IT', ctaLink: '/products.html?category=IT%20%26%20Office%20Equipment', isActive: true, displayOrder: 1 },
      { title: 'Quality Printing Solutions', subtitle: 'High volume printers for every office size.', image: '/images/demo/banner2.jpg', ctaText: 'Shop Printers', ctaLink: '/products.html?category=Printing', isActive: true, displayOrder: 2 },
      { title: 'Essential Stationery', subtitle: 'Everything you need for your daily workflow.', image: '/images/demo/banner3.jpg', ctaText: 'Shop Stationery', ctaLink: '/products.html?category=Stationery', isActive: true, displayOrder: 3 }
    ]);

    // 7. Config
    await Config.insertMany([
      { key: 'businessName', value: 'Elite Office Technologies', isPublic: true },
      { key: 'whatsappNumber', value: '+919167711966', isPublic: true },
      { key: 'phone', value: '080 45256229', isPublic: true },
      { key: 'email', value: 'info@eliteoffice.com', isPublic: true },
      { key: 'address', value: 'Shop No 4, No 30, BEML Main Road, New Thippasandra, Jeevan Bima Nagar, Bengaluru, Karnataka - 560075', isPublic: true },
      { key: 'defaultTaxRate', value: '18', isPublic: false }
    ]);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
    rl.close();
  }
};

seedData();


