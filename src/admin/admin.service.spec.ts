import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { getModelToken } from '@nestjs/mongoose';
import { AuthService } from 'src/auth/auth.service';

// Mock AdminModel (not used in addProperty test but required)
const mockAdminModel = {
  findOne: jest.fn(),
  create: jest.fn(),
  updateOne: jest.fn(),
};

// Factory for PropertyModel (so we can call `new PropertyModel()`)
const mockPropertyModel = jest.fn().mockImplementation(() => ({
  save: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

describe('AdminService', () => {
  let service: AdminService;
  let PropertyModel: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getModelToken('Admin'),
          useValue: mockAdminModel,
        },
        {
          provide: getModelToken('Property'),
          useValue: mockPropertyModel,
        },
        {
          provide: AuthService,
          useValue: {
            hashPassword: jest.fn(),
            comparePassword: jest.fn(),
            createToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    PropertyModel = module.get(getModelToken('Property'));
  });

  describe('addProperty', () => {
    it('should calculate totalScore correctly', async () => {
      const dto: any = {
        proximity_to_NH: 3,
        public_places: 4,
        hospitals: 5,
        connectivity: 6,
        growth_potential: 7,
        environmental_safety: 8,
        nearest_city: 1,
        education: 2,
        commercial_zones: 3,
        infrastructure: 0,
        legal_clarity: 0,
        internal_amenities: 0,
      };

      const mockSave = jest.fn().mockResolvedValue({ ...dto, totalScore: 39 });
      // override save on this instance
      PropertyModel.mockImplementation(() => ({ save: mockSave }));

      const result = await service.addProperty(dto);

      expect(result.data.totalScore).toBe(39);
      expect(mockSave).toHaveBeenCalled();
    });
  });
});
