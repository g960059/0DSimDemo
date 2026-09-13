import { useParams } from "react-router-dom";
import { WorkbenchSession } from "@/components/workbench/WorkbenchSession";

/** Public snapshots open as detached sessions; Save creates a reader-owned experiment. */
export function ExperimentSnapshotPage() {
  const { snapshotId } = useParams();
  return <WorkbenchSession key={snapshotId} initialExperimentId={null} sourceSnapshotId={snapshotId} />;
}

export default ExperimentSnapshotPage;
