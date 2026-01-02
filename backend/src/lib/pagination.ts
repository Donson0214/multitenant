export type PaginationParams = {
  page?: string | number;
  pageSize?: string | number;
};

export function getPagination(params: PaginationParams, defaults = { page: 1, pageSize: 20 }) {
  const page = Math.max(1, Number(params.page ?? defaults.page));
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize ?? defaults.pageSize)));
  const skip = (page - 1) * pageSize;

  return { page, pageSize, skip, take: pageSize };
}
