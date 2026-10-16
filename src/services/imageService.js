const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger'); // Assuming logger exists

const validateImageFile = async (filePath) => {
  try {
    const metadata = await sharp(filePath).metadata();
    const validFormats = ['jpeg', 'png', 'webp', 'gif', 'avif', 'tiff'];
    if (!validFormats.includes(metadata.format)) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
};

const optimizeImage = async (inputPath, outputPath, options = {}) => {
  try {
    const isValid = await validateImageFile(inputPath);
    if (!isValid) {
      throw new Error('Invalid image file format');
    }

    const { format = 'webp' } = options; // Default to webp if not specified

    let pipeline = sharp(inputPath).resize({
      width: 1200,
      withoutEnlargement: true,
      fit: sharp.fit.inside,
    });

    if (format === 'jpeg' || format === 'jpg') {
      pipeline = pipeline.jpeg({ quality: 80 });
    } else {
      pipeline = pipeline.webp({ quality: 80 });
    }

    await pipeline.toFile(outputPath);
    return true;
  } catch (error) {
    logger.error('Error optimizing image:', error);
    throw new Error('Image optimization failed');
  }
};

const generateThumbnail = async (inputPath, outputPath) => {
  try {
    const isValid = await validateImageFile(inputPath);
    if (!isValid) {
      throw new Error('Invalid image file format');
    }

    await sharp(inputPath)
      .resize({
        width: 300,
        height: 300,
        fit: sharp.fit.cover,
      })
      .webp({ quality: 80 })
      .toFile(outputPath);
      
    return true;
  } catch (error) {
    logger.error('Error generating thumbnail:', error);
    throw new Error('Thumbnail generation failed');
  }
};

const deleteFile = async (filePath) => {
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.error(`Error deleting file ${filePath}:`, error);
    }
    return false;
  }
};

module.exports = {
  validateImageFile,
  optimizeImage,
  generateThumbnail,
  deleteFile,
};
