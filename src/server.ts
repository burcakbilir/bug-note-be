import "dotenv/config";

import { app } from "./app.js";
import { env } from "./config/env.js";

const port = env.port;

app.listen(port, () => {
  console.log(`Bug note api is running on http://localhost:${env.port}`);
});
