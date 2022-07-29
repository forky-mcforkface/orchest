import {
  EnvironmentsApiState,
  useEnvironmentsApi,
} from "@/api/environments/useEnvironmentsApi";
import { useAppContext } from "@/contexts/AppContext";
import { hasValue } from "@orchest/lib-utils";
import React from "react";
import { getNewEnvironmentName } from "../common";
import { useReportEnvironmentsError } from "./useReportEnvironmentsError";

const selector = (state: EnvironmentsApiState) =>
  [state.environments, state.post, state.isPosting] as const;

export const useCreateEnvironment = () => {
  useReportEnvironmentsError();
  const { config } = useAppContext();

  const [environments, post, isCreating] = useEnvironmentsApi(selector);

  const defaultEnvironment = config?.ENVIRONMENT_DEFAULTS;
  const newEnvironmentName = getNewEnvironmentName(
    defaultEnvironment?.name || "New environment",
    environments
  );
  const isAllowedToCreate =
    hasValue(newEnvironmentName) && hasValue(defaultEnvironment);

  const createEnvironment = React.useCallback(() => {
    if (!isCreating && isAllowedToCreate) {
      return post(newEnvironmentName, defaultEnvironment);
    }
  }, [
    post,
    isCreating,
    defaultEnvironment,
    isAllowedToCreate,
    newEnvironmentName,
  ]);

  return { createEnvironment, isCreating, isAllowedToCreate };
};
