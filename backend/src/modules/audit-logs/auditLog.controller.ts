import { Request, Response } from 'express';
import { listAuditLogs } from '@/modules/audit-logs/auditLog.service';
import { getPagination } from '@/lib/pagination';

export async function getAuditLogs(req: Request, res: Response) {
  if (!req.tenantId) {
    return res.status(403).json({ message: 'Tenant not resolved' });
  }

  const { skip, take, page, pageSize } = getPagination({
    page: req.query.page as string,
    pageSize: req.query.pageSize as string,
  });

  const logs = await listAuditLogs({
    tenantId: req.tenantId,
    skip,
    take,
    action: (req.query.action as string | undefined) ?? undefined,
  });

  res.json({
    data: logs,
    page,
    pageSize,
  });
}
