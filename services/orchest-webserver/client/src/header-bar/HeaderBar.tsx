import { useAppContext } from "@/contexts/AppContext";
import { useSessionsPoller } from "@/hooks/useSessionsPoller";
import LogoutIcon from "@mui/icons-material/Logout";
import AppBar from "@mui/material/AppBar";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import React from "react";
import { IconButton } from "../components/common/IconButton";
import { ProjectSelector } from "../project-selector/ProjectSelector";
import { NavigationTabs } from "./NavigationTabs";

export const HeaderBar = () => {
  const { user_config } = useAppContext();
  useSessionsPoller();

  const logoutHandler = () => {
    window.location.href = "/login/clear";
  };

  return (
    <AppBar
      position="fixed"
      color="default"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: (theme) => theme.palette.background.paper,
        boxShadow: "none",
        borderBottom: (theme) => `1px solid ${theme.borderColor}`,
      }}
    >
      <Toolbar
        variant="dense"
        sx={{ justifyContent: "space-between", paddingLeft: "0 !important" }}
      >
        <ProjectSelector />
        <Stack direction="row" justifyContent="flex-end">
          <NavigationTabs />
          <IconButton
            title="Logout"
            onClick={logoutHandler}
            sx={{
              color: (theme) => theme.palette.action.active,
              width: (theme) => theme.spacing(7),
            }}
          >
            <LogoutIcon />
          </IconButton>
          {user_config?.AUTH_ENABLED && (
            <IconButton
              title="Logout"
              onClick={logoutHandler}
              color="secondary"
            >
              <LogoutIcon
                sx={{ color: (theme) => theme.palette.action.active }}
              />
            </IconButton>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
};