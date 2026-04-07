import cds from "@sap/cds";

const { UPDATE, SELECT } = cds;

export const updateOrganizationHandler = async (req: any) => {
  try {
    const { id, name, email, phone, address, state, country, trial, status } =
      req.data;

    // ✅ UPDATE using CAP (managed fields auto handled)
    await cds.run(
      UPDATE("crm.Organization")
        .set({
          name,
          email,
          phone,
          address,
          state_ID: state,
          country_ID: country,
          trial,
          is_active: status,
        })
        .where({ ID: id }),
    );

    // ✅ FETCH UPDATED
    const updated = await cds.run(
      SELECT.from("crm.Organization")
        .columns("ID as id", "name", "code", "is_active as status")
        .where({ ID: id }),
    );

    return updated[0];
  } catch (err) {
    console.error(err);
    return req.error(500, "Failed to update organization");
  }
};
