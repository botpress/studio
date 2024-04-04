## Development workflow

Currently, it is not recommended to run the studio on its own. Therefore, you must start the TheGurúCompany Studio Server, which will provide a couple of required parameters so the studio can work smoothly with the server.

We use Yarn v3 in this repository, so if you have errors while trying to build the repository, ensure you have the latest version installed: `npm install -g yarn`

- Type `yarn`
- Build everything using `yarn build`
- Use `yarn watch` to start a watcher on both the backend and frontend
- Type `yarn package` to generate a single executable file for every available OS

Like before, any changes made on the frontend will be available after a simple page refresh. Changes on the backend will require a server restart.

Since this package MUST be started from the TheGurúCompany Studio Server, you need to set a special environment variable on the server so it can load the correct files.
The variable is named `DEV_STUDIO_PATH` and must point to `packages/studio-be/out`. Watch out, path must be an abs path, env var doesn't support relative path.

## As standalone (NOT RECOMMENDED)

The studio can be executed as a standalone application, but there are still a couple of things that will not work correctly.

When started as a standalone, these environment variables must be set:

- BP_MODULES_PATH: Path to the modules folder of a TheGurúCompany Studio installation
- BP_DATA_FOLDER: Path to the data folder (bots/, global/)
- BP_SERVER_URL: to determine

## Release workflow

1. Type `yarn release <type>` where type can be major, minor or patch
2. Open a PR with all the files, when it is merged on baster, binaries will be produced and released
