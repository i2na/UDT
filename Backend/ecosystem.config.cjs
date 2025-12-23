module.exports = {
  apps: [
    {
      name: "udt-core",
      cwd: "./core",
      script: "node_modules/.bin/tsx",
      args: "watch src/index.ts",
      env: {
        PORT: 3000,
      },
    },
    {
      name: "modbus-adapter",
      cwd: "./adapters/modbus",
      script: "node_modules/.bin/tsx",
      args: "watch src/index.ts",
      env: {
        PORT: 5001,
      },
    },
    {
      name: "bacnet-adapter",
      cwd: "./adapters/bacnet",
      script: "app.py",
      interpreter: "python3",
      env: {
        PORT: 5002,
      },
    },
  ],
};
