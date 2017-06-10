**Please Note:**  This tool is offered AS-IS with no implied warranty nor support from ActionableAgile, its partners, or subsidiaries.  ActionableAgile has made this utility available via open source in the hope that the community will make contributions to this project in order to improve it.  Please do not contact ActionableAgile with any support questions as, unfortunately, we will be unable to help you.
 
# ActionableAgile Analytics Tool

## Overview ##
The purpose of this software is to extract flow data from CA Agile Central (formerly Rally) and put that data into a proper format for use with the ActionableAgile&trade; Analytics tool (for more information on the ActionableAgile&trade; Analytics tool, please visit [https://www.actionableagile.com](https://www.actionableagile.com) or sign up for a free trial of the tool at [https://www.actionableagile.com/cms/analytics-free-trial-signup.html](https://www.actionableagile.com/cms/analytics-free-trial-signup.html).)  

This program reads in a well-formed config file (see The Config File section below), connects to CA Agile Central and extracts data using the CA Agile Central REST API according to the parameters specified in the config file (see the Extraction Procedure Section below), and writes out a CSV file or JSON file that can be directly loaded into ActionableAgile&trade; Analytics (see The Output File section below).  

## Installation
There are two options for running this extract utility: either as a standalone exectuable or as a nodejs app.

#### Option 1:  Using the Standalone Executable
Download the "rally-to-analytics.exe" and the "config.yaml" files from the releases page for this repository (https://github.com/actionableagile/rally-to-analytics/releases) and put both files in the same directory. Which local directory you choose doesn’t matter as long as the two files are co-located. 
> NOTE: This executable file will work regardless of what operating system you are using.

Edit the config file and customize it for your specific CA Agile Central instance according to the instructions in this README. Open a command prompt and run it by simply typing ```rally-to-analytics.exe``` (no additional command line parameters are needed to test the app at this point, though you can add additional command line parameters as detailed below). If the program succeeds, the output data file will be written in the same directory as the executable file.

#### Option 2:  Running as a Nodejs App
> NOTE: Option 2 requires Node.js v4+ to run. If you don't have Node installed, please install it before continuing if you want to use this option.

Download the "rally-to-analytics.js" and the "config.yaml" files from the releases page for this repository (https://github.com/actionableagile/rally-to-analytics/releases) and put both files in the same directory. Which local directory you choose doesn’t matter as long as the two files are co-located. Edit the config file and customize it for your specific CA Agile Central instance according to the instructions in this README. Open a command prompt and run it by simply typing ```node rally-to-analytics``` (no additional command line parameters are needed to test the app at this point, though you can add additional command line parameters as detailed below). If the program succeeds, the output data file will be written in the same directory as the javascript file.

## Using the Application
> NOTE: There has been an update to the YAML file format. Please see the [config.yaml][config-yaml] file to see an example of the new schema. For those that wish to continue to use the old version of the schema, please enable the legacy flag (```--legacy```). 

##### Configurable settings/flags
These flags are the same whether you are using the standalone executable or node form of the extraction tool.

```-i``` specifies input config file name (defaults to config.yaml)

```-o``` specifies output file name (must end with .csv or .json, defaults to data.csv)

```-l``` or ```--legacy``` will enable the old version of the YAML (from the GO version of the application). 

For example, to run the node version of the tool with a legacy config file named myconfig.yaml and exporting data to  mydata.csv:

```node rally-to-analytics -i myconfig.yaml -l -o my.csv``` 

Or as another example, to run the exe version of the tool without a legacy config file named myconfig.yaml and exporting data to  mydata.csv:

```rally-to-analytics.exe -i myconfig.yaml -o my.csv``` 


## Config File ##

In order for this utility to run properly, you must create a config file that contains the parameters of your CA Agile Central instance, and the necessary details of your workflow.  The config file is what tells the executuable what CA Agile Central instance to connect to, what data to grab, and how to format the resultant file to be uploaded into the ActionableAgile Analytics tool.

The config file we use conforms to the YAML format standard (http://yaml.org/spec/) and is completely case sensitive.  You can find an example config file here: [https://github.com/ActionableAgile/rally-to-analytics/blob/master/typescript/config.yaml](https://github.com/ActionableAgile/rally-to-analytics/blob/master/typescript/config.yaml).  Feel free to follow along with that example as we run through the details of each section of the file.

The file itself is broken up into the four sections:  

Connection  
Criteria  
Workflow  
Attributes  

### The Connection Section ###
The Connection Section of the config file is simply named "Connection" (without the quotes).  Each line of the this section contains the name of a connection property followed by a colon (:) followed by the required value.  This section has two required fields:

- 	Domain: the url to the domain where your CA Agile Central instance is hosted
- 	Username: the username you use to login to CA Agile Central

And one optional field:

- 	Password: the password you use to login to CA Agile Central

An example of what this section might look like is:

```
Connection:  
	Domain: https://www.myrallydomain.com  
	Username: MyUsername  
	Password: MyPassword  
  
````

### The Criteria Section ###
The Criteria Section of the config file is simply named "Criteria" (without the quotes) and contains optional CA Agile Central attributes that can use to control your data set. Each line in this section contains the name of the CA Agile Central attribute you want in your data followed by a colon (:) followed by its corresponding value in your CA Agile Central instance.  The fields in this section that we support are:

- 	Project: a list of the names of the CA Agile Central Projects you are querying
- 	Types: a list of the names of the CA Agile Central issuetypes you want to extract
- 	Filters: a list of the names of the filters you want to apply
- 	Start Date: a date filter in the format YYYY-MM-DD which will exclude issues with resolved dates before the provided date (optional)
- 	End Date: a date filter in the format YYYY-MM-DD which will include issues with resolved dates before the provided date (optional)

An example of what this section might look like would be:

```
Criteria:  
	Project: 
		- My Project1
		- My Project2  
	Filters: 
		- Filter1
		- Filter2
	Issue types: 
		- Epic
		- User Story
	Start Date: 2001-01-23
	End Date: 2019-12-30
	    
```

>NOTE:  The fields in this section are optional

### The Workflow Section ###
The Workflow Section of the config file is simply named "Workflow" (without the quotes) and contains all the information needed to configure your workflow data.  Each line of the this section contains the name of the workflow column as you want it to appear in the data file, followed by a colon (:) followed by a comma-separated list of all the CA Agile Central statuses that you want to map to that column.  For example, a row in your Workflow section that looks like:

Dev: Development Active, Development Done, Staging

will tell the software to look for the CA Agile Central statuses "Development Active", "Development Done", and "Staging" and map those statuses to a column in the output data file called "Dev".  The simplest form of this section is to have a one-to-one mapping of all CA Agile Central statuses to a corresponding column name in the data file.  For example, assume your CA Agile Central workflow is ToDo, Doing, Done.  Then a simple Workflow section of the config file that produces a data file that captures each of those statuses in a respectively named column would be:

```
Workflow:  
	ToDo: ToDo  
	Doing: Doing  
	Done: Done
```

Sometimes CA Agile Central issues are created with a certain status, and there is no event that corresponds to a move into that status, so there is no date at which the work item entered the corresponding workflow stage. You can designate that an item be created in a certain workflow stage by adding (Created) to the list of CA Agile Central statuses. For example, in the previous example if you wanted to designate that items enter the ToDo workflow stage when they are created, you would change the workflow section of the config file as follows:

```
Workflow:  
	ToDo:
		- ToDo 
		- (Created)  
	Doing: 
		- Doing  
	Done: 
		- Done
```

Again, please refer to the sample config file for an example of what the workflow section looks like. 

>NOTE::  The Workflow section requires a minimum of TWO (2) workflow steps, and the names of the workflow steps must be specified in the order you want them to appear in the output CSV.  The expectation is that all CA Agile Central issue types that are requested will follow the exact same workflow steps in the exact same order.


### The Attributes Section ###
The Attributes Section of the config file is simply named "Attributes" (without the quotes) and is another optional section that includes name-value pairs that you want included in your extracted data set. They may be CA Agile Central custom fields that are unique to your CA Agile Central instance, or certain standard CA Agile Central fields that we support. Each line in this section contains the name you want to appear as the attribute column name in the CSV file, followed by a colon, followed by the name of a CA Agile Central custom field or a supported standard field, like this:

- 	CSV Column Name: ID of the custom field 
- 	CSV Column Name: Supported field name

If the returned JSON contains an array, the content of each element is extracted normally. If there are multiple non-empty values, all the values are joined with an escaped comma and surrounded by square brackets like this: [red\,green\,blue]

An example of what this section might look like is:

```
Attributes:  
	Team: customfield_10000  
	Regulatory Requirement: customfield_10001  
	Status: status  
	Type: issuetype  
	Level: priority  
```

These fields will show up as filter attributes in the generated data file (please visit [https://www.actionableagile.com/format-data-file/(https://www.actionableagile.com/format-data-file/) for more information).

>NOTE::  None of the fields in this section is required--in fact, this section as a whole is optional.

##### For a complete config example, please see the provided sample config.yaml #####

## Extraction Procedure ##
The program will read in the properly formatted config file (see The Config File section above) and attempt to connect to Jira using the url and authentication parameters specified.  When a connection is established, the software will extract data using Jira’s REST API according to the parameters specified in the config file.  REST calls are “batched” so as to stay under Jira’s “maxResult” size limit as well as to minimize the chances of server timeout errors when retrieving large datasets.  If a non-fatal error is encountered, the extraction program will retry up to five time before terminating.  The program ignores any Jira issue types that have workflow stages not specified in the config and it handles Jira issues that have moved backward and forward through the workflow.
If all goes well, the extraction program will write out a CSV or JSON file that contains all extracted data to the same directory where the program is running.

## Output File ##
If successful, the output data file will be written in the same directory in which this utility was run.  The output file follows the format required by the ActionableAgile Analytics tool as specified here:  [https://www.actionableagile.com/format-data-file/](https://www.actionableagile.com/format-data-file/). 

If the output file is a CSV file, it can be loaded directly into the ActionableAgile Analytics tool from the Home tab using the Load Data button.

### Version 
1.1.1 

### Todos

 - Write Tests
 - Add support for attributes with dot notation
 - Add JSON support
 - Add more extractor sources

License
----
MIT
