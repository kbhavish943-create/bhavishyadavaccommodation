// src/middleware/validation.js
// Request Data Validation Middleware

const logger = require('../config/logger');

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const dataToValidate = {
      ...req.body,
      ...req.params,
      ...req.query
    };

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.reduce((acc, err) => {
        acc[err.path.join('.')] = err.message;
        return acc;
      }, {});

      logger.warn('Validation error:', { path: req.path, errors });

      return res.status(400).json({
        success: false,
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: errors
      });
    }

    // Replace req.body with validated data
    req.validatedData = value;
    next();
  };
};

// File upload validation
const validateFileUpload = (allowedFormats, maxSize) => {
  return (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
        code: 'NO_FILES'
      });
    }

    const files = req.files.files || [req.files.files];
    const filesArray = Array.isArray(files) ? files : [files];

    for (const file of filesArray) {
      const ext = file.name.split('.').pop().toLowerCase();
      const fileSize = file.size;

      if (!allowedFormats.includes(ext)) {
        return res.status(400).json({
          success: false,
          error: `Invalid file format. Allowed: ${allowedFormats.join(', ')}`,
          code: 'INVALID_FILE_FORMAT'
        });
      }

      if (fileSize > maxSize) {
        return res.status(400).json({
          success: false,
          error: `File size exceeds limit of ${maxSize / 1024 / 1024}MB`,
          code: 'FILE_SIZE_EXCEEDED'
        });
      }
    }

    next();
  };
};

// Sanitize input to prevent injection attacks
const sanitizeInput = (req, res, next) => {
  const sanitize = (str) => {
    if (typeof str === 'string') {
      return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    return str;
  };

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return;

    for (const key of Object.keys(obj)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        delete obj[key];
        continue;
      }

      if (typeof obj[key] === 'string') {
        obj[key] = sanitize(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  sanitizeObject(req.body);
  sanitizeObject(req.query);
  sanitizeObject(req.params);

  next();
};

module.exports = {
  validate,
  validateFileUpload,
  sanitizeInput
};
