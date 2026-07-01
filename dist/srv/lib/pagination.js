"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAGE_LIMIT_OPTIONS = exports.DEFAULT_PAGE_LIMIT = exports.DEFAULT_PAGE = void 0;
exports.parsePaginationParams = parsePaginationParams;
exports.createPaginationMeta = createPaginationMeta;
exports.isExportRequest = isExportRequest;
exports.paginatedResponse = paginatedResponse;
exports.emptyPagination = emptyPagination;
exports.normalizePaginatedResponse = normalizePaginatedResponse;
exports.DEFAULT_PAGE = 1;
exports.DEFAULT_PAGE_LIMIT = 25;
exports.PAGE_LIMIT_OPTIONS = [25, 50, 75, 100];
function parsePaginationParams(params = {}) {
    const getParam = (key) => params instanceof URLSearchParams ? params.get(key) : params[key];
    const pageValue = Number.parseInt(String(getParam("page") ?? ""), 10);
    const limitValue = Number.parseInt(String(getParam("limit") ?? ""), 10);
    const page = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : exports.DEFAULT_PAGE;
    const limit = Number.isFinite(limitValue) && limitValue > 0
        ? limitValue
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
function isExportRequest(params = {}) {
    const exportValue = params instanceof URLSearchParams ? params.get("export") : params.export;
    return exportValue === "true";
}
function paginatedResponse({ data, page, limit, total, }) {
    return {
        data,
        pagination: createPaginationMeta({ page, limit, total }),
    };
}
function emptyPagination(limit = exports.DEFAULT_PAGE_LIMIT) {
    return createPaginationMeta({
        page: exports.DEFAULT_PAGE,
        limit,
        total: 0,
    });
}
function normalizePaginatedResponse(result, fallbackLimit = exports.DEFAULT_PAGE_LIMIT) {
    if (Array.isArray(result)) {
        return {
            data: result,
            pagination: createPaginationMeta({
                page: exports.DEFAULT_PAGE,
                limit: fallbackLimit,
                total: result.length,
            }),
        };
    }
    return {
        data: Array.isArray(result?.data) ? result.data : [],
        pagination: result?.pagination ?? emptyPagination(fallbackLimit),
    };
}
