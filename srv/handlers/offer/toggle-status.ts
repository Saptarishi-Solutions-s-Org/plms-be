import cds from "@sap/cds";

const { SELECT, UPDATE } = cds.ql;

export const toggleOfferStatusHandler = async (req: any) => {
  const db = await cds.connect.to("db");
  const { id } = req.data;

  const Offer = cds.entities["crm.Offer"];

  try {
    const offer = await db.run(
      SELECT.one.from(Offer).where({ ID: id })
    );

    if (!offer) {
      return req.reject(404, "Offer not found");
    }


    const newStatus =
      (offer.status || "").toLowerCase() === "active"
        ? "inactive"
        : "active";


    await db.run(
      UPDATE(Offer)
        .set({ status: newStatus })
        .where({ ID: id })
    );


    return {
      id,
      oldStatus: offer.status,
      newStatus,
      message: `Offer ${newStatus === "active" ? "activated" : "deactivated"} successfully`
    };

  } catch (error: any) {

    return req.reject(500, "Failed to toggle offer status");
  }
};