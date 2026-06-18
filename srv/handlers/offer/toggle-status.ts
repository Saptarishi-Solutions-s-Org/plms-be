import { pool } from "../../lib/db";
import { emitToOrg } from "../../realtime/socket";
import {
  OFFER_DETAIL_CHANGED,
  OFFER_LIST_CHANGED,
} from "../../realtime/events";

export const toggleOfferStatusHandler = async (req: any) => {

  try {

    const { id } = req.data;
    const orgId = req.user?.orgId;

    const result = await pool.query(
      `
      SELECT status
      FROM crm_offer
      WHERE id = $1
      `,
      [id]
    );

    if (!result.rows.length) {
      return req.reject(404, "Offer not found");
    }

    const currentStatus = result.rows[0].status;

    const newStatus =
      currentStatus === "Active"
        ? "Inactive"
        : "Active";

    await pool.query(
      `
      UPDATE crm_offer
      SET status = $1
      WHERE id = $2
      `,
      [newStatus, id]
    );

    emitToOrg(orgId, OFFER_LIST_CHANGED, {
      reason: "offer-status-changed",
      offerId: id,
      status: newStatus.toLowerCase(),
    });

    emitToOrg(orgId, OFFER_DETAIL_CHANGED, {
      reason: "offer-status-changed",
      offerId: id,
      status: newStatus.toLowerCase(),
    });

    return {
      status: newStatus.toLowerCase(),
    };

  } catch (error: any) {

    
    return req.reject(500, "Failed to toggle offer status");
  }
};
