<p align="center">
  <img src="mode-logo-green.png" alt="mode logo" />
</p>

----

# Automate-Report-Approval-Slack-Bot

This application is an example of how to setup automated processes to manage Production Reports within Mode using Slackbots.



## Slack API 

Slack allows for individual Workspaces to build Apps or bots to automate workflow within a team's Workspace instance. To setup a Slack App/Bot please review the documentation [here](https://api.slack.com/start/building). 

Head to the "[Your Apps"](https://api.slack.com/apps) section of the Slack API documentation. Click, "Create App" to begin the process of building out a Slack Application. 

![Screen Shot 2022-03-14 at 11 35 36 AM](https://user-images.githubusercontent.com/41496659/158238920-f9388eb4-a5b5-4060-9157-e8a1fee51cf0.png)


![Screen Shot 2022-03-14 at 11 36 56 AM](https://user-images.githubusercontent.com/41496659/158239000-51d87c60-e081-4133-bef2-a2c1f76d379e.png)


When the modal pops open, choose "From scratch" as we will be adding our own configurations. Feel free to choose the "From an app manifest" if you have a manifest file. 


![Screen Shot 2022-03-14 at 11 37 06 AM](https://user-images.githubusercontent.com/41496659/158239205-044673f8-52f6-4936-a849-c97e93fcc17f.png)

Choose your apps name, as it suggests you can change it if your are not pleased with the name after creation. Also pick the Workspace in which you like to install the application. 


![Screen Shot 2022-03-14 at 11 37 31 AM](https://user-images.githubusercontent.com/41496659/158239357-df64f829-96b7-42d7-9f84-e569a7af6313.png)

Now we will be able to choose the features and functionality of the App. For the purposes of this example, we will allow the App to have the `Bots`,`Interactive Components`,`Event Subscriptions` and `Permissions` functionality. For more details on the types of functionality and features that are available, please check out [Slacks Documentation](https://api.slack.com/). 

### Permissions

Before the app can do anything it will need permissions. Click on the "Permissions" tile and navigate down the page to the "Scopes" section to give the app permissions. 

![Screen Shot 2022-03-14 at 11 48 42 AM](https://user-images.githubusercontent.com/41496659/158240849-4c1ad487-5ddd-442e-b7df-4bdf46c89257.png)

Our app will require the following permissions:

```
app_mention
channels:history
channels:read
chat:write 
groups:history 
groups:read
links:read
reactions:read
reactions:write
usergroups:read
users:read
users:read.email 
```

Now that we have the right permissions, add the APP to the workspace by scrolling up and clicking "Install to Workspace"

![Screen Shot 2022-03-14 at 11 57 27 AM](https://user-images.githubusercontent.com/41496659/158242123-f8788c94-2b0b-4571-b792-eb179731ad08.png)

Similar to most Oauth apps, it will redirect you to an approval page. Grant the app the permissions by clicking "Allow". 

![Screen Shot 2022-03-14 at 11 57 35 AM](https://user-images.githubusercontent.com/41496659/158242352-d7fde1d1-c2f9-4e47-9902-dc1584bc9395.png)

Once approved it will return a "Bot User OAuth Token" which we will use later in the app.js file to allow our Bot to send messages. 

![Screen Shot 2022-03-14 at 11 57 48 AM](https://user-images.githubusercontent.com/41496659/158242733-709fd061-bce1-48d1-80c8-8b3a78f70e00.png)


### Events Subscription 

Next we will setup the events subscription. [Here](https://api.slack.com/events) is list of the possible Slack events you can subscribe to within an app.

Events require a Request URL be provided to catch the event posts when they occur. This application is using an Express/Node.JS server file to catch the events. To run the server locally, use nGrok to spin up a URL to redirect to your local host port. Here is some [documentaion](https://ngrok.com/docs) on how to get nGrok up and running locally. 

![Screen Shot 2022-03-14 at 3 52 31 PM](https://user-images.githubusercontent.com/41496659/158274181-a72d1802-cb39-41f5-91da-24647557544f.png)

Once the request URL is provided, subscribe to the events you would like to see. In this example we will be listing for `app_mentions`, `links_shared` and `reactions_added`. Each time a user does any of the actions in a channel where the bot is installed, we will receive an events payload to the request URL with all the information. 

![Screen Shot 2022-03-14 at 3 57 22 PM](https://user-images.githubusercontent.com/41496659/158274258-1d895e7e-be00-419a-b0d6-7bde7e34fe87.png)


### Interactive Components 

One more item we need to add to the app to allow for interactive messaging. Turn on the "Interactivity" functionality and provide another request URL. This URL is different from the events URL endpoint. This request URL will receive the results from the interactive messages. 


![Screen Shot 2022-03-14 at 4 02 23 PM](https://user-images.githubusercontent.com/41496659/158275109-7b641faf-612f-45bf-bdf2-ac6ef283df97.png)


For our example it will be an "Approve" or "Decline" button that will contain meta-data about what was declined and why. 


![Screen Shot 2022-03-14 at 4 06 06 PM](https://user-images.githubusercontent.com/41496659/158275089-9b24c0cb-04ab-4cc9-bc29-afce1dba5be6.png)


## Building out APP file 


To start, please setup your Slack Web Client and Event Listener. The `app.js` file is using Node.js and Express for the server side request handling. Take a look at the `package.json1` file for the included dependencies. You may also fork this repo and pull the code down locally to make your own adjustments. All variables used in this application are stored in a `.env` file and added to the gitignore file to ensure safety of tokens. On line 3 of the code below, we use the library `dotenv` to connect our server script to the environment variables folder. See this [article](https://www.freecodecamp.org/news/how-to-use-node-environment-variables-with-a-dotenv-file-for-node-js-and-npm/) on how to get a `.env` file started. 

> *NOTE*: Make sure to install `@slack/web-api` and `@slack/events-api` via the package manager of your choice. 


```
const {WebClient} = require('@slack/web-api');
const { createEventAdapter } = require('@slack/events-api');
require('dotenv').config()

var slackSignInSecret = process.env.slackSignInSecret
var botToken = process.env.botToken


const slackEvents = createEventAdapter(process.env.slackSignInSecret);
const slackClient = new WebClient(process.env.botToken);

```

The slackEvents variable will allow our application to listen to events that happen within Slack. It requires that we pass it the slackSignInSecret which can be found in the App Credentials section under the "Signing Secret". 

![Screen Shot 2022-03-15 at 10 03 22 AM](https://user-images.githubusercontent.com/41496659/158432506-21cebf10-b4d8-4d3c-bea1-df80a77908be.png)


We will also pass in the OAuth token for the bot under the `botToken` variable. The token will be used to allow the bot access to the workspace along with permissions to write and read messages. You can find the token under the "OAuth Tokens for Your Workspace" section under "OAuth & Permissions". 

Once those variables are secured we can create additional variables that will act as services for this app. When we call slackEvents or slackClient, it will allow us to write/read as the bot or receive event payloads when events occur. 


Next we will turn on the app within our server file with the following commands:

```

slackEvents.on('error',console.error)

slackEvents.start(process.env.PORT).then(()=>{console.log("starting server")})

```
This will allow our app to listen when it is mentioned in a channel, when a link is posted and when someone adds a reaction to a thread/message. Now that we are online, we can start to build out the logic. 


### App_Mentions


```
slackEvents.on("app_mention", (event)=>{
    handleAppMention(event)
})
```

By using our `slackEvents` variable that is storing the event adapter, we are able to pass in functions and read the event data. Here we are listening for events where our app is mentioned. When mentioned, it will return an event payload that we are passing over to our `handleAppMention` function. This function is custom built and can be adjusted to fit your use case. 

The function is an async function because we will be dealing with promises to return data from the Mode API and to post to Slack. Within the function we will use the `await` key word to tell our function to wait on the results of function(s) running so that they can be stored in variables and used in other statements within the function. 

```
let handleAppMention = async(event)=>{
    try{


        switch(true){
            case (event.text.toLowerCase().includes("push to review")):
                let reportToken = await findReportToken(event.text)
                if(reportToken[1].includes(">")){
                    reportToken[1] = reportToken[1].slice(0, -1)
                 }     

                if(reportToken){
               let reportDetails = await getReportDetails(reportToken[1],reportToken[2])
                    let queries = await getReportQueries(reportDetails._links.queries.href)
                    let queriesCheck = await queryChecker(queries)
                    let postStatement = `All Queries Passed!! <!subteam^${process.env.adminGroupID}> Please review report above for approval, upon above please add a :white_check_mark: to the original message for approval to merge to production`
                    if(queriesCheck.length){
                        let str = ""
                        
                        for(let i = 0; i< queriesCheck.length; i++){
                            if(queriesCheck[i].containsSelectALL){
                                 str = str + `*Query Name* - ${queriesCheck[i].name}\nFailed because it contains a *Select ALL* \n *Raw Query*\n>${queriesCheck[i].raw_query}\n`
                            } else if(queriesCheck[i].wrongDataConnection){
                                let connection;
                                if(queriesCheck[i].data_source_id === 1){
                                    connection = [{"name":"Mode Public Warehouse"}]
                                } else {
                                    connection = await getDataSource(queriesCheck[i].data_source_id,reportToken[2])
                                }

                                str = str + `*Query Name* - ${queriesCheck[i].name}\nFailed because it is pointing at the wrong connection\n${connection[0].name}\n`            
                            }
                        }
    
                        postStatement = `Please correct the issues below <@${event.user}> and resubmit your request\n`+str;
                    }
                    // } )
                    // }


                    await slackClient.chat.postMessage({channel:event.channel,"thread_ts":event.event_ts,text:postStatement})
                }else {

                    await slackClient.chat.postMessage({channel:event.channel,"thread_ts":event.event_ts,text:`<@${event.user}> Please post new command with link to report`})

                }
                break;

            case (event.text.toLowerCase().includes("can you help me move a report")):
                await slackClient.chat.postMessage({channel:event.channel,text:`Sure <@${event.user}>, with a bit of information I can assist`})

                break;


            case (event.text.toLowerCase().includes(" archive report")):
                let token = findReportToken(event.text)
                if(token[1].includes(">")){
                   token[1] = token[1].slice(0, -1)
                }
                let details = await getReportDetails(token[1],token[2]);
                let result;
                if(details.archived){
                    result = "This Report is Already Archived"
                } else{ 
                    result = await archiveReportEvent(details,false)
                }
                await slackClient.chat.postMessage({channel:event.channel,text:result})

                break;

                case (event.text.toLowerCase().includes(" unarchive report")):
                    let token2 = findReportToken(event.text)
                    if(token2[1].includes(">")){
                       token2[1] = token2[1].slice(0, -1)
                    }
                    let details2 = await getReportDetails(token2[1],token2[2]);
                    let result2;
                    if(details2.archived){
                        result2 = await archiveReportEvent(details2,true)

                    } else{ 
                        result2 = "This Report is Already Active"
                        result2 = await archiveReportEvent(details,false)
                    }
                    await slackClient.chat.postMessage({channel:event.channel,text:result2})
                    
                    break;
        }
            
    } catch(error) {
        console.log(error.data)
    }
}
```

The function contains a few cases within a switch statement to check the contain of the message it was mentioned within. Each case will parse out a report link and will return the report's metadata from the Mode API. Here is a list of the current commands/flows built into the app. 

@app push to review {add_link_to_report}

This case will find the report link in the statement, parse out the report token, then use the token in a GET request to return the report details from the Mode API. From there it will validate the queries in the report to ensure that they do not contain a "Select \*" and that they point to database that is not the Mode Public Wareshouse. This can be changed to whatever database you want to validate against. The `queryChecker` function handles the validation and at present it is hardcoded to check against the MPW. To make that change, in the second conditional check, change the interger to the value(s) of the data connection(s) of your choice. Data connection IDs can be found [here](https://mode.com/developer/api-reference/management/data-sources/#listDataSources) via the API. (the MPW's id is 1)


@app can you help me move a report 

This case will return a message requesting the necessary details to run the above command.

@app archive report {add_link_to_report}

This case will take the report given and archive it within the Collection it currents sits within. 

@app unarchive report {add_link_to_report}

Will remove the app from the archived list. 


These methods are just the default to get you started. You can create new cases by just copying one of the cases and giving it a string to look for within the app_mention event. 

From there depending on which case was triggered, the app will then use the following method to post a message.

`await slackClient.chat.postMessage({channel:event.channel,text:result2})`

For more details on the possible parameters that the `postMessage` method from Slack, please see [here](https://api.slack.com/methods)
