const asyncHandler = require('../middleware/asyncHandler');
const Product = require('../models/Product');

// @desc  Create a product listing
// @route POST /api/products
exports.createProduct = asyncHandler(async (req, res) => {
  const { title, description, category, price, stock, tags, location } = req.body;

  const product = await Product.create({
    seller: req.user.id,
    title,
    description,
    category,
    price,
    stock,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
    location,
  });

  res.status(201).json({ success: true, product });
});

// @desc  Upload/add images to a product
// @route PUT /api/products/:id/images
exports.uploadProductImages = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to edit this product' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No images uploaded' });
  }

  const newImages = req.files.map((file) => file.path);
  product.images.push(...newImages);
  await product.save();

  res.status(200).json({ success: true, product });
});

// @desc  Get all products with search, filter, pagination
// @route GET /api/products
// query params: keyword, category, minPrice, maxPrice, city, sort, page, limit
exports.getProducts = asyncHandler(async (req, res) => {
  const { keyword, category, minPrice, maxPrice, city, rating, sort, page = 1, limit = 12 } = req.query;

  const query = { isActive: true, isApproved: true };

  if (keyword) query.$text = { $search: keyword };
  if (category) query.category = category;
  if (city) query['location.city'] = new RegExp(city, 'i');
  if (rating) query.averageRating = { $gte: Number(rating) };
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  let sortOption = '-createdAt'; // latest first by default
  if (sort === 'price_asc') sortOption = 'price';
  if (sort === 'price_desc') sortOption = '-price';
  if (sort === 'rating') sortOption = '-averageRating';
  if (sort === 'popular') sortOption = '-favoritesCount';

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('seller', 'fullName profilePicture averageRating')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: Number(page),
    products,
  });
});

// @desc  Get single product details
// @route GET /api/products/:id
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    'seller',
    'fullName profilePicture averageRating location'
  );
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  product.viewsCount += 1;
  await product.save();

  res.status(200).json({ success: true, product });
});

// @desc  Update product listing
// @route PUT /api/products/:id
exports.updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to edit this product' });
  }

  const allowedFields = ['title', 'description', 'category', 'price', 'stock', 'tags', 'location', 'isActive'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  });

  await product.save();
  res.status(200).json({ success: true, product });
});

// @desc  Delete a product listing
// @route DELETE /api/products/:id
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this product' });
  }

  await product.deleteOne();
  res.status(200).json({ success: true, message: 'Product deleted successfully' });
});

// @desc  Get logged-in user's own product listings
// @route GET /api/products/my/listings
exports.getMyProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ seller: req.user.id }).sort('-createdAt');
  res.status(200).json({ success: true, count: products.length, products });
});
