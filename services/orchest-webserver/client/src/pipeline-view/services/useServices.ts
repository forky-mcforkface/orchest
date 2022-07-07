import { useCustomRoute } from "@/hooks/useCustomRoute";
import { filterServices } from "@/utils/webserver-utils";
import { hasValue } from "@orchest/lib-utils";
import React from "react";
import { usePipelineEditorContext } from "../contexts/PipelineEditorContext";

export const useServices = (pipelineRunning: boolean) => {
  const { jobUuid } = useCustomRoute();
  const { pipelineJson, session, runUuid } = usePipelineEditorContext();
  const [isShowingServices, setIsShowingServices] = React.useState(false);

  const showServices = React.useCallback(() => {
    setIsShowingServices(true);
  }, []);

  const hideServices = React.useCallback(() => {
    setIsShowingServices(false);
  }, []);

  const isJobRun = hasValue(jobUuid) && hasValue(runUuid);

  const isServicesUnavailable =
    // Not a job run, so it is an interactive run, services are only available if session is RUNNING.
    (!isJobRun && session?.status !== "RUNNING") ||
    // It is a job run (non-interactive run), we are unable to check its actual session,
    // but we can check its job run status,
    (isJobRun && pipelineJson && !pipelineRunning);

  const services = React.useMemo(() => {
    if (isServicesUnavailable) return null;
    const allServices = isJobRun
      ? pipelineJson?.services || {}
      : session?.user_services || {};

    // Filter services based on scope
    return filterServices(
      allServices,
      jobUuid ? "noninteractive" : "interactive"
    );
  }, [pipelineJson, session, jobUuid, isJobRun, isServicesUnavailable]);

  return { isShowingServices, services, showServices, hideServices };
};
