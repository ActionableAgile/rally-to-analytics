import * as fs from 'fs';
import * as ProgressBar from 'progress';
import { safeLoad, safeDump } from 'js-yaml';
import { argv } from 'yargs';
import RallyExtractor from './extractor';

const defaultYamlPath = 'config.yaml';
const defaultOutputPath = 'output.csv';

const bar = new ProgressBar('  Extracting: [:bar] :percent | :eta seconds remaining', {
  complete: '=',
  incomplete: ' ',
  width: 20,
  total: 100,
});

const getArgs = () => argv;

const log = (main?: any, ...additionalParams: any[]) => console.log(main, ...additionalParams);

const writeFile = (filePath: string, data: any) =>
  new Promise((accept, reject) => fs.writeFile(filePath, data, (err => err ? reject(err) : accept())));

const run = async function(cliArgs: any): Promise<void> {
  log('ActionableAgile Extraction Tool Starting...');

  const rallyConfigPath: string = cliArgs.i ? cliArgs.i : defaultYamlPath;
  const outputPath: string = cliArgs.o ? cliArgs.o : defaultOutputPath;
  const outputType: string = outputPath.split('.')[1].toUpperCase();
  if (outputType !== 'CSV') {
    throw new Error('Only CSV is supported for file output for the Trello beta');
  }
  // Parse YAML settings
  let settings: any  = {};
  try {
    const yamlConfig = safeLoad(fs.readFileSync(rallyConfigPath, 'utf8'));
    settings = yamlConfig;
  } catch (e) {
    log(`Error parsing settings ${e}`);
    throw e;
  }
  log('Beginning extraction process');

  if (!settings.Username) throw new Error('Rally Username not set!');
  if (!settings.Password) throw new Error('Rally Password not set!');
  if (!settings.ProjectId) throw new Error('Rally ProjectId not set!');
  if (!settings.WorkflowId) throw new Error('Rally WorkflowId not set!');

  const rallyExtractor = new RallyExtractor({
    username: settings.Username,
    password: settings.Password,
    workflow: settings.Workflow,
  });
  
  const output: string = await rallyExtractor.extract({
    workflowId: settings.WorkflowId,
    projectId: settings.ProjectId,
  });

  try {
    await writeFile(outputPath, output);
  } catch (e) {
    log(`Error writing trello data to ${outputPath}`);
  }
  log(`Done. Results written to ${outputPath}`);  
};

(async function(args: any): Promise<void> {
  try {
    await run(args);
  } catch (e) {
    log(`Error running ActionableAgile Command Line Tool`);
    log(e);
  }
}(getArgs()));