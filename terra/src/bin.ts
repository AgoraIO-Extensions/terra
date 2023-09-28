import * as cli from './cli/cli_main';

const args = process.argv.slice(2);

if (args.length < 1) {
  console.log(
    `Usage: 
1. npm exec terra -- render-legacy --config=<config-file-path> --output-dir=<output-dir>
2. npm exec terra -- render --config=<config-file-path> --output-dir=<output-dir>`
  );
  process.exit(1);
}

console.log(args);
cli.run();
