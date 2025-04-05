import Disability from "../models/DisabilityModel.js";
import { getAll } from "./handlerFactory.js";

const getAllDisabilities = getAll(Disability);

export default getAllDisabilities;
