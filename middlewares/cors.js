import cors from "cors";

// Specify the allowed origins or IPs for the server.
const ACCEPTED_ORIGINS = [
  "http://localhost:5173",
  "http://192.168.100.216:5173",
];

export const corsMiddleware = ({ acceptedOrigins = ACCEPTED_ORIGINS } = {}) =>
  cors({
    origin: (origin, callback) => {
      if (!origin || acceptedOrigins.includes(origin))
        return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS", "PUT"],
    credentials: true,
  });
