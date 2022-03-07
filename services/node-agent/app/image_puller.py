import asyncio
import logging
import time
from enum import Enum
from typing import Optional

import aiodocker


class Policy(Enum):
    IfNotPresent = "IfNotPresent"
    Always = "Always"


class ImagePuller(object):
    def __init__(
        self,
        image_puller_interval: int,
        image_puller_policy: Policy,
        image_puller_retries: int,
        image_puller_images: list,
        image_puller_log_level: str,
        image_puller_threadiness: int,
    ) -> None:

        """ImagePuller is started is responsible for pulling the
        provided list of images based on the configuration. based
        on the policy, it decides wther to check for the existance
        of the images on node or not.

         Args:
            image_puller_interval (int): ImagePuller tries to pull
                the image, then waits the interval number of seconds
                and perform the operation again.
            image_puller_policy (Policy): If the policy is
                `IfNotPresent` the set of pulled image names is first
                checked for existance, and pulls otherwise.
            image_puller_images (list): The list of images to be pulled,
                the image_names should include the tag and the
                repository
            image_puller_log_level (str): The log level of the component

        """

        self.interval = image_puller_interval
        self.policy = image_puller_policy
        self.num_retries = image_puller_retries
        self.images = image_puller_images
        self.threadiness = image_puller_threadiness
        self.logger = logging.getLogger("IMAGE_PULLER")
        self.logger.setLevel(image_puller_log_level)

        self._aclient: Optional[aiodocker.Docker] = None

    async def get_image_names(self, queue: asyncio.Queue):
        """Get the image names for pulling.
        Args:
            queue: The queue to put the image names to, the queue will
            be consumed by puller tasks.

        """
        while True:
            for image_name in self.images:
                # Create a pull task, with image_name which will
                # be consumed by image puller tasks.
                await queue.put(image_name)

                await asyncio.sleep(self.interval)

    async def pull_image(self, queue: asyncio.Queue):
        """Pulls the image.

        If the policy is `IfNotPresent` the set of pulled image names
        is checked and, if present, the method returns. Otherwise, the
        pull attempt is made and the set of pulled images is updated,
        when successful.

        Args:
            queue: The queue to get the image name from.

        """

        while True:
            image_name = await queue.get()
            if self.policy == Policy.IfNotPresent:
                if await self.image_exists(image_name):
                    queue.task_done()
                    continue

            self.logger.info(
                f"Image '{image_name}' " "is not found - attempting pull..."
            )

            for retry in range(self.num_retries):
                try:
                    self.logger.info(f"Pulling image '{image_name}'...")
                    if await self.download_image(image_name):
                        break
                    self.logger.warning(f"Image '{image_name}' was not downloaded!")
                except Exception as ex:
                    self.logger.warning(
                        f"Attempt {retry} to pull image "
                        f"'{image_name}' failed with "
                        f"exception - retrying. Exception was: {ex}."
                    )
            queue.task_done()

    async def image_exists(self, image_name: str) -> bool:
        """Checks for the existence of the named image using
        the configured container runtime.

        Args:
            image_name: The name of the image to be checked.

        Returns:
            True if exist locally, False otherwise.

        """
        result = True
        try:
            await self.aclient().images.inspect(image_name)
        except aiodocker.DockerError:
            result = False

        self.logger.debug(
            f"Checked existence of image '{image_name} '" f"exists = {result}"
        )
        return result

    async def download_image(self, image_name: str) -> bool:
        """Downloads (pulls) the named image.

        Args:
            image_name: The name of the image for downloading.

        Returns:
            True if download was successful, False otherwise.

        """
        result = True
        t0 = time.time()
        try:
            await self.aclient().images.pull(image_name)
        except aiodocker.DockerError:
            result = False
        t1 = time.time()
        if result is True:
            self.logger.info(f"Pulled image '{image_name}' in {(t1 - t0):.3f} secs.")
        return result

    def aclient(self):
        if self._aclient is None:
            self._aclient = aiodocker.Docker()

        return self._aclient

    async def run(self):

        self.logger.info("Starting image puller.")

        queue = asyncio.Queue()

        get_images_future = asyncio.ensure_future(self.get_image_names(queue))
        pullers = [
            asyncio.create_task(self.pull_image(queue)) for _ in range(self.threadiness)
        ]

        await asyncio.gather(*pullers, get_images_future)
