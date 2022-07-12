import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import React from "react";
import { CreateStepButton } from "../CreateStepButton";
import { PipelineMoreOptionsMenu } from "../PipelineMoreOptionsMenu";
import { PipelineFileName } from "./PipelineFileName";
import { ServicesMenu } from "./ServicesMenu";

export const PipelineCanvasHeaderBar = () => {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        backgroundColor: (theme) => theme.palette.background.paper,
        borderBottom: (theme) => `1px solid ${theme.borderColor}`,
        padding: (theme) => theme.spacing(0, 2),
        height: (theme) => theme.spacing(7),
      }}
    >
      <PipelineFileName />
      <Button size="small">Logs</Button>
      <ServicesMenu />
      <Divider
        orientation="vertical"
        sx={{ height: (theme) => theme.spacing(3) }}
      />
      <CreateStepButton />
      <PipelineMoreOptionsMenu />
    </Stack>
  );
};
