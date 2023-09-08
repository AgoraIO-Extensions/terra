import { execSync } from 'child_process';
import path from 'path';

// import { getAppRootPath } from '@agoraio-extensions/terra-core';

export class IrisDocScript {
  private irisDocDir: string;

  constructor() {
    this.irisDocDir = '';
    // this.irisDocDir = path.join(
    //   getAppRootPath(),
    //   '..',
    //   'third_party',
    //   'iris-doc'
    // );
  }

  getIrisDocDir(): string {
    return this.irisDocDir;
  }

  run(
    fmtConfigPath: string,
    exportFilePath: string,
    templateUrl: string
  ): void {
    let requirementsPath = path.join(this.irisDocDir, 'requirements.txt');
    let installRequirements = `python3 -m pip install -r ${requirementsPath}`;
    const installRequirementsOut = execSync(installRequirements, {
      encoding: 'utf8',
    });
    console.log(installRequirementsOut);

    let irisDocScriptPath = path.join(this.irisDocDir, 'iris_doc.py');
    let irisDocScript = `python3 ${irisDocScriptPath} --config=${fmtConfigPath} --language=dart --export-file-path=${exportFilePath} --template-url=${templateUrl}`;

    execSync(irisDocScript, { encoding: 'utf8', stdio: 'inherit' });
  }
}
