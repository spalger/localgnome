import Path from "path";
import Fs from "fs";
import * as Rx from "rxjs";
import { z } from "zod";

if (!process.env.HOME) {
  throw new Error("missing $HOME env");
}
if (!Path.isAbsolute(process.env.HOME)) {
  throw new Error(`$HOME doesn't seem to be a valid path`);
}
const HOME = process.env.HOME;

const ConfigSchema = z.object({
  reposDir: z.string().optional(),
});
type ParsedConfig = z.infer<typeof ConfigSchema>;

const defaultConfig = ConfigSchema.parse({});

export class Config {
  path = Path.resolve(HOME, ".config/localgnome/config.json");
  value$: Rx.Observable<ParsedConfig>;

  constructor() {
    const refresh$ = new Rx.Subject<void>();
    if (!Fs.existsSync(this.path)) {
      Fs.mkdirSync(Path.dirname(this.path), { recursive: true });
      Fs.writeFileSync(this.path, `{}`);
    }
    Fs.watchFile(this.path, () => refresh$.next()).on("error", (error) => {
      refresh$.error(error);
    });

    this.value$ = refresh$.pipe(
      Rx.startWith(null),
      Rx.debounceTime(3000),
      Rx.map(() => {
        let raw;
        try {
          raw = Fs.readFileSync(this.path, "utf8");
        } catch {
          return defaultConfig;
        }

        try {
          return ConfigSchema.parse(JSON.parse(raw));
        } catch (error) {
          console.error("error reading config", error);
          console.error("invalid file contents:", raw);
          return defaultConfig;
        }
      }),
      Rx.shareReplay()
    );
  }

  get$<K extends keyof ParsedConfig>(key: K): Rx.Observable<ParsedConfig[K]> {
    return this.value$.pipe(
      Rx.map((value) => value[key]),
      Rx.distinctUntilChanged()
    );
  }
}
