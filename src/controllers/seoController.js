const Product = require('../models/Product');
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');

exports.getSitemap = asyncHandler(async (req, res, next) => {
  const baseUrl = process.env.CLIENT_URL || 'https://www.eliteoffice.com';

  const products = await Product.find({ isActive: true }).select('slug updatedAt');
  const categories = await Category.find({ isActive: true }).select('slug updatedAt');

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Static pages
  const staticPages = ['', '/about', '/contact', '/products'];
  for (const page of staticPages) {
    xml += `  <url>\n    <loc>${baseUrl}${page}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
  }

  // Categories
  for (const cat of categories) {
    xml += `  <url>\n    <loc>${baseUrl}/category/${cat.slug}</loc>\n    <lastmod>${cat.updatedAt.toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }

  // Products
  for (const prod of products) {
    xml += `  <url>\n    <loc>${baseUrl}/product/${prod.slug}</loc>\n    <lastmod>${prod.updatedAt.toISOString()}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
  }

  xml += '</urlset>';

  res.header('Content-Type', 'application/xml');
  res.status(200).send(xml);
});

exports.getRobots = asyncHandler(async (req, res, next) => {
  const baseUrl = process.env.CLIENT_URL || 'https://www.eliteoffice.com';
  
  const txt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /cart/
Disallow: /checkout/

Sitemap: ${baseUrl}/sitemap.xml
`;

  res.header('Content-Type', 'text/plain');
  res.status(200).send(txt);
});
