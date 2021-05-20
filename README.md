## Development workflow

When developing on the studio, simply type `yarn watch` and the watcher will be started on the backend and on the frontend. Any changes made on the frontend will be available after a simple page refresh. Changes on the backend will require a server restart.

On the main Botpress workspace, you can set the environment variable `DEV_STUDIO_PATH` to the `packages/studio-be/out` folder to start this instance of the studio instead of the included executable.

## As standalone (NOT RECOMMENDED)

The studio can be executed as a standalone application, but there are still a couple of things that will not work correctly.

When started as a standalone, these environment variables must be set:

- BP_MODULES_PATH: Path to the modules folder of a Botpress installation
- BP_DATA_FOLDER: Path to the data folder (bots/, global/)
- BP_SERVER_URL: to determine
