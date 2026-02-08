jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));
jest.mock('../../middleware/auth', () => ({
  checkJwt: (req: any, res: any, next: any) => next(),
  enrichUserFromDb: (req: any, res: any, next: any) => next(),
  requiredRoles: () => (req: any, res: any, next: any) => next(),
  requiredUserId: (req: any, res: any, next: any) => next(),
  requireUserOrTherapist: (req: any, res: any, next: any) => next(),
}));
jest.mock('../../api/services/careplans');

import request from 'supertest';
import express from 'express';
import carePlanRouter from '../../api/routes/carePlan';

const app = express();
app.use(express.json());
app.use(carePlanRouter);

import * as careplansService from '../../api/services/careplans';

describe('carePlan routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /:care_plan_id returns care plan', async () => {
    const plan = { care_plan_id: 'cp-1', care_plan_name: 'Plan A' };
    jest.mocked(careplansService.getCarePlan).mockResolvedValue(plan as any);
    const res = await request(app).get('/cp-1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(plan);
  });

  it('POST / creates care plan', async () => {
    jest.mocked(careplansService.createCarePlan).mockResolvedValue('new-id' as any);
    const res = await request(app)
      .post('/')
      .send({
        user_id: 'u-1',
        therapist_id: 't-1',
        care_plan_name: 'Plan A',
        care_plan_description: 'Desc',
      });
    expect(res.status).toBe(200);
    expect(careplansService.createCarePlan).toHaveBeenCalled();
  });

  it('PUT /:care_plan_id updates care plan', async () => {
    jest.mocked(careplansService.updateCarePlan).mockResolvedValue(1);
    const res = await request(app)
      .put('/cp-1')
      .send({
        user_id: 'u-1',
        therapist_id: 't-1',
        care_plan_name: 'Plan B',
        care_plan_description: 'Desc2',
      });
    expect(res.status).toBe(200);
    expect(careplansService.updateCarePlan).toHaveBeenCalledWith('cp-1', expect.any(Object));
  });

  it('DELETE /:care_plan_id deletes care plan', async () => {
    jest.mocked(careplansService.deleteCarePlan).mockResolvedValue(1);
    const res = await request(app).delete('/cp-1');
    expect(res.status).toBe(200);
    expect(careplansService.deleteCarePlan).toHaveBeenCalledWith('cp-1');
  });
});
