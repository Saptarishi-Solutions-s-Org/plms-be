import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";

import { getSegmentsHandler } from "../handlers/segment/getSegments";
import { getSegmentByCodeHandler } from "../handlers/segment/getSegmentByCode";
import { previewSegmentHandler } from "../handlers/segment/previewSegment";
import { saveSegmentHandler } from "../handlers/segment/saveSegment";
import { deleteSegmentHandler } from "../handlers/segment/deleteSegment";
import { assignOffersToSegmentHandler } from "../handlers/segment/assignOffersToSegment";
import { getSegmentAuditHistoryHandler } from "../handlers/segment/getSegmentAuditHistory";
import { exportSegmentHandler } from "../handlers/segment/exportSegment";
import { getActiveFilterTypesHandler } from "../handlers/segment/getActiveFilterTypes";
import { toggleSegmentFilterHandler } from "../handlers/segment/toggleSegmentFilter";

export const bindSegment = () => {
  const service = cds.services["SegmentService"];
  if (!service) return;

  service.on(
    "getSegments",
    withAuth(getSegmentsHandler, {
      roles: ["admin", "manager", "executive"],
      modules: { segmentation: ["view"] },
    })
  );

  service.on(
    "getSegmentByCode",
    withAuth(getSegmentByCodeHandler, {
      roles: ["admin", "manager", "executive"],
      modules: { segmentation: ["view"] },
    })
  );

  service.on(
    "previewSegment",
    withAuth(previewSegmentHandler, {
      roles: ["manager", "executive"],
      modules: { segmentation: ["view"] },
    })
  );

  service.on(
    "saveSegment",
    withAuth(saveSegmentHandler, {
      roles: ["manager", "executive"],
      modules: { segmentation: ["view"] }, // Granular create/update check inside the handler
    })
  );

  service.on(
    "deleteSegment",
    withAuth(deleteSegmentHandler, {
      roles: ["manager", "executive"],
      modules: { segmentation: ["delete"] },
    })
  );

  service.on(
    "assignOffersToSegment",
    withAuth(assignOffersToSegmentHandler, {
      roles: ["manager", "executive"],
      modules: { segmentation: ["update"] },
    })
  );

  service.on(
    "getSegmentAuditHistory",
    withAuth(getSegmentAuditHistoryHandler, {
      roles: ["admin", "manager", "executive"],
      modules: { segmentation: ["view"] },
    })
  );

  service.on(
    "exportSegment",
    withAuth(exportSegmentHandler, {
      roles: ["manager", "executive"],
      modules: { segmentation: ["export"] },
    })
  );

  service.on(
    "getActiveFilterTypes",
    withAuth(getActiveFilterTypesHandler, {
      roles: ["admin", "manager", "executive"],
      modules: { segmentation: ["view"] },
    })
  );

  service.on(
    "toggleSegmentFilter",
    withAuth(toggleSegmentFilterHandler, {
      roles: ["system admin", "admin"],
      modules: { segmentation: ["update"] },
    })
  );

  console.log("SegmentService bound successfully");
};
