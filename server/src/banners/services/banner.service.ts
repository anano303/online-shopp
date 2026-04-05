import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Banner, BannerType } from '../schemas/banner.schema';
import { CreateBannerDto, UpdateBannerDto } from '../dtos/banner.dto';

@Injectable()
export class BannerService {
  constructor(@InjectModel(Banner.name) private bannerModel: Model<Banner>) {}

  async create(createBannerDto: CreateBannerDto): Promise<Banner> {
    const banner = new this.bannerModel(createBannerDto);
    return banner.save();
  }

  async findAll(type?: BannerType): Promise<Banner[]> {
    const filter: Record<string, unknown> = {};
    if (type) {
      // თუ main ტიპია, ვეძებთ main ან type არ აქვს (ძველი ბანერები)
      if (type === BannerType.MAIN) {
        filter.$or = [
          { type: BannerType.MAIN },
          { type: { $exists: false } },
          { type: null },
        ];
      } else {
        filter.type = type;
      }
    }
    return this.bannerModel
      .find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .exec();
  }

  async findActive(type?: BannerType): Promise<Banner[]> {
    const filter: Record<string, unknown> = { isActive: true };
    if (type) {
      // თუ main ტიპია, ვეძებთ main ან type არ აქვს (ძველი ბანერები)
      if (type === BannerType.MAIN) {
        filter.$or = [
          { type: BannerType.MAIN },
          { type: { $exists: false } },
          { type: null },
        ];
      } else {
        filter.type = type;
      }
    }
    return this.bannerModel
      .find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .exec();
  }

  // Get hunting banners specifically
  async findHuntingBanners(): Promise<Banner[]> {
    return this.bannerModel
      .find({ type: BannerType.HUNTING, isActive: true })
      .sort({ sortOrder: 1 })
      .exec();
  }

  async findOne(id: string): Promise<Banner> {
    return this.bannerModel.findById(id).exec();
  }

  async update(id: string, updateBannerDto: UpdateBannerDto): Promise<Banner> {
    return this.bannerModel
      .findByIdAndUpdate(id, updateBannerDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<void> {
    await this.bannerModel.findByIdAndDelete(id).exec();
  }
}
