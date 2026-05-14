May 7, 2026

## Kilowott \- Gamerminds \- Discord bot call \- Transcript

### 00:00:00

   
**Leon Damrau:** Um there we go. So um I have a bot that is for So the idea is that players join the discord server and they can use this board to submit a game. So they click on here. Um then a formula opens and they can choose their language such as German. Type in game title. Let me check. Let me just choose one game real quick. This one to copy the link of the game, put it in here. What's the name again? Then the name. Um, then they answer whether they already know this game or not. Uh, let's go. They don't. Then you submit. Then you need to continue to the next step. So this is already the first kind of continuity problem uh with this bot. Um I would like this happen like within one step but I don't know how this is  
**Daniel Chandy:** Okay.  
**Leon Damrau:** possible. Um but you would need to continue to step two. Um and then there's a second question about payment.  
   
 

### 00:01:18

   
**Leon Damrau:** So because like the the idea is that when they when we have enough people submit one game, let's say we have like 200 people um submit one game with this information, we would go to the developer of this game and say like okay um there are 200 people want to get want the game to be translated into German. Um and we tell them and uh offer them our service for translation.  
**Daniel Chandy:** So,  
**Leon Damrau:** uh either they say okay let's do it and they pay us or they they say like okay we don't have the money available for that we don't have the budget then we have like some crowdfunding option where we say like okay we're going to open a Kickstarter project in their name um and people then can yeah pledge to this Kickstarter and then pay pay us to do it basically um so that's why we take we we take  
**Daniel Chandy:** Yeah.  
**Leon Damrau:** this information ahead of time um how much they would be willing to pay for translation. This is not like okay if they type in now like it even says like uh this is not a payment.  
   
 

### 00:02:22

   
**Leon Damrau:** It does not obligate you to blah blah blah. Um it's just for the statistics. So after um they type they put this in I click on submit and then the game will be shown in new submission. It will be up here. Um and then other people see this,  
**Daniel Chandy:** Okay.  
**Leon Damrau:** other people can vote over here as well. It's the same kind of thing again. Um this time it's just one uh interface after the because like here you need less information. Basically here you you don't need like obviously the the store link in the name of the game because it's already there. Um and and like that's pretty straightforward. Currently it works. Um, but there are still a few things that don't work very well. We have like rising games, popular requests, approveof list, trending games, and archived games. So like I want to reduce all of this to two channels. So like only the game requests and the new submissions.  
**Daniel Chandy:** Okay, fine.  
   
 

### 00:03:22

   
**Leon Damrau:** Um the problem is that the reason why we did multiple channels is because that let's say 100 people submit 100 different games and you have one channel with 100 um with 100 games and then like maybe one that got voted a lot is kind of like getting lost in these 100 games. Um there is I don't and that's also one thing that needs to be fixed somehow with the bot. I don't know if this possible like it should be possible. There's like Discord also has like tags. Um I was told there is a  
**Daniel Chandy:** I don't think threads threads don't have a way of sorting it,  
**Leon Damrau:** way.  
**Daniel Chandy:** right?  
**Leon Damrau:** The thing is like you can obviously if someone is interested in the game they can like filter for the game like type in the name of the game. So I was thinking uh for the game like for this channel I can make like some some post at the top and then explain okay you can filter for these games. Um this is like one option but I think from okay actually from the bot side I don't think there's an I don't  
   
 

### 00:04:20

   
**Daniel Chandy:** Oh,  
**Leon Damrau:** know if there's a way to make this easier to filter. Um maybe there's like an ext like a bot like the bot can have an extra function where he filters um the top the highest games put them on top or something like this. I don't know if that's possible,  
**Daniel Chandy:** Okay.  
**Leon Damrau:** but that would be great if it is because like again we have too I feel like there are too many channels here right now. Um yeah, the archived games is fine. Um maybe because the archived games the purpose is like let's say a game was  
**Daniel Chandy:** Yeah.  
**Leon Damrau:** submitted and then for like two weeks no one voted for this game. No one there was no additional vote for this game. So it would move from here to archive so it's more clean here. Um but maybe just reduce it to two is good enough and then filter it somehow. Uh that should be fine as well because then I just make a a pin up here and say okay if you're looking for a game filter it or something like this and um then it would be easier.  
   
 

### 00:05:23

   
**Leon Damrau:** But yeah that's that's the main purpose. That's the main thing I need to adjust is like reduce it to two channel to make it easier and then also the functionality because um I mean it it works but it's not like I feel sometimes there's an issue with it. I don't know what exactly it's like. I mean, maybe it's because like these rising in popular requests, they don't really work as intended. Like for example, I think like the Hollow Knight or something um had a bit more uh votes, but it didn't go to rising games. But I mean, if we reduce this,  
**Daniel Chandy:** Mhm.  
**Leon Damrau:** if we get rid of this, it doesn't matter anymore. Um trending games, um maybe also get I'm not sure yet. Like the thing is trending games is for the purpose is that every day it showcases the games that got voted uh a few times. So like this one has been getting votes. This one, you know, it shows you a list of of games that had like a certain amount of votes.  
   
 

### 00:06:20

   
**Leon Damrau:** Um the reason why it doesn't show the votes is that I don't want people I don't want people to see the votes at first.  
**Daniel Chandy:** All  
**Leon Damrau:** Um because let's say there's another linguist or like another company from like some person of another company that also does translation on this discord server and then they see the votes and they like they use this data for themselves or like even even the developers right let's  
**Daniel Chandy:** right.  
**Leon Damrau:** say the developers come on the discord server and they see the votes um already so they already know okay this is basically free marketing research for them that's why I don't want to show showcase the votes um and then  
**Daniel Chandy:** Yeah. Yeah.  
**Leon Damrau:** I have. Let me check. Where is it?  
**Daniel Chandy:** But uh would the votes regardless be exposed in like  
**Leon Damrau:** And  
**Daniel Chandy:** your uh like submissions like your popular requests and stuff or so like  
**Leon Damrau:** what do you mean? Sorry.  
**Daniel Chandy:** uh like over here let's say you have already reacted hollow night with like two hearts right but uh okay no this will be simple These are dissolvement reactions.  
   
 

### 00:07:30

   
**Leon Damrau:** Yeah, these are just the emotes. Exactly.  
**Daniel Chandy:** Okay.  
**Leon Damrau:** It's like just from anyone who really like are interested was interested in voting.  
**Daniel Chandy:** Mhm.  
**Leon Damrau:** Um I have I have also which is important.  
**Daniel Chandy:** Okay.  
**Leon Damrau:** Let me check. Uh I need to find this right now. One second. It's um obviously the the votes I I track them in a Google sheet. Here it is. I track them in a Google sheet. Um, and I also need a way to easily reset the votes. Like for example, right like right now because these stats are all just testing, right? Um and you can see like you have kind of isish clear um statistics like friends voted for these games and then here the total votes and and so on and then the pay some okay here's the bot but yeah that's just um general testing um but I need a way to reset the bot easily. So because right now I have no way for me to reset all these information.  
   
 

### 00:08:39

   
**Leon Damrau:** Um because I need to uh I need to have a clean sheet when I go proper life with that. Right.  
**Daniel Chandy:** H.  
**Leon Damrau:** Uh right now there's no I don't have that. Um same with the sheet. I need either create a new sheet based on on on on this or like delete this and then you know just use this again. Um and potentially I don't know if that's something you can do as well. um give me a little bit cleaner data export because I I mean um this kind of works but I feel like it could be cleaner I don't know with more statistics because obviously I need clean data to go to the developer right I need to go to the developer and say like okay this is how it looks like but if I show him like this table or something for his game um it's not very clean um but the problem is Um um like maybe I don't know if it's al something possible because that might need an app script or something where as soon as like a game reaches 100 votes because like below 100 votes I probably wouldn't even go to a developer.  
   
 

### 00:09:45

   
**Leon Damrau:** Let's say it reach 100 votes and then it automatically creates a new tab and in this new  
**Daniel Chandy:** Mhm.  
**Leon Damrau:** tab um it gives me proper like more cleaner data for this one.  
**Daniel Chandy:** Do you want it specifically? Do you want it specifically in Google Sheets  
**Leon Damrau:** No,  
**Daniel Chandy:** or Okay.  
**Leon Damrau:** I don't really need like it doesn't matter where as long as I have the data, you know. It's just about having the statistics and have an overview about the statistics.  
**Daniel Chandy:** Yeah.  
**Leon Damrau:** I don't know. It doesn't matter where it is. I just need to export it in a way and then be able to showcase to the developer, you know.  
**Daniel Chandy:** Yeah. Makes sense. Okay.  
**Leon Damrau:** Great. Um,  
**Daniel Chandy:** Um Okay.  
**Leon Damrau:** let me Yeah, sorry. You have any questions so far?  
**Daniel Chandy:** No, no, no. You can continue.  
**Leon Damrau:** Okay. Um, another problem. Uh, actually, yeah, I think that's mostly it really. I'm thinking if there's anything missing.  
   
 

### 00:10:39

   
**Leon Damrau:** Um, no, I think the rest is already functional. Like again, the bot I think is already like 95% done. It's really just these last 5%. It needs a clean up and the proper check whether everything works uh logically and so on. And I obviously change the logic that I don't need these many channels anymore. Like I really just want game requests, new submissions, and then be able to filter it and and that's that. And then properly extract the data and reduce the amount of how many votes like how many steps you have to take because again right now it's two steps, but I would like to have it just as one.  
**Daniel Chandy:** Yeah.  
**Leon Damrau:** Yeah.  
**Daniel Chandy:** Okay. Um, but I'll take a look into this also. Uh, do you have like the project for select the bot set up anywhere? Like where is the bot running exactly?  
**Leon Damrau:** I have this file of the game board which has all this stuff. That's all I got from the previous developer.  
   
 

### 00:11:37

   
**Daniel Chandy:** Okay.  
**Leon Damrau:** I guess that's enough. And then I use um I have render I think it's called.  
**Daniel Chandy:** Yeah. Yeah.  
**Leon Damrau:** Let me check. render.com I think is one second. Where is it? Um, give me a moment. Nope. Um h yeah this this this website called render um I can't show you right now but like this is the website I use where the bot is basically running right  
**Daniel Chandy:** Yeah. Yeah.  
**Leon Damrau:** now um I didn't use it like I just bought  
**Daniel Chandy:** Okay.  
**Leon Damrau:** the subscription and then the developer did everything else I can give you the details to for the account and then you can just send it if it's needed.  
**Daniel Chandy:** Sure.  
**Leon Damrau:** I mean the bot is already running so I don't know but  
**Daniel Chandy:** Okay. Yeah. Yeah.  
**Leon Damrau:** yeah  
**Daniel Chandy:** I think uh render is just for like running the port on a server so that it you can like have it running 24 bar 7\. That's all.  
   
 

### 00:12:57

   
**Daniel Chandy:** Okay.  
**Leon Damrau:** okay um yeah I mean if  
**Daniel Chandy:** Yeah. I think should be enough to  
**Leon Damrau:** everything is clear if if it's doable I mean if you can check if it's doable just let me  
**Daniel Chandy:** uh Okay. Yeah, sure. Uh just forward the the whatever the that folder was to  
**Leon Damrau:** the Yeah, I will do.  
**Daniel Chandy:** sh and  
**Chabert Braganza:** Thank you.  
**Leon Damrau:** Can I send you on Slack or something? Can we make a new  
**Daniel Chandy:** Yeah. Yeah. I I think I'm there in the kilowatt external slack.  
**Leon Damrau:** Actually,  
**Daniel Chandy:** So you can just make a new channel over there. It's also possible.  
**Leon Damrau:** can we invite you to the Gamer Minds one? Wait, should we do a new one? Uh chot.  
**Chabert Braganza:** Yeah, let's just create a new one and I will uh and then  
**Leon Damrau:** Okay. Okay. Yeah.  
**Chabert Braganza:** you  
**Leon Damrau:** Good.  
**Daniel Chandy:** also would I so for me to test it I would I would need the bot in a server right so I would do I test it on your server or do I test it on another server  
   
 

### 00:13:55

   
**Leon Damrau:** Um I mean I don't know how it would work. Like I mean testing it on another server would obviously be better. Um, but actually no, I think it's fine if you test it on this one.  
**Daniel Chandy:** Or you could just make a private channel  
**Leon Damrau:** I just need to change. Yeah, exactly. I I just The problem is I just need No,  
**Daniel Chandy:** here.  
**Leon Damrau:** I just need to change the permissions of this current channel and that's  
**Daniel Chandy:** Okay,  
**Leon Damrau:** it.  
**Daniel Chandy:** fine. Then I can send my Discord ID. You can add me on the server.  
**Leon Damrau:** Yes, perfect.  
**Chabert Braganza:** Okay. So, uh so I'll send you the I'll we'll create a channel now. You can uh Leon if you can send those files and then uh D you think by tomorrow we can be able to estimate sort of gauge feasibility and timelines and all  
**Daniel Chandy:** Uh,  
**Chabert Braganza:** that.  
**Daniel Chandy:** sure.  
**Chabert Braganza:** Yeah.  
**Daniel Chandy:** I'll give you the estimate of day.  
**Chabert Braganza:** Right.  
   
 

### 00:14:45

   
**Daniel Chandy:** Yeah.  
**Chabert Braganza:** End of day.  
**Daniel Chandy:** Tomorrow.  
**Chabert Braganza:** Okay.  
**Daniel Chandy:** Yeah.  
**Chabert Braganza:** Fine.  
**Daniel Chandy:** Because today I'm busy with other projects. So,  
**Chabert Braganza:** Okay. Okay. Fine. So, let me know because I think you have a timeline on this,  
**Leon Damrau:** Right.  
**Chabert Braganza:** right? Uh Leon,  
**Daniel Chandy:** yep.  
**Leon Damrau:** I mean,  
**Chabert Braganza:** by when do you want this?  
**Leon Damrau:** um I think the latest is really end of this month, beginning Yeah.  
**Chabert Braganza:** Okay,  
**Leon Damrau:** the first week of June.  
**Chabert Braganza:** that's enough time.  
**Daniel Chandy:** Okay.  
**Leon Damrau:** Yeah.  
**Chabert Braganza:** Okay,  
**Daniel Chandy:** Thank  
**Leon Damrau:** First week of June.  
**Chabert Braganza:** fine. So,  
**Leon Damrau:** And that that's the current  
**Chabert Braganza:** I'll come back to you by Sure. Sure. So,  
**Leon Damrau:** deadline.  
**Chabert Braganza:** on this I'll come back to you by tomorrow latest uh with the feasibility and the estimate.  
**Daniel Chandy:** Sure.  
**Chabert Braganza:** Uh and I'll create the channel in any case. We'll go ahead.  
**Leon Damrau:** Okay.  
   
 

### 00:15:25

   
**Chabert Braganza:** Yeah.  
**Leon Damrau:** Red  
**Chabert Braganza:** Yeah. Uh Leon, I need you for a couple of minutes.  
**Leon Damrau:** cool.  
**Chabert Braganza:** Uh Daniel, I think we're done. Um you can if you have to. Yeah.  
**Daniel Chandy:** All right.  
**Chabert Braganza:** Okay. Thanks.  
**Daniel Chandy:** Fine.  
**Chabert Braganza:** Thanks.  
**Daniel Chandy:** Thanks.  
**Chabert Braganza:** Yeah.  
**Leon Damrau:** Thank you.  
**Chabert Braganza:** Thanks. Uh yeah, right. Leon,  
**Leon Damrau:** Bye-bye.  
**Chabert Braganza:** I had a word with my team uh with regards to with regards to the illustrations. Right. So I've sent the new team the uh the design file that um Ramsley has created. But over and above this, I think you would have your own inputs in terms of what your expectations are.  
**Leon Damrau:** I mean my expectations are are basically what the other illustrator like my current  
**Chabert Braganza:** So  
**Leon Damrau:** illustrator did, right? I just want this style obviously um being continuing on on the website,  
**Chabert Braganza:** okay okay okay  
**Leon Damrau:** right? Because it doesn't make sense to have a different style now.  
   
 

### 00:16:12

   
**Leon Damrau:** That's why it needs really to be this style.  
**Chabert Braganza:** so yeah so can you share with me that particular style I'm assuming is the first one or you know if you can share that with me and then I'll I'll see the feasibility on continuity at my end and I'll then I'll come back to again by tomorrow uh on this as well.  
**Leon Damrau:** Um, it's in the game mind channel.  
**Chabert Braganza:** Uh can you eat?  
**Leon Damrau:** You can check it out actually, but I can also email it to you if you want.  
**Chabert Braganza:** Okay. So, it's on the Slack channel you're saying you've already shared it with  
**Leon Damrau:** Yeah. Yeah. Yeah. It's already on the Slack channel. Like one of them.  
**Chabert Braganza:** them.  
**Leon Damrau:** Yeah. But I mean, but one of them basically already showcased the the design.  
**Chabert Braganza:** Okay.  
**Leon Damrau:** Um,  
**Chabert Braganza:** I I I'll have a look if it's already there.  
**Leon Damrau:** right.  
**Chabert Braganza:** I'll just have a look uh and I'll pass it on to the team and then hopefully by tomorrow uh it's either tomorrow  
   
 

### 00:16:54

   
**Leon Damrau:** Mhm.  
**Chabert Braganza:** or Monday I'll come back to you with the timelines because I think you'll need it in what two weeks M tops to finish off everything or one week I'll check I'll check I'll check on  
**Leon Damrau:** Good. Great.  
**Chabert Braganza:** that I'll check that so that is something I wanted to check with you um with regards to the SEO M is working the report but finally we've got you if you type international you're on one but what I've asked is the Google business listings that needs to change from the Pakistan university. There's some Pakistani uh thing on GBL. So do you  
**Leon Damrau:** We're not wait I typed in type of international but I'm not we're not at one.  
**Chabert Braganza:** have  
**Leon Damrau:** I mean the the AI I mean technically we are at one. I'm not ready. Wait, let me showcase what I see. Um,  
**Chabert Braganza:** what do you see?  
**Leon Damrau:** one second.  
**Chabert Braganza:** Oh, it's also region wise,  
**Leon Damrau:** Yeah,  
**Chabert Braganza:** right?  
**Leon Damrau:** that's maybe that's an issue. Um,  
   
 

### 00:17:49

   
**Chabert Braganza:** Yeah. Yeah.  
**Leon Damrau:** let me show I mean technically we are at one, but at the same time we're not one second. Where is it?  
**Chabert Braganza:** No,  
**Leon Damrau:** monitor  
**Chabert Braganza:** I'll I'll tell you how you're you're not because on the GP GMBB the Google business listings it's the Pakist Yeah.  
**Leon Damrau:** like yeah we are here up here basically is one but technically it's here the fisa blah but  
**Chabert Braganza:** The thing on the right  
**Leon Damrau:** the one that Thomas says always says is in his dreams that's the one that is on top still but um  
**Chabert Braganza:** one let me just show you what I get. Um yeah,  
**Leon Damrau:** AI is telling me it's us and up here it's also us you know but  
**Chabert Braganza:** it's al  
**Leon Damrau:** like Yeah,  
**Chabert Braganza:** Yeah, but uh uh yeah, it's  
**Leon Damrau:** but it it's also one thing um because like from we  
**Chabert Braganza:** also  
**Leon Damrau:** still need to um certify us uh on Google on Google business like we need to certify the business on Google, right?  
**Chabert Braganza:** exactly Yeah.  
   
 

### 00:18:41

   
**Leon Damrau:** Because like obviously this is something that needs to be and we did this so many times like we did um because like for for Google business you need to make a video um a video of you know um the the office basically the place where the company is and we did this like Thomas did this video like 20 times and it always doesn't Google always says  
**Chabert Braganza:** Okay. No,  
**Leon Damrau:** no.  
**Chabert Braganza:** I what I've done is can you see my screen?  
**Leon Damrau:** Yes. Yes.  
**Chabert Braganza:** Yeah. So, basically this is what I get, right? So, this is uh for me there's an AI part in the beginning and then I have you here and then PZA  
**Leon Damrau:** Yeah.  
**Chabert Braganza:** University at number two. But again, it's region specific. I've asked the team to check what do we need to change this in the sense uh you're right we might need some  
**Leon Damrau:** Yeah.  
**Chabert Braganza:** pictures uh we'll have to create a Google business listings page so you're saying you've already created  
   
 

### 00:19:30

   
**Leon Damrau:** Yeah. We have it's it's there. It's just it doesn't showcase because we are not verified. And that's the thing.  
**Chabert Braganza:** This  
**Leon Damrau:** Um this something that Thomas needs to do. Uh we already talked to the Google support. Um and Google support is like they send us a link where we need to like have a live video chat with them. Uh Thomas didn't get to do this yet because he's not uh at home at his place. So he needs to I think he can do this on like today's Thursday,  
**Chabert Braganza:** okay.  
**Leon Damrau:** right? He can do this tomorrow apparently.  
**Chabert Braganza:** So that'll be good because then you have uh I mean we can work more on the SEO and get you on the listings but the Google business listings makes a huge impact.  
**Leon Damrau:** Yeah. Yeah.  
**Chabert Braganza:** It's nice to move that because there's no reason why a university from Pakistan should be a number one  
**Leon Damrau:** Oh, right.  
**Chabert Braganza:** that in Germany makes no sense.  
**Leon Damrau:** It doesn't make sense  
   
 

### 00:20:17

   
**Chabert Braganza:** Yeah. Yeah. So cool.  
**Leon Damrau:** now.  
**Chabert Braganza:** So we'll do that. Any update on the uh blogs um on that stuff?  
**Leon Damrau:** Um I mean we are still we I made some appointments  
**Chabert Braganza:** Oh.  
**Leon Damrau:** with Thomas uh where we talk about this this is like the content for it right but um yeah we just need a content really like we just need to discuss this but that's something that  
**Chabert Braganza:** Yeah. Awesome.  
**Leon Damrau:** that will be happening  
**Chabert Braganza:** Yeah.  
**Leon Damrau:** soon.  
**Chabert Braganza:** So the blogs and the other one is the case studies uh that we were talking about you know on on some of the success stories of what you've already completed.  
**Leon Damrau:** Yeah.  
**Chabert Braganza:** So somewhere on those lines either ways will will make a difference but yeah whenever you have your meeting that's fine.  
**Leon Damrau:** Yeah.  
**Chabert Braganza:** Um  
**Leon Damrau:** We we already we we also got our first project for Tough International  
**Chabert Braganza:** and  
**Leon Damrau:** actually. Um someone reached out.  
**Chabert Braganza:** Oh,  
**Leon Damrau:** Yeah.  
   
 

### 00:21:05

   
**Chabert Braganza:** nice.  
**Leon Damrau:** Um we going to in in Frankfurt we're going to dive we're going to dive in the river to get like some e scooters and bicycles out of the  
**Chabert Braganza:** Nice.  
**Leon Damrau:** river.  
**Chabert Braganza:** Oh, wow.  
**Leon Damrau:** Yeah. But it's still it's still paid very  
**Chabert Braganza:** That's nice.  
**Leon Damrau:** well.  
**Chabert Braganza:** Yeah. But do you get to keep any of the scooters? You can refurbish and use them.  
**Leon Damrau:** No, no, no, no, no. We just leave them there and then they take it away.  
**Chabert Braganza:** Oh, nice, nice, nice, nice. But it's still a deal is a deal, right? I mean, as long as it pays.  
**Leon Damrau:** Yeah.  
**Chabert Braganza:** I mean,  
**Leon Damrau:** Exactly.  
**Chabert Braganza:** that's great. Oh,  
**Leon Damrau:** Exactly.  
**Chabert Braganza:** nice. So, so that's a good sign. That's a good omen.  
**Leon Damrau:** Yeah,  
**Chabert Braganza:** Uh, that's great.  
**Leon Damrau:** it's a good start.  
**Chabert Braganza:** Yeah. Secondly,  
**Leon Damrau:** That's also like one of the case studies we can use basically this kind of project.  
   
 

### 00:21:46

   
**Chabert Braganza:** uh,  
**Leon Damrau:** And then also a reference  
**Chabert Braganza:** exactly. Sure, sure, sure, sure. Uh just one last thing uh Leon where exactly in Berlin uh you know because I'm I'll  
**Leon Damrau:** potentially  
**Chabert Braganza:** be traveling I think for the first week of June. Um I'm meeting somebody at the main station in Berlin at one of the meets there. But anyways I I don't know a sense of Berlin. What do you have any recommendations of where I should be put up? I don't know.  
**Leon Damrau:** I mean I don't really go outside but so I don't really know like the main stay it depends what you really want to do in Berlin right but I mean  
**Chabert Braganza:** It's going to be just work and yeah and and then I'm off to Austria for one  
**Leon Damrau:** yeah  
**Chabert Braganza:** night basically uh to Vienna basically.  
**Leon Damrau:** okay you already know like when exactly  
**Chabert Braganza:** But it's going to be literally 3 to 4 days. That's about it.  
**Leon Damrau:** when when in June  
**Chabert Braganza:** Uh it should be from the 1st of June and then I move out on the 4th of June.  
   
 

### 00:22:45

   
**Chabert Braganza:** Yeah.  
**Leon Damrau:** of June okay yeah We we can definitely do something then.  
**Chabert Braganza:** Good. Yeah.  
**Leon Damrau:** I mean Berlin is big but actually it's not that big because like um we have good um train system and so on you know and Uber.  
**Chabert Braganza:** Perfect. Perfect. Perfect. Yeah. So, I I think Yeah.  
**Leon Damrau:** Yeah.  
**Chabert Braganza:** So, I think I'll I'll settle in somewhere close to the I don't know, somewhere close to the metro, close to the airport. I think some something on those lines.  
**Leon Damrau:** Close to the airport.  
**Chabert Braganza:** And then Perfect.  
**Leon Damrau:** airport is always good. Like I mean airport is quite airport is out outside of Germany, you know, the main airport. Um but if you go like in the if you go out in the south because like it dep Okay,  
**Chabert Braganza:** What do you mean? Uh,  
**Leon Damrau:** it depends where you land, right? But um the airport the main airport is outside of Berlin.  
**Chabert Braganza:** so that's Brandisburg or something.  
   
 

### 00:23:30

   
**Leon Damrau:** Ber yeah from where that one that one is outside of Berlin.  
**Chabert Braganza:** Yeah.  
**Leon Damrau:** Um but I mean that's that's the normal app.  
**Chabert Braganza:** Oh,  
**Leon Damrau:** That's a That's the normal airport. That's the airport that you need to go anyway.  
**Chabert Braganza:** so Okay. Anyway,  
**Leon Damrau:** But yeah,  
**Chabert Braganza:** so so the public transport is good you're saying, right? So it's not going to be tough  
**Leon Damrau:** yeah. Yeah. No, no, no, no, no.  
**Chabert Braganza:** to  
**Leon Damrau:** You can just go like some place um in in this in the south of Berlin or something like this. Like not too far south, but like south of the middle of Berlin. I think that's the best place.  
**Chabert Braganza:** Okay, cool, cool, cool, cool, cool. I'll figure it out.  
**Leon Damrau:** Yeah.  
**Chabert Braganza:** I'll book something and then I'll let you know and then we can catch up for a drink or coffee or whatever it is.  
**Leon Damrau:** Yeah,  
**Chabert Braganza:** Maybe a drink or something.  
**Leon Damrau:** totally.  
**Chabert Braganza:** Okay,  
   
 

### 00:24:07

   
**Leon Damrau:** Right.  
**Chabert Braganza:** cool. I'll send you the exact dates of of what day u that I'm there and if you're available that'll be great.  
**Leon Damrau:** Yeah,  
**Chabert Braganza:** But what does it look like the first week?  
**Leon Damrau:** of course.  
**Chabert Braganza:** You're available on the first week, right? I mean first, second, third, fourth, any either  
**Leon Damrau:** Well,  
**Chabert Braganza:** one.  
**Leon Damrau:** we'll see. I mean, I I will take I will make some time, but um um yeah,  
**Chabert Braganza:** Okay, cool.  
**Leon Damrau:** don't worry. There will be some time for sure.  
**Chabert Braganza:** Okay, cool. Cool. Sounds good. All right, so that's that.  
**Leon Damrau:** Yeah.  
**Chabert Braganza:** So, south of Berlin is what you recommend. I'll just make notes on that and uh yeah, so I'll come back to you tomorrow with the discord bot.  
**Leon Damrau:** Yeah.  
**Chabert Braganza:** I'll try to do my best to get some on the illustrations as well and the  
**Leon Damrau:** What about Yeah. What? Yeah.  
**Chabert Braganza:** report.  
**Leon Damrau:** Exactly.  
   
 

### 00:24:47

   
**Leon Damrau:** What about the report for Walton? Is those  
**Chabert Braganza:** The the report my deadline personally is tomorrow because we already delayed by a  
**Leon Damrau:** tomorrow?  
**Chabert Braganza:** few days. The thing is uh my co-founder is in the US and he's there for another week. So that's the hold up because he's just reviewing it. um giving his inputs as well and we are tweaking it accordingly. So I hope he gets it completed by today so I can send it to send it to you tomorrow or it'll have to be over the weekend or maximum by Monday or something. But I'll do my best to finish it tomorrow basically.  
**Leon Damrau:** All righty. Perfect. That  
**Chabert Braganza:** Yeah. All right. Great.  
**Leon Damrau:** works.  
**Chabert Braganza:** Um all right, Leon, that'll be it. I think we're almost done with time as well. So any any other updates? I'll let you know. I look forward to those files as well on the discord channel which I'll have it created now.  
**Leon Damrau:** Yeah, perfect. It's all right.  
**Chabert Braganza:** Yeah. All right.  
**Leon Damrau:** Thank you.  
**Chabert Braganza:** Thanks, Leon. Thank you.  
**Leon Damrau:** Bye-bye.  
**Chabert Braganza:** Have a good day. Thanks.  
**Leon Damrau:** You too.  
**Chabert Braganza:** Bye. Bye.  
   
 

### Transcription ended after 00:25:50

*This editable transcript was computer generated and might contain errors. People can also change the text after it was created.*