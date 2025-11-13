/**
 * Feature Response Integration Test
 * Response handling tests
 *
 * Test scenarios:
 * 1. Normal case: Send response in 900-respond
 * 2. Error case: Feature completes without response → error occurs
 * 3. Early response: Send response in intermediate Step → remaining Steps do not execute
 * 4. Status Code modification
 * 5. Various response formats
 */

import numflow from "../../src/index";
import { Application } from "../../src/application";
import http from "http";

jest.setTimeout(10000);

describe("Feature Response Integration", () => {
  let app: Application;
  let server: http.Server | null = null;

  afterEach(async () => {
    if (server && server.listening) {
      server.closeAllConnections?.();
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), 2000);
        server!.close(() => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
    server = null;
    app = null as any;
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  /**
   * Test 1: Normal case - Send response in 900-respond
   */
  it("should respond successfully when 900-respond step sends response", async () => {
    app = numflow();

    app.use(
      numflow.feature({
        method: "GET",
        path: "/api/with-response",
        steps: "./test/__fixtures__/feature-response/with-response",
      })
    );

    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(
        () => reject(new Error("Test timeout")),
        5000
      );

      server = app.listen(0, () => {
        const port = (server!.address() as any).port;
        const options = {
          hostname: "localhost",
          port,
          path: "/api/with-response",
          method: "GET",
        };

        const req = http.request(options, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            try {
              expect(res.statusCode).toBe(200);
              const body = JSON.parse(data);
              expect(body.success).toBe(true);
              expect(body.data.processedData).toBe("test-data");
              expect(body.data.timestamp).toBeDefined();
              clearTimeout(timeoutId);
              resolve();
            } catch (error) {
              clearTimeout(timeoutId);
              reject(error);
            }
          });
        });

        req.on("error", (err) => {
          clearTimeout(timeoutId);
          reject(err);
        });
        req.end();
      });
    });
  });

  /**
   * Test 2: Error case - Feature completes without response
   */
  it("should throw error when no response is sent", async () => {
    app = numflow();

    app.use(
      numflow.feature({
        method: "GET",
        path: "/api/without-response",
        steps: "./test/__fixtures__/feature-response/without-response",
      })
    );

    return new Promise<void>((resolve, reject) => {
      server = app.listen(0, () => {
        const port = (server!.address() as any).port;
        const options = {
          hostname: "localhost",
          port,
          path: "/api/without-response",
          method: "GET",
        };

        const req = http.request(options, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            try {
              // Error response should be sent
              expect(res.statusCode).toBe(500);
              const body = JSON.parse(data);
              expect(body.error).toBeDefined();
              expect(body.error.message).toContain(
                "Feature completed without sending a response"
              );
              expect(body.error.statusCode).toBe(500);
              resolve();
            } catch (error) {
              reject(error);
            }
          });
        });

        req.on("error", reject);
        req.end();
      });

      setTimeout(() => reject(new Error("Test timeout")), 5000).unref();
    });
  });

  /**
   * Test 3: Early response - Send response in intermediate Step (fail=false)
   */
  it("should execute all steps when validation passes", async () => {
    app = numflow();

    app.use(
      numflow.feature({
        method: "GET",
        path: "/api/early-response",
        steps: "./test/__fixtures__/feature-response/early-response",
      })
    );

    return new Promise<void>((resolve, reject) => {
      server = app.listen(0, () => {
        const port = (server!.address() as any).port;
        const options = {
          hostname: "localhost",
          port,
          path: "/api/early-response?fail=false",
          method: "GET",
        };

        const req = http.request(options, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            try {
              expect(res.statusCode).toBe(200);
              const body = JSON.parse(data);
              expect(body.success).toBe(true);
              expect(body.data.validated).toBe(true);
              expect(body.data.processed).toBe(true);
              expect(body.data.step200Executed).toBe(true);
              resolve();
            } catch (error) {
              reject(error);
            }
          });
        });

        req.on("error", reject);
        req.end();
      });

      setTimeout(() => reject(new Error("Test timeout")), 5000).unref();
    });
  });

  /**
   * Test 4: Early response - Send response in intermediate Step (fail=true)
   * Remaining Steps should not execute
   */
  it("should stop execution when early response is sent", async () => {
    app = numflow();

    app.use(
      numflow.feature({
        method: "GET",
        path: "/api/early-response",
        steps: "./test/__fixtures__/feature-response/early-response",
      })
    );

    return new Promise<void>((resolve, reject) => {
      server = app.listen(0, () => {
        const port = (server!.address() as any).port;
        const options = {
          hostname: "localhost",
          port,
          path: "/api/early-response?fail=true",
          method: "GET",
        };

        const req = http.request(options, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            try {
              // Early response (400)
              expect(res.statusCode).toBe(400);
              const body = JSON.parse(data);
              expect(body.success).toBe(false);
              expect(body.error).toBe("Validation failed");

              // Steps 200 and 900 did not execute, so their data should be absent
              expect(body.data?.processed).toBeUndefined();
              expect(body.data?.step200Executed).toBeUndefined();

              resolve();
            } catch (error) {
              reject(error);
            }
          });
        });

        req.on("error", reject);
        req.end();
      });

      setTimeout(() => reject(new Error("Test timeout")), 5000).unref();
    });
  });

  /**
   * Test 5: Status Code modification
   */
  it("should support custom status codes (201 Created)", async () => {
    app = numflow();

    // Use file-based feature
    app.use(
      numflow.feature({
        method: "POST",
        path: "/api/create",
        steps: "./test/fixtures/feature-response-test/create-201/steps",
      })
    );

    return new Promise<void>((resolve, reject) => {
      server = app.listen(0, () => {
        const port = (server!.address() as any).port;
        const options = {
          hostname: "localhost",
          port,
          path: "/api/create",
          method: "POST",
        };

        const req = http.request(options, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            try {
              expect(res.statusCode).toBe(201);
              const body = JSON.parse(data);
              expect(body.success).toBe(true);
              expect(body.data.created).toBe(true);
              resolve();
            } catch (error) {
              reject(error);
            }
          });
        });

        req.on("error", reject);
        req.end();
      });

      setTimeout(() => reject(new Error("Test timeout")), 5000).unref();
    });
  });

  /**
   * Test 6: HTML response
   */
  it("should support HTML response", async () => {
    app = numflow();

    // Use file-based feature
    app.use(
      numflow.feature({
        method: "GET",
        path: "/api/html",
        steps: "./test/fixtures/feature-response-test/html-response/steps",
      })
    );

    return new Promise<void>((resolve, reject) => {
      server = app.listen(0, () => {
        const port = (server!.address() as any).port;
        const options = {
          hostname: "localhost",
          port,
          path: "/api/html",
          method: "GET",
        };

        const req = http.request(options, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            try {
              expect(res.statusCode).toBe(200);
              expect(res.headers["content-type"]).toContain("text/html");
              expect(data).toBe("<h1>Hello World</h1>");
              resolve();
            } catch (error) {
              reject(error);
            }
          });
        });

        req.on("error", reject);
        req.end();
      });

      setTimeout(() => reject(new Error("Test timeout")), 5000).unref();
    });
  });

  /**
   * Test 7: Plain Text response
   */
  it("should support plain text response", async () => {
    app = numflow();

    // Use file-based feature
    app.use(
      numflow.feature({
        method: "GET",
        path: "/api/text",
        steps: "./test/fixtures/feature-response-test/text-response/steps",
      })
    );

    return new Promise<void>((resolve, reject) => {
      server = app.listen(0, () => {
        const port = (server!.address() as any).port;
        const options = {
          hostname: "localhost",
          port,
          path: "/api/text",
          method: "GET",
        };

        const req = http.request(options, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            try {
              expect(res.statusCode).toBe(200);
              expect(res.headers["content-type"]).toContain("text/plain");
              expect(data).toBe("Plain text response");
              resolve();
            } catch (error) {
              reject(error);
            }
          });
        });

        req.on("error", reject);
        req.end();
      });

      setTimeout(() => reject(new Error("Test timeout")), 5000).unref();
    });
  });
});
