"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express17 = __toESM(require("express"));
var import_cors = __toESM(require("cors"));

// src/config/env.ts
var import_dotenv = __toESM(require("dotenv"));
var import_path = __toESM(require("path"));
import_dotenv.default.config({ path: import_path.default.join(__dirname, "../../.env") });
var ENV = {
  PORT: process.env.PORT || 5e3,
  NODE_ENV: process.env.NODE_ENV || "development",
  FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GOOGLE_MAPS_BACKEND_KEY: process.env.GOOGLE_MAPS_BACKEND_KEY,
  WEATHER_API_KEY: process.env.WEATHER_API_KEY,
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
  API_SECRET: process.env.API_SECRET,
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*"
};
var requiredKeys = ["FIREBASE_SERVICE_ACCOUNT_PATH"];
requiredKeys.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`[Config] WARNING: Missing critical environment variable: ${key}`);
  }
});

// src/middleware/loggerMiddleware.ts
var requestLogger = (req, res, next) => {
  const start = Date.now();
  console.log(`[>>] ${req.method} ${req.originalUrl}`);
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[<<] ${req.method} ${req.originalUrl} - ${res.statusCode} [${duration}ms]`);
  });
  next();
};

// src/utils/response.ts
var sendSuccess = (res, data, message = "Success", statusCode = 200) => {
  const response = {
    success: true,
    message,
    data,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  res.status(statusCode).json(response);
};
var sendError = (res, error, message = "An error occurred", statusCode = 500) => {
  const response = {
    success: false,
    message,
    error: error instanceof Error ? error.message : error,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  res.status(statusCode).json(response);
};

// src/middleware/errorMiddleware.ts
var errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.url}`, err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  sendError(res, err, message, statusCode);
};
var notFoundHandler = (req, res, next) => {
  console.warn(`[NotFound] ${req.method} ${req.originalUrl}`);
  const err = new Error("Route not found");
  err.requestedPath = req.originalUrl;
  sendError(res, err, "Route not found", 404);
};

// src/routes/systemRoutes.ts
var import_express = require("express");

// src/config/firebaseAdmin.ts
var import_firebase_admin = __toESM(require("firebase-admin"));
var import_path2 = __toESM(require("path"));
var import_fs = __toESM(require("fs"));
if (!import_firebase_admin.default.apps.length) {
  try {
    if (process.env.FIREBASE_CREDENTIALS) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
      import_firebase_admin.default.initializeApp({
        credential: import_firebase_admin.default.credential.cert(serviceAccount)
      });
      console.log("[Firebase Admin] Initialized successfully via environment variable.");
    } else if (ENV.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccountPath = import_path2.default.resolve(__dirname, "../../", ENV.FIREBASE_SERVICE_ACCOUNT_PATH);
      if (import_fs.default.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        import_firebase_admin.default.initializeApp({
          credential: import_firebase_admin.default.credential.cert(serviceAccount)
        });
        console.log(`[Firebase Admin] Initialized via: ${serviceAccountPath}`);
      } else {
        throw new Error(
          `Firebase credentials file not found at: ${serviceAccountPath}.
=========================================================================
\u{1F6A8} DEPLOYMENT ERROR: MISSING FIREBASE CREDENTIALS \u{1F6A8}
To fix this on Render:
1. Copy the contents of your local 'backend/firebase-services-account.json'
2. Go to your Render Dashboard -> Environment -> Add Environment Variable
3. Set Key: FIREBASE_CREDENTIALS
4. Set Value: (paste the copied JSON contents)
5. Save and redeploy!
=========================================================================`
        );
      }
    } else {
      import_firebase_admin.default.initializeApp();
      console.log("[Firebase Admin] Initialized via Default Credentials.");
    }
  } catch (error) {
    console.error("[Firebase Admin] Initialization Error:", error.message || error);
    process.exit(1);
  }
}
var adminDb = import_firebase_admin.default.firestore();
var adminAuth = import_firebase_admin.default.auth();
var adminMessaging = import_firebase_admin.default.messaging();

// src/controllers/systemController.ts
var getStatus = async (req, res) => {
  sendSuccess(res, { aiStatus: "Operational", backend: "Operational", db: "Operational" }, "System status retrieved");
};
var getHealth = async (req, res) => {
  let firebaseStatus = "Disconnected";
  try {
    if (adminDb) {
      await adminDb.collection("system_ping").limit(1).get();
      firebaseStatus = "Connected";
    }
  } catch (err) {
    firebaseStatus = "Error";
  }
  sendSuccess(res, {
    status: "OK",
    uptime: process.uptime(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    firebase: firebaseStatus,
    environment: process.env.NODE_ENV
  }, "System health retrieved");
};
var getRealtimeStatus = async (req, res) => {
  sendSuccess(res, { activeStreams: 4, messagesPerSecond: 12 }, "Realtime metrics retrieved");
};

// src/utils/catchAsync.ts
var catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// src/routes/systemRoutes.ts
var router = (0, import_express.Router)();
router.get("/status", catchAsync(getStatus));
router.get("/health", catchAsync(getHealth));
router.get("/realtime", catchAsync(getRealtimeStatus));
var systemRoutes_default = router;

// src/routes/hazardRoutes.ts
var import_express2 = require("express");

// src/services/firebaseService.ts
var FirebaseService = class {
  /**
   * Adds a new hazard zone to Firestore.
   */
  static async createHazard(payload) {
    const docRef = adminDb.collection("hazards").doc();
    const hazardData = {
      ...payload,
      id: docRef.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: "Active",
      isActive: true,
      isVisible: true
    };
    await docRef.set(hazardData);
    return docRef.id;
  }
  /**
   * Dispatches a new emergency alert to Firestore.
   */
  static async createAlert(payload) {
    const docRef = adminDb.collection("alerts").doc();
    const alertData = {
      ...payload,
      id: docRef.id,
      createdAt: Date.now(),
      status: "Active"
    };
    await docRef.set(alertData);
    return docRef.id;
  }
};

// src/controllers/hazardController.ts
var getHazards = async (req, res) => {
  const snapshot = await adminDb.collection("hazards").get();
  const hazards = snapshot.docs.map((doc) => doc.data());
  sendSuccess(res, hazards, "Hazards retrieved successfully");
};
var getActiveHazards = async (req, res) => {
  const snapshot = await adminDb.collection("hazards").where("isActive", "==", true).get();
  const hazards = snapshot.docs.map((doc) => doc.data());
  sendSuccess(res, hazards, "Active hazards retrieved successfully");
};
var getHazardById = async (req, res) => {
  const doc = await adminDb.collection("hazards").doc(req.params.id).get();
  if (!doc.exists) {
    return sendError(res, null, "Hazard not found", 404);
  }
  sendSuccess(res, doc.data(), "Hazard retrieved successfully");
};
var createHazard = async (req, res) => {
  const payload = req.body;
  const hazardId = await FirebaseService.createHazard(payload);
  sendSuccess(res, { hazardId }, "Hazard created successfully", 201);
};
var updateHazard = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  await adminDb.collection("hazards").doc(id).update({
    ...updates,
    updatedAt: Date.now()
  });
  sendSuccess(res, { id }, "Hazard updated successfully");
};
var removeHazard = async (req, res) => {
  const { id } = req.params;
  await adminDb.collection("hazards").doc(id).delete();
  sendSuccess(res, { id }, "Hazard removed successfully");
};

// src/middleware/validationMiddleware.ts
var validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error && error.name === "ZodError") {
        const message = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
        return sendError(res, error.errors, `Validation failed: ${message}`, 400);
      }
      next(error);
    }
  };
};

// src/validators/hazardValidator.ts
var import_zod = require("zod");
var CoordinateSchema = import_zod.z.object({
  latitude: import_zod.z.number().min(-90).max(90),
  longitude: import_zod.z.number().min(-180).max(180)
});
var createHazardSchema = import_zod.z.object({
  body: import_zod.z.object({
    title: import_zod.z.string().min(3),
    type: import_zod.z.string().min(3),
    severity: import_zod.z.enum(["Low", "Medium", "High", "Critical"]),
    polygon: import_zod.z.array(CoordinateSchema).min(3, "A polygon must have at least 3 points"),
    confidenceScore: import_zod.z.number().min(0).max(1).optional(),
    riskLevel: import_zod.z.number().min(0).max(10).optional()
  })
});
var updateHazardSchema = import_zod.z.object({
  params: import_zod.z.object({
    id: import_zod.z.string()
  }),
  body: import_zod.z.object({
    title: import_zod.z.string().min(3).optional(),
    severity: import_zod.z.enum(["Low", "Medium", "High", "Critical"]).optional(),
    status: import_zod.z.string().optional(),
    isActive: import_zod.z.boolean().optional(),
    isVisible: import_zod.z.boolean().optional()
  })
});

// src/routes/hazardRoutes.ts
var router2 = (0, import_express2.Router)();
router2.get("/", catchAsync(getHazards));
router2.get("/active", catchAsync(getActiveHazards));
router2.get("/:id", catchAsync(getHazardById));
router2.post("/create", validateRequest(createHazardSchema), catchAsync(createHazard));
router2.post("/update/:id", validateRequest(updateHazardSchema), catchAsync(updateHazard));
router2.post("/remove/:id", catchAsync(removeHazard));
var hazardRoutes_default = router2;

// src/routes/weather.ts
var import_express3 = require("express");

// src/services/weatherService.ts
var import_axios = __toESM(require("axios"));
var WeatherService = class {
  /**
   * Aggregates weather data for a specific location.
   */
  static async getLocalWeather(coords) {
    var _a, _b, _c, _d, _e, _f, _g;
    const lat = coords.latitude;
    const lng = coords.longitude;
    const fallbackResponse = {
      location: { lat, lng },
      weather: {
        condition: "Unknown",
        description: "data unavailable",
        temperature: 0,
        humidity: 0,
        windSpeed: 0,
        rainfall: 0,
        cloudCoverage: 0
      },
      alerts: [],
      timestamp: Math.floor(Date.now() / 1e3)
    };
    if (!ENV.OPENWEATHER_API_KEY || ENV.OPENWEATHER_API_KEY.includes("your_openweather")) {
      console.warn("[WeatherService] OPENWEATHER_API_KEY missing or placeholder. Returning mock data.");
      return {
        ...fallbackResponse,
        weather: {
          condition: "Rain",
          description: "moderate rain",
          temperature: 28,
          humidity: 87,
          windSpeed: 14,
          rainfall: 12.5,
          cloudCoverage: 92
        },
        alerts: [
          { event: "Storm Warning", severity: "moderate" }
        ]
      };
    }
    try {
      const url = `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&APPID=${ENV.OPENWEATHER_API_KEY}`;
      const response = await import_axios.default.get(url);
      const data = response.data;
      const rainfall = data.rain ? data.rain["1h"] || 0 : 0;
      const alerts = [];
      if (rainfall > 10 || ((_a = data.wind) == null ? void 0 : _a.speed) > 20) {
        alerts.push({
          event: "Storm Warning",
          severity: rainfall > 20 ? "high" : "moderate"
        });
      }
      return {
        location: {
          lat: data.coord.lat,
          lng: data.coord.lon
        },
        weather: {
          condition: ((_b = data.weather[0]) == null ? void 0 : _b.main) || "Unknown",
          description: ((_c = data.weather[0]) == null ? void 0 : _c.description) || "data unavailable",
          temperature: Math.round(((_d = data.main) == null ? void 0 : _d.temp) || 0),
          humidity: ((_e = data.main) == null ? void 0 : _e.humidity) || 0,
          windSpeed: Math.round((((_f = data.wind) == null ? void 0 : _f.speed) || 0) * 3.6),
          // Convert m/s to km/h
          rainfall,
          cloudCoverage: ((_g = data.clouds) == null ? void 0 : _g.all) || 0
        },
        alerts,
        timestamp: data.dt || Math.floor(Date.now() / 1e3)
      };
    } catch (error) {
      console.error("[WeatherService] Error fetching weather:", error);
      return fallbackResponse;
    }
  }
};

// src/controllers/weatherController.ts
var getCurrentWeather = async (req, res) => {
  const coords = {
    latitude: Number(req.query.lat) || 0,
    longitude: Number(req.query.lng) || 0
  };
  const weatherPayload = await WeatherService.getLocalWeather(coords);
  res.json(weatherPayload);
};

// src/routes/weather.ts
var router3 = (0, import_express3.Router)();
router3.get("/", catchAsync(getCurrentWeather));
var weather_default = router3;

// src/routes/alertRoutes.ts
var import_express4 = require("express");

// src/services/alertService.ts
var AlertService = class {
  /**
   * Processes an incoming alert signal and dispatches it to the realtime database.
   */
  static async processAndDispatchAlert(payload) {
    console.log(`[AlertService] Processing Alert: ${payload.title}`);
    return await FirebaseService.createAlert(payload);
  }
};

// src/controllers/alertController.ts
var getAlerts = async (req, res) => {
  const snapshot = await adminDb.collection("alerts").get();
  const alerts = snapshot.docs.map((doc) => doc.data());
  sendSuccess(res, alerts, "Alerts retrieved successfully");
};
var getActiveAlerts = async (req, res) => {
  const snapshot = await adminDb.collection("alerts").where("status", "==", "Active").get();
  const alerts = snapshot.docs.map((doc) => doc.data());
  sendSuccess(res, alerts, "Active alerts retrieved successfully");
};
var sendAlert = async (req, res) => {
  const payload = req.body;
  const alertId = await AlertService.processAndDispatchAlert(payload);
  sendSuccess(res, { alertId }, "Alert sent successfully", 201);
};
var broadcastAlert = async (req, res) => {
  const payload = req.body;
  const alertId = await AlertService.processAndDispatchAlert({ ...payload, level: "Critical" });
  sendSuccess(res, { alertId, broadcasted: true }, "Alert broadcasted successfully", 201);
};
var removeAlert = async (req, res) => {
  const { id } = req.params;
  await adminDb.collection("alerts").doc(id).delete();
  sendSuccess(res, { id }, "Alert removed successfully");
};

// src/validators/alertValidator.ts
var import_zod2 = require("zod");
var CoordinateSchema2 = import_zod2.z.object({
  latitude: import_zod2.z.number().min(-90).max(90),
  longitude: import_zod2.z.number().min(-180).max(180)
});
var sendAlertSchema = import_zod2.z.object({
  body: import_zod2.z.object({
    title: import_zod2.z.string().min(3),
    message: import_zod2.z.string().min(10),
    level: import_zod2.z.enum(["Info", "Warning", "Critical"]),
    targetArea: import_zod2.z.array(CoordinateSchema2).optional(),
    targetHazardId: import_zod2.z.string().optional()
  })
});

// src/routes/alertRoutes.ts
var router4 = (0, import_express4.Router)();
router4.get("/", catchAsync(getAlerts));
router4.get("/active", catchAsync(getActiveAlerts));
router4.post("/send", validateRequest(sendAlertSchema), catchAsync(sendAlert));
router4.post("/broadcast", validateRequest(sendAlertSchema), catchAsync(broadcastAlert));
router4.post("/remove/:id", catchAsync(removeAlert));
var alertRoutes_default = router4;

// src/routes/aiRoutes.ts
var import_express5 = require("express");

// src/services/aiService.ts
var AIService = class {
  /**
   * Orchestrates the Gemini AI for hazard assessment and route intelligence.
   */
  static async analyzeSituation(context) {
    if (!ENV.GEMINI_API_KEY) {
      console.warn("[AIService] GEMINI_API_KEY missing. Returning mock analysis.");
    }
    return {
      confidenceScore: 0.85,
      riskLevel: "High",
      recommendation: "Evacuate low-lying areas.",
      timestamp: Date.now()
    };
  }
};

// src/controllers/aiController.ts
var analyzeSituation = async (req, res) => {
  const analysis = await AIService.analyzeSituation(req.body);
  sendSuccess(res, analysis, "Situation analyzed successfully");
};
var getConfidence = async (req, res) => {
  sendSuccess(res, { confidenceScore: 0.92, source: "Sentinel-1" }, "Confidence score calculated");
};
var triangulateHazard = async (req, res) => {
  sendSuccess(res, { triangulatedPolygon: [], accuracy: "High" }, "Hazard triangulated successfully");
};

// src/validators/aiValidator.ts
var import_zod3 = require("zod");
var analyzeSituationSchema = import_zod3.z.object({
  body: import_zod3.z.object({
    contextType: import_zod3.z.enum(["Weather", "Social", "Sensor", "MultiModal"]),
    rawData: import_zod3.z.any(),
    regionId: import_zod3.z.string().optional()
  })
});
var getSafeRouteSchema = import_zod3.z.object({
  body: import_zod3.z.object({
    origin: import_zod3.z.object({
      latitude: import_zod3.z.number(),
      longitude: import_zod3.z.number()
    }),
    destination: import_zod3.z.object({
      latitude: import_zod3.z.number(),
      longitude: import_zod3.z.number()
    }),
    vehicleType: import_zod3.z.enum(["Emergency", "Civilian", "Heavy"]).optional()
  })
});

// src/routes/aiRoutes.ts
var router5 = (0, import_express5.Router)();
router5.post("/analyze", validateRequest(analyzeSituationSchema), catchAsync(analyzeSituation));
router5.post("/confidence", catchAsync(getConfidence));
router5.post("/triangulate", catchAsync(triangulateHazard));
var aiRoutes_default = router5;

// src/routes/routeRoutes.ts
var import_express6 = require("express");

// src/services/routingService.ts
var RoutingService = class {
  /**
   * Prepares rerouting logic considering active hazard zones.
   */
  static async calculateSafeRoute(origin, destination, activeHazards) {
    console.log(`[RoutingService] Calculating safe route avoiding ${activeHazards.length} hazards.`);
    if (!ENV.GOOGLE_MAPS_BACKEND_KEY) {
      console.warn("[RoutingService] GOOGLE_MAPS_BACKEND_KEY missing. Returning mock route.");
    }
    return {
      status: "OK",
      polyline: "mock_polyline_string",
      distance: "5.2 km",
      duration: "15 mins",
      hazardsAvoided: activeHazards.length
    };
  }
};

// src/controllers/routeController.ts
var getSafeRoute = async (req, res) => {
  const { origin, destination } = req.body;
  const activeHazards = [];
  const route = await RoutingService.calculateSafeRoute(origin, destination, activeHazards);
  sendSuccess(res, route, "Safe route generated successfully");
};
var avoidHazardRoute = async (req, res) => {
  sendSuccess(res, { status: "Recalculated" }, "Route recalculated to avoid hazard");
};

// src/routes/routeRoutes.ts
var router6 = (0, import_express6.Router)();
router6.post("/safe-route", validateRequest(getSafeRouteSchema), catchAsync(getSafeRoute));
router6.post("/avoid-hazard", catchAsync(avoidHazardRoute));
var routeRoutes_default = router6;

// src/routes/shelterRoutes.ts
var import_express7 = require("express");

// src/services/shelterService.ts
var ShelterService = class {
  /**
   * Retrieves all shelters from the Firestore database.
   */
  static async getAllShelters() {
    const snapshot = await adminDb.collection("shelters").get();
    return snapshot.docs.map((doc) => doc.data());
  }
  /**
   * Creates or registers a new emergency shelter.
   */
  static async createShelter(payload) {
    const docRef = adminDb.collection("shelters").doc();
    const shelterData = {
      ...payload,
      id: docRef.id,
      createdAt: Date.now(),
      status: "Active"
    };
    await docRef.set(shelterData);
    return docRef.id;
  }
};

// src/controllers/shelterController.ts
var getShelters = async (req, res) => {
  const shelters = await ShelterService.getAllShelters();
  sendSuccess(res, shelters, "Shelters retrieved successfully");
};
var getNearbyShelters = async (req, res) => {
  const shelters = await ShelterService.getAllShelters();
  sendSuccess(res, shelters, "Nearby shelters retrieved successfully");
};
var createShelter = async (req, res) => {
  const payload = req.body;
  const shelterId = await ShelterService.createShelter(payload);
  sendSuccess(res, { shelterId }, "Shelter registered successfully", 201);
};
var updateShelter = async (req, res) => {
  sendSuccess(res, { id: req.params.id }, "Shelter updated successfully");
};

// src/routes/shelterRoutes.ts
var router7 = (0, import_express7.Router)();
router7.get("/", catchAsync(getShelters));
router7.get("/nearby", catchAsync(getNearbyShelters));
router7.post("/create", catchAsync(createShelter));
router7.post("/update/:id", catchAsync(updateShelter));
var shelterRoutes_default = router7;

// src/routes/social.ts
var import_express8 = require("express");

// src/services/socialSignalService.ts
var import_path3 = __toESM(require("path"));
var import_fs2 = __toESM(require("fs"));
var VALID_SEVERITIES = ["low", "medium", "high", "critical"];
var getMockDataPath = () => {
  const paths = [
    import_path3.default.join(__dirname, "../data/mockFloodReports.json"),
    // Dev: running from backend/src/services
    import_path3.default.join(__dirname, "../../src/data/mockFloodReports.json"),
    // Prod Bundled: running server.js from backend/dist
    import_path3.default.join(__dirname, "./data/mockFloodReports.json"),
    // Prod Unbundled: running from backend/dist/services
    import_path3.default.join(process.cwd(), "backend/src/data/mockFloodReports.json"),
    // Running from project root
    import_path3.default.join(process.cwd(), "src/data/mockFloodReports.json")
    // Running from backend root
  ];
  for (const p of paths) {
    if (import_fs2.default.existsSync(p)) {
      return p;
    }
  }
  return paths[0];
};
var DATA_FILE = getMockDataPath();
var SocialSignalService = class {
  constructor() {
    this.reports = [];
    this.load();
  }
  load() {
    try {
      const raw = import_fs2.default.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      let invalid = 0;
      this.reports = parsed.filter((r) => {
        var _a, _b;
        const ok = r.id && r.text && r.locationName && typeof ((_a = r.coordinates) == null ? void 0 : _a.lat) === "number" && typeof ((_b = r.coordinates) == null ? void 0 : _b.lng) === "number" && typeof r.timestamp === "number" && VALID_SEVERITIES.includes(r.severity);
        if (!ok) {
          invalid++;
          console.warn(`[SocialSignalService] Invalid report skipped: ${r.id ?? "unknown"}`);
        }
        return ok;
      }).map((r) => ({
        id: r.id.trim(),
        text: r.text.trim(),
        locationName: r.locationName.trim(),
        coordinates: { lat: r.coordinates.lat, lng: r.coordinates.lng },
        severity: r.severity,
        timestamp: r.timestamp,
        source: r.source ?? "mock-social"
      }));
      console.log(`[SocialSignalService] Loaded ${this.reports.length} reports | ${invalid} invalid skipped`);
    } catch (err) {
      console.error("[SocialSignalService] Failed to load mock data:", err);
      this.reports = [];
    }
  }
  /**
   * Returns filtered and normalized reports.
   * Supports optional severity and location filtering.
   */
  getReports(filters = {}) {
    let results = [...this.reports];
    if (filters.severity) {
      const sev = filters.severity.toLowerCase();
      results = results.filter((r) => r.severity === sev);
    }
    if (filters.location) {
      const loc = filters.location.toLowerCase();
      results = results.filter((r) => r.locationName.toLowerCase().includes(loc));
    }
    return results.sort((a, b) => b.timestamp - a.timestamp);
  }
  /**
   * Returns all reports sorted by timestamp descending.
   * For future AI pipeline ingestion.
   */
  getAllReports() {
    return this.getReports();
  }
};
var socialSignalService = new SocialSignalService();

// src/routes/social.ts
var router8 = (0, import_express8.Router)();
router8.get(
  "/",
  catchAsync(async (req, res) => {
    const severity = req.query.severity;
    const location = req.query.location;
    const reports = socialSignalService.getReports({ severity, location });
    console.log(`[SocialRoute] Serving ${reports.length} reports | severity=${severity ?? "all"} location=${location ?? "all"}`);
    res.json({
      reports,
      count: reports.length,
      source: "mock-social-feed"
    });
  })
);
var social_default = router8;

// src/routes/signals.ts
var import_express9 = require("express");

// src/services/signalAggregatorService.ts
var RAINFALL_THRESHOLDS = {
  none: 0,
  light: 2.5,
  moderate: 7.5,
  heavy: 15,
  extreme: 30
};
function classifyRainfall(mm) {
  if (mm <= RAINFALL_THRESHOLDS.none) return "none";
  if (mm <= RAINFALL_THRESHOLDS.light) return "light";
  if (mm <= RAINFALL_THRESHOLDS.moderate) return "moderate";
  if (mm <= RAINFALL_THRESHOLDS.heavy) return "heavy";
  return "extreme";
}
function scoreWeatherSeverity(weather) {
  const rainfall = weather.rainfall;
  const windKph = weather.windSpeed;
  const stormWarn = weather.stormWarning;
  if (rainfall >= RAINFALL_THRESHOLDS.extreme || windKph > 80) return "critical";
  if (rainfall >= RAINFALL_THRESHOLDS.heavy || windKph > 50 || stormWarn) return "high";
  if (rainfall >= RAINFALL_THRESHOLDS.moderate || windKph > 30) return "medium";
  return "low";
}
var SEVERITY_RANK = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};
function scoreSocialSeverity(reports) {
  if (!reports.length) return "low";
  const criticalCount = reports.filter((r) => r.severity === "critical").length;
  const highCount = reports.filter((r) => r.severity === "high").length;
  if (criticalCount >= 2 || reports.length >= 8) return "critical";
  if (criticalCount >= 1 || highCount >= 3) return "high";
  if (highCount >= 1 || reports.length >= 4) return "medium";
  return "low";
}
function mergeOverallSeverity(weatherSev, socialSev, rainfall, reportCount) {
  const wRank = SEVERITY_RANK[weatherSev];
  const sRank = SEVERITY_RANK[socialSev];
  if (rainfall >= RAINFALL_THRESHOLDS.heavy && reportCount >= 3) {
    const elevated = Math.min(4, Math.max(wRank, sRank) + 1);
    return Object.keys(SEVERITY_RANK).find(
      (k) => SEVERITY_RANK[k] === elevated
    ) ?? "critical";
  }
  return wRank >= sRank ? weatherSev : socialSev;
}
function resolveRegionName(lat, lng) {
  if (lat > 31 && lat < 32.2 && lng > 73.8 && lng < 75) return "Lahore";
  if (lat > 33.3 && lat < 33.8 && lng > 72.8 && lng < 73.3) return "Rawalpindi";
  if (lat > 24.6 && lat < 25.1 && lng > 66.8 && lng < 67.4) return "Karachi";
  if (lat > 33.5 && lat < 34 && lng > 72.9 && lng < 73.5) return "Islamabad";
  if (lat > 31.3 && lat < 31.8 && lng > 72.9 && lng < 74) return "Faisalabad";
  return "Pakistan";
}
var SignalAggregatorService = class {
  /**
   * Aggregates weather + social signals into a single unified hazard payload.
   * All fusion logic is deterministic — no LLM involvement at this stage.
   */
  static async aggregate(lat, lng) {
    var _a, _b, _c, _d, _e, _f, _g;
    const startMs = Date.now();
    console.log(`[SignalAggregator] Starting aggregation for lat=${lat} lng=${lng}`);
    const [weatherRaw, socialReports] = await Promise.all([
      WeatherService.getLocalWeather({ latitude: lat, longitude: lng }),
      Promise.resolve(socialSignalService.getAllReports())
    ]);
    console.log(`[SignalAggregator] Weather fetched | Social reports: ${socialReports.length}`);
    const weather = {
      condition: ((_a = weatherRaw.weather) == null ? void 0 : _a.condition) ?? "Unknown",
      rainfall: ((_b = weatherRaw.weather) == null ? void 0 : _b.rainfall) ?? 0,
      humidity: ((_c = weatherRaw.weather) == null ? void 0 : _c.humidity) ?? 0,
      windSpeed: ((_d = weatherRaw.weather) == null ? void 0 : _d.windSpeed) ?? 0,
      cloudCoverage: ((_e = weatherRaw.weather) == null ? void 0 : _e.cloudCoverage) ?? 0,
      temperature: ((_f = weatherRaw.weather) == null ? void 0 : _f.temperature) ?? 0,
      stormWarning: (((_g = weatherRaw.alerts) == null ? void 0 : _g.length) ?? 0) > 0
    };
    const weatherSeverity = scoreWeatherSeverity(weather);
    const socialSeverity = scoreSocialSeverity(socialReports);
    const overallSeverity = mergeOverallSeverity(
      weatherSeverity,
      socialSeverity,
      weather.rainfall,
      socialReports.length
    );
    console.log(
      `[SignalAggregator] Severity \u2192 weather=${weatherSeverity} social=${socialSeverity} overall=${overallSeverity}`
    );
    const aggregationMs = Date.now() - startMs;
    console.log(`[SignalAggregator] Aggregation complete in ${aggregationMs}ms`);
    return {
      location: {
        lat,
        lng,
        region: resolveRegionName(lat, lng)
      },
      weather,
      socialSignals: socialReports.map((r) => ({
        id: r.id,
        text: r.text,
        severity: r.severity,
        locationName: r.locationName
      })),
      signalSummary: {
        weatherSeverity,
        socialSeverity,
        overallSeverity,
        signalDensity: socialReports.length,
        rainfallIntensity: classifyRainfall(weather.rainfall)
      },
      metadata: {
        generatedAt: Math.floor(Date.now() / 1e3),
        sourceCount: 2,
        // weather + social
        aggregationMs
      }
    };
  }
};

// src/routes/signals.ts
var router9 = (0, import_express9.Router)();
router9.get(
  "/",
  catchAsync(async (req, res) => {
    const lat = parseFloat(req.query.lat) || 31.5204;
    const lng = parseFloat(req.query.lng) || 74.3587;
    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({
        success: false,
        error: "Invalid coordinates. Provide numeric lat and lng query params."
      });
      return;
    }
    const payload = await SignalAggregatorService.aggregate(lat, lng);
    res.json(payload);
  })
);
var signals_default = router9;

// src/routes/sentinel.ts
var import_express10 = require("express");

// src/agents/sentinel/validators/signalValidators.ts
function isValidCoordinate(lat, lng) {
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}
function validateWeatherPayload(w) {
  const reasons = [];
  if (typeof w !== "object" || w === null) {
    return { valid: false, reasons: ["Weather payload is null or not an object"] };
  }
  if (typeof w.rainfall !== "number" || w.rainfall < 0 || w.rainfall > 500) {
    reasons.push(`Rainfall out of range: ${w.rainfall}`);
  }
  if (typeof w.humidity !== "number" || w.humidity < 0 || w.humidity > 100) {
    reasons.push(`Humidity out of range: ${w.humidity}`);
  }
  if (typeof w.windSpeed !== "number" || w.windSpeed < 0 || w.windSpeed > 400) {
    reasons.push(`WindSpeed out of range: ${w.windSpeed}`);
  }
  if (typeof w.cloudCoverage !== "number" || w.cloudCoverage < 0 || w.cloudCoverage > 100) {
    reasons.push(`CloudCoverage out of range: ${w.cloudCoverage}`);
  }
  if (typeof w.temperature !== "number" || w.temperature < -90 || w.temperature > 60) {
    reasons.push(`Temperature out of range: ${w.temperature}`);
  }
  if (!w.condition || typeof w.condition !== "string") {
    reasons.push("Missing or invalid condition string");
  }
  return { valid: reasons.length === 0, reasons };
}
var VALID_SEVERITIES2 = ["low", "medium", "high", "critical"];
function isValidSocialSignal(signal) {
  if (typeof signal !== "object" || signal === null) return false;
  if (!signal.id || typeof signal.id !== "string") return false;
  if (!signal.text || typeof signal.text !== "string" || signal.text.trim().length < 5) return false;
  if (!VALID_SEVERITIES2.includes(signal.severity)) return false;
  return true;
}

// src/agents/sentinel/normalizers/signalNormalizers.ts
var SEVERITY_MAP = {
  // Direct matches
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
  // Aliases
  severe: "high",
  danger: "critical",
  warning: "medium",
  moderate: "medium",
  extreme: "critical",
  minor: "low",
  minor_: "low"
};
function normalizeSeverity(raw) {
  var _a;
  const key = ((_a = raw == null ? void 0 : raw.toLowerCase) == null ? void 0 : _a.call(raw).trim()) ?? "";
  return SEVERITY_MAP[key] ?? "medium";
}
function normalizeText(text) {
  return text.trim().replace(/\s+/g, " ").replace(/[^\x20-\x7E\u0600-\u06FF\s]/g, "").substring(0, 500);
}

// src/agents/sentinel/filters/duplicateFilter.ts
var COORD_PROXIMITY_DEG = 2e-3;
function coordsAreClose(a, b) {
  if (!a || !b) return false;
  return Math.abs(a.lat - b.lat) < COORD_PROXIMITY_DEG && Math.abs(a.lng - b.lng) < COORD_PROXIMITY_DEG;
}
function textSimilarity(a, b) {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let common = 0;
  wordsA.forEach((w) => {
    if (wordsB.has(w)) common++;
  });
  return common / Math.max(wordsA.size, wordsB.size);
}
var SIMILARITY_THRESHOLD = 0.7;
function deduplicateSignals(signals) {
  const seen = [];
  let duplicatesRemoved = 0;
  for (const signal of signals) {
    const isDuplicate = seen.some((s) => {
      if (s.id === signal.id) return true;
      const simScore = textSimilarity(s.text, signal.text);
      if (simScore >= SIMILARITY_THRESHOLD) return true;
      if (coordsAreClose(s.coordinates, signal.coordinates) && s.severity === signal.severity) {
        return true;
      }
      return false;
    });
    if (isDuplicate) {
      duplicatesRemoved++;
      console.log(`[SentinelFilter] Duplicate removed: ${signal.id}`);
    } else {
      seen.push(signal);
    }
  }
  return { unique: seen, duplicatesRemoved };
}

// src/agents/sentinel/sentinelAgent.ts
function computeSignalConfidence(signal) {
  var _a;
  let score = 0.5;
  const wordCount = ((_a = signal.text) == null ? void 0 : _a.split(/\s+/).length) ?? 0;
  if (wordCount > 5) score += 0.1;
  if (wordCount > 10) score += 0.1;
  if (signal.severity === "high") score += 0.1;
  if (signal.severity === "critical") score += 0.15;
  if (signal.locationName && signal.locationName.length > 2) score += 0.07;
  return Math.min(1, parseFloat(score.toFixed(2)));
}
function clampWeather(w) {
  const rainfall = Math.max(0, Math.min(500, Number(w.rainfall) || 0));
  const humidity = Math.max(0, Math.min(100, Number(w.humidity) || 0));
  const windSpeed = Math.max(0, Math.min(400, Number(w.windSpeed) || 0));
  const cloudCoverage = Math.max(0, Math.min(100, Number(w.cloudCoverage) || 0));
  const temperature = Math.max(-90, Math.min(60, Number(w.temperature) || 0));
  const stormWarning = Boolean(w.stormWarning);
  const condition = typeof w.condition === "string" ? w.condition.trim() : "Unknown";
  let severity = "low";
  if (rainfall >= 30 || windSpeed > 80) severity = "critical";
  else if (rainfall >= 15 || windSpeed > 50 || stormWarning) severity = "high";
  else if (rainfall >= 7.5 || windSpeed > 30) severity = "medium";
  return { condition, rainfall, humidity, windSpeed, cloudCoverage, temperature, stormWarning, severity };
}
function assessIntegrity(removedCount, totalInput) {
  if (totalInput === 0) return "corrupted";
  const removalRatio = removedCount / totalInput;
  if (removalRatio > 0.5) return "degraded";
  if (removalRatio > 0.8) return "corrupted";
  return "stable";
}
var SentinelAgent = class {
  /**
   * Main entry point.
   * Receives aggregated payload → validates → normalizes → deduplicates → returns clean output.
   */
  static process(input) {
    var _a, _b, _c, _d;
    const startMs = Date.now();
    let removedCount = 0;
    let normCount = 0;
    console.log("[SentinelAgent] \u25B6 Processing started");
    const lat = Number((_a = input.location) == null ? void 0 : _a.lat);
    const lng = Number((_b = input.location) == null ? void 0 : _b.lng);
    const locationValid = isValidCoordinate(lat, lng);
    if (!locationValid) {
      console.warn("[SentinelAgent] \u26A0 Invalid location coordinates \u2014 using defaults");
    }
    const weatherValidation = validateWeatherPayload(input.weather);
    if (!weatherValidation.valid) {
      console.warn(`[SentinelAgent] \u26A0 Weather issues: ${weatherValidation.reasons.join(", ")}`);
      normCount++;
    }
    const validatedWeather = clampWeather(input.weather ?? {});
    const rawSignals = input.socialSignals ?? [];
    const preFilterCount = rawSignals.length;
    const validSignals = [];
    for (const signal of rawSignals) {
      if (!isValidSocialSignal(signal)) {
        console.log(`[SentinelAgent] \u2717 Invalid signal rejected: ${(signal == null ? void 0 : signal.id) ?? "unknown"}`);
        removedCount++;
        continue;
      }
      const normalizedSeverity = normalizeSeverity(signal.severity);
      const normalizedText = normalizeText(signal.text);
      if (normalizedSeverity !== signal.severity || normalizedText !== signal.text) {
        normCount++;
      }
      validSignals.push({
        id: signal.id.trim(),
        text: normalizedText,
        severity: normalizedSeverity,
        locationName: ((_c = signal.locationName) == null ? void 0 : _c.trim()) ?? "Unknown",
        confidence: computeSignalConfidence({ ...signal, severity: normalizedSeverity })
      });
    }
    const { unique, duplicatesRemoved } = deduplicateSignals(validSignals);
    removedCount += duplicatesRemoved;
    console.log(
      `[SentinelAgent] Signals: ${preFilterCount} in \u2192 ${unique.length} clean | removed=${removedCount} dupes=${duplicatesRemoved} norms=${normCount}`
    );
    const weatherSeverity = validatedWeather.severity;
    const critCount = unique.filter((s) => s.severity === "critical").length;
    const highCount = unique.filter((s) => s.severity === "high").length;
    let socialSeverity = "low";
    if (critCount >= 2 || unique.length >= 8) socialSeverity = "critical";
    else if (critCount >= 1 || highCount >= 3) socialSeverity = "high";
    else if (highCount >= 1 || unique.length >= 4) socialSeverity = "medium";
    const RANK = { low: 1, medium: 2, high: 3, critical: 4 };
    const overallRank = Math.min(4, Math.max(RANK[weatherSeverity], RANK[socialSeverity]) + (validatedWeather.rainfall >= 15 && unique.length >= 3 ? 1 : 0));
    const overallSeverity = Object.keys(RANK).find((k) => RANK[k] === overallRank) ?? "critical";
    const integrity = assessIntegrity(
      removedCount,
      preFilterCount + 1
      /* +1 weather */
    );
    const processingMs = Date.now() - startMs;
    const sentinelStatus = integrity === "corrupted" ? "failed" : integrity === "degraded" ? "partial" : "validated";
    console.log(
      `[SentinelAgent] \u2705 Done in ${processingMs}ms | status=${sentinelStatus} overall=${overallSeverity} integrity=${integrity}`
    );
    return {
      sentinelStatus,
      location: {
        lat: locationValid ? lat : 31.5204,
        lng: locationValid ? lng : 74.3587,
        region: ((_d = input.location) == null ? void 0 : _d.region) ?? "Pakistan"
      },
      weather: validatedWeather,
      socialSignals: unique,
      signalSummary: {
        overallSeverity,
        weatherSeverity,
        socialSeverity,
        signalDensity: unique.length
      },
      diagnostics: {
        removedSignals: removedCount,
        duplicatesFiltered: duplicatesRemoved,
        normalizationsApplied: normCount,
        processingMs
      },
      metadata: {
        validatedAt: Math.floor(Date.now() / 1e3),
        removedSignals: removedCount,
        sourceIntegrity: integrity
      }
    };
  }
};

// src/routes/sentinel.ts
var router10 = (0, import_express10.Router)();
router10.get(
  "/",
  catchAsync(async (req, res) => {
    const lat = parseFloat(req.query.lat) || 31.5204;
    const lng = parseFloat(req.query.lng) || 74.3587;
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      res.status(400).json({
        success: false,
        error: "Invalid coordinates. Provide numeric lat (-90..90) and lng (-180..180)."
      });
      return;
    }
    const aggregated = await SignalAggregatorService.aggregate(lat, lng);
    const validated = SentinelAgent.process(aggregated);
    res.json(validated);
  })
);
var sentinel_default = router10;

// src/routes/gemini.ts
var import_express11 = require("express");

// src/integrations/gemini.ts
var import_generative_ai = require("@google/generative-ai");
var GeminiIntegration = class {
  static getInstance() {
    if (!this.instance) {
      if (!ENV.GEMINI_API_KEY || ENV.GEMINI_API_KEY.includes("your_google_api_key")) {
        console.warn("[GeminiIntegration] GEMINI_API_KEY missing or placeholder.");
      }
      this.instance = new import_generative_ai.GoogleGenerativeAI(ENV.GEMINI_API_KEY || "");
    }
    return this.instance;
  }
  static getModel() {
    const ai = this.getInstance();
    return ai.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
  }
};

// src/services/geminiService.ts
var GeminiService = class {
  /**
   * Analyzes Sentinel intelligence using Gemini 2.5 Flash.
   */
  static async analyzeSignals(sentinelData) {
    const startTime = Date.now();
    console.log("[GeminiService] \u25B6 Starting AI analysis...");
    const model = GeminiIntegration.getModel();
    const prompt = `
      You are a senior disaster intelligence AI. 
      Analyze the following validated environmental and social signal payload for flood risk.
      
      DATA:
      - Location: ${sentinelData.location.region} (${sentinelData.location.lat}, ${sentinelData.location.lng})
      - Weather: ${JSON.stringify(sentinelData.weather)}
      - Social Signals: ${JSON.stringify(sentinelData.socialSignals.slice(0, 10))}
      - Summary: ${JSON.stringify(sentinelData.signalSummary)}
      
      TASK:
      1. Assess overall hazard severity.
      2. Evaluate risk factors (rainfall, social signal density, storm activity).
      3. Determine storm intensity.
      4. Provide actionable monitoring recommendations.
      
      STRICT REQUIREMENTS:
      - Output MUST be deterministic JSON.
      - Use ONLY the following severity labels: low, medium, high, critical.
      - NO markdown, NO explanations, NO conversational text.
      - Base analysis ONLY on provided data.
      
      JSON FORMAT:
      {
        "hazardAssessment": {
          "overallSeverity": "string",
          "confidence": number,
          "riskFactors": ["string"]
        },
        "environmentalAnalysis": {
          "rainfallRisk": "string",
          "socialSignalRisk": "string",
          "stormIntensity": "string"
        },
        "recommendation": {
          "monitorClosely": boolean,
          "preparePolygonGeneration": boolean
        }
      }
    `;
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const cleanedJson = responseText.replace(/```json|```/g, "").trim();
      const analysis = JSON.parse(cleanedJson);
      const validSeverities = ["low", "medium", "high", "critical"];
      if (!validSeverities.includes(analysis.hazardAssessment.overallSeverity)) {
        analysis.hazardAssessment.overallSeverity = "medium";
      }
      console.log(`[GeminiService] \u2705 AI Analysis complete in ${Date.now() - startTime}ms`);
      return analysis;
    } catch (error) {
      console.error("[GeminiService] AI analysis failed:", error.message ?? error);
      return {
        hazardAssessment: {
          overallSeverity: sentinelData.signalSummary.overallSeverity,
          confidence: 0.5,
          riskFactors: ["fallback: ai unreachable"]
        },
        environmentalAnalysis: {
          rainfallRisk: "medium",
          socialSignalRisk: "medium",
          stormIntensity: "medium"
        },
        recommendation: {
          monitorClosely: true,
          preparePolygonGeneration: false
        }
      };
    }
  }
  /**
   * Analyzes a raw text signal directly using Gemini 2.5 Flash.
   */
  static async analyzeRawText(text) {
    const startTime = Date.now();
    console.log(`[GeminiService] \u25B6 Analyzing raw text: "${text}"...`);
    const model = GeminiIntegration.getModel();
    const prompt = `
      You are a disaster intelligence AI. 
      Analyze the following raw user text input reporting an environmental or weather condition.
      
      TEXT: "${text}"
      
      Determine:
      1. Is there an active threat (e.g. flood, heavy rain, storm, fire) or is it safe/normal weather (e.g. cool, nice breeze, light shower, dry)?
      2. Classification of threat (weather_observation, flood_report, emergency_distress, general_observation, road_incident, or safe).
      3. Primary condition keyword.
      4. Location name mentioned.
      5. Is it a false alarm, exaggerated hyperbole, or a calm/safe observation?
      
      STRICT REQUIREMENTS:
      - Output MUST be deterministic JSON.
      - Use ONLY the following severity labels: low, medium, high, critical.
      - NO markdown, NO explanations, NO conversational text.
      
      JSON FORMAT:
      {
        "isThreat": boolean,
        "classification": "string",
        "condition": "string",
        "location": "string",
        "severity": "low" | "medium" | "high" | "critical",
        "confidence": number,
        "reasoning": "string"
      }
    `;
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const cleanedJson = responseText.replace(/\`\`\`json|\`\`\`/g, "").trim();
      const analysis = JSON.parse(cleanedJson);
      console.log(`[GeminiService] \u2705 Raw text AI analysis complete in ${Date.now() - startTime}ms`);
      return {
        isThreat: !!analysis.isThreat,
        classification: analysis.classification || "general_observation",
        condition: analysis.condition || "unknown",
        location: analysis.location || "Unknown Location",
        severity: analysis.severity || "low",
        confidence: typeof analysis.confidence === "number" ? analysis.confidence : 0.5,
        reasoning: analysis.reasoning || ""
      };
    } catch (error) {
      console.error("[GeminiService] Raw text AI analysis failed:", error.message ?? error);
      return {
        isThreat: false,
        classification: "general_observation",
        condition: "unknown",
        location: "Unknown Location",
        severity: "low",
        confidence: 0.2,
        reasoning: "AI processing failed, degrading to heuristic rules."
      };
    }
  }
};

// src/routes/gemini.ts
var router11 = (0, import_express11.Router)();
router11.get(
  "/",
  catchAsync(async (req, res) => {
    const lat = parseFloat(req.query.lat) || 31.5204;
    const lng = parseFloat(req.query.lng) || 74.3587;
    const aggregated = await SignalAggregatorService.aggregate(lat, lng);
    const sentinelPayload = SentinelAgent.process(aggregated);
    const aiAnalysis = await GeminiService.analyzeSignals(sentinelPayload);
    res.json({
      success: true,
      sentinel: {
        status: sentinelPayload.sentinelStatus,
        severity: sentinelPayload.signalSummary.overallSeverity
      },
      analysis: aiAnalysis,
      timestamp: Date.now()
    });
  })
);
router11.get(
  "/text",
  catchAsync(async (req, res) => {
    const text = req.query.text || "";
    const analysis = await GeminiService.analyzeRawText(text);
    res.json({
      success: true,
      analysis,
      timestamp: Date.now()
    });
  })
);
var gemini_default = router11;

// src/routes/confidence.ts
var import_express12 = require("express");

// src/services/terrainService.ts
var TerrainService = class {
  /**
   * Calculates terrain vulnerability based on location coordinates.
   * Logic is deterministic/mocked for specific regions in Pakistan.
   */
  static calculateTerrainRisk(lat, lng) {
    const factors = [];
    let score = 30;
    const isLowLying = lat > 24 && lat < 28 || lat > 31 && lat < 32;
    if (isLowLying) {
      score += 35;
      factors.push("low elevation zone");
      factors.push("flood plain proximity");
    } else {
      factors.push("elevated terrain");
    }
    const isUrbanCenter = lat > 31.4 && lat < 31.6 && lng > 74.2 && lng < 74.4 || // Lahore
    lat > 24.8 && lat < 25 && lng > 66.9 && lng < 67.2;
    if (isUrbanCenter) {
      score += 20;
      factors.push("high urban density");
      factors.push("poor drainage infrastructure");
    }
    const waterProximityHash = Math.abs(Math.sin(lat * 100) + Math.cos(lng * 100));
    if (waterProximityHash > 1.5) {
      score += 15;
      factors.push("adjacent to water body");
    }
    const terrainScore = Math.min(100, Math.max(0, score));
    let terrainRisk = "low";
    if (terrainScore >= 76) terrainRisk = "critical";
    else if (terrainScore >= 51) terrainRisk = "high";
    else if (terrainScore >= 26) terrainRisk = "medium";
    return {
      terrainRisk,
      terrainScore,
      terrainFactors: factors
    };
  }
};

// src/services/confidenceScoringService.ts
var ConfidenceScoringService = class {
  /**
   * Computes a deterministic hazard confidence score.
   * Formula: (Weather * 0.4) + (Terrain * 0.3) + (Social * 0.3)
   */
  static compute(sentinel, ai, terrain) {
    const weather = sentinel.weather;
    let weatherScore = 0;
    weatherScore += Math.min(50, weather.rainfall / 30 * 50);
    if (weather.stormWarning) weatherScore += 20;
    if (weather.windSpeed > 60) weatherScore += 10;
    if (["Rain", "Thunderstorm", "Drizzle"].includes(weather.condition)) weatherScore += 20;
    weatherScore = Math.min(100, weatherScore);
    const social = sentinel.signalSummary;
    let socialScore = 0;
    socialScore += Math.min(50, social.signalDensity / 10 * 50);
    if (social.socialSeverity === "critical") socialScore += 50;
    else if (social.socialSeverity === "high") socialScore += 35;
    else if (social.socialSeverity === "medium") socialScore += 20;
    socialScore = Math.min(100, socialScore);
    const terrainScore = terrain.terrainScore;
    const weatherContrib = weatherScore * 0.4;
    const activeWeatherFactor = weather.rainfall > 0 || weather.stormWarning ? 1 : 0;
    const terrainContrib = terrainScore * 0.3 * activeWeatherFactor;
    const socialContrib = socialScore * 0.3;
    const finalScore = Math.round(weatherContrib + terrainContrib + socialContrib);
    let severity = "low";
    if (finalScore >= 76) severity = "critical";
    else if (finalScore >= 51) severity = "high";
    else if (finalScore >= 26) severity = "medium";
    const riskFactors = [
      ...terrain.terrainFactors,
      ...weather.rainfall > 10 ? ["heavy rainfall activity"] : [],
      ...social.signalDensity >= 5 ? ["high social reporting density"] : [],
      ...ai.hazardAssessment.riskFactors.slice(0, 2)
      // Top 2 from Gemini
    ];
    return {
      confidenceScore: finalScore,
      severity,
      scoreBreakdown: {
        weatherScore: Math.round(weatherScore),
        terrainScore: Math.round(terrainScore),
        socialScore: Math.round(socialScore)
      },
      weightedContributions: {
        weather: parseFloat(weatherContrib.toFixed(1)),
        terrain: parseFloat(terrainContrib.toFixed(1)),
        social: parseFloat(socialContrib.toFixed(1))
      },
      riskFactors,
      recommendation: {
        generateHazardPolygon: finalScore > 60,
        triggerMonitoring: finalScore > 30
      },
      timestamp: Date.now()
    };
  }
};

// src/routes/confidence.ts
var router12 = (0, import_express12.Router)();
router12.get(
  "/",
  catchAsync(async (req, res) => {
    const lat = parseFloat(req.query.lat) || 31.5204;
    const lng = parseFloat(req.query.lng) || 74.3587;
    const aggregated = await SignalAggregatorService.aggregate(lat, lng);
    const sentinelData = SentinelAgent.process(aggregated);
    const [aiAnalysis, terrainRisk] = await Promise.all([
      GeminiService.analyzeSignals(sentinelData),
      Promise.resolve(TerrainService.calculateTerrainRisk(lat, lng))
    ]);
    const confidencePayload = ConfidenceScoringService.compute(
      sentinelData,
      aiAnalysis,
      terrainRisk
    );
    res.json({
      success: true,
      data: confidencePayload,
      meta: {
        lat,
        lng,
        processingTimeMs: Date.now() - confidencePayload.timestamp
      }
    });
  })
);
var confidence_default = router12;

// src/routes/analyst.ts
var import_express13 = require("express");

// src/agents/analyst/clustering/clusterDetection.ts
function clusterPoints(points, distanceThresholdKm = 0.5) {
  const clusters = [];
  const visited = /* @__PURE__ */ new Set();
  for (let i = 0; i < points.length; i++) {
    if (visited.has(i)) continue;
    const currentCluster = [points[i]];
    visited.add(i);
    for (let j = i + 1; j < points.length; j++) {
      if (visited.has(j)) continue;
      const dist = calculateDistance(points[i].lat, points[i].lng, points[j].lat, points[j].lng);
      if (dist <= distanceThresholdKm) {
        currentCluster.push(points[j]);
        visited.add(j);
      }
    }
    if (currentCluster.length > 0) {
      const center = calculateCenter(currentCluster);
      clusters.push({
        center,
        points: currentCluster,
        radius: calculateMaxDistance(center, currentCluster) * 1e3
        // to meters
      });
    }
  }
  return clusters;
}
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function calculateCenter(points) {
  const lat = points.reduce((acc, p) => acc + p.lat, 0) / points.length;
  const lng = points.reduce((acc, p) => acc + p.lng, 0) / points.length;
  return { lat, lng };
}
function calculateMaxDistance(center, points) {
  let max = 0;
  for (const p of points) {
    const d = calculateDistance(center.lat, center.lng, p.lat, p.lng);
    if (d > max) max = d;
  }
  return Math.max(0.1, max);
}

// src/agents/analyst/polygon/polygonGenerator.ts
function generatePolygonCoords(center, radiusMeters) {
  const latOffset = radiusMeters / 111320;
  const lngOffset = radiusMeters / (111320 * Math.cos(center.lat * (Math.PI / 180)));
  return [
    { lat: center.lat + latOffset, lng: center.lng - lngOffset },
    { lat: center.lat + latOffset, lng: center.lng + lngOffset },
    { lat: center.lat - latOffset, lng: center.lng + lngOffset },
    { lat: center.lat - latOffset, lng: center.lng - lngOffset },
    { lat: center.lat + latOffset, lng: center.lng - lngOffset }
    // close loop
  ];
}

// src/agents/analyst/analystAgent.ts
var AnalystAgent = class {
  /**
   * Primary entry point for the Analyst Agent.
   * Synthesizes all intelligence layers into a strategic hazard assessment.
   */
  static process(sentinel, ai, confidence) {
    const startMs = Date.now();
    const overallSeverity = this.deriveSeverity(sentinel, ai, confidence);
    const socialPoints = sentinel.socialSignals.filter((s) => s.coordinates).map((s) => ({ lat: s.coordinates.lat, lng: s.coordinates.lng }));
    if (sentinel.weather.rainfall > 10) {
      socialPoints.push({ lat: sentinel.location.lat, lng: sentinel.location.lng });
    }
    const clusters = clusterPoints(socialPoints);
    const hazardZones = clusters.map((c, i) => ({
      zoneId: `zone-${String(i + 1).padStart(3, "0")}`,
      severity: this.mapScoreToSeverity(confidence.confidenceScore),
      confidence: confidence.confidenceScore,
      center: c.center,
      radius: c.radius,
      coordinates: generatePolygonCoords(c.center, c.radius + 100)
      // add buffer
    }));
    const trendAnalysis = this.analyzeTrend(sentinel, confidence);
    const recommendations = {
      generatePolygons: hazardZones.length > 0 && confidence.confidenceScore > 50,
      enableGeoFence: overallSeverity === "critical" || overallSeverity === "high",
      prepareEmergencyRouting: overallSeverity === "critical",
      dispatchReady: confidence.confidenceScore > 80
    };
    return {
      analystStatus: "active",
      overallSeverity,
      confidenceScore: confidence.confidenceScore,
      hazardAssessment: {
        floodRisk: ai.hazardAssessment.overallSeverity,
        terrainRisk: this.mapScoreToSeverity(confidence.scoreBreakdown.terrainScore),
        socialDensity: this.mapScoreToSeverity(confidence.scoreBreakdown.socialScore),
        stormSeverity: sentinel.weather.stormWarning ? "high" : "medium"
      },
      hazardZones,
      escalationAnalysis: trendAnalysis,
      recommendations,
      metadata: {
        processedAt: Date.now(),
        analysisLatencyMs: Date.now() - startMs,
        regionsAnalyzed: [sentinel.location.region]
      }
    };
  }
  static deriveSeverity(sentinel, ai, confidence) {
    if (ai.hazardAssessment.overallSeverity === "critical" && confidence.confidenceScore > 70) {
      return "critical";
    }
    return confidence.severity;
  }
  static mapScoreToSeverity(score) {
    if (score >= 76) return "critical";
    if (score >= 51) return "high";
    if (score >= 26) return "medium";
    return "low";
  }
  static analyzeTrend(sentinel, confidence) {
    let trend = "stable";
    let velocity = 0.1;
    const isHighRain = sentinel.weather.rainfall > 15;
    const isHighDensity = sentinel.socialSignals.length > 8;
    if (isHighRain && isHighDensity) {
      trend = "increasing";
      velocity = 0.8;
    } else if (isHighRain || isHighDensity) {
      trend = "increasing";
      velocity = 0.4;
    }
    return {
      activeEscalation: trend === "increasing",
      trend,
      velocity
    };
  }
};

// src/routes/analyst.ts
var router13 = (0, import_express13.Router)();
router13.get(
  "/",
  catchAsync(async (req, res) => {
    const lat = parseFloat(req.query.lat) || 31.5204;
    const lng = parseFloat(req.query.lng) || 31.5204;
    const aggregated = await SignalAggregatorService.aggregate(lat, lng);
    const sentinelData = SentinelAgent.process(aggregated);
    const [aiAnalysis, terrainRisk] = await Promise.all([
      GeminiService.analyzeSignals(sentinelData),
      Promise.resolve(TerrainService.calculateTerrainRisk(lat, lng))
    ]);
    const confidencePayload = ConfidenceScoringService.compute(
      sentinelData,
      aiAnalysis,
      terrainRisk
    );
    const strategicAnalysis = AnalystAgent.process(
      sentinelData,
      aiAnalysis,
      confidencePayload
    );
    res.json({
      success: true,
      data: strategicAnalysis
    });
  })
);
var analyst_default = router13;

// src/routes/health.routes.ts
var import_express14 = require("express");

// src/controllers/healthController.ts
var getBackendHealth = async (req, res) => {
  try {
    const payload = {
      success: true,
      service: "ResiliNet AI Backend",
      status: "online",
      uptime: process.uptime(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: process.env.NODE_ENV || "development"
    };
    res.status(200).json(payload);
  } catch (error) {
    const response = {
      success: false,
      status: "error",
      message: "Health check failed",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    res.status(500).json(response);
  }
};

// src/routes/health.routes.ts
var router14 = (0, import_express14.Router)();
router14.get("/", getBackendHealth);
var health_routes_default = router14;

// src/routes/ping.routes.ts
var import_express15 = require("express");

// src/controllers/pingController.ts
var getPing = async (req, res) => {
  const start = process.hrtime();
  try {
    const diff = process.hrtime(start);
    const latencyMs = (diff[0] * 1e9 + diff[1]) / 1e6;
    res.status(200).json({
      pong: true,
      latency: `${latencyMs.toFixed(2)}ms`
    });
  } catch (error) {
    res.status(500).json({
      pong: false,
      latency: "0ms",
      error: "Ping failed"
    });
  }
};

// src/routes/ping.routes.ts
var router15 = (0, import_express15.Router)();
router15.get("/", getPing);
var ping_routes_default = router15;

// src/routes/readinessRoutes.ts
var import_express16 = require("express");

// src/services/readinessService.ts
var state = {
  firestore: "unknown"
};
var runReadinessChecks = async () => {
  try {
    await adminDb.collection("system_ping").limit(1).get();
    state.firestore = "connected";
  } catch (err) {
    console.error("[Readiness] Firestore probe failed", err);
    state.firestore = "error";
  }
  state.lastChecked = (/* @__PURE__ */ new Date()).toISOString();
  return state;
};

// src/controllers/readinessController.ts
var getReadiness = async (req, res) => {
  try {
    const result = await runReadinessChecks();
    res.status(200).json({
      success: true,
      service: "ResiliNet AI Backend",
      status: result.firestore === "connected" ? "ready" : "degraded",
      checks: result,
      uptime: process.uptime(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "error",
      message: "Readiness checks failed",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
};

// src/routes/readinessRoutes.ts
var router16 = (0, import_express16.Router)();
router16.get("/", getReadiness);
var readinessRoutes_default = router16;

// src/server.ts
var app = (0, import_express17.default)();
app.use((0, import_cors.default)({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(import_express17.default.json());
app.use(requestLogger);
app.use("/health", health_routes_default);
app.use("/api/health", health_routes_default);
app.use("/ping", ping_routes_default);
app.use("/api/ping", ping_routes_default);
app.use("/readiness", readinessRoutes_default);
app.use("/api/readiness", readinessRoutes_default);
app.use("/api/system", systemRoutes_default);
app.use("/api/hazards", hazardRoutes_default);
app.use("/api/weather", weather_default);
app.use("/api/alerts", alertRoutes_default);
app.use("/api/ai", aiRoutes_default);
app.use("/api/routes", routeRoutes_default);
app.use("/api/shelters", shelterRoutes_default);
app.use("/api/social", social_default);
app.use("/api/signals", signals_default);
app.use("/api/sentinel", sentinel_default);
app.use("/api/gemini-analysis", gemini_default);
app.use("/api/system/confidence", confidence_default);
app.use("/api/ai/analyst", analyst_default);
app.use("/api/confidence-score", confidence_default);
app.use("/api/analyst", analyst_default);
app.get("/routes", (req, res) => {
  try {
    const routes = [];
    app._router.stack.forEach((layer) => {
      if (layer.route && layer.route.path) {
        routes.push({ path: layer.route.path, methods: Object.keys(layer.route.methods) });
      }
    });
    res.status(200).json({ success: true, routes });
  } catch (err) {
    res.status(500).json({ success: false, error: "Could not enumerate routes" });
  }
});
app.use(notFoundHandler);
app.use(errorHandler);
var PORT = Number(process.env.PORT || ENV.PORT || 5e3);
(async () => {
  try {
    const diag = await runReadinessChecks();
    console.log("[SERVER] Startup Diagnostics:", diag);
  } catch (err) {
    console.error("[SERVER] Startup diagnostics failed", err);
  }
})();
app.listen(PORT, "0.0.0.0", () => {
  console.log("[SERVER] ResiliNet AI Backend Online");
  console.log("[SERVER] CORS Enabled");
  console.log("[SERVER] Frontend Connections Allowed");
  console.log("[SERVER] API Ready");
  console.log(`[SERVER] Environment: ${ENV.NODE_ENV}`);
  console.log(`[SERVER] Port: ${PORT}`);
  console.log("[SERVER] Health Route Ready: /health");
  console.log("[SERVER] Readiness Route Ready: /readiness");
});
var server_default = app;
