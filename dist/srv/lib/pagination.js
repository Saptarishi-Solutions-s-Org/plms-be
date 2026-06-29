"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAGE_LIMIT_OPTIONS = exports.DEFAULT_PAGE_LIMIT = exports.DEFAULT_PAGE = void 0;
exports.parsePaginationParams = parsePaginationParams;
exports.createPaginationMeta = createPaginationMeta;
exports.paginatedResponse = paginatedResponse;
exports.DEFAULT_PAGE = 1;
exports.DEFAULT_PAGE_LIMIT = 25;
exports.PAGE_LIMIT_OPTIONS = [25, 50, 75, 100];
function parsePaginationParams(params = {}) {
    const pageValue = Number.parseInt(String(params.page ?? ""), 10);
    const limitValue = Number.parseInt(String(params.limit ?? ""), 10);
    const page = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : exports.DEFAULT_PAGE;
    const requestedLimit = Number.isFinite(limitValue) && limitValue > 0
        ? limitValue
        : exports.DEFAULT_PAGE_LIMIT;
    const limit = exports.PAGE_LIMIT_OPTIONS.includes(requestedLimit)
        ? requestedLimit
        : exports.DEFAULT_PAGE_LIMIT;
    return {
        page,
        limit,
        offset: (page - 1) * limit,
    };
}
function createPaginationMeta({ page, limit, total, }) {
    return {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
    };
}
function paginatedResponse({ data, page, limit, total, }) {
    return {
        data,
        pagination: createPaginationMeta({ page, limit, total }),
    };
}
