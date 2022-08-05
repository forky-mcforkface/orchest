import { PipelineReadOnlyReason } from "@/contexts/ProjectsContext";
import { useCustomRoute } from "@/hooks/useCustomRoute";
import { siteMap } from "@/routingConfig";
import VisibilityIcon from "@mui/icons-material/VisibilityOutlined";
import { Alert } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { hasValue } from "@orchest/lib-utils";
import React from "react";
import { usePipelineDataContext } from "./contexts/PipelineDataContext";

const titleMapping: Record<PipelineReadOnlyReason, string> = {
  isJobRun: "pipeline snapshot",
  environmentsNotYetBuilt:
    "Not all environments of this project have been built",
  JupyterEnvironmentBuildInProgress:
    "JupyterLab environment build is in progress",
};

const generateReadOnlyMessage = (jobName: string | undefined) =>
  jobName ? (
    <>
      {`This is a read-only pipeline snapshot from `}
      <b>{jobName}</b>
      {` job. Make edits in the Pipeline editor.`}
    </>
  ) : null;

export const ReadOnlyBanner = () => {
  const { navigateTo } = useCustomRoute();

  const {
    job,
    pipelineReadOnlyReason,
    projectUuid,
    pipelineUuid,
  } = usePipelineDataContext();

  const { action, label } = React.useMemo(() => {
    if (pipelineReadOnlyReason === "isJobRun") {
      return {
        action: (e: React.MouseEvent) => [
          navigateTo(
            siteMap.pipeline.path,
            { query: { projectUuid, pipelineUuid } },
            e
          ),
        ],
        label: "Open in editor",
      };
    }

    if (pipelineReadOnlyReason === "JupyterEnvironmentBuildInProgress") {
      return {
        action: (e: React.MouseEvent) => [
          navigateTo(siteMap.configureJupyterLab.path, undefined, e),
        ],
        label: "JupyterLab configuration",
      };
    }

    if (pipelineReadOnlyReason === "environmentsNotYetBuilt") {
      return {
        action: (e: React.MouseEvent) => [
          navigateTo(siteMap.environments.path, { query: { projectUuid } }, e),
        ],
        label: "Open Environments",
      };
    }

    return {};
  }, [navigateTo, pipelineReadOnlyReason, projectUuid, pipelineUuid]);

  return hasValue(pipelineReadOnlyReason) ? (
    <Box
      className="pipeline-actions"
      sx={{ padding: (theme) => theme.spacing(2.5) }}
    >
      <Alert
        severity="info"
        action={
          <Button
            sx={{ cursor: "pointer", whiteSpace: "nowrap" }}
            onClick={action}
            onAuxClick={action}
          >
            {label}
          </Button>
        }
        icon={<VisibilityIcon />}
        sx={{
          width: "100%",
        }}
      >
        <Box
          sx={{ fontWeight: (theme) => theme.typography.subtitle2.fontWeight }}
        >
          Read-only: {titleMapping[pipelineReadOnlyReason]}
        </Box>
        {pipelineReadOnlyReason === "isJobRun" && hasValue(job) && (
          <Typography variant="body1">
            {generateReadOnlyMessage(job.name)}
          </Typography>
        )}
      </Alert>
    </Box>
  ) : null;
};