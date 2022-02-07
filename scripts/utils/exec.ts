import { exec } from 'child_process'

export type Options = Parameters<typeof exec>[1]

export const execute = async (cmd: string, opts: Options, { silent } = { silent: false }): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const proc = exec(cmd, opts, (err, data) => (err ? reject(err) : resolve(data.toString())))
    if (!silent) {
      proc.stdout?.pipe(process.stdout)
      proc.stderr?.pipe(process.stderr)
    }
  })
}
