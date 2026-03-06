import path from "node:path";
import fs from "node:fs";
import type { ModelParameters, Network } from "neurons";

const DIRECTORY = path.join(process.cwd(), "data");
const FILE_THETAS = path.join(DIRECTORY, "thetas.json");
const FILE_TRAINING_DATA = path.join(DIRECTORY, "trainingData.json");

class StorageService {
  private createData() {
    const nums: number[] = [];
    for (let i = 0; i < 1000; i++) {
      nums.push(Math.random() * 100);
    }

    this.ensureDirectory();
    fs.writeFileSync(FILE_TRAINING_DATA, JSON.stringify(nums), {
      encoding: "utf8",
    });
  }

  private ensureDirectory() {
    if (!fs.existsSync(DIRECTORY)) fs.mkdirSync(DIRECTORY);
  }

  getData() {
    if (!fs.existsSync(FILE_TRAINING_DATA)) this.createData();

    const str = fs.readFileSync(FILE_TRAINING_DATA, { encoding: "utf8" });
    const nums = JSON.parse(str) as number[];
    return nums;
  }

  saveThetas(thetas: ModelParameters) {
    this.ensureDirectory();
    fs.writeFileSync(FILE_THETAS, JSON.stringify(thetas), {
      encoding: "utf-8",
    });
  }

  getThetas(newThetas: boolean, network: Network) {
    if (newThetas || !fs.existsSync(FILE_THETAS))
      this.saveThetas(network.createThetas());

    const json = fs.readFileSync(FILE_THETAS, { encoding: "utf-8" });
    return JSON.parse(json) as ModelParameters;
  }
}

const storageService = new StorageService();
export default storageService;
