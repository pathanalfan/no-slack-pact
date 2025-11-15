import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Pact, PactDocument } from './schemas/pact.schema';
import { CreatePactDto } from './dto/create-pact.dto';

@Injectable()
export class PactService {
  constructor(@InjectModel(Pact.name) private pactModel: Model<PactDocument>) {}

  async create(createPactDto: CreatePactDto): Promise<PactDocument> {
    const createdPact = new this.pactModel(createPactDto);
    return createdPact.save();
  }

  async findAllActive(): Promise<PactDocument[]> {
    return this.pactModel
      .find({ status: 'active' })
      .populate('participants', 'name email phone')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<PactDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return this.pactModel
      .findById(id)
      .populate('participants', 'name email phone')
      .exec();
  }
}
