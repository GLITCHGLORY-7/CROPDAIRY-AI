import { describe, it, expect } from 'vitest';
import { farmSchema, plotSchema } from '../lib/validation/farmSchemas';
import { loginSchema, registerSchema } from '../lib/validation/authSchemas';

describe('Validation Schemas', () => {
  describe('Farm Schema', () => {
    it('validates correct farm data', () => {
      const validFarm = {
        name: 'Kaveri Green Farm',
        description: 'Near north irrigation canal',
        country: 'India',
        state: 'Tamil Nadu',
        district: 'Thanjavur',
        village: 'Thiruvaiyaru',
        area: 4.5,
        area_unit: 'Acres',
        farming_type: 'Open field',
        soil_type: 'Clay Loam',
        irrigation_method: 'Drip',
        water_availability: 'Adequate',
        status: 'active',
      };
      const result = farmSchema.safeParse(validFarm);
      expect(result.success).toBe(true);
    });

    it('rejects negative or zero farm area', () => {
      const invalidFarm = {
        name: 'Delta Farm',
        country: 'India',
        state: 'Tamil Nadu',
        district: 'Thanjavur',
        area: -2,
      };
      const result = farmSchema.safeParse(invalidFarm);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.area).toBeDefined();
      }
    });

    it('rejects short farm name', () => {
      const invalidFarm = {
        name: 'F',
        country: 'India',
        state: 'Tamil Nadu',
        district: 'Thanjavur',
        area: 5,
      };
      const result = farmSchema.safeParse(invalidFarm);
      expect(result.success).toBe(false);
    });
  });

  describe('Plot Schema', () => {
    it('validates correct plot data with valid UUID', () => {
      const validPlot = {
        name: 'North Acre Paddy',
        farm_id: '123e4567-e89b-12d3-a456-426614174000',
        area: 1.5,
        area_unit: 'Acres',
        soil_type: 'Clay',
        irrigation_method: 'Drip',
        farming_environment: 'Open field',
        status: 'active',
      };
      const result = plotSchema.safeParse(validPlot);
      expect(result.success).toBe(true);
    });

    it('rejects invalid farm UUID in plot', () => {
      const invalidPlot = {
        name: 'North Acre',
        farm_id: 'not-a-uuid',
        area: 1.5,
        area_unit: 'Acres',
        soil_type: 'Clay',
        irrigation_method: 'Drip',
        farming_environment: 'Open field',
      };
      const result = plotSchema.safeParse(invalidPlot);
      expect(result.success).toBe(false);
    });
  });

  describe('Auth Schemas', () => {
    it('validates matching passwords on register', () => {
      const validRegister = {
        fullName: 'Murugan Farmer',
        email: 'murugan@example.com',
        password: 'securepassword123',
        confirmPassword: 'securepassword123',
        preferredLanguage: 'ta',
      };
      const result = registerSchema.safeParse(validRegister);
      expect(result.success).toBe(true);
    });

    it('rejects mismatched passwords on register', () => {
      const invalidRegister = {
        fullName: 'Murugan Farmer',
        email: 'murugan@example.com',
        password: 'securepassword123',
        confirmPassword: 'wrongpassword',
        preferredLanguage: 'ta',
      };
      const result = registerSchema.safeParse(invalidRegister);
      expect(result.success).toBe(false);
    });

    it('rejects invalid email on login', () => {
      const invalidLogin = {
        email: 'notanemail',
        password: 'short',
      };
      const result = loginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });
  });
});
