<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

  <p align="center">A group accountability platform built with <a href="http://nodejs.org" target="_blank">Node.js</a> and <a href="https://nestjs.com" target="_blank">NestJS</a>.</p>

## Description

**No-Slack-Pact** is a group accountability platform that helps people commit to and track daily activities together. Users form "pacts" (commitment groups) where they agree to perform activities regularly, log their progress with media proof, and face financial penalties for non-compliance.

### Key Features

- **Pact Management**: Create accountability groups with customizable rules (minimum days per week, activity limits, fines)
- **Activity Tracking**: Log daily activities with timestamps, notes, and media attachments
- **Media Verification**: Upload images/videos to Google Drive as proof of activity completion
- **Progress Monitoring**: Track weekly compliance against minimum days requirements
- **Financial Accountability**: Fine system for skipping activities or leaving pacts early
- **IST Timezone Support**: All date calculations use Indian Standard Time (UTC+5:30)

### How It Works

1. **Create a Pact**: Set up a group with rules like minimum days per week (1-7), max activities per user, and fine amounts
2. **Join & Add Activities**: Users join pacts and create activities (one primary, optional secondary activities)
3. **Log Daily Activities**: Users log their activities once per day (IST timezone) with optional notes and media
4. **Track Progress**: System calculates weekly progress and compliance for each participant
5. **Media Storage**: Proof media is organized in Google Drive by pact → week → user, automatically shared with participants

### Use Cases

- Fitness accountability groups (e.g., "Gym 5 days a week")
- Study groups with daily commitment requirements
- Habit formation challenges
- Team-based goal tracking
- Any group activity requiring daily consistency

## Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (Node.js/TypeScript)
- **Database**: MongoDB with Mongoose ODM
- **Storage**: Google Drive API for media files
- **Validation**: class-validator and class-transformer

## Installation

```bash
$ npm install
```

## Environment Variables

Make sure to set up the following environment variables:

- MongoDB connection string
- Google Drive API credentials
- `MAX_IMAGE_BYTES` (default: 10MB)
- `MAX_VIDEO_BYTES` (default: 100MB)
- `GDRIVE_DEFAULT_VISIBILITY` (default: 'link')

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Resources

- [NestJS Documentation](https://docs.nestjs.com) - Learn more about the NestJS framework
- [MongoDB Documentation](https://www.mongodb.com/docs/) - Database documentation
- [Google Drive API](https://developers.google.com/drive) - Media storage integration

## API Modules

The application follows RESTful patterns with the following modules:

- `/pact` - Pact management (create, list, get details)
- `/user` - User management (create, join pact, update)
- `/activity` - Activity management (create, list by user/pact)
- `/activity-log` - Daily activity logging and progress tracking
- `/media` - File upload and management via Google Drive

## Business Rules

- One activity log per user per day per pact (IST calendar day)
- Weekly progress calculated using IST week boundaries
- Media files organized in Google Drive with automatic sharing
- Financial penalties (skipFine, leaveFine) for non-compliance
- Primary activity validation (one per user per pact)

## License

This project is [MIT licensed](LICENSE).
