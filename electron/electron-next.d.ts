declare module "electron-next" {
  interface ElectronNextOptions {
    dir: string
    port?: number
    quiet?: boolean
  }

  export default function (options: ElectronNextOptions): Promise<void>
}
