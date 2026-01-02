import { Request, Response } from 'express';
import { listTenants, listUsers } from '@/modules/admin/admin.service';
import { getPagination } from '@/lib/pagination';

export async function getTenants(req: Request, res: Response) {
  const { skip, take, page, pageSize } = getPagination({
    page: req.query.page as string,
    pageSize: req.query.pageSize as string,
  });

  const tenants = await listTenants({ skip, take });

  res.json({ data: tenants, page, pageSize });
}

export async function getUsers(req: Request, res: Response) {
  const { skip, take, page, pageSize } = getPagination({
    page: req.query.page as string,
    pageSize: req.query.pageSize as string,
  });

  const users = await listUsers({ skip, take });

  res.json({ data: users, page, pageSize });
}
