import axios from 'axios';
import { groupBy } from 'ramda';
import { createWorkItem, workItemToCSV } from './work-item';

export interface Workflow {
  [category: string]: Array<string>;
};

export interface IssueHistoryDetail {
  _ValidFrom: string,
  _ValidTo: string,
  ObjectID: number,
  Name: string,
  ScheduleState: string,
  FormattedID: string,
};

export interface Issue {
  historyDetails: IssueHistoryDetail[],
  stagingDates?: string[],
}

class RallyExtractor {
  username: string;
  password: string;
  workflow: Workflow;
  pageSize: number;

  constructor({ username, password, workflow }) {
    this.username = username;
    this.password = password;
    this.workflow = workflow;
    this.pageSize = 1000;
  }

  async extract({ workflowId, projectId }) {
    const url = `https://rally1.rallydev.com/analytics/v2.0/service/rally/workspace/${workflowId}/artifact/snapshot/query.js`;
    const res = await axios.post(url, {
      "find": {
        "_ProjectHierarchy": projectId
      },
      "fields": ["State", "ScheduleState", "Name", "_ValidFrom", "_ValidTo", "_TypeHierarchy", "ObjectID", "FormattedID"],
      "hydrate": ["ScheduleState", "State"],
      "pagesize": this.pageSize
    }, {
        auth: {
          username: this.username,
          password: this.password,
        }
      });

    const { Errors, Results }: { Errors: any[], Results: IssueHistoryDetail[] } = res.data;

    if (Errors && Errors.length) {
      console.log(JSON.stringify(Errors));
      throw Error('Has Errors');
    }

    const issueHistory = groupBy((r => r.Name), Results);
    const issues = Object.keys(issueHistory).map((k => convertToHydratedIssue(issueHistory[k], this.workflow)));

    const workItems = issues.map(i => createWorkItem({
      domainUrl: 'domain',
      id: i.name,
      name: i.name,
      stageDates: i.stagingDates,
      type: 'type',
    }));

    const csvHeader: string = `ID,Link,Name,${Object.keys(this.workflow).join(',')},Type`;
    const csvBody: string = workItems
      .map(workItemToCSV)
      .join('\n');
    const csv: string = `${csvHeader}\n${csvBody}`;
    console.log(csv);
    return csv;
  }
}

const convertToHydratedIssue = (issueHistory: IssueHistoryDetail[], workflow: Workflow) => {
  // Issue context...
  // note, because we are using groupBy, you can't have an event in two different stage categories

  // just so I don't forget:
  // a stage category is the key of workflow. the lists for a stage is the value. each 'list' is a value a trello card can be in
  // i.e. {
  //    STAGE  : [ LIST1,     LIST2 ]
  //    'ready': ['ready', 'very ready'],
  //    'in dev' ['coding', 'development', 'dev on-hold']
  // }
  // again, the key is a 'category' or 'group', 
  // and the value is the actual names of your trello boards you want to list under that category.
  const eventsByStageCategory = groupBy(issueHistoryDetail => {
    for (let stageCategory in workflow) {
      const listsForThisStage = workflow[stageCategory];
      if (listsForThisStage.includes(issueHistoryDetail.ScheduleState)) {
        return stageCategory;
      }
    }
    return 'uncategorized';
  }, issueHistory);

  const { uncategorized } = eventsByStageCategory;
  delete eventsByStageCategory['uncategorized'];

  const initialized = {};
  Object.keys(workflow).map(key => initialized[key] = []);

  // combine defaults and events, (fills in empty workflow categories with empty array [])
  const allStageCategoriesWithAllEvents = Object.assign(initialized, eventsByStageCategory);

  // map data to the input for algorithm...
  const accum: Array<Array<string>> = [];
  for (const stageCategory in allStageCategoriesWithAllEvents) {
    const dates = allStageCategoriesWithAllEvents[stageCategory].map(action => {
      return action._ValidFrom;
    });
    accum.push(dates);
  }

  // get the latest date per array, and flatten.
  const stagingDates = filterAndFlattenStagingDates(accum);

  // add staging data to card object...
  const issueName = issueHistory[0].Name;

  return Object.assign({}, { name: issueName }, { issueHistory }, { stagingDates });
};

// You can treat this as a black box that just fills up the staging bins.
const filterAndFlattenStagingDates = (stageBins: string[][]) => {
  let latestValidIssueDateSoFar: string = '';
  const stagingDates = stageBins.map((stageBin: string[], idx: number) => {
    let validStageDates: string[] = stageBin.filter(date => {
      return date >= latestValidIssueDateSoFar ? true : false;
    });
    if (validStageDates.length) {
      validStageDates.sort();
      latestValidIssueDateSoFar = validStageDates[validStageDates.length - 1];
      const earliestStageDate = validStageDates[0];
      return earliestStageDate;
    } else {
      return '';
    }
  });
  return stagingDates;
};

export default RallyExtractor;
