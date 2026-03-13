import path from "node:path";
import fs from "node:fs";
import type { Network } from "neurons";
import { Model } from "neurons/Neurone";

const DIRECTORY = path.join(process.cwd(), "data");
const FILE_MODEL = path.join(DIRECTORY, "model.json");
const FILE_TRAINING_DATA = path.join(DIRECTORY, "trainingData.json");

class StorageService {
  private createData() {
    const nums: number[] = [];
    for (let i = 0; i < 1000; i++) {
      const sign = Math.random() > 0.5 ? -1 : 1;
      nums.push(Math.random() * 100 * sign);
    }
    nums.sort((a, b) => a - b);

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

  saveModel(model: Model) {
    this.ensureDirectory();
    fs.writeFileSync(FILE_MODEL, JSON.stringify(model), {
      encoding: "utf-8",
    });
  }

  getModel(newThetas: boolean, inputs: number[], network: Network) {
    if (newThetas || !fs.existsSync(FILE_MODEL))
      this.saveModel({
        thetas: network.createThetas(),
        norm: network.getNormalizationParameters(inputs),
      });

    const json = fs.readFileSync(FILE_MODEL, { encoding: "utf-8" });
    return JSON.parse(json) as Model;
  }
}

const storageService = new StorageService();
export default storageService;
