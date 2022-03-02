"""API endpoints for unspecified orchest-api level information."""
import secrets
import uuid

import yaml
from flask_restx import Namespace, Resource

from _orchest.internals import config as _config
from app import schema, utils
from app.connections import k8s_core_api

api = Namespace("ctl", description="Orchest-api internal control.")
api = utils.register_schema(api)


@api.route("/start-update")
class IdleCheck(Resource):
    @api.doc("orchest_api_start_update")
    @api.marshal_with(
        schema.update_info,
        code=201,
        description="Update Orchest.",
    )
    def post(self):
        token = secrets.token_hex(20)
        # K8S_TODO: query update-info endpoint once we use versioned
        # images.
        manifest = _get_update_pod_manifest("latest")
        k8s_core_api.create_namespaced_pod(_config.ORCHEST_NAMESPACE, manifest)
        manifest = _get_update_sidecar_manifest(
            "latest", manifest["metadata"]["name"], token
        )
        k8s_core_api.create_namespaced_pod(_config.ORCHEST_NAMESPACE, manifest)

        data = {
            "token": token,
        }
        return data, 201


def _get_update_sidecar_manifest(
    update_to_version: str, update_pod_name, token: str
) -> dict:
    manifest = {
        "apiVersion": "v1",
        "kind": "Pod",
        "metadata": {
            "generateName": "update-sidecar-",
            "labels": {
                "app": "update-sidecar",
                "app.kubernetes.io/name": "update-sidecar",
                "app.kubernetes.io/part-of": "orchest",
                "app.kubernetes.io/release": "orchest",
            },
        },
        "spec": {
            "containers": [
                {
                    "env": [
                        {"name": "PYTHONUNBUFFERED", "value": "TRUE"},
                        {
                            "name": "POD_NAME",
                            "valueFrom": {"fieldRef": {"fieldPath": "metadata.name"}},
                        },
                        {"name": "UPDATE_POD_NAME", "value": update_pod_name},
                        {"name": "TOKEN", "value": token},
                    ],
                    "image": f"orchest/update-sidecar:{update_to_version}",
                    "imagePullPolicy": "IfNotPresent",
                    "name": "update-sidecar",
                }
            ],
            "restartPolicy": "Never",
            "terminationGracePeriodSeconds": 1,
            "serviceAccount": "orchest-api",
            "serviceAccountName": "orchest-api",
        },
    }
    return manifest


def _get_update_pod_manifest(update_to_version: str) -> dict:
    with open(_config.ORCHEST_CTL_POD_YAML_PATH, "r") as f:
        manifest = yaml.safe_load(f)

    manifest["metadata"].pop("generateName", None)
    manifest["metadata"]["name"] = f"orchest-ctl-{uuid.uuid4()}"
    labels = manifest["metadata"]["labels"]
    labels["version"] = update_to_version
    labels["command"] = "update"

    containers = manifest["spec"]["containers"]
    orchest_ctl_container = containers[0]
    orchest_ctl_container["image"] = f"orchest/orchest-ctl:{update_to_version}"
    for env_var in orchest_ctl_container["env"]:
        if env_var["name"] == "ORCHEST_VERSION":
            env_var["value"] = update_to_version
            break
    orchest_ctl_container["command"] = ["/bin/bash", "-c"]
    # Make sure the sidecar is online before updating.
    orchest_ctl_container["args"] = [
        "while true; do nc -zvw1 update-sidecar 80 > /dev/null 2>&1 && orchest update "
        "&& break; sleep 1; done"
    ]

    return manifest
