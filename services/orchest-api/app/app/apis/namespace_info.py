"""API endpoints for unspecified orchest-api level information."""
from datetime import datetime, timezone

from flask import current_app
from flask_restx import Namespace, Resource

from app import models, schema
from app.connections import db
from app.core import sessions

api = Namespace("info", description="Orchest-api information.")
api = schema.register_schema(api)


@api.route("/idle")
class IdleCheck(Resource):
    @api.doc("orchest_api_idle")
    @api.marshal_with(
        schema.idleness_check_result,
        code=200,
        description="Orchest-api idleness check.",
    )
    def get(self):
        """Checks if the Orchest-api is idle.

        The Orchest-api is considered idle if:
        - no environments are being built
        - no jupyter images are being built
        - there are no ongoing interactive-runs
        - there are no ongoing job runs
        - there are no busy kernels among running sessions, said busy
            state is reported by JupyterLab, and reflects the fact that
            a kernel is not actively doing some compute.
        """
        idleness_data = is_orchest_idle()
        return idleness_data, 200


@api.route("/client-heartbeat")
class ClientHeartBeat(Resource):
    @api.doc("client_heartbeat")
    def get(self):
        """Allows to signal an heartbeat to the Orchest-api.

        This allows the Orchest-api to know about the fact that some
        clients are using Orchest.

        """
        # Cleanup old entries. Note that this works correctly because
        # we are in transaction mode. If flask would run in eager mode
        # there would be a time window where orchest would be idle, at
        # least according to client heartbeats.
        models.ClientHeartbeat.query.delete()
        db.session.add(models.ClientHeartbeat())
        db.session.commit()

        return "", 200


def is_orchest_idle() -> dict:
    """Checks if the orchest-api is idle.

    Returns:
        See schema.idleness_check_result for details.
    """
    data = {}

    # Active clients.
    threshold = (
        datetime.now(timezone.utc)
        - current_app.config["CLIENT_HEARTBEATS_IDLENESS_THRESHOLD"]
    )
    data["active_clients"] = db.session.query(
        db.session.query(models.ClientHeartbeat)
        .filter(models.ClientHeartbeat.timestamp > threshold)
        .exists()
    ).scalar()

    # Find busy kernels.
    data["busy_kernels"] = False
    isessions = models.InteractiveSession.query.filter(
        models.InteractiveSession.status.in_(["RUNNING"])
    ).all()
    for session in isessions:
        if sessions.has_busy_kernels(
            session.project_uuid[:18] + session.pipeline_uuid[:18]
        ):
            data["busy_kernels"] = True
            break

    # Assumes the model has a uuid field and its lifecycle contains the
    # PENDING and STARTED statuses. NOTE: we could be stopping earlier
    # on truthy values since we already know the orchest-api is idle at
    # this point, but providing all details might allow to further build
    # on this "feature" in the future without fragmenting users due to
    # different versions.
    for name, model in [
        ("ongoing_environment_image_builds", models.EnvironmentImageBuild),
        ("ongoing_jupyterlab_builds", models.JupyterImageBuild),
        ("ongoing_interactive_runs", models.InteractivePipelineRun),
        ("ongoing_job_runs", models.NonInteractivePipelineRun),
    ]:
        data[name] = db.session.query(
            db.session.query(model)
            .filter(model.status.in_(["PENDING", "STARTED"]))
            .exists()
        ).scalar()

    result = {"details": data}
    result["idle"] = not any(data.values())
    return result
