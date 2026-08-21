import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ schemaReady: true }]),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    prisma = app.get(PrismaService);
  });

  describe('health', () => {
    it('should confirm API and database health', async () => {
      await expect(appController.health()).resolves.toEqual({ status: 'ok' });
    });

    it('should reject an outdated database schema', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([{ schemaReady: false }]);

      await expect(appController.health()).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });
});
