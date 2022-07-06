import { IconButton } from "@/components/common/IconButton";
import {
  DataTable,
  DataTableColumn,
  DataTableRow,
} from "@/components/DataTable";
import { useCustomRoute } from "@/hooks/useCustomRoute";
import { siteMap } from "@/routingConfig";
import { Project } from "@/types";
import { ellipsis } from "@/utils/styles";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import { hasValue } from "@orchest/lib-utils";
import React from "react";
import { NoProject } from "./NoProject";

export type ProjectRow = Pick<
  Project,
  | "path"
  | "pipeline_count"
  | "session_count"
  | "job_count"
  | "environment_count"
> & {
  settings: string;
};

export const ProjectsTable = ({
  projects,
  projectBeingDeleted,
  openProjectMenu,
}: {
  projects: Project[] | undefined;
  projectBeingDeleted: string | undefined;
  openProjectMenu: (
    uuid: string
  ) => (event: React.MouseEvent<HTMLElement>) => void;
}) => {
  const { navigateTo } = useCustomRoute();
  const onRowClick = (e: React.MouseEvent, projectUuid: string) => {
    navigateTo(siteMap.pipeline.path, { query: { projectUuid } }, e);
  };
  const columns: DataTableColumn<ProjectRow>[] = React.useMemo(() => {
    return [
      {
        id: "path",
        label: "Project",
        sx: { margin: (theme) => theme.spacing(-0.5, 0) },
        render: function ProjectPath(row) {
          return (
            <Tooltip title={row.path}>
              <Box sx={ellipsis((theme) => theme.spacing(60))}>{row.path}</Box>
            </Tooltip>
          );
        },
      },
      { id: "pipeline_count", label: "Pipelines" },
      { id: "session_count", label: "Active sessions" },
      { id: "job_count", label: "Jobs" },
      { id: "environment_count", label: "Environments" },
      {
        id: "settings",
        label: "",
        sx: { margin: (theme) => theme.spacing(-0.5, 0) },
        render: function ProjectSettingsButton(row, disabled) {
          return projectBeingDeleted !== row.uuid ? (
            <IconButton
              title="settings"
              disabled={disabled}
              size="small"
              data-test-id={`settings-button-${row.path}`}
              onClick={openProjectMenu(row.uuid)}
            >
              <MoreHorizOutlinedIcon fontSize="small" />
            </IconButton>
          ) : (
            "Deleting..."
          );
        },
      },
    ];
  }, [projectBeingDeleted]);

  const projectRows: DataTableRow<ProjectRow>[] = React.useMemo(() => {
    if (!projects) return [];
    return projects.map((project) => {
      return {
        ...project,
        settings: project.path,
        disabled: projectBeingDeleted === project.uuid,
      };
    });
  }, [projects, projectBeingDeleted]);

  return projects && projectRows.length === 0 ? (
    <NoProject />
  ) : (
    <DataTable<ProjectRow>
      id="project-list"
      isLoading={!hasValue(projects)}
      hideSearch
      onRowClick={onRowClick}
      columns={columns}
      rows={projectRows}
      data-test-id="projects-table"
    />
  );
};
