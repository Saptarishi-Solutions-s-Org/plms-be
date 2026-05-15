import { pool } from "../../lib/db";

export const toggleOfferStatusHandler = async (req: any) => {

  try {

    const { id } = req.data;

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

    return {
      status: newStatus.toLowerCase(),
    };

  } catch (error: any) {

    
    return req.reject(500, "Failed to toggle offer status");
  }
};