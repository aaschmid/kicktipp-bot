import dotenv from "dotenv";
import { PredictionStrategy } from "./predictor/predictor";

export interface Config {
  username: string;
  password: string;
  groupId: string;
  predictionStrategy: PredictionStrategy;
}

const result = dotenv.config();

if (result.error) {
  throw result.error;
}

export const config: Config = {
  username: process.env.KICKTIPP_USERNAME as string,
  password: process.env.KICKTIPP_PASSWORD as string,
  groupId: process.env.KICKTIPP_GROUP_ID as string,
  predictionStrategy: process.env.KICKTIPP_PREDICTION_STRATEGY as PredictionStrategy,
};

if (!config.username) {
  throw new Error("KICKTIPP_USERNAME environment variable is not set.");
}

if (!config.password) {
  throw new Error("KICKTIPP_PASSWORD environment variable is not set.");
}

if (!config.groupId) {
  throw new Error("KICKTIPP_GROUP_ID environment variable is not set.");
}

if (!config.predictionStrategy) {
  throw new Error("KICKTIPP_PREDICTION_STRATEGY environment variable is not set.");
}
// do not check for correct value of `predictionStrategy` here, please check is done later already
