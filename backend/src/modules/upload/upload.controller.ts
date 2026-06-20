import { Controller, Post, UseInterceptors, UploadedFile, Req, BadRequestException, Get, Param, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { Request, Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';

@Controller('uploads')
export class UploadController {
  constructor(private readonly service: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('请选择图片文件');
    const storage = this.service.getStorageConfig();
    return new Promise((resolve, reject) => {
      storage._handleFile(req, file, (err: any, info: any) => {
        if (err) return reject(new BadRequestException('上传失败'));
        resolve({
          filename: info.filename,
          originalName: file.originalname,
          url: this.service.constructFileUrl(info.filename, req),
          size: info.size,
        });
      });
    });
  }

  @Get(':filename')
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', filename);
    if (!existsSync(filePath)) {
      return res.status(404).json({ message: '文件不存在' });
    }
    const stream = createReadStream(filePath);
    stream.pipe(res);
  }
}
