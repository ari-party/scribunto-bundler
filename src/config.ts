export interface Config {
  prefix?: string;
  suffix?: string;

  main: string;
  out: string;
  modules?: Array<{
    name: string;
    path: string;
  }>;
}
