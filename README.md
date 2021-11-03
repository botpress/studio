## Development workflow

Currently, it is not recommended to run the studio on its own. Therefore, you must start the Botpress Server, which will provide a couple of required parameters so the studio can work smoothly with the server.

- Type `yarn`
- Build everything using `yarn build`
- Use `yarn watch` to start a watcher on both the backend and frontend
- Type `yarn package` to generate a single executable file for every available OS

Like before, any changes made on the frontend will be available after a simple page refresh. Changes on the backend will require a server restart.

Since this package MUST be started from the Botpress Server, you need to set a special environment variable on the server so it can load the correct files.
The variable is named `DEV_STUDIO_PATH` and must point to `packages/studio-be/out`

## As standalone

Start the studio by typing `yarn start path-to-bot-folder`. If the bot doesn't exist, it will be created. You can choose a different template by adding `--template template_id` as a CLI argument.

There are various endpoints that must be configured to get every features working properly:

- `MESSAGING_ENDPOINT` must be configured to start the emulator and test your bot

- `NLU_ENDPOINT` is necessary to train your bot

- `RUNTIME_ENDPOINT` will add a button on the UI which is a shortcut to update the bot archive on the remote runtime.

### Discussion points

- There are still some configurations related to the studio which had to be put somewhere, for now they are in the bot's "internal"
- How white label will be implemented?
- We have realtime between studio backend/frontend, but the bottom panel is kind of useless (no logs, cant change debug, no debugger)

## Release workflow

1. Type `yarn release <type>` where type can be major, minor or patch
2. Open a PR with all the files, when it is merged on baster, binaries will be produced and released
