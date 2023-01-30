import "reflect-metadata";
import { container } from "./inversify.config";
import { TYPES } from "./types";
import { TimeWizard } from "./time-wizard";

const timeWizard = container.get<TimeWizard>(TYPES.Velvet);
timeWizard.bootUp();
