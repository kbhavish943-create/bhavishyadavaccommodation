// src/routes/hallRoutes.js
// Hall/Venue Management Routes

const express = require('express');
const router = express.Router();
const hallController = require('../controllers/hallController');
const { validate, sanitizeInput } = require('../middleware/validation');
const { verifyToken, checkRole, optionalAuth } = require('../middleware/auth');
const validators = require('../utils/validators');

/**
 * @route   POST /api/halls
 * @desc    Create new hall
 * @access  Protected (Vendor only)
 * @body    {hallName, description, category, address, city, state, pincode, coordinates, capacity, basePrice, amenities, policies}
 */
router.post('/', verifyToken, checkRole('vendor'), sanitizeInput, validate(validators.hallCreationSchema), hallController.createHall);

/**
 * @route   PUT /api/halls/:hallId
 * @desc    Update hall
 * @access  Protected (Vendor - owner only)
 * @param   {string} hallId - Hall ID
 * @body    {hallName, description, category, capacity, basePrice, amenities, policies, etc.}
 */
router.put('/:hallId', verifyToken, checkRole('vendor'), sanitizeInput, validate(validators.hallUpdateSchema), hallController.updateHall);

/**
 * @route   DELETE /api/halls/:hallId
 * @desc    Delete/disable hall
 * @access  Protected (Vendor - owner only)
 * @param   {string} hallId - Hall ID
 */
router.delete('/:hallId', verifyToken, checkRole('vendor'), hallController.deleteHall);

/**
 * @route   GET /api/halls
 * @desc    List halls with filters and pagination
 * @access  Public
 * @query   {city, category, minPrice, maxPrice, amenities, search, page, limit, sortBy, sortOrder}
 */
router.get('/', sanitizeInput, validate(validators.listingFiltersSchema), hallController.listHalls);

/**
 * @route   GET /api/halls/search/nearby
 * @desc    Search halls by geo-location
 * @access  Public
 * @query   {latitude, longitude, maxDistance, category, limit}
 */
router.get('/search/nearby', hallController.searchNearbyHalls);

/**
 * @route   GET /api/vendors/me/halls
 * @desc    Get all halls created by vendor
 * @access  Protected (Vendor only)
 */
router.get('/vendor/my-halls', verifyToken, checkRole('vendor'), hallController.getVendorHalls);

/**
 * @route   GET /api/halls/:hallId
 * @desc    Get hall details by ID
 * @access  Public
 * @param   {string} hallId - Hall ID
 */
router.get('/:hallId', optionalAuth, hallController.getHallDetails);

module.exports = router;
