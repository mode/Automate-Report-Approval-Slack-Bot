const {WebClient} = require('@slack/web-api');
const { createEventAdapter } = require('@slack/events-api');
require('dotenv').config()

var slackSignInSecret = process.env.slackSignInSecret
var botToken = process.env.botToken


const slackEvents = createEventAdapter(process.env.slackSignInSecret);
const slackClient = new WebClient(process.env.botToken);
const PORT =  3000;
const axios = require('axios');
const base = process.env.base
const base2 = process.env.base2
const header = {
    'Content-Type': 'application/json',
    'Accept': 'application/hal+json',
     "Authorization": process.env.bearToken
  }
  

slackEvents.on("app_mention", (event)=>{
    handleAppMention(event)
})

slackEvents.on("reaction_added", (event)=>{


    (async()=>{

        try{
            const response = await slackClient.usergroups.list({include_users:true})
            const message = await slackClient.conversations.replies({channel: event.item.channel,ts:event.item.ts})
            let adminList = response.usergroups.filter(r => r.handle === process.env.adminSlackGroup)
            if(event.reaction === process.env.slackEmoji && adminList[0].users.includes(event.user)){

                let reportTokenNworkspace = findReportToken(message.messages[0].text);
                if(reportTokenNworkspace){

                
                let workspace = reportTokenNworkspace[2]
                let reportToken = reportTokenNworkspace[1].slice(0,-1)
                let reportDetails = await getReportDetails(reportToken,workspace);
                let collectionToken = await getCollections(workspace,process.env.productionCollection)
                await slackClient.chat.postMessage({channel:event.item.channel,
                "thread_ts":event.item.ts,
                "text": "Move to Production?",
                "blocks": [
                    {
                        "type": "header",
                        "text": {
                            "type": "plain_text",
                            "text": "Move to Production?",
                            "emoji": true
                        }
                    },
                    {
                        "type": "actions",
                        "elements": [
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "emoji": true,
                                    "text": "Approve"
                                },
                                "style": "primary",
                                "value": `{"adminList":"${adminList[0].users}","report_token":"${reportDetails.token}","requestedBy":"${message.messages[0].user}","work_space":"${workspace}","collection":{"name":"${collectionToken[0].name}","token":"${collectionToken[0].token}"}}`
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "emoji": true,
                                    "text": "Reject"
                                },
                                "style": "danger",
                                "value": `{"report_token":"${reportDetails.token}","requestedBy":"${message.messages[0].user}","work_space":"${workspace}","collection":{"name":"${collectionToken[0].name}","token":"${collectionToken[0].token}"}}`
                            }
                        ]
                    }
                ]
            })
        } else {
            console.log(message.messages[0].thread_ts)
            await slackClient.chat.postMessage({channel:event.item.channel,"text":`Please make sure to add the :${process.env.slackEmoji}: to the initial message with the link`,"thread_ts":message.messages[0].thread_ts})


        }

            }



        } catch(error) {
            console.log(error.data)
        }
    })();
  
})

slackEvents.on("link_shared",(event)=>{
respondToLinkPost(event);

})

let respondToLinkPost =  async(event)=>{
    try{
        let reportToken = findReportToken(event.links[0].url)
        let reportDetails = await getReportDetails(reportToken[1],reportToken[2]);
        let collectionData = await getCollections(reportToken[2],"",reportDetails.space_token)
        let queries = await getReportQueries(reportDetails._links.queries.href)
        let creatorUsername = await parseUser(reportDetails._links.creator.href);
        let rDatasourceNames =  "";

        for (let i = 0; i< queries.length; i++){
            if(queries[i].data_source_id === 1){
                rDatasourceNames = rDatasourceNames + `Mode Public Warehouse,`

            }
            else{
       
                    let dataSource =  await getDataSource(queries[i].data_source_id,reportToken[2])
                    rDatasourceNames = rDatasourceNames + `${dataSource[0].name},`

            }
        }



        rDatasourceNames = Array.from(new Set(rDatasourceNames.split(','))).toString();
        let githubLink = reportDetails.github_link?encodeURI(reportDetails.github_link):"This Report is Not Synced to Github";
 
        await slackClient.chat.postMessage({channel:event.channel,text:`Report Name - ${reportDetails.name}`,
        "thread_ts":event.message_ts,
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "*Report Details*",
                    "emoji": true
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": `*Report Name:*\n${reportDetails.name}`
                    },
                    {
                        "type": "mrkdwn",
                        "text": `*Created by:*\n${creatorUsername}`
                    }
                ]
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": `*Current Collection:*\n${collectionData.name}`
                    },
                    {
                        "type": "mrkdwn",
                        "text": `*Data Source(s):*\n${rDatasourceNames}`
                    }
                ]
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": `*Queries Count:*\n${queries.length}`
                    },
                    {
                        "type": "mrkdwn",
                        "text": `*Github Sync:*\n${githubLink}`
                    }
                ]
            },
            // {
            //     "type": "section",
            //     "text": {
            //         "type": "mrkdwn",
            //         "text": ``
            //     }
            // }
        ]
    })
    }catch(error){
        console.log(error.data)
    }
};

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


let findReportToken = function(link){

    let firstvariable = "reports/";
    let secondvariable;
    let reportToken; 

    let workspace = link.match(new RegExp("app.mode.com/(.*?)\/"))
    if(link.includes("app.mode.com")){
    if(link.includes("/runs") || link.includes("/details") || link.includes("/queries") || link.includes("/viz") || link.includes("/notebook") || link.includes("/presentation")|| link.includes("/editor")){
        
        secondvariable = "\/";
        reportToken = link.match(new RegExp(firstvariable + "(.*?)"+ secondvariable));
        if(link.includes("editor")){
            workspace = link.match(new RegExp("editor/(.*?)\/"))
    
        }

    } else {
        reportToken = link.match(new RegExp(firstvariable + "(.*)"));
    }
    reportToken.push(workspace[1]);
    return reportToken 

}else{return false};
}
let getReportDetails =  (reportToken,workspace)=>{

    let results = axios.get(`${base}${workspace}/reports/${reportToken}`,{headers:header})
                       .then(response=>{
                           return response.data
                       })

                       return results;

}

let changeReportCollection = (newCollection,token,workspace) =>{
    let body = {
        report:{

            "space_token":newCollection 
        }
    }

    return axios.patch(`${base}${workspace}/reports/${token}`,body,{headers:header})
         .then(response => {

            return response.data; 
         }).catch(errror =>{
             return false;
             console.error() 
         })
}

let getCollections =  (workspace,collectionName,collectionToken)=>{

    let url = `${base}${workspace}/spaces`
    let singleSpace = false; 
    if(collectionToken){
        url = url + `/${collectionToken}`
        singleSpace = true
    }
    let results = axios.get(url,{headers:header})
                       .then(response=>{
                            if(singleSpace){
                                return response.data
                            } else{
                                let spaces = response.data._embedded.spaces;
                                let collectionToken = spaces.filter(s=> 
                                    s.name.toLowerCase() === collectionName.toLowerCase()  
                                    )
                                return collectionToken
                            }

                       }).catch(error =>{
                           return "No Collection Found"
                       })

                       return results;

}


let getReportQueries = (reportDetails)=>{
    let url = `${base2}${reportDetails}`

    let results = axios.get(url,{headers:header})
    .then(response=>{
             return response.data._embedded.queries

    }).catch(error =>{
        return "No Queries Found"
    })

    return results;

}

let queryChecker = (queries)=>{
    let rejectedQueries = [];

    queries.forEach((q)=>{

        if(q.raw_query.toLowerCase().includes("select *")){
            q.containsSelectALL = true;
            rejectedQueries.push(q);
        } else if(q.data_source_id === 1){
            q.wrongDataConnection = true;
            rejectedQueries.push(q);
        }
    })
    return rejectedQueries

}

let parseUser = (user)=>{
    let userName =  user.substring(5);
    return userName
}


let archiveReportEvent = (reportDetails,archiveIndicator)=>{
    let status;
    let url = `${base2}${reportDetails._links.self.href}`
    if(archiveIndicator){
        return axios.patch(url+"/unarchive",{},{headers:header})
        .then(response => {
           return  "Report was unarchived" 
        }).catch(errror =>{

            console.error() 
        })
    } else{
        url = url+"/archive"
        return axios.patch(url,{},{headers:header})
        .then(response => {
           return  "Report has been archived"
        }).catch(errror =>{

            console.error() 
        })
    }
}

let getDataSource = (id,workspace)=>{
    let url = `${base}/${workspace}/data_sources`
    let results = axios.get(url,{headers:header})
                       .then((response)=>{
                           let data_connection = response.data._embedded.data_sources.filter(ds=> ds.id === id )

                           return data_connection
                       }).catch((error=> {return "No Connection Found"}))
                       return results
}



slackEvents.on('error',console.error)

slackEvents.start(PORT).then(()=>{console.log("starting server")})


const express = require("express");

const cors = require("cors");

let app = express();

const bodyParser = require('body-parser');


app.use(cors());
app.options("*", cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const { response } = require("express");
const { showCompletionScript } = require('yargs');
const { stat } = require('fs');

app.post("/message_response",(req,res)=>{
    let payload = JSON.parse(req.body.payload)

    let value = JSON.parse(payload.actions[0].value)
    let adminList = value.adminList.split(",")



    if(adminList.includes(payload.user.id)){

        if(payload.actions[0].text.text === "Approve"){
            axios.post(payload.response_url,{ "replace_original": "true","text": `<@${value.requestedBy}> Your report has been approved and moved to Production`},{headers:{'Content-Type': 'application/json','Accept': 'application/hal+json',}})
            .then((response)=>{
                changeReportCollection(value.collection.token,value.report_token,value.work_space)

            }).catch((error)=>{
                console.log(error)
            })
        } else{
            axios.post(payload.response_url,{ "replace_original": "true","text": `<@${value.requestedBy}> Your report has been rejected, please speak with Admin to discuss next steps.`},{headers:{'Content-Type': 'application/json','Accept': 'application/hal+json',}})
            .then((response)=>{
    
            }).catch((error)=>{
                console.log(error)
             })
        }
    } else {
        axios.post(payload.response_url,{ "thread_ts":payload.container.thread_ts,"replace_original": false, "text": `<@${payload.user.id}> you do not have access to approve reports.`},{headers:{'Content-Type': 'application/json','Accept': 'application/hal+json',}})
        .then((response)=>{

        }).catch((error)=>{
            console.log(error)
         })    }

  })
  

app.listen(3001, err => {
    if (err) {
      
    }
    console.log(`Listening on ${process.env.PORT}` );
   });