jest.mock('../../api/config/mongo', () => {
  const toArray = jest.fn();
  const m = {
    findOne: jest.fn(),
    find: jest.fn(() => ({ toArray })),
    insertOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  };
  (global as any).__usersServiceMocks = { ...m, toArray };
  return {
    __esModule: true,
    default: {
      db: jest.fn(() => ({
        collection: jest.fn(() => m),
      })),
    },
  };
});

import {
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getAllUsers,
  getAllTherapists,
  getTherapistByEmail,
  getUserByExternalAuthId,
  getClientsByTherapistId,
  addClientToTherapist,
} from '../../api/services/users';

const mocks = (global as any).__usersServiceMocks;
const m = {
  findOne: mocks.findOne,
  find: mocks.find,
  toArray: mocks.toArray,
  insertOne: mocks.insertOne,
  updateOne: mocks.updateOne,
  deleteOne: mocks.deleteOne,
};

describe('users service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUser', () => {
    it('returns user when found', async () => {
      const user = { user_id: 'u-1', email: 'a@b.com' };
      m.findOne.mockResolvedValue(user);
      const result = await getUser('u-1');
      expect(m.findOne).toHaveBeenCalledWith({ user_id: 'u-1' });
      expect(result).toEqual(user);
    });

    it('returns null when not found', async () => {
      m.findOne.mockResolvedValue(null);
      const result = await getUser('u-missing');
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('inserts user and returns insertedId', async () => {
      m.insertOne.mockResolvedValue({ insertedId: 'new-id' });
      const user = { user_id: 'u-1', external_auth_id: 'auth0|1', email: 'a@b.com' } as any;
      const result = await createUser(user);
      expect(m.insertOne).toHaveBeenCalledWith(user);
      expect(result).toBe('new-id');
    });
  });

  describe('updateUser', () => {
    it('updates user and returns modifiedCount', async () => {
      m.updateOne.mockResolvedValue({ modifiedCount: 1 });
      const user = { user_id: 'u-1', email: 'new@b.com' } as any;
      const result = await updateUser('u-1', user);
      expect(m.updateOne).toHaveBeenCalledWith({ user_id: 'u-1' }, { $set: user });
      expect(result).toBe(1);
    });
  });

  describe('deleteUser', () => {
    it('deletes user and returns deletedCount', async () => {
      m.deleteOne.mockResolvedValue({ deletedCount: 1 });
      const result = await deleteUser('u-1');
      expect(m.deleteOne).toHaveBeenCalledWith({ user_id: 'u-1' });
      expect(result).toBe(1);
    });
  });

  describe('getAllUsers', () => {
    it('returns all users', async () => {
      const users = [{ user_id: 'u-1' }, { user_id: 'u-2' }];
      m.toArray.mockResolvedValue(users);
      const result = await getAllUsers();
      expect(m.find).toHaveBeenCalledWith({});
      expect(result).toEqual(users);
    });
  });

  describe('getAllTherapists', () => {
    it('returns therapists', async () => {
      const therapists = [{ user_id: 't-1', role: 'therapist' }];
      m.toArray.mockResolvedValue(therapists);
      const result = await getAllTherapists();
      expect(m.find).toHaveBeenCalledWith({ role: 'therapist' });
      expect(result).toEqual(therapists);
    });
  });

  describe('getTherapistByEmail', () => {
    it('returns therapist when found', async () => {
      const therapist = { user_id: 't-1', email: 't@b.com', role: 'therapist' };
      m.findOne.mockResolvedValue(therapist);
      const result = await getTherapistByEmail('t@b.com');
      expect(m.findOne).toHaveBeenCalledWith({ email: 't@b.com', role: 'therapist' });
      expect(result).toEqual(therapist);
    });

    it('returns null when not found', async () => {
      m.findOne.mockResolvedValue(null);
      const result = await getTherapistByEmail('missing@b.com');
      expect(result).toBeNull();
    });
  });

  describe('getUserByExternalAuthId', () => {
    it('returns user when found', async () => {
      const user = { user_id: 'u-1', external_auth_id: 'auth0|123' };
      m.findOne.mockResolvedValue(user);
      const result = await getUserByExternalAuthId('auth0|123');
      expect(m.findOne).toHaveBeenCalledWith({ external_auth_id: 'auth0|123' });
      expect(result).toEqual(user);
    });
  });

  describe('getClientsByTherapistId', () => {
    it('returns clients for therapist', async () => {
      const clients = [{ user_id: 'c-1', therapist_id: 't-1' }];
      m.toArray.mockResolvedValue(clients);
      const result = await getClientsByTherapistId('t-1');
      expect(m.find).toHaveBeenCalledWith({ therapist_id: 't-1' });
      expect(result).toEqual(clients);
    });
  });

  describe('addClientToTherapist', () => {
    it('updates therapist and client', async () => {
      m.updateOne.mockResolvedValue({ modifiedCount: 1 });
      const result = await addClientToTherapist('t-1', 'c-1');
      expect(m.updateOne).toHaveBeenCalledTimes(2);
      expect(m.updateOne).toHaveBeenNthCalledWith(
        1,
        { user_id: 't-1' },
        { $addToSet: { client_ids: 'c-1' } }
      );
      expect(m.updateOne).toHaveBeenNthCalledWith(
        2,
        { user_id: 'c-1' },
        { $set: { therapist_id: 't-1' } }
      );
      expect(result).toEqual({ therapist: { modifiedCount: 1 }, client: { modifiedCount: 1 } });
    });
  });
});
