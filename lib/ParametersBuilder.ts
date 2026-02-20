import MainParameters from "../types/MainParameters.js";

class ParametersBuilder {
  private getValueParam<T>(
    name: string,
    converter: (input: string) => T,
    validator?: (p: T) => boolean,
  ): T | null {
    if (!process.argv.includes(name)) return null;

    const idx = process.argv.indexOf(name) + 1;
    const paramStr = process.argv[idx];
    const _p = converter(paramStr);
    if (validator && !validator(_p)) return null;
    return _p;
  }

  private nanValidator(n: number) {
    return !Number.isNaN(n);
  }

  builParams(): MainParameters {
    const clearThetas = process.argv.includes("-c");
    const alpha =
      this.getValueParam("-a", Number.parseFloat, this.nanValidator) ?? 0.1;
    const iterations =
      this.getValueParam("-i", Number.parseInt, this.nanValidator) ?? 10000;

    return {
      clearThetas,
      alpha,
      iterations,
    };
  }
}

const parametersBuilder = new ParametersBuilder();
export default parametersBuilder;
