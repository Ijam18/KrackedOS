import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/core/auth/server";

export const { POST, GET } = toNextJsHandler(auth);
