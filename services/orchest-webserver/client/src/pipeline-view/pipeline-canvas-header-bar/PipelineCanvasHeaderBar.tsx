import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import React from "react";
import { usePipelineCanvasContext } from "../contexts/PipelineCanvasContext";
import { CreateStepButton } from "../CreateStepButton";
import { PipelineOperations } from "./pipeline-operations/PipelineOperations";
import { PipelineFileName } from "./PipelineFileName";
import { PipelineMoreOptionsMenu } from "./PipelineMoreOptionsMenu";
import { ServicesMenu } from "./ServicesMenu";

export const PipelineCanvasHeaderBar = () => {
  const { setFullscreenTab } = usePipelineCanvasContext();
  const openLogs = () => setFullscreenTab("logs");

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={2}
      sx={{
        backgroundColor: (theme) => theme.palette.background.paper,
        borderBottom: (theme) => `1px solid ${theme.borderColor}`,
        padding: (theme) => theme.spacing(0, 3, 0, 2),
        height: (theme) => theme.spacing(7),
      }}
    >
      <Stack direction="row" alignItems="baseline" flexShrink={1}>
        <PipelineFileName />
      </Stack>
      <Stack direction="row" flexShrink={0}>
        <Button size="small" onClick={openLogs}>
          Logs
        </Button>
        <ServicesMenu />
        <Divider
          orientation="vertical"
          sx={{ height: (theme) => theme.spacing(3) }}
        />
        <CreateStepButton />
        <PipelineOperations />
        <PipelineMoreOptionsMenu />
      </Stack>
    </Stack>
  );
};
