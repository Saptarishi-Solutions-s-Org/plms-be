"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFiltersQuery = exports.buildScopingSql = exports.getFilterExpression = void 0;
// Maps filter type ID or name to database column expression
const getFilterExpression = (name) => {
    switch (name) {
        // Demographic
        case "gender": return "l.gender";
        case "age": return "date_part('year', age(current_date, l.dob))";
        case "dob": return "l.dob";
        case "birthday_month": return "date_part('month', l.dob)";
        case "city": return "l.address";
        case "state": return "s.name";
        case "country": return "c.name";
        case "postal_code": return "l.postal_code";
        // Lead Info
        case "status": return "l.status";
        case "priority": return "l.priority";
        case "source": return "l.source";
        case "import_type": return "l.import_type";
        case "assigned_executive": return "l.assigned_to_id";
        case "reporting_manager": return "ae.reporting_manager_id";
        // Contact
        case "has_email": return "(l.email IS NOT NULL AND l.email <> '')";
        case "has_phone": return "(l.phone IS NOT NULL AND l.phone <> '')";
        case "email_domain": return "substring(l.email from '@(.*)$')";
        // Date
        case "created_date": return "l.createdat";
        case "updated_date": return "l.modifiedat";
        case "created_today": return "(l.createdat::date = current_date)";
        case "created_this_week": return "(date_trunc('week', l.createdat) = date_trunc('week', current_date))";
        case "created_this_month": return "(date_trunc('month', l.createdat) = date_trunc('month', current_date))";
        // Activity
        case "last_activity_date": return "(SELECT MAX(la.createdat) FROM crm_leadactivity la WHERE la.lead_id = l.id)";
        case "no_activity_days": return "EXTRACT(DAY FROM NOW() - (SELECT COALESCE(MAX(la.createdat), l.createdat) FROM crm_leadactivity la WHERE la.lead_id = l.id))";
        case "activity_count": return "(SELECT COUNT(*) FROM crm_leadactivity la WHERE la.lead_id = l.id)";
        case "followup_pending": return "EXISTS (SELECT 1 FROM crm_leadactivity la WHERE la.lead_id = l.id AND la.next_follow_up_date >= current_date)";
        // Offer
        case "has_offer": return "EXISTS (SELECT 1 FROM crm_leadofferassignment loa WHERE loa.lead_id = l.id)";
        case "offer_status": return "(SELECT o.status FROM crm_leadofferassignment loa JOIN crm_offer o ON o.id = loa.offer_id WHERE loa.lead_id = l.id LIMIT 1)";
        case "offer_validity": return "(SELECT o.valid_to FROM crm_leadofferassignment loa JOIN crm_offer o ON o.id = loa.offer_id WHERE loa.lead_id = l.id LIMIT 1)";
        // Custom
        case "has_address": return "(l.address IS NOT NULL AND l.address <> '')";
        case "without_address": return "(l.address IS NULL OR l.address = '')";
        default: return "";
    }
};
exports.getFilterExpression = getFilterExpression;
const buildScopingSql = (user, params) => {
    const orgId = user.orgId;
    const userId = user.id;
    const role = user.role?.toLowerCase() || user.roles?.[0]?.toLowerCase() || "";
    let scopeSql = `l.organization_id = $${params.length + 1}`;
    params.push(orgId);
    if (role === "executive") {
        scopeSql += ` AND l.assigned_to_id = $${params.length + 1}`;
        params.push(userId);
    }
    else if (role === "manager") {
        scopeSql += ` AND (l.assigned_to_id = $${params.length + 1} OR l.assigned_to_id IN (SELECT id FROM crm_user WHERE reporting_manager_id = $${params.length + 1}))`;
        params.push(userId);
    }
    return scopeSql;
};
exports.buildScopingSql = buildScopingSql;
const buildFiltersQuery = (filters, params) => {
    if (!filters || filters.length === 0)
        return "1=1";
    // Group filters by group_id
    const groups = {};
    const ungrouped = [];
    for (const filter of filters) {
        if (filter.group_id) {
            if (!groups[filter.group_id])
                groups[filter.group_id] = [];
            groups[filter.group_id].push(filter);
        }
        else {
            ungrouped.push(filter);
        }
    }
    const groupSqls = [];
    // Helper to compile a single filter row to SQL statement
    const compileFilterRow = (row) => {
        const expr = (0, exports.getFilterExpression)(row.name || "");
        if (!expr)
            return "1=1";
        const op = row.operator;
        const val = row.value;
        const requiresValue = !["Is Empty", "Is Not Empty", "Today", "Yesterday", "This Week", "This Month", "Last Month"].includes(op);
        if (requiresValue && (val === undefined || val === null || String(val).trim() === "")) {
            return "1=1";
        }
        switch (op) {
            case "Equals":
                params.push(val);
                return `${expr} = $${params.length}`;
            case "Not Equals":
                params.push(val);
                return `${expr} <> $${params.length}`;
            case "Contains":
                params.push(`%${val}%`);
                return `${expr} ILIKE $${params.length}`;
            case "Starts With":
                params.push(`${val}%`);
                return `${expr} ILIKE $${params.length}`;
            case "Ends With":
                params.push(`%${val}`);
                return `${expr} ILIKE $${params.length}`;
            case "Is Empty":
                return `(${expr} IS NULL OR ${expr}::text = '')`;
            case "Is Not Empty":
                return `(${expr} IS NOT NULL AND ${expr}::text <> '')`;
            case "GreaterThan":
                params.push(val);
                return `${expr} > $${params.length}`;
            case "LessThan":
                params.push(val);
                return `${expr} < $${params.length}`;
            case "GreaterThanOrEqual":
                params.push(val);
                return `${expr} >= $${params.length}`;
            case "LessThanOrEqual":
                params.push(val);
                return `${expr} <= $${params.length}`;
            case "Between":
                const parts = String(val).split(",");
                if (parts.length === 2) {
                    params.push(parts[0]);
                    const p1 = params.length;
                    params.push(parts[1]);
                    const p2 = params.length;
                    return `${expr} BETWEEN $${p1} AND $${p2}`;
                }
                return "1=1";
            case "Before":
                params.push(val);
                return `${expr} < $${params.length}`;
            case "After":
                params.push(val);
                return `${expr} > $${params.length}`;
            case "Today":
                return `${expr}::date = CURRENT_DATE`;
            case "Yesterday":
                return `${expr}::date = CURRENT_DATE - 1`;
            case "This Week":
                return `date_trunc('week', ${expr}) = date_trunc('week', CURRENT_DATE)`;
            case "This Month":
                return `date_trunc('month', ${expr}) = date_trunc('month', CURRENT_DATE)`;
            case "Last Month":
                return `date_trunc('month', ${expr}) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')`;
            default:
                return "1=1";
        }
    };
    // Compile grouped filters
    for (const [groupId, groupRows] of Object.entries(groups)) {
        const clauses = [];
        for (let i = 0; i < groupRows.length; i++) {
            const row = groupRows[i];
            const sql = compileFilterRow(row);
            const nextOp = row.logical_op || "AND";
            clauses.push(sql);
            if (i < groupRows.length - 1) {
                clauses.push(nextOp);
            }
        }
        if (clauses.length > 0) {
            groupSqls.push(`(${clauses.join(" ")})`);
        }
    }
    // Compile ungrouped filters
    const finalClauses = [];
    // Combine all grouped sub-queries
    if (groupSqls.length > 0) {
        finalClauses.push(groupSqls.join(" AND "));
    }
    for (let i = 0; i < ungrouped.length; i++) {
        const row = ungrouped[i];
        const sql = compileFilterRow(row);
        const nextOp = row.logical_op || "AND";
        if (finalClauses.length > 0) {
            finalClauses.push(nextOp);
        }
        finalClauses.push(sql);
    }
    return finalClauses.length > 0 ? finalClauses.join(" ") : "1=1";
};
exports.buildFiltersQuery = buildFiltersQuery;
