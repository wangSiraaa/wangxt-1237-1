import { Injectable } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Injectable()
export class UploadService {
  getStorageConfig() {
    const uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

    return diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, uploadDir);
      },
      filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
      },
    });
  }

  fileFilter(_req: any, file: any, cb: any) {
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const allowedExcelTypes = /sheet|excel|xlsx|xls/;
    const isImage = allowedImageTypes.test(extname(file.originalname).toLowerCase()) ||
                    allowedImageTypes.test(file.mimetype);
    const isExcel = allowedExcelTypes.test(extname(file.originalname).toLowerCase()) ||
                    allowedExcelTypes.test(file.mimetype);
    if (isImage || isExcel) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片或Excel文件'), false);
    }
  }

  constructFileUrl(filename: string, req: any): string {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    return `${protocol}://${host}/uploads/${filename}`;
  }
}
