/*

Title: ScribbleLive Most Recent Posts Script
Description: This script adds the most recent posts in your ScribbleLive event to a web page via the ScribbleLive API. It then checks for updates (new posts, edits, deletes) every 10 seconds and updates the most recent posts accordingly.

*/

function RecentPosts(Options) {

    this.Options = {
        // You can find your API tokens - and generate new ones - under the general API section of your ScribbleLive back end. https://client.scribblelive.com/client/API.aspx
        APIToken: "",
        // You can find your event id under the API section of your event in the ScribbleLive back end. You can also view source on your event and search for "ThreadId".
        EventId: "",
        // The number of posts you would like to display.
        TotalPostsToShow: 10,
        // The id of the element on your page where you would like to display the posts.
        WhereToAddPosts: "",
        // Show images, true or false.
        ShowImages: true,
        // Show videos, true or false.
        ShowVideos: true,
        // Show audio, true or false.
        ShowAudio: true,
        // Show stuck posts, true or false.
        ShowStuckPosts: true,
        //Show avatars, true or false.
        ShowAvatars: true,
        // Show text posts, true or false.
        ShowTextPosts: true,
        // Show polls, true or false.
        ShowPolls: true,
        // Show meta data, true or false.
        ShowMetaData: true,
        // Show media captions, true or false.
        ShowCaptions: true,
        // Show comments, true or false.
        ShowComments: true,
        // Show official (writer, editor, moderator, administrator, guest writer, etc.) posts, true or false.
        ShowOfficialPosts: true,
        // Show Twitter posts, true or false.
        ShowTweets: true,
        // Show mobile posts, true of false.
        ShowMobilePosts: true,
        // Show Facebook posts, true or false.
        ShowFacebookPosts: true,
        // Show only Twitter posts, true or false.
        ShowOnlyTweets: false,
        // Show only Facebook posts, true or false.
        ShowOnlyFacebookPosts: false,
        // Show only polls, true or false.
        ShowOnlyPolls: false,
        // CSS classes
        WidgetClass: 'RecentPostsWidget',
        ItemClass: '',
        ImageClass: '',
        ContentClass: 'Content',
        MetaClass: 'Meta',
        // Translation
        TranslateBy: 'by',
        TranslateOn: 'on',
        TranslateAt: 'at',
        TranslateVia: 'via'
    };

    // Set the option values to the values passed in to the function.
    for (var opt in Options) {
        if (Options.hasOwnProperty(opt)) {
        	this.Options[opt] = Options[opt];
        }
    }

    // Set the last modified time variable.
    this.LastModifiedTime = "";

    // Set an index to keep track of multiple events using this script.
    this.InstanceIndex = RecentPosts.StoreInstance(this);

	// Call the function that creates the element that the posts will be added to.
    this.CreatePostList();

    // Call the function that loads the most recent posts.
    this.GetAllPosts();
    
    (function( w, d, eid ){
          var id = 'sl-libjs', where = d.getElementsByTagName( 'script' )[0];

          if ( d.getElementById( id ) ){ return; }

          w._slq = w._slq || [];
          _slq.push( ['_setEventId', eid] );

          js = d.createElement( 'script' );
          js.id = id;
          js.async = true;
          js.src = 'http://embed.scribblelive.com/modules/lib/addons.js';
          where.parentNode.insertBefore( js, where );
     }( window, document,this.Options.EventId ) ); 
}

// Set the index.
RecentPosts.Index = 0;

// The function that decides which instance of the recent posts object is currently being used.
RecentPosts.GetInstance = function (pIndex) {
    if (RecentPosts.__instances === undefined) {
        return undefined;
    }
    else {
        return RecentPosts.__instances["" + pIndex];
    }
};

// The function that sets the instance of the recent posts object.
RecentPosts.StoreInstance = function (pRecentPostsInstance) {
    if (RecentPosts.__instances === undefined) {
        RecentPosts.__instances = [];
    }
    
    var _Index = RecentPosts.Index;
    RecentPosts.Index++;

    RecentPosts.__instances[_Index] = pRecentPostsInstance;

    return _Index;
};

// The function that decides what to do with the response it gets back from the api.
RecentPosts.prototype.DrawPosts = function (pResponse) {

	var CurrentPostsList = this.GetPostList();

    // Add any new posts.
    if (pResponse.Posts !== undefined) {
        for (var p = 0; p < pResponse.Posts.length; p++) {
            this.AddPost(pResponse.Posts[p], CurrentPostsList);
        }
    }

    // If there are deleted posts, check if they are on the page, and deleted them if they are.
    if (pResponse.Deletes !== undefined) {
        for (var d = 0; d < pResponse.Deletes.length; d++) {
            for (var a = 0; a < CurrentPostsList.length; a++) {
                if (pResponse.Deletes[d].Id === parseInt(CurrentPostsList[a])) {
                    this.DeletePost(pResponse.Deletes[d].Id);
                }
            }
        }
    }

    // If there are edited posts, edit them if they are on the page (compare ids) and haven't already been edited (compare last modified times).
    if (pResponse.Edits !== undefined) {
        for (var e = 0; e < pResponse.Edits.length; e++) {
            for (var b = 0; b < CurrentPostsList.length; b++) {
                var PostLastModified = eval("new " + (pResponse.Edits[e].LastModified.replace(/\//g, "")));
                if (pResponse.Edits[e].Id === parseInt(CurrentPostsList[b]) && PostLastModified > this.LastModifiedTime) {
                    this.EditPost(pResponse.Edits[e]);
                }
            }
        }
    }

    // Count the number of posts currently being displayed.
    CurrentPostsList = this.GetPostList();

    // If the number of posts currently being displayed is larger than the number set in TotalPostsToShow, delete a post from the bottom of the list until only the correct number of posts are showing.
    while (CurrentPostsList.length > this.Options.TotalPostsToShow) {
        var LastPost = document.getElementById("RecentPostsWidget" + this.InstanceIndex).lastChild;
        LastPost.parentNode.removeChild(document.getElementById("RecentPostsWidget" + this.InstanceIndex).lastChild);
        CurrentPostsList = this.GetPostList();
    }

    // Get the time the event was last modified and format that time so it can be passed back to the ScribbleLive API.
    this.LastModifiedTime = eval("new " + (pResponse.LastModified.replace(/\//g, "")));
    
    // Make the call to the API for updates.
    var Wait = setTimeout("RecentPosts.GetInstance(" + this.InstanceIndex + ").GetNewPosts()", 31000);

};

// The function that adds a post.
RecentPosts.prototype.AddPost = function (pPost, pPostList) {
    
    // A huge if statement that decides if it should be showing a post or not based on the options set when the widget is loaded.
    if (
        (pPost.Type === "IMAGE" && !this.Options.ShowImages) ||
        (pPost.Type === "VIDEO" && !this.Options.ShowVideos) ||
        (pPost.Type === "AUDIO" && !this.Options.ShowAudio) ||
        (pPost.IsStuck === 1 && !this.Options.ShowStuckPosts) ||
        (pPost.Type === "TEXT" && !this.Options.ShowTextPosts) ||
        (pPost.Type === "POLL" && !this.Options.ShowPolls) ||
        (pPost.IsComment === 1 && !this.Options.ShowComments) ||
        (pPost.IsComment === 0 && !this.Options.ShowOfficialPosts) ||
        (pPost.Source.match("twitter") && !this.Options.ShowTweets) ||
        (!pPost.Source.match("twitter") && this.Options.ShowOnlyTweets) ||
        ((pPost.Source.match("mobile") || pPost.Source.match("SMS")) && !this.Options.ShowMobilePosts) ||
        (pPost.Source.match("www.facebook.com") && !this.Options.ShowFacebookPosts) ||
        (!pPost.Source.match("www.facebook.com") && this.Options.ShowOnlyFacebookPosts) ||
        (pPost.Type !== "POLL" && this.Options.ShowOnlyPolls)
    ) {
        return;
    }

    // If the post you are trying to add is already on the page, stop trying to add it.
    for (var c = 0; c < pPostList.length; c++) {
        if (pPost.Id === parseInt(pPostList[c])) {   
            return;
        }
    }

    // Create a new list item with the post id as the id attribute.
    var NewListItem = document.createElement("li");
    NewListItem.id = pPost.Id;
    NewListItem.className = this.Options.ItemClass;

    // If there is an avatar associated with the creator of the post, create an image tag with the avatar url as the src attribute.
    var NewAvatarImage;
    if (pPost.Creator.Avatar !== "" && this.Options.ShowAvatars) {
        NewAvatarImage = document.createElement("img");
        NewAvatarImage.src = pPost.Creator.Avatar;
        NewAvatarImage.className = this.Options.ImageClass;
    }

    // Create a div with a class of Content that contains the post content.
    var NewContentDiv = document.createElement("div");
    NewContentDiv.className = this.Options.ContentClass;

    // Add any image, video, or audio to the post content div.
    if (pPost.Media !== undefined) {
        NewContentDiv.innerHTML = this.AddMedia(pPost);
    }

    // If the post is a poll, display the poll.
    else if (pPost.Type === "POLL") {
        NewContentDiv.appendChild(this.DisplayPoll(pPost.Entities, false));
    }

    // Add the regular content if the post is not media or a poll.
    else {
        NewContentDiv.innerHTML = pPost.Content;
    }

    // Create a div with the class of Meta that contains the creator name, the source, and the date and time of the post.
    var NewMetaDiv = document.createElement("div");
    NewMetaDiv.className = this.Options.MetaClass;
    var PostDate = eval("new " + (pPost.LastModified.replace(/\//g, "")));

    // Set the creator name. If the source is a social network, add a link to the social network account.
    var CreatorName; 
    if (pPost.Source.match("twitter")) {
        CreatorName = "<a href='http://www.twitter.com/" + pPost.Creator.Name + "'>" + pPost.Creator.Name + "</a>";
    } else {
        CreatorName = pPost.Creator.Name;
    }

    var NewMetaDivContent = this.Options.TranslateBy + " " + CreatorName;

    // Add the source of the post if there is one.
    if (pPost.Source !== "") {
        NewMetaDivContent += " " + this.Options.TranslateVia + " " + pPost.Source;
    }

    NewMetaDivContent += " " + this.Options.TranslateOn + " " + PostDate.toLocaleDateString() + " " + this.Options.TranslateAt + " " + PostDate.toLocaleTimeString();

    NewMetaDiv.innerHTML = NewMetaDivContent;

    // If there was an avatar, add the image tag to the list item.
    if (NewAvatarImage !== undefined) {
        NewListItem.appendChild(NewAvatarImage);
    }

    // Add the content div to the list item.
    NewListItem.appendChild(NewContentDiv);

    // Add the meta div to the list item if ShowMetaData is set to true.
    if (this.Options.ShowMetaData) {
        NewListItem.appendChild(NewMetaDiv);
    }

    // If there are no posts already on the page, add the posts in order. If there are posts, add the new post to the top.
    if (pPostList.length === 0) {
        document.getElementById("RecentPostsWidget" + this.InstanceIndex).appendChild(NewListItem);
    } else {
        document.getElementById("RecentPostsWidget" + this.InstanceIndex).insertBefore(NewListItem, document.getElementById("RecentPostsWidget" + this.InstanceIndex).firstChild);
    }
};

// The function that deletes a post.
RecentPosts.prototype.DeletePost = function (pPostId) {
    var PostToDelete = document.getElementById(pPostId);
    PostToDelete.parentNode.removeChild(PostToDelete);
    var CurrentPostsList = this.GetPostList();
    if (CurrentPostsList.length < this.Options.TotalPostsToShow) {
        document.getElementById("RecentPostsWidget" + this.InstanceIndex).innerHTML = "";
        this.GetAllPosts();
    }
};

// The function that edits a post by finding the matching post id and replacing the Content div html.
RecentPosts.prototype.EditPost = function (pPostToEdit) {
    var PostElements = document.getElementById(pPostToEdit.Id).getElementsByTagName("div");
    for (var i = 0; i < PostElements.length; i++) {
        if (PostElements[i].className === "Content") {
            if (pPostToEdit.Media !== undefined) {
                PostElements[i].innerHTML = this.AddMedia(pPostToEdit);
            } else {
                PostElements[i].innerHTML = pPostToEdit.Content;
            }
        }
    }
};

// The function that adds images, video, and audio to posts containing media that are added or edited.
RecentPosts.prototype.AddMedia = function (pPost) {
    var Media = pPost.Media;
	var MediaHtml;
	for (var m = 0; m < Media.length; m++) {
		if (pPost.Type === "IMAGE" && Media[m].Type === "IMAGE") {
			MediaHtml = "<img src='" + Media[m].Url + "'/>";
		}
		if (pPost.Type === "VIDEO" && Media[m].Type === "VIDEO") {
			MediaHtml = "<embed type='application/x-shockwave-flash' src='http://embed.scribblelive.com/js/jwflvplayer/player-licensed.swf?ThreadId=" + this.Options.EventId + "' flashvars='file=" + Media[m].Url + "'>";
		}
		if (pPost.Type === "AUDIO" && Media[m].Type === "AUDIO") {
			MediaHtml = "<embed height='20' width='300' type='application/x-shockwave-flash' src='http://embed.scribblelive.com/js/jwflvplayer/player-licensed.swf?ThreadId=" + this.Options.EventId + "' flashvars='file=" + Media[m].Url + "'>";
		}
	}

    // Add the caption to the media added above.
    var NewContent;
    if ((pPost.Content !== "") && (pPost.Content !== undefined) && (this.Options.ShowCaptions)) {
        var MediaCaption = "<p class='Caption'>" + pPost.Content + "</p>";
        NewContent = MediaHtml + MediaCaption;
    } else {
        NewContent = MediaHtml;
    }

    return NewContent;
};

// The function that displays a poll both before and after voting.
RecentPosts.prototype.DisplayPoll = function (pPostContent, AlreadyVoted) {

    var ThePoll = document.createElement("dl");
    ThePoll.id = "Poll" + pPostContent.Id;

    var TheQuestion = document.createElement("dt");
    TheQuestion.innerHTML = pPostContent.Question;
    ThePoll.appendChild(TheQuestion);

    var PollAnswers = pPostContent.Answers;
    for (var p = 0; p < PollAnswers.length; p++) {
        var PollQuestion = document.createElement("dd");
        PollQuestion.id = "Answer" + PollAnswers[p].Id;
        if (AlreadyVoted === false) {
			PollQuestion.innerHTML = "<a class='Vote' onclick='RecentPosts.GetInstance(" + this.InstanceIndex + ").VoteOnPoll(" + pPostContent.Id + "," + PollAnswers[p].Id + ")'><input type='radio' /></a><span>" + PollAnswers[p].Text + "</span>";
		} else if (AlreadyVoted === true) {
			PollQuestion.innerHTML = PollAnswers[p].Text + " (" + PollAnswers[p].Votes + " votes)";
		}
        ThePoll.appendChild(PollQuestion);
    }

    return ThePoll;
};

// The function that is called when a user votes on a poll.
RecentPosts.prototype.VoteOnPoll = function (pPollId, pAnswerId) {
	// Figure out if the user has already voted by setting a class and checking for that class before submitting the vote.
	var AlreadyVoted = false;
	var ChosenAnswer = document.getElementById("Answer" + pAnswerId);
	for (var v = 0; v < ChosenAnswer.parentNode.childNodes.length; v++) {
		if (ChosenAnswer.parentNode.childNodes[v].className === "Voting") {
			AlreadyVoted = true;	
		}
	}
	if (AlreadyVoted === true) {
		return;
	}
	ChosenAnswer.className = "Voting";
	// Add the api call that submits the vote.
	var VotePollAPICall = document.createElement("script");
    VotePollAPICall.type = "text/javascript";
    VotePollAPICall.src = "http://apiv1.scribblelive.com/poll/" + pPollId + "/vote/" + pAnswerId + "?callback=RecentPosts.GetInstance(" + this.InstanceIndex + ").PollVoteSuccess";
    document.getElementsByTagName("head")[0].appendChild(VotePollAPICall);
};

// The function that gets the response after someone votes on a poll, and updates the poll results.
RecentPosts.prototype.PollVoteSuccess = function (pPollResponse) {
    // Remove the script used to submit the vote to the api.
	var Scripts = document.getElementsByTagName("head")[0].getElementsByTagName("script");
    for (var i = 0; i < Scripts.length; i++) {
        var ScriptSource = Scripts[i].src;
        if (ScriptSource.match("^\http:\/\/apiv1\.scribblelive\.com/poll/" + pPollResponse.Id + ".*") !== null) {
            document.getElementsByTagName("head")[0].removeChild(Scripts[i]);
        }
    }
	// Remove the voting elements and display the results.
	var ThePoll = document.getElementById("Poll" + pPollResponse.Id);
	var PollParent = ThePoll.parentNode;
	PollParent.removeChild(ThePoll);
	PollParent.appendChild(this.DisplayPoll(pPollResponse, true));
};

// Create a list of posts currently on the page by finding all list items inside the RecentPostsWidget list and adding their ids to an array.
RecentPosts.prototype.GetPostList = function () {
    var CurrentPostsList = [];
    var CurrentPosts = document.getElementById("RecentPostsWidget" + this.InstanceIndex).getElementsByTagName("li");
    for (var j = 0; j < CurrentPosts.length; j++) {
        CurrentPostsList.push(CurrentPosts[j].getAttribute("id"));
    }
    return CurrentPostsList;
};

// The recurring API call.
RecentPosts.prototype.GetNewPosts = function (pLastPostTime) {

    // Delete any API calls that are currently on the page.
    var Scripts = document.getElementsByTagName("head")[0].getElementsByTagName("script");
    for (var i = 0; i < Scripts.length; i++) {
        var ScriptSource = Scripts[i].src;
        if (ScriptSource.match("^\http:\/\/apiv1\.scribblelive\.com/event/" + this.Options.EventId + ".*") !== null) {
            document.getElementsByTagName("head")[0].removeChild(Scripts[i]);
        }
    }

    var LastModifiedTimeFormatted = this.LastModifiedTime.getUTCFullYear() + "/" + (this.LastModifiedTime.getUTCMonth() + 1) + "/" + this.LastModifiedTime.getUTCDate() + " " + this.LastModifiedTime.getUTCHours() + ":" + this.LastModifiedTime.getUTCMinutes() + ":" + this.LastModifiedTime.getUTCSeconds();

    // Add the new API call to the head of the page taking into account the event id, API token, and last post time.
    var LoadPostsCall = document.createElement("script");
    LoadPostsCall.type = "text/javascript";
    LoadPostsCall.src = "http://apiv1.scribblelive.com/event/" + this.Options.EventId + "/all/?Token=" + this.Options.APIToken + "&Order=asc&format=json&Since=" + LastModifiedTimeFormatted + "&callback=RecentPosts.GetInstance(" + this.InstanceIndex + ").DrawPosts";
    document.getElementsByTagName("head")[0].appendChild(LoadPostsCall);

};

// Add an empty list to the element specified in the setup at the top of this script.
RecentPosts.prototype.CreatePostList = function () {
    var PostList = document.createElement("ul");
    PostList.setAttribute("id", "RecentPostsWidget" + this.InstanceIndex);
    PostList.className = this.Options.WidgetClass;
    document.getElementById(this.Options.WhereToAddPosts).appendChild(PostList);
};

// The initial API call that gets all of the most recent posts and feeds them back into this script.
RecentPosts.prototype.GetAllPosts = function () {
    var LoadPostsCall = document.createElement("script");
    LoadPostsCall.type = "text/javascript";
    LoadPostsCall.src = "http://apiv1.scribblelive.com/event/" + this.Options.EventId + "/page/last/?Token=" + this.Options.APIToken + "&Max=" + this.Options.TotalPostsToShow + "&Order=asc&format=json&callback=RecentPosts.GetInstance(" + this.InstanceIndex + ").DrawPosts";
    document.getElementsByTagName("head")[0].appendChild(LoadPostsCall);
};
