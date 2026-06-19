// src/controllers/hallController.js
// Hall/Venue Management Controller

const Hall = require('../models/Hall');
const Vendor = require('../models/Vendor');
const logger = require('../config/logger');
const { getCacheJSON, setCacheJSON, deleteByPrefix } = require('../services/cacheService');

const PUBLIC_CACHE_TTL_SECONDS = Number(process.env.PUBLIC_CACHE_TTL_SECONDS || 30);
const invalidatePublicCaches = async () => {
  await Promise.all([
    deleteByPrefix('hall:'),
    deleteByPrefix('hall-list:'),
    deleteByPrefix('nearby:')
  ]);
};

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Create new hall
 * POST /api/halls
 * Auth: Vendor only
 */
const createHall = async (req, res) => {
  try {
    const { userId } = req;
    const hallData = req.validatedData;

    // Verify vendor exists
    const vendor = await Vendor.findOne({ userId });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor profile not found',
        code: 'VENDOR_NOT_FOUND'
      });
    }

    // Create new hall
    const hall = new Hall({
      ...hallData,
      vendorId: vendor._id,
      coordinates: {
        type: 'Point',
        coordinates: [hallData.coordinates.longitude, hallData.coordinates.latitude]
      }
    });

    await hall.save();

    // Update vendor's hall count
    vendor.totalHalls = (vendor.totalHalls || 0) + 1;
    await vendor.save();
    await invalidatePublicCaches();

    logger.info(`Hall created: ${hall.hallId} by vendor ${userId}`);

    return res.status(201).json({
      success: true,
      message: 'Hall created successfully',
      data: {
        hallId: hall._id,
        hallCode: hall.hallId,
        hallName: hall.hallName,
        approvalStatus: hall.approvalStatus,
        status: hall.status
      }
    });
  } catch (error) {
    logger.error('Create hall error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create hall',
      code: 'CREATE_HALL_ERROR'
    });
  }
};

/**
 * Get hall details
 * GET /api/halls/:hallId
 * Auth: Public (with optional auth for edit access check)
 */
const getHallDetails = async (req, res) => {
  try {
    const { hallId } = req.params;
    const cacheKey = `hall:${hallId}`;
    const cached = await getCacheJSON(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached
      });
    }

    const hall = await Hall.findById(hallId)
      .populate('vendorId', 'businessName averageRating totalReviews')
      .lean();

    if (!hall) {
      return res.status(404).json({
        success: false,
        error: 'Hall not found',
        code: 'HALL_NOT_FOUND'
      });
    }

    await setCacheJSON(cacheKey, hall, PUBLIC_CACHE_TTL_SECONDS);
    Hall.findByIdAndUpdate(hallId, { $inc: { viewCount: 1 } }).catch((err) => {
      logger.warn(`Failed to increment view count for hall ${hallId}: ${err.message}`);
    });

    return res.status(200).json({
      success: true,
      data: hall
    });
  } catch (error) {
    logger.error('Get hall details error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch hall details',
      code: 'GET_HALL_ERROR'
    });
  }
};

/**
 * Update hall
 * PUT /api/halls/:hallId
 * Auth: Vendor only (owner)
 */
const updateHall = async (req, res) => {
  try {
    const { hallId } = req.params;
    const { userId } = req;
    const updateData = req.validatedData;

    const hall = await Hall.findById(hallId);

    if (!hall) {
      return res.status(404).json({
        success: false,
        error: 'Hall not found',
        code: 'HALL_NOT_FOUND'
      });
    }

    // Check if user is the vendor owner
    const vendor = await Vendor.findOne({ userId });

    if (!vendor || !hall.vendorId.equals(vendor._id)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this hall',
        code: 'UNAUTHORIZED'
      });
    }

    // Update hall
    Object.assign(hall, updateData);

    if (updateData.coordinates) {
      hall.coordinates = {
        type: 'Point',
        coordinates: [updateData.coordinates.longitude, updateData.coordinates.latitude]
      };
    }

    await hall.save();
    await invalidatePublicCaches();

    logger.info(`Hall updated: ${hallId} by vendor ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'Hall updated successfully',
      data: {
        hallId: hall._id,
        hallName: hall.hallName,
        updatedAt: hall.updatedAt
      }
    });
  } catch (error) {
    logger.error('Update hall error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update hall',
      code: 'UPDATE_HALL_ERROR'
    });
  }
};

/**
 * List halls with filters
 * GET /api/halls
 * Auth: Public
 * Query params: city, category, minPrice, maxPrice, amenities, search, page, limit
 */
const listHalls = async (req, res) => {
  try {
    const {
      city,
      category,
      minPrice,
      maxPrice,
      minCapacity,
      amenities,
      search,
      page = 1,
      limit = 10,
      sortBy = 'rating',
      sortOrder = 'desc'
    } = req.validatedData;

    // Build filter query
    const filter = { status: 'active', approvalStatus: 'approved' };

    if (city) filter.city = new RegExp(escapeRegex(city.trim()), 'i');
    if (category) filter.category = category;
    if (search) {
      const safeSearch = escapeRegex(search.trim());
      filter.$or = [
        { hallName: new RegExp(safeSearch, 'i') },
        { description: new RegExp(safeSearch, 'i') }
      ];
    }

    // Price filter
    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = minPrice;
      if (maxPrice) filter.basePrice.$lte = maxPrice;
    }

    // Capacity filter
    if (minCapacity) {
      filter['capacity.dining'] = { $gte: minCapacity };
    }

    // Amenities filter
    if (amenities && amenities.length > 0) {
      filter.amenities = { $in: amenities };
    }

    // Sort configuration
    let sortConfig = {};
    if (sortBy === 'rating') {
      sortConfig['ratings.average'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'price') {
      sortConfig['basePrice'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'newest') {
      sortConfig['createdAt'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'popularity') {
      sortConfig['viewCount'] = sortOrder === 'desc' ? -1 : 1;
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;
    const cacheKey = `hall-list:${JSON.stringify({ filter, sortConfig, pageNum, limitNum })}`;
    const cached = await getCacheJSON(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached
      });
    }

    // Execute query
    const [halls, total] = await Promise.all([
      Hall.find(filter)
        .populate('vendorId', 'businessName averageRating totalReviews')
        .sort(sortConfig)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Hall.countDocuments(filter)
    ]);

    const payload = {
      halls,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    };
    await setCacheJSON(cacheKey, payload, PUBLIC_CACHE_TTL_SECONDS);

    return res.status(200).json({
      success: true,
      data: payload
    });
  } catch (error) {
    logger.error('List halls error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch halls',
      code: 'LIST_HALLS_ERROR'
    });
  }
};

/**
 * Search halls by location (geo-spatial)
 * GET /api/halls/search/nearby
 * Auth: Public
 * Query: latitude, longitude, maxDistance (in km)
 */
const searchNearbyHalls = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 50, category, limit = 20 } = req.validatedData;
    const latNum = Number(latitude);
    const lonNum = Number(longitude);
    const maxDistanceNum = Math.max(1, Number(maxDistance) || 50);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
    const cacheKey = `nearby:${latNum}:${lonNum}:${maxDistanceNum}:${category || ''}:${limitNum}`;
    const cached = await getCacheJSON(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached
      });
    }

    const filter = {
      status: 'active',
      approvalStatus: 'approved',
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lonNum, latNum]
          },
          $maxDistance: maxDistanceNum * 1000 // Convert km to meters
        }
      }
    };

    if (category) filter.category = category;

    const halls = await Hall.find(filter)
      .populate('vendorId', 'businessName averageRating')
      .limit(limitNum)
      .lean();

    const payload = {
      halls,
      count: halls.length,
      searchRadius: maxDistanceNum
    };
    await setCacheJSON(cacheKey, payload, PUBLIC_CACHE_TTL_SECONDS);

    return res.status(200).json({
      success: true,
      data: payload
    });
  } catch (error) {
    logger.error('Search nearby halls error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search halls',
      code: 'SEARCH_ERROR'
    });
  }
};

/**
 * Get vendor's halls
 * GET /api/vendors/me/halls
 * Auth: Vendor only
 */
const getVendorHalls = async (req, res) => {
  try {
    const { userId } = req;

    const vendor = await Vendor.findOne({ userId });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor profile not found',
        code: 'VENDOR_NOT_FOUND'
      });
    }

    const halls = await Hall.find({ vendorId: vendor._id }).lean();

    return res.status(200).json({
      success: true,
      data: {
        halls,
        count: halls.length
      }
    });
  } catch (error) {
    logger.error('Get vendor halls error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor halls',
      code: 'GET_VENDOR_HALLS_ERROR'
    });
  }
};

/**
 * Delete hall
 * DELETE /api/halls/:hallId
 * Auth: Vendor only (owner)
 */
const deleteHall = async (req, res) => {
  try {
    const { hallId } = req.params;
    const { userId } = req;

    const hall = await Hall.findById(hallId);

    if (!hall) {
      return res.status(404).json({
        success: false,
        error: 'Hall not found',
        code: 'HALL_NOT_FOUND'
      });
    }

    const vendor = await Vendor.findOne({ userId });

    if (!vendor || !hall.vendorId.equals(vendor._id)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this hall',
        code: 'UNAUTHORIZED'
      });
    }

    // Soft delete by marking status as inactive
    hall.status = 'inactive';
    await hall.save();
    await invalidatePublicCaches();

    // Update vendor's hall count
    vendor.totalHalls = Math.max(0, (vendor.totalHalls || 1) - 1);
    await vendor.save();

    logger.info(`Hall deleted: ${hallId} by vendor ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'Hall deleted successfully'
    });
  } catch (error) {
    logger.error('Delete hall error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete hall',
      code: 'DELETE_HALL_ERROR'
    });
  }
};

module.exports = {
  createHall,
  getHallDetails,
  updateHall,
  listHalls,
  searchNearbyHalls,
  getVendorHalls,
  deleteHall
};
