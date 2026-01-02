import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    membership: {
      findFirst: vi.fn(),
    },
  },
}));

import { resolveTenant } from '@/middleware/tenant.middleware';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

describe('resolveTenant middleware', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets tenant context when membership exists', async () => {
    (prisma.membership.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'membership-id',
      tenantId: 'tenant-id',
      userId: 'user-id',
      role: UserRole.OWNER,
      createdAt: new Date(),
    } as never);

    const req = { user: { id: 'user-id' } } as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    const next = vi.fn();

    await resolveTenant(req, res, next);

    expect(req.tenantId).toBe('tenant-id');
    expect(req.role).toBe(UserRole.OWNER);
    expect(next).toHaveBeenCalled();
  });

  it('allows onboarding when membership is missing', async () => {
    (prisma.membership.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      null
    );

    const req = { user: { id: 'user-id' } } as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    const next = vi.fn();

    await resolveTenant(req, res, next);

    expect(req.tenantId).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('rejects unauthenticated requests', async () => {
    const req = {} as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    const next = vi.fn();

    await resolveTenant(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
