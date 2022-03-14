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


### Interactive Components 

You should see the 


To start, please setup your Slack Web Client and Event Listener.

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

The slackEvents variable will allow our application to listen to events that happen within Slack. [Here](https://api.slack.com/events) is list of the possible Slack events you can subscribe to within an app. This example will listen for the following events, app_mention, links_shared, and reaction_addded.


