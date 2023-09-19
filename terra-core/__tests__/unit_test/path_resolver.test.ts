import fs from "fs";

import path from "path";

import os from 'os';

import { requireModule, resolveModulePath, resolvePath } from "../../src/path_resolver";



describe("path_resolver", () => {
  const originalEnv = process.env;

  let tmpDir: string = "";
  let tmpPackageJsonPath: string = "";
  let tmpNodeModulesDir: string = "";

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'terra-ut-'));
    tmpPackageJsonPath = path.join(tmpDir, "package.json");

    tmpNodeModulesDir = path.join(tmpDir, "node_modules");

    fs.mkdirSync(tmpNodeModulesDir);

    jest.resetModules();
    process.env = {
      ...originalEnv,
      npm_package_json: tmpPackageJsonPath,
    };
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    process.env = originalEnv;
  });

  describe("resolvePath", () => {
    it("can resolve absolute path", () => {
      expect(resolvePath("/a/b/c")).toEqual("/a/b/c");
    });

    it("can resolve absolute path with prefix", () => {
      expect(resolvePath("/a/b/c", "/d/e/f")).toEqual("/a/b/c");
    });

    it("can resolve relative path", () => {
      expect(resolvePath("a/b/c")).toEqual(path.resolve("a/b/c"));
    });

    it("can resolve relative path with prefix", () => {
      expect(resolvePath("a/b/c", "/d/e/f")).toEqual("/d/e/f/a/b/c");
    });

    it("can resolve path with package schema", () => {
      fs.mkdirSync(path.join(tmpNodeModulesDir, "aaa"));

      let res = resolvePath("aaa:index.ts");

      let expectRes = path.join(tmpNodeModulesDir, "aaa", "index.ts");

      expect(res).toEqual(expectRes);
    });
  });

  describe("resolveModulePath", () => {
    it("can resolve module path", () => {
      fs.mkdirSync(path.join(tmpNodeModulesDir, "aaa"));

      let res = resolveModulePath("aaa");

      let expectRes = path.join(tmpNodeModulesDir, "aaa");

      expect(res).toEqual(expectRes);
    });
  });

  describe("requireModule", () => {
    it("can require module", () => {
      let testPackageDir = path.join(tmpNodeModulesDir, "aaa");
      fs.mkdirSync(testPackageDir);

      let testPackageJsonPath = path.join(testPackageDir, "package.json");
      let testPackageJsonContent = `
{
  "version": "0.1.2",
  "main": "index.js"
}
`;
      fs.writeFileSync(testPackageJsonPath, testPackageJsonContent);

      let testPackageIndexJsPath = path.join(testPackageDir, "index.js");
      let testPackageIndexJsContent = `
module.exports = "aaa";
`;

      fs.writeFileSync(testPackageIndexJsPath, testPackageIndexJsContent);


      let res = requireModule("aaa");

      expect(res).toEqual("aaa");
    });
  });
});


