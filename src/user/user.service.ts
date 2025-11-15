import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Pact, PactDocument } from '../pact/schemas/pact.schema';
import { Activity, ActivityDocument } from '../activity/schemas/activity.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { JoinPactDto } from './dto/join-pact.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Pact.name) private pactModel: Model<PactDocument>,
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    // Check if user with email already exists
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existingUser) {
      return existingUser
    }

    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async joinPact(joinPactDto: JoinPactDto): Promise<{ user: UserDocument; pact: PactDocument }> {
    const userId = new Types.ObjectId(joinPactDto.userId);
    const pactId = new Types.ObjectId(joinPactDto.pactId);
    const activityIds = joinPactDto.activityIds.map((id) => new Types.ObjectId(id));

    // Verify user exists
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify pact exists
    const pact = await this.pactModel.findById(pactId);
    if (!pact) {
      throw new NotFoundException('Pact not found');
    }

    // Verify all activities exist and belong to the pact
    const activities = await this.activityModel.find({
      _id: { $in: activityIds },
      pactId: pactId,
    });

    if (activities.length !== activityIds.length) {
      throw new NotFoundException('One or more activities not found or do not belong to this pact');
    }

    // Check if user is already a participant in the pact
    const userIdString = userId.toString();
    const isAlreadyParticipant = pact.participants.some(
      (participantId) => participantId.toString() === userIdString,
    );

    if (isAlreadyParticipant) {
      throw new ConflictException('User is already a participant in this pact');
    }

    // Find primary and secondary activities from the activity collection
    const primaryActivity = activities.find((activity) => activity.isPrimary === true);
    const secondaryActivity = activities.find(
      (activity) => activity.isPrimary === false,
    );

    // Update user's pactDetails with pactId, primaryActivityId, and secondaryActivityId
    user.pactDetails = {
      pactId: pactId,
      primaryActivityId: primaryActivity ? (primaryActivity._id as Types.ObjectId) : undefined,
      secondaryActivityId: secondaryActivity ? (secondaryActivity._id as Types.ObjectId) : undefined,
    };
    await user.save();

    // Add userId to pact's participants array
    pact.participants.push(userId);
    await pact.save();

    return { user, pact };
  }
}
