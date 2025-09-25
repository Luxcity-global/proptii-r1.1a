import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { 
  Asset, 
  ApiResponse, 
  PaginationParams, 
  AssetSearchParams,
  CreateAssetRequest,
  UpdateAssetRequest,
  AssetCategory 
} from '../src/types';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/assets/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, videos, and documents
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/quicktime',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and documents are allowed.'));
    }
  }
});

// Mock data store (in production, this would be a database)
const assets: Asset[] = [
  {
    id: '1',
    user_id: 'user-1',
    name: 'Sample Image 1',
    description: 'A beautiful landscape image',
    file_path: '/uploads/assets/sample1.jpg',
    file_size: 1024000,
    mime_type: 'image/jpeg',
    width: 1920,
    height: 1080,
    category: AssetCategory.IMAGE,
    tags: ['landscape', 'nature', 'photography'],
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: 'user-1',
    name: 'Logo Design',
    description: 'Company logo in vector format',
    file_path: '/uploads/assets/logo.svg',
    file_size: 512000,
    mime_type: 'image/svg+xml',
    width: 500,
    height: 500,
    category: AssetCategory.IMAGE,
    tags: ['logo', 'branding', 'vector'],
    is_public: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Helper function to create API response
const createResponse = <T>(success: boolean, data?: T, error?: string, message?: string, pagination?: any): ApiResponse<T> => {
  return { success, data, error, message, pagination };
};

// GET /assets - Get all assets with pagination and filtering
router.get('/', (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort_by = 'created_at',
      sort_order = 'desc',
      category,
      tags,
      is_public,
      query
    } = req.query as any;

    let filteredAssets = [...assets];

    // Apply filters
    if (category) {
      filteredAssets = filteredAssets.filter(asset => asset.category === category);
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filteredAssets = filteredAssets.filter(asset => 
        tagArray.some(tag => asset.tags.includes(tag))
      );
    }

    if (is_public !== undefined) {
      const isPublic = is_public === 'true';
      filteredAssets = filteredAssets.filter(asset => asset.is_public === isPublic);
    }

    if (query) {
      const searchTerm = query.toLowerCase();
      filteredAssets = filteredAssets.filter(asset => 
        asset.name.toLowerCase().includes(searchTerm) ||
        asset.description?.toLowerCase().includes(searchTerm) ||
        asset.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply sorting
    filteredAssets.sort((a, b) => {
      const aValue = (a as any)[sort_by];
      const bValue = (b as any)[sort_by];
      
      if (sort_order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedAssets = filteredAssets.slice(startIndex, endIndex);
    
    const pagination = {
      page: pageNum,
      limit: limitNum,
      total: filteredAssets.length,
      total_pages: Math.ceil(filteredAssets.length / limitNum)
    };

    return res.json(createResponse(true, paginatedAssets, undefined, undefined, pagination));
  } catch (error) {
    console.error('Error fetching assets:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

// GET /assets/search - Search assets
router.get('/search', (req: Request, res: Response) => {
  try {
    const { query, category, tags, min_size, max_size, page = 1, limit = 10 } = req.query as any;
    
    let filteredAssets = [...assets];

    if (query) {
      const searchTerm = query.toLowerCase();
      filteredAssets = filteredAssets.filter(asset => 
        asset.name.toLowerCase().includes(searchTerm) ||
        asset.description?.toLowerCase().includes(searchTerm) ||
        asset.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    if (category) {
      filteredAssets = filteredAssets.filter(asset => asset.category === category);
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filteredAssets = filteredAssets.filter(asset => 
        tagArray.some(tag => asset.tags.includes(tag))
      );
    }

    if (min_size) {
      filteredAssets = filteredAssets.filter(asset => asset.file_size >= parseInt(min_size));
    }

    if (max_size) {
      filteredAssets = filteredAssets.filter(asset => asset.file_size <= parseInt(max_size));
    }

    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedAssets = filteredAssets.slice(startIndex, endIndex);
    
    const pagination = {
      page: pageNum,
      limit: limitNum,
      total: filteredAssets.length,
      total_pages: Math.ceil(filteredAssets.length / limitNum)
    };

    return res.json(createResponse(true, paginatedAssets, undefined, undefined, pagination));
  } catch (error) {
    console.error('Error searching assets:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

// GET /assets/:id - Get single asset
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const asset = assets.find(a => a.id === id);
    
    if (!asset) {
      return res.status(404).json(createResponse(false, undefined, 'Asset not found'));
    }
    
    return res.json(createResponse(true, asset));
  } catch (error) {
    console.error('Error fetching asset:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

// POST /assets - Upload new asset
router.post('/', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json(createResponse(false, undefined, 'No file uploaded'));
    }

    const { name, description, category, tags, is_public } = req.body;
    
    if (!name || !category) {
      return res.status(400).json(createResponse(false, undefined, 'Name and category are required'));
    }

    const newAsset: Asset = {
      id: (assets.length + 1).toString(),
      user_id: 'user-1', // In production, get from authenticated user
      name,
      description,
      file_path: req.file.path,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      width: undefined, // Would be extracted from image metadata
      height: undefined, // Would be extracted from image metadata
      category: category as AssetCategory,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : [],
      is_public: is_public === 'true',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    assets.push(newAsset);
    
    return res.status(201).json(createResponse(true, newAsset, undefined, 'Asset uploaded successfully'));
  } catch (error) {
    console.error('Error uploading asset:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

// PUT /assets/:id - Update asset
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates: UpdateAssetRequest = req.body;
    
    const assetIndex = assets.findIndex(a => a.id === id);
    
    if (assetIndex === -1) {
      return res.status(404).json(createResponse(false, undefined, 'Asset not found'));
    }

    const updatedAsset = {
      ...assets[assetIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    assets[assetIndex] = updatedAsset;
    
    return res.json(createResponse(true, updatedAsset, undefined, 'Asset updated successfully'));
  } catch (error) {
    console.error('Error updating asset:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

// DELETE /assets/:id - Delete asset
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assetIndex = assets.findIndex(a => a.id === id);
    
    if (assetIndex === -1) {
      return res.status(404).json(createResponse(false, undefined, 'Asset not found'));
    }

    assets.splice(assetIndex, 1);
    
    return res.json(createResponse(true, null, undefined, 'Asset deleted successfully'));
  } catch (error) {
    console.error('Error deleting asset:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

// POST /assets/batch-delete - Delete multiple assets
router.post('/batch-delete', (req: Request, res: Response) => {
  try {
    const { assetIds } = req.body;
    
    if (!Array.isArray(assetIds)) {
      return res.status(400).json(createResponse(false, undefined, 'assetIds must be an array'));
    }

    let deletedCount = 0;
    assetIds.forEach(id => {
      const assetIndex = assets.findIndex(a => a.id === id);
      if (assetIndex !== -1) {
        assets.splice(assetIndex, 1);
        deletedCount++;
      }
    });
    
    return res.json(createResponse(true, null, undefined, `${deletedCount} assets deleted successfully`));
  } catch (error) {
    console.error('Error batch deleting assets:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

export default router;
