const asyncHandler = require('../middleware/asyncHandler');
const Service = require('../models/Service');

// @desc  Create a service listing
// @route POST /api/services
exports.createService = asyncHandler(async (req, res) => {
  const { title, description, category, pricing, deliveryTime, availability, location } = req.body;

  const service = await Service.create({
    provider: req.user.id,
    title,
    description,
    category,
    pricing,
    deliveryTime,
    availability,
    location,
  });

  res.status(201).json({ success: true, service });
});

// @desc  Upload portfolio images for a service
// @route PUT /api/services/:id/images
exports.uploadPortfolioImages = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

  if (service.provider.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to edit this service' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No images uploaded' });
  }

  service.portfolioImages.push(...req.files.map((f) => f.path));
  await service.save();

  res.status(200).json({ success: true, service });
});

// @desc  Get all services with search, filter, pagination
// @route GET /api/services
exports.getServices = asyncHandler(async (req, res) => {
  const { keyword, category, minPrice, maxPrice, city, rating, availability, sort, page = 1, limit = 12 } = req.query;

  const query = { isActive: true, isApproved: true };

  if (keyword) query.$text = { $search: keyword };
  if (category) query.category = category;
  if (city) query['location.city'] = new RegExp(city, 'i');
  if (rating) query.averageRating = { $gte: Number(rating) };
  if (availability !== undefined) query.availability = availability === 'true';
  if (minPrice || maxPrice) {
    query['pricing.amount'] = {};
    if (minPrice) query['pricing.amount'].$gte = Number(minPrice);
    if (maxPrice) query['pricing.amount'].$lte = Number(maxPrice);
  }

  let sortOption = '-createdAt';
  if (sort === 'price_asc') sortOption = 'pricing.amount';
  if (sort === 'price_desc') sortOption = '-pricing.amount';
  if (sort === 'rating') sortOption = '-averageRating';
  if (sort === 'popular') sortOption = '-favoritesCount';

  const skip = (Number(page) - 1) * Number(limit);

  const [services, total] = await Promise.all([
    Service.find(query)
      .populate('provider', 'fullName profilePicture averageRating')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit)),
    Service.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: services.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: Number(page),
    services,
  });
});

// @desc  Get single service details
// @route GET /api/services/:id
exports.getService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id).populate(
    'provider',
    'fullName profilePicture averageRating location bio'
  );
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

  service.viewsCount += 1;
  await service.save();

  res.status(200).json({ success: true, service });
});

// @desc  Update service listing
// @route PUT /api/services/:id
exports.updateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

  if (service.provider.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to edit this service' });
  }

  const allowedFields = ['title', 'description', 'category', 'pricing', 'deliveryTime', 'availability', 'location', 'isActive'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) service[field] = req.body[field];
  });

  await service.save();
  res.status(200).json({ success: true, service });
});

// @desc  Delete service listing
// @route DELETE /api/services/:id
exports.deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

  if (service.provider.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this service' });
  }

  await service.deleteOne();
  res.status(200).json({ success: true, message: 'Service deleted successfully' });
});

// @desc  Get logged-in user's own service listings
// @route GET /api/services/my/listings
exports.getMyServices = asyncHandler(async (req, res) => {
  const services = await Service.find({ provider: req.user.id }).sort('-createdAt');
  res.status(200).json({ success: true, count: services.length, services });
});
