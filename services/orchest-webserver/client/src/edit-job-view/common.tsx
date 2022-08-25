import { FILE_MANAGEMENT_ENDPOINT } from "@/pipeline-view/file-manager/common";
import { Json, PipelineJson, StrategyJson } from "@/types";
import { queryArgs } from "@/utils/text";
import { fetcher } from "@orchest/lib-utils";

type ParamConfig = Record<string, Record<string, string>>;

export const fetchParamConfig = async ({
  paramPath,
  pipelineUuid,
  projectUuid,
  jobUuid,
}: {
  paramPath: string;
  pipelineUuid: string;
  projectUuid: string;
  jobUuid: string;
}) => {
  return await fetcher<ParamConfig>(
    `${FILE_MANAGEMENT_ENDPOINT}/read?${queryArgs({
      pipeline_uuid: pipelineUuid,
      project_uuid: projectUuid,
      job_uuid: jobUuid,
      path: paramPath,
    })}`,
    { method: "GET" }
  );
};

const toStringifiedParams = (params: Record<string, Json>, wrap?: boolean) => {
  return Object.entries(params).reduce((all, [paramKey, value]) => {
    return { ...all, [paramKey]: JSON.stringify(wrap ? [value] : value) };
  }, {} as Record<string, string>);
};

export const generateStrategyJsonFromParamJsonFile = (
  paramJson: Record<string, Record<string, string>>,
  pipeline: PipelineJson,
  reservedKey: string
): StrategyJson => {
  const strategyJson = Object.entries(paramJson).reduce((all, [key, value]) => {
    let stringifiedParams = toStringifiedParams(value);
    const newValue = {
      parameters: stringifiedParams,
      key,
    };

    if (key === reservedKey) {
      try {
        newValue["title"] = pipeline.name;
      } catch (error) {
        console.error(error);
      }
    } else {
      try {
        newValue["title"] = pipeline.steps[key].title;
      } catch {
        // Missing pipeline step entries
        // will be deleted in filtering step below.
      }
    }

    return {
      ...all,
      [key]: newValue,
    };
  }, {} as StrategyJson);

  // Fill in missing values
  Object.keys(pipeline.steps).forEach((stepUuid) => {
    let step = pipeline.steps[stepUuid];
    if (step.parameters && Object.keys(step.parameters).length > 0) {
      let stepParametersFromPipelineStepDef = toStringifiedParams(
        step.parameters,
        true
      );
      if (!strategyJson[stepUuid]) {
        strategyJson[stepUuid] = {
          key: stepUuid,
          title: step.title,
          parameters: stepParametersFromPipelineStepDef,
        };
      } else {
        strategyJson[stepUuid].parameters = {
          ...stepParametersFromPipelineStepDef,
          ...strategyJson[stepUuid].parameters,
        };
      }
    }
  });

  Object.keys(strategyJson).forEach((key) => {
    if (key !== reservedKey) {
      // For pipeline step keys in strategyJson, filter step UUIDs that aren't
      // in the pipeline definition.
      if (!Object.keys(pipeline.steps).includes(key)) {
        delete strategyJson[key];
      }
    }
  });

  // Check for missing pipeline parameters
  let pipelineParametersFromPipelineDef = toStringifiedParams(
    pipeline.parameters || {},
    true
  );
  if (strategyJson[reservedKey] === undefined) {
    strategyJson[reservedKey] = {
      key: reservedKey,
      title: pipeline.name,
      parameters: pipelineParametersFromPipelineDef,
    };
  } else if (Object.keys(pipeline.parameters).length > 0) {
    strategyJson[reservedKey].parameters = {
      ...pipelineParametersFromPipelineDef,
      ...strategyJson[reservedKey].parameters,
    };
  }

  return strategyJson;
};
