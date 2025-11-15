import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Activity, ActivityDocument } from './schemas/activity.schema';
import { CreateActivityDto } from './dto/create-activity.dto';
import { Pact, PactDocument } from '../pact/schemas/pact.schema';
import { User, UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
    @InjectModel(Pact.name) private pactModel: Model<PactDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createActivityDto: CreateActivityDto): Promise<ActivityDocument> {
    // Verify that the pact exists
    const pactId = new Types.ObjectId(createActivityDto.pactId);
    const pact = await this.pactModel.findById(pactId);
    if (!pact) {
      throw new NotFoundException('Pact not found');
    }

    // Verify that the user exists
    const userId = new Types.ObjectId(createActivityDto.userId);
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Count how many activities the user has already created for this pact
    const existingActivitiesCount = await this.activityModel.countDocuments({
      pactId: pactId,
      userId: userId,
    });

    // Validate that user hasn't exceeded maxActivitiesPerUser
    if (existingActivitiesCount >= pact.maxActivitiesPerUser) {
      throw new BadRequestException(
        `User has reached the maximum number of activities (${pact.maxActivitiesPerUser}) allowed in this pact`,
      );
    }

    // Validate that only one primary activity exists per user per pact
    if (createActivityDto.isPrimary) {
      const existingPrimaryActivity = await this.activityModel.findOne({
        pactId: pactId,
        userId: userId,
        isPrimary: true,
      });

      if (existingPrimaryActivity) {
        throw new BadRequestException(
          'A primary activity already exists for this user in this pact. Only one primary activity is allowed per user per pact.',
        );
      }
    }

    const activityData = {
      pactId: pactId,
      userId: userId,
      name: createActivityDto.name,
      description: createActivityDto.description,
      numberOfDays: createActivityDto.numberOfDays,
      isPrimary: createActivityDto.isPrimary,
    };

    const createdActivity = new this.activityModel(activityData);
    return createdActivity.save();
  }

  async findByUserAndPact(userId: string, pactId: string): Promise<ActivityDocument[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    if (!pactId || !Types.ObjectId.isValid(pactId)) {
      throw new BadRequestException('Invalid pact ID');
    }

    // Verify that the user exists
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify that the pact exists
    const pact = await this.pactModel.findById(pactId);
    if (!pact) {
      throw new NotFoundException('Pact not found');
    }

    const userIdObj = new Types.ObjectId(userId);
    const pactIdObj = new Types.ObjectId(pactId);

    return this.activityModel
      .find({
        userId: userIdObj,
        pactId: pactIdObj,
      })
      .populate('pactId', 'title description minDaysPerWeek maxActivitiesPerUser skipFine leaveFine')
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .exec();
  }
}
