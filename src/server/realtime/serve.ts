import { env } from "@/lib/env";
import { realtime } from ".";

realtime.listen(env.REALTIME_PORT, ({ hostname, port }) => {
  console.log(`Realtime server listening on ws://${hostname}:${port}/ws`);
});
