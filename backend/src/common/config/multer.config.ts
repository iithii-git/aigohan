import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

export const multerConfig: MulterOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10, // 最大10ファイル
  },
  fileFilter: (req, file, callback) => {
    // サポートされている画像形式
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException(`サポートされていないファイル形式です。対応形式: ${allowedMimeTypes.join(', ')}`),
        false
      );
    }
    
    callback(null, true);
  },
};

export const createMulterOptions = (): MulterOptions => multerConfig;