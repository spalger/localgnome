import Path from "path";
import Fs from "fs";
import * as Rx from "rxjs";
import { ConfigSchema, ParsedConfig } from "shared/configSchema";

if (!process.env.HOME) {
  throw new Error("missing $HOME env");
}
if (!Path.isAbsolute(process.env.HOME)) {
  throw new Error(`$HOME doesn't seem to be a valid path`);
}
const HOME = process.env.HOME;

const defaultConfig = ConfigSchema.parse({});

export class Config {
  path = Path.resolve(HOME, ".config/localgnome/config.json");
  value$: Rx.Observable<ParsedConfig>;
  private readonly updated$ = new Rx.Subject<void>();

  constructor() {
    const refresh$ = new Rx.Subject<void>();
    if (!Fs.existsSync(this.path)) {
      Fs.mkdirSync(Path.dirname(this.path), { recursive: true });
      Fs.writeFileSync(this.path, `{}`);
    }
    Fs.watchFile(this.path, () => {
      console.log("config.json change detected");
      refresh$.next();
    }).on("error", (error) => {
      console.log("config.json change watcher errored");
      refresh$.error(error);
    });

    this.value$ = refresh$.pipe(
      Rx.startWith(null),
      Rx.debounceTime(3000),
      Rx.mergeWith(this.updated$),
      Rx.map(() => {
        let raw;
        try {
          raw = Fs.readFileSync(this.path, "utf8");
        } catch {
          return defaultConfig;
        }

        try {
          console.log("read updated config.json from disk", raw);
          return ConfigSchema.parse(JSON.parse(raw));
        } catch (error) {
          console.error("error reading config", error);
          console.error("invalid file contents:", raw);
          return defaultConfig;
        }
      }),
      Rx.shareReplay(1)
    );
  }

  get$<K extends keyof ParsedConfig>(key: K): Rx.Observable<ParsedConfig[K]> {
    return this.value$.pipe(
      Rx.map((value) => value[key]),
      Rx.distinctUntilChanged()
    );
  }

  update$(update: Partial<ParsedConfig>) {
    return this.value$.pipe(
      Rx.first(),
      Rx.map((current) => {
        const newVal = {
          ...current,
          ...update,
        };

        Fs.mkdirSync(Path.dirname(this.path), { recursive: true });
        Fs.writeFileSync(this.path, JSON.stringify(newVal, null, 2), "utf8");
        this.updated$.next();

        return newVal;
      })
    );
  }
}
